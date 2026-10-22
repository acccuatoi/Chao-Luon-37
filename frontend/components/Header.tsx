'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRoleContext, TestRole } from './RoleContext';
import { useApiStatus } from './useApiStatus';
import styles from './styles.module.css';

const NAV = [
  { href: '/', label: 'New request' },
  { href: '/queue', label: 'Approvals' },
  { href: '/audit', label: 'Audit log' },
];

export default function Header() {
  const pathname = usePathname();
  const { authenticated, isMock, devBypass, currentUser, userRoles, testRole, setTestRole, login, logout } =
    useRoleContext();
  const { status, offline } = useApiStatus();

  const backendPill = isMock
    ? { cls: styles.pillWarn, text: 'Mock data', title: 'NEXT_PUBLIC_USE_MOCK=true: nothing is sent to the backend' }
    : offline
    ? { cls: styles.pillBad, text: 'Backend offline', title: 'Cannot reach the API on port 3001' }
    : status?.mode === 'live'
    ? { cls: styles.pillOk, text: 'TideCloak live', title: 'Every API call is checked against a TideCloak token' }
    : { cls: styles.pillWarn, text: 'Dev bypass', title: 'Backend runs with DEV_AUTH_BYPASS=true: test identities, no token check' };

  const agentPill = status?.agent === 'llm'
    ? { cls: styles.pillOk, text: 'LLM agent', title: 'Proposals are drafted by a language model' }
    : { cls: styles.pillWarn, text: 'Mock agent (no AI)', title: 'Proposals come from a keyword parser, not a model' };

  return (
    <>
      {isMock && (
        <div className={styles.strip} role="status">
          Mock data: this screen is not connected to the backend. Set NEXT_PUBLIC_USE_MOCK=false for the live demo.
        </div>
      )}
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/" className={styles.brand}>
            <img src="/mascot.jpg" alt="" className={styles.brandLogo} />
            <span>
              <span className={styles.brandName}>SentinelAgent</span>
              <span className={styles.brandBy}>by team Chao Luon 37</span>
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.topbarRight}>
            <span className={`${styles.pill} ${backendPill.cls}`} title={backendPill.title}>{backendPill.text}</span>
            {!isMock && status && (
              <span className={`${styles.pill} ${agentPill.cls}`} title={agentPill.title}>{agentPill.text}</span>
            )}

            <div className={styles.who}>
              {isMock || devBypass ? (
                <>
                  <span className={styles.whoName}>{currentUser}</span>
                  <select
                    className={styles.roleSelect}
                    value={testRole}
                    onChange={(e) => setTestRole(e.target.value as TestRole)}
                    aria-label="Test identity"
                    title="Test identity (mock or dev bypass only)"
                  >
                    <option value="requester">alice (requester)</option>
                    <option value="approver">bob (approver)</option>
                    <option value="both">admin (both roles)</option>
                    <option value="observer">observer (no role)</option>
                  </select>
                </>
              ) : authenticated ? (
                <>
                  <span className={styles.whoName} title={currentUser}>{currentUser}</span>
                  {userRoles.length ? (
                    userRoles.map((r) => <span key={r} className={styles.roleTag}>{r}</span>)
                  ) : (
                    <span className={styles.roleTag}>no role</span>
                  )}
                  <button type="button" className={`${styles.btn} ${styles.btnOnDark} ${styles.btnSmall}`} onClick={logout}>
                    Sign out
                  </button>
                </>
              ) : (
                <button type="button" className={`${styles.btn} ${styles.btnLight} ${styles.btnSmall}`} onClick={login}>
                  Sign in with TideCloak
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
