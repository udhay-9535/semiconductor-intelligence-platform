/**
 * Semiconductor Intelligence Platform - Core Backend Server
 * 
 * Express + Vite Full-Stack Enterprise Application Server
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Import route modules
import authRoutes from './server/routes/auth.ts';
import orgRoutes from './server/routes/organizations.ts';
import userRoutes from './server/routes/users.ts';
import deviceRoutes from './server/routes/devices.ts';
import telemetryRoutes from './server/routes/telemetry.ts';
import digitalTwinRoutes from './server/routes/digitalTwins.ts';
import mlRoutes from './server/routes/ml.ts';
import simulationRoutes from './server/routes/simulations.ts';
import alertRoutes from './server/routes/alerts.ts';
import incidentRoutes from './server/routes/incidents.ts';
import analyticsRoutes from './server/routes/analytics.ts';
import reportRoutes from './server/routes/reports.ts';
import integrationRoutes from './server/routes/integrations.ts';
import auditRoutes from './server/routes/audit.ts';
import aiRoutes from './server/routes/aiDiagnostics.ts';
import docsRoutes from './server/routes/docs.ts';
import engineeringLabRoutes from './server/routes/engineeringLab.ts';
import gpuLabRoutes from './server/routes/gpuLab.ts';
import codesignLabRoutes from './server/routes/codesignLab.ts';
import dspQuantumRoutes from './server/routes/dspQuantumLab.ts';
import sqlAnalyticsRoutes from './server/routes/sqlAnalytics.ts';
import devopsRoutes from './server/routes/devopsHub.ts';
import jobsRoutes from './server/routes/jobs.ts';
import datasetsRoutes from './server/routes/datasets.ts';

// Simulator service
import { simulator } from './server/simulator/telemetrySimulator.ts';

dotenv.config();

const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer() {
  const app = express();

  // Basic security headers & parsing middleware
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // CORS & Security Headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-ID');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Observability & Readiness Probes
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'HEALTHY',
      service: 'semiconductor-intelligence-platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    });
  });

  app.get('/ready', (_req: Request, res: Response) => {
    res.json({
      status: 'READY',
      telemetrySimulatorActive: true,
      databaseReady: true
    });
  });

  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      modules: {
        telemetryPipeline: 'ONLINE',
        digitalTwinEngine: 'ONLINE',
        isolationForestML: 'ONLINE',
        alertEngine: 'ONLINE',
        auditService: 'ONLINE',
        jobQueue: 'ONLINE'
      }
    });
  });

  // Mount API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/organizations', orgRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/devices', deviceRoutes);
  app.use('/api/v1/telemetry', telemetryRoutes);
  app.use('/api/v1/digital-twins', digitalTwinRoutes);
  app.use('/api/v1/models', mlRoutes);
  app.use('/api/v1/predictions', mlRoutes);
  app.use('/api/v1/simulations', simulationRoutes);
  app.use('/api/v1/alerts', alertRoutes);
  app.use('/api/v1/incidents', incidentRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/integrations', integrationRoutes);
  app.use('/api/v1/audit', auditRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/docs', docsRoutes);
  app.use('/api/v1/engineering-lab', engineeringLabRoutes);
  app.use('/api/v1/gpu-lab', gpuLabRoutes);
  app.use('/api/v1/codesign', codesignLabRoutes);
  app.use('/api/v1/dsp-quantum', dspQuantumRoutes);
  app.use('/api/v1/sql-analytics', sqlAnalyticsRoutes);
  app.use('/api/v1/devops', devopsRoutes);
  app.use('/api/v1/jobs', jobsRoutes);
  app.use('/api/v1/datasets', datasetsRoutes);

  // Fallback for any unmatched /api routes to prevent returning HTML SPA fallback
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `API endpoint ${req.method} ${req.originalUrl} not found on server`
    });
  });

  // Start background continuous telemetry simulator
  simulator.start();

  // Vite middleware in dev / static in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error('[Server Error]', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred during processing' 
        : err.message
    });
  });

  app.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`  Semiconductor Intelligence Platform Backend Active`);
    console.log(`  Port: ${PORT} | Host: ${HOST}`);
    console.log(`  API Base: http://${HOST}:${PORT}/api/v1`);
    console.log(`  Health Probe: http://${HOST}:${PORT}/health`);
    console.log(`=======================================================`);
  });
}

startServer();
