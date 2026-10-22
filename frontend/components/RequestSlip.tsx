import React from 'react';
import { Request } from '../lib/types';
import styles from './styles.module.css';

export const money = (v: unknown, currency: unknown = 'USD') => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `${n.toLocaleString('en-US', { style: 'currency', currency: String(currency || 'USD'), minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
};

export const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const initials = (name: string) =>
  name
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '?';

/** One circle per required approval: dashed = still needed, filled = approved. */
export function Seals({ req }: { req: Request }) {
  const needed = Math.max(req.requiredApprovals, req.approvals.length);
  const blocked = req.status === 'blocked';
  const done = req.status === 'executed';
  return (
    <div className={styles.seals} aria-label={`${req.approvals.length} of ${req.requiredApprovals} approvals`}>
      {Array.from({ length: needed }).map((_, i) => {
        const a = req.approvals[i];
        if (blocked) {
          return <span key={i} className={`${styles.seal} ${styles.sealVoid}`} title="Not open for approval">✕</span>;
        }
        if (a) {
          return (
            <span
              key={i}
              className={`${styles.seal} ${styles.sealSigned} ${done ? styles.sealDone : ''}`}
              title={`Approved by ${a.approver} at ${timeOf(a.at)}`}
            >
              {initials(a.approver)}
            </span>
          );
        }
        return <span key={i} className={styles.seal} title="Waiting for an approver">{i + 1}</span>;
      })}
    </div>
  );
}

function sealText(req: Request) {
  const left = req.requiredApprovals - req.approvals.length;
  if (req.status === 'blocked') return <>Stopped before anyone could approve it.</>;
  if (req.status === 'executed') {
    return (
      <>
        <strong>Paid (simulated).</strong> Approved by {req.approvals.map((a) => a.approver).join(' and ')}. No real money moved.
      </>
    );
  }
  return (
    <>
      <strong>{left} more approval{left === 1 ? '' : 's'} needed.</strong> The agent cannot pay on its own. Approvers must be different
      people, and not the requester.
    </>
  );
}

export function StatusBadge({ status }: { status: Request['status'] }) {
  const map = {
    pending: [styles.statusPending, 'Waiting for approval'],
    approved: [styles.statusPending, 'Waiting for approval'],
    executed: [styles.statusExecuted, 'Paid (simulated)'],
    blocked: [styles.statusBlocked, 'Blocked'],
  } as const;
  const [cls, text] = map[status] ?? [styles.statusPending, status];
  return <span className={`${styles.status} ${cls}`}>{text}</span>;
}

/** A request as a payment slip. `actions` is rendered in the footer (approve buttons etc.). */
export default function RequestSlip({ req, actions }: { req: Request; actions?: React.ReactNode }) {
  const p = req.proposal;
  const tone = req.status === 'blocked' ? styles.slipBlocked : req.status === 'executed' ? styles.slipDone : '';
  const riskCls = p?.risk === 'high' ? styles.riskHigh : p?.risk === 'medium' ? styles.riskMedium : styles.riskLow;

  return (
    <article className={`${styles.slip} ${tone}`}>
      <div className={styles.slipMeta}>
        <StatusBadge status={req.status} />
        <span className={styles.reqId}>{req.id}</span>
        <span>
          Asked by <strong>{req.requester}</strong> at {timeOf(req.createdAt)}
        </span>
      </div>

      <p className={styles.quote}>{req.text}</p>

      {p ? (
        <>
          <div className={styles.payment}>
            <span className={styles.amount}>{money(p.params.amount, p.params.currency)}</span>
            <span className={styles.payee}>
              <span className={styles.payeeArrow}>to </span>
              {String(p.params.payee ?? 'unknown payee')}
            </span>
          </div>
          <div className={styles.facts}>
            <span>
              Action <strong className="mono">{p.action}</strong>
            </span>
            <span>
              Risk <strong className={riskCls}>{p.risk}</strong>
            </span>
            {p.reason && (
              <span>
                Agent's note <strong>{p.reason}</strong>
              </span>
            )}
          </div>
        </>
      ) : (
        <div className={styles.facts}>
          <span>
            <strong>The agent's answer was thrown away.</strong>{' '}
            {req.blockedReason?.includes('could not be used')
              ? 'The reply could not be read, so nothing was sent to approvers. Send the request again.'
              : 'It did not match the only allowed action, so nothing was sent to approvers.'}
          </span>
        </div>
      )}

      {req.status === 'blocked' && req.blockedReason && <div className={styles.reason}>{req.blockedReason}</div>}

      <div className={styles.slipFoot}>
        <div className={styles.row}>
          <Seals req={req} />
          <span className={styles.sealText}>{sealText(req)}</span>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </article>
  );
}
