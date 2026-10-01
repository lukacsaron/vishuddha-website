// Streams the whole data directory (content, history, enquiries, uploads) as a .tar.gz.
import type { APIRoute } from 'astro';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { Readable } from 'node:stream';
import { env } from '../../../cms/env';
import { json } from '../../../cms/http';

export const GET: APIRoute = () => {
  if (!existsSync(env.dataDir)) return json({ error: 'Nothing has been saved yet, so there is nothing to back up.' }, 404);
  const tar = spawn('tar', ['-czf', '-', '-C', env.dataDir, '.'], { stdio: ['ignore', 'pipe', 'inherit'] });
  return new Response(Readable.toWeb(tar.stdout) as ReadableStream, {
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="vishuddha-backup-${new Date().toISOString().slice(0, 10)}.tar.gz"`,
      'Cache-Control': 'no-store',
    },
  });
};
