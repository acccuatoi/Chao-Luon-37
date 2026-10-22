'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Request } from '../../lib/types';
import { submitRequest, fetchRequests } from '../../lib/ui/api';
import { useRoleContext } from '../../components/RoleContext';
import { useApiStatus } from '../../components/useApiStatus';
import RequestSlip, { money } from '../../components/RequestSlip';
import Steps from '../../components/Steps';
import SignInNotice from '../../components/SignInNotice';
import styles from '../../components/styles.module.css';


export default function NewRequestPage() {
  const { canAct, hasRole, isMock, devBypass, authenticated, currentUser } = useRoleContext();
  const { status } = useApiStatus();

  const [text, setText] = useState('');
  // QR payment: decoded in the browser (Chrome BarcodeDetector) or pasted; the backend parses and checks it.
  const [qr, setQr] = useState('');
  const [qrNote, setQrNote] = useState<string | null>(null);

  const readQrImage = async (file: File) => {
    setQrNote(null);
    try {
      const Detector = (window as any).BarcodeDetector;
      if (!Detector) {
        setQrNote('This browser cannot read QR images. Paste the QR content instead.');
        return;
      }
      const bitmap = await createImageBitmap(file);
      const codes = await new Detector({ formats: ['qr_code'] }).detect(bitmap);
      if (!codes.length) {
        setQrNote('No QR code found in that image.');
        return;
      }
      setQr(String(codes[0].rawValue));
      setQrNote('QR code read. Check the details after sending; the server verifies it.');
    } catch {
      setQrNote('Could not read that image. Paste the QR content instead.');
    }
  };
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only this user's own requests are shown here; everyone's requests are on the Approvals page.
  const [mine, setMine] = useState<Request[]>([]);
  const latest = mine[0] ?? null;

  useEffect(() => {
    if (!canAct) return;
    // Poll so status changes made by approvers (paid, over the limit) show up without a reload.
    const load = () =>
      fetchRequests()
        .then((list) => setMine(list.filter((r) => r.requester === currentUser)))
        .catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [canAct, authenticated, currentUser]);

  const allowed = canAct && (isMock || devBypass || hasRole('requester'));

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !qr.trim()) || sending || !allowed) return;
    setSending(true);
    setError(null);
    try {
      const created = await submitRequest(text.trim(), '', undefined, qr.trim() || undefined);
      setMine((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setText('');
      setQr('');
      setQrNote(null);
    } catch (err: any) {
      setError(err?.message || 'The request could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const policy = status?.policy;
  const needed = policy?.requiredApprovals ?? 2;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Ask the agent to make a payment</h1>
          <p className={styles.lede}>
            The agent turns your words into a payment proposal. It cannot send money itself:{' '}
            {needed === 1 ? 'an approver other than you' : `${needed} different people other than you`} must approve
            first, and the rules on the right are checked before anyone sees it.
          </p>
        </div>
      </div>

      <Steps req={latest} policyApprovals={needed} />

      <div className={styles.split}>
        <form className={`${styles.panel} ${styles.stack}`} onSubmit={send}>
          <SignInNotice role="requester" doing="send a request" />

          <div>
            <label htmlFor="request-text" className={styles.label}>What should be paid?</label>
            <p className={styles.muted} style={{ margin: '-4px 0 8px' }}>Only payees on the approved list can be paid, within the daily limit.</p>
            <textarea
              id="request-text"
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe the payment: who should be paid, how much, and what for. For example: Pay Cloudflare 300 USD for the CDN plan."
              disabled={sending}
              maxLength={2000}
            />
          </div>

          <div>
            <div className={styles.label}>Or pay a QR code</div>
            <div className={styles.row}>
              <label className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
                Upload QR image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && readQrImage(e.target.files[0])}
                />
              </label>
              <span className={styles.muted}>or paste its content:</span>
            </div>
            <input
              className={styles.input}
              style={{ width: '100%', marginTop: 8 }}
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              placeholder="000201010212... (EMVCo / VietQR payment code)"
              aria-label="QR content"
            />
            {qrNote && <p className={styles.muted} style={{ margin: '6px 0 0' }}>{qrNote}</p>}
          </div>

          {error && (
            <div className={`${styles.notice} ${styles.noticeBad}`} role="alert">
              <div>
                <strong>Not sent.</strong> {error}
              </div>
            </div>
          )}

          <div className={styles.row}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!allowed || sending || (!text.trim() && !qr.trim())}>
              {sending && <span className={styles.spinner} aria-hidden />}
              {sending ? 'Agent is drafting…' : 'Send to agent'}
            </button>
            <span className={styles.muted}>Nothing is paid at this step.</span>
          </div>
        </form>

        <aside className={`${styles.panel} ${styles.rules}`} aria-label="Rules in force">
          <h2 className={styles.label} style={{ margin: 0 }}>Rules in force</h2>
          <div>
            <div className={styles.ruleFigure}>{policy ? money(policy.dailyCapUsd) : '—'}</div>
            <div className={styles.ruleCaption}>Per person: payments already approved in any 24 hours. Waiting ones turn red if approving them would go over.</div>
          </div>
          <div>
            <div className={styles.ruleFigure}>{needed} {needed === 1 ? 'approver' : 'approvers'}</div>
            <div className={styles.ruleCaption}>Must approve each payment. Nobody can approve their own request.</div>
          </div>
          <div>
            <div className={styles.ruleCaption}>Approved payees</div>
            <ul className={styles.payees}>
              {(policy?.whitelist ?? []).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          {policy?.accounts?.length ? (
            <div>
              <div className={styles.ruleCaption}>Approved bank accounts (checked when a request or QR names an account)</div>
              <ul className={styles.payees}>
                {policy.accounts.map((a) => (
                  <li key={a.accountNumber}>
                    {a.name}: <span className="mono">{a.accountNumber}</span> ({a.bank})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      <h2 className={styles.sectionTitle}>Your requests</h2>
      {mine.length > 0 ? (
        <div className={styles.stack}>
        {mine.slice(0, 5).map((r) => (
        <RequestSlip
          key={r.id}
          req={r}
          actions={
            r.status === 'pending' ? (
              <Link href="/queue" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
                Open approvals
              </Link>
            ) : undefined
          }
        />
        ))}
        </div>
      ) : (
        <div className={styles.empty}>
          {canAct ? 'You have not sent any requests yet. Describe a payment above and send it to the agent.' : 'Sign in to see your requests.'}
        </div>
      )}
    </>
  );
}
