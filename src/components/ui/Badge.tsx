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
    default: 'bg-black text-neutral-300 border-neutral-800',
    urgent: 'bg-black text-pink-400 border-pink-500/40 shadow-[0_0_8px_rgba(255,0,127,0.25)]',
    high: 'bg-black text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(255,184,0,0.25)]',
    medium: 'bg-black text-cyan-400 border-cyan-500/40 shadow-[0_0_8px_rgba(0,240,255,0.25)]',
    low: 'bg-black text-neutral-400 border-neutral-800',
    success: 'bg-black text-emerald-400 border-emerald-500/40 shadow-[0_0_8px_rgba(0,255,102,0.25)]',
    warning: 'bg-black text-amber-400 border-amber-500/40',
    info: 'bg-black text-cyan-400 border-cyan-500/40',
    purple: 'bg-black text-purple-400 border-purple-500/40 shadow-[0_0_8px_rgba(176,38,255,0.25)]',
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
    in_progress: { label: 'In Progress', variant: 'purple' },
    in_review: { label: 'In Review', variant: 'warning' },
    done: { label: 'Done', variant: 'success' },
  };

  const { label, variant } = statusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
};
