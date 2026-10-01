import { afterEach, describe, expect, it } from 'vitest';
import { clientIp, isCloudflareIp } from '../src/cms/visitor-ip';

const req = (headers: Record<string, string> = {}) => new Request('http://internal/', { headers });
const SOCKET = '172.18.0.2';
const CF_EDGE = '104.16.5.9';

afterEach(() => { delete process.env.TRUST_PROXY; });

describe('isCloudflareIp', () => {
  it('knows Cloudflare ranges in both families', () => {
    expect(isCloudflareIp('104.16.5.9')).toBe(true);
    expect(isCloudflareIp('2606:4700::1')).toBe(true);
    expect(isCloudflareIp('203.0.113.9')).toBe(false);
    expect(isCloudflareIp('2001:db8::1')).toBe(false);
  });
});

describe('clientIp', () => {
  it('ignores every header unless the proxy is trusted', () => {
    expect(clientIp(req({ 'x-forwarded-for': '1.2.3.4', 'cf-connecting-ip': '5.6.7.8' }), SOCKET)).toBe(SOCKET);
  });

  it('uses the peer the proxy reports, taking the last entry if there are several', () => {
    process.env.TRUST_PROXY = '1';
    expect(clientIp(req({ 'x-forwarded-for': '203.0.113.9' }), SOCKET)).toBe('203.0.113.9');
    expect(clientIp(req({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' }), SOCKET)).toBe('203.0.113.9');
    expect(clientIp(req(), SOCKET)).toBe(SOCKET);
    expect(clientIp(req({ 'x-forwarded-for': 'not an ip' }), SOCKET)).toBe(SOCKET);
  });

  it('believes CF-Connecting-IP only when the peer is Cloudflare', () => {
    process.env.TRUST_PROXY = '1';
    expect(clientIp(req({ 'x-forwarded-for': CF_EDGE, 'cf-connecting-ip': '198.51.100.7' }), SOCKET)).toBe('198.51.100.7');
    // Straight to the origin, a forged CF header is ignored
    expect(clientIp(req({ 'x-forwarded-for': '203.0.113.9', 'cf-connecting-ip': '7.7.7.7' }), SOCKET)).toBe('203.0.113.9');
    // Cloudflare peer without the header falls back to the edge address
    expect(clientIp(req({ 'x-forwarded-for': CF_EDGE }), SOCKET)).toBe(CF_EDGE);
    expect(clientIp(req({ 'x-forwarded-for': CF_EDGE, 'cf-connecting-ip': '<script>' }), SOCKET)).toBe(CF_EDGE);
  });
});
