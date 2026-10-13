// OVERTHRONE - damage debugger (staff). Finds out WHERE damage to a player gets blocked.
//   /dmgdebug            test yourself
//   /dmgdebug <player>   test another online player
// It hurts the player for 1 health point and reports every check on the way. Safe to delete afterwards.

(function () {
  const LivingIncomingDamageEvent = Java.loadClass('net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent')
  var watch = null   // name of the player being tested
  var seen = null    // what our listener saw

  // runs at normal priority; it is NOT called if another mod already cancelled the event earlier
  NativeEvents.onEvent(LivingIncomingDamageEvent, event => {
    try {
      var v = event.getEntity()
      if (watch == null || !v.isPlayer() || String(v.getName().getString()) != watch) return
      seen = { amount: Number(event.getAmount()), cancelled: event.isCanceled() }
    } catch (e) { }
  })

  const run = (ctx, p) => {
    var say = (m) => ctx.source.sendSystemMessage(Text.of(m))
    var name = String(p.getName().getString())
    var dim = String(p.level.dimension)
    var src = p.damageSources().generic()
    say('§6§l--- DMGDEBUG ' + name + ' §7(' + dim + ')')
    say('§7gamemode creative/spectator: §f' + p.isCreative() + '/' + p.isSpectator())
    say('§7abilities.invulnerable: §f' + p.getAbilities().invulnerable + '  §7entity invulnerable flag: §f' + p.isInvulnerable())
    say('§7isInvulnerableTo(generic): §f' + p.isInvulnerableTo(src) + '  §7hurt cooldown (invulnerableTime): §f' + p.invulnerableTime)
    say('§7difficulty: §f' + p.level.getDifficulty() + '  §7health before: §f' + Number(p.getHealth()).toFixed(1) + '/' + Number(p.getMaxHealth()).toFixed(1))
    var before = Number(p.getHealth())
    watch = name; seen = null
    p.invulnerableTime = 0
    var ok = false
    try { ok = Number(p.server.runCommandSilent('damage ' + name + ' 1 minecraft:generic')) > 0 } catch (e) { say('§cdamage error: ' + e) }
    watch = null
    var after = Number(p.getHealth())
    say('§7/damage worked: §f' + ok + '  §7health after: §f' + after.toFixed(1) + ' §7(change ' + (after - before).toFixed(2) + ')')
    if (seen == null) say('§c→ The damage event never reached KubeJS: either a vanilla check above is true, or ANOTHER MOD cancelled it first.')
    else say('§7→ KubeJS saw the damage event: amount §f' + seen.amount + '§7, already cancelled: §f' + seen.cancelled + (ok ? '' : ' §c(blocked AFTER KubeJS by another mod or by damage reduction)'))
    return 1
  }

  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    event.register(Commands.literal('dmgdebug').requires(src => src.hasPermission(2))
      .executes(ctx => run(ctx, ctx.source.playerOrException))
      .then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => run(ctx, Arguments.PLAYER.getResult(ctx, 'player')))))
  })
})()
