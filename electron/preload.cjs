const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronBridge', {
  isElectron: true,

  // Native Directory & Dialogs
  selectDirectory: () => ipcRenderer.invoke('select_directory'),

  // SQLite + Drizzle Workspaces CRUD
  getWorkspaces: () => ipcRenderer.invoke('get_workspaces'),
  createWorkspace: (data) => ipcRenderer.invoke('create_workspace', data),
  updateWorkspace: (id, data) => ipcRenderer.invoke('update_workspace', { id, data }),
  deleteWorkspace: (id) => ipcRenderer.invoke('delete_workspace', { id }),

  // SQLite + Drizzle Tasks & History CRUD
  getTasks: (workspaceId) => ipcRenderer.invoke('get_tasks', { workspaceId }),
  createTask: (data) => ipcRenderer.invoke('create_task', data),
  updateTask: (id, data) => ipcRenderer.invoke('update_task', { id, data }),
  deleteTask: (id) => ipcRenderer.invoke('delete_task', { id }),
  getTaskHistory: (workspaceId, taskId) => ipcRenderer.invoke('get_task_history', { workspaceId, taskId }),

  // Persistent Settings
  getSettings: () => ipcRenderer.invoke('get_settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set_setting', { key, value }),

  // OS Keychain Credentials (safeStorage)
  setCredential: (key, value) => ipcRenderer.invoke('set_credential', { key, value }),
  getCredential: (key) => ipcRenderer.invoke('get_credential', { key }),
  deleteCredential: (key) => ipcRenderer.invoke('delete_credential', { key }),
  listCredentials: () => ipcRenderer.invoke('list_credentials'),
  isKeychainAvailable: () => ipcRenderer.invoke('is_keychain_available'),

  // Backup & Restore
  exportBackupFile: () => ipcRenderer.invoke('export_backup_file'),
  importBackupFile: () => ipcRenderer.invoke('import_backup_file'),

  // Port and Process Management
  getActivePorts: () => ipcRenderer.invoke('get_active_ports'),
  killProcess: (pid) => ipcRenderer.invoke('kill_process', { pid }),

  // Real Workspace-Aware Git Telemetry
  getGitStatus: (cwd) => ipcRenderer.invoke('get_git_status', { cwd }),
  gitCheckoutBranch: (cwd, branch) => ipcRenderer.invoke('git_checkout_branch', { cwd, branch }),
  gitCreateBranch: (cwd, branch) => ipcRenderer.invoke('git_create_branch', { cwd, branch }),
  gitDiff: (cwd, file, staged) => ipcRenderer.invoke('git_diff', { cwd, file, staged }),
  gitStageFile: (cwd, path, stage) => ipcRenderer.invoke('git_stage_file', { cwd, path, stage }),
  gitCommit: (cwd, message, push) => ipcRenderer.invoke('git_commit', { cwd, message, push }),

  // Workspace-Aware Terminal PTY Bridge
  createPty: (id, cols, rows, cwd, env) => ipcRenderer.invoke('pty_create', { id, cols, rows, cwd, env }),
  writePty: (id, data) => ipcRenderer.send('pty_write', { id, data }),
  resizePty: (id, cols, rows) => ipcRenderer.send('pty_resize', { id, cols, rows }),
  closePty: (id) => ipcRenderer.send('pty_close', { id }),
  onPtyData: (callback) => {
    const handler = (_event, { id, data }) => callback(id, data);
    ipcRenderer.on('pty_data', handler);
    return () => ipcRenderer.removeListener('pty_data', handler);
  },

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('window_minimize'),
  maximizeWindow: () => ipcRenderer.send('window_maximize'),
  closeWindow: () => ipcRenderer.send('window_close'),
  isMaximized: () => ipcRenderer.invoke('window_is_maximized'),
});
