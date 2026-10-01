import { describe, expect, it } from 'vitest';
import { contentSchema } from '../src/cms/schema';
import { seed } from '../src/cms/seed';
import { sections, type Field } from '../src/cms/fields';

const get = (obj: any, key: string) => key.split('.').reduce((o, k) => o?.[k], obj);

describe('seed', () => {
  it('is valid content', () => {
    expect(contentSchema.safeParse(seed).success).toBe(true);
  });

  it('has Hungarian text wherever it has English text', () => {
    const missing: string[] = [];
    const walk = (node: any, path: string) => {
      if (node && typeof node === 'object') {
        if ('en' in node && 'hu' in node && typeof node.en === 'string') {
          if (node.en && !node.hu) missing.push(path);
        } else for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
      }
    };
    walk(seed, 'seed');
    expect(missing).toEqual([]);
  });
});

describe('admin form descriptor', () => {
  // Checks a field against a sample of the data it edits
  const check = (field: Field, owner: any, where: string) => {
    const value = get(owner, field.key);
    expect(value, `${where}${field.key} is missing from the content`).not.toBeUndefined();
    if (field.type === 'ltext' || field.type === 'ltextarea') expect(Object.keys(value).sort()).toEqual(['en', 'hu']);
    if (field.type === 'bool') expect(typeof value).toBe('boolean');
    if (field.type === 'select') expect(field.options.map((o) => o.value)).toContain(value);
    if (field.type === 'list') {
      expect(Array.isArray(value)).toBe(true);
      // The blank entry must have exactly the shape of a real entry
      expect(Object.keys(field.blank).sort()).toEqual(Object.keys(value[0]).sort());
      for (const sub of field.fields) check(sub, value[0], `${where}${field.key}[0].`);
      expect(field.blank).toHaveProperty(field.titleKey);
    }
  };

  it('only refers to fields that exist', () => {
    for (const section of sections) for (const field of section.fields) check(field, seed, '');
  });

  it('covers every top-level part of the content', () => {
    const covered = new Set(sections.flatMap((s) => s.fields.map((f) => f.key.split('.')[0])));
    expect([...covered].sort()).toEqual(Object.keys(seed).sort());
  });

  it('adding a blank entry to any list still validates', () => {
    for (const section of sections) {
      for (const field of section.fields) {
        if (field.type !== 'list') continue;
        const copy = structuredClone(seed);
        get(copy, field.key).push(structuredClone(field.blank));
        const result = contentSchema.safeParse(copy);
        expect(result.success, `${field.key}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
      }
    }
  });
});

describe('schema', () => {
  const withChange = (change: (c: any) => void) => {
    const copy = structuredClone(seed);
    change(copy);
    return contentSchema.safeParse(copy).success;
  };

  it('rejects script-capable and protocol-relative links', () => {
    expect(withChange((c) => { c.social.facebook = 'javascript:alert(1)'; })).toBe(false);
    expect(withChange((c) => { c.hero.video = '//evil.test/x.mp4'; })).toBe(false);
    expect(withChange((c) => { c.social.facebook = 'https://facebook.com/x'; })).toBe(true);
  });

  it('rejects a site address with a trailing slash or path', () => {
    expect(withChange((c) => { c.settings.siteUrl = 'https://example.com/'; })).toBe(false);
  });

  it('rejects a YouTube URL where an ID is expected', () => {
    expect(withChange((c) => { c.gallery.tiles[0].youtube = 'https://youtu.be/lL5rxe1mWgQ'; })).toBe(false);
  });
});
