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
