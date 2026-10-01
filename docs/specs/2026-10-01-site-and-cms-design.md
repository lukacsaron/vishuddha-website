# Design — Vishuddha site and CMS

> Later on 2026-10-01 the contact form was removed at the owner's request: the
> contact section now shows the email address and phone number only. The
> enquiry storage, `/api/contact` and SMTP notification described below no
> longer exist. The rest stands.

See `GOAL.md` for the goal and `docs/decisions/0001-framework-and-cms.md` for why
Astro + a custom file-backed CMS.

## Layout of the repo

```
legacy/                 original static site, untouched, the visual reference
public/media/           seed media (optimised copies of the legacy assets)
scripts/seed-media.mjs  one-off: legacy assets -> public/media (webp, poster, og image)
src/cms/
  schema.ts             zod schema + TS types for the content document
  seed.ts               initial content (EN from index.html, HU from the .bak)
  fields.ts             admin form descriptor (sections, fields, lists)
  store.ts              read / save / history / restore, DATA_DIR on disk
  media.ts              upload processing, listing, deletion, safe path resolution
  auth.ts               password check, signed session cookie, login rate limit
  enquiries.ts          contact validation, storage, rate limit
  mail.ts               optional SMTP notification
  text.ts               tiny helpers: line breaks, inline links, legal markdown
  env.ts                the only place that reads environment variables
src/components/         one component per section of the page
src/layouts/Base.astro  <head>, SEO, JSON-LD, preloader, scripts
src/pages/              /, /hu/, legal pages, sitemap, robots, uploads, admin, api
src/scripts/site.js     the original page script, ported
src/styles/site.css     the original stylesheet, ported verbatim
src/admin/              admin client app (vanilla TS) + its stylesheet
tests/                  vitest
```

## Content model

One JSON document. Translatable strings are `{ en, hu }`. A line break in a title is
a newline in the string.

- `settings`: `siteUrl`, `huEnabled`
- `seo`: `title`, `description`, `keywords` (localised), `ogImage`
- `contact`: `phone`, `email`
- `social`: `instagram`, `facebook`, `linkedin` (icon hidden when empty)
- `nav`: labels for Services / Work / Team / Contact
- `hero`: `video`, `poster`, `eyebrow`, `staticWord`, `words[]`, `sub`, `cta`
- `brands`: `label`, `logos[] { name, image, size: md|sm|xs }`
- `intro`: `label`, `title`, `body`
- `services[] { anchor, label, title, body, image, imageAlt, focus }`
  (alternating layout is by position; no image renders the dashed placeholder)
- `work`: `label`, `title`, `projects[] { client, service, image }`
- `gallery`: `toggle`, `tiles[] { type: video|image|placeholder, youtube, image, label, size }`
- `team`: `label`, `title`, `members[] { name, role, bio, photo, focus }`
- `form`: heading, body, field labels and placeholders, service options, consent
  text (supports `[text](url)`), submit label, success and error messages
- `footer`: column headings, service links, company links, copyright
- `legal`: `privacy` and `terms`, each `{ title, body }` (markdown)
- `wip`: texts of the Hungarian placeholder page

## Storage

`DATA_DIR` (default `./data`): `content.json`, `history/*.json` (last 30),
`uploads/`, `enquiries.json`. If `content.json` is absent the seed is served, so a
fresh checkout works with no setup. Reads deep-merge the stored document over the
seed before validating, so adding a field in a later release never breaks old data.
Writes validate, snapshot the previous version to history, then write atomically
(temp file + rename). Each document carries a `rev`; a save with a stale `rev` is
rejected with 409 so two editors cannot overwrite each other unknowingly.

## Public routes

| Route | Behaviour |
|---|---|
| `/` | English site |
| `/hu/` | Hungarian site if `huEnabled`, otherwise the placeholder (noindex). A signed-in admin always sees the full page, as a preview |
| `/privacy`, `/terms`, `/hu/privacy`, `/hu/terms` | Legal pages; noindex while the body is empty |
| `/uploads/*` | Uploaded media, immutable cache, HTTP range support for video |
| `/sitemap.xml`, `/robots.txt` | Generated from settings |
| `/index.html`, `/hu.html` | 301 to `/` and `/hu/` |
| `POST /api/contact` | Validates, stores, notifies |

## Admin

`/admin/login` posts a password. `/admin` is one client app with a sidebar: content
sections generated from `fields.ts`, then Enquiries, Media, History. Translatable
fields show EN and HU side by side. Lists support add, remove, move up/down. Media
fields upload on select and show a preview.

API under `/api/admin/*`: `content` (GET, PUT), `upload` (POST), `media`
(GET, DELETE), `history` (GET, POST restore), `enquiries` (GET, PATCH, DELETE),
`export` (GET).

## Security

- `ADMIN_PASSWORD` from the environment; compared in constant time. Login refuses
  to work if it is unset.
- Session: `HttpOnly`, `SameSite=Lax`, `Secure` in production, HMAC-SHA256 signed,
  7-day expiry. Secret from `SESSION_SECRET`, falling back to a key derived from
  the password.
- Middleware guards `/admin/*` and `/api/admin/*`, and rejects any state-changing
  request whose `Origin` host differs from the request host.
- Login: 5 failures per IP per 15 minutes. Contact: 5 submissions per IP per hour,
  plus a honeypot field.
- Uploads: type decided by magic bytes, not by filename or declared MIME. Images are
  re-encoded through sharp (which strips anything that is not an image); SVG is
  refused. Video is limited to mp4/webm and 150 MB. Stored names are generated.
  Serving resolves the path and refuses anything outside `uploads/`.
- Content strings are escaped by Astro. Legal markdown and the consent link come
  from the admin and are rendered through an escaping renderer.

## Fidelity rules

The stylesheet and script are ported verbatim; the only deliberate differences from
`legacy/index.html` are listed in `docs/PM.md` under "Deviations".

## Testing

Vitest: seed validates; every field path in `fields.ts` exists in the seed; store
save / history / restore / stale-rev; session sign, tamper, expiry; rate limiter;
contact validation; upload sniffing; path traversal; text renderers. Then a smoke
test against the built server with curl, and a side-by-side browser check against
the legacy page at desktop and mobile widths.
