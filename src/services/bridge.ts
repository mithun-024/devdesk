import { ActivePort, GitRepoState } from '../types';

export const isDesktop = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.electronBridge);
};

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

export const fetchGitState = async (): Promise<GitRepoState> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.getGitStatus();
    } catch (e) {
      console.error('Failed to fetch git state:', e);
    }
  }
  return {
    currentBranch: 'main',
    branches: ['main'],
    ahead: 0,
    behind: 0,
    files: [],
  };
};

export const gitStageFile = async (path: string, stage: boolean): Promise<boolean> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.gitStageFile(path, stage);
    } catch (e) {
      console.error('Failed to stage file:', e);
      return false;
    }
  }
  return false;
};

export const gitCommitAndPush = async (
  message: string,
  push: boolean
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  if (window.electronBridge) {
    try {
      return await window.electronBridge.gitCommit(message, push);
    } catch (e: any) {
      return { success: false, error: e.message || String(e) };
    }
  }
  return { success: false, error: 'Desktop engine not connected' };
};
