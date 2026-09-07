/**
 * 12-Step Guided Client Demo Engine View
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Award,
  Layers,
  FileDown
} from 'lucide-react';
import { api } from '../../services/api.ts';

interface ClientDemoProps {
  onNavigateTab: (tabId: string) => void;
}

export const ClientDemoView: React.FC<ClientDemoProps> = ({ onNavigateTab }) => {
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const loadSteps = async () => {
    try {
      const data = await api.getClientDemoSteps();
      setSteps(data.steps || []);
    } catch (err) {
      console.error('Failed to load client demo steps:', err);
    }
  };

  useEffect(() => {
    loadSteps();
  }, []);

  const currentStep = steps[currentStepIdx];

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              MODULE 30 • 12-STEP CLIENT DEMO ENGINE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              EXECUTIVE WALKTHROUGH
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 mt-1">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span>Guided 12-Step Client &amp; Enterprise Demo</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured end-to-end walk-through of cleanroom telemetry, silicon digital twin physics, real-time ML anomaly detection, and cloud infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentStepIdx(0)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Demo</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {steps.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Demo Progress: Step {currentStepIdx + 1} of {steps.length}</span>
            <span className="text-purple-400 font-bold">{Math.round(((currentStepIdx + 1) / steps.length) * 100)}% Completed</span>
          </div>

          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              style={{ width: `${((currentStepIdx + 1) / steps.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-300"
            />
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 pt-1">
            {steps.map((st, idx) => (
              <button
                key={st.step}
                onClick={() => setCurrentStepIdx(idx)}
                className={`h-6 rounded text-[10px] font-bold flex items-center justify-center transition ${
                  idx === currentStepIdx
                    ? 'bg-purple-500 text-slate-950 shadow-sm'
                    : idx < currentStepIdx
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-950 text-slate-600 border border-slate-800'
                }`}
              >
                {st.step}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Step Hero Card */}
      {currentStep && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="px-2.5 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              STEP {currentStep.step} OF 12
            </span>
            <span className="text-xs text-slate-400">Target: {currentStep.targetTab.toUpperCase()}</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-100">{currentStep.title}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{currentStep.description}</p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePrev}
                disabled={currentStepIdx === 0}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
              <button
                onClick={handleNext}
                disabled={currentStepIdx === steps.length - 1}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => onNavigateTab(currentStep.targetTab)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{currentStep.actionText}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
