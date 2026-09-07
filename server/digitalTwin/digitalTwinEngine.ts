/**
 * Semiconductor Digital Twin Simulation & Physics Engine
 * 
 * Computes deterministic physical and architectural state of on-die subsystems:
 * - Compute Core Arrays (ALU, Tensor, Vector)
 * - High-Bandwidth Memory (HBM3e / DDR5 Controller & PHY)
 * - Power Distribution Network (PDN & VRMs)
 * - Clock Generation & PLL Distribution
 * - Thermal Dissipation Network (Die-to-Ambient Theta-JA)
 * - Sensor Telemetry Mesh
 * - High-Speed SerDes & I/O (PCIe Gen5 / CXL 3.0)
 */

import { DigitalTwinState, Device, TelemetryReading, RiskLevel } from '../types/index.ts';
import { TelemetryFeatureVector } from '../ml/isolationForest.ts';
import { assessSemiconductorHealth } from '../ml/failurePrediction.ts';

export class DigitalTwinEngine {
  /**
   * Computes comprehensive Digital Twin state from telemetry and device specs
   */
  public static computeState(device: Device, telemetry: TelemetryReading): DigitalTwinState {
    const profile = device.operatingProfile || {
      nominalVoltageV: 0.85,
      nominalFrequencyMHz: 2400,
      maxJunctionTempC: 95.0,
      thermalResistanceC_W: 0.45,
      nominalPowerW: 45.0,
      coolingType: 'AIR_FORCED',
      dieProcessNm: 4
    };

    const vector: TelemetryFeatureVector = {
      temperatureC: telemetry.temperatureC,
      voltageV: telemetry.voltageV,
      currentA: telemetry.currentA,
      powerW: telemetry.powerW,
      frequencyMHz: telemetry.frequencyMHz,
      utilizationPct: telemetry.utilizationPct,
      fanSpeedRpm: telemetry.fanSpeedRpm,
      errorCount: telemetry.errorCount,
      coolingEfficiencyPct: telemetry.coolingEfficiencyPct
    };

    const healthAssessment = assessSemiconductorHealth(vector, profile);

    // Physics calculations
    // 1. Dynamic Power: P_dyn = alpha * C * V^2 * f
    const alphaC = 0.000000012; // Farad capacitance constant
    const dynamicPower = (telemetry.utilizationPct / 100) * (telemetry.voltageV * telemetry.voltageV) * (telemetry.frequencyMHz * 1e6) * alphaC * 1000 + (telemetry.utilizationPct * 0.25);
    
    // 2. Static Leakage: P_leak exponential with temperature and voltage
    const tempKelvin = telemetry.temperatureC + 273.15;
    const leakageFactor = Math.exp((telemetry.temperatureC - 50) * 0.035);
    const staticLeakage = 4.2 * (telemetry.voltageV / profile.nominalVoltageV) * leakageFactor;
    
    // 3. Junction Temperature Model: Tj = Ta + P_total * Theta_ja * (100 / coolingEfficiency)
    const ambientTemp = 24.5;
    const effectiveTheta = profile.thermalResistanceC_W * (100 / Math.max(20, telemetry.coolingEfficiencyPct));
    const calculatedTj = ambientTemp + (telemetry.powerW * effectiveTheta);
    const thermalHeadroom = Math.max(0, profile.maxJunctionTempC - telemetry.temperatureC);

    // Subsystem Health Breakdown
    // Compute subsystem
    const throttled = telemetry.temperatureC > 88 || telemetry.utilizationPct > 95;
    const computeHealth = Math.max(0, Math.min(100, 100 - (throttled ? 25 : 0) - (telemetry.errorCount * 10)));
    
    // Memory subsystem
    const eccCorrectable = Math.max(0, Math.floor(telemetry.errorCount * 4));
    const eccUncorrectable = telemetry.errorCount > 3 ? Math.floor(telemetry.errorCount - 3) : 0;
    const memoryHealth = Math.max(0, Math.min(100, 100 - (eccUncorrectable * 35) - (eccCorrectable * 4)));
    
    // Power Subsystem
    const voltageSag = Math.max(0, ((profile.nominalVoltageV - telemetry.voltageV) / profile.nominalVoltageV) * 100);
    const vrmEfficiency = Math.max(70, Math.min(96, 94 - (telemetry.currentA > 55 ? (telemetry.currentA - 55) * 0.5 : 0)));
    const powerHealth = Math.max(0, Math.min(100, 100 - (voltageSag * 8) - (telemetry.powerW > profile.nominalPowerW * 1.3 ? 20 : 0)));

    // Clock Subsystem
    const jitterPs = 1.2 + (telemetry.temperatureC > 75 ? (telemetry.temperatureC - 75) * 0.08 : 0) + (voltageSag * 0.3);
    const pllLocked = jitterPs < 5.0 && telemetry.voltageV > 0.75;
    const clockHealth = pllLocked ? Math.max(0, Math.min(100, 100 - (jitterPs > 2.5 ? (jitterPs - 2.5) * 20 : 0))) : 20;

    // Thermal Subsystem
    const heatSinkTemp = ambientTemp + (telemetry.powerW * effectiveTheta * 0.6);
    const thermalHealth = healthAssessment.subsystemHealth.thermal;

    // Sensors Subsystem
    const sensorDrift = telemetry.sensorStatus !== 'OK' || Math.abs(calculatedTj - telemetry.temperatureC) > 12;
    const sensorsHealth = sensorDrift ? 65 : 98;

    // I/O Subsystem
    const packetLoss = telemetry.errorCount > 0 ? Math.min(5, telemetry.errorCount * 0.5) : 0;
    const ioHealth = Math.max(0, Math.min(100, 100 - (packetLoss * 15)));

    const getStatus = (score: number): 'OPTIMAL' | 'DEGRADED' | 'CRITICAL' => {
      if (score >= 80) return 'OPTIMAL';
      if (score >= 50) return 'DEGRADED';
      return 'CRITICAL';
    };

    return {
      deviceId: device.id,
      orgId: device.orgId,
      lastUpdated: telemetry.timestamp,
      mode: telemetry.mode,
      healthScore: healthAssessment.healthScore,
      riskLevel: healthAssessment.riskLevel,
      subsystems: {
        compute: {
          healthScore: computeHealth,
          coreUtilizationPct: Math.round(telemetry.utilizationPct * 10) / 10,
          throttled,
          pipelineEfficiencyPct: Math.round(Math.max(60, 94 - (telemetry.utilizationPct > 85 ? (telemetry.utilizationPct - 85) * 1.5 : 0)) * 10) / 10,
          branchMispredictRate: Math.round((2.1 + (telemetry.utilizationPct / 100) * 1.8) * 10) / 10,
          status: getStatus(computeHealth)
        },
        memory: {
          healthScore: memoryHealth,
          bandwidthUtilizationPct: Math.round((telemetry.utilizationPct * 0.85) * 10) / 10,
          eccCorrectableErrors: eccCorrectable,
          eccUncorrectableErrors: eccUncorrectable,
          latencyNs: Math.round((14.2 + (telemetry.temperatureC > 70 ? (telemetry.temperatureC - 70) * 0.2 : 0)) * 10) / 10,
          status: getStatus(memoryHealth)
        },
        power: {
          healthScore: powerHealth,
          voltageV: Math.round(telemetry.voltageV * 1000) / 1000,
          currentA: Math.round(telemetry.currentA * 10) / 10,
          powerW: Math.round(telemetry.powerW * 10) / 10,
          voltageSagPct: Math.round(voltageSag * 10) / 10,
          vrmEfficiencyPct: Math.round(vrmEfficiency * 10) / 10,
          status: getStatus(powerHealth)
        },
        clock: {
          healthScore: clockHealth,
          frequencyMHz: Math.round(telemetry.frequencyMHz),
          jitterPs: Math.round(jitterPs * 100) / 100,
          phaseNoiseDbc: Math.round((-118 + (jitterPs > 2 ? jitterPs * 2 : 0)) * 10) / 10,
          pllLocked,
          status: getStatus(clockHealth)
        },
        thermal: {
          healthScore: thermalHealth,
          junctionTempC: Math.round(telemetry.temperatureC * 10) / 10,
          ambientTempC: Math.round(ambientTemp * 10) / 10,
          heatSinkTempC: Math.round(heatSinkTemp * 10) / 10,
          thermalResistanceC_W: Math.round(effectiveTheta * 100) / 100,
          coolingEfficiencyPct: Math.round(telemetry.coolingEfficiencyPct * 10) / 10,
          status: getStatus(thermalHealth)
        },
        sensors: {
          healthScore: sensorsHealth,
          activeSensors: 16,
          driftDetected: sensorDrift,
          status: getStatus(sensorsHealth)
        },
        io: {
          healthScore: ioHealth,
          pcieThroughputGbps: Math.round((64 * (telemetry.utilizationPct / 100)) * 10) / 10,
          packetLossPct: Math.round(packetLoss * 100) / 100,
          crcErrors: telemetry.errorCount,
          status: getStatus(ioHealth)
        }
      },
      physics: {
        calculatedTjC: Math.round(calculatedTj * 10) / 10,
        expectedDynamicPowerW: Math.round(dynamicPower * 10) / 10,
        expectedStaticLeakagePowerW: Math.round(staticLeakage * 10) / 10,
        thermalHeadroomC: Math.round(thermalHeadroom * 10) / 10,
        mtbfHoursEstimated: healthAssessment.estimatedRulHours
      }
    };
  }
}
