import type { APIRoute } from 'astro';
import { read } from '../../../cms/store';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(read().content, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="vishuddha-content-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
