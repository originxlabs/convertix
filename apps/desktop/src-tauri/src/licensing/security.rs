use crate::licensing::errors::{LicensingError, LicensingResult};
use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use aes_gcm::aead::{Aead, OsRng};
use base64::{engine::general_purpose, Engine as _};
use keyring::Entry;
use rand::RngCore;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;

const KEY_SERVICE: &str = "convertix";
const KEY_USERNAME: &str = "licensing-master";

pub fn load_or_create_master_key(storage_dir: &PathBuf) -> LicensingResult<Vec<u8>> {
    let entry = Entry::new(KEY_SERVICE, KEY_USERNAME)
        .map_err(|e| LicensingError::Crypto(e.to_string()))?;

    if let Ok(key_b64) = entry.get_password() {
        let key = general_purpose::STANDARD
            .decode(key_b64)
            .map_err(|e| LicensingError::Crypto(e.to_string()))?;
        if key.len() == 32 {
            return Ok(key);
        }
    }

    let mut key = vec![0u8; 32];
    OsRng.fill_bytes(&mut key);
    let key_b64 = general_purpose::STANDARD.encode(&key);
    entry
        .set_password(&key_b64)
        .map_err(|e| LicensingError::Crypto(e.to_string()))?;

    // Fallback: write a protected marker file to detect tampering.
    let marker_path = storage_dir.join("licensing").join("key.marker");
    if let Some(parent) = marker_path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(marker_path, "ok")?;

    Ok(key)
}

pub fn encrypt_payload(key: &[u8], plaintext: &[u8]) -> LicensingResult<String> {
    if key.len() != 32 {
        return Err(LicensingError::Crypto("invalid key length".into()));
    }
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| LicensingError::Crypto(e.to_string()))?;
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| LicensingError::Crypto(e.to_string()))?;
    let mut payload = Vec::with_capacity(12 + ciphertext.len());
    payload.extend_from_slice(&nonce_bytes);
    payload.extend_from_slice(&ciphertext);
    Ok(general_purpose::STANDARD.encode(payload))
}

pub fn decrypt_payload(key: &[u8], payload_b64: &str) -> LicensingResult<Vec<u8>> {
    if key.len() != 32 {
        return Err(LicensingError::Crypto("invalid key length".into()));
    }
    let payload = general_purpose::STANDARD
        .decode(payload_b64)
        .map_err(|e| LicensingError::Crypto(e.to_string()))?;
    if payload.len() < 13 {
        return Err(LicensingError::Crypto("payload too short".into()));
    }
    let (nonce_bytes, ciphertext) = payload.split_at(12);
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| LicensingError::Crypto(e.to_string()))?;
    let nonce = Nonce::from_slice(nonce_bytes);
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| LicensingError::Crypto(e.to_string()))?;
    Ok(plaintext)
}

pub fn hash_activation_key(key: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(key.as_bytes());
    let result = hasher.finalize();
    general_purpose::STANDARD.encode(result)
}
