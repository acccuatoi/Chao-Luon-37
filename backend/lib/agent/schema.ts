import type { Proposal } from "../../types";
import { ALLOWED_ACTIONS } from "../server/policy";

export type ValidationResult = { ok: true; proposal: Proposal } | { ok: false; reason: string };

/** Strict validation of whatever the model returned. Anything unexpected is rejected, never "fixed up". */
export function validateProposal(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "output is not a JSON object" };
  const o = raw as Record<string, unknown>;
  if (typeof o.action !== "string") return { ok: false, reason: "missing action" };
  if (!(ALLOWED_ACTIONS as readonly string[]).includes(o.action)) {
    return { ok: false, reason: `disallowed action "${o.action.slice(0, 60)}"` };
  }
  const p = o.params as Record<string, unknown> | undefined;
  if (!p || typeof p !== "object") return { ok: false, reason: "missing params" };
  const payee = p.payee;
  const amount = Number(p.amount);
  if (typeof payee !== "string" || !payee.trim() || payee.length > 80) return { ok: false, reason: "invalid payee" };
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return { ok: false, reason: "invalid amount" };
  const currency = typeof p.currency === "string" ? p.currency.toUpperCase() : "USD";
  if (currency !== "USD") return { ok: false, reason: `unsupported currency "${String(p.currency).slice(0, 10)}"` };
  const reason = typeof o.reason === "string" ? o.reason.slice(0, 300) : "";
  const risk = o.risk === "low" || o.risk === "medium" || o.risk === "high" ? o.risk : "medium";
  return {
    ok: true,
    proposal: { action: o.action, params: { amount, currency: "USD", payee: payee.trim() }, reason, risk },
  };
}
