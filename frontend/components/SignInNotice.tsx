'use client'

import React from 'react';
import { useRoleContext } from './RoleContext';
import styles from './styles.module.css';

/** Shown in live mode when nobody is signed in, or when the signed-in user lacks the role this page needs. */
export default function SignInNotice({ role, doing }: { role?: 'requester' | 'approver'; doing: string }) {
  const { canAct, authenticated, isMock, devBypass, hasRole, login, isInitializing } = useRoleContext();
  if (isInitializing) return null;

  if (!canAct) {
    return (
      <div className={`${styles.notice} ${styles.noticeInfo}`}>
        <div>
          <strong>Sign in to {doing}.</strong>
          <p>Every action is checked against your TideCloak account and its roles.</p>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={login}>
          Sign in with TideCloak
        </button>
      </div>
    );
  }

  if (role && authenticated && !isMock && !devBypass && !hasRole(role)) {
    return (
      <div className={`${styles.notice} ${styles.noticeWarn}`}>
        <div>
          <strong>Your account does not have the {role} role.</strong>
          <p>Ask an admin to assign it in TideCloak, then sign out and sign in again.</p>
        </div>
      </div>
    );
  }
  return null;
}
