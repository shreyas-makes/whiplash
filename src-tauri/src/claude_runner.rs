use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tokio::process::Command as TokioCommand;
use tokio::io::{AsyncBufReadExt, BufReader};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use anyhow::{Result, anyhow};
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeTaskInfo {
    pub id: String,
    pub description: String,
    pub status: String,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub output: Vec<String>,
    pub working_directory: String,
    pub worktree_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeRunnerConfig {
    pub claude_command: String,
    pub max_concurrent_tasks: usize,
    pub timeout_seconds: u64,
}

impl Default for ClaudeRunnerConfig {
    fn default() -> Self {
        Self {
            claude_command: "claude".to_string(),
            max_concurrent_tasks: 3,
            timeout_seconds: 3600, // 1 hour
        }
    }
}

pub struct ClaudeRunner {
    config: ClaudeRunnerConfig,
    active_tasks: Arc<RwLock<HashMap<String, ClaudeTaskInfo>>>,
}

impl ClaudeRunner {
    pub fn new(config: ClaudeRunnerConfig) -> Self {
        Self {
            config,
            active_tasks: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn start_task(&self, worktree_name: &str, working_directory: &str, task_description: &str) -> Result<String> {
        let task_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let task_info = ClaudeTaskInfo {
            id: task_id.clone(),
            description: task_description.to_string(),
            status: "pending".to_string(),
            started_at: Some(now),
            completed_at: None,
            output: Vec::new(),
            working_directory: working_directory.to_string(),
            worktree_name: worktree_name.to_string(),
        };

        // Check if we've reached the maximum concurrent tasks
        {
            let tasks = self.active_tasks.read().await;
            let active_count = tasks.values().filter(|t| t.status == "running").count();
            if active_count >= self.config.max_concurrent_tasks {
                return Err(anyhow!("Maximum concurrent tasks reached"));
            }
        }

        // Add task to active tasks
        {
            let mut tasks = self.active_tasks.write().await;
            tasks.insert(task_id.clone(), task_info);
        }

        // Start the task in a separate tokio task
        let task_id_clone = task_id.clone();
        let working_directory = working_directory.to_string();
        let task_description = task_description.to_string();
        let claude_command = self.config.claude_command.clone();
        let timeout_seconds = self.config.timeout_seconds;
        let active_tasks = self.active_tasks.clone();

        tokio::spawn(async move {
            let result = Self::run_claude_task(
                &claude_command,
                &working_directory,
                &task_description,
                timeout_seconds,
                &task_id_clone,
                active_tasks.clone(),
            ).await;

            // Update task status
            let mut tasks = active_tasks.write().await;
            if let Some(task) = tasks.get_mut(&task_id_clone) {
                match result {
                    Ok(output) => {
                        task.status = "completed".to_string();
                        task.completed_at = Some(Utc::now());
                        task.output = output;
                    }
                    Err(e) => {
                        task.status = "failed".to_string();
                        task.completed_at = Some(Utc::now());
                        task.output.push(format!("Error: {}", e));
                    }
                }
            }
        });

        Ok(task_id)
    }

    async fn run_claude_task(
        claude_command: &str,
        working_directory: &str,
        task_description: &str,
        timeout_seconds: u64,
        task_id: &str,
        active_tasks: Arc<RwLock<HashMap<String, ClaudeTaskInfo>>>,
    ) -> Result<Vec<String>> {
        // Update task status to running
        {
            let mut tasks = active_tasks.write().await;
            if let Some(task) = tasks.get_mut(task_id) {
                task.status = "running".to_string();
            }
        }

        let mut cmd = TokioCommand::new(claude_command);
        cmd.arg(task_description)
            .current_dir(working_directory)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let mut child = cmd.spawn()?;
        let stdout = child.stdout.take().ok_or_else(|| anyhow!("Failed to open stdout"))?;
        let stderr = child.stderr.take().ok_or_else(|| anyhow!("Failed to open stderr"))?;

        let active_tasks_clone = active_tasks.clone();
        let task_id_clone = task_id.to_string();

        // Handle stdout
        let stdout_handle = tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            
            while let Ok(Some(line)) = lines.next_line().await {
                // Update task output in real-time
                {
                    let mut tasks = active_tasks_clone.write().await;
                    if let Some(task) = tasks.get_mut(&task_id_clone) {
                        task.output.push(line.clone());
                    }
                }
            }
        });

        // Handle stderr
        let active_tasks_clone2 = active_tasks.clone();
        let task_id_clone2 = task_id.to_string();
        let stderr_handle = tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            
            while let Ok(Some(line)) = lines.next_line().await {
                {
                    let mut tasks = active_tasks_clone2.write().await;
                    if let Some(task) = tasks.get_mut(&task_id_clone2) {
                        task.output.push(format!("stderr: {}", line));
                    }
                }
            }
        });

        // Wait for the process to complete with timeout
        let result = tokio::time::timeout(
            tokio::time::Duration::from_secs(timeout_seconds),
            child.wait()
        ).await;

        match result {
            Ok(Ok(status)) => {
                // Wait for all output to be processed
                let _ = tokio::join!(stdout_handle, stderr_handle);
                
                if status.success() {
                    // Get final output from task
                    let tasks = active_tasks.read().await;
                    if let Some(task) = tasks.get(task_id) {
                        Ok(task.output.clone())
                    } else {
                        Ok(vec!["Task completed successfully".to_string()])
                    }
                } else {
                    Err(anyhow!("Claude command failed with exit code: {}", status.code().unwrap_or(-1)))
                }
            }
            Ok(Err(e)) => Err(anyhow!("Failed to wait for Claude process: {}", e)),
            Err(_) => {
                // Timeout occurred, kill the process
                let _ = child.kill().await;
                Err(anyhow!("Claude command timed out after {} seconds", timeout_seconds))
            }
        }
    }

    pub async fn get_task_status(&self, task_id: &str) -> Result<ClaudeTaskInfo> {
        let tasks = self.active_tasks.read().await;
        tasks.get(task_id)
            .cloned()
            .ok_or_else(|| anyhow!("Task not found"))
    }

    pub async fn list_tasks(&self) -> Result<Vec<ClaudeTaskInfo>> {
        let tasks = self.active_tasks.read().await;
        Ok(tasks.values().cloned().collect())
    }

    pub async fn cancel_task(&self, task_id: &str) -> Result<()> {
        let mut tasks = self.active_tasks.write().await;
        if let Some(task) = tasks.get_mut(task_id) {
            if task.status == "running" {
                task.status = "cancelled".to_string();
                task.completed_at = Some(Utc::now());
                // Note: In a real implementation, we'd need to track the process handle
                // and kill it here
            }
        }
        Ok(())
    }

    pub async fn cleanup_completed_tasks(&self) -> Result<usize> {
        let mut tasks = self.active_tasks.write().await;
        let initial_count = tasks.len();
        
        tasks.retain(|_, task| {
            match task.status.as_str() {
                "completed" | "failed" | "cancelled" => {
                    // Keep tasks completed less than 1 hour ago
                    if let Some(completed_at) = task.completed_at {
                        let one_hour_ago = Utc::now() - chrono::Duration::hours(1);
                        completed_at > one_hour_ago
                    } else {
                        false
                    }
                }
                _ => true, // Keep pending and running tasks
            }
        });
        
        Ok(initial_count - tasks.len())
    }
}

// Global runner instance
static mut CLAUDE_RUNNER: Option<ClaudeRunner> = None;
static INIT: std::sync::Once = std::sync::Once::new();

fn get_claude_runner() -> &'static ClaudeRunner {
    unsafe {
        INIT.call_once(|| {
            CLAUDE_RUNNER = Some(ClaudeRunner::new(ClaudeRunnerConfig::default()));
        });
        CLAUDE_RUNNER.as_ref().unwrap()
    }
}

#[tauri::command]
pub async fn start_claude_task(
    worktree_name: String,
    working_directory: String,
    task_description: String,
) -> Result<String, String> {
    let runner = get_claude_runner();
    runner.start_task(&worktree_name, &working_directory, &task_description)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_claude_task_status(task_id: String) -> Result<ClaudeTaskInfo, String> {
    let runner = get_claude_runner();
    runner.get_task_status(&task_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_claude_tasks() -> Result<Vec<ClaudeTaskInfo>, String> {
    let runner = get_claude_runner();
    runner.list_tasks()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cancel_claude_task(task_id: String) -> Result<(), String> {
    let runner = get_claude_runner();
    runner.cancel_task(&task_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cleanup_completed_claude_tasks() -> Result<usize, String> {
    let runner = get_claude_runner();
    runner.cleanup_completed_tasks()
        .await
        .map_err(|e| e.to_string())
}