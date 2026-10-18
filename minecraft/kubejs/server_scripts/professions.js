// OVERTHRONE - professions and gathering nodes (RPG-style).
// Staff turn chosen blocks (ores, gems, crops, logs...) into NODES. Players gather a node by hitting it PROF_HITS_NEEDED times (works in claims). A node shows its profession, level and XP
// on floating text. Gathering it gives profession XP (and some normal level XP), drops NOTHING, and the node
// respawns in the same spot after RESPAWN_SECONDS. Normal blocks everywhere else work exactly like before.
// leveling.js and anticheat.js skip node blocks (they call otIsNode), so nodes give no ore XP and no X-ray flags.
//
// Players:  /professions                 your profession levels
// Staff (op):
//   look at a block, then:
//   /node create <profession> <level> <xp> [name]   make it a node (e.g. /node create farming 1 10 Wheat)
//   /node remove                                    turn it back into a normal block
//   /node info                                      show what node it is
//   /node list                                      all nodes within 64 blocks
//   /node respawnall                                respawn every gathered node now
//   /node holo                                      re-place all floating texts (if one went missing)
//   /node fixall                                    fix every node: block back + fresh floating text
//   /professions <player>                           someone else's levels
//   /profession set <player> <profession> <level>   set a level (fixes / testing)
//
// Notes:
//  - Gathering needs the player's profession level to be at least the node's level.
//  - Players must be able to break blocks there (survival mode, and not blocked by claims/protection).
//  - Crop nodes regrow from age 0 (they look replanted); other nodes turn to air until they respawn.
//  - Creative players can't gather; staff remove nodes with /node remove.

// ---------------------------------------------------------------- settings
const PROF_RESPAWN_SECONDS = 60
const PROF_HITS_NEEDED = 3           // hits on a node to gather it (hits more than 5 s apart start over)
const PROF_LEVEL_XP_SHARE = 0.5      // normal level XP given = node XP x this (0 = none)
const PROF_MAX_LEVEL = 100
const PROF_NEED = (lvl) => Math.floor(100 * Math.pow(lvl, 1.4))   // profession XP needed for the next level
const PROFESSIONS = {
  mining:   { name: 'Mining',   icon: '⛏', color: 'gray' },
  gemology: { name: 'Gemology', icon: '💎', color: 'light_purple' },
  farming:  { name: 'Farming',  icon: '🌾', color: 'green' },
  foraging: { name: 'Foraging', icon: '🌲', color: 'dark_green' },
  combat:   { name: 'Combat',   icon: '⚔', color: 'red' },   // levelled by killing mobs, not by nodes
}
// Combat XP for a kill: grows with the mob's max health (Tensura mobs have big health bars), capped per kill and per minute
const COMBAT_XP = (maxHp) => Math.max(2, Math.min(150, Math.round(Math.sqrt(maxHp) * 2)))
const COMBAT_XP_PER_MINUTE = 400
// Small automatic bonuses from profession levels (percent at level 100, grows evenly from level 1)
const PROF_PERKS = {
  combat: { attr: 'minecraft:generic.attack_damage', max: 0.10, label: 'melee damage' },
  mining: { attr: 'minecraft:player.block_break_speed', max: 0.20, label: 'mining speed' },
}

// Shared helper (also used by the Stats menu in npc_menus.js): sets one attribute bonus on a player, replacing any
// older value with the same id. amount 0 removes it. op: 'add' | 'mult' (x(1+amount) of the total, after other mods).
var otSetAttrBonus = (p, attrId, bonusId, amount, op) => {
  // Uses the vanilla /attribute command (reliable on every version). Modifiers added this way are saved with the player.
  try {
    var s = p.server, n = p.username
    s.runCommandSilent(`attribute ${n} ${attrId} modifier remove ${bonusId}`)
    if (amount != 0) s.runCommandSilent(`attribute ${n} ${attrId} modifier add ${bonusId} ${Number(amount).toFixed(5)} ${op == 'add' ? 'add_value' : 'add_multiplied_total'}`)
    // report whether this attribute exists at all (for /stats debug)
    try {
      var RL = Java.loadClass('net.minecraft.resources.ResourceLocation')
      return !!Java.loadClass('net.minecraft.core.registries.BuiltInRegistries').ATTRIBUTE.containsKey(RL.parse(attrId))
    } catch (e) { return true }
  } catch (e) { console.warn('[professions] attribute ' + attrId + ': ' + e); return false }
}

// Shared with leveling.js / anticheat.js: true when this block is a node (they skip it).
var otNodeCache = null
var otIsNode = (dim, x, y, z) => !!(otNodeCache && otNodeCache[dim + '|' + x + '|' + y + '|' + z])
var otIsNodeBlock = (block) => {
  try {
    if (!otNodeCache) return false
    var k = block.level.dimension
    if (typeof k === 'function') k = block.level.dimension()
    return otIsNode(String(k && k.location ? k.location() : k), block.x, block.y, block.z)
  } catch (e) { return false }
}

;(function () {
  const STORE = 'ot_nodes', DOWN = 'ot_nodes_down'
  const P = '§6§lNodes §8» §7'
  const BlockStateParser = Java.loadClass('net.minecraft.commands.arguments.blocks.BlockStateParser')
  const StringArg = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')

  const run = (s, c) => s.runCommandSilent(c)
  const dimOf = (level) => {
    var k = level.dimension
    if (typeof k === 'function') k = level.dimension()
    return String(k && k.location ? k.location() : k)
  }
  const keyOf = (dim, x, y, z) => dim + '|' + x + '|' + y + '|' + z
  const tagOf = (key) => {   // a short tag for the floating text of this node
    var h = 0
    for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
    return 'ot_node_' + (h >>> 0).toString(36)
  }

  // ---- storage (server-wide, survives restarts)
  var down = null   // key -> respawn time (ms)
  const load = (s) => {
    if (otNodeCache == null) { try { otNodeCache = JSON.parse(String(s.persistentData.getString(STORE)) || '{}') } catch (e) { otNodeCache = {} } }
    if (down == null) { try { down = JSON.parse(String(s.persistentData.getString(DOWN)) || '{}') } catch (e) { down = {} } }
  }
  const save = (s) => { s.persistentData.putString(STORE, JSON.stringify(otNodeCache)); s.persistentData.putString(DOWN, JSON.stringify(down)) }

  // ---- profession levels (per player)
  const profLvl = (p, id) => Math.max(1, p.persistentData.getInt('ot_prof_' + id + '_lvl') || 1)
  const profXp = (p, id) => p.persistentData.getInt('ot_prof_' + id + '_xp') || 0
  const setProf = (p, id, lvl, xp) => { p.persistentData.putInt('ot_prof_' + id + '_lvl', lvl); p.persistentData.putInt('ot_prof_' + id + '_xp', xp) }
  const addProfXp = (p, id, amount) => {
    var lvl = profLvl(p, id), xp = profXp(p, id) + amount, start = lvl
    while (lvl < PROF_MAX_LEVEL && xp >= PROF_NEED(lvl)) { xp -= PROF_NEED(lvl); lvl++ }
    if (lvl >= PROF_MAX_LEVEL) xp = 0
    setProf(p, id, lvl, xp)
    if (lvl > start) {
      var pr = PROFESSIONS[id], n = p.username
      run(p.server, `title ${n} times 5 40 15`)
      run(p.server, `title ${n} subtitle ${JSON.stringify({ text: pr.icon + ' ' + pr.name + ' level ' + lvl, color: pr.color })}`)
      run(p.server, `title ${n} title {"text":"PROFESSION UP!","color":"gold","bold":true}`)
      run(p.server, `execute at ${n} run playsound minecraft:entity.player.levelup player ${n} ~ ~ ~ 1 1.2`)
      p.tell('§6✦ ' + pr.icon + ' §e' + pr.name + '§6 is now level §e§l' + lvl + '§6!')
    }
    return { lvl: lvl, xp: xp }
  }

  // ---- floating text above a node
  const nodeName = (n) => n.name || n.state.replace(/\[.*$/, '').replace(/^.*:/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  // the gathering progress bar: green filled blocks, grey empty ones
  const hitBar = (hits, size) => {
    var per = Math.max(1, Math.floor(size / PROF_HITS_NEEDED)), done = hits * per, total = per * PROF_HITS_NEEDED
    var rep = (c, k) => { var r = ''; for (var i = 0; i < k; i++) r += c; return r }
    return [{ text: rep('█', done), color: 'green' }, { text: rep('█', total - done), color: 'dark_gray' }]
  }
  const holoText = (n, isDown, secsLeft, hits) => {
    var pr = PROFESSIONS[n.prof]
    var lines = [
      { text: nodeName(n) + ' Node', color: 'gold', bold: true },
      { text: '\n' + pr.icon + ' ' + pr.name + ' Lv ' + n.lvl, color: pr.color },
      isDown ? { text: '\nRespawns in ' + (secsLeft == null ? '...' : secsLeft + 's'), color: 'red' } : { text: '\n+' + n.xp + ' ' + pr.name + ' XP', color: 'yellow' },
    ]
    if (!isDown && PROF_HITS_NEEDED > 1) {
      if (hits > 0) lines = lines.concat([{ text: '\n' }], hitBar(hits, 12), [{ text: ' ' + hits + '/' + PROF_HITS_NEEDED, color: 'white', bold: true }])
      else lines.push({ text: '\n⚒ Hit ' + PROF_HITS_NEEDED + 'x to gather', color: 'aqua' })
    }
    // escaped for a single-quoted SNBT string: backslashes first (the line breaks are \n), then quotes
    return JSON.stringify([''].concat(lines)).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  }
  const holoY = (n) => /\[.*age=/.test(n.state) ? 1.1 : 1.5
  // FIX 2026-10-18: floating texts are kept right by syncHolos() once a second (exactly one per node, text updated on
  // that one). Commands like "kill" / "data merge ... limit=1" only reach LOADED areas, so they left frozen copies
  // ("Respawns in 36s" that never moved) behind.
  const holoHits = {}   // key -> hits shown on the text while someone is gathering it
  const holoState = {}  // key -> { u: uuid of the kept text, t: text last written }
  const placeHolo = (s, key, isDown) => {
    var n = otNodeCache[key]; if (!n) return
    var tag = tagOf(key)
    delete holoState[key]
    run(s, `execute in ${n.dim} run kill @e[type=minecraft:text_display,tag=${tag}]`)
    summonHolo(s, n, tag, holoText(n, isDown, isDown && down[key] ? Math.max(0, Math.ceil((down[key] - Date.now()) / 1000)) : null))
  }
  const summonHolo = (s, n, tag, text) => run(s, `execute in ${n.dim} run summon minecraft:text_display ${n.x + 0.5} ${n.y + holoY(n)} ${n.z + 0.5} ` +
    `{Tags:["ot_node","${tag}"],billboard:"center",shadow:1b,background:0,line_width:300,` +
    `transformation:[0.7f,0f,0f,0f,0f,0.7f,0f,0f,0f,0f,0.7f,0f,0f,0f,0f,1f],text:'${text}'}`)
  const wantText = (key) => {
    var n = otNodeCache[key]
    if (down[key]) return holoText(n, true, Math.max(0, Math.ceil((down[key] - Date.now()) / 1000)))
    return holoText(n, false, null, holoHits[key] || 0)
  }
  // writes the text now on the copy we keep (if we know it), otherwise the next sync does it
  const setHoloText = (s, key, isDown, secsLeft, hits) => {
    if (!otNodeCache[key]) return
    if (!isDown && hits) holoHits[key] = hits; else delete holoHits[key]
    var st = holoState[key], t = wantText(key)
    if (st && st.u && st.t != t) { run(s, `data merge entity ${st.u} {text:'${t}'}`); st.t = t }
  }

  // is this spot loaded? blocks: chunk loaded; texts: entities there loaded and ticking
  var BlockPos = null
  try { BlockPos = Java.loadClass('net.minecraft.core.BlockPos') } catch (x) { }
  const levelOf = (s, dim) => { var f = null; s.getAllLevels().forEach(l => { if (f == null && dimOf(l) == dim) f = l }); return f }
  const entsLoaded = (level, n) => {
    if (BlockPos != null) { try { return !!level.isPositionEntityTicking(new BlockPos(n.x, n.y, n.z)) } catch (e) { } }
    try { return !!level.getChunkSource().hasChunk(n.x >> 4, n.z >> 4) } catch (e) { }
    var near = false   // last resort: a player within 96 blocks always keeps it loaded
    try { level.players().forEach(p => { var dx = p.getX() - n.x, dz = p.getZ() - n.z; if (dx * dx + dz * dz < 96 * 96) near = true }) } catch (e) { }
    return near
  }
  const blockLoaded = (level, n) => {
    if (BlockPos != null) { try { return !!level.isLoaded(new BlockPos(n.x, n.y, n.z)) } catch (e) { } }
    return entsLoaded(level, n)
  }
  var tagKeys = null, tagCount = -1   // floating-text tag -> node key
  const tagMap = () => {
    var ks = Object.keys(otNodeCache)
    if (tagKeys == null || tagCount != ks.length) { tagKeys = {}; ks.forEach(k => { tagKeys[tagOf(k)] = k }); tagCount = ks.length }
    return tagKeys
  }
  const uidOf = (e) => { try { return String(e.getStringUuid()) } catch (x) { try { return String(e.getUuid()) } catch (y) { return String(e.uuid) } } }
  const syncHolos = (s) => {
    var byDim = {}
    Object.keys(otNodeCache).forEach(k => { var n = otNodeCache[k]; (byDim[n.dim] = byDim[n.dim] || []).push(k) })
    var tm = tagMap()
    s.getAllLevels().forEach(level => {
      var dim = dimOf(level), keys = byDim[dim] || [], found = {}, any = false
      try {
        level.getAllEntities().forEach(x => {
          try {
            var t = x.getTags(); if (!t.contains('ot_node')) return
            try { if (String(x.getEncodeId()) != 'minecraft:text_display') return } catch (y) { }
            var tag = null
            t.forEach(tt => { tt = String(tt); if (tt.indexOf('ot_node_') == 0) tag = tt })
            any = true
            ;(found[tag] = found[tag] || []).push(x)
          } catch (y) { }
        })
      } catch (x) { return }
      if (!any && !keys.length) return
      // texts of nodes that no longer exist (or in the wrong world)
      Object.keys(found).forEach(tag => {
        var k = tm[tag]
        if (k == null || otNodeCache[k].dim != dim) found[tag].forEach(x => { try { x.discard() } catch (y) { } })
      })
      keys.forEach(k => {
        var n = otNodeCache[k]
        if (!entsLoaded(level, n)) return   // area not loaded: fixed once it is
        var tag = tagOf(k), have = found[tag] || [], st = holoState[k], t = wantText(k)
        if (!have.length) { summonHolo(s, n, tag, t); holoState[k] = { u: null, t: t }; return }
        var keep = have[0]
        if (st && st.u) have.forEach(x => { if (uidOf(x) == st.u) keep = x })
        have.forEach(x => { if (x !== keep) { try { x.discard() } catch (y) { } } })
        var ku = uidOf(keep)
        if (!st || st.u != ku || st.t != t) { run(s, `data merge entity ${ku} {text:'${t}'}`); holoState[k] = { u: ku, t: t } }
      })
    })
  }

  // ---- gathered look and respawn
  const depletedState = (n) => /age=\d+/.test(n.state) ? n.state.replace(/age=\d+/, 'age=0') : 'minecraft:air'
  // FIX 2026-10-18: a node whose timer ran out while nobody was near it used to lose its timer without its block
  // coming back (setblock does nothing in an unloaded area), so it stayed empty with a frozen text. Now it waits
  // until its area is loaded and respawns then. force = staff commands (try anyway).
  const respawn = (s, key, force) => {
    var n = otNodeCache[key]
    if (!n) { delete down[key]; return true }
    var level = levelOf(s, n.dim)
    if (!force && (level == null || !blockLoaded(level, n))) return false
    delete down[key]
    // crops sit on farmland: put it back if it got trampled to dirt
    if (/age=/.test(n.state)) run(s, `execute in ${n.dim} if block ${n.x} ${n.y - 1} ${n.z} minecraft:dirt run setblock ${n.x} ${n.y - 1} ${n.z} minecraft:farmland[moisture=7]`)
    run(s, `execute in ${n.dim} run setblock ${n.x} ${n.y} ${n.z} ${n.state}`)
    setHoloText(s, key, false)
    return true
  }
  // a ready node (not counting down) that is empty (e.g. stuck by the old bug): put its block back once it's loaded
  const heal = (s) => {
    Object.keys(otNodeCache).forEach(k => {
      if (down[k]) return
      var n = otNodeCache[k], level = levelOf(s, n.dim)
      if (level == null || !blockLoaded(level, n)) return
      var dep = depletedState(n)
      if (dep == 'minecraft:air') run(s, `execute in ${n.dim} if block ${n.x} ${n.y} ${n.z} minecraft:air run setblock ${n.x} ${n.y} ${n.z} ${n.state}`)
      else run(s, `execute in ${n.dim} if block ${n.x} ${n.y} ${n.z} ${dep} run setblock ${n.x} ${n.y} ${n.z} ${n.state}`)
    })
  }

  ServerEvents.loaded(event => {
    var s = event.server
    load(s)
    // anything gathered before a restart comes back now (or as soon as its area loads: the tick below does that)
    Object.keys(down).forEach(k => { down[k] = Math.min(down[k], Date.now()) })
    save(s)
  })
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 20 != 0) return
    load(s)
    var now = Date.now(), changed = false
    // respawn the ready ones (their area must be loaded; the floating text counts itself down in syncHolos)
    Object.keys(down).forEach(k => { if (down[k] <= now && respawn(s, k)) changed = true })
    if (changed) save(s)
    if (s.tickCount % 100 == 0) { try { heal(s) } catch (x) { console.warn('[professions] heal: ' + x) } }
    try { syncHolos(s) } catch (x) { console.warn('[professions] floating text sync: ' + x) }
  })

  // ---- profession perks (re-applied on join, respawn and level up)
  const applyPerks = (p) => {
    Object.keys(PROF_PERKS).forEach(id => {
      var k = PROF_PERKS[id], lvl = profLvl(p, id)
      otSetAttrBonus(p, k.attr, 'overthrone:prof_' + id, k.max * (lvl - 1) / (PROF_MAX_LEVEL - 1), 'mult')
    })
  }
  PlayerEvents.loggedIn(event => { var p = event.player; p.server.scheduleInTicks(40, () => { try { applyPerks(p) } catch (e) { } }) })
  PlayerEvents.respawned(event => { var p = event.player; p.server.scheduleInTicks(5, () => { try { applyPerks(p) } catch (e) { } }) })

  // ---- Combat profession: killing mobs (not players), with a per-minute cap against mob farms
  const combatWin = {}
  EntityEvents.death(event => {
    try {
      var e = event.entity, src = event.source, p = null
      try { p = src.getPlayer() } catch (x) { p = null }
      if (p == null || e.isPlayer() || p.isCreative()) return
      var maxHp = Number(e.getMaxHealth()) || 0
      if (maxHp <= 0) return
      var now = Date.now(), w = combatWin[p.username]
      if (!w || now - w.start > 60000) { w = { start: now, n: 0 }; combatWin[p.username] = w }
      var xp = Math.min(COMBAT_XP(maxHp), COMBAT_XP_PER_MINUTE - w.n)
      if (xp <= 0) return
      w.n += xp
      var before = profLvl(p, 'combat'), r = addProfXp(p, 'combat', xp)
      if (r.lvl > before) applyPerks(p)
      p.server.scheduleInTicks(2, () => run(p.server, `title ${p.username} actionbar ${JSON.stringify({ text: '⚔ +' + xp + ' Combat XP (' + r.xp + '/' + PROF_NEED(r.lvl) + ', Lv ' + r.lvl + ')', color: 'red' })}`))
    } catch (x) { }
  })

  // ---- gathering
  // Players gather a node by HITTING it once (left-click). The block is never really broken, so it also works inside
  // protected areas like the hub claim. Breaking it normally (where allowed) gathers it the same way.
  // Returns true when the click/break was on a node (the caller then cancels the normal action).
  const lastHit = {}, hitProgress = {}, holoHitAt = {}
  const tryGather = (p, b, fromClick) => {
    var s = p.server
    load(s)
    var dim = dimOf(b.level), key = keyOf(dim, b.x, b.y, b.z), n = otNodeCache[key]
    if (!n) return false
    // holding left-click fires many clicks: count one per 0.25 s per player, quietly ignore the rest
    var now = Date.now(), quiet = fromClick && lastHit[p.username] && now - lastHit[p.username] < 250
    if (fromClick) lastHit[p.username] = now
    if (down[key]) {
      // a player block put in the empty spot can still be broken normally (it is replaced when the node respawns)
      if (String(b.id) != depletedState(n).replace(/\[.*$/, '')) return false
      if (!quiet && fromClick) p.tell(P + '§7This node respawns in §f' + Math.max(1, Math.ceil((down[key] - now) / 1000)) + 's§7.')
      return true
    }
    if (quiet) return true
    if (p.isCreative()) { p.tell(P + '§cThis is a node. §7Use §e/node remove§7 to delete it. §8(Survival to gather)'); return true }
    var pr = PROFESSIONS[n.prof]
    if (profLvl(p, n.prof) < n.lvl) {
      p.tell(P + '§cYou need ' + pr.icon + ' ' + pr.name + ' level §f' + n.lvl + '§c to gather this. §7(You are level ' + profLvl(p, n.prof) + ')')
      return true
    }
    // hitting: PROF_HITS_NEEDED hits gather it (breaking it, where allowed, gathers it straight away)
    if (fromClick && PROF_HITS_NEEDED > 1) {
      var h = hitProgress[p.username]
      if (!h || h.key != key || now - h.at > 5000) h = { key: key, n: 0 }
      h.n++; h.at = now
      hitProgress[p.username] = h
      if (h.n < PROF_HITS_NEEDED) {
        run(s, `title ${p.username} actionbar ${JSON.stringify([{ text: pr.icon + ' Gathering ' + nodeName(n) + '  ', color: 'yellow' }].concat(hitBar(h.n, 18),
          [{ text: '  ' + h.n + '/' + PROF_HITS_NEEDED + ' hits', color: 'white', bold: true }, { text: '  keep hitting!', color: 'gray' }]))}`)
        // the node's floating text shows the bar too; it goes back to normal if nobody keeps hitting
        setHoloText(s, key, false, null, h.n)
        holoHitAt[key] = now
        s.scheduleInTicks(110, () => { if (!down[key] && holoHitAt[key] == now) { delete holoHitAt[key]; setHoloText(s, key, false) } })
        run(s, `execute at ${p.username} run playsound minecraft:block.amethyst_block.hit player ${p.username} ~ ~ ~ 0.8 ${(0.8 + h.n * 0.2).toFixed(1)}`)
        run(s, `execute in ${n.dim} run particle minecraft:crit ${n.x + 0.5} ${n.y + 0.5} ${n.z + 0.5} 0.25 0.25 0.25 0.1 6`)
        return true
      }
      delete hitProgress[p.username]
    }
    down[key] = now + PROF_RESPAWN_SECONDS * 1000
    save(s)
    s.scheduleInTicks(1, () => {
      run(s, `execute in ${n.dim} run setblock ${n.x} ${n.y} ${n.z} ${depletedState(n)}`)
      setHoloText(s, key, true, PROF_RESPAWN_SECONDS)
    })
    var lvBefore = profLvl(p, n.prof), r = addProfXp(p, n.prof, n.xp)
    if (r.lvl > lvBefore) { try { applyPerks(p) } catch (e) { } }
    var lvXp = Math.floor(n.xp * PROF_LEVEL_XP_SHARE)
    if (lvXp > 0) {
      try { if (typeof addXp === 'function') addXp(p, lvXp); else run(s, `level xp give ${p.username} ${lvXp}`) } catch (e) { }
    }
    try { if (typeof otOnNodeGathered === 'function') otOnNodeGathered(p, n) } catch (e) { }   // caverns.js: cash + trackers
    run(s, `execute at ${p.username} run playsound minecraft:entity.experience_orb.pickup player ${p.username} ~ ~ ~ 0.6 1.4`)
    run(s, `execute in ${n.dim} run particle minecraft:happy_villager ${n.x + 0.5} ${n.y + 0.6} ${n.z + 0.5} 0.3 0.3 0.3 0 12`)
    s.scheduleInTicks(1, () => run(s, `title ${p.username} actionbar ${JSON.stringify({
      text: pr.icon + ' +' + n.xp + ' ' + pr.name + ' XP (' + r.xp + '/' + PROF_NEED(r.lvl) + ', Lv ' + r.lvl + ')' + (lvXp > 0 ? '  +' + lvXp + ' XP' : ''), color: 'yellow' })}`))
    return true
  }
  // NOTE: event.cancel() ends the handler straight away in KubeJS, so it always comes LAST
  BlockEvents.leftClicked(event => {
    var p = event.player
    if (p == null) return
    if (tryGather(p, event.block, true)) event.cancel()
  })
  BlockEvents.broken(event => {
    var p = event.player
    if (p == null) return
    if (tryGather(p, event.block, false)) event.cancel()   // no drops: the block is swapped to its gathered look next tick
  })

  // ---- commands
  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    const say = (src, m) => src.sendSystemMessage(Text.of(m))
    const op = (src) => src.hasPermission(2)
    const lookedAt = (ctx) => {
      var p = ctx.source.playerOrException, hit = null
      try { var rt = p.rayTrace(6, false); if (rt && rt.block) hit = rt.block } catch (e) { hit = null }
      if (!hit) { say(ctx.source, P + '§cLook at a block (within 6 blocks) first.'); return null }
      return { p: p, b: hit, dim: dimOf(p.level), key: keyOf(dimOf(p.level), hit.x, hit.y, hit.z) }
    }
    const profArg = () => Commands.argument('profession', StringArg.word()).suggests((c, b) => { Object.keys(PROFESSIONS).forEach(k => b.suggest(k)); return b.buildFuture() })
    const showProfs = (src, p) => {
      say(src, '§6§l' + p.username + "'s Professions")
      Object.keys(PROFESSIONS).forEach(id => {
        var pr = PROFESSIONS[id], lvl = profLvl(p, id), xp = profXp(p, id), need = PROF_NEED(lvl), pct = lvl >= PROF_MAX_LEVEL ? 100 : Math.floor(xp * 100 / need), bar = ''
        for (var i = 0; i < 10; i++) bar += (i < pct / 10 ? '§a' : '§8') + '■'
        say(src, '§f' + pr.icon + ' §e' + pr.name + ' §7Lv §f' + lvl + ' ' + bar + ' §7' + (lvl >= PROF_MAX_LEVEL ? 'MAX' : xp + '/' + need))
      })
      return 1
    }

    event.register(Commands.literal('professions')
      .executes(ctx => showProfs(ctx.source, ctx.source.playerOrException))
      .then(Commands.argument('player', Arguments.PLAYER.create(event)).requires(op).executes(ctx => showProfs(ctx.source, Arguments.PLAYER.getResult(ctx, 'player')))))

    event.register(Commands.literal('profession').requires(op)
      .then(Commands.literal('set').then(Commands.argument('player', Arguments.PLAYER.create(event)).then(profArg()
        .then(Commands.argument('level', Arguments.INTEGER.create(event)).executes(ctx => {
          var p = Arguments.PLAYER.getResult(ctx, 'player'), id = String(StringArg.getString(ctx, 'profession')).toLowerCase()
          if (!PROFESSIONS[id]) { say(ctx.source, P + '§cUnknown profession. Use: ' + Object.keys(PROFESSIONS).join(', ')); return 0 }
          var lvl = Math.max(1, Math.min(PROF_MAX_LEVEL, Arguments.INTEGER.getResult(ctx, 'level')))
          setProf(p, id, lvl, 0)
          applyPerks(p)
          say(ctx.source, P + '§aSet ' + p.username + "'s " + PROFESSIONS[id].name + ' to level ' + lvl + '.')
          return 1
        }))))))

    const create = (ctx, withName) => {
      var t = lookedAt(ctx); if (!t) return 0
      load(t.p.server)
      var id = String(StringArg.getString(ctx, 'profession')).toLowerCase()
      if (!PROFESSIONS[id]) { say(ctx.source, P + '§cUnknown profession. Use: ' + Object.keys(PROFESSIONS).join(', ')); return 0 }
      if (id == 'combat') { say(ctx.source, P + '§cCombat is levelled by killing mobs, not by nodes.'); return 0 }
      if (otNodeCache[t.key]) { say(ctx.source, P + '§cThat block is already a node. §7/node remove first.'); return 0 }
      var state = String(BlockStateParser.serialize(t.b.blockState))
      if (state == 'minecraft:air') { say(ctx.source, P + '§cThat is air.'); return 0 }
      otNodeCache[t.key] = {
        dim: t.dim, x: t.b.x, y: t.b.y, z: t.b.z, state: state, prof: id,
        lvl: Math.max(1, Arguments.INTEGER.getResult(ctx, 'level')), xp: Math.max(1, Arguments.INTEGER.getResult(ctx, 'xp')),
        name: withName ? String(StringArg.getString(ctx, 'name')) : null,
      }
      save(t.p.server)
      placeHolo(t.p.server, t.key, false)
      say(ctx.source, P + '§aNode created: §f' + nodeName(otNodeCache[t.key]) + ' §7(' + PROFESSIONS[id].name + ' Lv ' + otNodeCache[t.key].lvl + ', +' + otNodeCache[t.key].xp + ' XP) §8' + state)
      return 1
    }
    event.register(Commands.literal('node').requires(op)
      .then(Commands.literal('create').then(profArg()
        .then(Commands.argument('level', Arguments.INTEGER.create(event))
          .then(Commands.argument('xp', Arguments.INTEGER.create(event)).executes(ctx => create(ctx, false))
            .then(Commands.argument('name', StringArg.greedyString()).executes(ctx => create(ctx, true)))))))
      .then(Commands.literal('remove').executes(ctx => {
        var t = lookedAt(ctx); if (!t) return 0
        load(t.p.server)
        var n = otNodeCache[t.key]
        if (!n) { say(ctx.source, P + '§cThat block is not a node.'); return 0 }
        if (down[t.key]) respawn(t.p.server, t.key, true)   // put the real block back first
        run(t.p.server, `execute in ${n.dim} run kill @e[type=minecraft:text_display,tag=${tagOf(t.key)}]`)
        delete otNodeCache[t.key]; delete down[t.key]
        save(t.p.server)
        say(ctx.source, P + '§aNode removed. It is a normal block again.')
        return 1
      }))
      .then(Commands.literal('info').executes(ctx => {
        var t = lookedAt(ctx); if (!t) return 0
        load(t.p.server)
        var n = otNodeCache[t.key]
        if (!n) { say(ctx.source, P + '§7That block is not a node.'); return 1 }
        say(ctx.source, P + '§f' + nodeName(n) + ' §7- ' + PROFESSIONS[n.prof].name + ' Lv ' + n.lvl + ', +' + n.xp + ' XP, ' +
          (down[t.key] ? '§crespawns in ' + Math.max(0, Math.ceil((down[t.key] - Date.now()) / 1000)) + 's' : '§aready') + ' §8' + n.state)
        return 1
      }))
      .then(Commands.literal('list').executes(ctx => {
        var p = ctx.source.playerOrException, dim = dimOf(p.level), c = 0
        load(p.server)
        Object.keys(otNodeCache).forEach(k => {
          var n = otNodeCache[k]
          if (n.dim != dim || Math.abs(n.x - p.x) > 64 || Math.abs(n.z - p.z) > 64) return
          c++
          say(ctx.source, '§7- §f' + nodeName(n) + ' §7' + PROFESSIONS[n.prof].name + ' Lv ' + n.lvl + ' +' + n.xp + ' XP §8at ' + n.x + ' ' + n.y + ' ' + n.z + (down[k] ? ' §c(gathered)' : ''))
        })
        say(ctx.source, P + c + ' node(s) within 64 blocks, ' + Object.keys(otNodeCache).length + ' in total.')
        return 1
      }))
      .then(Commands.literal('respawnall').executes(ctx => {
        var s = ctx.source.server
        load(s)
        var ks = Object.keys(down)
        ks.forEach(k => respawn(s, k, true))
        save(s)
        say(ctx.source, P + '§aRespawned ' + ks.length + ' node(s).')
        return 1
      }))
      .then(Commands.literal('fixall').executes(ctx => {
        // every node: real block back (unless it's gathered and counting down) + a fresh floating text
        var s = ctx.source.server, c = 0
        load(s)
        run(s, 'kill @e[type=minecraft:text_display,tag=ot_node]')
        Object.keys(otNodeCache).forEach(k => {
          var n = otNodeCache[k]
          try {
            if (!down[k]) run(s, `execute in ${n.dim} unless block ${n.x} ${n.y} ${n.z} ${n.state} run setblock ${n.x} ${n.y} ${n.z} ${n.state}`)
            else run(s, `execute in ${n.dim} run setblock ${n.x} ${n.y} ${n.z} ${depletedState(n)}`)
            placeHolo(s, k, !!down[k])
            c++
          } catch (e) { }
        })
        Object.keys(hitProgress).forEach(u => delete hitProgress[u])
        say(ctx.source, P + '§aFixed ' + c + ' node(s): blocks and floating texts put back. §7Nodes in unloaded areas: run it again when you are near them.')
        return 1
      }))
      .then(Commands.literal('holo').executes(ctx => {
        var s = ctx.source.server
        load(s)
        run(s, 'kill @e[type=minecraft:text_display,tag=ot_node]')
        Object.keys(otNodeCache).forEach(k => placeHolo(s, k, !!down[k]))  // gathered ones get their countdown within a second
        say(ctx.source, P + '§aFloating texts re-placed (nodes in unloaded areas get theirs when you run this near them).')
        return 1
      })))
  })
})()
