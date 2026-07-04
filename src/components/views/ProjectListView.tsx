import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  Radio,
  GitBranch,
  Terminal,
  ExternalLink,
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
  GitCommit,
  ChevronDown,
  ChevronUp,
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
  } = useProjectStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCommits, setExpandedCommits] = useState<Record<string, boolean>>({});
  const [showGlobalPorts, setShowGlobalPorts] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadProjects();
    const interval = setInterval(() => {
      refreshLivePorts();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const toggleCommits = (projectId: string) => {
    setExpandedCommits((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
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
                Live process mapping, Git HUD telemetry, and workspace command center
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
                loadProjects();
                onShowToast('Refreshed', 'Telemetry and ports updated', 'info');
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
            <span>devdesk add .</span>
            <span className="text-[#414868]">|</span>
            <span>devdesk list</span>
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
              const isCommitsOpen = Boolean(expandedCommits[proj.id]);

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

                      {/* Package Manager / Dev Command Pill */}
                      {proj.devCommand && (
                        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16161e] border border-[#292e42] text-[11px] font-mono text-[#bb9af7]">
                          <Zap className="w-3 h-3 text-[#bb9af7]" />
                          <span>{proj.devCommand}</span>
                        </div>
                      )}
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
                            <span>Working tree clean</span>
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

                      {/* Ahead / Behind */}
                      {git && (git.ahead > 0 || git.behind > 0) && (
                        <div className="text-[11px] font-mono text-[#7dcfff] px-2 py-0.5 rounded bg-[#24283b]">
                          ↑{git.ahead} ↓{git.behind}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Ports Section */}
                  <div className="p-5 border-b border-[#24283b]/70 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#c0caf5] flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-[#73daca]" />
                        Active Ports & Processes
                      </span>
                      {projectPorts.length > 0 ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#9ece6a]/15 text-[#9ece6a] border border-[#9ece6a]/30 font-semibold">
                          {projectPorts.length} LIVE
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#565f89]">Idle (no listening ports)</span>
                      )}
                    </div>

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
                              className="px-2.5 py-1.5 rounded-lg bg-[#f7768e]/10 text-[#f7768e] border border-[#f7768e]/20 hover:bg-[#f7768e] hover:text-white transition-all text-xs font-semibold shadow-[0_0_8px_rgba(247,118,142,0.15)]"
                              title="Kill Process"
                            >
                              Kill
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#16161e]/50 border border-dashed border-[#24283b] text-[11px] text-[#565f89] flex items-center justify-between">
                        <span>No processes currently listening for this project.</span>
                        {proj.devCommand && (
                          <span className="text-[#bb9af7] font-mono">Run: {proj.devCommand}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recent Commits Section */}
                  <div className="px-5 py-3 border-b border-[#24283b]/70 bg-[#16161e]/40">
                    <button
                      onClick={() => toggleCommits(proj.id)}
                      className="w-full flex items-center justify-between text-xs text-[#9aa5ce] hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <GitCommit className="w-3.5 h-3.5 text-[#ff9e64]" />
                        Recent Commits ({git?.recentCommits?.length || 0})
                      </span>
                      {isCommitsOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Expandable commits list */}
                    {isCommitsOpen && (
                      <div className="mt-3 space-y-2">
                        {git?.recentCommits && git.recentCommits.length > 0 ? (
                          git.recentCommits.map((c) => (
                            <div
                              key={c.hash}
                              className="p-2 rounded-lg bg-[#16161e] border border-[#24283b] text-xs flex items-start justify-between gap-3"
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
                          <div className="text-[11px] text-[#565f89] py-1">No commits found.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-4 bg-[#1a1b26] flex items-center justify-between gap-2">
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

                    <div className="flex items-center gap-1.5">
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
