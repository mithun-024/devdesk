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
          background: '#000000',
          foreground: '#f8fafc',
          cursor: '#00ff66',
          selectionBackground: 'rgba(0, 255, 102, 0.25)',
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
        term.writeln('\x1b[38;2;0;255;102m[DevDesk Native Terminal Drawer]\x1b[0m');
      }
    } else {
      setTimeout(() => fitAddon.current?.fit(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="h-64 border-t border-neutral-800 bg-black flex flex-col z-30 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] animate-slide-down select-none">
      <div className="h-8 px-3 border-b border-neutral-900 bg-neutral-950 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-neutral-300">
          <TerminalIcon className="w-3.5 h-3.5 text-green-400" />
          <span>Quick Terminal (Drawer)</span>
          <span className="text-[10px] text-neutral-500 font-sans">Press Ctrl + ` to toggle</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenFullscreen}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            title="Open Fullscreen Terminal"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-pink-400 hover:bg-pink-950/30 transition-colors"
            title="Close Drawer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-2 bg-black overflow-hidden">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  );
};
