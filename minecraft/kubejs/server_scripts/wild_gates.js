// OVERTHRONE - Solo Leveling (SLR) gates in the Wild world.
// SLR only spawns natural gates in the Overworld, so this spawns them in multiworld:wild:
// every INTERVAL_MINUTES, GATES_PER_WAVE gates appear near players who are in the Wild world.
//
// GATES lists the entity IDs to pick from. Find them by typing  /summon sololeveling:  and pressing Tab.
// Add an ID more than once to make it more common.
//
// Staff (op):
//   /wildgates now      spawn a wave right away (testing)
//   /wildgates count    how many of these gates exist in the Wild world right now

(function () {
  const WORLD = 'multiworld:wild'
  const INTERVAL_MINUTES = 30
  const GATES_PER_WAVE = 5
  const MAX_GATES = 15            // no new wave while this many are still standing in Wild
  const MIN_DIST = 40, MAX_DIST = 150   // blocks from the chosen player
  const GATES = [
    'sololeveling:monarch_territory_frost_gate',
    // paste more gate entity IDs here, e.g. 'sololeveling:e_rank_gate',
  ]
  const P = '§5§lGATES §8» §7'

  const dimOf = (e) => {
    var k = e.level.dimension
    if (typeof k === 'function') k = e.level.dimension()
    return String(k && k.location ? k.location() : k)
  }
  const wildPlayers = (server) => {
    var out = []
    server.players.forEach(p => { if (dimOf(p).indexOf(WORLD) >= 0) out.push(p) })
    return out
  }
  const countGates = (server) => {
    var n = 0, seen = {}
    for (var i = 0; i < GATES.length; i++) {
      if (seen[GATES[i]]) continue
      seen[GATES[i]] = true
      n += Number(server.runCommandSilent(`execute in ${WORLD} if entity @e[type=${GATES[i]}]`)) || 0
    }
    return n
  }

  const wave = (server, force) => {
    var players = wildPlayers(server)
    if (players.length == 0) return 'nobody'
    if (!force && countGates(server) >= MAX_GATES) return 'full'
    var made = 0
    for (var i = 0; i < GATES_PER_WAVE; i++) {
      var p = players[Math.floor(Math.random() * players.length)]
      var ang = Math.random() * Math.PI * 2, dist = MIN_DIST + Math.random() * (MAX_DIST - MIN_DIST)
      var x = Math.floor(p.getX() + Math.cos(ang) * dist), z = Math.floor(p.getZ() + Math.sin(ang) * dist)
      var id = GATES[Math.floor(Math.random() * GATES.length)]
      // stand it on the ground: highest solid block at that x/z
      var ok = server.runCommandSilent(`execute in ${WORLD} positioned ${x} 0 ${z} positioned over motion_blocking_no_leaves run summon ${id} ~ ~ ~`)
      if (ok) made++
    }
    if (made > 0) {
      server.runCommandSilent(`tellraw @a ["",{"text":"GATES ","color":"dark_purple","bold":true},{"text":"» ","color":"dark_gray"},{"text":"${made} Gates have opened in the ","color":"gray"},{"text":"Wild","color":"light_purple","bold":true},{"text":"! Type /wild to hunt them.","color":"gray"}]`)
    }
    return 'made ' + made
  }

  var last = 0
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 200 != 0) return            // check every 10 seconds
    if (last == 0) { last = s.tickCount; return }
    if (s.tickCount - last < INTERVAL_MINUTES * 60 * 20) return
    last = s.tickCount
    try { wave(s, false) } catch (e) { console.error('wild_gates: ' + e) }
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    const say = (ctx, m) => ctx.source.sendSystemMessage(Text.of(m))
    event.register(Commands.literal('wildgates').requires(src => src.hasPermission(2))
      .then(Commands.literal('now').executes(ctx => {
        var r
        try { r = wave(ctx.source.server, true) } catch (e) { r = 'error: ' + e }
        say(ctx, P + (r == 'nobody' ? '§cNobody is in the Wild world.' : '§f' + r))
        return 1
      }))
      .then(Commands.literal('count').executes(ctx => {
        say(ctx, P + '§f' + countGates(ctx.source.server) + ' §7gates standing in the Wild world')
        return 1
      })))
  })
})()
