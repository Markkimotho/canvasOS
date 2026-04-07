// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_stronghold::Builder::new(|password| {
            // Derive key from password using Argon2
            use argon2::Argon2;
            let salt = b"canvasos-keychain-salt"; // In production: store in OS keychain
            let mut key = vec![0u8; 32];
            Argon2::default()
                .hash_password_into(password.as_bytes(), salt, &mut key)
                .expect("Failed to derive key");
            key
        }).build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
