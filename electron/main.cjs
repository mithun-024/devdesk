const { app, BrowserWindow, ipcMain, dialog, safeStorage } = require('electron');
const path = require('path');
const { exec, execFile } = require('child_process');
const fs = require('fs');
const pty = require('node-pty');
const dbManager = require('./db/index.cjs');

let mainWindow = null;
const ptyProcesses = new Map();

function getProcessMemory(pid) {
  try {
    const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8');
    const match = status.match(/VmRSS:\s+(\d+)\s+kB/);
    if (match) {
      return parseFloat((parseInt(match[1], 10) / 1024).toFixed(1));
    }
  } catch (e) {
    // Process might have terminated or unreadable
  }
  return 0;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 980,
    minHeight: 660,
    frame: false,
    backgroundColor: '#16161e', // Tokyo Night Twilight canvas
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = 'http://localhost:1420';
  const prodPath = path.join(__dirname, '../dist/index.html');

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(devUrl).catch(() => {
      if (fs.existsSync(prodPath)) {
        mainWindow.loadFile(prodPath);
      }
    });
  } else {
    mainWindow.loadFile(prodPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    for (const [id, proc] of ptyProcesses.entries()) {
      try {
        proc.kill();
      } catch (e) {}
    }
    ptyProcesses.clear();
  });
}

app.whenReady().then(() => {
  // Initialize SQLite + Drizzle DB
  try {
    dbManager.initDb(app);
  } catch (err) {
    console.error('Failed to initialize SQLite database:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- Window Control Handlers ---
ipcMain.on('window_minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window_maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window_close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window_is_maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// --- Native Directory Picker ---
ipcMain.handle('select_directory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Workspace Directory',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const selectedPath = result.filePaths[0];
  const name = path.basename(selectedPath);
  let isGit = false;
  let branch = 'main';
  try {
    if (fs.existsSync(path.join(selectedPath, '.git'))) {
      isGit = true;
      const stdout = await new Promise((resolve) => {
        exec('git branch --show-current', { cwd: selectedPath }, (err, out) => {
          resolve(err ? '' : out.trim());
        });
      });
      if (stdout) branch = stdout;
    }
  } catch (e) {}

  return {
    path: selectedPath,
    name,
    isGit,
    branch,
  };
});

// --- Database Workspaces CRUD Handlers ---
ipcMain.handle('get_workspaces', async () => {
  return dbManager.getAllWorkspaces();
});

ipcMain.handle('create_workspace', async (_event, data) => {
  return dbManager.createWorkspace(data);
});

ipcMain.handle('update_workspace', async (_event, { id, data }) => {
  return dbManager.updateWorkspace(id, data);
});

ipcMain.handle('delete_workspace', async (_event, { id }) => {
  return dbManager.deleteWorkspace(id);
});

// --- Database Tasks & History CRUD Handlers ---
ipcMain.handle('get_tasks', async (_event, { workspaceId } = {}) => {
  return dbManager.getTasks(workspaceId);
});

ipcMain.handle('create_task', async (_event, data) => {
  return dbManager.createTask(data);
});

ipcMain.handle('update_task', async (_event, { id, data }) => {
  return dbManager.updateTask(id, data);
});

ipcMain.handle('delete_task', async (_event, { id }) => {
  return dbManager.deleteTask(id);
});

ipcMain.handle('get_task_history', async (_event, { workspaceId, taskId } = {}) => {
  return dbManager.getTaskHistory(workspaceId, taskId);
});

// --- Settings Handlers ---
ipcMain.handle('get_settings', async () => {
  return dbManager.getAllSettings();
});

ipcMain.handle('set_setting', async (_event, { key, value }) => {
  return dbManager.setSetting(key, value);
});

// --- OS Keychain Handlers (safeStorage) ---
ipcMain.handle('set_credential', async (_event, { key, value }) => {
  return dbManager.setCredential(key, value, safeStorage);
});

ipcMain.handle('get_credential', async (_event, { key }) => {
  return dbManager.getCredential(key, safeStorage);
});

ipcMain.handle('delete_credential', async (_event, { key }) => {
  return dbManager.deleteCredential(key);
});

ipcMain.handle('list_credentials', async () => {
  return dbManager.listCredentialKeys();
});

ipcMain.handle('is_keychain_available', async () => {
  if (!safeStorage) return false;
  if (safeStorage.isAsyncEncryptionAvailable) {
    try {
      return await safeStorage.isAsyncEncryptionAvailable();
    } catch {
      return false;
    }
  }
  return safeStorage.isEncryptionAvailable ? safeStorage.isEncryptionAvailable() : false;
});

// --- Backup & Restore Handlers ---
ipcMain.handle('export_backup_file', async () => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  const backup = dbManager.exportDatabase();
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export DevDesk Backup',
    defaultPath: `devdesk-backup-${new Date().toISOString().split('T')[0]}.json`,
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }
  fs.writeFileSync(result.filePath, JSON.stringify(backup, null, 2), 'utf8');
  return { success: true, filePath: result.filePath };
});

ipcMain.handle('import_backup_file', async () => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import DevDesk Backup',
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }
  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf8');
    const data = JSON.parse(raw);
    dbManager.importDatabase(data);
    return { success: true, filePath: result.filePaths[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// --- Real Port Scanner Handler ---
ipcMain.handle('get_active_ports', async () => {
  return new Promise((resolve) => {
    exec('lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null', (err, stdout) => {
      const results = [];
      const seenPorts = new Set();

      if (!err && stdout) {
        const lines = stdout.trim().split('\n').slice(1);
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 9) {
            const processName = parts[0];
            const pid = parseInt(parts[1], 10);
            const nameField = parts[8];
            const portMatch = nameField.match(/:(\d+)$/);
            if (portMatch) {
              const port = parseInt(portMatch[1], 10);
              if (!seenPorts.has(port)) {
                seenPorts.add(port);
                results.push({
                  port,
                  pid,
                  processName,
                  protocol: 'tcp',
                  status: 'LISTEN',
                  memoryMb: getProcessMemory(pid),
                });
              }
            }
          }
        }
      }

      exec('ss -tulpn 2>/dev/null', (err2, stdout2) => {
        if (!err2 && stdout2) {
          const lines = stdout2.trim().split('\n').slice(1);
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5) {
              const protocol = parts[0].toLowerCase();
              const state = parts[1];
              if (state === 'LISTEN' || protocol.startsWith('udp')) {
                const localAddr = parts[4];
                const portMatch = localAddr.match(/:(\d+)$/);
                if (portMatch) {
                  const port = parseInt(portMatch[1], 10);
                  if (!seenPorts.has(port)) {
                    seenPorts.add(port);
                    let pid = 0;
                    let processName = 'system/kernel';
                    const procField = parts.slice(6).join(' ');
                    const pidMatch = procField.match(/pid=(\d+)/);
                    const nameMatch = procField.match(/"([^"]+)"/);
                    if (pidMatch) pid = parseInt(pidMatch[1], 10);
                    if (nameMatch) processName = nameMatch[1];

                    results.push({
                      port,
                      pid,
                      processName,
                      protocol,
                      status: state || 'LISTEN',
                      memoryMb: pid > 0 ? getProcessMemory(pid) : 0,
                    });
                  }
                }
              }
            }
          }
        }

        results.sort((a, b) => a.port - b.port);
        resolve(results);
      });
    });
  });
});

// --- Real Process Termination ---
ipcMain.handle('kill_process', async (_event, { pid }) => {
  if (!pid || pid <= 1) {
    return { success: false, message: 'Invalid or protected PID' };
  }
  try {
    process.kill(pid, 'SIGTERM');
    return { success: true, message: `Sent SIGTERM to process PID ${pid}` };
  } catch (e) {
    try {
      process.kill(pid, 'SIGKILL');
      return { success: true, message: `Terminated PID ${pid} with SIGKILL` };
    } catch (err) {
      return { success: false, message: `Failed to terminate PID ${pid}: ${err.message}` };
    }
  }
});

// --- Real Workspace-Aware Git Telemetry Handlers ---
ipcMain.handle('get_git_status', async (_event, { cwd: targetCwd } = {}) => {
  const cwd = targetCwd || process.cwd();

  const runGit = (cmd) =>
    new Promise((resolve) => {
      exec(`git ${cmd}`, { cwd }, (err, stdout) => {
        resolve(err ? '' : stdout.trim());
      });
    });

  // Check if target directory is inside a git repo
  const isRepoCheck = await runGit('rev-parse --is-inside-work-tree');
  if (isRepoCheck !== 'true') {
    return {
      isRepo: false,
      currentBranch: '',
      branches: [],
      ahead: 0,
      behind: 0,
      files: [],
      lastCommit: undefined,
    };
  }

  const currentBranch = (await runGit('branch --show-current')) || 'main';
  const branchListRaw = await runGit('branch --format="%(refname:short)"');
  const branches = branchListRaw ? branchListRaw.split('\n').filter(Boolean) : ['main'];

  let ahead = 0;
  let behind = 0;
  const revList = await runGit(`rev-list --left-right --count HEAD...origin/${currentBranch} 2>/dev/null`);
  if (revList) {
    const counts = revList.split(/\s+/);
    if (counts.length >= 2) {
      ahead = parseInt(counts[0], 10) || 0;
      behind = parseInt(counts[1], 10) || 0;
    }
  }

  const statusRaw = await runGit('status --porcelain=v1');
  const files = [];
  if (statusRaw) {
    const lines = statusRaw.split('\n');
    for (const line of lines) {
      if (line.length < 4) continue;
      const indexStatus = line[0];
      const workTreeStatus = line[1];
      const filePath = line.substring(3).trim();

      const staged = indexStatus !== ' ' && indexStatus !== '?';
      let status = 'modified';
      if (indexStatus === 'A' || workTreeStatus === '?') status = 'added';
      else if (indexStatus === 'D' || workTreeStatus === 'D') status = 'deleted';

      files.push({
        path: filePath,
        status,
        staged,
      });
    }
  }

  const logRaw = await runGit('log -n 1 --pretty=format:"%h|%s|%an <%ae>|%ad" --date=format:"%Y-%m-%d %H:%M:%S %z"');
  let lastCommit = undefined;
  if (logRaw) {
    const parts = logRaw.split('|');
    if (parts.length >= 4) {
      lastCommit = {
        hash: parts[0],
        message: parts[1],
        author: parts[2],
        date: parts[3],
      };
    }
  }

  return {
    isRepo: true,
    currentBranch,
    branches,
    ahead,
    behind,
    files,
    lastCommit,
  };
});

ipcMain.handle('git_checkout_branch', async (_event, { cwd: targetCwd, branch }) => {
  const cwd = targetCwd || process.cwd();
  return new Promise((resolve) => {
    exec(`git checkout "${branch}"`, { cwd }, (err, stdout, stderr) => {
      resolve({ success: !err, message: err ? stderr || err.message : stdout });
    });
  });
});

ipcMain.handle('git_create_branch', async (_event, { cwd: targetCwd, branch }) => {
  const cwd = targetCwd || process.cwd();
  return new Promise((resolve) => {
    exec(`git checkout -b "${branch}"`, { cwd }, (err, stdout, stderr) => {
      resolve({ success: !err, message: err ? stderr || err.message : stdout });
    });
  });
});

ipcMain.handle('git_diff', async (_event, { cwd: targetCwd, file, staged } = {}) => {
  const cwd = targetCwd || process.cwd();
  return new Promise((resolve) => {
    const cmd = staged
      ? `git diff --cached ${file ? `"${file}"` : ''}`
      : `git diff ${file ? `"${file}"` : ''}`;
    exec(cmd, { cwd }, (err, stdout) => {
      resolve(err ? '' : stdout);
    });
  });
});

ipcMain.handle('git_stage_file', async (_event, { cwd: targetCwd, path: filePath, stage }) => {
  const cwd = targetCwd || process.cwd();
  return new Promise((resolve) => {
    const cmd = stage ? `git add "${filePath}"` : `git restore --staged "${filePath}"`;
    exec(cmd, { cwd }, (err) => resolve(!err));
  });
});

ipcMain.handle('git_commit', async (_event, { cwd: targetCwd, message, push }) => {
  const cwd = targetCwd || process.cwd();
  return new Promise((resolve) => {
    const safeMsg = message.replace(/"/g, '\\"');
    exec(`git commit -m "${safeMsg}"`, { cwd }, (err, stdout) => {
      if (err) {
        return resolve({ success: false, error: err.message });
      }
      const match = stdout.match(/\[[^\s]+\s+([a-f0-9]+)\]/);
      const hash = match ? match[1] : undefined;

      if (push) {
        exec('git push', { cwd }, (pushErr) => {
          if (pushErr) {
            return resolve({ success: true, hash, error: `Committed, but push failed: ${pushErr.message}` });
          }
          resolve({ success: true, hash });
        });
      } else {
        resolve({ success: true, hash });
      }
    });
  });
});

// --- Real Workspace-Aware Terminal (node-pty) ---
ipcMain.handle('pty_create', (_event, { id, cols, rows, cwd: workspaceCwd, env: customEnv }) => {
  if (ptyProcesses.has(id)) {
    try {
      ptyProcesses.get(id).kill();
    } catch (e) {}
  }

  const shell = process.env.SHELL || '/bin/bash';
  const effectiveCwd = (workspaceCwd && fs.existsSync(workspaceCwd))
    ? workspaceCwd
    : (process.env.HOME || process.cwd());

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: cols || 90,
    rows: rows || 30,
    cwd: effectiveCwd,
    env: {
      ...process.env,
      ...(customEnv || {}),
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
    },
  });

  ptyProcesses.set(id, ptyProcess);

  ptyProcess.onData((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pty_data', { id, data });
    }
  });

  ptyProcess.onExit(() => {
    ptyProcesses.delete(id);
  });

  return true;
});

ipcMain.on('pty_write', (_event, { id, data }) => {
  const proc = ptyProcesses.get(id);
  if (proc) {
    try {
      proc.write(data);
    } catch (e) {}
  }
});

ipcMain.on('pty_resize', (_event, { id, cols, rows }) => {
  const proc = ptyProcesses.get(id);
  if (proc) {
    try {
      proc.resize(cols, rows);
    } catch (e) {}
  }
});

ipcMain.on('pty_close', (_event, { id }) => {
  const proc = ptyProcesses.get(id);
  if (proc) {
    try {
      proc.kill();
    } catch (e) {}
    ptyProcesses.delete(id);
  }
});
