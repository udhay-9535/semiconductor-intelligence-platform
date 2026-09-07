/**
 * Enterprise Engineering Sidebar
 * Collapsible, high-density, accessible navigation hierarchy
 */

import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Activity,
  Layers,
  BrainCircuit,
  Sliders,
  AlertTriangle,
  FileText,
  Radio,
  ShieldCheck,
  Settings,
  BookOpen,
  Sparkles,
  ChevronRight,
  Code,
  Zap,
  Database,
  Cloud,
  Award,
  ChevronLeft,
  ChevronsRight
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'devices'
  | 'digital-twin'
  | 'telemetry'
  | 'ml-platform'
  | 'what-if'
  | 'engineering-lab'
  | 'gpu-lab'
  | 'codesign'
  | 'advanced-sim-lab'
  | 'sql-analytics'
  | 'alerts'
  | 'analytics'
  | 'reports'
  | 'integrations'
  | 'devops-hub'
  | 'interview-hub'
  | 'audit'
  | 'admin'
  | 'docs'
  | 'onboarding';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  openAlertsCount: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  openAlertsCount,
  collapsed = false,
  onToggleCollapse
}) => {
  const navSections = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard' as ActiveTab, label: 'Executive Operations', icon: LayoutDashboard },
      ]
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { id: 'digital-twin' as ActiveTab, label: 'Digital Twin Multiphysics', icon: Layers, badgeTag: '3D/PHY' },
        { id: 'devices' as ActiveTab, label: 'Device Registry & Specs', icon: Cpu },
        { id: 'telemetry' as ActiveTab, label: 'Industrial Telemetry Stream', icon: Activity, badgeTag: 'LIVE' },
        { id: 'ml-platform' as ActiveTab, label: 'AI/ML Model Registry', icon: BrainCircuit, badgeTag: 'MLOPS' },
        { id: 'analytics' as ActiveTab, label: 'Fleet Reliability & Yield', icon: Sparkles },
      ]
    },
    {
      group: 'ENGINEERING LABS',
      items: [
        { id: 'gpu-lab' as ActiveTab, label: 'GPU & CUDA Acceleration Lab', icon: Zap, badgeTag: 'CUDA' },
        { id: 'engineering-lab' as ActiveTab, label: 'Software Eng & DSA Lab', icon: Code },
        { id: 'codesign' as ActiveTab, label: 'HW/SW Co-Design & FPGA', icon: Sliders, badgeTag: 'RTL' },
        { id: 'advanced-sim-lab' as ActiveTab, label: 'DSP & Quantum Control Lab', icon: Radio, badgeTag: 'QPU' },
      ]
    },
    {
      group: 'DATA & SIMULATION',
      items: [
        { id: 'what-if' as ActiveTab, label: 'Silicon What-If Simulator', icon: Sliders },
        { id: 'sql-analytics' as ActiveTab, label: 'SQL Analytics & Quality', icon: Database, badgeTag: 'SQL' },
      ]
    },
    {
      group: 'OPERATIONS & CLOUD',
      items: [
        {
          id: 'alerts' as ActiveTab,
          label: 'Incidents & Real-Time Alerts',
          icon: AlertTriangle,
          badge: openAlertsCount > 0 ? openAlertsCount : undefined
        },
        { id: 'reports' as ActiveTab, label: 'Reliability Reports & Export', icon: FileText },
        { id: 'devops-hub' as ActiveTab, label: 'Cloud & Infrastructure (K8s)', icon: Cloud, badgeTag: 'IAC' },
      ]
    },
    {
      group: 'GOVERNANCE & SYSTEM',
      items: [
        { id: 'onboarding' as ActiveTab, label: 'Customer Onboarding Setup', icon: Award, badgeTag: 'SETUP' },
        { id: 'interview-hub' as ActiveTab, label: 'Technical Competencies Matrix', icon: FileText, badgeTag: 'ROLES' },
        { id: 'integrations' as ActiveTab, label: 'Industrial Connectors & MQTT', icon: Radio, badgeTag: 'MQTT' },
        { id: 'audit' as ActiveTab, label: 'Audit Trail & Compliance', icon: ShieldCheck },
        { id: 'admin' as ActiveTab, label: 'Tenants & RBAC Administration', icon: Settings },
        { id: 'docs' as ActiveTab, label: 'REST API & Specs', icon: BookOpen },
      ]
    }
  ];

  return (
    <aside
      id="app-sidebar"
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0 select-none transition-all duration-200 z-30`}
    >
      {/* Brand Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold tracking-wider text-slate-100 uppercase font-mono truncate">
                SAI Platform
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                Semiconductor AI Platform
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-4 custom-scrollbar">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            {!collapsed ? (
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {section.group}
              </div>
            ) : (
              <div className="w-full h-px bg-slate-800/80 my-2" />
            )}

            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-2.5 py-2'
                  } rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && (
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                      {item.badgeTag && !item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-slate-400 bg-slate-950/70 border border-slate-800">
                          {item.badgeTag}
                        </span>
                      )}
                      {isActive && !item.badge && !item.badgeTag && (
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer System Indicator */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400">
        {!collapsed ? (
          <div className="flex items-center justify-between font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 text-[10px]">Ingestion: 1.0s</span>
            </span>
            <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
              PROD v2.4
            </span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
