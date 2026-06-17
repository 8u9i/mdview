use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

#[derive(Serialize)]
struct ReadResult {
    path: String,
    name: String,
    content: String,
    size: u64,
}

/// Holds the file path passed on the command line (if any), captured at startup
/// so the frontend can ask for it via `initial_file` once it has loaded.
struct InitialFile(Mutex<Option<String>>);

#[tauri::command]
fn read_markdown(path: String) -> Result<ReadResult, String> {
    let pb = PathBuf::from(&path);
    let meta = std::fs::metadata(&pb).map_err(|e| format!("Cannot access file: {e}"))?;
    if !meta.is_file() {
        return Err("Path is not a file".into());
    }
    let content = std::fs::read_to_string(&pb).map_err(|e| format!("Cannot read file: {e}"))?;
    let name = pb
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("untitled.md")
        .to_string();
    Ok(ReadResult {
        path: pb.to_string_lossy().to_string(),
        name,
        content,
        size: meta.len(),
    })
}

#[tauri::command]
fn file_exists(path: String) -> bool {
    std::path::Path::new(&path).is_file()
}

/// Returns the file path the app was launched with (from argv), if any.
/// The frontend calls this on startup; if a path is returned it loads the file.
#[tauri::command]
fn initial_file(app: tauri::AppHandle) -> Option<String> {
    let state = app.state::<InitialFile>();
    let mut guard = state.0.lock().unwrap();
    let result = guard.take();
    drop(guard);
    result
}

/// Extract the first existing file path from a list of CLI args.
/// Skips the executable path (argv[0]) and any flags starting with `-`.
fn first_existing_file_arg(args: &[String]) -> Option<String> {
    args.iter()
        .skip(1) // skip exe path
        .filter(|a| !a.starts_with("--") && !a.starts_with('-'))
        .find(|a| std::path::Path::new(a.as_str()).is_file())
        .cloned()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial = first_existing_file_arg(&std::env::args().collect::<Vec<_>>());

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(InitialFile(Mutex::new(initial)));

    // Single-instance: when a second mdview.exe is launched (e.g. user
    // double-clicks another .md file while MDView is running), focus the
    // existing window and forward the new argv to the frontend as an event.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // Find a file path in the new argv
            if let Some(path) = first_existing_file_arg(&argv) {
                let _ = app.emit("open-file", path);
            }
            // Bring the existing window to the foreground
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.unminimize();
                let _ = win.set_focus();
            }
        }));
    }

    builder
        .invoke_handler(tauri::generate_handler![
            read_markdown,
            file_exists,
            initial_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
