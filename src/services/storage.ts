import { Task, WorkspaceSession } from '../types';

const TASKS_KEY = 'devdesk_tasks';
const WORKSPACES_KEY = 'devdesk_workspaces';
const ACTIVE_WORKSPACE_KEY = 'devdesk_active_workspace';
const SCRATCHPAD_KEY = 'devdesk_scratchpad';

const DEFAULT_TASKS: Task[] = [];

const DEFAULT_WORKSPACES: WorkspaceSession[] = [
  {
    id: 'ws-devdesk-core',
    name: 'DevDesk Core',
    path: '/home/mithun/Documents/project/devdesk',
    activeBranch: 'main',
    envVars: {
      NODE_ENV: 'development',
      PORT: '1420',
    },
    pinnedPorts: [1420],
    scratchNotes: '# DevDesk Session Scratchpad\n\n- Standalone native desktop workstation\n- Tokyo Night Twilight aesthetic\n- SQLite + Drizzle ORM persistent storage\n',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
  },
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

- Ephemeral notes & temporary configs
- Saved in real-time
- Use \`Ctrl + K\` to jump to any tool or action
`;
};

export const saveStoredScratchpad = (content: string): void => {
  localStorage.setItem(SCRATCHPAD_KEY, content);
};
