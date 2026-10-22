'use client'

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useTideCloak } from '@tidecloak/nextjs';
import { isMockMode, setAuthHeaderProvider } from '../lib/ui/api';

export interface RoleContextType {
  // Auth state
  authenticated: boolean;
  isInitializing: boolean;
  isMock: boolean;

  // Identity & Roles
  currentUser: string;
  userRoles: string[]; // List of all roles held: ['requester'], ['approver'], or both
  hasRole: (role: string) => boolean;

  // Mock / Dev toggles
  mockRole: string;
  setMockRole: (role: string) => void;
  mockUser: string;
  setMockUser: (user: string) => void;

  // Auth actions
  login: () => void;
  logout: () => void;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

const defaultContext: RoleContextType = {
  authenticated: false,
  isInitializing: false,
  isMock: true,
  currentUser: 'acccuatoi (Quản trị viên)',
  userRoles: ['approver'],
  hasRole: (r: string) => r === 'approver',
  mockRole: 'approver',
  setMockRole: () => {},
  mockUser: 'acccuatoi (Quản trị viên)',
  setMockUser: () => {},
  login: () => {},
  logout: () => {},
  getAuthHeaders: async () => ({})
};

const RoleContext = createContext<RoleContextType>(defaultContext);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [isMock, setIsMock] = useState<boolean>(true);
  const [mockRole, setMockRole] = useState<string>('approver');
  const [mockUser, setMockUser] = useState<string>('acccuatoi (Quản trị viên)');

  // Safely consume TideCloak hook
  let tideAuth: any = {};
  try {
    tideAuth = useTideCloak();
  } catch (err) {
    // Graceful fallback if outside TideCloak context
  }

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
    getValueFromToken
  } = tideAuth;

  // Check mock mode on mount
  useEffect(() => {
    setIsMock(isMockMode());
  }, []);

  // Update default mock user when mock role changes
  useEffect(() => {
    if (mockRole === 'requester') {
      setMockUser('alice.requester@corp.internal');
    } else if (mockRole === 'approver') {
      setMockUser('acccuatoi (Quản trị viên)');
    } else if (mockRole === 'both') {
      setMockUser('acccuatoi (Quản trị viên)');
    } else {
      setMockUser('observer@corp.internal');
    }
  }, [mockRole]);

  // Check role helper across realm and client roles (Requirement B12)
  const hasRole = useCallback((role: string): boolean => {
    if (isMock) {
      if (mockRole === 'both') return role === 'requester' || role === 'approver';
      return mockRole === role;
    }
    if (!authenticated) return false;
    const inRealm = typeof hasRealmRole === 'function' ? hasRealmRole(role) : false;
    const inClient = typeof hasClientRole === 'function' ? hasClientRole(role) : false;
    return Boolean(inRealm || inClient);
  }, [isMock, mockRole, authenticated, hasRealmRole, hasClientRole]);

  // Compute all roles the user holds
  const userRoles = useMemo<string[]>(() => {
    if (isMock) {
      if (mockRole === 'both') return ['requester', 'approver'];
      return [mockRole];
    }
    if (!authenticated) return [];
    const roles: string[] = [];
    if (hasRole('requester')) roles.push('requester');
    if (hasRole('approver')) roles.push('approver');
    if (hasRole('offline_access')) roles.push('offline_access');
    return roles.length > 0 ? roles : ['authenticated'];
  }, [isMock, mockRole, authenticated, hasRole]);

  // Compute current display username
  const currentUser = useMemo<string>(() => {
    if (isMock) return mockUser;
    if (!authenticated) return 'Unauthenticated';

    const preferred = (typeof getValueFromIdToken === 'function' && getValueFromIdToken('preferred_username')) ||
                      (typeof getValueFromToken === 'function' && getValueFromToken('preferred_username'));
    const name = typeof getValueFromIdToken === 'function' && getValueFromIdToken('name');
    const email = typeof getValueFromIdToken === 'function' && getValueFromIdToken('email');

    return preferred || name || email || 'TideCloak User';
  }, [isMock, mockUser, authenticated, getValueFromIdToken, getValueFromToken]);

  // Function to provide auth headers for API calls (Requirements B2, B9)
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {};

    if (!isMock && authenticated) {
      try {
        let currentToken: string | null = null;
        if (typeof getToken === 'function') {
          currentToken = await getToken();
        } else {
          currentToken = token;
        }

        if (currentToken) {
          headers['Authorization'] = `Bearer ${currentToken}`;
        }
      } catch (err) {
        console.warn('Failed to retrieve fresh TideCloak token', err);
      }
    }

    // Always send x-dev headers when in mock mode or for dev bypass fallback
    if (isMock || !authenticated) {
      headers['x-dev-user'] = currentUser;
      const rolesToSend = userRoles.filter(r => r === 'requester' || r === 'approver').join(',') || mockRole;
      headers['x-dev-role'] = rolesToSend;
    }

    return headers;
  }, [isMock, authenticated, getToken, token, currentUser, userRoles, mockRole]);

  // Register header provider with api.ts client
  useEffect(() => {
    setAuthHeaderProvider(getAuthHeaders);
  }, [getAuthHeaders]);

  const value: RoleContextType = {
    authenticated,
    isInitializing,
    isMock,
    currentUser,
    userRoles,
    hasRole,
    mockRole,
    setMockRole,
    mockUser,
    setMockUser,
    login: () => (login ? login() : undefined),
    logout: () => (logout ? logout() : undefined),
    getAuthHeaders
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRoleContext() {
  return useContext(RoleContext);
}
