use crate::pdf_engine::{PdfEngine, PdfEngineHandle};
use crate::pdf_engine::models::job::PdfJobKind;
use tauri::State;

#[tauri::command]
pub async fn pdf_merge(state: State<'_, PdfEngine>, inputs: Vec<String>, output: String) -> Result<String, String> {
    state.enqueue(PdfJobKind::Merge { inputs, output }).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pdf_split(state: State<'_, PdfEngine>, input: String, output_dir: String, mode: String, span: Option<u32>, pages: Option<Vec<u32>>) -> Result<String, String> {
    state.enqueue(PdfJobKind::Split { input, output_dir, mode, span, pages }).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pdf_rotate(state: State<'_, PdfEngine>, input: String, output: String, page_range: Option<String>, degrees: i32) -> Result<String, String> {
    state.enqueue(PdfJobKind::Rotate { input, output, page_range, degrees }).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pdf_compress(state: State<'_, PdfEngine>, input: String, output: String, preset: Option<String>) -> Result<String, String> {
    state.enqueue(PdfJobKind::Compress { input, output, preset }).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pdf_reorder_pages(state: State<'_, PdfEngine>, input: String, output: String, page_order: Vec<u32>) -> Result<String, String> {
    state.enqueue(PdfJobKind::Reorder { input, output, page_order }).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pdf_extract_pages(state: State<'_, PdfEngine>, input: String, output: String, pages: Vec<u32>) -> Result<String, String> {
    state.enqueue(PdfJobKind::Extract { input, output, pages }).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pdf_encrypt(state: State<'_, PdfEngine>, input: String, output: String, user_password: Option<String>, owner_password: String) -> Result<String, String> {
    state.enqueue(PdfJobKind::Encrypt { input, output, user_password, owner_password }).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pdf_decrypt(state: State<'_, PdfEngine>, input: String, output: String, password: String) -> Result<String, String> {
    state.enqueue(PdfJobKind::Decrypt { input, output, password }).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pdf_get_metadata(state: State<'_, PdfEngine>, input: String) -> Result<String, String> {
    state.enqueue(PdfJobKind::GetMetadata { input }).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pdf_set_metadata(state: State<'_, PdfEngine>, input: String, output: String, title: Option<String>, author: Option<String>, subject: Option<String>, keywords: Option<String>) -> Result<String, String> {
    state.enqueue(PdfJobKind::SetMetadata { input, output, title, author, subject, keywords }).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pdf_get_job_status(state: State<'_, PdfEngineHandle>, job_id: String) -> Result<String, String> {
    let status = state.get_status(&job_id).await.map_err(|e| e.to_string())?;
    serde_json::to_string(&status).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pdf_cancel_job(state: State<'_, PdfEngine>, job_id: String) -> Result<(), String> {
    state.cancel(&job_id).await.map_err(|e| e.to_string())
}
