use crate::services::cache;

#[tauri::command]
pub async fn get_cache_info() -> Result<cache::CacheInfo, String> {
    cache::get_cache_info().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_cache() -> Result<(), String> {
    cache::clear_cache().await.map_err(|e| e.to_string())
}
