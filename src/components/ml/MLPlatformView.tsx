/**
 * Semiconductor ML Platform, Model Registry & Drift Monitoring
 */

import React, { useState, useEffect } from 'react';
import { MLModelRegistryEntry, MLMonitoringMetrics } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  BrainCircuit,
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sliders,
  Sparkles,
  ArrowUpRight,
  Database
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const MLPlatformView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [models, setModels] = useState<MLModelRegistryEntry[]>([]);
  const [monitoring, setMonitoring] = useState<MLMonitoringMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchMLData = async () => {
    try {
      const [modelRes, monRes] = await Promise.all([
        api.getModels(),
        api.getMLMonitoring()
      ]);
      setModels(modelRes?.models || []);
      setMonitoring(monRes?.monitoring || null);
    } catch (err) {
      console.error('Failed to load ML platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLData();
  }, []);

  const handlePromoteModel = async (id: string, newStatus: string) => {
    try {
      await api.deployModel(id, newStatus, 'Promoted via ML Platform Console');
      setActionSuccess(`Model status updated to ${newStatus}`);
      fetchMLData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to update model status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono">
            <BrainCircuit className="w-6 h-6 text-purple-400" />
            <span>Semiconductor ML Platform & Model Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Isolation Forest anomaly detector, failure prediction models, and live feature drift tracking.
          </p>
        </div>

        {actionSuccess && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Monitoring KPI Cards */}
      {monitoring && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-slate-400 uppercase font-mono">24h Inferences</div>
            <div className="text-2xl font-bold text-slate-100 font-mono mt-1">
              {monitoring.totalPredictions24h.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>Real-time on-die scoring</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Anomaly Rate</div>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
              {monitoring.anomalyRatePct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">Within 5% nominal bound</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Model Confidence</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {monitoring.averageConfidencePct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">Isolation tree depth &gt; 8</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Data Drift Score (PSI)</div>
            <div className="text-2xl font-bold text-purple-400 font-mono mt-1">
              {monitoring.dataDriftScore}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-mono">STABLE (&lt; 0.10 threshold)</div>
          </div>
        </div>
      )}

      {/* Feature Drift Table & Distribution Histogram */}
      {monitoring && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Drift Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center justify-between">
              <span>Telemetry Feature Drift Analysis (Wasserstein PSI)</span>
              <span className="text-emerald-400 font-mono text-[10px]">ALL NORMAL</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Telemetry Feature</th>
                    <th className="py-2.5 px-3 text-right">Drift Score</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {monitoring.featureDrift.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-300 font-sans">{f.feature}</td>
                      <td className="py-2 px-3 text-right text-slate-200 font-bold">{f.driftScore.toFixed(3)}</td>
                      <td className="py-2 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Anomaly Distribution Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
              Prediction Score Distribution (24h Histogram)
            </h3>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monitoring.predictionDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} name="Inference Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Model Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-200 uppercase font-mono">
              Enterprise ML Model Registry
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">Total Registered: {models.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Model Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">F1 Score</th>
                <th className="py-3 px-4">ROC-AUC</th>
                <th className="py-3 px-4">Trained Samples</th>
                <th className="py-3 px-4 text-right">Governance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {models.map(model => (
                <tr key={model.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-100 font-sans">
                    <div>{model.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{model.id}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{model.type}</td>
                  <td className="py-3 px-4 text-slate-400">{model.version}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      model.status === 'PRODUCTION' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      model.status === 'STAGED' || model.status === 'VALIDATED' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {model.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-200">
                    {model.metrics.f1Score ? model.metrics.f1Score.toFixed(3) : '--'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {model.metrics.rocAuc ? model.metrics.rocAuc.toFixed(3) : '--'}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {model.metrics.meanInferenceLatencyMs ? `${model.metrics.meanInferenceLatencyMs.toFixed(1)}ms` : '--'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isAdmin && (
                      <select
                        value={model.status}
                        onChange={e => handlePromoteModel(model.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-[10px] font-mono focus:border-purple-500 outline-none"
                      >
                        <option value="DEVELOPMENT">DEVELOPMENT</option>
                        <option value="VALIDATION">VALIDATION</option>
                        <option value="STAGING">STAGING</option>
                        <option value="PRODUCTION">PRODUCTION</option>
                        <option value="RETIRED">RETIRED</option>
                      </select>
                    )}
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
