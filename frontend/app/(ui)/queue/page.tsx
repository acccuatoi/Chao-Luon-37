'use client'

import React, { useCallback, useEffect, useState } from 'react';
import { Request } from '../../../lib/types';
import { fetchRequests, approveRequest, executeDirectly, resetDemoData } from '../../../lib/ui/api';
import { useRoleContext } from '../../../components/RoleContext';
import RequestSlip from '../../../components/RequestSlip';
import SignInNotice from '../../../components/SignInNotice';
import styles from '../../../components/styles.module.css';

type Tab = 'waiting' | 'finished';

export default function ApprovalsPage() {
  const { canAct, currentUser, hasRole, isMock, devBypass, authenticated } = useRoleContext();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'bad' | 'ok' | 'info'; title: string; body: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('waiting');

  const load = useCallback(async () => {
    try {
      setRequests(await fetchRequests());
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load requests.');
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

  const isApprover = isMock || devBypass ? hasRole('approver') : authenticated && hasRole('approver');

  const approve = async (req: Request) => {
    setBusy(`approve:${req.id}`);
    setNotice(null);
    try {
      const updated = await approveRequest(req.id, currentUser);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setNotice(
        updated.status === 'executed'
          ? { tone: 'ok', title: 'Approved. Payment ran (simulated).', body: `${updated.requiredApprovals} of ${updated.requiredApprovals} approvals reached for ${updated.id}.` }
          : { tone: 'info', title: 'Approved.', body: `${updated.approvals.length} of ${updated.requiredApprovals} approvals for ${updated.id}. Another person must approve.` },
      );
    } catch (err: any) {
      setNotice({ tone: 'bad', title: 'Approval refused by the server.', body: err?.message || 'Unknown error.' });
    } finally {
      setBusy(null);
    }
  };

  const forceRun = async (req: Request) => {
    setBusy(`run:${req.id}`);
    setNotice(null);
    try {
      await executeDirectly(req.id);
      setNotice({ tone: 'bad', title: 'Unexpected: the payment ran without approval.', body: 'This should never happen. Check the backend.' });
    } catch (err: any) {
      setNotice({
        tone: 'ok',
        title: 'Refused, as designed.',
        body: `The server answered 403: "${err?.message}". The attempt is recorded in the audit log.`,
      });
    } finally {
      setBusy(null);
    }
  };

  const reset = async () => {
    if (!window.confirm('Delete all requests and start a fresh audit log?')) return;
    try {
      await resetDemoData();
      setNotice({ tone: 'info', title: 'Demo data cleared.', body: 'The audit log now starts with the reset entry.' });
      load();
    } catch (err: any) {
      setNotice({ tone: 'bad', title: 'Reset is turned off.', body: err?.message || 'Set DEMO_RESET_ENABLED=true on the backend to allow it.' });
    }
  };

  const whyNot = (req: Request): string | null => {
    if (!canAct) return 'Sign in to approve';
    if (!isApprover) return null;
    if (req.overLimit) return 'Over the daily limit right now';
    if (req.requester === currentUser) return 'You asked for this one, so someone else must approve';
    if (req.approvals.some((a) => a.approver === currentUser)) return 'You already approved this';
    return null;
  };

  const waiting = requests.filter((r) => r.status === 'pending' || r.status === 'approved');
  const finished = requests.filter((r) => r.status === 'executed' || r.status === 'blocked');
  const shown = tab === 'waiting' ? waiting : finished;

  const toneCls = { bad: styles.noticeBad, ok: styles.noticeOk, info: styles.noticeInfo };

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Approvals</h1>
          <p className={styles.lede}>
            {canAct && !isApprover
              ? 'You can see only your own requests here. People with the approver role see everyone\'s and decide.'
              : 'Each payment needs approval from someone other than the requester, and nobody can approve twice.'}
          </p>
        </div>
        {canAct && isApprover && (
          <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={reset}>
            Reset demo data
          </button>
        )}
      </div>

      <div className={styles.stack}>
        <SignInNotice role="approver" doing="review payments" />

        {notice && (
          <div className={`${styles.notice} ${toneCls[notice.tone]}`} role="status">
            <div>
              <strong>{notice.title}</strong>
              <p>{notice.body}</p>
            </div>
            <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </div>
        )}
      </div>

      {canAct && (
        <>
          <div className={styles.tabs} role="tablist" style={{ marginTop: 16 }}>
            <button type="button" role="tab" aria-selected={tab === 'waiting'} className={`${styles.tab} ${tab === 'waiting' ? styles.tabActive : ''}`} onClick={() => setTab('waiting')}>
              Waiting<span className={styles.count}>{waiting.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={tab === 'finished'} className={`${styles.tab} ${tab === 'finished' ? styles.tabActive : ''}`} onClick={() => setTab('finished')}>
              Finished<span className={styles.count}>{finished.length}</span>
            </button>
          </div>

          {loading ? (
            <div className={styles.empty}>Loading requests…</div>
          ) : loadError ? (
            <div className={`${styles.notice} ${styles.noticeBad}`} role="alert">
              <div>
                <strong>Could not load requests.</strong>
                <p>{loadError}</p>
              </div>
              <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={load}>
                Try again
              </button>
            </div>
          ) : shown.length === 0 ? (
            <div className={styles.empty}>
              {tab === 'waiting' ? 'Nothing is waiting for approval.' : 'Nothing finished yet. Paid and blocked requests appear here.'}
            </div>
          ) : (
            <div className={styles.stack}>
              {shown.map((req) => {
                const pending = req.status === 'pending' || req.status === 'approved';
                const reason = whyNot(req);
                return (
                  <RequestSlip
                    key={req.id}
                    req={req}
                    actions={
                      pending ? (
                        <>
                          {reason && <span className={styles.why}>{reason}</span>}
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                            onClick={() => forceRun(req)}
                            disabled={busy !== null}
                            title="Calls the execute endpoint directly, skipping approvals. The server must refuse."
                          >
                            {busy === `run:${req.id}` ? 'Trying…' : 'Try to pay without approval'}
                          </button>
                          {isApprover && (
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
                              onClick={() => approve(req)}
                              disabled={!!reason || busy !== null}
                            >
                              {busy === `approve:${req.id}` ? 'Approving…' : 'Approve'}
                            </button>
                          )}
                        </>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
