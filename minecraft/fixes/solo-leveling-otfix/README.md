# Solo Leveling "Failed to decode packet" fix (saved for later, NOT installed)

Made 14 Oct 2026 for **SoloCraft: Reawakening 1.3.3** (`SLR1.3.3.jar`, 42,573,194 bytes).
Only use it with that exact jar. If you've updated Solo Leveling to a newer official version, don't use this:
check whether the new version still has the bug first.

## The problem

Players sometimes get kicked when joining with:

> Internal Exception: io.netty.handler.codec.DecoderException: Failed to decode packet 'clientbound/minecraft:custom_payload'

The crash report says `Failed decoding custom payload sololeveling:legacy_message ... Invalid tag id`.

The Solo Leveling mod registers its "player stats" message twice. Which of the two runs first can change every
time the game or the server starts. When the player's game and the server pick different orders, two message
numbers swap and the player gets kicked.

**Quick workaround (no fix needed):** fully close Minecraft AND the launcher, reopen, rejoin. If it keeps
happening after 2-3 tries, restart the server.

## What the fix changes (only 2 things)

| File inside the jar | Change |
|---|---|
| `net/solocraft/network/SololevelingModVariables.class` | The duplicate registration (`registerMessage`) no longer runs. The message is still registered once in `init`, as before. Nothing else in the file is different. |
| `META-INF/neoforge.mods.toml` | `version="1.3.3"` becomes `version="1.3.3-otfix"`, so players on the old jar get a clear "mismatched mod" message instead of random kicks. |

`original/` holds the untouched versions of both files. `patch.py` is the script that made the change.

## Things to know before using it

- **Everyone must update at the same time** (server + every player). Old and new jars can't connect.
  That means releasing a new modpack version on CurseForge and Modrinth.
- Player progress (levels, stats, classes, shadows) is saved in the world, not the jar. Nothing is lost.
- If the server ever won't start with a message like "requires sololeveling 1.3.3", undo it (see below).
- When Efkrdnz releases a new official version, use theirs instead of this.

## Steps to make the fixed jar

1. Copy `SLR1.3.3.jar` from your `mods` folder to your Desktop.
2. Rename the copy to `SLR1.3.3.zip` (turn on View > Show > File name extensions if you can't see `.jar`).
3. Open the zip, go to `net` > `solocraft` > `network`, drag in this folder's `SololevelingModVariables.class`
   and choose **Replace**.
4. Go back to the top of the zip, open `META-INF`, drag in this folder's `neoforge.mods.toml` and choose **Replace**.
5. Close the zip and rename it to `SLR1.3.3-otfix.jar`.

(If Windows won't replace files inside the zip, use 7-Zip: right-click the jar > 7-Zip > Open archive, then drag
the files in.)

## Test it on just the server and you

1. Take a backup on MintServers.
2. Server: download the old `SLR1.3.3.jar` as a spare, delete it from `mods`, upload `SLR1.3.3-otfix.jar`, restart.
3. Your game: move the old `SLR1.3.3.jar` out of your instance's `mods` folder, put `SLR1.3.3-otfix.jar` in.
4. Join, play a minute, open a Solo Leveling menu. Close the game and launcher, reopen, rejoin. Repeat 4-5 times,
   restart the server once in between.
5. If it never kicks you: put `SLR1.3.3-otfix.jar` in a new modpack version (remove `SLR1.3.3.jar`) and tell players
   to update.

## Undo

Put the old `SLR1.3.3.jar` back on the server and in your game and delete `SLR1.3.3-otfix.jar`.
You're exactly where you started.
