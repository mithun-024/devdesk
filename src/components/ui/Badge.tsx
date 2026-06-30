import React from 'react';
import { Priority, TaskStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'urgent' | 'high' | 'medium' | 'low' | 'success' | 'warning' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  const variantMap: Record<string, string> = {
    default: 'bg-[#1f2335] text-[#c0caf5] border-[#292e42]',
    urgent: 'bg-[#1f2335] text-[#f7768e] border-[#f7768e]/40 shadow-[0_0_8px_rgba(247,118,142,0.2)]',
    high: 'bg-[#1f2335] text-[#ff9e64] border-[#ff9e64]/40 shadow-[0_0_8px_rgba(255,158,100,0.2)]',
    medium: 'bg-[#1f2335] text-[#7aa2f7] border-[#7aa2f7]/40 shadow-[0_0_8px_rgba(122,162,247,0.2)]',
    low: 'bg-[#1f2335] text-[#565f89] border-[#292e42]',
    success: 'bg-[#1f2335] text-[#9ece6a] border-[#9ece6a]/40 shadow-[0_0_8px_rgba(158,206,106,0.2)]',
    warning: 'bg-[#1f2335] text-[#e0af68] border-[#e0af68]/40',
    info: 'bg-[#1f2335] text-[#7dcfff] border-[#7dcfff]/40',
    purple: 'bg-[#1f2335] text-[#bb9af7] border-[#bb9af7]/40 shadow-[0_0_8px_rgba(187,154,247,0.2)]',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded border font-mono tracking-wide ${variantMap[variant]} ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const labels: Record<Priority, string> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return <Badge variant={priority}>{labels[priority]}</Badge>;
};

export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const statusConfig: Record<TaskStatus, { label: string; variant: BadgeProps['variant'] }> = {
    backlog: { label: 'Backlog', variant: 'low' },
    todo: { label: 'Todo', variant: 'info' },
    in_progress: { label: 'In Progress', variant: 'high' },
    in_review: { label: 'In Review', variant: 'purple' },
    done: { label: 'Done', variant: 'success' },
  };

  const { label, variant } = statusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
};
