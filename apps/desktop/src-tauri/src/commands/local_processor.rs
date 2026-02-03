use crate::services::local_processor::{self, LocalProcessRequest, LocalProcessResult};

#[tauri::command]
pub async fn process_local_file(request: LocalProcessRequest) -> Result<LocalProcessResult, String> {
    local_processor::process(request).await
}
