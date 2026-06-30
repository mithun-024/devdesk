import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Database,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
} from 'lucide-react';
import { CredentialSummary } from '../../types';
import {
  exportBackup,
  importBackup,
  fetchCredentialsList,
  saveCredential,
  removeCredential,
  checkKeychainAvailable,
  fetchSettings,
  saveSetting,
} from '../../services/bridge';

interface SettingsViewProps {
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
  onDataRestored?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast, onDataRestored }) => {
  const [isKeychainReady, setIsKeychainReady] = useState(false);
  const [credentials, setCredentials] = useState<CredentialSummary[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAddingCredential, setIsAddingCredential] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [appSettings, setAppSettings] = useState<Record<string, any>>({});

  const loadData = async () => {
    try {
      const keychainAvailable = await checkKeychainAvailable();
      setIsKeychainReady(keychainAvailable);

      const creds = await fetchCredentialsList();
      setCredentials(creds);

      const settings = await fetchSettings();
      setAppSettings(settings);
    } catch (e) {
      console.error('Failed to load settings data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await exportBackup();
      if (res.success && res.filePath) {
        onShowToast('Backup Exported', `Saved to ${res.filePath}`, 'success');
      } else if (!res.canceled) {
        onShowToast('Export Failed', res.error || 'Could not export backup', 'error');
      }
    } catch (e: any) {
      onShowToast('Export Error', e.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    setIsImporting(true);
    try {
      const res = await importBackup();
      if (res.success) {
        onShowToast('Backup Restored', 'Database successfully restored from JSON backup', 'success');
        if (onDataRestored) onDataRestored();
        loadData();
      } else if (!res.canceled) {
        onShowToast('Import Failed', res.error || 'Could not restore backup', 'error');
      }
    } catch (e: any) {
      onShowToast('Import Error', e.message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) {
      onShowToast('Missing Fields', 'Please enter both key and secret value', 'error');
      return;
    }
    try {
      const success = await saveCredential(newKey.trim(), newValue.trim());
      if (success) {
        onShowToast('Credential Stored', `Encrypted in OS Keychain: ${newKey}`, 'success');
        setNewKey('');
        setNewValue('');
        setIsAddingCredential(false);
        const creds = await fetchCredentialsList();
        setCredentials(creds);
      } else {
        onShowToast('Error', 'Failed to store credential in keychain', 'error');
      }
    } catch (e: any) {
      onShowToast('Error', e.message, 'error');
    }
  };

  const handleDeleteCredential = async (key: string) => {
    if (!confirm(`Are you sure you want to delete secret key "${key}"?`)) return;
    try {
      await removeCredential(key);
      onShowToast('Deleted', `Removed secret "${key}"`, 'info');
      setCredentials((prev) => prev.filter((c) => c.key !== key));
    } catch (e: any) {
      onShowToast('Error', e.message, 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16161e] text-[#c0caf5] overflow-y-auto p-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#292e42] mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[#bb9af7]" />
            Settings & Security
          </h1>
          <p className="text-xs text-[#9aa5ce] mt-1">
            SQLite database persistence, OS keychain credential vault, and backup recovery.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2335] hover:bg-[#24283b] text-xs text-[#c0caf5] border border-[#292e42] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#7dcfff]" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database & Backups */}
        <div className="p-5 rounded-xl bg-[#1a1b26] border border-[#292e42] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <Database className="w-4 h-4 text-[#7dcfff]" />
              <h2 className="text-sm font-semibold text-white">Database & Persistence</h2>
            </div>
            <p className="text-xs text-[#9aa5ce] mb-4">
              DevDesk uses embedded SQLite powered by Drizzle ORM. All workspace paths, tasks, and history are stored locally.
            </p>

            <div className="space-y-2.5 mb-5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#1f2335] border border-[#292e42]">
                <span className="text-[#9aa5ce]">Engine</span>
                <span className="font-mono text-[#9ece6a] font-medium">SQLite 3 (Drizzle ORM)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#1f2335] border border-[#292e42]">
                <span className="text-[#9aa5ce]">Storage File</span>
                <span className="font-mono text-[#c0caf5]">~/.config/devdesk/devdesk.db</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#1f2335] border border-[#292e42]">
                <span className="text-[#9aa5ce]">Integrity Mode</span>
                <span className="font-mono text-[#7aa2f7]">WAL (Write-Ahead Logging)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#292e42] flex items-center gap-3">
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#1f2335] hover:bg-[#24283b] border border-[#292e42] hover:border-[#7dcfff]/40 text-xs font-medium text-[#c0caf5] transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#7dcfff]" />
              {isExporting ? 'Exporting...' : 'Export JSON Backup'}
            </button>
            <button
              onClick={handleImportBackup}
              disabled={isImporting}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#1f2335] hover:bg-[#24283b] border border-[#292e42] hover:border-[#9ece6a]/40 text-xs font-medium text-[#c0caf5] transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-[#9ece6a]" />
              {isImporting ? 'Importing...' : 'Import & Restore'}
            </button>
          </div>
        </div>

        {/* OS Keychain & Secrets */}
        <div className="p-5 rounded-xl bg-[#1a1b26] border border-[#292e42] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-[#bb9af7]" />
                <h2 className="text-sm font-semibold text-white">OS Keychain Credentials</h2>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isKeychainReady
                    ? 'bg-[#9ece6a]/10 border-[#9ece6a]/30 text-[#9ece6a]'
                    : 'bg-[#ff9e64]/10 border-[#ff9e64]/30 text-[#ff9e64]'
                }`}
              >
                {isKeychainReady ? 'Keychain Active' : 'Fallback Encrypted'}
              </span>
            </div>
            <p className="text-xs text-[#9aa5ce] mb-4">
              Sensitive tokens (GitHub PAT, API keys, database secrets) are encrypted directly using your operating system's native keychain (GNOME Keyring / KWallet).
            </p>

            {/* List of stored credential keys */}
            <div className="space-y-2 mb-4 max-h-[140px] overflow-y-auto">
              {credentials.length === 0 ? (
                <div className="text-center py-4 text-xs text-[#565f89] border border-dashed border-[#292e42] rounded-lg">
                  No encrypted secrets saved yet
                </div>
              ) : (
                credentials.map((cred) => (
                  <div
                    key={cred.key}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#1f2335] border border-[#292e42] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3 text-[#bb9af7]" />
                      <span className="font-mono text-[#c0caf5]">{cred.key}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#565f89] font-mono">
                        {new Date(cred.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteCredential(cred.key)}
                        className="text-[#565f89] hover:text-[#f7768e] transition-colors"
                        title="Delete credential"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#292e42]">
            {!isAddingCredential ? (
              <button
                onClick={() => setIsAddingCredential(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1f2335] hover:bg-[#24283b] border border-[#292e42] hover:border-[#bb9af7]/40 text-xs font-medium text-[#c0caf5] transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-[#bb9af7]" />
                Store New Credential
              </button>
            ) : (
              <form onSubmit={handleAddCredential} className="space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key name (e.g. GITHUB_TOKEN)"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#bb9af7] text-xs text-white placeholder-[#565f89] outline-none font-mono"
                  />
                  <input
                    type="password"
                    placeholder="Secret value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#16161e] border border-[#292e42] focus:border-[#bb9af7] text-xs text-white placeholder-[#565f89] outline-none"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddingCredential(false)}
                    className="px-2.5 py-1 text-xs text-[#9aa5ce] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-[#bb9af7]/20 hover:bg-[#bb9af7]/30 text-[#bb9af7] border border-[#bb9af7]/40 text-xs font-medium transition-colors"
                  >
                    Save Encrypted
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* About DevDesk */}
      <div className="mt-6 p-5 rounded-xl bg-[#1a1b26] border border-[#292e42]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1f2335] border border-[#7dcfff]/40 flex items-center justify-center">
              <span className="font-mono font-bold text-sm text-[#7dcfff]">D</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">DevDesk Standalone Desktop</div>
              <div className="text-xs text-[#9aa5ce]">
                Version 1.0.0 • Tokyo Night Twilight edition • Electron 45 • React 19 • Node PTY
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#1f2335] border border-[#292e42] text-xs font-mono text-[#9ece6a]">
              Native Host Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
