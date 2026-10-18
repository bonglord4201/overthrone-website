// OVERTHRONE - extra block protection for the hub and the RPG World (including the Caverns), on top of the
// FTB Chunks claims + "TenSura Compat: FTB" mod (those protect claimed land from PLAYERS' skills, but a player who is
// in the claiming team or has admin bypass is allowed, and mobs/bosses aren't players).
//
// 1. Blocks that get lifted/moved/sucked up: those skills turn blocks into "falling block" entities. In the hub and the
//    RPG World a falling block is never allowed to appear: the block is put straight back where it came from.
// 2. Mob griefing: NeoForge asks "may this entity grief?" (EntityMobGriefingEvent) for mobs and anything that uses the
//    mobGriefing rule. In the hub and the RPG World the answer is always no.
// Players with the tag rpg_builder (and ops in creative) can still build normally; this only stops blocks being
// moved or destroyed by skills, mobs and explosions-like effects.
//
// Staff (op):  /griefguard   what it has blocked since the last restart/reload (shows which part catches your skills)

(function () {
  const WORLDS = ['multiworld:hub', 'multiworld:rpg']
  var stats = { restored: 0, griefDenied: 0 }

  const dimOf = (level) => {
    var k = level.dimension
    if (typeof k === 'function') k = level.dimension()
    return String(k && k.location ? k.location() : k)
  }
  const protectedLevel = (level) => { try { return !!level && WORLDS.indexOf(dimOf(level)) >= 0 } catch (x) { return false } }

  // 1. falling blocks (moved / lifted / sucked-up blocks): put the block back, don't let the entity exist
  EntityEvents.spawned('minecraft:falling_block', event => {
    try {
      var level = event.level, e = event.entity
      if (!protectedLevel(level)) return
      var state = null, pos = null
      try { state = e.getBlockState() } catch (x) { }
      try { pos = e.getStartPos() } catch (x) { }
      if (pos == null) { try { pos = e.blockPosition() } catch (x) { } }
      if (state != null && pos != null) {
        try { if (level.getBlockState(pos).isAir()) level.setBlock(pos, state, 3) } catch (x) { }
      }
      event.cancel()
      stats.restored++
    } catch (x) { console.warn('[grief_guard] falling block: ' + x) }
  })

  // 2. "may this entity grief?" -> never in the hub / RPG World
  try {
    NativeEvents.onEvent('net.neoforged.neoforge.event.entity.EntityMobGriefingEvent', event => {
      try {
        var e = event.getEntity()
        if (!e || !protectedLevel(e.level)) return
        event.setCanGrief(false)
        stats.griefDenied++
      } catch (x) { }
    })
  } catch (x) { console.warn('[grief_guard] could not listen to EntityMobGriefingEvent: ' + x) }

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('griefguard').requires(src => src.hasPermission(2)).executes(ctx => {
      ctx.source.sendSystemMessage(Text.of('§6[griefguard] §7Hub + RPG World: moved/lifted blocks put back: §f' + stats.restored +
        '§7 · grief attempts denied: §f' + stats.griefDenied))
      return 1
    }))
  })
})()
