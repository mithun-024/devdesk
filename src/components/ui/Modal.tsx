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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16161e]/80 backdrop-blur-sm animate-fade-in font-sans">
      <div
        className={`w-full ${maxWidth} bg-[#1a1b26] border border-[#292e42] rounded-xl shadow-[0_0_50px_rgba(22,22,30,0.95)] overflow-hidden flex flex-col max-h-[85vh] animate-slide-down`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#292e42] bg-[#16161e]">
          <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#9aa5ce] hover:text-[#f7768e] hover:bg-[#1f2335] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
