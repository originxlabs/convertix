use crate::pdf_engine::errors::{PdfEngineError, PdfEngineResult};
use directories::ProjectDirs;
use std::path::{Component, Path, PathBuf};

#[derive(Debug, Clone)]
pub struct EnginePaths {
    pub data_dir: PathBuf,
    pub jobs_dir: PathBuf,
    pub output_dir: PathBuf,
    pub audit_dir: PathBuf,
}

pub fn resolve_engine_paths() -> PdfEngineResult<EnginePaths> {
    let dirs = ProjectDirs::from("com", "originx", "convertix")
        .ok_or_else(|| PdfEngineError::Io(std::io::Error::new(std::io::ErrorKind::Other, "missing dirs")))?;
    let data_dir = dirs.data_local_dir().to_path_buf();
    let jobs_dir = data_dir.join("pdf_engine").join("jobs");
    let output_dir = data_dir.join("pdf_engine").join("outputs");
    let audit_dir = data_dir.join("pdf_engine").join("audit");
    Ok(EnginePaths {
        data_dir,
        jobs_dir,
        output_dir,
        audit_dir,
    })
}

pub fn validate_user_path(path: &str) -> PdfEngineResult<PathBuf> {
    let candidate = PathBuf::from(path);
    if !candidate.is_absolute() {
        return Err(PdfEngineError::Security("path must be absolute".into()));
    }
    if contains_parent_traversal(&candidate) {
        return Err(PdfEngineError::Security("path traversal not allowed".into()));
    }
    Ok(candidate)
}

pub fn ensure_parent_dir(path: &Path) -> PdfEngineResult<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
        Ok(())
    } else {
        Err(PdfEngineError::InvalidInput("missing parent directory".into()))
    }
}

pub fn deterministic_output_name(input: &Path, suffix: &str) -> PdfEngineResult<String> {
    let file = input
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or_else(|| PdfEngineError::InvalidInput("invalid filename".into()))?;
    Ok(format!("{}_{}", file, suffix))
}

fn contains_parent_traversal(path: &Path) -> bool {
    path.components().any(|c| matches!(c, Component::ParentDir))
}
