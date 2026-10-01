# ADR 0001 — Framework and CMS

Date: 2026-10-01. Status: accepted.

## What the site actually is

One long page in two languages plus two legal pages. Almost no client state: a few
vanilla scripts (preloader, rolling words, lightbox, form). About 60 editable strings
per language, five repeating lists (logos, services, projects, gallery tiles, team),
around 30 media files. Two non-technical editors. The contact form needs a server,
because today it throws submissions away.

## Framework: Astro vs Next

| | Astro 7 | Next 16 |
|---|---|---|
| Porting the page | The existing HTML, CSS and vanilla JS drop into `.astro` components almost verbatim | Every section becomes a React component; the vanilla scripts must be rewritten as effects or kept as an awkward inline script |
| JS shipped to visitors | Only the site's own ~6 KB script | React runtime + hydration for a page that has nothing to hydrate |
| Server needs (form, admin API, uploads) | Endpoints + middleware with the Node adapter | Route handlers + middleware, equally fine |
| Admin UI | No component framework built in; fine for a schema-driven form | React is a real advantage for a rich admin |
| Ecosystem CMSs | Keystatic, Decap, Sanity, Storyblok… | All of those plus Payload (Next-native) |

Next only wins if the admin is a large React app or if we adopt Payload. Neither is
justified for a one-page site. **Astro**, server output, `@astrojs/node` standalone.

## CMS: options considered

1. **Payload (Next + Postgres/SQLite).** Excellent admin, but it brings a database,
   a migration story and a framework switch for 60 strings. Rejected: too heavy.
2. **Sanity / Storyblok / Contentful.** Polished and hosted, but needs a SaaS account,
   has a pricing cliff, and content lives outside the project. Violates "no SaaS
   account needed to run or edit". Rejected.
3. **Git-based: Keystatic / Decap / Sveltia.** Content in the repo, free static
   hosting, history for free. But editing in production needs a GitHub repo, a GitHub
   App/OAuth proxy and GitHub accounts for the editors; every save is a commit and a
   1–2 minute rebuild; media uploads bloat git; and the contact form still needs a
   server or a third-party form service. Strong runner-up; rejected because it moves
   complexity to accounts and build pipelines the owners would have to understand.
4. **Custom file-backed CMS inside the Astro app.** One JSON document validated by a
   schema, uploads on disk, a schema-driven admin at `/admin`, same process handles
   the contact form. No accounts, no database, saves are live instantly, backup is
   copying one folder. Costs: we own auth and the admin code (~1,500 lines), and the
   host must run Node with a persistent disk (no pure-static hosting).

## Decision

**Astro 7 (SSR, Node adapter) + custom file-backed CMS (option 4).**

The server is needed anyway for the contact form, which removes the main advantage
of the git-based route (static hosting). What remains is a trade between owning a
small amount of code and depending on third-party accounts; for two non-technical
editors the first is the smaller burden.

Risk controls for owning the code: content validated with zod on every read and
write; atomic writes; 30-version history with rollback; optimistic concurrency so
two editors cannot silently overwrite each other; export endpoint for backups;
auth and store covered by tests.

## Consequences

- Deploy target must be a Node host or container with a volume mounted at `DATA_DIR`
  (Coolify, Fly, Railway, a VPS). Not Vercel/Netlify/Cloudflare Pages static.
- No draft/preview workflow: a save is live. History rollback is the safety net.
- One shared admin password, not per-user accounts. Revisit if the team grows.
- Storage is behind `src/cms/store.ts`; swapping it for SQLite or S3 later touches
  that module only.
