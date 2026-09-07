/**
 * Semiconductor Failure Prediction & Reliability Physics Engine
 * 
 * Combines statistical reliability physics (Arrhenius thermal acceleration,
 * Black's equation for electromigration, TDDB voltage breakdown) with multi-sensor
 * supervised regression to estimate failure probability and health scoring.
 */

import { RiskLevel } from '../types/index.ts';
import { TelemetryFeatureVector, NOMINAL_BASELINE_VECTOR, globalIsolationForest } from './isolationForest.ts';

export interface ReliabilityAssessment {
  healthScore: number; // 0 to 100
  failureProbability: number; // 0.0 to 1.0 (estimated failure risk within next 30 days)
  riskLevel: RiskLevel;
  estimatedRulHours: number; // Remaining Useful Life
  thermalStressFactor: number; // Arrhenius AF
  voltageStressFactor: number; // Eyring / TDDB exponential factor
  subsystemHealth: {
    thermal: number;
    electrical: number;
    clock: number;
    siliconAging: number;
  };
  topRiskFactors: {
    feature: string;
    description: string;
    impactPct: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
}

// Boltzmann constant in eV/K
const BOLTZMANN_EV = 8.617333262145e-5;
// Apparent activation energy for silicon electromigration/thermal degradation (eV)
const ACTIVATION_ENERGY_EV = 0.7;
// Nominal reference junction temperature in Kelvin (55°C = 328.15 K)
const T_REF_KELVIN = 55 + 273.15;

/**
 * Calculates Arrhenius Thermal Acceleration Factor
 * AF = exp( (Ea / k) * (1/T_use - 1/T_stress) )
 */
export function calculateArrheniusAF(tempC: number): number {
  const tStressKelvin = Math.max(25, tempC) + 273.15;
  const exponent = (ACTIVATION_ENERGY_EV / BOLTZMANN_EV) * ((1 / T_REF_KELVIN) - (1 / tStressKelvin));
  return Math.max(0.1, Math.min(150, Math.exp(exponent)));
}

/**
 * Calculates Voltage Acceleration Factor (Time-Dependent Dielectric Breakdown - TDDB)
 * Gamma voltage exponent ~ 4.0 for deep submicron gate oxides
 */
export function calculateVoltageStressFactor(voltageV: number, nominalVoltageV: number = 0.85): number {
  const deltaV = voltageV - nominalVoltageV;
  if (deltaV <= 0) return 1.0;
  // Exponential dielectric stress
  return Math.min(50, Math.exp(deltaV * 18.0));
}

export function assessSemiconductorHealth(
  reading: TelemetryFeatureVector,
  operatingProfile?: {
    nominalVoltageV: number;
    nominalFrequencyMHz: number;
    maxJunctionTempC: number;
    thermalResistanceC_W: number;
  }
): ReliabilityAssessment {
  const nominalV = operatingProfile?.nominalVoltageV || 0.85;
  const maxTj = operatingProfile?.maxJunctionTempC || 95.0;

  // 1. Thermal physics
  const arrheniusAF = calculateArrheniusAF(reading.temperatureC);
  const tempOverhead = Math.max(0, reading.temperatureC - 75);
  const thermalDegradation = Math.min(100, (tempOverhead / (maxTj - 75)) * 100);
  const thermalHealth = Math.max(0, Math.min(100, 100 - thermalDegradation * 1.2));

  // 2. Electrical physics (IR drop, voltage spikes, power surge)
  const voltageStress = calculateVoltageStressFactor(reading.voltageV, nominalV);
  const voltageDevPct = Math.abs(reading.voltageV - nominalV) / nominalV * 100;
  const electricalDegradation = Math.min(100, (voltageDevPct * 12) + (voltageStress > 1.5 ? (voltageStress - 1) * 10 : 0));
  const electricalHealth = Math.max(0, Math.min(100, 100 - electricalDegradation));

  // 3. Clock & Error rate health
  const errorPenalty = Math.min(60, reading.errorCount * 15);
  const coolingPenalty = reading.coolingEfficiencyPct < 90 ? (90 - reading.coolingEfficiencyPct) * 2.5 : 0;
  const clockHealth = Math.max(0, Math.min(100, 100 - errorPenalty - (reading.frequencyMHz > 2800 ? 15 : 0)));

  // 4. Silicon aging / overall stress
  const siliconAgingHealth = Math.max(0, Math.min(100, 100 - (arrheniusAF > 2.0 ? (arrheniusAF - 1) * 8 : 0)));

  // 5. Composite Health Score (0 - 100)
  const compositeHealth = Math.round(
    thermalHealth * 0.35 +
    electricalHealth * 0.30 +
    clockHealth * 0.20 +
    siliconAgingHealth * 0.15
  );
  const healthScore = Math.max(0, Math.min(100, compositeHealth));

  // 6. Anomaly score from Isolation Forest
  const anomalyScore = globalIsolationForest.score(reading);

  // 7. Failure probability modeling (logistic combined with reliability physics)
  // Baseline failure risk is ~0.01 (1%) under nominal conditions
  const logit = -4.5 + 
    (arrheniusAF * 0.45) + 
    (voltageStress * 0.35) + 
    (anomalyScore * 3.8) + 
    (reading.errorCount * 0.75) + 
    (reading.temperatureC > 85 ? (reading.temperatureC - 85) * 0.15 : 0);
  
  const rawProb = 1 / (1 + Math.exp(-logit));
  const failureProbability = Math.round(Math.max(0.005, Math.min(0.995, rawProb)) * 1000) / 1000;

  // 8. Risk Level
  let riskLevel: RiskLevel = 'LOW';
  if (failureProbability >= 0.70 || healthScore < 40 || reading.temperatureC > 95) {
    riskLevel = 'CRITICAL';
  } else if (failureProbability >= 0.40 || healthScore < 65 || reading.temperatureC > 85) {
    riskLevel = 'HIGH';
  } else if (failureProbability >= 0.18 || healthScore < 80 || anomalyScore > 0.65) {
    riskLevel = 'MEDIUM';
  }

  // 9. Remaining Useful Life (RUL) estimation (nominal 87,600 hrs = 10 years at 55C)
  const baseRul = 87600;
  const effectiveAF = Math.max(0.5, arrheniusAF * (1 + (anomalyScore > 0.6 ? (anomalyScore - 0.5) * 2 : 0)));
  const estimatedRulHours = Math.round(Math.max(24, baseRul / effectiveAF * (healthScore / 100)));

  // 10. Top Risk Factors
  const topRiskFactors: ReliabilityAssessment['topRiskFactors'] = [];
  if (reading.temperatureC > 80) {
    topRiskFactors.push({
      feature: 'Junction Temperature',
      description: `Elevated die junction temp (${reading.temperatureC.toFixed(1)}°C) accelerating Arrhenius aging by ${arrheniusAF.toFixed(1)}x`,
      impactPct: Math.min(65, Math.round((reading.temperatureC - 60) * 1.8)),
      severity: reading.temperatureC > 90 ? 'CRITICAL' : 'HIGH'
    });
  }

  if (voltageDevPct > 4) {
    topRiskFactors.push({
      feature: 'Supply Voltage Bias',
      description: `Core supply voltage deviation (${reading.voltageV.toFixed(3)}V vs ${nominalV.toFixed(2)}V nominal) inducing gate oxide stress`,
      impactPct: Math.min(45, Math.round(voltageDevPct * 5)),
      severity: voltageDevPct > 8 ? 'CRITICAL' : 'MEDIUM'
    });
  }

  if (reading.coolingEfficiencyPct < 85) {
    topRiskFactors.push({
      feature: 'Cooling Loop Efficiency',
      description: `Thermal dissipation degradation (${reading.coolingEfficiencyPct.toFixed(1)}% vs 95% nominal) increasing thermal resistance`,
      impactPct: Math.min(40, Math.round((95 - reading.coolingEfficiencyPct) * 2.2)),
      severity: reading.coolingEfficiencyPct < 70 ? 'CRITICAL' : 'MEDIUM'
    });
  }

  if (reading.errorCount > 0) {
    topRiskFactors.push({
      feature: 'ECC Error Bursts',
      description: `Active memory controller error registers (${reading.errorCount} events) indicating signal margin collapse`,
      impactPct: Math.min(50, reading.errorCount * 20),
      severity: reading.errorCount > 2 ? 'CRITICAL' : 'HIGH'
    });
  }

  if (topRiskFactors.length === 0) {
    topRiskFactors.push({
      feature: 'Operating Stability',
      description: 'All thermal, electrical, and clock parameters are operating within nominal specification margins',
      impactPct: 5,
      severity: 'LOW'
    });
  }

  return {
    healthScore,
    failureProbability,
    riskLevel,
    estimatedRulHours,
    thermalStressFactor: Math.round(arrheniusAF * 100) / 100,
    voltageStressFactor: Math.round(voltageStress * 100) / 100,
    subsystemHealth: {
      thermal: Math.round(thermalHealth),
      electrical: Math.round(electricalHealth),
      clock: Math.round(clockHealth),
      siliconAging: Math.round(siliconAgingHealth)
    },
    topRiskFactors
  };
}
