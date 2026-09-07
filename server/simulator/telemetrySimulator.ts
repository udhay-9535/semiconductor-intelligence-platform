/**
 * Semiconductor Real-Time Telemetry Simulation Engine
 * 
 * Periodically generates physics-correlated sensor readings for devices configured in SIMULATION mode.
 * Dispatches readings to the ingestion pipeline, updates the Digital Twin, and evaluates alert thresholds.
 */

import { db } from '../db/database.ts';
import { SimulationScenarioType } from '../types/index.ts';

export class TelemetrySimulator {
  private timer: NodeJS.Timeout | null = null;
  private intervalMs: number = 3000;
  private isRunning: boolean = false;

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[TelemetrySimulator] Starting continuous semiconductor simulation ticker (3000ms)...');

    this.timer = setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[TelemetrySimulator] Stopped simulation ticker.');
  }

  public setDeviceScenario(deviceId: string, scenario: SimulationScenarioType, orgId: string): void {
    const device = db.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }
    db.deviceScenarios.set(deviceId, scenario);
    db.recordAudit({
      orgId,
      userId: 'usr-001',
      userName: 'Simulation Engine',
      userRole: 'ENGINEER',
      action: 'SIMULATION_SCENARIO_CHANGE',
      targetType: 'DEVICE',
      targetId: deviceId,
      ipAddress: '127.0.0.1',
      result: 'SUCCESS',
      details: { scenario, previousScenario: db.deviceScenarios.get(deviceId) }
    });
  }

  private tick(): void {
    try {
      const now = Date.now();
      for (const [deviceId, device] of db.devices.entries()) {
        // Only generate simulated telemetry for SIMULATION mode devices
        if (device.mode === 'SIMULATION') {
          const scenario = db.deviceScenarios.get(deviceId) || 'NORMAL';
          const reading = db.generateSyntheticTelemetry(device, scenario, now);
          db.ingestTelemetry(reading, device.orgId);
        }
      }
    } catch (err) {
      console.error('[TelemetrySimulator] Error during simulation tick:', err);
    }
  }
}

export const simulator = new TelemetrySimulator();
