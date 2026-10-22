// Deterministic parser for EMVCo merchant-presented QR payloads (the format VietQR uses).
// QR content is untrusted data: it is parsed field by field, its CRC is checked, and no part of it is
// ever given to the language model as instructions. The memo is kept as plain text only.

export type QrPayment = {
  bankBin: string; // 6-digit bank id (VietQR: tag 38 > 01 > 00)
  accountNumber: string; // tag 38 > 01 > 01
  amount: number; // tag 54
  currency: string; // tag 53, ISO 4217 numeric, mapped to a code
  merchantName?: string; // tag 59
  memo?: string; // tag 62 > 08 (purpose of transaction)
};

export type QrResult = { ok: true; payment: QrPayment } | { ok: false; reason: string };

const CURRENCIES: Record<string, string> = { "840": "USD", "704": "VND", "978": "EUR" };

function tlv(data: string): Map<string, string> | null {
  const out = new Map<string, string>();
  let i = 0;
  while (i < data.length) {
    if (i + 4 > data.length) return null;
    const tag = data.slice(i, i + 2);
    const len = Number(data.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(tag) || !Number.isInteger(len)) return null;
    const value = data.slice(i + 4, i + 4 + len);
    if (value.length !== len) return null;
    out.set(tag, value);
    i += 4 + len;
  }
  return out;
}

/** CRC-16/CCITT-FALSE, as required by EMVCo (tag 63 covers everything up to and including "6304"). */
export function crc16(s: string): string {
  let crc = 0xffff;
  for (const byte of Buffer.from(s, "utf8")) {
    crc ^= byte << 8;
    for (let k = 0; k < 8; k++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const clean = (s: string | undefined, max: number) =>
  s === undefined ? undefined : s.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

export function parseQr(raw: string): QrResult {
  const data = raw.trim();
  if (data.length < 20 || data.length > 1000) return { ok: false, reason: "QR content has an unexpected length" };
  const crcAt = data.lastIndexOf("6304");
  if (crcAt < 0 || crcAt + 8 !== data.length) return { ok: false, reason: "QR has no CRC (tag 63)" };
  if (crc16(data.slice(0, crcAt + 4)) !== data.slice(crcAt + 4).toUpperCase()) {
    return { ok: false, reason: "QR checksum does not match: the code was altered or misread" };
  }
  const top = tlv(data);
  if (!top) return { ok: false, reason: "QR is not a valid EMVCo payment code" };

  const acct = top.get("38") ? tlv(top.get("38")!) : null;
  const beneficiary = acct?.get("01") ? tlv(acct.get("01")!) : null;
  const bankBin = beneficiary?.get("00") ?? "";
  const accountNumber = beneficiary?.get("01") ?? "";
  if (!/^\d{6}$/.test(bankBin) || !/^\d{6,19}$/.test(accountNumber)) {
    return { ok: false, reason: "QR does not contain a bank id and account number" };
  }
  const amount = Number(top.get("54"));
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "QR has no amount; ask for a QR with a fixed amount" };
  const currency = CURRENCIES[top.get("53") ?? ""] ?? `code ${top.get("53") ?? "missing"}`;
  const extra = top.get("62") ? tlv(top.get("62")!) : null;
  return {
    ok: true,
    payment: {
      bankBin,
      accountNumber,
      amount,
      currency,
      merchantName: clean(top.get("59"), 60),
      memo: clean(extra?.get("08"), 140),
    },
  };
}

// --- Builder, used only to make demo QR codes and tests ---
const f = (tag: string, v: string) => `${tag}${String(v.length).padStart(2, "0")}${v}`;
export function buildQr(p: { bankBin: string; accountNumber: string; amount: number; currency?: string; name?: string; memo?: string }): string {
  const cur = Object.entries(CURRENCIES).find(([, c]) => c === (p.currency ?? "USD"))?.[0] ?? "840";
  const body =
    f("00", "01") +
    f("01", "12") +
    f("38", f("00", "A000000727") + f("01", f("00", p.bankBin) + f("01", p.accountNumber)) + f("02", "QRIBFTTA")) +
    f("53", cur) +
    f("54", String(p.amount)) +
    f("58", "VN") +
    (p.name ? f("59", p.name) : "") +
    (p.memo ? f("62", f("08", p.memo)) : "") +
    "6304";
  return body + crc16(body);
}
