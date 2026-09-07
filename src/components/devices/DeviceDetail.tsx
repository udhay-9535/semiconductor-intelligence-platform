/**
 * Comprehensive Semiconductor Device Inspection & Digital Twin View
 */

import React, { useState, useEffect } from 'react';
import {
  Device,
  TelemetryReading,
  DigitalTwinState,
  PredictionExplanation,
  SimulationScenarioType
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { AIRootCauseModal } from '../ai/AIRootCauseModal.tsx';
import { WhatIfSimulator } from '../whatIf/WhatIfSimulator.tsx';
import {
  ArrowLeft,
  Cpu,
  Activity,
  Flame,
  Zap,
  Layers,
  BrainCircuit,
  Sliders,
  Sparkles,
  AlertTriangle,
  Clock,
  Gauge,
  HelpCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface DeviceDetailProps {
  deviceId: string;
  onBack: () => void;
}

export const DeviceDetail: React.FC<DeviceDetailProps> = ({ deviceId, onBack }) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryReading[]>([]);
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinState | null>(null);
  const [explanation, setExplanation] = useState<PredictionExplanation | null>(null);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'digitalTwin' | 'mlExplain' | 'whatIf' | 'rootCause'>('telemetry');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDeviceData = async () => {
    try {
      const [devRes, telRes, dtRes, expRes] = await Promise.all([
        api.getDevice(deviceId),
        api.getTelemetry({ deviceId, limit: 30 }),
        api.getDigitalTwin(deviceId),
        api.getPredictionExplanation(deviceId)
      ]);
      setDevice(devRes?.device || null);
      setTelemetry(telRes?.readings || []);
      setDigitalTwin(dtRes?.digitalTwin || null);
      setExplanation(expRes?.explanation || null);
    } catch (err) {
      console.error('Failed to load device details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceData();
    const interval = setInterval(fetchDeviceData, 2000);
    return () => clearInterval(interval);
  }, [deviceId]);

  if (!device) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
        <span>Loading Semiconductor Digital Twin for {deviceId}...</span>
      </div>
    );
  }

  const latest = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const p = device.operatingProfile;

  // Formatted chart data
  const chartData = telemetry.map((t, i) => ({
    time: t.timestamp.split('T')[1]?.slice(0, 8) || `-${30 - i}s`,
    temperature: Math.round(t.temperatureC * 10) / 10,
    voltage: Math.round(t.voltageV * 1000) / 1000,
    power: Math.round(t.powerW * 10) / 10,
    frequency: t.frequencyMHz,
    fanSpeed: t.fanSpeedRpm,
    health: t.healthScore ?? 90
  }));

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Back to Fleet"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-100 font-mono">{device.id}</span>
              <span className="text-sm font-semibold text-slate-300">({device.name})</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                device.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                device.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
              }`}>
                {device.status}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
              <span>{device.model}</span>
              <span>•</span>
              <span>{device.siteName}</span>
              <span>•</span>
              <span>Process: {p.dieProcessNm}nm FinFET/GAA</span>
              <span>•</span>
              <span>Mode: {device.mode}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            id="btn-ai-diagnostics"
            onClick={() => setAiModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Physics Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${
            activeTab === 'telemetry' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Telemetry & Sensors</span>
        </button>

        <button
          onClick={() => setActiveTab('digitalTwin')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${
            activeTab === 'digitalTwin' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Silicon Digital Twin (Subsystems)</span>
        </button>

        <button
          onClick={() => setActiveTab('mlExplain')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${
            activeTab === 'mlExplain' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Reliability & Explainability (SHAP)</span>
        </button>

        <button
          onClick={() => setActiveTab('whatIf')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${
            activeTab === 'whatIf' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>What-If Stress Lab</span>
        </button>
      </div>

      {/* Tab 1: Live Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Key Gauges Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-center">
            {/* Temperature */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] text-slate-400 uppercase">Junction Temp</div>
              <div className={`text-xl font-bold mt-1 ${(latest?.temperatureC || 0) > 85 ? 'text-rose-400' : 'text-slate-100'}`}>
                {latest?.temperatureC.toFixed(1) || '--'}°C
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Max: {p.maxJunctionTempC}°C</div>
            </div>

            {/* Voltage */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] text-slate-400 uppercase">Core Voltage (Vdd)</div>
              <div className="text-xl font-bold mt-1 text-slate-100">
                {latest?.voltageV.toFixed(3) || '--'}V
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Nominal: {p.nominalVoltageV}V</div>
            </div>

            {/* Power */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] text-slate-400 uppercase">Power Dissipation</div>
              <div className="text-xl font-bold mt-1 text-amber-400">
                {latest?.powerW.toFixed(1) || '--'}W
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Nominal: {p.nominalPowerW}W</div>
            </div>

            {/* Frequency */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] text-slate-400 uppercase">Clock Frequency</div>
              <div className="text-xl font-bold mt-1 text-slate-100">
                {latest?.frequencyMHz || '--'} MHz
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Nominal: {p.nominalFrequencyMHz} MHz</div>
            </div>

            {/* Fan Speed */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] text-slate-400 uppercase">Cooling Tachometer</div>
              <div className="text-xl font-bold mt-1 text-slate-100">
                {latest?.fanSpeedRpm || '--'} RPM
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Eff: {latest?.coolingEfficiencyPct}%</div>
            </div>

            {/* Health Score */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] text-slate-400 uppercase">Health Index</div>
              <div className={`text-xl font-bold mt-1 ${(latest?.healthScore || 90) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {latest?.healthScore ?? 90} <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Status: {latest?.sensorStatus || 'OK'}</div>
            </div>
          </div>

          {/* Time-Series Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs font-bold text-slate-200 uppercase font-mono mb-3">
                Thermal & Power Stream
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="t" stroke="#f43f5e" domain={[40, 110]} tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="p" orientation="right" stroke="#fbbf24" domain={[10, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Line yAxisId="t" type="monotone" dataKey="temperature" stroke="#f43f5e" strokeWidth={2} dot={false} name="Temp (°C)" />
                    <Line yAxisId="p" type="monotone" dataKey="power" stroke="#fbbf24" strokeWidth={1.5} dot={false} name="Power (W)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs font-bold text-slate-200 uppercase font-mono mb-3">
                Voltage & Clock Frequency Stability
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="v" stroke="#38bdf8" domain={[0.6, 1.2]} tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="f" orientation="right" stroke="#a855f7" domain={[1500, 3600]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Line yAxisId="v" type="monotone" dataKey="voltage" stroke="#38bdf8" strokeWidth={2} dot={false} name="Voltage (V)" />
                    <Line yAxisId="f" type="monotone" dataKey="frequency" stroke="#a855f7" strokeWidth={1.5} dot={false} name="Freq (MHz)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Silicon Digital Twin */}
      {activeTab === 'digitalTwin' && digitalTwin && (
        <div className="space-y-6">
          {/* Subsystems Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(digitalTwin.subsystems).map(([key, rawSub]) => {
              const sub = rawSub as any;
              return (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono">{key} Subsystem</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    sub.status === 'OPTIMAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    sub.status === 'DEGRADED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {sub.status || 'OPTIMAL'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">{sub.summary || `Subsystem operating at health score ${sub.healthScore || 100}`}</div>

                <div className="space-y-1 pt-2 border-t border-slate-800 text-[11px] font-mono">
                  {Object.entries(sub).filter(([k]) => k !== 'status' && k !== 'summary').map(([mKey, mVal]) => (
                    <div key={mKey} className="flex justify-between text-slate-300">
                      <span className="text-slate-400">{mKey}:</span>
                      <span className="font-semibold">{String(mVal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
            })}
          </div>

          {/* Silicon Physics State Derivations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono">
              On-Die Physics Derivations & Reliability Models
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Calculated Tj</div>
                <div className="text-lg font-bold text-slate-100 mt-1">{digitalTwin.physics.calculatedTjC.toFixed(1)}°C</div>
                <div className="text-[10px] text-slate-400 mt-1">Model: Tj = Ta + P*Theta</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Dynamic Power</div>
                <div className="text-lg font-bold text-amber-400 mt-1">{digitalTwin.physics.expectedDynamicPowerW.toFixed(1)} W</div>
                <div className="text-[10px] text-slate-400 mt-1">P_dyn = alpha * C * V^2 * f</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Static Leakage</div>
                <div className="text-lg font-bold text-slate-100 mt-1">{digitalTwin.physics.expectedStaticLeakagePowerW.toFixed(1)} W</div>
                <div className="text-[10px] text-slate-400 mt-1">Exponential with Tj</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Estimated MTBF</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">{Math.round(digitalTwin.physics.mtbfHoursEstimated).toLocaleString()} hrs</div>
                <div className="text-[10px] text-slate-400 mt-1">Continuous operation</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Reliability & SHAP Explainability */}
      {activeTab === 'mlExplain' && explanation && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">
                  Machine Learning Anomaly Attribution & Feature Importance
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Method: SHAP Perturbation</span>
            </div>

            <p className="text-xs text-slate-300">
              {explanation.rootCauseHypothesis}
            </p>

            {/* Feature impact bars */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase font-mono">
                Top Contributing Feature Influences:
              </div>

              {explanation.topContributingFactors.map((factor, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">{factor.feature}</span>
                    <span className={factor.direction === 'INCREASES_RISK' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {factor.impactPct}% influence ({factor.direction.replace('_', ' ')})
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${factor.direction === 'INCREASES_RISK' ? 'bg-rose-500' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(100, factor.impactPct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Recommended cleanroom actions */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono mb-2">
                Prescriptive Engineering Actions:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                {explanation.recommendedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">{i + 1}.</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: What-If Stress Simulator */}
      {activeTab === 'whatIf' && (
        <WhatIfSimulator initialDeviceId={device.id} />
      )}

      {/* AI Root Cause Diagnostics Modal */}
      {aiModalOpen && (
        <AIRootCauseModal
          deviceId={device.id}
          onClose={() => setAiModalOpen(false)}
        />
      )}
    </div>
  );
};
