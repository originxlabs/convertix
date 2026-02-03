use crate::services::cache;
use crate::security::allowlist;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize)]
pub struct LocalProcessRequest {
    pub kind: String,
    pub input_path: String,
    pub output_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LocalProcessResult {
    pub output_path: String,
    pub bytes_written: u64,
    pub sha256: String,
}

pub async fn process(request: LocalProcessRequest) -> Result<LocalProcessResult, String> {
    let input = allowlist::normalize_path(&request.input_path);
    if !input.exists() {
        return Err("input file not found".into());
    }
    let meta = fs::metadata(&input).map_err(|e| e.to_string())?;
    if meta.len() > 500 * 1024 * 1024 {
        return Err("file exceeds 500 MB limit".into());
    }

    let cache_dir = cache::cache_dir().map_err(|e| e.to_string())?;
    let output_name = request.output_name.unwrap_or_else(|| "convertix-output".to_string());

    match request.kind.as_str() {
        "pdf" => process_pdf(&input, &cache_dir, &output_name),
        "image" => process_image(&input, &cache_dir, &output_name),
        _ => Err("unsupported kind".into())
    }
}

fn process_pdf(input: &Path, cache_dir: &Path, output_name: &str) -> Result<LocalProcessResult, String> {
    let mut file = fs::File::open(input).map_err(|e| e.to_string())?;
    let mut header = [0u8; 5];
    file.read_exact(&mut header).map_err(|e| e.to_string())?;
    if &header != b"%PDF-" {
        return Err("invalid PDF header".into());
    }

    let output_path = cache_dir.join(format!("{output_name}.pdf"));
    let mut reader = fs::File::open(input).map_err(|e| e.to_string())?;
    let mut writer = fs::File::create(&output_path).map_err(|e| e.to_string())?;
    let bytes_written = std::io::copy(&mut reader, &mut writer).map_err(|e| e.to_string())?;

    let sha256 = hash_file(&output_path)?;
    Ok(LocalProcessResult {
        output_path: output_path.to_string_lossy().to_string(),
        bytes_written,
        sha256,
    })
}

fn process_image(input: &Path, cache_dir: &Path, output_name: &str) -> Result<LocalProcessResult, String> {
    let image = image::open(input).map_err(|e| e.to_string())?;
    let output_path = cache_dir.join(format!("{output_name}.png"));
    let mut out = fs::File::create(&output_path).map_err(|e| e.to_string())?;
    image.write_to(&mut out, image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    out.flush().map_err(|e| e.to_string())?;

    let bytes_written = fs::metadata(&output_path).map_err(|e| e.to_string())?.len();
    let sha256 = hash_file(&output_path)?;
    Ok(LocalProcessResult {
        output_path: output_path.to_string_lossy().to_string(),
        bytes_written,
        sha256,
    })
}

fn hash_file(path: &PathBuf) -> Result<String, String> {
    let mut file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 8192];
    loop {
        let read = file.read(&mut buf).map_err(|e| e.to_string())?;
        if read == 0 {
            break;
        }
        hasher.update(&buf[..read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}
