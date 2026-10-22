'use client'

import React from 'react';
import Header from '../../components/Header';
import styles from '../../components/styles.module.css';
import { RoleProvider, useRoleContext } from '../../components/RoleContext';

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { currentRole, currentUser, setCurrentRole } = useRoleContext();

  return (
    <div style={{ minHeight: '100vh', background: '#07090e', color: '#f8fafc' }}>
      <Header
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        currentUser={currentUser}
      />
      <main className={styles.mainContainer}>
        {children}
      </main>
    </div>
  );
}

export default function UILayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <LayoutInner>{children}</LayoutInner>
    </RoleProvider>
  );
}

