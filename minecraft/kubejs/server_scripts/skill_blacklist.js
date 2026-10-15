// OVERTHRONE - banned skills: anyone who has one loses it, when they log in and every 30 seconds while online
// (so a skill gained by evolving, stealing, a book or a command is removed within 30 s).
// NOTE: this only READS and REMOVES skills. It must never hook into the skill system's own events
// (UNLOCK_SKILL etc.): a KubeJS listener there crashed the server (Architectury got a null result).
// Uses ManasCore's skill API (the system Tensura and Mysticism skills are built on).
// Skills are matched by name, whichever mod they come from (e.g. "predator" = tensura:predator).
//
// Staff (op):
//   /skillban list               the banned skills
//   /skillban check <player>     which banned skills a player has right now (doesn't remove)
//   /skillban scan               remove banned skills from everyone online now
//   /skillban status             whether the remover is running

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
  // tries every way ManasCore offers to forget a skill, then checks it's really gone
  var lastError = ''
  const forget = (storage, inst) => {
    var rl = inst.getSkillId(), errs = []
    var gone = () => { try { return !storage.getSkill(rl).isPresent() } catch (x) { return false } }
    var tries = [
      () => storage.forgetSkill(rl),
      () => storage.forgetSkill(rl, null),
      () => storage.forgetSkill(inst),
      () => { storage.getLearnedSkills().remove(inst); try { storage.markDirty() } catch (y) { } },
    ]
    for (var i = 0; i < tries.length; i++) {
      try { tries[i]() } catch (x) { errs.push('#' + (i + 1) + ' ' + x) }
      if (gone()) { try { storage.markDirty() } catch (y) { } return true }
    }
    lastError = errs.length ? errs.join(' | ') : 'the skill system refused to remove it'
    return false
  }
  const strip = (p, quiet) => {
    if (SkillAPI == null) return { removed: [], failed: [] }
    var removed = [], failed = []
    try {
      var r = bannedOf(p)
      r.found.forEach(inst => {
        var id = String(inst.getSkillId())
        if (forget(r.storage, inst)) removed.push(id)
        else { failed.push(id); console.warn('[skill_blacklist] could not remove ' + id + ' from ' + p.username + ': ' + lastError) }
      })
    } catch (x) { lastError = String(x); console.warn('[skill_blacklist] ' + p.username + ': ' + x) }
    if (removed.length) {
      console.info('[skill_blacklist] removed from ' + p.username + ': ' + removed.join(', '))
      if (!quiet) p.tell('§c§lSKILLS §8» §7These skills are banned on OVERTHRONE and were removed: §f' + removed.join(', '))
    }
    return { removed: removed, failed: failed }
  }

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
        var total = 0, bad = 0
        ctx.source.server.players.forEach(p => {
          var r = strip(p, false)
          total += r.removed.length; bad += r.failed.length
          if (r.removed.length) say(ctx.source, P + '§f' + p.username + '§7: removed §c' + r.removed.join(', '))
          if (r.failed.length) say(ctx.source, P + '§f' + p.username + '§c: could NOT remove ' + r.failed.join(', ') + ' §8(' + lastError + ')')
        })
        say(ctx.source, P + '§aScan done: ' + total + ' banned skill(s) removed' + (bad ? ', §c' + bad + ' failed' : '') + '§a.')
        return 1
      })))
  })
})()
