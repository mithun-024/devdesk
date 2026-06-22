import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Terminal as TerminalIcon, Plus, Trash2, Maximize2, RefreshCw } from 'lucide-react';

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

    // Initialize xterm
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Menlo, monospace',
      theme: {
        background: '#090a0f',
        foreground: '#e2e8f0',
        cursor: '#6366f1',
        selectionBackground: 'rgba(99, 102, 241, 0.3)',
        black: '#0f172a',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f8fafc',
        brightBlack: '#334155',
        brightRed: '#fb7185',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
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
      // Fallback simulated terminal for browser preview
      term.writeln('\x1b[38;2;99;102;241m╔════════════════════════════════════════════════════════════════╗\x1b[0m');
      term.writeln('\x1b[38;2;99;102;241m║   DevDesk Workstation Shell v1.0.0 (Browser Preview Mode)       ║\x1b[0m');
      term.writeln('\x1b[38;2;99;102;241m╚════════════════════════════════════════════════════════════════╝\x1b[0m');
      term.writeln('\x1b[90mRunning in browser preview. Launch via Electron for live Linux shell.\x1b[0m');
      term.writeln('\x1b[36mType "help" for built-in DevDesk commands.\x1b[0m');
      term.writeln('');

      const prompt = () => {
        term.write('\x1b[38;2;16;185;129mdevdesk\x1b[0m:\x1b[38;2;99;102;241m~/Documents/project/devdesk\x1b[0m$ ');
      };
      prompt();

      let currentLine = '';

      term.onData((data) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          // Enter
          term.writeln('');
          const trimmed = currentLine.trim();
          if (trimmed) {
            handleExecute(trimmed, term);
          }
          currentLine = '';
          prompt();
        } else if (code === 127) {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write('\b \b');
          }
        } else if (code === 3) {
          // Ctrl+C
          term.writeln('^C');
          currentLine = '';
          prompt();
        } else if (code >= 32) {
          currentLine += data;
          term.write(data);
        }
      });
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

  const handleExecute = (cmd: string, term: XTerm) => {
    const parts = cmd.split(' ');
    const command = parts[0].toLowerCase();

    switch (command) {
      case 'help':
        term.writeln('\x1b[33mAvailable DevDesk Shell Commands:\x1b[0m');
        term.writeln('  \x1b[32mports\x1b[0m       - Scan and display active listening ports');
        term.writeln('  \x1b[32mkill <pid>\x1b[0m  - Terminate process by PID');
        term.writeln('  \x1b[32mgit status\x1b[0m  - Show current branch and staged file changes');
        term.writeln('  \x1b[32mtasks\x1b[0m       - List high-priority active tasks');
        term.writeln('  \x1b[32mclear\x1b[0m       - Clear terminal screen');
        term.writeln('  \x1b[32mwhoami\x1b[0m      - Print current developer profile');
        break;

      case 'clear':
        term.clear();
        break;

      case 'whoami':
        term.writeln('mithun-024 (DevDesk Admin)');
        break;

      case 'ports':
        term.writeln('\x1b[34mPORT   PID    PROCESS                STATUS\x1b[0m');
        term.writeln('1420   48920  devdesk-ui             LISTEN');
        term.writeln('3000   42109  node (next-server)     LISTEN');
        term.writeln('5173   38911  vite-dev               LISTEN');
        term.writeln('8080   19402  python3 -m http.server LISTEN');
        break;

      case 'tasks':
        term.writeln('\x1b[35m[URGENT]\x1b[0m TASK-101: Migrate IPC bridge to Electron specs');
        term.writeln('\x1b[33m[HIGH]\x1b[0m   TASK-103: Add port killer with process memory detection');
        term.writeln('\x1b[32m[DONE]\x1b[0m   TASK-102: Implement fuzzy search in Command Palette');
        break;

      case 'git':
        if (parts[1] === 'status') {
          term.writeln('On branch main');
          term.writeln('Your branch is up to date with origin/main.');
        } else {
          term.writeln(`Executed git command: ${cmd}`);
        }
        break;

      default:
        term.writeln(`\x1b[90mExecuting host process: ${cmd}...\x1b[0m`);
        term.writeln(`[Process exited with status 0]`);
        break;
    }
  };

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
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-hidden select-none">
      {/* Top Bar with Shell Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.07] bg-[#0d0f17]/70 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#171926] text-white border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border-transparent'
                }`}
              >
                <TerminalIcon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={addTab}
            className="flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            title="Open new shell tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fitAddon.current?.fit()}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-md transition-colors"
            title="Refit terminal dimension"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="flex-1 p-3 bg-[#090a0f] overflow-hidden relative">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  );
};
