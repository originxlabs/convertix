use crate::licensing::activation::ActivationClient;
use crate::licensing::credits::CreditWallet;
use crate::licensing::errors::{LicensingError, LicensingResult};
use crate::licensing::usage::UsageStore;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone)]
pub struct SyncEngine {
    pub activation_client: Arc<dyn ActivationClient + Send + Sync>,
    pub api_base: String,
}

impl SyncEngine {
    pub fn new(client: Arc<dyn ActivationClient + Send + Sync>, api_base: String) -> Self {
        Self { activation_client: client, api_base }
    }

    pub async fn sync_usage(&self, usage: &mut UsageStore, user_id: &str, auth_token: &str) -> LicensingResult<()> {
        let client = reqwest::Client::new();
        let month_keys = usage.buckets.keys().cloned().collect::<Vec<_>>();
        for month_key in month_keys {
            let bucket = match usage.buckets.get(&month_key) {
                Some(bucket) => bucket,
                None => continue,
            };
            for (feature, amount) in &bucket.counts {
                let payload = serde_json::json!({
                    "userId": user_id,
                    "feature": feature,
                    "amount": amount,
                    "monthKey": month_key
                });
                let url = format!("{}/api/billing/usage", self.api_base.trim_end_matches('/'));
                let res = client
                    .post(url)
                    .bearer_auth(auth_token)
                    .json(&payload)
                    .send()
                    .await
                    .map_err(|_e| LicensingError::SyncUnavailable)?;
                if !res.status().is_success() {
                    return Err(LicensingError::SyncUnavailable);
                }
            }
        }
        usage.last_sync_ms = Some(now_ms());
        Ok(())
    }

    pub async fn sync_credits(&self, wallet: &mut CreditWallet, user_id: &str, auth_token: &str) -> LicensingResult<()> {
        if wallet.pending_delta == 0 {
            wallet.last_sync_ms = Some(now_ms());
            return Ok(());
        }
        let client = reqwest::Client::new();
        let url = format!("{}/api/billing/credits/consume", self.api_base.trim_end_matches('/'));
        let payload = serde_json::json!({
            "userId": user_id,
            "amount": wallet.pending_delta.abs(),
            "reason": "sync"
        });
        let res = client
            .post(url)
            .bearer_auth(auth_token)
            .json(&payload)
            .send()
            .await
            .map_err(|_| LicensingError::SyncUnavailable)?;
        if !res.status().is_success() {
            return Err(LicensingError::SyncUnavailable);
        }
        wallet.last_sync_ms = Some(now_ms());
        wallet.pending_delta = 0;
        Ok(())
    }
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}
