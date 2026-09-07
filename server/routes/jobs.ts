/**
 * Background Jobs & Asynchronous Worker Task Routes
 */

import { Router, Response } from 'express';
import { jobManager } from '../jobs/jobManager.ts';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.ts';

const router = Router();
router.use(authMiddleware);

// List all background jobs for current organization
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const jobs = jobManager.listJobs(req.orgId || 'org-demo-01');
  res.json({ jobs });
});

// Get single job status
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const job = jobManager.getJob(req.params.id, req.orgId || 'org-demo-01');
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json({ job });
});

// Trigger a new background job
router.post('/trigger', requireRole('ENGINEER'), (req: AuthenticatedRequest, res: Response) => {
  const { type, title, payload } = req.body;
  if (!type || !title) {
    res.status(400).json({ error: 'type and title are required fields' });
    return;
  }

  const job = jobManager.submitJob(
    type,
    title,
    req.orgId || 'org-demo-01',
    req.user?.name || 'Authorized Engineer',
    payload
  );

  res.status(202).json({
    message: 'Job successfully enqueued to background worker pool',
    job
  });
});

export default router;
