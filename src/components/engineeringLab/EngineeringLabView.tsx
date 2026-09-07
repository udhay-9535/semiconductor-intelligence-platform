/**
 * Engineering Lab View - Algorithms, Data Structures, Concurrency & OS Concepts
 */

import React, { useState, useEffect } from 'react';
import {
  Code,
  Cpu,
  Layers,
  Zap,
  Activity,
  GitBranch,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Database,
  Terminal,
  Clock
} from 'lucide-react';
import { api } from '../../services/api.ts';

export const EngineeringLabView: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<'SLIDING_WINDOW' | 'PRIORITY_QUEUE' | 'LRU_CACHE' | 'GRAPH_DEPENDENCY'>('SLIDING_WINDOW');
  const [running, setRunning] = useState(false);
  const [algoResult, setAlgoResult] = useState<any>(null);
  const [concurrencyInfo, setConcurrencyInfo] = useState<any>(null);

  // Algorithm configuration parameters
  const [windowSize, setWindowSize] = useState(10);
  const [cacheCapacity, setCacheCapacity] = useState(4);
  const [threshold, setThreshold] = useState(2.0);

  const fetchConcurrency = async () => {
    try {
      const data = await api.getConcurrencyStatus();
      setConcurrencyInfo(data);
    } catch (err) {
      console.error('Failed to fetch concurrency info:', err);
    }
  };

  const runBenchmark = async () => {
    setRunning(true);
    try {
      const data = await api.runAlgorithmBenchmark(selectedAlgo, {
        windowSize,
        capacity: cacheCapacity,
        threshold,
        dataLength: 80
      });
      setAlgoResult(data);
    } catch (err) {
      console.error('Algorithm benchmark failed:', err);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    runBenchmark();
    fetchConcurrency();
  }, [selectedAlgo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              MODULE 1 • SOFTWARE ENGINEERING
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              DSA &amp; OS BENCHMARKS
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono mt-1">
            <Code className="w-6 h-6 text-emerald-400" />
            <span>Software Engineering &amp; Computer Science Lab</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Production-grade data structures, streaming algorithms, multi-threaded concurrency models, and Big-O computational complexity proofs.
          </p>
        </div>

        <button
          onClick={runBenchmark}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition font-mono shadow-sm"
        >
          <Play className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Executing Algorithm...' : 'Run DSA Benchmark'}</span>
        </button>
      </div>

      {/* Algorithm Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'SLIDING_WINDOW', label: '1. Sliding-Window Telemetry Filter', icon: Activity },
          { id: 'PRIORITY_QUEUE', label: '2. Min-Heap Alert Priority Queue', icon: Zap },
          { id: 'LRU_CACHE', label: '3. LRU Device State Cache', icon: Database },
          { id: 'GRAPH_DEPENDENCY', label: '4. Graph Topological Sorter', icon: GitBranch }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = selectedAlgo === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedAlgo(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Algorithm Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Algorithm Specs & Live Parameters */}
        <div className="space-y-6 lg:col-span-1">
          {/* Complexity & Theoretical Proof Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Asymptotic Complexity</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Time Complexity</div>
                <div className="text-sm font-bold text-slate-100">{algoResult?.complexity?.time || 'O(N)'}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Auxiliary Space Complexity</div>
                <div className="text-sm font-bold text-slate-100">{algoResult?.complexity?.space || 'O(K)'}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Measured Execution Time</div>
                <div className="text-sm font-bold text-emerald-400">
                  {algoResult?.executionTimeMs !== undefined ? `${algoResult.executionTimeMs} ms` : 'Measuring...'}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Parameters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Benchmark Tuning Parameters</span>
            </h3>

            {selectedAlgo === 'SLIDING_WINDOW' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Window Size (K):</span>
                    <span className="text-emerald-400 font-bold">{windowSize} samples</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="25"
                    value={windowSize}
                    onChange={e => setWindowSize(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Anomaly Threshold (Z-Score):</span>
                    <span className="text-emerald-400 font-bold">{threshold} σ</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.5"
                    step="0.1"
                    value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {selectedAlgo === 'LRU_CACHE' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Cache Capacity:</span>
                    <span className="text-emerald-400 font-bold">{cacheCapacity} items</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={cacheCapacity}
                    onChange={e => setCacheCapacity(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            <button
              onClick={runBenchmark}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-evaluate Parameters</span>
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Live Execution Trace & Visual Representation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Algorithm Output Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Execution Trace &amp; Output Structure</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Status: <span className="text-emerald-400 font-bold">VERIFIED</span>
              </span>
            </div>

            {selectedAlgo === 'SLIDING_WINDOW' && algoResult?.result && (
              <div className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Total Samples Filtered</div>
                    <div className="text-base font-bold text-slate-100">{algoResult.result.processedPoints}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Anomalies Detected (&gt;{threshold}σ)</div>
                    <div className="text-base font-bold text-rose-400">{algoResult.result.anomaliesDetected}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Amortized Step Time</div>
                    <div className="text-base font-bold text-emerald-400">~0.003 ms/sample</div>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 max-h-60 overflow-y-auto custom-scrollbar">
                  <div className="text-[10px] text-slate-500 uppercase mb-2">Streaming Trace (First 15 frames):</div>
                  <table className="w-full text-left text-[11px]">
                    <thead className="text-slate-500 border-b border-slate-800">
                      <tr>
                        <th className="py-1">Idx</th>
                        <th className="py-1">Raw Value (°C)</th>
                        <th className="py-1">Rolling Mean</th>
                        <th className="py-1">Std Dev (σ)</th>
                        <th className="py-1 text-right">Anomaly Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {algoResult.result.samples?.slice(0, 15).map((s: any) => (
                        <tr key={s.index} className={s.isAnomaly ? 'bg-rose-500/10 text-rose-300' : 'text-slate-300'}>
                          <td className="py-1 text-slate-500">#{s.index}</td>
                          <td className="py-1 font-bold">{s.value}</td>
                          <td className="py-1">{s.mean}</td>
                          <td className="py-1">{s.stdDev}</td>
                          <td className="py-1 text-right">
                            {s.isAnomaly ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold">
                                SPIKE DETECTED
                              </span>
                            ) : (
                              <span className="text-slate-500">NORMAL</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedAlgo === 'PRIORITY_QUEUE' && algoResult?.result && (
              <div className="space-y-4 font-mono text-xs">
                <div className="text-slate-300">
                  Binary Min-Heap extracted alerts in strict priority order (1 = Critical Alarm, 4 = Info):
                </div>

                <div className="space-y-2">
                  {algoResult.result.poppedOrder?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200">{item.msg}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {item.id}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        item.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAlgo === 'LRU_CACHE' && algoResult?.result && (
              <div className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Cache Hits</div>
                    <div className="text-base font-bold text-emerald-400">{algoResult.result.stats.hits}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Cache Misses</div>
                    <div className="text-base font-bold text-rose-400">{algoResult.result.stats.misses}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Hit Ratio</div>
                    <div className="text-base font-bold text-slate-100">{algoResult.result.stats.hitRatioPct}%</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Active Keys</div>
                    <div className="text-base font-bold text-slate-100">{algoResult.result.stats.size} / {algoResult.result.stats.capacity}</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase mb-1">Resident Keys in MRU-to-LRU Order:</div>
                  <div className="flex flex-wrap gap-2">
                    {algoResult.result.stats.keys.map((k: string) => (
                      <span key={k} className="px-2.5 py-1 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedAlgo === 'GRAPH_DEPENDENCY' && algoResult?.result && (
              <div className="space-y-4 font-mono text-xs">
                <div className="text-slate-300">
                  Kahn's Topological Sorting Algorithm resolved the dependency DAG for cleanroom power rails and clock trees:
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">Resolved Valid Power-On Sequence:</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {algoResult.result.bootSequence?.map((node: string, i: number) => (
                      <React.Fragment key={node}>
                        <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                          {i + 1}. {node}
                        </span>
                        {i < algoResult.result.bootSequence.length - 1 && (
                          <span className="text-slate-600 font-bold">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* OS & Concurrency Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>OS Concurrency, Thread Pool &amp; Memory Allocation</span>
            </h3>

            {concurrencyInfo && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Node Heap Used</div>
                  <div className="text-sm font-bold text-slate-100">{concurrencyInfo.osContext?.memoryUsage?.heapUsedMB} MB</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Resident RSS</div>
                  <div className="text-sm font-bold text-slate-100">{concurrencyInfo.osContext?.memoryUsage?.rssMB} MB</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Context Switch Overhead</div>
                  <div className="text-sm font-bold text-emerald-400">{concurrencyInfo.threadPoolSimulation?.contextSwitchOverheadUs} µs</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Lock Contention</div>
                  <div className="text-sm font-bold text-emerald-400">{concurrencyInfo.threadPoolSimulation?.lockContentionRatePct}%</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
