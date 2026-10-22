import React from 'react';
import { Status } from '../lib/types';
import styles from './styles.module.css';

interface VisualFlowProps {
  currentStep?: 'request' | 'proposal' | 'quorum' | 'outcome';
  status?: Status;
  approvalsCount?: number;
  requiredApprovals?: number;
}

export default function VisualFlow({
  currentStep = 'request',
  status,
  approvalsCount = 0,
  requiredApprovals = 2
}: VisualFlowProps) {
  // Determine step classes based on current active step and overall status
  const isRequestDone = currentStep !== 'request';
  const isProposalDone = currentStep === 'quorum' || currentStep === 'outcome';
  const isQuorumDone = currentStep === 'outcome' && status !== 'blocked';
  const isBlocked = status === 'blocked';

  return (
    <div className={styles.flowContainer}>
      <div className={styles.flowTitle}>Governance & Multi-Party Quorum Flow</div>
      <div className={styles.flowSteps}>
        {/* Step 1 */}
        <div
          className={`${styles.flowStep} ${
            currentStep === 'request'
              ? styles.flowStepActive
              : isRequestDone
              ? styles.flowStepDone
              : ''
          }`}
        >
          <div className={styles.stepNum}>STEP 1</div>
          <div className={styles.stepName}>1. User Request</div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
            Natural language prompt
          </div>
        </div>

        {/* Step 2 */}
        <div
          className={`${styles.flowStep} ${
            currentStep === 'proposal'
              ? styles.flowStepActive
              : isProposalDone
              ? styles.flowStepDone
              : ''
          }`}
        >
          <div className={styles.stepNum}>STEP 2</div>
          <div className={styles.stepName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <img
              src="/mascot.jpg"
              alt="Eel mascot"
              style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', border: '1px solid #38bdf8' }}
            />
            <span>2. AI Proposal</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
            Propose action only (No key)
          </div>
        </div>

        {/* Step 3 */}
        <div
          className={`${styles.flowStep} ${
            isBlocked
              ? styles.flowStepBlocked
              : currentStep === 'quorum'
              ? styles.flowStepActive
              : isQuorumDone
              ? styles.flowStepDone
              : ''
          }`}
        >
          <div className={styles.stepNum}>STEP 3</div>
          <div className={styles.stepName}>3. Quorum Approval</div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
            {isBlocked
              ? 'Blocked by Policy'
              : `${approvalsCount} / ${requiredApprovals} Signed`}
          </div>
        </div>

        {/* Step 4 */}
        <div
          className={`${styles.flowStep} ${
            isBlocked
              ? styles.flowStepBlocked
              : currentStep === 'outcome'
              ? styles.flowStepDone
              : ''
          }`}
        >
          <div className={styles.stepNum}>STEP 4</div>
          <div className={styles.stepName}>4. Outcome</div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
            {isBlocked
              ? 'Blocked / Quarantined'
              : status === 'executed'
              ? 'Executed (Simulated Payment)'
              : 'Awaiting Quorum'}
          </div>
        </div>
      </div>
    </div>
  );
}
