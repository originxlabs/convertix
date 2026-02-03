use crate::services::job_queue::JobQueue;

pub struct AppState {
    pub job_queue: JobQueue,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            job_queue: JobQueue::new(),
        }
    }
}
