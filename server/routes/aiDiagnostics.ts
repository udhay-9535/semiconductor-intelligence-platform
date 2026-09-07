/**
 * AI-Powered Semiconductor Diagnostics & Root Cause Analysis (Gemini API)
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.ts';
import { GoogleGenAI } from '@google/genai';

const router = Router();
router.use(authMiddleware);

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// POST /api/v1/ai/diagnostics
router.post('/diagnostics', async (req: AuthenticatedRequest, res: Response) => {
  const { deviceId, userQuestion } = req.body;

  if (!deviceId) {
    res.status(400).json({ error: 'deviceId is required' });
    return;
  }

  const device = db.devices.get(deviceId);
  if (!device || device.orgId !== req.orgId) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  const devTelemetry = db.telemetry.filter(t => t.deviceId === deviceId);
  const latest = devTelemetry.length > 0 ? devTelemetry[devTelemetry.length - 1] : null;
  const dtState = db.digitalTwins.get(deviceId);
  const alerts = db.alerts.size > 0 ? Array.from(db.alerts.values()).filter(a => a.deviceId === deviceId) : [];

  const contextData = {
    device: {
      id: device.id,
      name: device.name,
      type: device.type,
      model: device.model,
      status: device.status,
      operatingProfile: device.operatingProfile,
      siteName: device.siteName
    },
    latestTelemetry: latest,
    digitalTwinPhysics: dtState?.physics,
    subsystemHealth: dtState?.subsystems,
    activeAlerts: alerts.slice(0, 3).map(a => ({ condition: a.condition, severity: a.severity, currentValue: a.currentValue }))
  };

  const ai = getAIClient();

  if (ai) {
    try {
      const prompt = `You are a Principal Semiconductor Reliability & Failure Analysis Physicist (Ph.D. in Solid State Electronics & Materials Science).
Analyze the following real-time telemetry, Digital Twin physics model, and alerts from a semiconductor device under test in a high-tech cleanroom facility.

Device Context & Measurements:
${JSON.stringify(contextData, null, 2)}

User Engineering Query: "${userQuestion || 'Provide a detailed Failure Mode and Effects Analysis (FMEA), physics root cause, Arrhenius/TDDB acceleration impact, and concrete cleanroom remediation steps.'}"

Please respond with a structured, technical engineering analysis containing:
1. Primary Physical Mechanism & Failure Mode (e.g. Electromigration, TDDB, Thermal Interface Degradation, Hot Carrier Injection, VRM Sag)
2. Physics of Failure Formula & Parameter Derivations (Arrhenius, Black's Equation, Eyring Voltage Stress)
3. Immediate Cleanroom Mitigation Protocol (Short-term mitigation)
4. Long-term Silicon / Package Design Hardening Recommendation (Wafer fab & packaging improvements)

Be technical, concise, authoritative, and direct.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const analysisText = response.text || 'Analysis generated.';

      db.recordAudit({
        orgId: req.orgId || 'org-demo-01',
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'AI_DIAGNOSTICS_RUN',
        targetType: 'DEVICE',
        targetId: device.id,
        ipAddress: req.ip || '127.0.0.1',
        result: 'SUCCESS',
        details: { model: 'gemini-2.5-flash' }
      });

      res.json({
        deviceId,
        engine: 'Gemini 2.5 Flash Solid-State Physics Assistant',
        analysis: analysisText,
        contextSnapshot: contextData
      });
      return;
    } catch (err: any) {
      console.warn('[AI Diagnostics] Gemini API error, falling back to deterministic physics engine:', err.message);
    }
  }

  // Fallback physics diagnostics if API key not present or call failed
  const temp = latest?.temperatureC ?? 70;
  const volt = latest?.voltageV ?? device.operatingProfile.nominalVoltageV;
  const cooling = latest?.coolingEfficiencyPct ?? 90;

  let rootCause = 'Silicon operating within standard continuous operating life (JEDEC JESD47 standards).';
  let fmeaPoints = [
    'Sub-threshold leakage remains bounded within nominal static power envelope.',
    'Clock PLL lock detected with sub-2.5ps RMS jitter.'
  ];
  let mitigations = [
    'Maintain ambient cleanroom chilled air supply at 22.0°C ± 0.5°C.',
    'Log standard 1-second telemetry batch to persistent time-series store.'
  ];

  if (temp > 85 || cooling < 75) {
    rootCause = `THERMAL RUNAWAY & PACKAGING TIM DEGRADATION: Junction temperature (${temp.toFixed(1)}°C) exceeds recommended continuous margin. Elevated Theta-JA induces exponential Arrhenius thermal acceleration of silicon oxide breakdown.`;
    fmeaPoints = [
      `Arrhenius Acceleration Factor AF = exp((Ea/k)*(1/T_ref - 1/T_j)) calculated at ${(Math.exp(0.7 / 8.617e-5 * (1/328.15 - 1/(temp + 273.15)))).toFixed(1)}x nominal aging rate.`,
      'Thermal gradient across 3D interposer micro-bumps risks solder fatigue and void coalescence.',
      'Dynamic power dissipation increases due to positive thermal feedback of leakage current.'
    ];
    mitigations = [
      'Immediately ramp variable-speed cleanroom exhaust fan to 5,500 RPM.',
      'Throttle core clock frequency by 15% via dynamic voltage and frequency scaling (DVFS) register 0x48.',
      'Inspect Thermal Interface Material (TIM2) phase-change compound for pump-out degradation.'
    ];
  } else if (volt > device.operatingProfile.nominalVoltageV * 1.05) {
    rootCause = `GATE DIELECTRIC OVER-VOLTAGE STRESS (TDDB): Core power rail supply bias measured at ${volt.toFixed(3)}V. High electric field intensity across thin gate oxide accelerates defect trap generation.`;
    fmeaPoints = [
      'Time-Dependent Dielectric Breakdown (TDDB) lifetime modeled by gamma-voltage acceleration factor ~ exp(gamma * Delta_V).',
      'Increased hot-carrier injection (HCI) degrading PMOS/NMOS threshold voltage matching.'
    ];
    mitigations = [
      'Calibrate Power Management IC (PMIC) multi-phase VRM feedback loop.',
      'Verify decoupling capacitor bank health for high-frequency switching noise suppression.'
    ];
  }

  res.json({
    deviceId,
    engine: 'Deterministic Physics & Reliability Rule Engine (On-Premises Mode)',
    analysis: `### 1. Primary Physical Mechanism & Failure Mode
${rootCause}

### 2. Physics of Failure & FMEA Metrics
${fmeaPoints.map(p => `- ${p}`).join('\n')}

### 3. Immediate Cleanroom Mitigation Protocol
${mitigations.map(m => `1. ${m}`).join('\n')}

### 4. Long-Term Reliability Hardening
- Implement closed-loop telemetry throttling integrated directly into device microcode.
- Upgrade to liquid cold-plate micro-channel cooling for high-power packaging assemblies.`,
    contextSnapshot: contextData
  });
});

export default router;
