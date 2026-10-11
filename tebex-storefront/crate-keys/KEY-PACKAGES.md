# Crate key packages (Tebex)

Tebex is already connected to the server (`tebex-neoforge-1.21.1-2.4.6`), so a package delivers by running its
command from the server console. The command gives real key items with `crates.js`.

## Category

Tebex → **Packages → Create Category** → name **Crate Keys**.

## Packages

Make one package per row. Image: the matching `*-key-800.png` in this folder.

| Package name | Price (AUD) | Command (Game server → your server) |
|---|---|---|
| 1x Armor Crate Key | 2.99 | `crate key give {username} armor 1` |
| 5x Armor Crate Key | 7.49 | `crate key give {username} armor 5` |
| 10x Armor Crate Key | 13.99 | `crate key give {username} armor 10` |
| 25x Armor Crate Key | 32.99 | `crate key give {username} armor 25` |
| 1x Weapon Crate Key | 2.99 | `crate key give {username} weapon 1` |
| 5x Weapon Crate Key | 7.49 | `crate key give {username} weapon 5` |
| 10x Weapon Crate Key | 13.99 | `crate key give {username} weapon 10` |
| 25x Weapon Crate Key | 32.99 | `crate key give {username} weapon 25` |

Prices follow OG Network's pattern: about 3 for one key, cheaper per key in bigger bundles.

## Command settings (important)

On every command:
- **Require player to be online: ON.** Keys are items, so the player must be online to receive them. Tebex waits
  and delivers when they next join.
- Don't add a slash at the start: Tebex runs it from the console.

## Descriptions (paste into each package)

Armor:
> {N}x Armor Crate Key. Use it at the Armor Crate (`/warp crates`): pick the armor piece you want and pay with keys.
> Keys are items, delivered when you're online.

Weapon:
> {N}x Weapon Crate Key. Use it at the Weapon Crate (`/warp crates`): pick the weapon or tool you want and pay with keys.
> Keys are items, delivered when you're online.

## Test

1. Tebex → **Payments → Create manual payment** for your own name with `1x Armor Crate Key`
   (or buy it with a 100% coupon).
2. Be online. Within about a minute you should get 1 Armor Key and the chat message "You received 1x Armor Key".
3. Nothing after 2 minutes: check the server console for a `tebex` line, and that the package command has no `/`.

## Note

Tebex reviews stores against Minecraft's commercial usage rules. Keys that buy gear above vanilla limits count as
paid gameplay advantages, which the rules don't allow, so Tebex may ask you to change these during review.
