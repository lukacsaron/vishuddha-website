import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { InvalidContentError, StaleRevisionError, listHistory, overlay, read, restore, save } from '../src/cms/store';
import { seed } from '../src/cms/seed';

const dir = process.env.DATA_DIR!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('store', () => {
  it('serves the seed when nothing has been saved', () => {
    expect(existsSync(path.join(dir, 'content.json'))).toBe(false);
    expect(read().content).toEqual(seed);
  });

  it('saves, reads back and keeps the replaced version in history', async () => {
    const before = read();
    const next = structuredClone(before.content);
    next.contact.phone = '+36 1 111 1111';
    const saved = save(next, before.rev);

    expect(saved.rev).not.toBe(before.rev);
    expect(read().content.contact.phone).toBe('+36 1 111 1111');
    expect(listHistory()).toHaveLength(1);

    await sleep(5);
    restore(listHistory()[0].id);
    expect(read().content.contact.phone).toBe(seed.contact.phone);
    // Restoring is itself a save, so it can be undone
    expect(listHistory()).toHaveLength(2);
  });

  it('refuses a save based on a stale revision', () => {
    const { content } = read();
    expect(() => save(content, 'not-the-current-rev')).toThrow(StaleRevisionError);
  });

  it('refuses invalid content and leaves the stored content alone', () => {
    const before = read();
    const bad = structuredClone(before.content) as any;
    bad.hero.words = [];
    bad.social.instagram = 'javascript:alert(1)';
    try {
      save(bad, before.rev);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidContentError);
      expect((err as InvalidContentError).issues.map((i) => i.path).sort()).toEqual(['hero.words', 'social.instagram']);
    }
    expect(read().rev).toBe(before.rev);
  });

  it('keeps at most 30 history entries', async () => {
    for (let i = 0; i < 34; i++) {
      const current = read();
      const next = structuredClone(current.content);
      next.contact.phone = `+36 1 000 00${i}`;
      save(next, current.rev);
      await sleep(2);
    }
    expect(readdirSync(path.join(dir, 'history'))).toHaveLength(30);
  });

  it('fills in fields that an older stored document does not have', async () => {
    const old = structuredClone(read().content) as any;
    delete old.wip;
    delete old.hero.cta;
    old.contact.phone = 'kept';
    await sleep(5);
    writeFileSync(path.join(dir, 'content.json'), JSON.stringify(old));
    const { content } = read();
    expect(content.wip).toEqual(seed.wip);
    expect(content.hero.cta).toEqual(seed.hero.cta);
    expect(content.contact.phone).toBe('kept');
  });

  it('serves the seed instead of crashing when the file is corrupt', async () => {
    await sleep(5);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'content.json'), '{ not json');
    expect(read().content).toEqual(seed);
  });
});

describe('overlay', () => {
  it('takes stored arrays whole rather than merging them with the seed', () => {
    expect(overlay({ list: [1, 2, 3], a: { b: 1, c: 2 } }, { list: [9], a: { b: 5 } }))
      .toEqual({ list: [9], a: { b: 5, c: 2 } });
  });
});
