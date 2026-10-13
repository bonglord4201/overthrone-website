// OVERTHRONE - where players can get hurt.
// Safe worlds (no damage at all): the hub and the RPG World. Everywhere else (Wild/Overworld, SMP,
// Survival, Resource, Nether, End, dungeons...) players take damage normally.
// Uses the player's own "invulnerable" flag, so it also clears a flag some other mod or script
// left switched on (that made players immune everywhere: "Target is invulnerable").
//
// Staff (op):
//   /damagezones          shows your world, whether it is safe and your current flag

(function () {
  const SAFE_WORLDS = ['multiworld:hub', 'multiworld:rpg']

  const dimOf = (e) => {
    var k = e.level.dimension
    if (typeof k === 'function') k = e.level.dimension()
    return String(k && k.location ? k.location() : k)
  }
  const isSafe = (p) => SAFE_WORLDS.indexOf(dimOf(p)) >= 0

  const apply = (p) => {
    var want = isSafe(p)
    if (p.isInvulnerable() != want) p.setInvulnerable(want)
  }

  // once a second for everyone online (also covers teleports, portals, /mw tp and logins)
  ServerEvents.tick(event => {
    if (event.server.tickCount % 20 != 0) return
    event.server.players.forEach(p => { try { apply(p) } catch (e) { } })
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('damagezones').requires(src => src.hasPermission(2)).executes(ctx => {
      var p = ctx.source.playerOrException
      p.tell('§6§lDAMAGE §8» §7World: §f' + dimOf(p) + ' §7- ' + (isSafe(p) ? '§aSAFE (no damage)' : '§cDANGER (damage on)') +
        ' §7- invulnerable flag: §f' + p.isInvulnerable())
      return 1
    }))
  })
})()
