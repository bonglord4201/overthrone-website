# OVERTHRONE SMP – Tebex Product Catalogue (v2)

180 packages across 12 categories. There are exactly **five donor ranks**: Supporter, Elite, Champion, Warlord and Overlord (Overlord is the top rank).

| File | What it is |
|---|---|
| `CATALOGUE.md` | The full store: OG-style rank perk lists, the rank comparison table, crates with odds, every package with its **ready-to-paste Tebex description**, and the store structure |
| `packages.csv` | Master database (open in Excel or Google Sheets). Columns include the command placeholder, compliance rating, status, and the full Tebex description to paste |
| `DEVELOPER-HANDOFF.md` | For the developer: systems to build, the placeholder reference, the perk matrix, and a "Real command" blank for every package |
| `IMAGE-PROMPTS.md` | One ChatGPT image prompt per package, crate and category. Use one prompt per message |
| `catalogue-data.mjs` | Source of truth (ranks, perk matrix, crates, items, prices). Edit it, then run `node tebex-storefront/catalogue/build-catalogue.mjs` |

## Important

- **Every command is a placeholder.** Your confirmed mod list has no permissions, essentials, economy, auction, crate or cosmetics mod, so those systems are **DEV SYSTEM REQUIRED**. Keep packages disabled in Tebex until the developer sends the real commands.
- **Compliance:** every perk and package is rated Safe, Borderline or Risky.
  - Risky perks (gear, kits, keep-XP, survival /fly, skill points) are **not** in the rank descriptions by default. They're listed under "Optional Risky perks" for each rank, so you choose.

## Entering a package in Tebex

Go to **Packages → Create Package**, then fill in:

1. **Name:** the PACKAGE column.
2. **Description:** the TEBEX DESCRIPTION column. Paste it as-is.
3. **Category:** the CATEGORY column.
4. **Price:** the PRICE AUD column, with "Only charge the customer once".
5. **Image:** generate it with ChatGPT from `IMAGE-PROMPTS.md` (same ID).
6. **Game Server Commands:** add these later, when the developer replies.
7. **Ranks:** also add a Discord Action for the role.
8. **Gifts:** add a recipient-username Variable.
9. **Starter packs:** set Limits to 1 per customer.
