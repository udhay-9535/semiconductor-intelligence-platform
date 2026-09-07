/**
 * What-If Simulation Engine API Routes
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.ts';
import { WhatIfScenarioInput, WhatIfScenarioResult } from '../types/index.ts';
import { globalIsolationForest, TelemetryFeatureVector } from '../ml/isolationForest.ts';
import { assessSemiconductorHealth } from '../ml/failurePrediction.ts';

const router = Router();
router.use(authMiddleware);

// Run a What-If Scenario Calculation
router.post('/what-if', requireRole('ENGINEER'), (req: AuthenticatedRequest, res: Response) => {
  const input: WhatIfScenarioInput = req.body;

  if (!input.deviceId) {
    res.status(400).json({ error: 'deviceId is required' });
    return;
  }

  const device = db.devices.get(input.deviceId);
  if (!device || device.orgId !== req.orgId) {
    res.status(404).json({ error: 'Device not found in current organization' });
    return;
  }

  const p = device.operatingProfile;

  // 1. Baseline calculation (nominal specs)
  const baseVector: TelemetryFeatureVector = {
    temperatureC: 62.0,
    voltageV: p.nominalVoltageV,
    currentA: (p.nominalPowerW / p.nominalVoltageV) * 0.8,
    powerW: p.nominalPowerW * 0.8,
    frequencyMHz: p.nominalFrequencyMHz,
    utilizationPct: 60,
    fanSpeedRpm: 3200,
    errorCount: 0,
    coolingEfficiencyPct: 95
  };

  const baseAnomaly = Math.round(globalIsolationForest.score(baseVector) * 1000) / 1000;
  const baseHealth = assessSemiconductorHealth(baseVector, p);

  // 2. Scenario calculation
  const workload = Math.max(5, Math.min(100, Number(input.workloadPct ?? 60)));
  const ambientT = Number(input.ambientTempC ?? 25.0);
  const voltBias = Number(input.voltageBiasPct ?? 0);
  const freqOffset = Number(input.frequencyOffsetMHz ?? 0);
  const coolingEff = Math.max(20, Math.min(100, Number(input.coolingEfficiencyPct ?? 95)));

  const scenarioVoltage = p.nominalVoltageV * (1 + voltBias / 100);
  const scenarioFreq = Math.max(200, p.nominalFrequencyMHz + freqOffset);
  
  // Power scaling physics: P = alpha * V^2 * f + static leakage
  const dynPowerScale = (scenarioVoltage / p.nominalVoltageV) * (scenarioVoltage / p.nominalVoltageV) * (scenarioFreq / p.nominalFrequencyMHz) * (workload / 60);
  const scenarioPower = Math.round((p.nominalPowerW * 0.8 * dynPowerScale) * 10) / 10;
  const scenarioCurrent = Math.round((scenarioPower / scenarioVoltage) * 10) / 10;

  // Temperature calculation
  const effectiveTheta = p.thermalResistanceC_W * (100 / coolingEff);
  const scenarioTemp = Math.round((ambientT + (scenarioPower * effectiveTheta)) * 10) / 10;
  const scenarioFan = Math.max(1200, Math.min(7000, 2400 + (scenarioTemp / 90) * 3000));
  const scenarioErrors = scenarioTemp > 92 || voltBias > 8 ? Math.floor((scenarioTemp - 90) * 0.8) + 1 : 0;

  const scenarioVector: TelemetryFeatureVector = {
    temperatureC: scenarioTemp,
    voltageV: scenarioVoltage,
    currentA: scenarioCurrent,
    powerW: scenarioPower,
    frequencyMHz: scenarioFreq,
    utilizationPct: workload,
    fanSpeedRpm: scenarioFan,
    errorCount: scenarioErrors,
    coolingEfficiencyPct: coolingEff
  };

  const scenarioAnomaly = Math.round(globalIsolationForest.score(scenarioVector) * 1000) / 1000;
  const scenarioHealth = assessSemiconductorHealth(scenarioVector, p);

  const healthDelta = scenarioHealth.healthScore - baseHealth.healthScore;
  const failureProbDelta = Math.round((scenarioHealth.failureProbability - baseHealth.failureProbability) * 1000) / 10;
  const anomalyDelta = Math.round((scenarioAnomaly - baseAnomaly) * 1000) / 1000;
  const powerDelta = Math.round((scenarioPower - baseVector.powerW) * 10) / 10;
  const tempDelta = Math.round((scenarioTemp - baseVector.temperatureC) * 10) / 10;
  const rulDelta = scenarioHealth.estimatedRulHours - baseHealth.estimatedRulHours;

  let impactSummary = 'Moderate operational shift within safe semiconductor tolerances.';
  if (scenarioTemp > 95 || scenarioHealth.riskLevel === 'CRITICAL') {
    impactSummary = `CRITICAL THERMAL/VOLTAGE RISK: Junction temperature reaches ${scenarioTemp}°C with ${(scenarioHealth.failureProbability * 100).toFixed(1)}% 30-day failure risk. Estimated lifetime shortened by ${Math.abs(rulDelta).toLocaleString()} hours.`;
  } else if (scenarioHealth.riskLevel === 'HIGH') {
    impactSummary = `HIGH STRESS STATE: Noticeable acceleration of silicon aging. Arrhenius acceleration factor increases to ${scenarioHealth.thermalStressFactor.toFixed(1)}x.`;
  } else if (healthDelta > 0) {
    impactSummary = `OPTIMIZED CONDITIONS: Improved cooling and lower ambient temperature extend estimated component lifetime by ${rulDelta.toLocaleString()} hours.`;
  }

  const result: WhatIfScenarioResult = {
    id: `SIM-${Date.now().toString().slice(-6)}`,
    name: req.body.name || `What-If Analysis (${device.id} @ ${workload}% Workload)`,
    deviceId: device.id,
    createdAt: new Date().toISOString(),
    input,
    baseline: {
      healthScore: baseHealth.healthScore,
      failureProbability: baseHealth.failureProbability,
      anomalyScore: baseAnomaly,
      powerW: baseVector.powerW,
      temperatureC: baseVector.temperatureC,
      estimatedRulHours: baseHealth.estimatedRulHours
    },
    scenario: {
      healthScore: scenarioHealth.healthScore,
      failureProbability: scenarioHealth.failureProbability,
      anomalyScore: scenarioAnomaly,
      powerW: scenarioPower,
      temperatureC: scenarioTemp,
      estimatedRulHours: scenarioHealth.estimatedRulHours
    },
    difference: {
      healthDelta,
      failureProbDeltaPct: failureProbDelta,
      anomalyScoreDelta: anomalyDelta,
      powerDeltaW: powerDelta,
      temperatureDeltaC: tempDelta,
      rulDeltaHours: rulDelta
    },
    riskLevel: scenarioHealth.riskLevel,
    impactSummary
  };

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'WHAT_IF_SIMULATION_RUN',
    targetType: 'DEVICE',
    targetId: device.id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { workload, ambientT, voltBias, scenarioTemp, healthDelta }
  });

  res.json({ result });
});

// List saved What-If scenarios
router.get('/scenarios', (req: AuthenticatedRequest, res: Response) => {
  const scenarios = Array.from(db.whatIfScenarios.values());
  res.json({ scenarios });
});

// Save a What-If scenario
router.post('/scenarios', requireRole('ENGINEER'), (req: AuthenticatedRequest, res: Response) => {
  const { scenario } = req.body;
  if (!scenario || !scenario.id) {
    res.status(400).json({ error: 'Valid scenario object is required' });
    return;
  }

  db.whatIfScenarios.set(scenario.id, scenario);
  res.status(201).json({ message: 'Scenario saved successfully', scenario });
});

// Delete saved scenario
router.delete('/scenarios/:id', requireRole('ENGINEER'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  db.whatIfScenarios.delete(id);
  res.json({ message: 'Scenario deleted successfully' });
});

export default router;
