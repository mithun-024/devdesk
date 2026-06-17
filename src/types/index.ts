export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  branch?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSession {
  id: string;
  name: string;
  rootPath: string;
  activeBranch: string;
  envVars: Record<string, string>;
  pinnedPorts: number[];
  scratchNotes: string;
  updatedAt: string;
}

export interface ActivePort {
  port: number;
  pid: number;
  processName: string;
  protocol: 'tcp' | 'udp';
  status: 'LISTEN' | 'ESTABLISHED';
  memoryMb?: number;
}

export interface GitFileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
  staged: boolean;
  diff?: string;
}

export interface GitRepoState {
  currentBranch: string;
  branches: string[];
  ahead: number;
  behind: number;
  files: GitFileStatus[];
  lastCommit?: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
}

export type ActiveTab = 'workspaces' | 'tasks' | 'git' | 'ports' | 'terminal' | 'devtools' | 'scratchpad';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Tasks' | 'Git' | 'Ports' | 'Utilities';
  shortcut?: string;
  icon: string;
  action: () => void;
}

export interface ElectronBridge {
  isElectron: boolean;
  getActivePorts: () => Promise<ActivePort[]>;
  killProcess: (pid: number) => Promise<{ success: boolean; message: string }>;
  getGitStatus: () => Promise<GitRepoState>;
  gitStageFile: (path: string, stage: boolean) => Promise<boolean>;
  gitCommit: (message: string, push?: boolean) => Promise<{ success: boolean; hash?: string; error?: string }>;
  createPty: (id: string, cols?: number, rows?: number) => Promise<boolean>;
  writePty: (id: string, data: string) => void;
  resizePty: (id: string, cols: number, rows: number) => void;
  closePty: (id: string) => void;
  onPtyData: (callback: (id: string, data: string) => void) => () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronBridge?: ElectronBridge;
  }
}
