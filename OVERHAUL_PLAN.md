# DevDesk Overhaul Specification & Roadmap ⚡

This document outlines the architecture, database schema, services, CLI commands, and 4-phase roadmap for the DevDesk overhaul.

---

## 🏛️ Architecture Overview

```
Renderer (React 19 + TypeScript + Tailwind)
  ├── Zustand Stores (projects, ports, tasks, notes, roadmap, agent)
  ├── React Flow Mindmap (@xyflow/react)
  └── UI Components (ProjectGrid, PortInspector, KanbanBoard, ContextGenerator)
         ↕ Typed IPC via preload.cjs
Electron Main Process
  ├── ProjectService   → folder registration, package.json detection, dev script launch
  ├── PortService      → background polling (lsof/ss), /proc PID-to-directory mapping, kill process
  ├── GitService       → simple-git wrapper, branch/commits HUD, commit message task closing (#12)
  ├── NotesService     → "where we left off" notes, auto-snapshots on exit/switch
  ├── AgentService     → CLI session log parsers (opencode, claude-code, etc.), CONTEXT.md generator
  ├── McpServer        → local stdio MCP server for AI agents to query/update tasks & roadmap
  └── SQLite           → better-sqlite3 + Drizzle ORM in ~/.config/devdesk/devdesk.db
```

---

## 📅 Roadmap Phases

### 🔹 Phase 1: MVP (Core Projects & Live Ports) — ✅ Complete
- [x] **CLI Registration**: `devdesk add <path>` (e.g. `devdesk add .`) to register project folder into SQLite.
- [x] **Port Detection & Process Mapping**:
  - Polling `lsof` / `ss` every 3 seconds.
  - Resolving listening socket PIDs to project roots via `/proc/<pid>/cwd`.
  - Process metrics: PID, memory (RSS), CPU, uptime.
  - One-click Kill button (`SIGTERM` / `SIGKILL`).
- [x] **Git HUD**:
  - Current branch, clean/dirty working directory status.
  - Last 5 commits with relative timestamps.
- [x] **Project Dashboard**: Clean OLED Tokyo Night card/table layout of all tracked projects.

### 🔹 Phase 2: “Where We Left Off” Engine — ✅ Complete
- [x] **Per-Project Daily Notes**: Last task, next step, active blockers.
- [x] **Auto-Snapshots**: On exit or workspace switch, capture last commit, uncommitted file count, and active listening ports.
- [x] **`devdesk resume` CLI**: Terminal output summarizing where you stopped and what's next.
- [x] **One-Click Dev Server**: Detect `scripts.dev` / `start` in `package.json` and provide one-click start/stop.

### 🔹 Phase 3: Roadmap & Task Management — 🟡 In Progress
- [x] **Kanban Board**: Todo / Doing / Done task management (implemented in TaskTrackerView).
- [ ] **React Flow Mindmap**: Interactive tree (Project → Features → Tasks) using `@xyflow/react`.
- [ ] **Git Commit Task Automation**: Closing tasks via `#<id>` in commit messages.

### 🔹 Phase 4: AI-Agent Integration & MCP Server (Standout Feature) — ⚪ Planned
- [ ] **AI Session Log Parser**: Read local session logs from OpenCode, Claude Code, Aider, etc., to display "What the agent did last".
- [ ] **`CONTEXT.md` / Resume Prompt Generator**: One-click prompt synthesis for pasting into AI agents.
- [ ] **DevDesk MCP Server**: Local stdio Model Context Protocol server exposing roadmap, task lists, and context directly to AI coding agents.

---

## 🛠️ CLI Interface (`bin/devdesk.js`)

- `devdesk add [path]` - Register folder as project
- `devdesk resume [project]` - Show where you left off
- `devdesk list` - List registered projects and active ports
- `devdesk run` - Run project dev script
- `devdesk mcp` - Launch MCP server for AI agents
