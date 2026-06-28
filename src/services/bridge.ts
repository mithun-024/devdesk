import { ActivePort, GitRepoState } from '../types';

export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.electronBridge);
};

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
};

export const isDesktop = (): boolean => {
  return isElectron() || isTauri();
};

export const fetchActivePorts = async (): Promise<ActivePort[]> => {
  if (isElectron() && window.electronBridge) {
    try {
      return await window.electronBridge.getActivePorts();
    } catch (e) {
      console.error('Electron getActivePorts error:', e);
    }
  }

  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<ActivePort[]>('get_active_ports');
    } catch (e) {
      console.warn('Tauri IPC failed, falling back to simulated data:', e);
    }
  }

  // Simulated active ports for dev preview
  return [
    { port: 1420, pid: 48920, processName: 'devdesk-ui', protocol: 'tcp', status: 'LISTEN', memoryMb: 42.4 },
    { port: 3000, pid: 42109, processName: 'node (next-server)', protocol: 'tcp', status: 'LISTEN', memoryMb: 128.5 },
    { port: 5173, pid: 38911, processName: 'vite-dev', protocol: 'tcp', status: 'LISTEN', memoryMb: 68.2 },
    { port: 8080, pid: 19402, processName: 'python3 -m http.server', protocol: 'tcp', status: 'LISTEN', memoryMb: 24.1 },
    { port: 5432, pid: 1120, processName: 'postgres', protocol: 'tcp', status: 'LISTEN', memoryMb: 85.0 },
    { port: 6379, pid: 1432, processName: 'redis-server', protocol: 'tcp', status: 'LISTEN', memoryMb: 18.3 },
  ];
};

export const killProcessByPid = async (pid: number): Promise<{ success: boolean; message: string }> => {
  if (isElectron() && window.electronBridge) {
    try {
      return await window.electronBridge.killProcess(pid);
    } catch (e: any) {
      return { success: false, message: e.message || String(e) };
    }
  }

  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<{ success: boolean; message: string }>('kill_process', { pid });
    } catch (e) {
      console.error('Tauri IPC kill error:', e);
      return { success: false, message: String(e) };
    }
  }

  return { success: true, message: `Process PID ${pid} terminated successfully (Simulated)` };
};

export const fetchGitState = async (): Promise<GitRepoState> => {
  if (isElectron() && window.electronBridge) {
    try {
      return await window.electronBridge.getGitStatus();
    } catch (e) {
      console.error('Electron getGitStatus error:', e);
    }
  }

  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<GitRepoState>('get_git_status');
    } catch (e) {
      console.warn('Tauri IPC git status failed:', e);
    }
  }

  return {
    currentBranch: 'main',
    branches: ['main', 'feat/command-palette', 'feat/port-inspector', 'fix/xterm-resize'],
    ahead: 0,
    behind: 0,
    files: [
      {
        path: 'src/components/views/GitHudView.tsx',
        status: 'modified',
        staged: true,
        diff: `@@ -12,6 +12,12 @@ export const GitHudView = () => {
+  const [stagedOnly, setStagedOnly] = useState(false);
+  const [commitMessage, setCommitMessage] = useState('');
   return (
-    <div className="p-4">
+    <div className="p-6 bg-[#090a0f] flex flex-col h-full">`,
      },
      {
        path: 'src/services/bridge.ts',
        status: 'modified',
        staged: false,
        diff: `@@ -45,3 +45,5 @@ export const fetchGitState = () => {
+  // Added dynamic import fallback for web preview
+  return state;`,
      },
      {
        path: 'electron/main.cjs',
        status: 'added',
        staged: false,
      },
    ],
    lastCommit: {
      hash: 'fdbe399',
      message: 'docs: add comprehensive project README, keyboard shortcuts, and MIT license',
      author: 'Mithun <gmithun2006@gmail.com>',
      date: '2026-07-28 22:15:37 +0530',
    },
  };
};

export const gitStageFile = async (path: string, stage: boolean): Promise<boolean> => {
  if (isElectron() && window.electronBridge) {
    try {
      return await window.electronBridge.gitStageFile(path, stage);
    } catch (e) {
      console.error('Electron gitStageFile error:', e);
      return false;
    }
  }

  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<boolean>('git_stage_file', { path, stage });
    } catch (e) {
      console.warn(e);
    }
  }
  return true;
};

export const gitCommitAndPush = async (
  message: string,
  push: boolean
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  if (isElectron() && window.electronBridge) {
    try {
      return await window.electronBridge.gitCommit(message, push);
    } catch (e: any) {
      return { success: false, error: e.message || String(e) };
    }
  }

  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<{ success: boolean; hash?: string; error?: string }>('git_commit', {
        message,
        push,
      });
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  return {
    success: true,
    hash: Math.random().toString(16).substring(2, 9),
  };
};
