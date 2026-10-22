'use client'

import React, { useState, useEffect } from 'react';
import { AuditEntry, AuditEvent } from '../../../lib/types';
import { fetchAuditLog } from '../../../lib/ui/api';
import styles from '../../../components/styles.module.css';

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchRequestId, setSearchRequestId] = useState<string>('');

  useEffect(() => {
    fetchAuditLog()
      .then((data) => {
        setEntries(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch audit log');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
        return <span className={styles.chipBlocked}>REJECTED</span>;
      default:
        return <span className={styles.chipPending}>{event}</span>;
    }
  };

  // Filtered and sorted entries (newest first)
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
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Cryptographic Audit Trail</h1>
        <p className={styles.pageDesc}>
          Immutable chronological ledger of all AI proposals, human quorum signatures, policy blocks, and execution events.
        </p>
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
            <option value="all">All Events</option>
            <option value="proposed">Proposed</option>
            <option value="approved">Approved</option>
            <option value="executed">Executed</option>
            <option value="blocked">Blocked</option>
            <option value="rejected">Rejected</option>
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
                <th style={{ width: '150px' }}>Timestamp</th>
                <th style={{ width: '110px' }}>Event</th>
                <th style={{ width: '110px' }}>Request ID</th>
                <th style={{ width: '180px' }}>Actor</th>
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
