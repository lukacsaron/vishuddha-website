import type { APIRoute } from 'astro';
import { listHistory, restore } from '../../../cms/store';
import { json } from '../../../cms/http';

export const GET: APIRoute = () => json(listHistory());

export const POST: APIRoute = async ({ request }) => {
  const { id } = await request.json().catch(() => ({ id: '' }));
  try {
    return json(restore(String(id)));
  } catch {
    return json({ error: 'That version could not be restored.' }, 400);
  }
};
