// OVERTHRONE - OG-style crates: a block (e.g. a shulker box) you right-click to open with a key and left-click to preview.
// Drop into kubejs/server_scripts/ and run /reload (or restart).
//
// Setup (op):  place the crate block, stand ON TOP of it, then  /crate create <crate>     e.g. /crate create vote
//              /crate remove <crate>      /crate list      /crate hologram <crate>   (re-place the floating text)
// Keys (op / console / vote rewards / Tebex):
//              /crate key give <player> <crate> <amount>      /crate key take <player> <crate> <amount>
// Players:     /crate keys        how many keys you have
//
// Keys are virtual (saved on the player), like OG Network's "Keys available".
// Edit CRATES below to change names, colours and rewards. Each reward: item (+count) and/or cmd, a weight
// (the chance is weight / total weight), and optional rare: true to announce it to the whole server.

(function () {
  const CRATES = {
    vote: {
      name: 'VOTING CRATE', color: 'green', dust: [0.35, 0.95, 0.25], keyHint: 'Free keys daily: /vote',
      rewards: [
        { item: 'minecraft:golden_apple', count: 8, weight: 30 },
        { item: 'minecraft:experience_bottle', count: 32, weight: 25 },
        { item: 'minecraft:diamond', count: 4, weight: 15 },
        { cmd: 'eco give {p} 5000', icon: 'minecraft:emerald', name: '$5,000', weight: 15 },
        { cmd: 'level xp give {p} 1500', icon: 'minecraft:nether_star', name: '1,500 Level XP', weight: 10 },
        { item: 'minecraft:enchanted_golden_apple', count: 1, weight: 4, rare: true },
        { item: 'minecraft:netherite_ingot', count: 1, weight: 1, rare: true },
      ],
    },
  }

  const StringArg = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
  const STORE = 'ot_crates'
  const keyId = (id) => 'ot_crate_key_' + id
  let placed = null   // { crateId: {x,y,z,dim} }

  const load = (server) => {
    if (placed) return placed
    try { placed = JSON.parse(String(server.persistentData.getString(STORE)) || '{}') } catch (e) { placed = {} }
    return placed
  }
  const save = (server) => server.persistentData.putString(STORE, JSON.stringify(placed))
  const crateAt = (server, block) => {
    const all = load(server), dim = String(block.level.dimension)
    const ids = Object.keys(all)
    for (let i = 0; i < ids.length; i++) {
      const c = all[ids[i]]
      if (c.x === block.x && c.y === block.y && c.z === block.z && c.dim === dim && CRATES[ids[i]]) return ids[i]
    }
    return null
  }
  const keys = (p, id) => p.persistentData.getInt(keyId(id)) || 0
  const setKeys = (p, id, n) => p.persistentData.putInt(keyId(id), Math.max(0, n))
  const totalWeight = (c) => c.rewards.reduce((s, r) => s + r.weight, 0)
  const pct = (c, r) => (r.weight * 100 / totalWeight(c)).toFixed(2)
  const label = (r) => r.name || ((r.count || 1) + 'x ' + String(r.item).split(':')[1].split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '))
  const f = (n) => n.toFixed(2)
  const run = (server, cmd) => server.runCommandSilent(cmd)

  // ---------------------------------------------------------------- hologram above the crate
  const HOLO_COLORS = { green: 'green', red: 'red', gold: 'gold', purple: 'light_purple', aqua: 'aqua', blue: 'blue', white: 'white' }
  const placeHologram = (server, id) => {
    const c = CRATES[id], at = load(server)[id]
    if (!c || !at) return
    run(server, `kill @e[type=minecraft:text_display,tag=ot_crate_${id}]`)
    const col = HOLO_COLORS[c.color] || 'gold'
    const lines = [
      [2.25, `{"text":"${c.name}","color":"${col}","bold":true}`, 1.3],
      [1.95, '{"text":"Right-click to open","color":"gray"}', 0.8],
      [1.75, '{"text":"Left-click to preview","color":"gray"}', 0.8],
      [1.50, `{"text":"${c.keyHint}","color":"yellow"}`, 0.75],
    ]
    lines.forEach(l => {
      const s = l[2]
      run(server, `execute in ${at.dim} run summon minecraft:text_display ${at.x + 0.5} ${at.y + l[0]} ${at.z + 0.5} ` +
        `{Tags:["ot_crate_${id}"],billboard:"center",shadow:1b,background:0,line_width:400,` +
        `transformation:[${s}f,0f,0f,0f,0f,${s}f,0f,0f,0f,0f,${s}f,0f,0f,0f,0f,1f],text:'${l[1]}'}`)
    })
  }

  // ---------------------------------------------------------------- particles (OG-style drifting pixels + a slow ring)
  const dust = (c, s) => `minecraft:dust{color:[${c[0]},${c[1]},${c[2]}],scale:${s}}`
  ServerEvents.tick(event => {
    const server = event.server, t = server.tickCount
    if (t % 3 !== 0) return
    const all = load(server), ids = Object.keys(all)
    for (let i = 0; i < ids.length; i++) {
      const c = CRATES[ids[i]], at = all[ids[i]]
      if (!c) continue
      let near = false
      const ps = server.players
      for (let j = 0; j < ps.size(); j++) {
        const p = ps.get(j)
        if (String(p.level.dimension) !== at.dim) continue
        const dx = p.x - at.x - 0.5, dy = p.y - at.y, dz = p.z - at.z - 0.5
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 < 48 * 48) near = true
        if (d2 < 5 * 5 && t % 15 === 0)   // "Keys available" for this player, over the hotbar
          run(server, `title ${p.username} actionbar {"text":"${c.name} · Keys available: ${keys(p, ids[i])}","color":"yellow"}`)
      }
      if (!near) continue
      const x = at.x + 0.5, y = at.y + 0.5, z = at.z + 0.5, a = t * 0.06
      for (let k = 0; k < 2; k++) {   // two points circling the crate
        const ang = a + k * Math.PI
        run(server, `execute in ${at.dim} run particle ${dust(c.dust, 1.1)} ${f(x + Math.cos(ang) * 0.85)} ${f(y + 0.1 * Math.sin(a * 3))} ${f(z + Math.sin(ang) * 0.85)} 0 0 0 0 1 normal`)
      }
      // drifting pixels floating out of the crate, like OG Network
      run(server, `execute in ${at.dim} run particle ${dust(c.dust, 0.9)} ${f(x)} ${f(y + 0.3)} ${f(z)} 0.45 0.35 0.45 0 2 normal`)
      if (t % 9 === 0) run(server, `execute in ${at.dim} run particle minecraft:end_rod ${f(x)} ${f(y - 0.6)} ${f(z)} 0.05 0 0.05 0.02 1 normal`)
    }
  })

  // ---------------------------------------------------------------- open
  const roll = (c) => {
    let r = Math.random() * totalWeight(c)
    for (let i = 0; i < c.rewards.length; i++) { r -= c.rewards[i].weight; if (r <= 0) return c.rewards[i] }
    return c.rewards[c.rewards.length - 1]
  }
  const openCrate = (p, id) => {
    const c = CRATES[id], server = p.server, n = p.username, at = load(server)[id]
    if (keys(p, id) <= 0) {
      p.tell(`§c§lCrates §7» You need a §f${c.name.toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase())} Key§7 to open this crate. §e${c.keyHint}`)
      run(server, `execute at ${n} run playsound minecraft:block.note_block.bass player ${n} ~ ~ ~ 1 0.6`)
      return
    }
    setKeys(p, id, keys(p, id) - 1)
    const r = roll(c)
    if (r.item) run(server, `give ${n} ${r.item} ${r.count || 1}`)
    if (r.cmd) run(server, r.cmd.split('{p}').join(n))
    run(server, `title ${n} times 5 40 10`)
    run(server, `title ${n} subtitle {"text":"${label(r)}","color":"${r.rare ? 'gold' : 'white'}"}`)
    run(server, `title ${n} title {"text":"${c.name}","color":"${HOLO_COLORS[c.color] || 'gold'}","bold":true}`)
    run(server, `execute at ${n} run playsound minecraft:block.chest.open player ${n} ~ ~ ~ 1 1`)
    run(server, `execute at ${n} run playsound minecraft:entity.player.levelup player ${n} ~ ~ ~ 0.8 1.3`)
    run(server, `execute in ${at.dim} run particle minecraft:totem_of_undying ${at.x + 0.5} ${at.y + 1} ${at.z + 0.5} 0.3 0.5 0.3 0.4 ${r.rare ? 80 : 25} normal`)
    p.tell(`§a§lCrates §7» You won §f${label(r)} §7(${pct(c, r)}% chance). §8Keys left: ${keys(p, id)}`)
    if (r.rare) {
      run(server, `tellraw @a ["",{"text":"✦ ","color":"gold"},{"text":"${n}","color":"yellow","bold":true},{"text":" won ","color":"gray"},{"text":"${label(r)}","color":"gold","bold":true},{"text":" from the ${c.name}!","color":"gray"}]`)
      run(server, `execute in ${at.dim} run summon minecraft:firework_rocket ${at.x + 0.5} ${at.y + 1.5} ${at.z + 0.5} {LifeTime:15,FireworksItem:{id:"minecraft:firework_rocket",count:1,components:{"minecraft:fireworks":{explosions:[{shape:"star",colors:[I;16766720,16711680],has_twinkle:1b}]}}}}`)
    }
  }

  // ---------------------------------------------------------------- preview menu (read-only)
  const PREVIEW_TAG = 'ot_crate_preview'
  const isPreviewItem = (stack) => !stack.isEmpty() && String(stack.getComponents()).indexOf(PREVIEW_TAG) >= 0
  const previewStack = (c, r) => {
    const lore = `[\'{"text":"Chance: ${pct(c, r)}%","color":"yellow","italic":false}\'${r.rare ? ',\'{"text":"RARE","color":"gold","bold":true,"italic":false}\'' : ''}]`
    const name = `\'{"text":"${label(r)}","color":"${r.rare ? 'gold' : 'white'}","italic":false}\'`
    return Item.of(`${r.item || r.icon}[custom_data={${PREVIEW_TAG}:1b},custom_name=${name},lore=${lore}]`, Math.min(64, r.count || 1))
  }
  const preview = (p, id) => {
    const c = CRATES[id]
    try {
      var SimpleContainer = Java.loadClass('net.minecraft.world.SimpleContainer')
      var ChestMenu = Java.loadClass('net.minecraft.world.inventory.ChestMenu')
      var SimpleMenuProvider = Java.loadClass('net.minecraft.world.SimpleMenuProvider')
      var box = new SimpleContainer(27)
      var start = Math.max(0, Math.floor((27 - c.rewards.length) / 2))
      c.rewards.forEach((r, i) => box.setItem(start + i, previewStack(c, r)))
      p.openMenu(new SimpleMenuProvider((cid, inv, pl) => ChestMenu.threeRows(cid, inv, box), Text.of(c.name + ' Rewards')))
    } catch (e) {   // fallback: list the rewards in chat
      console.warn('[OVERTHRONE crates] preview menu failed, using chat: ' + e)
      p.tell(`§6§l${c.name} §7rewards:`)
      c.rewards.forEach(r => p.tell(`§7 • ${r.rare ? '§6' : '§f'}${label(r)} §8(${pct(c, r)}%)`))
    }
  }
  // Preview items can never be kept: remove them anywhere they turn up.
  PlayerEvents.inventoryChanged(event => {
    const inv = event.player.inventory
    for (let i = 0; i < inv.getContainerSize(); i++) if (isPreviewItem(inv.getItem(i))) inv.setItem(i, Item.empty)
  })
  EntityEvents.spawned('minecraft:item', event => { if (isPreviewItem(event.entity.item)) event.cancel() })

  // ---------------------------------------------------------------- clicks
  const lastClick = {}
  const debounce = (p) => {
    const now = p.server.tickCount, k = p.username
    if (lastClick[k] !== undefined && now - lastClick[k] < 5) return false
    lastClick[k] = now; return true
  }
  BlockEvents.rightClicked(event => {
    const id = crateAt(event.server, event.block)
    if (!id) return
    event.cancel()   // don't open the shulker box itself
    if (debounce(event.player)) openCrate(event.player, id)
  })
  BlockEvents.leftClicked(event => {
    const id = crateAt(event.server, event.block)
    if (!id) return
    event.cancel()
    if (debounce(event.player)) preview(event.player, id)
  })
  BlockEvents.broken(event => {
    const id = crateAt(event.server, event.block)
    if (!id) return
    if (!(event.player && event.player.hasPermissions(2) && event.player.isShiftKeyDown())) {
      event.cancel()
      if (event.player) event.player.tell('§7This is a crate. §8(Staff: sneak + break, then /crate remove ' + id + ')')
    }
  })

  // ---------------------------------------------------------------- commands
  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    const reply = (ctx, m) => ctx.source.sendSystemMessage(Text.of(m))
    const crateArg = () => Commands.argument('crate', StringArg.word())
    const crateOf = (ctx) => String(StringArg.getString(ctx, 'crate')).toLowerCase()
    const known = (ctx, id) => { if (CRATES[id]) return true; reply(ctx, '§cUnknown crate. Crates: ' + Object.keys(CRATES).join(', ')); return false }
    const staff = src => src.hasPermission(2)
    const keyCmd = (sign) => Commands.argument('player', Arguments.PLAYER.create(event)).then(crateArg()
      .then(Commands.argument('amount', Arguments.INTEGER.create(event)).executes(ctx => {
        const p = Arguments.PLAYER.getResult(ctx, 'player'), id = crateOf(ctx), n = Arguments.INTEGER.getResult(ctx, 'amount')
        if (!known(ctx, id)) return 0
        setKeys(p, id, keys(p, id) + sign * n)
        if (sign > 0) p.tell(`§a§lCrates §7» You received §f${n}x ${CRATES[id].name} Key${n > 1 ? 's' : ''}§7. You have §f${keys(p, id)}§7.`)
        reply(ctx, `${p.username} now has ${keys(p, id)} ${id} key(s).`); return 1
      })))
    event.register(Commands.literal('crate')
      .then(Commands.literal('keys').executes(ctx => {
        const p = ctx.source.playerOrException
        Object.keys(CRATES).forEach(id => p.tell(`§6${CRATES[id].name}§7: §f${keys(p, id)} key(s)`))
        return 1
      }))
      .then(Commands.literal('create').requires(staff).then(crateArg().executes(ctx => {
        const p = ctx.source.playerOrException, id = crateOf(ctx)
        if (!known(ctx, id)) return 0
        const all = load(p.server)
        all[id] = { x: Math.floor(p.x), y: Math.floor(p.y - 0.2), z: Math.floor(p.z), dim: String(p.level.dimension) }
        save(p.server); placeHologram(p.server, id)
        reply(ctx, `§a✦ ${CRATES[id].name} set at ${all[id].x} ${all[id].y} ${all[id].z}. Step off to see it.`); return 1
      })))
      .then(Commands.literal('remove').requires(staff).then(crateArg().executes(ctx => {
        const id = crateOf(ctx), all = load(ctx.source.server)
        run(ctx.source.server, `kill @e[type=minecraft:text_display,tag=ot_crate_${id}]`)
        delete all[id]; save(ctx.source.server)
        reply(ctx, `§eRemoved crate ${id}.`); return 1
      })))
      .then(Commands.literal('hologram').requires(staff).then(crateArg().executes(ctx => {
        placeHologram(ctx.source.server, crateOf(ctx)); reply(ctx, '§aHologram placed.'); return 1
      })))
      .then(Commands.literal('list').requires(staff).executes(ctx => {
        const all = load(ctx.source.server)
        Object.keys(CRATES).forEach(id => reply(ctx, `§6${id}§7: ${all[id] ? `${all[id].x} ${all[id].y} ${all[id].z} (${all[id].dim})` : 'not placed'}`))
        return 1
      }))
      .then(Commands.literal('key').requires(staff)
        .then(Commands.literal('give').then(keyCmd(1)))
        .then(Commands.literal('take').then(keyCmd(-1))))
    )
  })
})()
