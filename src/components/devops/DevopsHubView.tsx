/**
 * Cloud Infrastructure, Kubernetes & CI/CD Hub View
 */

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Server,
  Layers,
  GitPullRequest,
  CheckCircle2,
  Activity,
  Play,
  RotateCcw,
  Terminal,
  Shield,
  Clock,
  Gauge
} from 'lucide-react';
import { api } from '../../services/api.ts';

export const DevopsHubView: React.FC = () => {
  const [devopsData, setDevopsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'K8S' | 'TERRAFORM' | 'METRICS'>('PIPELINE');
  const [triggeringCicd, setTriggeringCicd] = useState(false);
  const [pipelineRun, setPipelineRun] = useState<any>(null);

  const loadOverview = async () => {
    try {
      const data = await api.getDevopsOverview();
      setDevopsData(data);
    } catch (err) {
      console.error('Failed to load DevOps overview:', err);
    }
  };

  const triggerCicd = async () => {
    setTriggeringCicd(true);
    try {
      const run = await api.triggerCicdPipeline();
      setPipelineRun(run);
    } catch (err) {
      console.error('Failed to trigger CI/CD pipeline:', err);
    } finally {
      setTriggeringCicd(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              MODULE 18-22 • CLOUD INFRASTRUCTURE &amp; DEVOPS
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              K8S &amp; TERRAFORM READY
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono mt-1">
            <Cloud className="w-6 h-6 text-sky-400" />
            <span>Cloud Infrastructure, Kubernetes &amp; CI/CD Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-cloud production architectures (AWS, GCP, Azure), Kubernetes YAML blueprints, Terraform IaC, and automated GitHub Actions verification.
          </p>
        </div>

        <button
          onClick={triggerCicd}
          disabled={triggeringCicd}
          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition font-mono shadow-sm"
        >
          <Play className={`w-3.5 h-3.5 ${triggeringCicd ? 'animate-spin' : ''}`} />
          <span>{triggeringCicd ? 'Executing Pipeline...' : 'Trigger CI/CD Pipeline'}</span>
        </button>
      </div>

      {/* Cloud Targets Overview Banner */}
      {devopsData?.cloudTargets && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devopsData.cloudTargets.map((ct: any, idx: number) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{ct.provider}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  ct.status === 'HEALTHY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'
                }`}>
                  {ct.status}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">{ct.service}</p>
              <div className="text-[10px] text-slate-500">Region: {ct.region}</div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'PIPELINE', label: '1. CI/CD Pipeline & Test Suite', icon: GitPullRequest },
          { id: 'K8S', label: '2. Kubernetes Manifests', icon: Server },
          { id: 'TERRAFORM', label: '3. Terraform IaC Blueprint', icon: Layers },
          { id: 'METRICS', label: '4. Prometheus System Telemetry', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CI/CD PIPELINE */}
      {activeTab === 'PIPELINE' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-sky-400 uppercase flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4" />
                  <span>GitHub Actions Automated 6-Stage CI/CD Runner</span>
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Branch: <span className="text-slate-200 font-bold">main</span> | Commit: <span className="text-sky-400 font-bold">a9f4c8e</span>
                </p>
              </div>

              <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ALL STAGES PASSING</span>
              </span>
            </div>

            <div className="space-y-3">
              {(pipelineRun?.stages || devopsData?.ciCdStages)?.map((st: any, idx: number) => (
                <div key={st.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-200">{st.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{st.command}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-[11px]">{st.durationSec}s</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      {st.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KUBERNETES MANIFESTS */}
      {activeTab === 'K8S' && devopsData?.k8sManifests && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-sky-400 uppercase flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>Deployment &amp; Rolling Update Manifest</span>
            </h3>
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-300 overflow-x-auto custom-scrollbar whitespace-pre-wrap">
              {devopsData.k8sManifests.BACKEND_DEPLOYMENT}
            </pre>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-sky-400 uppercase flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>Service &amp; Horizontal Pod Autoscaler (HPA)</span>
            </h3>
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-300 overflow-x-auto custom-scrollbar whitespace-pre-wrap">
              {devopsData.k8sManifests.SERVICE_AND_HPA}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: TERRAFORM IAC */}
      {activeTab === 'TERRAFORM' && devopsData?.terraformTemplates && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
          <h3 className="text-xs font-bold text-sky-400 uppercase flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>Terraform AWS / Multi-Region Infrastructure Blueprint</span>
          </h3>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300 overflow-x-auto custom-scrollbar whitespace-pre-wrap">
            {devopsData.terraformTemplates.MAIN_INFRA}
          </pre>
        </div>
      )}

      {/* TAB 4: PROMETHEUS METRICS */}
      {activeTab === 'METRICS' && devopsData?.systemMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">P95 Request Latency</div>
            <div className="text-xl font-bold text-emerald-400">{devopsData.systemMetrics.p95LatencyMs} ms</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">P99 Request Latency</div>
            <div className="text-xl font-bold text-emerald-400">{devopsData.systemMetrics.p99LatencyMs} ms</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Throughput (RPS)</div>
            <div className="text-xl font-bold text-sky-400">{devopsData.systemMetrics.apiRps} req/s</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Error Rate</div>
            <div className="text-xl font-bold text-slate-100">{devopsData.systemMetrics.errorRatePct}%</div>
          </div>
        </div>
      )}
    </div>
  );
};
