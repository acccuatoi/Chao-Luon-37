'use client'

import React from 'react';
import Header from '../../components/Header';
import styles from '../../components/styles.module.css';
import { RoleProvider } from '../../components/RoleContext';

function LayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#07090e', color: '#f8fafc' }}>
      <Header />
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
