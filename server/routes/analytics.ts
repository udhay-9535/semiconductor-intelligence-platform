/**
 * Semiconductor Fleet Analytics API Routes
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);

// Calculate mean, min, max, stdDev helper
function calculateStats(values: number[]) {
  if (values.length === 0) return { mean: 0, min: 0, max: 0, stdDev: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean: Math.round(mean * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100
  };
}

// Fleet Analytics Summary
router.get('/summary', (req: AuthenticatedRequest, res: Response) => {
  const { deviceId, siteId, startDate, endDate } = req.query;

  let telemetryItems = db.telemetry.filter(t => t.orgId === req.orgId);
  let devices = Array.from(db.devices.values()).filter(d => d.orgId === req.orgId);

  if (deviceId) {
    telemetryItems = telemetryItems.filter(t => t.deviceId === deviceId);
    devices = devices.filter(d => d.id === deviceId);
  }
  if (siteId) {
    const siteDevIds = devices.filter(d => d.siteId === siteId).map(d => d.id);
    telemetryItems = telemetryItems.filter(t => siteDevIds.includes(t.deviceId));
    devices = devices.filter(d => d.siteId === siteId);
  }

  // Statistical aggregates across dimensions
  const temperatures = telemetryItems.map(t => t.temperatureC);
  const voltages = telemetryItems.map(t => t.voltageV);
  const currents = telemetryItems.map(t => t.currentA);
  const powers = telemetryItems.map(t => t.powerW);
  const frequencies = telemetryItems.map(t => t.frequencyMHz);
  const utilizations = telemetryItems.map(t => t.utilizationPct);
  const healthScores = telemetryItems.map(t => t.healthScore ?? 90);
  const anomalyScores = telemetryItems.map(t => t.anomalyScore ?? 0.1);

  const anomaliesCount = telemetryItems.filter(t => t.isAnomaly).length;
  const anomalyRate = telemetryItems.length > 0 ? (anomaliesCount / telemetryItems.length) * 100 : 0;

  // Fleet Health Breakdown
  const totalDevices = devices.length;
  const onlineCount = devices.filter(d => d.status === 'ONLINE').length;
  const warningCount = devices.filter(d => d.status === 'WARNING').length;
  const criticalCount = devices.filter(d => d.status === 'CRITICAL').length;
  const maintenanceCount = devices.filter(d => d.status === 'MAINTENANCE').length;

  const avgHealth = healthScores.length > 0 
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : 88;

  res.json({
    fleetOverview: {
      totalDevices,
      onlineCount,
      warningCount,
      criticalCount,
      maintenanceCount,
      averageHealthScore: avgHealth,
      totalTelemetryReadings: telemetryItems.length,
      anomalyRatePct: Math.round(anomalyRate * 10) / 10
    },
    statistics: {
      temperatureC: calculateStats(temperatures),
      voltageV: calculateStats(voltages),
      currentA: calculateStats(currents),
      powerW: calculateStats(powers),
      frequencyMHz: calculateStats(frequencies),
      utilizationPct: calculateStats(utilizations),
      healthScore: calculateStats(healthScores),
      anomalyScore: calculateStats(anomalyScores)
    },
    deviceBreakdown: devices.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      model: d.model,
      siteName: d.siteName,
      status: d.status,
      healthScore: d.currentMetrics?.healthScore ?? 90,
      riskLevel: d.currentMetrics?.riskLevel ?? 'LOW',
      temperatureC: d.currentMetrics?.temperatureC ?? 65.0,
      mode: d.mode
    }))
  });
});

export default router;
