// OVERTHRONE - banned skills, for players:
//   - they can't be learned (evolving, stealing, books, commands... the skill system refuses them)
//   - they can't be used (activate / toggle / release are blocked), in case someone still has one
//   - anyone who still has one loses it: when they log in and every 30 seconds while online
// Uses ManasCore's skill API (the system Tensura and Mysticism skills are built on).
// Skills are matched by name, whichever mod they come from (e.g. "predator" = tensura:predator).
//
// Staff (op):
//   /skillban list               the banned skills
//   /skillban check <player>     which banned skills a player has right now (doesn't remove)
//   /skillban scan               remove banned skills from everyone online now
//   /skillban status             whether the remover and the learn/use block are running

(function () {
  const BANNED = ['predator', 'gluttony', 'creator', 'fusionist', 'infinity_prison', 'cultivator', 'pride',
    'jinchuriki', 'crasher', 'coalescence', 'victorious_harbinger']

  var SkillAPI = null, status = '§aACTIVE'
  try { SkillAPI = Java.loadClass('io.github.manasmods.manascore.skill.api.SkillAPI') } catch (e) { status = '§cNOT ACTIVE §8(' + e + ')' }

  const isBanned = (id) => BANNED.indexOf(String(id).substring(String(id).indexOf(':') + 1)) >= 0
  // the banned skill instances a player has
  const bannedOf = (p) => {
    var found = []
    var storage = SkillAPI.getSkillsFrom(p)
    storage.getLearnedSkills().forEach(inst => { try { if (isBanned(inst.getSkillId())) found.push(inst) } catch (x) { } })
    return { storage: storage, found: found }
  }
  const strip = (p, quiet) => {
    if (SkillAPI == null) return []
    var removed = []
    try {
      var r = bannedOf(p)
      r.found.forEach(inst => {
        var id = String(inst.getSkillId())
        try { r.storage.forgetSkill(inst); removed.push(id) } catch (x) { console.warn('[skill_blacklist] could not remove ' + id + ' from ' + p.username + ': ' + x) }
      })
    } catch (x) { console.warn('[skill_blacklist] ' + p.username + ': ' + x) }
    if (removed.length) {
      console.info('[skill_blacklist] removed from ' + p.username + ': ' + removed.join(', '))
      if (!quiet) p.tell('§c§lSKILLS §8» §7These skills are banned on OVERTHRONE and were removed: §f' + removed.join(', '))
    }
    return removed
  }

  // ---- block learning and using banned skills (players only; mobs keep theirs)
  // Hooks ManasCore's own skill checks: learning (UNLOCK_SKILL) and using (ACTIVATE / TOGGLE / RELEASE).
  // Registered once when the server starts. If anything here is missing, the 30-second remover below still works.
  var hookStatus = '§7not started yet §8(restart the server)'
  const hookSkillEvents = () => {
    try {
      var EV = Java.loadClass('io.github.manasmods.manascore.skill.api.SkillEvents')
      var ER = Java.loadClass('dev.architectury.event.EventResult')
      var isPlayer = (o) => { try { return o != null && o.isPlayer() } catch (x) { return false } }
      var idOfInst = (inst) => { try { return inst ? String(inst.getSkillId()) : '' } catch (x) { return '' } }
      var idOfChange = (ch) => { try { return idOfInst(ch.get()) } catch (x) { return '' } }
      var warned = {}
      var warn = (o, id) => {
        try {
          var k = String(o.username) + id, now = Date.now()
          if (warned[k] && now - warned[k] < 5000) return
          warned[k] = now
          o.tell('§c§lSKILLS §8» §f' + id + '§7 is banned on OVERTHRONE.')
        } catch (x) { }
      }
      var done = []
      var UnlockI = Java.loadClass('io.github.manasmods.manascore.skill.api.SkillEvents$UnlockSkillEvent')
      EV.UNLOCK_SKILL.register(new UnlockI(function (inst, owner, msg) {
        try { var id = idOfInst(inst); if (isPlayer(owner) && isBanned(id)) { warn(owner, id); return ER.interruptFalse() } } catch (x) { }
        return ER.pass()
      }))
      done.push('learn')
      var useBlock = (ch, owner) => {
        try { var id = idOfChange(ch); if (isPlayer(owner) && isBanned(id)) { warn(owner, id); return ER.interruptFalse() } } catch (x) { }
        return ER.pass()
      }
      try {
        var ActI = Java.loadClass('io.github.manasmods.manascore.skill.api.SkillEvents$SkillActivationEvent')
        EV.ACTIVATE_SKILL.register(new ActI(function (ch, owner, key, mode) { return useBlock(ch, owner) }))
        done.push('activate')
      } catch (x) { console.warn('[skill_blacklist] activate hook: ' + x) }
      try {
        var TogI = Java.loadClass('io.github.manasmods.manascore.skill.api.SkillEvents$SkillToggleEvent')
        EV.TOGGLE_SKILL.register(new TogI(function (ch, owner) { return useBlock(ch, owner) }))
        done.push('toggle')
      } catch (x) { console.warn('[skill_blacklist] toggle hook: ' + x) }
      try {
        var RelI = Java.loadClass('io.github.manasmods.manascore.skill.api.SkillEvents$SkillReleaseEvent')
        EV.RELEASE_SKILL.register(new RelI(function (ch, owner, key, mode, held) { return useBlock(ch, owner) }))
        done.push('release')
      } catch (x) { console.warn('[skill_blacklist] release hook: ' + x) }
      hookStatus = '§aACTIVE §8(' + done.join(', ') + ')'
      console.info('[skill_blacklist] blocking banned skills: ' + done.join(', '))
    } catch (e) {
      hookStatus = '§cNOT ACTIVE §8(' + e + ')'
      console.warn('[skill_blacklist] could not hook skill events: ' + e)
    }
  }
  ServerEvents.loaded(event => { if (SkillAPI != null) hookSkillEvents() })

  PlayerEvents.loggedIn(event => { var p = event.player; p.server.scheduleInTicks(100, () => strip(p, false)) })
  ServerEvents.tick(event => {
    var s = event.server
    if (SkillAPI == null || s.tickCount % 600 != 0) return
    s.players.forEach(p => strip(p, false))
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    const say = (src, m) => src.sendSystemMessage(Text.of(m))
    const P = '§6[skillban] '
    event.register(Commands.literal('skillban').requires(src => src.hasPermission(2))
      .then(Commands.literal('list').executes(ctx => { say(ctx.source, P + '§7Banned: §f' + BANNED.join(', ')); return 1 }))
      .then(Commands.literal('status').executes(ctx => {
        say(ctx.source, P + '§7Remover (login + every 30 s): ' + status)
        say(ctx.source, P + '§7Block learning/using: ' + hookStatus)
        return 1
      }))
      .then(Commands.literal('check').then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var t = Arguments.PLAYER.getResult(ctx, 'player')
        if (SkillAPI == null) { say(ctx.source, P + status); return 0 }
        var ids = []
        try { bannedOf(t).found.forEach(i => ids.push(String(i.getSkillId()))) } catch (x) { say(ctx.source, P + '§c' + x); return 0 }
        say(ctx.source, P + '§f' + t.username + '§7: ' + (ids.length ? '§c' + ids.join(', ') : '§ano banned skills'))
        return 1
      })))
      .then(Commands.literal('scan').executes(ctx => {
        if (SkillAPI == null) { say(ctx.source, P + status); return 0 }
        var total = 0
        ctx.source.server.players.forEach(p => { var r = strip(p, false); total += r.length; if (r.length) say(ctx.source, P + '§f' + p.username + '§7: removed §c' + r.join(', ')) })
        say(ctx.source, P + '§aScan done: ' + total + ' banned skill(s) removed from online players.')
        return 1
      })))
  })
})()
