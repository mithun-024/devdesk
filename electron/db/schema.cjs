const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  activeBranch: text('active_branch').default('main'),
  envVars: text('env_vars').default('{}'), // JSON string: Record<string, string>
  pinnedPorts: text('pinned_ports').default('[]'), // JSON string: number[]
  scratchNotes: text('scratch_notes').default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  isDefault: integer('is_default').default(0),
});

const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  title: text('title').notNull(),
  description: text('description').default(''),
  status: text('status').notNull(), // 'todo' | 'in_progress' | 'in_review' | 'done' | 'backlog'
  priority: text('priority').notNull(), // 'urgent' | 'high' | 'medium' | 'low'
  tags: text('tags').default('[]'), // JSON string: string[]
  branch: text('branch').default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

const taskHistory = sqliteTable('task_history', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(),
  workspaceId: text('workspace_id').notNull(),
  action: text('action').notNull(), // 'created' | 'status_changed' | 'priority_changed' | 'updated' | 'deleted'
  details: text('details').default('{}'), // JSON string: { from?: string, to?: string, note?: string }
  timestamp: text('timestamp').notNull(),
});

const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON string
  updatedAt: text('updated_at').notNull(),
});

const credentials = sqliteTable('credentials', {
  key: text('key').primaryKey(),
  encryptedValue: text('encrypted_value').notNull(), // Base64 ciphertext encrypted via safeStorage
  updatedAt: text('updated_at').notNull(),
});

module.exports = {
  workspaces,
  tasks,
  taskHistory,
  settings,
  credentials,
};
