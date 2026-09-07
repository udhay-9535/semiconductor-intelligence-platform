/**
 * Dataset Registry & Versioning API Routes
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.ts';
import { DatasetRegistryEntry } from '../types/index.ts';

const router = Router();
router.use(authMiddleware);

// Seed initial datasets if empty
if (db.datasets.size === 0) {
  const initialDatasets: DatasetRegistryEntry[] = [
    {
      id: 'DS-WAFER-01',
      orgId: 'org-demo-01',
      name: 'WaferTest-4N-EUV-Telemetry',
      version: 'v2.1.0',
      description: '4nm EUV foundry wafer test dataset containing 120,000 multi-sensor vectors across nominal and stressed states.',
      rowCount: 120000,
      featureCount: 9,
      format: 'CSV',
      validationStatus: 'VALIDATED',
      uploadedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      uploadedBy: 'Dr. Elena Vance',
      checksum: 'sha256:8f9a2b1c4e6d3f0a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a'
    },
    {
      id: 'DS-HTOL-02',
      orgId: 'org-demo-01',
      name: 'HTOL-HighTempOperatingLife-Run98',
      version: 'v1.4.0',
      description: 'Accelerated life test log with 8,500 stress intervals for Arrhenius & TDDB failure prediction.',
      rowCount: 8500,
      featureCount: 12,
      format: 'PARQUET',
      validationStatus: 'VALIDATED',
      uploadedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      uploadedBy: 'Sarah Lindqvist',
      checksum: 'sha256:3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b'
    },
    {
      id: 'DS-HBM-03',
      orgId: 'org-demo-01',
      name: 'HBM3e-3D-Stack-Thermal-Mesh',
      version: 'v3.0-spatial',
      description: 'High-density micro-bump and thermal gradient spatial matrix dataset for 3D packaging autoencoder.',
      rowCount: 45000,
      featureCount: 16,
      format: 'CSV',
      validationStatus: 'VALIDATED',
      uploadedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      uploadedBy: 'Marcus Chen',
      checksum: 'sha256:1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f'
    }
  ];

  for (const ds of initialDatasets) {
    db.datasets.set(ds.id, ds);
  }
}

// List all datasets
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const datasets = Array.from(db.datasets.values()).filter(d => d.orgId === req.orgId);
  res.json({ datasets });
});

// Register / Upload new dataset
router.post('/', requireRole('ENGINEER'), (req: AuthenticatedRequest, res: Response) => {
  const { name, version, description, rowCount, featureCount, format } = req.body;
  if (!name || !version) {
    res.status(400).json({ error: 'name and version are required' });
    return;
  }

  const id = `DS-${name.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-${Date.now().toString(36).toUpperCase()}`;
  const dataset: DatasetRegistryEntry = {
    id,
    orgId: req.orgId || 'org-demo-01',
    name,
    version,
    description: description || 'Semiconductor engineering dataset',
    rowCount: Number(rowCount) || 1000,
    featureCount: Number(featureCount) || 9,
    format: format || 'CSV',
    validationStatus: 'VALIDATED',
    uploadedAt: new Date().toISOString(),
    uploadedBy: req.user?.name || 'Engineer',
    checksum: `sha256:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
  };

  db.datasets.set(id, dataset);

  db.recordAudit({
    orgId: req.orgId || 'org-demo-01',
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'DATASET_REGISTERED',
    targetType: 'DATASET',
    targetId: id,
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
    details: { datasetName: name, version, rowCount: dataset.rowCount }
  });

  res.status(201).json({ message: 'Dataset registered successfully', dataset });
});

export default router;
