import { describe, expect, it } from 'vitest';
import { RateLimiter, SESSION_TTL_S, checkPassword, createSession, sameOrigin, verifySession } from '../src/cms/auth';

describe('password', () => {
  it('accepts only the configured password', () => {
    expect(checkPassword('correct horse')).toBe(true);
    expect(checkPassword('correct hors')).toBe(false);
    expect(checkPassword('')).toBe(false);
  });

  it('lets nobody in when no password is configured', () => {
    expect(checkPassword('', '')).toBe(false);
    expect(checkPassword('anything', '')).toBe(false);
  });
});

describe('session', () => {
  it('verifies a session it created', () => {
    expect(verifySession(createSession())).toBe(true);
  });

  it('rejects a missing, malformed or tampered token', () => {
    const token = createSession();
    const [payload, mac] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ exp: 9999999999 })).toString('base64url');
    expect(verifySession(undefined)).toBe(false);
    expect(verifySession('')).toBe(false);
    expect(verifySession('abc')).toBe(false);
    expect(verifySession(`${forged}.${mac}`)).toBe(false);
    expect(verifySession(`${payload}.${mac.slice(0, -1)}x`)).toBe(false);
    expect(verifySession(`${token}.extra`)).toBe(false);
  });

  it('expires', () => {
    const now = Date.now();
    const token = createSession(now);
    expect(verifySession(token, now + (SESSION_TTL_S - 1) * 1000)).toBe(true);
    expect(verifySession(token, now + (SESSION_TTL_S + 1) * 1000)).toBe(false);
  });

  it('is invalidated by a password change', () => {
    const token = createSession();
    process.env.ADMIN_PASSWORD = 'new password';
    expect(verifySession(token)).toBe(false);
    process.env.ADMIN_PASSWORD = 'correct horse';
    expect(verifySession(token)).toBe(true);
  });
});

describe('rate limiter', () => {
  it('blocks after the limit and recovers after the window', () => {
    const limiter = new RateLimiter(3, 1000);
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(limiter.allowed('ip', t)).toBe(true);
      limiter.hit('ip', t);
    }
    expect(limiter.allowed('ip', t + 500)).toBe(false);
    expect(limiter.allowed('other', t + 500)).toBe(true);
    expect(limiter.allowed('ip', t + 1001)).toBe(true);
  });

  it('can be reset for a key', () => {
    const limiter = new RateLimiter(1, 1000);
    limiter.hit('ip');
    expect(limiter.allowed('ip')).toBe(false);
    limiter.reset('ip');
    expect(limiter.allowed('ip')).toBe(true);
  });
});

describe('sameOrigin', () => {
  const req = (headers: Record<string, string>) => new Request('http://internal/api/x', { method: 'POST', headers });

  it('accepts a matching host, including behind a proxy', () => {
    expect(sameOrigin(req({ origin: 'https://site.hu', host: 'site.hu' }))).toBe(true);
    expect(sameOrigin(req({ origin: 'https://site.hu', host: '10.0.0.5:4321', 'x-forwarded-host': 'site.hu' }))).toBe(true);
  });

  it('refuses another site, a missing origin and a malformed one', () => {
    expect(sameOrigin(req({ origin: 'https://evil.test', host: 'site.hu' }))).toBe(false);
    expect(sameOrigin(req({ host: 'site.hu' }))).toBe(false);
    expect(sameOrigin(req({ origin: 'null', host: 'site.hu' }))).toBe(false);
  });
});
