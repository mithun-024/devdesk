import {
  ActivePort,
  MappedPort,
  GitRepoState,
  WorkspaceSession,
  Project,
  ProjectGitSummary,
  ProjectNotes,
  Snapshot,
  DevServerStatus,
  Task,
  TaskHistoryItem,
  SelectedDirectory,
  CredentialSummary,
  RoadmapNode,
  RoadmapEdge,
  AgentStatus,
} from '../types';

export const isDesktop = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.electronBridge);
};

// --- Directory Selection ---
export const selectWorkspaceDirectory = async (): Promise<SelectedDirectory | null> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.selectDirectory();
    } catch (e) {
      console.error('Failed to select directory:', e);
    }
  }
  return null;
};

// --- Phase 1: Project Registration & Management ---
export const registerProject = async (path: string, name?: string): Promise<Project | null> => {
  if (window.electronBridge?.registerProject) {
    try {
      return await window.electronBridge.registerProject(path, name);
    } catch (e) {
      console.error('Failed to register project:', e);
    }
  }
  return null;
};

export const fetchProjects = async (): Promise<Project[]> => {
  if (window.electronBridge?.getProjects) {
    try {
      return await window.electronBridge.getProjects();
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    }
  } else if (window.electronBridge?.getWorkspaces) {
    return await window.electronBridge.getWorkspaces();
  }
  return [];
};

export const removeProject = async (id: string): Promise<boolean> => {
  if (window.electronBridge?.removeProject) {
    try {
      return await window.electronBridge.removeProject(id);
    } catch (e) {
      console.error('Failed to remove project:', e);
    }
  } else if (window.electronBridge?.deleteWorkspace) {
    return await window.electronBridge.deleteWorkspace(id);
  }
  return false;
};

// --- Phase 1: Mapped Ports & Live Process Kill ---
export const fetchMappedPorts = async (): Promise<MappedPort[]> => {
  if (window.electronBridge?.getMappedPorts) {
    try {
      return await window.electronBridge.getMappedPorts();
    } catch (e) {
      console.error('Failed to fetch mapped ports:', e);
    }
  }
  return [];
};

export const killProcess = async (pid: number): Promise<{ success: boolean; message: string }> => {
  if (window.electronBridge?.killProcessPid) {
    try {
      return await window.electronBridge.killProcessPid(pid);
    } catch (e: any) {
      return { success: false, message: e.message || String(e) };
    }
  } else if (window.electronBridge?.killProcess) {
    return await window.electronBridge.killProcess(pid);
  }
  return { success: false, message: 'Desktop engine not connected' };
};

// --- Phase 1: Project Git Summary ---
export const fetchProjectGitSummary = async (path: string): Promise<ProjectGitSummary | null> => {
  if (window.electronBridge?.getProjectGitSummary) {
    try {
      return await window.electronBridge.getProjectGitSummary(path);
    } catch (e) {
      console.error(`Failed to fetch git summary for ${path}:`, e);
    }
  }
  return null;
};

// --- Phase 2: Where We Left Off Notes ---
export const fetchProjectNotes = async (projectId: string): Promise<ProjectNotes | null> => {
  if (window.electronBridge?.getProjectNotes) {
    try {
      return await window.electronBridge.getProjectNotes(projectId);
    } catch (e) {
      console.error(`Failed to fetch notes for ${projectId}:`, e);
    }
  }
  return null;
};

export const saveProjectNotes = async (
  projectId: string,
  notes: Partial<ProjectNotes>
): Promise<ProjectNotes | null> => {
  if (window.electronBridge?.saveProjectNotes) {
    try {
      return await window.electronBridge.saveProjectNotes(projectId, notes);
    } catch (e) {
      console.error(`Failed to save notes for ${projectId}:`, e);
    }
  }
  return null;
};

// --- Phase 2: Snapshots ---
export const takeSnapshot = async (projectId: string): Promise<Snapshot | null> => {
  if (window.electronBridge?.createSnapshot) {
    try {
      return await window.electronBridge.createSnapshot(projectId);
    } catch (e) {
      console.error(`Failed to take snapshot for ${projectId}:`, e);
    }
  }
  return null;
};

export const fetchLatestSnapshot = async (projectId: string): Promise<Snapshot | null> => {
  if (window.electronBridge?.getLatestSnapshot) {
    try {
      return await window.electronBridge.getLatestSnapshot(projectId);
    } catch (e) {
      console.error(`Failed to fetch latest snapshot for ${projectId}:`, e);
    }
  }
  return null;
};

export const fetchSnapshotHistory = async (projectId: string, limit = 10): Promise<Snapshot[]> => {
  if (window.electronBridge?.getSnapshotHistory) {
    try {
      return await window.electronBridge.getSnapshotHistory(projectId, limit);
    } catch (e) {
      console.error(`Failed to fetch snapshot history for ${projectId}:`, e);
    }
  }
  return [];
};

// --- Phase 2: Dev Server Management ---
export const startDevServer = async (
  projectId: string
): Promise<{ success: boolean; pid?: number; devCommand?: string }> => {
  if (window.electronBridge?.startDevServer) {
    try {
      return await window.electronBridge.startDevServer(projectId);
    } catch (e: any) {
      return { success: false, pid: undefined, devCommand: undefined };
    }
  }
  return { success: false };
};

export const stopDevServer = async (
  projectId: string
): Promise<{ success: boolean; message: string }> => {
  if (window.electronBridge?.stopDevServer) {
    try {
      return await window.electronBridge.stopDevServer(projectId);
    } catch (e: any) {
      return { success: false, message: e.message || String(e) };
    }
  }
  return { success: false, message: 'Bridge not available' };
};

export const fetchDevServerStatus = async (projectId: string): Promise<DevServerStatus> => {
  if (window.electronBridge?.getDevServerStatus) {
    try {
      return await window.electronBridge.getDevServerStatus(projectId);
    } catch (e) {
      console.error(`Failed to get dev server status for ${projectId}:`, e);
    }
  }
  return { isRunning: false };
};

export const fetchAllRunningDevServers = async (): Promise<Record<string, DevServerStatus>> => {
  if (window.electronBridge?.getAllRunningDevServers) {
    try {
      return await window.electronBridge.getAllRunningDevServers();
    } catch (e) {
      console.error('Failed to get all running dev servers:', e);
    }
  }
  return {};
};

// --- SQLite + Drizzle Workspaces (backward compatible) ---
export const fetchWorkspaces = async (): Promise<WorkspaceSession[]> => {
  return fetchProjects();
};

export const createWorkspace = async (
  data: Partial<WorkspaceSession> & { name: string; path: string }
): Promise<WorkspaceSession | null> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.createWorkspace(data);
    } catch (e) {
      console.error('Failed to create workspace:', e);
    }
  }
  return null;
};

export const updateWorkspace = async (
  id: string,
  data: Partial<WorkspaceSession>
): Promise<WorkspaceSession | null> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.updateWorkspace(id, data);
    } catch (e) {
      console.error('Failed to update workspace:', e);
    }
  }
  return null;
};

export const deleteWorkspace = async (id: string): Promise<boolean> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.deleteWorkspace(id);
    } catch (e) {
      console.error('Failed to delete workspace:', e);
    }
  }
  return false;
};

// --- SQLite + Drizzle Tasks & History ---
export const fetchTasks = async (workspaceId?: string): Promise<Task[]> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.getTasks(workspaceId);
    } catch (e) {
      console.error('Failed to fetch tasks from SQLite:', e);
    }
  }
  return [];
};

export const createTask = async (data: {
  workspaceId: string;
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  tags?: string[];
  branch?: string;
}): Promise<Task | null> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.createTask(data);
    } catch (e) {
      console.error('Failed to create task:', e);
    }
  }
  return null;
};

export const updateTask = async (
  id: string,
  data: Partial<Task>
): Promise<Task | null> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.updateTask(id, data);
    } catch (e) {
      console.error('Failed to update task:', e);
    }
  }
  return null;
};

export const deleteTask = async (id: string): Promise<boolean> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.deleteTask(id);
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  }
  return false;
};

export const fetchTaskHistory = async (
  workspaceId?: string,
  taskId?: string
): Promise<TaskHistoryItem[]> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.getTaskHistory(workspaceId, taskId);
    } catch (e) {
      console.error('Failed to fetch task history:', e);
    }
  }
  return [];
};

// --- Settings ---
export const fetchSettings = async (): Promise<Record<string, any>> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.getSettings();
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
  }
  return {};
};

export const saveSetting = async (key: string, value: any): Promise<any> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.setSetting(key, value);
    } catch (e) {
      console.error('Failed to save setting:', e);
    }
  }
  return null;
};

// --- OS Keychain Credentials ---
export const saveCredential = async (key: string, value: string): Promise<boolean> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.setCredential(key, value);
    } catch (e) {
      console.error('Failed to save credential in OS keychain:', e);
    }
  }
  return false;
};

export const readCredential = async (key: string): Promise<string | null> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.getCredential(key);
    } catch (e) {
      console.error('Failed to read credential from OS keychain:', e);
    }
  }
  return null;
};

export const removeCredential = async (key: string): Promise<boolean> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.deleteCredential(key);
    } catch (e) {
      console.error('Failed to delete credential:', e);
    }
  }
  return false;
};

export const fetchCredentialsList = async (): Promise<CredentialSummary[]> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.listCredentials();
    } catch (e) {
      console.error('Failed to list credentials:', e);
    }
  }
  return [];
};

export const checkKeychainAvailable = async (): Promise<boolean> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.isKeychainAvailable();
    } catch (e) {
      console.error('Failed to check keychain:', e);
    }
  }
  return false;
};

// --- Backup & Restore ---
export const exportBackup = async (): Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.exportBackupFile();
    } catch (e: any) {
      return { success: false, error: e.message || String(e) };
    }
  }
  return { success: false, error: 'Desktop bridge not connected' };
};

export const importBackup = async (): Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.importBackupFile();
    } catch (e: any) {
      return { success: false, error: e.message || String(e) };
    }
  }
  return { success: false, error: 'Desktop bridge not connected' };
};

// --- Real Port Scanner & Kill ---
export const fetchActivePorts = async (): Promise<ActivePort[]> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.getActivePorts();
    } catch (e) {
      console.error('Failed to fetch active ports:', e);
    }
  }
  return [];
};

export const killProcessByPid = async (pid: number): Promise<{ success: boolean; message: string }> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.killProcess(pid);
    } catch (e: any) {
      return { success: false, message: e.message || String(e) };
    }
  }
  return { success: false, message: 'Desktop engine not connected' };
};

// --- Real Workspace-Aware Git Telemetry ---
export const fetchGitState = async (cwd?: string): Promise<GitRepoState> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.getGitStatus(cwd);
    } catch (e) {
      console.error('Failed to fetch git state:', e);
    }
  }
  return {
    isRepo: false,
    currentBranch: '',
    branches: [],
    ahead: 0,
    behind: 0,
    files: [],
  };
};

export const checkoutBranch = async (
  cwd: string | undefined,
  branch: string
): Promise<{ success: boolean; message: string }> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.gitCheckoutBranch(cwd, branch);
    } catch (e: any) {
      return { success: false, message: e.message || String(e) };
    }
  }
  return { success: false, message: 'Desktop bridge not connected' };
};

export const createGitBranch = async (
  cwd: string | undefined,
  branch: string
): Promise<{ success: boolean; message: string }> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.gitCreateBranch(cwd, branch);
    } catch (e: any) {
      return { success: false, message: e.message || String(e) };
    }
  }
  return { success: false, message: 'Desktop bridge not connected' };
};

export const fetchGitDiff = async (
  cwd?: string,
  file?: string,
  staged?: boolean
): Promise<string> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.gitDiff(cwd, file, staged);
    } catch (e) {
      console.error('Failed to fetch git diff:', e);
    }
  }
  return '';
};

export const gitStageFile = async (
  cwd: string | undefined,
  path: string,
  stage: boolean
): Promise<boolean> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.gitStageFile(cwd, path, stage);
    } catch (e) {
      console.error('Failed to stage file:', e);
      return false;
    }
  }
  return false;
};

export const gitCommitAndPush = async (
  cwd: string | undefined,
  message: string,
  push: boolean
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.gitCommit(cwd, message, push);
    } catch (e: any) {
      return { success: false, error: e.message || String(e) };
    }
  }
  return { success: false, error: 'Desktop engine not connected' };
};

// ==========================================
// Phase 3 & 4: Roadmap Canvas & Agent Bridge
// ==========================================

export const fetchRoadmapNodes = async (projectId: string): Promise<RoadmapNode[]> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.getRoadmapNodes(projectId);
    } catch (e) {
      console.error('Failed to fetch roadmap nodes:', e);
    }
  }
  return [];
};

export const upsertRoadmapNode = async (
  node: Partial<RoadmapNode> & { id: string; projectId: string; label: string }
): Promise<RoadmapNode | null> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.upsertRoadmapNode(node);
    } catch (e) {
      console.error('Failed to upsert roadmap node:', e);
    }
  }
  return null;
};

export const updateRoadmapNode = async (
  id: string,
  updates: Partial<RoadmapNode>
): Promise<RoadmapNode | null> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.updateRoadmapNode(id, updates);
    } catch (e) {
      console.error('Failed to update roadmap node:', e);
    }
  }
  return null;
};

export const deleteRoadmapNode = async (id: string): Promise<boolean> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.deleteRoadmapNode(id);
    } catch (e) {
      console.error('Failed to delete roadmap node:', e);
    }
  }
  return false;
};

export const fetchRoadmapEdges = async (projectId: string): Promise<RoadmapEdge[]> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.getRoadmapEdges(projectId);
    } catch (e) {
      console.error('Failed to fetch roadmap edges:', e);
    }
  }
  return [];
};

export const saveRoadmapEdges = async (
  projectId: string,
  edges: RoadmapEdge[]
): Promise<RoadmapEdge[]> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.saveRoadmapEdges(projectId, edges);
    } catch (e) {
      console.error('Failed to save roadmap edges:', e);
    }
  }
  return [];
};

export const fetchAgentStatus = async (workspacePath?: string): Promise<AgentStatus> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.getAgentStatus(workspacePath);
    } catch (e) {
      console.error('Failed to fetch agent status:', e);
    }
  }
  return {
    hasSession: false,
    isActive: false,
    conversationId: null,
    lastTool: null,
    lastToolAction: 'Idle',
    summary: 'Not connected',
    touchedFiles: [],
    lastUpdated: null,
  };
};

export const syncAgentRoadmap = async (projectId: string): Promise<void> => {
  if (window.electronBridge) {
    try {
      await window.electronBridge.syncAgentRoadmap(projectId);
    } catch (e) {
      console.error('Failed to sync agent to roadmap:', e);
    }
  }
};

