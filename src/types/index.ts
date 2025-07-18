export interface GitWorktree {
  id: string;
  name: string;
  branch: string;
  path: string;
  status: 'active' | 'idle' | 'error';
  createdAt: Date;
  lastActivity: Date;
  claudeTask?: ClaudeTask;
}

export interface ClaudeTask {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  output: string[];
  workingDirectory: string;
}

export interface FileOverlap {
  filePath: string;
  worktrees: string[];
  conflictRisk: 'low' | 'medium' | 'high';
  lastModified: Record<string, Date>;
}

export interface CodeCoverage {
  filePath: string;
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  worktreeId: string;
}

export interface DependencyNode {
  id: string;
  name: string;
  type: 'file' | 'function' | 'class' | 'module';
  path: string;
  dependencies: string[];
  dependents: string[];
  impactScore: number;
}

export interface WorktreeStats {
  totalFiles: number;
  modifiedFiles: number;
  linesAdded: number;
  linesRemoved: number;
  testCoverage: number;
  conflictRisk: number;
}

export interface OverlapAnalysis {
  totalOverlaps: number;
  fileOverlaps: FileOverlap[];
  riskAssessment: {
    low: number;
    medium: number;
    high: number;
  };
  recommendations: string[];
}

export interface TauriCommand<T = any> {
  invoke: (command: string, args?: any) => Promise<T>;
}

export interface AppConfig {
  defaultClaudeCommand: string;
  maxWorktrees: number;
  autoCleanup: boolean;
  coverageThreshold: number;
}