/**
 * Main Application Root Component & View Router
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { ActiveTab } from './components/layout/Sidebar.tsx';
import { LoginView } from './components/auth/LoginView.tsx';
import { EnterpriseDashboard } from './components/dashboard/EnterpriseDashboard.tsx';
import { DeviceList } from './components/devices/DeviceList.tsx';
import { DeviceDetail } from './components/devices/DeviceDetail.tsx';
import { DigitalTwinHub } from './components/digitalTwin/DigitalTwinHub.tsx';
import { TelemetryIngestionView } from './components/telemetry/TelemetryIngestionView.tsx';
import { MLPlatformView } from './components/ml/MLPlatformView.tsx';
import { WhatIfSimulator } from './components/whatIf/WhatIfSimulator.tsx';
import { AlertsAndIncidents } from './components/alerts/AlertsAndIncidents.tsx';
import { AnalyticsView } from './components/analytics/AnalyticsView.tsx';
import { ReportingView } from './components/reports/ReportingView.tsx';
import { IntegrationsHub } from './components/integrations/IntegrationsHub.tsx';
import { AuditLogView } from './components/audit/AuditLogView.tsx';
import { AdminView } from './components/admin/AdminView.tsx';
import { ApiDocsView } from './components/docs/ApiDocsView.tsx';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard.tsx';
import { EngineeringLabView } from './components/engineeringLab/EngineeringLabView.tsx';
import { GpuAccelerationLabView } from './components/gpuLab/GpuAccelerationLabView.tsx';
import { CodesignLabView } from './components/codesign/CodesignLabView.tsx';
import { DspQuantumLabView } from './components/advancedSim/DspQuantumLabView.tsx';
import { SqlAnalyticsView } from './components/sqlAnalytics/SqlAnalyticsView.tsx';
import { DevopsHubView } from './components/devops/DevopsHubView.tsx';
import { InterviewHubView } from './components/interview/InterviewHubView.tsx';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono text-xs">
        Initializing Semiconductor Platform Security Context...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleSelectDevice = (id: string) => {
    setSelectedDeviceId(id);
    setActiveTab('devices');
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab !== 'devices') {
      setSelectedDeviceId(null);
    }
  };

  return (
    <AppLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'dashboard' && (
        <EnterpriseDashboard
          onSelectDevice={handleSelectDevice}
          onNavigateTab={(tab) => handleTabChange(tab as ActiveTab)}
        />
      )}

      {activeTab === 'devices' && (
        selectedDeviceId ? (
          <DeviceDetail
            deviceId={selectedDeviceId}
            onBack={() => setSelectedDeviceId(null)}
          />
        ) : (
          <DeviceList onSelectDevice={handleSelectDevice} />
        )
      )}

      {activeTab === 'digital-twin' && <DigitalTwinHub />}
      {activeTab === 'telemetry' && <TelemetryIngestionView />}
      {activeTab === 'engineering-lab' && <EngineeringLabView />}
      {activeTab === 'gpu-lab' && <GpuAccelerationLabView />}
      {activeTab === 'codesign' && <CodesignLabView />}
      {activeTab === 'advanced-sim-lab' && <DspQuantumLabView />}
      {activeTab === 'sql-analytics' && <SqlAnalyticsView />}
      {activeTab === 'ml-platform' && <MLPlatformView />}
      {activeTab === 'what-if' && <WhatIfSimulator />}
      {activeTab === 'alerts' && <AlertsAndIncidents />}
      {activeTab === 'analytics' && <AnalyticsView />}
      {activeTab === 'reports' && <ReportingView />}
      {activeTab === 'devops-hub' && <DevopsHubView />}
      {activeTab === 'interview-hub' && <InterviewHubView />}
      {activeTab === 'integrations' && <IntegrationsHub />}
      {activeTab === 'audit' && <AuditLogView />}
      {activeTab === 'admin' && <AdminView />}
      {activeTab === 'docs' && <ApiDocsView />}
      {activeTab === 'onboarding' && (
        <OnboardingWizard onComplete={() => setActiveTab('dashboard')} />
      )}
    </AppLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
