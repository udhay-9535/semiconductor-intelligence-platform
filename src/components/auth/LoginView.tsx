/**
 * Production Enterprise Login View with Multi-Tenant RBAC Authentication
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Cpu,
  AlertCircle,
  KeyRound,
  Building
} from 'lucide-react';

interface LoginViewProps {
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, userProfiles } = useAuth();
  const [email, setEmail] = useState('elena.vance@silicondynamics.io');
  const [password, setPassword] = useState('AdminPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (profEmail: string) => {
    setEmail(profEmail);
    setPassword('AdminPass123!');
    setLoading(true);
    setError(null);
    try {
      await login(profEmail, 'AdminPass123!');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
            <Cpu className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Semiconductor AI Platform
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Industrial Digital Twin, Multiphysics Telemetry &amp; MLOps Reliability Architecture
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Sign In to Industrial Console
            </span>
            <span className="text-[10px] text-cyan-400 font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              TENANT AUTH
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 font-mono uppercase mb-1">
                Enterprise Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@silicondynamics.io"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 font-mono uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-950 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Authenticate with SSO / Token'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Role Profiles */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
              Select Authenticated Role Profile:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {userProfiles.map(p => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleQuickLogin(p.email)}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold font-mono ${
                      p.role === 'SUPER_ADMIN' ? 'text-cyan-400' :
                      p.role === 'ADMIN' ? 'text-purple-400' :
                      p.role === 'ENGINEER' ? 'text-emerald-400' :
                      p.role === 'OPERATOR' ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {p.role}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-200 mt-1">{p.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
