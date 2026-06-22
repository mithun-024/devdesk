import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { X, Terminal as TerminalIcon, Maximize2 } from 'lucide-react';

interface TerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullscreen: () => void;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({
  isOpen,
  onClose,
  onOpenFullscreen,
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
          background: '#0d0f17',
          foreground: '#e2e8f0',
          cursor: '#6366f1',
          selectionBackground: 'rgba(99, 102, 241, 0.3)',
        },
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(terminalRef.current);
      fit.fit();

      xtermInstance.current = term;
      fitAddon.current = fit;

      if (window.electronBridge) {
        window.electronBridge.createPty(ptyId, term.cols, term.rows);

        window.electronBridge.onPtyData((id, data) => {
          if (id === ptyId) {
            term.write(data);
          }
        });

        term.onData((data) => {
          window.electronBridge?.writePty(ptyId, data);
        });
      } else {
        term.writeln('\x1b[38;2;99;102;241m[DevDesk Quick Terminal Drawer - Ctrl+` to toggle]\x1b[0m');
        term.write('\x1b[38;2;16;185;129mdevdesk\x1b[0m$ ');

        let currentLine = '';
        term.onData((data) => {
          const code = data.charCodeAt(0);
          if (code === 13) {
            term.writeln('');
            if (currentLine.trim() === 'clear') {
              term.clear();
            } else if (currentLine.trim()) {
              term.writeln(`\x1b[90mExecuted: ${currentLine}\x1b[0m`);
            }
            currentLine = '';
            term.write('\x1b[38;2;16;185;129mdevdesk\x1b[0m$ ');
          } else if (code === 127) {
            if (currentLine.length > 0) {
              currentLine = currentLine.slice(0, -1);
              term.write('\b \b');
            }
          } else if (code >= 32) {
            currentLine += data;
            term.write(data);
          }
        });
      }
    } else {
      setTimeout(() => fitAddon.current?.fit(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="h-64 border-t border-white/[0.1] bg-[#0d0f17] flex flex-col z-30 shrink-0 shadow-2xl animate-slide-down select-none">
      <div className="h-8 px-3 border-b border-white/[0.07] bg-[#121520] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quick Terminal (Drawer)</span>
          <span className="text-[10px] text-slate-500 font-sans">Press Ctrl + ` to toggle</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenFullscreen}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Open Fullscreen Terminal"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Close Drawer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-2 bg-[#090a0f] overflow-hidden">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  );
};
