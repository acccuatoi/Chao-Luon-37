'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRoleContext } from './RoleContext';
import { isMockMode, fetchStatus } from '../lib/ui/api';
import { ApiStatus } from '../lib/types';
import styles from './styles.module.css';

export default function Header() {
  const pathname = usePathname();
  const {
    authenticated,
    currentUser,
    userRoles,
    mockRole,
    setMockRole,
    login,
    logout
  } = useRoleContext();

  const [mockActive, setMockActive] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [statusError, setStatusError] = useState<boolean>(false);

  useEffect(() => {
    setMockActive(isMockMode());
    fetchStatus()
      .then((s) => {
        setApiStatus(s);
        setStatusError(false);
      })
      .catch((err) => {
        console.warn("Could not fetch API status:", err);
        setStatusError(true);
      });
  }, []);

  const isLiveMode = !mockActive && apiStatus?.mode === 'live';
  const agentType = apiStatus?.agent;

  return (
    <>
      {mockActive && (
        <aside className={styles.bannerMock} role="region" aria-label="Mock Data Notice">
          <span>⚠️ MOCK DATA ACTIVE (NEXT_PUBLIC_USE_MOCK=true)</span>
          <span style={{ fontWeight: 400, opacity: 0.85 }}>| Simulated Offline Governance</span>
        </aside>
      )}

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandGroup}>
            <Link href="/" className={styles.brandTitle}>
              <img
                src="/mascot.jpg"
                alt="Cháo Lươn 37 Mascot"
                className={styles.mascotHeaderLogo}
              />
              <span>SentinelAgent</span>
              <span className={styles.brandSub}>Cháo Lươn 37</span>
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
            {/* Status Badges Group (Requirement B7) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Backend Mode Badge */}
              <span
                className={`${styles.statusBadge} ${
                  statusError
                    ? styles.statusSimulated
                    : isLiveMode
                    ? styles.statusLive
                    : styles.statusSimulated
                }`}
                title={
                  statusError
                    ? "Backend is offline (port 3001)"
                    : isLiveMode
                    ? "Connected to Live TideCloak verification on :3001"
                    : "Simulated verification / Dev mode"
                }
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'currentColor'
                  }}
                />
                {statusError
                  ? 'Backend Offline'
                  : isLiveMode
                  ? 'Live TideCloak'
                  : 'Simulated'}
              </span>

              {/* Agent Type Badge */}
              {apiStatus && (
                <span
                  className={styles.statusBadge}
                  style={{
                    background: agentType === 'llm' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: agentType === 'llm' ? '#38bdf8' : '#94a3b8',
                    border: agentType === 'llm' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(148, 163, 184, 0.25)'
                  }}
                  title={agentType === 'llm' ? "LLM Agent (Claude/Anthropic)" : "Mock Agent (keyword rules, no LLM API key)"}
                >
                  {agentType === 'llm' ? '🤖 LLM Agent' : '⚙️ Mock Agent (No AI)'}
                </span>
              )}
            </div>

            {/* Current User & Roles (Requirements B3, B12) */}
            <div className={styles.userBadge}>
              <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={currentUser}>
                {currentUser}
              </span>

              {/* Show every role the user holds */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {userRoles.map((role) => (
                  <span
                    key={role}
                    className={`${styles.roleChip} ${
                      role === 'approver' ? styles.roleChipApprover : ''
                    }`}
                  >
                    {role}
                  </span>
                ))}
              </div>

              {/* Role Toggle for testing (Only visible in mock mode or when not logged in) */}
              {mockActive && (
                <select
                  className={styles.roleSelect}
                  value={mockRole}
                  onChange={(e) => setMockRole(e.target.value)}
                  aria-label="Switch Test Role"
                  title="Switch role in mock mode to test permissions"
                >
                  <option value="approver">Test: Approver</option>
                  <option value="requester">Test: Requester</option>
                  <option value="both">Test: Both Roles</option>
                  <option value="observer">Test: Observer</option>
                </select>
              )}
            </div>

            {/* Log In / Log Out Button */}
            {authenticated ? (
              <button
                type="button"
                onClick={logout}
                className={`${styles.btnAuth} ${styles.btnAuthOut}`}
              >
                Log Out
              </button>
            ) : (
              <button
                type="button"
                onClick={login}
                className={styles.btnPrimary}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
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
