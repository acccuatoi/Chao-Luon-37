import type { Proposal } from "../../types";

// Policy values come from env (see .env.example). The UI reads them from GET /api/status.
export const POLICY = {
  dailyCapUsd: Number(process.env.POLICY_DAILY_CAP_USD ?? 5000),
  requiredApprovals: Math.max(1, Number(process.env.POLICY_REQUIRED_APPROVALS ?? 2)),
  whitelist: (
    process.env.POLICY_WHITELIST ??
    "AWS Cloud Services,Cloudflare Inc.,Office Lease Corp,Công ty Bất động sản Hòa Bình,Stripe Payouts,Google Workspace"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

// The agent may only ever propose these actions. Anything else is rejected before policy runs.
export const ALLOWED_ACTIONS = ["transfer_funds"] as const;

export type Verdict = { ok: true; requiredApprovals: number } | { ok: false; reason: string };

const norm = (s: string) => s.normalize("NFC").trim().toLowerCase();

/** Pure policy check. `spentLast24hUsd` = executed + still-pending amounts created in the last 24h. */
export function evaluatePolicy(proposal: Proposal, spentLast24hUsd: number): Verdict {
  if (!(ALLOWED_ACTIONS as readonly string[]).includes(proposal.action)) {
    return { ok: false, reason: `Blocked by policy: action "${proposal.action}" is not allowed.` };
  }
  const payee = String(proposal.params.payee ?? "");
  const amount = Number(proposal.params.amount);
  const reasons: string[] = [];
  if (!POLICY.whitelist.some((w) => norm(w) === norm(payee))) {
    reasons.push(`payee '${payee}' is not on the approved whitelist`);
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    reasons.push("amount is invalid");
  } else if (spentLast24hUsd + amount > POLICY.dailyCapUsd) {
    reasons.push(
      `amount ($${amount}) plus $${spentLast24hUsd} already committed in the last 24h exceeds the rolling daily cap ($${POLICY.dailyCapUsd})`,
    );
  }
  if (reasons.length) return { ok: false, reason: `Blocked by policy: ${reasons.join("; ")}.` };
  return { ok: true, requiredApprovals: POLICY.requiredApprovals };
}
