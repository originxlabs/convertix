use thiserror::Error;

#[derive(Debug, Error)]
pub enum PdfEngineError {
    #[error("invalid input: {0}")]
    InvalidInput(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("tool unavailable: {0}")]
    ToolUnavailable(String),
    #[error("tool failed: {0}")]
    ToolFailed(String),
    #[error("job not found")]
    JobNotFound,
    #[error("job canceled")]
    JobCanceled,
    #[error("unsupported operation: {0}")]
    Unsupported(String),
    #[error("security violation: {0}")]
    Security(String),
    #[error("timeout")]
    Timeout,
}

pub type PdfEngineResult<T> = Result<T, PdfEngineError>;
