/**
 * Isolation Forest Implementation for Semiconductor Telemetry Anomaly Detection
 * 
 * Implements Liu, Ting & Zhou (2008) Isolation Forest algorithm adapted for
 * multidimensional streaming semiconductor sensor vectors.
 * Calculates path length E(h(x)), average path length c(n), and anomaly score s(x, n) = 2^(-E(h(x))/c(n)).
 */

export interface TelemetryFeatureVector {
  temperatureC: number;
  voltageV: number;
  currentA: number;
  powerW: number;
  frequencyMHz: number;
  utilizationPct: number;
  fanSpeedRpm: number;
  errorCount: number;
  coolingEfficiencyPct: number;
}

export type FeatureKey = keyof TelemetryFeatureVector;

export const FEATURE_KEYS: FeatureKey[] = [
  'temperatureC',
  'voltageV',
  'currentA',
  'powerW',
  'frequencyMHz',
  'utilizationPct',
  'fanSpeedRpm',
  'errorCount',
  'coolingEfficiencyPct'
];

interface IsolationTreeNode {
  feature?: FeatureKey;
  splitValue?: number;
  left?: IsolationTreeNode;
  right?: IsolationTreeNode;
  size?: number; // For leaf node
}

export class IsolationTree {
  root: IsolationTreeNode;
  maxHeight: number;

  constructor(data: TelemetryFeatureVector[], currentHeight: number, maxHeight: number) {
    this.maxHeight = maxHeight;
    this.root = this.buildTree(data, currentHeight);
  }

  private buildTree(data: TelemetryFeatureVector[], currentHeight: number): IsolationTreeNode {
    if (currentHeight >= this.maxHeight || data.length <= 1) {
      return { size: data.length };
    }

    // Pick random feature
    const feature = FEATURE_KEYS[Math.floor(Math.random() * FEATURE_KEYS.length)];
    const values = data.map(d => d[feature]);
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      return { size: data.length };
    }

    // Random split value between min and max
    const splitValue = min + Math.random() * (max - min);

    const leftData = data.filter(d => d[feature] < splitValue);
    const rightData = data.filter(d => d[feature] >= splitValue);

    return {
      feature,
      splitValue,
      left: this.buildTree(leftData, currentHeight + 1),
      right: this.buildTree(rightData, currentHeight + 1)
    };
  }

  public pathLength(point: TelemetryFeatureVector, node: IsolationTreeNode, currentDepth: number): number {
    if (node.size !== undefined) {
      return currentDepth + this.averagePathLengthAdjustment(node.size);
    }

    if (!node.feature || node.splitValue === undefined || !node.left || !node.right) {
      return currentDepth;
    }

    if (point[node.feature] < node.splitValue) {
      return this.pathLength(point, node.left, currentDepth + 1);
    } else {
      return this.pathLength(point, node.right, currentDepth + 1);
    }
  }

  private averagePathLengthAdjustment(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    // Euler-Mascheroni constant approximation: 0.5772156649
    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
  }
}

export class IsolationForest {
  private trees: IsolationTree[] = [];
  private numTrees: number;
  private subSampleSize: number;
  private sampleSize: number;

  constructor(numTrees: number = 50, subSampleSize: number = 64) {
    this.numTrees = numTrees;
    this.subSampleSize = subSampleSize;
    this.sampleSize = subSampleSize;
  }

  public fit(trainingData: TelemetryFeatureVector[]): void {
    if (trainingData.length === 0) return;
    this.trees = [];
    this.sampleSize = Math.min(trainingData.length, this.subSampleSize);
    const maxHeight = Math.ceil(Math.log2(this.sampleSize));

    for (let i = 0; i < this.numTrees; i++) {
      // Sample subset
      const sample = this.sampleRandom(trainingData, this.sampleSize);
      const tree = new IsolationTree(sample, 0, maxHeight);
      this.trees.push(tree);
    }
  }

  private sampleRandom(data: TelemetryFeatureVector[], count: number): TelemetryFeatureVector[] {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private averagePathLengthAdjustment(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
  }

  public score(point: TelemetryFeatureVector): number {
    if (this.trees.length === 0) return 0.1;

    let totalPathLength = 0;
    for (const tree of this.trees) {
      totalPathLength += tree.pathLength(point, tree.root, 0);
    }
    const avgPathLength = totalPathLength / this.trees.length;
    const cN = this.averagePathLengthAdjustment(this.sampleSize);

    if (cN === 0) return 0;

    // Score s = 2^(-E(h)/c(n))
    // s close to 1 => definite anomaly; s < 0.5 => normal
    const anomalyScore = Math.pow(2, - (avgPathLength / cN));
    return Math.max(0, Math.min(1, anomalyScore));
  }

  /**
   * Calculates feature importance / contribution by perturbing each feature
   * (leave-one-out sensitivity analysis)
   */
  public explainFeatureContributions(
    point: TelemetryFeatureVector, 
    baseline: TelemetryFeatureVector
  ): { feature: FeatureKey; contributionPct: number; rawDelta: number; impact: 'INCREASES_RISK' | 'DECREASES_RISK' }[] {
    const baseScore = this.score(point);
    const contributions: { feature: FeatureKey; contributionPct: number; rawDelta: number; impact: 'INCREASES_RISK' | 'DECREASES_RISK' }[] = [];

    let totalDelta = 0;
    const deltas: { feature: FeatureKey; delta: number }[] = [];

    for (const key of FEATURE_KEYS) {
      const perturbed = { ...point, [key]: baseline[key] };
      const perturbedScore = this.score(perturbed);
      const delta = Math.abs(baseScore - perturbedScore);
      deltas.push({ feature: key, delta });
      totalDelta += delta;
    }

    for (const d of deltas) {
      const pct = totalDelta > 0 ? (d.delta / totalDelta) * 100 : (100 / FEATURE_KEYS.length);
      const isIncreasing = (point[d.feature] > baseline[d.feature] && d.feature !== 'coolingEfficiencyPct' && d.feature !== 'fanSpeedRpm') ||
                           (d.feature === 'coolingEfficiencyPct' && point[d.feature] < baseline[d.feature]);
      
      contributions.push({
        feature: d.feature,
        contributionPct: Math.round(pct * 10) / 10,
        rawDelta: Math.round(d.delta * 1000) / 1000,
        impact: isIncreasing ? 'INCREASES_RISK' : 'DECREASES_RISK'
      });
    }

    return contributions.sort((a, b) => b.contributionPct - a.contributionPct);
  }
}

// Global trained isolation forest instance with nominal baseline seed
export const globalIsolationForest = new IsolationForest(60, 64);

// Initialize baseline nominal data for semiconductor ASIC/SoC
export const NOMINAL_BASELINE_VECTOR: TelemetryFeatureVector = {
  temperatureC: 62.5,
  voltageV: 0.85,
  currentA: 45.0,
  powerW: 38.25,
  frequencyMHz: 2400,
  utilizationPct: 65,
  fanSpeedRpm: 3200,
  errorCount: 0,
  coolingEfficiencyPct: 96
};

// Generate initial baseline distributions for training
const baselineTrainingSet: TelemetryFeatureVector[] = [];
for (let i = 0; i < 200; i++) {
  const util = 40 + Math.random() * 40;
  const volt = 0.84 + (Math.random() - 0.5) * 0.02;
  const freq = 2200 + (util / 100) * 400 + (Math.random() - 0.5) * 50;
  const curr = (volt * (util / 100) * 50) + 10;
  const pwr = volt * curr;
  const cooling = 92 + Math.random() * 6;
  const temp = 45 + (pwr * 0.45 * (100 / cooling)) + (Math.random() - 0.5) * 3;
  const fan = 2800 + (temp / 80) * 1200 + (Math.random() - 0.5) * 100;

  baselineTrainingSet.push({
    temperatureC: temp,
    voltageV: volt,
    currentA: curr,
    powerW: pwr,
    frequencyMHz: freq,
    utilizationPct: util,
    fanSpeedRpm: fan,
    errorCount: Math.random() > 0.98 ? 1 : 0,
    coolingEfficiencyPct: cooling
  });
}
globalIsolationForest.fit(baselineTrainingSet);
