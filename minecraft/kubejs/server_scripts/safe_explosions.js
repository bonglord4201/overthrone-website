// OVERTHRONE - no explosions or skill griefing in the safe worlds.
// 1. Any explosion (Tensura skills, creepers, TNT, modded bombs...) that starts in the hub or the RPG World is cancelled.
// 2. Skills breaking blocks in the hub/RPG world is handled by the "TenSura Compat: FTB" mod + the hub team's
//    FTB Chunks claims (not by this script).
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
  const isSafe = (level) => { try { return !!level && SAFE_WORLDS.indexOf(dimOf(level)) >= 0 } catch (e) { return false } }

  LevelEvents.beforeExplosion(event => {
    try {
      if (isSafe(event.level)) event.cancel()
    } catch (e) { }
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('safeexplosions').requires(src => src.hasPermission(2)).executes(ctx => {
      var p = ctx.source.playerOrException, d = dimOf(p.level), safe = SAFE_WORLDS.indexOf(d) >= 0
      p.tell('§6§lEXPLOSIONS §8» §7World: §f' + d + ' §7- ' + (safe ? '§aBLOCKED (safe world)' : '§cALLOWED'))
      return 1
    }))
  })
})()
