use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use anyhow::Result;
use chrono::{DateTime, Utc};
use crate::git_worktree::GitWorktreeManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileOverlapInfo {
    pub file_path: String,
    pub worktrees: Vec<String>,
    pub conflict_risk: String,
    pub last_modified: HashMap<String, DateTime<Utc>>,
    pub line_changes: HashMap<String, LineChangeInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineChangeInfo {
    pub lines_added: usize,
    pub lines_removed: usize,
    pub lines_modified: usize,
    pub change_regions: Vec<ChangeRegion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeRegion {
    pub start_line: usize,
    pub end_line: usize,
    pub change_type: String, // "added", "removed", "modified"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverlapAnalysisResult {
    pub total_overlaps: usize,
    pub file_overlaps: Vec<FileOverlapInfo>,
    pub risk_assessment: RiskAssessment,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAssessment {
    pub low: usize,
    pub medium: usize,
    pub high: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyInfo {
    pub file_path: String,
    pub dependencies: Vec<String>,
    pub dependents: Vec<String>,
    pub impact_score: f64,
}

pub struct OverlapAnalyzer {
    repo_path: PathBuf,
    git_manager: GitWorktreeManager,
}

impl OverlapAnalyzer {
    pub fn new(repo_path: impl AsRef<Path>) -> Result<Self> {
        let repo_path = repo_path.as_ref().to_path_buf();
        let git_manager = GitWorktreeManager::new(&repo_path)?;
        
        Ok(Self {
            repo_path,
            git_manager,
        })
    }

    pub fn analyze_overlaps(&self) -> Result<OverlapAnalysisResult> {
        let worktrees = self.git_manager.list_worktrees()?;
        let mut file_modifications: HashMap<String, Vec<String>> = HashMap::new();
        let mut file_overlaps = Vec::new();

        // Collect modified files from all worktrees
        for worktree in &worktrees {
            let modified_files = self.git_manager.get_modified_files(&worktree.name)?;
            
            for file_path in modified_files {
                file_modifications.entry(file_path)
                    .or_insert_with(Vec::new)
                    .push(worktree.name.clone());
            }
        }

        // Find files modified in multiple worktrees
        for (file_path, worktree_names) in file_modifications {
            if worktree_names.len() > 1 {
                let overlap_info = self.analyze_file_overlap(&file_path, &worktree_names)?;
                file_overlaps.push(overlap_info);
            }
        }

        // Calculate risk assessment
        let mut low_risk = 0;
        let mut medium_risk = 0;
        let mut high_risk = 0;

        for overlap in &file_overlaps {
            match overlap.conflict_risk.as_str() {
                "low" => low_risk += 1,
                "medium" => medium_risk += 1,
                "high" => high_risk += 1,
                _ => {}
            }
        }

        let risk_assessment = RiskAssessment {
            low: low_risk,
            medium: medium_risk,
            high: high_risk,
        };

        // Generate recommendations
        let recommendations = self.generate_recommendations(&file_overlaps);

        Ok(OverlapAnalysisResult {
            total_overlaps: file_overlaps.len(),
            file_overlaps,
            risk_assessment,
            recommendations,
        })
    }

    fn analyze_file_overlap(&self, file_path: &str, worktree_names: &[String]) -> Result<FileOverlapInfo> {
        let mut last_modified = HashMap::new();
        let mut line_changes = HashMap::new();
        let mut total_changes = 0;

        for worktree_name in worktree_names {
            let worktree_path = self.repo_path.join("worktrees").join(worktree_name);
            let full_file_path = worktree_path.join(file_path);

            if full_file_path.exists() {
                // Get file metadata
                let metadata = std::fs::metadata(&full_file_path)?;
                if let Ok(modified_time) = metadata.modified() {
                    let datetime: DateTime<Utc> = modified_time.into();
                    last_modified.insert(worktree_name.clone(), datetime);
                }

                // Analyze line changes (simplified - in real implementation, use git diff)
                let line_change_info = self.analyze_line_changes(&full_file_path)?;
                total_changes += line_change_info.lines_added + line_change_info.lines_removed + line_change_info.lines_modified;
                line_changes.insert(worktree_name.clone(), line_change_info);
            }
        }

        // Determine conflict risk based on changes and file type
        let conflict_risk = self.assess_conflict_risk(file_path, total_changes, worktree_names.len());

        Ok(FileOverlapInfo {
            file_path: file_path.to_string(),
            worktrees: worktree_names.to_vec(),
            conflict_risk,
            last_modified,
            line_changes,
        })
    }

    fn analyze_line_changes(&self, file_path: &Path) -> Result<LineChangeInfo> {
        // Simplified implementation - in reality, you'd use git diff
        // For now, we'll use basic file analysis
        
        let content = std::fs::read_to_string(file_path)?;
        let lines = content.lines().count();
        
        // Mock change analysis - in real implementation, use git diff
        let change_regions = vec![
            ChangeRegion {
                start_line: 1,
                end_line: lines.min(10),
                change_type: "modified".to_string(),
            }
        ];

        Ok(LineChangeInfo {
            lines_added: lines / 10,  // Mock data
            lines_removed: lines / 20, // Mock data
            lines_modified: lines / 15, // Mock data
            change_regions,
        })
    }

    fn assess_conflict_risk(&self, file_path: &str, total_changes: usize, worktree_count: usize) -> String {
        // Assess risk based on file type, changes, and number of worktrees
        let file_extension = Path::new(file_path)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");

        let base_risk = match file_extension {
            "rs" | "ts" | "js" | "py" | "go" | "java" => 2, // Code files have higher risk
            "json" | "yaml" | "toml" | "xml" => 3,          // Config files have highest risk
            "md" | "txt" => 1,                              // Documentation has lower risk
            _ => 2,
        };

        let change_risk = if total_changes > 100 { 2 } else if total_changes > 50 { 1 } else { 0 };
        let worktree_risk = if worktree_count > 3 { 2 } else if worktree_count > 2 { 1 } else { 0 };

        let total_risk = base_risk + change_risk + worktree_risk;

        match total_risk {
            0..=3 => "low".to_string(),
            4..=6 => "medium".to_string(),
            _ => "high".to_string(),
        }
    }

    fn generate_recommendations(&self, file_overlaps: &[FileOverlapInfo]) -> Vec<String> {
        let mut recommendations = Vec::new();

        if file_overlaps.is_empty() {
            recommendations.push("No file overlaps detected. All worktrees are working on separate files.".to_string());
            return recommendations;
        }

        let high_risk_count = file_overlaps.iter().filter(|o| o.conflict_risk == "high").count();
        let medium_risk_count = file_overlaps.iter().filter(|o| o.conflict_risk == "medium").count();

        if high_risk_count > 0 {
            recommendations.push(format!(
                "⚠️ {} files have high conflict risk. Consider coordinating changes or merging frequently.",
                high_risk_count
            ));
        }

        if medium_risk_count > 0 {
            recommendations.push(format!(
                "⚡ {} files have medium conflict risk. Review changes before merging.",
                medium_risk_count
            ));
        }

        // Find most problematic files
        let mut high_risk_files: Vec<&FileOverlapInfo> = file_overlaps
            .iter()
            .filter(|o| o.conflict_risk == "high")
            .collect();
        high_risk_files.sort_by(|a, b| b.worktrees.len().cmp(&a.worktrees.len()));

        if let Some(most_problematic) = high_risk_files.first() {
            recommendations.push(format!(
                "🔥 Most problematic file: {} (modified in {} worktrees)",
                most_problematic.file_path,
                most_problematic.worktrees.len()
            ));
        }

        // Suggest coordination strategies
        if file_overlaps.len() > 5 {
            recommendations.push(
                "💡 Consider splitting work into smaller, more focused branches to reduce overlap."
                    .to_string(),
            );
        }

        if file_overlaps.iter().any(|o| o.worktrees.len() > 3) {
            recommendations.push(
                "🤝 Some files are being modified in 3+ worktrees. Consider designating ownership."
                    .to_string(),
            );
        }

        recommendations
    }

    pub fn analyze_dependencies(&self, file_paths: &[String]) -> Result<Vec<DependencyInfo>> {
        let mut dependencies = Vec::new();

        for file_path in file_paths {
            let full_path = self.repo_path.join(file_path);
            if full_path.exists() {
                let dep_info = self.analyze_file_dependencies(&full_path)?;
                dependencies.push(dep_info);
            }
        }

        Ok(dependencies)
    }

    fn analyze_file_dependencies(&self, file_path: &Path) -> Result<DependencyInfo> {
        // Simplified dependency analysis
        // In a real implementation, you'd use tree-sitter or other AST parsers
        
        let content = std::fs::read_to_string(file_path)?;
        let mut dependencies = Vec::new();
        
        // Look for import statements (simplified)
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("import ") || trimmed.starts_with("use ") || trimmed.starts_with("require(") {
                // Extract dependency path (very simplified)
                if let Some(dep) = self.extract_dependency_path(trimmed) {
                    dependencies.push(dep);
                }
            }
        }

        // Calculate impact score based on number of dependencies and file size
        let impact_score = (dependencies.len() as f64) * 0.5 + (content.lines().count() as f64) * 0.1;

        Ok(DependencyInfo {
            file_path: file_path.to_string_lossy().to_string(),
            dependencies,
            dependents: Vec::new(), // Would need cross-reference analysis
            impact_score,
        })
    }

    fn extract_dependency_path(&self, line: &str) -> Option<String> {
        // Very simplified dependency extraction
        // In reality, you'd use proper parsers
        
        if line.contains("\"") {
            let parts: Vec<&str> = line.split('"').collect();
            if parts.len() >= 2 {
                return Some(parts[1].to_string());
            }
        }
        
        if line.contains("'") {
            let parts: Vec<&str> = line.split('\'').collect();
            if parts.len() >= 2 {
                return Some(parts[1].to_string());
            }
        }

        None
    }
}

#[tauri::command]
pub async fn analyze_worktree_overlaps(repo_path: String) -> Result<OverlapAnalysisResult, String> {
    let analyzer = OverlapAnalyzer::new(repo_path).map_err(|e| e.to_string())?;
    analyzer.analyze_overlaps().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn analyze_file_dependencies(
    repo_path: String,
    file_paths: Vec<String>,
) -> Result<Vec<DependencyInfo>, String> {
    let analyzer = OverlapAnalyzer::new(repo_path).map_err(|e| e.to_string())?;
    analyzer.analyze_dependencies(&file_paths).map_err(|e| e.to_string())
}