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
  ShieldCheck,
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
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'workspaces',
      label: 'Workspaces',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: taskCount,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'git',
      label: 'Git HUD',
      icon: <GitBranch className="w-4 h-4" />,
      badge: gitDirtyCount > 0 ? gitDirtyCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'ports',
      label: 'Ports & PIDs',
      icon: <Activity className="w-4 h-4" />,
      badge: activePortCount,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: <Terminal className="w-4 h-4" />,
    },
    {
      id: 'devtools',
      label: 'Dev Tools',
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: 'scratchpad',
      label: 'Scratchpad',
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <aside
      className={`bg-[#0d0f17] border-r border-white/[0.07] flex flex-col justify-between transition-all duration-200 select-none shrink-0 ${
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
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-white border border-indigo-500/30 shadow-glow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-500 rounded-r-full shadow-glow-sm" />
              )}
              <div
                className={`shrink-0 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.icon}
              </div>

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md border ${item.badgeColor}`}
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
      <div className="p-2 border-t border-white/[0.06] space-y-2">
        {!isCollapsed && (
          <div className="px-2.5 py-2 rounded-lg bg-surface-200/50 border border-white/5 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-[11px] font-medium text-slate-300 truncate">DevDesk Engine</div>
              <div className="text-[10px] font-mono text-emerald-400">Daemon Active</div>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
