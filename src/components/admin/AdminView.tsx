/**
 * Enterprise Admin, Multi-Tenancy & User Management Console
 */

import React, { useState, useEffect } from 'react';
import { User, UserRole, Organization, CleanroomSite } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ShieldAlert,
  Users,
  Building2,
  MapPin,
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<CleanroomSite[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);

  // Invite modal state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('ENGINEER');
  const [invitePassword, setInvitePassword] = useState('Password123!');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const [uRes, sRes, oRes] = await Promise.all([
        api.getUsers(),
        api.getSites(),
        api.getCurrentOrg()
      ]);
      setUsers(uRes?.users || []);
      setSites(sRes?.sites || []);
      setOrg(oRes?.organization || null);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    setInviting(true);
    setInviteMsg(null);
    try {
      await api.createUser({
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
        password: invitePassword
      });
      setInviteMsg(`User ${inviteEmail} registered successfully.`);
      setInviteEmail('');
      setInviteName('');
      fetchAdminData();
    } catch (err: any) {
      setInviteMsg(`Error: ${err.message}`);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.updateUser(userId, { role: newRole });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 font-mono">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
            <span>Enterprise Organization & Access Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure multi-tenant isolation, cleanroom fab sites, and user access control (RBAC).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization & Cleanroom Sites */}
        <div className="space-y-6 lg:col-span-1">
          {/* Org Profile */}
          {org && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase font-mono text-emerald-400">
                <Building2 className="w-4 h-4" />
                <span>Tenant Organization</span>
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div className="text-base font-bold text-slate-100 font-sans">{org.name}</div>
                <div className="text-slate-400">Tenant ID: {org.id}</div>
                <div className="text-slate-400">Retention: <span className="text-emerald-400 font-bold">{org.settings.telemetryRetentionDays} Days</span></div>
                <div className="text-slate-400">Created: {new Date(org.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          {/* Cleanroom Sites */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase font-mono text-slate-200">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Fab Cleanroom Sites ({sites.length})</span>
              </div>
            </div>

            <div className="space-y-2">
              {sites.map(site => (
                <div key={site.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                  <div className="font-bold text-slate-200">{site.name} ({site.code})</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {site.location} • {site.timezone}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: User Management & Invite form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invite User Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Provision New User / Engineer</span>
            </h3>

            {inviteMsg && (
              <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                {inviteMsg}
              </div>
            )}

            <form onSubmit={handleInviteUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="jane.smith@semiconductor.internal"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                >
                  <option value="ADMIN">ADMIN (Full Authority)</option>
                  <option value="ENGINEER">ENGINEER (Simulate, What-If & AI)</option>
                  <option value="OPERATOR">OPERATOR (Ack & Remediate)</option>
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1">Temporary Password</label>
                <input
                  type="text"
                  value={invitePassword}
                  onChange={e => setInvitePassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{inviting ? 'Provisioning...' : 'Provision User'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* User Directory Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase font-mono">
                Organization Users Directory ({users.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">User</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Last Login</th>
                    <th className="py-2.5 px-4 text-right">Modify Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-100 font-sans">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' :
                          u.role === 'ENGINEER' ? 'bg-emerald-500/20 text-emerald-300' :
                          u.role === 'OPERATOR' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-emerald-400 font-bold text-[10px]">ACTIVE</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleTimeString() : 'Never'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {currentUser?.id !== u.id && (
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                            className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-[10px] font-mono focus:border-emerald-500 outline-none"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="ENGINEER">ENGINEER</option>
                            <option value="OPERATOR">OPERATOR</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
