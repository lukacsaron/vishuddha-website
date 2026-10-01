// Uploaded media: validation by content, image re-encoding, listing, safe path resolution.
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { env } from './env';

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2400;

export const uploadsDir = () => path.join(env.dataDir, 'uploads');

export type Kind = 'image' | 'mp4' | 'webm' | null;

/** Decides the type from the file's first bytes; the name and declared MIME type are not trusted. */
export function sniff(buf: Uint8Array): Kind {
  const b = Buffer.from(buf.buffer, buf.byteOffset, Math.min(buf.byteLength, 16));
  if (b.length < 12) return null;
  const ascii = (from: number, to: number) => b.toString('latin1', from, to);
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image'; // JPEG
  if (b.readUInt32BE(0) === 0x89504e47) return 'image'; // PNG
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image';
  if (ascii(0, 3) === 'GIF') return 'image';
  if (ascii(4, 8) === 'ftyp') return /^(avif|avis|heic|heix|mif1)/.test(ascii(8, 12)) ? 'image' : 'mp4';
  if (b.readUInt32BE(0) === 0x1a45dfa3) return 'webm';
  return null;
}

export class UploadError extends Error {}

const slug = (name: string) =>
  path.parse(name).name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 40) || 'file';

export async function saveUpload(name: string, data: Uint8Array): Promise<{ url: string; kind: 'image' | 'video' }> {
  const kind = sniff(data);
  if (!kind) throw new UploadError('Unsupported file. Use JPG, PNG, WebP, AVIF or GIF images, or MP4/WebM video.');
  if (kind === 'image' && data.byteLength > MAX_IMAGE_BYTES) throw new UploadError('Image is larger than 25 MB.');
  if (data.byteLength > MAX_VIDEO_BYTES) throw new UploadError('Video is larger than 150 MB.');

  mkdirSync(uploadsDir(), { recursive: true });
  const id = randomBytes(4).toString('hex');

  if (kind === 'image') {
    let out: Buffer;
    try {
      // Re-encoding drops metadata and anything that is not pixel data
      out = await sharp(data, { animated: true })
        .rotate()
        .resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new UploadError('That image could not be read.');
    }
    const file = `${slug(name)}-${id}.webp`;
    writeFileSync(path.join(uploadsDir(), file), out);
    return { url: `/uploads/${file}`, kind: 'image' };
  }

  const file = `${slug(name)}-${id}.${kind}`;
  writeFileSync(path.join(uploadsDir(), file), data);
  return { url: `/uploads/${file}`, kind: 'video' };
}

/** Absolute path of an uploaded file, or null if the name would escape the uploads folder. */
export function resolveUpload(name: string): string | null {
  if (!/^[\w][\w.-]*$/.test(name) || name.includes('..')) return null;
  const full = path.join(uploadsDir(), name);
  return path.dirname(full) === uploadsDir() && existsSync(full) ? full : null;
}

export const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export function listUploads(): { url: string; name: string; size: number; modified: string; kind: 'image' | 'video' }[] {
  if (!existsSync(uploadsDir())) return [];
  return readdirSync(uploadsDir())
    .filter((name) => MIME[path.extname(name)])
    .map((name) => {
      const stat = statSync(path.join(uploadsDir(), name));
      return {
        url: `/uploads/${name}`,
        name,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        kind: name.endsWith('.webp') ? ('image' as const) : ('video' as const),
      };
    })
    .sort((a, b) => b.modified.localeCompare(a.modified));
}

export function deleteUpload(name: string): boolean {
  const full = resolveUpload(name);
  if (!full) return false;
  unlinkSync(full);
  return true;
}
