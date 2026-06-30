import React from 'react';
import { Terminal, Search, Minus, Square, X, Layers } from 'lucide-react';
import { WorkspaceSession } from '../../types';

interface TitleBarProps {
  activeWorkspace?: WorkspaceSession;
  workspaces?: WorkspaceSession[];
  onSelectWorkspace?: (id: string) => void;
  onOpenCommandPalette: () => void;
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeWorkspace,
  workspaces = [],
  onSelectWorkspace,
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
      className="h-10 bg-[#16161e] border-b border-[#292e42] flex items-center justify-between px-3 select-none z-40 shrink-0 font-sans"
    >
      {/* Brand & Workspace Pill */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#1f2335] border border-[#7dcfff]/40 flex items-center justify-center shadow-[0_0_8px_rgba(125,207,255,0.25)]">
            <span className="font-mono text-[10px] font-bold text-[#7dcfff] tracking-tighter">D</span>
          </div>
          <span className="font-semibold text-xs tracking-tight text-white">DevDesk</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#1f2335] text-[#7dcfff] rounded border border-[#292e42]">
            tokyo-night
          </span>
        </div>

        <div className="h-3.5 w-px bg-[#292e42] mx-0.5" />

        {activeWorkspace && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#1a1b26] border border-[#292e42] text-[11px] text-[#c0caf5]">
            <Layers className="w-3 h-3 text-[#7dcfff]" />
            {workspaces.length > 1 && onSelectWorkspace ? (
              <select
                value={activeWorkspace.id}
                onChange={(e) => onSelectWorkspace(e.target.value)}
                className="bg-transparent border-none text-[#c0caf5] text-[11px] font-medium outline-none cursor-pointer max-w-[160px] truncate"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id} className="bg-[#1a1b26] text-[#c0caf5]">
                    {ws.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-medium max-w-[140px] truncate">{activeWorkspace.name}</span>
            )}
            <span className="text-[10px] text-[#565f89] font-mono">({activeWorkspace.activeBranch || 'main'})</span>
          </div>
        )}
      </div>

      {/* Global Actions (Command Palette & Terminal Toggle) */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-2"
      >
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#1a1b26] border border-[#292e42] hover:border-[#7dcfff]/40 text-xs text-[#9aa5ce] hover:text-white transition-all group"
        >
          <Search className="w-3.5 h-3.5 text-[#565f89] group-hover:text-[#7dcfff] transition-colors" />
          <span className="text-[11px]">Command Palette</span>
          <kbd className="font-mono text-[10px] bg-[#16161e] border border-[#292e42] px-1 rounded text-[#565f89]">
            Ctrl K
          </kbd>
        </button>

        <button
          onClick={onToggleTerminal}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all ${
            isTerminalOpen
              ? 'bg-[#1f2335] border-[#73daca]/50 text-[#73daca] shadow-[0_0_10px_rgba(115,218,202,0.2)]'
              : 'bg-[#1a1b26] border-[#292e42] text-[#9aa5ce] hover:text-white hover:border-[#3b4261]'
          }`}
          title="Toggle Terminal Drawer (Ctrl + `)"
        >
          <Terminal className="w-3.5 h-3.5 text-[#73daca]" />
          <kbd className="font-mono text-[10px] text-[#565f89]">Ctrl `</kbd>
        </button>
      </div>

      {/* Window Controls */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-1"
      >
        <button
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded text-[#9aa5ce] hover:text-white hover:bg-[#1f2335] transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-7 flex items-center justify-center rounded text-[#9aa5ce] hover:text-white hover:bg-[#1f2335] transition-colors"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded text-[#9aa5ce] hover:text-[#f7768e] hover:bg-[#f7768e]/10 transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
