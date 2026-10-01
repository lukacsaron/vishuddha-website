// Admin authentication: one shared password, a signed session cookie, a login rate limit.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env';

export const SESSION_COOKIE = 'vp_admin';
export const SESSION_TTL_S = 7 * 24 * 60 * 60;

const sha = (s: string) => createHash('sha256').update(s).digest();

/** Compares in constant time; hashing first makes the lengths equal. */
export function checkPassword(given: string, expected = env.adminPassword): boolean {
  if (!expected) return false; // no password configured: nobody gets in
  return timingSafeEqual(sha(given), sha(expected));
}

/** Changing the password invalidates every session when no explicit secret is set. */
const secret = () => env.sessionSecret || sha(`vp-session:${env.adminPassword}`).toString('hex');

const sign = (payload: string, key: string) => createHmac('sha256', key).update(payload).digest('base64url');

export function createSession(now = Date.now(), key = secret()): string {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(now / 1000) + SESSION_TTL_S })).toString('base64url');
  return `${payload}.${sign(payload, key)}`;
}

export function verifySession(token: string | undefined, now = Date.now(), key = secret()): boolean {
  if (!token || !env.adminPassword) return false;
  const [payload, mac, extra] = token.split('.');
  if (!payload || !mac || extra !== undefined) return false;
  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp * 1000 > now;
  } catch {
    return false;
  }
}

/** Fixed-window counter kept in memory; enough for a single-process site. */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();
  constructor(private limit: number, private windowMs: number) {}

  /** True if `key` is still within its allowance. Does not count the attempt. */
  allowed(key: string, now = Date.now()): boolean {
    const entry = this.hits.get(key);
    return !entry || entry.resetAt <= now || entry.count < this.limit;
  }

  hit(key: string, now = Date.now()): void {
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
    else entry.count += 1;
    if (this.hits.size > 5000) {
      for (const [k, v] of this.hits) if (v.resetAt <= now) this.hits.delete(k);
    }
  }

  reset(key: string): void { this.hits.delete(key); }
}

export const loginLimiter = new RateLimiter(5, 15 * 60 * 1000);

/**
 * True when a state-changing request comes from our own pages. Compares hosts, not
 * full origins, because behind a TLS-terminating proxy the app sees http.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  try { return new URL(origin).host === host; } catch { return false; }
}
