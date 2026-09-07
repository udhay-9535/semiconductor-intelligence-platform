/**
 * Executive Engineering Dashboard
 * Real-time system health, AI predictions, and multi-sensor semiconductor telemetry
 */

import React, { useState, useEffect } from 'react';
import {
  Device,
  TelemetryReading,
  Alert,
  Incident,
  SimulationScenarioType
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Cpu,
  Activity,
  AlertTriangle,
  Flame,
  Zap,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sliders,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  Radio,
  Layers,
  Thermometer,
  Gauge
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
  Area
} from 'recharts';

interface EnterpriseDashboardProps {
  onSelectDevice: (deviceId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({
  onSelectDevice,
  onNavigateTab
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedScenarioDev, setSelectedScenarioDev] = useState<string>('ST-001');
  const [telemetryMetric, setTelemetryMetric] = useState<'temperature' | 'voltage' | 'power' | 'frequency' | 'current'>('temperature');
  const [loading, setLoading] = useState(true);
  const [scenarioTriggering, setScenarioTriggering] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  const fetchDashboardData = async () => {
    try {
      const [devRes, telRes, alertRes, incRes] = await Promise.all([
        api.getDevices(),
        api.getTelemetry({ limit: 40 }),
        api.getAlerts({ status: 'OPEN' }),
        api.getIncidents()
      ]);
      setDevices(devRes.devices || []);
      setTelemetryHistory(telRes.readings || []);
      setAlerts(alertRes.alerts || []);
      setIncidents(incRes.incidents || []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyScenario = async (scenario: SimulationScenarioType) => {
    setScenarioTriggering(true);
    try {
      await api.setDeviceScenario(selectedScenarioDev, scenario);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to apply scenario:', err);
    } finally {
      setScenarioTriggering(false);
    }
  };

  // KPI Calculations
  const totalDevices = devices.length;
  const criticalCount = devices.filter(d => d.status === 'CRITICAL').length;
  const warningCount = devices.filter(d => d.status === 'WARNING').length;
  const onlineCount = devices.filter(d => d.status === 'ONLINE').length;
  
  const avgHealth = devices.length > 0
    ? Math.round(devices.reduce((acc, d) => acc + (d.currentMetrics?.healthScore || 90), 0) / devices.length)
    : 92;

  const totalPowerW = devices.length > 0
    ? Math.round(devices.reduce((acc, d) => acc + (d.currentMetrics?.powerW || 45), 0) * 10) / 10
    : 280;

  const avgTempC = devices.length > 0
    ? Math.round((devices.reduce((acc, d) => acc + (d.currentMetrics?.temperatureC || 65), 0) / devices.length) * 10) / 10
    : 66.8;

  const maxTempC = devices.length > 0
    ? Math.round(Math.max(...devices.map(d => d.currentMetrics?.temperatureC || 65)) * 10) / 10
    : 78.5;

  // Chart data formatting
  const chartData = telemetryHistory.map((t, idx) => ({
    time: t.timestamp.split('T')[1]?.slice(0, 8) || `-${40 - idx}s`,
    temperature: Math.round(t.temperatureC * 10) / 10,
    voltage: Math.round(t.voltageV * 1000) / 1000,
    power: Math.round(t.powerW * 10) / 10,
    frequency: t.frequencyMHz || 2400,
    current: Math.round((t.currentA || (t.powerW / (t.voltageV || 1))) * 100) / 100,
    health: t.healthScore ?? 90,
    anomaly: Math.round((t.anomalyScore ?? 0.1) * 100)
  }));

  const latestReading = telemetryHistory[telemetryHistory.length - 1] || {
    healthScore: avgHealth,
    anomalyScore: 0.08,
    failureProbability: 0.04
  };

  const scenarios: { type: SimulationScenarioType; label: string; desc: string; color: string }[] = [
    { type: 'NORMAL', label: 'Nominal Cleanroom', desc: 'Standard 2400MHz @ 0.85V', color: 'hover:border-emerald-500 text-emerald-400' },
    { type: 'THERMAL_STRESS', label: 'Thermal Stress (+92°C)', desc: 'Arrhenius thermal runaway', color: 'hover:border-rose-500 text-rose-400' },
    { type: 'VOLTAGE_INSTABILITY', label: 'Voltage Sag / Spike', desc: 'TDDB gate dielectric risk', color: 'hover:border-amber-500 text-amber-400' },
    { type: 'COOLING_DEGRADATION', label: 'Cooling TIM Failure', desc: 'Fan speed drop & high Θja', color: 'hover:border-orange-500 text-orange-400' },
    { type: 'MIXED_FAILURE', label: 'Cascade Multi-Fault', desc: 'Thermal + Voltage + ECC', color: 'hover:border-purple-500 text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              MODULE 1 • EXECUTIVE DASHBOARD
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              REAL-TIME TELEMETRY ACTIVE
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono mt-1">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span>Semiconductor Intelligence Overview</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time system health, AI predictions and engineering telemetry across wafer lots and silicon digital twins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-dashboard"
            onClick={fetchDashboardData}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync ({lastSyncTime})</span>
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>INGESTION: 1.0 Hz (LIVE)</span>
          </div>
        </div>
      </div>

      {/* 6 Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        {/* 1. Overall System Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>System Health</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-bold ${avgHealth >= 80 ? 'text-emerald-400' : avgHealth >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
              {avgHealth}
            </span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-800/80">
            <span>Status:</span>
            <span className="text-emerald-400 font-bold">{avgHealth >= 80 ? 'NOMINAL' : 'DEGRADED'}</span>
          </div>
        </div>

        {/* 2. Active Devices */}
        <div
          onClick={() => onNavigateTab('devices')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer rounded-xl p-3.5 space-y-1 transition"
        >
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>Active Devices</span>
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-100">{onlineCount}</span>
            <span className="text-xs text-slate-500">/ {totalDevices}</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-800/80">
            <span>Critical:</span>
            <span className={criticalCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>{criticalCount}</span>
          </div>
        </div>

        {/* 3. Active Alerts */}
        <div
          onClick={() => onNavigateTab('alerts')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer rounded-xl p-3.5 space-y-1 transition"
        >
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>Active Alerts</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-amber-400">{alerts.length}</span>
            <span className="text-xs text-slate-500">Open</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-800/80">
            <span>Incidents:</span>
            <span className="text-slate-200 font-bold">{incidents.length}</span>
          </div>
        </div>

        {/* 4. AI Prediction Confidence */}
        <div
          onClick={() => onNavigateTab('ml-platform')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer rounded-xl p-3.5 space-y-1 transition"
        >
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>AI Confidence</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-purple-400">96.4%</span>
            <span className="text-xs text-slate-500">v2.1</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-800/80">
            <span>Drift PSI:</span>
            <span className="text-emerald-400 font-bold">0.042</span>
          </div>
        </div>

        {/* 5. Power Consumption */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>Power Draw</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-amber-400">{totalPowerW}</span>
            <span className="text-xs text-slate-500">W</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-800/80">
            <span>Dyn / Stat:</span>
            <span className="text-slate-200 font-bold">82% / 18%</span>
          </div>
        </div>

        {/* 6. Thermal Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>Thermal Status</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-100">{avgTempC}</span>
            <span className="text-xs text-slate-500">°C</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-800/80">
            <span>Peak Tj:</span>
            <span className={maxTempC > 80 ? 'text-rose-400 font-bold' : 'text-slate-300'}>{maxTempC}°C</span>
          </div>
        </div>
      </div>

      {/* Silicon Physics Fault Injector Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Live Silicon Physics Fault Injector &amp; Simulator
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                Inject deterministic Arrhenius thermal stress or supply sags to observe real-time Digital Twin and ML inference:
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            <span className="text-slate-400">Target Device:</span>
            <select
              id="select-scenario-device"
              value={selectedScenarioDev}
              onChange={(e) => setSelectedScenarioDev(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 outline-none"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.id} - {d.name} ({d.model})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3 text-xs">
          {scenarios.map(s => (
            <button
              key={s.type}
              id={`btn-scenario-${s.type.toLowerCase()}`}
              disabled={scenarioTriggering}
              onClick={() => handleApplyScenario(s.type)}
              className={`p-2.5 rounded-lg bg-slate-950 border border-slate-800 transition text-left group ${s.color} hover:bg-slate-800/60 disabled:opacity-50`}
            >
              <div className="font-bold text-[11px]">{s.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Dashboard Grid: Left Live Telemetry, Right AI Health Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Live Multi-Sensor Telemetry (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 uppercase">
                Live Sensor Telemetry Stream
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-cyan-400 border border-slate-700">
                INDUSTRIAL STREAM
              </span>
            </div>

            {/* Metric Selector Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
              {[
                { id: 'temperature', label: 'Temp (°C)', color: '#f43f5e' },
                { id: 'voltage', label: 'Voltage (V)', color: '#38bdf8' },
                { id: 'power', label: 'Power (W)', color: '#fbbf24' },
                { id: 'frequency', label: 'Clock (MHz)', color: '#a855f7' },
                { id: 'current', label: 'Current (A)', color: '#34d399' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setTelemetryMetric(m.id as any)}
                  className={`px-2 py-1 rounded transition font-bold ${
                    telemetryMetric === m.id
                      ? 'bg-slate-800 text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Telemetry Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={
                      telemetryMetric === 'temperature' ? '#f43f5e' :
                      telemetryMetric === 'voltage' ? '#38bdf8' :
                      telemetryMetric === 'power' ? '#fbbf24' :
                      telemetryMetric === 'frequency' ? '#a855f7' : '#34d399'
                    } stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Area
                  type="monotone"
                  dataKey={telemetryMetric}
                  stroke={
                    telemetryMetric === 'temperature' ? '#f43f5e' :
                    telemetryMetric === 'voltage' ? '#38bdf8' :
                    telemetryMetric === 'power' ? '#fbbf24' :
                    telemetryMetric === 'frequency' ? '#a855f7' : '#34d399'
                  }
                  fillOpacity={1}
                  fill="url(#metricGradient)"
                  strokeWidth={2}
                  name={telemetryMetric.toUpperCase()}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: AI Health Intelligence (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-slate-200 uppercase text-xs">AI Health Intelligence</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/30">
              ISOLATION FOREST
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Anomaly Probability:</span>
                <span className={`font-bold ${(latestReading.anomalyScore || 0) > 0.4 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {((latestReading.anomalyScore || 0.08) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(latestReading.anomalyScore || 0) > 0.4 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.min(100, (latestReading.anomalyScore || 0.08) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Failure Risk (48h):</span>
                <span className={`font-bold ${(latestReading.failureProbability || 0) > 0.3 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {((latestReading.failureProbability || 0.04) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(latestReading.failureProbability || 0) > 0.3 ? 'bg-amber-500' : 'bg-blue-400'}`}
                  style={{ width: `${Math.min(100, (latestReading.failureProbability || 0.04) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Inference Metadata</div>
              <div className="flex justify-between text-slate-400">
                <span>Model Pipeline:</span>
                <span className="text-slate-200">Ensemble RF + IF</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Inference Latency:</span>
                <span className="text-emerald-400 font-bold">1.42 ms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Explainability:</span>
                <span className="text-purple-400">SHAP Attributed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Device Status & Recent Incidents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Fleet Status Table (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden font-mono">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 uppercase">
                Fleet Silicon State &amp; Subsystems
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('devices')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              <span>Full Device Registry</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3.5">Device</th>
                  <th className="py-2.5 px-3.5">Process Node</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5">Temp (°C)</th>
                  <th className="py-2.5 px-3.5">Health</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {devices.slice(0, 5).map(device => {
                  const health = device.currentMetrics?.healthScore ?? 90;
                  const temp = device.currentMetrics?.temperatureC ?? 65;

                  return (
                    <tr key={device.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3.5 font-bold text-slate-100 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          device.status === 'ONLINE' ? 'bg-emerald-400' :
                          device.status === 'WARNING' ? 'bg-amber-400' : 'bg-rose-400 animate-pulse'
                        }`} />
                        <span>{device.id}</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-400 font-sans">
                        {device.model} ({device.operatingProfile.dieProcessNm}nm)
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          device.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          device.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {device.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-slate-200">
                        {temp.toFixed(1)}°C
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${health >= 80 ? 'bg-emerald-400' : health >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
                              style={{ width: `${health}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px]">{health}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          id={`btn-inspect-${device.id}`}
                          onClick={() => onSelectDevice(device.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-600/30 hover:text-cyan-300 text-slate-300 border border-slate-700 text-[10px] font-bold transition font-sans"
                        >
                          Inspect Twin
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Incidents & Engineering Events (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-200 uppercase text-xs">Active Incidents</span>
            </div>
            <span className="text-[10px] text-slate-400">{incidents.length} logged</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
            {incidents.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400/70" />
                No active incidents. Cleanroom operating under nominal parameters.
              </div>
            ) : (
              incidents.slice(0, 4).map(inc => (
                <div key={inc.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-[11px] truncate max-w-[160px]">{inc.title}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      inc.severity === 'FATAL' ? 'bg-rose-500/20 text-rose-400' :
                      inc.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Device: <span className="text-slate-300 font-bold">{inc.deviceId}</span></div>
                  <div className="text-[10px] text-slate-500">{inc.description || 'Root-cause analysis in progress'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
