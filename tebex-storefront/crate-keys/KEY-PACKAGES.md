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

## All commands (purchase, refund, chargeback)

In each package → **Game server commands**, add these. Tebex lets you pick when each command runs
(the dropdown next to the command: *When the package is purchased / refunded / charged back*).
Don't start any command with `/`, and keep `{username}` exactly as written.

- **Purchase** gives the keys.
- **Refund** takes the same number of keys back (only the ones they still have; keys already used can't be undone).
- **Chargeback** takes the keys back **and bans** the player. The ban works even if they're offline, so that
  command has "require online" OFF. Unban someone with `pardon <name>` once it's sorted.

### 1x Armor Crate Key

| When | Command | Require online |
|---|---|---|
| **Purchase** | `crate key give {username} armor 1` | ON |
| **Refund** | `crate key take {username} armor 1` | ON |
| **Chargeback** | `crate key take {username} armor 1` | ON |
| **Chargeback** | `ban {username} Chargeback on the store. Open a ticket on our Discord to appeal.` | OFF |

### 5x Armor Crate Key

| When | Command | Require online |
|---|---|---|
| **Purchase** | `crate key give {username} armor 5` | ON |
| **Refund** | `crate key take {username} armor 5` | ON |
| **Chargeback** | `crate key take {username} armor 5` | ON |
| **Chargeback** | `ban {username} Chargeback on the store. Open a ticket on our Discord to appeal.` | OFF |

### 10x Armor Crate Key

| When | Command | Require online |
|---|---|---|
| **Purchase** | `crate key give {username} armor 10` | ON |
| **Refund** | `crate key take {username} armor 10` | ON |
| **Chargeback** | `crate key take {username} armor 10` | ON |
| **Chargeback** | `ban {username} Chargeback on the store. Open a ticket on our Discord to appeal.` | OFF |

### 25x Armor Crate Key

| When | Command | Require online |
|---|---|---|
| **Purchase** | `crate key give {username} armor 25` | ON |
| **Refund** | `crate key take {username} armor 25` | ON |
| **Chargeback** | `crate key take {username} armor 25` | ON |
| **Chargeback** | `ban {username} Chargeback on the store. Open a ticket on our Discord to appeal.` | OFF |

### 1x Weapon Crate Key

| When | Command | Require online |
|---|---|---|
| **Purchase** | `crate key give {username} weapon 1` | ON |
| **Refund** | `crate key take {username} weapon 1` | ON |
| **Chargeback** | `crate key take {username} weapon 1` | ON |
| **Chargeback** | `ban {username} Chargeback on the store. Open a ticket on our Discord to appeal.` | OFF |

### 5x Weapon Crate Key

| When | Command | Require online |
|---|---|---|
| **Purchase** | `crate key give {username} weapon 5` | ON |
| **Refund** | `crate key take {username} weapon 5` | ON |
| **Chargeback** | `crate key take {username} weapon 5` | ON |
| **Chargeback** | `ban {username} Chargeback on the store. Open a ticket on our Discord to appeal.` | OFF |

### 10x Weapon Crate Key

| When | Command | Require online |
|---|---|---|
| **Purchase** | `crate key give {username} weapon 10` | ON |
| **Refund** | `crate key take {username} weapon 10` | ON |
| **Chargeback** | `crate key take {username} weapon 10` | ON |
| **Chargeback** | `ban {username} Chargeback on the store. Open a ticket on our Discord to appeal.` | OFF |

### 25x Weapon Crate Key

| When | Command | Require online |
|---|---|---|
| **Purchase** | `crate key give {username} weapon 25` | ON |
| **Refund** | `crate key take {username} weapon 25` | ON |
| **Chargeback** | `crate key take {username} weapon 25` | ON |
| **Chargeback** | `ban {username} Chargeback on the store. Open a ticket on our Discord to appeal.` | OFF |

## Command settings (important)

- **Require player to be online: ON** for the give/take commands. Keys are items, so the player must be online.
  Tebex waits and runs it when they next join.
- **OFF** for the ban command.

## Descriptions

Short OG-style text for every package is in `DESCRIPTIONS.md`, with `armor-rewards.png` / `weapon-rewards.png` underneath.

## Test

1. Tebex → **Payments → Create manual payment** for your own name with `1x Armor Crate Key`
   (or buy it with a 100% coupon).
2. Be online. Within about a minute you should get 1 Armor Key and the chat message "You received 1x Armor Key".
3. Nothing after 2 minutes: check the server console for a `tebex` line, and that the package command has no `/`.

## Note

Tebex reviews stores against Minecraft's commercial usage rules. Keys that buy gear above vanilla limits count as
paid gameplay advantages, which the rules don't allow, so Tebex may ask you to change these during review.
