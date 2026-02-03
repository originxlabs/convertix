use crate::services::job_queue::{JobPayload, JobStatus};
use crate::state::app_state::AppState;
use tauri::State;

#[tauri::command]
pub async fn enqueue_job(state: State<'_, AppState>, payload: JobPayload) -> Result<String, String> {
    state.job_queue.enqueue(payload).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_job_status(state: State<'_, AppState>, job_id: String) -> Result<JobStatus, String> {
    state.job_queue.get_status(&job_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cancel_job(state: State<'_, AppState>, job_id: String) -> Result<(), String> {
    state.job_queue.cancel(&job_id).await.map_err(|e| e.to_string())
}
