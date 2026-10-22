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
  const isBlocked = status === 'blocked';

  // Requirement B6 & B13: When proposal is null and blocked, show security defense win
  if (!proposal) {
    if (isBlocked) {
      return (
        <div
          className={`${styles.proposalCard} ${styles.proposalCardBlocked}`}
          style={{ borderLeft: '4px solid #ef4444' }}
        >
          <div className={styles.proposalHeader}>
            <div className={styles.proposalTitle} style={{ color: '#f87171' }}>
              🛡️ Security Gate: AI Output Quarantined & Blocked
            </div>
            <span className={styles.riskHigh}>BLOCKED</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.86rem', color: '#fca5a5', marginBottom: 8, lineHeight: 1.5 }}>
              <strong>Policy Defense Win:</strong> The AI agent prompt or output failed schema verification and was rejected before reaching human approvers.
            </div>

            <div className={styles.blockedAlert} role="alert" style={{ marginTop: 8 }}>
              <strong>⛔ Reason:</strong> {blockedReason || 'AI output rejected by schema check: unauthorized action, prompt injection, or malformed parameters.'}
            </div>
          </div>

          <div className={styles.plainLanguageNotice} style={{ borderColor: '#7f1d1d', background: 'rgba(127, 29, 29, 0.2)' }}>
            🔒 <strong>Defense in Depth:</strong> Because the AI is strictly isolated as a proposer without execution keys, malicious instructions cannot compromise the system.
          </div>
        </div>
      );
    }

    return (
      <div className={styles.emptyBox}>
        No AI proposal generated for this request.
      </div>
    );
  }

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
        <div className={styles.plainLanguageNotice} style={{ color: '#34d399', borderColor: '#059669', background: 'rgba(5, 150, 105, 0.15)' }}>
          ✓ Executed after {requiredApprovals}/{requiredApprovals} approvals (simulated payment).
        </div>
      ) : (
        <div className={styles.plainLanguageNotice}>
          🔒 The AI cannot execute this. It needs {requiredApprovals} approvals from authorized humans ({approvalsCount}/{requiredApprovals} approved).
        </div>
      )}
    </div>
  );
}
