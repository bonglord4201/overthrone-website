// OVERTHRONE - hub spawn + return portals.
// /setworldspawn only works in the overworld, so the hub (multiworld:hub) can't be the world spawn.
// This script remembers the hub spawn itself and sends players there:
//   - new players on their first join
//   - anyone who logs in or respawns at the overworld spawn (no bed / bed broken)
//   - anyone walking into a nether portal in a return-portal world (the RPG world's "Return to Hub" portal)
// Replaces rpg_hub_portal.js (delete that file).
//
// Staff (op):
//   /hubspawn set      stand where players should appear in the hub, facing the way they should look
//   /hubspawn info     shows the saved spot
// Everyone:
//   /hubspawn          go to the hub spawn (same as /warp hub, but never falls back to the overworld)

(function () {
  const RETURN_PORTAL_WORLDS = ['multiworld:rpg']   // every nether portal in these worlds goes to the hub
  const LOGIN_TO_HUB = false     // true = OG style: everyone starts in the hub every time they log in
  const SPAWN_RADIUS = 24        // blocks around the overworld spawn that count as "spawned in the overworld"
  const STORE = 'ot_hub_spawn'
  const SEEN = 'ot_hub_seen'
  const P = '§6§lHUB §8» §7'

  const dimOf = (e) => String(e.level.dimension.location ? e.level.dimension.location() : e.level.dimension)
  const inWorld = (e, id) => dimOf(e).indexOf(id) >= 0
  const hub = (server) => { try { var s = String(server.persistentData.getString(STORE) || ''); return s ? JSON.parse(s) : null } catch (e) { return null } }

  const sendToHub = (player, quiet) => {
    var server = player.server, h = hub(server), name = player.username
    if (h) {
      server.runCommandSilent(`execute in ${h.dim} run tp ${name} ${h.x} ${h.y} ${h.z} ${h.yaw} ${h.pitch}`)
    } else {
      server.runCommandSilent(`execute as ${name} run warp hub`)   // until /hubspawn set has been used
    }
    if (!quiet) player.tell(P + '§eWelcome to the §6§lHUB§e!')
  }

  const later = (player, ticks, fn) => { try { player.server.scheduleInTicks(ticks, () => { try { fn() } catch (e) { } }) } catch (e) { fn() } }

  const atOverworldSpawn = (player) => {
    if (dimOf(player) != 'minecraft:overworld') return false
    var s = player.server.overworld().getSharedSpawnPos()
    var dx = Number(player.getX()) - (s.x + 0.5), dz = Number(player.getZ()) - (s.z + 0.5)
    return dx * dx + dz * dz <= SPAWN_RADIUS * SPAWN_RADIUS
  }

  // First join, every join (LOGIN_TO_HUB), or logging in at the overworld spawn
  PlayerEvents.loggedIn(event => {
    var p = event.player
    var first = !p.persistentData.getBoolean(SEEN)
    p.persistentData.putBoolean(SEEN, true)
    later(p, 5, () => { if (first || LOGIN_TO_HUB || atOverworldSpawn(p)) sendToHub(p, !first) })
  })

  // Died with no bed: vanilla puts them at the overworld spawn, so move them to the hub instead
  PlayerEvents.respawned(event => {
    var p = event.player
    later(p, 2, () => { if (atOverworldSpawn(p)) sendToHub(p, true) })
  })

  // Return portals: nether portals in these worlds lead to the hub, never the Nether
  const lastSent = {}
  PlayerEvents.tick(event => {
    var p = event.player
    var listed = false
    for (var i = 0; i < RETURN_PORTAL_WORLDS.length; i++) if (inWorld(p, RETURN_PORTAL_WORLDS[i])) listed = true
    if (!listed) return
    p.setPortalCooldown(40)    // keeps the vanilla portal from firing (works in creative too)
    var feet = p.block
    if (String(feet.id) !== 'minecraft:nether_portal' && String(feet.up.id) !== 'minecraft:nether_portal') return
    var now = p.server.tickCount, name = p.username
    if (lastSent[name] && now - lastSent[name] < 60) return
    lastSent[name] = now
    p.server.runCommandSilent(`playsound minecraft:block.portal.travel player ${name} ~ ~ ~ 0.4 1.4`)
    p.tell('§6✦ §eReturning to the §6§lHUB§e...')
    sendToHub(p, true)
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    const say = (ctx, m) => ctx.source.sendSystemMessage(Text.of(m))
    const f = (n) => Number(n).toFixed(2)
    event.register(Commands.literal('hubspawn')
      .executes(ctx => { sendToHub(ctx.source.playerOrException, true); return 1 })
      .then(Commands.literal('set').requires(src => src.hasPermission(2)).executes(ctx => {
        var p = ctx.source.playerOrException
        var h = { dim: dimOf(p), x: f(p.getX()), y: f(p.getY()), z: f(p.getZ()), yaw: f(p.yaw), pitch: f(p.pitch) }
        p.server.persistentData.putString(STORE, JSON.stringify(h))
        say(ctx, P + '§aHub spawn saved: §f' + h.x + ' ' + h.y + ' ' + h.z + ' §7in §f' + h.dim)
        return 1
      }))
      .then(Commands.literal('info').requires(src => src.hasPermission(2)).executes(ctx => {
        var h = hub(ctx.source.server)
        say(ctx, P + (h ? '§f' + h.x + ' ' + h.y + ' ' + h.z + ' §7in §f' + h.dim : '§cNot set yet. Stand in the hub and use /hubspawn set'))
        return 1
      })))
  })
})()
