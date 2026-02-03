use crate::pdf_engine::adapters::{ghostscript::GhostscriptAdapter, pdfcpu::PdfCpuAdapter, qpdf::QpdfAdapter, ToolConfig};
use crate::pdf_engine::audit::{ensure_audit_dir, write_audit};
use crate::pdf_engine::config::{load_config, EngineConfig};
use crate::pdf_engine::errors::{PdfEngineError, PdfEngineResult};
use crate::pdf_engine::jobs::{
    mark_canceled, mark_completed, mark_failed, mark_running, JobDispatcher, JobStore,
};
use crate::pdf_engine::models::job::{PdfJob, PdfJobKind};
use crate::pdf_engine::models::result::JobResult;
use crate::pdf_engine::validation::{
    deterministic_output_name, ensure_parent_dir, resolve_engine_paths, validate_user_path,
};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::{mpsc, Mutex};

#[derive(Clone)]
#[allow(dead_code)]
pub struct PdfEngineHandle {
    store: JobStore,
    dispatcher: JobDispatcher,
}

#[derive(Clone)]
pub struct PdfEngine {
    store: JobStore,
    dispatcher: JobDispatcher,
    pdfcpu: PdfCpuAdapter,
    qpdf: QpdfAdapter,
    ghostscript: GhostscriptAdapter,
    config: EngineConfig,
    audit_log: PathBuf,
    canceled: Arc<Mutex<HashMap<String, bool>>>,
}

impl PdfEngine {
    pub fn new() -> PdfEngineResult<(Self, PdfEngineHandle)> {
        let paths = resolve_engine_paths()?;
        ensure_audit_dir(&paths.audit_dir);
        let config = load_config(&paths.data_dir)?;

        let store = JobStore::new(paths.jobs_dir.join("jobs.json"));
        let (sender, receiver) = mpsc::channel(64);
        let dispatcher = JobDispatcher::new(sender);

        let pdfcpu = PdfCpuAdapter {
            config: ToolConfig {
                enabled: config.pdfcpu_enabled,
                executable: PathBuf::from(config.pdfcpu_path.clone().unwrap_or_else(|| "pdfcpu".to_string())),
                timeout_secs: config.tool_timeout_secs,
            },
        };
        let qpdf = QpdfAdapter {
            config: ToolConfig {
                enabled: config.qpdf_enabled,
                executable: PathBuf::from(config.qpdf_path.clone().unwrap_or_else(|| "qpdf".to_string())),
                timeout_secs: config.tool_timeout_secs,
            },
        };
        let ghostscript = GhostscriptAdapter {
            config: ToolConfig {
                enabled: config.ghostscript_enabled,
                executable: PathBuf::from(config.ghostscript_path.clone().unwrap_or_else(|| "gs".to_string())),
                timeout_secs: config.tool_timeout_secs,
            },
        };

        let engine = Self {
            store: store.clone(),
            dispatcher: dispatcher.clone(),
            pdfcpu,
            qpdf,
            ghostscript,
            config,
            audit_log: paths.audit_dir.join("audit.log"),
            canceled: Arc::new(Mutex::new(HashMap::new())),
        };

        let handle = PdfEngineHandle { store, dispatcher };
        let engine_clone = engine.clone_for_worker();
        engine.spawn_worker(receiver, engine_clone);

        Ok((engine, handle))
    }

    fn clone_for_worker(&self) -> Self {
        Self {
            store: self.store.clone(),
            dispatcher: self.dispatcher.clone(),
            pdfcpu: self.pdfcpu.clone(),
            qpdf: self.qpdf.clone(),
            ghostscript: self.ghostscript.clone(),
            config: self.config.clone(),
            audit_log: self.audit_log.clone(),
            canceled: Arc::clone(&self.canceled),
        }
    }

    fn spawn_worker(&self, mut receiver: mpsc::Receiver<crate::pdf_engine::jobs::JobMessage>, worker: Self) {
        tokio::spawn(async move {
            while let Some(message) = receiver.recv().await {
                let _ = worker.execute_job(&message.job_id).await;
            }
        });
    }

    pub async fn load_and_resume(&self) -> PdfEngineResult<()> {
        self.store.load().await?;
        let jobs = self.store.list().await;
        for (id, job) in jobs {
            if matches!(job.state, crate::pdf_engine::models::job::JobState::Queued | crate::pdf_engine::models::job::JobState::Running) {
                let _ = self.dispatcher.enqueue(&id).await;
            }
        }
        Ok(())
    }

    pub async fn enqueue(&self, kind: PdfJobKind) -> PdfEngineResult<String> {
        let now = now_ms();
        let job = PdfJob::new(kind, now);
        let job_id = job.id.clone();
        self.store.insert(job).await?;
        self.dispatcher.enqueue(&job_id).await?;
        Ok(job_id)
    }

    #[allow(dead_code)]
    pub async fn get_status(&self, job_id: &str) -> PdfEngineResult<PdfJob> {
        self.store.get(job_id).await
    }

    #[allow(dead_code)]
    pub async fn cancel(&self, job_id: &str) -> PdfEngineResult<()> {
        let mut flags = self.canceled.lock().await;
        flags.insert(job_id.to_string(), true);
        let job = self.store.get(job_id).await?;
        let updated = mark_canceled(job, now_ms());
        write_audit(&self.audit_log, &updated, Some("job canceled"));
        self.store.update(updated).await
    }

    async fn execute_job(&self, job_id: &str) -> PdfEngineResult<JobResult> {
        let job = self.store.get(job_id).await?;
        let running = mark_running(job, now_ms());
        write_audit(&self.audit_log, &running, Some("job started"));
        self.store.update(running.clone()).await?;

        if self.is_canceled(job_id).await {
            return Err(PdfEngineError::JobCanceled);
        }

        let result = self.run_job(&running).await;

        match result {
            Ok(result) => {
                let completed = mark_completed(running, now_ms());
                write_audit(&self.audit_log, &completed, Some("job completed"));
                self.store.update(completed).await?;
                Ok(result)
            }
            Err(err) => {
                let failed = mark_failed(running, now_ms(), &err.to_string());
                write_audit(&self.audit_log, &failed, Some("job failed"));
                self.store.update(failed).await?;
                Err(err)
            }
        }
    }

    async fn run_job(&self, job: &PdfJob) -> PdfEngineResult<JobResult> {
        match &job.kind {
            PdfJobKind::Merge { inputs, output } => {
                let inputs = inputs.iter().map(|p| validate_user_path(p)).collect::<PdfEngineResult<Vec<_>>>()?;
                let output = validate_user_path(output)?;
                ensure_parent_dir(&output)?;
                let input_strings = inputs.iter().map(|p| p.to_string_lossy().to_string()).collect::<Vec<_>>();
                self.pdfcpu.merge(output.to_string_lossy().as_ref(), &input_strings).await?;
                verify_output(&output)?;
                Ok(JobResult {
                    job_id: job.id.clone(),
                    output_path: Some(output.to_string_lossy().to_string()),
                    metadata: None,
                })
            }
            PdfJobKind::Split { input, output_dir, mode, span, pages } => {
                let input = validate_user_path(input)?;
                let output_dir = validate_user_path(output_dir)?;
                std::fs::create_dir_all(&output_dir)?;
                match mode.as_str() {
                    "span" => {
                        let span = span.unwrap_or(1);
                        self.pdfcpu.split_span(
                            input.to_string_lossy().as_ref(),
                            output_dir.to_string_lossy().as_ref(),
                            span,
                        ).await?;
                    }
                    "page" => {
                        let pages = pages.clone().unwrap_or_default();
                        self.pdfcpu.split_pages(
                            input.to_string_lossy().as_ref(),
                            output_dir.to_string_lossy().as_ref(),
                            &pages,
                        ).await?;
                    }
                    _ => return Err(PdfEngineError::InvalidInput("invalid split mode".into())),
                }
                Ok(JobResult {
                    job_id: job.id.clone(),
                    output_path: Some(output_dir.to_string_lossy().to_string()),
                    metadata: None,
                })
            }
            PdfJobKind::Rotate { input, output, page_range, degrees } => {
                let input = validate_user_path(input)?;
                let output = validate_user_path(output)?;
                ensure_parent_dir(&output)?;
                self.pdfcpu.rotate(
                    input.to_string_lossy().as_ref(),
                    output.to_string_lossy().as_ref(),
                    *degrees,
                    page_range.as_deref(),
                ).await?;
                verify_output(&output)?;
                Ok(JobResult {
                    job_id: job.id.clone(),
                    output_path: Some(output.to_string_lossy().to_string()),
                    metadata: None,
                })
            }
            PdfJobKind::Compress { input, output, preset } => {
                let input = validate_user_path(input)?;
                let output = validate_user_path(output)?;
                ensure_parent_dir(&output)?;
                let preset = preset.clone().unwrap_or_else(|| self.config.default_compression_preset.clone());
                self.ghostscript.compress(
                    input.to_string_lossy().as_ref(),
                    output.to_string_lossy().as_ref(),
                    &preset,
                ).await?;
                verify_output(&output)?;
                Ok(JobResult {
                    job_id: job.id.clone(),
                    output_path: Some(output.to_string_lossy().to_string()),
                    metadata: None,
                })
            }
            PdfJobKind::Reorder { input, output, page_order } => {
                let input = validate_user_path(input)?;
                let output = validate_user_path(output)?;
                ensure_parent_dir(&output)?;
                let pages = page_order.iter().map(|p| p.to_string()).collect::<Vec<_>>().join(",");
                self.qpdf.reorder(
                    input.to_string_lossy().as_ref(),
                    output.to_string_lossy().as_ref(),
                    &pages,
                ).await?;
                verify_output(&output)?;
                Ok(JobResult {
                    job_id: job.id.clone(),
                    output_path: Some(output.to_string_lossy().to_string()),
                    metadata: None,
                })
            }
            PdfJobKind::Extract { input, output, pages } => {
                let input = validate_user_path(input)?;
                let output = validate_user_path(output)?;
                ensure_parent_dir(&output)?;
                self.pdfcpu.extract(
                    input.to_string_lossy().as_ref(),
                    output.to_string_lossy().as_ref(),
                    pages,
                ).await?;
                verify_output(&output)?;
                Ok(JobResult {
                    job_id: job.id.clone(),
                    output_path: Some(output.to_string_lossy().to_string()),
                    metadata: None,
                })
            }
            PdfJobKind::Encrypt { input, output, user_password, owner_password } => {
                let input = validate_user_path(input)?;
                let output = validate_user_path(output)?;
                ensure_parent_dir(&output)?;
                self.pdfcpu.encrypt(
                    input.to_string_lossy().as_ref(),
                    output.to_string_lossy().as_ref(),
                    owner_password,
                    user_password.as_deref(),
                ).await?;
                verify_output(&output)?;
                Ok(JobResult {
                    job_id: job.id.clone(),
                    output_path: Some(output.to_string_lossy().to_string()),
                    metadata: None,
                })
            }
            PdfJobKind::Decrypt { input, output, password } => {
                let input = validate_user_path(input)?;
                let output = validate_user_path(output)?;
                ensure_parent_dir(&output)?;
                self.pdfcpu.decrypt(
                    input.to_string_lossy().as_ref(),
                    output.to_string_lossy().as_ref(),
                    password,
                ).await?;
                verify_output(&output)?;
                Ok(JobResult {
                    job_id: job.id.clone(),
                    output_path: Some(output.to_string_lossy().to_string()),
                    metadata: None,
                })
            }
            PdfJobKind::GetMetadata { input } => {
                let input = validate_user_path(input)?;
                let suffix = deterministic_output_name(&input, "metadata.json")?;
                let output_path = resolve_engine_paths()?.output_dir.join(suffix);
                ensure_parent_dir(&output_path)?;
                self.pdfcpu.get_metadata(
                    input.to_string_lossy().as_ref(),
                    output_path.to_string_lossy().as_ref(),
                ).await?;
                let metadata = std::fs::read_to_string(&output_path).unwrap_or_else(|_| "{}".into());
                let json = serde_json::from_str(&metadata).unwrap_or(serde_json::Value::Object(Default::default()));
                Ok(JobResult {
                    job_id: job.id.clone(),
                    output_path: Some(output_path.to_string_lossy().to_string()),
                    metadata: Some(json),
                })
            }
            PdfJobKind::SetMetadata { input, output, title, author, subject, keywords } => {
                let input = validate_user_path(input)?;
                let output = validate_user_path(output)?;
                ensure_parent_dir(&output)?;
                let mut entries = Vec::new();
                if let Some(title) = title {
                    entries.push(format!("-title={}", title));
                }
                if let Some(author) = author {
                    entries.push(format!("-author={}", author));
                }
                if let Some(subject) = subject {
                    entries.push(format!("-subject={}", subject));
                }
                if let Some(keywords) = keywords {
                    entries.push(format!("-keywords={}", keywords));
                }
                self.pdfcpu.set_metadata(
                    input.to_string_lossy().as_ref(),
                    output.to_string_lossy().as_ref(),
                    &entries,
                ).await?;
                verify_output(&output)?;
                Ok(JobResult {
                    job_id: job.id.clone(),
                    output_path: Some(output.to_string_lossy().to_string()),
                    metadata: None,
                })
            }
            PdfJobKind::Watermark | PdfJobKind::Redact | PdfJobKind::Sign | PdfJobKind::Ocr => {
                Err(PdfEngineError::Unsupported("phase 2".into()))
            }
        }
    }

    async fn is_canceled(&self, job_id: &str) -> bool {
        let flags = self.canceled.lock().await;
        flags.get(job_id).copied().unwrap_or(false)
    }
}

impl PdfEngineHandle {
    pub async fn get_status(&self, job_id: &str) -> PdfEngineResult<PdfJob> {
        self.store.get(job_id).await
    }

    #[allow(dead_code)]
    pub async fn cancel(&self, job_id: &str) -> PdfEngineResult<()> {
        let job = self.store.get(job_id).await?;
        let updated = crate::pdf_engine::jobs::mark_canceled(job, now_ms());
        self.store.update(updated).await
    }
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn verify_output(path: &PathBuf) -> PdfEngineResult<()> {
    let metadata = std::fs::metadata(path)?;
    if metadata.len() == 0 {
        return Err(PdfEngineError::ToolFailed("output empty".into()));
    }
    Ok(())
}
