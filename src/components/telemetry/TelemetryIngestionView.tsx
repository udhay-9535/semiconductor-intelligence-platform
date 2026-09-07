/**
 * Telemetry Ingestion Pipeline & Raw Stream Inspector
 */

import React, { useState, useEffect } from 'react';
import { TelemetryReading, Device } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Activity,
  Upload,
  Terminal,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Flame,
  Zap,
  Play
} from 'lucide-react';

export const TelemetryIngestionView: React.FC = () => {
  const { isEngineer } = useAuth();
  const [telemetryStream, setTelemetryStream] = useState<TelemetryReading[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'stream' | 'csv' | 'api'>('stream');

  // CSV Upload State
  const [csvContent, setCsvContent] = useState('');
  const [uploadResult, setUploadResult] = useState<{ message?: string; successCount?: number; rejectedCount?: number; validationErrors?: string[] } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStream = async () => {
    try {
      const res = await api.getTelemetry({
        deviceId: selectedDevice || undefined,
        limit: 25
      });
      setTelemetryStream(res?.readings || []);
    } catch (err) {
      console.error('Failed to fetch telemetry stream:', err);
    }
  };

  useEffect(() => {
    api.getDevices().then(res => setDevices(res?.devices || [])).catch(console.error);
    fetchStream();
    const interval = setInterval(fetchStream, 1500);
    return () => clearInterval(interval);
  }, [selectedDevice]);

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) return;

    setUploading(true);
    setUploadResult(null);
    try {
      const res = await api.uploadTelemetryCsv(csvContent, selectedDevice || undefined);
      setUploadResult(res);
      fetchStream();
    } catch (err: any) {
      setUploadResult({ validationErrors: [err.message] });
    } finally {
      setUploading(false);
    }
  };

  const sampleCsv = `timestamp,deviceId,temperatureC,voltageV,currentA,powerW,frequencyMHz,utilizationPct,fanSpeedRpm,coolingEfficiencyPct,errorCount
${new Date().toISOString()},ST-001,68.4,0.845,41.2,34.8,2400,72,3400,95,0
${new Date(Date.now() - 1000).toISOString()},ST-001,69.1,0.850,42.0,35.7,2400,75,3420,94,0
${new Date(Date.now() - 2000).toISOString()},ST-001,71.2,0.865,44.5,38.5,2400,82,3450,92,0`;

  const curlSnippet = `curl -X POST https://semi-intel.internal/api/v1/telemetry \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <API_TOKEN>" \\
  -d '{
    "deviceId": "${selectedDevice || 'ST-001'}",
    "temperatureC": 68.4,
    "voltageV": 0.845,
    "currentA": 41.2,
    "powerW": 34.8,
    "frequencyMHz": 2400,
    "utilizationPct": 72.0,
    "fanSpeedRpm": 3400,
    "coolingEfficiencyPct": 95.0,
    "errorCount": 0
  }'`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>High-Frequency Telemetry Ingestion Pipeline</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live ingestion stream, batch CSV validation parser, and REST endpoint integration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDevice}
            onChange={e => setSelectedDevice(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 outline-none"
          >
            <option value="">All Devices (Fleet Stream)</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>
                {d.id} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('stream')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${
            activeSubTab === 'stream' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Ingestion Stream (1 Hz)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('csv')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${
            activeSubTab === 'csv' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Manual CSV Import</span>
        </button>

        <button
          onClick={() => setActiveSubTab('api')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${
            activeSubTab === 'api' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>REST Ingestion API (cURL)</span>
        </button>
      </div>

      {/* Tab 1: Live Stream */}
      {activeSubTab === 'stream' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-200 font-bold">REAL-TIME TELEMETRY BUFFER (LATEST 25 PACKETS)</span>
            </div>
            <span className="text-slate-400">Total Buffer Size: {telemetryStream.length} readings</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Device ID</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">T_junction (°C)</th>
                  <th className="py-2.5 px-3">Vdd (V)</th>
                  <th className="py-2.5 px-3">Current (A)</th>
                  <th className="py-2.5 px-3">Power (W)</th>
                  <th className="py-2.5 px-3">Freq (MHz)</th>
                  <th className="py-2.5 px-3">Health</th>
                  <th className="py-2.5 px-3">ML Anomaly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {telemetryStream.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-slate-400">{t.timestamp.split('T')[1]?.slice(0, 12)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-100">{t.deviceId}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {t.mode}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${t.temperatureC > 85 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {t.temperatureC.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{t.voltageV.toFixed(3)}</td>
                    <td className="py-2.5 px-3 text-slate-400">{t.currentA.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">{t.powerW.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-slate-300">{t.frequencyMHz}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold ${(t.healthScore || 90) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {t.healthScore ?? 90}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        (t.anomalyScore || 0) > 0.65 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400'
                      }`}>
                        {t.anomalyScore ? (t.anomalyScore * 100).toFixed(1) + '%' : 'Nominal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: CSV Upload */}
      {activeSubTab === 'csv' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
              Batch Telemetry CSV Ingestion & Pre-Validation
            </h3>
            <button
              type="button"
              onClick={() => setCsvContent(sampleCsv)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono"
            >
              Insert Sample Telemetry CSV
            </button>
          </div>

          <form onSubmit={handleCsvUpload} className="space-y-4">
            <textarea
              rows={8}
              value={csvContent}
              onChange={e => setCsvContent(e.target.value)}
              placeholder="Paste raw CSV content here (columns: timestamp, deviceId, temperatureC, voltageV, currentA, powerW, frequencyMHz, utilizationPct, fanSpeedRpm, coolingEfficiencyPct, errorCount)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 font-mono text-xs focus:border-emerald-500 outline-none custom-scrollbar"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Supports standard comma-separated format with strict schema validation.
              </span>

              <button
                type="submit"
                disabled={uploading || !csvContent.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Validating & Ingesting...' : 'Validate & Ingest Batch'}</span>
              </button>
            </div>
          </form>

          {/* Validation Result */}
          {uploadResult && (
            <div className={`p-4 rounded-lg border text-xs font-mono space-y-2 ${
              uploadResult.rejectedCount && uploadResult.rejectedCount > 0 ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            }`}>
              <div className="font-bold">{uploadResult.message || 'Validation Outcome:'}</div>
              {uploadResult.validationErrors && uploadResult.validationErrors.length > 0 && (
                <div className="space-y-1 text-rose-300">
                  {uploadResult.validationErrors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: API cURL */}
      {activeSubTab === 'api' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
              Live Ingestion API Specification & Code Snippet
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(curlSnippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 font-mono transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
            <pre>{curlSnippet}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
