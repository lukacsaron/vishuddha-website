# ADR 0002 — Deploying to Coolify, and keeping the data

Date: 2026-10-01. Status: accepted.

## The problem

The site keeps everything the owners edit (texts, uploads, history) as
files in one directory. A container's own filesystem is thrown away on every deploy,
so that directory has to live on a Docker volume, and the volume has to keep being
the same one across deploys, rebuilds and restarts. Losing it does not break the
site visibly: it silently falls back to the built-in starting content, which is
worse.

Target: a self-hosted Coolify server shared with other small services, behind
Coolify's Traefik, no Cloudflare in front.

## How our other project does it

Read from the repositories and runbooks of an existing, larger Coolify deployment:

- Stateless apps (landing page, frontend, admin) deploy with the **Dockerfile**
  build pack: multi-stage build, unprivileged user, `HEALTHCHECK`.
- Stateful services deploy as **Docker Compose** with **named volumes declared in
  the compose file**. Its deployment code says so in a comment: "use
  dockercompose for persistent volumes".
- No host ports: `expose` only, Traefik routes the domain.
- Coolify keys a stored volume on service + volume name + mount path. The runbook
  calls the mount path "frozen forever": change it and a new, empty volume mounts.
- `docker volume prune` and `docker system prune` are forbidden on the hosts for
  that reason.
- A volume created root-owned once crash-looped a service that runs as uid 1000
  until it was `chown`ed by hand.
- Coolify's Traefik trusts no forwarded headers and overwrites `X-Forwarded-For`
  with the peer that connected, so that header is the real client on a host that
  is not behind Cloudflare.
- Coolify does not back up application volumes on its own.

## Options

1. **Dockerfile build pack + a "Persistent Storage" entry added in the Coolify UI.**
   Simplest to set up. But the one thing that must never be wrong lives only in the
   UI: forget it, or recreate the app without it, and data is lost on the next
   deploy with no error anywhere.
2. **Docker Compose build pack with the named volume in `docker-compose.yml`.**
   The volume is declared in the repository, reviewed like code, and created by
   every deploy without anyone remembering it. This is the established pattern for
   stateful services.
3. **Bind mount to a host path** (`/data/vishuddha:/data`). Easy to find and back
   up from the host, but ties the app to one server's directory layout and needs
   host-side permission handling.
4. **Move the data out of the container** (S3 for uploads, a database for content).
   Removes the volume question, at the cost of two external services for a
   one-page site. Rejected for the reasons in ADR 0001.

## Decision

**Option 2.** `docker-compose.yml` declares the volume `site-data` mounted at
`/data`, and is deployed with Coolify's Docker Compose build pack.

Guards around it:

- **Ownership.** The image's entrypoint starts as root, makes `/data` belong to the
  unprivileged `node` user if it does not already, then drops to that user. Tested
  against a pre-existing root-owned volume.
- **Health.** `/api/health` fails when `/data` is not writable, so a broken mount
  shows up as an unhealthy container instead of as silent data loss. It stays 200
  while the coming soon page is on.
- **Frozen names.** The volume name and mount path carry a do-not-change comment in
  the compose file.
- **Backups.** Nothing backs the volume up automatically, so the admin offers a one-click download of the
  whole data directory as `.tar.gz` (History → Backup). Restoring is documented in
  `docs/deploy-coolify.md`.
- **Client address.** `TRUST_PROXY=1` makes rate limits use the peer Traefik
  reports. `CF-Connecting-IP` is only believed when that peer is a Cloudflare
  edge, so the code stays correct if the domain is ever proxied through Cloudflare.

## Verified locally (Docker 28, arm64)

Build; container healthy; process runs as `node`; save and upload written
to the volume; `compose down` + rebuild + `up` keeps all of it; a container
recreate keeps it; a pre-existing root-owned volume is fixed on start.

Not verified: an actual deploy on the Coolify box. Whether Coolify prefixes the
volume name with the application UUID (as it does for compose services) does not
matter for persistence, only for finding the volume on the host.

## Consequences

- One container only. Two replicas would each cache content and race on the files.
- Deleting the application in Coolify with "delete volumes" ticked deletes the
  site's content. Download a backup first.
- Renaming the compose service, the volume, or the mount path orphans the data.
