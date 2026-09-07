/**
 * What-If Multi-Variable Semiconductor Stress Simulation Lab
 */

import React, { useState, useEffect } from 'react';
import { Device, WhatIfScenarioResult } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Sliders,
  Play,
  Save,
  Trash2,
  Cpu,
  Flame,
  Zap,
  Activity,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Download,
  CheckCircle2,
  Layers
} from 'lucide-react';

interface WhatIfSimulatorProps {
  initialDeviceId?: string;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ initialDeviceId }) => {
  const { isEngineer } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>(initialDeviceId || 'ST-001');
  const [scenarioName, setScenarioName] = useState('Stress Test Scenario');

  // Sliders
  const [workloadPct, setWorkloadPct] = useState(75);
  const [ambientTempC, setAmbientTempC] = useState(25);
  const [voltageBiasPct, setVoltageBiasPct] = useState(0);
  const [frequencyOffsetMHz, setFrequencyOffsetMHz] = useState(0);
  const [coolingEfficiencyPct, setCoolingEfficiencyPct] = useState(95);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<WhatIfScenarioResult | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<WhatIfScenarioResult[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    api.getDevices().then(res => {
      const devList = res?.devices || [];
      setDevices(devList);
      if (!initialDeviceId && devList.length > 0) {
        setSelectedDevice(devList[0].id);
      }
    }).catch(console.error);
    api.getSavedScenarios().then(res => setSavedScenarios(res?.scenarios || [])).catch(console.error);
  }, [initialDeviceId]);

  const handleRunSimulation = async () => {
    setRunning(true);
    setSaveSuccess(false);
    try {
      const res = await api.runWhatIf({
        deviceId: selectedDevice,
        workloadPct,
        ambientTempC,
        voltageBiasPct,
        frequencyOffsetMHz,
        coolingEfficiencyPct,
        name: scenarioName
      });
      setResult(res.result);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setRunning(false);
    }
  };

  // Run on first load
  useEffect(() => {
    if (selectedDevice) {
      handleRunSimulation();
    }
  }, [selectedDevice]);

  const handleSaveScenario = async () => {
    if (!result) return;
    try {
      await api.saveScenario(result);
      const res = await api.getSavedScenarios();
      setSavedScenarios(res.scenarios);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save scenario:', err);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    try {
      await api.deleteScenario(id);
      setSavedScenarios(savedScenarios.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete scenario:', err);
    }
  };

  const handleLoadScenario = (sc: WhatIfScenarioResult) => {
    setSelectedDevice(sc.deviceId);
    setScenarioName(sc.name);
    setWorkloadPct(sc.input.workloadPct);
    setAmbientTempC(sc.input.ambientTempC);
    setVoltageBiasPct(sc.input.voltageBiasPct);
    setFrequencyOffsetMHz(sc.input.frequencyOffsetMHz);
    setCoolingEfficiencyPct(sc.input.coolingEfficiencyPct);
    setResult(sc);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono">
            <Sliders className="w-6 h-6 text-emerald-400" />
            <span>What-If Silicon Physics & Stress Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate operational variables (ambient thermal, voltage bias, overclocking) to evaluate impact on MTTF and dielectric stress.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Parameters Slider Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-200 uppercase font-mono">
              Simulation Parameters
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">REAL-TIME SOLVER</span>
          </div>

          {/* Device & Name */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase font-mono mb-1">
                Target Silicon Device
              </label>
              <select
                value={selectedDevice}
                onChange={e => setSelectedDevice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:border-emerald-500 outline-none"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.id} - {d.name} ({d.model})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase font-mono mb-1">
                Scenario Tag / Name
              </label>
              <input
                type="text"
                value={scenarioName}
                onChange={e => setScenarioName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Slider 1: Workload */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Compute Workload:</span>
              <span className="text-emerald-400 font-bold">{workloadPct}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={workloadPct}
              onChange={e => setWorkloadPct(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Slider 2: Ambient Cleanroom Temp */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Ambient Temp (Ta):</span>
              <span className={`font-bold ${ambientTempC > 30 ? 'text-rose-400' : 'text-slate-200'}`}>{ambientTempC}°C</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              step="1"
              value={ambientTempC}
              onChange={e => setAmbientTempC(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Slider 3: Voltage Bias */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Core Voltage Bias (Vdd):</span>
              <span className={`font-bold ${voltageBiasPct > 5 ? 'text-rose-400' : voltageBiasPct < 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                {voltageBiasPct > 0 ? `+${voltageBiasPct}` : voltageBiasPct}%
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="1"
              value={voltageBiasPct}
              onChange={e => setVoltageBiasPct(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Slider 4: Frequency Offset */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Clock Frequency Delta:</span>
              <span className="text-slate-200 font-bold">
                {frequencyOffsetMHz > 0 ? `+${frequencyOffsetMHz}` : frequencyOffsetMHz} MHz
              </span>
            </div>
            <input
              type="range"
              min="-600"
              max="800"
              step="50"
              value={frequencyOffsetMHz}
              onChange={e => setFrequencyOffsetMHz(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Slider 5: Cooling Efficiency */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Cooling Subsystem Efficiency:</span>
              <span className={`font-bold ${coolingEfficiencyPct < 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {coolingEfficiencyPct}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={coolingEfficiencyPct}
              onChange={e => setCoolingEfficiencyPct(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Run Button */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <button
              id="btn-run-simulation"
              disabled={running}
              onClick={handleRunSimulation}
              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-950 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{running ? 'Solving Equations...' : 'Solve Physics Scenario'}</span>
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Baseline vs Scenario Differential Matrix */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
              {/* Header & Risk Level */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">{result.name}</h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Target: {result.deviceId} • Generated: {new Date(result.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                    result.riskLevel === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    result.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
                  }`}>
                    {result.riskLevel} RISK LEVEL
                  </span>

                  {isEngineer && (
                    <button
                      onClick={handleSaveScenario}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saveSuccess ? 'Saved!' : 'Save'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Impact Summary Box */}
              <div className={`p-4 rounded-lg border text-xs font-sans leading-relaxed ${
                result.riskLevel === 'CRITICAL' ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' :
                result.riskLevel === 'HIGH' ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' :
                'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                <div className="font-semibold uppercase tracking-wide font-mono text-[10px] mb-1">
                  Physics Impact Evaluation
                </div>
                {result.impactSummary}
              </div>

              {/* Comparison Differential Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Physical Dimension</th>
                      <th className="py-2.5 px-3 text-right">Nominal Baseline</th>
                      <th className="py-2.5 px-3 text-right">What-If Scenario</th>
                      <th className="py-2.5 px-3 text-right">Delta (Shift)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    <tr>
                      <td className="py-2.5 px-3 text-slate-300 font-sans font-medium">Junction Temperature (Tj)</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{result.baseline.temperatureC.toFixed(1)}°C</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-200">{result.scenario.temperatureC.toFixed(1)}°C</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${result.difference.temperatureDeltaC > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {result.difference.temperatureDeltaC > 0 ? `+${result.difference.temperatureDeltaC.toFixed(1)}` : result.difference.temperatureDeltaC.toFixed(1)}°C
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-3 text-slate-300 font-sans font-medium">Power Dissipation (P)</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{result.baseline.powerW.toFixed(1)}W</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-400">{result.scenario.powerW.toFixed(1)}W</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${result.difference.powerDeltaW > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {result.difference.powerDeltaW > 0 ? `+${result.difference.powerDeltaW.toFixed(1)}` : result.difference.powerDeltaW.toFixed(1)}W
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-3 text-slate-300 font-sans font-medium">Silicon Health Score</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{result.baseline.healthScore}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-100">{result.scenario.healthScore}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${result.difference.healthDelta < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {result.difference.healthDelta > 0 ? `+${result.difference.healthDelta}` : result.difference.healthDelta} pts
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-3 text-slate-300 font-sans font-medium">30-Day Failure Risk</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{(result.baseline.failureProbability * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-100">{(result.scenario.failureProbability * 100).toFixed(1)}%</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${result.difference.failureProbDeltaPct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {result.difference.failureProbDeltaPct > 0 ? `+${result.difference.failureProbDeltaPct.toFixed(1)}` : result.difference.failureProbDeltaPct.toFixed(1)}%
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-3 text-slate-300 font-sans font-medium">Estimated Remaining Life (RUL)</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{result.baseline.estimatedRulHours.toLocaleString()} hrs</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-200">{result.scenario.estimatedRulHours.toLocaleString()} hrs</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${result.difference.rulDeltaHours < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {result.difference.rulDeltaHours > 0 ? `+${result.difference.rulDeltaHours.toLocaleString()}` : result.difference.rulDeltaHours.toLocaleString()} hrs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Saved Scenarios Library */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">
              Saved Simulation Scenarios Library
            </h4>

            {savedScenarios.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center font-mono">
                No saved scenarios in tenant database. Click "Save" on any simulation to persist.
              </div>
            ) : (
              <div className="space-y-2">
                {savedScenarios.map(sc => (
                  <div
                    key={sc.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200 font-mono">{sc.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {sc.deviceId} • Workload: {sc.input.workloadPct}% • Amb: {sc.input.ambientTempC}°C • V-bias: {sc.input.voltageBiasPct}%
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadScenario(sc)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteScenario(sc.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
