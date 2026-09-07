/**
 * GPU & NVIDIA Acceleration Lab View
 * 
 * Hardware detection, CUDA thread grid mapping, parallel reduction trees,
 * and CPU vs CUDA vs TensorRT batch inference benchmarks.
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Layers,
  Activity,
  BarChart3,
  Server,
  Play,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Gauge
} from 'lucide-react';
import { api } from '../../services/api.ts';

export const GpuAccelerationLabView: React.FC = () => {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [cudaSim, setCudaSim] = useState<any>(null);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [benchmarking, setBenchmarking] = useState(false);
  
  // Controls
  const [arraySize, setArraySize] = useState(1024);
  const [blockSize, setBlockSize] = useState(256);
  const [batchSize, setBatchSize] = useState(2000);

  const loadDeviceInfo = async () => {
    try {
      const data = await api.getGpuDeviceInfo();
      setDeviceInfo(data);
    } catch (err) {
      console.error('Failed to load GPU info:', err);
    }
  };

  const runCudaSim = async () => {
    try {
      const sim = await api.runCudaSimulation(arraySize, blockSize);
      setCudaSim(sim);
    } catch (err) {
      console.error('Failed to run CUDA sim:', err);
    }
  };

  const runBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await api.runGpuBatchBenchmark(batchSize);
      setBenchmarkData(res);
    } catch (err) {
      console.error('Failed to run batch benchmark:', err);
    } finally {
      setBenchmarking(false);
    }
  };

  useEffect(() => {
    loadDeviceInfo();
    runCudaSim();
    runBenchmark();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              MODULE 7 &amp; 8 • ACCELERATED COMPUTING
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              NVIDIA ARCHITECT TRACK
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono mt-1">
            <Zap className="w-6 h-6 text-amber-400" />
            <span>GPU Acceleration, CUDA &amp; TensorRT Lab</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hardware runtime introspection, CUDA warp scheduling, parallel reduction trees, and TensorRT batch inference optimization.
          </p>
        </div>

        <button
          onClick={runBenchmark}
          disabled={benchmarking}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition font-mono shadow-sm"
        >
          <Play className={`w-3.5 h-3.5 ${benchmarking ? 'animate-spin' : ''}`} />
          <span>{benchmarking ? 'Running Benchmarks...' : 'Benchmark Batch Engines'}</span>
        </button>
      </div>

      {/* Hardware Environment Introspection Banner */}
      {deviceInfo && (
        <div className={`border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          deviceInfo.hardware?.cudaAvailable 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-slate-900 border-amber-500/30 text-slate-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${deviceInfo.hardware?.cudaAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm font-mono">
                  {deviceInfo.hardware?.cudaAvailable ? deviceInfo.hardware.gpuName : 'Hardware Detection Notice'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {deviceInfo.hardware?.activeExecutionProvider}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {deviceInfo.hardware?.fallbackStatus}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 mr-2">Driver:</span>
              <span className="text-slate-200">{deviceInfo.hardware?.driverVersion || 'N/A (Host)'}</span>
            </div>
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 mr-2">CUDA Toolkit:</span>
              <span className="text-amber-400 font-bold">{deviceInfo.hardware?.cudaVersion || '12.2 Sim'}</span>
            </div>
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 mr-2">TensorRT:</span>
              <span className="text-emerald-400 font-bold">{deviceInfo.hardware?.tensorRtVersion || '8.6.1 Ready'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Batch Benchmark Comparison */}
      {benchmarkData && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase font-mono flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Batch Inference Performance &amp; Energy Benchmark</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Batch Size: <span className="text-amber-400 font-bold">{benchmarkData.batchSize} samples</span> | Payload: <span className="text-slate-300 font-bold">{benchmarkData.memoryTransferredKB} KB</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Batch Size:</span>
              {[500, 2000, 10000].map(sz => (
                <button
                  key={sz}
                  onClick={() => {
                    setBatchSize(sz);
                    api.runGpuBatchBenchmark(sz).then(setBenchmarkData);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                    batchSize === sz
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benchmarkData.results?.map((res: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border space-y-3 font-mono transition ${
                  res.isDetectedEnvironment
                    ? 'bg-slate-950 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{res.engine}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-400 border border-slate-700">
                    {res.precision}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Latency</div>
                    <div className="text-base font-bold text-slate-100">{res.latencyMs} ms</div>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Throughput</div>
                    <div className="text-base font-bold text-emerald-400">{res.throughputSamplesPerSec} /s</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] pt-1 border-t border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>Power Draw:</span>
                    <span className="text-slate-200 font-bold">{res.powerProxyWatts} W</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>VRAM Allocated:</span>
                    <span className="text-slate-200 font-bold">{res.vramAllocatedMB} MB</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Speedup vs CPU:</span>
                    <span className={`font-bold ${res.speedupVsBaseline > 1 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {res.speedupVsBaseline}x
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUDA Kernel Grid & Parallel Reduction Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thread Hierarchy Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>CUDA Thread Hierarchy &amp; Warp Mapping</span>
            </h3>
            <button
              onClick={runCudaSim}
              className="text-xs text-amber-400 font-mono hover:underline"
            >
              Recompute Grid
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Input Array Size:</span>
              <select
                value={arraySize}
                onChange={e => {
                  setArraySize(Number(e.target.value));
                  api.runCudaSimulation(Number(e.target.value), blockSize).then(setCudaSim);
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-mono"
              >
                <option value="512">512 Elements</option>
                <option value="1024">1,024 Elements</option>
                <option value="4096">4,096 Elements</option>
                <option value="16384">16,384 Elements</option>
              </select>

              <span className="text-slate-400 ml-2">Block Size:</span>
              <select
                value={blockSize}
                onChange={e => {
                  setBlockSize(Number(e.target.value));
                  api.runCudaSimulation(arraySize, Number(e.target.value)).then(setCudaSim);
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-mono"
              >
                <option value="128">128 Threads</option>
                <option value="256">256 Threads</option>
                <option value="512">512 Threads</option>
              </select>
            </div>

            {cudaSim && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Grid Dimension (gridDim.x)</div>
                  <div className="text-base font-bold text-slate-100">{cudaSim.gridConfig?.gridDim.x} Blocks</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Warps per Block</div>
                  <div className="text-base font-bold text-amber-400">{cudaSim.gridConfig?.warpsPerBlock} Warps (32 th/warp)</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Shared Memory / Block</div>
                  <div className="text-base font-bold text-slate-100">{cudaSim.gridConfig?.sharedMemoryPerBlockBytes} Bytes</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Theoretical Occupancy</div>
                  <div className="text-base font-bold text-emerald-400">{cudaSim.gridConfig?.theoreticalOccupancyPct}%</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parallel Reduction Steps */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Parallel Reduction Tree (Shared Memory Fold)</span>
          </h3>

          {cudaSim?.reductionTree && (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar font-mono text-xs">
              {cudaSim.reductionTree.steps.map((st: any) => (
                <div key={st.step} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-400 mr-2">Step {st.step}:</span>
                    <span className="text-slate-300 text-[11px]">{st.description}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-emerald-400 font-bold">
                    {st.activeThreads} th
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
