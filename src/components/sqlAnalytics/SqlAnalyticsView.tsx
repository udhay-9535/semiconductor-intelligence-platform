/**
 * SQL Analytics Workspace & Data Governance View
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Play,
  FileText,
  CheckCircle2,
  AlertCircle,
  Table,
  Terminal,
  Activity,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';
import { api } from '../../services/api.ts';

export const SqlAnalyticsView: React.FC = () => {
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('THERMAL_WINDOW_STATS');
  const [customSql, setCustomSql] = useState<string>('');
  const [governanceData, setGovernanceData] = useState<any>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const loadPresets = async () => {
    try {
      const data = await api.getSqlPresets();
      setPresets(data.presets || []);
      setGovernanceData(data.governance);
      if (data.presets && data.presets.length > 0) {
        setCustomSql(data.presets[0].sql);
      }
    } catch (err) {
      console.error('Failed to load SQL presets:', err);
    }
  };

  const runQuery = async () => {
    setExecuting(true);
    try {
      const res = await api.executeSqlQuery(selectedPresetKey, customSql);
      setQueryResult(res);
    } catch (err) {
      console.error('Failed to execute SQL query:', err);
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    loadPresets();
    runQuery();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              MODULE 3 &amp; 24 • DATA ANALYTICS &amp; GOVERNANCE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              SQL ENGINE &amp; WINDOW FUNCTIONS
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono mt-1">
            <Database className="w-6 h-6 text-blue-400" />
            <span>SQL Analytics Workspace &amp; Data Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Analytical SQL workspace with Window Functions, CTEs, EXPLAIN Query Plan analyzers, and Pearson correlation matrices.
          </p>
        </div>

        <button
          onClick={runQuery}
          disabled={executing}
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition font-mono shadow-sm"
        >
          <Play className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
          <span>{executing ? 'Executing Query...' : 'Run Analytical Query'}</span>
        </button>
      </div>

      {/* Data Governance KPI Cards */}
      {governanceData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 font-mono">
            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
              <span>Data Quality Score</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">{governanceData.overallQualityScore} / 100</div>
            <div className="text-[10px] text-slate-400">Completeness: {governanceData.completenessPct}%</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 font-mono">
            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
              <span>Total Ingested Rows</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-slate-100">{governanceData.totalRecords}</div>
            <div className="text-[10px] text-slate-400">Telemetry event partitions</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 font-mono">
            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
              <span>Z-Score Outliers (&gt;3σ)</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400">{governanceData.outlierCount}</div>
            <div className="text-[10px] text-slate-400">Statistical anomalies flagged</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 font-mono">
            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
              <span>Data Ingest Freshness</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-cyan-400">{governanceData.freshnessSec} s</div>
            <div className="text-[10px] text-slate-400">Continuous stream lag</div>
          </div>
        </div>
      )}

      {/* SQL Query Editor & Preset Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preset Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
          <h3 className="text-xs font-bold text-blue-400 uppercase font-mono flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Analytical Query Presets</span>
          </h3>

          <div className="space-y-2">
            {presets.map(p => (
              <button
                key={p.key}
                onClick={() => {
                  setSelectedPresetKey(p.key);
                  setCustomSql(p.sql);
                  api.executeSqlQuery(p.key, p.sql).then(setQueryResult);
                }}
                className={`w-full p-3 rounded-lg text-left transition border ${
                  selectedPresetKey === p.key
                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-slate-200 text-xs">{p.name}</div>
                <div className="text-[10px] text-slate-500 mt-1">{p.description}</div>
              </button>
            ))}
          </div>

          {/* Pearson Correlation Matrix */}
          {governanceData?.correlationMatrix && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase">Pearson Correlation Matrix (r):</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-[10px]">
                  <thead>
                    <tr className="text-slate-500">
                      <th></th>
                      {governanceData.correlationMatrix.labels.map((l: string) => (
                        <th key={l} className="p-1">{l.split(' ')[0]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {governanceData.correlationMatrix.matrix.map((row: number[], rIdx: number) => (
                      <tr key={rIdx} className="border-t border-slate-900">
                        <td className="text-slate-500 font-bold text-left p-1">
                          {governanceData.correlationMatrix.labels[rIdx].split(' ')[0]}
                        </td>
                        {row.map((val: number, cIdx: number) => (
                          <td
                            key={cIdx}
                            className={`p-1 font-bold ${
                              val >= 0.85 ? 'text-rose-400 bg-rose-500/10' :
                              val >= 0.60 ? 'text-amber-400 bg-amber-500/10' :
                              'text-slate-400'
                            }`}
                          >
                            {val.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* SQL Code & Execution Result */}
        <div className="lg:col-span-2 space-y-6 font-mono text-xs">
          {/* SQL Editor */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>SQL Query Editor</span>
              </span>
              <span className="text-[10px] text-slate-500">PostgreSQL Dialect Compatible</span>
            </div>

            <textarea
              rows={8}
              value={customSql}
              onChange={e => setCustomSql(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Results & Query Plan */}
          {queryResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span>Query Results ({queryResult.rowCount} rows in {queryResult.executionTimeMs} ms)</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                  SUCCESS (200 OK)
                </span>
              </div>

              {/* Table Output */}
              <div className="max-h-60 overflow-y-auto custom-scrollbar border border-slate-800 rounded-lg bg-slate-950">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      {queryResult.columns?.map((col: string) => (
                        <th key={col} className="p-2.5 font-bold uppercase">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {queryResult.rows?.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-900/40 text-slate-300">
                        {queryResult.columns?.map((col: string) => (
                          <td key={col} className="p-2.5">
                            {row[col] === 'ANOMALY_SPIKE' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold">
                                ANOMALY SPIKE
                              </span>
                            ) : (
                              String(row[col])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Execution Plan */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">EXPLAIN ANALYZE Execution Plan:</div>
                <pre className="text-[10px] text-emerald-400/90 whitespace-pre-wrap font-mono">
                  {queryResult.executionPlan}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
