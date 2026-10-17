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
//   /skillban unique <player>    which unique skill they have / whether they got a replacement
//   /skillban giveunique <player>  give them one random allowed unique skill now (only if they have none)
//
// Unique skill replacement (added 2026-10-17):
//   Tensura gives every player 1 random unique skill when they pick their race (config startingSkills).
//   When a BANNED unique is removed, the player gets a random ALLOWED unique instead, straight away.
//   Players who lost a banned unique before this existed (or never got one) get one too: checked ONCE per player,
//   30+ seconds after they have a race. After that check they are never given another one automatically
//   (persistentData ot_unique_checked), so nobody gets extra skills by dying, relogging or evolving.

(function () {
  const BANNED = ['predator', 'gluttony', 'creator', 'fusionist', 'infinity_prison', 'cultivator', 'pride',
    'jinchuriki', 'crasher', 'coalescence', 'victorious_harbinger']

  // the allowed unique skills = startingSkills in config/tensura/reincarnation_config.toml (banned ones already removed)
  const UNIQUES = [
    'tensura:absolute_severance',
    'tensura:analyst',
    'tensura:berserk',
    'tensura:berserker',
    'tensura:bewilder',
    'tensura:chef',
    'tensura:chosen_one',
    'tensura:commander',
    'tensura:cook',
    'tensura:degenerate',
    'tensura:engorger',
    'tensura:envy',
    'tensura:falsifier',
    'tensura:fighter',
    'tensura:gourmand',
    'tensura:gourmet',
    'tensura:great_sage',
    'tensura:greed',
    'tensura:guardian',
    'tensura:healer',
    'tensura:lust',
    'tensura:martial_master',
    'tensura:mathematician',
    'tensura:merciless',
    'tensura:murderer',
    'tensura:musician',
    'tensura:observer',
    'tensura:oppressor',
    'tensura:reflector',
    'tensura:researcher',
    'tensura:royal_beast',
    'tensura:reaper',
    'tensura:reverser',
    'tensura:seeker',
    'tensura:seer',
    'tensura:severer',
    'tensura:shadow_striker',
    'tensura:sloth',
    'tensura:sniper',
    'tensura:spearhead',
    'tensura:suppressor',
    'tensura:survivor',
    'tensura:traveler',
    'tensura:thrower',
    'tensura:tuner',
    'tensura:unyielding',
    'tensura:usurper',
    'tensura:villain',
    'tensura:wrath',
    'mysticism:butcher',
    'mysticism:captivator',
    'mysticism:constant',
    'mysticism:corroder',
    'mysticism:dreamer',
    'mysticism:gardener',
    'mysticism:hidden_ruler',
    'mysticism:kyurem',
    'mysticism:malleable',
    'mysticism:phaser',
    'mysticism:provider',
    'mysticism:reducer',
    'mysticism:repeater',
    'mysticism:reshiram',
    'mysticism:scholar',
    'mysticism:spiritualist',
    'mysticism:stagnator',
    'mysticism:subjugator',
    'mysticism:zekrom',
    'stextras:imitator'
  ]
  // banned skills that are unique skills (count as "had a unique" when deciding who needs a replacement)
  const BANNED_UNIQUES = ['tensura:predator', 'tensura:gluttony', 'tensura:creator', 'tensura:fusionist', 'tensura:infinity_prison', 'tensura:pride',
    'mysticism:cultivator', 'mysticism:jinchuriki', 'mysticism:crasher', 'mysticism:coalescence', 'mysticism:victorious_harbinger']
  const CHECKED = 'ot_unique_checked', GIVEN = 'ot_unique_given', RACE_SEEN = 'ot_race_seen'

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

  var RL = null, RaceAPI = null
  try { RL = Java.loadClass('net.minecraft.resources.ResourceLocation') } catch (e) { }
  try { RaceAPI = Java.loadClass('io.github.manasmods.manascore.race.api.RaceAPI') } catch (e) { }
  const hasRace = (p) => { if (RaceAPI == null) return false; try { return RaceAPI.getRaceFrom(p).getRace().isPresent() } catch (e) { return false } }
  const learned = (p) => { var ids = []; try { SkillAPI.getSkillsFrom(p).getLearnedSkills().forEach(i => { try { ids.push(String(i.getSkillId())) } catch (x) { } }) } catch (x) { } return ids }
  const uniqueOf = (ids) => ids.filter(id => UNIQUES.indexOf(id) >= 0)
  // gives one random allowed unique the player doesn't have (ManasCore Skills.learnSkill(ResourceLocation)); true if it stuck
  const giveUnique = (p, why) => {
    if (SkillAPI == null || RL == null) return null
    var have = learned(p), list = UNIQUES.filter(id => have.indexOf(id) < 0)
    for (var tries = 0; tries < 5 && list.length; tries++) {
      var id = list.splice(Math.floor(Math.random() * list.length), 1)[0]
      try {
        var st = SkillAPI.getSkillsFrom(p), rl = RL.parse(id)
        st.learnSkill(rl)
        if (st.getSkill(rl).isPresent()) {
          try { st.markDirty() } catch (y) { }
          p.persistentData.putString(GIVEN, id)
          console.info('[skill_blacklist] gave unique ' + id + ' to ' + p.username + ' (' + why + ')')
          p.tell('§a§lSKILLS §8» §7You received a new unique skill: §f' + id.substring(id.indexOf(':') + 1).replace(/_/g, ' ') + '§7!')
          return id
        }
      } catch (x) { console.warn('[skill_blacklist] could not give ' + id + ' to ' + p.username + ': ' + x) }
    }
    return null
  }
  // one-time check per player: no allowed unique (e.g. theirs was banned and removed) -> give one
  const checkUnique = (p, removedUnique) => {
    if (SkillAPI == null) return
    var d = p.persistentData
    if (!removedUnique && d.getBoolean(CHECKED)) return
    if (!hasRace(p)) return                                   // still picking a race: Tensura hasn't rolled yet
    var now = Date.now()
    if (!removedUnique) {
      var seen = Number(d.getLong(RACE_SEEN)) || 0
      if (!seen) { d.putLong(RACE_SEEN, now); return }        // wait 30+ s after the race exists so Tensura's own roll lands first
      if (now - seen < 30000) return
    }
    if (uniqueOf(learned(p)).length == 0) { if (giveUnique(p, removedUnique ? 'banned unique removed' : 'had no unique') == null) return }   // failed: try again next time
    d.putBoolean(CHECKED, true)
  }

  const stripAndCheck = (p) => {
    var r = strip(p, false)
    try { checkUnique(p, r.removed.some(id => BANNED_UNIQUES.indexOf(id) >= 0)) } catch (x) { console.warn('[skill_blacklist] unique check ' + p.username + ': ' + x) }
    return r
  }
  PlayerEvents.loggedIn(event => { var p = event.player; p.server.scheduleInTicks(100, () => stripAndCheck(p)) })
  ServerEvents.tick(event => {
    var s = event.server
    if (SkillAPI == null || s.tickCount % 600 != 0) return
    s.players.forEach(p => stripAndCheck(p))
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
      .then(Commands.literal('unique').then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var t = Arguments.PLAYER.getResult(ctx, 'player'), u = uniqueOf(learned(t)), d = t.persistentData
        say(ctx.source, P + '§f' + t.username + '§7: unique ' + (u.length ? '§a' + u.join(', ') : '§cnone') +
          ' §7· checked ' + (d.getBoolean(CHECKED) ? '§ayes' : '§eno') + ' §7· given by script: §f' + (String(d.getString(GIVEN) || '') || '-'))
        return 1
      })))
      .then(Commands.literal('giveunique').then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var t = Arguments.PLAYER.getResult(ctx, 'player'), u = uniqueOf(learned(t))
        if (u.length) { say(ctx.source, P + '§e' + t.username + ' already has a unique skill: §f' + u.join(', ')); return 0 }
        var id = giveUnique(t, 'staff /skillban giveunique')
        if (id) { t.persistentData.putBoolean(CHECKED, true); say(ctx.source, P + '§aGave §f' + t.username + ' §a' + id); return 1 }
        say(ctx.source, P + '§cCould not give a unique skill (see the server log).'); return 0
      })))
      .then(Commands.literal('scan').executes(ctx => {
        if (SkillAPI == null) { say(ctx.source, P + status); return 0 }
        var total = 0, bad = 0
        ctx.source.server.players.forEach(p => {
          var r = stripAndCheck(p)
          total += r.removed.length; bad += r.failed.length
          if (r.removed.length) say(ctx.source, P + '§f' + p.username + '§7: removed §c' + r.removed.join(', '))
          if (r.failed.length) say(ctx.source, P + '§f' + p.username + '§c: could NOT remove ' + r.failed.join(', ') + ' §8(' + lastError + ')')
        })
        say(ctx.source, P + '§aScan done: ' + total + ' banned skill(s) removed' + (bad ? ', §c' + bad + ' failed' : '') + '§a.')
        return 1
      })))
  })
})()
