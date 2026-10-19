# ColorRoll Dice

An online color dice roller (1 to 6 dice, 6 colors: red, orange, yellow, green, blue, purple)
with rolls that viewers can verify, so a streamer can't fake or rig a result.

Runs on Cloudflare Workers + D1 (free tier is enough to start). Everything the site needs is in
this folder.

## How the anti-rigging works

- **The server rolls, not the browser.** Pressing "Go again" sends a request to
  `POST /api/roll`. The Worker picks every die with `crypto.getRandomValues` (each of the 6
  colors exactly 1 in 6; four of the same color is possible), saves the roll in D1 and only then
  sends it back. Editing the page or using a "rigger" script can't change a result, because the
  page only displays what the server already saved.
- **Every roll has an ID.** Viewers open Verify History, type the ID shown under the dice, and
  see the official dice, the exact time (to the second) and the roll number.
- **Hidden re-rolls show up.** Each browser gets a secret key; its public **roller ID** is a
  hash of that key. The verify page lists the same roller's rolls just before and after the one
  being checked, with the seconds between them. If a streamer quietly re-rolled until they got
  a good result, those extra rolls are right there.
- **Old IDs don't work as new rolls.** The verify page shows how long ago the roll was made, so
  replaying a good ID from earlier is obvious.
- **Rows are never edited or deleted.** The API has no update or delete route.
- **Fake copies of the site fail.** An ID from a lookalike site will say "Not a real roll" here.
  Tell viewers to check IDs on your real domain only.

## Themes

24 themes in three groups, picked from the theme menu next to the dice:

- **Worlds** (painted, animated scenes): Hell (default), Heaven, Underwater, Galaxy, Neon City,
  Jungle, Arctic, Desert Sunset, Haunted, Sakura, Storm, Casino
- **Metal**: Gold, Silver, Bronze
- **Colors**: Blue, Dark Blue, Green, Dark Green, Red, Dark Red, Pink, Black & White, Black

Every theme is one entry in `public/themes.js`: its page colors plus a scene (sky colors,
layers such as mountains, clouds, city or lava, and one kind of moving particle) that
`public/scene.js` paints behind the page. Copy an entry and change it to make a new theme;
it appears in the menu automatically. People who turn on "reduce motion" on their device get
the still picture without moving particles.

## Admin panel

The admin panel is for the site owner only, and visitors can't see it at all:

- **It lives at a secret address.** The `ADMIN_PATH` secret (16-64 letters, numbers, `-` or `_`)
  is the address, e.g. `https://yoursite.com/<ADMIN_PATH>/`. It's stored in Cloudflare, not in
  the code, and nothing on the site links to it. `/admin`, `/api/admin` and every other guess
  show the normal "Page not found" page, so nobody can tell an admin panel exists. Bookmark
  your address.
- **It still needs your password.** `ADMIN_PASSWORD` is a second Cloudflare secret. Signing in
  sets a session cookie for 7 days (HttpOnly, Secure, SameSite=Strict, signed with
  `SESSION_SECRET`). Changing the password signs everyone out.
- 5 wrong passwords from one address lock sign-in for 15 minutes.
- Every admin API call checks the cookie, changes are only accepted from the admin page, and the
  admin pages are never cached or indexed by search engines.
- Without `ADMIN_PATH` set, the admin panel is switched off completely.

**Top streamers** (the first admin section): add, edit, delete and reorder the streamers shown
on both sides of the dice. Each one has a display name, TikTok username (links to their
profile), picture (cropped to a circle and shrunk in the browser before upload), verified badge,
a Live switch, show/hide, and which side it goes on. Live streamers go to the top of their side.
TikTok doesn't let other sites check who is live, so Live is a switch you flip by hand.

To add more admin sections later: add a tab and a `<section>` in `public/admin/index.html`, a
loader in `SECTIONS` in `public/admin/admin.js`, and its API routes in `adminArea()` in
`src/worker.js`.

If the page can't reach `/api` (for example opened as a plain file), it runs in **preview
mode**: rolls stay in that browser only and a banner says they can't be verified.

## API

| Route | What it does |
| --- | --- |
| `POST /api/roll` `{ key, dice, kind }` | Rolls `dice` (1-6) dice. `kind` is `color` or `number`. Max one roll per roller every 0.4 s. |
| `GET /api/roll/:id` | The roll plus up to 5 rolls before and after it by the same roller. |
| `GET /api/roller/:roller` | That roller's last 20 rolls. |
| `GET /api/streamers` | Visible top streamers, live ones first. |
| `GET /media/:id` | An uploaded streamer picture. |
| `GET /api/health` | `{ ok: true }` |
| `/<ADMIN_PATH>/api/*` | Admin panel only: `login`, `logout`, `me`, `streamers` (GET, POST, PUT/DELETE `:id`, POST `order`). |

Faces are numbers 0-5 in the order red, orange, yellow, green, blue, purple.

## Run it locally

```
cd dice-site
npm install
cp .dev.vars.example .dev.vars   # test address + password for local use
npm run dev        # applies the database schema locally, then serves on http://localhost:8787
```

## Put it online (free Cloudflare account)

```
cd dice-site
npm install
npx wrangler login
npm run deploy     # creates the Worker + the colorroll-db database, then applies migrations/
npx wrangler secret put ADMIN_PATH        # your secret admin address, e.g. boss-k29fj3m8q1x7
npx wrangler secret put ADMIN_PASSWORD    # a long password only you know
npx wrangler secret put SESSION_SECRET    # 64+ random characters
```

Then open `https://<your site>/<ADMIN_PATH>/` and sign in.

Wrangler prints the address (`https://colorroll-dice.<you>.workers.dev`). To use your own
domain, add it under the Worker's **Settings → Domains & Routes** in the Cloudflare dashboard.

## Files

```
wrangler.jsonc          Worker + static assets + D1 config
src/worker.js           routes requests to the files below
src/rolls.js            dice rolls and verification (the only place dice are rolled)
src/streamers.js        top streamers and their pictures
src/auth.js             admin password sign-in and session cookie
src/http.js             shared response helpers
migrations/             database tables (rolls; streamers, pictures, sign-in attempts)
public/index.html       the dice page
public/styles.css
public/app.js           dice page logic: animation, history, verify, odds, streamer panels
public/themes.js        the theme list
public/scene.js         paints the theme backgrounds
public/admin/           the admin panel (only served at the secret address)
public/404.html         the "Page not found" page
public/_headers         security headers
```

To rename the site, change "ColorRoll" in `public/index.html` (title, header, footer).
