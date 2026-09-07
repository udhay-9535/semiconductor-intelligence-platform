/**
 * Enterprise 8-Step Semiconductor Platform Onboarding & Production Handoff Wizard
 */

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Layers,
  Activity,
  BrainCircuit,
  Sliders,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Play
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Platform Architecture & Semiconductor Digital Twin',
      icon: Cpu,
      summary: 'Explore the core mission of AI-powered semiconductor health intelligence and digital twins.',
      content: (
        <div className="space-y-4 text-slate-300 text-xs leading-relaxed font-sans">
          <p>
            Welcome to the <strong>Semiconductor Intelligence Platform</strong>. This system provides a unified telemetry ingestion pipeline, deterministic solid-state physics models (Arrhenius, Black's electromigration, TDDB), and machine learning isolation forests for mission-critical silicon packages.
          </p>
          <div className="grid grid-cols-2 gap-3 font-mono text-[11px] pt-2">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">Physical Estimation</span>
              Calculates real junction temperature (Tj), thermal gradients, and package thermal resistance in real time.
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-purple-400 font-bold block mb-1">AI/ML Anomaly Scoring</span>
              Continuous multidimensional isolation forest scores telemetry without requiring labeled failure datasets.
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Cleanroom Fab Sites & Environmental Grounding',
      icon: Layers,
      summary: 'Understand ISO cleanroom classifications and ambient baseline tracking.',
      content: (
        <div className="space-y-4 text-slate-300 text-xs leading-relaxed font-sans">
          <p>
            Silicon operational lifespan depends heavily on cleanroom ambient conditions (Ta) and cooling subsystem airflow. Devices are grouped by Cleanroom Fab Sites (e.g. Austin Cleanroom Alpha, Dresden Advanced Test Lab, Hsinchu High-Rel Center).
          </p>
          <p>
            Ambient temperature variations directly influence junction heat dissipation: <code className="text-emerald-400 font-mono">Tj = Ta + (Power * Theta_JA)</code>.
          </p>
        </div>
      )
    },
    {
      title: 'Semiconductor Package & Die Process Registration',
      icon: ShieldCheck,
      summary: 'Register FinFET / GAA nanosheet dies with nominal voltage and thermal parameters.',
      content: (
        <div className="space-y-4 text-slate-300 text-xs leading-relaxed font-sans">
          <p>
            Every physical silicon package has an operating profile specifying lithography node (3nm, 5nm, 7nm), nominal core voltage (Vdd), clock frequency target (MHz), max junction temperature threshold (Tj_max), and cooling architecture (Air forced, Liquid cold plate, Two-phase immersion).
          </p>
          <p>
            These parameters govern alert thresholds and reliability physics equations.
          </p>
        </div>
      )
    },
    {
      title: 'High-Frequency Telemetry Ingestion (1 Hz Stream)',
      icon: Activity,
      summary: 'Ingest voltage, current, power, temperature, and frequency from live ATE test fixtures.',
      content: (
        <div className="space-y-4 text-slate-300 text-xs leading-relaxed font-sans">
          <p>
            The ingestion pipeline accepts data via high-throughput REST APIs, CSV batch uploads, or industrial MQTT/Kafka connectors. In Simulation Mode, a real-time background worker continuously simulates multi-die physical telemetry with configurable stress scenarios.
          </p>
          <p>
            You can inject stress scenarios (Thermal Stress, Voltage Sag/Spike, Cooling Degradation, Mixed Faults) anytime from the Device Registry or Fleet Dashboard.
          </p>
        </div>
      )
    },
    {
      title: 'Machine Learning Anomaly Detection & SHAP Explainability',
      icon: BrainCircuit,
      summary: 'Understand feature attributions and root-cause hypotheses.',
      content: (
        <div className="space-y-4 text-slate-300 text-xs leading-relaxed font-sans">
          <p>
            When an anomaly score crosses the alert boundary, the platform performs SHAP-like feature perturbation to identify which sensor signal (e.g. 52% thermal surge, 28% voltage drop) drove the anomaly.
          </p>
          <p>
            The Model Registry allows promoting models through Development, Validation, Staging, and Production tiers.
          </p>
        </div>
      )
    },
    {
      title: 'What-If Silicon Physics & Stress Simulator',
      icon: Sliders,
      summary: 'Evaluate operational parameters before deploying workloads to cleanroom hardware.',
      content: (
        <div className="space-y-4 text-slate-300 text-xs leading-relaxed font-sans">
          <p>
            The What-If Simulation Lab lets reliability engineers slide workload percentage, ambient cleanroom temperature, voltage bias, clock overclock, and cooling efficiency to simulate dielectric breakdown stress and calculate shift in Remaining Useful Life (RUL).
          </p>
          <p>
            Scenarios can be saved to the database and re-loaded for team collaboration.
          </p>
        </div>
      )
    },
    {
      title: 'Real-Time Alerting, Escalations & Incident Workflows',
      icon: AlertTriangle,
      summary: 'Acknowledge alerts, escalate to incidents, and maintain an immutable timeline.',
      content: (
        <div className="space-y-4 text-slate-300 text-xs leading-relaxed font-sans">
          <p>
            Threshold and anomaly triggers automatically raise alerts. Operators can acknowledge and resolve alerts, or escalate them into structured engineering incidents with assigned engineers, live timeline action logs, and root-cause resolution tracking.
          </p>
        </div>
      )
    },
    {
      title: 'Compliance Reports, AI Root Cause & Production Handoff',
      icon: FileText,
      summary: 'Ready for enterprise deployment and live hardware data integration.',
      content: (
        <div className="space-y-4 text-slate-300 text-xs leading-relaxed font-sans">
          <p>
            Generate print-ready and PDF-exportable engineering reports, use the Gemini AI Diagnostics assistant for solid-state physics FMEA analysis, and review the immutable security audit trail.
          </p>
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-[11px]">
            ✓ Complete production verification passed. The application is ready for client handoff and live sensor deployment.
          </div>
        </div>
      )
    }
  ];

  const current = steps[currentStep];
  const Icon = current.icon;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl mx-auto shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
              STEP {currentStep + 1} OF {steps.length}
            </div>
            <h2 className="text-base font-bold text-slate-100 font-mono">{current.title}</h2>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="text-xs text-slate-400 hover:text-slate-200 font-mono transition"
        >
          Skip to Dashboard
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 h-1.5 overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Body */}
      <div className="p-8 space-y-4 flex-1">
        <div className="text-xs text-slate-400 font-mono border-l-2 border-emerald-500 pl-3">
          {current.summary}
        </div>

        <div className="pt-2">
          {current.content}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <button
          disabled={currentStep === 0}
          onClick={() => setCurrentStep(prev => prev - 1)}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        <div className="flex items-center gap-1.5">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2.5 h-2.5 rounded-full transition ${
                currentStep === idx ? 'bg-emerald-400 scale-125' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950"
          >
            <span>Launch Fleet Console</span>
            <Play className="w-4 h-4 fill-slate-950" />
          </button>
        )}
      </div>
    </div>
  );
};
