/**
 * Enterprise Semiconductor Digital Twin Hub
 * Interactive multi-column virtual representation of compute, memory, thermal, clock, and power behavior
 */

import React, { useState, useEffect } from 'react';
import { Device, DigitalTwinState } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Layers,
  Cpu,
  Flame,
  Zap,
  Clock,
  Activity,
  Radio,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Database,
  Gauge
} from 'lucide-react';

type ComponentKey = 'compute' | 'memory' | 'power' | 'thermal' | 'clock' | 'io' | 'sensors';
type InspectorTab = 'overview' | 'telemetry' | 'performance' | 'thermal' | 'power' | 'ai-insights';

export const DigitalTwinHub: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedId, setSelectedId] = useState<string>('ST-001');
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState<ComponentKey>('compute');
  const [activeInspectorTab, setActiveInspectorTab] = useState<InspectorTab>('overview');
  const [isPlaying, setIsPlaying] = useState(true);
  const [simStep, setSimStep] = useState(0);

  const fetchTwin = async (id: string) => {
    try {
      const res = await api.getDigitalTwin(id);
      setDigitalTwin(res.digitalTwin);
    } catch (err) {
      console.error('Failed to load digital twin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getDevices().then(res => {
      const devList = res?.devices || [];
      setDevices(devList);
      if (devList.length > 0) {
        fetchTwin(selectedId || devList[0].id);
      }
    }).catch(console.error);

    const interval = setInterval(() => {
      if (isPlaying && selectedId) {
        fetchTwin(selectedId);
        setSimStep(prev => prev + 1);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedId, isPlaying]);

  const activeDevice = devices.find(d => d.id === selectedId);

  const topologyNodes = [
    { key: 'compute' as ComponentKey, name: 'Compute Cluster (SMs / ALUs)', icon: Cpu, category: 'Logic', status: digitalTwin?.subsystems?.compute?.status || 'HEALTHY', health: 94 },
    { key: 'memory' as ComponentKey, name: 'HBM3e & L2 SRAM Cache', icon: Layers, category: 'Storage', status: digitalTwin?.subsystems?.memory?.status || 'HEALTHY', health: 98 },
    { key: 'power' as ComponentKey, name: 'VRM & Power Distribution (PDN)', icon: Zap, category: 'Electrical', status: digitalTwin?.subsystems?.power?.status || 'HEALTHY', health: 91 },
    { key: 'thermal' as ComponentKey, name: 'TIM & Thermal Package Dissipation', icon: Flame, category: 'Thermal', status: digitalTwin?.subsystems?.thermal?.status || 'HEALTHY', health: 88 },
    { key: 'clock' as ComponentKey, name: 'Clock Tree & Phase-Locked Loops', icon: Clock, category: 'Timing', status: digitalTwin?.subsystems?.clock?.status || 'HEALTHY', health: 99 },
    { key: 'io' as ComponentKey, name: 'PCIe Gen 5 / SerDes PHY Matrix', icon: Radio, category: 'Interconnect', status: digitalTwin?.subsystems?.io?.status || 'HEALTHY', health: 95 },
    { key: 'sensors' as ComponentKey, name: 'On-Die Thermal & Ring Diodes', icon: Activity, category: 'Sensors', status: 'HEALTHY', health: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header with Data Source and Timeline Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              MODULE 2 • SILICON DIGITAL TWIN
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              PHYSICS-COUPLED SIMULATION
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono mt-1">
            <Layers className="w-6 h-6 text-emerald-400" />
            <span>Silicon Digital Twin &amp; Topology Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Virtual representation of compute, memory, thermal and power behavior coupled with live physical telemetry.
          </p>
        </div>

        {/* Timeline & Device Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Play/Pause/Replay toolbar */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded transition ${isPlaying ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
              title={isPlaying ? 'Pause Simulation Stream' : 'Resume Simulation Stream'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => fetchTwin(selectedId)}
              className="p-1.5 rounded text-slate-400 hover:text-white transition"
              title="Step Single Cycle"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[10px] font-mono text-slate-400">Step #{simStep}</span>
          </div>

          {/* Select Die */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Die:</span>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 outline-none"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.id} - {d.name} ({d.model})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {digitalTwin && activeDevice && (
        <div className="space-y-6">
          {/* Top Die Physical Specs Summary Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Process Lithography</div>
                <div className="font-bold text-slate-200 text-sm mt-0.5">{activeDevice.operatingProfile.dieProcessNm}nm FinFET</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Calculated Tj</div>
                <div className="font-bold text-rose-400 text-sm mt-0.5">{digitalTwin.physics.calculatedTjC.toFixed(1)}°C</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Thermal Headroom</div>
                <div className="font-bold text-emerald-400 text-sm mt-0.5">{digitalTwin.physics.thermalHeadroomC.toFixed(1)}°C</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Total Power Draw</div>
                <div className="font-bold text-amber-400 text-sm mt-0.5">
                  {(digitalTwin.physics.expectedDynamicPowerW + digitalTwin.physics.expectedStaticLeakagePowerW).toFixed(1)} W
                </div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Estimated MTBF</div>
                <div className="font-bold text-blue-400 text-sm mt-0.5">{Math.round(digitalTwin.physics.mtbfHoursEstimated).toLocaleString()} hrs</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Twin Coupling</div>
                <div className="font-bold text-purple-400 text-sm mt-0.5">100% Ingestion</div>
              </div>
            </div>
          </div>

          {/* 3-Column Layout: Left Topology Tree, Center Interactive Visualization, Right Component Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: System Topology Tree (3 Cols) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase">Silicon Topology</span>
                </div>
                <span className="text-[10px] text-slate-500">7 Subsystems</span>
              </div>

              <div className="space-y-1.5">
                {topologyNodes.map(node => {
                  const Icon = node.icon;
                  const isSelected = selectedComp === node.key;
                  return (
                    <button
                      key={node.key}
                      onClick={() => setSelectedComp(node.key)}
                      className={`w-full text-left p-3 rounded-lg transition border flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 text-xs">{node.name}</div>
                          <div className="text-[10px] text-slate-500">{node.category} Subsystem</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-emerald-400 border border-slate-800">
                          {node.status}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">{node.health}%</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center: Die Schematic Floorplan Heatmap (4 Cols) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase">Interactive Die Floorplan</span>
                </div>
                <span className="text-[10px] text-emerald-400">Tj: {digitalTwin.physics.calculatedTjC.toFixed(1)}°C</span>
              </div>

              {/* Silicon Die Visual Layout */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 aspect-square flex flex-col justify-between relative overflow-hidden">
                {/* Heatmap overlay tint */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    background: `radial-gradient(circle at center, ${
                      digitalTwin.physics.calculatedTjC > 80 ? '#f43f5e' : '#10b981'
                    } 0%, transparent 70%)`
                  }}
                />

                {/* Top: HBM3e Memory Bar */}
                <div
                  onClick={() => setSelectedComp('memory')}
                  className={`p-2.5 rounded-lg border text-center cursor-pointer transition ${
                    selectedComp === 'memory' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">HBM3e Stack (128 GB)</div>
                  <div className="text-[10px] text-slate-500">BW: {digitalTwin.subsystems.memory.bandwidthUtilizationPct}% • ECC Nominal</div>
                </div>

                {/* Middle: Core Compute Tiles Grid */}
                <div className="grid grid-cols-2 gap-2 my-2">
                  <div
                    onClick={() => setSelectedComp('compute')}
                    className={`p-3 rounded-lg border text-center cursor-pointer transition ${
                      selectedComp === 'compute' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">SM Cluster A</div>
                    <div className="text-[10px] text-slate-500">Util: {digitalTwin.subsystems.compute.coreUtilizationPct}%</div>
                  </div>
                  <div
                    onClick={() => setSelectedComp('compute')}
                    className={`p-3 rounded-lg border text-center cursor-pointer transition ${
                      selectedComp === 'compute' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">SM Cluster B</div>
                    <div className="text-[10px] text-slate-500">Pipeline: {digitalTwin.subsystems.compute.pipelineEfficiencyPct}%</div>
                  </div>
                  <div
                    onClick={() => setSelectedComp('clock')}
                    className={`p-2.5 rounded-lg border text-center cursor-pointer transition ${
                      selectedComp === 'clock' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">PLL &amp; Clock Tree</div>
                    <div className="text-[10px] text-slate-500">{digitalTwin.subsystems.clock.pllLocked ? 'LOCKED' : 'UNLOCKED'}</div>
                  </div>
                  <div
                    onClick={() => setSelectedComp('thermal')}
                    className={`p-2.5 rounded-lg border text-center cursor-pointer transition ${
                      selectedComp === 'thermal' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">Thermal Diodes</div>
                    <div className="text-[10px] text-slate-500">{digitalTwin.subsystems.thermal.junctionTempC.toFixed(1)}°C</div>
                  </div>
                </div>

                {/* Bottom: PCIe SerDes & Power Rail */}
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedComp('io')}
                    className={`p-2.5 rounded-lg border text-center cursor-pointer transition ${
                      selectedComp === 'io' ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">PCIe Gen 5 PHY</div>
                    <div className="text-[10px] text-slate-500">{digitalTwin.subsystems.io.pcieThroughputGbps} Gbps</div>
                  </div>
                  <div
                    onClick={() => setSelectedComp('power')}
                    className={`p-2.5 rounded-lg border text-center cursor-pointer transition ${
                      selectedComp === 'power' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">VRM Rail Vdd</div>
                    <div className="text-[10px] text-slate-500">{digitalTwin.subsystems.power.voltageV.toFixed(3)}V</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Selected Component Inspector (4 Cols) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 font-mono text-xs">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Subsystem Inspector</div>
                  <div className="font-bold text-slate-100 text-sm capitalize">{selectedComp} Matrix</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  NOMINAL
                </span>
              </div>

              {/* Inspector Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                {(['overview', 'telemetry', 'thermal', 'power', 'ai-insights'] as InspectorTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveInspectorTab(tab)}
                    className={`flex-1 py-1 rounded capitalize font-bold transition ${
                      activeInspectorTab === tab
                        ? 'bg-slate-800 text-slate-100 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
                {activeInspectorTab === 'overview' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Operational State:</span>
                      <span className="text-emerald-400 font-bold">ONLINE &amp; CALIBRATED</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Coupling Coherence:</span>
                      <span className="text-slate-200">0.998 (High Fidelity)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Submodule ID:</span>
                      <span className="text-slate-200 font-mono">DIE-BLOCK-0{selectedComp.length}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 leading-relaxed font-sans">
                      Continuous transient digital twin simulation synchronized with {activeDevice.operatingProfile.nominalFrequencyMHz} MHz nominal clock and 1.0s telemetry interval.
                    </div>
                  </div>
                )}

                {activeInspectorTab === 'telemetry' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Sampling Rate:</span>
                      <span className="text-slate-200">1000 ms</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Jitter Variance:</span>
                      <span className="text-emerald-400 font-bold">&lt; 0.04%</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Packet Drops:</span>
                      <span className="text-slate-200">0 / 10,000</span>
                    </div>
                  </div>
                )}

                {activeInspectorTab === 'thermal' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Block Temp:</span>
                      <span className="text-rose-400 font-bold">{digitalTwin.subsystems.thermal.junctionTempC.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Ambient Delta:</span>
                      <span className="text-slate-200">{(digitalTwin.subsystems.thermal.junctionTempC - 24).toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Cooling Eff.:</span>
                      <span className="text-emerald-400 font-bold">{digitalTwin.subsystems.thermal.coolingEfficiencyPct}%</span>
                    </div>
                  </div>
                )}

                {activeInspectorTab === 'power' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Rail Voltage:</span>
                      <span className="text-amber-400 font-bold">{digitalTwin.subsystems.power.voltageV.toFixed(3)} V</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Current Draw:</span>
                      <span className="text-slate-200">{digitalTwin.subsystems.power.currentA.toFixed(1)} A</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>VRM Efficiency:</span>
                      <span className="text-emerald-400 font-bold">{digitalTwin.subsystems.power.vrmEfficiencyPct}%</span>
                    </div>
                  </div>
                )}

                {activeInspectorTab === 'ai-insights' && (
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Isolation Forest Assessment</span>
                    </div>
                    <p className="text-slate-400 font-sans leading-relaxed">
                      Submodule operational signatures conform to 99.4% of cleanroom training baseline. No accelerated gate oxide breakdown detected.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
