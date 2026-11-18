# DevDesk — Project Status & Development Roadmap ⚡

> **Current Milestone**: Phase 2 Complete → Entering Phase 3  
> **Overall Overhaul Completion**: **58%** (2 of 4 Phases fully complete + Core Shell)  
> **Status**: 🟢 **Active Development** — Foundation, Core MVP, and "Where We Left Off" engines are functional and building cleanly.

---

## 🚦 Executive Summary: "Where Are We?"

### Are We Done?
**No, we are not fully done yet.** We have successfully completed **Phase 1 (Core MVP)** and **Phase 2 (“Where We Left Off” Engine)**. The application is completely functional as a native developer HUD with live port detection, Git telemetry, process management, note persistence, and dev server launching.

What remains are **Phase 3 (Visual Mindmap & Commit Task Closing)** and **Phase 4 (AI Agent Log Parser, Context Generator & Local MCP Server)**.

```
[█████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░] 58% Complete
Phase 1: Core MVP (100%)       Phase 2: Left Off Engine (100%)
Phase 3: Task & Mindmap (35%)  Phase 4: AI & MCP Server (0%)
```

---

## 📦 What Have We Made? (Complete Inventory)

### 1. 🗄️ Database & Persistence Layer (SQLite + Drizzle ORM)
- **Database Location**: Local SQLite with Write-Ahead Logging (WAL) in `~/.config/devdesk/devdesk.db`.
- **Tables Implemented**:
  - `workspaces` / `projects`: Project directory paths, package managers, default dev commands, environment variables, branch mappings.
  - `tasks`: Backlog, priority (`urgent`, `high`, `medium`, `low`), tags, status (`backlog`, `todo`, `in_progress`, `in_review`, `done`).
  - `task_history`: Granular audit trail for task creation, status changes, and priority updates.
  - `project_notes`: Per-project "Where We Left Off" daily notes (`last_task`, `next_step`, `blockers`).
  - `snapshots`: Time-stamped state capture (`commit_hash`, `commit_message`, `branch`, `uncommitted_count`, `active_ports_json`).
  - `settings` & `credentials`: System preferences and encrypted OS Keychain credentials.

### 2. ⚡ Electron Backend Services (`electron/services/`)
- **`ProjectService.cjs`**: Auto-detects project ecosystem (`npm`, `pnpm`, `yarn`, `bun`, `cargo`, `python`, `go`), parses scripts in `package.json`, reads Git metadata.
- **`PortService.cjs`**: Scans host network listening sockets via `lsof` and `ss`. Resolves listening sockets to project folders via `/proc/<pid>/cwd`. Calculates process RSS memory and uptime. Provides one-click process termination (`SIGTERM`/`SIGKILL`).
- **`GitService.cjs`**: Porcelain Git bridge reporting active branch, ahead/behind status, staged/unstaged/untracked counts, and last 5 commits with relative timestamps.
- **`NotesService.cjs`**: Manages per-project session notes, creates instant project snapshots, and triggers auto-snapshots across all projects on app shutdown.
- **`DevServerService.cjs`**: Managed child process lifecycle for background dev servers (`npm run dev`, `cargo run`, etc.) with process group termination.

### 3. 🖥️ Native Desktop UI Views (`src/components/views/`)
- **Projects Dashboard (`ProjectListView.tsx`)**:
  - OLED Tokyo Night card layout showing all registered repositories.
  - Live process telemetry: mapped listening ports, PID, process name, uptime, RAM consumption.
  - One-click Dev Server Start/Stop button with live PID indicator.
  - "Where We Left Off" expandable notes editor with auto-save.
  - Instant snapshot camera trigger with relative snapshot age indicator.
  - Quick process killer and one-click path copying.
- **Task Tracker (`TaskTrackerView.tsx`)**:
  - Kanban sprint board & tabular list views.
  - Multi-column drag/move (`Backlog` → `Todo` → `In Progress` → `In Review` → `Done`).
  - Audit history drawer recording every transition.
- **Git HUD (`GitHudView.tsx`)**:
  - Worktree status, staged/unstaged file lists, visual syntax-highlighted diffs.
  - Branch switcher and one-click branch creation.
  - Conventional commit composer with push support.
- **Ports & PIDs Inspector (`PortInspectorView.tsx`)**:
  - Full-system TCP/UDP socket scanner and process termination.
- **PTY Terminal (`TerminalView.tsx` & `TerminalDrawer.tsx`)**:
  - Hardware-accelerated Xterm.js terminal running real Linux `/bin/bash` via `node-pty`.
  - Available as both a fullscreen view and a slide-up drawer (`Ctrl + \``).
- **Offline DevTools (`DevToolsView.tsx`)**:
  - JSON Formatter, JWT Token Inspector, Base64 encoder/decoder, and Regex Playground.
- **Markdown Scratchpad (`ScratchpadView.tsx`)**:
  - Ephemeral notes with auto-saving and `.md` export.
- **Spotlight Command Palette (`Ctrl + K`)**:
  - Raycast/Alfred-style quick switcher across all views, workspaces, and actions.

### 4. ⌨️ CLI Interface (`bin/devdesk.js`)
Available directly in the terminal:
- `devdesk add [path] [name]` — Register any directory into DevDesk.
- `devdesk resume [project]` — CLI summary of branch, last commit, dirty files, listening ports, and last task/next step/blockers.
- `devdesk run [project]` — Spin up the project's dev server directly in the terminal.
- `devdesk list` / `devdesk ls` — Display all tracked projects, branches, and active ports.
- `devdesk ports` — Display all active listening sockets mapped to registered projects.

---

## 🗺️ 4-Phase Roadmap: Status Breakdown

| Phase | Description | Status | Progress |
| :--- | :--- | :---: | :---: |
| **Phase 1** | **Core Projects & Live Ports (MVP)** | ✅ Completed | 100% |
| **Phase 2** | **“Where We Left Off” Engine** | ✅ Completed | 100% |
| **Phase 3** | **Roadmap & Interactive Mindmap** | 🟡 In Progress | 35% |
| **Phase 4** | **AI Agent Integration & MCP Server** | ⚪ Not Started | 0% |

---

## 🔍 Detailed Checklist

### 🔹 Phase 1: MVP (Core Projects & Live Ports) — ✅ 100% Complete
- [x] **CLI Registration**: `devdesk add <path>` registers project into SQLite.
- [x] **Port Detection & Process Mapping**:
  - [x] Polling `lsof` / `ss` every 3–4 seconds.
  - [x] Mapping socket PIDs to project roots via `/proc/<pid>/cwd`.
  - [x] Process telemetry: PID, RSS memory (MB), uptime, protocol.
  - [x] One-click kill button (`SIGTERM` / `SIGKILL`).
- [x] **Git HUD Integration**:
  - [x] Branch name, ahead/behind upstream status.
  - [x] Clean/dirty working tree count (staged, unstaged, untracked).
  - [x] Last 5 commits with relative timestamps.
- [x] **Project Dashboard**: Clean Tokyo Night card grid of all registered projects.

### 🔹 Phase 2: “Where We Left Off” Engine — ✅ 100% Complete
- [x] **Per-Project Daily Notes**: Last task, next step, active blockers stored in `project_notes`.
- [x] **Auto-Snapshots**:
  - [x] Captured on exit, workspace switch, or manual camera click.
  - [x] Records commit hash, uncommitted file count, and listening ports in `snapshots`.
- [x] **`devdesk resume` CLI Command**: Terminal card summarizing where you stopped and what's next.
- [x] **One-Click Dev Server**:
  - [x] Auto-detection of `scripts.dev` / `start` in `package.json` (and Cargo/Go/Python).
  - [x] Background child process management with PID tracking and one-click start/stop.
  - [x] `devdesk run` CLI command to start server from terminal.

### 🔹 Phase 3: Roadmap & Task Management — 🟡 ~35% Complete
- [x] **Kanban Board**: Todo / In Progress / Done sprint board in `TaskTrackerView.tsx`.
- [ ] **React Flow Mindmap**: Interactive visual node tree (Project → Epics → Features → Tasks) using `@xyflow/react`.
- [ ] **Project-Embedded Task List**: Integrate tasks directly into the `ProjectListView` project cards.
- [ ] **Git Commit Task Automation**: Automatically closing or transitioning tasks when commit messages mention `#<task-id>` (e.g. `feat: fix auth #12`).

### 🔹 Phase 4: AI-Agent Integration & MCP Server — ⚪ 0% Complete
- [ ] **AI Session Log Parser**:
  - Detect local agent sessions from Claude Code (`~/.claude/`), OpenCode (`.open-code/`), Aider, etc.
  - Display "What the AI agent did last" in the project card.
- [ ] **`CONTEXT.md` / Resume Prompt Generator**:
  - One-click synthesis of current Git diff, active ports, notes, and task status into a ready-to-paste prompt for AI agents.
- [ ] **DevDesk Model Context Protocol (MCP) Server**:
  - Local stdio MCP server (`devdesk mcp`).
  - Tools exposed to AI agents: `get_project_context`, `list_tasks`, `update_task_status`, `get_roadmap`.

---

## 🎯 What Needs To Be Done Next? (Action Plan)

1. **Install `@xyflow/react`**: Add React Flow to render interactive mindmaps of project roadmaps.
2. **Build Mindmap Component**: Create a visual graph view connecting Projects → Features → Backlog Tasks.
3. **Add Git Commit Auto-Closing**: Connect Git commit listeners to inspect commit messages for `#<id>` and update matching tasks in SQLite.
4. **Implement Context Prompt Generator**: Add a button to generate `CONTEXT.md` or copy an AI-ready prompt summarizing project state.
5. **Implement DevDesk MCP Server**: Build the stdio MCP bridge so tools like Claude Code, OpenCode, and Antigravity can directly read and update DevDesk.
