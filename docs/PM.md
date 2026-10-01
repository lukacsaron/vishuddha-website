# PM — Vishuddha site + CMS

Goal: `GOAL.md`. Decision: `docs/decisions/0001-framework-and-cms.md`.
Design: `docs/specs/2026-10-01-site-and-cms-design.md`.

## Milestones

| # | Milestone | Status |
|---|---|---|
| 0 | Read and inventory `index.html`, `hu.html`, the `.bak`, all assets | done |
| 1 | Goal prompt, git repo, legacy import | done |
| 2 | Architecture decision, design spec, plan, plan review | done |
| 3 | Scaffold Astro 7 + Node adapter, seed media pipeline | todo |
| 4 | Content schema, seed (EN + HU), store with history | todo |
| 5 | Public site port: layout, all sections, script, legal pages, HU placeholder | todo |
| 6 | Auth, middleware, admin API, uploads | todo |
| 7 | Admin UI: content editor, enquiries, media, history | todo |
| 8 | Contact endpoint, SMTP notification | todo |
| 9 | SEO: meta, JSON-LD, sitemap, robots, redirects | todo |
| 10 | Tests, build, smoke test, browser comparison with legacy | todo |
| 11 | Dockerfile, README, final review | todo |

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

## Deviations from `legacy/index.html`

Filled in as the build goes.

## Open items for the owners

Filled in as the build goes.
