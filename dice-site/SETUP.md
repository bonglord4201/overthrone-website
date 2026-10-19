# Putting ColorRoll online — step by step

The whole site is built and tested. Follow these steps once and it's live. You
need a computer with internet; everything runs free on Cloudflare's free plan.

You'll copy-paste a few commands. Lines starting with `npx wrangler` are typed
into a terminal, in the `dice-site` folder.

---

## 1. Install the tools (one time)

1. Install **Node.js** (the LTS version) from https://nodejs.org — this gives you
   the `npm` and `npx` commands.
2. Open a terminal, go into this project's `dice-site` folder, and run:

   ```
   npm install
   ```

## 2. Make a Cloudflare account and connect it

1. Sign up (free) at https://dash.cloudflare.com/sign-up.
2. In the terminal, run:

   ```
   npx wrangler login
   ```

   A browser window opens — click **Allow**. This links the terminal to your account.

## 3. Create the database

```
npx wrangler d1 create colorroll-db
```

It prints a few lines including a `database_id`, e.g.

```
database_id = "a1b2c3d4-5678-90ab-cdef-1234567890ab"
```

Open **`wrangler.jsonc`** and replace `PASTE_YOUR_DATABASE_ID_HERE` with that id
(keep the quotes). Save the file.

## 4. Choose your three secrets

Run these three commands. Each one asks you to type/paste a value, then press Enter.

```
npx wrangler secret put ADMIN_PATH
```
Type your **secret admin address** — 16 to 64 letters, numbers, `-` or `_`, no spaces.
This is the web address of your control panel. Pick something nobody could guess, e.g.
`boss-k29fj3m8q1x7p0`. **Write it down.** Your panel will be at
`https://yoursite.com/<that value>/`.

```
npx wrangler secret put ADMIN_PASSWORD
```
Type a **long password** only you know. Write it down.

```
npx wrangler secret put SESSION_SECRET
```
Paste **64+ random characters** (any mix of letters and numbers). This one you never
type again — it just has to be long and random. You can mash the keyboard, or use a
password generator.

## 5. Put the site online

```
npx wrangler deploy
npx wrangler d1 migrations apply colorroll-db --remote
```

The first command prints your site address, like
`https://colorroll-dice.<your-name>.workers.dev`. Open it — the dice work right away.

Your admin panel is at that address followed by your `ADMIN_PATH`, e.g.
`https://colorroll-dice.<your-name>.workers.dev/boss-k29fj3m8q1x7p0/`.
Open it, enter your password, and add your streamers.

## 6. (Optional) Use your own domain

1. Buy a domain — easiest is **Cloudflare → Domain Registration** in the dashboard,
   because it connects automatically.
2. In the Cloudflare dashboard, open **Workers & Pages → colorroll-dice →
   Settings → Domains & Routes → Add → Custom domain**, and add your domain.

That's it. The site is now at your domain, and the admin panel at
`https://yourdomain.com/<ADMIN_PATH>/`.

---

## Changing things later

- **Add or edit streamers, catch cheats, handle reports:** just open your admin
  address and sign in. No commands needed.
- **Change a secret** (new password or admin address): run the matching
  `npx wrangler secret put ...` again, then `npx wrangler deploy`.
- **Update the site after code changes:** `npx wrangler deploy` again (and
  `npx wrangler d1 migrations apply colorroll-db --remote` if there are new
  migrations).
- **Rename the site from "ColorRoll":** change the name in `public/index.html`
  (title, header, footer) and `public/admin/index.html`, then deploy again.

## If something goes wrong

- **The admin page shows "Page not found":** you're using the wrong address.
  It only opens at your exact `ADMIN_PATH`. `/admin` always shows "not found" on
  purpose.
- **Sign-in says it's locked:** 5 wrong passwords locks sign-in for 15 minutes.
  Wait and try again.
- **`deploy` complains about the database id:** you missed step 3 — paste the real
  `database_id` into `wrangler.jsonc`.

See `README.md` for how the site works under the hood.
