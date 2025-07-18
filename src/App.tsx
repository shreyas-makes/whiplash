import { useState } from "react";
import "./App.css";
import { WorktreeList } from "./components/WorktreeList";
import { TaskMonitor } from "./components/TaskMonitor";
import { OverlapMatrix } from "./components/OverlapMatrix";
import { TimelineVisualization } from "./components/TimelineVisualization";

function App() {
  const [activeTab, setActiveTab] = useState<'worktrees' | 'tasks' | 'overlaps' | 'timeline'>('worktrees');
  const [repoPath, setRepoPath] = useState<string>('');

  const tabs = [
    { id: 'worktrees', label: 'Worktrees', icon: '🌳' },
    { id: 'tasks', label: 'Tasks', icon: '🤖' },
    { id: 'overlaps', label: 'Overlaps', icon: '🔍' },
    { id: 'timeline', label: 'Timeline', icon: '📈' },
  ] as const;

  const handleRepoPathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Repository path is set, no additional action needed
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚡</div>
              <h1 className="text-2xl font-bold text-secondary-900">Whiplash</h1>
              <span className="text-sm text-secondary-500">Claude Code CLI Manager</span>
            </div>
            
            <form onSubmit={handleRepoPathSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                placeholder="Enter repository path..."
                className="input-field w-64"
              />
              <button type="submit" className="btn-primary">
                Set Path
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!repoPath ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-2xl font-bold text-secondary-900 mb-2">Welcome to Whiplash</h2>
            <p className="text-secondary-600 mb-4">
              Enter a repository path above to start managing your Claude Code worktrees
            </p>
            <div className="text-sm text-secondary-500">
              Example: /Users/username/projects/my-repo
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'worktrees' && <WorktreeList repoPath={repoPath} />}
            {activeTab === 'tasks' && <TaskMonitor />}
            {activeTab === 'overlaps' && <OverlapMatrix repoPath={repoPath} />}
            {activeTab === 'timeline' && <TimelineVisualization repoPath={repoPath} />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;