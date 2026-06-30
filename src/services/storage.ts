import { Task, WorkspaceSession } from '../types';

const TASKS_KEY = 'devdesk_tasks';
const WORKSPACES_KEY = 'devdesk_workspaces';
const ACTIVE_WORKSPACE_KEY = 'devdesk_active_workspace';
const SCRATCHPAD_KEY = 'devdesk_scratchpad';

const DEFAULT_TASKS: Task[] = [
  {
    id: 'TASK-101',
    title: 'Migrate IPC bridge to Electron specs',
    description: 'Ensure all commands use typed IPC handlers and async response channels.',
    status: 'in_progress',
    priority: 'urgent',
    tags: ['electron', 'pty', 'core'],
    branch: 'feat/electron-pty-ipc',
    createdAt: '2026-06-20T10:00:00Z',
    updatedAt: '2026-06-24T12:00:00Z',
  },
  {
    id: 'TASK-102',
    title: 'Implement fuzzy search in Command Palette',
    description: 'Support instant keyboard navigation with arrow keys and categorized actions.',
    status: 'done',
    priority: 'high',
    tags: ['ui', 'raycast', 'shortcuts'],
    branch: 'feat/command-palette',
    createdAt: '2026-06-15T09:30:00Z',
    updatedAt: '2026-06-18T18:45:00Z',
  },
  {
    id: 'TASK-103',
    title: 'Add port killer with process memory detection',
    description: 'One-click termination of orphan Node/Python dev server processes.',
    status: 'in_progress',
    priority: 'high',
    tags: ['ports', 'sysinfo', 'perf'],
    branch: 'feat/port-inspector',
    createdAt: '2026-06-28T14:20:00Z',
    updatedAt: '2026-06-30T16:10:00Z',
  },
  {
    id: 'TASK-104',
    title: 'Visual Git diff view with staged chunk toggles',
    description: 'Inspect modified files and commit with conventional semantic prefixes.',
    status: 'todo',
    priority: 'medium',
    tags: ['git', 'hud'],
    branch: 'feat/git-diff-viewer',
    createdAt: '2026-07-02T11:15:00Z',
    updatedAt: '2026-07-04T13:40:00Z',
  },
  {
    id: 'TASK-105',
    title: 'Support multi-tab xterm.js sessions with pty bridge',
    description: 'Embed developer terminal with custom dark neon ANSI color scheme.',
    status: 'todo',
    priority: 'urgent',
    tags: ['terminal', 'xterm', 'pty'],
    branch: 'feat/terminal-emulator',
    createdAt: '2026-07-05T08:00:00Z',
    updatedAt: '2026-07-08T09:15:00Z',
  },
  {
    id: 'TASK-106',
    title: 'Offline JWT and Base64 developer utility tools',
    description: 'Instant decoding without sending sensitive tokens over the internet.',
    status: 'backlog',
    priority: 'low',
    tags: ['security', 'tools'],
    createdAt: '2026-07-10T16:00:00Z',
    updatedAt: '2026-07-12T11:00:00Z',
  }
];

const DEFAULT_WORKSPACES: WorkspaceSession[] = [
  {
    id: 'ws-devdesk',
    name: 'DevDesk Core',
    rootPath: '/home/mithun/Documents/project/devdesk',
    activeBranch: 'main',
    envVars: {
      NODE_ENV: 'development',
      PORT: '1420',
      ELECTRON_ENABLE_LOGGING: '1',
    },
    pinnedPorts: [1420, 3000, 5173, 8080],
    scratchNotes: '# DevDesk Session Scratchpad\n\n- [x] Configure OLED black theme HUD\n- [x] Command Palette with Ctrl+K\n- [x] Wire native PTY & port scanner\n- [x] Standalone Linux desktop application',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ws-microservice',
    name: 'Auth API Service',
    rootPath: '/home/mithun/Documents/project/auth-api',
    activeBranch: 'feat/jwt-rotation',
    envVars: {
      NODE_ENV: 'development',
      PORT: '5001',
      DATABASE_URL: 'postgres://localhost:5432/auth_db',
      JWT_SECRET: 'super-dev-secret-key-do-not-leak',
    },
    pinnedPorts: [5001, 5432, 6379],
    scratchNotes: 'Notes for Auth microservice:\nRemember to test JWT expiration timestamps.',
    updatedAt: new Date().toISOString(),
  }
];

export const getStoredTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
};

export const saveStoredTasks = (tasks: Task[]): void => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const getStoredWorkspaces = (): WorkspaceSession[] => {
  try {
    const raw = localStorage.getItem(WORKSPACES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_WORKSPACES;
  } catch {
    return DEFAULT_WORKSPACES;
  }
};

export const saveStoredWorkspaces = (workspaces: WorkspaceSession[]): void => {
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
};

export const getActiveWorkspaceId = (): string => {
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY) || DEFAULT_WORKSPACES[0].id;
};

export const saveActiveWorkspaceId = (id: string): void => {
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
};

export const getStoredScratchpad = (): string => {
  return localStorage.getItem(SCRATCHPAD_KEY) || `# Quick Dev Scratchpad

- Quick snippets and temporary configs
- Automatically saved in real-time
- Use \`Ctrl + K\` to jump to any tool or action

\`\`\`typescript
// Fast port scan prototype
const ports = [1420, 3000, 5173, 8080];
\`\`\`
`;
};

export const saveStoredScratchpad = (content: string): void => {
  localStorage.setItem(SCRATCHPAD_KEY, content);
};
