import type { APIRoute } from 'astro';
import { deleteUpload, listUploads } from '../../../cms/media';
import { read } from '../../../cms/store';
import { json } from '../../../cms/http';

export const GET: APIRoute = () => {
  const inUse = JSON.stringify(read().content);
  return json(listUploads().map((file) => ({ ...file, used: inUse.includes(`"${file.url}"`) })));
};

export const DELETE: APIRoute = ({ url }) => {
  const name = url.searchParams.get('name') ?? '';
  if (JSON.stringify(read().content).includes(`"/uploads/${name}"`)) {
    return json({ error: 'This file is used on the site. Remove it from the content first.' }, 409);
  }
  return deleteUpload(name) ? json({ ok: true }) : json({ error: 'Not found' }, 404);
};
