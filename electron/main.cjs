const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec, execFile } = require('child_process');
const fs = require('fs');
const pty = require('node-pty');

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
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    backgroundColor: '#090a0f',
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
      // If dev server not yet up, load file
      if (fs.existsSync(prodPath)) {
        mainWindow.loadFile(prodPath);
      }
    });
  } else {
    mainWindow.loadFile(prodPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Clean up any remaining PTYs
    for (const [id, proc] of ptyProcesses.entries()) {
      try {
        proc.kill();
      } catch (e) {}
    }
    ptyProcesses.clear();
  });
}

app.whenReady().then(() => {
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

// --- Real Port Scanner Handler ---
ipcMain.handle('get_active_ports', async () => {
  return new Promise((resolve) => {
    // Use lsof for clean TCP LISTEN parsing, supplemented by ss
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
            const nameField = parts[8]; // e.g. "127.0.0.1:1420" or "*:8080"
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

      // Also parse ss -tulpn to catch any additional services
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

// --- Real Git Telemetry Handlers ---
ipcMain.handle('get_git_status', async () => {
  const cwd = process.cwd();

  const runGit = (cmd) =>
    new Promise((resolve) => {
      exec(`git ${cmd}`, { cwd }, (err, stdout) => {
        resolve(err ? '' : stdout.trim());
      });
    });

  const currentBranch = (await runGit('branch --show-current')) || 'main';
  const branchListRaw = await runGit('branch --format="%(refname:short)"');
  const branches = branchListRaw ? branchListRaw.split('\n') : ['main'];

  // Ahead / behind count
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

  // Porcelain status for files
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

  // Last commit
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
    currentBranch,
    branches,
    ahead,
    behind,
    files,
    lastCommit,
  };
});

ipcMain.handle('git_stage_file', async (_event, { path: filePath, stage }) => {
  const cwd = process.cwd();
  return new Promise((resolve) => {
    const cmd = stage ? `git add "${filePath}"` : `git restore --staged "${filePath}"`;
    exec(cmd, { cwd }, (err) => resolve(!err));
  });
});

ipcMain.handle('git_commit', async (_event, { message, push }) => {
  const cwd = process.cwd();
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

// --- Real Interactive Terminal (node-pty) ---
ipcMain.handle('pty_create', (_event, { id, cols, rows }) => {
  if (ptyProcesses.has(id)) {
    try {
      ptyProcesses.get(id).kill();
    } catch (e) {}
  }

  const shell = process.env.SHELL || '/bin/bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: cols || 90,
    rows: rows || 30,
    cwd: process.env.HOME || process.cwd(),
    env: {
      ...process.env,
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
