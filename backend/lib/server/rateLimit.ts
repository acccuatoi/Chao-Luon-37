// Simple fixed-window limit per user, to stop one account from flooding the agent (and the LLM bill).
const WINDOW_MS = 60_000;
const LIMIT = Math.max(1, Number(process.env.RATE_LIMIT_PER_MIN ?? 10));
const g = globalThis as unknown as { __sentinelRate?: Map<string, number[]> };
const hits: Map<string, number[]> = (g.__sentinelRate ??= new Map());

export function allow(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
