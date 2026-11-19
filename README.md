# DevDesk

A developer workstation HUD and control plane providing real-time process-to-port mapping, interactive roadmap graph, background dev server lifecycle management, and a native Model Context Protocol (MCP) server for AI coding agents.

---

## Architecture

```mermaid
flowchart LR
    subgraph Client["Desktop Workstation Shell"]
        direction TB
        UI["React 19 Renderer<br/>• Projects Dashboard<br/>• Roadmap Canvas (@xyflow/react)<br/>• Terminal Drawer (Xterm.js)<br/>• SQLite Task Tracker"]
        IPC["Typed IPC Bridge<br/>(preload.cjs)"]
        UI <--> IPC
    end

    subgraph Core["Electron Host & Services"]
        direction TB
        Main["Main Controller (main.cjs)"]
        Services["• ProjectService (detection & scripts)<br/>• PortService (socket & PID mapping)<br/>• GitService (worktrees & diffs)<br/>• DevServerService (process manager)<br/>• NotesService (snapshots & resume)<br/>• AgentService (transcript watcher)"]
        MCP["Stdio MCP Server<br/>(McpService.cjs)"]
        Main --- Services
        Main --- MCP
    end

    subgraph System["Linux Host OS"]
        direction TB
        Kernel["/proc filesystem<br/>(PID to CWD mapping)"]
        Net["lsof & ss socket scanner"]
        PTY["node-pty hardware /bin/bash"]
        DB[("SQLite WAL (devdesk.db)")]
        Vault["GNOME Keyring / KWallet"]
    end

    subgraph Agents["AI Coding Agents"]
        direction TB
        AGY["Antigravity CLI / Cursor / Claude Code"]
    end

    IPC <-->|"ContextBridge IPC"| Main
    Services <--> Kernel
    Services <--> Net
    Services <--> PTY
    Services <--> DB
    Services <--> Vault
    AGY <-->|"Model Context Protocol (devdesk mcp)"| MCP
```

---

## Core Capabilities

- **Process-to-Project Port Mapping**: Scans host network sockets via `lsof` and `ss`. Resolves listening socket PIDs to repository roots using `/proc/<pid>/cwd`. Displays process memory (`VmRSS`), uptime, and provides one-click `SIGTERM` / `SIGKILL` termination.
- **Where We Left Off Engine**: Automatically snapshots Git state, uncommitted files, and active ports on exit or workspace switch. Persists daily notes (last task, next step, active blockers) per repository.
- **Interactive Roadmap Canvas**: 2D node graph rendered with `@xyflow/react` to map project epics, features, and tasks with live agent execution indicators and dependency tracking.
- **AI Agent MCP Integration**: Embedded stdio Model Context Protocol server (`devdesk mcp`). Allows AI agents to read context, inspect the roadmap, update task nodes in real time, and persist session summaries.
- **Dev Server Process Manager**: Detects scripts across Node.js (`npm`, `pnpm`, `yarn`, `bun`), Rust (`cargo`), Go, and Python. Starts and stops background servers with process tree management.
- **Hardware-Accelerated Terminal**: Linux `/bin/bash` terminal backed by `node-pty` and Xterm.js. Available as both a full view and a slide-up drawer (`Ctrl + \``).
- **Persistent Local Database**: Backed by embedded SQLite via Drizzle ORM in `~/.config/devdesk/devdesk.db`. Zero network dependency; all data remains local.
- **OS Keychain Vault**: Hardware-backed secret storage using Linux `libsecret` via Electron `safeStorage`.

---

## CLI Reference

DevDesk includes a command-line interface executable via `devdesk` or `node bin/devdesk.js`:

| Command | Description |
| :--- | :--- |
| `devdesk add [path]` | Register a directory into SQLite (defaults to `.`) |
| `devdesk resume [project]` | Print terminal card of branch, dirty files, ports, and next steps |
| `devdesk run [project]` | Launch detected dev server in foreground |
| `devdesk list` | List all tracked projects, branches, and mapped ports |
| `devdesk ports` | Print all host listening sockets mapped to registered projects |
| `devdesk mcp` | Start stdio Model Context Protocol server for AI coding agents |
| `devdesk install-desktop` | Register DevDesk in Linux application launcher & dock |
| `devdesk uninstall-desktop` | Remove DevDesk launcher and system icons from Linux desktop |

---

## Quick Start

### 1. Development Mode

```bash
npm install
npm run dev
```

Spawns the local Vite renderer with hot-reload and launches the standalone Electron desktop shell.

### 2. Desktop Launcher Installation (App Menu & System Tray)

Register DevDesk into your Linux application grid, dock, and app search:

```bash
npm run install-desktop
```

Once installed, search for `DevDesk` from your application launcher or press the Super key. When running, closing the window minimizes DevDesk to the Linux system tray bar for background monitoring.

### 3. Uninstalling the Desktop Launcher

To cleanly remove the desktop launcher entry and application icons from your system:

```bash
npm run uninstall-desktop
```

### 4. Production Build

```bash
npm run build
npm start
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Spotlight Command Palette |
| `Ctrl + \`` | Toggle Slide-Up Terminal Drawer |
| `Ctrl + B` | Toggle Sidebar Collapse |
| `Alt + 1` | Projects Dashboard |
| `Alt + 2` | Task Tracker (Kanban) |
| `Alt + 3` | Git HUD |
| `Alt + 4` | Ports & Process Inspector |
| `Alt + 5` | Fullscreen Terminal |
| `Alt + 6` | Offline Developer Tools |
| `Alt + 7` | Markdown Scratchpad |
| `Alt + 8` | Settings & Keychain Vault |
| `Escape` | Dismiss Active Modal / Palette |

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
