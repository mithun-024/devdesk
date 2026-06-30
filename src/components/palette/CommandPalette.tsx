import React, { useState, useEffect, useRef } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import { CommandItem } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(filteredCommands.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(filteredCommands.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-[#16161e]/80 backdrop-blur-sm animate-fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#1a1b26] border border-[#292e42] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#292e42] bg-[#16161e]">
          <Search className="w-4 h-4 text-[#7dcfff] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, tool, or shortcut..."
            className="w-full bg-transparent text-sm text-white placeholder:text-[#565f89] focus:outline-none"
          />
          <kbd className="font-mono text-[10px] bg-[#1f2335] border border-[#292e42] px-1.5 py-0.5 rounded text-[#9aa5ce]">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#565f89]">
              No matching commands found for <span className="text-[#c0caf5]">"{query}"</span>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-[#24283b] text-white border border-[#7dcfff]/40 shadow-[0_0_8px_rgba(125,207,255,0.15)]'
                      : 'text-[#c0caf5] hover:bg-[#1f2335] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm shrink-0">{cmd.icon}</span>
                    <div className="truncate">
                      <div className="text-xs font-medium text-white truncate">{cmd.title}</div>
                      {cmd.subtitle && (
                        <div className="text-[11px] text-[#9aa5ce] truncate">{cmd.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#16161e] text-[#9aa5ce] border border-[#292e42]">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd className="text-[10px] font-mono bg-[#16161e] text-[#7dcfff] px-1 rounded border border-[#292e42]">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-[#7dcfff]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#292e42] bg-[#16161e] text-[11px] text-[#565f89] font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>•</span>
            <span>↵ Select</span>
          </div>
          <div className="text-[#7dcfff]">Tokyo Night Spotlight</div>
        </div>
      </div>
    </div>
  );
};
