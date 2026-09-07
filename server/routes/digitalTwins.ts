/**
 * Semiconductor Digital Twin API Routes
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.ts';
import { DigitalTwinEngine } from '../digitalTwin/digitalTwinEngine.ts';

const router = Router();
router.use(authMiddleware);

// Get Digital Twin state for a specific device
router.get('/:deviceId', (req: AuthenticatedRequest, res: Response) => {
  const { deviceId } = req.params;
  const device = db.devices.get(deviceId);
  
  if (!device || device.orgId !== req.orgId) {
    res.status(404).json({ error: 'Device not found in current organization' });
    return;
  }

  let dtState = db.digitalTwins.get(deviceId);
  
  // If not yet computed or stale, recompute from latest telemetry
  if (!dtState) {
    const devTelemetry = db.telemetry.filter(t => t.deviceId === deviceId);
    const latest = devTelemetry.length > 0 ? devTelemetry[devTelemetry.length - 1] : db.generateSyntheticTelemetry(device, 'NORMAL');
    dtState = DigitalTwinEngine.computeState(device, latest);
    db.digitalTwins.set(deviceId, dtState);
  }

  res.json({
    deviceId,
    device: {
      id: device.id,
      name: device.name,
      model: device.model,
      status: device.status,
      operatingProfile: device.operatingProfile,
      siteName: device.siteName
    },
    digitalTwin: dtState
  });
});

// Get fleet Digital Twin overview
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const devices = Array.from(db.devices.values()).filter(d => d.orgId === req.orgId);
  const twins: Record<string, any> = {};

  for (const dev of devices) {
    const dt = db.digitalTwins.get(dev.id);
    if (dt) {
      twins[dev.id] = {
        healthScore: dt.healthScore,
        riskLevel: dt.riskLevel,
        lastUpdated: dt.lastUpdated,
        subsystems: dt.subsystems,
        physics: dt.physics
      };
    }
  }

  res.json({ twins, count: Object.keys(twins).length });
});

export default router;
