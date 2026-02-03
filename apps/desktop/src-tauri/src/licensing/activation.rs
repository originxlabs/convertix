use crate::licensing::errors::{LicensingError, LicensingResult};
use crate::licensing::tier::Tier;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivationRequest {
    pub user_id: String,
    pub activation_key: String,
    pub device_id: String,
    pub plan: Tier,
    pub auth_token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivationResponse {
    pub user_id: String,
    pub tier: Tier,
    pub expires_at_ms: Option<u64>,
    pub org_id: Option<String>,
    pub grace_period_days: u32,
    pub invoice_id: Option<String>,
    pub invoice_email_sent: bool,
}

#[async_trait]
pub trait ActivationClient {
    async fn activate(&self, request: &ActivationRequest) -> LicensingResult<ActivationResponse>;
}

pub struct HttpActivationClient {
    pub api_base: String,
}

#[async_trait]
impl ActivationClient for HttpActivationClient {
    async fn activate(&self, request: &ActivationRequest) -> LicensingResult<ActivationResponse> {
        let url = format!("{}/license/activate", self.api_base.trim_end_matches('/'));
        let client = reqwest::Client::new();
        let response = client
            .post(url)
            .bearer_auth(&request.auth_token)
            .json(request)
            .send()
            .await
            .map_err(|e| LicensingError::ActivationFailed(e.to_string()))?;

        if !response.status().is_success() {
            let text = response.text().await.unwrap_or_default();
            return Err(LicensingError::ActivationFailed(text));
        }

        response
            .json::<ActivationResponse>()
            .await
            .map_err(|e| LicensingError::ActivationFailed(e.to_string()))
    }
}
