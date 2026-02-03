use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct CacheInfo {
    pub cache_dir: String,
    pub bytes_used: u64,
    pub limit_bytes: u64,
}

pub fn cache_dir() -> Result<PathBuf, std::io::Error> {
    let proj = ProjectDirs::from("com", "OriginX", "convertix")
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::Other, "project dirs unavailable"))?;
    let dir = proj.data_dir().to_path_buf();
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub async fn get_cache_info() -> Result<CacheInfo, std::io::Error> {
    let dir = cache_dir()?;
    let bytes = dir
        .read_dir()?
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| entry.metadata().ok())
        .map(|meta| meta.len())
        .sum();

    Ok(CacheInfo {
        cache_dir: dir.to_string_lossy().to_string(),
        bytes_used: bytes,
        limit_bytes: 2 * 1024 * 1024 * 1024,
    })
}

pub async fn clear_cache() -> Result<(), std::io::Error> {
    let dir = cache_dir()?;
    if dir.exists() {
        for entry in fs::read_dir(&dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                let _ = fs::remove_dir_all(&path);
            } else {
                let _ = fs::remove_file(&path);
            }
        }
    }
    Ok(())
}
