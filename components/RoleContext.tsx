'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

interface RoleContextType {
  currentRole: string;
  currentUser: string;
  setCurrentRole: (role: string) => void;
  setCurrentUser: (user: string) => void;
}

const RoleContext = createContext<RoleContextType>({
  currentRole: 'approver',
  currentUser: 'dave.approver@corp.internal',
  setCurrentRole: () => {},
  setCurrentUser: () => {}
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<string>('approver');
  const [currentUser, setCurrentUser] = useState<string>('dave.approver@corp.internal');

  useEffect(() => {
    if (currentRole === 'requester') {
      setCurrentUser('alice.requester@corp.internal');
    } else if (currentRole === 'approver') {
      setCurrentUser('dave.approver@corp.internal');
    } else {
      setCurrentUser('observer@corp.internal');
    }
  }, [currentRole]);

  return (
    <RoleContext.Provider value={{ currentRole, currentUser, setCurrentRole, setCurrentUser }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRoleContext() {
  return useContext(RoleContext);
}
