import { useState, useEffect } from 'react';
import { invoke } from '../utils/tauri';
import { ClaudeTask } from '../types';

export interface UseClaudeCodeResult {
  tasks: ClaudeTask[];
  loading: boolean;
  error: string | null;
  startTask: (worktreeName: string, workingDirectory: string, description: string) => Promise<string>;
  cancelTask: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  getTaskStatus: (taskId: string) => Promise<ClaudeTask>;
  cleanupCompletedTasks: () => Promise<number>;
}

export function useClaudeCode(): UseClaudeCodeResult {
  const [tasks, setTasks] = useState<ClaudeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<any[]>('list_claude_tasks');
      
      const mappedTasks: ClaudeTask[] = result.map((task: any) => ({
        id: task.id,
        description: task.description,
        status: task.status as 'pending' | 'running' | 'completed' | 'failed',
        startedAt: task.started_at ? new Date(task.started_at) : undefined,
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        output: task.output,
        workingDirectory: task.working_directory,
      }));
      
      setTasks(mappedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Claude tasks');
    } finally {
      setLoading(false);
    }
  };

  const startTask = async (worktreeName: string, workingDirectory: string, description: string): Promise<string> => {
    try {
      setError(null);
      const taskId = await invoke<string>('start_claude_task', {
        worktreeName,
        workingDirectory,
        taskDescription: description,
      });
      
      // Refresh tasks to show the new task
      await refreshTasks();
      
      return taskId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start Claude task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const cancelTask = async (taskId: string) => {
    try {
      setError(null);
      await invoke('cancel_claude_task', { taskId });
      await refreshTasks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getTaskStatus = async (taskId: string): Promise<ClaudeTask> => {
    try {
      const result = await invoke<any>('get_claude_task_status', { taskId });
      
      return {
        id: result.id,
        description: result.description,
        status: result.status as 'pending' | 'running' | 'completed' | 'failed',
        startedAt: result.started_at ? new Date(result.started_at) : undefined,
        completedAt: result.completed_at ? new Date(result.completed_at) : undefined,
        output: result.output,
        workingDirectory: result.working_directory,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get task status';
      throw new Error(errorMessage);
    }
  };

  const cleanupCompletedTasks = async (): Promise<number> => {
    try {
      const cleanedCount = await invoke<number>('cleanup_completed_claude_tasks');
      await refreshTasks();
      return cleanedCount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup tasks';
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    refreshTasks();
    
    // Auto-refresh tasks every 5 seconds
    const interval = setInterval(refreshTasks, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    tasks,
    loading,
    error,
    startTask,
    cancelTask,
    refreshTasks,
    getTaskStatus,
    cleanupCompletedTasks,
  };
}