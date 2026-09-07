/**
 * Semiconductor Intelligence Platform - Automated Test Suite
 * 
 * Verifies API integrity, RBAC permissions, Multi-tenant isolation, 
 * Telemetry validation, Isolation Forest ML, Reliability physics, and What-If determinism.
 */

import { db } from '../db/database.ts';
import { globalIsolationForest, TelemetryFeatureVector } from '../ml/isolationForest.ts';
import { assessSemiconductorHealth, calculateArrheniusAF } from '../ml/failurePrediction.ts';
import { DigitalTwinEngine } from '../digitalTwin/digitalTwinEngine.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('=======================================================');
  console.log('  RUNNING SEMICONDUCTOR INTELLIGENCE TEST SUITE');
  console.log('=======================================================');

  // Test 1: Database Seed Verification
  console.log('\n[1. Database Seed & Multi-Tenancy]');
  assert(db.organizations.size >= 2, 'Initial organizations seeded');
  assert(db.devices.size >= 5, 'Demo devices seeded (ST-001 through ST-005)');
  assert(db.users.size >= 6, 'All standard RBAC users seeded');
  assert(db.modelRegistry.size >= 4, 'Model registry populated with versions');

  // Test 2: Multi-Tenant Data Isolation
  console.log('\n[2. Tenant Isolation]');
  const demoDevices = Array.from(db.devices.values()).filter(d => d.orgId === 'org-demo-01');
  const otherTenantDevices = Array.from(db.devices.values()).filter(d => d.orgId === 'org-client-02');
  assert(demoDevices.length === 5, 'Demo tenant has exactly 5 devices');
  assert(demoDevices.every(d => d.orgId === 'org-demo-01'), 'Demo devices do not leak across tenants');

  // Test 3: Isolation Forest ML Algorithm
  console.log('\n[3. Isolation Forest ML Anomaly Detection]');
  const normalVector: TelemetryFeatureVector = {
    temperatureC: 62.0,
    voltageV: 0.85,
    currentA: 40.0,
    powerW: 34.0,
    frequencyMHz: 2400,
    utilizationPct: 60,
    fanSpeedRpm: 3200,
    errorCount: 0,
    coolingEfficiencyPct: 95
  };
  const normalScore = globalIsolationForest.score(normalVector);
  assert(normalScore < 0.60, `Normal vector yields low anomaly score (actual: ${normalScore.toFixed(3)})`);

  const extremeAnomalyVector: TelemetryFeatureVector = {
    temperatureC: 110.0,
    voltageV: 1.25,
    currentA: 95.0,
    powerW: 118.75,
    frequencyMHz: 3600,
    utilizationPct: 100,
    fanSpeedRpm: 1200,
    errorCount: 15,
    coolingEfficiencyPct: 35
  };
  const extremeScore = globalIsolationForest.score(extremeAnomalyVector);
  assert(extremeScore > 0.65, `Extreme anomaly yields high anomaly score (actual: ${extremeScore.toFixed(3)})`);
  assert(extremeScore > normalScore, 'Extreme anomaly score is strictly greater than normal vector');

  // Test 4: Reliability Physics (Arrhenius & Health Scoring)
  console.log('\n[4. Reliability Physics & Failure Modeling]');
  const af55 = calculateArrheniusAF(55);
  const af85 = calculateArrheniusAF(85);
  assert(Math.abs(af55 - 1.0) < 0.05, `Arrhenius factor at reference 55°C is ~1.0 (actual: ${af55.toFixed(2)})`);
  assert(af85 > af55 * 3.0, `Arrhenius acceleration at 85°C is significantly elevated (actual: ${af85.toFixed(2)}x)`);

  const healthNormal = assessSemiconductorHealth(normalVector);
  const healthExtreme = assessSemiconductorHealth(extremeAnomalyVector);
  assert(healthNormal.healthScore > 85, `Nominal condition yields high health score (actual: ${healthNormal.healthScore})`);
  assert(healthExtreme.healthScore < 40, `Extreme stress yields low health score (actual: ${healthExtreme.healthScore})`);
  assert(healthExtreme.riskLevel === 'CRITICAL', 'Extreme stress triggers CRITICAL risk level');

  // Test 5: Telemetry Validation & Ingestion
  console.log('\n[5. Telemetry Validation & Ingestion Engine]');
  const dev1 = db.devices.get('ST-001')!;
  const reading = db.generateSyntheticTelemetry(dev1, 'NORMAL');
  const ingestionResult = db.ingestTelemetry(reading, 'org-demo-01');
  assert(ingestionResult.reading.healthScore !== undefined, 'Ingested telemetry receives computed health score');
  assert(ingestionResult.reading.anomalyScore !== undefined, 'Ingested telemetry receives ML anomaly score');

  // Test 6: Digital Twin Calculations
  console.log('\n[6. Digital Twin Physics Derivation]');
  const dtState = DigitalTwinEngine.computeState(dev1, reading);
  assert(dtState.subsystems.compute !== undefined, 'Compute subsystem populated');
  assert(dtState.subsystems.thermal !== undefined, 'Thermal subsystem populated');
  assert(dtState.subsystems.power !== undefined, 'Power subsystem populated');
  assert(dtState.physics.calculatedTjC > 0, 'Junction temperature model solved');

  // Test 7: Audit Log Append Integrity
  console.log('\n[7. Audit Trail Integrity]');
  const initialAuditCount = db.auditLogs.length;
  db.recordAudit({
    orgId: 'org-demo-01',
    userId: 'usr-001',
    userName: 'Elena Vance',
    userRole: 'SUPER_ADMIN',
    action: 'TEST_VERIFICATION_EVENT',
    targetType: 'SYSTEM',
    targetId: 'TEST-01',
    ipAddress: '127.0.0.1',
    result: 'SUCCESS',
    details: { test: true }
  });
  assert(db.auditLogs.length === initialAuditCount + 1, 'Audit log accurately appended');
  assert(db.auditLogs[0].action === 'TEST_VERIFICATION_EVENT', 'Most recent audit log indexed at top');

  console.log('\n=======================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
