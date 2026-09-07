/**
 * Immutable Enterprise Audit Log & Security Compliance Trail
 */

import React, { useState, useEffect } from 'react';
import { AuditLogEntry } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  ShieldCheck,
  Search,
  Download,
  Filter,
  User,
  Clock,
  Terminal,
  RefreshCw
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.getAuditLogs({
        action: actionFilter || undefined,
        limit: 100
      });
      setLogs(res?.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [actionFilter]);

  const filteredLogs = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.userName?.toLowerCase().includes(q) ||
      l.userId?.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.targetId?.toLowerCase().includes(q) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    const rows = [
      ['Timestamp', 'Actor', 'Role', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Result'],
      ...filteredLogs.map(l => [
        l.timestamp,
        l.userName || l.userId,
        l.userRole,
        l.action,
        l.targetType,
        l.targetId || '',
        l.ipAddress || '',
        l.result
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>Immutable Security Audit & Compliance Log</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident access log capturing user authentication, parameter overrides, incident escalations, and model deployments.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition font-mono"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actor email, action, resource ID, or IP..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono">Action:</span>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none font-mono"
          >
            <option value="">All Security Events</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="DEVICE_SCENARIO_UPDATED">DEVICE_SCENARIO_UPDATED</option>
            <option value="WHAT_IF_SIMULATION_EXECUTED">WHAT_IF_SIMULATION_EXECUTED</option>
            <option value="ALERT_ACKNOWLEDGED">ALERT_ACKNOWLEDGED</option>
            <option value="ALERT_ESCALATED">ALERT_ESCALATED</option>
            <option value="MODEL_PROMOTED">MODEL_PROMOTED</option>
            <option value="AI_DIAGNOSTICS_RUN">AI_DIAGNOSTICS_RUN</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor / Principal</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Resource Target</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString().slice(5)})
                  </td>
                  <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">{log.userName || log.userId}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400 font-mono">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono">
                    {log.targetType}{log.targetId ? `: ${log.targetId}` : ''}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.result === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400' :
                      log.result === 'DENIED' ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
