// OVERTHRONE - fixed mob & boss spawns (made for the Caverns, works in any world).
// Place a mob with its spawn egg, look at it and type /setmob or /setboss. From then on:
//   - it never despawns and is pulled back if it wanders too far from its spot (mobs: 28 blocks)
//   - bosses can move and chase players, but only within BOSS_ROAM blocks of their spot (then they're put back)
//   - inside the Caverns, bosses get extra health and attack damage (BOSS_HP_BONUS / BOSS_DAMAGE_BONUS, or /mobspawn power)
//   - while a boss is dead, players nearby see a red bar counting down to its return
//   - when it's killed, a floating timer above its spot counts down and the same mob type respawns there
//     (default after 60 minutes)
//   - the floating text always shows the mob's REAL name (straight from the game/mod), styled: gold for mobs,
//     red with skulls for bosses. The mob itself is never renamed.
//   - boss kills are announced in chat
//
// Staff (op):
//   look at the mob (or stand next to it), then:
//   /setmob [minutes]        make it a mob spawn (default 60 minutes)
//   /setboss [minutes]       make it a boss spawn (default 60 minutes)
//   (same: /mobspawn mob [minutes] and /mobspawn boss [minutes])
//   look at its mob, or stand near its spot (within 16 blocks side to side):
//   /mobspawn remove         stop tracking the nearest spawn (within 10 blocks). Its mob is left alive.
//   /mobspawn remove kill    same, and kills its mob too
//   /mobspawn time <minutes> change the nearest spawn's respawn time
//   /mobspawn move           move the spawn (and its mob) to where you're standing (a rotation moves all its bosses)
//   anywhere:
//   /mobspawn list           every spawn in this world with its state
//   /mobspawn respawnall     respawn every killed mob now
//   /mobspawn cleanup        remove every extra (untracked) mob within 32 blocks of your spawn spots (pets/named kept)
//   /mobspawn scan [radius]  every mob near you by type: tracked / loose / summoned by a mob / pets (default 32)
//   /mobspawn holo           put back missing floating texts
//   /mobspawn clearall       remove EVERY spawn (mobs stay alive)
//   /mobspawn info           details of the nearest spawn (within 16 blocks) + puts its text back
//   /mobspawn skills         the Tensura/Mysticism skills of the mob you look at (red = removed from spawned mobs)
// Spawned bosses/mobs lose skills whose id contains a word in STRIP_SKILLS (nullification, regeneration), so they
// can't become unkillable. Checked when they spawn and every 5 seconds.
//
// Boss rotations (several bosses taking turns on one spot):
//   set each boss with /mobspawn boss first (eggs placed close together), then stand among them:
//   /mobspawn rotation [minutes]  every boss spawn within 32 blocks takes turns (default 30 min between bosses).
//                                 One boss is out at a time; when it dies its name goes away and
//                                 "Random Boss arrives in 29:59" counts down (floating text + red bar), then the
//                                 next boss appears. Each boss comes once per cycle, random order.
//   /mobspawn rotation next       skip the wait: the next boss appears now
//   /mobspawn rotation off        back to normal separate boss spawns
//   /mobspawn power                       show the strength of the rotation near you (or the nearest boss)
//   /mobspawn power <health%> <damage%>   make them stronger/weaker (Caverns only), e.g. 200 100 = triple health, double damage
//   /mobspawn power reset                 back to the default (BOSS_HP_BONUS / BOSS_DAMAGE_BONUS)

(function () {
  const uidOf = (e) => { try { return String(e.getStringUuid()) } catch (x) { try { return String(e.getUuid()) } catch (y) { return String(e.uuid) } } }   // KubeJS renames getUUID
  const STORE = 'ot_spawns'
  const DEFAULT_MINUTES = 60
  const LEASH = 28            // blocks a mob may wander from its spot (any direction) before it's pulled back
  // Bosses used to be frozen in place (speed 0): that made them easy, they couldn't chase anyone.
  // Now they move and chase, but are put back if they go more than BOSS_ROAM blocks from their spot.
  // (true = the old frozen behaviour. Bosses frozen before this change keep speed 0 until respawned: /mobspawn respawnall)
  const FREEZE_BOSSES = false
  const BOSS_LEASH = 3        // frozen bosses only: pushed further than this from the spot = put back
  const BOSS_ROAM = 10        // moving bosses: how far from their spot they may chase before being put back
  // Boss strength (only bosses made with /setboss that are INSIDE the Caverns area; nothing else on the server changes).
  // Percent added on top of the boss's own values: 100 = double, 50 = +50%, 0 = normal, -50 = half.
  // These are the defaults; change a rotation (or one boss) in game with /mobspawn power <health%> <damage%>.
  const BOSS_HP_BONUS = 100
  const BOSS_DAMAGE_BONUS = 50
  const BAR_RANGE = 48        // players this close to a dead boss's spot see its respawn timer bar
  const SHOW_ALIVE_BAR = false // true = bosses also show a health bar while alive (off: many bosses would clog the screen)
  const ROTATION_MINUTES = 30 // default wait between bosses in a rotation
  // Tensura/Mysticism skills taken off spawned bosses & mobs so they can be killed: anything whose id contains one of
  // these words (e.g. physical_attack_nullification, self_regeneration). Set to [] to leave their skills alone.
  const STRIP_SKILLS = ['nullification', 'regeneration']
  var SkillAPI = null
  try { SkillAPI = Java.loadClass('io.github.manasmods.manascore.skill.api.SkillAPI') } catch (x) { }
  const GSTORE = 'ot_spawn_groups'
  var groups = null
  const UUID = Java.loadClass('java.util.UUID')
  var spawns = null
  const missing = {}

  const run = (s, cmd) => s.runCommandSilent(cmd)
  const load = (s) => {
    if (spawns == null) {
      try { spawns = JSON.parse(String(s.persistentData.getString(STORE) || '{}')) } catch (e) { spawns = {} }
      // spawns saved by an older, broken version have no world/kind/timer: they never worked, so drop them
      Object.keys(spawns).forEach(k => { var sp = spawns[k]; if (!sp || !sp.dim || !sp.kind || !sp.mins) delete spawns[k] })
      s.persistentData.putString(STORE, JSON.stringify(spawns))
    }
    if (groups == null) { try { groups = JSON.parse(String(s.persistentData.getString(GSTORE) || '{}')) } catch (e) { groups = {} } }
    return spawns
  }
  const save = (s) => { s.persistentData.putString(STORE, JSON.stringify(spawns)); s.persistentData.putString(GSTORE, JSON.stringify(groups || {})) }
  const dimOf = (level) => { var k = level.dimension; if (typeof k === 'function') k = level.dimension(); return String(k && k.location ? k.location() : k) }
  const levelOf = (s, dim) => { var f = null; s.getAllLevels().forEach(l => { if (f == null && dimOf(l) == dim) f = l }); return f }
  // is the spot's area loaded? (chunk check, or a player within 96 blocks, which always keeps it loaded)
  var BlockPos = null
  try { BlockPos = Java.loadClass('net.minecraft.core.BlockPos') } catch (x) { }
  const loaded = (level, x, z, y) => {
    // best check: are the entities at this spot loaded and ticking? (a chunk can be loaded before its entities are,
    // which made a living boss look "missing" and get spawned a second time)
    if (BlockPos != null) { try { return !!level.isPositionEntityTicking(new BlockPos(Math.floor(x), Math.floor(y == null ? 64 : y), Math.floor(z))) } catch (e) { } }
    try { if (level.getChunkSource().hasChunk(Math.floor(x) >> 4, Math.floor(z) >> 4)) return true } catch (e) { }
    var near = false
    try { level.players().forEach(p => { var dx = p.getX() - x, dz = p.getZ() - z; if (dx * dx + dz * dz < 96 * 96) near = true }) } catch (e) { }
    return near
  }
  // the spawn's live mob: by UUID, else by its spawn tag
  // only the real mob counts: a living entity of the spawn's type (the floating name text is never it)
  const isMobOf = (x, sp) => { try { return x != null && x.isLiving() && typeOf(x) == sp.type } catch (y) { return false } }
  // removes the "unkillable" skills from a spawned mob (only reads + forgets skills, never hooks the skill system)
  const skillIds = (e) => { var ids = []; try { SkillAPI.getSkillsFrom(e).getLearnedSkills().forEach(i => { try { ids.push(String(i.getSkillId())) } catch (x) { } }) } catch (x) { } return ids }
  const nerfSkills = (e) => {
    if (SkillAPI == null || !STRIP_SKILLS.length) return []
    var gone = []
    try {
      var st = SkillAPI.getSkillsFrom(e), list = []
      st.getLearnedSkills().forEach(i => { try { var id = String(i.getSkillId()); if (STRIP_SKILLS.some(w => id.indexOf(w) >= 0)) list.push(i) } catch (x) { } })
      list.forEach(i => { try { st.forgetSkill(i.getSkillId()); gone.push(String(i.getSkillId())) } catch (x) { try { st.forgetSkill(i); gone.push(String(i.getSkillId())) } catch (y) { } } })
    } catch (x) { }
    return gone
  }
  const findMob = (level, id) => {
    var sp = spawns[id], e = null
    try { if (sp.uuid) e = level.getEntity(UUID.fromString(sp.uuid)) } catch (x) { }
    if (!isMobOf(e, sp)) e = null
    if (e == null) {
      try { level.getAllEntities().forEach(x => { try { if (e == null && isMobOf(x, sp) && x.getTags().contains(tagOf(id))) e = x } catch (y) { } }) } catch (x) { }
      // some mod bosses replace themselves with a new entity (phase change): same type, new UUID, no tags.
      // Take over an untagged living mob of the same type near the spot instead of spawning a second one.
      // (bosses only: for normal mobs this grabbed wild mobs of the same type from up to 36 blocks away)
      if (e == null && sp.kind == 'boss') {
        var r = BOSS_ROAM + 8
        try { level.getAllEntities().forEach(x => { try {
          if (e != null || !isMobOf(x, sp) || !x.isAlive() || x.getTags().contains('ot_spawn')) return
          try { if (typeof x.getOwnerUUID === 'function' && x.getOwnerUUID() != null) return } catch (y) { }   // a boss's clone/summon, never the boss itself
          var dx = x.getX() - sp.x, dy = x.getY() - sp.y, dz = x.getZ() - sp.z
          if (dx * dx + dy * dy + dz * dz <= r * r) { e = x; x.addTag('ot_spawn'); x.addTag(tagOf(id)); if (sp.kind == 'boss') x.addTag('ot_boss') }
        } catch (y) { } }) } catch (x) { }
      }
      if (e != null) sp.uuid = uidOf(e)
    }
    return e
  }
  const typeOf = (e) => { try { var s = e.getEncodeId(); return s ? String(s) : '' } catch (x) { return '' } }
  const tagOf = (id) => 'ot_sp_' + id
  const logged = {}
  const logOnce = (key, msg) => { var now = Date.now(); if (logged[key] && now - logged[key] < 60000) return; logged[key] = now; console.warn('[mob_spawns] ' + msg) }
  const two = (n) => (n < 10 ? '0' : '') + n
  const mmss = (sec) => { var m = Math.floor(sec / 60), r = sec % 60; return (m >= 60 ? Math.floor(m / 60) + ':' + two(m % 60) : m) + ':' + two(r) }

  // ---- floating text: the name is a "translate" component, so every player sees the mob's real (mod) name
  const nameComp = (sp) => sp.kind == 'boss'
    ? [{ text: '☠ ', color: 'dark_red' }, { translate: sp.key, color: 'red', bold: true }, { text: ' ☠', color: 'dark_red' }]
    : [{ translate: sp.key, color: 'gold', bold: true }]
  const holoText = (sp, secsLeft) => {
    var parts = [''].concat(nameComp(sp))
    parts.push(sp.kind == 'boss' ? { text: '\nBOSS', color: 'dark_red', bold: true } : { text: '\nMOB', color: 'gray' })
    if (secsLeft != null) parts.push({ text: '\nRespawns in ' + mmss(secsLeft), color: 'yellow' })
    else if (sp.down) parts.push({ text: '\nRespawning...', color: 'yellow' })
    return JSON.stringify(parts).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  }
  const placeHolo = (s, id) => {
    var sp = spawns[id]; if (!sp) return
    delete holoState[id]
    run(s, `execute in ${sp.dim} run kill @e[type=minecraft:text_display,tag=${tagOf(id)}]`)
    var left = sp.down ? Math.max(0, Math.ceil((sp.down - Date.now()) / 1000)) : null
    run(s, `execute in ${sp.dim} run summon minecraft:text_display ${sp.x} ${sp.y + sp.h} ${sp.z} ` +
      `{Tags:["ot_spawnholo","${tagOf(id)}"],billboard:"center",shadow:1b,background:0,line_width:300,` +
      `transformation:[0.9f,0f,0f,0f,0f,0.9f,0f,0f,0f,0f,0.9f,0f,0f,0f,0f,1f],text:'${holoText(sp, left)}'}`)
  }
  // the floating text (and its countdown) is kept right by syncHolos() once a second, for every copy
  const setHolo = (s, id, secsLeft) => { }

  // ---- boss respawn timer bar (only while the boss is dead; the boss itself usually has its own health bar)
  const barId = (id) => 'overthrone:sp_' + String(id).toLowerCase().replace(/[^a-z0-9_]/g, '')
  const showBar = (s, id, secsLeft) => {
    var sp = spawns[id]; if (!sp || sp.kind != 'boss') return
    var b = barId(id), name = JSON.stringify(['', { text: '☠ ', color: 'dark_red' }, { translate: sp.key, color: 'red', bold: true },
      { text: ' returns in ' + mmss(secsLeft), color: 'yellow' }])
    if (!sp.bar) { run(s, `bossbar add ${b} ${name}`); run(s, `bossbar set ${b} color red`); run(s, `bossbar set ${b} style notched_10`); sp.bar = true }
    run(s, `bossbar set ${b} name ${name}`)
    run(s, `bossbar set ${b} max ${Math.max(1, sp.mins * 60)}`)
    run(s, `bossbar set ${b} value ${Math.max(0, Math.min(sp.mins * 60, sp.mins * 60 - secsLeft))}`)
    run(s, `execute in ${sp.dim} positioned ${sp.x} ${sp.y} ${sp.z} run bossbar set ${b} players @a[distance=..${BAR_RANGE}]`)
  }
  // boss health bar while it's alive (players within BAR_RANGE of its spot)
  const aliveBar = (s, id, e) => {
    var sp = spawns[id]; if (!sp || sp.kind != 'boss') return
    var b = barId(id), name = JSON.stringify(['', { text: '☠ ', color: 'dark_red' }, { translate: sp.key, color: 'red', bold: true }, { text: ' ☠', color: 'dark_red' }])
    if (!sp.bar) { run(s, `bossbar add ${b} ${name}`); run(s, `bossbar set ${b} color red`); run(s, `bossbar set ${b} style notched_10`); sp.bar = true }
    var max = Math.max(1, Math.ceil(Number(e.getMaxHealth()))), hp = Math.max(0, Math.ceil(Number(e.getHealth())))
    run(s, `bossbar set ${b} name ${name}`)
    run(s, `bossbar set ${b} max ${max}`)
    run(s, `bossbar set ${b} value ${Math.min(max, hp)}`)
    run(s, `execute in ${sp.dim} positioned ${sp.x} ${sp.y} ${sp.z} run bossbar set ${b} players @a[distance=..${BAR_RANGE}]`)
  }
  // freeze: walking and flying speed 0 (it can still turn, attack and use abilities)
  var Attr = null
  try { Attr = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes') } catch (x) { }
  const freeze = (s, e) => {
    var ok = false
    if (Attr != null) {
      ;['MOVEMENT_SPEED', 'FLYING_SPEED'].forEach(k => { try { var a = e.getAttribute(Attr[k]); if (a != null) { a.setBaseValue(0); ok = true } } catch (x) { } })
    }
    if (!ok) {
      run(s, `attribute ${uidOf(e)} minecraft:generic.movement_speed base set 0`)
      run(s, `attribute ${uidOf(e)} minecraft:generic.flying_speed base set 0`)
    }
    try { e.setDeltaMovement(0, Math.min(0, Number(e.getDeltaMovement().y())), 0) } catch (x) { }
  }
  // boss strength: extra (or less) max health + attack damage, only inside the Caverns.
  // Uses fixed modifier ids (overthrone:boss_hp / overthrone:boss_damage), so it never stacks; the applied values are
  // remembered on the boss (persistentData ot_buff) and changed when /mobspawn power changes them.
  const inCav = (e) => {
    try {
      if (typeof otInCaverns != 'function') return false
      if (otCavernsArea == null && typeof otCavernsLoad == 'function') otCavernsLoad(e.level.server)
      return otInCaverns(e.level, e.getX(), e.getY(), e.getZ())
    } catch (x) { return false }
  }
  const powerOf = (sp) => [sp.hpB != null ? sp.hpB : BOSS_HP_BONUS, sp.dmgB != null ? sp.dmgB : BOSS_DAMAGE_BONUS]
  const buffBoss = (s, e, sp) => {
    try {
      var want = inCav(e) ? powerOf(sp) : [0, 0], key = want[0] + ',' + want[1]
      var cur = String(e.persistentData.getString('ot_buff') || '')
      if (cur == key || (cur == '' && key == '0,0')) return
      var u = uidOf(e), before = Number(e.getMaxHealth()), hp = Number(e.getHealth())
      run(s, `attribute ${u} minecraft:generic.max_health modifier remove overthrone:boss_hp`)
      run(s, `attribute ${u} minecraft:generic.attack_damage modifier remove overthrone:boss_damage`)
      if (want[0] != 0) run(s, `attribute ${u} minecraft:generic.max_health modifier add overthrone:boss_hp ${want[0] / 100} add_multiplied_base`)
      if (want[1] != 0) run(s, `attribute ${u} minecraft:generic.attack_damage modifier add overthrone:boss_damage ${want[1] / 100} add_multiplied_base`)
      e.persistentData.putString('ot_buff', key)
      var max = Number(e.getMaxHealth())
      e.setHealth(cur == '' ? max : Math.max(1, Math.min(max, hp / Math.max(1, before) * max)))   // new boss: full health; changed: same % as before
    } catch (x) { logOnce('buff', 'boss strength: ' + x) }
  }
  // bosses frozen by the old version (movement speed 0) are swapped once for a fresh copy that can move
  const wasFrozen = (e) => { try { return Attr != null && Number(e.getAttribute(Attr.MOVEMENT_SPEED).getBaseValue()) == 0 } catch (x) { return false } }
  const hideBar = (s, id) => { var sp = spawns[id]; run(s, `bossbar remove ${barId(id)}`); if (sp) delete sp.bar }

  // ---- floating text sync (FIX 2026-10-18)
  // Floating names are text_display entities. Removing them with a command only reaches LOADED areas, so every
  // restart (and every change while the Caverns weren't loaded) left an old copy behind: stacked names, and the
  // timer only updated one copy, so the one you saw looked frozen.
  // Now, once a second, for every world that has spawns, ALL our floating texts are looked up and made right:
  //   exactly one per spawn (none while it waits in a rotation), extras and leftovers from removed spawns deleted,
  //   text updated on the one that's kept, moved back if it's in the wrong place. Only where the area is loaded.
  const holoState = {}   // key -> { u: uuid of the kept text entity, t: text last written }
  const HOLO_TAG = 'ot_spawnholo'
  const summonHolo = (s, dim, x, y, z, tag, text) => run(s, `execute in ${dim} run summon minecraft:text_display ${x} ${y} ${z} ` +
    `{Tags:["${HOLO_TAG}","${tag}"],billboard:"center",shadow:1b,background:0,line_width:300,` +
    `transformation:[0.9f,0f,0f,0f,0f,0.9f,0f,0f,0f,0f,0.9f,0f,0f,0f,0f,1f],text:'${text}'}`)
  const syncHolos = (s) => {
    var now = Date.now(), want = {}   // dim -> [{key, tag, x, y, z, text}]
    Object.keys(spawns).forEach(id => {
      var sp = spawns[id]; if (sp.dormant) return
      var left = sp.down && now < sp.down ? Math.ceil((sp.down - now) / 1000) : null
      ;(want[sp.dim] = want[sp.dim] || []).push({ key: id, tag: tagOf(id), x: sp.x, y: sp.y + (sp.h || 2), z: sp.z, text: holoText(sp, left) })
    })
    Object.keys(groups).forEach(gid => {
      var g = groups[gid]; if (!g.down) return
      ;(want[g.dim] = want[g.dim] || []).push({ key: 'g:' + gid, tag: gTag(gid), x: g.x, y: g.y, z: g.z, text: gText(Math.max(0, Math.ceil((g.down - now) / 1000))) })
    })
    s.getAllLevels().forEach(level => {
      var dim = dimOf(level), list = want[dim] || [], found = {}, any = false
      try {
        level.getAllEntities().forEach(x => {
          try {
            if (typeOf(x) != 'minecraft:text_display') return
            var t = x.getTags(); if (!t.contains(HOLO_TAG)) return
            var key = null
            t.forEach(tt => { tt = String(tt); if (tt.indexOf('ot_sp_') == 0 || tt.indexOf('ot_grp_') == 0) key = tt })
            any = true
            ;(found[key] = found[key] || []).push(x)
          } catch (y) { }
        })
      } catch (x) { return }
      if (!any && !list.length) return
      // leftovers: texts of spawns/rotations that no longer exist, or that shouldn't show right now
      var wanted = {}; list.forEach(w => { wanted[w.tag] = true })
      Object.keys(found).forEach(tag => {
        if (wanted[tag]) return
        var known = tag.indexOf('ot_sp_') == 0 ? spawns[tag.substring(6)] : (tag.indexOf('ot_grp_') == 0 ? groups[tag.substring(7)] : null)
        // a known spawn whose text shouldn't show (waiting in a rotation, rotation boss out) or an unknown one: remove
        found[tag].forEach(x => { try { x.discard() } catch (y) { } })
        if (known == null) logOnce('orphan ' + tag, 'removed leftover floating text ' + tag)
      })
      list.forEach(w => {
        if (!loaded(level, w.x, w.z, w.y)) return   // can't see that area right now: leave it, sync once it's loaded
        var have = found[w.tag] || [], st = holoState[w.key]
        if (!have.length) {
          summonHolo(s, dim, w.x, w.y, w.z, w.tag, w.text)
          holoState[w.key] = { u: null, t: w.text }
          return
        }
        // keep the one we wrote to last time (or the first), delete the rest
        var keep = have[0]
        if (st && st.u) have.forEach(x => { if (uidOf(x) == st.u) keep = x })
        var removed = 0
        have.forEach(x => { if (x !== keep) { try { x.discard(); removed++ } catch (y) { } } })
        if (removed) logOnce('dupholo ' + w.key, 'removed ' + removed + ' duplicate floating text(s) for ' + w.tag)
        var ku = uidOf(keep)
        if (!st || st.u != ku || st.t != w.text) {
          run(s, `data merge entity ${ku} {text:'${w.text}'}`)
          holoState[w.key] = { u: ku, t: w.text }
        }
        try {
          var dx = keep.getX() - w.x, dy = keep.getY() - w.y, dz = keep.getZ() - w.z
          if (dx * dx + dy * dy + dz * dz > 0.25) keep.teleportTo(w.x, w.y, w.z)
        } catch (y) { }
      })
    })
  }

  // ---- boss rotations: several boss spawns share one spot; only one boss is out at a time.
  // When it dies its name disappears, "Random boss arrives in 30:00" counts down, then the next boss appears.
  // Every boss comes once per cycle (random order, never the same one twice in a row).
  const gTag = (gid) => 'ot_grp_' + gid
  const gBar = (gid) => 'overthrone:grp_' + String(gid).toLowerCase().replace(/[^a-z0-9_]/g, '')
  const gText = (secsLeft) => JSON.stringify(['', { text: '☠ ', color: 'dark_red' }, { text: 'Random Boss', color: 'red', bold: true }, { text: ' ☠', color: 'dark_red' },
    { text: '\nArrives in ' + mmss(secsLeft), color: 'yellow' }]).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const gShow = (s, gid, secsLeft) => {
    var g = groups[gid]; if (!g) return
    // (its floating "Random Boss arrives in" text is kept right by syncHolos)
    var b = gBar(gid), name = JSON.stringify(['', { text: '☠ ', color: 'dark_red' }, { text: 'Random Boss', color: 'red', bold: true }, { text: ' arrives in ' + mmss(secsLeft), color: 'yellow' }])
    if (!g.bar) { run(s, `bossbar add ${b} ${name}`); run(s, `bossbar set ${b} color red`); run(s, `bossbar set ${b} style notched_10`); g.bar = true }
    run(s, `bossbar set ${b} name ${name}`)
    run(s, `bossbar set ${b} max ${Math.max(1, g.mins * 60)}`)
    run(s, `bossbar set ${b} value ${Math.max(0, Math.min(g.mins * 60, g.mins * 60 - secsLeft))}`)
    run(s, `execute in ${g.dim} positioned ${g.x} ${g.y} ${g.z} run bossbar set ${b} players @a[distance=..${BAR_RANGE}]`)
  }
  const gHide = (s, gid) => {
    var g = groups[gid]; if (!g) return
    run(s, `execute in ${g.dim} run kill @e[type=minecraft:text_display,tag=${gTag(gid)}]`)
    run(s, `bossbar remove ${gBar(gid)}`)
    delete g.holo; delete g.bar
  }
  // takes a spawn out of play: its mob (if any) vanishes quietly, no name, no timer
  const makeDormant = (s, id) => {
    var sp = spawns[id]; if (!sp) return
    try {
      var lv = levelOf(s, sp.dim), e = lv ? findMob(lv, id) : null
      if (e != null) { ['ot_spawn', tagOf(id), 'ot_boss'].forEach(t => { try { e.removeTag(t) } catch (x) { } }); try { e.discard() } catch (x) { e.kill() } }
    } catch (x) { }
    run(s, `execute in ${sp.dim} run kill @e[type=minecraft:text_display,tag=${tagOf(id)}]`)
    hideBar(s, id)
    sp.dormant = true; sp.down = 0; sp.uuid = null
  }
  // next boss of a rotation: random order, each boss once per cycle, never the same twice in a row
  const gNext = (s, gid) => {
    var g = groups[gid]; if (!g) return
    g.members = (g.members || []).filter(k => spawns[k])
    if (!g.members.length) { gHide(s, gid); delete groups[gid]; save(s); return }
    if (!g.queue || !g.queue.length) {
      var q = g.members.slice()
      for (var i = q.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = q[i]; q[i] = q[j]; q[j] = t }
      if (q.length > 1 && q[0] == g.last) { var t2 = q[0]; q[0] = q[1]; q[1] = t2 }
      g.queue = q
    }
    var id = g.queue.shift()
    if (!spawns[id]) return gNext(s, gid)
    gHide(s, gid)
    g.down = 0; g.active = id; g.last = id
    var sp = spawns[id]
    sp.dormant = false; sp.down = Date.now()   // the normal respawn code brings it in within a second
    placeHolo(s, id)
    save(s)
  }

  // more than one living mob carrying this spawn's tag: keep the tracked one, remove the rest
  // (discard = no death, no drops, nothing for other mods to react to)
  const dedupe = (level, id, keep) => {
    try {
      var tag = tagOf(id), sp = spawns[id], ku = uidOf(keep), extra = []
      level.getAllEntities().forEach(x => { try { if (isMobOf(x, sp) && x.isAlive() && x.getTags().contains(tag) && uidOf(x) != ku) extra.push(x) } catch (y) { } })
      extra.forEach(x => { try { x.discard() } catch (y) { } })
      if (extra.length) logOnce('dup ' + id, 'removed ' + extra.length + ' duplicate ' + sp.type + ' for spawn ' + id)
    } catch (x) { }
  }

  // ---- tracking a live mob
  const adopt = (s, id, e) => {
    var sp = spawns[id]
    e.addTag('ot_spawn'); e.addTag(tagOf(id))
    if (sp.kind == 'boss') { e.addTag('ot_boss'); if (FREEZE_BOSSES) freeze(s, e); else sp.unfrozen = true; buffBoss(s, e, sp) }
    try { nerfSkills(e) } catch (x) { }
    try { e.setPersistenceRequired() } catch (x) { }
    sp.uuid = uidOf(e); sp.down = 0
    delete missing[id]
  }
  const spawnNow = (s, id) => {
    var sp = spawns[id]; if (!sp) return false
    var level = levelOf(s, sp.dim)
    if (level == null || !loaded(level, sp.x, sp.z, sp.y)) return false   // try again once someone is nearby
    var still = findMob(level, id)
    if (still != null && still.isAlive()) { adopt(s, id, still); hideBar(s, id); setHolo(s, id, null); save(s); return true }
    // FIX 2026-10-18: this used to summon again every second whenever it couldn't find the new mob within 2 blocks
    // (e.g. it got pushed away in a crowd), which piled up dozens of mobs. Now: one summon, then up to 60 seconds of
    // looking for it (the newest untagged mob of that type near the spot) before it may summon again.
    var pending = sp.pendingAt && Date.now() - sp.pendingAt < 60000
    if (!pending) {
      // summon without NBT, so the mob gets its normal gear/stats like from a spawn egg
      run(s, `execute in ${sp.dim} run summon ${sp.type} ${sp.x} ${sp.y} ${sp.z}`)
      sp.pendingAt = Date.now()
    }
    // the mob that was just summoned: untagged, same type, near the spot. Young ones (under 5 s old) first, then the
    // closest, so a wandering wild mob of the same type isn't taken instead (that left the summoned one behind).
    var found = null, bestScore = 1e18, r = (sp.kind == 'boss' ? BOSS_ROAM : LEASH)
    level.getAllEntities().forEach(e => {
      try {
        if (!isMobOf(e, sp) || !e.isAlive() || e.getTags().contains('ot_spawn')) return
        try { if (typeof e.getOwnerUUID === 'function' && e.getOwnerUUID() != null) return } catch (y) { }
        var dx = e.getX() - sp.x, dy = e.getY() - sp.y, dz = e.getZ() - sp.z, d2 = dx * dx + dy * dy + dz * dz
        if (d2 > r * r) return
        var age = Number(e.tickCount) || 0
        var score = (age < 100 ? 0 : 1e9) + d2
        if (score < bestScore) { bestScore = score; found = e }
      } catch (x) { }
    })
    if (found == null) return false
    delete sp.pendingAt
    adopt(s, id, found)
    setHolo(s, id, null)
    hideBar(s, id)
    if (sp.kind == 'boss') run(s, 'tellraw @a ' + JSON.stringify(['', { text: '☠ ', color: 'dark_red' }, { translate: sp.key, color: 'red', bold: true }, { text: sp.group ? ' has appeared in the Caverns!' : ' has returned to the Caverns!', color: 'gold' }]))
    save(s)
    return true
  }

  // two spawns of the same mob on the same spot (e.g. /setmob run twice): keep one
  const mergeDuplicates = (s) => {
    var ids = Object.keys(spawns), gone = 0
    ids.forEach((a, i) => {
      var A = spawns[a]; if (!A) return
      ids.slice(i + 1).forEach(b => {
        var B = spawns[b]; if (!B || B.dim != A.dim || B.type != A.type || B.kind != A.kind || !!B.group != !!A.group) return
        var dx = A.x - B.x, dy = A.y - B.y, dz = A.z - B.z
        if (dx * dx + dy * dy + dz * dz > 1) return
        delete spawns[b]; gone++
        Object.keys(groups).forEach(gid => { var g = groups[gid]; g.members = (g.members || []).filter(k => k != b); if (g.queue) g.queue = g.queue.filter(k => k != b) })
      })
    })
    if (gone) { console.warn('[mob_spawns] merged ' + gone + ' duplicate spawn(s) (same mob on the same spot)'); save(s) }
    return gone
  }
  ServerEvents.loaded(event => {
    var s = event.server; load(s)
    mergeDuplicates(s)
    // floating texts are placed by syncHolos once their area is loaded (placing them blind left copies behind)
    Object.keys(groups).forEach(gid => { var g = groups[gid]; delete g.holo; delete g.bar })
  })

  // ---- crowd guard (FIX 2026-10-18)
  // "Loose" mobs are living mobs near a spawn spot that this script doesn't track: wild spawns, a boss's summons,
  // mobs that changed into another mob (e.g. an Orc becoming a High Orc is a NEW mob of another type), or leftovers
  // still wearing an old spawn tag. Only monsters, and mobs from the same mod as a spawn in that world, count.
  // Never counted: players, anything owned by a player (pets/summons, also of offline players), named mobs, NPCs.
  // Every 5 seconds, around every loaded spot: more than CROWD_CAP loose mobs within CROWD_RADIUS = the youngest
  // extras are removed quietly (discard: no death, no drops). A boss's own living summons are removed last.
  // CROWD_CAP = 0 turns this off. /mobspawn scan shows what's around you, /mobspawn cleanup removes them all now.
  const CROWD_CAP = 8
  const CROWD_RADIUS = 24
  var crowdRemoved = 0, crowdByType = {}
  const nsOf = (t) => String(t).split(':')[0]
  const isPlayerUuid = (s, u) => {
    try { if (s.getPlayerList().getPlayer(u) != null) return true } catch (x) { }
    try { var c = s.getProfileCache().get(u); if (c != null && c.isPresent()) return true } catch (x) { }
    return false
  }
  // owner of a mob: 'none' | 'player' | 'mob' (a living mob owns it) | 'gone' (its owner isn't around)
  const ownerKind = (s, level, x) => {
    var u = null
    try { if (typeof x.getOwnerUUID === 'function') u = x.getOwnerUUID() } catch (y) { }
    if (u == null) { try { var o0 = x.getOwner(); if (o0 != null) return o0.isPlayer() ? 'player' : 'mob' } catch (y) { } return 'none' }
    var o = null
    try { o = level.getEntity(u) } catch (y) { }
    if (o != null) { try { if (o.isPlayer()) return 'player' } catch (y) { } try { return o.isAlive() ? 'mob' : 'gone' } catch (y) { return 'mob' } }
    return isPlayerUuid(s, u) ? 'player' : 'gone'
  }
  const isMonster = (x) => { try { return String(x.getType().getCategory()).toLowerCase().indexOf('monster') >= 0 } catch (y) { return false } }
  const hasName = (x) => { try { return !!x.hasCustomName() } catch (y) { return false } }
  // the tracked mob of an existing spawn (never loose)
  const trackedIds = () => { var t = {}; Object.keys(spawns).forEach(k => { if (spawns[k].uuid) t[spawns[k].uuid] = k }); return t }
  // classify one entity: null = not a mob we care about, else { kind: 'tracked'|'loose'|'pet'|'summon'|'named', ... }
  const classify = (s, level, x, tracked, nss) => {
    try {
      if (!x.isLiving() || x.isPlayer() || !x.isAlive()) return null
      var t = typeOf(x); if (!t || t == 'minecraft:armor_stand' || nsOf(t) == 'easy_npc') return null
      var tg = x.getTags()
      if (tg.contains('ot_spawn') && tracked[uidOf(x)]) return { kind: 'tracked', type: t, id: tracked[uidOf(x)] }
      var ok = isMonster(x) || !!nss[nsOf(t)] || tg.contains('ot_spawn')
      if (!ok) return null
      var ow = ownerKind(s, level, x)
      if (ow == 'player') return { kind: 'pet', type: t }
      if (hasName(x)) return { kind: 'named', type: t }
      return { kind: ow == 'mob' ? 'summon' : 'loose', type: t, orphan: tg.contains('ot_spawn') }
    } catch (y) { return null }
  }
  const nsFor = (dim) => { var n = {}; Object.keys(spawns).forEach(k => { var sp = spawns[k]; if (sp.dim == dim && nsOf(sp.type) != 'minecraft') n[nsOf(sp.type)] = true }); return n }
  const crowdGuard = (s) => {
    if (!CROWD_CAP) return
    var tracked = trackedIds()
    s.getAllLevels().forEach(level => {
      var dim = dimOf(level), spots = Object.keys(spawns).filter(k => spawns[k].dim == dim && !spawns[k].dormant)
      if (!spots.length) return
      var nss = nsFor(dim), mobs = []
      try { level.getAllEntities().forEach(x => { var c = classify(s, level, x, tracked, nss); if (c && (c.kind == 'loose' || c.kind == 'summon')) mobs.push({ e: x, c: c }) }) } catch (x) { return }
      if (mobs.length <= CROWD_CAP) return
      var gone = {}
      spots.forEach(k => {
        var sp = spawns[k]
        if (!loaded(level, sp.x, sp.z, sp.y)) return
        var near = mobs.filter(m => {
          if (gone[uidOf(m.e)]) return false
          var dx = m.e.getX() - sp.x, dy = m.e.getY() - sp.y, dz = m.e.getZ() - sp.z
          return dx * dx + dy * dy + dz * dz <= CROWD_RADIUS * CROWD_RADIUS
        })
        if (near.length <= CROWD_CAP) return
        // keep: a boss's living summons first, then the oldest; remove the rest (old spawn-tag leftovers go first)
        var rank = (m) => (m.c.orphan ? 2e9 : 0) + (m.c.kind == 'summon' ? -1e9 : 0) - (Number(m.e.tickCount) || 0)
        near.sort((a, b) => rank(a) - rank(b))
        near.slice(CROWD_CAP).forEach(m => {
          try { m.e.discard(); gone[uidOf(m.e)] = true; crowdRemoved++; crowdByType[m.c.type] = (crowdByType[m.c.type] || 0) + 1 } catch (y) { }
        })
      })
      var n = Object.keys(gone).length
      if (n) logOnce('crowd ' + dim, 'crowd guard removed ' + n + ' extra mob(s) near spawn spots in ' + dim + ' (total since start: ' + crowdRemoved + ')')
    })
  }

  // countdowns every second; every 5 seconds: missing mobs (despawned / removed) and the leash
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 20 != 0) return
    load(s)
    var now = Date.now(), five = s.tickCount % 100 == 0
    Object.keys(groups).forEach(gid => {
      var g = groups[gid]
      try {
        if (!g.down) return
        if (now >= g.down) gNext(s, gid)
        else gShow(s, gid, Math.ceil((g.down - now) / 1000))
      } catch (x) { logOnce('grp ' + gid, 'rotation: ' + x) }
    })
    Object.keys(spawns).forEach(id => {
      var sp = spawns[id]
      try {
        if (sp.dormant) return
        if (sp.down) {
          if (now >= sp.down) spawnNow(s, id)
          else { var left = Math.ceil((sp.down - now) / 1000); setHolo(s, id, left); showBar(s, id, left) }
          return
        }
        if (!sp.uuid) return   // every spawn is checked once a second
        var level = levelOf(s, sp.dim)
        if (level == null || !loaded(level, sp.x, sp.z, sp.y)) return
        var e = findMob(level, id)
        if (e == null || !e.isAlive()) {
          missing[id] = (missing[id] || 0) + 1
          if (missing[id] >= 15) { sp.down = now; sp.uuid = null; delete missing[id]; save(s) }   // vanished without dying: bring it back
          return
        }
        missing[id] = 0
        if (five) { try { nerfSkills(e) } catch (x) { } }
        if (five) dedupe(level, id, e)
        if (sp.kind == 'boss') {
          if (SHOW_ALIVE_BAR) { try { aliveBar(s, id, e) } catch (x) { logOnce('bar ' + id, 'boss bar: ' + x) } }
          if (FREEZE_BOSSES) { try { freeze(s, e) } catch (x) { logOnce('frz ' + id, 'freeze: ' + x) } }
          if (five) buffBoss(s, e, sp)   // also picks up /mobspawn power changes and leaving/entering the Caverns
          if (five && !FREEZE_BOSSES && !sp.unfrozen && wasFrozen(e)) {
            // frozen by the old version: replace it with a fresh copy once (discard = no death, no drops, no kill message)
            sp.unfrozen = true; sp.uuid = null; sp.down = 1; save(s)
            try { e.discard() } catch (x) { }
            return
          }
          if (five && !sp.unfrozen) { sp.unfrozen = true; save(s) }
        }
        var dx = e.getX() - sp.x, dz = e.getZ() - sp.z, dy = e.getY() - sp.y
        var leash = sp.kind == 'boss' ? (FREEZE_BOSSES ? BOSS_LEASH : BOSS_ROAM) : LEASH
        if (dx * dx + dy * dy + dz * dz > leash * leash) { try { e.teleportTo(sp.x, sp.y, sp.z) } catch (y) { run(s, `execute in ${sp.dim} run tp ${uidOf(e)} ${sp.x} ${sp.y} ${sp.z}`) } }
      } catch (x) { logOnce('tick ' + id, 'tick ' + sp.type + ': ' + x) }
    })
    if (five) { try { crowdGuard(s) } catch (x) { logOnce('crowd', 'crowd guard: ' + x) } }
    try { syncHolos(s) } catch (x) { logOnce('sync', 'floating text sync: ' + x) }
  })

  // killed: start the timer
  EntityEvents.death(event => {
    try {
      var e = event.entity
      if (!e.getTags().contains('ot_spawn')) return
      var s = e.level.server; load(s)
      var u = uidOf(e), id = null
      Object.keys(spawns).forEach(k => { if (isMobOf(e, spawns[k]) && (spawns[k].uuid == u || e.getTags().contains(tagOf(k)))) id = k })
      if (id == null) return
      var sp = spawns[id]
      var g = sp.group ? groups[sp.group] : null
      if (g) {
        // rotation: this boss's name goes away and the "Random Boss arrives in" timer starts
        var killerR = null
        try { var pr = event.source.getPlayer(); if (pr) killerR = pr.username } catch (x) { }
        sp.uuid = null
        makeDormant(s, id)
        g.down = Date.now() + g.mins * 60000; g.active = null
        save(s)
        gShow(s, sp.group, g.mins * 60)
        run(s, 'tellraw @a ' + JSON.stringify(['', { text: '☠ ', color: 'dark_red' }, { translate: sp.key, color: 'red', bold: true },
          { text: killerR ? ' was slain by ' : ' was slain', color: 'gray' }, killerR ? { text: killerR, color: 'gold', bold: true } : '',
          { text: '! A random boss arrives in ' + g.mins + ' minutes.', color: 'gray' }]))
        return
      }
      sp.down = Date.now() + sp.mins * 60000; sp.uuid = null
      save(s)
      setHolo(s, id, sp.mins * 60)
      showBar(s, id, sp.mins * 60)
      if (sp.kind == 'boss') {
        var killer = null
        try { var p = event.source.getPlayer(); if (p) killer = p.username } catch (x) { }
        run(s, 'tellraw @a ' + JSON.stringify(['', { text: '☠ ', color: 'dark_red' }, { translate: sp.key, color: 'red', bold: true },
          { text: killer ? ' was slain by ' : ' was slain', color: 'gray' }, killer ? { text: killer, color: 'gold', bold: true } : '',
          { text: '! It returns in ' + sp.mins + ' minutes.', color: 'gray' }]))
      }
    } catch (x) { console.warn('[mob_spawns] death: ' + x) }
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    const say = (src, m) => src.sendSystemMessage(Text.of(m))
    const P = '§6[spawns] '
    const target = (p) => {
      var e = null
      try { var r = p.rayTrace(8); if (r && r.entity && r.entity.isLiving() && !r.entity.isPlayer()) e = r.entity } catch (x) { }
      if (e == null) {
        var best = 64
        p.level.getAllEntities().forEach(x => {
          try { if (x.isLiving() && !x.isPlayer() && typeOf(x)) { var d = x.distanceToSqr(p); if (d < best) { best = d; e = x } } } catch (y) { }
        })
      }
      return e
    }
    const scan = (ctx, r) => {
      var p = ctx.source.playerOrException, s = p.server, level = p.level
      load(s)
      var tracked = trackedIds(), nss = nsFor(dimOf(level)), rows = {}, total = 0
      level.getAllEntities().forEach(x => {
        try {
          if (x.distanceToSqr(p) > r * r) return
          var c = classify(s, level, x, tracked, nss); if (!c) return
          var row = rows[c.type] = rows[c.type] || { tracked: 0, loose: 0, summon: 0, pet: 0, named: 0, orphan: 0 }
          row[c.kind]++; if (c.orphan) row.orphan++; total++
        } catch (y) { }
      })
      say(ctx.source, P + '§eMobs within ' + r + ' blocks: §f' + total + ' §8(crowd guard: max ' + CROWD_CAP + ' loose per spot, removed ' + crowdRemoved + ' since start)')
      Object.keys(rows).sort((a, b) => { var A = rows[a], B = rows[b]; return (B.loose + B.summon) - (A.loose + A.summon) }).slice(0, 15).forEach(t => {
        var w = rows[t], spawnType = Object.keys(spawns).some(k => spawns[k].type == t)
        say(ctx.source, '§7- §f' + t + (spawnType ? ' §6(a spawn type)' : '') + '§7: ' + [
          w.tracked ? '§atracked ' + w.tracked : '', w.loose ? '§cloose ' + w.loose : '', w.summon ? '§dsummoned by a mob ' + w.summon : '',
          w.orphan ? '§4old spawn tag ' + w.orphan : '', w.pet ? '§bplayer pets ' + w.pet : '', w.named ? '§3named ' + w.named : ''].filter(x => x).join('§7, '))
      })
      if (Object.keys(crowdByType).length) say(ctx.source, '§8Removed by the crowd guard: ' + Object.keys(crowdByType).map(k => k + ' x' + crowdByType[k]).join(', '))
      return 1
    }
    // the spawn you're looking at (its mob), else the nearest spot (side to side only, height ignored: bosses can fly)
    const nearest = (p, max) => {
      load(p.server)
      try {
        var r = p.rayTrace(24)
        if (r && r.entity) {
          var u = uidOf(r.entity), hit = null
          Object.keys(spawns).forEach(k => { if (spawns[k].uuid == u) hit = k })
          if (hit) return hit
        }
      } catch (x) { }
      var best = max * max, id = null, dim = dimOf(p.level)
      Object.keys(spawns).forEach(k => {
        var sp = spawns[k]; if (sp.dim != dim || sp.dormant) return
        var dx = sp.x - p.getX(), dz = sp.z - p.getZ(), d = dx * dx + dz * dz
        if (d < best) { best = d; id = k }
      })
      return id
    }
    const make = (ctx, kind, mins) => {
      try { return makeSpawn(ctx, kind, mins) } catch (x) {
        say(ctx.source, '§c[spawns] Error: ' + x + ' §7(send this to your dev)')
        console.error('[mob_spawns] /set' + kind + ': ' + x + (x && x.stack ? '\n' + x.stack : ''))
        return 0
      }
    }
    const makeSpawn = (ctx, kind, mins) => {
      var p = ctx.source.playerOrException, s = p.server, e = target(p)
      load(s)
      if (e == null) { say(ctx.source, '§cLook at the mob (or stand right next to it). Place it with its spawn egg first.'); return 0 }
      if (e.getTags().contains('ot_spawn')) {
        var u = uidOf(e), owned = false
        Object.keys(spawns).forEach(k => { if (spawns[k].uuid == u) owned = true })
        if (owned) { say(ctx.source, '§cThat mob already has a spawn. Use /mobspawn remove first.'); return 0 }
        // left over from a failed attempt: tagged but not saved as a spawn, so clean it up and carry on
        ;['ot_spawn', 'ot_boss'].forEach(t => e.removeTag(t))
        var old = []; e.getTags().forEach(t => { if (String(t).indexOf('ot_sp_') == 0) old.push(String(t)) })
        old.forEach(t => e.removeTag(t))
      }
      var type = typeOf(e)
      if (!type) { say(ctx.source, '§cThat entity can\'t be respawned.'); return 0 }
      var id = String(Date.now().toString(36)) + Math.floor(Math.random() * 1000)
      spawns[id] = { type: type, key: 'entity.' + type.replace(':', '.'), kind: kind, mins: mins, dim: dimOf(e.level),   // key = the game's own name key
        x: Number(Number(e.getX()).toFixed(2)), y: Number(Number(e.getY()).toFixed(2)), z: Number(Number(e.getZ()).toFixed(2)),
        h: Number((Number(e.getBbHeight()) + 0.6).toFixed(2)), uuid: null, down: 0 }
      adopt(s, id, e)
      save(s)
      placeHolo(s, id)
      say(ctx.source, P + '§a' + (kind == 'boss' ? 'Boss' : 'Mob') + ' spawn set: §f' + type + ' §7respawns §f' + mins + ' min§7 after it dies. §8Its name now floats above it.')
      return 1
    }
    // stop tracking the nearest spawn; withMob = also kill its mob (if alive)
    // when nothing is close enough: say where the spawns actually are
    const whyNone = (ctx, p) => {
      var dim = dimOf(p.level), all = Object.keys(load(p.server)), here = 0, best = null, bd = 1e18
      all.forEach(k => {
        var sp = spawns[k]
        if (sp.dim != dim) return
        here++
        var dx = sp.x - p.getX(), dz = sp.z - p.getZ(), d = dx * dx + dz * dz
        if (d < bd) { bd = d; best = sp }
      })
      say(ctx.source, '§cNo spawn within 16 blocks. §7Spawns saved: §f' + all.length + ' §7(§f' + here + '§7 in this world: §f' + dim + '§7)')
      if (best) say(ctx.source, '§7Nearest: §f' + best.type + ' §7at §f' + Math.floor(best.x) + ' ' + Math.floor(best.y) + ' ' + Math.floor(best.z) + ' §7(' + Math.round(Math.sqrt(bd)) + ' blocks away)')
      else if (all.length) all.forEach(k => say(ctx.source, '§8- ' + spawns[k].type + ' in ' + spawns[k].dim))
      return 0
    }
    // /mobspawn power targets: every boss of the rotation near you, else the nearest boss spawn
    const powerTargets = (p) => {
      var gid = nearestGroup(p)
      if (gid != null) return groups[gid].members.filter(k => spawns[k])
      var id = nearest(p, 32)
      return id && spawns[id] && spawns[id].kind == 'boss' ? [id] : []
    }
    const nearestGroup = (p) => {
      var best = 32 * 32, gid = null, dim = dimOf(p.level)
      load(p.server)
      Object.keys(groups).forEach(k => {
        var g = groups[k]; if (g.dim != dim) return
        var dx = g.x - p.getX(), dz = g.z - p.getZ(), d = dx * dx + dz * dz
        if (d < best) { best = d; gid = k }
      })
      return gid
    }
    // every boss spawn within 32 blocks (side to side) becomes one rotation
    const makeRotation = (ctx, mins) => {
      var p = ctx.source.playerOrException, s = p.server, dim = dimOf(p.level)
      load(s)
      var ids = Object.keys(spawns).filter(k => {
        var sp = spawns[k]; if (sp.dim != dim || sp.kind != 'boss') return false
        var dx = sp.x - p.getX(), dz = sp.z - p.getZ(); return dx * dx + dz * dz <= 32 * 32
      })
      if (ids.length < 2) { say(ctx.source, '§cA rotation needs at least 2 boss spawns within 32 blocks. §7Found ' + ids.length + '. Place the bosses with eggs and use /mobspawn boss on each first.'); return 0 }
      // bosses already in another rotation leave it
      ids.forEach(k => { var old = spawns[k].group; if (old && groups[old]) { gHide(s, old); delete groups[old] } delete spawns[k].group })
      var gid = 'g' + Date.now().toString(36)
      var cx = 0, cz = 0, top = -1e9
      ids.forEach(k => { var sp = spawns[k]; cx += sp.x; cz += sp.z; top = Math.max(top, sp.y + (sp.h || 2)) })
      var g = { dim: dim, x: Number((cx / ids.length).toFixed(2)), y: Number((top + 0.5).toFixed(2)), z: Number((cz / ids.length).toFixed(2)), mins: mins, members: ids, queue: [], active: null, last: null, down: 0 }
      groups[gid] = g
      // keep one boss that is out right now (if any); every other one waits its turn
      var keep = null
      ids.forEach(k => {
        var sp = spawns[k]; sp.group = gid
        if (keep == null && !sp.down) { var lv = levelOf(s, sp.dim), e = lv ? findMob(lv, k) : null; if (e != null && e.isAlive()) { keep = k; return } }
        makeDormant(s, k)
      })
      if (keep) { g.active = keep; g.last = keep; hideBar(s, keep) }
      else g.down = Date.now()   // nobody out: the first boss appears straight away
      save(s)
      say(ctx.source, P + '§aBoss rotation made with §f' + ids.length + '§a bosses §7(' + mins + ' min between bosses). ' + (keep ? '§f' + spawns[keep].type + '§7 is out now; the others wait their turn.' : '§7The first boss appears now.'))
      return 1
    }
    const removeSpawn = (ctx, withMob) => {
      var p = ctx.source.playerOrException, s = p.server, id = nearest(p, 16)
      if (id == null) return whyNone(ctx, p)
      var sp = spawns[id]
      run(s, `execute in ${sp.dim} run kill @e[type=minecraft:text_display,tag=${tagOf(id)}]`)
      if (sp.uuid) {
        try {
          var e = p.level.getEntity(UUID.fromString(sp.uuid))
          if (e) { e.removeTag('ot_spawn'); e.removeTag(tagOf(id)); e.removeTag('ot_boss'); if (withMob) e.kill() }
        } catch (x) { }
      }
      hideBar(s, id)
      if (sp.group && groups[sp.group]) {
        var gg = groups[sp.group]
        gg.members = gg.members.filter(k => k != id); if (gg.queue) gg.queue = gg.queue.filter(k => k != id)
        if (gg.active == id) { gg.active = null; if (!gg.down) gg.down = Date.now() }
        if (!gg.members.length) { gHide(s, sp.group); delete groups[sp.group] }
      }
      delete spawns[id]; save(s)
      say(ctx.source, P + '§aRemoved the §f' + sp.type + '§a spawn' + (withMob ? ' and its mob.' : '. §7Its mob (if alive) is left where it is: §f/mobspawn remove kill§7 also removes the mob.'))
      return 1
    }
    const minsArg = () => Commands.argument('minutes', Arguments.INTEGER.create(event))
    ;['mob', 'boss'].forEach(kind => {
      event.register(Commands.literal('set' + kind).requires(src => src.hasPermission(2))
        .executes(ctx => make(ctx, kind, DEFAULT_MINUTES))
        .then(minsArg().executes(ctx => make(ctx, kind, Math.max(1, Arguments.INTEGER.getResult(ctx, 'minutes'))))))
    })
    event.register(Commands.literal('mobspawn').requires(src => src.hasPermission(2))
      // same as /setmob and /setboss (in case another mod already uses those names)
      .then(Commands.literal('mob').executes(ctx => make(ctx, 'mob', DEFAULT_MINUTES)).then(minsArg().executes(ctx => make(ctx, 'mob', Math.max(1, Arguments.INTEGER.getResult(ctx, 'minutes'))))))
      .then(Commands.literal('boss').executes(ctx => make(ctx, 'boss', DEFAULT_MINUTES)).then(minsArg().executes(ctx => make(ctx, 'boss', Math.max(1, Arguments.INTEGER.getResult(ctx, 'minutes'))))))
      .then(Commands.literal('remove').executes(ctx => removeSpawn(ctx, false))
        .then(Commands.literal('kill').executes(ctx => removeSpawn(ctx, true))))
      .then(Commands.literal('time').then(minsArg().executes(ctx => {
        var p = ctx.source.playerOrException, id = nearest(p, 16), m = Math.max(1, Arguments.INTEGER.getResult(ctx, 'minutes'))
        if (id == null) return whyNone(ctx, p)
        spawns[id].mins = m; save(p.server)
        say(ctx.source, P + '§a' + spawns[id].type + ' now respawns §f' + m + ' min§a after it dies.')
        return 1
      })))
      .then(Commands.literal('info').executes(ctx => {
        var p = ctx.source.playerOrException, id = nearest(p, 16)
        if (id == null) return whyNone(ctx, p)
        var sp = spawns[id], alive = false
        try { var e = sp.uuid ? p.level.getEntity(UUID.fromString(sp.uuid)) : null; alive = e != null && e.isAlive() } catch (x) { }
        say(ctx.source, P + '§f' + sp.type + ' §7(' + sp.kind + ', ' + sp.mins + ' min) at §f' + Math.floor(sp.x) + ' ' + Math.floor(sp.y) + ' ' + Math.floor(sp.z))
        say(ctx.source, '§7Name key: §f' + sp.key + ' §7· tracked mob: ' + (sp.down ? '§cdead, back in ' + mmss(Math.max(0, Math.ceil((sp.down - Date.now()) / 1000))) : alive ? '§afound & alive' : '§enot found yet (unloaded or missing)'))
        var lv = levelOf(p.server, sp.dim), fm = null
        try { fm = lv ? findMob(lv, id) : null } catch (x) { say(ctx.source, '§cfindMob error: ' + x) }
        say(ctx.source, '§8debug: world ' + (lv ? 'ok' : 'NOT FOUND') + ' · loaded ' + (lv ? loaded(lv, sp.x, sp.z, sp.y) : '-') + ' · uuid ' + sp.uuid + ' · by uuid/tag: ' + (fm ? 'found' : 'none') + ' · bar ' + !!sp.bar)
        if (fm && sp.kind == 'boss') { try { aliveBar(p.server, id, fm); say(ctx.source, '§8debug: boss bar refreshed') } catch (x) { say(ctx.source, '§cboss bar error: ' + x) } }
        placeHolo(p.server, id)
        say(ctx.source, '§7Floating text re-placed. §8If you still can\'t see it, look ' + sp.h + ' blocks above the spot.')
        return 1
      }))
      .then(Commands.literal('move').executes(ctx => {
        // moves the spawn you're looking at (or the nearest one) to where you stand, and brings its mob along
        var p = ctx.source.playerOrException, s = p.server, id = nearest(p, 16)
        if (id == null) return whyNone(ctx, p)
        var sp = spawns[id]
        var nx = Number((Math.floor(p.getX()) + 0.5).toFixed(2)), ny = Number(Math.floor(p.getY()).toFixed(2)), nz = Number((Math.floor(p.getZ()) + 0.5).toFixed(2))
        // in a rotation, every boss of that rotation moves to the new spot together
        var ids = sp.group && groups[sp.group] ? groups[sp.group].members.filter(k => spawns[k]) : [id]
        ids.forEach(k => {
          var m = spawns[k]
          m.x = nx; m.y = ny; m.z = nz
          try { var e = findMob(p.level, k); if (e != null) { try { e.teleportTo(nx, ny, nz) } catch (y) { run(s, `execute in ${m.dim} run tp ${uidOf(e)} ${nx} ${ny} ${nz}`) } } } catch (x) { }
          if (!m.dormant) placeHolo(s, k)
        })
        if (sp.group && groups[sp.group]) {   // keep the rotation's "Random Boss" text above its bosses
          var g = groups[sp.group], cx = 0, cz = 0, top = -1e9, n = 0
          g.members.forEach(k => { var m = spawns[k]; if (!m) return; cx += m.x; cz += m.z; top = Math.max(top, m.y + (m.h || 2)); n++ })
          if (n) { gHide(s, sp.group); g.x = Number((cx / n).toFixed(2)); g.z = Number((cz / n).toFixed(2)); g.y = Number((top + 0.5).toFixed(2)) }
        }
        save(s)
        say(ctx.source, P + '§aMoved ' + (ids.length > 1 ? 'all §f' + ids.length + '§a bosses of the rotation' : 'the §f' + sp.type + '§a spawn') + ' to where you stand.')
        return 1
      }))
      .then(Commands.literal('skills').executes(ctx => {
        // shows the Tensura/Mysticism skills of the mob you look at, and which ones get removed
        var p = ctx.source.playerOrException, e = target(p)
        if (e == null) { say(ctx.source, '§cLook at a mob (within 8 blocks).'); return 0 }
        if (SkillAPI == null) { say(ctx.source, '§cThe skill system was not found.'); return 0 }
        var ids = skillIds(e)
        say(ctx.source, P + '§f' + typeOf(e) + ' §7health §c' + Number(e.getHealth()).toFixed(0) + '/' + Number(e.getMaxHealth()).toFixed(0) + ' §7· ' + ids.length + ' skill(s):')
        say(ctx.source, ids.length ? ids.map(id => (STRIP_SKILLS.some(w => id.indexOf(w) >= 0) ? '§c' : '§7') + id).join('§8, ') : '§7(none)')
        say(ctx.source, '§8Red = removed from spawned bosses/mobs (words: ' + STRIP_SKILLS.join(', ') + ')')
        return 1
      }))
      .then(Commands.literal('list').executes(ctx => {
        var p = ctx.source.playerOrException, dim = dimOf(p.level), now = Date.now(), n = 0
        Object.keys(load(p.server)).forEach(k => {
          var sp = spawns[k]
          n++
          say(ctx.source, '§7- ' + (sp.kind == 'boss' ? '§c☠ BOSS ' : '§6MOB ') + '§f' + sp.type + ' §8at ' + Math.floor(sp.x) + ' ' + Math.floor(sp.y) + ' ' + Math.floor(sp.z) +
            ' §7(' + sp.mins + ' min) ' + (sp.dormant ? '§din rotation, waiting' : sp.down ? '§cdead, back in ' + mmss(Math.max(0, Math.ceil((sp.down - now) / 1000))) : '§aalive') + (sp.dim != dim ? ' §8(' + sp.dim + ')' : ''))
        })
        Object.keys(groups).forEach(gid => {
          var g = groups[gid]
          say(ctx.source, '§d⟳ ROTATION §7at §f' + Math.floor(g.x) + ' ' + Math.floor(g.y) + ' ' + Math.floor(g.z) + ' §7(' + g.members.length + ' bosses, ' + g.mins + ' min) ' +
            (g.down ? '§cnext boss in ' + mmss(Math.max(0, Math.ceil((g.down - now) / 1000))) : g.active && spawns[g.active] ? '§aout now: §f' + spawns[g.active].type : '§7starting'))
        })
        if (!n) say(ctx.source, '§7No spawns saved yet. §8(your world: ' + dim + ')')
        return 1
      }))
      .then(Commands.literal('clearall').executes(ctx => {
        // removes EVERY spawn (mobs are left alive), their floating texts, bars and marks
        var s = ctx.source.server, n = 0
        load(s)
        Object.keys(spawns).forEach(k => { try { hideBar(s, k) } catch (x) { } n++ })
        Object.keys(groups).forEach(gid => { try { gHide(s, gid) } catch (x) { } })
        spawns = {}; groups = {}; save(s)
        run(s, 'kill @e[type=minecraft:text_display,tag=ot_spawnholo]')
        s.getAllLevels().forEach(l => { try { l.getAllEntities().forEach(e => { try { var t = e.getTags(); if (t.contains('ot_spawn')) { var rm = []; t.forEach(x => { if (String(x).indexOf('ot_sp') == 0 || String(x) == 'ot_boss') rm.push(String(x)) }); rm.forEach(x => e.removeTag(x)) } } catch (y) { } }) } catch (y) { } })
        say(ctx.source, P + '§aCleared ' + n + ' spawn(s). §7Their mobs are still alive: kill them or set them again.')
        return 1
      }))
      .then(Commands.literal('rotation')
        .executes(ctx => makeRotation(ctx, ROTATION_MINUTES))
        .then(minsArg().executes(ctx => makeRotation(ctx, Math.max(1, Arguments.INTEGER.getResult(ctx, 'minutes')))))
        .then(Commands.literal('off').executes(ctx => {
          var p = ctx.source.playerOrException, s = p.server, gid = nearestGroup(p)
          if (gid == null) { say(ctx.source, '§cNo boss rotation within 32 blocks.'); return 0 }
          var g = groups[gid]
          gHide(s, gid)
          g.members.forEach(k => { var sp = spawns[k]; if (!sp) return; delete sp.group; if (sp.dormant) { sp.dormant = false; sp.down = Date.now(); placeHolo(s, k) } })
          delete groups[gid]; save(s)
          say(ctx.source, P + '§aRotation turned off. §7Each boss is a normal boss spawn again (the waiting ones appear now).')
          return 1
        }))
        .then(Commands.literal('next').executes(ctx => {
          var p = ctx.source.playerOrException, s = p.server, gid = nearestGroup(p)
          if (gid == null) { say(ctx.source, '§cNo boss rotation within 32 blocks.'); return 0 }
          var g = groups[gid]
          if (g.active && spawns[g.active] && !spawns[g.active].dormant) makeDormant(s, g.active)
          g.down = Date.now(); g.active = null; save(s)
          say(ctx.source, P + '§aThe next boss appears within a second.')
          return 1
        })))
      // boss strength for the rotation near you (or the nearest boss spawn): /mobspawn power [<health%> <damage%>]
      .then(Commands.literal('power')
        .executes(ctx => {
          var p = ctx.source.playerOrException, ids = powerTargets(p)
          if (!ids.length) { say(ctx.source, '§cNo boss rotation or boss spawn within 32 blocks.'); return 0 }
          ids.forEach(k => { var w = powerOf(spawns[k]); say(ctx.source, P + '§f' + spawns[k].type + ' §7health §c' + (w[0] >= 0 ? '+' : '') + w[0] + '% §7damage §c' + (w[1] >= 0 ? '+' : '') + w[1] + '%') })
          say(ctx.source, '§7Only applies inside the Caverns. Change: §f/mobspawn power <health%> <damage%> §7(100 = double, 0 = normal, -50 = half) or §f/mobspawn power reset')
          return 1
        })
        .then(Commands.literal('reset').executes(ctx => {
          var p = ctx.source.playerOrException, ids = powerTargets(p)
          if (!ids.length) { say(ctx.source, '§cNo boss rotation or boss spawn within 32 blocks.'); return 0 }
          ids.forEach(k => { delete spawns[k].hpB; delete spawns[k].dmgB }); save(p.server)
          say(ctx.source, P + '§aBack to the default (health +' + BOSS_HP_BONUS + '%, damage +' + BOSS_DAMAGE_BONUS + '%) for ' + ids.length + ' boss(es). §7Live bosses update within 5 seconds.')
          return 1
        }))
        .then(Commands.argument('health', Arguments.INTEGER.create(event)).then(Commands.argument('damage', Arguments.INTEGER.create(event)).executes(ctx => {
          var p = ctx.source.playerOrException, ids = powerTargets(p)
          if (!ids.length) { say(ctx.source, '§cNo boss rotation or boss spawn within 32 blocks.'); return 0 }
          var hp = Math.max(-90, Math.min(1000, Arguments.INTEGER.getResult(ctx, 'health')))
          var dmg = Math.max(-90, Math.min(1000, Arguments.INTEGER.getResult(ctx, 'damage')))
          ids.forEach(k => { spawns[k].hpB = hp; spawns[k].dmgB = dmg }); save(p.server)
          say(ctx.source, P + '§aSet ' + ids.length + ' boss(es) to health ' + (hp >= 0 ? '+' : '') + hp + '%, damage ' + (dmg >= 0 ? '+' : '') + dmg + '%. §7Live bosses update within 5 seconds (keeping their health %).')
          return 1
        }))))
      // removes every loose mob (see the crowd guard) within 32 blocks of any spawn spot, right now
      .then(Commands.literal('cleanup').executes(ctx => {
        var s = ctx.source.server, n = 0, per = {}
        load(s)
        var tracked = trackedIds()
        s.getAllLevels().forEach(level => {
          var dim = dimOf(level), spots = Object.keys(spawns).filter(k => spawns[k].dim == dim)
          if (!spots.length) return
          var nss = nsFor(dim)
          level.getAllEntities().forEach(x => {
            try {
              var c = classify(s, level, x, tracked, nss)
              if (!c || (c.kind != 'loose' && c.kind != 'summon')) return
              var near = spots.some(k => { var sp = spawns[k], dx = x.getX() - sp.x, dy = x.getY() - sp.y, dz = x.getZ() - sp.z; return dx * dx + dy * dy + dz * dz <= 32 * 32 })
              if (!near) return
              x.discard(); n++; per[c.type] = (per[c.type] || 0) + 1
            } catch (y) { }
          })
        })
        say(ctx.source, P + '§aRemoved §f' + n + '§a extra mob(s) near your spawn spots' + (n ? ': §7' + Object.keys(per).map(k => k + ' x' + per[k]).join(', ') : '.') +
          ' §7(tracked spawn mobs, pets and named mobs are kept)')
        return 1
      }))
      // what's around you: every mob within the radius by type, and whether this script tracks it
      .then(Commands.literal('scan').executes(ctx => scan(ctx, 32))
        .then(Commands.argument('radius', Arguments.INTEGER.create(event)).executes(ctx => scan(ctx, Math.max(4, Math.min(128, Arguments.INTEGER.getResult(ctx, 'radius')))))))
      .then(Commands.literal('respawnall').executes(ctx => {
        var s = ctx.source.server, n = 0
        Object.keys(load(s)).forEach(k => { if (spawns[k].down && !spawns[k].dormant) { spawns[k].down = Date.now(); n++ } })
        Object.keys(groups).forEach(gid => { if (groups[gid].down) { groups[gid].down = Date.now(); n++ } })
        save(s)
        say(ctx.source, P + '§a' + n + ' spawn(s) will respawn within a second (once their area is loaded).')
        return 1
      }))
      .then(Commands.literal('holo').executes(ctx => {
        var s = ctx.source.server
        Object.keys(load(s)).forEach(k => { if (!spawns[k].dormant) placeHolo(s, k) })
        Object.keys(groups).forEach(gid => { delete groups[gid].holo })
        say(ctx.source, P + '§aFloating texts placed again.')
        return 1
      })))
  })
})()
