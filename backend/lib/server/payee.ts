import { POLICY } from "./policy";

// Deterministic payee check. The model's payee is never trusted as is: we find the name in the user's own words,
// read the WHOLE name as written there, and only map it to an approved payee when nothing but generic words follow
// a known name. "AWS Cloud Services Offshore Ltd" therefore stays a different, unapproved payee, even if the model
// "helpfully" shortened it to "AWS Cloud Services".

const norm = (s: string) =>
  s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,'"’()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const SUFFIXES = /\s+(inc|corp|corporation|llc|ltd|co|company)$/;

// Extra short names people use for approved payees (all lower case).
const EXTRA_ALIASES: Record<string, string[]> = {
  "AWS Cloud Services": ["aws", "amazon web services", "aws cloud"],
  "Cloudflare Inc.": ["cloudflare"],
  "Office Lease Corp": ["office lease"],
  "Stripe Payouts": ["stripe"],
  "Google Workspace": ["google workspace"],
};

// Words that may follow a payee name without changing who is paid ("AWS cloud hosting invoice").
const GENERIC = new Set(
  "cloud hosting compute services service monthly annual yearly quarterly invoice bill plan subscription cdn fee fees payment payout payouts rent office q1 q2 q3 q4 the".split(" "),
);
// Words that end the name ("... to Cloudflare for the CDN plan", "... AWS 100 USD").
const STOP = new Set(
  "for of as in on at by with and or from via usd dollars today now please immediately because so then".split(" "),
);

function aliasTable(): { alias: string; canonical: string }[] {
  const rows: { alias: string; canonical: string }[] = [];
  for (const name of POLICY.whitelist) {
    const n = norm(name);
    rows.push({ alias: n, canonical: name }, { alias: n.replace(SUFFIXES, ""), canonical: name });
    for (const a of EXTRA_ALIASES[name] ?? []) rows.push({ alias: norm(a), canonical: name });
  }
  // Longest alias first so "aws cloud services" wins over "aws".
  return rows.sort((a, b) => b.alias.length - a.alias.length);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type PayeeCheck = { payee: string; approved: boolean; asWritten: string };

/** Resolve the payee from the user's text, guided by the model's suggestion. */
export function resolvePayee(text: string, suggested: string): PayeeCheck {
  const cleaned = text.normalize("NFC").replace(/[.,'"’()]/g, " ").replace(/\s+/g, " ").trim();
  const orig = cleaned.split(" "); // original casing, same tokens as `words`
  const t = cleaned.toLowerCase();
  const words = t.split(" ");
  const table = aliasTable();
  const sug = norm(suggested);

  // Find `cand` in the text and read the full name as written (until a stop word or a number).
  const readName = (cand: string) => {
    const m = new RegExp(`(^| )${escape(cand)}( |$)`).exec(t);
    if (!m) return null;
    const start = t.slice(0, m.index + m[1].length).split(" ").filter(Boolean).length;
    const len = cand.split(" ").length;
    let end = start + len;
    while (end < words.length && !STOP.has(words[end]) && !/\d/.test(words[end])) end++;
    return { extra: words.slice(start + len, end), asWritten: orig.slice(start, end).join(" ") };
  };

  // Which approved payee does the model mean? (its suggestion equals one of the aliases)
  const meant = table.find((r) => r.alias === sug || r.alias === sug.replace(SUFFIXES, ""))?.canonical;
  if (meant) {
    // Check that name in the user's own words, longest alias first ("cloudflare inc" before "cloudflare").
    for (const row of table.filter((r) => r.canonical === meant)) {
      const found = readName(row.alias);
      if (!found) continue;
      // Any non-generic word after the name ("Offshore", "Ltd") means a different company.
      if (found.extra.every((w) => GENERIC.has(w))) return { payee: meant, approved: true, asWritten: found.asWritten };
      return { payee: found.asWritten, approved: false, asWritten: found.asWritten };
    }
    // The model picked an approved payee the user never mentioned.
    return { payee: suggested.trim(), approved: false, asWritten: "" };
  }
  const found = sug ? readName(sug) : null;
  return { payee: suggested.trim(), approved: false, asWritten: found?.asWritten ?? "" };
}
