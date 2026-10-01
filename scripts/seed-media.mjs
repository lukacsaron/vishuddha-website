// One-off: turns the original assets in legacy/ into the optimised seed media in public/media/.
// Re-run only if the legacy assets change. Needs ffmpeg on PATH for the hero poster.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const src = (...p) => path.join(root, 'legacy', ...p);
const out = (...p) => path.join(root, 'public', 'media', ...p);

for (const dir of ['', 'logos', 'work', 'services', 'team', 'icons']) {
  mkdirSync(out(dir), { recursive: true });
}

async function webp(from, to, { width, height, quality = 82 } = {}) {
  await sharp(from)
    .rotate()
    .resize({ width, height, fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toFile(to);
  const kb = (f) => Math.round(statSync(f).size / 1024);
  console.log(`${path.relative(root, to)}  ${kb(from)} KB -> ${kb(to)} KB`);
}

// Brand artwork
await webp(src('Vishuddha Logos', 'main_logo.png'), out('logo.webp'), { quality: 92 });
await webp(src('Vishuddha Logos', 'figure.png'), out('figure.webp'), { height: 220, quality: 90 });
await webp(src('icons', 'phone.png'), out('icons', 'phone.webp'), { height: 56, quality: 90 });
await webp(src('icons', 'mail.png'), out('icons', 'mail.webp'), { height: 48, quality: 90 });

// Client logos: shown at 150px tall at most, so 300px covers retina
const logos = ['atelier', 'betonhofi', 'budapestbagel', 'cirkusz', 'cuvee', 'delibab', 'delta',
  'medve', 'otp', 'petraflow', 'szinkor', 'theodora', 'trip'];
for (const name of logos) {
  await webp(src('Client logos', `${name}.png`), out('logos', `${name}.webp`), { height: 300, quality: 88 });
}

// Project stills: grid cells are ~600px wide on a large desktop
const work = { otp: 'ref-otp.png', medve: 'ref-medve.png', bagel: 'ref-bagel.png',
  theodora: 'ref-theodora.png', villa: 'ref-villa.png', nemoke: 'nemoke.jpg' };
for (const [name, file] of Object.entries(work)) {
  await webp(src('references', file), out('work', `${name}.webp`), { width: 1280 });
}

// Service photos fill half the viewport
await webp(src('services', 'film_production.jpg'), out('services', 'film.webp'), { width: 1800 });
await webp(src('services', 'marketing.jpg'), out('services', 'marketing.webp'), { width: 1800 });

await webp(src('team', 'niki.jpg'), out('team', 'niki.webp'), { width: 1200 });
await webp(src('team', 'balazs.jpg'), out('team', 'balazs.webp'), { width: 1200 });

// Hero video as-is, plus a poster frame so the hero is not black while it buffers
const video = src('showreel', 'Theodora Calcia Plus 2026 30s.mp4');
copyFileSync(video, out('hero.mp4'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1', '-i', video, '-frames:v', '1',
  '-vf', 'scale=1600:-2', out('hero-poster.png')]);
await webp(out('hero-poster.png'), out('hero-poster.webp'), { quality: 70 });
execFileSync('rm', [out('hero-poster.png')]);

// Social share image: the logo on brand blue, 1200x630
const logo = await sharp(src('Vishuddha Logos', 'main_logo.png')).resize({ width: 640 }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#002fa7' } })
  .composite([{ input: logo, gravity: 'centre' }])
  .jpeg({ quality: 88 })
  .toFile(out('og-image.jpg'));
console.log('public/media/og-image.jpg written');
