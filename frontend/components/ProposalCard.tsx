import React from 'react';
import { Proposal, Status } from '../lib/types';
import styles from './styles.module.css';

interface ProposalCardProps {
  proposal: Proposal | null;
  status: Status;
  requiredApprovals?: number;
  blockedReason?: string;
  approvalsCount?: number;
}

export default function ProposalCard({
  proposal,
  status,
  requiredApprovals = 2,
  blockedReason,
  approvalsCount = 0
}: ProposalCardProps) {
  if (!proposal) {
    return (
      <div className={styles.emptyBox}>
        No AI proposal generated for this request.
      </div>
    );
  }

  const isBlocked = status === 'blocked';

  return (
    <div
      className={`${styles.proposalCard} ${
        isBlocked ? styles.proposalCardBlocked : ''
      }`}
    >
      <div className={styles.proposalHeader}>
        <div className={styles.proposalTitle}>
          AI Generated Proposal: <code>{proposal.action}</code>
        </div>
        <span
          className={
            proposal.risk === 'high'
              ? styles.riskHigh
              : proposal.risk === 'medium'
              ? styles.riskMedium
              : styles.riskLow
          }
        >
          {proposal.risk} risk
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.84rem', color: '#cbd5e1', marginBottom: 8 }}>
          <strong>Reasoning:</strong> {proposal.reason}
        </div>

        {proposal.params && Object.keys(proposal.params).length > 0 && (
          <div style={{ background: '#020617', padding: '8px 12px', borderRadius: 4, border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>
              Proposed Action Parameters:
            </div>
            {Object.entries(proposal.params).map(([key, val]) => (
              <div key={key} className={styles.paramRow}>
                <span className={styles.paramKey}>{key}:</span>
                <span className={styles.paramVal}>{String(val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isBlocked ? (
        <div className={styles.blockedAlert} role="alert">
          <strong>⛔ Blocked by Policy:</strong> {blockedReason || 'Policy check failed.'}
        </div>
      ) : status === 'executed' ? (
        <div className={styles.plainLanguageNotice} style={{ color: '#34d399', borderColor: '#059669' }}>
          ✓ Action successfully executed via TideCloak Quorum.
        </div>
      ) : (
        <div className={styles.plainLanguageNotice}>
          🔒 The AI cannot execute this. It needs {requiredApprovals} approvals from authorized humans ({approvalsCount}/{requiredApprovals} approved).
        </div>
      )}
    </div>
  );
}
