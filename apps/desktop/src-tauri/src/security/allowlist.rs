use std::path::{Path, PathBuf};

#[allow(dead_code)]
pub fn is_allowed_path(base: &Path, candidate: &Path) -> bool {
    let base = base.canonicalize().ok();
    let candidate = candidate.canonicalize().ok();
    match (base, candidate) {
        (Some(base), Some(candidate)) => candidate.starts_with(base),
        _ => false,
    }
}

pub fn normalize_path(path: &str) -> PathBuf {
    PathBuf::from(path)
}
