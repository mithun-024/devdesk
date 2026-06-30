import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Terminal as TerminalIcon, Plus, Trash2, RefreshCw } from 'lucide-react';

interface TerminalTab {
  id: string;
  title: string;
}

export const TerminalView: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: 'term-1', title: 'bash (dev)' },
    { id: 'term-2', title: 'shell-2' },
  ]);
  const [activeTabId, setActiveTabId] = useState('term-1');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm with pure OLED black background and retro neon green cursor
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Menlo, monospace',
      theme: {
        background: '#000000',
        foreground: '#f8fafc',
        cursor: '#00ff66',
        selectionBackground: 'rgba(0, 255, 102, 0.25)',
        black: '#000000',
        red: '#ff007f',
        green: '#00ff66',
        yellow: '#ffb800',
        blue: '#00f0ff',
        magenta: '#b026ff',
        cyan: '#00f0ff',
        white: '#f8fafc',
        brightBlack: '#262626',
        brightRed: '#ff3399',
        brightGreen: '#33ff88',
        brightYellow: '#ffcc33',
        brightBlue: '#33f3ff',
        brightMagenta: '#c44dff',
        brightCyan: '#33f3ff',
        brightWhite: '#ffffff',
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalRef.current);
    fit.fit();

    xtermInstance.current = term;
    fitAddon.current = fit;

    let cleanupPtyData: (() => void) | null = null;

    if (window.electronBridge) {
      // Connect directly to live native Linux PTY
      window.electronBridge.createPty(activeTabId, term.cols, term.rows);

      cleanupPtyData = window.electronBridge.onPtyData((id, data) => {
        if (id === activeTabId) {
          term.write(data);
        }
      });

      term.onData((data) => {
        window.electronBridge?.writePty(activeTabId, data);
      });
    } else {
      term.writeln('\x1b[38;2;255;184;0mInitializing DevDesk Native Desktop Shell...\x1b[0m');
    }

    const handleResize = () => {
      fit.fit();
      if (window.electronBridge) {
        window.electronBridge.resizePty(activeTabId, term.cols, term.rows);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (cleanupPtyData) cleanupPtyData();
      term.dispose();
    };
  }, [activeTabId]);

  const addTab = () => {
    const newId = `term-${Date.now()}`;
    const newTitle = `shell-${tabs.length + 1}`;
    setTabs([...tabs, { id: newId, title: newTitle }]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    if (window.electronBridge) {
      window.electronBridge.closePty(id);
    }
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black overflow-hidden select-none">
      {/* Top Bar with Shell Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-900 bg-neutral-950 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-black text-white border-neutral-800 shadow-[0_0_8px_rgba(0,0,0,0.8)]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 border-transparent'
                }`}
              >
                <TerminalIcon className={`w-3.5 h-3.5 ${isActive ? 'text-green-400' : 'text-neutral-500'}`} />
                <span>{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className="p-0.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-pink-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={addTab}
            className="flex items-center justify-center p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            title="Open new shell tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fitAddon.current?.fit()}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors"
            title="Refit terminal dimension"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="flex-1 p-3 bg-black overflow-hidden relative">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  );
};
