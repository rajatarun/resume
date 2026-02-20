type Entry = { count: number; resetAt: number };
const memory = new Map<string, Entry>();

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const maxRequests = Number(process.env.RATE_LIMIT_MAX ?? 30);

export function checkRateLimit(key: string) {
  const now = Date.now();
  const current = memory.get(key);

  if (!current || current.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  memory.set(key, current);
  return { allowed: true, remaining: maxRequests - current.count };
}
