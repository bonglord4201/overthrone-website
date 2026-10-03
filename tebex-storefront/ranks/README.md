# OVERTHRONE – Ranks section (Tebex + website)

Ranks, lowest to highest: **Ronin → Valkyrie → Monarch → Godborn → Overlord** (Overlord is the top rank).

| File | What it is |
|---|---|
| `ranks-data.mjs` | Source of truth for the comparison: every perk, limit and command, and the rank that unlocks it |
| `build-ranks.mjs` | Builds `public/ranks.html` (overthronesmp.net/ranks) and `tebex-comparison.html`. Add `--png` to re-render the PNG from `wrangler dev` |
| `rank-comparison.png` | The full comparison table as an image (1120 px wide), for a Tebex image block |
| `tebex-comparison.html` | The same table as one inline-styled HTML block, if a Tebex text block accepts HTML |

To change a perk, edit `ranks-data.mjs`, then run `node tebex-storefront/ranks/build-ranks.mjs`.

## Fixing the rank cards in Tebex (builder settings, no code)

The new Tebex Storefront builder has no custom CSS. Card size, image cropping and cards per row come
from block settings and the artwork itself. Nothing below changes package names, prices, IDs or Buy buttons.

1. **Order:** go to Packages → Ranks and drag the packages into the order Ronin, Valkyrie, Monarch,
   Godborn, Overlord. You can also give them the sort order 1–5.
2. **One row on desktop:** go to Webstore → Storefront → open the Ranks category page → select the
   package grid block. Set **Packages per row / Columns** to **5**.
3. **Same image size on every card:** in the same block, set the image fit to **Fit / Contain** (not
   Cover/Fill), so no artwork is cropped.
4. **Artwork:** upload all five images at the **same aspect ratio** (square, e.g. 800×800). Different
   ratios cause the uneven cards. If you send the original images, they can be padded onto identical
   transparent square canvases without changing the art.
5. **Comparison table:** under the package grid on the Ranks page, add an **Image** block with
   `rank-comparison.png`. Or, if a Text block accepts HTML, paste `tebex-comparison.html`. Add a button
   or link to `https://overthronesmp.net/ranks` for the mobile-friendly version.
6. Save and Publish, then check the store on desktop and on your phone.
