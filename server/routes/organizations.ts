/**
 * Organization & Site Management Routes
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.ts';
import { Site, Organization } from '../types/index.ts';

const router = Router();

router.use(authMiddleware);

// Get current organization details
router.get('/current', (req: AuthenticatedRequest, res: Response) => {
  const org = db.organizations.get(req.orgId || 'org-demo-01');
  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }
  res.json({ organization: org });
});

// List all organizations (SUPER_ADMIN only)
router.get('/', requireRole('SUPER_ADMIN'), (_req: AuthenticatedRequest, res: Response) => {
  res.json({ organizations: Array.from(db.organizations.values()) });
});

// Update organization settings
router.patch('/settings', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const org = db.organizations.get(req.orgId || 'org-demo-01');
  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  const { telemetryRetentionDays, anomalyThreshold, alertNotificationEmail, autoEscalateAlertsMinutes } = req.body;
  if (telemetryRetentionDays !== undefined) org.settings.telemetryRetentionDays = Number(telemetryRetentionDays);
  if (anomalyThreshold !== undefined) org.settings.anomalyThreshold = Number(anomalyThreshold);
  if (alertNotificationEmail !== undefined) org.settings.alertNotificationEmail = String(alertNotificationEmail);
  if (autoEscalateAlertsMinutes !== undefined) org.settings.autoEscalateAlertsMinutes = Number(autoEscalateAlertsMinutes);

  db.recordAudit({
    orgId: org.id,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'ORGANIZATION_SETTINGS_UPDATE',
    targetType: 'ORGANIZATION',
    targetId: org.id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { updatedSettings: org.settings }
  });

  res.json({ organization: org });
});

// List Sites for current tenant
router.get('/sites', (req: AuthenticatedRequest, res: Response) => {
  const sites = Array.from(db.sites.values()).filter(s => s.orgId === req.orgId);
  res.json({ sites });
});

// Create Site
router.post('/sites', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { name, code, location, timezone, description } = req.body;
  if (!name || !code) {
    res.status(400).json({ error: 'Site name and code are required' });
    return;
  }

  const id = `site-${Date.now().toString().slice(-6)}`;
  const site: Site = {
    id,
    orgId: req.orgId || 'org-demo-01',
    name,
    code,
    location: location || 'Cleanroom Facility',
    timezone: timezone || 'UTC',
    description: description || '',
    createdAt: new Date().toISOString()
  };

  db.sites.set(id, site);

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'SITE_CREATED',
    targetType: 'SITE',
    targetId: id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { name, code, location }
  });

  res.status(201).json({ site });
});

export default router;
