import React from 'react';
import {
  Layers,
  CheckSquare,
  GitBranch,
  Activity,
  Terminal,
  Wrench,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
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
    iconColor: string;
    indicatorColor: string;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'workspaces',
      label: 'Workspaces',
      icon: <Layers className="w-4 h-4" />,
      iconColor: 'text-[#7dcfff]',
      indicatorColor: 'bg-[#7dcfff] shadow-[0_0_8px_rgba(125,207,255,0.7)]',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare className="w-4 h-4" />,
      iconColor: 'text-[#9ece6a]',
      indicatorColor: 'bg-[#9ece6a] shadow-[0_0_8px_rgba(158,206,106,0.7)]',
      badge: taskCount,
      badgeColor: 'bg-[#1f2335] text-[#9ece6a] border-[#9ece6a]/30',
    },
    {
      id: 'git',
      label: 'Git HUD',
      icon: <GitBranch className="w-4 h-4" />,
      iconColor: 'text-[#ff9e64]',
      indicatorColor: 'bg-[#ff9e64] shadow-[0_0_8px_rgba(255,158,100,0.7)]',
      badge: gitDirtyCount > 0 ? gitDirtyCount : undefined,
      badgeColor: 'bg-[#1f2335] text-[#ff9e64] border-[#ff9e64]/30',
    },
    {
      id: 'ports',
      label: 'Ports & PIDs',
      icon: <Activity className="w-4 h-4" />,
      iconColor: 'text-[#f7768e]',
      indicatorColor: 'bg-[#f7768e] shadow-[0_0_8px_rgba(247,118,142,0.7)]',
      badge: activePortCount,
      badgeColor: 'bg-[#1f2335] text-[#f7768e] border-[#f7768e]/30',
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: <Terminal className="w-4 h-4" />,
      iconColor: 'text-[#73daca]',
      indicatorColor: 'bg-[#73daca] shadow-[0_0_8px_rgba(115,218,202,0.7)]',
    },
    {
      id: 'devtools',
      label: 'Dev Tools',
      icon: <Wrench className="w-4 h-4" />,
      iconColor: 'text-[#bb9af7]',
      indicatorColor: 'bg-[#bb9af7] shadow-[0_0_8px_rgba(187,154,247,0.7)]',
    },
    {
      id: 'scratchpad',
      label: 'Scratchpad',
      icon: <FileText className="w-4 h-4" />,
      iconColor: 'text-[#7aa2f7]',
      indicatorColor: 'bg-[#7aa2f7] shadow-[0_0_8px_rgba(122,162,247,0.7)]',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      iconColor: 'text-[#c0caf5]',
      indicatorColor: 'bg-[#c0caf5] shadow-[0_0_8px_rgba(192,202,245,0.7)]',
    },
  ];

  return (
    <aside
      className={`bg-[#1a1b26] border-r border-[#292e42] flex flex-col justify-between transition-all duration-200 select-none shrink-0 ${
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
                  ? 'bg-[#24283b] text-white border border-[#292e42]'
                  : 'text-[#9aa5ce] hover:text-white hover:bg-[#1f2335] border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {isActive && (
                <span
                  className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r ${item.indicatorColor}`}
                />
              )}
              <div
                className={`shrink-0 transition-transform group-hover:scale-110 ${item.iconColor}`}
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
      <div className="p-2 border-t border-[#292e42] space-y-2">
        {!isCollapsed && (
          <div className="px-2.5 py-2 rounded-lg bg-[#16161e] border border-[#292e42] flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9ece6a] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9ece6a] shadow-[0_0_6px_rgba(158,206,106,0.8)]"></span>
            </span>
            <div className="overflow-hidden">
              <div className="text-[11px] font-medium text-[#c0caf5] truncate">DevDesk Desktop</div>
              <div className="text-[10px] font-mono text-[#9ece6a]">Tokyo Night Active</div>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-1.5 rounded-lg text-[#565f89] hover:text-[#c0caf5] hover:bg-[#1f2335] transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
