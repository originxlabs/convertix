pub mod ghostscript;
pub mod pdfcpu;
pub mod qpdf;

use crate::pdf_engine::errors::{PdfEngineError, PdfEngineResult};
use std::path::PathBuf;
use tokio::process::Command;
use tokio::time::{timeout, Duration};

#[derive(Debug, Clone)]
pub struct ToolConfig {
    pub enabled: bool,
    pub executable: PathBuf,
    pub timeout_secs: u64,
}

pub async fn run_tool(name: &str, config: &ToolConfig, args: &[String]) -> PdfEngineResult<()> {
    if !config.enabled {
        return Err(PdfEngineError::ToolUnavailable(format!("{name} disabled")));
    }
    let mut cmd = Command::new(&config.executable);
    cmd.args(args);

    let output = timeout(Duration::from_secs(config.timeout_secs), cmd.output())
        .await
        .map_err(|_| PdfEngineError::Timeout)??;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(PdfEngineError::ToolFailed(format!("{name}: {stderr}")));
    }
    Ok(())
}
