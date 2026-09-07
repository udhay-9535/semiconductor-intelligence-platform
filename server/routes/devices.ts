/**
 * Device Registry & Lifecycle Routes
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.ts';
import { Device, DeviceStatus, SimulationScenarioType, TelemetryMode } from '../types/index.ts';
import { simulator } from '../simulator/telemetrySimulator.ts';

const router = Router();
router.use(authMiddleware);

// List devices
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { siteId, status, mode, search, sortBy, sortOrder } = req.query;

  let devices = Array.from(db.devices.values()).filter(d => d.orgId === req.orgId);

  if (siteId) {
    devices = devices.filter(d => d.siteId === siteId);
  }
  if (status) {
    devices = devices.filter(d => d.status === status);
  }
  if (mode) {
    devices = devices.filter(d => d.mode === mode);
  }
  if (search) {
    const q = String(search).toLowerCase();
    devices = devices.filter(d => 
      d.name.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q) ||
      d.serialNumber.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sortBy) {
    const order = sortOrder === 'asc' ? 1 : -1;
    devices.sort((a, b) => {
      if (sortBy === 'healthScore') {
        return ((a.currentMetrics?.healthScore || 0) - (b.currentMetrics?.healthScore || 0)) * order;
      }
      if (sortBy === 'temperatureC') {
        return ((a.currentMetrics?.temperatureC || 0) - (b.currentMetrics?.temperatureC || 0)) * order;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name) * order;
      }
      if (sortBy === 'lastCommunication') {
        return (new Date(a.lastCommunication).getTime() - new Date(b.lastCommunication).getTime()) * order;
      }
      return 0;
    });
  }

  // Enrich with scenario state
  const enriched = devices.map(d => ({
    ...d,
    activeScenario: db.deviceScenarios.get(d.id) || 'NORMAL'
  }));

  res.json({ devices: enriched, total: enriched.length });
});

// Get device by ID
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const device = db.devices.get(req.params.id);
  if (!device || device.orgId !== req.orgId) {
    res.status(404).json({ error: 'Device not found in current tenant' });
    return;
  }

  const activeScenario = db.deviceScenarios.get(device.id) || 'NORMAL';
  const site = db.sites.get(device.siteId);

  res.json({
    device: {
      ...device,
      siteName: site?.name || device.siteName,
      activeScenario
    }
  });
});

// Create Device
router.post('/', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { id, name, type, model, serialNumber, siteId, firmwareVersion, mode, operatingProfile } = req.body;

  if (!id || !name || !type || !model || !serialNumber || !siteId) {
    res.status(400).json({ error: 'Device ID, name, type, model, serialNumber, and siteId are required' });
    return;
  }

  if (db.devices.has(id)) {
    res.status(409).json({ error: `Device ID ${id} already exists` });
    return;
  }

  const site = db.sites.get(siteId);

  const newDevice: Device = {
    id,
    orgId: req.orgId || 'org-demo-01',
    siteId,
    siteName: site?.name || 'Cleanroom Site',
    name,
    type,
    model,
    manufacturer: req.body.manufacturer || 'Silicon Dynamics Technologies',
    serialNumber,
    status: 'ONLINE',
    firmwareVersion: firmwareVersion || 'v1.0.0',
    lastCommunication: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    mode: (mode as TelemetryMode) || 'SIMULATION',
    operatingProfile: operatingProfile || {
      nominalVoltageV: 0.85,
      nominalFrequencyMHz: 2400,
      maxJunctionTempC: 95.0,
      thermalResistanceC_W: 0.45,
      nominalPowerW: 45.0,
      coolingType: 'AIR_FORCED',
      dieProcessNm: 5
    }
  };

  db.devices.set(id, newDevice);
  db.deviceScenarios.set(id, 'NORMAL');

  // Generate initial telemetry reading
  const initialReading = db.generateSyntheticTelemetry(newDevice, 'NORMAL');
  db.ingestTelemetry(initialReading, newDevice.orgId);

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'DEVICE_CREATED',
    targetType: 'DEVICE',
    targetId: id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { name, model, mode: newDevice.mode }
  });

  res.status(201).json({ device: newDevice });
});

// Update Device
router.patch('/:id', requireRole('ENGINEER'), (req: AuthenticatedRequest, res: Response) => {
  const device = db.devices.get(req.params.id);
  if (!device || device.orgId !== req.orgId) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  const { name, firmwareVersion, status, siteId, operatingProfile, mode } = req.body;
  if (name) device.name = name;
  if (firmwareVersion) device.firmwareVersion = firmwareVersion;
  if (status) device.status = status as DeviceStatus;
  if (siteId) {
    device.siteId = siteId;
    const site = db.sites.get(siteId);
    if (site) device.siteName = site.name;
  }
  if (mode) device.mode = mode as TelemetryMode;
  if (operatingProfile) device.operatingProfile = { ...device.operatingProfile, ...operatingProfile };

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'DEVICE_UPDATED',
    targetType: 'DEVICE',
    targetId: device.id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { updatedFields: req.body }
  });

  res.json({ device });
});

// Set Simulation Scenario for device
router.post('/:id/scenario', requireRole('OPERATOR'), (req: AuthenticatedRequest, res: Response) => {
  const device = db.devices.get(req.params.id);
  if (!device || device.orgId !== req.orgId) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  const { scenario } = req.body;
  if (!scenario) {
    res.status(400).json({ error: 'Scenario is required (NORMAL | THERMAL_STRESS | VOLTAGE_INSTABILITY | HIGH_WORKLOAD | COOLING_DEGRADATION | POWER_ANOMALY | MIXED_FAILURE)' });
    return;
  }

  simulator.setDeviceScenario(device.id, scenario as SimulationScenarioType, req.orgId || 'org-demo-01');

  // Immediately generate and ingest updated reading
  const reading = db.generateSyntheticTelemetry(device, scenario as SimulationScenarioType);
  db.ingestTelemetry(reading, device.orgId);

  res.json({
    message: `Active simulation scenario updated to ${scenario}`,
    deviceId: device.id,
    scenario,
    currentMetrics: device.currentMetrics
  });
});

// Archive / Delete Device
router.delete('/:id', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const device = db.devices.get(req.params.id);
  if (!device || device.orgId !== req.orgId) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  db.devices.delete(device.id);
  db.deviceScenarios.delete(device.id);
  db.digitalTwins.delete(device.id);

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'DEVICE_DELETED',
    targetType: 'DEVICE',
    targetId: device.id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { deletedDeviceName: device.name }
  });

  res.json({ message: `Device ${device.id} archived successfully` });
});

export default router;
