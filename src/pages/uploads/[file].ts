// Serves uploaded media from DATA_DIR/uploads. Supports range requests, which
// Safari requires before it will play a video.
import type { APIRoute } from 'astro';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { MIME, resolveUpload } from '../../cms/media';

export const GET: APIRoute = ({ params, request }) => {
  const full = resolveUpload(params.file ?? '');
  if (!full) return new Response('Not found', { status: 404 });

  const { size } = statSync(full);
  const headers: Record<string, string> = {
    'Content-Type': MIME[path.extname(full)] ?? 'application/octet-stream',
    // File names carry a random suffix, so a given URL never changes content
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '');
  if (range && (range[1] || range[2])) {
    // "bytes=-500" means the last 500 bytes
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    const body = Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream;
    return new Response(body, {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) },
    });
  }

  const body = Readable.toWeb(createReadStream(full)) as ReadableStream;
  return new Response(body, { headers: { ...headers, 'Content-Length': String(size) } });
};
