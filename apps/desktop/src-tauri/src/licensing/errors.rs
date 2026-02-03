use thiserror::Error;

#[allow(dead_code)]
#[derive(Debug, Error)]
pub enum LicensingError {
    #[error("invalid input: {0}")]
    InvalidInput(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("crypto error: {0}")]
    Crypto(String),
    #[error("license not found")]
    LicenseMissing,
    #[error("license invalid: {0}")]
    LicenseInvalid(String),
    #[error("license expired")]
    LicenseExpired,
    #[error("activation failed: {0}")]
    ActivationFailed(String),
    #[error("offline and validation required")]
    OfflineValidationRequired,
    #[error("usage limit exceeded")]
    UsageLimitExceeded,
    #[error("insufficient credits")]
    InsufficientCredits,
    #[error("sync unavailable")]
    SyncUnavailable,
}

pub type LicensingResult<T> = Result<T, LicensingError>;
