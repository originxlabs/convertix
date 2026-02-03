use crate::licensing::errors::{LicensingError, LicensingResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageBucket {
    pub counts: HashMap<String, u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStore {
    pub buckets: HashMap<String, UsageBucket>,
    pub last_sync_ms: Option<u64>,
}

impl UsageStore {
    pub fn new() -> Self {
        Self {
            buckets: HashMap::new(),
            last_sync_ms: None,
        }
    }

    pub fn load(path: &PathBuf) -> LicensingResult<Self> {
        if !path.exists() {
            return Ok(Self::new());
        }
        let data = fs::read_to_string(path)?;
        Ok(serde_json::from_str(&data)?)
    }

    pub fn save(&self, path: &PathBuf) -> LicensingResult<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let data = serde_json::to_string_pretty(self)?;
        fs::write(path, data)?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn get_month_bucket_mut(&mut self, month_key: &str) -> &mut UsageBucket {
        self.buckets
            .entry(month_key.to_string())
            .or_insert_with(|| UsageBucket { counts: HashMap::new() })
    }

    #[allow(dead_code)]
    pub fn increment(&mut self, month_key: &str, key: &str, amount: u32) {
        let bucket = self.get_month_bucket_mut(month_key);
        let entry = bucket.counts.entry(key.to_string()).or_insert(0);
        *entry = entry.saturating_add(amount);
    }

    #[allow(dead_code)]
    pub fn get_count(&self, month_key: &str, key: &str) -> u32 {
        self.buckets
            .get(month_key)
            .and_then(|b| b.counts.get(key))
            .copied()
            .unwrap_or(0)
    }

    #[allow(dead_code)]
    pub fn enforce_limit(&self, month_key: &str, key: &str, limit: u32, amount: u32) -> LicensingResult<()> {
        let current = self.get_count(month_key, key);
        if current.saturating_add(amount) > limit {
            return Err(LicensingError::UsageLimitExceeded);
        }
        Ok(())
    }
}
