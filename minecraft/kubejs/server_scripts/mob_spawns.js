// OVERTHRONE - fixed mob & boss spawns (made for the Caverns, works in any world).
// Place a mob with its spawn egg, look at it and type /setmob or /setboss. From then on:
//   - it never despawns and is pulled back if it wanders too far from its spot (mobs: 5 blocks)
//   - bosses are frozen on their spot (can't walk/fly away, still attack)
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
//   anywhere:
//   /mobspawn list           every spawn in this world with its state
//   /mobspawn respawnall     respawn every killed mob now
//   /mobspawn holo           put back missing floating texts
//   /mobspawn clearall       remove EVERY spawn (mobs stay alive)
//   /mobspawn info           details of the nearest spawn (within 16 blocks) + puts its text back
//
// Boss rotations (several bosses taking turns on one spot):
//   set each boss with /mobspawn boss first (eggs placed close together), then stand among them:
//   /mobspawn rotation [minutes]  every boss spawn within 32 blocks takes turns (default 30 min between bosses).
//                                 One boss is out at a time; when it dies its name goes away and
//                                 "Random Boss arrives in 29:59" counts down (floating text + red bar), then the
//                                 next boss appears. Each boss comes once per cycle, random order.
//   /mobspawn rotation next       skip the wait: the next boss appears now
//   /mobspawn rotation off        back to normal separate boss spawns

(function () {
  const uidOf = (e) => { try { return String(e.getStringUuid()) } catch (x) { try { return String(e.getUuid()) } catch (y) { return String(e.uuid) } } }   // KubeJS renames getUUID
  const STORE = 'ot_spawns'
  const DEFAULT_MINUTES = 60
  const LEASH = 5             // blocks a mob may wander from its spot (any direction) before it's pulled back
  const FREEZE_BOSSES = true  // bosses can't walk or fly away: they stay on their spot and fight from there
  const BOSS_LEASH = 3        // a boss pushed further than this from its spot is put back
  const BAR_RANGE = 48        // players this close to a dead boss's spot see its respawn timer bar
  const SHOW_ALIVE_BAR = false // true = bosses also show a health bar while alive (off: many bosses would clog the screen)
  const ROTATION_MINUTES = 30 // default wait between bosses in a rotation
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
  const loaded = (level, x, z) => {
    try { if (level.getChunkSource().hasChunk(Math.floor(x) >> 4, Math.floor(z) >> 4)) return true } catch (e) { }
    var near = false
    try { level.players().forEach(p => { var dx = p.getX() - x, dz = p.getZ() - z; if (dx * dx + dz * dz < 96 * 96) near = true }) } catch (e) { }
    return near
  }
  // the spawn's live mob: by UUID, else by its spawn tag
  const findMob = (level, id) => {
    var sp = spawns[id], e = null
    try { if (sp.uuid) e = level.getEntity(UUID.fromString(sp.uuid)) } catch (x) { }
    if (e == null) {
      try { level.getAllEntities().forEach(x => { try { if (e == null && x.getTags().contains(tagOf(id))) e = x } catch (y) { } }) } catch (x) { }
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
    run(s, `execute in ${sp.dim} run kill @e[type=minecraft:text_display,tag=${tagOf(id)}]`)
    var left = sp.down ? Math.max(0, Math.ceil((sp.down - Date.now()) / 1000)) : null
    run(s, `execute in ${sp.dim} run summon minecraft:text_display ${sp.x} ${sp.y + sp.h} ${sp.z} ` +
      `{Tags:["ot_spawnholo","${tagOf(id)}"],billboard:"center",shadow:1b,background:0,line_width:300,` +
      `transformation:[0.9f,0f,0f,0f,0f,0.9f,0f,0f,0f,0f,0.9f,0f,0f,0f,0f,1f],text:'${holoText(sp, left)}'}`)
  }
  const setHolo = (s, id, secsLeft) => {
    var sp = spawns[id]; if (!sp) return
    run(s, `execute in ${sp.dim} run data merge entity @e[type=minecraft:text_display,tag=${tagOf(id)},limit=1] {text:'${holoText(sp, secsLeft)}'}`)
  }

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
  const hideBar = (s, id) => { var sp = spawns[id]; run(s, `bossbar remove ${barId(id)}`); if (sp) delete sp.bar }

  // ---- boss rotations: several boss spawns share one spot; only one boss is out at a time.
  // When it dies its name disappears, "Random boss arrives in 30:00" counts down, then the next boss appears.
  // Every boss comes once per cycle (random order, never the same one twice in a row).
  const gTag = (gid) => 'ot_grp_' + gid
  const gBar = (gid) => 'overthrone:grp_' + String(gid).toLowerCase().replace(/[^a-z0-9_]/g, '')
  const gText = (secsLeft) => JSON.stringify(['', { text: '☠ ', color: 'dark_red' }, { text: 'Random Boss', color: 'red', bold: true }, { text: ' ☠', color: 'dark_red' },
    { text: '\nArrives in ' + mmss(secsLeft), color: 'yellow' }]).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const gShow = (s, gid, secsLeft) => {
    var g = groups[gid]; if (!g) return
    if (!g.holo) {
      run(s, `execute in ${g.dim} run kill @e[type=minecraft:text_display,tag=${gTag(gid)}]`)
      run(s, `execute in ${g.dim} run summon minecraft:text_display ${g.x} ${g.y} ${g.z} ` +
        `{Tags:["ot_spawnholo","${gTag(gid)}"],billboard:"center",shadow:1b,background:0,line_width:300,` +
        `transformation:[0.9f,0f,0f,0f,0f,0.9f,0f,0f,0f,0f,0.9f,0f,0f,0f,0f,1f],text:'${gText(secsLeft)}'}`)
      g.holo = true
    } else run(s, `execute in ${g.dim} run data merge entity @e[type=minecraft:text_display,tag=${gTag(gid)},limit=1] {text:'${gText(secsLeft)}'}`)
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

  // ---- tracking a live mob
  const adopt = (s, id, e) => {
    var sp = spawns[id]
    e.addTag('ot_spawn'); e.addTag(tagOf(id))
    if (sp.kind == 'boss') { e.addTag('ot_boss'); if (FREEZE_BOSSES) freeze(s, e) }
    try { e.setPersistenceRequired() } catch (x) { }
    sp.uuid = uidOf(e); sp.down = 0
    delete missing[id]
  }
  const spawnNow = (s, id) => {
    var sp = spawns[id]; if (!sp) return false
    var level = levelOf(s, sp.dim)
    if (level == null || !loaded(level, sp.x, sp.z)) return false   // try again once someone is nearby
    var still = findMob(level, id)
    if (still != null && still.isAlive()) { adopt(s, id, still); hideBar(s, id); setHolo(s, id, null); save(s); return true }
    // summon without NBT, so the mob gets its normal gear/stats like from a spawn egg
    run(s, `execute in ${sp.dim} run summon ${sp.type} ${sp.x} ${sp.y} ${sp.z}`)
    var found = null
    level.getAllEntities().forEach(e => {
      try {
        if (found != null || typeOf(e) != sp.type || e.getTags().contains('ot_spawn')) return
        var dx = e.getX() - sp.x, dy = e.getY() - sp.y, dz = e.getZ() - sp.z
        if (dx * dx + dy * dy + dz * dz < 4) found = e
      } catch (x) { }
    })
    if (found == null) return false
    adopt(s, id, found)
    setHolo(s, id, null)
    hideBar(s, id)
    if (sp.kind == 'boss') run(s, 'tellraw @a ' + JSON.stringify(['', { text: '☠ ', color: 'dark_red' }, { translate: sp.key, color: 'red', bold: true }, { text: sp.group ? ' has appeared in the Caverns!' : ' has returned to the Caverns!', color: 'gold' }]))
    save(s)
    return true
  }

  ServerEvents.loaded(event => {
    var s = event.server; load(s)
    Object.keys(spawns).forEach(id => { if (!spawns[id].dormant) placeHolo(s, id) })
    Object.keys(groups).forEach(gid => { var g = groups[gid]; delete g.holo; delete g.bar; if (g.down) gShow(s, gid, Math.max(0, Math.ceil((g.down - Date.now()) / 1000))) })
  })

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
        if (level == null || !loaded(level, sp.x, sp.z)) return
        var e = findMob(level, id)
        if (e == null || !e.isAlive()) {
          missing[id] = (missing[id] || 0) + 1
          if (missing[id] >= 15) { sp.down = now; sp.uuid = null; delete missing[id]; save(s) }   // vanished without dying: bring it back
          return
        }
        missing[id] = 0
        if (sp.kind == 'boss') {
          if (SHOW_ALIVE_BAR) { try { aliveBar(s, id, e) } catch (x) { logOnce('bar ' + id, 'boss bar: ' + x) } }
          if (FREEZE_BOSSES) { try { freeze(s, e) } catch (x) { logOnce('frz ' + id, 'freeze: ' + x) } }
        }
        var dx = e.getX() - sp.x, dz = e.getZ() - sp.z, dy = e.getY() - sp.y
        var leash = sp.kind == 'boss' ? (FREEZE_BOSSES ? BOSS_LEASH : 8) : LEASH
        if (dx * dx + dy * dy + dz * dz > leash * leash) { try { e.teleportTo(sp.x, sp.y, sp.z) } catch (y) { run(s, `execute in ${sp.dim} run tp ${uidOf(e)} ${sp.x} ${sp.y} ${sp.z}`) } }
      } catch (x) { logOnce('tick ' + id, 'tick ' + sp.type + ': ' + x) }
    })
  })

  // killed: start the timer
  EntityEvents.death(event => {
    try {
      var e = event.entity
      if (!e.getTags().contains('ot_spawn')) return
      var s = e.level.server; load(s)
      var u = uidOf(e), id = null
      Object.keys(spawns).forEach(k => { if (spawns[k].uuid == u || e.getTags().contains(tagOf(k))) id = k })
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
        say(ctx.source, '§8debug: world ' + (lv ? 'ok' : 'NOT FOUND') + ' · loaded ' + (lv ? loaded(lv, sp.x, sp.z) : '-') + ' · uuid ' + sp.uuid + ' · by uuid/tag: ' + (fm ? 'found' : 'none') + ' · bar ' + !!sp.bar)
        if (fm && sp.kind == 'boss') { try { aliveBar(p.server, id, fm); say(ctx.source, '§8debug: boss bar refreshed') } catch (x) { say(ctx.source, '§cboss bar error: ' + x) } }
        placeHolo(p.server, id)
        say(ctx.source, '§7Floating text re-placed. §8If you still can\'t see it, look ' + sp.h + ' blocks above the spot.')
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
