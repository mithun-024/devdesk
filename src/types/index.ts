export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  branch?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistoryItem {
  id: string;
  taskId: string;
  workspaceId: string;
  action: 'created' | 'status_changed' | 'priority_changed' | 'updated' | 'deleted';
  details: {
    title?: string;
    fromStatus?: string;
    toStatus?: string;
    fromPriority?: string;
    toPriority?: string;
    note?: string;
    [key: string]: any;
  };
  timestamp: string;
}

export interface WorkspaceSession {
  id: string;
  name: string;
  path: string;
  activeBranch: string;
  envVars: Record<string, string>;
  pinnedPorts: number[];
  scratchNotes: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
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
  isRepo?: boolean;
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

export interface SelectedDirectory {
  path: string;
  name: string;
  isGit: boolean;
  branch: string;
}

export interface CredentialSummary {
  key: string;
  updatedAt: string;
}

export type ActiveTab = 'workspaces' | 'tasks' | 'git' | 'ports' | 'terminal' | 'devtools' | 'scratchpad' | 'settings';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Tasks' | 'Git' | 'Ports' | 'Utilities' | 'System';
  shortcut?: string;
  icon: string;
  action: () => void;
}

export interface ElectronBridge {
  isElectron: boolean;

  // Native Directory
  selectDirectory: () => Promise<SelectedDirectory | null>;

  // SQLite + Drizzle Workspaces
  getWorkspaces: () => Promise<WorkspaceSession[]>;
  createWorkspace: (data: Partial<WorkspaceSession> & { name: string; path: string }) => Promise<WorkspaceSession>;
  updateWorkspace: (id: string, data: Partial<WorkspaceSession>) => Promise<WorkspaceSession>;
  deleteWorkspace: (id: string) => Promise<boolean>;

  // SQLite + Drizzle Tasks & History
  getTasks: (workspaceId?: string) => Promise<Task[]>;
  createTask: (data: { workspaceId: string; title: string; description?: string; status?: TaskStatus; priority?: Priority; tags?: string[]; branch?: string }) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<boolean>;
  getTaskHistory: (workspaceId?: string, taskId?: string) => Promise<TaskHistoryItem[]>;

  // Settings
  getSettings: () => Promise<Record<string, any>>;
  setSetting: (key: string, value: any) => Promise<any>;

  // OS Keychain Credentials
  setCredential: (key: string, value: string) => Promise<boolean>;
  getCredential: (key: string) => Promise<string | null>;
  deleteCredential: (key: string) => Promise<boolean>;
  listCredentials: () => Promise<CredentialSummary[]>;
  isKeychainAvailable: () => Promise<boolean>;

  // Backup & Restore
  exportBackupFile: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  importBackupFile: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;

  // Ports & Process Management
  getActivePorts: () => Promise<ActivePort[]>;
  killProcess: (pid: number) => Promise<{ success: boolean; message: string }>;

  // Real Workspace-Aware Git Telemetry
  getGitStatus: (cwd?: string) => Promise<GitRepoState>;
  gitCheckoutBranch: (cwd: string | undefined, branch: string) => Promise<{ success: boolean; message: string }>;
  gitCreateBranch: (cwd: string | undefined, branch: string) => Promise<{ success: boolean; message: string }>;
  gitDiff: (cwd?: string, file?: string, staged?: boolean) => Promise<string>;
  gitStageFile: (cwd: string | undefined, path: string, stage: boolean) => Promise<boolean>;
  gitCommit: (cwd: string | undefined, message: string, push?: boolean) => Promise<{ success: boolean; hash?: string; error?: string }>;

  // Workspace-Aware Terminal PTY Bridge
  createPty: (id: string, cols?: number, rows?: number, cwd?: string, env?: Record<string, string>) => Promise<boolean>;
  writePty: (id: string, data: string) => void;
  resizePty: (id: string, cols: number, rows: number) => void;
  closePty: (id: string) => void;
  onPtyData: (callback: (id: string, data: string) => void) => () => void;

  // Window Controls
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
