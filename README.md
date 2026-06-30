# DevDesk ⚡

> **Minimalist, High-Performance Developer Workstation HUD & Command Center**

![DevDesk Preview](https://img.shields.io/badge/Release-v1.0.0-6366f1?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-45.2-47848F?style=for-the-badge&logo=electron)
![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=for-the-badge&logo=sqlite)
![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-TypeSafe-C5F74F?style=for-the-badge)
![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![Theme](https://img.shields.io/badge/Theme-Tokyo%20Night%20Twilight-16161e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

**DevDesk** is a native Linux desktop workstation HUD engineered to unify a developer's daily workflow into one cohesive command center. Styled with a calming **Tokyo Night Twilight (`#16161e`)** palette and muted neon pastel accents (lavender, cyan, sage green, and sunset amber), it pairs distraction-free design with deep operating-system integration.

All application data is persisted locally in embedded **SQLite** using **Drizzle ORM**, sensitive secrets are protected in your **OS Keychain**, and terminals run on real hardware PTYs connected directly to `/bin/bash`.

---

## 🏗️ Technology Stack

- **Desktop Host**: Electron 45 with secure `contextBridge` IPC
- **Database Layer**: SQLite 3 with WAL journal mode, accessed through **Drizzle ORM** (`drizzle-orm/better-sqlite3`)
- **Credential Security**: Operating System Keychain via Electron `safeStorage` (GNOME Keyring / KWallet on Linux)
- **Terminal Emulator**: Hardware-accelerated Xterm.js connected to live Linux PTYs via `node-pty`
- **Frontend Architecture**: React 19, TypeScript 5.7, Tailwind CSS (Tokyo Night palette)
- **System Telemetry**: Native `lsof`, `ss`, and porcelain `git` CLI bridges

---

## ✨ Features

- 🗂️ **Real Workspace Engine**
  - Native OS directory picker to attach real project directories on your machine.
  - Per-workspace environment variable injection and branch tracking.
  - One-click launch of workspace-specific terminals.

- 📋 **Persistent Task Management & Audit Log**
  - Fully typed task tracker backed by SQLite via Drizzle ORM (zero mock data).
  - Kanban board and tabular list views with priority levels (`urgent`, `high`, `medium`, `low`) and status columns.
  - Real-time audit history drawer recording status transitions, updates, and creation timestamps.

- 🌿 **Deep Git HUD & Multi-Repo Telemetry**
  - Real-time Git worktree detection for the active workspace.
  - Live staged and unstaged file lists with syntax-highlighted visual unified diffs.
  - Branch switcher with one-click branch creation (`git checkout -b`).
  - Conventional commit composer (`feat:`, `fix:`, `docs:`, etc.) with push option.

- 💻 **Workspace-Specific PTY Terminals (`Ctrl + \``)**
  - Native Linux `/bin/bash` terminal sessions running directly inside the active workspace directory.
  - Multi-tab support and quick slide-up terminal drawer.
  - Tokyo Night 16 ANSI color theme with glowing cursor.

- 🔌 **Live Port Inspector & Process Killer**
  - Live socket scanning (`lsof` and `ss`) discovering listening TCP/UDP ports.
  - Process memory detection (`VmRSS`) and one-click termination (`SIGTERM` / `SIGKILL`).

- 🛡️ **OS Keychain Vault & Persistent Backups**
  - Encrypt and store sensitive API tokens or secrets securely in the host OS keychain.
  - One-click full database export and restore (JSON backup/recovery).

- 🛠️ **Developer Offline Toolbox**
  - **JSON Formatter**: Syntax beautifier, validator, and minifier.
  - **JWT Token Inspector**: Decodes headers, payloads, and expiration timestamps offline.
  - **Base64 Converter**: Instant encode/decode without sending data across the network.
  - **Regex Playground**: Real-time regex testing with flag and capture group inspection.

- 📝 **Markdown Scratchpad**
  - Real-time auto-saving ephemeral notepad for scratch notes and code snippets with `.md` export.

- ⚡ **Spotlight Command Palette (`Ctrl + K` / `Cmd + K`)**
  - Fuzzy-searchable shortcuts to switch tabs, launch tools, rescan ports, or jump between workspaces.

---

## 🛠️ Architecture

```
devdesk/
├── electron/
│   ├── db/
│   │   ├── schema.cjs     # Drizzle ORM SQLite tables (workspaces, tasks, taskHistory, settings, credentials)
│   │   └── index.cjs      # SQLite initialization, CRUD operations & JSON backup/restore
│   ├── main.cjs           # Electron main process, privileged IPC, PTY spawn, dialogs, git & keychain
│   └── preload.cjs        # Secure contextBridge exposing typed window.electronBridge
├── src/
│   ├── components/
│   │   ├── layout/        # TitleBar, Sidebar, TerminalDrawer
│   │   ├── palette/       # Raycast-style CommandPalette (Ctrl+K)
│   │   ├── ui/            # Badge, Modal, Toast primitives
│   │   └── views/         # WorkspaceManager, TaskTracker, GitHud, Terminal, PortInspector, DevTools, Scratchpad, Settings
│   ├── services/
│   │   ├── bridge.ts      # Typed bridge to Electron IPC & SQLite
│   │   └── storage.ts     # Persistent cache & default configs
│   ├── App.tsx            # Root workstation shell & state orchestration
│   └── main.tsx           # React 19 entry point
└── package.json
```

---

## 🚀 Quick Start

### 1. Launch in Development Mode
```bash
npm install
npm run dev
```
*Spawns the local Vite renderer with hot-reload and immediately launches the standalone Electron desktop window connected to native PTY `/bin/bash`, SQLite, and host port inspection.*

### 2. Run in Production Desktop Mode
```bash
npm run build
npm start
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open Spotlight Command Palette |
| `Ctrl + \`` | Toggle slide-up terminal drawer |
| `Ctrl + B` | Toggle sidebar collapse |
| `Alt + 1` | Switch to Workspace Engine |
| `Alt + 2` | Switch to Task Tracker |
| `Alt + 3` | Switch to Git HUD |
| `Alt + 4` | Switch to Ports & PIDs |
| `Alt + 5` | Switch to Fullscreen Terminal |
| `Alt + 6` | Switch to DevTools View |
| `Alt + 7` | Switch to Scratchpad |
| `Alt + 8` | Switch to Settings & Security |
| `Escape` | Dismiss active modal or Command Palette |

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
