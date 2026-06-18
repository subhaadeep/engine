use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_shell::ShellExt;

// ─── App State ─────────────────────────────────────────────────────────────

pub struct BackendState {
    pub port: Mutex<u16>,
    pub process_pid: Mutex<Option<u32>>,
}

// ─── Tauri Commands ─────────────────────────────────────────────────────────

/// Get the current backend port (for frontend to query)
#[tauri::command]
fn get_backend_port(state: State<BackendState>) -> u16 {
    *state.port.lock().unwrap()
}

/// Open a file dialog and return selected path
#[tauri::command]
async fn pick_file(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app
        .dialog()
        .file()
        .blocking_pick_file();
    Ok(path.map(|p| p.to_string()))
}

// ─── Backend Sidecar Management ─────────────────────────────────────────────

const BACKEND_PORT: u16 = 8765;

async fn wait_for_backend(port: u16, max_retries: u32) -> bool {
    let url = format!("http://127.0.0.1:{}/health", port);
    for attempt in 0..max_retries {
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        if let Ok(resp) = reqwest::get(&url).await {
            if resp.status().is_success() {
                println!("[Tauri] Backend ready on port {} (attempt {})", port, attempt + 1);
                return true;
            }
        }
        if attempt % 4 == 0 {
            println!("[Tauri] Waiting for backend... attempt {}/{}", attempt + 1, max_retries);
        }
    }
    false
}

// ─── Library Entry Point ─────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(BackendState {
            port: Mutex::new(BACKEND_PORT),
            process_pid: Mutex::new(None),
        })
        .setup(|app| {
            let handle = app.handle().clone();

            // Spawn Python backend sidecar
            tauri::async_runtime::spawn(async move {
                println!("[Tauri] Spawning Python backend sidecar on port {}...", BACKEND_PORT);

                // Try to spawn the sidecar binary
                let sidecar_result = handle
                    .shell()
                    .sidecar("python-backend")
                    .and_then(|cmd| {
                        cmd.args(["--port", &BACKEND_PORT.to_string()])
                           .spawn()
                    });

                match sidecar_result {
                    Ok((_rx, child)) => {
                        println!("[Tauri] Sidecar spawned, pid: {:?}", child.pid());

                        // Store PID for cleanup
                        if let Some(state) = handle.try_state::<BackendState>() {
                            *state.process_pid.lock().unwrap() = Some(child.pid());
                        }

                        // Wait for backend to be ready
                        let ready = wait_for_backend(BACKEND_PORT, 60).await;

                        if ready {
                            println!("[Tauri] Backend is ready. Emitting backend-ready event.");
                            let _ = handle.emit("backend-ready", BACKEND_PORT);
                        } else {
                            eprintln!("[Tauri] Backend failed to start within timeout!");
                            let _ = handle.emit("backend-error", "Backend failed to start");
                        }
                    }
                    Err(e) => {
                        // In development mode, backend may already be running separately
                        eprintln!("[Tauri] Sidecar not found ({}). Checking if backend is already running...", e);

                        // Try to connect to a manually-started backend
                        let ready = wait_for_backend(BACKEND_PORT, 20).await;
                        if ready {
                            println!("[Tauri] Found existing backend on port {}", BACKEND_PORT);
                            let _ = handle.emit("backend-ready", BACKEND_PORT);
                        } else {
                            eprintln!("[Tauri] No backend available. Please start backend manually.");
                            let _ = handle.emit("backend-error", "No backend available");
                        }
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Backend process cleanup happens automatically when Tauri exits
                println!("[Tauri] Window closing, backend will terminate.");
                let _ = window;
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_backend_port,
            pick_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
