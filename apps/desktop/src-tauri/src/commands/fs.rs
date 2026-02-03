use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, FileDialogBuilder, FilePath};

#[tauri::command]
pub async fn open_file_dialog(app: AppHandle) -> Option<String> {
    let (tx, rx) = std::sync::mpsc::channel();
    FileDialogBuilder::new(app.dialog().clone()).pick_file(move |file_path: Option<FilePath>| {
        let resolved = file_path.and_then(|p| p.into_path().ok());
        let _ = tx.send(resolved.map(|p| p.to_string_lossy().to_string()));
    });
    rx.recv().ok().flatten()
}

#[tauri::command]
pub async fn save_file_dialog(app: AppHandle, default_name: Option<String>) -> Option<String> {
    let (tx, rx) = std::sync::mpsc::channel();
    let mut dialog = FileDialogBuilder::new(app.dialog().clone());
    if let Some(name) = default_name {
        dialog = dialog.set_file_name(&name);
    }
    dialog.save_file(move |file_path: Option<FilePath>| {
        let resolved = file_path.and_then(|p| p.into_path().ok());
        let _ = tx.send(resolved.map(|p| p.to_string_lossy().to_string()));
    });
    rx.recv().ok().flatten()
}
