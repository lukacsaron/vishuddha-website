import type { APIRoute } from 'astro';
import { InvalidContentError, StaleRevisionError, read, save } from '../../../cms/store';
import { json } from '../../../cms/http';

export const GET: APIRoute = () => json(read());

export const PUT: APIRoute = async ({ request }) => {
  let body: { content?: unknown; rev?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  try {
    return json(save(body.content, body.rev));
  } catch (err) {
    if (err instanceof StaleRevisionError) {
      return json({ error: 'Someone else saved changes while you were editing. Reload to get their version.' }, 409);
    }
    if (err instanceof InvalidContentError) return json({ error: 'Some fields are not valid.', issues: err.issues }, 422);
    throw err;
  }
};
