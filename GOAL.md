# Goal prompt — Vishuddha Productions website + CMS

## Goal

Turn the hand-written single-file `index.html` for Vishuddha Productions (Budapest
micro-production company: film, photography, social media, digital marketing) into a
maintainable site whose content the two owners edit themselves in a simple admin,
without touching code. The public site must look and behave exactly like the current
`index.html`.

## What exists today

- `index.html`: one page, inline CSS and JS. Preloader, scroll progress, fixed header,
  video hero with rolling-word H1, client logo marquee, services intro, three split
  sections, 9-tile project grid, collapsible mosaic gallery with YouTube lightbox,
  team, contact form (validated client-side, never sent), footer, back-to-top.
- `hu.html`: "work in progress" placeholder. `hu-full-translation.html.bak` holds a
  full Hungarian translation written against an older design.
- Assets: client logos, reference stills (35 MB of PNGs), service and team photos,
  showreel mp4, logo artwork.
- Gaps: `services/photography.png`, `og-image.jpg` and `logo.png` are missing;
  Facebook/LinkedIn and Privacy/Terms links point nowhere.

## Done means

1. Faithful port of `index.html` into components, all original behaviour and
   responsive breakpoints intact.
2. All visible content is data, editable at `/admin` in EN and HU: hero, logos,
   services, projects, gallery, team, contact details, social links, SEO, legal
   pages. Lists can be added to, removed from, reordered. Image and video upload,
   images resized and compressed.
3. Hungarian site at `/hu/`, seeded from the existing translation, behind a switch
   that defaults to today's placeholder.
4. Working contact form: server validation, spam protection, enquiries stored and
   listed in the admin, optional SMTP notification.
5. Password-protected admin: signed session cookie, rate-limited login, origin
   checks, validated uploads.
6. Version history on content saves, with rollback.
7. SEO parity or better: meta/OG/Twitter, hreflang, canonical, LocalBusiness JSON-LD,
   sitemap, robots.txt. Lighter page weight than the original.
8. One command to run locally, clean build, automated tests for content layer, auth
   and contact endpoint, Dockerfile and deployment notes.
9. Local git repo with meaningful commits, a PM document, a written architecture
   decision (Next vs Astro, which CMS) and an implementation plan.

## Constraints

- Two non-technical editors, small site. Smallest system that does the job: no
  database server, no SaaS account needed to run or edit.
- Do not invent content. Model source gaps as empty editable fields that degrade
  gracefully.
- Keep the original files in the repo as reference.
- Brand: `#002fa7` blue, `#dc443a` red, `#080808` background, Montserrat.

## Process

Understand `index.html` fully → debate architecture and CMS, record the decision →
write spec and plan → review the plan critically and fix it → build everything →
verify in a real browser against the original → commit. Work without stopping for
approval; log every judgment call in the PM document.
