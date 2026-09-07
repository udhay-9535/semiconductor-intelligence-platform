/**
 * Alert Engine API Routes
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.ts';
import { AlertStatus, Incident } from '../types/index.ts';

const router = Router();
router.use(authMiddleware);

// List alerts
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { status, severity, deviceId } = req.query;

  let alerts = Array.from(db.alerts.values()).filter(a => a.orgId === req.orgId);

  if (status) {
    alerts = alerts.filter(a => a.status === status);
  }
  if (severity) {
    alerts = alerts.filter(a => a.severity === severity);
  }
  if (deviceId) {
    alerts = alerts.filter(a => a.deviceId === deviceId);
  }

  alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({ alerts, count: alerts.length });
});

// Acknowledge alert
router.post('/:id/acknowledge', requireRole('OPERATOR'), (req: AuthenticatedRequest, res: Response) => {
  const alert = db.alerts.get(req.params.id);
  if (!alert || alert.orgId !== req.orgId) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  alert.status = 'ACKNOWLEDGED';
  alert.acknowledgedBy = req.user!.name;
  alert.acknowledgedAt = new Date().toISOString();

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'ALERT_ACKNOWLEDGED',
    targetType: 'ALERT',
    targetId: alert.id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { condition: alert.condition, deviceId: alert.deviceId }
  });

  res.json({ alert });
});

// Resolve alert
router.post('/:id/resolve', requireRole('OPERATOR'), (req: AuthenticatedRequest, res: Response) => {
  const alert = db.alerts.get(req.params.id);
  if (!alert || alert.orgId !== req.orgId) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  alert.status = 'RESOLVED';
  alert.resolvedBy = req.user!.name;
  alert.resolvedAt = new Date().toISOString();

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'ALERT_RESOLVED',
    targetType: 'ALERT',
    targetId: alert.id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { condition: alert.condition, deviceId: alert.deviceId }
  });

  res.json({ alert });
});

// Escalate Alert to Incident
router.post('/:id/escalate-to-incident', requireRole('ENGINEER'), (req: AuthenticatedRequest, res: Response) => {
  const alert = db.alerts.get(req.params.id);
  if (!alert || alert.orgId !== req.orgId) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  const { title, assignedEngineer, description } = req.body;
  const incId = `INC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  const incident: Incident = {
    id: incId,
    orgId: req.orgId || 'org-demo-01',
    title: title || `Critical Incident on ${alert.deviceName}: ${alert.condition}`,
    deviceId: alert.deviceId,
    deviceName: alert.deviceName,
    severity: alert.severity,
    description: description || `Escalated from alert ${alert.id}. Current: ${alert.currentValue}, Expected: ${alert.expectedValue}`,
    detectedTime: alert.timestamp,
    assignedEngineer: assignedEngineer || req.user!.name,
    status: 'INVESTIGATING',
    timeline: [
      {
        id: `tml-${Date.now()}-1`,
        timestamp: new Date().toISOString(),
        author: req.user!.name,
        message: `Incident escalated from Alert ${alert.id} by ${req.user!.name}`,
        actionType: 'ESCALATION'
      }
    ],
    relatedAlertIds: [alert.id]
  };

  alert.incidentId = incId;
  alert.status = 'ACKNOWLEDGED';
  alert.acknowledgedBy = req.user!.name;
  alert.acknowledgedAt = new Date().toISOString();

  db.incidents.set(incId, incident);

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'ALERT_ESCALATED_TO_INCIDENT',
    targetType: 'INCIDENT',
    targetId: incId,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { alertId: alert.id, incidentId: incId }
  });

  res.status(201).json({ incident, alert });
});

export default router;
