import { randomUUID } from "node:crypto";
import type { Approval, AuditEntry, AuditEvent, Proposal, Request } from "../../types";
import { evaluatePolicy, POLICY } from "./policy";
import type { Actor } from "./auth";

// In-memory storage (resets on server restart). Kept on globalThis to survive hot reload.
type StoredRequest = Request & { requesterId: string };
type DB = { requests: StoredRequest[]; audit: AuditEntry[] };
const g = globalThis as unknown as { __sentinelDb?: DB };
const db: DB = (g.__sentinelDb ??= { requests: [], audit: [] });

const DAY_MS = 24 * 60 * 60 * 1000;
const AGENT_ACTOR = "SentinelAgent (AI)";
const POLICY_ACTOR = "Policy Guard";
const GATE_ACTOR = "Quorum Gate";

// Strip internal fields before anything leaves the API.
const pub = ({ requesterId: _omit, ...r }: StoredRequest): Request => r;

export function log(actor: string, event: AuditEvent, requestId: string, detail: string): AuditEntry {
  const entry: AuditEntry = { id: randomUUID(), at: new Date().toISOString(), actor, event, requestId, detail };
  db.audit.unshift(entry);
  return entry;
}

export const listRequests = (): Request[] =>
  [...db.requests].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map(pub);
export const listAudit = (): AuditEntry[] => [...db.audit].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

function spentLast24h(): number {
  const since = Date.now() - DAY_MS;
  return db.requests
    .filter((r) => (r.status === "executed" || r.status === "pending") && r.proposal && Date.parse(r.createdAt) >= since)
    .reduce((sum, r) => sum + Number(r.proposal!.params.amount ?? 0), 0);
}

export function createRequest(requester: Actor, text: string, proposal: Proposal | null, rejectedReason?: string): Request {
  let status: Request["status"] = "pending";
  let requiredApprovals = POLICY.requiredApprovals;
  let blockedReason: string | undefined;
  if (!proposal) {
    status = "blocked";
    blockedReason = `Blocked: AI output rejected by schema check (${rejectedReason ?? "invalid output"}).`;
  } else {
    const v = evaluatePolicy(proposal, spentLast24h());
    if (v.ok) requiredApprovals = v.requiredApprovals;
    else {
      status = "blocked";
      blockedReason = v.reason;
    }
  }
  const req: StoredRequest = {
    id: `req-${randomUUID().slice(0, 8)}`,
    requester: requester.name,
    requesterId: requester.id,
    text,
    proposal,
    status,
    approvals: [] as Approval[],
    requiredApprovals,
    ...(blockedReason ? { blockedReason } : {}),
    createdAt: new Date().toISOString(),
  };
  db.requests.push(req);
  if (proposal) {
    const p = proposal.params;
    log(AGENT_ACTOR, "proposed", req.id, `AI proposed ${proposal.action}: ${p.amount} ${p.currency} to ${p.payee} (risk ${proposal.risk}). Requested by ${requester.name}.`);
  } else {
    log(AGENT_ACTOR, "rejected", req.id, `AI output rejected: ${rejectedReason ?? "invalid output"}. Requested by ${requester.name}.`);
  }
  if (status === "blocked") log(POLICY_ACTOR, "blocked", req.id, blockedReason!);
  return pub(req);
}

export type ApproveResult = { ok: true; request: Request } | { ok: false; code: number; error: string };

export function approve(id: string, approver: Actor): ApproveResult {
  const req = db.requests.find((r) => r.id === id);
  if (!req) return { ok: false, code: 404, error: "Request not found" };
  if (req.status !== "pending") return { ok: false, code: 400, error: `Cannot approve a ${req.status} request` };
  if (req.requesterId === approver.id || req.requester === approver.name) {
    log(approver.name, "rejected", id, "Self-approval attempt rejected.");
    return { ok: false, code: 400, error: "You cannot approve your own request" };
  }
  if (req.approvals.some((a) => a.approver === approver.name)) {
    log(approver.name, "rejected", id, "Duplicate approval rejected.");
    return { ok: false, code: 400, error: "You have already approved this request" };
  }
  req.approvals.push({ approver: approver.name, at: new Date().toISOString() });
  log(approver.name, "approved", id, `Approval ${req.approvals.length}/${req.requiredApprovals} by ${approver.name}.`);
  if (req.approvals.length >= req.requiredApprovals) {
    // The only place an action is carried out, and only after quorum. The payment itself is SIMULATED.
    req.status = "executed";
    const p = req.proposal!.params;
    log(GATE_ACTOR, "executed", id, `Quorum ${req.approvals.length}/${req.requiredApprovals} reached. SIMULATED transfer of ${p.amount} ${p.currency} to ${p.payee} (no real funds moved).`);
  }
  return { ok: true, request: pub(req) };
}
