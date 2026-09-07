/**
 * DSP (Digital Signal Processing), Quantum Control & HIL Lab View
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Radio,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api.ts';

export const DspQuantumLabView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DSP' | 'QUANTUM' | 'CALIBRATION' | 'HIL'>('DSP');

  // DSP State
  const [carrierFreq, setCarrierFreq] = useState(50);
  const [noiseLevel, setNoiseLevel] = useState(0.4);
  const [dspData, setDspData] = useState<any>(null);
  const [processingDsp, setProcessingDsp] = useState(false);

  // Quantum State
  const [pulseType, setPulseType] = useState<'DRAG' | 'GAUSSIAN' | 'SQUARE'>('DRAG');
  const [pulseAmp, setPulseAmp] = useState(1.0);
  const [pulseDuration, setPulseDuration] = useState(20);
  const [quantumData, setQuantumData] = useState<any>(null);

  // Quantum Calibration State
  const [calibData, setCalibData] = useState<any>(null);
  const [calibrating, setCalibrating] = useState(false);

  // HIL State
  const [hilFault, setHilFault] = useState<'THERMAL_SPIKE' | 'VOLTAGE_SAG' | 'SENSOR_DRIFT'>('THERMAL_SPIKE');
  const [hilRecovery, setHilRecovery] = useState(true);
  const [hilData, setHilData] = useState<any>(null);
  const [runningHil, setRunningHil] = useState(false);

  const runDsp = async () => {
    setProcessingDsp(true);
    try {
      const data = await api.runDspAnalysis({
        carrierFreqHz: carrierFreq,
        sampleRateHz: 512,
        noiseLevel
      });
      setDspData(data);
    } catch (err) {
      console.error('DSP analysis failed:', err);
    } finally {
      setProcessingDsp(false);
    }
  };

  const runQuantum = async () => {
    try {
      const data = await api.runQuantumPulse(pulseType, pulseAmp, pulseDuration);
      setQuantumData(data);
    } catch (err) {
      console.error('Quantum simulation failed:', err);
    }
  };

  const runCalibration = async () => {
    setCalibrating(true);
    try {
      const data = await api.runQuantumCalibration();
      setCalibData(data);
    } catch (err) {
      console.error('Calibration failed:', err);
    } finally {
      setCalibrating(false);
    }
  };

  const runHil = async () => {
    setRunningHil(true);
    try {
      const data = await api.runHilSimulation(hilFault, hilRecovery);
      setHilData(data);
    } catch (err) {
      console.error('HIL simulation failed:', err);
    } finally {
      setRunningHil(false);
    }
  };

  useEffect(() => {
    runDsp();
    runQuantum();
    runCalibration();
    runHil();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              MODULE 14-17 • ADVANCED PHYSICS &amp; CONTROL
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              QUANTUM &amp; DSP TRACK
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono mt-1">
            <Radio className="w-6 h-6 text-cyan-400" />
            <span>DSP, Quantum Control &amp; HIL Simulation Lab</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real FFT spectrum analysis, FIR filtering, Qubit Bloch Sphere projection, DRAG pulse synthesis, and closed-loop HIL fault injection.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'DSP', label: '1. DSP Signal Filtering & FFT', icon: Activity },
          { id: 'QUANTUM', label: '2. Quantum Control & Bloch Sphere', icon: Sparkles },
          { id: 'CALIBRATION', label: '3. Automated Quantum Calibration', icon: Sliders },
          { id: 'HIL', label: '4. Hardware-In-The-Loop (HIL) Lab', icon: ShieldAlert }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DSP SIGNAL FILTERING & FFT */}
      {activeTab === 'DSP' && dspData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
              <h3 className="text-xs font-bold text-cyan-400 uppercase font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Signal Generator Controls</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Carrier Frequency:</span>
                    <span className="text-cyan-400 font-bold">{carrierFreq} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={carrierFreq}
                    onChange={e => {
                      setCarrierFreq(Number(e.target.value));
                    }}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Gaussian Noise Level (σ):</span>
                    <span className="text-amber-400 font-bold">{noiseLevel}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.2"
                    step="0.1"
                    value={noiseLevel}
                    onChange={e => {
                      setNoiseLevel(Number(e.target.value));
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <button
                  onClick={runDsp}
                  disabled={processingDsp}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Play className={`w-3.5 h-3.5 ${processingDsp ? 'animate-spin' : ''}`} />
                  <span>Compute FFT &amp; Filter</span>
                </button>
              </div>

              {/* SNR Metric Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between text-slate-400">
                  <span>Raw Noisy SNR:</span>
                  <span className="text-rose-400 font-bold">{dspData.snrBeforeDb} dB</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Filtered Clean SNR:</span>
                  <span className="text-emerald-400 font-bold">{dspData.snrAfterDb} dB</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                  <span>FIR Filter Gain:</span>
                  <span className="text-cyan-400 font-bold">+{dspData.snrImprovementDb} dB</span>
                </div>
              </div>
            </div>

            {/* FFT Spectrum Display */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
                <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Cooley-Tukey Radix-2 FFT Frequency Spectrum</span>
                </h3>

                <div className="h-48 bg-slate-950 rounded-xl p-4 border border-slate-800 flex items-end gap-1 overflow-x-auto">
                  {dspData.spectrum?.freqBinsHz?.slice(0, 32).map((freq: number, idx: number) => {
                    const noisyMag = dspData.spectrum.noisyMagnitude[idx] || 0;
                    const filteredMag = dspData.spectrum.filteredMagnitude[idx] || 0;
                    const heightPct = Math.min(100, Math.round(filteredMag * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group min-w-[12px]">
                        <div
                          style={{ height: `${Math.max(4, heightPct)}%` }}
                          className="w-full bg-cyan-500 rounded-t group-hover:bg-cyan-400 transition"
                        />
                        <span className="text-[8px] text-slate-600 truncate">{freq}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>0 Hz (DC)</span>
                  <span>Frequency (Hz)</span>
                  <span>256 Hz (Nyquist)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUANTUM CONTROL & BLOCH SPHERE */}
      {activeTab === 'QUANTUM' && quantumData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
          {/* Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-purple-400 uppercase font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Microwave Pulse Synthesizer</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1">Pulse Envelope Shape:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['DRAG', 'GAUSSIAN', 'SQUARE'].map(pt => (
                    <button
                      key={pt}
                      onClick={() => {
                        setPulseType(pt as any);
                        api.runQuantumPulse(pt as any, pulseAmp, pulseDuration).then(setQuantumData);
                      }}
                      className={`py-1.5 rounded text-[11px] font-bold transition ${
                        pulseType === pt
                          ? 'bg-purple-500 text-slate-950'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Pulse Amplitude:</span>
                  <span className="text-purple-400 font-bold">{pulseAmp} V</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={pulseAmp}
                  onChange={e => {
                    setPulseAmp(Number(e.target.value));
                    api.runQuantumPulse(pulseType, Number(e.target.value), pulseDuration).then(setQuantumData);
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Duration (t_gate):</span>
                  <span className="text-purple-400 font-bold">{pulseDuration} ns</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={pulseDuration}
                  onChange={e => {
                    setPulseDuration(Number(e.target.value));
                    api.runQuantumPulse(pulseType, pulseAmp, Number(e.target.value)).then(setQuantumData);
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Bloch Sphere Coordinates & State Vector */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                <span>Bloch Sphere Vector &amp; State Probabilities</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Bloch X (x̂)</div>
                  <div className="text-base font-bold text-slate-100">{quantumData.blochSphere?.x}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Bloch Y (ŷ)</div>
                  <div className="text-base font-bold text-slate-100">{quantumData.blochSphere?.y}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Bloch Z (ẑ)</div>
                  <div className="text-base font-bold text-purple-400">{quantumData.blochSphere?.z}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Gate Fidelity</div>
                  <div className="text-base font-bold text-emerald-400">
                    {quantumData.decoherence?.estimatedGateFidelityPct}%
                  </div>
                </div>
              </div>

              {/* State Representation */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-around">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase">Ground State P(|0⟩)</div>
                  <div className="text-xl font-bold text-cyan-400">{(quantumData.blochSphere?.p0 * 100).toFixed(1)}%</div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase">Excited State P(|1⟩)</div>
                  <div className="text-xl font-bold text-purple-400">{(quantumData.blochSphere?.p1 * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUANTUM CALIBRATION LOOP */}
      {activeTab === 'CALIBRATION' && calibData && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Automated Closed-Loop Rabi Calibration</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Target: <span className="text-slate-200 font-bold">{calibData.targetGate}</span> | Final Fidelity: <span className="text-emerald-400 font-bold">{calibData.finalFidelityPct}%</span>
              </p>
            </div>

            <button
              onClick={runCalibration}
              disabled={calibrating}
              className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-600 transition flex items-center gap-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${calibrating ? 'animate-spin' : ''}`} />
              <span>Rerun Calibration</span>
            </button>
          </div>

          <div className="space-y-2">
            {calibData.iterations?.map((it: any) => (
              <div key={it.step} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-300">Iteration #{it.step}</span>
                <span className="text-slate-400">Amplitude: <span className="text-purple-400 font-bold">{it.amplitude} V</span></span>
                <span className="text-slate-400">Error: <span className="text-amber-400">{it.error}</span></span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  {it.fidelity}% Fidelity
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HIL FAULT INJECTION */}
      {activeTab === 'HIL' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-rose-400 uppercase font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>HIL Fault Injector</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 block mb-1">Fault Type:</label>
                  <select
                    value={hilFault}
                    onChange={e => setHilFault(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
                  >
                    <option value="THERMAL_SPIKE">Thermal Runaway (+12°C)</option>
                    <option value="VOLTAGE_SAG">Supply Voltage Sag (-150mV)</option>
                    <option value="SENSOR_DRIFT">Sensor Calibration Bias (+14°C)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recovery"
                    checked={hilRecovery}
                    onChange={e => setHilRecovery(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <label htmlFor="recovery" className="text-slate-300 cursor-pointer">
                    Enable Closed-Loop Dynamic Throttle &amp; PID Intervention
                  </label>
                </div>

                <button
                  onClick={runHil}
                  disabled={runningHil}
                  className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Play className={`w-3.5 h-3.5 ${runningHil ? 'animate-spin' : ''}`} />
                  <span>Execute HIL Closed-Loop Run</span>
                </button>
              </div>
            </div>

            {/* HIL Steps Trace */}
            <div className="lg:col-span-2 space-y-6">
              {hilData && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-400" />
                    <span>Real-Time Controller Reaction Timeline</span>
                  </h3>

                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {hilData.steps?.map((st: any) => (
                      <div key={st.timeSec} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 w-12">t={st.timeSec}s</span>
                        <span className="font-bold text-slate-200 w-20">Tj: {st.actualTempC}°C</span>
                        <span className="text-slate-400 flex-1 truncate">{st.controllerAction}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          st.status === 'CRITICAL_TRIP' ? 'bg-rose-500/20 text-rose-400' :
                          st.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {st.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 text-xs">
                    {hilData.mitigationSummary}
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
