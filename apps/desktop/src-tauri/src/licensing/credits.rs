use crate::licensing::errors::{LicensingError, LicensingResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreditWallet {
    pub balance: i64,
    pub pending_delta: i64,
    pub last_sync_ms: Option<u64>,
}

impl CreditWallet {
    pub fn new() -> Self {
        Self {
            balance: 0,
            pending_delta: 0,
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

    pub fn consume(&mut self, amount: i64) -> LicensingResult<()> {
        if self.balance - amount < 0 {
            return Err(LicensingError::InsufficientCredits);
        }
        self.balance -= amount;
        self.pending_delta -= amount;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn add(&mut self, amount: i64) {
        self.balance += amount;
        self.pending_delta += amount;
    }
}
