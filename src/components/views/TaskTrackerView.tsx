import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  GitBranch,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  Search,
  History,
  X,
  Layers,
} from 'lucide-react';
import { Task, TaskStatus, Priority, TaskHistoryItem, WorkspaceSession } from '../../types';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  createTask,
  updateTask,
  deleteTask,
  fetchTaskHistory,
} from '../../services/bridge';

interface TaskTrackerViewProps {
  tasks: Task[];
  workspaces?: WorkspaceSession[];
  activeWorkspaceId?: string;
  onUpdateTasks: (tasks: Task[]) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const TaskTrackerView: React.FC<TaskTrackerViewProps> = ({
  tasks,
  workspaces = [],
  activeWorkspaceId,
  onUpdateTasks,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [selectedWorkspaceFilter, setSelectedWorkspaceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [taskHistoryList, setTaskHistoryList] = useState<TaskHistoryItem[]>([]);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newTags, setNewTags] = useState('ui, core');
  const [newBranch, setNewBranch] = useState('');
  const [newWorkspaceId, setNewWorkspaceId] = useState(activeWorkspaceId || (workspaces[0]?.id ?? ''));

  useEffect(() => {
    if (activeWorkspaceId) {
      setNewWorkspaceId(activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  const loadHistory = async () => {
    try {
      const hist = await fetchTaskHistory(
        selectedWorkspaceFilter === 'all' ? undefined : selectedWorkspaceFilter
      );
      setTaskHistoryList(hist);
    } catch (e) {
      console.error('Failed to load task history:', e);
    }
  };

  const columns: { id: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'backlog', label: 'Backlog', icon: <Clock className="w-3.5 h-3.5 text-[#565f89]" />, color: 'border-[#565f89]/30' },
    { id: 'todo', label: 'Todo', icon: <AlertCircle className="w-3.5 h-3.5 text-[#7dcfff]" />, color: 'border-[#7dcfff]/30' },
    { id: 'in_progress', label: 'In Progress', icon: <Clock className="w-3.5 h-3.5 text-[#ff9e64]" />, color: 'border-[#ff9e64]/30' },
    { id: 'in_review', label: 'In Review', icon: <Clock className="w-3.5 h-3.5 text-[#bb9af7]" />, color: 'border-[#bb9af7]/30' },
    { id: 'done', label: 'Done', icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#9ece6a]" />, color: 'border-[#9ece6a]/30' },
  ];

  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesWorkspace =
      selectedWorkspaceFilter === 'all' || t.workspaceId === selectedWorkspaceFilter;
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPriority && matchesWorkspace && matchesQuery;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const targetWsId = newWorkspaceId || activeWorkspaceId || workspaces[0]?.id || 'ws-default';

    try {
      const created = await createTask({
        workspaceId: targetWsId,
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        status: newStatus,
        tags: newTags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        branch: newBranch.trim() || undefined,
      });

      if (created) {
        onUpdateTasks([created, ...tasks]);
        onShowToast('Task created in SQLite', `${created.id}: ${created.title}`, 'success');
        setNewTitle('');
        setNewDesc('');
        setNewTags('ui, core');
        setNewBranch('');
        setIsNewTaskOpen(false);
      }
    } catch (e: any) {
      onShowToast('Task Creation Error', e.message, 'error');
    }
  };

  const handleStatusChange = async (taskId: string, newStatusVal: TaskStatus) => {
    try {
      const updated = await updateTask(taskId, { status: newStatusVal });
      if (updated) {
        onUpdateTasks(tasks.map((t) => (t.id === taskId ? updated : t)));
      }
    } catch (e: any) {
      onShowToast('Error', e.message, 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const success = await deleteTask(taskId);
      if (success) {
        onUpdateTasks(tasks.filter((t) => t.id !== taskId));
        onShowToast('Task deleted from SQLite', `Removed ${taskId}`, 'info');
      }
    } catch (e: any) {
      onShowToast('Error', e.message, 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16161e] text-[#c0caf5] overflow-hidden font-sans">
      {/* Top Filter and Actions Bar */}
      <div className="h-14 border-b border-[#292e42] flex items-center justify-between px-6 bg-[#1a1b26] shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#565f89] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks, tags, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] pl-9 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-[#565f89] outline-none w-64 transition-all"
            />
          </div>

          {/* Workspace Filter */}
          {workspaces.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#565f89]" />
              <select
                value={selectedWorkspaceFilter}
                onChange={(e) => setSelectedWorkspaceFilter(e.target.value)}
                className="bg-[#16161e] border border-[#292e42] text-xs text-[#c0caf5] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
              >
                <option value="all">All Workspaces</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#565f89]" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-[#16161e] border border-[#292e42] text-xs text-[#c0caf5] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* History audit log toggle */}
          <button
            onClick={() => {
              loadHistory();
              setIsHistoryDrawerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2335] hover:bg-[#24283b] text-xs text-[#c0caf5] border border-[#292e42] transition-colors"
            title="View Task Audit History"
          >
            <History className="w-3.5 h-3.5 text-[#bb9af7]" />
            <span>History</span>
          </button>

          {/* View toggle */}
          <div className="flex rounded-lg bg-[#16161e] p-0.5 border border-[#292e42]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'kanban' ? 'bg-[#24283b] text-[#7dcfff]' : 'text-[#565f89] hover:text-white'
              }`}
              title="Kanban Board"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'list' ? 'bg-[#24283b] text-[#7dcfff]' : 'text-[#565f89] hover:text-white'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9ece6a]/15 hover:bg-[#9ece6a]/25 text-[#9ece6a] border border-[#9ece6a]/30 text-xs font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 relative">
        {filteredTasks.length === 0 && tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#1a1b26] border border-[#292e42] flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-[#9ece6a]" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No tasks created yet</h3>
            <p className="text-xs text-[#9aa5ce] max-w-sm mb-4">
              Tasks are saved permanently in SQLite. Create your first real task to start tracking your development sprint.
            </p>
            <button
              onClick={() => setIsNewTaskOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#9ece6a]/20 hover:bg-[#9ece6a]/30 text-[#9ece6a] border border-[#9ece6a]/40 text-xs font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Task</span>
            </button>
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="flex gap-4 h-full min-w-[1100px]">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className="flex-1 flex flex-col rounded-xl bg-[#1a1b26] border border-[#292e42] overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-[#292e42] bg-[#16161e]/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {col.icon}
                      <span className="text-xs font-semibold text-white tracking-tight">{col.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#565f89] px-2 py-0.5 rounded-full bg-[#1f2335] border border-[#292e42]">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards Column */}
                  <div className="flex-1 p-2 space-y-2.5 overflow-y-auto">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-lg bg-[#1f2335] border border-[#292e42] hover:border-[#7dcfff]/40 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono text-[#7dcfff] font-bold tracking-tight">
                            {task.id}
                          </span>
                          <PriorityBadge priority={task.priority} />
                        </div>

                        <h4 className="text-xs font-semibold text-white mb-1.5 leading-snug">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-[11px] text-[#9aa5ce] mb-3 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#16161e] text-[#9aa5ce] border border-[#292e42]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer & Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#292e42] text-[10px] text-[#565f89]">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className="bg-[#16161e] border border-[#292e42] text-[10px] text-[#c0caf5] rounded px-1.5 py-0.5 outline-none cursor-pointer"
                          >
                            <option value="backlog">Backlog</option>
                            <option value="todo">Todo</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="done">Done</option>
                          </select>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-[#565f89] hover:text-[#f7768e] transition-colors p-1"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-[#1a1b26] border border-[#292e42] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16161e] text-[#565f89] border-b border-[#292e42]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">ID</th>
                  <th className="py-2.5 px-4 font-medium">Title</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Priority</th>
                  <th className="py-2.5 px-4 font-medium">Tags</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292e42]">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-[#1f2335]/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#7dcfff] font-medium">{task.id}</td>
                    <td className="py-3 px-4 font-medium text-white">{task.title}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#16161e] text-[#9aa5ce] border border-[#292e42]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-[#565f89] hover:text-[#f7768e] transition-colors p-1"
                        title="Delete task"
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

      {/* History Audit Drawer */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-[#1a1b26] border-l border-[#292e42] shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 flex flex-col font-sans animate-fade-in">
          <div className="h-12 border-b border-[#292e42] px-4 flex items-center justify-between bg-[#16161e]">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <History className="w-4 h-4 text-[#bb9af7]" />
              <span>SQLite Task Audit Log</span>
            </div>
            <button
              onClick={() => setIsHistoryDrawerOpen(false)}
              className="text-[#565f89] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {taskHistoryList.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#565f89]">
                No history events recorded yet.
              </div>
            ) : (
              taskHistoryList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-[#1f2335] border border-[#292e42] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#7dcfff] font-bold text-[11px]">{item.taskId}</span>
                    <span className="text-[10px] text-[#565f89] font-mono">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs text-white">
                    Action: <span className="font-mono text-[#ff9e64]">{item.action}</span>
                  </div>
                  {item.details && (
                    <div className="text-[11px] text-[#9aa5ce] font-mono bg-[#16161e] p-1.5 rounded border border-[#292e42]">
                      {JSON.stringify(item.details)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* New Task Modal */}
      <Modal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        title="Create New Task (Persistent SQLite)"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 font-sans text-xs">
          <div>
            <label className="block text-xs font-medium text-[#c0caf5] mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement authentication middleware"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] text-white text-xs outline-none"
            />
          </div>

          {workspaces.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[#c0caf5] mb-1.5">
                Target Workspace
              </label>
              <select
                value={newWorkspaceId}
                onChange={(e) => setNewWorkspaceId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] text-[#c0caf5] text-xs outline-none"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.path || (ws as any).rootPath})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#c0caf5] mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Detailed technical acceptance criteria..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] text-white text-xs outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#c0caf5] mb-1.5">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] text-[#c0caf5] text-xs outline-none cursor-pointer"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c0caf5] mb-1.5">
                Initial Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] text-[#c0caf5] text-xs outline-none cursor-pointer"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c0caf5] mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="frontend, auth, bug"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] text-white text-xs outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#292e42]">
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(false)}
              className="px-3 py-1.5 text-xs text-[#9aa5ce] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#9ece6a]/20 hover:bg-[#9ece6a]/30 text-[#9ece6a] border border-[#9ece6a]/40 font-medium transition-colors"
            >
              Save to SQLite
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
