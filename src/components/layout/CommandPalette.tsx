/**
 * Global Command Palette (Ctrl/Cmd + K)
 * Fast navigation and categorized search across devices, models, labs, and operations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Cpu,
  Layers,
  Activity,
  BrainCircuit,
  Zap,
  Radio,
  Sliders,
  Database,
  Cloud,
  AlertTriangle,
  FileText,
  ShieldCheck,
  BookOpen,
  Award,
  Play,
  Settings,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ActiveTab } from './Sidebar.tsx';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveTab) => void;
}

interface CommandItem {
  id: ActiveTab;
  title: string;
  category: 'NAVIGATION' | 'INTELLIGENCE' | 'LABS' | 'OPERATIONS' | 'ADMIN';
  icon: any;
  keywords: string;
  badge?: string;
}

const COMMANDS: CommandItem[] = [
  // Overview
  { id: 'dashboard', title: 'Executive Overview Dashboard', category: 'NAVIGATION', icon: Activity, keywords: 'overview kpi telemetry health fab fleet status' },
  
  // Intelligence
  { id: 'digital-twin', title: 'Silicon Digital Twin & Topology', category: 'INTELLIGENCE', icon: Layers, keywords: 'digital twin die package thermal power silicon submodules', badge: 'PHYSICS' },
  { id: 'devices', title: 'Device Registry & Physical Specs', category: 'INTELLIGENCE', icon: Cpu, keywords: 'devices chips wafers inventory nodes 3nm 5nm 7nm sensors' },
  { id: 'telemetry', title: 'Live Ingestion & Telemetry Observability', category: 'INTELLIGENCE', icon: Activity, keywords: 'telemetry streaming charts voltage current temp clock' },
  { id: 'ml-platform', title: 'AI / ML Center & Model Drift', category: 'INTELLIGENCE', icon: BrainCircuit, keywords: 'machine learning isolation forest random forest shap explainability drift', badge: 'MLOPS' },
  { id: 'analytics', title: 'Fleet Yield & Failure Analytics', category: 'INTELLIGENCE', icon: Sparkles, keywords: 'analytics correlation failure probability pareto distribution eda' },

  // Engineering Labs
  { id: 'gpu-lab', title: 'GPU / NVIDIA Accelerated Lab', category: 'LABS', icon: Zap, keywords: 'gpu nvidia cuda tensorrt warps kernel parallel reduction batch benchmark', badge: 'CUDA' },
  { id: 'engineering-lab', title: 'Software Engineering & DSA Lab', category: 'LABS', icon: Cpu, keywords: 'algorithms sliding window min heap lru cache dag concurrency' },
  { id: 'codesign', title: 'HW/SW Co-Design, Registers & FPGA', category: 'LABS', icon: Sliders, keywords: 'codesign verilog fpga rtl hdl registers memory-mapped edge ai', badge: 'RTL' },
  { id: 'advanced-sim-lab', title: 'DSP, Quantum Control & HIL Lab', category: 'LABS', icon: Radio, keywords: 'dsp fft quantum bloch sphere rabi calibration hil hardware in the loop', badge: 'QUANTUM' },
  { id: 'what-if', title: 'What-If Dynamic Silicon Simulator', category: 'LABS', icon: Sliders, keywords: 'what-if stress test overclock undervolt thermal runaway cooling' },
  { id: 'sql-analytics', title: 'SQL Analytics & Data Governance', category: 'LABS', icon: Database, keywords: 'sql postgres window functions explain query plan data quality completeness' },

  // Operations
  { id: 'alerts', title: 'Alerts & Incident Management Center', category: 'OPERATIONS', icon: AlertTriangle, keywords: 'alerts incidents alarms triage root cause pager mttr' },
  { id: 'reports', title: 'Executive Engineering Reports & PDF', category: 'OPERATIONS', icon: FileText, keywords: 'reports export pdf csv audit compliance summary' },
  { id: 'devops-hub', title: 'Cloud, Kubernetes & CI/CD Hub', category: 'OPERATIONS', icon: Cloud, keywords: 'devops k8s terraform github actions ci cd prometheus aws gcp' },

  // Evaluation & Admin
  { id: 'onboarding', title: 'Customer Onboarding & System Setup Wizard', category: 'ADMIN', icon: Award, keywords: 'onboarding setup verification wizard first-run hardware connect' },
  { id: 'interview-hub', title: 'Technical Competencies & Role Matrix', category: 'ADMIN', icon: FileText, keywords: 'skills competencies qualifications role coverage matrix' },
  { id: 'integrations', title: 'Industrial Connectors (OPC-UA / MQTT)', category: 'ADMIN', icon: Radio, keywords: 'connectors opc-ua mqtt kafka rest industrial plc' },
  { id: 'audit', title: 'Immutable Security Audit Trail', category: 'ADMIN', icon: ShieldCheck, keywords: 'audit logs compliance security rbac trail' },
  { id: 'admin', title: 'Organization & RBAC Management', category: 'ADMIN', icon: Settings, keywords: 'users roles permissions tenant settings administration' },
  { id: 'docs', title: 'OpenAPI REST Documentation', category: 'ADMIN', icon: BookOpen, keywords: 'api swagger openapi rest endpoints docs schemas' }
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectTab }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle global shortcuts Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open triggered by parent state handler
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCommands = COMMANDS.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.keywords.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        onSelectTab(target.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Input header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3 bg-slate-900">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, tool, or device name... (e.g. 'GPU', 'Digital Twin', 'SQL', 'Alerts')"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none font-sans"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-inner">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
              No matching modules or commands found for "{search}".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onSelectTab(cmd.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all text-left ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        <span>{cmd.title}</span>
                        {cmd.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-md font-mono mt-0.5">
                        {cmd.category} • {cmd.keywords}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-600'} transition-transform`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">↵</kbd> Select</span>
            <span><kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">esc</kbd> Dismiss</span>
          </div>
          <span className="text-[10px] text-emerald-400">SAI Engine v2.4 • System Active</span>
        </div>
      </div>
    </div>
  );
};
