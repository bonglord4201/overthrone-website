# OVERTHRONE SMP – Tebex Product Catalogue

182 packages across 12 categories, ready to enter into Tebex. Your developer then replaces each command placeholder with a real command.

| File | What it is |
|---|---|
| `CATALOGUE.md` | The full store: ranks, crates, keys, shards, cosmetics, pets, bundles, featured, boosters, starter, seasonal, gifts, utility, and the final store structure |
| `packages.csv` | Master package database (open in Excel or Google Sheets). One row per package with its ID |
| `DEVELOPER-HANDOFF.md` | For the developer: backend systems to build, the placeholder reference, and per-package delivery with a blank for the real command |
| `IMAGE-PROMPTS.md` | Image list plus an individual AI-art prompt for every package, crate and category |
| `images/<ID>.jpg` | A ready-made 800×800 image for every package (e.g. `images/RANK-001.jpg`) |
| `images/CRATE-00x.jpg` | Crate artwork (6) |
| `images/categories/*.jpg` | Category tiles (no text, matching the existing tiles) |
| `catalogue-data.mjs` | Source of truth. Edit names and prices here, then rebuild |

## Entering a package in Tebex

Go to **Packages → Create Package**, then:

1. **Name:** the PACKAGE column.
2. **Description:** the DESCRIPTION column. For crate keys, also paste the odds table from `CATALOGUE.md`.
3. **Category:** the CATEGORY column.
4. **Media → Select Images:** upload `images/<ID>.jpg`.
5. **Pricing:** the PRICE AUD column. Use **Only charge the customer once**.
6. **Game Server Commands:** leave empty until the developer sends the real command for this ID. Until then, keep the package **disabled** or hidden.
7. **Gift packages:** in the **Variables** tab, add a "Recipient username" variable.
8. **Starter and Founder packages:** in the **Limits** tab, set 1 per customer.
9. **Ranks:** in **Discord Actions**, add the matching Discord role.

## Rebuilding after edits

```bash
node tebex-storefront/catalogue/build-catalogue.mjs   # documents + packages.csv
node tebex-storefront/catalogue/render-images.mjs     # images (needs Playwright)
```

## Compliance

Everything follows Mojang's Minecraft Usage Guidelines so the store can pass Tebex review:

- No paid gameplay advantages.
- Crates and Throne Shards are cosmetic-only.
- Boosters are global.
- No capes.

Before adding any new product, check it against the rules at the top of `CATALOGUE.md`.
