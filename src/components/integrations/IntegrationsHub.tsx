/**
 * Hardware, IoT & Industrial SCADA Integrations Hub
 */

import React, { useState, useEffect } from 'react';
import { IntegrationConfig } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Cable,
  Server,
  Radio,
  Share2,
  CheckCircle2,
  AlertCircle,
  Play,
  Save,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const IntegrationsHub: React.FC = () => {
  const { isAdmin } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string; latencyMs: number } | null>(null);

  const fetchIntegrations = async () => {
    try {
      const res = await api.getIntegrations();
      setIntegrations(res?.integrations || []);
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await api.testIntegration(id);
      setTestResult({ id, ...res });
      fetchIntegrations();
    } catch (err: any) {
      setTestResult({ id, success: false, message: err.message, latencyMs: 0 });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggle = async (integration: IntegrationConfig) => {
    try {
      await api.updateIntegration(integration.id, {
        enabled: !integration.enabled
      });
      fetchIntegrations();
    } catch (err) {
      console.error('Failed to update integration:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono">
            <Cable className="w-6 h-6 text-emerald-400" />
            <span>Industrial Fab & SCADA Ingestion Connectors</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise connectivity adapters for MQTT Broker, Apache Kafka Cluster, OPC-UA SECS/GEM, and Webhook dispatchers.
          </p>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map(item => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm"
          >
            {/* Top Row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  {item.type === 'MQTT' ? <Radio className="w-5 h-5" /> :
                   item.type === 'KAFKA' ? <Server className="w-5 h-5" /> :
                   item.type === 'OPC_UA' ? <Share2 className="w-5 h-5" /> :
                   <Cable className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">{item.name}</h3>
                  <div className="text-[11px] text-slate-400 font-mono">{item.type} Protocol</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  item.status === 'CONNECTED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                  item.status === 'DISCONNECTED' ? 'bg-slate-800 text-slate-400' :
                  'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  {item.status}
                </span>

                {isAdmin && (
                  <button
                    onClick={() => handleToggle(item)}
                    className={`w-10 h-5 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                      item.enabled !== false ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition duration-300 ${
                        item.enabled !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Config details */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300">
              {Object.entries(item.config || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">{key}:</span>
                  <span className="text-slate-200 font-semibold truncate max-w-[240px]">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>

            {/* Test result box */}
            {testResult && testResult.id === item.id && (
              <div className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                testResult.success ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <div className="flex-1">
                  <div>{testResult.message}</div>
                  <div className="text-[10px] opacity-75">Roundtrip Latency: {testResult.latencyMs}ms</div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                Last Handshake: {item.lastPing ? new Date(item.lastPing).toLocaleTimeString() : 'Active'}
              </span>

              <button
                disabled={testingId === item.id || item.enabled === false}
                onClick={() => handleTest(item.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {testingId === item.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{testingId === item.id ? 'Probing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
