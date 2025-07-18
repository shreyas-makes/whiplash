import React, { useState } from 'react';
import { ClaudeTask } from '../types';
import { useClaudeCode } from '../hooks/useClaudeCode';

export const TaskMonitor: React.FC = () => {
  const { tasks, loading, error, cancelTask, cleanupCompletedTasks } = useClaudeCode();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: ClaudeTask['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ClaudeTask['status']) => {
    switch (status) {
      case 'running':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return date.toLocaleString();
  };

  const getDuration = (startedAt: Date | undefined, completedAt: Date | undefined) => {
    if (!startedAt) return 'N/A';
    const end = completedAt || new Date();
    const diff = end.getTime() - startedAt.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await cancelTask(taskId);
    } catch (error) {
      console.error('Failed to cancel task:', error);
    }
  };

  const handleCleanupTasks = async () => {
    try {
      const cleanedCount = await cleanupCompletedTasks();
      console.log(`Cleaned up ${cleanedCount} completed tasks`);
    } catch (error) {
      console.error('Failed to cleanup tasks:', error);
    }
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
        <div className="text-red-600 font-medium">Error loading tasks</div>
        <div className="text-red-500 text-sm mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">Claude Tasks</h2>
        <button
          onClick={handleCleanupTasks}
          className="btn-secondary"
        >
          Cleanup Completed
        </button>
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <div className="card text-center text-secondary-500">
            <p>No active tasks. Start a task from a worktree to see it here.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
                    <div className="text-white">
                      {getStatusIcon(task.status)}
                    </div>
                    <span className="text-sm font-medium text-secondary-700 capitalize">{task.status}</span>
                  </div>
                  
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-1">{task.description}</h3>
                    <div className="text-sm text-secondary-600">
                      Directory: <span className="font-mono text-xs">{task.workingDirectory}</span>
                    </div>
                  </div>

                  <div className="text-sm text-secondary-600 space-y-1">
                    <div>Started: {formatDate(task.startedAt)}</div>
                    {task.completedAt && (
                      <div>Completed: {formatDate(task.completedAt)}</div>
                    )}
                    <div>Duration: {getDuration(task.startedAt, task.completedAt)}</div>
                  </div>

                  {task.output.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleTaskExpansion(task.id)}
                        className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                      >
                        {expandedTasks.has(task.id) ? 'Hide' : 'Show'} Output
                        <svg 
                          className={`w-4 h-4 transition-transform ${expandedTasks.has(task.id) ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {expandedTasks.has(task.id) && (
                        <div className="mt-2 bg-secondary-100 rounded p-3 max-h-64 overflow-y-auto">
                          <pre className="text-xs font-mono text-secondary-800 whitespace-pre-wrap">
                            {task.output.join('\n')}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="ml-4 flex gap-2">
                  {task.status === 'running' && (
                    <button
                      onClick={() => handleCancelTask(task.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Cancel task"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};