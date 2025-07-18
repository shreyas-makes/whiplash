mod git_worktree;
mod claude_runner;
mod overlap_analyzer;

use git_worktree::*;
use claude_runner::*;
use overlap_analyzer::*;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            // Git worktree commands
            create_worktree,
            list_worktrees,
            delete_worktree,
            get_worktree_status,
            get_modified_files,
            // Claude runner commands
            start_claude_task,
            get_claude_task_status,
            list_claude_tasks,
            cancel_claude_task,
            cleanup_completed_claude_tasks,
            // Overlap analyzer commands
            analyze_worktree_overlaps,
            analyze_file_dependencies,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
