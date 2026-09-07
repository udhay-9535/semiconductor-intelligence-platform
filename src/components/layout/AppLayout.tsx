/**
 * Enterprise Application Shell Layout
 * High-density top navbar, breadcrumbs, command palette trigger, theme toggle, and RBAC persona switcher
 */

import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './Sidebar.tsx';
import { CommandPalette } from './CommandPalette.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  Shield,
  Activity,
  AlertCircle,
  Building,
  UserCheck,
  Zap,
  HelpCircle,
  Bell,
  Search,
  Moon,
  Sun,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Command
} from 'lucide-react';

interface AppLayoutProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  openAlertsCount?: number;
  criticalDevicesCount?: number;
  children: React.ReactNode;
}

const TAB_TITLES: Record<ActiveTab, { section: string; title: string }> = {
  'dashboard': { section: 'OVERVIEW', title: 'Executive Operations Dashboard' },
  'digital-twin': { section: 'INTELLIGENCE', title: 'Silicon Digital Twin & Multiphysics' },
  'devices': { section: 'INTELLIGENCE', title: 'Device Registry & Physical Topology' },
  'telemetry': { section: 'INTELLIGENCE', title: 'Real-Time Industrial Telemetry Pipeline' },
  'ml-platform': { section: 'INTELLIGENCE', title: 'AI/ML Model Registry & Anomaly Engine' },
  'analytics': { section: 'INTELLIGENCE', title: 'Fleet Reliability & Yield Analytics' },
  'gpu-lab': { section: 'ENGINEERING LABS', title: 'GPU / Accelerated Compute Lab' },
  'engineering-lab': { section: 'ENGINEERING LABS', title: 'Software Engineering & DSA Lab' },
  'codesign': { section: 'ENGINEERING LABS', title: 'HW/SW Co-Design, Registers & RTL Lab' },
  'advanced-sim-lab': { section: 'ENGINEERING LABS', title: 'DSP, Quantum Control & HIL Lab' },
  'what-if': { section: 'DATA & SIMULATION', title: 'Silicon What-If Physics Simulator' },
  'sql-analytics': { section: 'DATA & SIMULATION', title: 'SQL Analytics & Data Governance' },
  'alerts': { section: 'OPERATIONS', title: 'Incident Response & Telemetry Alerts' },
  'reports': { section: 'OPERATIONS', title: 'Reliability Reports & Compliance Export' },
  'devops-hub': { section: 'OPERATIONS', title: 'Cloud Infrastructure, Kubernetes & CI/CD' },
  'interview-hub': { section: 'ENGINEERING DOCS', title: 'Technical Competencies & Role Coverage' },
  'integrations': { section: 'CONNECTIVITY', title: 'Industrial Connectors (REST, MQTT, Kafka, OPC-UA)' },
  'audit': { section: 'COMPLIANCE', title: 'Immutable Security & Operations Audit Trail' },
  'admin': { section: 'ADMINISTRATION', title: 'Multi-Tenant & RBAC User Management' },
  'docs': { section: 'API & DOCS', title: 'OpenAPI REST & Telemetry Specs' },
  'onboarding': { section: 'DEPLOYMENT', title: 'Customer Onboarding & System Setup' }
};

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onTabChange,
  openAlertsCount = 0,
  criticalDevicesCount = 0,
  children
}) => {
  const { user, org, role, switchUser, userProfiles } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const currentMeta = TAB_TITLES[activeTab] || { section: 'SYSTEM', title: 'Engineering Platform' };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Global Command Palette (Ctrl/Cmd + K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTab={onTabChange}
      />

      {/* Left Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        openAlertsCount={openAlertsCount}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <header
          id="app-top-header"
          className="h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-5 flex items-center justify-between shrink-0 z-20"
        >
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-slate-500 hidden sm:inline">Semiconductor Platform</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
              <span className="text-slate-500 uppercase">{currentMeta.section}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-bold text-slate-100 truncate">{currentMeta.title}</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Platform Operational</span>
            </div>
          </div>

          {/* Center: Global Search Trigger Button */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs transition shadow-inner font-sans"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Search modules, devices, logs...</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Organization Identifier */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[140px]">{org?.name || 'Advanced Silicon Dynamics'}</span>
              <span className="text-[9px] uppercase bg-cyan-500/15 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/30 font-bold">
                TENANT
              </span>
            </div>

            {/* Critical Alert Indicator */}
            {criticalDevicesCount > 0 && (
              <button
                onClick={() => onTabChange('alerts')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold animate-pulse"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{criticalDevicesCount} Critical</span>
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition relative"
                title="Active Alarms & Notifications"
              >
                <Bell className="w-4 h-4" />
                {openAlertsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <span className="font-bold text-slate-200 uppercase text-[10px]">Real-Time Notifications</span>
                    <span className="text-[10px] text-emerald-400">{openAlertsCount} Open Alerts</span>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                    {openAlertsCount === 0 ? (
                      <div className="py-4 text-center text-slate-500 text-xs">
                        <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-400/60" />
                        All semiconductor equipment operating in nominal envelope.
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                        <div className="flex items-center justify-between text-amber-400 font-bold text-[11px]">
                          <span>Thermal Gradient Warning</span>
                          <span>ST-002</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Junction temperature reached 89.2°C (near 95°C limit). Fan RPM increased.
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      onTabChange('alerts');
                      setShowNotifications(false);
                    }}
                    className="w-full mt-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-bold text-[10px] transition"
                  >
                    Open Incident Center →
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle (Dark/Light) */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Customer Onboarding Wizard Button */}
            <button
              id="btn-quick-onboarding"
              onClick={() => onTabChange('onboarding')}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Onboarding</span>
            </button>

            {/* Persona Switcher / Profile */}
            <div className="relative">
              <button
                id="btn-role-switcher"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-cyan-500/50 transition text-xs"
              >
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-[10px] font-bold">
                  {user?.name ? user.name[0] : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-slate-200 text-xs leading-none">{user?.name}</div>
                  <div className="text-[9px] text-cyan-400 font-mono font-bold mt-0.5">{role}</div>
                </div>
                <Shield className="w-3 h-3 text-slate-400" />
              </button>

              {/* Persona Switcher Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs font-sans">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono border-b border-slate-800 mb-1">
                    Switch Active RBAC Session Context
                  </div>
                  <div className="space-y-1">
                    {userProfiles.map(p => (
                      <button
                        key={p.id}
                        id={`btn-persona-${p.id}`}
                        onClick={() => {
                          switchUser(p.id);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition flex items-start justify-between ${
                          user?.id === p.id
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.title}</div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-bold">
                          {p.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};
