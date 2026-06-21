import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  RefreshCw,
  Send,
  FileCode,
  FilePlus,
  FileX,
  History,
  Check,
} from 'lucide-react';
import { GitRepoState, GitFileStatus } from '../../types';
import { fetchGitState, gitStageFile, gitCommitAndPush } from '../../services/bridge';

interface GitHudViewProps {
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshStats: () => void;
}

export const GitHudView: React.FC<GitHudViewProps> = ({ onShowToast, onRefreshStats }) => {
  const [gitState, setGitState] = useState<GitRepoState | null>(null);
  const [selectedFile, setSelectedFile] = useState<GitFileStatus | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadGit = async () => {
    setIsLoading(true);
    try {
      const state = await fetchGitState();
      setGitState(state);
      if (state.files.length > 0 && !selectedFile) {
        setSelectedFile(state.files[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGit();
  }, []);

  const handleToggleStage = async (file: GitFileStatus) => {
    await gitStageFile(file.path, !file.staged);
    if (gitState) {
      const updatedFiles = gitState.files.map((f) =>
        f.path === file.path ? { ...f, staged: !f.staged } : f
      );
      setGitState({ ...gitState, files: updatedFiles });
      if (selectedFile?.path === file.path) {
        setSelectedFile({ ...selectedFile, staged: !selectedFile.staged });
      }
    }
    onRefreshStats();
  };

  const handleStageAll = async (stage: boolean) => {
    if (!gitState) return;
    for (const f of gitState.files) {
      await gitStageFile(f.path, stage);
    }
    const updatedFiles = gitState.files.map((f) => ({ ...f, staged: stage }));
    setGitState({ ...gitState, files: updatedFiles });
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
      const res = await gitCommitAndPush(commitMessage.trim(), push);
      if (res.success) {
        onShowToast(
          push ? 'Committed & Pushed' : 'Committed',
          `Commit ${res.hash || 'ok'}: ${commitMessage}`,
          'success'
        );
        setCommitMessage('');
        loadGit();
        onRefreshStats();
      } else {
        onShowToast('Commit failed', res.error, 'error');
      }
    } finally {
      setIsPushing(false);
    }
  };

  const conventionalPrefixes = ['feat:', 'fix:', 'refactor:', 'docs:', 'chore:', 'perf:', 'test:'];

  const stagedFiles = gitState?.files.filter((f) => f.staged) || [];
  const unstagedFiles = gitState?.files.filter((f) => !f.staged) || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-white/[0.07] bg-[#0d0f17]/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              Git Control HUD
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                {gitState?.currentBranch || 'main'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Visual repository status, staging, and diff inspector</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-surface-200 border border-white/10 rounded-lg text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <ArrowUp className="w-3 h-3" />
              {gitState?.ahead || 0} ahead
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ArrowDown className="w-3 h-3" />
              {gitState?.behind || 0} behind
            </span>
          </div>
        </div>

        <button
          onClick={loadGit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 border border-white/10 text-xs text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Split Body: Left List + Right Diff Viewer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Files & Commit Composer */}
        <div className="w-80 border-r border-white/[0.07] bg-[#0d0f17] flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Staged Section */}
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Check className="w-3 h-3" /> Staged Changes ({stagedFiles.length})
                </span>
                {stagedFiles.length > 0 && (
                  <button
                    onClick={() => handleStageAll(false)}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Unstage all
                  </button>
                )}
              </div>
              <div className="mt-1 space-y-1">
                {stagedFiles.length === 0 ? (
                  <div className="py-2 text-[11px] text-slate-600 italic px-2">No staged files</div>
                ) : (
                  stagedFiles.map((file) => (
                    <div
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        selectedFile?.path === file.path
                          ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate text-[11px] font-mono">{file.path}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStage(file);
                        }}
                        className="text-slate-500 hover:text-amber-400 p-0.5"
                        title="Unstage file"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Unstaged Section */}
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5 text-[11px] font-mono text-slate-400">
                <span className="font-semibold text-amber-400">Changes ({unstagedFiles.length})</span>
                {unstagedFiles.length > 0 && (
                  <button
                    onClick={() => handleStageAll(true)}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Stage all
                  </button>
                )}
              </div>
              <div className="mt-1 space-y-1">
                {unstagedFiles.length === 0 ? (
                  <div className="py-2 text-[11px] text-slate-600 italic px-2">Working tree clean</div>
                ) : (
                  unstagedFiles.map((file) => (
                    <div
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        selectedFile?.path === file.path
                          ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {file.status === 'added' ? (
                          <FilePlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : file.status === 'deleted' ? (
                          <FileX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="truncate text-[11px] font-mono">{file.path}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStage(file);
                        }}
                        className="text-slate-500 hover:text-emerald-400 p-0.5"
                        title="Stage file"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Commit Box Form */}
          <div className="p-3 border-t border-white/[0.08] bg-[#12141f]/70 space-y-2">
            <div className="flex flex-wrap gap-1">
              {conventionalPrefixes.map((p) => (
                <button
                  key={p}
                  onClick={() => setCommitMessage((prev) => `${p} ${prev.replace(/^[a-z]+:\s*/, '')}`)}
                  className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-slate-400 hover:text-slate-200 border border-white/5"
                >
                  {p}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message (e.g., feat(ports): add quick kill)..."
              className="w-full bg-[#090a0f] border border-white/10 rounded-lg p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isPushing || !commitMessage.trim()}
                onClick={() => handleCommit(false)}
                className="py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 border border-white/10 text-xs text-slate-200 font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <GitCommit className="w-3.5 h-3.5" />
                Commit
              </button>
              <button
                disabled={isPushing || !commitMessage.trim()}
                onClick={() => handleCommit(true)}
                className="py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium shadow-glow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Push
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Visual Diff Viewer */}
        <div className="flex-1 flex flex-col bg-[#090a0f] overflow-hidden">
          {selectedFile ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/[0.07] bg-[#0e1017] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-medium">{selectedFile.path}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded uppercase ${
                    selectedFile.staged
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {selectedFile.staged ? 'Staged' : 'Unstaged'}
                </span>
              </div>

              <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed bg-[#0a0c12]">
                {selectedFile.diff ? (
                  <pre className="space-y-0.5">
                    {selectedFile.diff.split('\n').map((line, idx) => {
                      const isAdd = line.startsWith('+');
                      const isSub = line.startsWith('-');
                      const isHeader = line.startsWith('@');
                      return (
                        <div
                          key={idx}
                          className={`px-2 py-0.5 rounded font-mono ${
                            isAdd
                              ? 'bg-emerald-950/40 text-emerald-300'
                              : isSub
                              ? 'bg-rose-950/40 text-rose-300'
                              : isHeader
                              ? 'text-indigo-400 bg-indigo-950/20'
                              : 'text-slate-400'
                          }`}
                        >
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                ) : (
                  <div className="text-slate-600 text-xs italic">
                    Binary or untracked file. Staging will include this entire file in repository.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
              <History className="w-8 h-8 text-slate-600" />
              <span>Select a changed file to inspect visual diff</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
