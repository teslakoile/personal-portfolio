/**
 * A fixed-window rate limit kept in memory: per visitor (by IP) a burst limit
 * per minute and a daily limit, and a daily limit for the whole instance.
 * Memory is per server instance, so on Vercel each instance counts on its
 * own; it stops scripted abuse of one instance, and the spending cap on the
 * Anthropic account is the hard stop.
 */

const MINUTE = 60_000;
const DAY = 86_400_000;
export const RATE = { perMinute: 6, perDay: 40, instancePerDay: 1500 };

type Window = { start: number; count: number };
const visitors = new Map<string, { minute: Window; day: Window }>();
let instance: Window = { start: Date.now(), count: 0 };

const roll = (w: Window, span: number, now: number): Window => (now - w.start >= span ? { start: now, count: 0 } : w);

/** Counts one request and says whether it is allowed; `retryAfter` is in seconds. */
export function take(key: string, now = Date.now()): { ok: true } | { ok: false; retryAfter: number } {
  instance = roll(instance, DAY, now);
  const v = visitors.get(key) ?? { minute: { start: now, count: 0 }, day: { start: now, count: 0 } };
  v.minute = roll(v.minute, MINUTE, now);
  v.day = roll(v.day, DAY, now);
  if (instance.count >= RATE.instancePerDay) return { ok: false, retryAfter: Math.ceil((instance.start + DAY - now) / 1000) };
  if (v.day.count >= RATE.perDay) return { ok: false, retryAfter: Math.ceil((v.day.start + DAY - now) / 1000) };
  if (v.minute.count >= RATE.perMinute) return { ok: false, retryAfter: Math.ceil((v.minute.start + MINUTE - now) / 1000) };
  v.minute.count++; v.day.count++; instance.count++;
  visitors.set(key, v);
  // keep the map from growing without bound
  if (visitors.size > 5000) for (const [k, w] of visitors) if (now - w.day.start >= DAY) visitors.delete(k);
  return { ok: true };
}
