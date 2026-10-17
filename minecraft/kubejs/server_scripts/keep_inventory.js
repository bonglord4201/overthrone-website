// OVERTHRONE - players keep their inventory when they die EVERYWHERE except the SMP world (/smp).
// 1. The keepInventory game rule is switched on (on start, after /reload and every minute, in every world,
//    in case a world has its own rules), so nobody loses items in the hub, RPG World, wild, survival...
// 2. In the SMP world only: when a player dies, everything in their inventory (hotbar, armour, offhand)
//    is dropped where they died, like normal Minecraft.
//
// Staff (op):  /keepinv   shows the world you're in and whether you'd keep or drop your items there

(function () {
  // the SMP world (/smp). Its real world id is multiworld:wild (renamed to SMP). Check yours with /keepinv
  const DROP_WORLDS = ['multiworld:wild']

  const dimOf = (level) => {
    var k = level.dimension
    if (typeof k === 'function') k = level.dimension()
    return String(k && k.location ? k.location() : k)
  }
  const isDropWorld = (d) => DROP_WORLDS.indexOf(d) >= 0

  var GameRules = null
  try { GameRules = Java.loadClass('net.minecraft.world.level.GameRules') } catch (x) { }
  const keepOn = (s) => {
    try { s.runCommandSilent('gamerule keepInventory true') } catch (x) { }
    if (GameRules == null) return
    s.getAllLevels().forEach(l => {
      try { var r = l.getGameRules().getRule(GameRules.RULE_KEEPINVENTORY); if (!r.get()) r.set(true, s) } catch (x) { }
    })
  }
  ServerEvents.loaded(event => keepOn(event.server))
  ServerEvents.tick(event => { if (event.server.tickCount % 1200 == 0) keepOn(event.server) })

  // SMP world: drop everything on death (keepInventory would otherwise keep it)
  EntityEvents.death(event => {
    try {
      var p = event.entity
      if (!p || !p.isPlayer()) return
      if (!isDropWorld(dimOf(p.level))) return
      p.getInventory().dropAll()
    } catch (x) { console.warn('[keep_inventory] ' + x) }
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('keepinv').requires(src => src.hasPermission(2)).executes(ctx => {
      var p = ctx.source.playerOrException, d = dimOf(p.level)
      keepOn(p.server)
      p.tell('§6§lINVENTORY §8» §7World: §f' + d + ' §7- ' + (isDropWorld(d) ? '§cSMP: items DROP on death' : '§aitems are KEPT on death'))
      return 1
    }))
  })
})()
