// OVERTHRONE - animated particle cosmetics: AURAS, TRAILS and KILL EFFECTS (2026-10-18).
// 100% server side: made of vanilla particles + sounds, so every player sees them with NO mod or resource pack.
//
// They plug into the existing cosmetics system (npc_menus.js):
//   - players equip them in /cosmetics (new row: Auras, Trails, Kill Effects) or /aura /trail /killeffect
//   - shop items are in the Throne Shop under PARTICLE EFFECTS (crate-only ones are not sold there)
//   - crates / Tebex / staff give them with:  otcosmetic give <player> aura|trail|killeffect <id>
//     e.g. in a crate reward:  { cmd: 'otcosmetic give {p} aura frost_spiral', ... }
//   - ids: /otcosmetic list aura   (or trail / killeffect)
// Ownership is the same as the other cosmetics (persistentData ot_owned "aura:<id>"), equipped in ot_aura / ot_trail / ot_killfx.
//
// Staff (op):  /cosfx preview <aura|trail|killeffect> <id>   try any effect on yourself for 10 seconds (no need to own it)

// shared with npc_menus.js (it builds the menu/shop entries from this list). Unique global name on purpose.
var OT_FX = {
  // rarity colours used in names: common &a, rare &9, epic &5, legendary &6, mythic &c (+ crate-only = not in the shop)
  aura: [
    { id: 'infernal_halo', name: '&6&lInfernal Halo', icon: 'minecraft:blaze_powder', price: 1500, desc: ['A spinning ring of fire above', 'your head, with embers rising.'] },
    { id: 'frost_spiral', name: '&b&lFrost Spiral', icon: 'minecraft:blue_ice', price: 1500, desc: ['Two icy spirals wind up', 'around your body.'] },
    { id: 'sakura_drift', name: '&d&lSakura Drift', icon: 'minecraft:cherry_sapling', price: 1200, desc: ['Cherry petals drift down', 'all around you.'] },
    { id: 'soul_flame', name: '&3&lSoul Flame', icon: 'minecraft:soul_lantern', price: 2000, desc: ['Blue soul fire coils up', 'around you like a serpent.'] },
    { id: 'storm_crown', name: '&e&lStorm Crown', icon: 'minecraft:lightning_rod', price: 2500, desc: ['A crackling crown of lightning', 'that sparks above your head.'] },
    { id: 'void_orbit', name: '&5&lVoid Orbit', icon: 'minecraft:ender_eye', price: 3000, desc: ['Three void orbs circle you,', 'pulling the air into them.'] },
    { id: 'rainbow_halo', name: '&c&lR&6&la&e&li&a&ln&b&lb&9&lo&d&lw &f&lHalo', icon: 'minecraft:prismarine_crystals', price: 3500, desc: ['A halo that slowly cycles', 'through every colour.'] },
    { id: 'angel_wings', name: '&f&lAngel Wings', icon: 'minecraft:feather', price: 6000, desc: ['Glowing white wings on your', 'back that gently flap.'] },
    { id: 'demon_lord', name: '&4&lDemon Lord', icon: 'minecraft:crimson_fungus', crate: true, desc: ['A dark red aura of power', 'rising off you. &8(crate exclusive)'] },
    { id: 'shadow_monarch', name: '&5&lShadow Monarch', icon: 'minecraft:wither_rose', crate: true, desc: ['Purple-black shadow smoke and', 'wings: ARISE. &8(crate exclusive)'] },
  ],
  trail: [
    { id: 'flame', name: '&6&lFlame Trail', icon: 'minecraft:campfire', price: 800, desc: ['Leave fire in your footsteps.'] },
    { id: 'hearts', name: '&c&lLove Trail', icon: 'minecraft:poppy', price: 800, desc: ['Hearts pop up where you walk.'] },
    { id: 'notes', name: '&a&lMusic Trail', icon: 'minecraft:jukebox', price: 800, desc: ['Colourful music notes follow you.'] },
    { id: 'petals', name: '&d&lPetal Trail', icon: 'minecraft:pink_petals', price: 1000, desc: ['Cherry petals scatter behind you.'] },
    { id: 'souls', name: '&3&lSoul Trail', icon: 'minecraft:soul_torch', price: 1200, desc: ['Ghostly souls drift up behind you.'] },
    { id: 'ender', name: '&5&lEnder Trail', icon: 'minecraft:ender_pearl', price: 1200, desc: ['Swirling ender particles.'] },
    { id: 'electric', name: '&e&lElectric Trail', icon: 'minecraft:copper_block', price: 1500, desc: ['Sparks crackle off your feet.'] },
    { id: 'rainbow', name: '&c&lR&6&la&e&li&a&ln&b&lb&9&lo&d&lw &f&lTrail', icon: 'minecraft:white_wool', price: 2000, desc: ['A colour-shifting rainbow path.'] },
    { id: 'shadow', name: '&8&lShadow Trail', icon: 'minecraft:black_dye', crate: true, desc: ['Dark smoke rises from every', 'step. &8(crate exclusive)'] },
  ],
  killfx: [
    { id: 'blood', name: '&4&lBlood Burst', icon: 'minecraft:redstone', price: 1000, desc: ['A burst of red when you', 'take something down.'] },
    { id: 'firework', name: '&e&lFirework', icon: 'minecraft:firework_rocket', price: 1200, desc: ['A firework blast + bang.'] },
    { id: 'hearts', name: '&d&lHeartbreaker', icon: 'minecraft:pink_dye', price: 1200, desc: ['An explosion of hearts.'] },
    { id: 'soul_release', name: '&3&lSoul Release', icon: 'minecraft:soul_lantern', price: 1500, desc: ['Their soul rises up in a', 'pillar of blue flame.'] },
    { id: 'thunder', name: '&e&lThunderstrike', icon: 'minecraft:lightning_rod', price: 2000, desc: ['A lightning pillar and a', 'thunder crack (no damage).'] },
    { id: 'arise', name: '&5&lARISE', icon: 'minecraft:wither_skeleton_skull', crate: true, desc: ['Shadow extraction: a purple', 'spiral rises and "ARISE"', 'shows to you. &8(crate exclusive)'] },
  ],
}

;(function () {
  const KEYS = { aura: 'ot_aura', trail: 'ot_trail', killfx: 'ot_killfx' }
  const byId = (kind, id) => { var l = OT_FX[kind]; for (var i = 0; i < l.length; i++) if (l[i].id == id) return l[i]; return null }
  const owned = (p) => String(p.persistentData.getString('ot_owned') || '').split(',')
  const equipped = (p, kind) => {
    var id = String(p.persistentData.getString(KEYS[kind]) || '')
    if (!id) return null
    if (preview[p.username] && preview[p.username].kind == kind) return preview[p.username].id
    return owned(p).indexOf(kind + ':' + id) >= 0 ? id : null
  }
  const preview = {}   // username -> { kind, id, until }

  // ---------------------------------------------------------------- particle output
  // Java API (fast, one packet) with a /particle command fallback
  var PT = null, Dust = null, V3 = null
  try { PT = Java.loadClass('net.minecraft.core.particles.ParticleTypes') } catch (x) { }
  try { Dust = Java.loadClass('net.minecraft.core.particles.DustParticleOptions'); V3 = Java.loadClass('org.joml.Vector3f') } catch (x) { }
  var useApi = PT != null
  const dustCache = {}
  const dustOpt = (r, g, b, size) => {
    var k = r + ',' + g + ',' + b + ',' + size
    if (!dustCache[k]) dustCache[k] = new Dust(new V3(r, g, b), size)
    return dustCache[k]
  }
  const f3 = (n) => Number(n).toFixed(3)
  // spec: 'flame' (a ParticleTypes name in lower case) or [r, g, b, size] for coloured dust
  const emit = (level, spec, x, y, z, n, dx, dy, dz, sp) => {
    if (useApi) {
      try {
        var opt = typeof spec === 'string' ? PT[spec.toUpperCase()] : dustOpt(spec[0], spec[1], spec[2], spec[3] || 1)
        level.sendParticles(opt, x, y, z, n || 1, dx || 0, dy || 0, dz || 0, sp || 0)
        return
      } catch (e) { useApi = false; console.warn('[cosmetics_fx] particle API failed, using commands: ' + e) }
    }
    var name = typeof spec === 'string' ? 'minecraft:' + spec : `minecraft:dust{color:[${f3(spec[0])},${f3(spec[1])},${f3(spec[2])}],scale:${spec[3] || 1}}`
    level.server.runCommandSilent(`execute in ${level.dimension} run particle ${name} ${f3(x)} ${f3(y)} ${f3(z)} ${f3(dx || 0)} ${f3(dy || 0)} ${f3(dz || 0)} ${f3(sp || 0)} ${n || 1} normal`)
  }
  const hsv = (h) => {   // hue 0..1 -> [r,g,b]
    var i = Math.floor(h * 6), f = h * 6 - i, q = 1 - f
    return [[1, f, 0], [q, 1, 0], [0, 1, f], [0, q, 1], [f, 0, 1], [1, 0, q]][((i % 6) + 6) % 6]
  }
  const sound = (level, name, x, y, z, vol, pitch) => level.server.runCommandSilent(`execute in ${level.dimension} positioned ${f3(x)} ${f3(y)} ${f3(z)} run playsound ${name} player @a[distance=..24] ~ ~ ~ ${vol || 1} ${pitch || 1}`)

  // ---------------------------------------------------------------- auras (t = ticks, a = player yaw in radians)
  const AURA = {
    infernal_halo: (L, x, y, z, t) => {
      for (var i = 0; i < 6; i++) { var an = t * 0.15 + i * Math.PI / 3; emit(L, 'flame', x + Math.cos(an) * 0.45, y + 2.25, z + Math.sin(an) * 0.45, 1) }
      if (t % 6 == 0) emit(L, 'lava', x, y + 1, z, 1, 0.3, 0.4, 0.3)
      if (t % 4 == 0) emit(L, 'small_flame', x, y + 0.2, z, 2, 0.35, 0.1, 0.35, 0.02)
    },
    frost_spiral: (L, x, y, z, t) => {
      var h = (t % 40) / 40 * 2.2
      for (var k = 0; k < 2; k++) { var an = t * 0.25 + k * Math.PI; emit(L, [0.55, 0.85, 1, 0.9], x + Math.cos(an) * 0.7, y + h, z + Math.sin(an) * 0.7, 1) }
      if (t % 3 == 0) emit(L, 'snowflake', x, y + 1.2, z, 1, 0.5, 0.7, 0.5, 0.01)
    },
    sakura_drift: (L, x, y, z, t) => { if (t % 2 == 0) emit(L, 'cherry_leaves', x, y + 2.6, z, 2, 0.9, 0.2, 0.9, 0) },
    soul_flame: (L, x, y, z, t) => {
      for (var k = 0; k < 2; k++) { var hh = ((t + k * 20) % 40) / 40 * 2.1, an = (t + k * 20) * 0.3; emit(L, 'soul_fire_flame', x + Math.cos(an) * 0.6, y + hh, z + Math.sin(an) * 0.6, 1) }
      if (t % 8 == 0) emit(L, 'soul', x, y + 0.3, z, 1, 0.3, 0.1, 0.3, 0.02)
    },
    storm_crown: (L, x, y, z, t) => {
      for (var i = 0; i < 8; i++) { var an = i * Math.PI / 4 + t * 0.05; emit(L, 'electric_spark', x + Math.cos(an) * 0.35, y + 2.2 + (i % 2) * 0.15, z + Math.sin(an) * 0.35, 1) }
      if (t % 10 == 0) emit(L, 'end_rod', x, y + 2.4, z, 2, 0.2, 0.1, 0.2, 0.02)
    },
    void_orbit: (L, x, y, z, t) => {
      for (var i = 0; i < 3; i++) {
        var an = t * 0.18 + i * 2.094, ox = x + Math.cos(an) * 0.9, oz = z + Math.sin(an) * 0.9, oy = y + 1.1 + Math.sin(t * 0.1 + i) * 0.3
        emit(L, [0.45, 0.1, 0.75, 1.3], ox, oy, oz, 1)
        emit(L, 'reverse_portal', ox, oy, oz, 1, 0.05, 0.05, 0.05, 0.01)
      }
    },
    rainbow_halo: (L, x, y, z, t) => {
      for (var i = 0; i < 10; i++) { var an = i * Math.PI / 5 + t * 0.06, c = hsv((t * 0.01 + i / 10) % 1); emit(L, [c[0], c[1], c[2], 0.8], x + Math.cos(an) * 0.42, y + 2.3, z + Math.sin(an) * 0.42, 1) }
    },
    angel_wings: (L, x, y, z, t, a) => wings(L, x, y, z, t, a, [1, 1, 1, 0.8], [0.85, 0.95, 1, 0.7]),
    demon_lord: (L, x, y, z, t) => {
      emit(L, [0.6, 0, 0, 1.4], x, y + 0.2 + (t % 20) / 10, z, 3, 0.4, 0.1, 0.4)
      if (t % 3 == 0) emit(L, 'large_smoke', x, y + 0.4, z, 1, 0.35, 0.2, 0.35, 0.01)
      if (t % 10 == 0) { for (var i = 0; i < 12; i++) { var an = i * Math.PI / 6; emit(L, [0.8, 0.05, 0.05, 1], x + Math.cos(an) * 1.1, y + 0.1, z + Math.sin(an) * 1.1, 1) } }
    },
    shadow_monarch: (L, x, y, z, t, a) => {
      if (t % 2 == 0) emit(L, [0.25, 0, 0.4, 1.5], x, y + 0.3, z, 2, 0.35, 0.3, 0.35)
      if (t % 4 == 0) emit(L, 'squid_ink', x, y + 0.1, z, 1, 0.4, 0, 0.4, 0.01)
      wings(L, x, y, z, t, a, [0.3, 0, 0.5, 0.9], [0.08, 0, 0.12, 0.8])
    },
  }
  // wings: dust points in a feather shape behind the player, flapping slowly
  const WING = [[0.3, 0.2], [0.5, 0.45], [0.7, 0.7], [0.9, 0.95], [1.05, 1.15], [0.45, 0.05], [0.7, 0.25], [0.95, 0.5], [1.15, 0.75], [0.6, -0.15], [0.85, 0.05], [1.05, 0.3]]
  const wings = (L, x, y, z, t, a, outer, inner) => {
    if (t % 4) return   // 5 frames a second is smooth for dust (it lingers) and keeps it light
    var fx = -Math.sin(a), fz = Math.cos(a)          // the way the player faces
    var rx = Math.cos(a), rz = Math.sin(a)           // sideways
    var bx = x - fx * 0.35, bz = z - fz * 0.35       // just behind the back
    var flap = 0.25 + (Math.sin(t * 0.12) + 1) * 0.2 // how far the wings sweep back (animated)
    for (var s = -1; s <= 1; s += 2) {
      WING.forEach((pt, i) => {
        var out = pt[0], back = out * flap
        emit(L, i < 5 ? outer : inner, bx + rx * out * s - fx * back, y + 1.25 + pt[1] * 0.6, bz + rz * out * s - fz * back, 1)
      })
    }
  }

  // ---------------------------------------------------------------- trails (only while moving)
  const TRAIL = {
    flame: (L, x, y, z) => emit(L, 'flame', x, y + 0.1, z, 2, 0.15, 0.02, 0.15, 0.01),
    hearts: (L, x, y, z, t) => { if (t % 4 == 0) emit(L, 'heart', x, y + 0.4, z, 1, 0.2, 0.1, 0.2) },
    notes: (L, x, y, z, t) => { if (t % 3 == 0) emit(L, 'note', x, y + 0.5, z, 1, 0.25, 0.1, 0.25, 1) },
    petals: (L, x, y, z) => emit(L, 'cherry_leaves', x, y + 0.3, z, 2, 0.3, 0.1, 0.3),
    souls: (L, x, y, z, t) => { if (t % 2 == 0) emit(L, 'soul', x, y + 0.1, z, 1, 0.15, 0.02, 0.15, 0.02) },
    ender: (L, x, y, z) => emit(L, 'portal', x, y + 0.3, z, 4, 0.2, 0.1, 0.2, 0.3),
    electric: (L, x, y, z) => emit(L, 'electric_spark', x, y + 0.1, z, 2, 0.2, 0.05, 0.2, 0.05),
    rainbow: (L, x, y, z, t) => { var c = hsv((t * 0.02) % 1); emit(L, [c[0], c[1], c[2], 1.2], x, y + 0.15, z, 3, 0.15, 0.02, 0.15) },
    shadow: (L, x, y, z) => { emit(L, 'large_smoke', x, y + 0.1, z, 1, 0.15, 0.02, 0.15, 0.01); emit(L, [0.2, 0, 0.3, 1.2], x, y + 0.2, z, 2, 0.2, 0.1, 0.2) },
  }

  // ---------------------------------------------------------------- kill effects (at the victim)
  const KILL = {
    blood: (L, x, y, z) => { emit(L, [0.7, 0, 0, 1.6], x, y + 1, z, 40, 0.4, 0.5, 0.4); emit(L, 'damage_indicator', x, y + 1, z, 8, 0.3, 0.3, 0.3, 0.2); sound(L, 'minecraft:entity.player.attack.crit', x, y, z, 1, 0.7) },
    firework: (L, x, y, z) => { emit(L, 'firework', x, y + 1, z, 60, 0.1, 0.1, 0.1, 0.25); emit(L, 'flash', x, y + 1.2, z, 1); sound(L, 'minecraft:entity.firework_rocket.blast', x, y, z, 1.2, 1) },
    hearts: (L, x, y, z) => { emit(L, 'heart', x, y + 1, z, 20, 0.6, 0.6, 0.6, 0.1); sound(L, 'minecraft:entity.experience_orb.pickup', x, y, z, 1, 1.4) },
    soul_release: (L, x, y, z) => {
      for (var h = 0; h < 30; h++) emit(L, 'soul_fire_flame', x + Math.cos(h * 0.6) * 0.4, y + h * 0.1, z + Math.sin(h * 0.6) * 0.4, 1, 0, 0.02, 0)
      emit(L, 'soul', x, y + 1, z, 12, 0.3, 0.5, 0.3, 0.05); sound(L, 'minecraft:particle.soul_escape', x, y, z, 2, 1)
    },
    thunder: (L, x, y, z) => {
      for (var h = 0; h < 40; h++) emit(L, 'electric_spark', x + (Math.random() - 0.5) * 0.3, y + h * 0.2, z + (Math.random() - 0.5) * 0.3, 2, 0.05, 0.05, 0.05)
      emit(L, 'flash', x, y + 1, z, 1); emit(L, 'end_rod', x, y + 1, z, 20, 0.4, 0.8, 0.4, 0.1); sound(L, 'minecraft:entity.lightning_bolt.thunder', x, y, z, 0.8, 1.2)
    },
    arise: (L, x, y, z, p) => {
      for (var h = 0; h < 45; h++) { var an = h * 0.5; emit(L, [0.35, 0, 0.6, 1.4], x + Math.cos(an) * (1 - h / 60), y + h * 0.06, z + Math.sin(an) * (1 - h / 60), 1) }
      emit(L, 'reverse_portal', x, y + 1, z, 40, 0.4, 0.8, 0.4, 0.05); emit(L, 'squid_ink', x, y + 0.2, z, 15, 0.5, 0.1, 0.5, 0.02)
      sound(L, 'minecraft:entity.wither.spawn', x, y, z, 0.4, 1.6)
      try { L.server.runCommandSilent(`title ${p.username} actionbar ${JSON.stringify({ text: 'ARISE.', color: 'dark_purple', bold: true })}`) } catch (e) { }
    },
  }

  // ---------------------------------------------------------------- render loop (every 2 ticks)
  const last = {}
  const visible = (p) => { try { return !p.isSpectator() && !p.isInvisible() && p.isAlive() } catch (e) { return false } }
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 2 != 0) return
    var t = s.tickCount, now = Date.now()
    s.players.forEach(p => {
      try {
        var name = p.username
        if (preview[name] && now > preview[name].until) delete preview[name]
        if (!visible(p)) return
        var L = p.level, x = Number(p.getX()), y = Number(p.getY()), z = Number(p.getZ())
        var au = preview[name] && preview[name].kind == 'aura' ? preview[name].id : equipped(p, 'aura')
        if (au && AURA[au]) AURA[au](L, x, y, z, t, Number(p.getYRot()) * Math.PI / 180)
        var tr = preview[name] && preview[name].kind == 'trail' ? preview[name].id : equipped(p, 'trail')
        if (tr && TRAIL[tr]) {
          var lp = last[name], moved = lp && ((lp[0] - x) * (lp[0] - x) + (lp[1] - z) * (lp[1] - z)) > 0.004
          if (moved) TRAIL[tr](L, x, y, z, t)
        }
        last[name] = [x, z]
      } catch (e) { }
    })
  })
  PlayerEvents.loggedOut(event => { delete last[event.player.username]; delete preview[event.player.username] })

  // kill effect: when a player kills anything (mob or player)
  EntityEvents.death(event => {
    try {
      var p = null
      try { p = event.source.getPlayer() } catch (x) { }
      if (p == null) return
      var id = preview[p.username] && preview[p.username].kind == 'killfx' ? preview[p.username].id : equipped(p, 'killfx')
      if (!id || !KILL[id]) return
      var e = event.entity
      KILL[id](e.level, Number(e.getX()), Number(e.getY()), Number(e.getZ()), p)
    } catch (x) { }
  })

  // ---------------------------------------------------------------- staff preview
  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    const StringArg = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
    const KIND_OF = { aura: 'aura', trail: 'trail', killeffect: 'killfx' }
    event.register(Commands.literal('cosfx').requires(src => src.hasPermission(2))
      .then(Commands.literal('preview').then(Commands.argument('kind', StringArg.word()).suggests((c, b) => { Object.keys(KIND_OF).forEach(k => b.suggest(k)); return b.buildFuture() })
        .then(Commands.argument('id', StringArg.word()).suggests((c, b) => { var k = KIND_OF[String(StringArg.getString(c, 'kind'))]; if (k) OT_FX[k].forEach(x => b.suggest(x.id)); return b.buildFuture() })
          .executes(ctx => {
            var p = ctx.source.playerOrException, k = KIND_OF[String(StringArg.getString(ctx, 'kind'))], id = String(StringArg.getString(ctx, 'id'))
            if (!k || !byId(k, id)) { p.tell('§cUnknown effect.'); return 0 }
            preview[p.username] = { kind: k, id: id, until: Date.now() + 10000 }
            p.tell('§d[cosfx] §7Previewing §f' + id + '§7 for 10 seconds' + (k == 'killfx' ? ' §8(kill something)' : k == 'trail' ? ' §8(walk around)' : ''))
            return 1
          })))))
  })
})()
