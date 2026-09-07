/**
 * Local Fallback Data Store
 */

import {
  Organization,
  Site,
  User,
  Device,
  TelemetryReading,
  Alert,
  Incident,
  AuditLog,
  SimulationScenarioType
} from '../types/index.ts';

export class LocalSimulationStore {
  public org: Organization = {
    id: 'org-demo-01',
    name: 'Advanced Silicon Dynamics',
    slug: 'advanced-silicon-dynamics',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    settings: {
      telemetryRetentionDays: 90,
      anomalyThreshold: 0.65,
      alertNotificationEmail: 'ops-alerts@silicondynamics.io',
      autoEscalateAlertsMinutes: 30
    }
  };

  public sites: Site[] = [
    {
      id: 'site-austin',
      orgId: 'org-demo-01',
      name: 'Fab 1 - Advanced Logic & Compute',
      code: 'FAB-AUS-01',
      location: 'Austin, TX, USA',
      timezone: 'America/Chicago',
      description: 'Advanced logic EUV sub-5nm fabrication facility',
      createdAt: new Date(Date.now() - 365 * 86400000).toISOString()
    },
    {
      id: 'site-dresden',
      orgId: 'org-demo-01',
      name: 'Fab 2 - Silicon & Power Hub',
      code: 'FAB-DRE-02',
      location: 'Dresden, Saxony, Germany',
      timezone: 'Europe/Berlin',
      description: 'Power GaN & high-voltage silicon specialty fab',
      createdAt: new Date(Date.now() - 300 * 86400000).toISOString()
    },
    {
      id: 'site-hsinchu',
      orgId: 'org-demo-01',
      name: 'Fab 3 - 3D Heterogeneous Assembly',
      code: 'FAB-HSN-03',
      location: 'Hsinchu Science Park, Taiwan',
      timezone: 'Asia/Taipei',
      description: 'Advanced 3D Chiplet & CoWoS packaging facility',
      createdAt: new Date(Date.now() - 200 * 86400000).toISOString()
    }
  ];

  public users: User[] = [
    {
      id: 'usr-001',
      orgId: 'org-demo-01',
      name: 'Dr. Elena Vance',
      email: 'elena.vance@silicondynamics.io',
      role: 'SUPER_ADMIN',
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date(Date.now() - 180 * 86400000).toISOString()
    },
    {
      id: 'usr-002',
      orgId: 'org-demo-01',
      name: 'Marcus Chen',
      email: 'marcus.chen@silicondynamics.io',
      role: 'ADMIN',
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date(Date.now() - 150 * 86400000).toISOString()
    },
    {
      id: 'usr-003',
      orgId: 'org-demo-01',
      name: 'Sarah Lindqvist',
      email: 'sarah.l@silicondynamics.io',
      role: 'ENGINEER',
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date(Date.now() - 120 * 86400000).toISOString()
    }
  ];

  public devices: (Device & { activeScenario?: SimulationScenarioType })[] = [
    {
      id: 'ST-001',
      orgId: 'org-demo-01',
      siteId: 'site-austin',
      siteName: 'Fab 1 - Advanced Logic & Compute',
      name: 'Titan-4N Neural Accelerator',
      type: 'AI ASIC Accelerator',
      model: 'TN-4000-EUV',
      manufacturer: 'Silicon Dynamics Technologies',
      serialNumber: 'SN-4N-88219-01',
      status: 'ONLINE',
      firmwareVersion: 'v3.2.14-rt',
      lastCommunication: new Date().toISOString(),
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      mode: 'SIMULATION',
      operatingProfile: {
        nominalVoltageV: 0.82,
        nominalFrequencyMHz: 2400,
        maxJunctionTempC: 95,
        thermalResistanceC_W: 0.38,
        nominalPowerW: 42,
        coolingType: 'LIQUID_CLOSED_LOOP',
        dieProcessNm: 4
      },
      currentMetrics: {
        healthScore: 98,
        riskLevel: 'LOW',
        anomalyScore: 0.54,
        failureProbability: 0.12,
        temperatureC: 34.5,
        voltageV: 0.82,
        currentA: 38.0,
        powerW: 31.1,
        frequencyMHz: 2400,
        utilizationPct: 62.0,
        fanSpeedRpm: 3400,
        errorCount: 0
      },
      activeScenario: 'NORMAL'
    },
    {
      id: 'ST-002',
      orgId: 'org-demo-01',
      siteId: 'site-dresden',
      siteName: 'Fab 2 - Silicon & Power Hub',
      name: 'Helios-3X High-Power Server SoC',
      type: 'Multi-Core Server SoC',
      model: 'HL-3000X-GAA',
      manufacturer: 'Silicon Dynamics Technologies',
      serialNumber: 'SN-3X-11048-02',
      status: 'WARNING',
      firmwareVersion: 'v2.8.0-hotfix',
      lastCommunication: new Date().toISOString(),
      createdAt: new Date(Date.now() - 24 * 86400000).toISOString(),
      mode: 'SIMULATION',
      operatingProfile: {
        nominalVoltageV: 0.88,
        nominalFrequencyMHz: 3200,
        maxJunctionTempC: 100,
        thermalResistanceC_W: 0.48,
        nominalPowerW: 65,
        coolingType: 'AIR_FORCED',
        dieProcessNm: 3
      },
      currentMetrics: {
        healthScore: 76,
        riskLevel: 'HIGH',
        anomalyScore: 0.61,
        failureProbability: 0.42,
        temperatureC: 68.2,
        voltageV: 0.92,
        currentA: 74.0,
        powerW: 68.0,
        frequencyMHz: 3200,
        utilizationPct: 88.0,
        fanSpeedRpm: 4500,
        errorCount: 0
      },
      activeScenario: 'THERMAL_STRESS'
    },
    {
      id: 'ST-003',
      orgId: 'org-demo-01',
      siteId: 'site-dresden',
      siteName: 'Fab 2 - Silicon & Power Hub',
      name: 'GaN-PowerFET 650V Switching Module',
      type: 'Wide Bandgap Power FET',
      model: 'GP-650-HV3',
      manufacturer: 'Silicon Dynamics Technologies',
      serialNumber: 'SN-GAN-99302-03',
      status: 'ONLINE',
      firmwareVersion: 'v1.1.8-firm',
      lastCommunication: new Date().toISOString(),
      createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
      mode: 'SIMULATION',
      operatingProfile: {
        nominalVoltageV: 12.0,
        nominalFrequencyMHz: 500,
        maxJunctionTempC: 150,
        thermalResistanceC_W: 0.85,
        nominalPowerW: 85,
        coolingType: 'IMMERSION',
        dieProcessNm: 180
      },
      currentMetrics: {
        healthScore: 68,
        riskLevel: 'CRITICAL',
        anomalyScore: 0.62,
        failureProbability: 0.98,
        temperatureC: 104.5,
        voltageV: 12.02,
        currentA: 7.3,
        powerW: 87.5,
        frequencyMHz: 512,
        utilizationPct: 97.0,
        fanSpeedRpm: 5600,
        errorCount: 0
      },
      activeScenario: 'HIGH_WORKLOAD'
    },
    {
      id: 'ST-004',
      orgId: 'org-demo-01',
      siteId: 'site-hsinchu',
      siteName: 'Fab 3 - 3D Heterogeneous Assembly',
      name: 'OptiCore 800G CPO Optical Transceiver',
      type: 'Photonic Interconnect CPO',
      model: 'OC-800-CPO-GEN2',
      manufacturer: 'Silicon Dynamics Technologies',
      serialNumber: 'SN-CPO-44810-04',
      status: 'CRITICAL',
      firmwareVersion: 'v4.0.2',
      lastCommunication: new Date().toISOString(),
      createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      mode: 'SIMULATION',
      operatingProfile: {
        nominalVoltageV: 1.1,
        nominalFrequencyMHz: 1800,
        maxJunctionTempC: 85,
        thermalResistanceC_W: 0.62,
        nominalPowerW: 28,
        coolingType: 'AIR_FORCED',
        dieProcessNm: 7
      },
      currentMetrics: {
        healthScore: 91,
        riskLevel: 'HIGH',
        anomalyScore: 0.63,
        failureProbability: 0.67,
        temperatureC: 45.8,
        voltageV: 1.1,
        currentA: 22.4,
        powerW: 24.6,
        frequencyMHz: 1780,
        utilizationPct: 77.0,
        fanSpeedRpm: 3850,
        errorCount: 3
      },
      activeScenario: 'COOLING_DEGRADATION'
    },
    {
      id: 'ST-005',
      orgId: 'org-demo-01',
      siteId: 'site-hsinchu',
      siteName: 'Fab 3 - 3D Heterogeneous Assembly',
      name: 'HBM3e 24GB PHY Interposer Module',
      type: 'High Bandwidth Memory PHY',
      model: 'HB-3E-PHY-24G',
      manufacturer: 'Silicon Dynamics Technologies',
      serialNumber: 'SN-HBM-77190-05',
      status: 'ONLINE',
      firmwareVersion: 'v2.1.0-std',
      lastCommunication: new Date().toISOString(),
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      mode: 'SIMULATION',
      operatingProfile: {
        nominalVoltageV: 1.1,
        nominalFrequencyMHz: 4800,
        maxJunctionTempC: 95,
        thermalResistanceC_W: 0.42,
        nominalPowerW: 32,
        coolingType: 'LIQUID_CLOSED_LOOP',
        dieProcessNm: 5
      },
      currentMetrics: {
        healthScore: 96,
        riskLevel: 'LOW',
        anomalyScore: 0.56,
        failureProbability: 0.13,
        temperatureC: 33.5,
        voltageV: 1.1,
        currentA: 21.6,
        powerW: 23.8,
        frequencyMHz: 4580,
        utilizationPct: 59.0,
        fanSpeedRpm: 3450,
        errorCount: 0
      },
      activeScenario: 'NORMAL'
    }
  ];

  public telemetry: TelemetryReading[] = [];
  public alerts: Alert[] = [];
  public incidents: Incident[] = [];
  public auditLogs: AuditLog[] = [];

  constructor() {
    this.seedTelemetry();
    this.seedAlertsAndIncidents();
  }

  private seedTelemetry() {
    const now = Date.now();
    for (let i = 40; i >= 0; i--) {
      const ts = new Date(now - i * 3000).toISOString();
      for (const dev of this.devices) {
        const tempBase = dev.id === 'ST-003' ? 95 : dev.id === 'ST-002' ? 65 : 35;
        const temp = tempBase + Math.sin(i * 0.3) * 3 + (Math.random() - 0.5) * 1.5;
        const volt = dev.operatingProfile.nominalVoltageV + (Math.random() - 0.5) * 0.02;
        const pwr = dev.operatingProfile.nominalPowerW * (0.8 + (dev.currentMetrics?.utilizationPct || 60) / 300);

        this.telemetry.push({
          id: `tel-${dev.id}-${now - i * 3000}`,
          orgId: 'org-demo-01',
          deviceId: dev.id,
          timestamp: ts,
          mode: 'LIVE',
          temperatureC: Math.round(temp * 10) / 10,
          voltageV: Math.round(volt * 1000) / 1000,
          currentA: Math.round((pwr / volt) * 10) / 10,
          powerW: Math.round(pwr * 10) / 10,
          frequencyMHz: dev.operatingProfile.nominalFrequencyMHz,
          utilizationPct: dev.currentMetrics?.utilizationPct || 60,
          fanSpeedRpm: 3000 + Math.floor(temp * 15),
          coolingEfficiencyPct: 95,
          pressureBar: 1.0,
          errorCount: 0,
          operatingCycles: 100000 + (40 - i),
          sensorStatus: 'OK'
        });
      }
    }
  }

  private seedAlertsAndIncidents() {
    this.alerts = [
      {
        id: 'ALT-1001',
        orgId: 'org-demo-01',
        deviceId: 'ST-003',
        deviceName: 'GaN-PowerFET 650V Switching Module',
        condition: 'JUNCTION_OVERHEAT',
        severity: 'CRITICAL',
        currentValue: '104.5 °C',
        expectedValue: '< 100.0 °C',
        status: 'OPEN',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString()
      },
      {
        id: 'ALT-1002',
        orgId: 'org-demo-01',
        deviceId: 'ST-002',
        deviceName: 'Helios-3X High-Power Server SoC',
        condition: 'THERMAL_HEADROOM_DEPLETED',
        severity: 'WARNING',
        currentValue: '68.2 °C',
        expectedValue: '< 65.0 °C',
        status: 'OPEN',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString()
      }
    ];

    this.incidents = [
      {
        id: 'INC-2026-0042',
        orgId: 'org-demo-01',
        title: 'Thermal runaway risk on Fab 2 GaN Power Switching Module',
        deviceId: 'ST-003',
        deviceName: 'GaN-PowerFET 650V Switching Module',
        severity: 'FATAL',
        status: 'INVESTIGATING',
        description: 'Immersion cooling pump flow rate decreased by 18% leading to localized hotspot on GaN power die.',
        detectedTime: new Date(Date.now() - 25 * 60000).toISOString(),
        assignedEngineer: 'Marcus Chen',
        timeline: [
          {
            id: 't-1',
            timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
            author: 'System Auto-Trigger',
            message: 'Incident opened after threshold breach ALT-1001',
            actionType: 'STATUS_CHANGE'
          }
        ],
        relatedAlertIds: ['ALT-1001']
      }
    ];
  }

  public setScenario(deviceId: string, scenario: SimulationScenarioType) {
    const dev = this.devices.find(d => d.id === deviceId);
    if (dev) {
      dev.activeScenario = scenario;
      if (scenario === 'THERMAL_STRESS') {
        if (dev.currentMetrics) {
          dev.currentMetrics.temperatureC = 88.5;
          dev.currentMetrics.healthScore = 65;
          dev.currentMetrics.riskLevel = 'HIGH';
        }
      } else if (scenario === 'VOLTAGE_INSTABILITY') {
        if (dev.currentMetrics) {
          dev.currentMetrics.voltageV = dev.operatingProfile.nominalVoltageV * 0.85;
          dev.currentMetrics.healthScore = 72;
        }
      } else if (scenario === 'NORMAL') {
        if (dev.currentMetrics) {
          dev.currentMetrics.temperatureC = 38.0;
          dev.currentMetrics.voltageV = dev.operatingProfile.nominalVoltageV;
          dev.currentMetrics.healthScore = 98;
          dev.currentMetrics.riskLevel = 'LOW';
        }
      }
    }
  }
}

export const localStore = new LocalSimulationStore();
