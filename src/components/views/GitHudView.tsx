import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Plus,
  Minus,
  Check,
  Send,
  GitCommit,
  FileCode,
  FilePlus,
  FileX,
  FolderOpen,
  PlusCircle,
} from 'lucide-react';
import { GitRepoState, GitFileStatus, WorkspaceSession } from '../../types';
import {
  fetchGitState,
  gitStageFile,
  gitCommitAndPush,
  checkoutBranch,
  createGitBranch,
  fetchGitDiff,
  selectWorkspaceDirectory,
} from '../../services/bridge';
import { Modal } from '../ui/Modal';

interface GitHudViewProps {
  workspacePath?: string;
  workspaces?: WorkspaceSession[];
  onSelectWorkspace?: (id: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshStats: () => void;
}

export const GitHudView: React.FC<GitHudViewProps> = ({
  workspacePath,
  workspaces = [],
  onSelectWorkspace,
  onShowToast,
  onRefreshStats,
}) => {
  const [activeRepoPath, setActiveRepoPath] = useState<string>(workspacePath || process.cwd());
  const [gitState, setGitState] = useState<GitRepoState | null>(null);
  const [selectedFile, setSelectedFile] = useState<GitFileStatus | null>(null);
  const [fileDiff, setFileDiff] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  useEffect(() => {
    if (workspacePath) {
      setActiveRepoPath(workspacePath);
    }
  }, [workspacePath]);

  const conventionalPrefixes = [
    'feat:',
    'fix:',
    'docs:',
    'refactor:',
    'style:',
    'test:',
    'chore:',
  ];

  const loadGit = async (targetPath = activeRepoPath) => {
    setIsLoading(true);
    try {
      const state = await fetchGitState(targetPath);
      setGitState(state);
      if (state.files.length > 0) {
        const fileToSelect = state.files.find((f) => f.path === selectedFile?.path) || state.files[0];
        setSelectedFile(fileToSelect);
        loadDiff(fileToSelect, targetPath);
      } else {
        setSelectedFile(null);
        setFileDiff('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadDiff = async (file: GitFileStatus, targetPath = activeRepoPath) => {
    try {
      const diff = await fetchGitDiff(targetPath, file.path, file.staged);
      setFileDiff(diff);
    } catch {
      setFileDiff('');
    }
  };

  useEffect(() => {
    loadGit(activeRepoPath);
  }, [activeRepoPath]);

  const handleSelectFile = (file: GitFileStatus) => {
    setSelectedFile(file);
    loadDiff(file, activeRepoPath);
  };

  const handleToggleStage = async (file: GitFileStatus) => {
    await gitStageFile(activeRepoPath, file.path, !file.staged);
    await loadGit(activeRepoPath);
    onRefreshStats();
  };

  const handleStageAll = async (stage: boolean) => {
    if (!gitState) return;
    for (const f of gitState.files) {
      await gitStageFile(activeRepoPath, f.path, stage);
    }
    await loadGit(activeRepoPath);
    onShowToast(stage ? 'All staged' : 'All unstaged', undefined, 'info');
    onRefreshStats();
  };

  const handleCommit = async (push: boolean) => {
    if (!commitMessage.trim()) {
      onShowToast('Empty commit', 'Please enter a commit message', 'error');
      return;
    }
    setIsPushing(true);
    try {
      const res = await gitCommitAndPush(activeRepoPath, commitMessage.trim(), push);
      if (res.success) {
        onShowToast(
          push ? 'Committed & Pushed' : 'Committed successfully',
          res.hash ? `Commit: ${res.hash}` : undefined,
          'success'
        );
        setCommitMessage('');
        await loadGit(activeRepoPath);
        onRefreshStats();
      } else {
        onShowToast('Commit failed', res.error, 'error');
      }
    } finally {
      setIsPushing(false);
    }
  };

  const handleSwitchBranch = async (branch: string) => {
    const res = await checkoutBranch(activeRepoPath, branch);
    if (res.success) {
      onShowToast('Switched Branch', branch, 'success');
      loadGit(activeRepoPath);
    } else {
      onShowToast('Branch Switch Failed', res.message, 'error');
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    const res = await createGitBranch(activeRepoPath, newBranchName.trim());
    if (res.success) {
      onShowToast('Created Branch', newBranchName.trim(), 'success');
      setIsNewBranchModalOpen(false);
      setNewBranchName('');
      loadGit(activeRepoPath);
    } else {
      onShowToast('Failed to Create Branch', res.message, 'error');
    }
  };

  const handlePickOtherRepo = async () => {
    const selected = await selectWorkspaceDirectory();
    if (selected) {
      setActiveRepoPath(selected.path);
      loadGit(selected.path);
    }
  };

  const stagedFiles = gitState?.files.filter((f) => f.staged) || [];
  const unstagedFiles = gitState?.files.filter((f) => !f.staged) || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16161e] text-[#c0caf5] overflow-hidden font-sans">
      {/* Top Header & Repository Selector */}
      <div className="h-14 border-b border-[#292e42] flex items-center justify-between px-6 bg-[#1a1b26] shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#ff9e64]" />
            <h1 className="text-sm font-semibold text-white tracking-tight">Git HUD</h1>
          </div>

          {/* Repo selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16161e] border border-[#292e42] text-xs">
            <FolderOpen className="w-3.5 h-3.5 text-[#7dcfff]" />
            {workspaces.length > 0 ? (
              <select
                value={activeRepoPath}
                onChange={(e) => setActiveRepoPath(e.target.value)}
                className="bg-transparent border-none text-[#c0caf5] text-xs font-mono outline-none cursor-pointer max-w-[220px] truncate"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.path || (w as any).rootPath} className="bg-[#1a1b26]">
                    {w.name} ({w.path || (w as any).rootPath})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-mono text-xs max-w-[200px] truncate">{activeRepoPath}</span>
            )}
            <button
              onClick={handlePickOtherRepo}
              className="text-[#565f89] hover:text-[#7dcfff] pl-1"
              title="Open other repository..."
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Branch Switcher */}
          {gitState?.isRepo && (
            <div className="flex items-center gap-1.5">
              <select
                value={gitState.currentBranch}
                onChange={(e) => handleSwitchBranch(e.target.value)}
                className="bg-[#16161e] border border-[#ff9e64]/30 text-[#ff9e64] text-xs font-mono rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                {gitState.branches.map((b) => (
                  <option key={b} value={b} className="bg-[#1a1b26] text-[#c0caf5]">
                    {b}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsNewBranchModalOpen(true)}
                className="px-2 py-1 rounded-lg bg-[#1f2335] hover:bg-[#24283b] text-[#c0caf5] border border-[#292e42] text-xs transition-colors"
                title="Create New Branch"
              >
                + Branch
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {gitState?.isRepo && (
            <div className="flex items-center gap-3 text-xs font-mono px-3 py-1 rounded-lg bg-[#16161e] border border-[#292e42]">
              <span className="flex items-center gap-1 text-[#9ece6a]">
                <ArrowUp className="w-3 h-3" />
                {gitState.ahead} ahead
              </span>
              <span className="flex items-center gap-1 text-[#ff9e64]">
                <ArrowDown className="w-3 h-3" />
                {gitState.behind} behind
              </span>
            </div>
          )}

          <button
            onClick={() => loadGit(activeRepoPath)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2335] hover:bg-[#24283b] text-xs text-[#c0caf5] border border-[#292e42] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#ff9e64] ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Dual Pane Layout */}
      {!gitState?.isRepo ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1a1b26] border border-[#292e42] flex items-center justify-center mb-3">
            <GitBranch className="w-6 h-6 text-[#565f89]" />
          </div>
          <h2 className="text-base font-semibold text-white mb-1">Not a Git Repository</h2>
          <p className="text-xs text-[#9aa5ce] max-w-sm mb-4">
            The folder <span className="font-mono text-[#7dcfff]">{activeRepoPath}</span> does not have an active Git worktree. Select a workspace that contains a git repository.
          </p>
          <button
            onClick={handlePickOtherRepo}
            className="px-4 py-2 rounded-lg bg-[#7dcfff]/15 hover:bg-[#7dcfff]/25 text-[#7dcfff] border border-[#7dcfff]/30 text-xs font-medium transition-all"
          >
            Select Git Repository Folder...
          </button>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: File Changes & Commit Composer */}
          <div className="w-80 border-r border-[#292e42] flex flex-col bg-[#1a1b26]/40 shrink-0">
            {/* Staged Section */}
            <div className="p-3 border-b border-[#292e42]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#9ece6a]"></span>
                  Staged Changes ({stagedFiles.length})
                </span>
                {stagedFiles.length > 0 && (
                  <button
                    onClick={() => handleStageAll(false)}
                    className="text-[11px] text-[#565f89] hover:text-[#ff9e64] transition-colors"
                  >
                    Unstage All
                  </button>
                )}
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto">
                {stagedFiles.length === 0 ? (
                  <div className="text-[11px] text-[#565f89] py-2 text-center">No staged files</div>
                ) : (
                  stagedFiles.map((file) => (
                    <div
                      key={file.path}
                      onClick={() => handleSelectFile(file)}
                      className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        selectedFile?.path === file.path
                          ? 'bg-[#1f2335] text-white border border-[#9ece6a]/40'
                          : 'text-[#9aa5ce] hover:bg-[#1f2335]/60'
                      }`}
                    >
                      <span className="truncate font-mono text-[11px]">{file.path}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStage(file);
                        }}
                        className="text-[#565f89] hover:text-[#f7768e] p-1"
                        title="Unstage file"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Unstaged Section */}
            <div className="p-3 border-b border-[#292e42] flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff9e64]"></span>
                  Changes ({unstagedFiles.length})
                </span>
                {unstagedFiles.length > 0 && (
                  <button
                    onClick={() => handleStageAll(true)}
                    className="text-[11px] text-[#565f89] hover:text-[#9ece6a] transition-colors"
                  >
                    Stage All
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {unstagedFiles.length === 0 ? (
                  <div className="text-[11px] text-[#565f89] py-4 text-center">Working tree clean</div>
                ) : (
                  unstagedFiles.map((file) => (
                    <div
                      key={file.path}
                      onClick={() => handleSelectFile(file)}
                      className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        selectedFile?.path === file.path
                          ? 'bg-[#1f2335] text-white border border-[#7dcfff]/40'
                          : 'text-[#9aa5ce] hover:bg-[#1f2335]/60'
                      }`}
                    >
                      <span className="truncate font-mono text-[11px]">{file.path}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStage(file);
                        }}
                        className="text-[#565f89] hover:text-[#9ece6a] p-1"
                        title="Stage file"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Commit Message Box */}
            <div className="p-3 bg-[#16161e] border-t border-[#292e42] space-y-2">
              <div className="flex flex-wrap gap-1">
                {conventionalPrefixes.map((prefix) => (
                  <button
                    key={prefix}
                    onClick={() => setCommitMessage(prefix + ' ')}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1f2335] text-[#9aa5ce] hover:text-white border border-[#292e42] transition-colors"
                  >
                    {prefix}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="Commit message (e.g. feat: add SQLite persistence)..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#1a1b26] border border-[#292e42] focus:border-[#ff9e64] text-xs text-white placeholder-[#565f89] outline-none resize-none font-mono"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => handleCommit(false)}
                  disabled={isPushing || stagedFiles.length === 0}
                  className="flex-1 py-1.5 rounded-lg bg-[#1f2335] hover:bg-[#24283b] disabled:opacity-50 text-xs font-medium text-[#c0caf5] border border-[#292e42] transition-colors"
                >
                  Commit
                </button>
                <button
                  onClick={() => handleCommit(true)}
                  disabled={isPushing || stagedFiles.length === 0}
                  className="flex-1 py-1.5 rounded-lg bg-[#ff9e64]/20 hover:bg-[#ff9e64]/30 disabled:opacity-50 text-xs font-medium text-[#ff9e64] border border-[#ff9e64]/40 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  Commit & Push
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Visual Diff Viewer */}
          <div className="flex-1 flex flex-col bg-[#16161e] overflow-hidden">
            <div className="h-10 border-b border-[#292e42] px-4 flex items-center justify-between bg-[#1a1b26]/50 shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono">
                <FileCode className="w-4 h-4 text-[#7dcfff]" />
                <span className="text-white font-medium">{selectedFile?.path || 'No file selected'}</span>
                {selectedFile && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${
                      selectedFile.staged
                        ? 'bg-[#9ece6a]/15 text-[#9ece6a] border-[#9ece6a]/30'
                        : 'bg-[#ff9e64]/15 text-[#ff9e64] border-[#ff9e64]/30'
                    }`}
                  >
                    {selectedFile.staged ? 'Staged' : 'Working Tree'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed">
              {!selectedFile ? (
                <div className="h-full flex items-center justify-center text-xs text-[#565f89]">
                  Select a modified or staged file to view its git diff
                </div>
              ) : !fileDiff ? (
                <div className="h-full flex items-center justify-center text-xs text-[#565f89]">
                  No diff available or untracked file
                </div>
              ) : (
                <pre className="space-y-0.5">
                  {fileDiff.split('\n').map((line, i) => {
                    let lineClass = 'text-[#9aa5ce]';
                    let bgClass = '';
                    if (line.startsWith('+') && !line.startsWith('+++')) {
                      lineClass = 'text-[#9ece6a]';
                      bgClass = 'bg-[#9ece6a]/10';
                    } else if (line.startsWith('-') && !line.startsWith('---')) {
                      lineClass = 'text-[#f7768e]';
                      bgClass = 'bg-[#f7768e]/10';
                    } else if (line.startsWith('@@')) {
                      lineClass = 'text-[#bb9af7]';
                      bgClass = 'bg-[#bb9af7]/10';
                    }

                    return (
                      <div key={i} className={`px-2 py-0.5 rounded ${bgClass} ${lineClass}`}>
                        {line || ' '}
                      </div>
                    );
                  })}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Branch Modal */}
      <Modal
        isOpen={isNewBranchModalOpen}
        onClose={() => setIsNewBranchModalOpen(false)}
        title="Create New Git Branch"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4 font-sans text-xs">
          <div>
            <label className="block text-xs font-medium text-[#c0caf5] mb-1.5">
              New Branch Name
            </label>
            <input
              type="text"
              required
              placeholder="feat/my-new-feature"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#ff9e64] text-white font-mono text-xs outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#292e42]">
            <button
              type="button"
              onClick={() => setIsNewBranchModalOpen(false)}
              className="px-3 py-1.5 text-xs text-[#9aa5ce] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#ff9e64]/20 hover:bg-[#ff9e64]/30 text-[#ff9e64] border border-[#ff9e64]/40 font-medium transition-colors"
            >
              Create & Checkout
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
