// OVERTHRONE - Solo Leveling (SLR) gates: 3 gates every hour.
//
// SLR opens its gates one at a time, every soloGateDelay seconds, near a random player in the Overworld
// (it never spawns gates in other worlds). This script keeps that delay at GATE_EVERY_MINUTES, so the
// server always runs at GATES_PER_HOUR, also after restarts or if someone changes the gamerule.
// (Switching the timer on/off to open several gates at once is unreliable: SLR opened 8-20 gates per burst.)
//
// Staff (op):
//   /gatewave info    current gate timer and players in the Overworld
//   /gatewave apply   set the timer again right now

(function () {
  const GATES_PER_HOUR = 3
  const GATE_EVERY_MINUTES = 60 / GATES_PER_HOUR      // 20 minutes
  const DELAY_SECONDS = GATE_EVERY_MINUTES * 60        // soloGateDelay value (1200)
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
  const apply = (server) => server.runCommandSilent('gamerule soloGateDelay ' + DELAY_SECONDS)

  ServerEvents.loaded(event => { apply(event.server) })

  // every 10 minutes: put the timer back if something changed it
  ServerEvents.tick(event => {
    if (event.server.tickCount % 12000 == 0) apply(event.server)
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    const P = '§5§lGATES §8» §7'
    const say = (ctx, m) => ctx.source.sendSystemMessage(Text.of(m))
    event.register(Commands.literal('gatewave').requires(src => src.hasPermission(2))
      .then(Commands.literal('info').executes(ctx => {
        say(ctx, P + 'One gate every §f' + GATE_EVERY_MINUTES + ' min §7(§f' + GATES_PER_HOUR + '/hour§7). Players in the Overworld: §f' + inOverworld(ctx.source.server))
        return 1
      }))
      .then(Commands.literal('apply').executes(ctx => {
        apply(ctx.source.server)
        say(ctx, P + '§aGate timer set: soloGateDelay ' + DELAY_SECONDS)
        return 1
      })))
  })
})()
