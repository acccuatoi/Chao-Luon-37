import type { Proposal } from "../../types";
import { parseQr } from "./qr";

// Approved bank accounts. When a request carries an account number, THIS list decides who can be paid,
// not the name: a QR that says "AWS Cloud Services" but points to an unknown account is blocked.
// Format: "Name|bankBin|accountNumber;..." (env POLICY_ACCOUNTS). Demo values below are fictional.
export type ApprovedAccount = { name: string; bankBin: string; accountNumber: string };

export const APPROVED_ACCOUNTS: ApprovedAccount[] = (
  process.env.POLICY_ACCOUNTS ??
  "AWS Cloud Services|970436|0011004455667;Office Lease Corp|970418|1234567890;Cloudflare Inc.|970407|1903456789012"
)
  .split(";")
  .map((row) => row.split("|").map((s) => s.trim()))
  .filter((r) => r.length === 3 && r.every(Boolean))
  .map(([name, bankBin, accountNumber]) => ({ name, bankBin, accountNumber }));

export const BANKS: Record<string, string> = {
  "970436": "Vietcombank",
  "970418": "BIDV",
  "970407": "Techcombank",
  "970422": "MB Bank",
  "970415": "VietinBank",
  "970416": "ACB",
  "970423": "TPBank",
};

export const bankName = (bin: string) => BANKS[bin] ?? `bank ${bin}`;

export const findApproved = (bankBin: string, accountNumber: string) =>
  APPROVED_ACCOUNTS.find((a) => a.bankBin === bankBin && a.accountNumber === accountNumber);

/** Pull bank details out of typed text, without the model: account number, bank and memo. */
export function extractBankDetails(text: string): { accountNumber: string; bankBin: string; memo?: string } | null {
  const acct = text.match(/\b(?:account|acct|a\/c|stk|tk|số tài khoản)\s*(?:no\.?|number|#|:)?\s*([0-9][0-9 -]{4,24}[0-9])\b/i);
  if (!acct) return null;
  const accountNumber = acct[1].replace(/[ -]/g, "");
  if (!/^\d{6,19}$/.test(accountNumber)) return null;
  const lower = text.toLowerCase();
  const bankBin =
    Object.entries(BANKS).find(([, n]) => lower.includes(n.toLowerCase()))?.[0] ??
    (lower.match(/\b(9704\d{2})\b/)?.[1] ?? "");
  const memoMatch = text.match(/\b(?:memo|note|content|reference|nội dung)\s*[:=]?\s*["“']([^"”']{1,140})["”']/i);
  return { accountNumber, bankBin, memo: memoMatch?.[1].trim() };
}

/** Attach bank details to a proposal and set the payee from the approved account list. */
export function applyBankDetails(p: Proposal, d: { accountNumber: string; bankBin: string; memo?: string }) {
  const approved = findApproved(d.bankBin, d.accountNumber);
  p.params.accountNumber = d.accountNumber;
  p.params.bankBin = d.bankBin;
  p.params.bank = d.bankBin ? `${bankName(d.bankBin)} (${d.bankBin})` : "unknown bank";
  if (d.memo) p.params.memo = d.memo;
  p.params.payee = approved ? approved.name : `${d.bankBin ? bankName(d.bankBin) : "Unknown bank"} account ${d.accountNumber}`;
  return approved;
}

const SUSPICIOUS = /(ignore|instruction|system prompt|override|approve this|skip approval|admin|password|export)/i;

/** Build a proposal straight from a QR payload. The model is not involved: QR content is data, not instructions. */
export function proposalFromQr(qrText: string): { proposal: Proposal | null; reason?: string } {
  const r = parseQr(qrText);
  if (!r.ok) return { proposal: null, reason: `QR rejected: ${r.reason}` };
  const q = r.payment;
  if (q.currency !== "USD") return { proposal: null, reason: `QR rejected: unsupported currency ${q.currency} (USD only)` };
  const proposal: Proposal = {
    action: "transfer_funds",
    params: { amount: q.amount, currency: "USD", payee: "" },
    reason: `Read from a payment QR code${q.merchantName ? ` (name on QR: ${q.merchantName})` : ""}`,
    risk: q.memo && SUSPICIOUS.test(q.memo) ? "high" : "low",
  };
  const approved = applyBankDetails(proposal, q);
  if (approved && q.merchantName && q.merchantName.toLowerCase() !== approved.name.toLowerCase()) {
    proposal.reason += `; the QR's name differs from the approved owner of this account`;
    proposal.risk = "medium";
  }
  if (q.memo && SUSPICIOUS.test(q.memo)) proposal.reason += "; the memo contains instruction-like text (treated as plain text only)";
  return { proposal };
}
