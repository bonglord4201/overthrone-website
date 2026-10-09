# OVERTHRONE SMP Discord Bot

Node.js (discord.js v14). No database server needed: everything is saved in `data/db.json`.

## What it does

| Area | Commands / features |
|---|---|
| Minecraft linking | `/link` sends a 6-digit code to the player **in-game**, `/verify` finishes it. Gives the **Linked** role, runs reward commands, `/unlink`, `/whois` |
| Live server status | Auto-updating status message, `/status`, `/players`, bot activity shows players online, Members / Players counter channels |
| Info | `/ip` `/store` `/vote` `/rules` `/website` `/help` |
| Tickets | Panel with 5 types (Support, Report, Appeal, Store, Staff Application), private channels, close button, transcripts to `ticket-logs` and DM |
| Moderation | `/warn` `/warnings` `/clearwarnings` `/timeout` `/kick` `/ban` `/unban` `/purge`, invite-link filter, all logged to `mod-logs` |
| Logging | Joins, leaves, deleted and edited messages, bans to `bot-logs` / `mod-logs` |
| Welcome | Branded welcome message with IP and links, optional auto-role |
| Levels | XP for chatting, level-up messages, `/rank`, `/leaderboard`, optional reward roles |
| Community | `/suggest` (with votes and a thread), staff `/suggestion`, `/giveaway`, `/rolepanel`, `/announce` |
| Server control | `/mc command`, `/mc say`, `/mc whitelist`, `/mc list` (admins only, through RCON) |
| Server organiser | `/server preview` · `/server apply` · `/server content` · `/server restore` (see below) |

## Setup

1. **Discord Developer Portal**
   - Go to https://discord.com/developers/applications, click **New Application** and name it "OVERTHRONE".
   - Open **Bot**, click **Reset Token** and copy the token.
   - Under **Privileged Gateway Intents**, turn on **Server Members Intent** and **Message Content Intent**.
2. **Invite the bot**
   - Open **OAuth2 → URL Generator**.
   - Tick `bot` and `applications.commands`, then **Administrator**.
   - Open the link and add the bot to your server.
   - In Server Settings → Roles, drag the bot's role near the top.
3. **Minecraft server (RCON)**
   - In MintServers, add an extra port (allocation) to the Minecraft server.
   - In `server.properties` set:
     - `enable-rcon=true`
     - `rcon.port=<that port>`
     - `rcon.password=<a long random password>`
   - Restart the server.
4. **Bot host (MintServers Node.js server)**
   - Upload every file in this folder, but **not** `node_modules`.
   - Create `.env` from `.env.example` and fill in `DISCORD_TOKEN`, `RCON_PORT` and `RCON_PASSWORD`.
   - Set the startup / main file to `index.js` and Node.js 20 or newer, then start the server.
5. **In Discord**
   - Run `/setup`, give your staff the **Staff** role, then run `/ticket panel` in your support channel.

## Organising the whole Discord (`/server`)

Admins only. The bot needs the **Administrator** permission.

1. **`/server preview`**: changes nothing. Lists every change it would make and any staff channel that members can see right now. The full plan comes as a file.
2. **`/server apply confirm:True`**: saves a backup (`data/backups/`, also sent to you), then:
   - creates only the **missing** roles (In-Game Admin, Staff, Linked, ping roles). Existing roles are never changed.
   - creates only the **missing** staff channels (build-team, in-game-staff, mod-logs, bot-logs, ticket-logs) and a private ticket category
   - fixes real problems only: staff channels members can see become staff-only, and info/guide channels members can post in become read-only. Staff roles get access to the staff area.
   - **never moves, renames, reorders or deletes anything**. `how-to-play` is never touched.
   It's safe to run again: the second run changes nothing.
3. **`/server content`**: posts the welcome, rules, website links, FAQ, useful commands, mods & keybinds, quests and bosses posts, plus the ticket panel and the ping-role panel. Running it again edits those posts instead of reposting them. Use `only:` to do one channel at a time. Add `clear_old:True` to archive the old messages in those channels to bot-logs and remove them first.
4. **`/server restore confirm:True`**: puts every channel's permissions back the way they were before the last apply. `original:True` goes back to before the first one.

The layout is in `src/blueprint.js`. The posts come from `content.json`, which `node scripts/build-discord-content.mjs` builds from the website's guide and rules, so Discord and the website always match.

## Editing

Edit `config.json` to change these, then restart the bot:
- links
- colors
- ticket types and questions
- link rewards (`{player}` = their Minecraft name)
- level reward roles, e.g. `"roleRewards": { "10": "Active", "25": "Veteran" }`

## Security

- The bot token and RCON password belong **only** in `.env` on the bot host.
- Never commit them or paste them in Discord.
- `/mc` gives full console access and is limited to Administrators.
