mod pdf;
mod storage;

#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    tauri_plugin_opener::open_path(path, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
fn reveal_file(path: String) -> Result<(), String> {
    tauri_plugin_opener::reveal_item_in_dir(path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(pdf::PrintState::default())
        .invoke_handler(tauri::generate_handler![
            storage::load_prefs,
            storage::save_prefs,
            storage::load_library,
            storage::save_library,
            storage::reset_app,
            pdf::export_pdf,
            pdf::print_job,
            pdf::print_ready,
            open_file,
            reveal_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
