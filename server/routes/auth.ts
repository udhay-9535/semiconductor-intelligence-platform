/**
 * Authentication & Session Management Routes
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.ts';

const router = Router();

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user || !user.isActive) {
    res.status(401).json({ error: 'Invalid credentials or inactive account' });
    return;
  }

  user.lastLogin = new Date().toISOString();

  db.recordAudit({
    orgId: user.orgId,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'USER_LOGIN',
    targetType: 'USER',
    targetId: user.id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { loginTime: user.lastLogin }
  });

  const org = db.organizations.get(user.orgId);

  res.json({
    token: user.id,
    user: {
      id: user.id,
      orgId: user.orgId,
      orgName: org?.name || 'Example Semiconductor Lab',
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
  });
});

// Switch active role / user in Demo environment
router.post('/demo-switch-user', (req, res) => {
  const { userId } = req.body;
  const user = db.users.get(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const org = db.organizations.get(user.orgId);
  user.lastLogin = new Date().toISOString();

  res.json({
    token: user.id,
    user: {
      id: user.id,
      orgId: user.orgId,
      orgName: org?.name || 'Example Semiconductor Lab',
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
  });
});

// Current user profile
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const org = db.organizations.get(req.user.orgId);

  res.json({
    user: {
      id: req.user.id,
      orgId: req.user.orgId,
      orgName: org?.name || 'Example Semiconductor Lab',
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive
    }
  });
});

// Logout
router.post('/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    db.recordAudit({
      orgId: req.user.orgId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_LOGOUT',
      targetType: 'USER',
      targetId: req.user.id,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS',
      details: { timestamp: new Date().toISOString() }
    });
  }

  res.json({ message: 'Logged out successfully' });
});

// Password reset request architecture
router.post('/reset-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  // In production: send token via email service
  res.json({
    message: 'If the email exists, a password reset instruction has been dispatched to your corporate inbox.',
    simulatedTokenSent: true
  });
});

export default router;
