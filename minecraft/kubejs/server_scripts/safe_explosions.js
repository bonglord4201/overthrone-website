// OVERTHRONE - no explosions in the safe worlds.
// Any explosion (Tensura skills, creepers, TNT, modded bombs...) that starts in the hub or the RPG World is cancelled,
// so nothing can blow up the builds there. Every other world (Wild, SMP, Survival, Resource, Nether...) is untouched.
// Same safe worlds as damage_zones.js.
//
// Staff (op):  /safeexplosions   shows whether explosions are blocked where you stand

(function () {
  const SAFE_WORLDS = ['multiworld:hub', 'multiworld:rpg']

  const dimOf = (level) => {
    var k = level.dimension
    if (typeof k === 'function') k = level.dimension()
    return String(k && k.location ? k.location() : k)
  }

  LevelEvents.beforeExplosion(event => {
    try {
      if (SAFE_WORLDS.indexOf(dimOf(event.level)) >= 0) event.cancel()
    } catch (e) { }
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('safeexplosions').requires(src => src.hasPermission(2)).executes(ctx => {
      var p = ctx.source.playerOrException, d = dimOf(p.level)
      p.tell('§6§lEXPLOSIONS §8» §7World: §f' + d + ' §7- ' + (SAFE_WORLDS.indexOf(d) >= 0 ? '§aBLOCKED (safe world)' : '§cALLOWED'))
      return 1
    }))
  })
})()
