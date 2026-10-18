// OVERTHRONE - crash guard for a bug in Solo Leveling (SoloCraft: Reawakening 1.3.3).
//
// The bug: SLR's death handler (net.solocraft.procedures.XPGainTShadowProcedure, line 53) crashes the whole server
// with "Cannot invoke Entity.getCapability(...)" on a null entity. Every crash had an "owned"-type mob in it whose
// owner can't be found:
//   - Tensura / Not Enough Bosses summons and clones (Rimuru clone, Ifrit clones...) belong to their BOSS, not a player.
//     Minecraft only looks owners up among players, so their owner comes back empty (and stays empty once the boss is dead).
//   - a crash happened both when such a mob KILLED something and when a player killed such a mob.
// A death with no killer and no "owned" mob involved (falling, lava, /kill...) never crashed.
//
// What this does, only when a hit would KILL:
//   1. the victim is a mob with an owner that can't be found (boss clone/summon, orphaned after the boss died):
//      the hit is set to 0 and the mob is removed instead of dying (no death = SLR's code never runs).
//      Exception: pets of players who are offline are never removed: the killing hit is just blocked.
//   2. the killer is an owner-type mob whose owner isn't an online player (e.g. a Rimuru clone killing a player):
//      the hit is set to 0 and the victim dies one tick later from a plain "killed" death (no killer).
// Everything else on death still happens (keep inventory / SMP drops, respawn, perks, levels...).
// Limits: no kill credit/drops from those clones, death message "was killed" for case 2, a totem can't save you from case 2.
//
// Staff (op):  /slrguard   which event it hooked + how many deaths it changed since the last restart/reload

(function () {
  var stats = { removed: 0, blocked: 0, redirected: 0 }, hooked = 'none'

  const ownerUuid = (e) => { try { var u = e.getOwnerUUID(); return u == null ? null : String(u) } catch (x) { return null } }
  const ownerOnlinePlayer = (e) => { try { var o = e.getOwner(); return o != null && o.isPlayer() } catch (x) { return false } }
  // an owner-type mob (TamableAnimal etc.) that has an owner set
  const isOwned = (e) => { try { return !!e && !e.isPlayer() && typeof e.getOwnerUUID === 'function' && ownerUuid(e) != null } catch (x) { return false } }
  // the owner is a player who has played here (then it's a pet, not a boss summon)
  const ownerIsKnownPlayer = (e) => {
    try {
      var u = e.getOwnerUUID(), cache = e.getServer().getProfileCache()
      return cache != null && cache.get(u).isPresent()
    } catch (x) { return true }   // unsure: treat as a player's pet (never removed)
  }
  // a killer that would make SLR look for an owner that isn't there
  const riskyKiller = (a) => {
    try { return !!a && !a.isPlayer() && typeof a.getOwnerUUID === 'function' && !ownerOnlinePlayer(a) } catch (x) { return false }
  }

  // who caused the damage. Tensura's own damage types (e.g. "tensura.paralyzing" from Paralysing Breath) don't expose
  // getEntity() to KubeJS, which made the guard fail on 2026-10-18 07:09 and let the crash through. Try every way.
  const attackerOf = (src) => {
    var a = null
    try { a = src.getEntity() } catch (x) { }
    if (a == null) { try { a = src.getActual() } catch (x) { } }
    if (a == null) { try { a = src.actual } catch (x) { } }
    if (a == null) {   // a projectile/breath: its shooter
      var d = null
      try { d = src.getDirectEntity() } catch (x) { }
      if (d == null) { try { d = src.getImmediate() } catch (x) { } }
      if (d == null) { try { d = src.immediate } catch (x) { } }
      if (d != null) { try { a = d.getOwner() } catch (x) { } }
    }
    return a
  }

  const handle = (event, dmg, setDmg) => {
    try {
      var v = event.getEntity()
      if (!v || !v.isAlive()) return
      if (Number(dmg()) < Number(v.getHealth())) return   // not a killing blow: leave it alone
      var s = v.getServer()
      var src = null
      try { src = event.getSource() } catch (x) { }
      // 1. the dying mob is owned, and its owner can't be found
      if (isOwned(v) && !ownerOnlinePlayer(v)) {
        setDmg(0)
        if (ownerIsKnownPlayer(v)) { stats.blocked++; return }   // offline player's pet: just survives this hit
        stats.removed++
        s.scheduleInTicks(1, () => { try { if (v.isAlive()) v.discard() } catch (x) { console.warn('[slr_death_guard] discard: ' + x) } })
        return
      }
      // 2. killed by an owner-type mob without an online player owner
      if (src != null && riskyKiller(attackerOf(src))) {
        setDmg(0)
        stats.redirected++
        s.scheduleInTicks(1, () => { try { if (v.isAlive()) v.kill() } catch (x) { console.warn('[slr_death_guard] kill: ' + x) } })
      }
    } catch (x) { console.warn('[slr_death_guard] ' + x) }
  }

  // LivingDamageEvent.Pre = the final damage after armour/absorption (best for "is this a killing blow")
  try {
    var Pre = Java.loadClass('net.neoforged.neoforge.event.entity.living.LivingDamageEvent$Pre')
    NativeEvents.onEvent(Pre, e => handle(e, () => e.getNewDamage(), (n) => e.setNewDamage(n)))
    hooked = 'LivingDamageEvent.Pre'
  } catch (x) {
    console.warn('[slr_death_guard] LivingDamageEvent.Pre not available (' + x + '), using LivingIncomingDamageEvent')
    NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent', e => handle(e, () => e.getAmount(), (n) => e.setAmount(n)))
    hooked = 'LivingIncomingDamageEvent'
  }
  console.info('[slr_death_guard] active (' + hooked + ')')

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('slrguard').requires(src => src.hasPermission(2)).executes(ctx => {
      ctx.source.sendSystemMessage(Text.of('§6[slrguard] §7Hooked: §f' + hooked + '§7 · orphan clones removed: §f' + stats.removed +
        '§7 · pet deaths blocked: §f' + stats.blocked + '§7 · deaths made "no killer": §f' + stats.redirected))
      return 1
    }))
  })
})()
