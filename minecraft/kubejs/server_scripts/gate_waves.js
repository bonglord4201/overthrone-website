// OVERTHRONE - Solo Leveling (SLR) gate waves: 2 gates open together every hour.
//
// Uses SLR's own gate spawning, so the gates are real SLR gates (right ranks, loot, bosses):
//   - between waves the gamerule soloGateDelay is set very high, so no random gates appear
//   - when a wave starts, soloGateDelay is set to 1 second and the script counts SLR gate entities
//     in the Overworld; as soon as GATES_PER_WAVE new ones exist (or MAX_BURST_SECONDS pass) it goes
//     back to "off". Each wave shows a title on screen with fireworks.
// SLR only spawns gates in the Overworld and only near players there, so a wave waits until
// at least one player is in the Overworld (checked every minute).
//
// Staff (op):
//   /gatewave now     start a wave right away (testing)
//   /gatewave info    time until the next wave

(function () {
  const WAVE_EVERY_MINUTES = 60
  const GATES_PER_WAVE = 2
  const MAX_BURST_SECONDS = 30     // safety stop if gates can't be counted
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

  // SLR gates = entities from the sololeveling mod with "gate" in their id
  const countGates = (server) => {
    var n = 0
    try {
      server.overworld().getAllEntities().forEach(e => {
        var id = String(e.type)
        if (id.indexOf('sololeveling') >= 0 && id.indexOf('gate') >= 0) n++
      })
    } catch (e) { return -1 }
    return n
  }

  const celebrate = (server) => {
    server.runCommandSilent('title @a times 10 60 20')
    server.runCommandSilent('title @a subtitle {"text":"' + GATES_PER_WAVE + ' Gates have opened in the Wild - type /wild","color":"light_purple"}')
    server.runCommandSilent('title @a title {"text":"GATES OPENED","color":"dark_purple","bold":true}')
    server.runCommandSilent('execute as @a at @s run playsound minecraft:block.end_portal.spawn master @s ~ ~ ~ 0.6 1.2')
    server.players.forEach(p => {
      var n = p.username
      for (var i = 0; i < 3; i++) {
        later(server, i * 10, () => server.runCommandSilent(`execute at ${n} run summon minecraft:firework_rocket ~${(Math.random() * 6 - 3).toFixed(1)} ~1 ~${(Math.random() * 6 - 3).toFixed(1)} {LifeTime:20,FireworksItem:{id:"minecraft:firework_rocket",count:1,components:{"minecraft:fireworks":{flight_duration:1,explosions:[{shape:"large_ball",colors:[I;11141290,5592575],fade_colors:[I;16777215],has_twinkle:true,has_trail:true}]}}}}`))
      }
    })
    server.runCommandSilent('tellraw @a ["",{"text":"GATES ","color":"dark_purple","bold":true},{"text":"» ","color":"dark_gray"},{"text":"' + GATES_PER_WAVE + ' Gates have opened in the ","color":"gray"},{"text":"Wild","color":"light_purple","bold":true},{"text":"! Type /wild to hunt them.","color":"gray"}]')
  }

  const startWave = (server) => {
    if (bursting) return 'busy'
    if (inOverworld(server) == 0) return 'nobody'
    bursting = true
    var start = countGates(server), waited = 0
    server.runCommandSilent('gamerule soloGateDelay 1')
    const check = () => {
      waited += 10
      var now = countGates(server)
      var done = (start >= 0 && now - start >= GATES_PER_WAVE) || waited >= MAX_BURST_SECONDS * 20
      if (!done) { later(server, 10, check); return }
      server.runCommandSilent('gamerule soloGateDelay ' + OFF_DELAY)
      bursting = false
      console.info('[gate_waves] wave done: ' + (start < 0 ? '?' : (now - start)) + ' new gates in ' + (waited / 20) + ' s')
      celebrate(server)
    }
    later(server, 10, check)
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
        say(ctx, P + (r == 'started' ? '§aWave started (gates counted now: §f' + countGates(ctx.source.server) + '§a).' : r == 'nobody' ? '§cNobody is in the Overworld (SLR only spawns gates there).' : '§cA wave is already opening.'))
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
