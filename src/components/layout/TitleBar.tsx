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
  const handleMinimize = () => {
    window.electronBridge?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronBridge?.maximizeWindow();
  };

  const handleClose = () => {
    window.electronBridge?.closeWindow();
  };

  return (
    <header
      style={{ WebkitAppRegion: 'drag' } as any}
      className="h-10 bg-black border-b border-neutral-900 flex items-center justify-between px-3 select-none z-40 shrink-0 font-sans"
    >
      {/* Brand & Workspace Pill */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-neutral-950 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_8px_rgba(0,240,255,0.25)]">
            <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-tighter">D</span>
          </div>
          <span className="font-semibold text-xs tracking-tight text-white">DevDesk</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-900 text-neutral-400 rounded border border-neutral-800">
            oled
          </span>
        </div>

        <div className="h-3.5 w-px bg-neutral-800 mx-0.5" />

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span className="font-medium max-w-[140px] truncate">{activeWorkspace.name}</span>
          <span className="text-[10px] text-neutral-500 font-mono">({activeWorkspace.activeBranch})</span>
        </div>
      </div>

      {/* Global Actions (Command Palette & Terminal Toggle) */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-2"
      >
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 hover:border-cyan-400/40 text-xs text-neutral-400 hover:text-white transition-all group"
        >
          <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-400 transition-colors" />
          <span className="text-[11px]">Command Palette</span>
          <kbd className="font-mono text-[10px] bg-neutral-900 border border-neutral-800 px-1 rounded text-neutral-400">
            Ctrl K
          </kbd>
        </button>

        <button
          onClick={onToggleTerminal}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all ${
            isTerminalOpen
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
          }`}
          title="Toggle Terminal Drawer (Ctrl + `)"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <kbd className="font-mono text-[10px] text-neutral-500">Ctrl `</kbd>
        </button>
      </div>

      {/* Window Controls */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-1"
      >
        <button
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-7 flex items-center justify-center rounded text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded text-neutral-400 hover:text-pink-400 hover:bg-pink-950/30 transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
