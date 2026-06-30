import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  FolderOpen,
  GitBranch,
  Play,
  KeyRound,
} from 'lucide-react';
import { WorkspaceSession } from '../../types';
import { Modal } from '../ui/Modal';

interface WorkspaceManagerViewProps {
  workspaces: WorkspaceSession[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onUpdateWorkspaces: (workspaces: WorkspaceSession[]) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const WorkspaceManagerView: React.FC<WorkspaceManagerViewProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onUpdateWorkspaces,
  onShowToast,
}) => {
  const [selectedWsId, setSelectedWsId] = useState<string>(activeWorkspaceId);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Workspace Form
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [newBranch, setNewBranch] = useState('main');

  // New Env var inline form
  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');

  const selectedWs = workspaces.find((w) => w.id === selectedWsId) || workspaces[0];

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPath.trim()) return;

    const newWs: WorkspaceSession = {
      id: `ws-${Date.now()}`,
      name: newName.trim(),
      rootPath: newPath.trim(),
      activeBranch: newBranch.trim() || 'main',
      envVars: {
        NODE_ENV: 'development',
        PORT: '1420',
      },
      pinnedPorts: [1420, 5173],
      scratchNotes: '# Workspace Notes\n- Initialized repository session',
      updatedAt: new Date().toISOString(),
    };

    const updated = [...workspaces, newWs];
    onUpdateWorkspaces(updated);
    setSelectedWsId(newWs.id);
    setIsNewModalOpen(false);
    setNewName('');
    setNewPath('');
    setNewBranch('main');
    onShowToast('Workspace created', newWs.name, 'success');
  };

  const handleDeleteWorkspace = (id: string) => {
    if (workspaces.length <= 1) {
      onShowToast('Action blocked', 'Cannot delete the only workspace', 'error');
      return;
    }
    const updated = workspaces.filter((w) => w.id !== id);
    onUpdateWorkspaces(updated);
    if (activeWorkspaceId === id) {
      onSelectWorkspace(updated[0].id);
    }
    setSelectedWsId(updated[0].id);
    onShowToast('Workspace removed', undefined, 'info');
  };

  const handleAddEnv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!envKey.trim() || !selectedWs) return;

    const updatedEnv = {
      ...selectedWs.envVars,
      [envKey.trim().toUpperCase()]: envValue.trim(),
    };

    const updatedWorkspaces = workspaces.map((w) =>
      w.id === selectedWs.id ? { ...w, envVars: updatedEnv } : w
    );

    onUpdateWorkspaces(updatedWorkspaces);
    setEnvKey('');
    setEnvValue('');
    onShowToast('Environment variable saved', undefined, 'success');
  };

  const handleDeleteEnv = (key: string) => {
    if (!selectedWs) return;
    const copy = { ...selectedWs.envVars };
    delete copy[key];

    const updatedWorkspaces = workspaces.map((w) =>
      w.id === selectedWs.id ? { ...w, envVars: copy } : w
    );

    onUpdateWorkspaces(updatedWorkspaces);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-neutral-900 bg-neutral-950 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            Workspace Sessions
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-black border border-neutral-800 text-neutral-400">
              {workspaces.length} saved
            </span>
          </h1>
          <p className="text-[11px] text-neutral-500">Context switching across repositories, ports, and environment secrets</p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-900 text-cyan-400 border border-cyan-500/40 text-xs font-medium shadow-[0_0_12px_rgba(0,240,255,0.15)] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Workspaces List */}
        <div className="w-72 border-r border-neutral-900 bg-black flex flex-col overflow-y-auto p-3 space-y-2 shrink-0">
          <div className="text-[11px] font-mono text-neutral-500 px-2 uppercase tracking-wider">
            Available Workspaces
          </div>

          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            const isSelected = ws.id === selectedWsId;

            return (
              <div
                key={ws.id}
                onClick={() => setSelectedWsId(ws.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer group relative ${
                  isSelected
                    ? 'bg-black border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.15)] text-white'
                    : 'bg-neutral-950 border-neutral-900 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-neutral-200 truncate">{ws.name}</span>
                  {isActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black text-emerald-400 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-neutral-500 truncate flex items-center gap-1.5">
                  <FolderOpen className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{ws.rootPath}</span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-900 text-[10px] font-mono text-neutral-400">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <GitBranch className="w-3 h-3" />
                    {ws.activeBranch}
                  </span>
                  <span>{Object.keys(ws.envVars).length} env vars</span>
                </div>

                {/* Quick activate button */}
                {!isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectWorkspace(ws.id);
                      onShowToast('Workspace switched', `Switched to ${ws.name}`, 'success');
                    }}
                    className="mt-2 w-full py-1 rounded bg-black hover:bg-neutral-900 border border-neutral-800 text-[10px] font-medium text-neutral-300 hover:text-cyan-400 transition-colors flex items-center justify-center gap-1 font-mono"
                  >
                    <Play className="w-2.5 h-2.5 text-cyan-400" /> Set as Active
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Selected Workspace Details */}
        {selectedWs && (
          <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 bg-black">
            {/* Top Workspace Card */}
            <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-900 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  {selectedWs.name}
                  {selectedWs.id === activeWorkspaceId && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-emerald-400 border border-emerald-500/30">
                      Current Focus
                    </span>
                  )}
                </h2>
                <div className="text-xs font-mono text-neutral-500 mt-1 flex items-center gap-2">
                  <span>Root: {selectedWs.rootPath}</span>
                  <span>•</span>
                  <span>Branch: {selectedWs.activeBranch}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedWs.id !== activeWorkspaceId && (
                  <button
                    onClick={() => {
                      onSelectWorkspace(selectedWs.id);
                      onShowToast('Switched focus', selectedWs.name, 'success');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-950 text-cyan-400 border border-cyan-500/40 hover:bg-neutral-900 text-xs font-medium transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                  >
                    <Play className="w-3 h-3" />
                    Activate
                  </button>
                )}
                <button
                  onClick={() => handleDeleteWorkspace(selectedWs.id)}
                  className="p-2 rounded-lg bg-black hover:bg-pink-950/20 text-neutral-400 hover:text-pink-400 border border-neutral-800 transition-colors"
                  title="Delete Workspace"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Environment Variables Manager */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Session Environment Variables (.env)
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">Injected into shell & terminal</span>
              </div>

              {/* Table */}
              <div className="bg-black border border-neutral-900 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-950 text-neutral-400 text-[11px] border-b border-neutral-900">
                    <tr>
                      <th className="py-2.5 px-4 w-1/3">Variable Key</th>
                      <th className="py-2.5 px-4">Value</th>
                      <th className="py-2.5 px-4 text-right w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {Object.entries(selectedWs.envVars).map(([key, val]) => (
                      <tr key={key} className="hover:bg-neutral-950">
                        <td className="py-2 px-4 font-semibold text-cyan-400">{key}</td>
                        <td className="py-2 px-4 text-neutral-300 truncate max-w-xs">{val}</td>
                        <td className="py-2 px-4 text-right">
                          <button
                            onClick={() => handleDeleteEnv(key)}
                            className="text-neutral-500 hover:text-pink-400 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Inline add env row */}
                <form onSubmit={handleAddEnv} className="p-3 bg-neutral-950 border-t border-neutral-900 flex gap-2">
                  <input
                    type="text"
                    value={envKey}
                    onChange={(e) => setEnvKey(e.target.value)}
                    placeholder="KEY (e.g. API_SECRET)"
                    className="w-1/3 bg-black border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400/50 font-mono"
                  />
                  <input
                    type="text"
                    value={envValue}
                    onChange={(e) => setEnvValue(e.target.value)}
                    placeholder="Value (e.g. secret-xyz)"
                    className="flex-1 bg-black border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400/50 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-black hover:bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 rounded-lg transition-colors flex items-center gap-1 font-mono hover:text-cyan-400"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </form>
              </div>
            </div>

            {/* Pinned Ports */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-neutral-300">Pinned Dev Ports</h3>
              <div className="flex flex-wrap gap-2">
                {selectedWs.pinnedPorts.map((port) => (
                  <span
                    key={port}
                    className="px-3 py-1.5 rounded-lg bg-black border border-neutral-800 text-xs font-mono text-emerald-400 flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,255,102,0.15)]"
                  >
                    <span>localhost:{port}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Workspace Modal */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Create Workspace Session">
        <form onSubmit={handleCreateWorkspace} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-neutral-300 font-medium mb-1">Session Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Analytics Pipeline API"
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Local Directory Path</label>
            <input
              type="text"
              required
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="/home/mithun/Documents/project/my-app"
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Active Git Branch</label>
            <input
              type="text"
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              placeholder="main"
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-900">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-neutral-950 text-cyan-400 border border-cyan-500/40 hover:bg-neutral-900 font-medium text-xs shadow-[0_0_12px_rgba(0,240,255,0.15)]"
            >
              Save Session
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
