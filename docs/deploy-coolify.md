# Deploying to Coolify

Why it is set up this way: `docs/decisions/0002-coolify-deployment.md`.

## First deploy

1. **New resource** in a project →
   **Public Repository** → `https://github.com/lukacsaron/vishuddha-website`,
   branch `main`.
2. **Build pack: Docker Compose.** Compose file: `/docker-compose.yml`. Coolify
   finds one service, `web`.
3. **Domain** on the `web` service, with the port:
   a subdomain that already points at the server for a trial
   (`https://vishuddha.<your-wildcard-domain>:4321`), or
   `https://vishuddhaproductions.com:4321` once its DNS points at the server.
   The `:4321` tells Traefik which container port to route to; visitors do not type it.
   Several domains go in the same field, comma-separated. Add `www.` as well: the
   app redirects it to the address set in Settings.
4. **Environment variables**: Coolify lists the variables from the compose file.
   It pre-fills `ADMIN_PASSWORD` with the placeholder text `Set ADMIN_PASSWORD`,
   which would work as a password: replace it with a long random value. The
   rest are optional, see `coolify.env.example`. The deploy fails on purpose if
   `ADMIN_PASSWORD` is missing.
5. **Deploy.** When the container reports healthy, open the domain.
6. **Check persistence once, before anyone edits real content:** sign in at
   `/admin`, change a phone digit, save, press **Redeploy** in Coolify, and confirm
   the change is still there. If it is gone, the volume is not mounted: stop and
   look at the Storages tab before going further.

After that, in the admin:

- Settings → **Site address**: the real domain. It feeds canonical links and the sitemap.
- **Coming soon page**: switch it on to keep the site private until launch. Signed
  in, you still see the real site.

## Where the data is

One named volume, `site-data`, mounted at `/data`:

```
/data/content.json      everything edited in the admin
/data/history/          the last 30 versions
/data/uploads/          uploaded photos and videos
/data/enquiries.json    contact form submissions
```

On the host Coolify stores it as a Docker volume, usually named
`<application-uuid>_site-data`. Find it with `docker volume ls | grep site-data`.

**Never change** the volume name `site-data`, the mount path `/data`, or the service
name `web` in `docker-compose.yml`. Any of the three makes Coolify mount a new,
empty volume, and the site quietly shows its built-in starting content.

**Never run** `docker volume prune` or `docker system prune --volumes` on the box.

When deleting the application in Coolify, leave "delete volumes" unticked unless you
mean to delete the content, and download a backup first.

## Backups

Coolify does not back up application volumes on its own, so backups are manual:

- In the admin: **History → Download full backup**. A `.tar.gz` of all of `/data`.
  Do this before any risky change, and from time to time.
- From the host: `docker run --rm -v <volume>:/data -v "$PWD":/out alpine tar -czf /out/vishuddha-backup.tar.gz -C /data .`

### Restoring a backup

```bash
# on the Coolify host; <container> from `docker ps | grep web`
docker cp vishuddha-backup.tar.gz <container>:/tmp/backup.tar.gz
docker exec -u node <container> tar -xzf /tmp/backup.tar.gz -C /data
docker exec <container> rm /tmp/backup.tar.gz
```

The site picks up the restored content on the next request; no restart is needed.
These commands change state on the host, so they fall under the same
ask-before-running rule as anything else there.

## Updating the site

Push to `main`, then **Redeploy** in Coolify (or enable auto-deploy with the
repository webhook). A deploy rebuilds the image and replaces the container; the
volume is untouched.

New editable fields added in a release get their default values automatically, so
content saved by an older version keeps working.

## If something is wrong

| Symptom | Likely cause |
|---|---|
| Deploy fails with `Set ADMIN_PASSWORD` | The variable is not set in Coolify |
| Container unhealthy, `/api/health` says the data directory is not writable | Volume missing or read-only. Check the Storages tab and the container log for `[entrypoint]` lines |
| Site shows original texts, edits gone | A new empty volume was mounted: name, mount path or service name changed, or the app was recreated. The old volume is usually still on the host: `docker volume ls` |
| Saving in the admin says "Cross-site request refused" | The proxy is not passing the original `Host`. Coolify's Traefik does by default |
| Sign-in works, then every page says not signed in | The cookie is marked secure but the site was opened over plain http. Use https |
| Every visitor gets "too many requests" on the contact form | `TRUST_PROXY` was removed, so all visitors share the proxy's address |
| Site returns 503 to everyone | The coming soon page is on. Sign in at `/admin` → Coming soon page |

## Running the same container locally

```sh
ADMIN_PASSWORD=something docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

Opens on `http://localhost:4321` with its own local `site-data` volume.
