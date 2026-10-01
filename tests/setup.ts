// Each test file gets its own empty data directory and a known password.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), 'vp-test-'));
process.env.ADMIN_PASSWORD = 'correct horse';
delete process.env.SESSION_SECRET;
