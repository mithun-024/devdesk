import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full font-sans">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#9ece6a] shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-[#f7768e] shrink-0" />,
    info: <Info className="w-4 h-4 text-[#7dcfff] shrink-0" />,
  };

  const borders = {
    success: 'border-[#9ece6a]/40 bg-[#1a1b26] shadow-[0_0_15px_rgba(158,206,106,0.15)]',
    error: 'border-[#f7768e]/40 bg-[#1a1b26] shadow-[0_0_15px_rgba(247,118,142,0.15)]',
    info: 'border-[#7dcfff]/40 bg-[#1a1b26] shadow-[0_0_15px_rgba(125,207,255,0.15)]',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border animate-slide-down ${borders[toast.type]}`}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-white">{toast.title}</h4>
        {toast.description && (
          <p className="text-[11px] text-[#9aa5ce] mt-0.5 leading-relaxed truncate">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded text-[#565f89] hover:text-white hover:bg-[#1f2335] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
