#!/bin/sh
# Simulates mob_spawns.js against a fake server/world (no Minecraft needed). Run from the repo root:
#   sh minecraft/tests/mob_spawns/run.sh
# test.js  : duplicate spawns merged, stacked/leftover floating texts removed, countdown ticks, respawn
# test2.js : a summoned mob pushed away is still found (no repeat summons), wild mobs aren't taken
# test3.js : boss rotation shows exactly one "Random Boss" text, then the boss's own text
# test4.js : a mob that unloads and comes back doesn't leave a duplicate
cd "$(dirname "$0")"
for t in test.js test2.js test3.js test4.js; do echo "== $t"; node "$t" ../../kubejs/server_scripts/mob_spawns.js || exit 1; done
