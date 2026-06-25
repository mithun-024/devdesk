import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, Download, RotateCcw } from 'lucide-react';
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
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-white/[0.07] bg-[#0d0f17]/70 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            Developer Scratchpad
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Autosaved
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">
            Ephemeral notes, temporary code snippets, and quick scratch memory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-200 border border-white/10 rounded-lg text-xs font-mono text-slate-400">
            <span>{lines} lines</span>
            <span>•</span>
            <span>{words} words</span>
            <span>•</span>
            <span>{content.length} chars</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 border border-white/10 text-xs text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-glow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .md</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-6 bg-[#090a0f] overflow-hidden">
        <div className="h-full bg-[#0e1017] border border-white/[0.07] rounded-xl overflow-hidden p-4 flex flex-col">
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Type your markdown notes or paste temporary code snippets here..."
            className="flex-1 w-full bg-transparent text-slate-200 placeholder:text-slate-600 font-mono text-xs leading-relaxed focus:outline-none resize-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
