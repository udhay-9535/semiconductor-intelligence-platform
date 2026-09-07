/**
 * OpenAPI REST Endpoints & Developer Integration Guide
 */

import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, Key, Code2, Server } from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/devices',
      desc: 'List all registered semiconductor devices in tenant with current health metrics',
      sample: 'curl -X GET "https://semi-intel.internal/api/v1/devices" -H "Authorization: Bearer <TOKEN>"'
    },
    {
      method: 'POST',
      path: '/api/v1/telemetry',
      desc: 'Ingest real-time telemetry sensor payload for a semiconductor package',
      sample: `curl -X POST "https://semi-intel.internal/api/v1/telemetry" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId":"ST-001","temperatureC":68.4,"voltageV":0.845,"currentA":41.2,"powerW":34.8,"frequencyMHz":2400,"utilizationPct":72.0,"fanSpeedRpm":3400,"coolingEfficiencyPct":95.0,"errorCount":0}'`
    },
    {
      method: 'GET',
      path: '/api/v1/digital-twin/:id',
      desc: 'Retrieve estimated physical state, junction thermal gradient & subsystem health matrix',
      sample: 'curl -X GET "https://semi-intel.internal/api/v1/digital-twin/ST-001" -H "Authorization: Bearer <TOKEN>"'
    },
    {
      method: 'POST',
      path: '/api/v1/simulations/what-if',
      desc: 'Execute real-time physics What-If stress simulation with Arrhenius and TDDB solvers',
      sample: `curl -X POST "https://semi-intel.internal/api/v1/simulations/what-if" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId":"ST-001","workloadPct":85,"ambientTempC":32,"voltageBiasPct":5,"frequencyOffsetMHz":200,"coolingEfficiencyPct":80}'`
    },
    {
      method: 'POST',
      path: '/api/v1/ai/diagnostics',
      desc: 'Run Gemini AI-grounded solid state physics diagnostics and FMEA root-cause analysis',
      sample: `curl -X POST "https://semi-intel.internal/api/v1/ai/diagnostics" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId":"ST-001","prompt":"Evaluate electromigration risk under current thermal load"}'`
    },
    {
      method: 'GET',
      path: '/api/v1/analytics',
      desc: 'Fetch statistical aggregations (mean, std dev, min/max, distribution histograms)',
      sample: 'curl -X GET "https://semi-intel.internal/api/v1/analytics?range=24h" -H "Authorization: Bearer <TOKEN>"'
    }
  ];

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono">
            <Code2 className="w-6 h-6 text-emerald-400" />
            <span>Developer REST API & SDK Reference</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standard HTTP REST endpoints for automated cleanroom test fixture integration, ATE machines, and CI pipelines.
          </p>
        </div>
      </div>

      {/* Authentication Info Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 font-mono text-xs">
        <div className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-2">
          <Key className="w-4 h-4" />
          <span>API Key Authentication & Tenant Scoping</span>
        </div>
        <p className="text-slate-300 font-sans">
          All API requests must include a valid bearer token in the <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400">Authorization: Bearer &lt;TOKEN&gt;</code> header. Tenant isolation is automatically enforced based on the token context.
        </p>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {endpoints.map((ep, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  ep.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {ep.method}
                </span>
                <span className="text-sm font-bold text-slate-100">{ep.path}</span>
              </div>

              <button
                onClick={() => handleCopy(`ep-${idx}`, ep.sample)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition self-start sm:self-auto"
              >
                {copiedKey === `ep-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === `ep-${idx}` ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 font-sans">{ep.desc}</p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 overflow-x-auto">
              <pre>{ep.sample}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
