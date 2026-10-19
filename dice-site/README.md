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

17 themes to pick from the theme menu: Blue, Sab-Blue, Green, Sab-Green, Red, Sab-Red, Pink,
B&W, Sab-Black, Heaven, Hell (default), Underwater, Bronze, Silver, Gold, Casino and Midnight.
Each theme is one `[data-skin="..."]` block of color tokens at the top of `public/styles.css`;
copy a block and add an `<option>` in `public/index.html` (and the name in `SKINS` in
`public/app.js`) to make a new one.

Stream mode (toggle on the page) hides everything except the dice, the roll ID, the time and
a line telling viewers where to verify, so it's ready for an OBS browser source.

If the page can't reach `/api` (for example opened as a plain file), it runs in **preview
mode**: rolls stay in that browser only and a banner says they can't be verified.

## API

| Route | What it does |
| --- | --- |
| `POST /api/roll` `{ key, dice, kind }` | Rolls `dice` (1-6) dice. `kind` is `color` or `number`. Max one roll per roller every 0.4 s. |
| `GET /api/roll/:id` | The roll plus up to 5 rolls before and after it by the same roller. |
| `GET /api/roller/:roller` | That roller's last 20 rolls. |
| `GET /api/health` | `{ ok: true }` |

Faces are numbers 0-5 in the order red, orange, yellow, green, blue, purple.

## Run it locally

```
cd dice-site
npm install
npm run dev        # applies the database schema locally, then serves on http://localhost:8787
```

## Put it online (free Cloudflare account)

```
cd dice-site
npm install
npx wrangler login
npm run deploy     # creates the Worker + the colorroll-db database, then applies migrations/
```

Wrangler prints the address (`https://colorroll-dice.<you>.workers.dev`). To use your own
domain, add it under the Worker's **Settings → Domains & Routes** in the Cloudflare dashboard.

## Files

```
wrangler.jsonc          Worker + static assets + D1 config
src/worker.js           the roll API (the only place dice are rolled)
migrations/0001_rolls.sql
public/index.html       the page
public/styles.css
public/app.js           page logic: animation, history, verify, odds, stream mode
public/_headers         security headers
```

To rename the site, change "ColorRoll" in `public/index.html` (title, header, footer).
