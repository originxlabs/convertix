use crate::services::network;

#[tauri::command]
pub async fn get_offline_status() -> bool {
    !network::is_online().await
}
