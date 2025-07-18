import React, { useState } from 'react';
import { GitWorktree } from '../types';
import { useWorktrees } from '../hooks/useWorktrees';
import { useClaudeCode } from '../hooks/useClaudeCode';

interface WorktreeListProps {
  repoPath: string;
}

export const WorktreeList: React.FC<WorktreeListProps> = ({ repoPath }) => {
  const { worktrees, loading, error, createWorktree, deleteWorktree, refreshWorktrees } = useWorktrees(repoPath);
  const { startTask } = useClaudeCode();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorktreeName, setNewWorktreeName] = useState('');
  const [newWorktreeBranch, setNewWorktreeBranch] = useState('');
  const [taskDescriptions, setTaskDescriptions] = useState<Record<string, string>>({});

  const handleCreateWorktree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorktreeName || !newWorktreeBranch) return;

    try {
      await createWorktree(newWorktreeName, newWorktreeBranch);
      setNewWorktreeName('');
      setNewWorktreeBranch('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create worktree:', error);
    }
  };

  const handleDeleteWorktree = async (name: string) => {
    if (window.confirm(`Are you sure you want to delete worktree "${name}"?`)) {
      try {
        await deleteWorktree(name);
      } catch (error) {
        console.error('Failed to delete worktree:', error);
      }
    }
  };

  const handleStartTask = async (worktree: GitWorktree) => {
    const description = taskDescriptions[worktree.id];
    if (!description) return;

    try {
      await startTask(worktree.name, worktree.path, description);
      setTaskDescriptions(prev => ({ ...prev, [worktree.id]: '' }));
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const getStatusColor = (status: GitWorktree['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="text-red-600 font-medium">Error loading worktrees</div>
        <div className="text-red-500 text-sm mt-1">{error}</div>
        <button
          onClick={refreshWorktrees}
          className="btn-secondary mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">Worktrees</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          Create Worktree
        </button>
      </div>

      {showCreateForm && (
        <div className="card bg-primary-50 border-primary-200">
          <form onSubmit={handleCreateWorktree} className="space-y-4">
            <div>
              <label htmlFor="worktree-name" className="block text-sm font-medium text-secondary-700 mb-1">
                Worktree Name
              </label>
              <input
                id="worktree-name"
                type="text"
                value={newWorktreeName}
                onChange={(e) => setNewWorktreeName(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., feature-auth"
                required
              />
            </div>
            <div>
              <label htmlFor="branch-name" className="block text-sm font-medium text-secondary-700 mb-1">
                Branch Name
              </label>
              <input
                id="branch-name"
                type="text"
                value={newWorktreeBranch}
                onChange={(e) => setNewWorktreeBranch(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., feature/auth-system"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {worktrees.length === 0 ? (
          <div className="card text-center text-secondary-500">
            <p>No worktrees found. Create your first worktree to get started.</p>
          </div>
        ) : (
          worktrees.map((worktree) => (
            <div key={worktree.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(worktree.status)}`}></div>
                    <h3 className="text-lg font-semibold text-secondary-900">{worktree.name}</h3>
                    <span className="text-sm text-secondary-500">({worktree.branch})</span>
                  </div>
                  
                  <div className="text-sm text-secondary-600 space-y-1">
                    <div>Path: <span className="font-mono text-xs">{worktree.path}</span></div>
                    <div>Created: {formatDate(worktree.createdAt)}</div>
                    <div>Last activity: {formatDate(worktree.lastActivity)}</div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={taskDescriptions[worktree.id] || ''}
                        onChange={(e) => setTaskDescriptions(prev => ({ ...prev, [worktree.id]: e.target.value }))}
                        className="input-field flex-1"
                        placeholder="Describe a task for Claude..."
                      />
                      <button
                        onClick={() => handleStartTask(worktree)}
                        disabled={!taskDescriptions[worktree.id]}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Start Task
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => handleDeleteWorktree(worktree.name)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete worktree"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};