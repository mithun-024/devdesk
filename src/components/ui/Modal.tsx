import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full ${maxWidth} bg-black border border-neutral-800 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[85vh] animate-slide-down`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-900 bg-neutral-950">
          <h3 className="text-sm font-semibold text-neutral-100 tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-pink-400 hover:bg-neutral-900 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
