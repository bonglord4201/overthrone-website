// OVERTHRONE - staff tool: find out what is hurting you.
// Only READS damage (changes nothing). Uses the same NeoForge damage event as mob_tweaks.js.
//
// Staff (op):
//   /whyhurt      turn it on/off for yourself. While on, every time you lose health chat tells you:
//                 the damage type (e.g. outOfWorld, magic, onFire, mob), who/what did it (mob id + name),
//                 the amount, and where you are. If your health drops WITHOUT a hit (a mod changing it
//                 directly), it says that too.

(function () {
  var on = {}     // username -> { last: health, hit: tick of the last damage event }

  const idOf = (e) => { try { var s = e.getEncodeId(); return s ? String(s) : String(e.getType()) } catch (x) { return '?' } }
  const nameOf = (e) => { try { return String(e.getName().getString()) } catch (x) { return '' } }
  const who = (e) => e ? idOf(e) + (nameOf(e) ? ' "' + nameOf(e) + '"' : '') : 'nothing'
  const dimOf = (e) => {
    var k = e.level.dimension
    if (typeof k === 'function') k = e.level.dimension()
    return String(k && k.location ? k.location() : k)
  }

  NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent', event => {
    try {
      var p = event.getEntity()
      if (!p || !p.isPlayer()) return
      var st = on[String(p.username)]
      if (!st) return
      var src = event.getSource(), type = '?'
      try { type = String(src.getMsgId()) } catch (x) { try { type = String(src.type().msgId()) } catch (y) { } }
      st.hit = p.server.tickCount
      p.tell('§c[whyhurt] §f' + type + ' §7by §e' + who(src.getEntity()) +
        (src.getDirectEntity() && src.getDirectEntity() != src.getEntity() ? ' §7via §e' + who(src.getDirectEntity()) : '') +
        ' §7amount §c' + Number(event.getAmount()).toFixed(1) +
        ' §8(' + dimOf(p) + ' ' + Math.floor(p.x) + ' ' + Math.floor(p.y) + ' ' + Math.floor(p.z) + (p.isInvulnerable() ? ', invulnerable flag ON' : '') + ')')
    } catch (x) { }
  })

  // health lost with no damage event = something set the health directly
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 10 != 0) return
    Object.keys(on).forEach(name => {
      try {
        var p = s.getPlayerList().getPlayerByName(name), st = on[name]
        if (!p) { delete on[name]; return }
        var h = Number(p.getHealth())
        if (st.last != null && h < st.last - 0.01 && s.tickCount - st.hit > 10)
          p.tell('§c[whyhurt] §7Health went §c' + st.last.toFixed(1) + ' → ' + h.toFixed(1) + ' §7with NO damage event (a mod or effect set it directly)')
        st.last = h
      } catch (x) { }
    })
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('whyhurt').requires(src => src.hasPermission(2)).executes(ctx => {
      var p = ctx.source.playerOrException, n = String(p.username)
      if (on[n]) { delete on[n]; p.tell('§6[whyhurt] §7Off.'); return 1 }
      on[n] = { last: null, hit: -100 }
      var eff = []
      try { p.getActiveEffects().forEach(e => eff.push(String(e.getDescriptionId()).replace('effect.', ''))) } catch (x) { }
      p.tell('§6[whyhurt] §aOn. §7Stay in survival and let it hurt you, then send me the chat. §8(/whyhurt again to stop)')
      p.tell('§6[whyhurt] §7World §f' + dimOf(p) + '§7, effects: §f' + (eff.length ? eff.join(', ') : 'none'))
      return 1
    }))
  })
})()
