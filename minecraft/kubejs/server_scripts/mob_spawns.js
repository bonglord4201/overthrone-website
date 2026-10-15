// OVERTHRONE - fixed mob & boss spawns (made for the Caverns, works in any world).
// Place a mob with its spawn egg, look at it and type /setmob or /setboss. From then on:
//   - it never despawns and is pulled back if it wanders too far from its spot (mobs: 24 blocks)
//   - bosses are frozen on their spot (can't walk/fly away, still attack) and show a red health bar to players nearby
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
//   /mobspawn info           details of the nearest spawn (within 16 blocks) + puts its text back

(function () {
  const uidOf = (e) => { try { return String(e.getStringUuid()) } catch (x) { try { return String(e.getUuid()) } catch (y) { return String(e.uuid) } } }   // KubeJS renames getUUID
  const STORE = 'ot_spawns'
  const DEFAULT_MINUTES = 60
  const LEASH = 24            // blocks a mob may wander from its spot before it's pulled back
  const FREEZE_BOSSES = true  // bosses can't walk or fly away: they stay on their spot and fight from there
  const BOSS_LEASH = 3        // a boss pushed further than this from its spot is put back
  const BAR_RANGE = 48        // players this close to a dead boss's spot see its respawn timer bar
  const UUID = Java.loadClass('java.util.UUID')
  var spawns = null
  const missing = {}

  const run = (s, cmd) => s.runCommandSilent(cmd)
  const load = (s) => { if (spawns == null) { try { spawns = JSON.parse(String(s.persistentData.getString(STORE) || '{}')) } catch (e) { spawns = {} } } return spawns }
  const save = (s) => s.persistentData.putString(STORE, JSON.stringify(spawns))
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
    if (sp.kind == 'boss') run(s, 'tellraw @a ' + JSON.stringify(['', { text: '☠ ', color: 'dark_red' }, { translate: sp.key, color: 'red', bold: true }, { text: ' has returned to the Caverns!', color: 'gold' }]))
    save(s)
    return true
  }

  ServerEvents.loaded(event => { var s = event.server; load(s); Object.keys(spawns).forEach(id => placeHolo(s, id)) })

  // countdowns every second; every 5 seconds: missing mobs (despawned / removed) and the leash
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 20 != 0) return
    load(s)
    var now = Date.now(), five = s.tickCount % 100 == 0
    Object.keys(spawns).forEach(id => {
      var sp = spawns[id]
      try {
        if (sp.down) {
          if (now >= sp.down) spawnNow(s, id)
          else { var left = Math.ceil((sp.down - now) / 1000); setHolo(s, id, left); showBar(s, id, left) }
          return
        }
        if (!sp.uuid || (sp.kind != 'boss' && !five)) return
        var level = levelOf(s, sp.dim)
        if (level == null || !loaded(level, sp.x, sp.z)) return
        var e = findMob(level, id)
        if (e == null || !e.isAlive()) {
          missing[id] = (missing[id] || 0) + 1
          if (missing[id] >= (sp.kind == 'boss' ? 15 : 3)) { sp.down = now; sp.uuid = null; delete missing[id]; save(s) }   // vanished without dying: bring it back
          return
        }
        missing[id] = 0
        if (sp.kind == 'boss') { aliveBar(s, id, e); if (FREEZE_BOSSES) freeze(s, e) }
        var dx = e.getX() - sp.x, dz = e.getZ() - sp.z, dy = e.getY() - sp.y
        var leash = sp.kind == 'boss' ? (FREEZE_BOSSES ? BOSS_LEASH : 8) : LEASH
        if (dx * dx + dy * dy + dz * dz > leash * leash) { try { e.teleportTo(sp.x, sp.y, sp.z) } catch (y) { run(s, `execute in ${sp.dim} run tp ${uidOf(e)} ${sp.x} ${sp.y} ${sp.z}`) } }
      } catch (x) { }
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
        var sp = spawns[k]; if (sp.dim != dim) return
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
      spawns[id] = { type: type, key: 'entity.' + type.replace(':', '.'),   // the game's own name key (what EntityType#getDescriptionId gives) kind: kind, mins: mins, dim: dimOf(e.level),
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
            ' §7(' + sp.mins + ' min) ' + (sp.down ? '§cdead, back in ' + mmss(Math.max(0, Math.ceil((sp.down - now) / 1000))) : '§aalive') + (sp.dim != dim ? ' §8(' + sp.dim + ')' : ''))
        })
        if (!n) say(ctx.source, '§7No spawns saved yet. §8(your world: ' + dim + ')')
        return 1
      }))
      .then(Commands.literal('respawnall').executes(ctx => {
        var s = ctx.source.server, n = 0
        Object.keys(load(s)).forEach(k => { if (spawns[k].down) { spawns[k].down = Date.now(); n++ } })
        save(s)
        say(ctx.source, P + '§a' + n + ' spawn(s) will respawn within a second (once their area is loaded).')
        return 1
      }))
      .then(Commands.literal('holo').executes(ctx => {
        var s = ctx.source.server
        Object.keys(load(s)).forEach(k => placeHolo(s, k))
        say(ctx.source, P + '§aFloating texts placed again.')
        return 1
      })))
  })
})()
