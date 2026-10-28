//! PDF export. A hidden `print` window loads the same frontend, which detects
//! its label, pulls the pending job with `print_job`, renders only the resume
//! page and calls `print_ready`. WebView2's PrintToPdf then writes the file.

use std::sync::Mutex;
use std::sync::mpsc;
use std::time::Duration;

use serde_json::Value;
use tauri::{AppHandle, Manager, State, WebviewUrl, WebviewWindowBuilder};

const PRINT_LABEL: &str = "print";

#[derive(Default)]
pub struct PrintState {
    job: Mutex<Option<Value>>,
    ready: Mutex<Option<mpsc::Sender<()>>>,
}

#[tauri::command]
pub fn print_job(state: State<'_, PrintState>) -> Option<Value> {
    state.job.lock().unwrap().clone()
}

#[tauri::command]
pub fn print_ready(state: State<'_, PrintState>) {
    if let Some(tx) = state.ready.lock().unwrap().take() {
        let _ = tx.send(());
    }
}

async fn recv_blocking<T: Send + 'static>(
    rx: mpsc::Receiver<T>,
    timeout: Duration,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(move || rx.recv_timeout(timeout))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|_| "Tempo esgotado ao gerar o PDF.".to_string())
}

#[tauri::command]
pub async fn export_pdf(
    app: AppHandle,
    state: State<'_, PrintState>,
    path: String,
    resume: Value,
    links: bool,
) -> Result<String, String> {
    if let Some(old) = app.get_webview_window(PRINT_LABEL) {
        let _ = old.destroy();
    }
    let (ready_tx, ready_rx) = mpsc::channel();
    *state.job.lock().unwrap() = Some(serde_json::json!({ "resume": resume, "links": links }));
    *state.ready.lock().unwrap() = Some(ready_tx);

    let win = WebviewWindowBuilder::new(&app, PRINT_LABEL, WebviewUrl::default())
        .title("print")
        .inner_size(794.0, 1123.0)
        .visible(false)
        .skip_taskbar(true)
        .build()
        .map_err(|e| e.to_string())?;

    let result = async {
        recv_blocking(ready_rx, Duration::from_secs(20)).await?;
        let (done_tx, done_rx) = mpsc::channel();
        let target = path.clone();
        win.with_webview(move |webview| print_to_pdf(webview, &target, done_tx))
            .map_err(|e| e.to_string())?;
        recv_blocking(done_rx, Duration::from_secs(60)).await?
    }
    .await;

    *state.job.lock().unwrap() = None;
    let _ = win.destroy();
    result.map(|_| path)
}

#[cfg(windows)]
fn print_to_pdf(webview: tauri::webview::PlatformWebview, path: &str, done: mpsc::Sender<Result<(), String>>) {
    use webview2_com::Microsoft::Web::WebView2::Win32::{
        COREWEBVIEW2_PRINT_ORIENTATION_PORTRAIT, ICoreWebView2_7, ICoreWebView2Environment6,
    };
    use webview2_com::PrintToPdfCompletedHandler;
    use windows_core::{HSTRING, Interface, PCWSTR};

    let fail = done.clone();
    let run = move || -> windows_core::Result<()> {
        unsafe {
            let core = webview.controller().CoreWebView2()?.cast::<ICoreWebView2_7>()?;
            let settings = webview
                .environment()
                .cast::<ICoreWebView2Environment6>()?
                .CreatePrintSettings()?;
            // A4 in inches, no margins: the page component already has its own padding.
            settings.SetOrientation(COREWEBVIEW2_PRINT_ORIENTATION_PORTRAIT)?;
            settings.SetPageWidth(8.27)?;
            settings.SetPageHeight(11.69)?;
            settings.SetMarginTop(0.0)?;
            settings.SetMarginBottom(0.0)?;
            settings.SetMarginLeft(0.0)?;
            settings.SetMarginRight(0.0)?;
            settings.SetScaleFactor(1.0)?;
            settings.SetShouldPrintBackgrounds(true)?;
            settings.SetShouldPrintHeaderAndFooter(false)?;

            let target = HSTRING::from(path);
            let handler = PrintToPdfCompletedHandler::create(Box::new(move |hr, ok| {
                let res = match hr {
                    Ok(()) if ok => Ok(()),
                    Ok(()) => Err("Não foi possível gravar o PDF.".to_string()),
                    Err(e) => Err(e.message().to_string()),
                };
                let _ = done.send(res);
                Ok(())
            }));
            core.PrintToPdf(PCWSTR(target.as_ptr()), &settings, &handler)
        }
    };
    if let Err(e) = run() {
        let _ = fail.send(Err(e.message().to_string()));
    }
}

#[cfg(not(windows))]
fn print_to_pdf(_: tauri::webview::PlatformWebview, _: &str, done: mpsc::Sender<Result<(), String>>) {
    let _ = done.send(Err("Exportação de PDF disponível apenas no Windows.".to_string()));
}
