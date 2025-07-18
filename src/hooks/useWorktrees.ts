import { useState, useEffect } from 'react';
import { invoke } from '../utils/tauri';
import { GitWorktree } from '../types';

export interface UseWorktreesResult {
  worktrees: GitWorktree[];
  loading: boolean;
  error: string | null;
  createWorktree: (name: string, branch: string) => Promise<void>;
  deleteWorktree: (name: string) => Promise<void>;
  refreshWorktrees: () => Promise<void>;
}

export function useWorktrees(repoPath: string): UseWorktreesResult {
  const [worktrees, setWorktrees] = useState<GitWorktree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWorktrees = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<any[]>('list_worktrees', { repoPath });
      
      const mappedWorktrees: GitWorktree[] = result.map((wt: any) => ({
        id: wt.id,
        name: wt.name,
        branch: wt.branch,
        path: wt.path,
        status: wt.status as 'active' | 'idle' | 'error',
        createdAt: new Date(wt.created_at),
        lastActivity: new Date(wt.last_activity),
      }));
      
      setWorktrees(mappedWorktrees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load worktrees');
    } finally {
      setLoading(false);
    }
  };

  const createWorktree = async (name: string, branch: string) => {
    try {
      setError(null);
      await invoke('create_worktree', { repoPath, name, branch });
      await refreshWorktrees();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create worktree';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteWorktree = async (name: string) => {
    try {
      setError(null);
      await invoke('delete_worktree', { repoPath, name });
      await refreshWorktrees();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete worktree';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (repoPath) {
      refreshWorktrees();
    }
  }, [repoPath]);

  return {
    worktrees,
    loading,
    error,
    createWorktree,
    deleteWorktree,
    refreshWorktrees,
  };
}