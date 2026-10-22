import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Approval, AuditEntry, AuditEvent, Proposal, Request } from "../../types";
import { evaluatePolicy, POLICY } from "./policy";
import type { Actor } from "./auth";

// Storage: in memory, mirrored to a JSON file so a restart during the demo loses nothing.
// Set DATA_FILE="" to disable the file. Kept on globalThis to survive hot reload.
type StoredRequest = Request & { requesterId: string };
type DB = { requests: StoredRequest[]; audit: AuditEntry[] };

const DATA_FILE = process.env.DATA_FILE ?? join(process.cwd(), ".data", "db.json");
const GENESIS = "0".repeat(64);

function load(): DB {
  if (DATA_FILE && existsSync(DATA_FILE)) {
    try {
      const d = JSON.parse(readFileSync(DATA_FILE, "utf8")) as DB;
      if (Array.isArray(d.requests) && Array.isArray(d.audit)) return d;
    } catch (e) {
      console.error("Could not read data file, starting empty:", e);
    }
  }
  return { requests: [], audit: [] };
}

const g = globalThis as unknown as { __sentinelDb?: DB };
const db: DB = (g.__sentinelDb ??= load());

function save() {
  if (!DATA_FILE) return;
  try {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    writeFileSync(tmp, JSON.stringify(db, null, 2));
    renameSync(tmp, DATA_FILE);
  } catch (e) {
    console.error("Could not write data file:", e);
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const AGENT_ACTOR = "SentinelAgent (AI)";
const POLICY_ACTOR = "Policy Guard";
const GATE_ACTOR = "Quorum Gate";

// Strip internal fields before anything leaves the API.
const pub = ({ requesterId: _omit, ...r }: StoredRequest): Request => r;

// ---- Tamper-evident audit log (hash chain) ----
const entryHash = (e: Omit<AuditEntry, "hash">) =>
  createHash("sha256")
    .update([e.prevHash, e.id, e.at, e.actor, e.event, e.requestId, e.detail].join("\n"))
    .digest("hex");

// db.audit is stored oldest first; the API returns newest first.
export function log(actor: string, event: AuditEvent, requestId: string, detail: string): AuditEntry {
  const prevHash = db.audit.length ? db.audit[db.audit.length - 1].hash ?? GENESIS : GENESIS;
  const base = { id: randomUUID(), at: new Date().toISOString(), actor, event, requestId, detail, prevHash };
  const entry: AuditEntry = { ...base, hash: entryHash(base) };
  db.audit.push(entry);
  save();
  return entry;
}

export type ChainCheck = { ok: boolean; entries: number; brokenAt?: string; headHash: string };

/** Recomputes every hash. Any edited, removed or reordered entry breaks the chain. */
export function verifyAudit(): ChainCheck {
  let prev = GENESIS;
  for (const e of db.audit) {
    const { hash, ...rest } = e;
    if (e.prevHash !== prev || entryHash(rest) !== hash) {
      return { ok: false, entries: db.audit.length, brokenAt: e.id, headHash: prev };
    }
    prev = hash!;
  }
  return { ok: true, entries: db.audit.length, headHash: prev };
}

export const listRequests = (): Request[] =>
  [...db.requests].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map(pub);
export const listAudit = (): AuditEntry[] => [...db.audit].reverse();

function spentLast24h(): number {
  const since = Date.now() - DAY_MS;
  return db.requests
    .filter((r) => (r.status === "executed" || r.status === "pending") && r.proposal && Date.parse(r.createdAt) >= since)
    .reduce((sum, r) => sum + Number(r.proposal!.params.amount ?? 0), 0);
}

export function createRequest(
  requester: Actor,
  text: string,
  proposal: Proposal | null,
  rejectedReason?: string,
  encryptedMemo?: string,
): Request {
  let status: Request["status"] = "pending";
  let requiredApprovals = POLICY.requiredApprovals;
  let blockedReason: string | undefined;
  if (!proposal) {
    status = "blocked";
    blockedReason = rejectedReason?.startsWith("agent error")
      ? `Blocked: the agent's reply could not be used (${rejectedReason.replace(/^agent error: /, "")}). Nothing was sent to approvers; try again.`
      : `Blocked: AI output rejected by schema check (${rejectedReason ?? "invalid output"}).`;
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
    ...(encryptedMemo ? { encryptedMemo } : {}),
  };
  db.requests.push(req);
  const memoNote = encryptedMemo ? " Encrypted memo attached (backend cannot read it)." : "";
  if (proposal) {
    const p = proposal.params;
    log(AGENT_ACTOR, "proposed", req.id, `AI proposed ${proposal.action}: ${p.amount} ${p.currency} to ${p.payee} (risk ${proposal.risk}). Requested by ${requester.name}.${memoNote}`);
  } else {
    log(AGENT_ACTOR, "rejected", req.id, `AI output rejected: ${rejectedReason ?? "invalid output"}. Requested by ${requester.name}.`);
  }
  if (status === "blocked") log(POLICY_ACTOR, "blocked", req.id, blockedReason!);
  save();
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
  save();
  return { ok: true, request: pub(req) };
}

/** Demo helper: wipe all data. The reset itself starts the new audit chain so it stays visible. */
export function resetAll(actor: string): void {
  db.requests.length = 0;
  db.audit.length = 0;
  log(actor, "rejected", "-", "Demo data reset by approver (DEMO_RESET_ENABLED=true).");
}
