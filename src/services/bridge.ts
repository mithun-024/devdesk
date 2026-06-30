import {
  ActivePort,
  GitRepoState,
  WorkspaceSession,
  Task,
  TaskHistoryItem,
  SelectedDirectory,
  CredentialSummary,
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

// --- SQLite + Drizzle Workspaces ---
export const fetchWorkspaces = async (): Promise<WorkspaceSession[]> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.getWorkspaces();
    } catch (e) {
      console.error('Failed to fetch workspaces from SQLite:', e);
    }
  }
  return [];
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
