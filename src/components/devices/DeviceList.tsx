/**
 * Semiconductor Device Registry & Fleet Explorer
 */

import React, { useState, useEffect } from 'react';
import { Device, SimulationScenarioType, TelemetryMode } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { DeviceModal } from './DeviceModal.tsx';
import {
  Cpu,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Flame,
  Zap,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink
} from 'lucide-react';

interface DeviceListProps {
  onSelectDevice: (deviceId: string) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({ onSelectDevice }) => {
  const { canManageDevices, isOperator } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const fetchDevices = async () => {
    try {
      const res = await api.getDevices({
        search,
        status: statusFilter,
        mode: modeFilter,
        sortBy,
        sortOrder
      });
      setDevices(res?.devices || []);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 2500);
    return () => clearInterval(interval);
  }, [search, statusFilter, modeFilter, sortBy, sortOrder]);

  const handleScenarioChange = async (deviceId: string, scenario: SimulationScenarioType) => {
    try {
      await api.setDeviceScenario(deviceId, scenario);
      fetchDevices();
    } catch (err) {
      console.error('Failed to update scenario:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono">
            <Cpu className="w-6 h-6 text-emerald-400" />
            <span>Semiconductor Device Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered wafer dies, micro-architectures, and high-reliability silicon packages.
          </p>
        </div>

        {canManageDevices && (
          <button
            id="btn-register-device"
            onClick={() => {
              setEditingDevice(null);
              setModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Register Device</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, Model, or Serial..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 outline-none font-mono"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none font-mono"
          >
            <option value="">All Statuses</option>
            <option value="ONLINE">ONLINE</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>

        {/* Mode filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Mode:</span>
          <select
            value={modeFilter}
            onChange={e => setModeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none font-mono"
          >
            <option value="">All Modes</option>
            <option value="SIMULATION">Simulation</option>
            <option value="LIVE">Live Hardware</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none font-mono"
          >
            <option value="id">Device ID</option>
            <option value="healthScore">Health Score</option>
            <option value="temperatureC">Temperature</option>
            <option value="lastCommunication">Last Communication</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-300"
            title="Toggle Sort Direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map(device => {
          const health = device.currentMetrics?.healthScore ?? 90;
          const temp = device.currentMetrics?.temperatureC ?? 65;
          const volt = device.currentMetrics?.voltageV ?? 0.85;
          const power = device.currentMetrics?.powerW ?? 35;
          const currentScenario = (device as any).activeScenario || 'NORMAL';

          return (
            <div
              key={device.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                      {device.id.slice(-3)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{device.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {device.model} • {device.operatingProfile.dieProcessNm}nm • {device.operatingProfile.coolingType.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    device.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    device.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
                  }`}>
                    {device.status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5 font-mono">
                  <span className="text-slate-400">Site: {device.siteName}</span>
                  <span>•</span>
                  <span className="text-slate-400">{device.serialNumber}</span>
                </div>
              </div>

              {/* Physical Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 font-mono text-center">
                <div>
                  <div className="text-[9px] text-slate-400 uppercase">Junction Temp</div>
                  <div className={`text-xs font-bold mt-0.5 ${temp > 85 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {temp.toFixed(1)}°C
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-slate-400 uppercase">Core Voltage</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">
                    {volt.toFixed(3)}V
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-slate-400 uppercase">Power (P)</div>
                  <div className="text-xs font-bold text-amber-400 mt-0.5">
                    {power.toFixed(1)}W
                  </div>
                </div>
              </div>

              {/* Health Bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-slate-400">Silicon Health Index</span>
                  <span className={`font-bold ${health >= 80 ? 'text-emerald-400' : health >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {health} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full ${health >= 80 ? 'bg-emerald-400' : health >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
                    style={{ width: `${health}%` }}
                  />
                </div>
              </div>

              {/* Active Simulation Scenario Bar */}
              {isOperator && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] font-mono text-slate-400">Stress Injection:</span>
                  <select
                    value={currentScenario}
                    onChange={e => handleScenarioChange(device.id, e.target.value as SimulationScenarioType)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-[10px] font-mono focus:border-emerald-500 outline-none"
                  >
                    <option value="NORMAL">NORMAL (Nominal)</option>
                    <option value="THERMAL_STRESS">THERMAL STRESS (+92°C)</option>
                    <option value="VOLTAGE_INSTABILITY">VOLTAGE SAG/SPIKE</option>
                    <option value="COOLING_DEGRADATION">COOLING TIM FAIL</option>
                    <option value="POWER_ANOMALY">POWER TRANSIENT</option>
                    <option value="MIXED_FAILURE">CASCADE MULTI-FAULT</option>
                  </select>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  id={`btn-inspect-device-${device.id}`}
                  onClick={() => onSelectDevice(device.id)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Inspect Digital Twin</span>
                </button>

                {canManageDevices && (
                  <button
                    onClick={() => {
                      setEditingDevice(device);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                    title="Edit Hardware Specifications"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <DeviceModal
          device={editingDevice}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchDevices();
          }}
        />
      )}
    </div>
  );
};
