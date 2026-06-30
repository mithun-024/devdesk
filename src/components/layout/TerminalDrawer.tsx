import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { X, Terminal as TerminalIcon, Maximize2, FolderOpen } from 'lucide-react';

interface TerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullscreen: () => void;
  workspacePath?: string;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({
  isOpen,
  onClose,
  onOpenFullscreen,
  workspacePath,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const ptyId = 'drawer-shell';

  useEffect(() => {
    if (!isOpen || !terminalRef.current) return;

    if (!xtermInstance.current) {
      const term = new XTerm({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 12,
        fontFamily: 'JetBrains Mono, Menlo, monospace',
        theme: {
          background: '#16161e',
          foreground: '#c0caf5',
          cursor: '#7dcfff',
          selectionBackground: 'rgba(122, 162, 247, 0.3)',
          black: '#15161e',
          red: '#f7768e',
          green: '#9ece6a',
          yellow: '#e0af68',
          blue: '#7aa2f7',
          magenta: '#bb9af7',
          cyan: '#7dcfff',
          white: '#c0caf5',
        },
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(terminalRef.current);
      fit.fit();

      xtermInstance.current = term;
      fitAddon.current = fit;

      if (window.electronBridge) {
        window.electronBridge.createPty(ptyId, term.cols, term.rows, workspacePath);

        window.electronBridge.onPtyData((id, data) => {
          if (id === ptyId) {
            term.write(data);
          }
        });

        term.onData((data) => {
          window.electronBridge?.writePty(ptyId, data);
        });
      }
    } else {
      setTimeout(() => fitAddon.current?.fit(), 100);
    }
  }, [isOpen, workspacePath]);

  if (!isOpen) return null;

  return (
    <div className="h-64 border-t border-[#292e42] bg-[#16161e] flex flex-col z-30 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] animate-slide-down select-none font-sans">
      <div className="h-8 px-3 border-b border-[#292e42] bg-[#1a1b26] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-[#c0caf5]">
          <TerminalIcon className="w-3.5 h-3.5 text-[#73daca]" />
          <span>Quick Terminal</span>
          {workspacePath && (
            <span className="text-[10px] text-[#565f89] flex items-center gap-1">
              <FolderOpen className="w-3 h-3 text-[#7dcfff]" />
              <span className="max-w-[200px] truncate">{workspacePath}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenFullscreen}
            className="p-1 rounded text-[#9aa5ce] hover:text-white hover:bg-[#1f2335] transition-colors"
            title="Open Fullscreen Terminal"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9aa5ce] hover:text-[#f7768e] hover:bg-[#f7768e]/10 transition-colors"
            title="Close Drawer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-2 bg-[#16161e] overflow-hidden">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  );
};
