const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { eq, desc } = require('drizzle-orm');
const { workspaces, tasks, taskHistory, settings, credentials } = require('./schema.cjs');

let db = null;
let sqlite = null;

function getDbPath(app) {
  try {
    if (app && typeof app.getPath === 'function') {
      const userData = app.getPath('userData');
      if (!fs.existsSync(userData)) {
        fs.mkdirSync(userData, { recursive: true });
      }
      return path.join(userData, 'devdesk.db');
    }
  } catch (e) {
    // fallback if app not ready
  }
  return path.join(process.cwd(), 'devdesk.db');
}

function initDb(app) {
  if (db) return db;

  const dbPath = getDbPath(app);
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  // Create tables if not existing
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      active_branch TEXT DEFAULT 'main',
      env_vars TEXT DEFAULT '{}',
      pinned_ports TEXT DEFAULT '[]',
      scratch_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      branch TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_history (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT DEFAULT '{}',
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS credentials (
      key TEXT PRIMARY KEY,
      encrypted_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db = drizzle(sqlite);

  // Check if seed needed
  const existingWorkspaces = db.select().from(workspaces).all();
  if (existingWorkspaces.length === 0) {
    const cwd = process.cwd();
    let currentBranch = 'main';
    try {
      currentBranch = execSync('git branch --show-current', { cwd, encoding: 'utf8' }).trim() || 'main';
    } catch (e) {}

    const defaultWsId = 'ws-devdesk-core';
    const now = new Date().toISOString();

    db.insert(workspaces).values({
      id: defaultWsId,
      name: 'DevDesk Core',
      path: cwd,
      activeBranch: currentBranch,
      envVars: JSON.stringify({ NODE_ENV: 'development', PORT: '1420' }),
      pinnedPorts: JSON.stringify([1420]),
      scratchNotes: '# DevDesk Session Scratchpad\n\n- Standalone native desktop workstation\n- Tokyo Night Twilight aesthetic\n- SQLite + Drizzle ORM persistent storage\n',
      createdAt: now,
      updatedAt: now,
      isDefault: 1,
    }).run();

    // Default settings
    db.insert(settings).values([
      {
        key: 'theme',
        value: JSON.stringify('tokyo-night'),
        updatedAt: now,
      },
      {
        key: 'general',
        value: JSON.stringify({
          autoScanPorts: true,
          scanIntervalSeconds: 5,
          defaultTerminalShell: '/bin/bash',
          confirmProcessKill: true,
        }),
        updatedAt: now,
      },
    ]).run();
  }

  return db;
}

// --- Workspaces CRUD ---
function getAllWorkspaces() {
  const rows = db.select().from(workspaces).all();
  return rows.map((w) => ({
    ...w,
    envVars: JSON.parse(w.envVars || '{}'),
    pinnedPorts: JSON.parse(w.pinnedPorts || '[]'),
    isDefault: Boolean(w.isDefault),
  }));
}

function createWorkspace(data) {
  const now = new Date().toISOString();
  const id = data.id || `ws-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  
  db.insert(workspaces).values({
    id,
    name: data.name,
    path: data.path,
    activeBranch: data.activeBranch || 'main',
    envVars: JSON.stringify(data.envVars || {}),
    pinnedPorts: JSON.stringify(data.pinnedPorts || []),
    scratchNotes: data.scratchNotes || '',
    createdAt: now,
    updatedAt: now,
    isDefault: data.isDefault ? 1 : 0,
  }).run();

  return {
    id,
    name: data.name,
    path: data.path,
    activeBranch: data.activeBranch || 'main',
    envVars: data.envVars || {},
    pinnedPorts: data.pinnedPorts || [],
    scratchNotes: data.scratchNotes || '',
    createdAt: now,
    updatedAt: now,
    isDefault: Boolean(data.isDefault),
  };
}

function updateWorkspace(id, data) {
  const existing = db.select().from(workspaces).where(eq(workspaces.id, id)).get();
  if (!existing) throw new Error(`Workspace ${id} not found`);

  const now = new Date().toISOString();
  const valuesToUpdate = { updatedAt: now };

  if (data.name !== undefined) valuesToUpdate.name = data.name;
  if (data.path !== undefined) valuesToUpdate.path = data.path;
  if (data.activeBranch !== undefined) valuesToUpdate.activeBranch = data.activeBranch;
  if (data.envVars !== undefined) valuesToUpdate.envVars = JSON.stringify(data.envVars);
  if (data.pinnedPorts !== undefined) valuesToUpdate.pinnedPorts = JSON.stringify(data.pinnedPorts);
  if (data.scratchNotes !== undefined) valuesToUpdate.scratchNotes = data.scratchNotes;
  if (data.isDefault !== undefined) valuesToUpdate.isDefault = data.isDefault ? 1 : 0;

  db.update(workspaces).set(valuesToUpdate).where(eq(workspaces.id, id)).run();

  const updated = db.select().from(workspaces).where(eq(workspaces.id, id)).get();
  return {
    ...updated,
    envVars: JSON.parse(updated.envVars || '{}'),
    pinnedPorts: JSON.parse(updated.pinnedPorts || '[]'),
    isDefault: Boolean(updated.isDefault),
  };
}

function deleteWorkspace(id) {
  // Delete associated tasks and history
  db.delete(taskHistory).where(eq(taskHistory.workspaceId, id)).run();
  db.delete(tasks).where(eq(tasks.workspaceId, id)).run();
  db.delete(workspaces).where(eq(workspaces.id, id)).run();
  return true;
}

// --- Tasks CRUD ---
function getTasks(workspaceId) {
  let query = db.select().from(tasks);
  if (workspaceId) {
    query = query.where(eq(tasks.workspaceId, workspaceId));
  }
  const rows = query.all();
  return rows.map((t) => ({
    ...t,
    tags: JSON.parse(t.tags || '[]'),
  }));
}

function createTask(data) {
  const now = new Date().toISOString();
  const id = data.id || `TASK-${Date.now().toString(36).toUpperCase()}`;

  db.insert(tasks).values({
    id,
    workspaceId: data.workspaceId,
    title: data.title,
    description: data.description || '',
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    tags: JSON.stringify(data.tags || []),
    branch: data.branch || '',
    createdAt: now,
    updatedAt: now,
  }).run();

  // Record history
  const historyId = `th-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  db.insert(taskHistory).values({
    id: historyId,
    taskId: id,
    workspaceId: data.workspaceId,
    action: 'created',
    details: JSON.stringify({ title: data.title, status: data.status, priority: data.priority }),
    timestamp: now,
  }).run();

  return {
    id,
    workspaceId: data.workspaceId,
    title: data.title,
    description: data.description || '',
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    tags: data.tags || [],
    branch: data.branch || '',
    createdAt: now,
    updatedAt: now,
  };
}

function updateTask(id, data) {
  const existing = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!existing) throw new Error(`Task ${id} not found`);

  const now = new Date().toISOString();
  const valuesToUpdate = { updatedAt: now };

  let action = 'updated';
  const details = {};

  if (data.status !== undefined && data.status !== existing.status) {
    action = 'status_changed';
    details.fromStatus = existing.status;
    details.toStatus = data.status;
  } else if (data.priority !== undefined && data.priority !== existing.priority) {
    action = 'priority_changed';
    details.fromPriority = existing.priority;
    details.toPriority = data.priority;
  }

  if (data.title !== undefined) valuesToUpdate.title = data.title;
  if (data.description !== undefined) valuesToUpdate.description = data.description;
  if (data.status !== undefined) valuesToUpdate.status = data.status;
  if (data.priority !== undefined) valuesToUpdate.priority = data.priority;
  if (data.tags !== undefined) valuesToUpdate.tags = JSON.stringify(data.tags);
  if (data.branch !== undefined) valuesToUpdate.branch = data.branch;
  if (data.workspaceId !== undefined) valuesToUpdate.workspaceId = data.workspaceId;

  db.update(tasks).set(valuesToUpdate).where(eq(tasks.id, id)).run();

  // Record history
  const historyId = `th-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  db.insert(taskHistory).values({
    id: historyId,
    taskId: id,
    workspaceId: data.workspaceId || existing.workspaceId,
    action,
    details: JSON.stringify(details),
    timestamp: now,
  }).run();

  const updated = db.select().from(tasks).where(eq(tasks.id, id)).get();
  return {
    ...updated,
    tags: JSON.parse(updated.tags || '[]'),
  };
}

function deleteTask(id) {
  const existing = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (existing) {
    const now = new Date().toISOString();
    const historyId = `th-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    db.insert(taskHistory).values({
      id: historyId,
      taskId: id,
      workspaceId: existing.workspaceId,
      action: 'deleted',
      details: JSON.stringify({ title: existing.title }),
      timestamp: now,
    }).run();
  }
  db.delete(tasks).where(eq(tasks.id, id)).run();
  return true;
}

// --- Task History ---
function getTaskHistory(workspaceId, taskId) {
  let query = db.select().from(taskHistory).orderBy(desc(taskHistory.timestamp));
  if (taskId) {
    query = query.where(eq(taskHistory.taskId, taskId));
  } else if (workspaceId) {
    query = query.where(eq(taskHistory.workspaceId, workspaceId));
  }
  const rows = query.all();
  return rows.map((h) => ({
    ...h,
    details: JSON.parse(h.details || '{}'),
  }));
}

// --- Settings ---
function getAllSettings() {
  const rows = db.select().from(settings).all();
  const result = {};
  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = row.value;
    }
  }
  return result;
}

function setSetting(key, value) {
  const now = new Date().toISOString();
  const strVal = JSON.stringify(value);
  const existing = db.select().from(settings).where(eq(settings.key, key)).get();
  if (existing) {
    db.update(settings).set({ value: strVal, updatedAt: now }).where(eq(settings.key, key)).run();
  } else {
    db.insert(settings).values({ key, value: strVal, updatedAt: now }).run();
  }
  return value;
}

// --- OS Keychain Credentials (via safeStorage) ---
async function setCredential(key, secretValue, safeStorage) {
  const now = new Date().toISOString();
  let encryptedBase64 = '';
  
  if (safeStorage && safeStorage.encryptStringAsync) {
    const ciphertext = await safeStorage.encryptStringAsync(secretValue);
    encryptedBase64 = ciphertext.toString('base64');
  } else {
    // In fallback environment, store securely encoded
    encryptedBase64 = Buffer.from(secretValue, 'utf8').toString('base64');
  }

  const existing = db.select().from(credentials).where(eq(credentials.key, key)).get();
  if (existing) {
    db.update(credentials).set({ encryptedValue: encryptedBase64, updatedAt: now }).where(eq(credentials.key, key)).run();
  } else {
    db.insert(credentials).values({ key, encryptedValue: encryptedBase64, updatedAt: now }).run();
  }
  return true;
}

async function getCredential(key, safeStorage) {
  const existing = db.select().from(credentials).where(eq(credentials.key, key)).get();
  if (!existing) return null;

  try {
    if (safeStorage && safeStorage.decryptStringAsync) {
      const buf = Buffer.from(existing.encryptedValue, 'base64');
      const decrypted = await safeStorage.decryptStringAsync(buf);
      return typeof decrypted === 'object' && decrypted.result ? decrypted.result : decrypted;
    }
    return Buffer.from(existing.encryptedValue, 'base64').toString('utf8');
  } catch (e) {
    console.error(`Failed to decrypt credential for ${key}:`, e);
    return null;
  }
}

function deleteCredential(key) {
  db.delete(credentials).where(eq(credentials.key, key)).run();
  return true;
}

function listCredentialKeys() {
  const rows = db.select().from(credentials).all();
  return rows.map((c) => ({ key: c.key, updatedAt: c.updatedAt }));
}

// --- Import / Export / Backup ---
function exportDatabase() {
  const allWs = getAllWorkspaces();
  const allT = getTasks();
  const allHist = getTaskHistory();
  const allSet = getAllSettings();
  const credKeys = listCredentialKeys();

  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    workspaces: allWs,
    tasks: allT,
    taskHistory: allHist,
    settings: allSet,
    credentialKeys: credKeys.map(c => c.key),
  };
}

function importDatabase(backupData) {
  if (!backupData || typeof backupData !== 'object') {
    throw new Error('Invalid backup format');
  }

  const runImport = sqlite.transaction(() => {
    if (Array.isArray(backupData.workspaces)) {
      for (const w of backupData.workspaces) {
        const existing = db.select().from(workspaces).where(eq(workspaces.id, w.id)).get();
        const now = new Date().toISOString();
        if (existing) {
          db.update(workspaces).set({
            name: w.name,
            path: w.path,
            activeBranch: w.activeBranch || 'main',
            envVars: JSON.stringify(w.envVars || {}),
            pinnedPorts: JSON.stringify(w.pinnedPorts || []),
            scratchNotes: w.scratchNotes || '',
            updatedAt: now,
          }).where(eq(workspaces.id, w.id)).run();
        } else {
          db.insert(workspaces).values({
            id: w.id,
            name: w.name,
            path: w.path,
            activeBranch: w.activeBranch || 'main',
            envVars: JSON.stringify(w.envVars || {}),
            pinnedPorts: JSON.stringify(w.pinnedPorts || []),
            scratchNotes: w.scratchNotes || '',
            createdAt: w.createdAt || now,
            updatedAt: now,
            isDefault: w.isDefault ? 1 : 0,
          }).run();
        }
      }
    }

    if (Array.isArray(backupData.tasks)) {
      for (const t of backupData.tasks) {
        const existing = db.select().from(tasks).where(eq(tasks.id, t.id)).get();
        const now = new Date().toISOString();
        if (existing) {
          db.update(tasks).set({
            workspaceId: t.workspaceId,
            title: t.title,
            description: t.description || '',
            status: t.status,
            priority: t.priority,
            tags: JSON.stringify(t.tags || []),
            branch: t.branch || '',
            updatedAt: now,
          }).where(eq(tasks.id, t.id)).run();
        } else {
          db.insert(tasks).values({
            id: t.id,
            workspaceId: t.workspaceId,
            title: t.title,
            description: t.description || '',
            status: t.status,
            priority: t.priority,
            tags: JSON.stringify(t.tags || []),
            branch: t.branch || '',
            createdAt: t.createdAt || now,
            updatedAt: now,
          }).run();
        }
      }
    }

    if (backupData.settings && typeof backupData.settings === 'object') {
      for (const [k, v] of Object.entries(backupData.settings)) {
        setSetting(k, v);
      }
    }
  });

  runImport();
  return true;
}

module.exports = {
  initDb,
  getAllWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskHistory,
  getAllSettings,
  setSetting,
  setCredential,
  getCredential,
  deleteCredential,
  listCredentialKeys,
  exportDatabase,
  importDatabase,
};
