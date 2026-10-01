import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { UploadError, deleteUpload, listUploads, resolveUpload, saveUpload, sniff, uploadsDir } from '../src/cms/media';

const png = () => sharp({ create: { width: 3000, height: 1000, channels: 3, background: '#dc443a' } }).png().toBuffer();

describe('sniff', () => {
  it('recognises files by content', async () => {
    expect(sniff(await png())).toBe('image');
    expect(sniff(Buffer.from('\x00\x00\x00\x20ftypisom\x00\x00\x02\x00', 'latin1'))).toBe('mp4');
    expect(sniff(Buffer.from('\x00\x00\x00\x20ftypavif\x00\x00\x00\x00', 'latin1'))).toBe('image');
    expect(sniff(Buffer.from('\x1a\x45\xdf\xa3\x00\x00\x00\x00\x00\x00\x00\x00', 'latin1'))).toBe('webm');
  });

  it('refuses SVG, HTML, scripts and tiny files', () => {
    expect(sniff(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(sniff(Buffer.from('<!doctype html><html></html>'))).toBeNull();
    expect(sniff(Buffer.from('GI'))).toBeNull();
  });
});

describe('saveUpload', () => {
  it('re-encodes an image to webp, capped at 2400px, under a generated name', async () => {
    const { url, kind } = await saveUpload('Év végi FOTÓ (1).PNG', await png());
    expect(kind).toBe('image');
    expect(url).toMatch(/^\/uploads\/ev-vegi-foto-1-[0-9a-f]{8}\.webp$/);
    const meta = await sharp(readFileSync(path.join(uploadsDir(), path.basename(url)))).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(2400);
  });

  it('ignores a misleading file name', async () => {
    await expect(saveUpload('photo.png', Buffer.from('<script>alert(1)</script> padding'))).rejects.toThrow(UploadError);
    const { url } = await saveUpload('evil.html', await png());
    expect(url.endsWith('.webp')).toBe(true);
  });

  it('refuses a file that only starts like an image', async () => {
    const fake = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('not really a jpeg at all')]);
    await expect(saveUpload('x.jpg', fake)).rejects.toThrow('could not be read');
  });
});

describe('resolveUpload', () => {
  it('finds uploaded files and nothing else', async () => {
    const { url } = await saveUpload('a.png', await png());
    const name = path.basename(url);
    expect(resolveUpload(name)).toBe(path.join(uploadsDir(), name));
    for (const bad of ['../content.json', '..', '', 'a/b.webp', '.hidden', 'missing.webp', '%2e%2e/content.json', name + '\0']) {
      expect(resolveUpload(bad), bad).toBeNull();
    }
  });

  it('lists and deletes', async () => {
    const { url } = await saveUpload('to-delete.png', await png());
    const name = path.basename(url);
    expect(listUploads().map((f) => f.name)).toContain(name);
    expect(deleteUpload(name)).toBe(true);
    expect(existsSync(path.join(uploadsDir(), name))).toBe(false);
    expect(deleteUpload(name)).toBe(false);
  });
});
