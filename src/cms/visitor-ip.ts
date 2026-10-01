// The visitor's address for rate limiting, in a form the visitor cannot forge.
import { BlockList, isIP } from 'node:net';
import { env } from './env';

// Cloudflare's published edge ranges: https://www.cloudflare.com/ips-v4 and /ips-v6
// (snapshot of 2026-09-14). If Cloudflare adds a range, requests from it are keyed
// by the edge address instead of the visitor: coarser, never forgeable.
const CLOUDFLARE_RANGES = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
  '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
  '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32',
  '2a06:98c0::/29', '2c0f:f248::/32',
];

const cloudflare = new BlockList();
for (const range of CLOUDFLARE_RANGES) {
  const [prefix, bits] = range.split('/');
  cloudflare.addSubnet(prefix, Number(bits), prefix.includes(':') ? 'ipv6' : 'ipv4');
}

const family = (ip: string) => (isIP(ip) === 6 ? 'ipv6' : 'ipv4');
const readIp = (value: string | null | undefined) => {
  const ip = value?.trim();
  return ip && isIP(ip) ? ip : undefined;
};

export const isCloudflareIp = (ip: string): boolean => cloudflare.check(ip, family(ip));

/**
 * Without TRUST_PROXY the socket address is used as is.
 *
 * With it (the Docker/Coolify setup): Coolify's Traefik trusts no forwarded headers
 * and overwrites X-Forwarded-For with the peer that connected to it, so that header
 * names the real peer. If the domain is proxied through Cloudflare that peer is a
 * Cloudflare edge shared by many visitors, and Cloudflare puts the visitor in
 * CF-Connecting-IP. That header is only believed when the peer really is Cloudflare;
 * sent straight to the origin it is whatever the client chose.
 */
export function clientIp(request: Request, socketAddress: string): string {
  if (!env.trustProxy) return socketAddress;
  const peer = readIp(request.headers.get('x-forwarded-for')?.split(',').at(-1))
    ?? readIp(request.headers.get('x-real-ip'))
    ?? socketAddress;
  if (!isIP(peer) || !isCloudflareIp(peer)) return peer;
  return readIp(request.headers.get('cf-connecting-ip')) ?? peer;
}
