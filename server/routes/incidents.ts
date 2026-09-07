/**
 * Incident Management API Routes
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.ts';
import { Incident, IncidentStatus, AlertSeverity } from '../types/index.ts';

const router = Router();
router.use(authMiddleware);

// List incidents
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { status, severity, deviceId } = req.query;

  let incidents = Array.from(db.incidents.values()).filter(i => i.orgId === req.orgId);

  if (status) {
    incidents = incidents.filter(i => i.status === status);
  }
  if (severity) {
    incidents = incidents.filter(i => i.severity === severity);
  }
  if (deviceId) {
    incidents = incidents.filter(i => i.deviceId === deviceId);
  }

  incidents.sort((a, b) => new Date(b.detectedTime).getTime() - new Date(a.detectedTime).getTime());

  res.json({ incidents, count: incidents.length });
});

// Create Incident manually
router.post('/', requireRole('ENGINEER'), (req: AuthenticatedRequest, res: Response) => {
  const { title, deviceId, severity, description, assignedEngineer } = req.body;

  if (!title || !deviceId) {
    res.status(400).json({ error: 'Title and deviceId are required' });
    return;
  }

  const device = db.devices.get(deviceId);
  if (!device || device.orgId !== req.orgId) {
    res.status(404).json({ error: 'Device not found in current organization' });
    return;
  }

  const id = `INC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  const incident: Incident = {
    id,
    orgId: req.orgId || 'org-demo-01',
    title,
    deviceId: device.id,
    deviceName: device.name,
    severity: (severity as AlertSeverity) || 'WARNING',
    description: description || '',
    detectedTime: new Date().toISOString(),
    assignedEngineer: assignedEngineer || req.user!.name,
    status: 'OPEN',
    timeline: [
      {
        id: `tml-${Date.now()}`,
        timestamp: new Date().toISOString(),
        author: req.user!.name,
        message: 'Incident opened manually by engineer.',
        actionType: 'CREATED'
      }
    ],
    relatedAlertIds: []
  };

  db.incidents.set(id, incident);

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'INCIDENT_CREATED',
    targetType: 'INCIDENT',
    targetId: id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { title, deviceId }
  });

  res.status(201).json({ incident });
});

// Update Incident Status & Assignment
router.patch('/:id', requireRole('ENGINEER'), (req: AuthenticatedRequest, res: Response) => {
  const incident = db.incidents.get(req.params.id);
  if (!incident || incident.orgId !== req.orgId) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  const { status, assignedEngineer, resolution, note } = req.body;

  if (status) {
    const oldStatus = incident.status;
    incident.status = status as IncidentStatus;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      incident.resolvedAt = new Date().toISOString();
      if (resolution) incident.resolution = resolution;
    }

    incident.timeline.push({
      id: `tml-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: req.user!.name,
      message: `Status updated from ${oldStatus} to ${status}${resolution ? `. Resolution: ${resolution}` : ''}`,
      actionType: 'STATUS_CHANGE'
    });
  }

  if (assignedEngineer && assignedEngineer !== incident.assignedEngineer) {
    const oldAssignee = incident.assignedEngineer;
    incident.assignedEngineer = assignedEngineer;
    incident.timeline.push({
      id: `tml-${Date.now()}-assign`,
      timestamp: new Date().toISOString(),
      author: req.user!.name,
      message: `Assigned engineer changed from ${oldAssignee} to ${assignedEngineer}`,
      actionType: 'REASSIGN'
    });
  }

  if (note) {
    incident.timeline.push({
      id: `tml-${Date.now()}-note`,
      timestamp: new Date().toISOString(),
      author: req.user!.name,
      message: note,
      actionType: 'NOTE'
    });
  }

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'INCIDENT_UPDATED',
    targetType: 'INCIDENT',
    targetId: incident.id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { status: incident.status, assignedEngineer: incident.assignedEngineer }
  });

  res.json({ incident });
});

// Add Timeline Event / Engineer Note
router.post('/:id/timeline', requireRole('OPERATOR'), (req: AuthenticatedRequest, res: Response) => {
  const incident = db.incidents.get(req.params.id);
  if (!incident || incident.orgId !== req.orgId) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  const { message, actionType } = req.body;
  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const event = {
    id: `tml-${Date.now()}`,
    timestamp: new Date().toISOString(),
    author: req.user!.name,
    message,
    actionType: actionType || 'NOTE'
  };

  incident.timeline.push(event);

  res.status(201).json({ incident, event });
});

export default router;
