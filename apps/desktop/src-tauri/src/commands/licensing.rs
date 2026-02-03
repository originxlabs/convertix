use crate::licensing::activation::ActivationRequest;
use crate::licensing::license::LicensingService;
use crate::licensing::tier::Tier;
use tauri::State;

#[tauri::command]
pub async fn get_tier(state: State<'_, LicensingService>) -> Result<String, String> {
    state.get_tier().await.map(|t| t.as_str().to_string()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn activate_license(
    state: State<'_, LicensingService>,
    user_id: String,
    activation_key: String,
    device_id: String,
    plan: String,
    auth_token: String,
) -> Result<String, String> {
    let tier = match plan.as_str() {
        "free" => Tier::Free,
        "pro" => Tier::Pro,
        "premium" => Tier::Premium,
        _ => return Err("invalid plan".to_string()),
    };

    let response = state
        .activate(ActivationRequest {
            user_id,
            activation_key,
            device_id,
            plan: tier,
            auth_token,
        })
        .await
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&response).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_usage(state: State<'_, LicensingService>) -> Result<String, String> {
    let usage = state.get_usage().await.map_err(|e| e.to_string())?;
    serde_json::to_string(&usage).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn consume_credits(state: State<'_, LicensingService>, amount: i64) -> Result<i64, String> {
    state.consume_credits(amount).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn sync_usage(state: State<'_, LicensingService>, user_id: String, auth_token: String) -> Result<(), String> {
    state.sync_usage(&user_id, &auth_token).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn sync_credits(state: State<'_, LicensingService>, user_id: String, auth_token: String) -> Result<(), String> {
    state.sync_credits(&user_id, &auth_token).await.map_err(|e| e.to_string())
}
