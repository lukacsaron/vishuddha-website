import type { APIRoute } from 'astro';
import { deleteEnquiry, listEnquiries, setRead } from '../../../cms/enquiries';
import { json } from '../../../cms/http';

export const GET: APIRoute = () => json(listEnquiries());

export const PATCH: APIRoute = async ({ request }) => {
  const { id, read } = await request.json().catch(() => ({}));
  return setRead(String(id), Boolean(read)) ? json({ ok: true }) : json({ error: 'Not found' }, 404);
};

export const DELETE: APIRoute = ({ url }) =>
  deleteEnquiry(url.searchParams.get('id') ?? '') ? json({ ok: true }) : json({ error: 'Not found' }, 404);
