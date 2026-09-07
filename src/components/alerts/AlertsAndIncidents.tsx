/**
 * Alerts, Real-Time Incident Workflows & Escalations
 */

import React, { useState, useEffect } from 'react';
import { Alert, Incident, AlertSeverity, IncidentStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  AlertTriangle,
  Flame,
  Zap,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  ArrowRight,
  Send,
  MessageSquare,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export const AlertsAndIncidents: React.FC = () => {
  const { user, isOperator, isEngineer } = useAuth();
  const [activeTab, setActiveTab] = useState<'alerts' | 'incidents'>('alerts');

  // Alerts State
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'>('OPEN');

  // Incidents State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newNote, setNewNote] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchAlertsAndIncidents = async () => {
    try {
      const [alertRes, incRes] = await Promise.all([
        api.getAlerts({ status: alertFilter === 'ALL' ? undefined : alertFilter }),
        api.getIncidents()
      ]);
      setAlerts(alertRes?.alerts || []);
      setIncidents(incRes?.incidents || []);

      if (selectedIncident && incRes?.incidents) {
        const refreshed = incRes.incidents.find(i => i.id === selectedIncident.id);
        if (refreshed) setSelectedIncident(refreshed);
      }
    } catch (err) {
      console.error('Failed to load alerts & incidents:', err);
    }
  };

  useEffect(() => {
    fetchAlertsAndIncidents();
    const interval = setInterval(fetchAlertsAndIncidents, 2500);
    return () => clearInterval(interval);
  }, [alertFilter]);

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      setActionSuccess('Alert acknowledged');
      fetchAlertsAndIncidents();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.resolveAlert(id);
      setActionSuccess('Alert marked as resolved');
      fetchAlertsAndIncidents();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEscalate = async (id: string) => {
    try {
      const res = await api.escalateAlertToIncident(id);
      setActionSuccess(`Alert escalated to ${res.incident.id}`);
      fetchAlertsAndIncidents();
      setActiveTab('incidents');
      setSelectedIncident(res.incident);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTimelineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !newNote.trim()) return;

    try {
      await api.addIncidentTimeline(selectedIncident.id, newNote);
      setNewNote('');
      fetchAlertsAndIncidents();
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleUpdateStatus = async (status: IncidentStatus) => {
    if (!selectedIncident) return;
    try {
      await api.updateIncident(selectedIncident.id, {
        status,
        resolution: status === 'RESOLVED' || status === 'CLOSED' ? resolutionText || 'Mitigated in cleanroom' : undefined
      });
      fetchAlertsAndIncidents();
    } catch (err) {
      console.error('Failed to update incident status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <span>Alerts & Incident Response Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time threshold violation alerting, escalation pipelines, and engineering post-mortem logging.
          </p>
        </div>

        {actionSuccess && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${
            activeTab === 'alerts' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Active Alerts ({alerts.filter(a => a.status === 'OPEN').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${
            activeTab === 'incidents' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Incident Pipeline ({incidents.filter(i => i.status !== 'CLOSED').length})</span>
        </button>
      </div>

      {/* Tab 1: Alerts View */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Filter Status:</span>
            {(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ALL'] as const).map(st => (
              <button
                key={st}
                onClick={() => setAlertFilter(st)}
                className={`px-2.5 py-1 rounded transition ${
                  alertFilter === st ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs font-mono text-slate-500">
                No alerts matching current filter criteria.
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                    alert.severity === 'CRITICAL' ? 'bg-rose-950/20 border-rose-500/30' :
                    alert.severity === 'WARNING' ? 'bg-amber-950/20 border-amber-500/30' :
                    'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        alert.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="font-bold text-slate-100 text-xs font-mono">{alert.deviceId} - {alert.deviceName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({new Date(alert.timestamp).toLocaleTimeString()})</span>
                    </div>

                    <div className="text-xs text-slate-300 font-sans">
                      {alert.condition}
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-4">
                      <span>Measured: <strong className="text-slate-200">{alert.currentValue}</strong></span>
                      <span>Expected: <strong className="text-slate-400">{alert.expectedValue}</strong></span>
                      {alert.acknowledgedBy && (
                        <span>Ack By: <strong className="text-emerald-400">{alert.acknowledgedBy}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {alert.status === 'OPEN' && isOperator && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
                      >
                        Acknowledge
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && isOperator && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-mono transition"
                      >
                        Resolve
                      </button>
                    )}

                    {!alert.incidentId && isEngineer && (
                      <button
                        onClick={() => handleEscalate(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-semibold flex items-center gap-1 transition"
                      >
                        <span>Escalate to Incident</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {alert.incidentId && (
                      <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-500/30">
                        Linked: {alert.incidentId}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Incidents Pipeline */}
      {activeTab === 'incidents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incidents List */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-xs font-bold text-slate-300 uppercase font-mono mb-2">
              Engineering Incidents
            </h3>

            {incidents.map(inc => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedIncident?.id === inc.id
                    ? 'bg-slate-800/90 border-emerald-500/50 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-200">{inc.id}</span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                    inc.status === 'OPEN' ? 'bg-rose-500/20 text-rose-300' :
                    inc.status === 'INVESTIGATING' ? 'bg-amber-500/20 text-amber-300' :
                    inc.status === 'MITIGATED' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {inc.status}
                  </span>
                </div>

                <div className="font-semibold text-xs text-slate-100 mt-1 font-sans">{inc.title}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Device: {inc.deviceId} • Assignee: {inc.assignedEngineer}
                </div>
              </div>
            ))}
          </div>

          {/* Incident Detail & Timeline */}
          <div className="lg:col-span-2">
            {selectedIncident ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                {/* Header */}
                <div className="border-b border-slate-800 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-100 font-mono">{selectedIncident.id}</span>
                    <div className="flex items-center gap-1.5">
                      {(['INVESTIGATING', 'MITIGATED', 'RESOLVED', 'CLOSED'] as IncidentStatus[]).map(st => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(st)}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition ${
                            selectedIncident.status === st ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <h2 className="text-base font-bold text-slate-100 font-sans">{selectedIncident.title}</h2>
                  <p className="text-xs text-slate-400">{selectedIncident.description}</p>
                </div>

                {/* Timeline Feed */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase font-mono">
                    Incident Timeline & Action Log
                  </h4>

                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {selectedIncident.timeline.map((event, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span className="text-emerald-400 font-bold">{event.author} ({event.actionType})</span>
                          <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-slate-200 font-sans">{event.message}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddTimelineNote} className="pt-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Log cleanroom action or physics finding..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 outline-none font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!newNote.trim()}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Log Action</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs font-mono text-slate-500">
                Select an incident from the list to view timeline and update state.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
