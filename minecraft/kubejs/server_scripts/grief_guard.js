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
// 3. (2026-10-18) Skills breaking blocks, also for OPs and claim members (they bypass the FTB claim protection, which is why
//    the owner's own skills still broke the hub): a block break that is NOT a normal hand break is cancelled here.
//    Not a hand break = more than 6 blocks from the player's eyes, or a 2nd block broken by the same player in the same tick.
//    Only works for skills that report their breaks to NeoForge (BlockEvent.BreakEvent); /griefguard watch shows the rest.
// 4. (2026-10-18) Fire that stays on the floor (e.g. Tensura's Black Fire): every 2 seconds, modded fire blocks within
//    16 blocks of each player in the hub / RPG World (Caverns included) are removed. Vanilla fire is left alone (it burns
//    out by itself, and decorative netherrack fire must stay). The fire block ids are found automatically: /griefguard fires
// Skills still work in the Caverns (and do damage); they just can't change blocks there, like everywhere in these worlds.
//
// Staff (op):  /griefguard          what it has blocked since the last restart/reload
//              /griefguard watch    on/off: live chat report of every block in the hub/RPG World that turns into air or
//                                   fire without a normal hand break (shows which skills get past the protection)
//              /griefguard fires    the fire block ids it removes
//              /griefguard rules    every game rule about griefing / skills / fire, with its value

(function () {
  const WORLDS = ['multiworld:hub', 'multiworld:rpg']
  var stats = { restored: 0, griefDenied: 0, breaksBlocked: 0, fireRemoved: 0, unexplained: 0 }
  var watchers = {}, watching = 0   // username -> true
  var tickNow = 0   // our own tick counter (no server method needed)
  ServerEvents.tick(event => { tickNow++; if (tickNow % 1200 == 0) { handBreaks = {}; lastBreak = {} } })
  const nameOf = (p) => { try { return String(p.username) } catch (x) { } try { return String(p.getGameProfile().getName()) } catch (x) { } return '?' }
  const blockId = (st) => { try { return String(st.getBlock().builtInRegistryHolder().key().location()) } catch (x) { } try { return String(st.getBlock().getDescriptionId()) } catch (x) { } return String(st) }

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

  // 3. block breaks that aren't hand breaks (skills), for everyone incl. OPs
  var handBreaks = {}   // "dim|x|y|z" -> tick of a normal hand break (the watch below ignores those)
  var lastBreak = {}    // username -> tick of their last break
  try {
    NativeEvents.onEvent('net.neoforged.neoforge.event.level.BlockEvent$BreakEvent', event => {
      try {
        var level = event.getLevel(); if (!protectedLevel(level)) return
        var p = event.getPlayer(); if (p == null) return
        var pos = event.getPos(), t = tickNow
        var dx = Number(pos.getX()) + 0.5 - Number(p.getX()), dy = Number(pos.getY()) + 0.5 - (Number(p.getY()) + 1.62), dz = Number(pos.getZ()) + 0.5 - Number(p.getZ())
        var name = nameOf(p)
        var far = dx * dx + dy * dy + dz * dz > 36, burst = lastBreak[name] == t
        lastBreak[name] = t
        if (far || burst) { event.setCanceled(true); stats.breaksBlocked++; return }
        handBreaks[dimOf(level) + '|' + pos.getX() + '|' + pos.getY() + '|' + pos.getZ()] = t
      } catch (x) { }
    })
  } catch (x) { console.warn('[grief_guard] could not listen to BlockEvent.BreakEvent: ' + x) }

  // 4. modded fire blocks (no collision, replaceable, id ends in fire/flame), found once from the block registry
  var fireIds = null
  const findFires = () => {
    var out = []
    try {
      var Reg = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries').BLOCK
      var Empty = Java.loadClass('net.minecraft.world.level.EmptyBlockGetter').INSTANCE
      var BP = Java.loadClass('net.minecraft.core.BlockPos')
      Reg.keySet().forEach(rl => {
        try {
          var id = String(rl), ns = id.split(':')[0], path = id.split(':')[1]
          if (ns == 'minecraft' || !/(fire|flame|flames)$/.test(path) || /campfire/.test(path)) return
          var st = Reg.get(rl).defaultBlockState()
          if (!st.canBeReplaced()) return
          if (!st.getCollisionShape(Empty, BP.ZERO).isEmpty()) return
          out.push(id)
        } catch (y) { }
      })
    } catch (x) { console.warn('[grief_guard] fire lookup: ' + x) }
    return out
  }
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 40 != 0) return
    if (fireIds == null) { fireIds = findFires(); console.info('[grief_guard] fire blocks removed in the hub/RPG World: ' + (fireIds.join(', ') || 'none found')) }
    if (!fireIds.length) return
    s.players.forEach(p => {
      try {
        if (!protectedLevel(p.level)) return
        var d = dimOf(p.level), x = Math.floor(Number(p.getX())), y = Math.floor(Number(p.getY())), z = Math.floor(Number(p.getZ()))
        fireIds.forEach(id => {
          var n = s.runCommandSilent(`execute in ${d} run fill ${x - 16} ${y - 8} ${z - 16} ${x + 16} ${y + 8} ${z + 16} minecraft:air replace ${id}`)
          if (Number(n) > 0) stats.fireRemoved += Number(n)
        })
      } catch (x) { }
    })
  })

  // watch: blocks in the hub/RPG World turning into air/fire without a hand break (off unless a staff member turns it on)
  try {
    NativeEvents.onEvent('net.neoforged.neoforge.event.level.BlockEvent$NeighborNotifyEvent', event => {
      if (!watching) return
      try {
        var level = event.getLevel(); if (!protectedLevel(level)) return
        var st = event.getState(), pos = event.getPos(), id = blockId(st)
        var air = false; try { air = st.isAir() } catch (y) { }
        if (!air && !/fire|flame/.test(id)) return
        var key = dimOf(level) + '|' + pos.getX() + '|' + pos.getY() + '|' + pos.getZ(), t = tickNow
        if (handBreaks[key] != null && t - handBreaks[key] < 5) return
        stats.unexplained++
        var msg = '§c[griefguard watch] §f' + pos.getX() + ' ' + pos.getY() + ' ' + pos.getZ() + ' §7became §f' + id
        Object.keys(watchers).forEach(n => { try { var w = level.getServer().getPlayerList().getPlayerByName(n); if (w) w.sendSystemMessage(Text.of(msg)) } catch (y) { } })
      } catch (x) { }
    })
  } catch (x) { console.warn('[grief_guard] could not listen to NeighborNotifyEvent: ' + x) }

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    const say = (ctx, m) => ctx.source.sendSystemMessage(Text.of(m))
    event.register(Commands.literal('griefguard').requires(src => src.hasPermission(2)).executes(ctx => {
      say(ctx, '§6[griefguard] §7Hub + RPG World (Caverns included): moved/lifted blocks put back: §f' + stats.restored +
        '§7 · grief attempts denied: §f' + stats.griefDenied + '§7 · skill block breaks blocked: §f' + stats.breaksBlocked +
        '§7 · fire blocks removed: §f' + stats.fireRemoved + '§7 · changes seen by watch: §f' + stats.unexplained)
      return 1
    })
      .then(Commands.literal('watch').executes(ctx => {
        var n = ctx.source.playerOrException.username
        if (watchers[n]) delete watchers[n]; else watchers[n] = true
        watching = Object.keys(watchers).length
        say(ctx, '§6[griefguard] §7Watch ' + (watchers[n] ? '§aON§7: use a skill in the hub/RPG World; every block it changes shows here.' : '§cOFF'))
        return 1
      }))
      .then(Commands.literal('fires').executes(ctx => {
        if (fireIds == null) fireIds = findFires()
        say(ctx, '§6[griefguard] §7Fire blocks removed in the hub/RPG World: §f' + (fireIds.join(', ') || 'none found'))
        return 1
      }))
      .then(Commands.literal('rules').executes(ctx => {
        var out = []
        try {
          var GR = Java.loadClass('net.minecraft.world.level.GameRules'), rules = ctx.source.server.getGameRules()
          var Visitor = Java.loadClass('net.minecraft.world.level.GameRules$GameRuleTypeVisitor')
          rules.visitGameRuleTypes(new JavaAdapter(Visitor, { visit: (key, type) => {
            var id = String(key.getId())
            if (/grief|skill|fire|tensura|manas|explo/i.test(id)) out.push(id + ' = ' + rules.getRule(key))
          } }))
        } catch (x) { out.push('could not read the game rules (' + x + ')') }
        say(ctx, '§6[griefguard] §7Game rules: §f' + (out.join(' §8|§f ') || 'none match'))
        return 1
      })))
  })
})()
