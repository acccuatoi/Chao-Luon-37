import React from 'react';
import { Request } from '../lib/types';
import styles from './styles.module.css';

/** The four stages every request goes through, coloured by where the latest request is. */
export default function Steps({ req }: { req: Request | null }) {
  const blocked = req?.status === 'blocked';
  const executed = req?.status === 'executed';
  const approvals = req?.approvals.length ?? 0;
  const needed = req?.requiredApprovals ?? 2;

  type S = 'idle' | 'active' | 'done' | 'bad';
  const s1: S = req ? 'done' : 'active';
  const s2: S = !req ? 'idle' : !req.proposal ? 'bad' : 'done';
  const s3: S = !req ? 'idle' : blocked ? 'bad' : executed ? 'done' : 'active';
  const s4: S = !req ? 'idle' : blocked ? 'bad' : executed ? 'done' : 'idle';

  const cls = (s: S) =>
    `${styles.step} ${s === 'done' ? styles.stepDone : s === 'active' ? styles.stepActive : s === 'bad' ? styles.stepBad : ''}`;

  return (
    <ol className={styles.steps} aria-label="How a request moves">
      <li className={cls(s1)}>
        <div className={styles.stepNum}>1</div>
        <div className={styles.stepName}>You ask</div>
        <div className={styles.stepHint}>Plain language</div>
      </li>
      <li className={cls(s2)}>
        <div className={styles.stepNum}>2</div>
        <div className={styles.stepName}>Agent drafts</div>
        <div className={styles.stepHint}>{s2 === 'bad' ? 'Answer rejected' : 'Proposal only, no keys'}</div>
      </li>
      <li className={cls(s3)}>
        <div className={styles.stepNum}>3</div>
        <div className={styles.stepName}>{needed === 1 ? 'An approver signs off' : `${needed} people approve`}</div>
        <div className={styles.stepHint}>{blocked ? 'Blocked by rules' : `${approvals} of ${needed} approved`}</div>
      </li>
      <li className={cls(s4)}>
        <div className={styles.stepNum}>4</div>
        <div className={styles.stepName}>Payment runs</div>
        <div className={styles.stepHint}>{executed ? 'Done (simulated)' : blocked ? 'Never runs' : 'Simulated'}</div>
      </li>
    </ol>
  );
}
