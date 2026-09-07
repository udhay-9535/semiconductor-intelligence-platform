/**
/**
 * Semiconductor Intelligence Platform - Enterprise Data Types & Schemas
 * Comprehensive Production-Oriented Schemas for Multi-Tenancy, Real Telemetry, Digital Twins & MLOps
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ENGINEER' | 'ANALYST' | 'OPERATOR' | 'VIEWER';

export type Permission = 
  | 'devices.read'
  | 'devices.write'
  | 'telemetry.read'
  | 'telemetry.write'
  | 'models.read'
  | 'models.train'
  | 'models.deploy'
  | 'incidents.read'
  | 'incidents.manage'
  | 'reports.generate'
  | 'users.manage'
  | 'integrations.manage'
  | 'audit.read'
  | 'system.admin';

export type DeviceStatus = 
  | 'REGISTERED' 
  | 'PROVISIONING' 
  | 'CONNECTED' 
  | 'ACTIVE' 
  | 'ONLINE' 
  | 'WARNING' 
  | 'CRITICAL' 
  | 'MAINTENANCE' 
  | 'DISCONNECTED' 
  | 'RETIRED';

export type TelemetrySource = 'REST' | 'MQTT' | 'KAFKA' | 'OPC_UA' | 'SIMULATION' | 'IMPORTED';

export type TelemetryQuality = 'GOOD' | 'UNCERTAIN' | 'BAD';

export type SimulationScenarioType = 
  | 'NORMAL' 
  | 'THERMAL_STRESS' 
  | 'VOLTAGE_INSTABILITY' 
  | 'HIGH_WORKLOAD' 
  | 'COOLING_DEGRADATION' 
  | 'POWER_ANOMALY' 
  | 'MIXED_FAILURE';

export type TelemetryMode = 'LIVE' | 'IMPORTED' | 'SIMULATION' | 'MODEL_OUTPUT';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'FATAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED';

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'CLOSED';

export type ModelDeploymentStatus = 'DRAFT' | 'TRAINING' | 'VALIDATED' | 'STAGED' | 'PRODUCTION' | 'ARCHIVED' | 'FAILED';

export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type JobType = 
  | 'MODEL_TRAINING' 
  | 'DATASET_INGESTION' 
  | 'REPORT_GENERATION' 
  | 'BATCH_INFERENCE' 
  | 'SYSTEM_BACKUP' 
  | 'DIAGNOSTIC_SUITE';

export interface User {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  passwordHash?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  settings: {
    telemetryRetentionDays: number;
    anomalyThreshold: number;
    alertNotificationEmail?: string;
    autoEscalateAlertsMinutes?: number;
    enforceMfa?: boolean;
    ipAllowlist?: string[];
  };
}

export interface Site {
  id: string;
  orgId: string;
  name: string;
  code: string;
  location: string;
  timezone: string;
  description: string;
  createdAt: string;
  facilitiesCount?: number;
}

export interface Facility {
  id: string;
  orgId: string;
  siteId: string;
  name: string;
  cleanroomClass: 'ISO 1' | 'ISO 2' | 'ISO 3' | 'ISO 4' | 'ISO 5';
  floorAreaSqm: number;
  ambientTempC: number;
  relativeHumidityPct: number;
}

export type CoolingType = 'AIR_FORCED' | 'LIQUID_COLD_PLATE' | 'LIQUID_CLOSED_LOOP' | 'IMMERSION' | 'IMMERSION_TWO_PHASE' | 'PASSIVE' | 'PASSIVE_HEATSINK';

export interface Device {
  id: string;
  orgId: string;
  siteId: string;
  siteName?: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: DeviceStatus;
  firmwareVersion: string;
  hardwareVersion?: string;
  lastCommunication: string;
  createdAt: string;
  mode: TelemetryMode;
  apiTokenHash?: string;
  configuration?: Record<string, any>;
  metadata?: Record<string, string>;
  operatingProfile: {
    nominalVoltageV: number;
    nominalFrequencyMHz: number;
    maxJunctionTempC: number;
    thermalResistanceC_W: number;
    nominalPowerW: number;
    coolingType: CoolingType;
    dieProcessNm: number;
  };
  currentMetrics?: {
    healthScore: number;
    riskLevel: RiskLevel;
    anomalyScore: number;
    failureProbability: number;
    temperatureC: number;
    voltageV: number;
    currentA: number;
    powerW: number;
    frequencyMHz: number;
    utilizationPct: number;
    fanSpeedRpm: number;
    errorCount: number;
  };
}

export interface TelemetryReading {
  id: string;
  orgId: string;
  deviceId: string;
  timestamp: string;
  ingestionTimestamp?: string;
  sequenceNumber?: number;
  mode: TelemetryMode;
  source?: TelemetrySource;
  quality?: TelemetryQuality;
  temperatureC: number;
  voltageV: number;
  currentA: number;
  powerW: number;
  frequencyMHz: number;
  utilizationPct: number;
  fanSpeedRpm: number;
  coolingEfficiencyPct: number;
  pressureBar?: number;
  errorCount: number;
  operatingCycles: number;
  sensorStatus: 'OK' | 'DEGRADED' | 'FAULT';
  anomalyScore?: number;
  isAnomaly?: boolean;
  healthScore?: number;
  failureProbability?: number;
}

export interface IngestionHealthMetrics {
  messagesPerSec: number;
  droppedMessages: number;
  processingLatencyMs: number;
  queueDepth: number;
  errorRatePct: number;
  lastSuccessfulIngestion: string;
  totalIngested24h: number;
  activeAdapters: {
    rest: boolean;
    mqtt: boolean;
    kafka: boolean;
    opcua: boolean;
  };
}

export interface DigitalTwinState {
  deviceId: string;
  orgId: string;
  lastUpdated: string;
  mode: TelemetryMode;
  healthScore: number; // 0 - 100
  riskLevel: RiskLevel;
  subsystems: {
    compute: {
      healthScore: number;
      coreUtilizationPct: number;
      throttled: boolean;
      pipelineEfficiencyPct: number;
      branchMispredictRate: number;
      status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
    };
    memory: {
      healthScore: number;
      bandwidthUtilizationPct: number;
      eccCorrectableErrors: number;
      eccUncorrectableErrors: number;
      latencyNs: number;
      status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
    };
    power: {
      healthScore: number;
      voltageV: number;
      currentA: number;
      powerW: number;
      voltageSagPct: number;
      vrmEfficiencyPct: number;
      status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
    };
    clock: {
      healthScore: number;
      frequencyMHz: number;
      jitterPs: number;
      phaseNoiseDbc: number;
      pllLocked: boolean;
      status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
    };
    thermal: {
      healthScore: number;
      junctionTempC: number;
      ambientTempC: number;
      heatSinkTempC: number;
      thermalResistanceC_W: number;
      coolingEfficiencyPct: number;
      status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
    };
    sensors: {
      healthScore: number;
      activeSensors: number;
      driftDetected: boolean;
      status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
    };
    io: {
      healthScore: number;
      pcieThroughputGbps: number;
      packetLossPct: number;
      crcErrors: number;
      status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
    };
  };
  physics: {
    calculatedTjC: number;
    expectedDynamicPowerW: number;
    expectedStaticLeakagePowerW: number;
    thermalHeadroomC: number;
    mtbfHoursEstimated: number;
  };
}

export interface DatasetRegistryEntry {
  id: string;
  orgId: string;
  name: string;
  version: string;
  description: string;
  rowCount: number;
  featureCount: number;
  format: 'CSV' | 'PARQUET' | 'TIMESERIES_BUFFER';
  validationStatus: 'VALIDATED' | 'PENDING' | 'INVALID';
  uploadedAt: string;
  uploadedBy: string;
  checksum: string;
}

export interface MLModelRegistryEntry {
  id: string;
  orgId: string;
  name: string;
  version: string;
  type: 'ISOLATION_FOREST' | 'RANDOM_FOREST_FAILURE' | 'ARRHENIUS_WEIBULL' | 'AUTOENCODER';
  algorithm: string;
  trainingDataset: string;
  datasetVersion: string;
  featureVersion: string;
  trainingTimestamp: string;
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc: number;
    meanInferenceLatencyMs: number;
  };
  status: ModelDeploymentStatus;
  createdBy: string;
  description: string;
  artifactRef?: string;
  rollbackVersion?: string;
  isSimulatedDemoModel?: boolean;
}

export interface MLMonitoringMetrics {
  totalPredictions24h: number;
  anomalyRatePct: number;
  averageConfidencePct: number;
  dataDriftScore: number; // 0 to 1
  featureDrift: {
    feature: string;
    driftScore: number;
    status: 'STABLE' | 'WARNING' | 'DRIFT_DETECTED';
  }[];
  predictionDistribution: {
    range: string;
    count: number;
  }[];
}

export interface PredictionExplanation {
  deviceId: string;
  timestamp: string;
  healthScore: number;
  failureProbability: number;
  riskLevel: RiskLevel;
  topContributingFactors: {
    feature: string;
    impactPct: number;
    direction: 'INCREASES_RISK' | 'DECREASES_RISK';
    description: string;
  }[];
  rootCauseHypothesis: string;
  recommendedActions: string[];
}

export interface WhatIfScenarioInput {
  deviceId: string;
  workloadPct: number;
  ambientTempC: number;
  voltageBiasPct: number;
  frequencyOffsetMHz: number;
  coolingEfficiencyPct: number;
  ambientPressureBar?: number;
}

export interface WhatIfScenarioResult {
  id: string;
  name: string;
  deviceId: string;
  createdAt: string;
  input: WhatIfScenarioInput;
  baseline: {
    healthScore: number;
    failureProbability: number;
    anomalyScore: number;
    powerW: number;
    temperatureC: number;
    estimatedRulHours: number;
  };
  scenario: {
    healthScore: number;
    failureProbability: number;
    anomalyScore: number;
    powerW: number;
    temperatureC: number;
    estimatedRulHours: number;
  };
  difference: {
    healthDelta: number;
    failureProbDeltaPct: number;
    anomalyScoreDelta: number;
    powerDeltaW: number;
    temperatureDeltaC: number;
    rulDeltaHours: number;
  };
  riskLevel: RiskLevel;
  impactSummary: string;
}

export interface Alert {
  id: string;
  orgId: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  severity: AlertSeverity;
  condition: string;
  currentValue: string;
  expectedValue: string;
  status: AlertStatus;
  ruleId?: string;
  assignedEngineer?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  incidentId?: string;
}

export interface Incident {
  id: string;
  orgId: string;
  title: string;
  deviceId: string;
  deviceName: string;
  severity: AlertSeverity;
  description: string;
  detectedTime: string;
  assignedEngineer: string;
  status: IncidentStatus;
  rootCause?: string;
  resolution?: string;
  resolvedAt?: string;
  timeline: {
    id: string;
    timestamp: string;
    author: string;
    message: string;
    actionType: string;
  }[];
  relatedAlertIds: string[];
}

export interface AuditLog {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  ipAddress: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  details: Record<string, any>;
}

export interface IntegrationConfig {
  id: string;
  orgId: string;
  type: 'REST' | 'MQTT' | 'KAFKA' | 'OPC_UA';
  name: string;
  endpoint: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONFIGURATION_REQUIRED';
  lastPing?: string;
  lastSync?: string;
  lastError?: string;
  latencyMs?: number;
  updatedAt?: string;
  enabled?: boolean;
  config: Record<string, any>;
  topicsOrNodes?: string[];
  credentialsRotatedAt?: string;
}

export interface ApiKey {
  id: string;
  orgId: string;
  name: string;
  prefix: string;
  hashedSecret: string;
  scopes: Permission[];
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  revoked: boolean;
}

export interface BackgroundJob {
  id: string;
  orgId: string;
  type: JobType;
  title: string;
  status: JobStatus;
  progressPct: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  errorMessage?: string;
  resultData?: Record<string, any>;
}
