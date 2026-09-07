/**
 * Semiconductor Intelligence Platform - Core Database & In-Memory Transactional Store
 * 
 * Provides thread-safe, multi-tenant isolated state management with indexed collections,
 * historical time-series buffers, alert engines, audit trails, and deterministic seeds.
 */

import {
  User,
  Organization,
  Site,
  Device,
  TelemetryReading,
  DigitalTwinState,
  MLModelRegistryEntry,
  DatasetRegistryEntry,
  BackgroundJob,
  ApiKey,
  IngestionHealthMetrics,
  WhatIfScenarioResult,
  Alert,
  Incident,
  AuditLog,
  IntegrationConfig,
  SimulationScenarioType
} from '../types/index.ts';
import { DigitalTwinEngine } from '../digitalTwin/digitalTwinEngine.ts';
import { globalIsolationForest, TelemetryFeatureVector } from '../ml/isolationForest.ts';
import { assessSemiconductorHealth } from '../ml/failurePrediction.ts';

export class EnterpriseDatabase {
  public organizations: Map<string, Organization> = new Map();
  public sites: Map<string, Site> = new Map();
  public users: Map<string, User> = new Map();
  public devices: Map<string, Device> = new Map();
  public telemetry: TelemetryReading[] = []; // Ingested time-series with device & org indexes
  public digitalTwins: Map<string, DigitalTwinState> = new Map(); // Key: deviceId
  public modelRegistry: Map<string, MLModelRegistryEntry> = new Map();
  public datasets: Map<string, DatasetRegistryEntry> = new Map();
  public backgroundJobs: Map<string, BackgroundJob> = new Map();
  public apiKeys: Map<string, ApiKey> = new Map();
  public whatIfScenarios: Map<string, WhatIfScenarioResult> = new Map();
  public alerts: Map<string, Alert> = new Map();
  public incidents: Map<string, Incident> = new Map();
  public auditLogs: AuditLog[] = [];
  public integrations: Map<string, IntegrationConfig> = new Map();
  
  // Scenario tracking per device for testing and physics validation
  public deviceScenarios: Map<string, SimulationScenarioType> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Seed Organizations
    const primaryOrg: Organization = {
      id: 'org-demo-01',
      name: 'Advanced Silicon Dynamics Corp',
      slug: 'advanced-silicon-dynamics',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      settings: {
        telemetryRetentionDays: 90,
        anomalyThreshold: 0.65,
        alertNotificationEmail: 'reliability-ops@silicondynamics.io',
        autoEscalateAlertsMinutes: 30
      }
    };

    const clientOrg: Organization = {
      id: 'org-client-02',
      name: 'Quantum Silicon Microelectronics Corp',
      slug: 'quantum-silicon',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      settings: {
        telemetryRetentionDays: 180,
        anomalyThreshold: 0.70,
        alertNotificationEmail: 'reliability@quantumsilicon.com',
        autoEscalateAlertsMinutes: 15
      }
    };

    this.organizations.set(primaryOrg.id, primaryOrg);
    this.organizations.set(clientOrg.id, clientOrg);

    // 2. Seed Sites
    const sitesList: Site[] = [
      {
        id: 'site-austin',
        orgId: primaryOrg.id,
        name: 'Fab 1 - Advanced Logic & Compute',
        code: 'FAB-AUS-01',
        location: 'Austin, Texas, USA (Cleanroom ISO 3)',
        timezone: 'America/Chicago',
        description: 'Advanced 4nm EUV foundry wafer test & system reliability lab',
        createdAt: new Date(Date.now() - 28 * 86400000).toISOString()
      },
      {
        id: 'site-dresden',
        orgId: primaryOrg.id,
        name: 'Fab 2 - Silicon & Power Hub',
        code: 'FAB-DRS-02',
        location: 'Dresden, Saxony, Germany',
        timezone: 'Europe/Berlin',
        description: 'High-voltage GaN/SiC power device and 3nm SoC endurance testing',
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
      },
      {
        id: 'site-hsinchu',
        orgId: primaryOrg.id,
        name: 'Fab 3 - 3D Heterogeneous Assembly',
        code: 'FAB-HSN-03',
        location: 'Hsinchu Science Park, Taiwan',
        timezone: 'Asia/Taipei',
        description: 'Co-packaged optics (CPO) and HBM3e 2.5D/3D interposer integration facility',
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
      },
      {
        id: 'site-client-1',
        orgId: clientOrg.id,
        name: 'Fab Alpha - Quantum Foundry',
        code: 'FAB-QL-01',
        location: 'San Jose, California, USA',
        timezone: 'America/Los_Angeles',
        description: 'Client production fab line',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
      }
    ];

    for (const site of sitesList) {
      this.sites.set(site.id, site);
    }

    // 3. Seed Users with RBAC
    const usersList: User[] = [
      {
        id: 'usr-001',
        orgId: primaryOrg.id,
        name: 'Dr. Elena Vance (Lead Reliability Engineer)',
        email: 'elena.vance@silicondynamics.io',
        role: 'SUPER_ADMIN',
        isActive: true,
        lastLogin: new Date(Date.now() - 300000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'usr-002',
        orgId: primaryOrg.id,
        name: 'Marcus Chen (MLOps & Platform Engineer)',
        email: 'marcus.chen@silicondynamics.io',
        role: 'ADMIN',
        isActive: true,
        lastLogin: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
      },
      {
        id: 'usr-003',
        orgId: primaryOrg.id,
        name: 'Sarah Lindqvist (Device Physicist)',
        email: 'sarah.l@silicondynamics.io',
        role: 'ENGINEER',
        isActive: true,
        lastLogin: new Date(Date.now() - 7200000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
      },
      {
        id: 'usr-004',
        orgId: primaryOrg.id,
        name: 'Devin Patel (Yield & Telemetry Analyst)',
        email: 'devin.patel@silicondynamics.io',
        role: 'ANALYST',
        isActive: true,
        lastLogin: new Date(Date.now() - 14400000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
      },
      {
        id: 'usr-005',
        orgId: primaryOrg.id,
        name: 'Tanya Morales (Cleanroom Floor Operator)',
        email: 'tanya.m@silicondynamics.io',
        role: 'OPERATOR',
        isActive: true,
        lastLogin: new Date(Date.now() - 1800000).toISOString(),
        createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
      },
      {
        id: 'usr-006',
        orgId: primaryOrg.id,
        name: 'Auditor Guest',
        email: 'auditor@silicondynamics.io',
        role: 'VIEWER',
        isActive: true,
        lastLogin: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
      }
    ];

    for (const u of usersList) {
      this.users.set(u.id, u);
    }

    // 4. Seed Devices
    const devicesList: Device[] = [
      {
        id: 'ST-001',
        orgId: primaryOrg.id,
        siteId: 'site-austin',
        siteName: 'Fab 1 - Advanced Logic & Compute',
        name: 'Titan-4N Neural Accelerator',
        type: 'AI ASIC Accelerator',
        manufacturer: 'Silicon Dynamics Technologies',
        model: 'TN-4000-EUV',
        serialNumber: 'SN-4N-88219-01',
        hardwareVersion: 'HW-Rev4.2',
        status: 'ONLINE',
        firmwareVersion: 'v3.2.14-rt',
        lastCommunication: new Date().toISOString(),
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        mode: 'LIVE',
        operatingProfile: {
          nominalVoltageV: 0.82,
          nominalFrequencyMHz: 2400,
          maxJunctionTempC: 95.0,
          thermalResistanceC_W: 0.38,
          nominalPowerW: 42.0,
          coolingType: 'LIQUID_CLOSED_LOOP',
          dieProcessNm: 4
        }
      },
      {
        id: 'ST-002',
        orgId: primaryOrg.id,
        siteId: 'site-dresden',
        siteName: 'Fab 2 - Silicon & Power Hub',
        name: 'Helios-3X High-Power Server SoC',
        type: 'Multi-Core Server SoC',
        manufacturer: 'Helios Silicon Labs',
        model: 'HL-3000X-GAA',
        serialNumber: 'SN-3X-11048-02',
        hardwareVersion: 'HW-Rev3.1',
        status: 'WARNING',
        firmwareVersion: 'v2.8.0-hotfix',
        lastCommunication: new Date().toISOString(),
        createdAt: new Date(Date.now() - 24 * 86400000).toISOString(),
        mode: 'LIVE',
        operatingProfile: {
          nominalVoltageV: 0.88,
          nominalFrequencyMHz: 3200,
          maxJunctionTempC: 100.0,
          thermalResistanceC_W: 0.48,
          nominalPowerW: 65.0,
          coolingType: 'AIR_FORCED',
          dieProcessNm: 3
        }
      },
      {
        id: 'ST-003',
        orgId: primaryOrg.id,
        siteId: 'site-dresden',
        siteName: 'Fab 2 - Silicon & Power Hub',
        name: 'GaN-PowerFET 650V Switching Module',
        type: 'Wide Bandgap Power FET',
        manufacturer: 'PowerSemi Microdevices',
        model: 'GP-650-HV3',
        serialNumber: 'SN-GAN-99302-03',
        hardwareVersion: 'HW-Rev1.0',
        status: 'ONLINE',
        firmwareVersion: 'v1.1.8-firm',
        lastCommunication: new Date().toISOString(),
        createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
        mode: 'LIVE',
        operatingProfile: {
          nominalVoltageV: 12.0,
          nominalFrequencyMHz: 500,
          maxJunctionTempC: 150.0,
          thermalResistanceC_W: 0.85,
          nominalPowerW: 85.0,
          coolingType: 'IMMERSION',
          dieProcessNm: 180
        }
      },
      {
        id: 'ST-004',
        orgId: primaryOrg.id,
        siteId: 'site-hsinchu',
        siteName: 'Fab 3 - 3D Heterogeneous Assembly',
        name: 'OptiCore 800G CPO Optical Transceiver',
        type: 'Photonic Interconnect CPO',
        manufacturer: 'OptiPhotonics Integrated',
        model: 'OC-800-CPO-GEN2',
        serialNumber: 'SN-CPO-44810-04',
        hardwareVersion: 'HW-Rev2.4',
        status: 'CRITICAL',
        firmwareVersion: 'v4.0.2',
        lastCommunication: new Date().toISOString(),
        createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
        mode: 'LIVE',
        operatingProfile: {
          nominalVoltageV: 1.10,
          nominalFrequencyMHz: 1800,
          maxJunctionTempC: 85.0,
          thermalResistanceC_W: 0.62,
          nominalPowerW: 28.0,
          coolingType: 'AIR_FORCED',
          dieProcessNm: 7
        }
      },
      {
        id: 'ST-005',
        orgId: primaryOrg.id,
        siteId: 'site-hsinchu',
        siteName: 'Fab 3 - 3D Heterogeneous Assembly',
        name: 'HBM3e 24GB PHY Interposer Module',
        type: 'High Bandwidth Memory PHY',
        manufacturer: 'AeroMemory Corp',
        model: 'HB-3E-PHY-24G',
        serialNumber: 'SN-HBM-77190-05',
        hardwareVersion: 'HW-Rev3.0',
        status: 'ONLINE',
        firmwareVersion: 'v2.1.0-std',
        lastCommunication: new Date().toISOString(),
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        mode: 'LIVE',
        operatingProfile: {
          nominalVoltageV: 1.10,
          nominalFrequencyMHz: 4800,
          maxJunctionTempC: 95.0,
          thermalResistanceC_W: 0.42,
          nominalPowerW: 32.0,
          coolingType: 'LIQUID_CLOSED_LOOP',
          dieProcessNm: 5
        }
      }
    ];

    this.deviceScenarios.set('ST-001', 'NORMAL');
    this.deviceScenarios.set('ST-002', 'THERMAL_STRESS');
    this.deviceScenarios.set('ST-003', 'HIGH_WORKLOAD');
    this.deviceScenarios.set('ST-004', 'COOLING_DEGRADATION');
    this.deviceScenarios.set('ST-005', 'NORMAL');

    for (const dev of devicesList) {
      this.devices.set(dev.id, dev);
    }

    // 5. Seed Historical Telemetry (30 data points per device over past 60 minutes)
    const now = Date.now();
    for (const dev of devicesList) {
      const scenario = this.deviceScenarios.get(dev.id) || 'NORMAL';
      
      for (let i = 30; i >= 0; i--) {
        const timeOffset = now - i * 60000;
        const reading = this.generateSyntheticTelemetry(dev, scenario, timeOffset);
        this.telemetry.push(reading);
        
        // Update device digital twin on the latest point
        if (i === 0) {
          const dtState = DigitalTwinEngine.computeState(dev, reading);
          this.digitalTwins.set(dev.id, dtState);
          
          dev.currentMetrics = {
            healthScore: dtState.healthScore,
            riskLevel: dtState.riskLevel,
            anomalyScore: reading.anomalyScore || 0.1,
            failureProbability: reading.failureProbability || 0.02,
            temperatureC: reading.temperatureC,
            voltageV: reading.voltageV,
            currentA: reading.currentA,
            powerW: reading.powerW,
            frequencyMHz: reading.frequencyMHz,
            utilizationPct: reading.utilizationPct,
            fanSpeedRpm: reading.fanSpeedRpm,
            errorCount: reading.errorCount
          };
        }
      }
    }

    // 6. Seed Datasets
    const datasetsList: DatasetRegistryEntry[] = [
      {
        id: 'DS-WAFER-01',
        orgId: primaryOrg.id,
        name: 'WaferTest-4N-EUV-Telemetry',
        version: 'v2.1.0',
        description: '4nm EUV foundry wafer test dataset containing 120,000 multi-sensor vectors across nominal and stressed states.',
        rowCount: 120000,
        featureCount: 9,
        format: 'CSV',
        validationStatus: 'VALIDATED',
        uploadedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        uploadedBy: 'Dr. Elena Vance',
        checksum: 'sha256:8f9a2b1c4e6d3f0a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a'
      },
      {
        id: 'DS-HTOL-02',
        orgId: primaryOrg.id,
        name: 'HTOL-HighTempOperatingLife-Run98',
        version: 'v1.4.0',
        description: 'Accelerated life test log with 8,500 stress intervals for Arrhenius & TDDB failure prediction.',
        rowCount: 8500,
        featureCount: 12,
        format: 'PARQUET',
        validationStatus: 'VALIDATED',
        uploadedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        uploadedBy: 'Sarah Lindqvist',
        checksum: 'sha256:3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b'
      },
      {
        id: 'DS-HBM-03',
        orgId: primaryOrg.id,
        name: 'HBM3e-3D-Stack-Thermal-Mesh',
        version: 'v3.0-spatial',
        description: 'High-density micro-bump and thermal gradient spatial matrix dataset for 3D packaging autoencoder.',
        rowCount: 45000,
        featureCount: 16,
        format: 'CSV',
        validationStatus: 'VALIDATED',
        uploadedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        uploadedBy: 'Marcus Chen',
        checksum: 'sha256:1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f'
      }
    ];

    for (const ds of datasetsList) {
      this.datasets.set(ds.id, ds);
    }

    // 7. Seed Model Registry
    const modelsList: MLModelRegistryEntry[] = [
      {
        id: 'MOD-IF-01',
        orgId: primaryOrg.id,
        name: 'Semiconductor Isolation Forest Anomaly Engine',
        version: 'v1.4.2-prod',
        type: 'ISOLATION_FOREST',
        algorithm: 'Multidimensional Isolation Forest (50 iTrees, Subsample 64)',
        trainingDataset: 'WaferTest-4N-Telemetry-2026Q2 (120,000 vectors)',
        datasetVersion: 'v2.1.0',
        featureVersion: 'v2.1 (9-dimensional sensor vector)',
        trainingTimestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
        metrics: {
          precision: 0.942,
          recall: 0.968,
          f1Score: 0.955,
          rocAuc: 0.982,
          meanInferenceLatencyMs: 0.42
        },
        status: 'PRODUCTION',
        createdBy: 'Dr. Elena Vance',
        description: 'Primary streaming anomaly detector for on-die temperature, voltage sag, and clock jitter vectors.'
      },
      {
        id: 'MOD-RF-02',
        orgId: primaryOrg.id,
        name: 'Arrhenius-TDDB Reliability & Failure Predictor',
        version: 'v2.1.0-prod',
        type: 'ARRHENIUS_WEIBULL',
        algorithm: 'Physics-Informed Supervised Logistic Regression & Arrhenius Acceleration',
        trainingDataset: 'HTOL-HighTempOperatingLife-Run98 (8,500 stress test logs)',
        datasetVersion: 'v1.4.0',
        featureVersion: 'v2.0 (Thermal-Voltage interaction cross-terms)',
        trainingTimestamp: new Date(Date.now() - 12 * 86400000).toISOString(),
        metrics: {
          precision: 0.915,
          recall: 0.938,
          f1Score: 0.926,
          rocAuc: 0.961,
          meanInferenceLatencyMs: 0.78
        },
        status: 'PRODUCTION',
        createdBy: 'Sarah Lindqvist',
        description: 'Computes 30-day failure probability, Remaining Useful Life (RUL), and top risk contributors.'
      },
      {
        id: 'MOD-AE-03',
        orgId: primaryOrg.id,
        name: 'Multi-Die Thermal Cross-Coupling Autoencoder',
        version: 'v0.9.1-candidate',
        type: 'AUTOENCODER',
        algorithm: 'Deep Convolutional 1D Autoencoder for 3D Interposer Hotspot Detection',
        trainingDataset: 'HBM3e-3D-Stack-Thermal-Mesh (45,000 temporal matrices)',
        datasetVersion: 'v3.0-spatial',
        featureVersion: 'v3.0-spatial',
        trainingTimestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        metrics: {
          precision: 0.884,
          recall: 0.902,
          f1Score: 0.893,
          rocAuc: 0.934,
          meanInferenceLatencyMs: 2.15
        },
        status: 'STAGED',
        createdBy: 'Marcus Chen',
        description: 'Experimental spatial thermal reconstruction network for 3D packaging.'
      },
      {
        id: 'MOD-LEG-01',
        orgId: primaryOrg.id,
        name: 'Static Rule-Based Threshold Engine (Legacy)',
        version: 'v1.0.0-legacy',
        type: 'ARRHENIUS_WEIBULL',
        algorithm: 'Hardcoded Sigma Range Bounds',
        trainingDataset: 'Static Datasheet Tolerances',
        datasetVersion: 'v1.0.0',
        featureVersion: 'v1.0-scalar',
        trainingTimestamp: new Date(Date.now() - 90 * 86400000).toISOString(),
        metrics: {
          precision: 0.720,
          recall: 0.680,
          f1Score: 0.700,
          rocAuc: 0.750,
          meanInferenceLatencyMs: 0.08
        },
        status: 'ARCHIVED',
        createdBy: 'System Init',
        description: 'Deprecated static threshold model replaced by Isolation Forest ML.'
      }
    ];

    for (const m of modelsList) {
      this.modelRegistry.set(m.id, m);
    }

    // 8. Seed Alerts
    const alertsList: Alert[] = [
      {
        id: 'ALT-1001',
        orgId: primaryOrg.id,
        deviceId: 'ST-004',
        deviceName: 'OptiCore 800G CPO Optical Transceiver',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        severity: 'CRITICAL',
        condition: 'Cooling Efficiency Critical Drop & Thermal Rise',
        currentValue: 'Cooling: 64.2% | Tj: 88.4°C',
        expectedValue: 'Cooling >= 85% | Tj <= 80.0°C',
        status: 'OPEN'
      },
      {
        id: 'ALT-1002',
        orgId: primaryOrg.id,
        deviceId: 'ST-002',
        deviceName: 'Helios-3X High-Power Server SoC',
        timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
        severity: 'WARNING',
        condition: 'Sustained High Die Temperature',
        currentValue: 'Tj: 89.2°C (Arrhenius AF: 4.8x)',
        expectedValue: 'Tj <= 85.0°C',
        status: 'ACKNOWLEDGED',
        acknowledgedBy: 'Dr. Elena Vance',
        acknowledgedAt: new Date(Date.now() - 35 * 60000).toISOString()
      },
      {
        id: 'ALT-1003',
        orgId: primaryOrg.id,
        deviceId: 'ST-004',
        deviceName: 'OptiCore 800G CPO Optical Transceiver',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        severity: 'CRITICAL',
        condition: 'Isolation Forest Anomaly Score Spike',
        currentValue: 'Score: 0.884 (Threshold: 0.65)',
        expectedValue: 'Score < 0.50',
        status: 'OPEN'
      },
      {
        id: 'ALT-1004',
        orgId: primaryOrg.id,
        deviceId: 'ST-001',
        deviceName: 'Titan-4N Neural Accelerator',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        severity: 'INFO',
        condition: 'Workload State Shift to 85%',
        currentValue: 'Util: 84.8% | Power: 46.2W',
        expectedValue: 'Util <= 95%',
        status: 'RESOLVED',
        acknowledgedBy: 'Tanya Morales',
        acknowledgedAt: new Date(Date.now() - 110 * 60000).toISOString(),
        resolvedBy: 'Tanya Morales',
        resolvedAt: new Date(Date.now() - 95 * 60000).toISOString()
      }
    ];

    for (const a of alertsList) {
      this.alerts.set(a.id, a);
    }

    // 9. Seed Incidents
    const incidentsList: Incident[] = [
      {
        id: 'INC-2026-01',
        orgId: primaryOrg.id,
        title: 'Thermal Throttling & Transceiver Degradation in Cleanroom Fab 3',
        deviceId: 'ST-004',
        deviceName: 'OptiCore 800G CPO Optical Transceiver',
        severity: 'CRITICAL',
        description: 'Cooling loop efficiency dropped to 64%, inducing junction temperature runaway up to 88.4°C and high Isolation Forest anomaly scores.',
        detectedTime: new Date(Date.now() - 25 * 60000).toISOString(),
        assignedEngineer: 'Sarah Lindqvist',
        status: 'INVESTIGATING',
        timeline: [
          {
            id: 'tml-1',
            timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
            author: 'Alert Engine',
            message: 'Incident auto-created from critical alert ALT-1001',
            actionType: 'TRIGGER'
          },
          {
            id: 'tml-2',
            timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
            author: 'Dr. Elena Vance',
            message: 'Assigned Sarah Lindqvist for cleanroom cooling loop inspection.',
            actionType: 'ASSIGN'
          },
          {
            id: 'tml-3',
            timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
            author: 'Sarah Lindqvist',
            message: 'Airflow filter backpressure measured at 1.4 Bar. Recommended fan module swap.',
            actionType: 'NOTE'
          }
        ],
        relatedAlertIds: ['ALT-1001', 'ALT-1003']
      }
    ];

    for (const inc of incidentsList) {
      this.incidents.set(inc.id, inc);
    }

    // 10. Seed Integrations
    const integrationsList: IntegrationConfig[] = [
      {
        id: 'INT-REST-01',
        orgId: primaryOrg.id,
        type: 'REST',
        name: 'High-Throughput REST Ingestion Gateway',
        endpoint: 'http://localhost:3000/api/v1/telemetry',
        status: 'CONNECTED',
        lastPing: new Date().toISOString(),
        config: {
          authHeader: 'Bearer API_KEY',
          rateLimitRps: 500,
          batchSupported: true
        }
      },
      {
        id: 'INT-MQTT-02',
        orgId: primaryOrg.id,
        type: 'MQTT',
        name: 'Fab Floor MQTT Broker',
        endpoint: 'mqtt://industrial-broker.local:1883',
        status: 'CONFIGURATION_REQUIRED',
        config: {
          clientId: 'semi-intel-gateway-01',
          qos: 1,
          tlsEnabled: true
        },
        topicsOrNodes: ['fab/austin/telemetry/#', 'fab/dresden/power/#', 'fab/hsinchu/thermal/#']
      },
      {
        id: 'INT-KAFKA-03',
        orgId: primaryOrg.id,
        type: 'KAFKA',
        name: 'Enterprise Telemetry Event Bus',
        endpoint: 'kafka-cluster-1.internal:9092,kafka-cluster-2.internal:9092',
        status: 'CONFIGURATION_REQUIRED',
        config: {
          groupId: 'semiconductor-analytics-consumers',
          partitions: 8,
          compression: 'lz4'
        },
        topicsOrNodes: ['semi.telemetry.raw', 'semi.telemetry.anomalies', 'semi.alerts']
      },
      {
        id: 'INT-OPCUA-04',
        orgId: primaryOrg.id,
        type: 'OPC_UA',
        name: 'Cleanroom SCADA OPC-UA Server',
        endpoint: 'opc.tcp://opcua-server.fab-austin.local:4840',
        status: 'CONFIGURATION_REQUIRED',
        config: {
          securityMode: 'SignAndEncrypt',
          securityPolicy: 'Basic256Sha256'
        },
        topicsOrNodes: ['ns=2;s=Fab1.Chamber4.WaferChuckTemp', 'ns=2;s=Fab1.GasChamber.Pressure']
      }
    ];

    for (const integ of integrationsList) {
      this.integrations.set(integ.id, integ);
    }

    // 11. Seed Initial Audit Logs
    this.recordAudit({
      orgId: primaryOrg.id,
      userId: 'usr-001',
      userName: 'Dr. Elena Vance',
      userRole: 'SUPER_ADMIN',
      action: 'SYSTEM_BOOTSTRAP',
      targetType: 'SYSTEM',
      targetId: 'SYS-INIT',
      ipAddress: '127.0.0.1',
      result: 'SUCCESS',
      details: { environment: 'Enterprise Cloud Ingress', initializedDevices: 5 }
    });
  }

  /**
   * Generates realistic physics-correlated synthetic telemetry based on scenario
   */
  public generateSyntheticTelemetry(
    device: Device, 
    scenario: SimulationScenarioType, 
    timestampMs: number = Date.now()
  ): TelemetryReading {
    const p = device.operatingProfile || {
      nominalVoltageV: 0.85,
      nominalFrequencyMHz: 2400,
      maxJunctionTempC: 95.0,
      thermalResistanceC_W: 0.45,
      nominalPowerW: 45.0,
      coolingType: 'AIR_FORCED',
      dieProcessNm: 4
    };

    let util = 60 + Math.sin(timestampMs / 60000) * 15;
    let volt = p.nominalVoltageV;
    let cooling = 95;
    let errors = 0;

    switch (scenario) {
      case 'NORMAL':
        util = 50 + Math.sin(timestampMs / 120000) * 20;
        volt = p.nominalVoltageV + (Math.random() - 0.5) * 0.01;
        cooling = 95 + (Math.random() - 0.5) * 2;
        errors = Math.random() > 0.98 ? 1 : 0;
        break;
      case 'THERMAL_STRESS':
        util = 88 + Math.random() * 8;
        volt = p.nominalVoltageV + 0.04;
        cooling = 72 + Math.random() * 4;
        errors = Math.floor(Math.random() * 3);
        break;
      case 'VOLTAGE_INSTABILITY':
        util = 70 + Math.random() * 15;
        volt = p.nominalVoltageV + Math.sin(timestampMs / 15000) * 0.08;
        cooling = 90;
        errors = Math.floor(1 + Math.random() * 4);
        break;
      case 'HIGH_WORKLOAD':
        util = 96 + Math.random() * 3.5;
        volt = p.nominalVoltageV + 0.015;
        cooling = 92;
        errors = Math.random() > 0.95 ? 1 : 0;
        break;
      case 'COOLING_DEGRADATION':
        util = 75 + Math.random() * 10;
        volt = p.nominalVoltageV;
        cooling = 62 + Math.random() * 5;
        errors = Math.floor(2 + Math.random() * 3);
        break;
      case 'POWER_ANOMALY':
        util = 82 + Math.random() * 12;
        volt = p.nominalVoltageV + 0.065;
        cooling = 80;
        errors = Math.floor(3 + Math.random() * 5);
        break;
      case 'MIXED_FAILURE':
        util = 95 + Math.random() * 4;
        volt = p.nominalVoltageV + 0.09;
        cooling = 55 + Math.random() * 8;
        errors = Math.floor(5 + Math.random() * 6);
        break;
    }

    util = Math.max(5, Math.min(100, util));
    const freq = p.nominalFrequencyMHz * (0.85 + (util / 100) * 0.18) + (Math.random() - 0.5) * 20;
    const current = (p.nominalPowerW / p.nominalVoltageV) * (0.3 + (util / 100) * 0.75) * (volt / p.nominalVoltageV);
    const power = volt * current;
    
    const effectiveTheta = p.thermalResistanceC_W * (100 / Math.max(30, cooling));
    const ambientTemp = 24.0 + Math.sin(timestampMs / 300000) * 1.5;
    const temp = ambientTemp + (power * effectiveTheta) + (Math.random() - 0.5) * 1.5;
    const fan = Math.max(1200, Math.min(6500, 2400 + (temp / 90) * 2800 + (Math.random() - 0.5) * 100));

    const vector: TelemetryFeatureVector = {
      temperatureC: Math.round(temp * 10) / 10,
      voltageV: Math.round(volt * 1000) / 1000,
      currentA: Math.round(current * 10) / 10,
      powerW: Math.round(power * 10) / 10,
      frequencyMHz: Math.round(freq),
      utilizationPct: Math.round(util * 10) / 10,
      fanSpeedRpm: Math.round(fan),
      errorCount: errors,
      coolingEfficiencyPct: Math.round(cooling * 10) / 10
    };

    const anomalyScore = Math.round(globalIsolationForest.score(vector) * 1000) / 1000;
    const healthResult = assessSemiconductorHealth(vector, p);

    return {
      id: `tel-${device.id}-${timestampMs}`,
      orgId: device.orgId,
      deviceId: device.id,
      timestamp: new Date(timestampMs).toISOString(),
      mode: device.mode,
      temperatureC: vector.temperatureC,
      voltageV: vector.voltageV,
      currentA: vector.currentA,
      powerW: vector.powerW,
      frequencyMHz: vector.frequencyMHz,
      utilizationPct: vector.utilizationPct,
      fanSpeedRpm: vector.fanSpeedRpm,
      coolingEfficiencyPct: vector.coolingEfficiencyPct,
      pressureBar: 1.013,
      errorCount: vector.errorCount,
      operatingCycles: Math.floor(timestampMs / 1000),
      sensorStatus: temp > 95 || errors > 4 ? 'FAULT' : cooling < 75 ? 'DEGRADED' : 'OK',
      anomalyScore,
      isAnomaly: anomalyScore > 0.65,
      healthScore: healthResult.healthScore,
      failureProbability: healthResult.failureProbability
    };
  }

  /**
   * Ingests a new telemetry reading, updates the Digital Twin, evaluates alerts, and logs anomaly events
   */
  public ingestTelemetry(reading: TelemetryReading, orgId: string): { reading: TelemetryReading; alertCreated?: Alert } {
    const device = this.devices.get(reading.deviceId);
    if (!device || device.orgId !== orgId) {
      throw new Error(`Device ${reading.deviceId} does not exist in organization ${orgId}`);
    }

    // Assign verified server timestamp if missing
    if (!reading.timestamp) {
      reading.timestamp = new Date().toISOString();
    }
    if (!reading.id) {
      reading.id = `tel-${reading.deviceId}-${Date.now()}`;
    }
    reading.orgId = orgId;

    // Feature vector for ML
    const vector: TelemetryFeatureVector = {
      temperatureC: reading.temperatureC,
      voltageV: reading.voltageV,
      currentA: reading.currentA,
      powerW: reading.powerW,
      frequencyMHz: reading.frequencyMHz,
      utilizationPct: reading.utilizationPct,
      fanSpeedRpm: reading.fanSpeedRpm,
      errorCount: reading.errorCount || 0,
      coolingEfficiencyPct: reading.coolingEfficiencyPct || 95
    };

    const anomalyScore = Math.round(globalIsolationForest.score(vector) * 1000) / 1000;
    const healthResult = assessSemiconductorHealth(vector, device.operatingProfile);

    reading.anomalyScore = anomalyScore;
    reading.isAnomaly = anomalyScore > 0.65;
    reading.healthScore = healthResult.healthScore;
    reading.failureProbability = healthResult.failureProbability;

    // Store in time-series buffer (maintain last 10,000 readings in memory)
    this.telemetry.push(reading);
    if (this.telemetry.length > 10000) {
      this.telemetry.splice(0, this.telemetry.length - 10000);
    }

    // Update Digital Twin state
    const dtState = DigitalTwinEngine.computeState(device, reading);
    this.digitalTwins.set(device.id, dtState);

    // Update Device current metrics
    device.lastCommunication = reading.timestamp;
    device.currentMetrics = {
      healthScore: dtState.healthScore,
      riskLevel: dtState.riskLevel,
      anomalyScore: reading.anomalyScore,
      failureProbability: reading.failureProbability,
      temperatureC: reading.temperatureC,
      voltageV: reading.voltageV,
      currentA: reading.currentA,
      powerW: reading.powerW,
      frequencyMHz: reading.frequencyMHz,
      utilizationPct: reading.utilizationPct,
      fanSpeedRpm: reading.fanSpeedRpm,
      errorCount: reading.errorCount
    };

    // Update device status based on health
    if (healthResult.healthScore < 40 || reading.temperatureC > 95) {
      device.status = 'CRITICAL';
    } else if (healthResult.healthScore < 70 || reading.temperatureC > 85 || reading.anomalyScore > 0.65) {
      device.status = 'WARNING';
    } else {
      device.status = 'ONLINE';
    }

    // Alert engine evaluation
    let newAlert: Alert | undefined;
    if (reading.temperatureC > 90) {
      newAlert = this.createAlert({
        orgId,
        deviceId: device.id,
        deviceName: device.name,
        severity: reading.temperatureC > 95 ? 'FATAL' : 'CRITICAL',
        condition: 'High Junction Temperature Exceeded Limit',
        currentValue: `${reading.temperatureC.toFixed(1)}°C`,
        expectedValue: `<= ${device.operatingProfile.maxJunctionTempC}°C`
      });
    } else if (reading.anomalyScore > 0.75) {
      newAlert = this.createAlert({
        orgId,
        deviceId: device.id,
        deviceName: device.name,
        severity: 'WARNING',
        condition: 'Isolation Forest Anomaly Confidence Alert',
        currentValue: `Score: ${reading.anomalyScore.toFixed(3)}`,
        expectedValue: `Score <= 0.65`
      });
    }

    return { reading, alertCreated: newAlert };
  }

  public createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'status'>): Alert {
    const id = `ALT-${Date.now().toString().slice(-6)}`;
    const alert: Alert = {
      id,
      ...alertData,
      timestamp: new Date().toISOString(),
      status: 'OPEN'
    };
    this.alerts.set(id, alert);
    return alert;
  }

  public recordAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.auditLogs.unshift(log);
    // Keep max 2,000 logs in memory
    if (this.auditLogs.length > 2000) {
      this.auditLogs.pop();
    }
    return log;
  }
}

export const db = new EnterpriseDatabase();
