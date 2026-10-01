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
| `HOST`, `PORT` | Where the server listens. |

## Deploying

The site needs a Node process and a disk that survives restarts, so it cannot go on
static hosting. Any container host works (Coolify, Fly, Railway, a VPS).

```sh
docker build -t vishuddha .
docker run -d -p 4321:4321 -v vishuddha-data:/data -e ADMIN_PASSWORD=... vishuddha
```

Put it behind a reverse proxy that terminates HTTPS and forwards the `Host` (or
`X-Forwarded-Host`) and `X-Forwarded-Proto` headers. The admin's cross-site check
compares the request's `Origin` with that host, so a proxy that rewrites `Host`
without setting `X-Forwarded-Host` will make saving fail with "Cross-site request refused".

**Back up `DATA_DIR`.** It holds everything edited or uploaded since launch. The
admin's History page also offers a download of the current content.

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
