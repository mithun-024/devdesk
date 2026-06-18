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
    default: 'bg-white/5 text-slate-300 border-white/10',
    urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-glow-sm',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-glow-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border tracking-wide font-mono ${variantMap[variant]} ${sizeClasses} ${className}`}
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
