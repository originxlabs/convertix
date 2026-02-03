#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod pdf_engine;
mod licensing;
mod security;
mod services;
mod state;

use commands::{fs, jobs, licensing as licensing_cmds, local_processor, offline, pdf_engine as pdf_engine_cmds, system};
use licensing::LicensingService;
use licensing::activation::HttpActivationClient;
use pdf_engine::PdfEngine;
use state::app_state::AppState;
use tauri::Manager;

fn main() {
    let (engine, handle) = PdfEngine::new().expect("pdf engine init failed");
    let api_base = std::env::var("CONVERTIX_API_BASE").unwrap_or_else(|_| "http://localhost:5055".to_string());
    let activation_client = std::sync::Arc::new(HttpActivationClient { api_base });
    let licensing = LicensingService::new(activation_client).expect("licensing init failed");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::new())
        .manage(engine.clone())
        .manage(handle)
        .manage(licensing.clone())
        .invoke_handler(tauri::generate_handler![
            fs::open_file_dialog,
            fs::save_file_dialog,
            offline::get_offline_status,
            system::get_cache_info,
            system::clear_cache,
            local_processor::process_local_file,
            jobs::enqueue_job,
            jobs::get_job_status,
            jobs::cancel_job,
            licensing_cmds::get_tier,
            licensing_cmds::activate_license,
            licensing_cmds::get_usage,
            licensing_cmds::consume_credits,
            licensing_cmds::sync_usage,
            licensing_cmds::sync_credits,
            pdf_engine_cmds::pdf_merge,
            pdf_engine_cmds::pdf_split,
            pdf_engine_cmds::pdf_rotate,
            pdf_engine_cmds::pdf_compress,
            pdf_engine_cmds::pdf_reorder_pages,
            pdf_engine_cmds::pdf_extract_pages,
            pdf_engine_cmds::pdf_encrypt,
            pdf_engine_cmds::pdf_decrypt,
            pdf_engine_cmds::pdf_get_metadata,
            pdf_engine_cmds::pdf_set_metadata,
            pdf_engine_cmds::pdf_get_job_status,
            pdf_engine_cmds::pdf_cancel_job
        ])
        .setup(|app| {
            let engine = app.state::<PdfEngine>().inner().clone();
            tauri::async_runtime::spawn(async move {
                let _ = engine.load_and_resume().await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running CONVERTIX desktop app");
}
