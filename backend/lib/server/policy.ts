import type { Proposal } from "../../types";
import { findApproved, bankName } from "./bank";

// Policy values come from env (see .env.example). The UI reads them from GET /api/status.
export const POLICY = {
  dailyCapUsd: Number(process.env.POLICY_DAILY_CAP_USD ?? 5000),
  requiredApprovals: Math.max(1, Number(process.env.POLICY_REQUIRED_APPROVALS ?? 2)),
  whitelist: (
    process.env.POLICY_WHITELIST ??
    "AWS Cloud Services,Cloudflare Inc.,Office Lease Corp,Stripe Payouts,Google Workspace"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

// The agent may only ever propose these actions. Anything else is rejected before policy runs.
export const ALLOWED_ACTIONS = ["transfer_funds"] as const;

export type Verdict = { ok: true; requiredApprovals: number } | { ok: false; reason: string };

const norm = (s: string) => s.normalize("NFC").trim().toLowerCase();

/** Pure policy check. `spentLast24hUsd` = this requester's PAID amounts in the last 24h (waiting ones do not count). */
// Counts money amounts written in the request ("100 USD", "$100", "2,000 EUR").
export function countAmounts(text: string): number {
  return (text.match(/(\$\s?\d[\d,]*(\.\d+)?|\d[\d,]*(\.\d+)?\s?(usd|dollars?|eur|euros?|vnd|gbp))/gi) ?? []).length;
}

export function evaluatePolicy(proposal: Proposal, spentLast24hUsd: number, requestText = ""): Verdict {
  if (!(ALLOWED_ACTIONS as readonly string[]).includes(proposal.action)) {
    return { ok: false, reason: `Blocked by policy: action "${proposal.action}" is not allowed.` };
  }
  const payee = String(proposal.params.payee ?? "");
  const amount = Number(proposal.params.amount);
  const reasons: string[] = [];
  // One request = one payment. Otherwise the agent would silently drop the others.
  if (countAmounts(requestText) > 1) reasons.push("the request asks for more than one payment; send one payment per request");
  // Every payment must name a clear bank account (number + bank). The approved ACCOUNT list decides who can be
  // paid; the payee name on the request does not matter.
  const account = proposal.params.accountNumber ? String(proposal.params.accountNumber) : "";
  const bin = String(proposal.params.bankBin ?? "");
  if (!account) {
    reasons.push(`no bank account in the request for '${payee}': include the account number and bank, or pay a QR code`);
  } else if (!bin) {
    reasons.push(`bank not recognised for account ${account}: name the bank (e.g. Vietcombank, BIDV, Techcombank)`);
  } else if (!findApproved(bin, account)) {
    reasons.push(`bank account ${account} at ${bankName(bin)} is not on the approved account list`);
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    reasons.push("amount is invalid");
  } else if (spentLast24hUsd + amount > POLICY.dailyCapUsd) {
    reasons.push(
      `amount ($${amount}) plus $${spentLast24hUsd} you already paid in the last 24h exceeds your rolling daily limit ($${POLICY.dailyCapUsd})`,
    );
  }
  if (reasons.length) return { ok: false, reason: `Blocked by policy: ${reasons.join("; ")}.` };
  return { ok: true, requiredApprovals: POLICY.requiredApprovals };
}
