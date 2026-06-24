import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  AlertTriangle,
  Skull,
  Radio,
  Cpu,
  CheckCircle2,
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
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-white/[0.07] bg-[#0d0f17]/70 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            Active Ports & Process Killer
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {ports.length} listening
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">
            Real-time port monitor & one-click process termination (solves port collisions)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search port, PID, process..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-surface-200 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 w-52 font-mono"
            />
          </div>

          <button
            onClick={loadPorts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 border border-white/10 text-xs text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Scan</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-[#0e1017] border border-white/[0.07] rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#131622] text-slate-400 text-[11px] border-b border-white/[0.07]">
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
            <tbody className="divide-y divide-white/[0.04]">
              {filteredPorts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 text-xs italic">
                    No active processes matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredPorts.map((port) => (
                  <tr key={`${port.port}-${port.pid}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                        {port.port}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{port.pid}</td>
                    <td className="py-3 px-4 text-slate-200 font-medium">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300">
                        {port.processName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {port.memoryMb ? `${port.memoryMb.toFixed(1)} MB` : '—'}
                    </td>
                    <td className="py-3 px-4 text-indigo-400 uppercase text-[10px]">{port.protocol}</td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        {port.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        disabled={killingPid === port.pid}
                        onClick={() => handleKill(port)}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-[11px] font-medium transition-all flex items-center gap-1 ml-auto disabled:opacity-50"
                        title={`Kill PID ${port.pid}`}
                      >
                        <Skull className="w-3 h-3 text-rose-400" />
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
