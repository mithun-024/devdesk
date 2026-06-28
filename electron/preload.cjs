const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronBridge', {
  isElectron: true,

  // Port and Process Management
  getActivePorts: () => ipcRenderer.invoke('get_active_ports'),
  killProcess: (pid) => ipcRenderer.invoke('kill_process', { pid }),

  // Git Telemetry
  getGitStatus: () => ipcRenderer.invoke('get_git_status'),
  gitStageFile: (path, stage) => ipcRenderer.invoke('git_stage_file', { path, stage }),
  gitCommit: (message, push) => ipcRenderer.invoke('git_commit', { message, push }),

  // Real Terminal PTY Bridge
  createPty: (id, cols, rows) => ipcRenderer.invoke('pty_create', { id, cols, rows }),
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
