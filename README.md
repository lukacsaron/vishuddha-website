# Vishuddha Productions website

The one-page site for Vishuddha Productions, with a built-in admin for editing its
content. Astro 7 on Node, no database: content is one JSON file on disk.

- Why it is built this way: `docs/decisions/0001-framework-and-cms.md`
- How it is put together: `docs/specs/2026-10-01-site-and-cms-design.md`
- Project log, deviations from the original, open items: `docs/PM.md`
- The original hand-written site, kept as the visual reference: `legacy/`

## Run it

Needs Node 22.12 or newer.

```sh
npm install
cp .env.example .env      # then set ADMIN_PASSWORD
npm run dev               # http://localhost:4321, admin at /admin
```

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npm start` | Runs the built server (reads `.env` if present) |
| `npm test` | Unit tests |
| `npm run check` | Type check |
| `npm run seed:media` | Regenerates `public/media/` from `legacy/` (needs ffmpeg) |

## Editing content

Sign in at `/admin` with the admin password. Pick a section on the left, change it,
press **Save changes** (or Ctrl/Cmd+S). The site updates immediately.

- Every text has an English and a Hungarian box.
- Lists (logos, projects, gallery tiles, team…) can be reordered with the arrows.
- Images are resized and converted to WebP on upload. Video must be MP4 or WebM.
- **History** keeps the last 30 versions and can restore any of them.
- **Enquiries** lists what visitors sent through the contact form.
- **Coming soon page** hides the whole site behind one notice until you switch it
  off. Signed in, you still see the real site.
- The Hungarian site is switched on under **Settings**. While it is off, `/hu/`
  shows the "work in progress" page to visitors; signed in, you see a preview.

## Configuration

Set through environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Required. The admin password. Sign-in is refused while it is unset. |
| `SESSION_SECRET` | Optional signing key for sessions. Defaults to one derived from the password. |
| `DATA_DIR` | Where content, uploads, history and enquiries are stored. Default `./data`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `NOTIFY_TO` | Optional. Emails each enquiry. Without `SMTP_HOST`, enquiries are only stored. |
| `TRUST_PROXY` | `1` behind a reverse proxy (the Docker setup sets it), so rate limits see the visitor's address. |
| `HOST`, `PORT` | Where the server listens. |

## Deploying

The site needs a Node process and a disk that survives deploys, so it cannot go on
static hosting. It is set up for Coolify with the Docker Compose build pack; the
data volume is declared in `docker-compose.yml`.

- Step by step, backups, restore, troubleshooting: `docs/deploy-coolify.md`
- Why compose and a named volume: `docs/decisions/0002-coolify-deployment.md`

To run the production container locally:

```sh
ADMIN_PASSWORD=something docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

**Back up the data.** The admin's History page downloads everything (texts, uploads,
history, enquiries) as one `.tar.gz`.

## Where things are

```
src/cms/         content schema, seed, storage, auth, media, enquiries
src/components/  one component per section of the page
src/pages/       routes: /, /hu/, legal pages, /admin, /api/*
src/admin/       the admin's client code and styles
src/styles/site.css, src/scripts/site.js   the original stylesheet and script, ported
```

To add an editable field: add it to `src/cms/schema.ts`, give it a default in
`src/cms/seed.ts`, describe its form control in `src/cms/fields.ts`, and use it in a
component. The tests fail if the three disagree.
