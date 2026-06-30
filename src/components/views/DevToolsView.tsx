import React, { useState } from 'react';
import {
  Braces,
  Key,
  Binary,
  Regex as RegexIcon,
  Copy,
  AlertCircle,
} from 'lucide-react';

type ToolTab = 'json' | 'jwt' | 'base64' | 'regex';

export const DevToolsView: React.FC<{
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ onShowToast }) => {
  const [activeTool, setActiveTool] = useState<ToolTab>('json');

  // JSON State
  const [jsonInput, setJsonInput] = useState('{\n  "service": "devdesk",\n  "status": "online",\n  "version": 1,\n  "features": ["terminal", "tasks", "git"]\n}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // JWT State
  const [jwtInput, setJwtInput] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1pdGh1biIsImFkbWluIjp0cnVlLCJpYXQiOjE1MTYyMzkwMjJ9.4phgtThpX_Vz8K1_X6qY290mP0vQ3k3B4p01y5l026k');
  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');

  // Base64 State
  const [b64Input, setB64Input] = useState('Hello DevDesk OLED Workstation!');
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
        setJwtHeader('Invalid JWT format (expected 3 dot-separated parts)');
        setJwtPayload('');
        return;
      }
      const headerDecoded = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
      const payloadDecoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));

      setJwtHeader(JSON.stringify(JSON.parse(headerDecoded), null, 2));
      setJwtPayload(JSON.stringify(JSON.parse(payloadDecoded), null, 2));
    } catch (e: any) {
      setJwtHeader('Error decoding JWT: ' + e.message);
      setJwtPayload('');
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
    <div className="flex-1 flex flex-col h-full bg-black overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-neutral-900 bg-neutral-950 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            Developer Offline Toolbox
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-purple-400 border border-purple-500/30">
              Offline & Private
            </span>
          </h1>
          <p className="text-[11px] text-neutral-500">JSON, JWT, Base64 & Regex analyzers</p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-black border border-neutral-800 rounded-lg p-0.5 text-xs font-mono">
          <button
            onClick={() => setActiveTool('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTool === 'json'
                ? 'bg-neutral-900 text-cyan-400 border border-cyan-500/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                : 'text-neutral-400 hover:text-white'
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
                ? 'bg-neutral-900 text-purple-400 border border-purple-500/30 shadow-[0_0_8px_rgba(176,38,255,0.2)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> JWT
          </button>
          <button
            onClick={() => setActiveTool('base64')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTool === 'base64'
                ? 'bg-neutral-900 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(0,255,102,0.2)]'
                : 'text-neutral-400 hover:text-white'
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
                ? 'bg-neutral-900 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(255,184,0,0.2)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <RegexIcon className="w-3.5 h-3.5" /> Regex
          </button>
        </div>
      </div>

      {/* Main Tool Content */}
      <div className="flex-1 overflow-auto p-6 font-mono text-xs bg-black">
        {activeTool === 'json' && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col h-full bg-black border border-neutral-900 rounded-lg overflow-hidden p-3 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                <span>Input JSON</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleFormatJson(2)}
                    className="px-2 py-1 rounded bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800"
                  >
                    Format (2s)
                  </button>
                  <button
                    onClick={handleMinifyJson}
                    className="px-2 py-1 rounded bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800"
                  >
                    Minify
                  </button>
                </div>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="flex-1 w-full bg-black border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:outline-none focus:border-cyan-400/50 font-mono resize-none leading-relaxed"
              />
              {jsonError && (
                <div className="text-pink-400 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {jsonError}
                </div>
              )}
            </div>

            <div className="flex flex-col h-full bg-black border border-neutral-900 rounded-lg overflow-hidden p-3 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                <span>Formatted Output</span>
                {jsonOutput && (
                  <button
                    onClick={() => copyToClipboard(jsonOutput)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                )}
              </div>
              <textarea
                readOnly
                value={jsonOutput}
                placeholder="Formatted output will appear here..."
                className="flex-1 w-full bg-black border border-neutral-800 rounded-lg p-3 text-emerald-400 font-mono resize-none leading-relaxed focus:outline-none"
              />
            </div>
          </div>
        )}

        {activeTool === 'jwt' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="bg-black border border-neutral-900 rounded-lg p-4 space-y-2">
              <label className="block text-neutral-300 font-medium">Encoded JWT Token</label>
              <textarea
                rows={3}
                value={jwtInput}
                onChange={(e) => {
                  setJwtInput(e.target.value);
                  setTimeout(handleDecodeJwt, 50);
                }}
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-purple-400 focus:outline-none focus:border-purple-500/50 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black border border-neutral-900 rounded-lg p-4 space-y-2">
                <span className="text-pink-400 font-semibold block text-[11px]">HEADER: ALGORITHM & TOKEN TYPE</span>
                <pre className="p-3 bg-black border border-neutral-900 rounded-lg text-pink-300 overflow-x-auto">
                  {jwtHeader || '{\n  "alg": "HS256",\n  "typ": "JWT"\n}'}
                </pre>
              </div>

              <div className="bg-black border border-neutral-900 rounded-lg p-4 space-y-2">
                <span className="text-cyan-400 font-semibold block text-[11px]">PAYLOAD: DATA CLAIMS</span>
                <pre className="p-3 bg-black border border-neutral-900 rounded-lg text-cyan-300 overflow-x-auto">
                  {jwtPayload || '{\n  "sub": "user_id"\n}'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTool === 'base64' && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="bg-black border border-neutral-900 rounded-lg p-4 flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                <span>Plaintext / Input</span>
                <div className="flex gap-2">
                  <button onClick={handleEncodeB64} className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-emerald-500/30 rounded">
                    Encode →
                  </button>
                  <button onClick={handleDecodeB64} className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded">
                    Decode ←
                  </button>
                </div>
              </div>
              <textarea
                value={b64Input}
                onChange={(e) => setB64Input(e.target.value)}
                className="flex-1 bg-black border border-neutral-800 rounded-lg p-3 text-neutral-200 resize-none focus:outline-none focus:border-cyan-400/50"
              />
            </div>

            <div className="bg-black border border-neutral-900 rounded-lg p-4 flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                <span>Base64 Result</span>
                {b64Output && (
                  <button
                    onClick={() => copyToClipboard(b64Output)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                )}
              </div>
              <textarea
                readOnly
                value={b64Output}
                className="flex-1 bg-black border border-neutral-800 rounded-lg p-3 text-cyan-300 resize-none focus:outline-none"
              />
            </div>
          </div>
        )}

        {activeTool === 'regex' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="bg-black border border-neutral-900 rounded-lg p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={regexPattern}
                  onChange={(e) => {
                    setRegexPattern(e.target.value);
                    setTimeout(handleRunRegex, 50);
                  }}
                  placeholder="Regex pattern (e.g. \d+)"
                  className="flex-1 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400/50"
                />
                <input
                  type="text"
                  value={regexFlags}
                  onChange={(e) => {
                    setRegexFlags(e.target.value);
                    setTimeout(handleRunRegex, 50);
                  }}
                  placeholder="Flags"
                  className="w-20 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-amber-400 font-mono text-xs text-center focus:outline-none"
                />
              </div>

              <textarea
                rows={4}
                value={regexTestString}
                onChange={(e) => {
                  setRegexTestString(e.target.value);
                  setTimeout(handleRunRegex, 50);
                }}
                placeholder="Test string..."
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-neutral-200 resize-none focus:outline-none focus:border-cyan-400/50 text-xs"
              />
            </div>

            <div className="bg-black border border-neutral-900 rounded-lg p-4 space-y-2">
              <span className="text-emerald-400 font-semibold block text-[11px]">
                MATCHES FOUND ({regexMatches.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {regexMatches.length === 0 ? (
                  <span className="text-neutral-600 italic font-mono">No matches</span>
                ) : (
                  regexMatches.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-black text-emerald-400 border border-emerald-500/30 font-mono shadow-[0_0_8px_rgba(0,255,102,0.15)]"
                    >
                      {m}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
