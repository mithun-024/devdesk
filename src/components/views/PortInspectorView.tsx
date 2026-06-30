import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  Skull,
  Radio,
  Activity,
} from 'lucide-react';
import { ActivePort } from '../../types';
import { fetchActivePorts, killProcessByPid } from '../../services/bridge';

interface PortInspectorViewProps {
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshPortCount: (count: number) => void;
}

export const PortInspectorView: React.FC<PortInspectorViewProps> = ({
  onShowToast,
  onRefreshPortCount,
}) => {
  const [ports, setPorts] = useState<ActivePort[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [killingPid, setKillingPid] = useState<number | null>(null);

  const loadPorts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchActivePorts();
      setPorts(data);
      onRefreshPortCount(data.length);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPorts();
    const interval = setInterval(loadPorts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (port: ActivePort) => {
    setKillingPid(port.pid);
    try {
      const result = await killProcessByPid(port.pid);
      if (result.success) {
        onShowToast(
          'Process Killed',
          `Terminated PID ${port.pid} (${port.processName}) on port ${port.port}`,
          'success'
        );
        const updated = ports.filter((p) => p.pid !== port.pid);
        setPorts(updated);
        onRefreshPortCount(updated.length);
      } else {
        onShowToast('Kill Failed', result.message, 'error');
      }
    } finally {
      setKillingPid(null);
    }
  };

  const filteredPorts = ports.filter(
    (p) =>
      p.port.toString().includes(searchQuery) ||
      p.processName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pid.toString().includes(searchQuery)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16161e] text-[#c0caf5] overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="h-14 px-6 border-b border-[#292e42] bg-[#1a1b26] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#f7768e]" />
            Active Ports & Process Killer
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#9ece6a]/15 text-[#9ece6a] border border-[#9ece6a]/30">
              {ports.length} listening
            </span>
          </h1>
          <p className="text-[11px] text-[#565f89]">
            Real Linux port monitor (lsof/ss) & one-click process termination
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#565f89] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search port, PID, process..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#16161e] border border-[#292e42] text-xs text-[#c0caf5] placeholder:text-[#565f89] focus:outline-none focus:border-[#7dcfff] w-56 font-mono"
            />
          </div>

          <button
            onClick={loadPorts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2335] hover:bg-[#24283b] border border-[#292e42] text-xs text-[#c0caf5] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#7dcfff]' : ''}`} />
            <span>Scan</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto p-6 bg-[#16161e]">
        <div className="bg-[#1a1b26] border border-[#292e42] rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#16161e] text-[#565f89] text-[11px] border-b border-[#292e42]">
              <tr>
                <th className="py-3 px-4">Port</th>
                <th className="py-3 px-4">PID</th>
                <th className="py-3 px-4">Process / Command</th>
                <th className="py-3 px-4">Memory</th>
                <th className="py-3 px-4">Protocol</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292e42]">
              {filteredPorts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#565f89] text-xs italic">
                    No active processes matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredPorts.map((port) => (
                  <tr key={`${port.port}-${port.pid}`} className="hover:bg-[#1f2335]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#9ece6a]">
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-3 h-3 text-[#9ece6a] animate-pulse" />
                        {port.port}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#9aa5ce]">{port.pid}</td>
                    <td className="py-3 px-4 text-white font-medium">
                      <span className="px-2 py-0.5 rounded bg-[#16161e] border border-[#292e42] text-[#c0caf5]">
                        {port.processName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#7dcfff]">
                      {port.memoryMb ? `${port.memoryMb.toFixed(1)} MB` : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#565f89] uppercase text-[10px]">{port.protocol}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-[#9ece6a]/15 text-[#9ece6a] border border-[#9ece6a]/30 text-[10px]">
                        {port.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        disabled={killingPid === port.pid}
                        onClick={() => handleKill(port)}
                        className="px-2.5 py-1 rounded-lg bg-[#f7768e]/15 hover:bg-[#f7768e]/25 border border-[#f7768e]/40 text-[#f7768e] text-[11px] font-medium transition-all flex items-center gap-1 ml-auto disabled:opacity-50"
                        title={`Kill PID ${port.pid}`}
                      >
                        <Skull className="w-3 h-3 text-[#f7768e]" />
                        <span>{killingPid === port.pid ? 'Killing...' : 'Kill'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
