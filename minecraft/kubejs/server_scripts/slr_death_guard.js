// OVERTHRONE - TEMPORARY crash guard for a bug in Solo Leveling (SoloCraft: Reawakening 1.3.3).
//
// The bug: SLR's death handler (net.solocraft.procedures.XPGainTShadowProcedure, line 53) crashes the whole server
// with "Cannot invoke Entity.getCapability(...)" on a null entity. Every crash so far had the same pattern:
// the killing blow came from a Tensura mob that is a TAMABLE-type entity with no player owner
// (tensura:orc killing a goblin, tensura_neb:rimuru_clone killing a player). Deaths with no killer (falling,
// lava, /kill...) happen all the time without crashing, so a death with no killer is safe for SLR.
//
// What this does: when a hit from such a mob (tamable type, not owned by a player) would KILL something,
// the hit is set to 0 and the victim dies one tick later from a plain "killed" death instead (no killer).
// The victim still dies, so everything else that happens on death still happens:
// keep inventory / SMP item drops, respawn, perks, levels... Nothing else is changed.
//
// Limits: the death message says "was killed" instead of "was slain by ...", the mob gets no kill credit,
// and a totem / revive effect can't save you from that one killing blow.
// Remove this file once SLR is updated with a fix (check its changelog for XPGainTShadowProcedure / null fix).
//
// Staff (op):  /slrguard   how many deaths it has redirected since the last restart/reload

(function () {
  var redirected = 0

  // the attacker is a tamable-type mob (has isTame/getOwner) whose owner is not a player
  const riskyKiller = (a) => {
    try {
      if (!a || a.isPlayer() || typeof a.isTame !== 'function') return false
      var o = null
      try { o = a.getOwner() } catch (x) { o = null }
      return !(o != null && o.isPlayer())
    } catch (x) { return false }
  }

  NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingDamageEvent$Pre', event => {
    try {
      var v = event.getEntity()
      if (!v || !v.isAlive()) return
      if (!riskyKiller(event.getSource().getEntity())) return
      if (Number(event.getNewDamage()) < Number(v.getHealth())) return   // not a killing blow: leave it alone
      event.setNewDamage(0)
      redirected++
      var s = v.getServer()
      s.scheduleInTicks(1, () => { try { if (v.isAlive()) v.kill() } catch (x) { console.warn('[slr_death_guard] kill: ' + x) } })
    } catch (x) { console.warn('[slr_death_guard] ' + x) }
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('slrguard').requires(src => src.hasPermission(2)).executes(ctx => {
      ctx.source.sendSystemMessage(Text.of('§6[slrguard] §7Killing blows redirected to a plain death (to dodge the SLR crash): §f' + redirected))
      return 1
    }))
  })
})()
