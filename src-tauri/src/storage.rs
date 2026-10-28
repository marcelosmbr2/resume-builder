//! Preferences live in the app config dir; the resume library lives in the
//! user-chosen documents folder, next to the exported PDFs.

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Manager};

const PREFS_FILE: &str = "prefs.json";
const LIBRARY_FILE: &str = "curriculos.json";

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Prefs {
    theme: String,
    save_dir: String,
}

fn prefs_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    Ok(dir.join(PREFS_FILE))
}

fn default_save_dir(app: &AppHandle) -> String {
    app.path()
        .document_dir()
        .or_else(|_| app.path().home_dir())
        .map(|d| d.join("Currículos").to_string_lossy().into_owned())
        .unwrap_or_default()
}

/// Writes through a temp file so a crash mid-write never truncates the target.
fn write_atomic(path: &Path, contents: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, contents).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_prefs(app: AppHandle) -> Prefs {
    let saved = prefs_path(&app)
        .ok()
        .and_then(|p| fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str::<Prefs>(&s).ok());
    match saved {
        Some(p) if !p.save_dir.is_empty() => p,
        Some(p) => Prefs { save_dir: default_save_dir(&app), ..p },
        None => Prefs { theme: "system".into(), save_dir: default_save_dir(&app) },
    }
}

#[tauri::command]
pub fn save_prefs(app: AppHandle, prefs: Prefs) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&prefs).map_err(|e| e.to_string())?;
    write_atomic(&prefs_path(&app)?, &json)
}

#[tauri::command]
pub fn load_library(dir: String) -> Result<Option<Value>, String> {
    let path = Path::new(&dir).join(LIBRARY_FILE);
    match fs::read_to_string(&path) {
        Ok(s) => serde_json::from_str(&s).map(Some).map_err(|e| e.to_string()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn save_library(dir: String, data: Value) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    write_atomic(&Path::new(&dir).join(LIBRARY_FILE), &json)
}

#[tauri::command]
pub fn reset_app(app: AppHandle, dir: String) -> Result<(), String> {
    for path in [prefs_path(&app)?, Path::new(&dir).join(LIBRARY_FILE)] {
        match fs::remove_file(&path) {
            Err(e) if e.kind() != std::io::ErrorKind::NotFound => return Err(e.to_string()),
            _ => {}
        }
    }
    Ok(())
}
