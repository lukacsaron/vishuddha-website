// The only module that reads environment variables. Values are read at call time,
// so tests can set process.env before using them.
import { existsSync } from 'node:fs';
import path from 'node:path';

// `astro dev` does not put .env into process.env; loading it here makes dev, the built
// server and the tests behave the same. Variables already set in the environment win.
if (existsSync('.env')) {
  try { process.loadEnvFile('.env'); } catch { /* malformed .env: fall through to real env */ }
}

export const env = {
  get dataDir() { return path.resolve(process.env.DATA_DIR || 'data'); },
  get adminPassword() { return process.env.ADMIN_PASSWORD || ''; },
  get sessionSecret() { return process.env.SESSION_SECRET || ''; },
  /** Set when a reverse proxy (Traefik on Coolify) sits in front and its forwarded headers can be trusted */
  get trustProxy() { return process.env.TRUST_PROXY === '1'; },
  get isProd() { return process.env.NODE_ENV === 'production'; },
};
