import React, { useState } from 'react';
import {
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  GitBranch,
  Tag,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  Search,
} from 'lucide-react';
import { Task, TaskStatus, Priority } from '../../types';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface TaskTrackerViewProps {
  tasks: Task[];
  onUpdateTasks: (tasks: Task[]) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const TaskTrackerView: React.FC<TaskTrackerViewProps> = ({
  tasks,
  onUpdateTasks,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newTags, setNewTags] = useState('ui, frontend');
  const [newBranch, setNewBranch] = useState('');

  const columns: { id: TaskStatus; label: string; icon: React.ReactNode }[] = [
    { id: 'backlog', label: 'Backlog', icon: <Clock className="w-3.5 h-3.5 text-slate-400" /> },
    { id: 'todo', label: 'Todo', icon: <AlertCircle className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'in_progress', label: 'In Progress', icon: <Clock className="w-3.5 h-3.5 text-indigo-400" /> },
    { id: 'in_review', label: 'In Review', icon: <Clock className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'done', label: 'Done', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPriority && matchesQuery;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: `TASK-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      status: newStatus,
      tags: newTags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      branch: newBranch.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpdateTasks([newTask, ...tasks]);
    onShowToast('Task created', `${newTask.id}: ${newTask.title}`, 'success');

    setNewTitle('');
    setNewDesc('');
    setNewTags('ui, frontend');
    setNewBranch('');
    setIsNewTaskOpen(false);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    );
    onUpdateTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    onUpdateTasks(tasks.filter((t) => t.id !== taskId));
    onShowToast('Task deleted', `Removed task ${taskId}`, 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-hidden select-none font-sans">
      {/* Top Action Bar */}
      <div className="px-6 py-4 border-b border-white/[0.07] bg-[#0d0f17]/70 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              Task Tracker
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                {filteredTasks.length} total
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Linear-style developer workflow & sprint board</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks or tags..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-surface-200 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 w-48"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-surface-200 border border-white/10 rounded-lg p-0.5 text-xs">
            <Filter className="w-3 h-3 text-slate-400 ml-1.5" />
            {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-1 rounded capitalize text-[11px] transition-colors ${
                  priorityFilter === p
                    ? 'bg-indigo-600/30 text-indigo-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface-200 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Kanban Board"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Task Button */}
          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-glow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
            <kbd className="font-mono text-[10px] bg-white/20 px-1 rounded text-white/90">Ctrl N</kbd>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {viewMode === 'kanban' ? (
          <div className="flex gap-4 h-full min-w-max pb-2">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className="w-72 bg-[#0e1017] border border-white/[0.06] rounded-xl flex flex-col max-h-full overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="px-3.5 py-3 border-b border-white/[0.06] bg-[#121520]/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {col.icon}
                      <span className="text-xs font-semibold text-slate-200">{col.label}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Tasks List */}
                  <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5">
                    {colTasks.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-slate-600 border border-dashed border-white/5 rounded-lg">
                        No tasks in {col.label}
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg bg-surface-100/80 border border-white/[0.07] hover:border-indigo-500/30 transition-all hover:shadow-glow-sm group space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-mono text-slate-500">{task.id}</span>
                            <div className="flex items-center gap-1.5">
                              <PriorityBadge priority={task.priority} />
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <h4 className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal">
                              {task.description}
                            </p>
                          )}

                          {/* Tags & Branch link */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {task.branch && (
                              <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                <GitBranch className="w-2.5 h-2.5" />
                                <span className="max-w-[120px] truncate">{task.branch}</span>
                              </div>
                            )}
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 font-mono"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {/* Quick Status Shift */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Move to:</span>
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                              className="bg-surface-200 border border-white/10 text-slate-300 text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                            >
                              <option value="backlog">Backlog</option>
                              <option value="todo">Todo</option>
                              <option value="in_progress">In Progress</option>
                              <option value="in_review">In Review</option>
                              <option value="done">Done</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-[#0e1017] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121520]/80 border-b border-white/[0.06] text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Branch</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{task.id}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-200">
                      <div>{task.title}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-md">{task.description}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-2.5 px-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-indigo-400">
                      {task.branch || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Task Modal */}
      <Modal isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Task Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Implement Webhook listener in Rust"
              className="w-full bg-surface-200 border border-white/10 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Describe criteria, edge cases, and objectives..."
              className="w-full bg-surface-200 border border-white/10 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="w-full bg-surface-200 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                className="w-full bg-surface-200 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="rust, ipc, ui"
                className="w-full bg-surface-200 border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Associated Branch (Optional)</label>
              <input
                type="text"
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                placeholder="feat/my-feature"
                className="w-full bg-surface-200 border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(false)}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-glow-sm transition-all"
            >
              Create Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
