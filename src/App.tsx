import React, { useState, useEffect } from 'react';
import { ActiveTab, Task, WorkspaceSession, CommandItem } from './types';
import {
  fetchWorkspaces,
  fetchTasks,
  fetchActivePorts,
  fetchGitState,
} from './services/bridge';

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
import { SettingsView } from './components/views/SettingsView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isTerminalDrawerOpen, setIsTerminalDrawerOpen] = useState(false);

  // Core Data States (backed by SQLite via Drizzle ORM)
  const [workspaces, setWorkspaces] = useState<WorkspaceSession[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activePortCount, setActivePortCount] = useState(0);
  const [gitDirtyCount, setGitDirtyCount] = useState(0);
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

  // Load persistent SQLite data
  const loadInitialData = async () => {
    try {
      const wsList = await fetchWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        const defaultWs = wsList.find((w) => w.isDefault) || wsList[0];
        setActiveWorkspaceId(defaultWs.id);

        const taskList = await fetchTasks();
        setTasks(taskList);
      }
    } catch (e) {
      console.error('Failed to load initial SQLite state:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const refreshSystemStats = async () => {
    try {
      const ports = await fetchActivePorts();
      setActivePortCount(ports.length);

      const targetPath = activeWorkspace?.path;
      const git = await fetchGitState(targetPath);
      setGitDirtyCount(git.files ? git.files.length : 0);
    } catch (e) {
      console.warn('Stats refresh error:', e);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      refreshSystemStats();
    }
  }, [activeWorkspaceId, activeWorkspace?.path]);

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    const targetWs = workspaces.find((w) => w.id === id);
    if (targetWs) {
      showToast('Switched Workspace', targetWs.name, 'success');
    }
  };

  const handleOpenTerminalInWorkspace = (ws: WorkspaceSession) => {
    setActiveWorkspaceId(ws.id);
    setActiveTab('terminal');
  };

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
      // Number shortcuts for tabs: Alt + 1..8 or Ctrl + 1..8
      else if ((e.ctrlKey || e.metaKey || e.altKey) && e.key >= '1' && e.key <= '8') {
        const tabs: ActiveTab[] = [
          'workspaces',
          'tasks',
          'git',
          'ports',
          'terminal',
          'devtools',
          'scratchpad',
          'settings',
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
      id: 'nav-workspaces',
      title: 'Go to Workspace Engine',
      subtitle: 'Manage local directory worktrees and environment variables',
      category: 'Navigation',
      shortcut: 'Alt+1',
      icon: '🗂️',
      action: () => setActiveTab('workspaces'),
    },
    {
      id: 'nav-tasks',
      title: 'Go to Task Tracker',
      subtitle: 'View persistent SQLite Kanban sprint backlog',
      category: 'Navigation',
      shortcut: 'Alt+2',
      icon: '📋',
      action: () => setActiveTab('tasks'),
    },
    {
      id: 'nav-git',
      title: 'Go to Git HUD',
      subtitle: 'Branch inspector, staged files, visual diffs',
      category: 'Navigation',
      shortcut: 'Alt+3',
      icon: '🌿',
      action: () => setActiveTab('git'),
    },
    {
      id: 'nav-ports',
      title: 'Go to Ports & PIDs',
      subtitle: 'Scan listening ports and kill rogue processes',
      category: 'Navigation',
      shortcut: 'Alt+4',
      icon: '⚡',
      action: () => setActiveTab('ports'),
    },
    {
      id: 'nav-terminal',
      title: 'Go to Fullscreen Terminal',
      subtitle: 'Hardware-accelerated Linux shell with node-pty',
      category: 'Navigation',
      shortcut: 'Alt+5',
      icon: '💻',
      action: () => setActiveTab('terminal'),
    },
    {
      id: 'nav-devtools',
      title: 'Go to Developer Offline Tools',
      subtitle: 'JSON, JWT, Base64 & Regex analyzers',
      category: 'Navigation',
      shortcut: 'Alt+6',
      icon: '🛠️',
      action: () => setActiveTab('devtools'),
    },
    {
      id: 'nav-scratchpad',
      title: 'Go to Markdown Scratchpad',
      subtitle: 'Ephemeral snippets and auto-saved notes',
      category: 'Navigation',
      shortcut: 'Alt+7',
      icon: '📝',
      action: () => setActiveTab('scratchpad'),
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings & Security',
      subtitle: 'SQLite backups, restore, and OS keychain vault',
      category: 'Navigation',
      shortcut: 'Alt+8',
      icon: '🛡️',
      action: () => setActiveTab('settings'),
    },
    {
      id: 'action-toggle-terminal',
      title: 'Toggle Quick Terminal Drawer',
      subtitle: 'Open or collapse bottom terminal HUD',
      category: 'Utilities',
      shortcut: 'Ctrl+`',
      icon: '💻',
      action: () => setIsTerminalDrawerOpen((prev) => !prev),
    },
    {
      id: 'action-refresh-ports',
      title: 'Rescan Listening Ports',
      subtitle: 'Probe active Linux network sockets (lsof/ss)',
      category: 'Ports',
      icon: '🔄',
      action: async () => {
        await refreshSystemStats();
        showToast('Ports Rescanned', 'Updated active socket table', 'info');
      },
    },
    ...workspaces.map((ws) => ({
      id: `ws-${ws.id}`,
      title: `Switch Workspace: ${ws.name}`,
      subtitle: `Path: ${ws.path}`,
      category: 'Navigation' as const,
      icon: '🚀',
      action: () => handleSelectWorkspace(ws.id),
    })),
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-[#16161e] text-[#c0caf5] overflow-hidden font-sans select-none">
      {/* Title Bar with Frameless Drag and Window Controls */}
      <TitleBar
        activeWorkspace={activeWorkspace}
        workspaces={workspaces}
        onSelectWorkspace={handleSelectWorkspace}
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

        <main className="flex-1 flex flex-col overflow-hidden bg-[#16161e]">
          {activeTab === 'workspaces' && (
            <WorkspaceManagerView
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onSelectWorkspace={handleSelectWorkspace}
              onUpdateWorkspaces={setWorkspaces}
              onShowToast={showToast}
              onOpenTerminalInWorkspace={handleOpenTerminalInWorkspace}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskTrackerView
              tasks={tasks}
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onUpdateTasks={setTasks}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'git' && (
            <GitHudView
              workspacePath={activeWorkspace?.path}
              workspaces={workspaces}
              onSelectWorkspace={handleSelectWorkspace}
              onShowToast={showToast}
              onRefreshStats={refreshSystemStats}
            />
          )}

          {activeTab === 'ports' && (
            <PortInspectorView
              onShowToast={showToast}
              onRefreshPortCount={setActivePortCount}
            />
          )}

          {activeTab === 'terminal' && (
            <TerminalView
              activeWorkspace={activeWorkspace}
              workspaces={workspaces}
              onSelectWorkspace={handleSelectWorkspace}
            />
          )}

          {activeTab === 'devtools' && <DevToolsView onShowToast={showToast} />}

          {activeTab === 'scratchpad' && <ScratchpadView onShowToast={showToast} />}

          {activeTab === 'settings' && (
            <SettingsView
              onShowToast={showToast}
              onDataRestored={loadInitialData}
            />
          )}
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
        workspacePath={activeWorkspace?.path}
      />

      {/* Floating Spotlight Command Palette */}
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
