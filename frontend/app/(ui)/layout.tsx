'use client'

import React from 'react';
import Header from '../../components/Header';
import styles from '../../components/styles.module.css';
import { RoleProvider } from '../../components/RoleContext';

export default function UILayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <Header />
      <main className={styles.main}>{children}</main>
    </RoleProvider>
  );
}
