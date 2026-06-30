import React, { useState, useEffect } from 'react';
import { Copy, Check, Download } from 'lucide-react';
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
    <div className="flex-1 flex flex-col h-full bg-black overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-neutral-900 bg-neutral-950 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            Developer Scratchpad
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-sky-400 border border-sky-500/30">
              Autosaved
            </span>
          </h1>
          <p className="text-[11px] text-neutral-500">
            Ephemeral notes, temporary code snippets, and quick scratch memory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-black border border-neutral-800 rounded-lg text-xs font-mono text-neutral-400">
            <span>{lines} lines</span>
            <span>•</span>
            <span>{words} words</span>
            <span>•</span>
            <span>{content.length} chars</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-900 text-sky-400 border border-sky-500/40 text-xs font-medium shadow-[0_0_12px_rgba(56,189,248,0.15)] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .md</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-6 bg-black overflow-hidden">
        <div className="h-full bg-black border border-neutral-900 rounded-lg overflow-hidden p-4 flex flex-col">
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Type your markdown notes or paste temporary code snippets here..."
            className="flex-1 w-full bg-transparent text-neutral-200 placeholder:text-neutral-700 font-mono text-xs leading-relaxed focus:outline-none resize-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
