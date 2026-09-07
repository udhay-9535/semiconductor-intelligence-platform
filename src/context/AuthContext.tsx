/**
 * Authentication & RBAC React Context
 * Production Multi-Tenant Auth with Granular Roles and Session Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Organization } from '../types/index.ts';
import { api } from '../services/api.ts';

export interface UserRoleProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
}

export const ACTIVE_USER_PROFILES: UserRoleProfile[] = [
  { id: 'usr-001', name: 'Dr. Elena Vance', email: 'elena.vance@silicondynamics.io', role: 'SUPER_ADMIN', title: 'Lead Reliability Architect' },
  { id: 'usr-002', name: 'Marcus Chen', email: 'marcus.chen@silicondynamics.io', role: 'ADMIN', title: 'MLOps & Platform Engineer' },
  { id: 'usr-003', name: 'Sarah Lindqvist', email: 'sarah.l@silicondynamics.io', role: 'ENGINEER', title: 'Device Physicist' },
  { id: 'usr-004', name: 'Devin Patel', email: 'devin.patel@silicondynamics.io', role: 'ANALYST', title: 'Yield & Telemetry Analyst' },
  { id: 'usr-005', name: 'Tanya Morales', email: 'tanya.m@silicondynamics.io', role: 'OPERATOR', title: 'Cleanroom Floor Operator' },
  { id: 'usr-006', name: 'Auditor Guest', email: 'auditor@silicondynamics.io', role: 'VIEWER', title: 'Fab Quality Auditor' },
];

interface AuthContextType {
  user: User | null;
  org: Organization | null;
  loading: boolean;
  role: UserRole;
  userProfiles: UserRoleProfile[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEngineer: boolean;
  isOperator: boolean;
  canManageDevices: boolean;
  canRunSimulations: boolean;
  canAcknowledgeAlerts: boolean;
  canManageUsers: boolean;
  switchUser: (userId: string) => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  refreshOrg: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_RANKS: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  ENGINEER: 60,
  ANALYST: 40,
  OPERATOR: 30,
  VIEWER: 10
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'usr-001',
    orgId: 'org-demo-01',
    name: 'Dr. Elena Vance',
    email: 'elena.vance@silicondynamics.io',
    role: 'SUPER_ADMIN',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z'
  });
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrgDetails = async () => {
    try {
      const res = await api.getCurrentOrg();
      setOrg(res.organization);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchOrgDetails();
  }, [user?.orgId]);

  const switchUser = async (userId: string) => {
    setLoading(true);
    try {
      const res = await api.demoSwitchUser(userId);
      setUser(res.user);
      api.setToken(res.token);
      api.setOrgId(res.user.orgId);
      await fetchOrgDetails();
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string) => {
    setLoading(true);
    try {
      const res = await api.login(email);
      setUser(res.user);
      api.setToken(res.token);
      api.setOrgId(res.user.orgId);
      await fetchOrgDetails();
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    api.setToken(null);
  };

  const userRank = user ? ROLE_RANKS[user.role] : 0;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = userRank >= ROLE_RANKS.ADMIN;
  const isEngineer = userRank >= ROLE_RANKS.ENGINEER;
  const isOperator = userRank >= ROLE_RANKS.OPERATOR;

  const value: AuthContextType = {
    user,
    org,
    loading,
    role: user?.role || 'VIEWER',
    userProfiles: ACTIVE_USER_PROFILES,
    isSuperAdmin,
    isAdmin,
    isEngineer,
    isOperator,
    canManageDevices: isAdmin,
    canRunSimulations: isEngineer,
    canAcknowledgeAlerts: isOperator,
    canManageUsers: isAdmin,
    switchUser,
    login,
    logout,
    refreshOrg: fetchOrgDetails
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
