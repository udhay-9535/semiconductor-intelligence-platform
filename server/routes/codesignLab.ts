/**
 * Hardware/Software Co-Design, Edge AI & FPGA Simulation Route
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';

const router = Router();

// ==========================================
// 1. HARDWARE REGISTER STATE ENGINE
// ==========================================
interface DeviceRegisters {
  REG_CLOCK_FREQ_MHZ: number;
  REG_CORE_VOLTAGE_MV: number;
  REG_WORKLOAD_STATE: 'IDLE' | 'COMPUTE_INTENSIVE' | 'ML_INFERENCE' | 'STRESS_TEST';
  REG_COOLING_PWM: number; // 0 to 255
  REG_SYS_STATUS: number; // bitmask
}

const hardwareRegisters: Map<string, DeviceRegisters> = new Map();

// Helper to get or initialize registers for a device
function getDeviceRegisters(deviceId: string): DeviceRegisters {
  if (!hardwareRegisters.has(deviceId)) {
    hardwareRegisters.set(deviceId, {
      REG_CLOCK_FREQ_MHZ: 2800,
      REG_CORE_VOLTAGE_MV: 950,
      REG_WORKLOAD_STATE: 'COMPUTE_INTENSIVE',
      REG_COOLING_PWM: 180,
      REG_SYS_STATUS: 0x0001 // Bit 0 = PLL_LOCKED
    });
  }
  return hardwareRegisters.get(deviceId)!;
}

// ==========================================
// 2. FPGA VERILOG MODULE SIMULATOR
// ==========================================
interface VerilogSimulationResult {
  moduleName: string;
  clockCycles: number;
  signals: {
    name: string;
    type: 'clock' | 'input' | 'output' | 'state';
    wave: (number | string)[];
  }[];
  consoleOutput: string[];
}

function simulateVerilogModule(moduleType: string, cycles: number = 16): VerilogSimulationResult {
  const clockWave: number[] = [];
  for (let c = 0; c < cycles; c++) {
    clockWave.push(c % 2 === 0 ? 0 : 1);
  }

  if (moduleType === 'TELEMETRY_FIFO') {
    const wrEnWave: number[] = [];
    const rdEnWave: number[] = [];
    const countWave: number[] = [];
    const fullWave: number[] = [];
    const emptyWave: number[] = [];

    let count = 0;
    const consoleOutput: string[] = ['[VCD] Starting Verilog testbench for telemetry_fifo (Depth=8, Width=32)'];

    for (let c = 0; c < cycles; c++) {
      const wr = c < 8 ? 1 : 0;
      const rd = c >= 6 && c < 14 ? 1 : 0;
      wrEnWave.push(wr);
      rdEnWave.push(rd);

      if (wr && count < 8) count++;
      if (rd && count > 0) count--;

      countWave.push(count);
      fullWave.push(count >= 8 ? 1 : 0);
      emptyWave.push(count === 0 ? 1 : 0);

      if (c % 4 === 0) {
        consoleOutput.push(`@${c * 10}ns: FIFO_COUNT=${count}, FULL=${count >= 8 ? 1 : 0}, EMPTY=${count === 0 ? 1 : 0}`);
      }
    }

    return {
      moduleName: 'telemetry_fifo_sync',
      clockCycles: cycles,
      signals: [
        { name: 'clk', type: 'clock', wave: clockWave },
        { name: 'wr_en', type: 'input', wave: wrEnWave },
        { name: 'rd_en', type: 'input', wave: rdEnWave },
        { name: 'fifo_count[3:0]', type: 'state', wave: countWave },
        { name: 'full', type: 'output', wave: fullWave },
        { name: 'empty', type: 'output', wave: emptyWave }
      ],
      consoleOutput
    };
  }

  // Default: Safety Thermal FSM
  const tempSpikeInput: number[] = [];
  const stateWave: string[] = [];
  const throttleEnWave: number[] = [];
  const emergencyShutdownWave: number[] = [];

  let currentState = 'IDLE_SAFE';
  const consoleOutput: string[] = ['[VCD] Testbench for semiconductor_thermal_safety_fsm running'];

  for (let c = 0; c < cycles; c++) {
    const isOverheat = c >= 6 && c <= 12 ? 1 : 0;
    tempSpikeInput.push(isOverheat);

    if (c < 6) {
      currentState = 'IDLE_SAFE';
    } else if (c >= 6 && c <= 10) {
      currentState = 'WARN_THROTTLE';
    } else if (c > 10 && c <= 12) {
      currentState = 'CRITICAL_TRIP';
    } else {
      currentState = 'RECOVERY_COOLDOWN';
    }

    stateWave.push(currentState);
    throttleEnWave.push(currentState === 'WARN_THROTTLE' || currentState === 'CRITICAL_TRIP' ? 1 : 0);
    emergencyShutdownWave.push(currentState === 'CRITICAL_TRIP' ? 1 : 0);

    consoleOutput.push(`@${c * 10}ns: FSM_STATE=${currentState}, SENSOR_OVERHEAT=${isOverheat}, THROTTLE_PWM=${throttleEnWave[c]}`);
  }

  return {
    moduleName: 'semiconductor_thermal_safety_fsm',
    clockCycles: cycles,
    signals: [
      { name: 'clk', type: 'clock', wave: clockWave },
      { name: 'sensor_overheat_alert', type: 'input', wave: tempSpikeInput },
      { name: 'fsm_state[2:0]', type: 'state', wave: stateWave },
      { name: 'dynamic_throttle_en', type: 'output', wave: throttleEnWave },
      { name: 'hard_trip_shutdown', type: 'output', wave: emergencyShutdownWave }
    ],
    consoleOutput
  };
}

// ==========================================
// ROUTES
// ==========================================

// 1. Read Hardware Registers
router.get('/registers/:deviceId', (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const regs = getDeviceRegisters(deviceId);
  const device = db.devices.get(deviceId);

  res.json({
    deviceId,
    deviceName: device?.name || 'Semiconductor Core',
    timestamp: new Date().toISOString(),
    registers: regs,
    derivedPhysics: {
      calculatedDynamicPowerW: Number(((regs.REG_CLOCK_FREQ_MHZ / 1000) * Math.pow(regs.REG_CORE_VOLTAGE_MV / 1000, 2) * 28.5).toFixed(2)),
      fanRpm: Math.round((regs.REG_COOLING_PWM / 255) * 4800)
    }
  });
});

// 2. Write Hardware Control Registers (SET_FREQUENCY, SET_VOLTAGE, SET_WORKLOAD, SET_COOLING, RESET_DEVICE)
router.post('/registers/:deviceId/write', (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const { command, value } = req.body;
  const regs = getDeviceRegisters(deviceId);

  switch (command) {
    case 'SET_FREQUENCY':
      regs.REG_CLOCK_FREQ_MHZ = Math.min(4500, Math.max(800, Number(value)));
      break;
    case 'SET_VOLTAGE':
      regs.REG_CORE_VOLTAGE_MV = Math.min(1350, Math.max(650, Number(value)));
      break;
    case 'SET_WORKLOAD':
      if (['IDLE', 'COMPUTE_INTENSIVE', 'ML_INFERENCE', 'STRESS_TEST'].includes(value)) {
        regs.REG_WORKLOAD_STATE = value;
      }
      break;
    case 'SET_COOLING':
      regs.REG_COOLING_PWM = Math.min(255, Math.max(0, Number(value)));
      break;
    case 'RESET_DEVICE':
      regs.REG_CLOCK_FREQ_MHZ = 2800;
      regs.REG_CORE_VOLTAGE_MV = 950;
      regs.REG_WORKLOAD_STATE = 'COMPUTE_INTENSIVE';
      regs.REG_COOLING_PWM = 180;
      regs.REG_SYS_STATUS = 0x0001;
      break;
    default:
      return res.status(400).json({ error: `Unknown hardware register command: ${command}` });
  }

  // Recalculate physics and update simulated device state
  const dynamicPowerW = Number(((regs.REG_CLOCK_FREQ_MHZ / 1000) * Math.pow(regs.REG_CORE_VOLTAGE_MV / 1000, 2) * 28.5).toFixed(2));
  const coolingEfficiency = regs.REG_COOLING_PWM / 255;
  const estimatedTjC = Number((25.0 + (dynamicPowerW * (0.85 / Math.max(0.2, coolingEfficiency)))).toFixed(1));

  res.json({
    success: true,
    command,
    value,
    updatedRegisters: regs,
    physicalFeedback: {
      dynamicPowerW,
      estimatedTjC,
      coolingEfficiencyPct: Number((coolingEfficiency * 100).toFixed(0)),
      pllLocked: true
    }
  });
});

// 3. Edge AI vs Cloud vs Hybrid Workload Placement Comparison
router.get('/edge-ai-comparison', (_req: Request, res: Response) => {
  res.json({
    modes: [
      {
        mode: 'EDGE_ONLY',
        description: 'On-device inference on Jetson AGX / Edge Tensor Core without uplink dependency',
        inferenceLatencyMs: 4.2,
        networkTransitLatencyMs: 0.0,
        totalRoundtripMs: 4.2,
        powerDrawWatts: 15.0,
        bandwidthUsedKBps: 0.2,
        offlineReliability: '100% Autonomous',
        modelAccuracyPct: 93.4,
        privacyScore: 'MAXIMUM (Zero raw sensor data offload)'
      },
      {
        mode: 'CLOUD_ONLY',
        description: 'Full telemetry stream offloaded to Cloud Data Lake & GPU Cluster',
        inferenceLatencyMs: 1.1,
        networkTransitLatencyMs: 38.5,
        totalRoundtripMs: 39.6,
        powerDrawWatts: 4.5,
        bandwidthUsedKBps: 240.0,
        offlineReliability: 'Degraded on WAN drop',
        modelAccuracyPct: 98.2,
        privacyScore: 'Requires TLS/mTLS encryption & compliance audit'
      },
      {
        mode: 'HYBRID_INTELLIGENT',
        description: 'Edge fast-path anomaly triage + Cloud asynchronous deep diagnostic model',
        inferenceLatencyMs: 4.2,
        networkTransitLatencyMs: 8.0,
        totalRoundtripMs: 12.2,
        powerDrawWatts: 16.2,
        bandwidthUsedKBps: 12.5,
        offlineReliability: 'Guaranteed Local Safety Trip + Rich Analytics',
        modelAccuracyPct: 97.9,
        privacyScore: 'High (Only anomaly frames transmitted)'
      }
    ]
  });
});

// 4. FPGA / Verilog HDL Simulation Testbench
router.post('/verilog-simulation', (req: Request, res: Response) => {
  const { moduleType = 'THERMAL_FSM', cycles = 16 } = req.body;
  const sim = simulateVerilogModule(moduleType, Math.min(32, Math.max(8, Number(cycles))));

  res.json({
    success: true,
    simulation: sim,
    hdlSourceSnippet: moduleType === 'TELEMETRY_FIFO'
      ? `module telemetry_fifo_sync #(parameter WIDTH=32, DEPTH=8) (
    input  wire             clk, rst_n,
    input  wire             wr_en, rd_en,
    input  wire [WIDTH-1:0] din,
    output reg  [WIDTH-1:0] dout,
    output wire             full, empty
);
    reg [WIDTH-1:0] mem [0:DEPTH-1];
    reg [3:0] wr_ptr, rd_ptr, count;
    assign full  = (count == DEPTH);
    assign empty = (count == 0);
    // Cycle-accurate synchronous read/write
endmodule`
      : `module semiconductor_thermal_safety_fsm (
    input  wire clk, rst_n,
    input  wire sensor_overheat_alert,
    output reg  dynamic_throttle_en,
    output reg  hard_trip_shutdown
);
    typedef enum logic [1:0] { IDLE_SAFE=2'b00, WARN_THROTTLE=2'b01, CRITICAL_TRIP=2'b10 } state_t;
    state_t state_reg, state_next;
    // Sequential state logic with automatic cooldown recovery
endmodule`
  });
});

export default router;
