'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { AuditEntry, AuditEvent } from '../../../lib/types';
import { fetchAuditLog, verifyAuditChain, ChainCheck } from '../../../lib/ui/api';
import styles from '../../../components/styles.module.css';

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [chainCheck, setChainCheck] = useState<ChainCheck | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchRequestId, setSearchRequestId] = useState<string>('');

  const loadAudit = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [auditData, verifyResult] = await Promise.all([
        fetchAuditLog(),
        verifyAuditChain().catch((e) => {
          console.warn("Chain verify failed:", e);
          return null;
        })
      ]);
      setEntries(auditData);
      if (verifyResult) setChainCheck(verifyResult);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit log');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAudit();
    const interval = setInterval(() => {
      loadAudit(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadAudit]);

  const getEventBadge = (event: AuditEvent) => {
    switch (event) {
      case 'proposed':
        return <span className={styles.chipApproved}>PROPOSED</span>;
      case 'approved':
        return <span className={styles.chipPending}>APPROVED</span>;
      case 'executed':
        return <span className={styles.chipExecuted}>EXECUTED</span>;
      case 'blocked':
        return <span className={styles.chipBlocked}>BLOCKED</span>;
      case 'rejected':
        return (
          <span
            className={styles.chipBlocked}
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid #ef4444',
              color: '#fca5a5'
            }}
          >
            ⛔ REJECTED
          </span>
        );
      default:
        return <span className={styles.chipPending}>{event}</span>;
    }
  };

  // Filtered entries
  const filteredEntries = entries
    .filter((entry) => {
      if (selectedEvent !== 'all' && entry.event !== selectedEvent) return false;
      if (searchRequestId.trim() && !entry.requestId.toLowerCase().includes(searchRequestId.toLowerCase().trim())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div>
      <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className={styles.pageTitle}>Cryptographic Audit Trail</h1>
          <p className={styles.pageDesc}>
            Immutable chronological ledger of AI proposals, human quorum signatures, policy blocks, and execution events.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Requirement B19: Chain Verification Badge */}
          {chainCheck && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 700,
                background: chainCheck.ok ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.2)',
                border: chainCheck.ok ? '1px solid #34d399' : '1px solid #ef4444',
                color: chainCheck.ok ? '#34d399' : '#fca5a5'
              }}
              title={chainCheck.ok ? `Chain recomputed: ${chainCheck.entries} entries verified via sha256` : `Chain broken at ${chainCheck.brokenAt}`}
            >
              <span>{chainCheck.ok ? '✓ Chain Verified' : '⛔ Chain Broken'}</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.8, fontFamily: 'monospace' }}>
                ({chainCheck.headHash ? chainCheck.headHash.slice(0, 8) : 'sha256'})
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => loadAudit()}
            disabled={refreshing}
            className={styles.btnAuth}
            style={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh Audit (5s auto)'}
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className={styles.filters}>
        <div>
          <label htmlFor="filter-event" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
            Filter by Event:
          </label>
          <select
            id="filter-event"
            className={styles.selectInput}
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            <option value="all">All Events ({entries.length})</option>
            <option value="proposed">Proposed</option>
            <option value="approved">Approved</option>
            <option value="executed">Executed</option>
            <option value="blocked">Blocked</option>
            <option value="rejected">Rejected (Violations / Bypass)</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-req" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
            Filter by Request ID:
          </label>
          <input
            id="filter-req"
            type="text"
            className={styles.filterInput}
            placeholder="Search request id (e.g. req-101)..."
            value={searchRequestId}
            onChange={(e) => setSearchRequestId(e.target.value)}
          />
        </div>

        {(selectedEvent !== 'all' || searchRequestId) && (
          <button
            type="button"
            className={styles.btnAuthOut}
            style={{ alignSelf: 'flex-end', padding: '6px 12px', fontSize: '0.78rem', borderRadius: 4, cursor: 'pointer' }}
            onClick={() => {
              setSelectedEvent('all');
              setSearchRequestId('');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loadingBox}>Loading audit entries...</div>
      ) : error ? (
        <div className={styles.errorBox}>
          <strong>Error loading audit log:</strong> {error}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className={styles.emptyBox}>
          No audit entries found matching the current filters.
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '140px' }}>Timestamp</th>
                <th style={{ width: '110px' }}>Event</th>
                <th style={{ width: '120px' }}>Request ID</th>
                <th style={{ width: '160px' }}>Actor</th>
                <th style={{ width: '100px' }}>SHA-256</th>
                <th>Details & Rationale</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(entry.at).toLocaleString([], {
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td>{getEventBadge(entry.event)}</td>
                  <td>
                    <code style={{ color: '#38bdf8', fontSize: '0.82rem' }}>{entry.requestId}</code>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#f1f5f9', fontWeight: 600 }}>
                    {entry.actor}
                  </td>
                  {/* Requirement B19: Short hash display */}
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#a7f3d0' }}>
                    {entry.hash ? (
                      <span title={`Full Hash: ${entry.hash}`}>
                        {entry.hash.slice(0, 8)}
                      </span>
                    ) : (
                      <span style={{ color: '#64748b' }}>-</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {entry.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
