/**
 * Audit Logging API Routes (Append-Only)
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);

// Query immutable audit logs
router.get('/', requireRole('VIEWER'), (req: AuthenticatedRequest, res: Response) => {
  const { action, targetType, userId, limit } = req.query;

  let logs = db.auditLogs.filter(l => l.orgId === req.orgId);

  if (action) {
    logs = logs.filter(l => l.action.toLowerCase().includes(String(action).toLowerCase()));
  }
  if (targetType) {
    logs = logs.filter(l => l.targetType === targetType);
  }
  if (userId) {
    logs = logs.filter(l => l.userId === userId);
  }

  const maxLimit = Math.min(200, Number(limit) || 50);
  const sliced = logs.slice(0, maxLimit);

  res.json({
    logs: sliced,
    total: logs.length,
    returned: sliced.length
  });
});

// Export Audit Log CSV
router.get('/export-csv', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const logs = db.auditLogs.filter(l => l.orgId === req.orgId);

  const headers = ['id', 'timestamp', 'userId', 'userName', 'userRole', 'action', 'targetType', 'targetId', 'result', 'ipAddress', 'details'];
  const rows = [headers.join(',')];

  for (const log of logs) {
    const detailsStr = JSON.stringify(log.details).replace(/"/g, '""');
    const row = [
      log.id,
      log.timestamp,
      log.userId,
      `"${log.userName}"`,
      log.userRole,
      log.action,
      log.targetType,
      log.targetId,
      log.result,
      log.ipAddress,
      `"${detailsStr}"`
    ];
    rows.push(row.join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="audit-log-export-${Date.now()}.csv"`);
  res.send(rows.join('\n'));
});

export default router;
