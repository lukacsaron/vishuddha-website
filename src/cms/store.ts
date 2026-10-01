// Content storage: one JSON document on disk, with version history.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentSchema, type Content } from './schema';
import { seed } from './seed';
import { env } from './env';

const HISTORY_LIMIT = 30;

const file = () => path.join(env.dataDir, 'content.json');
const historyDir = () => path.join(env.dataDir, 'history');

export class StaleRevisionError extends Error {}
export class InvalidContentError extends Error {
  constructor(public issues: { path: string; message: string }[]) {
    super('Content failed validation');
  }
}

/**
 * Stored content laid over the seed, so a field added in a later release gets its
 * default instead of failing validation. Arrays are taken whole from stored content.
 */
export function overlay(base: unknown, stored: unknown): unknown {
  if (Array.isArray(base) || Array.isArray(stored)) return stored ?? base;
  if (base && stored && typeof base === 'object' && typeof stored === 'object') {
    const out: Record<string, unknown> = { ...(base as object) };
    for (const [k, v] of Object.entries(stored)) out[k] = overlay((base as Record<string, unknown>)[k], v);
    return out;
  }
  return stored ?? base;
}

const revOf = (content: Content) => createHash('sha1').update(JSON.stringify(content)).digest('hex').slice(0, 12);

function validate(raw: unknown): Content {
  const parsed = contentSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidContentError(parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  return parsed.data;
}

let cache: { mtimeMs: number; content: Content; rev: string } | null = null;

export function getContent(): Content {
  return read().content;
}

export function read(): { content: Content; rev: string } {
  if (!existsSync(file())) return { content: seed, rev: revOf(seed) };
  const mtimeMs = statSync(file()).mtimeMs;
  if (cache?.mtimeMs !== mtimeMs) {
    let content: Content;
    try {
      // Unknown keys from an older release are dropped by the schema
      content = validate(overlay(seed, JSON.parse(readFileSync(file(), 'utf8'))));
    } catch (err) {
      // A corrupt file must not take the public site down; serve the seed and say why
      console.error(`[cms] ${file()} is unreadable, serving seed content:`, err);
      content = seed;
    }
    cache = { mtimeMs, content, rev: revOf(content) };
  }
  return { content: cache.content, rev: cache.rev };
}

export function save(next: unknown, baseRev?: string): { content: Content; rev: string } {
  const current = read();
  if (baseRev && baseRev !== current.rev) throw new StaleRevisionError();
  const content = validate(next);

  mkdirSync(historyDir(), { recursive: true });
  // Snapshot what is being replaced, so History always holds the previous state
  writeFileSync(path.join(historyDir(), `${stamp()}.json`), JSON.stringify(current.content, null, 2));
  prune();

  const tmp = `${file()}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(content, null, 2));
  renameSync(tmp, file());
  cache = null;
  return read();
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

function prune() {
  const all = readdirSync(historyDir()).filter((f) => f.endsWith('.json')).sort();
  for (const f of all.slice(0, Math.max(0, all.length - HISTORY_LIMIT))) unlinkSync(path.join(historyDir(), f));
}

export function listHistory(): { id: string; savedAt: string }[] {
  if (!existsSync(historyDir())) return [];
  return readdirSync(historyDir())
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse()
    .map((f) => {
      const id = f.slice(0, -5);
      // 2026-10-01T12-30-00-000Z -> 2026-10-01T12:30:00.000Z
      const savedAt = id.replace(/T(\d\d)-(\d\d)-(\d\d)-(\d+)Z$/, 'T$1:$2:$3.$4Z');
      return { id, savedAt };
    });
}

export function restore(id: string): { content: Content; rev: string } {
  if (!/^[\w-]+$/.test(id)) throw new Error('Bad history id');
  const snapshot = JSON.parse(readFileSync(path.join(historyDir(), `${id}.json`), 'utf8'));
  return save(overlay(seed, snapshot));
}
