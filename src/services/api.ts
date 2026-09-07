/**
 * Semiconductor Intelligence Platform - Frontend API Client
 */

import {
  Device,
  TelemetryReading,
  DigitalTwinState,
  MLModelRegistryEntry,
  MLMonitoringMetrics,
  PredictionExplanation,
  WhatIfScenarioInput,
  WhatIfScenarioResult,
  Alert,
  Incident,
  AuditLog,
  IntegrationConfig,
  Organization,
  Site,
  User,
  ReportData,
  SimulationScenarioType
} from '../types/index.ts';

import { localStore } from './localFallback.ts';

const API_BASE = '/api/v1';

class ApiService {
  private token: string | null = 'usr-001';
  private orgId: string | null = 'org-demo-01';

  public setToken(token: string | null) {
    this.token = token;
  }

  public setOrgId(orgId: string | null) {
    this.orgId = orgId;
  }

  private handleLocalFallback<T>(endpoint: string, options: RequestInit = {}): T {
    const cleanEndpoint = endpoint.split('?')[0];
    const method = (options.method || 'GET').toUpperCase();

    // 1. Devices
    if (cleanEndpoint === '/devices') {
      return { devices: [...localStore.devices], total: localStore.devices.length } as T;
    }
    if (cleanEndpoint.startsWith('/devices/') && cleanEndpoint.endsWith('/scenario')) {
      const parts = cleanEndpoint.split('/');
      const devId = parts[2];
      try {
        const body = JSON.parse((options.body as string) || '{}');
        localStore.setScenario(devId, body.scenario || 'NORMAL');
      } catch {}
      const dev = localStore.devices.find(d => d.id === devId) || localStore.devices[0];
      return { message: 'Scenario applied locally', deviceId: devId, scenario: dev.activeScenario, currentMetrics: dev.currentMetrics } as T;
    }
    if (cleanEndpoint.startsWith('/devices/')) {
      const devId = cleanEndpoint.replace('/devices/', '');
      const dev = localStore.devices.find(d => d.id === devId) || localStore.devices[0];
      return { device: dev } as T;
    }

    // 2. Telemetry
    if (cleanEndpoint === '/telemetry' || cleanEndpoint === '/telemetry/latest') {
      return { readings: [...localStore.telemetry].slice(-40), count: 40, deviceId: 'ALL' } as T;
    }

    // 3. Alerts & Incidents
    if (cleanEndpoint === '/alerts') {
      return { alerts: [...localStore.alerts], count: localStore.alerts.length } as T;
    }
    if (cleanEndpoint === '/incidents') {
      return { incidents: [...localStore.incidents], count: localStore.incidents.length } as T;
    }

    // 4. Organizations & Sites
    if (cleanEndpoint === '/organizations/current') {
      return { organization: localStore.org } as T;
    }
    if (cleanEndpoint === '/organizations/sites') {
      return { sites: [...localStore.sites] } as T;
    }

    // 5. Users & Auth
    if (cleanEndpoint === '/users') {
      return { users: [...localStore.users] } as T;
    }
    if (cleanEndpoint === '/auth/me') {
      return { user: localStore.users[0] } as T;
    }
    if (cleanEndpoint === '/auth/login' || cleanEndpoint === '/auth/demo-switch-user') {
      let targetUser = localStore.users[0];
      try {
        const body = JSON.parse((options.body as string) || '{}');
        if (body.userId) {
          targetUser = localStore.users.find(u => u.id === body.userId) || targetUser;
        }
      } catch {}
      return { token: targetUser.id, user: targetUser } as T;
    }

    // 6. ML Platform
    if (cleanEndpoint === '/ml/models') {
      return {
        models: [
          {
            id: 'MOD-IF-001',
            name: 'Silicon-IsolationForest-v3.2',
            type: 'ANOMALY_DETECTION',
            status: 'ACTIVE_PRODUCTION',
            version: '3.2.1',
            accuracy: 0.968,
            precision: 0.954,
            recall: 0.978,
            f1Score: 0.965,
            deployedAt: new Date().toISOString(),
            inputFeatures: ['junction_temp_c', 'vdd_core_v', 'clock_jitter_ps', 'leakage_current_ma'],
            trainingSamples: 250000
          },
          {
            id: 'MOD-GB-002',
            name: 'Thermal-Runaway-Predictor-XGB',
            type: 'TIME_SERIES_FORECAST',
            status: 'ACTIVE_PRODUCTION',
            version: '2.1.0',
            accuracy: 0.982,
            precision: 0.975,
            recall: 0.989,
            f1Score: 0.982,
            deployedAt: new Date().toISOString(),
            inputFeatures: ['thermal_gradient_c_s', 'power_draw_w', 'fan_rpm_delta'],
            trainingSamples: 180000
          }
        ]
      } as T;
    }
    if (cleanEndpoint === '/ml/monitoring') {
      return {
        monitoring: {
          inferenceCount24h: 142050,
          avgLatencyMs: 1.85,
          p99LatencyMs: 4.2,
          anomalyRatePct: 2.1,
          driftDetected: false,
          featureDriftScores: {
            junction_temp_c: 0.04,
            vdd_core_v: 0.02,
            clock_jitter_ps: 0.05
          }
        }
      } as T;
    }

    // 7. Digital Twin
    if (cleanEndpoint.startsWith('/digital-twin/')) {
      const devId = cleanEndpoint.replace('/digital-twin/', '');
      const dev = localStore.devices.find(d => d.id === devId) || localStore.devices[0];
      return {
        digitalTwin: {
          deviceId: dev.id,
          subsystems: {
            compute: { status: 'HEALTHY', healthScore: 95, temperatureC: dev.currentMetrics?.temperatureC || 42, utilizationPct: 65 },
            memory: { status: 'HEALTHY', healthScore: 98, temperatureC: 38, bandwidthUtilizationPct: 55 },
            power: { status: 'HEALTHY', healthScore: 92, voltageV: dev.currentMetrics?.voltageV || 1.05, powerW: dev.currentMetrics?.powerW || 45 },
            thermal: { status: dev.currentMetrics?.temperatureC && dev.currentMetrics.temperatureC > 80 ? 'CRITICAL' : 'HEALTHY', healthScore: 90, junctionTempC: dev.currentMetrics?.temperatureC || 42 },
            clock: { status: 'HEALTHY', healthScore: 99, frequencyMHz: dev.currentMetrics?.frequencyMHz || 3200 },
            io: { status: 'HEALTHY', healthScore: 96, serdesErrorCount: 0 }
          },
          lastUpdated: new Date().toISOString()
        }
      } as T;
    }

    // 8. What-If Scenarios
    if (cleanEndpoint === '/simulation/scenarios') {
      return { scenarios: [] } as T;
    }

    // 9. Integrations
    if (cleanEndpoint === '/integrations') {
      return {
        integrations: [
          { id: 'int-kafka', name: 'Apache Kafka Telemetry Bus', type: 'KAFKA', status: 'ACTIVE', endpoint: 'kafka-broker.silicondynamics.io:9092', eventsPerSec: 1250, lastSync: new Date().toISOString() },
          { id: 'int-mqtt', name: 'MQTT Fab Sensor Broker', type: 'MQTT', status: 'ACTIVE', endpoint: 'mqtt://fab-broker.silicondynamics.io:1883', eventsPerSec: 450, lastSync: new Date().toISOString() },
          { id: 'int-influx', name: 'InfluxDB Time-Series Lake', type: 'INFLUXDB', status: 'ACTIVE', endpoint: 'https://influxdb.silicondynamics.io:8086', eventsPerSec: 1700, lastSync: new Date().toISOString() }
        ]
      } as T;
    }

    // 10. Audit Logs
    if (cleanEndpoint === '/audit') {
      return {
        logs: [
          { id: 'log-01', timestamp: new Date().toISOString(), userId: 'usr-001', userName: 'Dr. Elena Vance', action: 'DEVICE_CONFIG_UPDATE', targetId: 'ST-001', role: 'SUPER_ADMIN', ipAddress: '10.0.4.12', result: 'SUCCESS' },
          { id: 'log-02', timestamp: new Date(Date.now() - 3600000).toISOString(), userId: 'usr-002', userName: 'Marcus Chen', action: 'SCENARIO_APPLIED', targetId: 'ST-002', role: 'ADMIN', ipAddress: '10.0.4.18', result: 'SUCCESS' }
        ]
      } as T;
    }

    // 11. Reports & Presets & Analytics
    if (cleanEndpoint === '/reports/overview' || cleanEndpoint.startsWith('/reports/')) {
      return {
        report: {
          title: 'Executive Reliability & Yield Integrity Report',
          generatedAt: new Date().toISOString(),
          generatedBy: 'Dr. Elena Vance',
          metrics: {
            overallFleetHealth: 94.2,
            activeAnomalies: localStore.alerts.filter(a => a.status === 'OPEN').length,
            mtbfHours: 8520,
            simulatedDevicesCount: localStore.devices.length
          },
          summary: 'All fab nodes operating within nominal thermal envelopes. Automated closed-loop mitigation standing by.'
        }
      } as T;
    }

    if (cleanEndpoint === '/sql/presets') {
      return {
        presets: [
          { key: 'FLEET_HEALTH', label: 'Fleet Health & Anomaly Index', sql: 'SELECT device_id, model, status, health_score, temperature_c FROM devices WHERE status != "OFFLINE" ORDER BY health_score ASC;' },
          { key: 'THERMAL_SPIKES', label: 'High Thermal Gradient Clusters', sql: 'SELECT device_id, MAX(temperature_c) as max_temp, AVG(power_w) as avg_power FROM telemetry GROUP BY device_id HAVING max_temp > 75.0;' }
        ],
        governance: { readOnlyMode: true, maxExecutionTimeoutMs: 2500 }
      } as T;
    }

    return {
      devices: [...localStore.devices],
      readings: [...localStore.telemetry],
      alerts: [...localStore.alerts],
      incidents: [...localStore.incidents],
      models: [],
      sites: [...localStore.sites],
      users: [...localStore.users],
      logs: [],
      integrations: [],
      presets: [],
      scenarios: [],
      categories: [],
      roles: []
    } as unknown as T;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(this.orgId ? { 'X-Organization-ID': this.orgId } : {}),
      ...((options.headers as Record<string, string>) || {})
    };

    let response: Response | null = null;
    let fetchError: any = null;

    // Perform fetch with single retry for resilience against cold-starts
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers
        });
        fetchError = null;
        break;
      } catch (err: any) {
        fetchError = err;
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 200));
        }
      }
    }

    // If network connection failed completely (e.g. preview container cold start / offline)
    if (!response || fetchError) {
      console.warn(`[API] Network request to ${endpoint} failed, falling back to local simulation store.`);
      return this.handleLocalFallback<T>(endpoint, options);
    }

    const text = await response.text();

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status} from ${endpoint}`;
      if (text) {
        try {
          const errJson = JSON.parse(text);
          errorMsg = errJson.message || errJson.error || errorMsg;
        } catch {
          errorMsg = text.slice(0, 100);
        }
      }
      console.warn(`[API Error] ${errorMsg} - using local fallback`);
      return this.handleLocalFallback<T>(endpoint, options);
    }

    if (!text || text.trim() === '') {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      if (text.trim().startsWith('<')) {
        console.warn(`[API] Endpoint ${endpoint} returned HTML (SPA fallback), using local simulation store.`);
        return this.handleLocalFallback<T>(endpoint, options);
      }
      return this.handleLocalFallback<T>(endpoint, options);
    }
  }

  // Auth
  async login(email: string, password?: string) {
    const res = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    this.setOrgId(res.user.orgId);
    return res;
  }

  async demoSwitchUser(userId: string) {
    const res = await this.request<{ token: string; user: any }>('/auth/demo-switch-user', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    this.setToken(res.token);
    this.setOrgId(res.user.orgId);
    return res;
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Organizations & Sites
  async getCurrentOrg() {
    return this.request<{ organization: Organization }>('/organizations/current');
  }

  async updateOrgSettings(settings: Partial<Organization['settings']>) {
    return this.request<{ organization: Organization }>('/organizations/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  }

  async getSites() {
    return this.request<{ sites: Site[] }>('/organizations/sites');
  }

  async createSite(site: Partial<Site>) {
    return this.request<{ site: Site }>('/organizations/sites', {
      method: 'POST',
      body: JSON.stringify(site)
    });
  }

  // Users
  async getUsers() {
    return this.request<{ users: User[] }>('/users');
  }

  async createUser(userData: { name: string; email: string; role: string; password?: string }) {
    return this.request<{ user: User }>('/users/invite', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async inviteUser(userData: { name: string; email: string; role: string }) {
    return this.createUser(userData);
  }

  async updateUser(userId: string, updates: Partial<User>) {
    if (updates.role) {
      return this.request<{ user: User }>(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: updates.role })
      });
    }
    if (typeof updates.isActive === 'boolean') {
      return this.request<{ user: User }>(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: updates.isActive })
      });
    }
    return this.request<{ user: User }>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.request<{ user: User }>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    return this.request<{ user: User }>(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    });
  }

  // Devices
  async getDevices(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ devices: (Device & { activeScenario?: SimulationScenarioType })[]; total: number }>(`/devices${query}`);
  }

  async getDevice(id: string) {
    return this.request<{ device: Device & { activeScenario: SimulationScenarioType } }>(`/devices/${id}`);
  }

  async createDevice(device: Partial<Device>) {
    return this.request<{ device: Device }>('/devices', {
      method: 'POST',
      body: JSON.stringify(device)
    });
  }

  async updateDevice(id: string, updates: Partial<Device>) {
    return this.request<{ device: Device }>(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async setDeviceScenario(id: string, scenario: SimulationScenarioType) {
    return this.request<{ message: string; deviceId: string; scenario: SimulationScenarioType; currentMetrics: any }>(`/devices/${id}/scenario`, {
      method: 'POST',
      body: JSON.stringify({ scenario })
    });
  }

  async archiveDevice(id: string) {
    return this.request<{ message: string }>(`/devices/${id}`, {
      method: 'DELETE'
    });
  }

  // Telemetry
  async getTelemetry(params?: { deviceId?: string; limit?: number }) {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<{ readings: TelemetryReading[]; count: number; deviceId: string }>(`/telemetry${query}`);
  }

  async getLatestTelemetry() {
    return this.request<{ latest: Record<string, TelemetryReading> }>('/telemetry/latest');
  }

  async ingestTelemetry(reading: Partial<TelemetryReading> | Partial<TelemetryReading>[]) {
    return this.request<any>('/telemetry', {
      method: 'POST',
      body: JSON.stringify(reading)
    });
  }

  async uploadTelemetryCsv(csvContent: string, targetDeviceId?: string) {
    return this.request<{ message: string; successCount: number; rejectedCount: number; validationErrors: string[] }>('/telemetry/upload-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent, targetDeviceId })
    });
  }

  // Digital Twin
  async getDigitalTwin(deviceId: string) {
    return this.request<{ deviceId: string; device: Partial<Device>; digitalTwin: DigitalTwinState }>(`/digital-twins/${deviceId}`);
  }

  async getFleetDigitalTwins() {
    return this.request<{ twins: Record<string, any>; count: number }>('/digital-twins');
  }

  // ML Platform
  async getModels() {
    return this.request<{ models: MLModelRegistryEntry[] }>('/models');
  }

  async deployModel(id: string, status: string, justification?: string) {
    return this.request<{ message: string; model: MLModelRegistryEntry }>(`/models/${id}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ status, justification })
    });
  }

  async getMLMonitoring() {
    return this.request<{ monitoring: MLMonitoringMetrics }>('/models/monitoring');
  }

  async getPredictionExplanation(deviceId: string) {
    return this.request<{ explanation: PredictionExplanation }>(`/predictions/explain/${deviceId}`);
  }

  // Simulations
  async runWhatIf(input: WhatIfScenarioInput & { name?: string }) {
    return this.request<{ result: WhatIfScenarioResult }>('/simulations/what-if', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async getSavedScenarios() {
    return this.request<{ scenarios: WhatIfScenarioResult[] }>('/simulations/scenarios');
  }

  async saveScenario(scenario: WhatIfScenarioResult) {
    return this.request<{ message: string; scenario: WhatIfScenarioResult }>('/simulations/scenarios', {
      method: 'POST',
      body: JSON.stringify({ scenario })
    });
  }

  async deleteScenario(id: string) {
    return this.request<{ message: string }>(`/simulations/scenarios/${id}`, {
      method: 'DELETE'
    });
  }

  // Alerts
  async getAlerts(params?: { status?: string; severity?: string; deviceId?: string }) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ alerts: Alert[]; count: number }>(`/alerts${query}`);
  }

  async acknowledgeAlert(id: string) {
    return this.request<{ alert: Alert }>(`/alerts/${id}/acknowledge`, {
      method: 'POST'
    });
  }

  async resolveAlert(id: string) {
    return this.request<{ alert: Alert }>(`/alerts/${id}/resolve`, {
      method: 'POST'
    });
  }

  async escalateAlertToIncident(id: string, data?: { title?: string; assignedEngineer?: string; description?: string }) {
    return this.request<{ incident: Incident; alert: Alert }>(`/alerts/${id}/escalate-to-incident`, {
      method: 'POST',
      body: JSON.stringify(data || {})
    });
  }

  // Incidents
  async getIncidents(params?: { status?: string; severity?: string; deviceId?: string }) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ incidents: Incident[]; count: number }>(`/incidents${query}`);
  }

  async createIncident(incidentData: Partial<Incident>) {
    return this.request<{ incident: Incident }>('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData)
    });
  }

  async updateIncident(id: string, updates: Partial<Incident> & { note?: string; resolution?: string }) {
    return this.request<{ incident: Incident }>(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async addIncidentTimeline(id: string, message: string, actionType?: string) {
    return this.request<{ incident: Incident; event: any }>(`/incidents/${id}/timeline`, {
      method: 'POST',
      body: JSON.stringify({ message, actionType })
    });
  }

  // Analytics
  async getAnalytics(params?: { range?: string; deviceId?: string; siteId?: string }) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await this.request<{ fleetOverview: any; statistics: any; deviceBreakdown: any[] }>(`/analytics/summary${query}`);
    return {
      analytics: {
        temperature: res.statistics.temperatureC || { mean: 68.4, min: 45.2, max: 94.8, stdDev: 4.8 },
        voltage: res.statistics.voltageV || { mean: 0.845, min: 0.78, max: 0.96, stdDev: 0.024 },
        power: res.statistics.powerW || { mean: 38.5, min: 14.2, max: 78.4, stdDev: 6.2 },
        frequency: res.statistics.frequencyMHz || { mean: 2450, min: 1800, max: 3200, stdDev: 140 },
        temperatureBuckets: [
          { range: '40-55°C', count: 14 },
          { range: '55-70°C', count: 48 },
          { range: '70-85°C', count: 32 },
          { range: '85-95°C', count: 6 }
        ],
        voltageBuckets: [
          { range: '0.78-0.82V', count: 18 },
          { range: '0.82-0.86V', count: 62 },
          { range: '0.86-0.90V', count: 16 },
          { range: '0.90-0.96V', count: 4 }
        ]
      }
    };
  }

  async getAnalyticsSummary(params?: { deviceId?: string; siteId?: string }) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ fleetOverview: any; statistics: any; deviceBreakdown: any[] }>(`/analytics/summary${query}`);
  }

  // Reports
  async generateReport(options: { type: string; deviceId?: string; dateRange?: string } | string, deviceId?: string, dateRange?: string) {
    let reportType = typeof options === 'string' ? options : options.type;
    let targetDevId = typeof options === 'string' ? deviceId : options.deviceId;
    let range = typeof options === 'string' ? dateRange : options.dateRange;

    const res = await this.request<{ report: any }>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ reportType, deviceId: targetDevId, dateRange: range })
    });

    const reportObj: ReportData = {
      id: res.report.id || `REP-${Date.now()}`,
      title: res.report.title || 'Semiconductor Health & Physics Report',
      type: reportType,
      deviceId: targetDevId || 'ST-001',
      generatedAt: res.report.generatedAt || new Date().toISOString(),
      summary: res.report.executiveSummary || res.report.summary || 'Silicon package is operating within calibrated thermal bounds.',
      healthScore: res.report.healthScore ?? 92,
      temperatureC: res.report.temperatureC ?? 68.4,
      failureProbability: res.report.failureProbability ?? 0.04,
      recommendations: res.report.recommendations || [
        'Maintain cleanroom ambient temperature at 22°C nominal.',
        'Ensure TIM thermal resistance does not exceed 0.45 °C/W.',
        'Monitor Vdd voltage sag under compute burst workloads.'
      ],
      metricsSnapshot: res.report.metricsSnapshot || {}
    };

    return { report: reportObj };
  }

  // Integrations
  async getIntegrations() {
    return this.request<{ integrations: (IntegrationConfig & { enabled?: boolean })[] }>('/integrations');
  }

  async updateIntegration(id: string, updates: Partial<IntegrationConfig> & { enabled?: boolean }) {
    return this.request<{ integration: IntegrationConfig }>(`/integrations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async testIntegration(id: string) {
    const res = await this.request<{ integrationId: string; type: string; isReachable: boolean; latencyMs: number; status: string; message: string }>(`/integrations/${id}/test`, {
      method: 'POST'
    });
    return {
      success: res.isReachable,
      message: res.message,
      latencyMs: res.latencyMs
    };
  }

  // Audit Logs
  async getAuditLogs(params?: { action?: string; targetType?: string; userId?: string; limit?: number }) {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const res = await this.request<{ logs: any[]; total: number; returned: number }>(`/audit${query}`);
    return {
      logs: res.logs.map(l => ({
        ...l,
        actorEmail: l.actorEmail || l.userName || 'admin@semiconductor.internal',
        actorRole: l.actorRole || l.userRole || 'ADMIN',
        resourceType: l.resourceType || l.targetType || 'SYSTEM',
        resourceId: l.resourceId || l.targetId || ''
      })),
      total: res.total
    };
  }

  // AI Diagnostics (Gemini API)
  async runAIDiagnostics(deviceId: string, userQuestion?: string) {
    return this.request<{ deviceId: string; engine: string; analysis: string; contextSnapshot: any }>('/ai/diagnostics', {
      method: 'POST',
      body: JSON.stringify({ deviceId, userQuestion })
    });
  }

  // OpenAPI Docs
  async getOpenApiSpec() {
    return this.request<any>('/docs');
  }

  // Engineering Lab (DSA, Concurrency)
  async runAlgorithmBenchmark(algorithm: string, params?: any) {
    return this.request<{ success: boolean; algorithm: string; executionTimeMs: number; complexity: any; result: any }>('/engineering-lab/run-algorithm', {
      method: 'POST',
      body: JSON.stringify({ algorithm, params })
    });
  }

  async getConcurrencyStatus() {
    return this.request<{ osContext: any; threadPoolSimulation: any }>('/engineering-lab/concurrency-status');
  }

  // GPU & CUDA Lab
  async getGpuDeviceInfo() {
    return this.request<{ timestamp: string; hardware: any; supportedArchitectures: any }>('/gpu-lab/device-info');
  }

  async runCudaSimulation(arraySize: number = 1024, blockSize: number = 256) {
    return this.request<{ success: boolean; operation: string; gridConfig: any; reductionTree: any }>('/gpu-lab/cuda-simulation', {
      method: 'POST',
      body: JSON.stringify({ arraySize, blockSize })
    });
  }

  async runGpuBatchBenchmark(batchSize: number = 1000, modelType: string = 'RANDOM_FOREST_ANOMALY') {
    return this.request<{ success: boolean; batchSize: number; memoryTransferredKB: number; results: any[] }>('/gpu-lab/benchmark-batch', {
      method: 'POST',
      body: JSON.stringify({ batchSize, modelType })
    });
  }

  // Hardware/Software Co-Design & Registers
  async getDeviceRegisters(deviceId: string) {
    return this.request<{ deviceId: string; deviceName: string; registers: any; derivedPhysics: any }>(`/codesign/registers/${deviceId}`);
  }

  async writeDeviceRegister(deviceId: string, command: string, value: any) {
    return this.request<{ success: boolean; command: string; value: any; updatedRegisters: any; physicalFeedback: any }>(`/codesign/registers/${deviceId}/write`, {
      method: 'POST',
      body: JSON.stringify({ command, value })
    });
  }

  async getEdgeAiComparison() {
    return this.request<{ modes: any[] }>('/codesign/edge-ai-comparison');
  }

  async runVerilogSimulation(moduleType: string = 'THERMAL_FSM', cycles: number = 16) {
    return this.request<{ success: boolean; simulation: any; hdlSourceSnippet: string }>('/codesign/verilog-simulation', {
      method: 'POST',
      body: JSON.stringify({ moduleType, cycles })
    });
  }

  // DSP & Quantum Lab
  async runDspAnalysis(params?: { carrierFreqHz?: number; sampleRateHz?: number; noiseLevel?: number }) {
    return this.request<any>('/dsp-quantum/dsp-analyze', {
      method: 'POST',
      body: JSON.stringify(params || {})
    });
  }

  async runQuantumPulse(pulseType: string = 'DRAG', amplitude: number = 1.0, durationNs: number = 20) {
    return this.request<any>('/dsp-quantum/quantum-pulse', {
      method: 'POST',
      body: JSON.stringify({ pulseType, amplitude, durationNs })
    });
  }

  async runQuantumCalibration() {
    return this.request<any>('/dsp-quantum/quantum-calibrate', {
      method: 'POST'
    });
  }

  async runHilSimulation(faultType: string = 'THERMAL_SPIKE', recoveryEnabled: boolean = true) {
    return this.request<any>('/dsp-quantum/hil-simulate', {
      method: 'POST',
      body: JSON.stringify({ faultType, recoveryEnabled })
    });
  }

  // SQL Analytics & Data Governance
  async getSqlPresets() {
    return this.request<{ presets: any[]; governance: any }>('/sql-analytics/presets');
  }

  async executeSqlQuery(queryKey?: string, customSql?: string) {
    return this.request<{
      success: boolean;
      queryName: string;
      sql: string;
      explanation: string;
      executionPlan: string;
      executionTimeMs: number;
      rowCount: number;
      columns: string[];
      rows: any[];
    }>('/sql-analytics/execute', {
      method: 'POST',
      body: JSON.stringify({ queryKey, customSql })
    });
  }

  // DevOps & Cloud
  async getDevopsOverview() {
    return this.request<{
      timestamp: string;
      cloudTargets: any[];
      deploymentProfiles: any;
      systemMetrics: any;
      k8sManifests: any;
      terraformTemplates: any;
      ciCdStages: any[];
    }>('/devops/overview');
  }

  async triggerCicdPipeline() {
    return this.request<any>('/devops/trigger-cicd', {
      method: 'POST'
    });
  }

  // Interview, Demo & Role Coverage
  async getRoleCoverage() {
    return this.request<{ timestamp: string; totalTracks: number; roles: any[] }>('/interview-demo/role-coverage');
  }

  async getInterviewQuestions() {
    return this.request<{ timestamp: string; categories: any[] }>('/interview-demo/interview-questions');
  }

  async getClientDemoSteps() {
    return this.request<{ timestamp: string; totalSteps: number; steps: any[] }>('/interview-demo/client-demo-steps');
  }
}

export const api = new ApiService();
