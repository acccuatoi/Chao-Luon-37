'use client'

import React, { useCallback, useEffect, useState } from 'react';
import { AuditEntry, AuditEvent } from '../../../lib/types';
import { fetchAuditLog, verifyAuditChain, ChainCheck } from '../../../lib/ui/api';
import { useRoleContext } from '../../../components/RoleContext';
import SignInNotice from '../../../components/SignInNotice';
import styles from '../../../components/styles.module.css';

const EVENTS: { value: AuditEvent; label: string; cls: string }[] = [
  { value: 'proposed', label: 'Proposed', cls: styles.evProposed },
  { value: 'approved', label: 'Approved', cls: styles.evApproved },
  { value: 'executed', label: 'Paid', cls: styles.evExecuted },
  { value: 'blocked', label: 'Blocked', cls: styles.evBlocked },
  { value: 'rejected', label: 'Refused', cls: styles.evRejected },
];

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function AuditPage() {
  const { canAct, authenticated } = useRoleContext();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [chain, setChain] = useState<ChainCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<'all' | AuditEvent>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const [log, check] = await Promise.all([fetchAuditLog(), verifyAuditChain().catch(() => null)]);
      setEntries(log);
      setChain(check);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Could not load the audit log.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canAct) {
      setLoading(false);
      return;
    }
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [canAct, authenticated, load]);

  const q = query.trim().toLowerCase();
  const shown = entries
    .filter((e) => event === 'all' || e.event === event)
    .filter((e) => !q || e.requestId.toLowerCase().includes(q) || e.actor.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Audit log</h1>
          <p className={styles.lede}>
            Every proposal, approval, block and refused attempt, newest first. Each entry carries the hash of the one
            before it, so editing, deleting or reordering any entry breaks the chain.
          </p>
        </div>
      </div>

      <SignInNotice doing="read the audit log" />

      {canAct && chain && (
        <div className={`${styles.chain} ${chain.ok ? styles.chainOk : styles.chainBad}`} role="status">
          <div>
            <div className={styles.chainTitle}>
              {chain.ok ? `Chain intact: all ${chain.entries} entries check out` : 'Chain broken: the log was changed'}
            </div>
            <div className={styles.chainHash}>
              {chain.ok ? `Latest hash ${chain.headHash.slice(0, 16)}…` : `First bad entry ${chain.brokenAt}`}
            </div>
          </div>
        </div>
      )}

      {canAct && (
        <>
          <div className={styles.filters}>
            <label className={styles.field}>
              Event
              <select className={styles.input} value={event} onChange={(e) => setEvent(e.target.value as any)}>
                <option value="all">All events ({entries.length})</option>
                {EVENTS.map((ev) => (
                  <option key={ev.value} value={ev.value}>{ev.label}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              Search
              <input
                className={styles.input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Request id, person or text"
              />
            </label>
          </div>

          {loading ? (
            <div className={styles.empty}>Loading the audit log…</div>
          ) : error ? (
            <div className={`${styles.notice} ${styles.noticeBad}`} role="alert">
              <div>
                <strong>Could not load the audit log.</strong>
                <p>{error}</p>
              </div>
            </div>
          ) : shown.length === 0 ? (
            <div className={styles.empty}>No entries match.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Who</th>
                    <th>What happened</th>
                    <th>Request</th>
                    <th>Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((e) => {
                    const ev = EVENTS.find((x) => x.value === e.event);
                    return (
                      <tr key={e.id}>
                        <td className={styles.time}>{when(e.at)}</td>
                        <td>
                          <span className={`${styles.event} ${ev?.cls ?? ''}`}>{ev?.label ?? e.event}</span>
                        </td>
                        <td><strong>{e.actor}</strong></td>
                        <td>{e.detail}</td>
                        <td className={styles.hash}>{e.requestId}</td>
                        <td className={styles.hash} title={e.hash}>{e.hash ? e.hash.slice(0, 10) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
