use crate::pdf_engine::errors::{PdfEngineError, PdfEngineResult};
use crate::pdf_engine::models::job::{JobProgress, JobState, PdfJob};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};

#[derive(Debug)]
pub struct JobMessage {
    pub job_id: String,
}

#[derive(Clone)]
pub struct JobStore {
    jobs: Arc<Mutex<HashMap<String, PdfJob>>>,
    storage_path: PathBuf,
}

impl JobStore {
    pub fn new(storage_path: PathBuf) -> Self {
        Self {
            jobs: Arc::new(Mutex::new(HashMap::new())),
            storage_path,
        }
    }

    pub async fn insert(&self, job: PdfJob) -> PdfEngineResult<()> {
        self.jobs.lock().await.insert(job.id.clone(), job);
        self.persist().await
    }

    pub async fn get(&self, id: &str) -> PdfEngineResult<PdfJob> {
        self.jobs
            .lock()
            .await
            .get(id)
            .cloned()
            .ok_or(PdfEngineError::JobNotFound)
    }

    pub async fn update(&self, job: PdfJob) -> PdfEngineResult<()> {
        self.jobs.lock().await.insert(job.id.clone(), job);
        self.persist().await
    }

    pub async fn list(&self) -> HashMap<String, PdfJob> {
        self.jobs.lock().await.clone()
    }

    pub async fn persist(&self) -> PdfEngineResult<()> {
        let data = serde_json::to_string_pretty(&*self.jobs.lock().await)?;
        if let Some(parent) = self.storage_path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&self.storage_path, data)?;
        Ok(())
    }

    pub async fn load(&self) -> PdfEngineResult<()> {
        if !self.storage_path.exists() {
            return Ok(());
        }
        let data = fs::read_to_string(&self.storage_path)?;
        let map: HashMap<String, PdfJob> = serde_json::from_str(&data)?;
        *self.jobs.lock().await = map;
        Ok(())
    }
}

#[derive(Clone)]
pub struct JobDispatcher {
    pub sender: mpsc::Sender<JobMessage>,
}

impl JobDispatcher {
    pub fn new(sender: mpsc::Sender<JobMessage>) -> Self {
        Self { sender }
    }

    pub async fn enqueue(&self, job_id: &str) -> PdfEngineResult<()> {
        self.sender
            .send(JobMessage {
                job_id: job_id.to_string(),
            })
            .await
            .map_err(|_| PdfEngineError::ToolFailed("dispatcher offline".into()))
    }
}

pub fn mark_running(mut job: PdfJob, now_ms: u64) -> PdfJob {
    job.state = JobState::Running;
    job.progress = JobProgress {
        percent: 5,
        stage: "running".to_string(),
    };
    job.updated_at = now_ms;
    job
}

pub fn mark_completed(mut job: PdfJob, now_ms: u64) -> PdfJob {
    job.state = JobState::Completed;
    job.progress = JobProgress {
        percent: 100,
        stage: "completed".to_string(),
    };
    job.updated_at = now_ms;
    job
}

pub fn mark_failed(mut job: PdfJob, now_ms: u64, error: &str) -> PdfJob {
    job.state = JobState::Failed;
    job.progress = JobProgress {
        percent: job.progress.percent,
        stage: "failed".to_string(),
    };
    job.updated_at = now_ms;
    job.error = Some(error.to_string());
    job
}

pub fn mark_canceled(mut job: PdfJob, now_ms: u64) -> PdfJob {
    job.state = JobState::Canceled;
    job.progress = JobProgress {
        percent: 0,
        stage: "canceled".to_string(),
    };
    job.updated_at = now_ms;
    job
}
