// Tauri API wrapper with fallback for web development
import { GitWorktree, ClaudeTask, OverlapAnalysis } from '../types';

// Check if we're running in Tauri or web
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

let tauriInvoke: any = null;
if (isTauri) {
  try {
    const { invoke: actualInvoke } = require('@tauri-apps/api/core');
    tauriInvoke = actualInvoke;
    console.log('✅ Tauri API detected - using real backend');
  } catch (e) {
    console.warn('Tauri API not available, using mock data');
  }
} else {
  console.log('🌐 Web mode detected - using mock data');
}

// Mock data for development
const mockWorktrees: GitWorktree[] = [
  {
    id: 'wt-1',
    name: 'frontend-feature',
    branch: 'feature/ui-components',
    path: '/tmp/frontend-feature',
    status: 'active',
    createdAt: new Date('2024-01-01T10:00:00'),
    lastActivity: new Date('2024-01-01T12:30:00'),
  },
  {
    id: 'wt-2',
    name: 'backend-api',
    branch: 'feature/auth-api',
    path: '/tmp/backend-api',
    status: 'active',
    createdAt: new Date('2024-01-01T09:30:00'),
    lastActivity: new Date('2024-01-01T11:45:00'),
  },
];

const mockTasks: ClaudeTask[] = [
  {
    id: 'task-1',
    description: 'Implement user authentication components',
    status: 'running',
    startedAt: new Date('2024-01-01T12:00:00'),
    output: [
      'Starting task...',
      'Creating Login component',
      'Adding form validation',
      'Implementing auth hooks',
    ],
    workingDirectory: '/tmp/frontend-feature',
  },
  {
    id: 'task-2',
    description: 'Add JWT authentication endpoints',
    status: 'completed',
    startedAt: new Date('2024-01-01T10:30:00'),
    completedAt: new Date('2024-01-01T11:45:00'),
    output: [
      'Task completed successfully',
      'Added /auth/login endpoint',
      'Added /auth/refresh endpoint',
      'Updated user types',
    ],
    workingDirectory: '/tmp/backend-api',
  },
];

const mockOverlapAnalysis: OverlapAnalysis = {
  totalOverlaps: 2,
  fileOverlaps: [
    {
      filePath: 'types/index.ts',
      worktrees: ['frontend-feature', 'backend-api'],
      conflictRisk: 'high',
      lastModified: {
        'frontend-feature': new Date('2024-01-01T12:30:00'),
        'backend-api': new Date('2024-01-01T11:45:00'),
      },
    },
    {
      filePath: 'package.json',
      worktrees: ['frontend-feature', 'backend-api'],
      conflictRisk: 'medium',
      lastModified: {
        'frontend-feature': new Date('2024-01-01T10:15:00'),
        'backend-api': new Date('2024-01-01T09:45:00'),
      },
    },
  ],
  riskAssessment: {
    low: 0,
    medium: 1,
    high: 1,
  },
  recommendations: [
    '⚠️ 1 files have high conflict risk. Consider coordinating changes or merging frequently.',
    '⚡ 1 files have medium conflict risk. Review changes before merging.',
    '🔥 Most problematic file: types/index.ts (modified in 2 worktrees)',
  ],
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function invoke<T>(command: string, args?: any): Promise<T> {
  if (tauriInvoke) {
    try {
      console.log(`🔧 Executing Tauri command: ${command}`, args);
      const result = await tauriInvoke(command, args);
      console.log(`✅ Tauri command ${command} succeeded:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Tauri command ${command} failed:`, error);
      console.warn(`Falling back to mock data for ${command}`);
    }
  }

  // Simulate network delay
  await delay(500 + Math.random() * 1000);

  // Mock implementations
  switch (command) {
    case 'list_worktrees':
      return mockWorktrees as T;

    case 'create_worktree':
      const newWorktree: GitWorktree = {
        id: `wt-${Date.now()}`,
        name: args.name,
        branch: args.branch,
        path: `/tmp/${args.name}`,
        status: 'active',
        createdAt: new Date(),
        lastActivity: new Date(),
      };
      mockWorktrees.push(newWorktree);
      return newWorktree as T;

    case 'delete_worktree':
      const index = mockWorktrees.findIndex(wt => wt.name === args.name);
      if (index !== -1) {
        mockWorktrees.splice(index, 1);
      }
      return undefined as T;

    case 'get_worktree_status':
      return ['modified: src/App.tsx', 'new: src/components/NewComponent.tsx'] as T;

    case 'get_modified_files':
      return ['src/App.tsx', 'src/components/NewComponent.tsx', 'types/index.ts'] as T;

    case 'list_claude_tasks':
      return mockTasks as T;

    case 'start_claude_task':
      const newTask: ClaudeTask = {
        id: `task-${Date.now()}`,
        description: args.taskDescription,
        status: 'running',
        startedAt: new Date(),
        output: ['Task started...', 'Analyzing codebase...'],
        workingDirectory: args.workingDirectory,
      };
      mockTasks.push(newTask);
      
      // Simulate task completion after 5 seconds
      setTimeout(() => {
        newTask.status = 'completed';
        newTask.completedAt = new Date();
        newTask.output.push('Task completed successfully!');
      }, 5000);
      
      return newTask.id as T;

    case 'get_claude_task_status':
      const task = mockTasks.find(t => t.id === args.taskId);
      return task as T;

    case 'cancel_claude_task':
      const taskToCancel = mockTasks.find(t => t.id === args.taskId);
      if (taskToCancel) {
        taskToCancel.status = 'failed';
        taskToCancel.completedAt = new Date();
        taskToCancel.output.push('Task cancelled by user');
      }
      return undefined as T;

    case 'cleanup_completed_claude_tasks':
      const beforeCount = mockTasks.length;
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Remove completed tasks older than 1 hour
      for (let i = mockTasks.length - 1; i >= 0; i--) {
        const task = mockTasks[i];
        if (task.status === 'completed' && task.completedAt && task.completedAt < oneHourAgo) {
          mockTasks.splice(i, 1);
        }
      }
      
      return (beforeCount - mockTasks.length) as T;

    case 'analyze_worktree_overlaps':
      return mockOverlapAnalysis as T;

    case 'analyze_file_dependencies':
      return [
        {
          file_path: 'src/App.tsx',
          dependencies: ['./components/Header', './hooks/useAuth'],
          dependents: [],
          impact_score: 8.5,
        },
        {
          file_path: 'types/index.ts',
          dependencies: [],
          dependents: ['src/App.tsx', 'src/components/UserList.tsx'],
          impact_score: 9.2,
        },
      ] as T;

    default:
      console.warn(`Mock implementation not found for command: ${command}`);
      throw new Error(`Command ${command} not implemented in mock mode`);
  }
}