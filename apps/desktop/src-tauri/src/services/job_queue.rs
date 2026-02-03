use crate::services::cache;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use thiserror::Error;
use tokio::sync::{mpsc, Mutex};
use tokio::time::{sleep, Duration};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobPayload {
    pub kind: String,
    pub input_path: Option<String>,
    pub output_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobStatus {
    pub id: String,
    pub kind: String,
    pub progress: u8,
    pub state: String,
}

#[derive(Error, Debug)]
pub enum JobError {
    #[error("job not found")]
    NotFound,
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

struct JobMessage {
    id: String,
}

#[derive(Clone)]
pub struct JobQueue {
    sender: mpsc::Sender<JobMessage>,
    statuses: Arc<Mutex<HashMap<String, JobStatus>>>,
    storage_path: PathBuf,
}

impl JobQueue {
    pub fn new() -> Self {
        let (sender, mut receiver) = mpsc::channel::<JobMessage>(100);
        let statuses = Arc::new(Mutex::new(HashMap::<String, JobStatus>::new()));
        let storage_path = cache::cache_dir().unwrap_or_else(|_| PathBuf::from("./"))
            .join("jobs.json");

        let statuses_clone = Arc::clone(&statuses);
        let storage_clone = storage_path.clone();

        tokio::spawn(async move {
            while let Some(message) = receiver.recv().await {
                if let Some(_job) = statuses_clone.lock().await.get_mut(&message.id).cloned() {
                    // Simulated work loop. Replace with real PDF/Image pipelines.
                    for step in 1..=10 {
                        sleep(Duration::from_millis(200)).await;
                        if let Some(current) = statuses_clone.lock().await.get_mut(&message.id) {
                            if current.state == "canceled" {
                                break;
                            }
                            current.progress = (step * 10) as u8;
                            current.state = if step == 10 { "completed".into() } else { "running".into() };
                        }
                    }
                }
                let _ = persist_statuses(&statuses_clone, &storage_clone).await;
            }
        });

        let queue = Self {
            sender,
            statuses,
            storage_path,
        };

        let _ = queue.load_from_disk();
        queue
    }

    pub async fn enqueue(&self, payload: JobPayload) -> Result<String, JobError> {
        let id = Uuid::new_v4().to_string();
        let job = JobStatus {
            id: id.clone(),
            kind: payload.kind,
            progress: 0,
            state: "queued".into(),
        };

        self.statuses.lock().await.insert(id.clone(), job);
        self.sender.send(JobMessage { id: id.clone() }).await.ok();
        persist_statuses(&self.statuses, &self.storage_path).await?;
        Ok(id)
    }

    pub async fn get_status(&self, id: &str) -> Result<JobStatus, JobError> {
        self.statuses
            .lock()
            .await
            .get(id)
            .cloned()
            .ok_or(JobError::NotFound)
    }

    pub async fn cancel(&self, id: &str) -> Result<(), JobError> {
        let mut statuses = self.statuses.lock().await;
        if let Some(job) = statuses.get_mut(id) {
            job.state = "canceled".into();
            job.progress = 0;
            persist_statuses(&self.statuses, &self.storage_path).await?;
            return Ok(());
        }
        Err(JobError::NotFound)
    }

    fn load_from_disk(&self) -> Result<(), JobError> {
        if !self.storage_path.exists() {
            return Ok(());
        }
        let data = fs::read_to_string(&self.storage_path)?;
        let map: HashMap<String, JobStatus> = serde_json::from_str(&data).unwrap_or_default();
        tauri::async_runtime::block_on(async {
            let mut statuses = self.statuses.lock().await;
            *statuses = map;
        });
        Ok(())
    }
}

async fn persist_statuses(
    statuses: &Arc<Mutex<HashMap<String, JobStatus>>>,
    path: &PathBuf
) -> Result<(), JobError> {
    let data = serde_json::to_string_pretty(&*statuses.lock().await).unwrap_or_else(|_| "{}".into());
    fs::write(path, data)?;
    Ok(())
}
