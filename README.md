# OVERTHRONE SMP

Official website for OVERTHRONE SMP: overthronesmp.net

- Minecraft address: `overthronesmp.net` (Minecraft 1.21.1, NeoForge, Tensura: Reincarnated)
- Discord: `https://discord.gg/overthronesmp` (confirmed invite URL, do not "correct" it; editable in the admin panel)
- Store: Tebex not created yet

## Stack

- **Cloudflare Workers Static Assets** serves everything in `public/` (same as before).
- **Worker script** (`src/worker.js`) runs only for the routes listed in `assets.run_worker_first`
  in `wrangler.jsonc`: the JSON API (`/api/*`), uploaded images (`/media/*`), the admin panel
  (`/admin`) and the main HTML pages, into which it writes the editable site settings.
- **Cloudflare D1** database `overthrone-db` (binding `DB`) holds all editable content. Schema and
  seed content live in `migrations/`.
- **Cloudflare Access** protects `/admin` and `/api/admin/*`. The Worker also verifies the Access
  token itself and checks the email against the `ADMIN_EMAILS` secret.

No build step. Pages ship with static fallback content, so the site still renders if the
database is unreachable.

## Structure

```
wrangler.jsonc        Worker + assets + D1 config
src/
  worker.js           routing, admin gate, settings injection (HTMLRewriter)
  api.js              public + admin JSON API, media upload/serve
  auth.js             Cloudflare Access JWT verification
  settings.js         editable site settings (whitelist + defaults)
  http.js             security headers, JSON helpers
migrations/           D1 schema (0001) and initial content (0002)
public/
  index.html  forums.html  tensura.html  store.html  404.html  admin.html
  styles.css  app.js        shared styles; copy-IP, menu, store button
  content.js                renders realms, ranks, forums, skills from /api/public/*
  admin.css   admin.js      admin panel
  _headers  _redirects      security headers + CSP; /wiki -> /forums
  robots.txt  sitemap.xml
  fonts/  images/
```

## Develop locally

```bash
npm install
cp .dev.vars.example .dev.vars     # signs you into /admin on localhost only
npm run db:migrate:local
npm run dev                         # http://localhost:8787 and /admin
```

## Deploy

```bash
npm run deploy    # wrangler deploy, then apply any new D1 migrations
```

`wrangler deploy` creates the `overthrone-db` D1 database automatically the first time.
If the Worker is deployed by Cloudflare's Git integration (Workers Builds), set its
**Deploy command** to `npm run deploy` so migrations are applied too.

## Trailer video

The homepage trailer lives in `public/video/` as WebM (VP9, played by Chrome/Firefox/Edge) and
MP4 (H.264, used by Safari/iOS), each kept under Cloudflare's 25 MiB per-file asset limit.
`/video/*` runs through the Worker (`src/video.js`) so browsers get proper byte-range (206)
responses, which Safari needs to play and seek. After replacing a video, run
`node scripts/video-sizes.mjs` to refresh `public/video/sizes.json`. Re-encode recipe
(source = full-quality render from `marketing/trailer/`):

```bash
ffmpeg -i trailer.mp4 -c:v libvpx-vp9 -b:v 1600k -pass 1 -an -f webm /dev/null
ffmpeg -i trailer.mp4 -c:v libvpx-vp9 -b:v 1600k -pass 2 -c:a libopus -b:a 128k overthrone-trailer.webm
ffmpeg -i trailer.mp4 -c:v libx264 -preset slow -b:v 1600k -pass 1 -an -f null /dev/null
ffmpeg -i trailer.mp4 -c:v libx264 -preset slow -b:v 1600k -pass 2 -c:a aac -b:a 128k -movflags +faststart overthrone-trailer.mp4
```

## Admin sign-in (one-time setup)

1. Cloudflare dashboard → **Zero Trust** → **Access** → **Applications** → **Add an application** → **Self-hosted**.
2. Add two public hostnames: `overthronesmp.net` path `admin` and `overthronesmp.net` path `api/admin`.
3. Add a policy: Action **Allow**, Include **Emails** → your admin email(s).
4. Save, open the application and copy its **Application Audience (AUD) Tag**.
   Your team domain (`<team>.cloudflareaccess.com`) is shown in Zero Trust → Settings.
5. Set three secrets on the Worker (Workers & Pages → overthrone-website → Settings →
   Variables and Secrets, type **Secret**), or with `npx wrangler secret put <NAME>`:
   - `ACCESS_TEAM_DOMAIN` = `<team>.cloudflareaccess.com`
   - `ACCESS_AUD` = the AUD tag
   - `ADMIN_EMAILS` = comma-separated admin emails (same as the Access policy)

Then open https://overthronesmp.net/admin and sign in with the one-time code Access emails you.

## Editing content

Everything below is edited in `/admin`, no code changes needed:
site settings (server address, Discord, Tebex URL, socials, banner, SEO, section intros),
home sections, announcements, forum categories and posts, realms (with images),
Hunter ranks, Tensura skills, and media.

Tensura skill entries must come from the official wiki (https://tensura.wiki.gg/). Leave a
field empty if the wiki does not document it; empty fields are hidden on the site.

## Security notes

- The CSP in `_headers` (mirrored in `src/http.js`) blocks inline scripts/styles and third-party
  hosts. Keep new code in the `.js` / `.css` files.
- Never put secrets in `public/`, `wrangler.jsonc` or site settings. Use `wrangler secret put`.
- Admin write requests require the `X-Overthrone-Admin` header and a same-origin `Origin`.
- Uploaded images are checked by file signature (PNG/JPEG/WebP/GIF/AVIF, max 1.5 MB) and served
  with a sandboxing CSP.

## Connecting Tebex later

1. Create the Tebex store.
2. Paste the public store URL into **Admin → Site Settings → Tebex store URL**. `/store` then
   swaps "Store opening soon" for an "Open Store" button.
3. For an on-site Tebex Headless store, add routes under `/api/` and store the private key with
   `wrangler secret put`. Never put Tebex private credentials in `public/`.

## Assets

The logo files are derived only from the official OVERTHRONE SMP logo PNG. Do not redraw them. The original full-size PNG is not kept in `public/` (it is 1.9 MB); keep it in your own design archive.
