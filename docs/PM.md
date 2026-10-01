# PM — Vishuddha site + CMS

Goal: `GOAL.md`. Decision: `docs/decisions/0001-framework-and-cms.md`.
Design: `docs/specs/2026-10-01-site-and-cms-design.md`.

## Milestones

| # | Milestone | Status |
|---|---|---|
| 0 | Read and inventory `index.html`, `hu.html`, the `.bak`, all assets | done |
| 1 | Goal prompt, git repo, legacy import | done |
| 2 | Architecture decision, design spec, plan, plan review | done |
| 3 | Scaffold Astro 7 + Node adapter, seed media pipeline | done |
| 4 | Content schema, seed (EN + HU), store with history | done |
| 5 | Public site port: layout, all sections, script, legal pages, HU placeholder | done |
| 6 | Auth, middleware, admin API, uploads | done |
| 7 | Admin UI: content editor, enquiries, media, history | done |
| 8 | Contact endpoint, SMTP notification | done |
| 9 | SEO: meta, JSON-LD, sitemap, robots, redirects | done |
| 10 | Tests, build, smoke test, browser comparison with legacy | done |
| 11 | Dockerfile, README, final review | done |

## Plan (build order)

1. `npm init`, install astro, @astrojs/node, zod, sharp, marked, nodemailer,
   @fontsource-variable/montserrat, vitest. `astro.config.mjs` with server output,
   standalone node adapter, redirects.
2. `scripts/seed-media.mjs`: convert legacy assets to webp into `public/media/`,
   extract hero poster with ffmpeg, compose a 1200×630 OG image from the logo.
3. `src/cms/schema.ts`, `seed.ts`, `text.ts`, `store.ts` + tests.
4. `src/styles/site.css` (verbatim), `src/scripts/site.js` (ported),
   `Base.astro`, section components, `Home.astro`, `/` and `/hu/`.
5. Legal pages, placeholder page, sitemap, robots.
6. `env.ts`, `auth.ts`, `middleware.ts`, login/logout + tests.
7. `media.ts`, upload and `/uploads/*` serving + tests.
8. `enquiries.ts`, `mail.ts`, `/api/contact` + tests; wire the form script.
9. Admin API routes, `fields.ts`, admin client app and styles.
10. Build, smoke test, browser comparison, fix differences.
11. Dockerfile, `.env.example`, README. Final review against `GOAL.md`.

## Plan review (done before building)

Problems found in the first draft of the plan and what changed:

- **Two editors can overwrite each other.** Added a `rev` on the document and a
  409 on stale saves.
- **Disk storage has no backup story.** Added version history, restore, and an
  export endpoint; README documents backing up `DATA_DIR`.
- **Uploaded video would not play in Safari** without HTTP range support on the
  serving route. Added to the design.
- **Schema drift.** A later release adding a field would fail validation on old
  data. Reads now deep-merge stored content over the seed first.
- **Two sources of truth** (zod schema and admin form descriptor) can drift. A test
  asserts every descriptor path resolves in the seed.
- **Preact for the admin was dropped.** A schema-driven vanilla TS form is small,
  and it removes a dependency whose compatibility with Astro 7 would need checking.
- **Google Fonts hotlink** is a GDPR exposure for an EU business; self-host
  Montserrat via fontsource instead.
- **Env handling.** Astro ≥6 no longer maps `import.meta.env` to `process.env`;
  all env access goes through `src/cms/env.ts` reading `process.env`.

## Judgment calls (review these)

1. Astro + custom file CMS rather than Next or a third-party CMS. See the ADR.
2. Hungarian site ships **disabled**, showing today's placeholder. The translation
   from the `.bak` is loaded into the HU fields so it can be reviewed and switched
   on in Settings. It was written for an older design, so some HU fields that had
   no source (project service names, gallery labels, a few labels) were translated
   by me and are marked below.
3. One shared admin password instead of user accounts.
4. Saves go live immediately; rollback via History instead of drafts.
5. Admin UI is in English.

## Verification (2026-10-01)

- `npm test`: 52 tests pass. `npm run check`: 0 errors. `npm run build`: clean.
- Layout compared against `legacy/index.html` in Chrome at 1440, 1000 and 390 px:
  position, size, font and colour of ~300 elements across 46 selectors. Identical
  at 1440 and 1000; at 390 three elements differ by 1 px of rounding. Page heights equal.
- Behaviour checked in the browser: preloader, rolling words, gallery toggle,
  lightbox open/close, active nav, scroll progress, custom select, form validation,
  real form submission, thank-you state.
- Admin checked in the browser: sign-in, editing with focus kept, list reorder,
  validation message on a bad value, save, public page updated, Hungarian switch,
  history restore, stale-save rejection (409).
- Against the built server with curl: redirects, cross-site POST refused (403),
  login rate limit, image and video upload, 80 MB upload, HTTP range requests,
  non-media upload refused, security headers.
- **Not verified:** the Docker image (Docker was not running on this machine);
  SMTP delivery (no mail server configured); Safari and real phones.

## Deviations from `legacy/index.html`

Deliberate, all small:

1. Facebook and LinkedIn footer icons are hidden until a link is entered (they
   pointed at `#`).
2. The Photography section shows the dashed placeholder box instead of a broken
   image (`services/photography.png` was never in the folder).
3. Privacy and Terms links go to real pages (`/privacy`, `/terms`) that say they
   are being prepared, instead of dead `#privacy` / `#terms` anchors.
4. The contact form really sends, and shows an error if sending fails.
5. Montserrat is self-hosted instead of loaded from Google Fonts (GDPR, speed).
6. Images are WebP at display size: seed media went from ~41 MB to 6.2 MB, of
   which the hero video is 4.4 MB. The hero has a poster frame while the video loads.
7. Social share image and favicon now exist (logo on brand blue); the original
   referenced an `og-image.jpg` and `logo.png` that were missing.
8. The `hreflang="hu"` tag is only emitted while the Hungarian site is live.
9. Copyright year is automatic. A `<noscript>` rule keeps the page visible without JS.
10. Unused CSS from the original (stats band, service cards) was kept, untouched.

## Open items for the owners

1. **Photography photo**: upload one under Services.
2. **Privacy Policy and Terms**: paste the texts under Legal pages. The form's
   consent line links to the Privacy Policy, so this should precede launch.
3. **Hungarian texts**: review, then switch on in Settings. Came from the old
   translation; these had no source and were translated by me: menu labels,
   hero button, gallery button and tile captions, project service names, form
   error messages, "Legal" heading, legal page titles. Nikolett's Hungarian bio
   is a different text from the English one (it was that way in the source).
4. **Facebook / LinkedIn links**, if they exist.
5. **Gallery**: 24 of 29 tiles are still empty placeholders, as in the original.
   Fill or delete them.
6. **Hosting**: needs a Node/container host with a persistent volume; choose one,
   set `ADMIN_PASSWORD`, and optionally SMTP for enquiry emails.
7. The seed still contains "Budapest-based creative agency" in the SEO description
   and "micro-production company" on the page, as the original did.
