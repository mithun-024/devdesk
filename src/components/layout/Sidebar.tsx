import React from 'react';
import {
  Layers,
  CheckSquare,
  GitBranch,
  Activity,
  Terminal,
  Wrench,
  FileText,
  ChevronLeft,
  ChevronRight,
  Circle,
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  taskCount: number;
  activePortCount: number;
  gitDirtyCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  taskCount,
  activePortCount,
  gitDirtyCount,
}) => {
  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    neonColor: string;
    indicatorColor: string;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'workspaces',
      label: 'Workspaces',
      icon: <Layers className="w-4 h-4" />,
      neonColor: 'text-cyan-400 group-hover:text-cyan-300',
      indicatorColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare className="w-4 h-4" />,
      neonColor: 'text-emerald-400 group-hover:text-emerald-300',
      indicatorColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(0,255,102,0.8)]',
      badge: taskCount,
      badgeColor: 'bg-black text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'git',
      label: 'Git HUD',
      icon: <GitBranch className="w-4 h-4" />,
      neonColor: 'text-amber-400 group-hover:text-amber-300',
      indicatorColor: 'bg-amber-400 shadow-[0_0_8px_rgba(255,184,0,0.8)]',
      badge: gitDirtyCount > 0 ? gitDirtyCount : undefined,
      badgeColor: 'bg-black text-amber-400 border-amber-500/30',
    },
    {
      id: 'ports',
      label: 'Ports & PIDs',
      icon: <Activity className="w-4 h-4" />,
      neonColor: 'text-pink-400 group-hover:text-pink-300',
      indicatorColor: 'bg-pink-400 shadow-[0_0_8px_rgba(255,0,127,0.8)]',
      badge: activePortCount,
      badgeColor: 'bg-black text-pink-400 border-pink-500/30',
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: <Terminal className="w-4 h-4" />,
      neonColor: 'text-green-400 group-hover:text-green-300',
      indicatorColor: 'bg-green-400 shadow-[0_0_8px_rgba(57,255,20,0.8)]',
    },
    {
      id: 'devtools',
      label: 'Dev Tools',
      icon: <Wrench className="w-4 h-4" />,
      neonColor: 'text-purple-400 group-hover:text-purple-300',
      indicatorColor: 'bg-purple-400 shadow-[0_0_8px_rgba(176,38,255,0.8)]',
    },
    {
      id: 'scratchpad',
      label: 'Scratchpad',
      icon: <FileText className="w-4 h-4" />,
      neonColor: 'text-sky-400 group-hover:text-sky-300',
      indicatorColor: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]',
    },
  ];

  return (
    <aside
      className={`bg-black border-r border-neutral-900 flex flex-col justify-between transition-all duration-200 select-none shrink-0 ${
        isCollapsed ? 'w-14' : 'w-52'
      }`}
    >
      {/* Navigation Links */}
      <div className="p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-neutral-950 text-white border border-neutral-800'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-950/80 border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {isActive && (
                <span
                  className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r ${item.indicatorColor}`}
                />
              )}
              <div
                className={`shrink-0 transition-transform group-hover:scale-110 ${item.neonColor}`}
              >
                {item.icon}
              </div>

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / System status & Collapse Toggle */}
      <div className="p-2 border-t border-neutral-900 space-y-2">
        {!isCollapsed && (
          <div className="px-2.5 py-2 rounded-lg bg-neutral-950 border border-neutral-900 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(0,255,102,0.8)]"></span>
            </span>
            <div className="overflow-hidden">
              <div className="text-[11px] font-medium text-neutral-300 truncate">DevDesk Host</div>
              <div className="text-[10px] font-mono text-emerald-400/90">OLED Connected</div>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-950 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
