'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTideCloak } from '@tidecloak/nextjs';
import { isMockMode, fetchStatus } from '../lib/ui/api';
import { ApiStatus } from '../lib/types';
import styles from './styles.module.css';

interface HeaderProps {
  currentRole?: string;
  onRoleChange?: (role: string) => void;
  currentUser?: string;
}

export default function Header({ currentRole = "approver", onRoleChange, currentUser }: HeaderProps) {
  const pathname = usePathname();
  const [mockActive, setMockActive] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);

  // Read auth safely from TideCloak SDK
  let tideAuth: any = {};
  try {
    tideAuth = useTideCloak();
  } catch (e) {
    // Graceful fallback if TideCloakProvider context is outside
  }

  const { login, logout, authenticated, getValueFromIdToken, hasRealmRole } = tideAuth;

  const realUsername = getValueFromIdToken ? getValueFromIdToken("preferred_username") : null;
  const isRealApprover = hasRealmRole ? hasRealmRole("approver") : false;
  const isRealRequester = hasRealmRole ? hasRealmRole("requester") : true;

  const displayUser = realUsername || currentUser || "dave.approver@corp.internal";
  const displayRole = authenticated ? (isRealApprover ? "approver" : "requester") : currentRole;

  useEffect(() => {
    setMockActive(isMockMode());
    fetchStatus()
      .then(s => setApiStatus(s))
      .catch(() => setApiStatus({ mode: "simulated", policy: { dailyCapUsd: 5000, whitelist: [] } }));
  }, []);

  return (
    <>
      {mockActive && (
        <aside className={styles.bannerMock} role="region" aria-label="Mock Data Notice">
          <span>⚠️ MOCK DATA ACTIVE (NEXT_PUBLIC_USE_MOCK=true)</span>
          <span style={{ fontWeight: 400, opacity: 0.85 }}>| Simulated TideCloak Quorum</span>
        </aside>
      )}

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandGroup}>
            <Link href="/" className={styles.brandTitle}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>SentinelAgent</span>
              <span className={styles.brandSub}>TideCloak Quorum</span>
            </Link>

            <nav className={styles.navLinks} aria-label="Main Navigation">
              <Link
                href="/"
                className={`${styles.navLink} ${pathname === '/' ? styles.navLinkActive : ''}`}
              >
                Submit Request
              </Link>
              <Link
                href="/queue"
                className={`${styles.navLink} ${pathname === '/queue' ? styles.navLinkActive : ''}`}
              >
                Approval Queue
              </Link>
              <Link
                href="/audit"
                className={`${styles.navLink} ${pathname === '/audit' ? styles.navLinkActive : ''}`}
              >
                Audit Log
              </Link>
            </nav>
          </div>

          <div className={styles.headerActions}>
            {/* Honest Status Badge */}
            <span
              className={`${styles.statusBadge} ${
                !mockActive && apiStatus?.mode === 'live' ? styles.statusLive : styles.statusSimulated
              }`}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: 'currentColor'
                }}
              />
              {!mockActive && apiStatus?.mode === 'live' ? 'Live TideCloak' : 'Simulated'}
            </span>

            {/* Current User & Role Badge */}
            <div className={styles.userBadge}>
              <span>{displayUser}</span>
              <span
                className={`${styles.roleChip} ${
                  displayRole === 'approver' ? styles.roleChipApprover : ''
                }`}
              >
                {displayRole}
              </span>

              {/* Role Toggle for testing when in mock mode */}
              {mockActive && onRoleChange && (
                <select
                  className={styles.roleSelect}
                  value={currentRole}
                  onChange={(e) => onRoleChange(e.target.value)}
                  aria-label="Switch Test Role"
                  title="Switch role in mock mode to test approver vs requester permissions"
                >
                  <option value="approver">Role: approver</option>
                  <option value="requester">Role: requester</option>
                  <option value="observer">Role: observer</option>
                </select>
              )}
            </div>

            {/* Log In / Log Out Button */}
            {authenticated ? (
              <button
                type="button"
                onClick={() => logout && logout()}
                className={`${styles.btnAuth} ${styles.btnAuthOut}`}
              >
                Log Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => login && login()}
                className={styles.btnAuth}
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
