/**
/**
 * Semiconductor Intelligence Platform - Frontend Types
 */

export * from '../../server/types/index.ts';

import { Site, AuditLog, User, Organization, Device, TelemetryReading, Permission } from '../../server/types/index.ts';

export type CleanroomSite = Site;
export type AuditLogEntry = AuditLog;
export type CoolingType = 'AIR_FORCED' | 'LIQUID_COLD_PLATE' | 'IMMERSION_TWO_PHASE' | 'PASSIVE_HEATSINK' | 'LIQUID_CLOSED_LOOP' | 'IMMERSION' | 'PASSIVE';

export interface ReportData {
  id: string;
  title: string;
  type: string;
  deviceId?: string;
  generatedAt: string;
  summary: string;
  healthScore: number;
  temperatureC: number;
  failureProbability: number;
  recommendations: string[];
  metricsSnapshot: Record<string, any>;
}

export interface AuthState {
  user: {
    id: string;
    orgId: string;
    orgName: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'ENGINEER' | 'ANALYST' | 'OPERATOR' | 'VIEWER';
    isActive: boolean;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  environment: 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';
}

export interface DeviceFilterParams {
  siteId?: string;
  status?: string;
  mode?: string;
  search?: string;
  sortBy?: 'name' | 'healthScore' | 'temperatureC' | 'lastCommunication' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface TelemetryQueryParams {
  deviceId: string;
  startDate?: string;
  endDate?: string;
  resolution?: '1s' | '10s' | '1m' | '5m' | '1h';
  limit?: number;
}
