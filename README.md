# ⚡ Whiplash

**The Claude Code CLI Manager for Parallel Development**

Whiplash transforms how you work with Claude Code by enabling **parallel AI development** across isolated git worktrees. Instead of blocking sequential work, run multiple Claude Code instances simultaneously while preventing conflicts.

## 🎯 Core Value Proposition

**Claude Code CLI** → One AI agent, one task at a time, potential conflicts  
**Whiplash** → Multiple AI agents, parallel development, conflict prevention

## ✨ Why Choose Whiplash Over Plain Claude Code CLI?

### 🚀 **Parallel Development**
- **Multiple Claude Code instances** running simultaneously
- **Isolated git worktrees** prevent conflicts between parallel work
- **Task orchestration** across frontend, backend, and feature development

### 🔍 **Intelligent Conflict Prevention**
- **Real-time overlap analysis** shows which files are being modified
- **Risk assessment** (High/Medium/Low) for potential merge conflicts
- **Smart recommendations** for coordinating parallel development

### 📈 **Visual Timeline & Insights**
- **Interactive network visualization** of codebase changes over time
- **Sequential vs parallel development** patterns clearly displayed
- **Dependency tracking** shows how changes propagate across worktrees

### 🎛️ **Centralized Management**
- **Single dashboard** to monitor all Claude Code processes
- **Real-time task output** streaming and logging
- **One-click worktree creation** with automatic branch management

## 🎬 What Whiplash Does

1. **Creates isolated git worktrees** for each Claude Code session
2. **Launches Claude Code processes** in separate environments  
3. **Monitors file overlaps** and potential conflicts in real-time
4. **Visualizes development timeline** showing parallel vs sequential work
5. **Provides conflict resolution guidance** before merging

## 🚀 Quick Start

### Prerequisites
- Git repository
- Claude Code CLI installed
- Node.js 18+ and Rust (for desktop app)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/whiplash.git
cd whiplash

# Install dependencies
npm install

# Run as desktop app
npm run tauri dev

# Or run as web app
npm run dev
```

### Usage

1. **Enter your repository path** in the Whiplash interface
2. **Create worktrees** for different features/agents
3. **Start Claude Code tasks** in parallel across worktrees
4. **Monitor overlaps** and conflicts in real-time
5. **Use timeline visualization** to understand development patterns

## 🛠️ Use Cases

### 🎯 **Parallel Feature Development**
```
Frontend Agent → UI components (worktree: feature/ui)
Backend Agent  → API endpoints (worktree: feature/api)  
Whiplash      → Prevents conflicts in shared files
```

### 🔄 **Refactoring + New Features**
```
Refactor Agent → Code cleanup (worktree: refactor/cleanup)
Feature Agent  → New functionality (worktree: feature/new)
Whiplash      → Coordinates changes safely
```

### 🧪 **Experimentation**
```
Multiple approaches → Different worktrees
Compare results    → Timeline visualization
Merge best solution → Conflict-free integration
```

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Rust + Tauri for native performance
- **Git Integration**: git2-rs for worktree management
- **Visualization**: D3.js for timeline and network graphs
- **Process Management**: Tokio for async Claude Code execution

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Stop working sequentially. Start developing in parallel.** ⚡