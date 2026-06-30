import React, { useState } from 'react';
import {
  Braces,
  Key,
  Binary,
  Regex as RegexIcon,
  Copy,
  AlertCircle,
  Wrench,
} from 'lucide-react';

type ToolTab = 'json' | 'jwt' | 'base64' | 'regex';

export const DevToolsView: React.FC<{
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ onShowToast }) => {
  const [activeTool, setActiveTool] = useState<ToolTab>('json');

  // JSON State
  const [jsonInput, setJsonInput] = useState('{\n  "service": "devdesk",\n  "status": "online",\n  "theme": "tokyo-night",\n  "features": ["sqlite", "keychain", "git", "pty"]\n}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // JWT State
  const [jwtInput, setJwtInput] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1pdGh1biIsImFkbWluIjp0cnVlLCJpYXQiOjE1MTYyMzkwMjJ9.4phgtThpX_Vz8K1_X6qY290mP0vQ3k3B4p01y5l026k');
  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');

  // Base64 State
  const [b64Input, setB64Input] = useState('Hello DevDesk Tokyo Night Workstation!');
  const [b64Output, setB64Output] = useState('');

  // Regex State
  const [regexPattern, setRegexPattern] = useState('[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexTestString, setRegexTestString] = useState('Contact support@devdesk.local or mithun@gmail.com for help.');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);

  // Handlers
  const handleFormatJson = (indent: number = 2) => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, indent));
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleMinifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleDecodeJwt = () => {
    try {
      const parts = jwtInput.trim().split('.');
      if (parts.length < 2) {
        throw new Error('Invalid JWT format (expected 3 dot-separated segments)');
      }
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      setJwtHeader(JSON.stringify(header, null, 2));
      setJwtPayload(JSON.stringify(payload, null, 2));
    } catch (e: any) {
      onShowToast('JWT Parse Error', e.message, 'error');
    }
  };

  const handleEncodeB64 = () => {
    try {
      setB64Output(btoa(b64Input));
    } catch (e: any) {
      onShowToast('Encoding failed', e.message, 'error');
    }
  };

  const handleDecodeB64 = () => {
    try {
      setB64Output(atob(b64Input));
    } catch (e: any) {
      onShowToast('Decoding failed', e.message, 'error');
    }
  };

  const handleRunRegex = () => {
    try {
      const re = new RegExp(regexPattern, regexFlags);
      const matches = regexTestString.match(re) || [];
      setRegexMatches(matches);
    } catch (e) {
      setRegexMatches([]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast('Copied to clipboard', undefined, 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16161e] text-[#c0caf5] overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="h-14 px-6 border-b border-[#292e42] bg-[#1a1b26] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#bb9af7]" />
            Developer Offline Toolbox
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#bb9af7]/15 text-[#bb9af7] border border-[#bb9af7]/30">
              Offline & Private
            </span>
          </h1>
          <p className="text-[11px] text-[#565f89]">JSON, JWT, Base64 & Regex analyzers</p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-[#16161e] border border-[#292e42] rounded-lg p-0.5 text-xs font-mono">
          <button
            onClick={() => setActiveTool('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTool === 'json'
                ? 'bg-[#24283b] text-[#7dcfff] border border-[#7dcfff]/30 shadow-[0_0_8px_rgba(125,207,255,0.2)]'
                : 'text-[#9aa5ce] hover:text-white'
            }`}
          >
            <Braces className="w-3.5 h-3.5" /> JSON
          </button>
          <button
            onClick={() => {
              setActiveTool('jwt');
              handleDecodeJwt();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTool === 'jwt'
                ? 'bg-[#24283b] text-[#bb9af7] border border-[#bb9af7]/30 shadow-[0_0_8px_rgba(187,154,247,0.2)]'
                : 'text-[#9aa5ce] hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> JWT
          </button>
          <button
            onClick={() => setActiveTool('base64')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTool === 'base64'
                ? 'bg-[#24283b] text-[#9ece6a] border border-[#9ece6a]/30 shadow-[0_0_8px_rgba(158,206,106,0.2)]'
                : 'text-[#9aa5ce] hover:text-white'
            }`}
          >
            <Binary className="w-3.5 h-3.5" /> Base64
          </button>
          <button
            onClick={() => {
              setActiveTool('regex');
              handleRunRegex();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTool === 'regex'
                ? 'bg-[#24283b] text-[#ff9e64] border border-[#ff9e64]/30 shadow-[0_0_8px_rgba(255,158,100,0.2)]'
                : 'text-[#9aa5ce] hover:text-white'
            }`}
          >
            <RegexIcon className="w-3.5 h-3.5" /> Regex
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 p-6 overflow-hidden bg-[#16161e]">
        {activeTool === 'json' && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col bg-[#1a1b26] border border-[#292e42] rounded-xl p-4 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#292e42] mb-3">
                <span className="text-xs font-mono text-[#9aa5ce]">JSON Input</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFormatJson(2)}
                    className="px-2.5 py-1 rounded bg-[#1f2335] hover:bg-[#24283b] border border-[#292e42] text-xs text-[#7dcfff] font-mono transition-colors"
                  >
                    Beautify
                  </button>
                  <button
                    onClick={handleMinifyJson}
                    className="px-2.5 py-1 rounded bg-[#1f2335] hover:bg-[#24283b] border border-[#292e42] text-xs text-[#9aa5ce] font-mono transition-colors"
                  >
                    Minify
                  </button>
                </div>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste JSON here..."
                className="flex-1 bg-transparent text-[#c0caf5] font-mono text-xs outline-none resize-none leading-relaxed"
              />
              {jsonError && (
                <div className="mt-2 p-2 rounded bg-[#f7768e]/10 border border-[#f7768e]/30 text-[#f7768e] text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="font-mono">{jsonError}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col bg-[#1a1b26] border border-[#292e42] rounded-xl p-4 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#292e42] mb-3">
                <span className="text-xs font-mono text-[#9aa5ce]">Formatted Output</span>
                {jsonOutput && (
                  <button
                    onClick={() => copyToClipboard(jsonOutput)}
                    className="flex items-center gap-1 text-xs text-[#7dcfff] hover:underline font-mono"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                )}
              </div>
              <pre className="flex-1 overflow-auto text-[#9ece6a] font-mono text-xs leading-relaxed">
                {jsonOutput || '// Output will appear here...'}
              </pre>
            </div>
          </div>
        )}

        {activeTool === 'jwt' && (
          <div className="flex flex-col h-full space-y-4">
            <div className="p-4 bg-[#1a1b26] border border-[#292e42] rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[#9aa5ce]">Encoded JWT Token</span>
                <button
                  onClick={handleDecodeJwt}
                  className="px-3 py-1 rounded bg-[#bb9af7]/20 hover:bg-[#bb9af7]/30 border border-[#bb9af7]/40 text-xs text-[#bb9af7] font-medium transition-colors"
                >
                  Decode Token
                </button>
              </div>
              <input
                type="text"
                value={jwtInput}
                onChange={(e) => setJwtInput(e.target.value)}
                className="w-full bg-[#16161e] border border-[#292e42] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-[#bb9af7]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
              <div className="bg-[#1a1b26] border border-[#292e42] rounded-xl p-4 flex flex-col overflow-hidden">
                <span className="text-xs font-mono text-[#7dcfff] pb-2 border-b border-[#292e42] mb-2">Header</span>
                <pre className="flex-1 overflow-auto text-xs font-mono text-[#7dcfff] leading-relaxed">
                  {jwtHeader || '// Header'}
                </pre>
              </div>
              <div className="bg-[#1a1b26] border border-[#292e42] rounded-xl p-4 flex flex-col overflow-hidden">
                <span className="text-xs font-mono text-[#bb9af7] pb-2 border-b border-[#292e42] mb-2">Payload</span>
                <pre className="flex-1 overflow-auto text-xs font-mono text-[#bb9af7] leading-relaxed">
                  {jwtPayload || '// Payload'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTool === 'base64' && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col bg-[#1a1b26] border border-[#292e42] rounded-xl p-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#292e42] mb-3">
                <span className="text-xs font-mono text-[#9aa5ce]">Text Input</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleEncodeB64}
                    className="px-2.5 py-1 rounded bg-[#1f2335] hover:bg-[#24283b] border border-[#292e42] text-xs text-[#9ece6a] font-mono transition-colors"
                  >
                    Encode
                  </button>
                  <button
                    onClick={handleDecodeB64}
                    className="px-2.5 py-1 rounded bg-[#1f2335] hover:bg-[#24283b] border border-[#292e42] text-xs text-[#7dcfff] font-mono transition-colors"
                  >
                    Decode
                  </button>
                </div>
              </div>
              <textarea
                value={b64Input}
                onChange={(e) => setB64Input(e.target.value)}
                className="flex-1 bg-transparent text-[#c0caf5] font-mono text-xs outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col bg-[#1a1b26] border border-[#292e42] rounded-xl p-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#292e42] mb-3">
                <span className="text-xs font-mono text-[#9aa5ce]">Base64 Output</span>
                {b64Output && (
                  <button
                    onClick={() => copyToClipboard(b64Output)}
                    className="flex items-center gap-1 text-xs text-[#9ece6a] hover:underline font-mono"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                )}
              </div>
              <pre className="flex-1 overflow-auto text-[#9ece6a] font-mono text-xs leading-relaxed">
                {b64Output || '// Encoded or decoded output...'}
              </pre>
            </div>
          </div>
        )}

        {activeTool === 'regex' && (
          <div className="flex flex-col h-full space-y-4">
            <div className="p-4 bg-[#1a1b26] border border-[#292e42] rounded-xl flex gap-3 items-center">
              <div className="flex-1">
                <label className="text-[11px] font-mono text-[#9aa5ce] mb-1 block">Regular Expression</label>
                <input
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  className="w-full bg-[#16161e] border border-[#292e42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-[#ff9e64]"
                />
              </div>
              <div className="w-24">
                <label className="text-[11px] font-mono text-[#9aa5ce] mb-1 block">Flags</label>
                <input
                  type="text"
                  value={regexFlags}
                  onChange={(e) => setRegexFlags(e.target.value)}
                  className="w-full bg-[#16161e] border border-[#292e42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-[#ff9e64]"
                />
              </div>
              <button
                onClick={handleRunRegex}
                className="mt-5 px-4 py-2 rounded-lg bg-[#ff9e64]/20 hover:bg-[#ff9e64]/30 border border-[#ff9e64]/40 text-xs font-medium text-[#ff9e64] transition-colors"
              >
                Match
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
              <div className="bg-[#1a1b26] border border-[#292e42] rounded-xl p-4 flex flex-col">
                <span className="text-xs font-mono text-[#9aa5ce] pb-2 border-b border-[#292e42] mb-2">Test String</span>
                <textarea
                  value={regexTestString}
                  onChange={(e) => setRegexTestString(e.target.value)}
                  className="flex-1 bg-transparent text-[#c0caf5] font-mono text-xs outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="bg-[#1a1b26] border border-[#292e42] rounded-xl p-4 flex flex-col overflow-hidden">
                <span className="text-xs font-mono text-[#ff9e64] pb-2 border-b border-[#292e42] mb-2">
                  Matches ({regexMatches.length})
                </span>
                <div className="flex-1 overflow-auto space-y-1.5 font-mono text-xs">
                  {regexMatches.length === 0 ? (
                    <div className="text-[#565f89] text-xs italic">No matches found</div>
                  ) : (
                    regexMatches.map((m, idx) => (
                      <div key={idx} className="p-2 rounded bg-[#16161e] border border-[#292e42] text-[#ff9e64]">
                        {idx + 1}: {m}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
