use git2::{Repository, Worktree};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use anyhow::{Result, anyhow};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitWorktreeInfo {
    pub id: String,
    pub name: String,
    pub branch: String,
    pub path: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
}

pub struct GitWorktreeManager {
    repo_path: PathBuf,
}

impl GitWorktreeManager {
    pub fn new(repo_path: impl AsRef<Path>) -> Result<Self> {
        Ok(Self {
            repo_path: repo_path.as_ref().to_path_buf(),
        })
    }

    pub fn create_worktree(&self, name: &str, branch: &str) -> Result<GitWorktreeInfo> {
        let repo = Repository::open(&self.repo_path)?;
        let worktree_path = self.repo_path.join("worktrees").join(name);
        
        // Create worktree directory if it doesn't exist
        std::fs::create_dir_all(&worktree_path)?;
        
        // Check if branch exists, create if not
        let branch_ref = format!("refs/heads/{}", branch);
        let branch_exists = repo.find_reference(&branch_ref).is_ok();
        
        if !branch_exists {
            // Create new branch from HEAD
            let head = repo.head()?;
            let target = head.target().ok_or_else(|| anyhow!("HEAD has no target"))?;
            let commit = repo.find_commit(target)?;
            repo.branch(branch, &commit, false)?;
        }
        
        // Create worktree
        let _worktree = repo.worktree(name, &worktree_path, None)?;
        
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        
        Ok(GitWorktreeInfo {
            id,
            name: name.to_string(),
            branch: branch.to_string(),
            path: worktree_path.to_string_lossy().to_string(),
            status: "active".to_string(),
            created_at: now,
            last_activity: now,
        })
    }

    pub fn list_worktrees(&self) -> Result<Vec<GitWorktreeInfo>> {
        let repo = Repository::open(&self.repo_path)?;
        let worktrees = repo.worktrees()?;
        let mut worktree_infos = Vec::new();
        
        for worktree_name in &worktrees {
            if let Some(name) = worktree_name {
                if let Ok(worktree) = repo.find_worktree(name) {
                    let path = worktree.path().to_string_lossy().to_string();
                    let branch = self.get_worktree_branch(&worktree)?;
                    
                    let info = GitWorktreeInfo {
                        id: Uuid::new_v4().to_string(), // TODO: Store persistent IDs
                        name: name.to_string(),
                        branch,
                        path,
                        status: if worktree.is_locked().is_ok() { "locked".to_string() } else { "active".to_string() },
                        created_at: Utc::now(), // TODO: Get actual creation time
                        last_activity: Utc::now(), // TODO: Get actual last activity
                    };
                    
                    worktree_infos.push(info);
                }
            }
        }
        
        Ok(worktree_infos)
    }

    pub fn delete_worktree(&self, name: &str) -> Result<()> {
        let repo = Repository::open(&self.repo_path)?;
        let worktree = repo.find_worktree(name)?;
        
        // Remove worktree files
        if let Ok(path) = worktree.path().canonicalize() {
            std::fs::remove_dir_all(path)?;
        }
        
        // Prune the worktree
        worktree.prune(None)?;
        
        Ok(())
    }

    pub fn get_worktree_status(&self, name: &str) -> Result<Vec<String>> {
        let repo = Repository::open(&self.repo_path)?;
        let worktree = repo.find_worktree(name)?;
        let worktree_path = worktree.path();
        
        let worktree_repo = Repository::open(worktree_path)?;
        let mut status_list = Vec::new();
        
        let statuses = worktree_repo.statuses(None)?;
        for entry in statuses.iter() {
            let status = entry.status();
            let file_path = entry.path().unwrap_or("unknown");
            
            let status_str = match status {
                s if s.is_wt_new() => format!("new: {}", file_path),
                s if s.is_wt_modified() => format!("modified: {}", file_path),
                s if s.is_wt_deleted() => format!("deleted: {}", file_path),
                s if s.is_wt_renamed() => format!("renamed: {}", file_path),
                s if s.is_wt_typechange() => format!("typechange: {}", file_path),
                s if s.is_index_new() => format!("staged new: {}", file_path),
                s if s.is_index_modified() => format!("staged modified: {}", file_path),
                s if s.is_index_deleted() => format!("staged deleted: {}", file_path),
                _ => format!("unknown: {}", file_path),
            };
            
            status_list.push(status_str);
        }
        
        Ok(status_list)
    }

    pub fn get_modified_files(&self, name: &str) -> Result<Vec<String>> {
        let repo = Repository::open(&self.repo_path)?;
        let worktree = repo.find_worktree(name)?;
        let worktree_path = worktree.path();
        
        let worktree_repo = Repository::open(worktree_path)?;
        let mut modified_files = Vec::new();
        
        let statuses = worktree_repo.statuses(None)?;
        for entry in statuses.iter() {
            let status = entry.status();
            if status.is_wt_modified() || status.is_wt_new() || status.is_index_modified() || status.is_index_new() {
                if let Some(file_path) = entry.path() {
                    modified_files.push(file_path.to_string());
                }
            }
        }
        
        Ok(modified_files)
    }

    fn get_worktree_branch(&self, worktree: &Worktree) -> Result<String> {
        let worktree_path = worktree.path();
        let worktree_repo = Repository::open(worktree_path)?;
        
        if let Ok(head) = worktree_repo.head() {
            if let Some(branch_name) = head.shorthand() {
                return Ok(branch_name.to_string());
            }
        }
        
        Ok("unknown".to_string())
    }
}

#[tauri::command]
pub async fn create_worktree(repo_path: String, name: String, branch: String) -> Result<GitWorktreeInfo, String> {
    let manager = GitWorktreeManager::new(repo_path).map_err(|e| e.to_string())?;
    manager.create_worktree(&name, &branch).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_worktrees(repo_path: String) -> Result<Vec<GitWorktreeInfo>, String> {
    let manager = GitWorktreeManager::new(repo_path).map_err(|e| e.to_string())?;
    manager.list_worktrees().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_worktree(repo_path: String, name: String) -> Result<(), String> {
    let manager = GitWorktreeManager::new(repo_path).map_err(|e| e.to_string())?;
    manager.delete_worktree(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_worktree_status(repo_path: String, name: String) -> Result<Vec<String>, String> {
    let manager = GitWorktreeManager::new(repo_path).map_err(|e| e.to_string())?;
    manager.get_worktree_status(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_modified_files(repo_path: String, name: String) -> Result<Vec<String>, String> {
    let manager = GitWorktreeManager::new(repo_path).map_err(|e| e.to_string())?;
    manager.get_modified_files(&name).map_err(|e| e.to_string())
}