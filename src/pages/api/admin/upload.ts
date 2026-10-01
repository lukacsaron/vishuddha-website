import type { APIRoute } from 'astro';
import { MAX_VIDEO_BYTES, UploadError, saveUpload } from '../../../cms/media';
import { json } from '../../../cms/http';

export const POST: APIRoute = async ({ request }) => {
  // Refuse oversized bodies before reading them into memory
  if (Number(request.headers.get('content-length') ?? 0) > MAX_VIDEO_BYTES + 1024 * 1024) {
    return json({ error: 'File is larger than 150 MB.' }, 413);
  }
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get('file');
  } catch {
    return json({ error: 'Invalid upload' }, 400);
  }
  if (!(file instanceof File)) return json({ error: 'No file received' }, 400);
  try {
    return json(await saveUpload(file.name, new Uint8Array(await file.arrayBuffer())));
  } catch (err) {
    if (err instanceof UploadError) return json({ error: err.message }, 415);
    throw err;
  }
};
