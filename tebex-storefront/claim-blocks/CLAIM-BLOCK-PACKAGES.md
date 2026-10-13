# Claim block packages (Tebex)

Claims use the **Flan** mod (server only). A package adds claim blocks with Flan's admin command
`flan giveClaimBlocks <player> <amount>`; a negative amount takes them back (refunds/chargebacks).
Claim blocks are stored by Flan even while the player is offline, so purchase commands don't need the
player online.

## Category

Tebex → **Packages → Create Category** → name **Claim Blocks**.

Category description:
> Protect more land! Claim blocks let you claim a bigger area with your golden shovel. Right-click two
> opposite corners of your base to claim it. 1 block of area = 1 claim block. Delivered instantly.

## Packages

| Package name | Price (AUD) | Purchase command |
|---|---|---|
| 1,000 Claim Blocks | 2.99 | `flan giveClaimBlocks {username} 1000` |
| 2,500 Claim Blocks | 5.99 | `flan giveClaimBlocks {username} 2500` |
| 5,000 Claim Blocks | 9.99 | `flan giveClaimBlocks {username} 5000` |
| 10,000 Claim Blocks | 17.99 | `flan giveClaimBlocks {username} 10000` |

## Commands per package

Don't start commands with `/`; keep `{username}` exactly as written.

| When | Command | Require online |
|---|---|---|
| Purchase | `flan giveClaimBlocks {username} <amount>` | OFF |
| Refund | `flan giveClaimBlocks {username} -<amount>` | OFF |
| Chargeback | `flan giveClaimBlocks {username} -<amount>` | OFF |
| Chargeback | `ban {username} Chargeback` | OFF |

Example for 2,500: purchase `flan giveClaimBlocks {username} 2500`, refund `flan giveClaimBlocks {username} -2500`.

## Package description (same for all, change the number)

> **2,500 Claim Blocks**
> Claim a bigger base and keep it safe from griefers.
> • Adds 2,500 claim blocks to your account instantly
> • Claim with a golden shovel: right-click two opposite corners (`/claimtool` if you need one)
> • Check your blocks with `/flan info` · How claims work: `/claims`
> • Works in the Wild and Survival worlds
