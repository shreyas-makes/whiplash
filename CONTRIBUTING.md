# 🤝 Contributing to Whiplash

Thank you for your interest in contributing to Whiplash! This guide will help you get started with contributing to the Claude Code CLI Manager for parallel development.

## 🚀 Quick Start for Contributors

### Prerequisites
- **Node.js 18+** and **npm**
- **Rust** (install via [rustup](https://rustup.rs/))
- **Git** and familiarity with git worktrees
- **Claude Code CLI** for testing

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/whiplash.git
cd whiplash

# Install dependencies
npm install

# Start development server
npm run tauri dev  # For desktop app
# OR
npm run dev        # For web-only development
```

## 📋 Types of Contributions Welcome

### 🐛 **Bug Reports**
- **Real git worktree issues** (creation, deletion, status)
- **Claude Code process management** problems
- **UI/UX issues** in the interface
- **Performance problems** with large repositories

### ✨ **Feature Requests**
- **New visualization types** for development patterns
- **Additional conflict detection** algorithms
- **Integration improvements** with Claude Code CLI
- **Better worktree management** workflows

### 🔧 **Code Contributions**
- **Rust backend improvements** (git operations, process management)
- **React frontend enhancements** (UI components, visualizations)
- **Performance optimizations**
- **Test coverage improvements**

## 🏗️ Architecture Overview

Understanding the codebase structure will help you contribute effectively:

### **Frontend (React + TypeScript)**
```
src/
├── components/          # React UI components
│   ├── WorktreeList.tsx        # Worktree management
│   ├── TaskMonitor.tsx         # Claude Code task monitoring
│   ├── OverlapMatrix.tsx       # Conflict visualization
│   └── TimelineVisualization.tsx # Development timeline
├── hooks/               # Custom React hooks
│   ├── useWorktrees.ts         # Worktree operations
│   ├── useClaudeCode.ts        # Claude Code process management
│   └── useOverlapAnalysis.ts   # Conflict detection
├── types/               # TypeScript interfaces
└── utils/               # Utilities and Tauri API wrapper
```

### **Backend (Rust + Tauri)**
```
src-tauri/src/
├── git_worktree.rs      # Git worktree operations
├── claude_runner.rs     # Claude Code process management
├── overlap_analyzer.rs  # File conflict detection
└── lib.rs              # Tauri command registration
```

## 📝 Development Guidelines

### **Code Style**
- **Frontend**: Use TypeScript strictly, follow existing component patterns
- **Backend**: Follow Rust conventions, use `cargo fmt` and `cargo clippy`
- **Commits**: Use conventional commit format: `feat:`, `fix:`, `docs:`, etc.

### **Testing Strategy**
- **Unit tests** for critical git operations
- **Integration tests** for Tauri commands
- **Manual testing** with real repositories
- **Mock data** for UI development (see `src/utils/tauri.ts`)

### **Performance Considerations**
- **Git operations** should be async and non-blocking
- **Large repositories** should not freeze the UI
- **Real-time updates** should be debounced appropriately

## 🔄 Contribution Workflow

### 1. **Issue Discussion**
- **Check existing issues** before creating new ones
- **Discuss approach** for significant features
- **Get feedback** on proposed changes

### 2. **Development Process**
```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Test thoroughly with real repositories

# Commit with conventional format
git commit -m "feat: add timeline export functionality"

# Push and create PR
git push origin feature/your-feature-name
```

### 3. **Pull Request Guidelines**
- **Clear title** describing the change
- **Detailed description** of what and why
- **Screenshots/demos** for UI changes
- **Test instructions** for reviewers
- **Link related issues** with "Closes #123"

## 🧪 Testing Your Changes

### **Manual Testing Checklist**
- [ ] **Worktree creation** works with real git repositories
- [ ] **Claude Code processes** start and monitor correctly
- [ ] **Overlap detection** identifies real file conflicts
- [ ] **Timeline visualization** renders without errors
- [ ] **Both desktop and web modes** function properly

### **Test with Real Scenarios**
- **Large repositories** (100+ files)
- **Active development** (existing worktrees)
- **Different git configurations**
- **Various Claude Code tasks**

## 🐛 Reporting Issues

### **Bug Report Template**
```markdown
**Environment:**
- OS: [macOS/Windows/Linux]
- Node.js version: 
- Rust version:
- Repository size: [small/medium/large]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Additional Context:**
- Console logs (if applicable)
- Screenshots (for UI issues)
- Repository type (public/private, language)
```

## 💡 Feature Request Template

```markdown
**Problem Statement:**
What challenge does this solve for Claude Code users?

**Proposed Solution:**
How should this work?

**Use Case:**
When would someone use this feature?

**Implementation Ideas:**
Any technical suggestions?
```

## 🎯 Priority Areas for Contribution

### **High Impact**
- **Git worktree stability** improvements
- **Claude Code integration** enhancements
- **Performance optimizations** for large repos
- **Error handling** and user feedback

### **Nice to Have**
- **Additional visualizations**
- **Export/reporting features**
- **Advanced conflict resolution**
- **Plugin architecture**

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and brainstorming
- **Code Review**: We'll provide feedback on all PRs

## 🏆 Recognition

Contributors will be:
- **Listed in README** acknowledgments
- **Tagged in release notes** for significant contributions
- **Invited to maintainer discussions** for regular contributors

---

**Ready to contribute?** Start by exploring the codebase and trying it with your own repositories! Every contribution helps make parallel AI development better for everyone. ⚡