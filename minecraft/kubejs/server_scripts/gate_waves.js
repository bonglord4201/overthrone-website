// OVERTHRONE - Solo Leveling (SLR) gate waves: 2 gates open together every hour.
//
// Uses SLR's own gate spawning, so the gates are real SLR gates (right ranks, loot, bosses):
//   - between waves the gamerule soloGateDelay is set very high, so no random gates appear
//   - when a wave starts, soloGateDelay is set to 1 second for BURST_SECONDS, which lets SLR
//     open about one gate per second near players in the Overworld, then it goes back to "off"
// SLR only spawns gates in the Overworld and only near players there, so a wave waits until
// at least one player is in the Overworld (checked every minute).
//
// Staff (op):
//   /gatewave now     start a wave right away (testing)
//   /gatewave info    time until the next wave

(function () {
  const WAVE_EVERY_MINUTES = 60
  const BURST_SECONDS = 2          // ~1 gate per second -> 2 gates. Raise/lower if a wave gives too few/many.
  const OFF_DELAY = 1000000        // soloGateDelay between waves (seconds) = no natural gates
  const WORLD = 'minecraft:overworld'

  const dimOf = (e) => {
    var k = e.level.dimension
    if (typeof k === 'function') k = e.level.dimension()
    return String(k && k.location ? k.location() : k)
  }
  const inOverworld = (server) => {
    var n = 0
    server.players.forEach(p => { if (dimOf(p) == WORLD) n++ })
    return n
  }
  const later = (server, ticks, fn) => { try { server.scheduleInTicks(ticks, () => { try { fn() } catch (e) { console.error('gate_waves: ' + e) } }) } catch (e) { fn() } }

  var nextWave = 0      // server tick of the next wave
  var bursting = false

  const startWave = (server) => {
    if (bursting) return 'busy'
    if (inOverworld(server) == 0) return 'nobody'
    bursting = true
    server.runCommandSilent('gamerule soloGateDelay 1')
    server.runCommandSilent('tellraw @a ["",{"text":"GATES ","color":"dark_purple","bold":true},{"text":"» ","color":"dark_gray"},{"text":"2 Gates are opening in the ","color":"gray"},{"text":"Wild","color":"light_purple","bold":true},{"text":"! Type /wild to hunt them.","color":"gray"}]')
    server.runCommandSilent('execute as @a at @s run playsound minecraft:block.end_portal.spawn master @s ~ ~ ~ 0.6 1.2')
    later(server, BURST_SECONDS * 20, () => {
      server.runCommandSilent('gamerule soloGateDelay ' + OFF_DELAY)
      bursting = false
    })
    nextWave = server.tickCount + WAVE_EVERY_MINUTES * 60 * 20
    return 'started'
  }

  ServerEvents.loaded(event => {
    event.server.runCommandSilent('gamerule soloGateDelay ' + OFF_DELAY)   // no random gates between waves
  })

  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 1200 != 0) return                 // check once a minute
    if (nextWave == 0) { nextWave = s.tickCount + WAVE_EVERY_MINUTES * 60 * 20; return }
    if (s.tickCount < nextWave) return
    startWave(s)                                        // if nobody is in the Overworld, tries again next minute
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    const P = '§5§lGATES §8» §7'
    const say = (ctx, m) => ctx.source.sendSystemMessage(Text.of(m))
    event.register(Commands.literal('gatewave').requires(src => src.hasPermission(2))
      .then(Commands.literal('now').executes(ctx => {
        var r = startWave(ctx.source.server)
        say(ctx, P + (r == 'started' ? '§aWave started.' : r == 'nobody' ? '§cNobody is in the Overworld (SLR only spawns gates there).' : '§cA wave is already opening.'))
        return 1
      }))
      .then(Commands.literal('info').executes(ctx => {
        var s = ctx.source.server
        var mins = nextWave == 0 ? WAVE_EVERY_MINUTES : Math.max(0, Math.ceil((nextWave - s.tickCount) / 1200))
        say(ctx, P + 'Next wave in §f' + mins + ' min§7. Players in the Overworld: §f' + inOverworld(s))
        return 1
      })))
  })
})()
