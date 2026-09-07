/**
 * User & Role Management Routes (RBAC Enforced)
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.ts';
import { User, UserRole } from '../types/index.ts';

const router = Router();
router.use(authMiddleware);

// List users for tenant
router.get('/', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const users = Array.from(db.users.values()).filter(u => u.orgId === req.orgId);
  res.json({ users });
});

// Invite / Create user
router.post('/invite', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { name, email, role } = req.body;
  
  if (!name || !email || !role) {
    res.status(400).json({ error: 'Name, email, and role are required' });
    return;
  }

  const existing = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(409).json({ error: 'A user with this corporate email already exists' });
    return;
  }

  const id = `usr-${Date.now().toString().slice(-6)}`;
  const newUser: User = {
    id,
    orgId: req.orgId || 'org-demo-01',
    name,
    email,
    role: role as UserRole,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  db.users.set(id, newUser);

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'USER_INVITED',
    targetType: 'USER',
    targetId: id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { email, role }
  });

  res.status(201).json({ user: newUser });
});

// Update user role
router.patch('/:id/role', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.get(req.params.id);
  if (!user || user.orgId !== req.orgId) {
    res.status(404).json({ error: 'User not found in current organization' });
    return;
  }

  const { role } = req.body;
  if (!role) {
    res.status(400).json({ error: 'Role is required' });
    return;
  }

  const oldRole = user.role;
  user.role = role as UserRole;

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'USER_ROLE_CHANGED',
    targetType: 'USER',
    targetId: user.id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { oldRole, newRole: role }
  });

  res.json({ user });
});

// Activate / Deactivate user
router.patch('/:id/status', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.get(req.params.id);
  if (!user || user.orgId !== req.orgId) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { isActive } = req.body;
  user.isActive = Boolean(isActive);

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    targetType: 'USER',
    targetId: user.id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { isActive: user.isActive }
  });

  res.json({ user });
});

export default router;
