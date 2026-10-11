// OVERTHRONE - animated particle effects around crates (shulker boxes or any block), OG-network style.
// Drop into kubejs/server_scripts/ and run /reload (or restart). Vanilla particles only: no mod or resource pack needed.
//
// Staff (op):
//   /cratefx here <name> <style> <color>   stand ON TOP of the crate block and run this
//   /cratefx remove <name>                 /cratefx list
//   /cratefx burst <name>                  one-off jackpot explosion (crate mods/NPCs can run it as a command)
// Styles: helix, orbit, halo, vortex
// Colours: ember, bloodmoon, abyssal, dreadforge, regalia, throne, red, gold, purple, aqua, green, white
// Crates are saved on the server, so the effects come back after a restart.

const StringArg = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
const STORE_KEY = 'ot_cratefx'
const STYLES = ['helix', 'orbit', 'halo', 'vortex']
const COLORS = {
  ember: [0.95, 0.65, 0.25], bloodmoon: [0.84, 0.12, 0.24], abyssal: [0.48, 0.30, 1.0], dreadforge: [1.0, 0.42, 0.10],
  regalia: [0.90, 0.75, 0.41], throne: [1.0, 0.18, 0.30], red: [1.0, 0.1, 0.1], gold: [1.0, 0.8, 0.2],
  purple: [0.7, 0.2, 1.0], aqua: [0.2, 0.9, 1.0], green: [0.2, 1.0, 0.4], white: [1.0, 1.0, 1.0],
}
const EVERY = 3          // ticks between frames
const VIEW_RANGE = 48    // only animate when a player is this close

let crates = null
const load = (server) => {
  if (crates) return crates
  try { crates = JSON.parse(String(server.persistentData.getString(STORE_KEY)) || '{}') } catch (e) { crates = {} }
  return crates
}
const save = (server) => server.persistentData.putString(STORE_KEY, JSON.stringify(crates))

const dust = (c, scale) => `minecraft:dust{color:[${c[0]},${c[1]},${c[2]}],scale:${scale}}`
const f = (n) => n.toFixed(2)

// Points to draw this frame for one crate. (x, y, z) = centre of the crate block.
const frame = (cr, t) => {
  const out = []   // [particle, x, y, z]
  const x = cr.x + 0.5, y = cr.y, z = cr.z + 0.5
  const col = COLORS[cr.color] || COLORS.gold
  const a = t * 0.18
  if (cr.style === 'helix') {               // two strands spiralling up from the crate
    for (let s = 0; s < 2; s++) {
      for (let k = 0; k < 2; k++) {
        const h = ((t * 0.04 + k * 0.5) % 1)
        const ang = a + s * Math.PI + h * Math.PI * 4
        out.push([dust(col, 1.1), x + Math.cos(ang) * 0.75, y + 0.2 + h * 2.2, z + Math.sin(ang) * 0.75])
      }
    }
  } else if (cr.style === 'orbit') {        // three tilted rings orbiting the crate
    for (let r = 0; r < 3; r++) {
      const ang = a * (1 + r * 0.3) + r * 2.1
      const tilt = r * 1.05
      const px = Math.cos(ang) * 0.95, pz = Math.sin(ang) * 0.95
      out.push([dust(col, 1.0), x + px, y + 0.6 + pz * Math.sin(tilt) * 0.6, z + pz * Math.cos(tilt)])
    }
    if (t % 12 === 0) out.push(['minecraft:enchant', x, y + 1.4, z])
  } else if (cr.style === 'halo') {         // spinning crown ring above, sparks rising
    for (let k = 0; k < 4; k++) {
      const ang = a + k * Math.PI / 2
      out.push([dust(col, 1.2), x + Math.cos(ang) * 0.6, y + 1.9, z + Math.sin(ang) * 0.6])
    }
    if (t % 6 === 0) out.push(['minecraft:end_rod', x + (Math.random() - 0.5) * 0.8, y + 1.1, z + (Math.random() - 0.5) * 0.8])
  } else {                                  // vortex: particles spiralling down into the crate
    for (let k = 0; k < 3; k++) {
      const h = 1 - ((t * 0.03 + k / 3) % 1)
      const ang = -a * 1.5 + k * 2.09
      const rad = 0.2 + h * 1.0
      out.push([dust(col, 1.0), x + Math.cos(ang) * rad, y + 0.6 + h * 1.6, z + Math.sin(ang) * rad])
    }
    if (t % 10 === 0) out.push(['minecraft:portal', x, y + 1.0, z])
  }
  return out
}

const playerNear = (server, cr) => {
  const list = server.players
  for (let i = 0; i < list.size(); i++) {
    const p = list.get(i)
    if (String(p.level.dimension) !== cr.dim) continue
    const dx = p.x - cr.x, dy = p.y - cr.y, dz = p.z - cr.z
    if (dx * dx + dy * dy + dz * dz < VIEW_RANGE * VIEW_RANGE) return true
  }
  return false
}

ServerEvents.tick(event => {
  const server = event.server
  const t = server.tickCount
  if (t % EVERY !== 0) return
  const all = load(server)
  const names = Object.keys(all)
  for (let i = 0; i < names.length; i++) {
    const cr = all[names[i]]
    if (!playerNear(server, cr)) continue
    const pts = frame(cr, t / EVERY)
    for (let j = 0; j < pts.length; j++) {
      const p = pts[j]
      server.runCommandSilent(`execute in ${cr.dim} run particle ${p[0]} ${f(p[1])} ${f(p[2])} ${f(p[3])} 0 0 0 0 1 normal`)
    }
  }
})

const burst = (server, cr) => {
  const col = COLORS[cr.color] || COLORS.gold
  const x = cr.x + 0.5, y = cr.y + 1, z = cr.z + 0.5
  for (let k = 0; k < 24; k++) {
    const ang = k / 24 * Math.PI * 2
    server.runCommandSilent(`execute in ${cr.dim} run particle ${dust(col, 1.6)} ${f(x + Math.cos(ang) * 1.4)} ${f(y + 0.3)} ${f(z + Math.sin(ang) * 1.4)} 0 0 0 0 1 force`)
  }
  server.runCommandSilent(`execute in ${cr.dim} run particle minecraft:totem_of_undying ${f(x)} ${f(y)} ${f(z)} 0.4 0.6 0.4 0.5 60 force`)
  server.runCommandSilent(`execute in ${cr.dim} run playsound minecraft:entity.firework_rocket.twinkle master @a ${f(x)} ${f(y)} ${f(z)} 1 1`)
}

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event
  const reply = (ctx, msg) => ctx.source.sendSystemMessage(Text.of(msg))
  const word = (n) => Commands.argument(n, StringArg.word())
  const get = (ctx, n) => String(StringArg.getString(ctx, n)).toLowerCase()
  event.register(Commands.literal('cratefx').requires(src => src.hasPermission(2))
    .then(Commands.literal('here').then(word('name').then(word('style').then(word('color').executes(ctx => {
      const p = ctx.source.playerOrException
      const name = get(ctx, 'name'), style = get(ctx, 'style'), color = get(ctx, 'color')
      if (STYLES.indexOf(style) < 0) { reply(ctx, '§cStyle must be one of: ' + STYLES.join(', ')); return 0 }
      if (!COLORS[color]) { reply(ctx, '§cColour must be one of: ' + Object.keys(COLORS).join(', ')); return 0 }
      const all = load(p.server)
      // the crate is the block the player is standing on
      all[name] = { x: Math.floor(p.x), y: Math.floor(p.y - 0.2), z: Math.floor(p.z), dim: String(p.level.dimension), style: style, color: color }
      save(p.server)
      reply(ctx, `§a✦ Crate effect "${name}" (${style}, ${color}) added at ${all[name].x} ${all[name].y} ${all[name].z}. Step off to see it.`)
      return 1
    })))))
    .then(Commands.literal('remove').then(word('name').executes(ctx => {
      const all = load(ctx.source.server), name = get(ctx, 'name')
      if (!all[name]) { reply(ctx, `§cNo crate effect called "${name}". Use /cratefx list`); return 0 }
      delete all[name]; save(ctx.source.server)
      reply(ctx, `§eRemoved crate effect "${name}".`); return 1
    })))
    .then(Commands.literal('burst').then(word('name').executes(ctx => {
      const all = load(ctx.source.server), cr = all[get(ctx, 'name')]
      if (!cr) { reply(ctx, '§cNo crate effect with that name.'); return 0 }
      burst(ctx.source.server, cr); return 1
    })))
    .then(Commands.literal('list').executes(ctx => {
      const all = load(ctx.source.server), names = Object.keys(all)
      if (!names.length) { reply(ctx, '§7No crate effects yet. Stand on a crate and use /cratefx here <name> <style> <color>'); return 1 }
      names.forEach(n => { const c = all[n]; reply(ctx, `§6${n}§7: ${c.style}, ${c.color} at ${c.x} ${c.y} ${c.z} (${c.dim})`) })
      return 1
    }))
  )
})
