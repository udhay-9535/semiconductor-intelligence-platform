/**
 * OpenAPI 3.0.3 Specification & API Documentation Route
 */

import { Router, Request, Response } from 'express';

const router = Router();

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Semiconductor Intelligence Platform REST API',
    version: '1.0.0',
    description: 'Enterprise API for Semiconductor Digital Twin monitoring, real-time telemetry ingestion, Isolation Forest anomaly detection, What-If physics simulations, and failure prediction.',
    contact: {
      name: 'Semiconductor Systems Reliability Group',
      email: 'reliability@semilab.io'
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Production API Gateway v1'
    }
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate corporate user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'elena.vance@semilab.io' },
                  password: { type: 'string', example: '********' }
                },
                required: ['email']
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated successfully with user profile and session token' }
        }
      }
    },
    '/telemetry': {
      post: {
        summary: 'Ingest single or batch semiconductor telemetry readings',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  deviceId: { type: 'string', example: 'ST-001' },
                  temperatureC: { type: 'number', example: 68.4 },
                  voltageV: { type: 'number', example: 0.845 },
                  currentA: { type: 'number', example: 42.0 },
                  powerW: { type: 'number', example: 35.49 },
                  frequencyMHz: { type: 'number', example: 2400 },
                  utilizationPct: { type: 'number', example: 75.0 },
                  fanSpeedRpm: { type: 'number', example: 3400 },
                  coolingEfficiencyPct: { type: 'number', example: 94.0 },
                  errorCount: { type: 'integer', example: 0 }
                },
                required: ['deviceId', 'temperatureC', 'voltageV']
              }
            }
          }
        },
        responses: {
          201: { description: 'Telemetry ingested, anomaly score computed, and alerts evaluated' },
          400: { description: 'Invalid schema or malformed numeric values' }
        }
      },
      get: {
        summary: 'Query time-series telemetry with downsampling and date filters',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'deviceId', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } }
        ],
        responses: {
          200: { description: 'Array of telemetry readings with Isolation Forest anomaly tags' }
        }
      }
    },
    '/devices': {
      get: {
        summary: 'List registered devices with health metrics and active scenario tags',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of devices' }
        }
      },
      post: {
        summary: 'Register new semiconductor device or package',
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Device registered' }
        }
      }
    },
    '/digital-twins/{deviceId}': {
      get: {
        summary: 'Get real-time Digital Twin state and on-die subsystem metrics',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Digital Twin state with Compute, Memory, Power, Clock, Thermal, Sensors, I/O' }
        }
      }
    },
    '/simulations/what-if': {
      post: {
        summary: 'Execute What-If multi-variable stress simulation and physics differential',
        responses: {
          200: { description: 'Baseline vs Scenario metrics, delta calculations, and impact summary' }
        }
      }
    },
    '/models': {
      get: {
        summary: 'List ML Model Registry entries and validation metrics',
        responses: {
          200: { description: 'List of registered Isolation Forest and Reliability models' }
        }
      }
    },
    '/alerts': {
      get: {
        summary: 'List alerts filtered by status and severity',
        responses: {
          200: { description: 'List of active or historical alerts' }
        }
      }
    },
    '/incidents': {
      get: {
        summary: 'List engineering incidents and timelines',
        responses: {
          200: { description: 'List of incidents' }
        }
      }
    },
    '/reports/generate': {
      post: {
        summary: 'Generate structured downloadable engineering report',
        responses: {
          200: { description: 'Structured report payload' }
        }
      }
    },
    '/audit': {
      get: {
        summary: 'Query immutable append-only audit trail',
        responses: {
          200: { description: 'Audit log records' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

router.get('/', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

export default router;
