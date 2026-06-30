import React, { useState, useEffect } from 'react';
import { ActiveTab, Task, WorkspaceSession, CommandItem } from './types';
import {
  getStoredTasks,
  saveStoredTasks,
  getStoredWorkspaces,
  saveStoredWorkspaces,
  getActiveWorkspaceId,
  saveActiveWorkspaceId,
} from './services/storage';
import { fetchActivePorts, fetchGitState } from './services/bridge';

import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { TerminalDrawer } from './components/layout/TerminalDrawer';
import { CommandPalette } from './components/palette/CommandPalette';
import { ToastContainer, ToastMessage } from './components/ui/Toast';

import { TaskTrackerView } from './components/views/TaskTrackerView';
import { GitHudView } from './components/views/GitHudView';
import { TerminalView } from './components/views/TerminalView';
import { WorkspaceManagerView } from './components/views/WorkspaceManagerView';
import { PortInspectorView } from './components/views/PortInspectorView';
import { DevToolsView } from './components/views/DevToolsView';
import { ScratchpadView } from './components/views/ScratchpadView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isTerminalDrawerOpen, setIsTerminalDrawerOpen] = useState(false);

  // Core Data States
  const [workspaces, setWorkspaces] = useState<WorkspaceSession[]>(getStoredWorkspaces());
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(getActiveWorkspaceId());
  const [tasks, setTasks] = useState<Task[]>(getStoredTasks());
  const [activePortCount, setActivePortCount] = useState(6);
  const [gitDirtyCount, setGitDirtyCount] = useState(2);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const showToast = (
    title: string,
    description?: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    saveStoredTasks(newTasks);
  };

  const handleUpdateWorkspaces = (newWs: WorkspaceSession[]) => {
    setWorkspaces(newWs);
    saveStoredWorkspaces(newWs);
  };

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    saveActiveWorkspaceId(id);
  };

  const refreshSystemStats = async () => {
    try {
      const ports = await fetchActivePorts();
      setActivePortCount(ports.length);

      const git = await fetchGitState();
      setGitDirtyCount(git.files.length);
    } catch (e) {
      console.warn('Stats refresh error:', e);
    }
  };

  useEffect(() => {
    refreshSystemStats();
  }, [activeWorkspaceId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K or Cmd + K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
      // Ctrl + ~ -> Toggle Terminal Drawer
      else if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === '~')) {
        e.preventDefault();
        setIsTerminalDrawerOpen((prev) => !prev);
      }
      // Ctrl + B -> Toggle Sidebar
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
      // Number shortcuts for tabs: Ctrl + 1..7
      else if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '7') {
        const tabs: ActiveTab[] = [
          'workspaces',
          'tasks',
          'git',
          'ports',
          'terminal',
          'devtools',
          'scratchpad',
        ];
        const idx = parseInt(e.key, 10) - 1;
        if (tabs[idx]) {
          e.preventDefault();
          setActiveTab(tabs[idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Command Palette Registry
  const paletteCommands: CommandItem[] = [
    {
      id: 'nav-tasks',
      title: 'Go to Task Tracker',
      subtitle: 'View sprint Kanban and task issues',
      category: 'Navigation',
      shortcut: 'Ctrl+2',
      icon: '📋',
      action: () => setActiveTab('tasks'),
    },
    {
      id: 'nav-git',
      title: 'Go to Git Control HUD',
      subtitle: 'Branch inspector, staged files, visual diffs',
      category: 'Navigation',
      shortcut: 'Ctrl+3',
      icon: '🌿',
      action: () => setActiveTab('git'),
    },
    {
      id: 'nav-ports',
      title: 'Go to Ports & PIDs',
      subtitle: 'Scan listening ports and kill rogue processes',
      category: 'Navigation',
      shortcut: 'Ctrl+4',
      icon: '⚡',
      action: () => setActiveTab('ports'),
    },
    {
      id: 'nav-terminal',
      title: 'Go to Fullscreen Terminal',
      subtitle: 'Developer shell with xterm.js',
      category: 'Navigation',
      shortcut: 'Ctrl+5',
      icon: '💻',
      action: () => setActiveTab('terminal'),
    },
    {
      id: 'nav-devtools',
      title: 'Go to Developer Offline Tools',
      subtitle: 'JSON, JWT, Base64 & Regex analyzers',
      category: 'Navigation',
      shortcut: 'Ctrl+6',
      icon: '🛠️',
      action: () => setActiveTab('devtools'),
    },
    {
      id: 'nav-scratchpad',
      title: 'Go to Markdown Scratchpad',
      subtitle: 'Ephemeral snippets and auto-saved notes',
      category: 'Navigation',
      shortcut: 'Ctrl+7',
      icon: '📝',
      action: () => setActiveTab('scratchpad'),
    },
    {
      id: 'action-toggle-terminal',
      title: 'Toggle Quick Terminal Drawer',
      subtitle: 'Open or collapse bottom terminal HUD',
      category: 'Utilities',
      shortcut: 'Ctrl+~',
      icon: '💻',
      action: () => setIsTerminalDrawerOpen((prev) => !prev),
    },
    {
      id: 'action-refresh-ports',
      title: 'Rescan Listening Ports',
      subtitle: 'Probe active network sockets',
      category: 'Ports',
      icon: '🔄',
      action: async () => {
        await refreshSystemStats();
        showToast('Ports rescanned', 'Updated active socket table', 'info');
      },
    },
    ...workspaces.map((ws) => ({
      id: `ws-${ws.id}`,
      title: `Switch Workspace: ${ws.name}`,
      subtitle: `Directory: ${ws.rootPath}`,
      category: 'Navigation' as const,
      icon: '🚀',
      action: () => {
        handleSelectWorkspace(ws.id);
        showToast('Switched Workspace', ws.name, 'success');
      },
    })),
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-slate-100 overflow-hidden font-sans select-none">
      {/* HUD Title Bar */}
      <TitleBar
        activeWorkspace={activeWorkspace}
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
        onToggleTerminal={() => setIsTerminalDrawerOpen((prev) => !prev)}
        isTerminalOpen={isTerminalDrawerOpen}
      />

      {/* Main Body: Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          taskCount={tasks.filter((t) => t.status !== 'done').length}
          activePortCount={activePortCount}
          gitDirtyCount={gitDirtyCount}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-black">
          {activeTab === 'workspaces' && (
            <WorkspaceManagerView
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onSelectWorkspace={handleSelectWorkspace}
              onUpdateWorkspaces={handleUpdateWorkspaces}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskTrackerView
              tasks={tasks}
              onUpdateTasks={handleUpdateTasks}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'git' && (
            <GitHudView onShowToast={showToast} onRefreshStats={refreshSystemStats} />
          )}

          {activeTab === 'ports' && (
            <PortInspectorView
              onShowToast={showToast}
              onRefreshPortCount={setActivePortCount}
            />
          )}

          {activeTab === 'terminal' && <TerminalView />}

          {activeTab === 'devtools' && <DevToolsView onShowToast={showToast} />}

          {activeTab === 'scratchpad' && <ScratchpadView onShowToast={showToast} />}
        </main>
      </div>

      {/* Collapsible Bottom Terminal Drawer */}
      <TerminalDrawer
        isOpen={isTerminalDrawerOpen}
        onClose={() => setIsTerminalDrawerOpen(false)}
        onOpenFullscreen={() => {
          setIsTerminalDrawerOpen(false);
          setActiveTab('terminal');
        }}
      />

      {/* Floating Raycast Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        commands={paletteCommands}
      />

      {/* Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
