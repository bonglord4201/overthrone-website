// OVERTHRONE - crash guard: in the RPG World (where the Caverns are), wild mobs can't hurt each other.
// Why: the Solo Leveling mod (SoloCraft: Reawakening 1.3.3) crashes the WHOLE server when a mob kills
// another mob (e.g. a Tensura Orc killing a Goblin): its XPGainTShadowProcedure expects a player killer and
// hits a null ("Ticking entity ... XPGainTShadowProcedure.java:53"). If mobs can't kill each other here,
// that code never runs with a mob killer.
// Players, and pets/summons owned by a player, still hurt mobs as normal. Mobs still hurt players.
// Uses the same NeoForge damage event as mob_tweaks.js (no Tensura/ManasCore events).
//
// Staff (op):  /mobinfighting   shows how many mob-vs-mob hits were blocked since the last restart/reload

(function () {
  const WORLDS = ['multiworld:rpg']
  var blocked = 0

  const dimOf = (e) => {
    var k = e.level.dimension
    if (typeof k === 'function') k = e.level.dimension()
    return String(k && k.location ? k.location() : k)
  }
  // a pet or summon that belongs to a player counts as the player's
  const ownedByPlayer = (e) => {
    try { var o = e.getOwner(); if (o && o.isPlayer()) return true } catch (x) { }
    return false
  }
  const wildMob = (e) => !!e && !e.isPlayer() && !ownedByPlayer(e)

  // who caused the damage, safely: Tensura's own damage types (e.g. tensura.paralyzing) don't expose getEntity() to KubeJS
  const attackerOf = (src) => {
    var a = null
    try { a = src.getEntity() } catch (x) { }
    if (a == null) { try { a = src.getActual() } catch (x) { } }
    if (a == null) { try { a = src.actual } catch (x) { } }
    if (a == null) {
      var d = null
      try { d = src.getDirectEntity() } catch (x) { }
      if (d == null) { try { d = src.getImmediate() } catch (x) { } }
      if (d != null) { try { a = d.getOwner() } catch (x) { } if (a == null) a = d }
    }
    return a
  }

  NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent', event => {
    try {
      var target = event.getEntity()
      if (!target || target.isPlayer() || ownedByPlayer(target)) return
      var src = event.getSource(), atk = attackerOf(src)
      if (!atk || !wildMob(atk)) return
      if (WORLDS.indexOf(dimOf(target)) < 0) return
      event.setCanceled(true)
      blocked++
    } catch (x) { }
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('mobinfighting').requires(src => src.hasPermission(2)).executes(ctx => {
      ctx.source.sendSystemMessage(Text.of('§6[mobinfighting] §7Mob-vs-mob hits blocked in ' + WORLDS.join(', ') + ': §f' + blocked))
      return 1
    }))
  })
})()
