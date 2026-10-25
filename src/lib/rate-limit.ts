// Best-effort sliding window per IP. In-memory, so on serverless each instance
// counts separately; use a shared store (e.g. Redis) for a hard limit.
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function rateLimit(ip: string, max: number): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);

  // Keep the map from growing without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return true;
}
