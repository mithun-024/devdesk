import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, FileText } from 'lucide-react';
import { getStoredScratchpad, saveStoredScratchpad } from '../../services/storage';

export const ScratchpadView: React.FC<{
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ onShowToast }) => {
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setContent(getStoredScratchpad());
  }, []);

  const handleChange = (val: string) => {
    setContent(val);
    saveStoredScratchpad(val);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    onShowToast('Copied scratchpad', undefined, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devdesk-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Notes exported', undefined, 'success');
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lines = content.split('\n').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16161e] text-[#c0caf5] overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="h-14 px-6 border-b border-[#292e42] bg-[#1a1b26] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#7aa2f7]" />
            Developer Scratchpad
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#7aa2f7]/15 text-[#7aa2f7] border border-[#7aa2f7]/30">
              Autosaved
            </span>
          </h1>
          <p className="text-[11px] text-[#565f89]">
            Ephemeral notes, temporary code snippets, and quick scratch memory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#16161e] border border-[#292e42] rounded-lg text-xs font-mono text-[#9aa5ce]">
            <span>{lines} lines</span>
            <span>•</span>
            <span>{words} words</span>
            <span>•</span>
            <span>{content.length} chars</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2335] hover:bg-[#24283b] border border-[#292e42] text-xs text-[#c0caf5] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#9ece6a]" /> : <Copy className="w-3.5 h-3.5 text-[#7dcfff]" />}
            <span>Copy</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7aa2f7]/15 hover:bg-[#7aa2f7]/25 text-[#7aa2f7] border border-[#7aa2f7]/30 text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .md</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-6 bg-[#16161e] overflow-hidden">
        <div className="h-full bg-[#1a1b26] border border-[#292e42] rounded-xl overflow-hidden p-4 flex flex-col">
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Type your markdown notes or paste temporary code snippets here..."
            className="flex-1 w-full bg-transparent text-[#c0caf5] placeholder:text-[#565f89] font-mono text-xs leading-relaxed focus:outline-none resize-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
