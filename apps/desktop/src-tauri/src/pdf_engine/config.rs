use crate::pdf_engine::errors::{PdfEngineError, PdfEngineResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineConfig {
    pub pdfcpu_enabled: bool,
    pub qpdf_enabled: bool,
    pub ghostscript_enabled: bool,
    pub pdfcpu_path: Option<String>,
    pub qpdf_path: Option<String>,
    pub ghostscript_path: Option<String>,
    pub default_compression_preset: String,
    pub tool_timeout_secs: u64,
}

impl Default for EngineConfig {
    fn default() -> Self {
        Self {
            pdfcpu_enabled: true,
            qpdf_enabled: true,
            ghostscript_enabled: true,
            pdfcpu_path: None,
            qpdf_path: None,
            ghostscript_path: None,
            default_compression_preset: "screen".to_string(),
            tool_timeout_secs: 120,
        }
    }
}

pub fn load_config(config_dir: &PathBuf) -> PdfEngineResult<EngineConfig> {
    let json_path = config_dir.join("config.json");
    let toml_path = config_dir.join("config.toml");

    if json_path.exists() {
        let data = fs::read_to_string(json_path)?;
        let config: EngineConfig = serde_json::from_str(&data)?;
        return Ok(config);
    }

    if toml_path.exists() {
        let data = fs::read_to_string(toml_path)?;
        let config: EngineConfig = toml::from_str(&data)
            .map_err(|e| PdfEngineError::InvalidInput(e.to_string()))?;
        return Ok(config);
    }

    Ok(EngineConfig::default())
}
