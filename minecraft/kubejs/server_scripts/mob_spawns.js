// OVERTHRONE - fixed mob & boss spawns (made for the Caverns, works in any world).
// Place a mob with its spawn egg, look at it and type /setmob or /setboss. From then on:
//   - it never despawns and is pulled back if it wanders too far from its spot
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
//   near a spawn:
//   /mobspawn remove         stop tracking the nearest spawn (within 10 blocks). Its mob is left alive.
//   /mobspawn time <minutes> change the nearest spawn's respawn time
//   anywhere:
//   /mobspawn list           every spawn in this world with its state
//   /mobspawn respawnall     respawn every killed mob now
//   /mobspawn holo           put back missing floating texts

(function () {
  const STORE = 'ot_spawns'
  const DEFAULT_MINUTES = 60
  const LEASH = 32            // blocks a mob may wander from its spot before it's pulled back
  const UUID = Java.loadClass('java.util.UUID')
  var spawns = null
  const missing = {}

  const run = (s, cmd) => s.runCommandSilent(cmd)
  const load = (s) => { if (spawns == null) { try { spawns = JSON.parse(String(s.persistentData.getString(STORE) || '{}')) } catch (e) { spawns = {} } } return spawns }
  const save = (s) => s.persistentData.putString(STORE, JSON.stringify(spawns))
  const dimOf = (level) => { var k = level.dimension; if (typeof k === 'function') k = level.dimension(); return String(k && k.location ? k.location() : k) }
  const levelOf = (s, dim) => { var f = null; s.getAllLevels().forEach(l => { if (f == null && dimOf(l) == dim) f = l }); return f }
  const loaded = (level, x, z) => { try { return level.getChunkSource().hasChunk(Math.floor(x) >> 4, Math.floor(z) >> 4) } catch (e) { return false } }
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

  // ---- tracking a live mob
  const adopt = (s, id, e) => {
    var sp = spawns[id]
    e.addTag('ot_spawn'); e.addTag(tagOf(id))
    if (sp.kind == 'boss') e.addTag('ot_boss')
    try { e.setPersistenceRequired() } catch (x) { }
    sp.uuid = String(String(e.getUUID())); sp.down = 0
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
          else setHolo(s, id, Math.ceil((sp.down - now) / 1000))
          return
        }
        if (!five || !sp.uuid) return
        var level = levelOf(s, sp.dim)
        if (level == null || !loaded(level, sp.x, sp.z)) return
        var e = level.getEntity(UUID.fromString(sp.uuid))
        if (e == null || !e.isAlive()) {
          missing[id] = (missing[id] || 0) + 1
          if (missing[id] >= 3) { sp.down = now; sp.uuid = null; delete missing[id]; save(s) }   // vanished without dying: bring it back
          return
        }
        missing[id] = 0
        var dx = e.getX() - sp.x, dz = e.getZ() - sp.z, dy = e.getY() - sp.y
        if (dx * dx + dy * dy + dz * dz > LEASH * LEASH) e.teleportTo(sp.x, sp.y, sp.z)
      } catch (x) { }
    })
  })

  // killed: start the timer
  EntityEvents.death(event => {
    try {
      var e = event.entity
      if (!e.getTags().contains('ot_spawn')) return
      var s = e.level.server; load(s)
      var u = String(String(e.getUUID())), id = null
      Object.keys(spawns).forEach(k => { if (spawns[k].uuid == u) id = k })
      if (id == null) return
      var sp = spawns[id]
      sp.down = Date.now() + sp.mins * 60000; sp.uuid = null
      save(s)
      setHolo(s, id, sp.mins * 60)
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
    const nearest = (p, max) => {
      var best = max * max, id = null, dim = dimOf(p.level)
      Object.keys(load(p.server)).forEach(k => {
        var sp = spawns[k]; if (sp.dim != dim) return
        var dx = sp.x - p.getX(), dy = sp.y - p.getY(), dz = sp.z - p.getZ(), d = dx * dx + dy * dy + dz * dz
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
      if (e.getTags().contains('ot_spawn')) { say(ctx.source, '§cThat mob already has a spawn. Use /mobspawn remove first.'); return 0 }
      var type = typeOf(e)
      if (!type) { say(ctx.source, '§cThat entity can\'t be respawned.'); return 0 }
      var id = String(Date.now().toString(36)) + Math.floor(Math.random() * 1000)
      spawns[id] = { type: type, key: 'entity.' + type.replace(':', '.'),   // the game's own name key (what EntityType#getDescriptionId gives) kind: kind, mins: mins, dim: dimOf(e.level),
        x: Number(Number(e.getX()).toFixed(2)), y: Number(Number(e.getY()).toFixed(2)), z: Number(Number(e.getZ()).toFixed(2)),
        h: Number((Number(e.getBbHeight()) + 0.6).toFixed(2)), uuid: null, down: 0 }
      adopt(s, id, e)
      save(s)
      placeHolo(s, id)
      say(ctx.source, P + '§a' + (kind == 'boss' ? 'Boss' : 'Mob') + ' spawn set: §f' + type + ' §7respawns §f' + mins + ' min§7 after it dies.')
      return 1
    }
    const minsArg = () => Commands.argument('minutes', Arguments.INTEGER.create(event))
    ;['mob', 'boss'].forEach(kind => {
      event.register(Commands.literal('set' + kind).requires(src => src.hasPermission(2))
        .executes(ctx => make(ctx, kind, DEFAULT_MINUTES))
        .then(minsArg().executes(ctx => make(ctx, kind, Math.max(1, Arguments.INTEGER.getResult(ctx, 'minutes'))))))
    })
    event.register(Commands.literal('mobspawn').requires(src => src.hasPermission(2))
      .then(Commands.literal('remove').executes(ctx => {
        var p = ctx.source.playerOrException, s = p.server, id = nearest(p, 10)
        if (id == null) { say(ctx.source, '§cNo spawn within 10 blocks.'); return 0 }
        var sp = spawns[id]
        run(s, `execute in ${sp.dim} run kill @e[type=minecraft:text_display,tag=${tagOf(id)}]`)
        if (sp.uuid) { try { var e = p.level.getEntity(UUID.fromString(sp.uuid)); if (e) { e.removeTag('ot_spawn'); e.removeTag(tagOf(id)); e.removeTag('ot_boss') } } catch (x) { } }
        delete spawns[id]; save(s)
        say(ctx.source, P + '§aRemoved the §f' + sp.type + '§a spawn. §7Its mob (if alive) is left where it is.')
        return 1
      }))
      .then(Commands.literal('time').then(minsArg().executes(ctx => {
        var p = ctx.source.playerOrException, id = nearest(p, 10), m = Math.max(1, Arguments.INTEGER.getResult(ctx, 'minutes'))
        if (id == null) { say(ctx.source, '§cNo spawn within 10 blocks.'); return 0 }
        spawns[id].mins = m; save(p.server)
        say(ctx.source, P + '§a' + spawns[id].type + ' now respawns §f' + m + ' min§a after it dies.')
        return 1
      })))
      .then(Commands.literal('list').executes(ctx => {
        var p = ctx.source.playerOrException, dim = dimOf(p.level), now = Date.now(), n = 0
        Object.keys(load(p.server)).forEach(k => {
          var sp = spawns[k]; if (sp.dim != dim) return
          n++
          say(ctx.source, '§7- ' + (sp.kind == 'boss' ? '§c☠ BOSS ' : '§6MOB ') + '§f' + sp.type + ' §8at ' + Math.floor(sp.x) + ' ' + Math.floor(sp.y) + ' ' + Math.floor(sp.z) +
            ' §7(' + sp.mins + ' min) ' + (sp.down ? '§cdead, back in ' + mmss(Math.max(0, Math.ceil((sp.down - now) / 1000))) : '§aalive'))
        })
        if (!n) say(ctx.source, '§7No spawns in this world yet.')
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
