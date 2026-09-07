/**
 * Hardware/Software Co-Design, Edge AI & FPGA Simulation Lab View
 */

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Cpu,
  Zap,
  Activity,
  Radio,
  RotateCcw,
  ShieldAlert,
  Layers,
  Terminal,
  Play,
  Gauge
} from 'lucide-react';
import { api } from '../../services/api.ts';

export const CodesignLabView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REGISTERS' | 'EDGE_AI' | 'VERILOG_FPGA'>('REGISTERS');
  
  // Registers State
  const [deviceId, setDeviceId] = useState('DEV-001');
  const [regData, setRegData] = useState<any>(null);
  const [writing, setWriting] = useState(false);
  
  // Edge AI comparison
  const [edgeAiData, setEdgeAiData] = useState<any>(null);

  // FPGA Verilog simulation
  const [verilogModule, setVerilogModule] = useState<'THERMAL_FSM' | 'TELEMETRY_FIFO'>('THERMAL_FSM');
  const [verilogCycles, setVerilogCycles] = useState(16);
  const [verilogResult, setVerilogResult] = useState<any>(null);
  const [simulatingFpga, setSimulatingFpga] = useState(false);

  const loadRegisters = async () => {
    try {
      const data = await api.getDeviceRegisters(deviceId);
      setRegData(data);
    } catch (err) {
      console.error('Failed to load registers:', err);
    }
  };

  const handleRegisterWrite = async (command: string, value: any) => {
    setWriting(true);
    try {
      await api.writeDeviceRegister(deviceId, command, value);
      await loadRegisters();
    } catch (err) {
      console.error('Register write failed:', err);
    } finally {
      setWriting(false);
    }
  };

  const loadEdgeAi = async () => {
    try {
      const data = await api.getEdgeAiComparison();
      setEdgeAiData(data);
    } catch (err) {
      console.error('Failed to load Edge AI comparison:', err);
    }
  };

  const runVerilog = async () => {
    setSimulatingFpga(true);
    try {
      const res = await api.runVerilogSimulation(verilogModule, verilogCycles);
      setVerilogResult(res);
    } catch (err) {
      console.error('Failed to run Verilog simulation:', err);
    } finally {
      setSimulatingFpga(false);
    }
  };

  useEffect(() => {
    loadRegisters();
    loadEdgeAi();
    runVerilog();
  }, [deviceId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              MODULE 10-13 • HARDWARE/SOFTWARE CO-DESIGN
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              FPGA &amp; REGISTERS
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono mt-1">
            <Sliders className="w-6 h-6 text-purple-400" />
            <span>Hardware/Software Co-Design &amp; FPGA Lab</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct register memory control, closed-loop physical plant feedback, Edge AI partitioning, and cycle-accurate Verilog HDL testbenches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Target Device:</span>
          <select
            value={deviceId}
            onChange={e => setDeviceId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
          >
            <option value="DEV-001">DEV-001 (3nm Ultra-AI)</option>
            <option value="DEV-002">DEV-002 (5nm Edge Gateway)</option>
            <option value="DEV-003">DEV-003 (7nm High-Density)</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'REGISTERS', label: '1. Hardware Control Registers', icon: Sliders },
          { id: 'EDGE_AI', label: '2. Edge AI vs Cloud Workload Placement', icon: Radio },
          { id: 'VERILOG_FPGA', label: '3. FPGA / Verilog HDL Simulator', icon: Layers }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition ${
                isActive
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HARDWARE REGISTERS */}
      {activeTab === 'REGISTERS' && regData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-purple-400 uppercase font-mono flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>Interactive Memory-Mapped Hardware Registers</span>
                </h3>
                <button
                  onClick={() => handleRegisterWrite('RESET_DEVICE', null)}
                  disabled={writing}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default Registers</span>
                </button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                {/* Clock Frequency */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-200">
                    <span className="text-slate-400">REG_CLOCK_FREQ_MHZ (0x04):</span>
                    <span className="text-purple-400 font-bold">{regData.registers?.REG_CLOCK_FREQ_MHZ} MHz</span>
                  </div>
                  <input
                    type="range"
                    min="800"
                    max="4200"
                    step="50"
                    value={regData.registers?.REG_CLOCK_FREQ_MHZ}
                    onChange={e => handleRegisterWrite('SET_FREQUENCY', Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>800 MHz (Low-Power)</span>
                    <span>2800 MHz (Nominal)</span>
                    <span>4200 MHz (Turbo Boost)</span>
                  </div>
                </div>

                {/* Core Voltage */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-200">
                    <span className="text-slate-400">REG_CORE_VOLTAGE_MV (0x08):</span>
                    <span className="text-amber-400 font-bold">{regData.registers?.REG_CORE_VOLTAGE_MV} mV ({(regData.registers?.REG_CORE_VOLTAGE_MV / 1000).toFixed(3)} V)</span>
                  </div>
                  <input
                    type="range"
                    min="700"
                    max="1250"
                    step="10"
                    value={regData.registers?.REG_CORE_VOLTAGE_MV}
                    onChange={e => handleRegisterWrite('SET_VOLTAGE', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>700 mV (Undervolt)</span>
                    <span>950 mV (Nominal VDD)</span>
                    <span>1250 mV (Overclock VDD)</span>
                  </div>
                </div>

                {/* Cooling PWM Fan */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-200">
                    <span className="text-slate-400">REG_COOLING_PWM (0x10):</span>
                    <span className="text-blue-400 font-bold">{regData.registers?.REG_COOLING_PWM} / 255 ({Math.round((regData.registers?.REG_COOLING_PWM / 255) * 100)}%)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={regData.registers?.REG_COOLING_PWM}
                    onChange={e => handleRegisterWrite('SET_COOLING', Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0 (Passive Fanless)</span>
                    <span>180 (Dynamic Active)</span>
                    <span>255 (Max 4800 RPM Flow)</span>
                  </div>
                </div>

                {/* Workload Profile Selector */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-slate-400 mb-2">REG_WORKLOAD_STATE (0x14):</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['IDLE', 'COMPUTE_INTENSIVE', 'ML_INFERENCE', 'STRESS_TEST'].map(st => (
                      <button
                        key={st}
                        onClick={() => handleRegisterWrite('SET_WORKLOAD', st)}
                        className={`p-2 rounded-lg text-xs font-mono font-bold transition border ${
                          regData.registers?.REG_WORKLOAD_STATE === st
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Derived Physical Plant Feedback */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Closed-Loop Physical Plant Feedback</span>
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">Calculated Dynamic Power</div>
                  <div className="text-base font-bold text-amber-400">
                    {regData.derivedPhysics?.calculatedDynamicPowerW} W
                  </div>
                  <div className="text-[10px] text-slate-500">P = C · V² · f</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">Cooling Fan Tachometer</div>
                  <div className="text-base font-bold text-blue-400">
                    {regData.derivedPhysics?.fanRpm} RPM
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">System Status Bitmask</div>
                  <div className="text-base font-bold text-emerald-400">
                    0x{regData.registers?.REG_SYS_STATUS.toString(16).toUpperCase()} (PLL LOCKED)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EDGE AI VS CLOUD PLACEMENT */}
      {activeTab === 'EDGE_AI' && edgeAiData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {edgeAiData.modes?.map((m: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-purple-400">{m.mode.replace('_', ' ')}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {m.offlineReliability}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs">{m.description}</p>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-400">Total Latency:</span>
                      <span className="font-bold text-emerald-400">{m.totalRoundtripMs} ms</span>
                    </div>
                    <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-400">Power Consumption:</span>
                      <span className="font-bold text-amber-400">{m.powerDrawWatts} W</span>
                    </div>
                    <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-400">Uplink Bandwidth:</span>
                      <span className="font-bold text-blue-400">{m.bandwidthUsedKBps} KB/s</span>
                    </div>
                    <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-400">Model Accuracy:</span>
                      <span className="font-bold text-slate-200">{m.modelAccuracyPct}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded text-[10px] text-slate-400">
                  Privacy: {m.privacyScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VERILOG FPGA SIMULATOR */}
      {activeTab === 'VERILOG_FPGA' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
              <h3 className="text-xs font-bold text-purple-400 uppercase font-mono flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>FPGA HDL Module Selector</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 block mb-1">Target Verilog Module:</label>
                  <select
                    value={verilogModule}
                    onChange={e => {
                      setVerilogModule(e.target.value as any);
                      api.runVerilogSimulation(e.target.value as any, verilogCycles).then(setVerilogResult);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
                  >
                    <option value="THERMAL_FSM">semiconductor_thermal_safety_fsm.v</option>
                    <option value="TELEMETRY_FIFO">telemetry_fifo_sync.v</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Simulation Clock Cycles:</span>
                    <span className="text-purple-400 font-bold">{verilogCycles} cycles</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={verilogCycles}
                    onChange={e => {
                      setVerilogCycles(Number(e.target.value));
                      api.runVerilogSimulation(verilogModule, Number(e.target.value)).then(setVerilogResult);
                    }}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <button
                  onClick={runVerilog}
                  disabled={simulatingFpga}
                  className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Play className={`w-3.5 h-3.5 ${simulatingFpga ? 'animate-spin' : ''}`} />
                  <span>Execute Cycle-Accurate Testbench</span>
                </button>
              </div>
            </div>

            {/* Waveform & Console Output */}
            <div className="lg:col-span-2 space-y-6">
              {verilogResult && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
                  <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span>Digital Logic Waveform (VCD Trace)</span>
                  </h3>

                  <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                    {verilogResult.simulation?.signals?.map((sig: any) => (
                      <div key={sig.name} className="flex items-center gap-3">
                        <span className="w-40 text-slate-400 truncate text-[11px] font-bold">{sig.name}:</span>
                        <div className="flex gap-1">
                          {sig.wave?.map((w: any, idx: number) => (
                            <span
                              key={idx}
                              className={`w-4 h-6 rounded flex items-center justify-center text-[9px] font-bold ${
                                w === 1 || (typeof w === 'string' && w.includes('CRITICAL'))
                                  ? 'bg-purple-500 text-slate-950'
                                  : w === 0 || (typeof w === 'string' && w.includes('IDLE'))
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-amber-500/30 text-amber-300'
                              }`}
                            >
                              {typeof w === 'number' ? w : String(w)[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-40 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] text-slate-500 uppercase mb-1">Testbench Console Transcript:</div>
                    {verilogResult.simulation?.consoleOutput?.map((line: string, i: number) => (
                      <div key={i} className="text-slate-400 text-[11px]">{line}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
