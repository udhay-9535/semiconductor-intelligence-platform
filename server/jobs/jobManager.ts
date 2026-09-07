/**
 * Background Job Queue & Task Manager
 * 
 * Supports long-running non-blocking tasks:
 * - Model Training
 * - Dataset Ingestion & Validation
 * - Report Generation
 * - Batch ML Inference
 * - System Diagnostic Audits
 */

import { BackgroundJob, JobType, JobStatus } from '../types/index.ts';
import { db } from '../db/database.ts';

export class BackgroundJobManager {
  private activeJobs: Map<string, BackgroundJob> = new Map();

  constructor() {
    this.seedInitialJobs();
  }

  private seedInitialJobs() {
    const initialJobs: BackgroundJob[] = [
      {
        id: 'job-train-01',
        orgId: 'org-demo-01',
        type: 'MODEL_TRAINING',
        title: 'Isolation Forest Anomaly Model Retraining (Wafer-4N Dataset)',
        status: 'COMPLETED',
        progressPct: 100,
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        startedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3.8 * 3600000).toISOString(),
        createdBy: 'Dr. Elena Vance',
        resultData: {
          modelId: 'MOD-IF-01',
          trainedTrees: 50,
          precision: 0.942,
          recall: 0.968,
          f1Score: 0.955
        }
      },
      {
        id: 'job-ingest-02',
        orgId: 'org-demo-01',
        type: 'DATASET_INGESTION',
        title: 'High-Temperature Operating Life (HTOL) Run-98 CSV Validation',
        status: 'COMPLETED',
        progressPct: 100,
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        startedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        completedAt: new Date(Date.now() - 11.9 * 3600000).toISOString(),
        createdBy: 'Sarah Lindqvist',
        resultData: {
          datasetId: 'DS-HTOL-02',
          recordsProcessed: 8500,
          validPercentage: 99.8
        }
      }
    ];

    for (const j of initialJobs) {
      this.activeJobs.set(j.id, j);
    }
  }

  public listJobs(orgId: string): BackgroundJob[] {
    return Array.from(this.activeJobs.values())
      .filter(j => j.orgId === orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getJob(id: string, orgId: string): BackgroundJob | undefined {
    const job = this.activeJobs.get(id);
    if (job && job.orgId === orgId) return job;
    return undefined;
  }

  public submitJob(
    type: JobType,
    title: string,
    orgId: string,
    createdBy: string,
    payload?: Record<string, any>
  ): BackgroundJob {
    const id = `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const job: BackgroundJob = {
      id,
      orgId,
      type,
      title,
      status: 'QUEUED',
      progressPct: 0,
      createdAt: new Date().toISOString(),
      createdBy
    };

    this.activeJobs.set(id, job);

    // Asynchronously run the simulated or real task runner
    setTimeout(() => {
      this.executeJob(id, payload);
    }, 500);

    return job;
  }

  private async executeJob(id: string, payload?: Record<string, any>) {
    const job = this.activeJobs.get(id);
    if (!job) return;

    job.status = 'RUNNING';
    job.startedAt = new Date().toISOString();
    job.progressPct = 10;

    // Simulate progress updates over a short realistic period
    const interval = setInterval(() => {
      if (job.progressPct < 90) {
        job.progressPct += 20;
      } else {
        clearInterval(interval);
        job.status = 'COMPLETED';
        job.progressPct = 100;
        job.completedAt = new Date().toISOString();
        job.resultData = {
          executedType: job.type,
          timestamp: new Date().toISOString(),
          details: payload || { processedItems: 1200, status: 'SUCCESS' }
        };

        db.recordAudit({
          orgId: job.orgId,
          userId: 'SYSTEM',
          userName: 'Background Worker',
          userRole: 'SUPER_ADMIN',
          action: 'BACKGROUND_JOB_COMPLETED',
          targetType: 'JOB',
          targetId: job.id,
          ipAddress: '127.0.0.1',
          result: 'SUCCESS',
          details: { jobType: job.type, title: job.title }
        });
      }
    }, 600);
  }
}

export const jobManager = new BackgroundJobManager();
