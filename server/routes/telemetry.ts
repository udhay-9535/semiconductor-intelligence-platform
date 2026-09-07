/**
 * Telemetry Ingestion & Time-Series Query Routes
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.ts';
import { TelemetryReading } from '../types/index.ts';
import { telemetryPipeline } from '../telemetry/pipeline.ts';

const router = Router();
router.use(authMiddleware);

// Ingestion Pipeline Health & Throughput Metrics
router.get('/health', (_req: AuthenticatedRequest, res: Response) => {
  const metrics = telemetryPipeline.getHealthMetrics();
  res.json({ health: metrics });
});

// Ingest telemetry (Single or Array) via Telemetry Pipeline
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  const items: any[] = Array.isArray(body) ? body : [body];

  if (items.length === 0) {
    res.status(400).json({ error: 'No telemetry items provided in request body' });
    return;
  }

  const results: any[] = [];
  const errors: any[] = [];

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const source = item.source || 'REST';
    const pipelineResult = telemetryPipeline.process(item, req.orgId || 'org-demo-01', source);

    if (pipelineResult.success && pipelineResult.reading) {
      results.push({
        id: pipelineResult.reading.id,
        deviceId: pipelineResult.reading.deviceId,
        quality: pipelineResult.quality,
        healthScore: pipelineResult.reading.healthScore,
        anomalyScore: pipelineResult.reading.anomalyScore,
        latencyMs: pipelineResult.processingTimeMs
      });
    } else {
      errors.push({
        index: idx,
        errors: pipelineResult.errors || ['Validation failed'],
        dropped: pipelineResult.dropped
      });
    }
  }

  if (errors.length > 0 && results.length === 0) {
    res.status(400).json({
      status: 'REJECTED',
      message: 'Telemetry ingestion validation failed',
      errors
    });
    return;
  }

  res.status(201).json({
    status: errors.length > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS',
    ingestedCount: results.length,
    rejectedCount: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined
  });
});

// Query time-series telemetry with downsampling
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { deviceId, startDate, endDate, limit } = req.query;

  let queryResults = db.telemetry.filter(t => t.orgId === req.orgId);

  if (deviceId) {
    queryResults = queryResults.filter(t => t.deviceId === deviceId);
  }
  if (startDate) {
    const startMs = new Date(String(startDate)).getTime();
    queryResults = queryResults.filter(t => new Date(t.timestamp).getTime() >= startMs);
  }
  if (endDate) {
    const endMs = new Date(String(endDate)).getTime();
    queryResults = queryResults.filter(t => new Date(t.timestamp).getTime() <= endMs);
  }

  const maxLimit = Math.min(500, Number(limit) || 100);
  queryResults.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  if (queryResults.length > maxLimit) {
    queryResults = queryResults.slice(queryResults.length - maxLimit);
  }

  res.json({
    readings: queryResults,
    count: queryResults.length,
    deviceId: deviceId || 'ALL'
  });
});

// Latest telemetry per device
router.get('/latest', (req: AuthenticatedRequest, res: Response) => {
  const devices = Array.from(db.devices.values()).filter(d => d.orgId === req.orgId);
  const latestReadings: Record<string, TelemetryReading> = {};

  for (const dev of devices) {
    const devTelemetry = db.telemetry.filter(t => t.deviceId === dev.id);
    if (devTelemetry.length > 0) {
      latestReadings[dev.id] = devTelemetry[devTelemetry.length - 1];
    }
  }

  res.json({ latest: latestReadings });
});

// Upload Telemetry CSV
router.post('/upload-csv', requireRole('ENGINEER'), (req: AuthenticatedRequest, res: Response) => {
  const { csvContent, targetDeviceId } = req.body;
  if (!csvContent || typeof csvContent !== 'string') {
    res.status(400).json({ error: 'csvContent string is required' });
    return;
  }

  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) {
    res.status(400).json({ error: 'CSV file must contain a header row and at least one data row' });
    return;
  }

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredHeaders = ['temperaturec', 'voltagev'];
  for (const reqH of requiredHeaders) {
    if (!header.includes(reqH)) {
      res.status(400).json({
        error: `Invalid CSV header. Missing required column: "${reqH}". Expected columns: timestamp, deviceId, temperatureC, voltageV, currentA, powerW, frequencyMHz, utilizationPct, fanSpeedRpm, coolingEfficiencyPct, errorCount`
      });
      return;
    }
  }

  const tempIdx = header.indexOf('temperaturec');
  const voltIdx = header.indexOf('voltagev');
  const devIdx = header.indexOf('deviceid');
  const timeIdx = header.indexOf('timestamp');
  const currIdx = header.indexOf('currenta');
  const pwrIdx = header.indexOf('powerw');
  const freqIdx = header.indexOf('frequencymhz');
  const utilIdx = header.indexOf('utilizationpct');
  const fanIdx = header.indexOf('fanspeedrpm');
  const coolIdx = header.indexOf('coolingefficiencypct');
  const errIdx = header.indexOf('errorcount');

  let successCount = 0;
  const validationErrors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(c => c.trim());
    if (row.length < 2) continue;

    const rowDevId = devIdx !== -1 ? row[devIdx] : (targetDeviceId || 'ST-001');
    const device = db.devices.get(rowDevId);
    if (!device || device.orgId !== req.orgId) {
      validationErrors.push(`Row ${i + 1}: Unknown device ID "${rowDevId}"`);
      continue;
    }

    const temp = parseFloat(row[tempIdx]);
    const volt = parseFloat(row[voltIdx]);

    if (isNaN(temp) || isNaN(volt)) {
      validationErrors.push(`Row ${i + 1}: Invalid temperature or voltage format`);
      continue;
    }

    const current = currIdx !== -1 ? parseFloat(row[currIdx]) || 35.0 : 35.0;
    const power = pwrIdx !== -1 ? parseFloat(row[pwrIdx]) || (volt * current) : (volt * current);
    const freq = freqIdx !== -1 ? parseFloat(row[freqIdx]) || 2400 : 2400;
    const util = utilIdx !== -1 ? parseFloat(row[utilIdx]) || 60 : 60;
    const fan = fanIdx !== -1 ? parseFloat(row[fanIdx]) || 3200 : 3200;
    const cooling = coolIdx !== -1 ? parseFloat(row[coolIdx]) || 95 : 95;
    const errors = errIdx !== -1 ? parseInt(row[errIdx]) || 0 : 0;
    const timestamp = timeIdx !== -1 && row[timeIdx] ? row[timeIdx] : new Date(Date.now() - (lines.length - i) * 1000).toISOString();

    const reading: TelemetryReading = {
      id: `tel-csv-${rowDevId}-${Date.now()}-${i}`,
      orgId: req.orgId || 'org-demo-01',
      deviceId: rowDevId,
      timestamp,
      mode: 'IMPORTED',
      source: 'IMPORTED',
      quality: 'GOOD',
      temperatureC: temp,
      voltageV: volt,
      currentA: current,
      powerW: power,
      frequencyMHz: freq,
      utilizationPct: util,
      fanSpeedRpm: fan,
      coolingEfficiencyPct: cooling,
      pressureBar: 1.0,
      errorCount: errors,
      operatingCycles: Math.floor(Date.now() / 1000),
      sensorStatus: 'OK'
    };

    db.ingestTelemetry(reading, req.orgId || 'org-demo-01');
    successCount++;
  }

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CSV_TELEMETRY_IMPORT',
    targetType: 'TELEMETRY',
    targetId: targetDeviceId || 'BATCH',
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { successCount, errorCount: validationErrors.length }
  });

  res.json({
    message: `Successfully processed ${successCount} telemetry rows from CSV`,
    successCount,
    rejectedCount: validationErrors.length,
    validationErrors: validationErrors.slice(0, 10)
  });
});

// Export Telemetry CSV
router.get('/export-csv', requireRole('ANALYST'), (req: AuthenticatedRequest, res: Response) => {
  const { deviceId } = req.query;
  let items = db.telemetry.filter(t => t.orgId === req.orgId);
  if (deviceId) {
    items = items.filter(t => t.deviceId === deviceId);
  }

  const headers = ['id', 'deviceId', 'timestamp', 'mode', 'source', 'quality', 'temperatureC', 'voltageV', 'currentA', 'powerW', 'frequencyMHz', 'utilizationPct', 'fanSpeedRpm', 'coolingEfficiencyPct', 'errorCount', 'anomalyScore', 'healthScore', 'failureProbability'];
  const csvRows = [headers.join(',')];

  for (const item of items) {
    const row = [
      item.id,
      item.deviceId,
      item.timestamp,
      item.mode,
      item.source || 'REST',
      item.quality || 'GOOD',
      item.temperatureC,
      item.voltageV,
      item.currentA,
      item.powerW,
      item.frequencyMHz,
      item.utilizationPct,
      item.fanSpeedRpm,
      item.coolingEfficiencyPct,
      item.errorCount,
      item.anomalyScore ?? 0,
      item.healthScore ?? 100,
      item.failureProbability ?? 0.01
    ];
    csvRows.push(row.join(','));
  }

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'DATA_EXPORT',
    targetType: 'TELEMETRY',
    targetId: String(deviceId || 'ALL_DEVICES'),
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { rowCount: items.length, format: 'CSV' }
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="telemetry-export-${deviceId || 'fleet'}-${Date.now()}.csv"`);
  res.send(csvRows.join('\n'));
});

export default router;
