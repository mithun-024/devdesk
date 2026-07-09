import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  Radio,
  GitBranch,
  Terminal,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Clock,
  Cpu,
  Play,
  Square,
  GitCommit,
  ChevronDown,
  ChevronUp,
  FileEdit,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useProjectStore } from '../../services/store';
import { Project, MappedPort } from '../../types';
import { selectWorkspaceDirectory } from '../../services/bridge';

interface ProjectListViewProps {
  onOpenTerminal: (project: Project) => void;
  onNavigateGit: (project: Project) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  onOpenTerminal,
  onNavigateGit,
  onShowToast,
}) => {
  const {
    projects,
    activeProjectId,
    livePorts,
    gitSummaries,
    notesMap,
    snapshotsMap,
    devServersMap,
    isLoading,
    searchQuery,
    loadProjects,
    registerNewProject,
    removeProject,
    setActiveProjectId,
    refreshLivePorts,
    killProcess,
    refreshGitSummary,
    setSearchQuery,
    saveNotes,
    takeProjectSnapshot,
    startProjectDevServer,
    stopProjectDevServer,
    refreshDevServers,
  } = useProjectStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, 'notes' | 'ports' | 'commits'>>({});
  const [showGlobalPorts, setShowGlobalPorts] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [localNotes, setLocalNotes] = useState<Record<string, { lastTask: string; nextStep: string; blockers: string }>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProjects();
    const interval = setInterval(() => {
      refreshLivePorts();
      refreshDevServers();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Sync incoming notes from store to local edit state
  useEffect(() => {
    const updated = { ...localNotes };
    for (const [projId, note] of Object.entries(notesMap)) {
      if (!updated[projId]) {
        updated[projId] = {
          lastTask: note.lastTask || '',
          nextStep: note.nextStep || '',
          blockers: note.blockers || '',
        };
      }
    }
    setLocalNotes(updated);
  }, [notesMap]);

  const handleCopyPath = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('Copied Path', text, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddFolderDialog = async () => {
    setIsAdding(true);
    try {
      const selected = await selectWorkspaceDirectory();
      if (selected && selected.path) {
        const proj = await registerNewProject(selected.path, selected.name);
        if (proj) {
          onShowToast('Project Registered', `${proj.name} added to DevDesk`, 'success');
        }
      }
    } catch (e: any) {
      onShowToast('Registration Failed', e.message, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleKillPort = async (p: MappedPort) => {
    if (!p.pid) return;
    const res = await killProcess(p.pid);
    if (res.success) {
      onShowToast('Process Terminated', `Killed PID ${p.pid} on port :${p.port}`, 'success');
    } else {
      onShowToast('Kill Failed', res.message, 'error');
    }
  };

  const handleDeleteProject = async (proj: Project) => {
    if (confirm(`Remove project "${proj.name}" from DevDesk?\n(Your local files will not be deleted)`)) {
      const ok = await removeProject(proj.id);
      if (ok) {
        onShowToast('Project Removed', proj.name, 'info');
      }
    }
  };

  const handleToggleTab = (projectId: string, tab: 'notes' | 'ports' | 'commits') => {
    setExpandedCards((prev) => ({
      ...prev,
      [projectId]: prev[projectId] === tab ? 'notes' : tab,
    }));
  };

  const handleNoteChange = (projectId: string, field: 'lastTask' | 'nextStep' | 'blockers', value: string) => {
    setLocalNotes((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || { lastTask: '', nextStep: '', blockers: '' }),
        [field]: value,
      },
    }));
  };

  const handleNoteBlur = async (projectId: string) => {
    const note = localNotes[projectId];
    if (!note) return;
    setSavingNotes((prev) => ({ ...prev, [projectId]: true }));
    try {
      await saveNotes(projectId, note);
      onShowToast('Notes Saved', 'Updated "Where we left off"', 'success');
    } catch (e) {
      onShowToast('Save Failed', 'Could not save notes', 'error');
    } finally {
      setSavingNotes((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const handleTakeSnapshot = async (projectId: string) => {
    const snap = await takeProjectSnapshot(projectId);
    if (snap) {
      onShowToast('Snapshot Captured', `Saved commit ${snap.commitHash.substring(0, 7) || 'HEAD'} & ports`, 'success');
    }
  };

  const handleToggleDevServer = async (project: Project) => {
    const status = devServersMap[project.id];
    if (status?.isRunning) {
      const res = await stopProjectDevServer(project.id);
      if (res.success) {
        onShowToast('Dev Server Stopped', `${project.name}`, 'info');
      }
    } else {
      const res = await startProjectDevServer(project.id);
      if (res.success) {
        onShowToast('Dev Server Started', `${project.devCommand || 'npm run dev'} (PID ${res.pid})`, 'success');
      } else {
        onShowToast('Launch Failed', 'Could not start dev server process', 'error');
      }
    }
  };

  // Filter projects by search
  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.path.toLowerCase().includes(q) ||
      (p.activeBranch && p.activeBranch.toLowerCase().includes(q))
    );
  });

  const totalMappedPorts = livePorts.filter((p) => p.isProjectMapped).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16161e] overflow-y-auto select-none">
      {/* Header bar */}
      <div className="p-6 border-b border-[#24283b] bg-[#1a1b26]/60 backdrop-blur sticky top-0 z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#7dcfff]/10 border border-[#7dcfff]/20 text-[#7dcfff] shadow-[0_0_15px_rgba(125,207,255,0.15)]">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-wide flex items-center gap-2">
                Projects Dashboard
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-[#24283b] text-[#7dcfff] border border-[#7dcfff]/20">
                  {projects.length}
                </span>
              </h1>
              <p className="text-xs text-[#565f89]">
                Where we left off notes, auto-snapshots, dev command launcher, and live port mapping
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Global ports toggle button */}
            <button
              onClick={() => setShowGlobalPorts((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                showGlobalPorts
                  ? 'bg-[#f7768e]/15 text-[#f7768e] border-[#f7768e]/30 shadow-[0_0_10px_rgba(247,118,142,0.2)]'
                  : 'bg-[#1f2335] text-[#9aa5ce] border-[#292e42] hover:text-white hover:border-[#414868]'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-[#f7768e]" />
              <span>Live Ports ({livePorts.length})</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => {
                refreshLivePorts();
                refreshDevServers();
                loadProjects();
                onShowToast('Refreshed', 'Telemetry, notes, and ports updated', 'info');
              }}
              className="p-2 rounded-lg bg-[#1f2335] text-[#9aa5ce] border border-[#292e42] hover:text-white hover:border-[#414868] transition-all"
              title="Refresh Ports & Git Status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Add Project */}
            <button
              onClick={handleAddFolderDialog}
              disabled={isAdding}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#7dcfff] hover:bg-[#7dcfff]/90 text-[#16161e] shadow-[0_0_12px_rgba(125,207,255,0.3)] transition-all font-semibold disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Folder</span>
            </button>
          </div>
        </div>

        {/* Search & CLI tip banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#565f89]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter projects by name, path or branch..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#16161e] border border-[#292e42] rounded-lg text-white placeholder-[#565f89] focus:outline-none focus:border-[#7dcfff]/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#565f89] font-mono bg-[#16161e] px-3 py-1.5 rounded-lg border border-[#24283b]">
            <span className="text-[#9ece6a] font-bold">CLI:</span>
            <span>devdesk resume</span>
            <span className="text-[#414868]">|</span>
            <span>devdesk run</span>
            <span className="text-[#414868]">|</span>
            <span>devdesk add .</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6 flex-1">
        {/* Global Ports Drawer when toggled */}
        {showGlobalPorts && (
          <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#f7768e]/30 shadow-[0_0_20px_rgba(247,118,142,0.1)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Radio className="w-4 h-4 text-[#f7768e] animate-pulse" />
                <span>Active Host Listening Ports ({livePorts.length})</span>
              </div>
              <span className="text-[11px] text-[#565f89] font-mono">
                {totalMappedPorts} mapped to projects
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {livePorts.map((p) => (
                <div
                  key={`${p.protocol}-${p.port}-${p.pid}`}
                  className="p-3 rounded-lg bg-[#16161e] border border-[#24283b] flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#7dcfff]">:{p.port}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#24283b] text-[#9aa5ce]">
                        {p.protocol}
                      </span>
                      {p.isProjectMapped && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#9ece6a]/15 text-[#9ece6a] border border-[#9ece6a]/30">
                          {p.projectName}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#565f89] flex items-center gap-2">
                      <span>PID {p.pid}</span>
                      <span>•</span>
                      <span>{p.processName}</span>
                      <span>•</span>
                      <span>{p.uptime}</span>
                    </div>
                  </div>

                  {p.pid > 0 && (
                    <button
                      onClick={() => handleKillPort(p)}
                      className="px-2 py-1 rounded bg-[#f7768e]/10 text-[#f7768e] border border-[#f7768e]/20 hover:bg-[#f7768e] hover:text-white transition-all text-[11px] font-medium"
                      title="Kill Process (SIGTERM/SIGKILL)"
                    >
                      Kill
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Cards Grid */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#292e42] rounded-2xl bg-[#1a1b26]/30 space-y-3">
            <FolderGit2 className="w-10 h-10 text-[#565f89]" />
            <h3 className="text-sm font-semibold text-white">No projects found</h3>
            <p className="text-xs text-[#565f89] max-w-sm">
              Register a project folder using the button above or run <code className="text-[#9ece6a]">devdesk add .</code> inside any repository.
            </p>
            <button
              onClick={handleAddFolderDialog}
              className="mt-2 px-4 py-2 rounded-lg bg-[#7dcfff] text-[#16161e] font-semibold text-xs shadow-[0_0_12px_rgba(125,207,255,0.25)] hover:bg-[#7dcfff]/90 transition-all"
            >
              Browse Folder...
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredProjects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              const git = gitSummaries[proj.id];
              const projectPorts = livePorts.filter((p) => p.projectId === proj.id);
              const devStatus = devServersMap[proj.id];
              const activeSubTab = expandedCards[proj.id] || 'notes';
              const notes = localNotes[proj.id] || { lastTask: '', nextStep: '', blockers: '' };
              const snapshot = snapshotsMap[proj.id];
              const isSaving = savingNotes[proj.id];

              return (
                <div
                  key={proj.id}
                  className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                    isActive
                      ? 'bg-[#1a1b26] border-[#7dcfff]/40 shadow-[0_4px_24px_rgba(125,207,255,0.08)]'
                      : 'bg-[#1a1b26]/70 border-[#24283b] hover:border-[#414868]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-[#24283b]/70 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2.5">
                          <h2
                            onClick={() => setActiveProjectId(proj.id)}
                            className="text-base font-semibold text-white tracking-wide hover:text-[#7dcfff] cursor-pointer transition-colors truncate"
                          >
                            {proj.name}
                          </h2>
                          {proj.isDefault && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#7dcfff]/10 text-[#7dcfff] border border-[#7dcfff]/20">
                              DEFAULT
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#9ece6a]/15 text-[#9ece6a] border border-[#9ece6a]/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#9ece6a] animate-pulse"></span>
                              ACTIVE
                            </span>
                          )}
                        </div>

                        {/* Path with Copy */}
                        <div className="flex items-center gap-1.5 text-xs text-[#565f89] font-mono">
                          <span className="truncate max-w-md">{proj.path}</span>
                          <button
                            onClick={() => handleCopyPath(proj.id, proj.path)}
                            className="p-1 rounded hover:bg-[#24283b] text-[#565f89] hover:text-white transition-colors"
                            title="Copy path"
                          >
                            {copiedId === proj.id ? (
                              <Check className="w-3.5 h-3.5 text-[#9ece6a]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Phase 2: One-Click Dev Server Launch Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {proj.devCommand ? (
                          <button
                            onClick={() => handleToggleDevServer(proj)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              devStatus?.isRunning
                                ? 'bg-[#f7768e]/15 text-[#f7768e] border-[#f7768e]/40 shadow-[0_0_10px_rgba(247,118,142,0.25)] hover:bg-[#f7768e] hover:text-white'
                                : 'bg-[#9ece6a]/15 text-[#9ece6a] border-[#9ece6a]/40 shadow-[0_0_10px_rgba(158,206,106,0.2)] hover:bg-[#9ece6a] hover:text-[#16161e]'
                            }`}
                            title={devStatus?.isRunning ? 'Stop Dev Server' : `Run: ${proj.devCommand}`}
                          >
                            {devStatus?.isRunning ? (
                              <>
                                <Square className="w-3 h-3 fill-current" />
                                <span>Stop Server</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" />
                                <span>Start Dev</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="px-2.5 py-1 rounded-lg bg-[#16161e] border border-[#292e42] text-[11px] font-mono text-[#565f89]">
                            no dev script
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Git Status Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {/* Branch Badge */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16161e] border border-[#292e42] text-[#ff9e64] font-mono text-[11px]">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span className="font-semibold">{git?.currentBranch || proj.activeBranch || 'main'}</span>
                      </div>

                      {/* Clean / Dirty Status */}
                      {git ? (
                        git.isClean ? (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#9ece6a]/10 border border-[#9ece6a]/20 text-[#9ece6a] text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Clean working tree</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ff9e64]/10 border border-[#ff9e64]/20 text-[#ff9e64] text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{git.dirtyCount} uncommitted files</span>
                          </div>
                        )
                      ) : (
                        <div className="text-[11px] text-[#565f89] font-mono">Checking Git status...</div>
                      )}

                      {/* Dev Command Label */}
                      {proj.devCommand && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-[#bb9af7] px-2 py-0.5 rounded bg-[#24283b]">
                          <Zap className="w-3 h-3" />
                          <span>{proj.devCommand}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phase 2: Navigation sub-tabs (Notes, Ports, Commits) */}
                  <div className="px-5 pt-3 border-b border-[#24283b]/70 flex items-center justify-between text-xs bg-[#16161e]/40">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleTab(proj.id, 'notes')}
                        className={`pb-2.5 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                          activeSubTab === 'notes'
                            ? 'text-[#7dcfff] border-[#7dcfff]'
                            : 'text-[#565f89] border-transparent hover:text-[#c0caf5]'
                        }`}
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Where We Left Off</span>
                        {isSaving && <span className="text-[10px] text-[#7dcfff] animate-pulse">saving...</span>}
                      </button>

                      <button
                        onClick={() => handleToggleTab(proj.id, 'ports')}
                        className={`pb-2.5 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                          activeSubTab === 'ports'
                            ? 'text-[#73daca] border-[#73daca]'
                            : 'text-[#565f89] border-transparent hover:text-[#c0caf5]'
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Ports & PIDs</span>
                        {projectPorts.length > 0 && (
                          <span className="text-[10px] font-mono px-1.5 rounded-full bg-[#9ece6a]/20 text-[#9ece6a]">
                            {projectPorts.length}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleTab(proj.id, 'commits')}
                        className={`pb-2.5 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                          activeSubTab === 'commits'
                            ? 'text-[#ff9e64] border-[#ff9e64]'
                            : 'text-[#565f89] border-transparent hover:text-[#c0caf5]'
                        }`}
                      >
                        <GitCommit className="w-3.5 h-3.5" />
                        <span>Recent Commits</span>
                        <span className="text-[10px] font-mono px-1.5 rounded-full bg-[#24283b] text-[#9aa5ce]">
                          {git?.recentCommits?.length || 0}
                        </span>
                      </button>
                    </div>

                    {/* Snapshot button & status */}
                    <div className="flex items-center gap-2 pb-2">
                      {snapshot && (
                        <span
                          className="text-[10px] font-mono text-[#565f89] hidden sm:inline"
                          title={`Last snapshot: ${new Date(snapshot.createdAt).toLocaleTimeString()}`}
                        >
                          Snapshot: {snapshot.commitHash ? snapshot.commitHash.substring(0, 7) : 'HEAD'}
                        </span>
                      )}
                      <button
                        onClick={() => handleTakeSnapshot(proj.id)}
                        className="p-1 rounded text-[#565f89] hover:text-[#7dcfff] hover:bg-[#24283b] transition-colors"
                        title="Take Instant Snapshot"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-tab 1: Where We Left Off Notes */}
                  {activeSubTab === 'notes' && (
                    <div className="p-5 space-y-3.5 bg-[#16161e]/20">
                      <div>
                        <label className="text-[11px] font-semibold text-[#7dcfff] uppercase tracking-wider block mb-1">
                          Last Task Worked On
                        </label>
                        <input
                          type="text"
                          value={notes.lastTask}
                          onChange={(e) => handleNoteChange(proj.id, 'lastTask', e.target.value)}
                          onBlur={() => handleNoteBlur(proj.id)}
                          placeholder="e.g. Completed Phase 1 MVP dashboard and port mapper"
                          className="w-full px-3 py-1.5 text-xs bg-[#16161e] border border-[#292e42] rounded-lg text-white placeholder-[#565f89] focus:outline-none focus:border-[#7dcfff]/60 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-[#ff9e64] uppercase tracking-wider block mb-1">
                            Next Step
                          </label>
                          <input
                            type="text"
                            value={notes.nextStep}
                            onChange={(e) => handleNoteChange(proj.id, 'nextStep', e.target.value)}
                            onBlur={() => handleNoteBlur(proj.id)}
                            placeholder="e.g. Wire dev server launcher and auto-snapshots"
                            className="w-full px-3 py-1.5 text-xs bg-[#16161e] border border-[#292e42] rounded-lg text-white placeholder-[#565f89] focus:outline-none focus:border-[#ff9e64]/60 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-[#f7768e] uppercase tracking-wider block mb-1">
                            Active Blockers
                          </label>
                          <input
                            type="text"
                            value={notes.blockers}
                            onChange={(e) => handleNoteChange(proj.id, 'blockers', e.target.value)}
                            onBlur={() => handleNoteBlur(proj.id)}
                            placeholder="e.g. None (or specific blocker)"
                            className="w-full px-3 py-1.5 text-xs bg-[#16161e] border border-[#292e42] rounded-lg text-white placeholder-[#565f89] focus:outline-none focus:border-[#f7768e]/60 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 2: Active Ports */}
                  {activeSubTab === 'ports' && (
                    <div className="p-5 space-y-2.5">
                      {projectPorts.length > 0 ? (
                        <div className="space-y-2">
                          {projectPorts.map((p) => (
                            <div
                              key={p.port}
                              className="p-3 rounded-xl bg-[#16161e] border border-[#24283b] flex items-center justify-between text-xs shadow-inner"
                            >
                              <div className="flex items-center gap-3">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9ece6a] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9ece6a]"></span>
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-white text-sm">
                                      :{p.port}
                                    </span>
                                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#24283b] text-[#7dcfff]">
                                      {p.processName}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#565f89] flex items-center gap-3 mt-0.5 font-mono">
                                    <span>PID {p.pid}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-[#7dcfff]" />
                                      {p.uptime}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Cpu className="w-3 h-3 text-[#ff9e64]" />
                                      {p.memoryMb} MB
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleKillPort(p)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#f7768e]/10 text-[#f7768e] border border-[#f7768e]/20 hover:bg-[#f7768e] hover:text-white transition-all text-xs font-semibold"
                                title="Kill Process"
                              >
                                Kill
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-[#16161e]/50 border border-dashed border-[#24283b] text-xs text-[#565f89] flex items-center justify-between">
                          <span>No processes currently listening for this project.</span>
                          {proj.devCommand && (
                            <button
                              onClick={() => handleToggleDevServer(proj)}
                              className="text-[#9ece6a] hover:underline font-mono text-[11px]"
                            >
                              Launch dev server
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-tab 3: Recent Commits */}
                  {activeSubTab === 'commits' && (
                    <div className="p-5 space-y-2">
                      {git?.recentCommits && git.recentCommits.length > 0 ? (
                        git.recentCommits.map((c) => (
                          <div
                            key={c.hash}
                            className="p-2.5 rounded-lg bg-[#16161e] border border-[#24283b] text-xs flex items-start justify-between gap-3"
                          >
                            <div className="space-y-0.5 overflow-hidden">
                              <div className="text-white font-medium truncate">{c.message}</div>
                              <div className="text-[11px] text-[#565f89] flex items-center gap-2">
                                <span>{c.author}</span>
                                <span>•</span>
                                <span>{c.relativeDate}</span>
                              </div>
                            </div>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#24283b] text-[#7dcfff] shrink-0">
                              {c.hash}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-[#565f89] p-2">No recent commits found.</div>
                      )}
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="p-4 bg-[#1a1b26] flex items-center justify-between gap-2 border-t border-[#24283b]/60">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenTerminal(proj)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2335] text-[#73daca] border border-[#292e42] hover:bg-[#24283b] hover:text-white transition-all text-xs font-medium"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Terminal</span>
                      </button>

                      <button
                        onClick={() => onNavigateGit(proj)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2335] text-[#ff9e64] border border-[#292e42] hover:bg-[#24283b] hover:text-white transition-all text-xs font-medium"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Git HUD</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteProject(proj)}
                        className="p-1.5 rounded-lg text-[#565f89] hover:text-[#f7768e] hover:bg-[#f7768e]/10 transition-colors"
                        title="Remove Project from DevDesk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
