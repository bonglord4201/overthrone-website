# OVERTHRONE SMP – Tebex Storefront Pack

Ready-to-upload images and settings for the **new Tebex Storefront builder**
(Pages / Layout blocks / Global → Theme, Images, Login, Basket, Package pop-up).

This folder is not part of the website and is not deployed.

## What the new builder supports

Tebex's documentation states that full HTML & CSS editing is **currently unavailable on stores
using the new Storefronts system**. Custom templates, Twig, CSS/JS assets and theme ZIPs apply only
to legacy webstores (and need Tebex Plus). So this pack contains only what the new builder accepts:

- **Theme colours.** Hex values are listed below.
- **Uploaded images.** These are the logo, carousel slides, category images, package images and background.
- **Block text and links.** Copy-paste text for each block is listed below.

No custom code is needed or used. Login, basket, packages, categories, the package pop-up and
checkout all stay 100% Tebex.

## Files

| File | Size | Use in Tebex |
|---|---|---|
| `assets/logo/overthrone-logo-800.png` | 800×800, transparent | **Header → Logo** (PNG/WEBP, ≥500px wide, ≤5MB) |
| `assets/logo/overthrone-logo-wide-1200x300.png` | 1200×300, transparent | Alternative header logo if the square one looks too tall |
| `assets/carousel/01-hero-1920x640.jpg` | 1920×640 | **Carousel slide 1** (desktop) |
| `assets/carousel/02-realms-1920x640.jpg` | 1920×640 | Carousel slide 2 |
| `assets/carousel/03-play-1920x640.jpg` | 1920×640 | Carousel slide 3 |
| `assets/carousel/04-discord-1920x640.jpg` | 1920×640 | Carousel slide 4 |
| `assets/carousel/*-mobile-1080x1080.jpg` | 1080×1080 | Use these if a slide has a separate mobile image, or if the builder crops wide images on phones |
| `assets/categories/featured-800.png` | 800×800 | Category image: **Featured** |
| `assets/categories/ranks-800.png` | 800×800 | Category image: **Ranks** |
| `assets/categories/crate-keys-800.png` | 800×800 | Category image: **Crate Keys** |
| `assets/categories/cosmetics-800.png` | 800×800 | Category image: **Cosmetics** |
| `assets/categories/special-items-800.png` | 800×800 | Category image: **Special Items** |
| `assets/categories/bundles-800.png` | 800×800 | Category image: **Bundles** |
| `assets/packages/package-default-800.png` | 800×800 | Image for any package that has no artwork of its own yet |
| `assets/background/store-background-1920x1080.jpg` | 1920×1080 | **Global → Images** background (2560×1440 version for large screens) |

Category images contain no text on purpose. Tebex prints the category name itself, so renaming
a category never leaves a wrong label baked into an image.

## Global → Theme (colours)

| Role | Hex |
|---|---|
| Page background | `#050505` |
| Card / panel / header background | `#110C0D` |
| Secondary surface (inputs, hover) | `#1A1214` |
| Primary / buttons / accent | `#A5162D` |
| Primary hover | `#C51C38` |
| Text | `#EFEBE4` |
| Muted text | `#A39D94` |
| Borders | `#2A2224` |
| Silver highlight | `#C3C6CC` |
| Premium / sale / gold accent (use sparingly) | `#C9A45D` |
| Button text | `#FFFFFF` |

## Block-by-block settings

### Header
- **Logo:** `overthrone-logo-800.png`. If it looks too tall, use `overthrone-logo-wide-1200x300.png` instead.
- **Links** (add as custom links, if the block offers them):
  - Home → store home page
  - Realms → `https://overthronesmp.net/#realms`
  - Forums → `https://overthronesmp.net/forums`
  - Discord → your Discord invite (the same URL as in the website's Admin → Site Settings)
  - Website → `https://overthronesmp.net`
- Login and Basket are Tebex's own buttons. Leave them enabled.

### Carousel
| Slide | Image | Link |
|---|---|---|
| 1 | `01-hero-1920x640.jpg` | Featured category (or store home) |
| 2 | `02-realms-1920x640.jpg` | `https://overthronesmp.net/#realms` |
| 3 | `03-play-1920x640.jpg` | `https://overthronesmp.net` |
| 4 | `04-discord-1920x640.jpg` | your Discord invite |

The slide text is already in the images. If a slide has title or subtitle fields, leave them empty
so the text isn't shown twice. If it has an alt-text field, use the slide's headline.

### Category List
Create the categories in this order and give each its image:
Featured, Ranks, Crate Keys, Cosmetics, Special Items, Bundles.

Category descriptions (only if the category has a description field):

- **Featured:** Highlighted packages from the OVERTHRONE store.
- **Ranks:** Store ranks for OVERTHRONE SMP. These are separate from Hunter ranks, which are earned through gameplay. Perks are listed on each package.
- **Crate Keys:** Keys for in-game crates. Contents are listed on each package.
- **Cosmetics:** Visual extras for your character. Cosmetic only.
- **Special Items:** Special and limited items. Details are listed on each package.
- **Bundles:** Several packages combined. Contents are listed on each package.

### Creator Code
- **Heading:** Support a Creator
- **Text:** Have a creator code? Enter it here to support your favourite OVERTHRONE creator.

### Footer
- **About text:** OVERTHRONE SMP is a dark-fantasy MMORPG Minecraft server. Don’t reach the throne. Overthrow it.
- **Server:** `overthronesmp.net`
- **Links:**
  - Website → `https://overthronesmp.net`
  - Forums → `https://overthronesmp.net/forums`
  - Discord → your invite
  - Terms, Privacy and Support → Tebex's built-in pages, if the footer offers them
- **Disclaimer:** Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.

### Global → Login / Basket / Package pop-up
- Keep Tebex's defaults. Don't replace any of these.
- In **Storefront Settings**, enable the **package pop-up** and use **basket** mode (not direct-to-checkout). That gives each package the large-image detail view with Add to Basket.

### Packages
- Each package gets its own image (800×800 square works best). Until real artwork exists, use `package-default-800.png`.
- Names, prices, descriptions and delivery commands come from Tebex packages. Nothing here invents them.

## Rules to keep in mind
- Follow Mojang's Minecraft commercial usage guidelines: don't sell gameplay advantages. Hunter ranks are gameplay progression and must not be sold.
- Never put the Tebex secret key on the website, in GitHub or in any image. It only goes in the Tebex plugin on the Minecraft server.

## Regenerating the images
The images are rendered from code (`build/render.mjs`) using the official logo and the Lora font
from `public/`:

```bash
node tebex-storefront/build/render.mjs   # needs Playwright + Chromium
```
