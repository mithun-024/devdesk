import React from 'react';
import { Terminal, Search, Minus, Square, X, Layers } from 'lucide-react';
import { WorkspaceSession } from '../../types';

interface TitleBarProps {
  activeWorkspace: WorkspaceSession;
  onOpenCommandPalette: () => void;
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeWorkspace,
  onOpenCommandPalette,
  onToggleTerminal,
  isTerminalOpen,
}) => {
  const handleMinimize = async () => {
    if (window.electronBridge) {
      window.electronBridge.minimizeWindow();
      return;
    }
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().minimize();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleMaximize = async () => {
    if (window.electronBridge) {
      window.electronBridge.maximizeWindow();
      return;
    }
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().toggleMaximize();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleClose = async () => {
    if (window.electronBridge) {
      window.electronBridge.closeWindow();
      return;
    }
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <header
      style={{ WebkitAppRegion: 'drag' } as any}
      className="h-10 bg-[#0d0f17] border-b border-white/[0.07] flex items-center justify-between px-3 select-none z-40 shrink-0 font-sans"
    >
      {/* Brand & Workspace Pill */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
            <span className="font-mono text-[10px] font-bold text-white tracking-tighter">D</span>
          </div>
          <span className="font-semibold text-xs tracking-tight text-slate-200">DevDesk</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/5 text-slate-400 rounded border border-white/5">
            v1.0.0
          </span>
        </div>

        <div className="h-3.5 w-px bg-white/10 mx-0.5" />

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-200/80 border border-white/5 text-[11px] text-slate-300">
          <Layers className="w-3 h-3 text-indigo-400" />
          <span className="font-medium max-w-[140px] truncate">{activeWorkspace.name}</span>
          <span className="text-[10px] text-slate-500 font-mono">({activeWorkspace.activeBranch})</span>
        </div>
      </div>

      {/* Global Actions (Command Palette & Terminal Toggle) */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-2"
      >
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-100/90 border border-white/[0.08] hover:border-indigo-500/30 text-xs text-slate-400 hover:text-slate-200 transition-all group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          <span className="text-[11px]">Command Palette</span>
          <kbd className="font-mono text-[10px] bg-white/5 border border-white/10 px-1 rounded text-slate-400">
            Ctrl K
          </kbd>
        </button>

        <button
          onClick={onToggleTerminal}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all ${
            isTerminalOpen
              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 shadow-glow-sm'
              : 'bg-surface-100/60 border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/10'
          }`}
          title="Toggle Terminal Drawer (Ctrl + `)"
        >
          <Terminal className="w-3.5 h-3.5" />
          <kbd className="font-mono text-[10px] text-slate-500">Ctrl `</kbd>
        </button>
      </div>

      {/* Window Controls */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-1"
      >
        <button
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
