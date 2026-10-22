'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Request } from '../../../lib/types';
import { fetchRequests, approveRequest, executeDirectly, resetDemoData, fetchStatus } from '../../../lib/ui/api';
import { useRoleContext } from '../../../components/RoleContext';
import styles from '../../../components/styles.module.css';

export default function ApprovalQueuePage() {
  const {
    authenticated,
    currentUser,
    userRoles,
    hasRole,
    login,
    isMock
  } = useRoleContext();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [bypassNotice, setBypassNotice] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const [apiMode, setApiMode] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus().then((s) => setApiMode(s?.mode || null)).catch(() => {});
  }, []);

  const isDevBypass = apiMode === 'simulated';
  const isApprover = hasRole('approver');

  const loadQueue = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    setActionError(null);

    try {
      const data = await fetchRequests();
      setRequests(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load approval queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + 5-second polling interval
  useEffect(() => {
    loadQueue();
    const interval = setInterval(() => {
      loadQueue(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  // Handle Quorum Approval (Requirements B5, B14)
  const handleApprove = async (req: Request) => {
    setApprovingId(req.id);
    setActionError(null);
    setBypassNotice(null);

    try {
      const updated = await approveRequest(req.id, currentUser);
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
    } catch (err: any) {
      // Show exact backend error (400 self-approval/duplicate, 403 role, 401 unauth, 404 not found)
      setActionError(err.message || `Approval failed for request ${req.id}`);
    } finally {
      setApprovingId(null);
    }
  };

  // Requirement B15: Demo button "Try to execute directly" on pending request
  const handleTryDirectExecute = async (reqId: string) => {
    setExecutingId(reqId);
    setActionError(null);
    setBypassNotice(null);

    try {
      await executeDirectly(reqId);
      setBypassNotice(`Unexpected: Direct execution succeeded for ${reqId}`);
    } catch (err: any) {
      // 403 error proves nobody can bypass quorum!
      setBypassNotice(`⛔ Quorum Bypass Prevented (HTTP 403): "${err.message}" — Written to audit log as 'rejected'.`);
    } finally {
      setExecutingId(null);
    }
  };

  const getStatusChip = (status: Request['status']) => {
    switch (status) {
      case 'pending':
        return <span className={styles.chipPending}>Pending Approval</span>;
      case 'approved':
        return <span className={styles.chipApproved}>Quorum In-Progress</span>;
      case 'executed':
        return <span className={styles.chipExecuted}>Executed (Simulated)</span>;
      case 'blocked':
        return <span className={styles.chipBlocked}>Blocked by Policy</span>;
      default:
        return <span className={styles.chipPending}>{status}</span>;
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm("Reset all requests and audit log to initial state?")) return;
    try {
      await resetDemoData();
      await loadQueue();
    } catch (err: any) {
      setActionError(err.message || "Failed to reset demo data (backend DEMO_RESET_ENABLED may be false)");
    }
  };

  return (
    <div>
      <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className={styles.pageTitle}>Governance Approval Queue</h1>
          <p className={styles.pageDesc}>
            Review AI-proposed actions requiring multi-human quorum verification. Self-approval and duplicate signatures are rejected.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {isApprover && (
            <button
              type="button"
              onClick={handleResetDemo}
              className={styles.btnAuthOut}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              title="Reset demo data for rehearsals (calls POST /api/admin/reset)"
            >
              🔄 Reset Demo Data
            </button>
          )}

          <button
            type="button"
            onClick={() => loadQueue()}
            disabled={refreshing}
            className={styles.btnAuth}
            style={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh Queue (5s auto)'}
          </button>
        </div>
      </div>

      {/* Login Gate in Live Mode when DEV_AUTH_BYPASS is not active (Requirement B11) */}
      {!isMock && !isDevBypass && !authenticated && (
        <div className={styles.errorBox} style={{ background: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.4)', color: '#fef08a', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>🔐 Authentication Required:</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#fde047' }}>
              You are running in live mode. Please log in with TideCloak to approve quorum requests.
            </p>
          </div>
          <button
            type="button"
            onClick={login}
            className={styles.btnPrimary}
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            Log In with TideCloak
          </button>
        </div>
      )}

      {/* Action / Backend Error Banner (Requirement B5) */}
      {actionError && (
        <div className={styles.errorBox} style={{ marginBottom: 16 }}>
          <strong>⛔ Backend Action Error:</strong> {actionError}
        </div>
      )}

      {/* Direct Execution Attempt Notice (Requirement B15) */}
      {bypassNotice && (
        <div className={styles.plainLanguageNotice} style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#fca5a5', marginBottom: 16 }}>
          <strong>Security Demonstration:</strong> {bypassNotice}
        </div>
      )}

      {loading ? (
        <div className={styles.loadingBox}>Loading approval queue...</div>
      ) : error ? (
        <div className={styles.errorBox}>
          <strong>Error loading queue:</strong> {error}
        </div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyBox}>
          No requests in the queue. Go to the Submit page to propose a new task.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map((req) => {
            const isRequester = req.requester === currentUser;
            const alreadyApproved = req.approvals?.some(a => a.approver === currentUser);
            const isBlocked = req.status === 'blocked';
            const isExecuted = req.status === 'executed';
            const isPending = req.status === 'pending';

            // Check if current user can approve (Requirement B14 & B9)
            const canApprove = (isMock || isDevBypass || authenticated) && isApprover && isPending && !isRequester && !alreadyApproved;

            let disabledReason = '';
            if (!isMock && !isDevBypass && !authenticated) disabledReason = "Log in required to sign";
            else if (!isPending) disabledReason = `Cannot approve ${req.status} request`;
            else if (isRequester) disabledReason = "Self-approval prohibited (requester cannot sign)";
            else if (alreadyApproved) disabledReason = "Duplicate signature prohibited (already approved)";
            else if (!isApprover) disabledReason = "Requires role 'approver'";

            return (
              <div key={req.id} className={styles.card} style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>{req.id}</span>
                      {getStatusChip(req.status)}
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Requested by <code style={{ color: '#f1f5f9' }}>{req.requester}</code>
                      </span>
                    </div>
                    <div style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 600 }}>
                      &ldquo;{req.text}&rdquo;
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: req.status === 'executed' ? '#34d399' : '#38bdf8' }}>
                      Quorum: {req.approvals?.length || 0} / {req.requiredApprovals} Approvals
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Created {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Proposal summary or Quarantined banner (Requirement B6) */}
                {req.proposal ? (
                  <div style={{ background: '#020617', padding: '10px 14px', borderRadius: 6, border: '1px solid #1e293b', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                      <span>
                        <strong>Action:</strong> <code>{req.proposal.action}</code>
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: req.proposal.risk === 'high' ? '#fb7185' : req.proposal.risk === 'medium' ? '#fbbf24' : '#34d399' }}>
                        Risk: {req.proposal.risk}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.8rem', color: '#cbd5e1' }}>
                      {Object.entries(req.proposal.params || {}).map(([k, v]) => (
                        <span key={k}>
                          <span style={{ color: '#94a3b8' }}>{k}:</span> <strong>{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : isBlocked ? (
                  <div style={{ background: 'rgba(127, 29, 29, 0.2)', border: '1px solid #7f1d1d', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: '0.82rem', color: '#fca5a5' }}>
                    🛡️ <strong>AI Output Quarantined:</strong> Raw prompt was rejected by schema verification.
                  </div>
                ) : null}

                {/* Blocked reason */}
                {isBlocked && (
                  <div className={styles.blockedAlert} style={{ marginTop: 0, marginBottom: 12 }}>
                    <strong>⛔ Blocked Reason:</strong> {req.blockedReason || 'Policy check violation.'}
                  </div>
                )}

                {/* Approvals Signatures list */}
                {req.approvals && req.approvals.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>Recorded Approver Signatures:</span>
                    <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {req.approvals.map((appr, idx) => (
                        <li key={idx} style={{ background: '#1e293b', padding: '2px 8px', borderRadius: 4, border: '1px solid #334155' }}>
                          ✓ <span style={{ color: '#f1f5f9' }}>{appr.approver}</span> at {new Date(appr.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: 10, flexWrap: 'wrap', gap: 10 }}>
                  <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    {isExecuted
                      ? `Executed after ${req.requiredApprovals}/${req.requiredApprovals} approvals (simulated payment).`
                      : isBlocked
                      ? 'Execution halted by Policy Guard.'
                      : `Requires ${req.requiredApprovals - (req.approvals?.length || 0)} more independent signature(s).`}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Requirement B15: Demo button "Try to execute directly" on pending request */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleTryDirectExecute(req.id)}
                        disabled={executingId === req.id}
                        className={styles.btnAuthOut}
                        style={{ padding: '6px 12px', fontSize: '0.78rem', border: '1px solid #fb7185', color: '#fb7185' }}
                        title="Demonstrates that direct execution without quorum is blocked with 403"
                      >
                        {executingId === req.id ? 'Sending direct call...' : '⚡ Try direct execution (Demo)'}
                      </button>
                    )}

                    {/* Approve Button (Requirements B5, B14) */}
                    {isPending && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          disabled={!canApprove || approvingId === req.id}
                          onClick={() => handleApprove(req)}
                          title={disabledReason || "Approve this request with your quorum signature"}
                          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                        >
                          {approvingId === req.id ? 'Submitting Quorum Signature...' : 'Approve Request'}
                        </button>

                        {disabledReason && (
                          <span style={{ fontSize: '0.74rem', color: '#fb7185', fontStyle: 'italic' }}>
                            ({disabledReason})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
