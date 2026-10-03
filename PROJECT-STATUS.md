# OVERTHRONE SMP – Project Status

Last updated: 2026-10-03. Read this first when picking the project back up.

## Website (overthronesmp.net) – LIVE ✅

- Cloudflare Worker `overthrone-website` + D1 database `overthrone-db`, deployed from GitHub `main`
  (Workers Builds deploy command: `npm run deploy`).
- Pages: Home (hero, embers, Realms, Hunter Progression, Tensura teaser), `/forums`, `/tensura`,
  `/store`, `/admin`. `/wiki` redirects to `/forums`.
- Admin panel `/admin`: protected by Cloudflare Access (Zero Trust team `overthronesmp`,
  app "OVERTHRONE Admin", Admins policy) and the Worker secrets `ACCESS_TEAM_DOMAIN`,
  `ACCESS_AUD`, `ADMIN_EMAILS` (set under Runtime variables and secrets). Working.
- Content (realms, ranks, forum posts, Tensura skills, settings) is edited in `/admin`, not in code.

### Website follow-ups
- Discord: the invite is **`https://discord.gg/overthronesmp`** (owner confirmed, with the "r").
  Migration 0004 updates the stored site setting from the old misspelled link.
- [ ] Add Tensura skills from https://tensura.wiki.gg/ (none are published yet).
- [ ] **Tebex store URL** in Admin → Site Settings: leave EMPTY until the Tebex store is approved
      (the store currently shows a 503). Then set it to `https://overthronesmp.tebex.store`.

## Tebex store – SET UP, NOT LIVE YET ⏳

- Project name: OVERTHRONE SMP. Storefront published at `https://overthronesmp.tebex.store`
  (subdomain typo fixed). Public page shows **503 Store unavailable** until the store is approved.
- Storefront design done with the new Tebex Storefront builder (no custom CSS is possible there):
  - Theme: Primary `#A5162D`, Secondary `#2A2224`, Background `#050505`, Surface `#110C0D`,
    Text `#FFFFFF`; heading font Lora, body Inter; radius 0.
  - Header logo + menu (Home, Realms, Forums, Discord, Website).
  - Carousel Style 1 with the 4 `*-v2-1920x640.jpg` slides set as **Background → Image**
    (Title/Description/Image fields left empty).
  - Categories Featured, Ranks, Crate Keys, Cosmetics, Throne Shards (owner's own image), Bundles.
- Asset pack + full settings sheet: `tebex-storefront/` (README, images, `build/render.mjs`).

### Tebex to-do (in order)
1. [x] Tebex header Discord link fixed; carousel slide 1 description cleared.
   [ ] Finish storefront blocks if not done: Category List (remove default "PACKAGES"),
       Category = Featured, Creator Code text, Footer text/links, Package pop-up enabled.
       Copy-paste text is in `tebex-storefront/README.md`.
2. [ ] Continue setup → **Confirm customer support contact** (add support email).
3. [ ] Continue setup → **Link Wallet** (owner enters own payout details).
4. [ ] **Product catalogue v2 is ready** in `tebex-storefront/catalogue/`: 180 packages, exactly 5 donor ranks
       (Supporter, Elite, Champion, Warlord, Overlord), OG-style perk lists, compliance ratings, paste-ready
       Tebex descriptions, one ChatGPT image prompt per package. All commands are placeholders
       (DEV SYSTEM REQUIRED – no permissions/essentials/economy/crate/cosmetics mod installed yet).
   [ ] **With the server dev:** create packages (names/prices/descriptions; image
       `package-default-800.png` until real art exists). No pay-to-win: follow Mojang's
       commercial usage rules; Hunter ranks are gameplay-only and must not be sold.
5. [x] Tebex connected to the server (tebex-neoforge-1.21.1-2.4.6 in mods/, `tebex secret` run, console:
       "Successfully connected to your store: OVERTHRONE SMP as OverthoneSMP").
   [ ] **Server dev:** install LuckPerms (server currently uses the default NeoForge permission handler),
       create rank groups/perks and the `shards` + `classtoken` commands. Sheets to send:
       `tebex-storefront/ranks/SEND-TO-DEV-RANKS.txt`, `tebex-storefront/shards/SEND-TO-DEV.txt`.
   [ ] (old) Configure product delivery (Tebex plugin for NeoForge 1.21.1 + store
       secret key on the server only, never on the website or in GitHub).
6. [ ] Test purchase delivers in-game.
7. [ ] **Submit for Review** in Tebex.
8. [ ] After approval: confirm `https://overthronesmp.tebex.store` loads in incognito, then paste
       it into Admin → Site Settings → Tebex store URL → Save (Store page shows "Open Store").
