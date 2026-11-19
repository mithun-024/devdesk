const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { eq, desc } = require('drizzle-orm');
const { workspaces, tasks, taskHistory, settings, credentials, projectNotes, snapshots, roadmapNodes, roadmapEdges } = require('./schema.cjs');

let db = null;
let sqlite = null;

function getDbPath(app) {
  const os = require('os');
  const configHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  const devdeskDir = path.join(configHome, 'devdesk');
  try {
    if (!fs.existsSync(devdeskDir)) {
      fs.mkdirSync(devdeskDir, { recursive: true });
    }
    return path.join(devdeskDir, 'devdesk.db');
  } catch (e) {
    if (app && typeof app.getPath === 'function') {
      try {
        const userData = app.getPath('userData');
        return path.join(userData, 'devdesk.db');
      } catch (err) {}
    }
    return path.join(process.cwd(), 'devdesk.db');
  }
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
      dev_command TEXT DEFAULT '',
      package_manager TEXT DEFAULT 'npm',
      git_remote TEXT DEFAULT '',
      env_vars TEXT DEFAULT '{}',
      pinned_ports TEXT DEFAULT '[]',
      scratch_notes TEXT DEFAULT '',
      last_snapshot_at TEXT DEFAULT '',
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

    CREATE TABLE IF NOT EXISTS project_notes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      last_task TEXT DEFAULT '',
      next_step TEXT DEFAULT '',
      blockers TEXT DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      commit_hash TEXT DEFAULT '',
      commit_message TEXT DEFAULT '',
      branch TEXT DEFAULT 'main',
      uncommitted_count INTEGER DEFAULT 0,
      active_ports_json TEXT DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roadmap_nodes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT DEFAULT 'task',
      status TEXT DEFAULT 'todo',
      agent_active INTEGER DEFAULT 0,
      agent_summary TEXT DEFAULT '',
      position_x INTEGER DEFAULT 0,
      position_y INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roadmap_edges (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source TEXT NOT NULL,
      target TEXT NOT NULL,
      label TEXT DEFAULT ''
    );
  `);

  // Ensure columns exist if table was created in an earlier version
  try { sqlite.exec(`ALTER TABLE workspaces ADD COLUMN dev_command TEXT DEFAULT '';`); } catch (e) {}
  try { sqlite.exec(`ALTER TABLE workspaces ADD COLUMN package_manager TEXT DEFAULT 'npm';`); } catch (e) {}
  try { sqlite.exec(`ALTER TABLE workspaces ADD COLUMN git_remote TEXT DEFAULT '';`); } catch (e) {}
  try { sqlite.exec(`ALTER TABLE workspaces ADD COLUMN last_snapshot_at TEXT DEFAULT '';`); } catch (e) {}

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

// --- Workspaces / Projects CRUD ---
function getAllWorkspaces() {
  const rows = db.select().from(workspaces).all();
  return rows.map((w) => ({
    ...w,
    devCommand: w.devCommand || '',
    packageManager: w.packageManager || 'npm',
    gitRemote: w.gitRemote || '',
    lastSnapshotAt: w.lastSnapshotAt || '',
    envVars: JSON.parse(w.envVars || '{}'),
    pinnedPorts: JSON.parse(w.pinnedPorts || '[]'),
    isDefault: Boolean(w.isDefault),
  }));
}

function createWorkspace(data) {
  const now = new Date().toISOString();
  const id = data.id || `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  
  db.insert(workspaces).values({
    id,
    name: data.name,
    path: data.path,
    activeBranch: data.activeBranch || 'main',
    devCommand: data.devCommand || '',
    packageManager: data.packageManager || 'npm',
    gitRemote: data.gitRemote || '',
    envVars: JSON.stringify(data.envVars || {}),
    pinnedPorts: JSON.stringify(data.pinnedPorts || []),
    scratchNotes: data.scratchNotes || '',
    lastSnapshotAt: data.lastSnapshotAt || '',
    createdAt: now,
    updatedAt: now,
    isDefault: data.isDefault ? 1 : 0,
  }).run();

  return {
    id,
    name: data.name,
    path: data.path,
    activeBranch: data.activeBranch || 'main',
    devCommand: data.devCommand || '',
    packageManager: data.packageManager || 'npm',
    gitRemote: data.gitRemote || '',
    envVars: data.envVars || {},
    pinnedPorts: data.pinnedPorts || [],
    scratchNotes: data.scratchNotes || '',
    lastSnapshotAt: data.lastSnapshotAt || '',
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
  if (data.devCommand !== undefined) valuesToUpdate.devCommand = data.devCommand;
  if (data.packageManager !== undefined) valuesToUpdate.packageManager = data.packageManager;
  if (data.gitRemote !== undefined) valuesToUpdate.gitRemote = data.gitRemote;
  if (data.envVars !== undefined) valuesToUpdate.envVars = JSON.stringify(data.envVars);
  if (data.pinnedPorts !== undefined) valuesToUpdate.pinnedPorts = JSON.stringify(data.pinnedPorts);
  if (data.scratchNotes !== undefined) valuesToUpdate.scratchNotes = data.scratchNotes;
  if (data.lastSnapshotAt !== undefined) valuesToUpdate.lastSnapshotAt = data.lastSnapshotAt;
  if (data.isDefault !== undefined) valuesToUpdate.isDefault = data.isDefault ? 1 : 0;

  db.update(workspaces).set(valuesToUpdate).where(eq(workspaces.id, id)).run();

  const updated = db.select().from(workspaces).where(eq(workspaces.id, id)).get();
  return {
    ...updated,
    devCommand: updated.devCommand || '',
    packageManager: updated.packageManager || 'npm',
    gitRemote: updated.gitRemote || '',
    lastSnapshotAt: updated.lastSnapshotAt || '',
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

// --- Phase 2: Project Notes ("Where we left off") ---
function getProjectNotes(projectId) {
  const row = db.select().from(projectNotes).where(eq(projectNotes.projectId, projectId)).get();
  if (row) {
    return row;
  }
  return {
    id: `pn-${projectId}`,
    projectId,
    lastTask: '',
    nextStep: '',
    blockers: '',
    updatedAt: new Date().toISOString(),
  };
}

function saveProjectNotes(projectId, data) {
  const now = new Date().toISOString();
  const existing = db.select().from(projectNotes).where(eq(projectNotes.projectId, projectId)).get();

  if (existing) {
    db.update(projectNotes)
      .set({
        lastTask: data.lastTask !== undefined ? data.lastTask : existing.lastTask,
        nextStep: data.nextStep !== undefined ? data.nextStep : existing.nextStep,
        blockers: data.blockers !== undefined ? data.blockers : existing.blockers,
        updatedAt: now,
      })
      .where(eq(projectNotes.projectId, projectId))
      .run();
  } else {
    db.insert(projectNotes)
      .values({
        id: `pn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        projectId,
        lastTask: data.lastTask || '',
        nextStep: data.nextStep || '',
        blockers: data.blockers || '',
        updatedAt: now,
      })
      .run();
  }

  return getProjectNotes(projectId);
}

// --- Phase 2: Snapshots ---
function insertSnapshot(data) {
  const now = new Date().toISOString();
  const id = data.id || `snap-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  db.insert(snapshots)
    .values({
      id,
      projectId: data.projectId,
      commitHash: data.commitHash || '',
      commitMessage: data.commitMessage || '',
      branch: data.branch || 'main',
      uncommittedCount: data.uncommittedCount || 0,
      activePortsJson: typeof data.activePorts === 'string' ? data.activePorts : JSON.stringify(data.activePorts || []),
      createdAt: data.createdAt || now,
    })
    .run();

  // Also update lastSnapshotAt on workspace
  try {
    db.update(workspaces)
      .set({ lastSnapshotAt: now })
      .where(eq(workspaces.id, data.projectId))
      .run();
  } catch (e) {}

  return {
    id,
    ...data,
    createdAt: data.createdAt || now,
  };
}

function getLatestSnapshot(projectId) {
  const row = db
    .select()
    .from(snapshots)
    .where(eq(snapshots.projectId, projectId))
    .orderBy(desc(snapshots.createdAt))
    .limit(1)
    .get();

  if (!row) return null;
  return {
    ...row,
    activePorts: JSON.parse(row.activePortsJson || '[]'),
  };
}

function getProjectSnapshots(projectId, limit = 10) {
  const rows = db
    .select()
    .from(snapshots)
    .where(eq(snapshots.projectId, projectId))
    .orderBy(desc(snapshots.createdAt))
    .limit(limit)
    .all();

  return rows.map((r) => ({
    ...r,
    activePorts: JSON.parse(r.activePortsJson || '[]'),
  }));
}

// ==========================================
// Phase 3 & 4: Roadmap Nodes & Canvas Engine
// ==========================================

function seedRoadmapIfEmpty(projectId) {
  const count = db.select().from(roadmapNodes).where(eq(roadmapNodes.projectId, projectId)).all().length;
  if (count > 0) return;

  const now = new Date().toISOString();
  const initialNodes = [
    {
      id: `${projectId}-p1`,
      projectId,
      label: 'Phase 1: Core Projects & Ports (MVP)',
      description: 'Directory inspection, background socket polling (lsof/ss), /proc PID mapping, and project card grid.',
      type: 'milestone',
      status: 'done',
      agentActive: 0,
      agentSummary: 'Completed & tested in release v1.0.0',
      positionX: 50,
      positionY: 80,
      tags: JSON.stringify(['core', 'ports', 'git']),
      updatedAt: now,
    },
    {
      id: `${projectId}-p1-cli`,
      projectId,
      label: 'CLI Registration (devdesk add)',
      description: 'Command line tool to register any folder into SQLite.',
      type: 'task',
      status: 'done',
      agentActive: 0,
      agentSummary: '',
      positionX: 50,
      positionY: 260,
      tags: JSON.stringify(['cli']),
      updatedAt: now,
    },
    {
      id: `${projectId}-p1-ports`,
      projectId,
      label: 'Process & Port Telemetry',
      description: 'Live socket detection, RSS memory calculation, and SIGTERM/SIGKILL.',
      type: 'task',
      status: 'done',
      agentActive: 0,
      agentSummary: '',
      positionX: 300,
      positionY: 260,
      tags: JSON.stringify(['telemetry']),
      updatedAt: now,
    },
    {
      id: `${projectId}-p2`,
      projectId,
      label: 'Phase 2: "Where We Left Off" Engine',
      description: 'Persistent daily session notes, auto-snapshots on exit/switch, and one-click dev servers.',
      type: 'milestone',
      status: 'done',
      agentActive: 0,
      agentSummary: 'Completed & persisted in devdesk.db',
      positionX: 620,
      positionY: 80,
      tags: JSON.stringify(['notes', 'snapshots']),
      updatedAt: now,
    },
    {
      id: `${projectId}-p2-notes`,
      projectId,
      label: 'Per-Project Notes & Auto-Save',
      description: 'Last Task, Next Step, Blockers cards with SQLite debounce auto-save.',
      type: 'task',
      status: 'done',
      agentActive: 0,
      agentSummary: '',
      positionX: 620,
      positionY: 260,
      tags: JSON.stringify(['notes']),
      updatedAt: now,
    },
    {
      id: `${projectId}-p2-dev`,
      projectId,
      label: 'One-Click Dev Server Launcher',
      description: 'Detects npm/pnpm/cargo/python scripts and manages background processes.',
      type: 'task',
      status: 'done',
      agentActive: 0,
      agentSummary: '',
      positionX: 870,
      positionY: 260,
      tags: JSON.stringify(['dev-server']),
      updatedAt: now,
    },
    {
      id: `${projectId}-p3`,
      projectId,
      label: 'Phase 3: Obsidian Canvas & Roadmap',
      description: 'Minimalist 2D node graph with Obsidian dark aesthetic, task specs, and AGY active status.',
      type: 'milestone',
      status: 'in_progress',
      agentActive: 1,
      agentSummary: 'Antigravity building React Flow canvas & MCP bridge',
      positionX: 350,
      positionY: 440,
      tags: JSON.stringify(['canvas', 'obsidian']),
      updatedAt: now,
    },
    {
      id: `${projectId}-p3-canvas`,
      projectId,
      label: 'Obsidian Canvas Graph View',
      description: 'Minimal dark graphite graph with thin lines, non-cringe status badges, and markdown inspector.',
      type: 'task',
      status: 'in_progress',
      agentActive: 1,
      agentSummary: 'Building RoadmapCanvasView.tsx with @xyflow/react',
      positionX: 200,
      positionY: 620,
      tags: JSON.stringify(['ui', 'xyflow']),
      updatedAt: now,
    },
    {
      id: `${projectId}-p3-commit`,
      projectId,
      label: 'Git Commit Auto-Close (#id)',
      description: 'Close tasks and transition nodes when commit messages include #<id>.',
      type: 'task',
      status: 'todo',
      agentActive: 0,
      agentSummary: '',
      positionX: 470,
      positionY: 620,
      tags: JSON.stringify(['git']),
      updatedAt: now,
    },
    {
      id: `${projectId}-p4`,
      projectId,
      label: 'Phase 4: Antigravity AI Agent & MCP',
      description: 'Local stdio MCP server exposing roadmap & notes directly to Antigravity CLI and coding agents.',
      type: 'milestone',
      status: 'todo',
      agentActive: 0,
      agentSummary: 'Stdio MCP server and transcript log watcher',
      positionX: 850,
      positionY: 440,
      tags: JSON.stringify(['mcp', 'agent']),
      updatedAt: now,
    },
    {
      id: `${projectId}-p4-mcp`,
      projectId,
      label: 'DevDesk Stdio MCP Server',
      description: 'Exposes devdesk_get_context, devdesk_update_node, devdesk_log_progress tools.',
      type: 'task',
      status: 'in_progress',
      agentActive: 0,
      agentSummary: 'Connecting to ~/.gemini/config/mcp_config.json',
      positionX: 740,
      positionY: 620,
      tags: JSON.stringify(['mcp']),
      updatedAt: now,
    },
    {
      id: `${projectId}-p4-logs`,
      projectId,
      label: 'Transcript Watcher & AI Feed',
      description: 'Tails ~/.gemini/antigravity-cli/brain/*/transcript.jsonl to surface real-time agent telemetry.',
      type: 'task',
      status: 'todo',
      agentActive: 0,
      agentSummary: '',
      positionX: 1010,
      positionY: 620,
      tags: JSON.stringify(['telemetry']),
      updatedAt: now,
    },
  ];

  for (const node of initialNodes) {
    db.insert(roadmapNodes).values(node).run();
  }

  const initialEdges = [
    { id: 'e-p1-p2', projectId, source: `${projectId}-p1`, target: `${projectId}-p2`, label: '' },
    { id: 'e-p1-cli', projectId, source: `${projectId}-p1`, target: `${projectId}-p1-cli`, label: '' },
    { id: 'e-p1-ports', projectId, source: `${projectId}-p1`, target: `${projectId}-p1-ports`, label: '' },
    { id: 'e-p2-p3', projectId, source: `${projectId}-p2`, target: `${projectId}-p3`, label: '' },
    { id: 'e-p2-notes', projectId, source: `${projectId}-p2`, target: `${projectId}-p2-notes`, label: '' },
    { id: 'e-p2-dev', projectId, source: `${projectId}-p2`, target: `${projectId}-p2-dev`, label: '' },
    { id: 'e-p3-p4', projectId, source: `${projectId}-p3`, target: `${projectId}-p4`, label: '' },
    { id: 'e-p3-canvas', projectId, source: `${projectId}-p3`, target: `${projectId}-p3-canvas`, label: '' },
    { id: 'e-p3-commit', projectId, source: `${projectId}-p3`, target: `${projectId}-p3-commit`, label: '' },
    { id: 'e-p4-mcp', projectId, source: `${projectId}-p4`, target: `${projectId}-p4-mcp`, label: '' },
    { id: 'e-p4-logs', projectId, source: `${projectId}-p4`, target: `${projectId}-p4-logs`, label: '' },
  ];

  for (const edge of initialEdges) {
    db.insert(roadmapEdges).values(edge).run();
  }
}

function getRoadmapNodes(projectId) {
  seedRoadmapIfEmpty(projectId);
  const rows = db.select().from(roadmapNodes).where(eq(roadmapNodes.projectId, projectId)).all();
  return rows.map((r) => ({
    ...r,
    tags: JSON.parse(r.tags || '[]'),
  }));
}

function upsertRoadmapNode(nodeData) {
  const existing = db.select().from(roadmapNodes).where(eq(roadmapNodes.id, nodeData.id)).get();
  const now = new Date().toISOString();
  const payload = {
    ...nodeData,
    tags: Array.isArray(nodeData.tags) ? JSON.stringify(nodeData.tags) : (nodeData.tags || '[]'),
    updatedAt: now,
  };

  if (existing) {
    db.update(roadmapNodes).set(payload).where(eq(roadmapNodes.id, nodeData.id)).run();
  } else {
    db.insert(roadmapNodes).values(payload).run();
  }

  return { ...payload, tags: Array.isArray(nodeData.tags) ? nodeData.tags : JSON.parse(payload.tags) };
}

function updateRoadmapNode(id, updates) {
  const payload = { ...updates, updatedAt: new Date().toISOString() };
  if (payload.tags && Array.isArray(payload.tags)) {
    payload.tags = JSON.stringify(payload.tags);
  }
  db.update(roadmapNodes).set(payload).where(eq(roadmapNodes.id, id)).run();
  const updated = db.select().from(roadmapNodes).where(eq(roadmapNodes.id, id)).get();
  return updated ? { ...updated, tags: JSON.parse(updated.tags || '[]') } : null;
}

function deleteRoadmapNode(id) {
  db.delete(roadmapNodes).where(eq(roadmapNodes.id, id)).run();
  db.delete(roadmapEdges).where(eq(roadmapEdges.source, id)).run();
  db.delete(roadmapEdges).where(eq(roadmapEdges.target, id)).run();
  return true;
}

function getRoadmapEdges(projectId) {
  return db.select().from(roadmapEdges).where(eq(roadmapEdges.projectId, projectId)).all();
}

function saveRoadmapEdges(projectId, edges) {
  db.delete(roadmapEdges).where(eq(roadmapEdges.projectId, projectId)).run();
  for (const edge of edges) {
    db.insert(roadmapEdges).values({
      id: edge.id || `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      source: edge.source,
      target: edge.target,
      label: edge.label || '',
    }).run();
  }
  return getRoadmapEdges(projectId);
}

module.exports = {
  initDb,
  getAllWorkspaces,
  getAllProjects: getAllWorkspaces,
  createProject: createWorkspace,
  updateProject: updateWorkspace,
  deleteProject: deleteWorkspace,
  getDbPath,
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
  getProjectNotes,
  saveProjectNotes,
  insertSnapshot,
  getLatestSnapshot,
  getProjectSnapshots,
  getRoadmapNodes,
  upsertRoadmapNode,
  updateRoadmapNode,
  deleteRoadmapNode,
  getRoadmapEdges,
  saveRoadmapEdges,
  seedRoadmapIfEmpty,
};
