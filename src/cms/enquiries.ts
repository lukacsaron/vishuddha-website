// Contact form submissions: validation and storage.
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { env } from './env';
import { RateLimiter } from './auth';

const MAX_STORED = 2000;

// Same rules as the browser-side check in src/scripts/site.js
export const enquirySchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(60).refine((v) => v.replace(/\D/g, '').length >= 7),
  company: z.string().trim().min(1).max(200),
  email: z.string().trim().max(200).regex(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/),
  service: z.string().trim().min(1).max(60),
  message: z.string().trim().max(5000).default(''),
  consent: z.union([z.literal('on'), z.literal(true)]),
  lang: z.enum(['en', 'hu']).default('en'),
});

export type Enquiry = Omit<z.infer<typeof enquirySchema>, 'consent'> & {
  id: string;
  receivedAt: string;
  read: boolean;
};

export const contactLimiter = new RateLimiter(5, 60 * 60 * 1000);

const file = () => path.join(env.dataDir, 'enquiries.json');

export function listEnquiries(): Enquiry[] {
  if (!existsSync(file())) return [];
  return JSON.parse(readFileSync(file(), 'utf8'));
}

function write(all: Enquiry[]) {
  mkdirSync(env.dataDir, { recursive: true });
  const tmp = `${file()}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(all, null, 2));
  renameSync(tmp, file());
}

export function addEnquiry(input: z.infer<typeof enquirySchema>): Enquiry {
  const { consent: _consent, ...fields } = input;
  const enquiry: Enquiry = { ...fields, id: randomUUID(), receivedAt: new Date().toISOString(), read: false };
  write([enquiry, ...listEnquiries()].slice(0, MAX_STORED));
  return enquiry;
}

export function setRead(id: string, read: boolean): boolean {
  const all = listEnquiries();
  const found = all.find((e) => e.id === id);
  if (!found) return false;
  found.read = read;
  write(all);
  return true;
}

export function deleteEnquiry(id: string): boolean {
  const all = listEnquiries();
  const rest = all.filter((e) => e.id !== id);
  if (rest.length === all.length) return false;
  write(rest);
  return true;
}
