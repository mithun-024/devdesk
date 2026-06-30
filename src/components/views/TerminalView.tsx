import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Terminal as TerminalIcon, Plus, Trash2, FolderOpen } from 'lucide-react';
import { WorkspaceSession } from '../../types';

interface TerminalTab {
  id: string;
  title: string;
  workspaceId?: string;
  cwd?: string;
}

interface TerminalViewProps {
  activeWorkspace?: WorkspaceSession;
  workspaces?: WorkspaceSession[];
  onSelectWorkspace?: (id: string) => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  activeWorkspace,
  workspaces = [],
  onSelectWorkspace,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 'term-main',
      title: activeWorkspace ? `${activeWorkspace.name}` : 'bash',
      workspaceId: activeWorkspace?.id,
      cwd: activeWorkspace?.path,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('term-main');

  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const effectiveCwd = currentTab?.cwd || activeWorkspace?.path || process.cwd();

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm with Tokyo Night Twilight theme
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
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
        white: '#a9b1d6',
        brightBlack: '#414868',
        brightRed: '#f7768e',
        brightGreen: '#9ece6a',
        brightYellow: '#e0af68',
        brightBlue: '#7aa2f7',
        brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff',
        brightWhite: '#c0caf5',
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
      // Connect directly to live native Linux PTY in workspace directory
      window.electronBridge.createPty(
        activeTabId,
        term.cols,
        term.rows,
        effectiveCwd,
        activeWorkspace?.envVars
      );

      cleanupPtyData = window.electronBridge.onPtyData((id, data) => {
        if (id === activeTabId) {
          term.write(data);
        }
      });

      term.onData((data) => {
        window.electronBridge?.writePty(activeTabId, data);
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
  }, [activeTabId, effectiveCwd]);

  const addTab = () => {
    const newId = `term-${Date.now()}`;
    const newTitle = activeWorkspace ? `${activeWorkspace.name} (${tabs.length + 1})` : `shell-${tabs.length + 1}`;
    const newTab: TerminalTab = {
      id: newId,
      title: newTitle,
      workspaceId: activeWorkspace?.id,
      cwd: activeWorkspace?.path,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const removeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;
    window.electronBridge?.closePty(id);
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[0].id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16161e] text-[#c0caf5] overflow-hidden font-sans">
      {/* Terminal Tab Bar */}
      <div className="h-10 bg-[#1a1b26] border-b border-[#292e42] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono cursor-pointer border transition-all ${
                  isActive
                    ? 'bg-[#16161e] text-[#7dcfff] border-[#7dcfff]/30 shadow-[0_0_8px_rgba(125,207,255,0.15)]'
                    : 'bg-transparent text-[#565f89] hover:text-[#c0caf5] border-transparent'
                }`}
              >
                <TerminalIcon className="w-3.5 h-3.5 text-[#73daca]" />
                <span className="truncate max-w-[140px]">{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => removeTab(e, tab.id)}
                    className="text-[#565f89] hover:text-[#f7768e] p-0.5 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={addTab}
            className="p-1.5 rounded-md text-[#565f89] hover:text-white hover:bg-[#1f2335] transition-colors ml-1"
            title="Open New Shell Session"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Directory Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#565f89] truncate max-w-sm">
          <FolderOpen className="w-3.5 h-3.5 text-[#7dcfff] shrink-0" />
          <span className="truncate">{effectiveCwd}</span>
        </div>
      </div>

      {/* Terminal Canvas */}
      <div className="flex-1 bg-[#16161e] p-3 overflow-hidden">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  );
};
