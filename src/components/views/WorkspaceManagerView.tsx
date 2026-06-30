import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  FolderOpen,
  GitBranch,
  Play,
  Terminal,
  ExternalLink,
  Code,
  Shield,
  Check,
} from 'lucide-react';
import { WorkspaceSession } from '../../types';
import { Modal } from '../ui/Modal';
import {
  selectWorkspaceDirectory,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../../services/bridge';

interface WorkspaceManagerViewProps {
  workspaces: WorkspaceSession[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onUpdateWorkspaces: (workspaces: WorkspaceSession[]) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
  onOpenTerminalInWorkspace?: (ws: WorkspaceSession) => void;
}

export const WorkspaceManagerView: React.FC<WorkspaceManagerViewProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onUpdateWorkspaces,
  onShowToast,
  onOpenTerminalInWorkspace,
}) => {
  const [selectedWsId, setSelectedWsId] = useState<string>(activeWorkspaceId);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Workspace Form
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [newBranch, setNewBranch] = useState('main');

  // Inline Env Key/Value
  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');

  const selectedWs = workspaces.find((w) => w.id === selectedWsId) || workspaces[0];

  const handleBrowseDirectory = async () => {
    try {
      const selected = await selectWorkspaceDirectory();
      if (selected) {
        setNewPath(selected.path);
        if (!newName.trim()) {
          setNewName(selected.name);
        }
        if (selected.isGit && selected.branch) {
          setNewBranch(selected.branch);
        }
      }
    } catch (e: any) {
      onShowToast('Directory Selection Failed', e.message, 'error');
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPath.trim()) {
      onShowToast('Validation Error', 'Please specify both workspace name and folder path', 'error');
      return;
    }

    try {
      const created = await createWorkspace({
        name: newName.trim(),
        path: newPath.trim(),
        activeBranch: newBranch.trim() || 'main',
        envVars: {
          NODE_ENV: 'development',
        },
        pinnedPorts: [],
        scratchNotes: `# ${newName.trim()} Notes\n\n- Workspace initialized\n`,
      });

      if (created) {
        const updated = [...workspaces, created];
        onUpdateWorkspaces(updated);
        setSelectedWsId(created.id);
        setIsNewModalOpen(false);
        setNewName('');
        setNewPath('');
        setNewBranch('main');
        onShowToast('Workspace Created', created.name, 'success');
      }
    } catch (e: any) {
      onShowToast('Create Error', e.message, 'error');
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (workspaces.length <= 1) {
      onShowToast('Action Blocked', 'Cannot delete the only workspace', 'error');
      return;
    }
    const targetWs = workspaces.find((w) => w.id === id);
    if (!confirm(`Are you sure you want to remove workspace "${targetWs?.name}"?`)) return;

    try {
      await deleteWorkspace(id);
      const updated = workspaces.filter((w) => w.id !== id);
      onUpdateWorkspaces(updated);
      if (activeWorkspaceId === id) {
        onSelectWorkspace(updated[0].id);
      }
      setSelectedWsId(updated[0].id);
      onShowToast('Workspace Removed', targetWs?.name, 'info');
    } catch (e: any) {
      onShowToast('Delete Error', e.message, 'error');
    }
  };

  const handleAddEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!envKey.trim() || !selectedWs) return;

    const key = envKey.trim().toUpperCase();
    const updatedEnv = {
      ...(selectedWs.envVars || {}),
      [key]: envValue.trim(),
    };

    try {
      const updated = await updateWorkspace(selectedWs.id, { envVars: updatedEnv });
      if (updated) {
        const updatedWorkspaces = workspaces.map((w) =>
          w.id === selectedWs.id ? updated : w
        );
        onUpdateWorkspaces(updatedWorkspaces);
        setEnvKey('');
        setEnvValue('');
        onShowToast('Environment Updated', `Saved variable ${key}`, 'success');
      }
    } catch (e: any) {
      onShowToast('Error', e.message, 'error');
    }
  };

  const handleRemoveEnv = async (keyToRemove: string) => {
    if (!selectedWs) return;
    const updatedEnv = { ...(selectedWs.envVars || {}) };
    delete updatedEnv[keyToRemove];

    try {
      const updated = await updateWorkspace(selectedWs.id, { envVars: updatedEnv });
      if (updated) {
        const updatedWorkspaces = workspaces.map((w) =>
          w.id === selectedWs.id ? updated : w
        );
        onUpdateWorkspaces(updatedWorkspaces);
        onShowToast('Variable Removed', keyToRemove, 'info');
      }
    } catch (e: any) {
      onShowToast('Error', e.message, 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16161e] text-[#c0caf5] overflow-hidden font-sans">
      {/* Top Header */}
      <div className="h-12 border-b border-[#292e42] flex items-center justify-between px-6 bg-[#1a1b26] shrink-0">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-[#7dcfff]" />
          <h1 className="text-sm font-semibold text-white tracking-tight">
            Workspace Engine
          </h1>
          <span className="text-[10px] font-mono text-[#565f89] bg-[#16161e] px-2 py-0.5 rounded border border-[#292e42]">
            {workspaces.length} active
          </span>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7dcfff]/15 hover:bg-[#7dcfff]/25 text-[#7dcfff] border border-[#7dcfff]/30 text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Workspace</span>
        </button>
      </div>

      {/* Main Dual Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Workspace List */}
        <div className="w-72 border-r border-[#292e42] flex flex-col bg-[#16161e] overflow-y-auto p-3 space-y-2 shrink-0">
          {workspaces.map((ws) => {
            const isSelected = selectedWs?.id === ws.id;
            const isActive = activeWorkspaceId === ws.id;
            const wsPath = ws.path || (ws as any).rootPath || '';

            return (
              <div
                key={ws.id}
                onClick={() => setSelectedWsId(ws.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#1a1b26] border-[#7dcfff]/50 shadow-[0_0_12px_rgba(125,207,255,0.15)]'
                    : 'bg-[#1a1b26]/60 border-[#292e42] hover:border-[#3b4261] hover:bg-[#1a1b26]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-sm font-semibold text-white truncate">{ws.name}</span>
                    {isActive && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#9ece6a]/15 text-[#9ece6a] border border-[#9ece6a]/30">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#565f89] mb-2 truncate font-mono">
                  <FolderOpen className="w-3 h-3 shrink-0 text-[#7dcfff]" />
                  <span className="truncate">{wsPath}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#9aa5ce] pt-2 border-t border-[#292e42]">
                  <div className="flex items-center gap-1 text-[#ff9e64]">
                    <GitBranch className="w-3 h-3" />
                    <span>{ws.activeBranch || 'main'}</span>
                  </div>

                  <span className="text-[10px] text-[#565f89] font-mono">
                    {Object.keys(ws.envVars || {}).length} env
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Workspace Detail */}
        {selectedWs ? (
          <div className="flex-1 flex flex-col bg-[#16161e] overflow-y-auto p-6">
            {/* Header info */}
            <div className="flex items-start justify-between pb-5 border-b border-[#292e42] mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedWs.name}</h2>
                  {activeWorkspaceId === selectedWs.id ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#9ece6a]/20 text-[#9ece6a] border border-[#9ece6a]/30">
                      Currently Active
                    </span>
                  ) : (
                    <button
                      onClick={() => onSelectWorkspace(selectedWs.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[#7dcfff]/15 hover:bg-[#7dcfff]/25 text-[#7dcfff] border border-[#7dcfff]/30 transition-all font-medium"
                    >
                      Set As Active Workspace
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#9aa5ce]">
                  <FolderOpen className="w-3.5 h-3.5 text-[#7dcfff]" />
                  <span>{selectedWs.path || (selectedWs as any).rootPath}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenTerminalInWorkspace && (
                  <button
                    onClick={() => onOpenTerminalInWorkspace(selectedWs)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2335] hover:bg-[#24283b] text-xs font-medium text-[#73daca] border border-[#73daca]/30 transition-all"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Launch Terminal
                  </button>
                )}

                {workspaces.length > 1 && (
                  <button
                    onClick={() => handleDeleteWorkspace(selectedWs.id)}
                    className="p-1.5 rounded-lg text-[#565f89] hover:text-[#f7768e] hover:bg-[#f7768e]/10 border border-transparent hover:border-[#f7768e]/30 transition-colors"
                    title="Delete Workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#292e42]">
                <div className="text-xs text-[#565f89] font-medium mb-1">Active Git Branch</div>
                <div className="text-base font-semibold text-[#ff9e64] flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4" />
                  <span>{selectedWs.activeBranch || 'main'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#292e42]">
                <div className="text-xs text-[#565f89] font-medium mb-1">Environment Variables</div>
                <div className="text-base font-semibold text-[#7dcfff] flex items-center gap-1.5">
                  <Code className="w-4 h-4" />
                  <span>{Object.keys(selectedWs.envVars || {}).length} Configured</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#292e42]">
                <div className="text-xs text-[#565f89] font-medium mb-1">Storage Mode</div>
                <div className="text-base font-semibold text-[#9ece6a] flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>SQLite Verified</span>
                </div>
              </div>
            </div>

            {/* Environment Variables Section */}
            <div className="p-5 rounded-xl bg-[#1a1b26] border border-[#292e42] mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Workspace Environment Variables</h3>
                  <p className="text-xs text-[#565f89]">Injected into terminals and processes launched in this directory</p>
                </div>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddEnv} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="VARIABLE_NAME (e.g. PORT)"
                  value={envKey}
                  onChange={(e) => setEnvKey(e.target.value)}
                  className="w-1/3 px-3 py-1.5 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] text-xs font-mono text-white placeholder-[#565f89] outline-none"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 8080)"
                  value={envValue}
                  onChange={(e) => setEnvValue(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] text-xs font-mono text-white placeholder-[#565f89] outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#7dcfff]/15 hover:bg-[#7dcfff]/25 text-[#7dcfff] border border-[#7dcfff]/30 text-xs font-medium transition-all"
                >
                  Add Variable
                </button>
              </form>

              {/* Env List */}
              <div className="space-y-1.5">
                {Object.keys(selectedWs.envVars || {}).length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#565f89] border border-dashed border-[#292e42] rounded-lg">
                    No custom environment variables defined for this workspace.
                  </div>
                ) : (
                  Object.entries(selectedWs.envVars || {}).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#16161e] border border-[#292e42] text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#7dcfff] font-bold">{k}</span>
                        <span className="text-[#565f89]">=</span>
                        <span className="text-[#c0caf5]">{v}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveEnv(k)}
                        className="text-[#565f89] hover:text-[#f7768e] transition-colors p-1"
                        title="Remove variable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-[#565f89]">
            Select a workspace from the sidebar
          </div>
        )}
      </div>

      {/* New Workspace Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Add Real Workspace Directory"
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4 font-sans text-xs">
          <div>
            <label className="block text-xs font-medium text-[#c0caf5] mb-1.5">
              Workspace Folder Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="/home/user/my-project"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] text-white font-mono text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleBrowseDirectory}
                className="px-3 py-2 rounded-lg bg-[#1f2335] hover:bg-[#24283b] border border-[#292e42] text-[#7dcfff] font-medium flex items-center gap-1.5 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Browse...
              </button>
            </div>
            <p className="text-[11px] text-[#565f89] mt-1">
              Click "Browse..." to select any project folder on your system.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c0caf5] mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Frontend App"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] text-white text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c0caf5] mb-1.5">
              Primary Branch
            </label>
            <input
              type="text"
              placeholder="main"
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#7dcfff] text-white font-mono text-xs outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#292e42]">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-3 py-1.5 text-xs text-[#9aa5ce] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#7dcfff]/20 hover:bg-[#7dcfff]/30 text-[#7dcfff] border border-[#7dcfff]/40 font-medium transition-colors"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
