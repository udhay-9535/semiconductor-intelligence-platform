/**
 * Engineering Lab Route - Algorithms, Data Structures, Concurrency & OS Concepts
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';

const router = Router();

// ==========================================
// 1. ALGORITHMS IMPLEMENTATION
// ==========================================

// Sliding Window Moving Average & Anomaly Spike Detection
function runSlidingWindow(data: number[], windowSize: number, thresholdStdDev: number = 2.0) {
  const result: { index: number; value: number; mean: number; stdDev: number; isAnomaly: boolean }[] = [];
  const window: number[] = [];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    window.push(val);
    sum += val;

    if (window.length > windowSize) {
      const removed = window.shift()!;
      sum -= removed;
    }

    const mean = sum / window.length;
    let variance = 0;
    for (let j = 0; j < window.length; j++) {
      variance += Math.pow(window[j] - mean, 2);
    }
    const stdDev = Math.sqrt(variance / window.length) || 0.001;
    const isAnomaly = Math.abs(val - mean) > thresholdStdDev * stdDev;

    result.push({
      index: i,
      value: Number(val.toFixed(2)),
      mean: Number(mean.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
      isAnomaly
    });
  }
  return result;
}

// Min-Heap / Priority Queue Implementation for Alert Ordering
class MinHeap<T> {
  private heap: { priority: number; item: T }[] = [];

  push(priority: number, item: T) {
    this.heap.push({ priority, item });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | null {
    if (this.heap.length === 0) return null;
    const min = this.heap[0].item;
    const end = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return min;
  }

  size(): number {
    return this.heap.length;
  }

  private bubbleUp(n: number) {
    const element = this.heap[n];
    while (n > 0) {
      const parentN = Math.floor((n + 1) / 2) - 1;
      const parent = this.heap[parentN];
      if (element.priority >= parent.priority) break;
      this.heap[parentN] = element;
      this.heap[n] = parent;
      n = parentN;
    }
  }

  private sinkDown(n: number) {
    const length = this.heap.length;
    const element = this.heap[n];
    while (true) {
      const child2N = (n + 1) * 2;
      const child1N = child2N - 1;
      let swap: number | null = null;

      if (child1N < length) {
        const child1 = this.heap[child1N];
        if (child1.priority < element.priority) {
          swap = child1N;
        }
      }
      if (child2N < length) {
        const child2 = this.heap[child2N];
        if (
          (swap === null && child2.priority < element.priority) ||
          (swap !== null && child2.priority < this.heap[child1N].priority)
        ) {
          swap = child2N;
        }
      }
      if (swap === null) break;
      this.heap[n] = this.heap[swap];
      this.heap[swap] = element;
      n = swap;
    }
  }
}

// LRU Cache Implementation
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | null {
    if (!this.cache.has(key)) {
      this.misses++;
      return null;
    }
    this.hits++;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key: K, value: V) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRatioPct: total > 0 ? Number(((this.hits / total) * 100).toFixed(1)) : 0,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Graph Dependency Topological Sort & Critical Path
function topologicalSort(nodes: string[], edges: [string, string][]) {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};

  nodes.forEach(n => {
    inDegree[n] = 0;
    adjList[n] = [];
  });

  edges.forEach(([src, dst]) => {
    if (adjList[src]) adjList[src].push(dst);
    if (inDegree[dst] !== undefined) inDegree[dst]++;
  });

  const queue: string[] = [];
  nodes.forEach(n => {
    if (inDegree[n] === 0) queue.push(n);
  });

  const order: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    order.push(curr);

    (adjList[curr] || []).forEach(neighbor => {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }

  const hasCycle = order.length !== nodes.length;
  return { order, hasCycle, totalNodes: nodes.length };
}

// ==========================================
// ROUTES
// ==========================================

// 1. Run Algorithm Benchmarks
router.post('/run-algorithm', (req: Request, res: Response) => {
  const { algorithm, params } = req.body;
  const startTime = process.hrtime.bigint();

  try {
    let result: any = null;
    let complexity = { time: 'O(N)', space: 'O(K)' };

    switch (algorithm) {
      case 'SLIDING_WINDOW': {
        const dataLength = params?.dataLength || 100;
        const windowSize = params?.windowSize || 10;
        const threshold = params?.threshold || 2.0;

        // Generate synthetic thermal time series with random spikes
        const mockData: number[] = [];
        let base = 65;
        for (let i = 0; i < dataLength; i++) {
          base += (Math.random() - 0.48) * 2;
          if (i === Math.floor(dataLength * 0.35) || i === Math.floor(dataLength * 0.75)) {
            base += 18; // Anomaly spike
          }
          mockData.push(Math.max(40, Math.min(105, base)));
        }

        const windowResult = runSlidingWindow(mockData, windowSize, threshold);
        const anomalyCount = windowResult.filter(r => r.isAnomaly).length;

        result = {
          processedPoints: windowResult.length,
          anomaliesDetected: anomalyCount,
          samples: windowResult.slice(0, 30),
          windowSize,
          threshold
        };
        complexity = { time: 'O(N) with streaming buffer', space: 'O(K) where K = window size' };
        break;
      }

      case 'PRIORITY_QUEUE': {
        const heap = new MinHeap<{ id: string; msg: string; severity: string }>();
        const items = [
          { priority: 1, item: { id: 'ALT-901', msg: 'Core 0 Junction Temp > 105C', severity: 'CRITICAL' } },
          { priority: 3, item: { id: 'ALT-902', msg: 'Telemetry Jitter > 45ms', severity: 'WARNING' } },
          { priority: 1, item: { id: 'ALT-903', msg: 'Coolant Pump Flow Zero', severity: 'CRITICAL' } },
          { priority: 2, item: { id: 'ALT-904', msg: 'Voltage Sag 0.82V', severity: 'HIGH' } },
          { priority: 4, item: { id: 'ALT-905', msg: 'Routine Calibration Due', severity: 'INFO' } }
        ];

        items.forEach(i => heap.push(i.priority, i.item));
        const poppedOrder: any[] = [];
        while (heap.size() > 0) {
          poppedOrder.push(heap.pop());
        }

        result = {
          insertedCount: items.length,
          poppedOrder,
          structure: 'Binary Min-Heap with Array backing'
        };
        complexity = { time: 'O(log N) insert/pop, O(1) peek', space: 'O(N)' };
        break;
      }

      case 'LRU_CACHE': {
        const lru = new LRUCache<string, any>(params?.capacity || 4);
        const operations = [
          { op: 'PUT', key: 'DEV-001', val: { tj: 72.4, status: 'OK' } },
          { op: 'PUT', key: 'DEV-002', val: { tj: 84.1, status: 'WARM' } },
          { op: 'PUT', key: 'DEV-003', val: { tj: 68.0, status: 'OK' } },
          { op: 'GET', key: 'DEV-001' },
          { op: 'PUT', key: 'DEV-004', val: { tj: 91.5, status: 'HOT' } },
          { op: 'PUT', key: 'DEV-005', val: { tj: 64.2, status: 'OK' } }, // Evicts DEV-002
          { op: 'GET', key: 'DEV-002' }, // Miss
          { op: 'GET', key: 'DEV-004' }  // Hit
        ];

        operations.forEach(o => {
          if (o.op === 'PUT') lru.put(o.key, o.val);
          if (o.op === 'GET') lru.get(o.key);
        });

        result = {
          operationsExecuted: operations.length,
          stats: lru.getStats(),
          evictionPolicy: 'Least-Recently-Used (Doubly-Linked List + Hash Map)'
        };
        complexity = { time: 'O(1) get & put', space: 'O(Capacity)' };
        break;
      }

      case 'GRAPH_DEPENDENCY': {
        const nodes = ['PowerRail_1V2', 'ClockTree_3GHz', 'GPU_Core_Cluster', 'HBM_Memory_Stack', 'Interconnect_NOC', 'Thermal_Sensor_Array'];
        const edges: [string, string][] = [
          ['PowerRail_1V2', 'ClockTree_3GHz'],
          ['PowerRail_1V2', 'GPU_Core_Cluster'],
          ['ClockTree_3GHz', 'GPU_Core_Cluster'],
          ['GPU_Core_Cluster', 'Interconnect_NOC'],
          ['Interconnect_NOC', 'HBM_Memory_Stack'],
          ['PowerRail_1V2', 'Thermal_Sensor_Array']
        ];

        const topo = topologicalSort(nodes, edges);
        result = {
          nodes,
          dependencies: edges.map(e => `${e[0]} -> ${e[1]}`),
          bootSequence: topo.order,
          cycleDetected: topo.hasCycle
        };
        complexity = { time: 'O(V + E) Kahn Algorithm', space: 'O(V + E)' };
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown algorithm: ${algorithm}` });
    }

    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1_000_000;

    res.json({
      success: true,
      algorithm,
      executionTimeMs: Number(executionTimeMs.toFixed(3)),
      complexity,
      result
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Concurrency & OS Concepts Simulator
router.get('/concurrency-status', (_req: Request, res: Response) => {
  res.json({
    osContext: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      uptimeSec: Math.floor(process.uptime()),
      memoryUsage: {
        heapTotalMB: Number((process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1)),
        heapUsedMB: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)),
        rssMB: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(1)),
        externalMB: Number((process.memoryUsage().external / 1024 / 1024).toFixed(1))
      }
    },
    threadPoolSimulation: {
      workerThreadsConfigured: 4,
      activeJobs: 2,
      queuedJobs: 0,
      completedJobs: 1420,
      schedulingAlgorithm: 'Non-preemptive Priority + Round Robin',
      lockContentionRatePct: 0.12,
      contextSwitchOverheadUs: 1.8
    }
  });
});

export default router;
