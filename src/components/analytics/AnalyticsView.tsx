/**
 * Semiconductor Fleet Analytics & Statistical Aggregation
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import {
  BarChart3,
  Download,
  Flame,
  Zap,
  Activity,
  Cpu,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.getAnalytics({ range: timeRange });
      setStats(res.analytics);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const handleExportCsv = () => {
    if (!stats) return;
    const rows = [
      ['Dimension', 'Mean', 'Min', 'Max', 'StdDev'],
      ['Temperature (C)', stats.temperature.mean, stats.temperature.min, stats.temperature.max, stats.temperature.stdDev],
      ['Voltage (V)', stats.voltage.mean, stats.voltage.min, stats.voltage.max, stats.voltage.stdDev],
      ['Power (W)', stats.power.mean, stats.power.min, stats.power.max, stats.power.stdDev],
      ['Frequency (MHz)', stats.frequency.mean, stats.frequency.min, stats.frequency.max, stats.frequency.stdDev]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `semiconductor_analytics_${timeRange}.csv`);
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
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>Statistical Fleet Analytics & Distributions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fleet-wide parametric distributions, variance analysis, and statistical process control (SPC).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 outline-none"
          >
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {stats && (
        <div className="space-y-6">
          {/* 4 Statistical Dimension Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {/* Temperature */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 uppercase">Junction Temperature</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{stats.temperature.mean.toFixed(1)}°C</div>
              <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                <div className="flex justify-between"><span>Min / Max:</span><span>{stats.temperature.min.toFixed(1)}° / {stats.temperature.max.toFixed(1)}°</span></div>
                <div className="flex justify-between"><span>Std Dev (σ):</span><span className="text-emerald-400">±{stats.temperature.stdDev.toFixed(2)}°C</span></div>
              </div>
            </div>

            {/* Voltage */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 uppercase">Core Voltage (Vdd)</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{stats.voltage.mean.toFixed(3)}V</div>
              <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                <div className="flex justify-between"><span>Min / Max:</span><span>{stats.voltage.min.toFixed(3)} / {stats.voltage.max.toFixed(3)}V</span></div>
                <div className="flex justify-between"><span>Std Dev (σ):</span><span className="text-emerald-400">±{(stats.voltage.stdDev * 1000).toFixed(1)} mV</span></div>
              </div>
            </div>

            {/* Power */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 uppercase">Power Dissipation</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{stats.power.mean.toFixed(1)}W</div>
              <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                <div className="flex justify-between"><span>Min / Max:</span><span>{stats.power.min.toFixed(1)} / {stats.power.max.toFixed(1)}W</span></div>
                <div className="flex justify-between"><span>Std Dev (σ):</span><span className="text-emerald-400">±{stats.power.stdDev.toFixed(2)}W</span></div>
              </div>
            </div>

            {/* Frequency */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 uppercase">Clock Frequency</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{Math.round(stats.frequency.mean)} MHz</div>
              <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                <div className="flex justify-between"><span>Min / Max:</span><span>{stats.frequency.min} / {stats.frequency.max} MHz</span></div>
                <div className="flex justify-between"><span>Std Dev (σ):</span><span className="text-emerald-400">±{stats.frequency.stdDev.toFixed(1)} MHz</span></div>
              </div>
            </div>
          </div>

          {/* Histogram Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
                Thermal Distribution (Junction Temp Buckets)
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.temperatureBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Samples" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
                Voltage Distribution (Vdd Variation)
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.voltageBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Samples" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
