'use client'

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useTideCloak } from '@tidecloak/nextjs';
import { isMockMode, setAuthHeaderProvider } from '../lib/ui/api';

// Identity rules:
// - Live mode: user and roles come only from the TideCloak token. Not signed in = no identity, no roles.
// - Mock mode (NEXT_PUBLIC_USE_MOCK=true) or dev bypass (NEXT_PUBLIC_DEV_AUTH_BYPASS=true, backend DEV_AUTH_BYPASS=true):
//   a test identity chosen in the header is used, and sent as x-dev-user / x-dev-role headers (dev bypass only).
export const isDevBypass = (): boolean => process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

export type TestRole = 'requester' | 'approver' | 'both' | 'observer';

const TEST_USERS: Record<TestRole, string> = {
  requester: 'alice',
  approver: 'bob',
  both: 'admin',
  observer: 'observer',
};

export interface RoleContextType {
  authenticated: boolean;
  isInitializing: boolean;
  isMock: boolean;
  devBypass: boolean;
  /** True when the UI may call actions: signed in, or using a test identity. */
  canAct: boolean;
  currentUser: string;
  userRoles: string[];
  hasRole: (role: string) => boolean;
  testRole: TestRole;
  setTestRole: (role: TestRole) => void;
  login: () => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [isMock] = useState<boolean>(() => isMockMode());
  const devBypass = !isMock && isDevBypass();
  const useTestIdentity = isMock || devBypass;
  const [testRole, setTestRole] = useState<TestRole>('both');

  const tide = useTideCloak() as any;
  const {
    authenticated = false,
    isInitializing = false,
    getToken,
    token,
    login,
    logout,
    hasRealmRole,
    hasClientRole,
    getValueFromIdToken,
    getValueFromToken,
  } = tide ?? {};

  const hasRole = useCallback(
    (role: string): boolean => {
      if (useTestIdentity) {
        if (testRole === 'both') return role === 'requester' || role === 'approver';
        return testRole === role;
      }
      if (!authenticated) return false;
      const inRealm = typeof hasRealmRole === 'function' ? hasRealmRole(role) : false;
      const inClient = typeof hasClientRole === 'function' ? hasClientRole(role) : false;
      return Boolean(inRealm || inClient);
    },
    [useTestIdentity, testRole, authenticated, hasRealmRole, hasClientRole],
  );

  const userRoles = useMemo<string[]>(
    () => ['requester', 'approver'].filter((r) => hasRole(r)),
    [hasRole],
  );

  const currentUser = useMemo<string>(() => {
    if (useTestIdentity) return TEST_USERS[testRole];
    if (!authenticated) return '';
    const read = (k: string) =>
      (typeof getValueFromIdToken === 'function' && getValueFromIdToken(k)) ||
      (typeof getValueFromToken === 'function' && getValueFromToken(k));
    return read('preferred_username') || read('name') || read('email') || 'TideCloak user';
  }, [useTestIdentity, testRole, authenticated, getValueFromIdToken, getValueFromToken]);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {};
    if (devBypass) {
      // Header values must be ISO-8859-1; the backend decodes this.
      headers['x-dev-user'] = encodeURIComponent(currentUser);
      headers['x-dev-role'] = userRoles.join(',');
      return headers;
    }
    if (!isMock && authenticated) {
      try {
        const fresh = typeof getToken === 'function' ? await getToken() : token;
        if (fresh) headers['Authorization'] = `Bearer ${fresh}`;
      } catch (err) {
        console.warn('Could not get a fresh TideCloak token', err);
      }
    }
    return headers;
  }, [devBypass, isMock, authenticated, getToken, token, currentUser, userRoles]);

  useEffect(() => {
    setAuthHeaderProvider(getAuthHeaders);
  }, [getAuthHeaders]);

  const value: RoleContextType = {
    authenticated,
    isInitializing,
    isMock,
    devBypass,
    canAct: useTestIdentity || authenticated,
    currentUser,
    userRoles,
    hasRole,
    testRole,
    setTestRole,
    login: () => (typeof login === 'function' ? login() : undefined),
    logout: () => (typeof logout === 'function' ? logout() : undefined),
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRoleContext(): RoleContextType {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRoleContext must be used inside RoleProvider');
  return ctx;
}
