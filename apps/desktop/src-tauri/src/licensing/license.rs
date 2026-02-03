use crate::licensing::activation::{ActivationClient, ActivationRequest, ActivationResponse};
use crate::licensing::credits::CreditWallet;
use crate::licensing::errors::{LicensingError, LicensingResult};
use crate::licensing::feature_gates::{FeatureGate, GateConfig};
use crate::licensing::security::{decrypt_payload, encrypt_payload, hash_activation_key, load_or_create_master_key};
use crate::licensing::tier::Tier;
use crate::licensing::usage::UsageStore;
use crate::licensing::sync::SyncEngine;
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::Mutex;
use chrono::Datelike;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseState {
    pub user_id: String,
    pub tier: Tier,
    pub activation_hash: String,
    pub activated_at_ms: u64,
    pub last_validated_ms: u64,
    pub expires_at_ms: Option<u64>,
    pub org_id: Option<String>,
    pub grace_period_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct OfflineStatus {
    pub is_offline: bool,
    pub grace_expired: bool,
}

#[derive(Clone)]
pub struct LicensingService {
    inner: Arc<Mutex<LicensingInner>>,
}

struct LicensingInner {
    license_path: PathBuf,
    usage_path: PathBuf,
    credits_path: PathBuf,
    #[allow(dead_code)]
    gates_path: PathBuf,
    master_key: Vec<u8>,
    license: Option<LicenseState>,
    usage: UsageStore,
    credits: CreditWallet,
    gates: HashMap<String, FeatureGate>,
    sync: SyncEngine,
}

impl LicensingService {
    pub fn new(client: Arc<dyn ActivationClient + Send + Sync>) -> LicensingResult<Self> {
        let dirs = ProjectDirs::from("com", "originx", "convertix")
            .ok_or_else(|| LicensingError::InvalidInput("missing dirs".into()))?;
        let data_dir = dirs.data_local_dir().to_path_buf();
        let license_path = data_dir.join("licensing").join("license.enc");
        let usage_path = data_dir.join("licensing").join("usage.json");
        let credits_path = data_dir.join("licensing").join("credits.json");
        let gates_path = data_dir.join("licensing").join("gates.json");

        let master_key = load_or_create_master_key(&data_dir)?;
        let license = load_license(&license_path, &master_key).ok();
        let usage = UsageStore::load(&usage_path).unwrap_or_else(|_| UsageStore::new());
        let credits = CreditWallet::load(&credits_path).unwrap_or_else(|_| CreditWallet::new());
        let gates = load_gates(&gates_path).unwrap_or_else(|_| GateConfig::default()).as_map();

        let api_base = std::env::var("CONVERTIX_API_BASE").unwrap_or_else(|_| "http://localhost:5055".to_string());
        let sync = SyncEngine::new(client, api_base);

        Ok(Self {
            inner: Arc::new(Mutex::new(LicensingInner {
                license_path,
                usage_path,
                credits_path,
                gates_path,
                master_key,
                license,
                usage,
                credits,
                gates,
                sync,
            })),
        })
    }

    pub async fn activate(&self, request: ActivationRequest) -> LicensingResult<ActivationResponse> {
        let mut inner = self.inner.lock().await;
        let response = inner.sync.activation_client.activate(&request).await?;

        let license = LicenseState {
            user_id: response.user_id.clone(),
            tier: response.tier,
            activation_hash: hash_activation_key(&request.activation_key),
            activated_at_ms: now_ms(),
            last_validated_ms: now_ms(),
            expires_at_ms: response.expires_at_ms,
            org_id: response.org_id.clone(),
            grace_period_days: response.grace_period_days,
        };

        persist_license(&inner.license_path, &inner.master_key, &license)?;
        inner.license = Some(license);
        Ok(response)
    }

    pub async fn get_tier(&self) -> LicensingResult<Tier> {
        let inner = self.inner.lock().await;
        Ok(inner.license.as_ref().map(|l| l.tier).unwrap_or(Tier::Free))
    }

    pub async fn get_usage(&self) -> LicensingResult<UsageStore> {
        let inner = self.inner.lock().await;
        Ok(inner.usage.clone())
    }

    pub async fn consume_credits(&self, amount: i64) -> LicensingResult<i64> {
        let mut inner = self.inner.lock().await;
        inner.credits.consume(amount)?;
        inner.credits.save(&inner.credits_path)?;
        Ok(inner.credits.balance)
    }

    #[allow(dead_code)]
    pub async fn check_gate(&self, feature: &str, amount: u32, offline: bool) -> LicensingResult<()> {
        let mut inner = self.inner.lock().await;
        validate_clock(inner.license.as_ref())?;
        let gate = inner
            .gates
            .get(feature)
            .ok_or_else(|| LicensingError::InvalidInput("unknown feature".into()))?
            .clone();

        let license_tier = inner.license.as_ref().map(|l| l.tier).unwrap_or(Tier::Free);
        if gate.min_tier as u8 > license_tier as u8 {
            return Err(LicensingError::LicenseInvalid("tier too low".into()));
        }
        if gate.requires_license && inner.license.is_none() {
            return Err(LicensingError::LicenseMissing);
        }
        if offline && !gate.offline_allowed {
            return Err(LicensingError::OfflineValidationRequired);
        }

        if let Some(key) = gate.usage_key.as_ref() {
            if let Some(limit) = gate.monthly_limit {
                let month_key = current_month_key();
                inner.usage.enforce_limit(&month_key, key, limit, amount)?;
                inner.usage.increment(&month_key, key, amount);
                inner.usage.save(&inner.usage_path)?;
            }
        }
        Ok(())
    }

    pub async fn sync_usage(&self, user_id: &str, auth_token: &str) -> LicensingResult<()> {
        let mut inner = self.inner.lock().await;
        let sync = inner.sync.clone();
        sync.sync_usage(&mut inner.usage, user_id, auth_token).await?;
        inner.usage.save(&inner.usage_path)?;
        Ok(())
    }

    pub async fn sync_credits(&self, user_id: &str, auth_token: &str) -> LicensingResult<()> {
        let mut inner = self.inner.lock().await;
        let sync = inner.sync.clone();
        sync.sync_credits(&mut inner.credits, user_id, auth_token).await?;
        inner.credits.save(&inner.credits_path)?;
        Ok(())
    }
}

fn load_license(path: &PathBuf, key: &[u8]) -> LicensingResult<LicenseState> {
    let data = fs::read_to_string(path)?;
    let decrypted = decrypt_payload(key, &data)?;
    let license: LicenseState = serde_json::from_slice(&decrypted)?;
    Ok(license)
}

fn persist_license(path: &PathBuf, key: &[u8], license: &LicenseState) -> LicensingResult<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let data = serde_json::to_vec(license)?;
    let encrypted = encrypt_payload(key, &data)?;
    fs::write(path, encrypted)?;
    Ok(())
}

fn load_gates(path: &PathBuf) -> LicensingResult<GateConfig> {
    if !path.exists() {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let embedded = include_str!("../../resources/licensing/gates.json");
        fs::write(path, embedded)?;
        return Ok(serde_json::from_str(embedded)?);
    }
    let data = fs::read_to_string(path)?;
    Ok(serde_json::from_str(&data)?)
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

#[allow(dead_code)]
fn validate_clock(license: Option<&LicenseState>) -> LicensingResult<()> {
    if let Some(license) = license {
        let now = now_ms();
        if now < license.last_validated_ms.saturating_sub(60_000) {
            return Err(LicensingError::LicenseInvalid("clock rollback detected".into()));
        }
    }
    Ok(())
}

#[allow(dead_code)]
fn current_month_key() -> String {
    let now = chrono::Utc::now();
    format!("{}-{:02}", now.year(), now.month())
}
