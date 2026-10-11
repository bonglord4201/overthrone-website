# Rank package commands (Tebex) - tested on the live server 2026-10-12

Ranks come from Tanvir's `kubejs/server_scripts/serversetup/ranks.js` (FTB Ranks underneath):
- `giverank <player> <rank>` gives the rank + every lower donor rank, sets chat/tab prefix, gives class reset tokens.
- `takerank <player>` removes ALL donor ranks (staff ranks are kept).
Both need op level 4 (console has it), and both work for offline players who have joined before.
LuckPerms (`lp ...`) and `classtoken` do NOT exist on this server: don't use them.

Every command: Require online OFF. No `/` at the start.

| Rank | Purchased | Refunded | Chargebacked |
|---|---|---|---|
| Ronin | `giverank {username} ronin` | `takerank {username}` | `takerank {username}` + ban |
| Valkyrie | `giverank {username} valkyrie` | `takerank {username}` | `takerank {username}` + ban |
| Monarch | `giverank {username} monarch` | `takerank {username}` | `takerank {username}` + ban |
| Godborn | `giverank {username} godborn` | `takerank {username}` | `takerank {username}` + ban |
| Overlord | `giverank {username} overlord` | `takerank {username}` | `takerank {username}` + ban |

Ban line (chargeback): `ban {username} Chargeback on the store. Open a ticket on our Discord to appeal.`
Unban: `pardon <name>`.
Upgrade refunds: takerank removes every donor rank, so re-give their previous rank by hand (`giverank <name> <rank>`).
