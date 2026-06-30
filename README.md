# DevDesk ⚡

> **Minimalist, High-Performance Developer Workstation HUD & Command Center**

![DevDesk Preview](https://img.shields.io/badge/Release-v1.0.0-6366f1?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-45.2-47848F?style=for-the-badge&logo=electron)
![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite)
![Theme](https://img.shields.io/badge/Theme-OLED%20Pure%20Black-000000?style=for-the-badge)
![Accents](https://img.shields.io/badge/Accents-Retro%20Neon-00ff66?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

**DevDesk** is a minimalist, barebones native desktop workstation HUD designed to unify a developer's daily workflow into one seamless command center. Featuring a distraction-free **pure OLED black (`#000000`)** interface with **retro neon icon accents** (cyan, matrix green, amber, magenta, purple, sky), it eliminates clutter while giving developers instant keyboard-first control over their environment.

Built with **React 19**, **TypeScript**, and **Tailwind CSS**, and powered by **Electron** with a native **Node.js PTY bridge**, DevDesk interacts directly with your Linux operating system.

---

## ✨ Features

- ⚡ **Global Command Palette (`Ctrl + K` / `Cmd + K`)**
  - Instant spotlight navigation across all views, workspaces, and system actions.
  - Fuzzy-searchable shortcuts for keyboard-first navigation.
- 💻 **Real Interactive Terminal with PTY (`Ctrl + \``)**
  - Direct hardware-accelerated **Xterm.js** terminal connected to a live native Linux `/bin/bash` process via `node-pty`.
  - Multi-tab shell sessions (`bash`, `dev`, `server`).
  - Slide-up bottom terminal drawer for fast command execution without leaving your current view.
- 🔌 **Live Port & Process Inspector**
  - Scans active TCP/UDP listening ports (`ss`, `lsof`) on your local machine.
  - Live PID detection, memory usage tracking (`VmRSS`), and one-click termination (`SIGTERM` / `SIGKILL`).
- 🌿 **Git HUD & Telemetry**
  - Real-time Git status detection for your active project directory.
  - View modified, added, and deleted files with visual stage toggles and unified diff previews.
  - Branch switcher and commit timeline viewer.
- 📋 **Developer Task Tracker & Backlog**
  - Manage sprints and features with priority levels (`urgent`, `high`, `medium`, `low`) and status columns (`todo`, `in_progress`, `in_review`, `done`).
  - Persistent state in local storage.
- 🗂️ **Workspace Session Management**
  - Contextual switcher between projects with custom environment variables and pinned ports.
  - Quick action launchers for VS Code, WebStorm, and file managers.
- 🛠️ **Developer Quick Utilities**
  - **JSON Formatter**: Syntax beautifier, validator, and minifier.
  - **JWT Token Inspector**: Decodes headers, payloads, and timestamps.
  - **Base64 Converter**: Instant encode/decode.
  - **Regex Playground**: Real-time regex matching and capture group inspection.
- 📝 **Developer Scratchpad**
  - Instant markdown notepad for temporary code snippets and notes with auto-saving and `.md` file export.

---

## 🛠️ Architecture

```
devdesk/
├── electron/
│   ├── main.cjs        # Native desktop window, PTY spawn (/bin/bash), port scanner & git IPC
│   └── preload.cjs     # Secure contextBridge exposing window.electronBridge
├── src/
│   ├── components/
│   │   ├── layout/     # TitleBar (custom frameless drag), Sidebar, TerminalDrawer
│   │   ├── palette/    # Raycast-style CommandPalette (Ctrl+K)
│   │   ├── ui/         # Badge, Modal, Toast primitives
│   │   └── views/      # TaskTracker, GitHUD, Terminal, PortInspector, DevTools, Scratchpad
│   ├── services/
│   │   ├── bridge.ts   # Unified bridge (Electron IPC -> Tauri -> Simulated fallback)
│   │   └── storage.ts  # Local persistence layer
│   ├── App.tsx         # Root workstation shell
│   └── main.tsx        # React 19 entry point
└── package.json
```

---

## 🚀 Quick Start (How to Run Tomorrow)

### 1. Launch the Native Desktop App (Development Mode)
```bash
npm run desktop:dev
```
*This starts the Vite dev server and opens DevDesk as a native desktop application with live terminal and real port inspection.*

### 2. Run in Production Desktop Mode
```bash
npm run build
npm run desktop
```

### 3. Run in Web Preview (Browser Only)
```bash
npm run dev
# Open http://localhost:1420
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open Spotlight Command Palette |
| `Ctrl + \`` | Toggle slide-up terminal drawer |
| `Alt + 1` | Switch to Task Tracker |
| `Alt + 2` | Switch to Git HUD |
| `Alt + 3` | Switch to Terminal View |
| `Alt + 4` | Switch to Workspace Sessions |
| `Alt + 5` | Switch to Port Inspector |
| `Alt + 6` | Switch to DevTools View |
| `Alt + 7` | Switch to Scratchpad |
| `Escape` | Dismiss active modal or Command Palette |

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
