# OVERTHRONE SMP

Official website for OVERTHRONE SMP: overthronesmp.net

- Minecraft address: `overthronesmp.net`
- Discord: `https://discord.gg/overthonesmp` (confirmed invite URL, do not "correct" it)
- Store: Tebex not created yet

## Stack

Static site served by Cloudflare Workers Static Assets. There is no Worker script and no build step.
Everything in `public/` is deployed as-is.

## Develop and deploy

```bash
npm install
npm run dev        # wrangler dev
npx wrangler deploy
```

## Structure

```
public/
  index.html  wiki.html  store.html  404.html
  styles.css  app.js
  _headers            security headers + CSP (strict: no inline scripts or styles)
  robots.txt  sitemap.xml
  fonts/              Lora (variable, Latin subset, OFL)
  images/             real logo derivatives only (crop/resize of the official PNG)
```

Internal links use extensionless URLs (`/wiki`, `/store`). Cloudflare redirects `/wiki.html` to `/wiki`.

## Editing

- Server address and the Tebex URL live at the top of `public/app.js`.
- The Discord URL is written directly in each page's HTML.
- Header and footer are repeated in each HTML file. Edit all four when changing navigation.
- The CSP in `_headers` blocks inline `<script>`, inline `style=""` attributes and third-party hosts. Keep new code in `app.js` / `styles.css`, or loosen the CSP deliberately.

## Connecting Tebex later

1. Create the Tebex store.
2. Put the public store URL in `CONFIG.tebexUrl` in `public/app.js`. `/store` then swaps "Store opening soon." for an "Open Store" button.
3. For an on-site custom store using the Tebex Headless API, add a Worker script (`"main"` in `wrangler.jsonc`, `"run_worker_first": ["/api/*"]`) and store the private key with `wrangler secret put`. Never put Tebex private credentials in `public/`.
4. Extend the CSP `connect-src` / `form-action` only for the hosts you actually use.

## Assets

The logo files are derived only from the official OVERTHRONE SMP logo PNG. Do not redraw them. The original full-size PNG is not kept in `public/` (it is 1.9 MB); keep it in your own design archive.
