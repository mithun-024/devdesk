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
  devCommand?: string;
  packageManager?: string;
  gitRemote?: string;
  envVars: Record<string, string>;
  pinnedPorts: number[];
  scratchNotes: string;
  lastSnapshotAt?: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  pathExists?: boolean;
}

export type Project = WorkspaceSession;

export interface MappedPort {
  port: number;
  pid: number;
  processName: string;
  protocol: 'tcp' | 'udp';
  status: 'LISTEN' | 'ESTABLISHED';
  memoryMb: number;
  uptime: string;
  projectId?: string | null;
  projectName?: string | null;
  projectPath?: string | null;
  isProjectMapped: boolean;
}

export interface RecentCommit {
  hash: string;
  message: string;
  author: string;
  relativeDate: string;
  date: string;
}

export interface ProjectGitSummary {
  isRepo: boolean;
  currentBranch: string;
  isClean: boolean;
  dirtyCount: number;
  stagedCount: number;
  unstagedCount: number;
  untrackedCount: number;
  changedFiles: Array<{ file: string; status: string; staged: boolean }>;
  ahead: number;
  behind: number;
  recentCommits: RecentCommit[];
}

export interface ProjectNotes {
  id: string;
  projectId: string;
  lastTask: string;
  nextStep: string;
  blockers: string;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  projectId: string;
  commitHash: string;
  commitMessage: string;
  branch: string;
  uncommittedCount: number;
  activePorts: Array<{ port: number; pid: number; processName: string; uptime: string }>;
  createdAt: string;
}

export interface DevServerStatus {
  isRunning: boolean;
  pid?: number;
  devCommand?: string;
  startedAt?: string;
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

export type ActiveTab = 'projects' | 'workspaces' | 'tasks' | 'git' | 'ports' | 'terminal' | 'devtools' | 'scratchpad' | 'settings';

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

  // Phase 1: Project Management Bridge
  registerProject: (path: string, name?: string) => Promise<Project>;
  getProjects: () => Promise<Project[]>;
  removeProject: (id: string) => Promise<boolean>;
  inspectProject: (path: string) => Promise<any>;

  // Phase 1: Mapped Ports & Process Bridge
  getMappedPorts: () => Promise<MappedPort[]>;
  killProcessPid: (pid: number) => Promise<{ success: boolean; message: string }>;

  // Phase 1: Git Project Summary Bridge
  getProjectGitSummary: (path: string) => Promise<ProjectGitSummary>;

  // Phase 2: Where We Left Off Notes Bridge
  getProjectNotes: (projectId: string) => Promise<ProjectNotes>;
  saveProjectNotes: (projectId: string, notes: Partial<ProjectNotes>) => Promise<ProjectNotes>;

  // Phase 2: Snapshots Bridge
  createSnapshot: (projectId: string) => Promise<Snapshot>;
  getLatestSnapshot: (projectId: string) => Promise<Snapshot | null>;
  getSnapshotHistory: (projectId: string, limit?: number) => Promise<Snapshot[]>;

  // Phase 2: Managed Dev Server Bridge
  startDevServer: (projectId: string) => Promise<{ success: boolean; pid?: number; devCommand?: string }>;
  stopDevServer: (projectId: string) => Promise<{ success: boolean; message: string }>;
  getDevServerStatus: (projectId: string) => Promise<DevServerStatus>;
  getAllRunningDevServers: () => Promise<Record<string, DevServerStatus>>;

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
