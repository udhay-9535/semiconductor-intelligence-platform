/**
 * Register / Edit Semiconductor Device Modal
 */

import React, { useState } from 'react';
import { Device, CoolingType, TelemetryMode } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { X, Cpu, Check, AlertCircle } from 'lucide-react';

interface DeviceModalProps {
  device?: Device | null;
  onClose: () => void;
  onSaved: () => void;
}

export const DeviceModal: React.FC<DeviceModalProps> = ({ device, onClose, onSaved }) => {
  const isEditing = Boolean(device);

  const [id, setId] = useState(device?.id || `ST-00${Math.floor(Math.random() * 90 + 10)}`);
  const [name, setName] = useState(device?.name || '');
  const [type, setType] = useState(device?.type || 'AI_ACCELERATOR');
  const [model, setModel] = useState(device?.model || 'SemiCore Tensor-X900');
  const [serialNumber, setSerialNumber] = useState(device?.serialNumber || `SN-2026-${Math.floor(Math.random() * 90000 + 10000)}`);
  const [siteId, setSiteId] = useState(device?.siteId || 'site-001');
  const [firmwareVersion, setFirmwareVersion] = useState(device?.firmwareVersion || 'v2.4.1');
  const [mode, setMode] = useState<TelemetryMode>(device?.mode || 'SIMULATION');

  // Operating Profile
  const [dieProcessNm, setDieProcessNm] = useState(device?.operatingProfile.dieProcessNm || 3);
  const [nominalVoltageV, setNominalVoltageV] = useState(device?.operatingProfile.nominalVoltageV || 0.85);
  const [nominalFrequencyMHz, setNominalFrequencyMHz] = useState(device?.operatingProfile.nominalFrequencyMHz || 2800);
  const [maxJunctionTempC, setMaxJunctionTempC] = useState(device?.operatingProfile.maxJunctionTempC || 95.0);
  const [thermalResistanceC_W, setThermalResistanceC_W] = useState(device?.operatingProfile.thermalResistanceC_W || 0.40);
  const [nominalPowerW, setNominalPowerW] = useState(device?.operatingProfile.nominalPowerW || 65.0);
  const [coolingType, setCoolingType] = useState<CoolingType>(device?.operatingProfile.coolingType || 'LIQUID_COLD_PLATE');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Device Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      id,
      name,
      type,
      model,
      serialNumber,
      siteId,
      firmwareVersion,
      mode,
      operatingProfile: {
        dieProcessNm: Number(dieProcessNm),
        nominalVoltageV: Number(nominalVoltageV),
        nominalFrequencyMHz: Number(nominalFrequencyMHz),
        maxJunctionTempC: Number(maxJunctionTempC),
        thermalResistanceC_W: Number(thermalResistanceC_W),
        nominalPowerW: Number(nominalPowerW),
        coolingType
      }
    };

    try {
      if (isEditing && device) {
        await api.updateDevice(device.id, payload);
      } else {
        await api.createDevice(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save device specifications');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono">
                {isEditing ? `Edit Device: ${device?.id}` : 'Register Semiconductor Device / Package'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Configure physical die attributes, thermal characteristics, and nominal voltage profile.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Identification Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 font-mono uppercase mb-1">
                Device Identifier (ID)
              </label>
              <input
                type="text"
                disabled={isEditing}
                value={id}
                onChange={e => setId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 outline-none disabled:opacity-60"
                placeholder="e.g. ST-006"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 font-mono uppercase mb-1">
                Package Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                placeholder="e.g. Cleanroom Silicon Die 6"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 font-mono uppercase mb-1">
                Device Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none font-mono"
              >
                <option value="AI_ACCELERATOR">AI Accelerator (NPU)</option>
                <option value="SERVER_CPU">Server CPU (Multi-core)</option>
                <option value="GRAPHICS_GPU">Graphics GPU (3D Stack)</option>
                <option value="AUTOMOTIVE_SOC">Automotive SoC (ASIL-D)</option>
                <option value="POWER_MANAGEMENT_IC">Power PMIC / GaN</option>
                <option value="FPGA">FPGA (E-Series)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 font-mono uppercase mb-1">
                Silicon Model
              </label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none font-mono"
                placeholder="e.g. Tensor-X900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 font-mono uppercase mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 font-mono uppercase mb-1">
                Fab Cleanroom Site
              </label>
              <select
                value={siteId}
                onChange={e => setSiteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              >
                <option value="site-001">Fab 1 - Austin Cleanroom Alpha</option>
                <option value="site-002">Fab 2 - Dresden Advanced Test Lab</option>
                <option value="site-003">Fab 3 - Hsinchu High-Rel Center</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 font-mono uppercase mb-1">
                Firmware Version
              </label>
              <input
                type="text"
                value={firmwareVersion}
                onChange={e => setFirmwareVersion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 font-mono uppercase mb-1">
                Operating Mode
              </label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value as TelemetryMode)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 outline-none"
              >
                <option value="SIMULATION">SIMULATION (Synthetic Ticker)</option>
                <option value="LIVE">LIVE (Real Gateway Ingest)</option>
              </select>
            </div>
          </div>

          {/* Physics & Physical Die Specifications */}
          <div className="pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono mb-3">
              Silicon Physics & Operating Profile
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">
                  Die Lithography (nm)
                </label>
                <input
                  type="number"
                  step="1"
                  value={dieProcessNm}
                  onChange={e => setDieProcessNm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">
                  Nominal Vdd (V)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={nominalVoltageV}
                  onChange={e => setNominalVoltageV(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">
                  Nominal Freq (MHz)
                </label>
                <input
                  type="number"
                  step="50"
                  value={nominalFrequencyMHz}
                  onChange={e => setNominalFrequencyMHz(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">
                  Max Tj Limit (°C)
                </label>
                <input
                  type="number"
                  step="1"
                  value={maxJunctionTempC}
                  onChange={e => setMaxJunctionTempC(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">
                  Theta-JA (°C/W)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={thermalResistanceC_W}
                  onChange={e => setThermalResistanceC_W(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">
                  Nominal Power (W)
                </label>
                <input
                  type="number"
                  step="1"
                  value={nominalPowerW}
                  onChange={e => setNominalPowerW(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">
                  Cooling Subsystem
                </label>
                <select
                  value={coolingType}
                  onChange={e => setCoolingType(e.target.value as CoolingType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                >
                  <option value="AIR_FORCED">Forced Air Convection (Fan)</option>
                  <option value="LIQUID_COLD_PLATE">Microchannel Liquid Cold Plate</option>
                  <option value="IMMERSION_TWO_PHASE">Two-Phase Immersion Fluorochemical</option>
                  <option value="PASSIVE_HEATSINK">Passive Heat Pipe & Vapor Chamber</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : isEditing ? 'Update Specifications' : 'Register Device'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
