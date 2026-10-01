// Liveness for Docker and Coolify. Stays 200 while the coming soon page is on, and
// fails when the data directory cannot be written, which is how a missing or
// read-only volume shows up.
import type { APIRoute } from 'astro';
import { accessSync, constants, mkdirSync } from 'node:fs';
import { env } from '../../cms/env';
import { json } from '../../cms/http';

export const GET: APIRoute = () => {
  try {
    mkdirSync(env.dataDir, { recursive: true });
    accessSync(env.dataDir, constants.R_OK | constants.W_OK);
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: 'Data directory is not writable' }, 503);
  }
};
