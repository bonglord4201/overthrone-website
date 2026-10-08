// OVERTHRONE - Nether portals in the RPG world take players back to the hub instead of the Nether.
// Drop into kubejs/server_scripts/ and run /reload (or restart).

const RPG_WORLD = 'multiworld:rpg'
const HUB_COMMAND = 'warp hub'   // run as the player; falls back to the overworld spawn if it fails
const lastSent = {}

PlayerEvents.tick(event => {
  const player = event.player
  if (String(player.level.dimension).indexOf(RPG_WORLD) < 0) return

  // Keep the vanilla portal from ever firing in this world (works in creative too)
  player.setPortalCooldown(40)

  const feet = player.block
  if (String(feet.id) !== 'minecraft:nether_portal' && String(feet.up.id) !== 'minecraft:nether_portal') return

  const server = player.server
  const name = player.username
  const now = server.tickCount
  if (lastSent[name] && now - lastSent[name] < 60) return   // once per 3 seconds
  lastSent[name] = now

  player.tell('§6✦ §eReturning to the §6§lHUB§e...')
  server.runCommandSilent(`playsound minecraft:block.portal.travel player ${name} ~ ~ ~ 0.4 1.4`)

  const ok = server.runCommandSilent(`execute as ${name} run ${HUB_COMMAND}`)
  if (!ok) {
    const spawn = server.overworld().getSharedSpawnPos()
    server.runCommandSilent(`execute in minecraft:overworld run tp ${name} ${spawn.x + 0.5} ${spawn.y} ${spawn.z + 0.5}`)
  }
})
