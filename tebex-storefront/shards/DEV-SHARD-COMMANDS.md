# OVERTHRONE – Throne Shards: commands for the developer

The Tebex store is set up to run **one console command** when someone buys a Throne Shards package.
That command doesn't exist on the server yet. Please add it, or tell me the real command if
the shards plugin/mod you use already has one, and I'll update Tebex.

## The command Tebex will run

```
shards give <player> <amount>
```

- Run by the **server console** (Tebex delivery), so it must work without a player executing it.
- `<player>` is the buyer's Minecraft username. Tebex fills it in with `{username}`.
- `<amount>` is a whole number. It **adds** to the player's balance (never sets or replaces it).
- It should print a success line to the console, and tell the player in chat if they're online,
  e.g. `+1,000 Throne Shards added to your balance.`
- If the player has never joined, either create their balance or fail with a clear console error.

Useful extras for staff (not used by Tebex):

```
shards take <player> <amount>     remove shards (refunds / chargebacks)
shards set <player> <amount>      set an exact balance
shards balance [player]           check a balance (players see their own)
```

## What is set in Tebex (one command per package)

| Package | Shards given | On purchase | On refund / chargeback |
|---|---|---|---|
| 500 Throne Shards | 500 | `shards give {username} 500` | `shards take {username} 500` |
| 1,000 Throne Shards (+50 bonus) | 1,050 | `shards give {username} 1050` | `shards take {username} 1050` |
| 2,500 Throne Shards (+300 bonus) | 2,800 | `shards give {username} 2800` | `shards take {username} 2800` |
| 5,500 Throne Shards (+400 bonus) | 5,900 | `shards give {username} 5900` | `shards take {username} 5900` |
| 9,000 Throne Shards (+2,500 bonus) | 11,500 | `shards give {username} 11500` | `shards take {username} 11500` |
| 15,000 Throne Shards (+3,750 bonus) | 18,750 | `shards give {username} 18750` | `shards take {username} 18750` |
| 25,000 Throne Shards (+8,500 bonus) | 33,500 | `shards give {username} 33500` | `shards take {username} 33500` |
| 50,000 Throne Shards (+21,500 bonus) | 71,500 | `shards give {username} 71500` | `shards take {username} 71500` |

Each command is set to **"Require the player to be online"**, so Tebex waits and runs it when
the buyer next joins.

## Also needed on the server

1. The **Tebex plugin/mod for NeoForge 1.21.1** installed and linked with the store's **secret key**.
   The secret key goes only in the server's Tebex config. Never put it on the website, in GitHub or in chat.
2. A test purchase (Tebex lets you create a free/test payment) to confirm shards arrive.
3. Throne Shards should only buy **cosmetics** (tags, particles, pets etc.). Selling gear or
   gameplay advantages for shards breaks Mojang's rules and Tebex can reject the store.

If you'd rather use different command names, that's fine. Just send me the exact format and I'll
change all eight packages in Tebex.
