// OVERTHRONE - OG-style crates: a block (e.g. a shulker box) you right-click to open with a key and left-click to preview.
// Drop into kubejs/server_scripts/ and run /reload (or restart).
//
// Setup (op):  place the crate block, stand ON TOP of it, then  /crate create <crate>     e.g. /crate create vote
//              /crate remove <crate>      /crate list      /crate hologram <crate>   (re-place the floating text)
// Keys (op / console / vote rewards / Tebex):
//              /crate key give <player> <crate> <amount>      /crate key take <player> <crate> <amount>
// Players:     /crate keys        how many keys you have
//
// Keys are real items (a glowing tripwire hook named e.g. "Vote Key"). Right-click the crate with a key in your
// inventory to use one. Keys can be traded, stored, and given by any plugin/command that can run /crate key give.
// Rewards (op) - edit them in game, any item works (modded items, enchants, custom names all kept):
//              /crate edit <crate>     opens the editor. Click an item in YOUR inventory to add it as a reward.
//                                      On a reward: left-click = more common, right-click = rarer,
//                                      shift-left-click = announce to server on/off, shift-right-click = remove.
//              /crate reward cmd <crate> <weight> <command>   adds a command reward (money, level XP, shards...);
//                                      hold the item you want as its icon (rename it in an anvil to set the name). {p} = player.
//              /crate reward list <crate>     /crate reward reset <crate>   (back to the defaults in this file)
// The chance of a reward = its weight / total weight. The defaults below are used until you edit a crate in game.
// particles: false turns off the built-in crate particles.

(function () {
  // The command that gives Throne Shards, without the amount ({p} = player). Set to '' to turn the shard rewards off:
  // the Throne Shard rewards are skipped while it's empty.
  const SHARDS_CMD = 'shards give {p}'

  const CRATES = {
    vote: {
      name: 'VOTING CRATE', keyName: 'Vote Key', color: 'green', dust: [0.35, 0.95, 0.25], keyHint: 'Free keys daily: /vote',
      particles: true,
      // Also accept the Vote Key the vote mod gives (matched on its lore, which players can't fake with an anvil).
      altKeys: ['earned by voting'],
      rewards: [
        { item: 'minecraft:diamond', count: 16, weight: 20 },
        { cmd: 'eco give {p} 1000', icon: 'minecraft:emerald', name: '$1,000', weight: 20 },
        { item: 'minecraft:golden_apple', count: 8, weight: 15 },
        { item: 'minecraft:experience_bottle', count: 32, weight: 12 },
        { cmd: 'level xp give {p} 1500', icon: 'minecraft:nether_star', name: '1,500 Level XP', weight: 10 },
        { item: 'minecraft:netherite_ingot', count: 4, weight: 6 },
        { item: 'minecraft:enchanted_golden_apple', count: 3, weight: 6 },
        { item: 'minecraft:enchanted_golden_apple', count: 6, weight: 4, rare: true },
        { cmd: SHARDS_CMD + ' 30', icon: 'minecraft:amethyst_shard', name: '30x Throne Shards', weight: 4, shards: true },
        { cmd: SHARDS_CMD + ' 60', icon: 'minecraft:amethyst_shard', name: '60x Throne Shards', weight: 1, rare: true, shards: true },
      ],
    },
  }

  const HOLO_COLORS = { green: 'green', red: 'red', gold: 'gold', purple: 'light_purple', aqua: 'aqua', blue: 'blue', white: 'white' }
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
      if (c.x === Number(block.x) && c.y === Number(block.y) && c.z === Number(block.z) && c.dim === dim && CRATES[ids[i]]) return ids[i]
    }
    return null
  }
  // ---- physical keys: tripwire hook tagged ot_key_<crate>
  const KEY_ITEM = 'minecraft:tripwire_hook'
  const keyTag = (id) => 'ot_key_' + id
  const isKey = (stack, id) => {
    if (stack.isEmpty() || String(stack.id) !== KEY_ITEM) return false
    var comp = String(stack.getComponents())
    if (comp.indexOf(keyTag(id)) >= 0) return true
    var alt = CRATES[id].altKeys || []
    for (var i = 0; i < alt.length; i++) if (comp.indexOf(alt[i]) >= 0) return true
    return false
  }
  const keyStackCmd = (id) => {
    var c = CRATES[id], col = HOLO_COLORS[c.color] || 'gold'
    var name = `'{"text":"${c.keyName || c.name + ' Key'}","color":"${col}","bold":true,"italic":false}'`
    var lore = `['{"text":"Right-click the ${c.name} to use","color":"gray","italic":false}','{"text":"${c.keyHint}","color":"yellow","italic":false}']`
    return `${KEY_ITEM}[custom_data={${keyTag(id)}:1b},custom_name=${name},lore=${lore},enchantment_glint_override=true]`
  }
  const keys = (p, id) => {
    var inv = p.inventory, n = 0
    for (var i = 0; i < inv.getContainerSize(); i++) { var st = inv.getItem(i); if (isKey(st, id)) n += st.count }
    return n
  }
  const giveKeys = (p, id, n) => { if (n > 0) run(p.server, `give ${p.username} ${keyStackCmd(id)} ${n}`) }
  const takeKeys = (p, id, n) => {
    var inv = p.inventory, held = p.mainHandItem
    if (n > 0 && isKey(held, id)) { var t = Math.min(n, held.count); held.shrink(t); n -= t }
    for (var i = 0; i < inv.getContainerSize() && n > 0; i++) {
      var st = inv.getItem(i)
      if (isKey(st, id)) { var k = Math.min(n, st.count); st.shrink(k); n -= k }
    }
  }
  // ---- rewards: defaults from CRATES, or the in-game edited list saved on the server
  const ItemStackJ = Java.loadClass('net.minecraft.world.item.ItemStack')
  const TagParser = Java.loadClass('net.minecraft.nbt.TagParser')
  const REWARD_STORE = 'ot_crate_rewards'
  let edited = null   // { crateId: [entry] }
  const loadEdited = (server) => {
    if (edited) return edited
    try { edited = JSON.parse(String(server.persistentData.getString(REWARD_STORE)) || '{}') } catch (e) { edited = {} }
    return edited
  }
  const saveEdited = (server) => server.persistentData.putString(REWARD_STORE, JSON.stringify(edited))
  const defaults = (id) => CRATES[id].rewards
    .filter(r => !(r.shards && !SHARDS_CMD))
    .map(r => ({ item: r.item, count: r.count, cmd: r.cmd, icon: r.icon, name: r.name, weight: r.weight, rare: !!r.rare }))
  const rewardsOf = (server, id) => {
    var all = loadEdited(server)
    if (!all[id]) all[id] = defaults(id)
    return all[id]
  }
  const toSnbt = (server, stack) => String(stack.save(server.registryAccess()))
  const stackOf = (server, r) => {
    if (r.snbt) { try { return ItemStackJ.parseOptional(server.registryAccess(), TagParser.parseTag(r.snbt)) } catch (e) { return Item.of('minecraft:barrier') } }
    if (r.item) return Item.of(r.item, r.count || 1)
    return Item.of(r.icon || 'minecraft:paper')
  }
  const totalWeight = (list) => list.reduce((s, r) => s + r.weight, 0)
  const pctOf = (list, r) => (r.weight * 100 / Math.max(1, totalWeight(list))).toFixed(2)
  const label = (server, r) => {
    if (r.name) return r.name
    var st = stackOf(server, r)
    return st.count + 'x ' + String(st.getHoverName().getString())
  }
  const f = (n) => n.toFixed(2)
  const run = (server, cmd) => server.runCommandSilent(cmd)

  // ---------------------------------------------------------------- hologram above the crate
  const placeHologram = (server, id) => {
    const c = CRATES[id], at = load(server)[id]
    if (!c || !at) return
    run(server, `kill @e[type=minecraft:text_display,tag=ot_crate_${id}]`)
    const col = HOLO_COLORS[c.color] || 'gold'
    const lines = [
      [2.25, `{"text":"${c.name}","color":"${col}","bold":true}`, 1.3],
      [1.95, `{"text":"Right-click with a ${c.keyName || 'key'} to open","color":"gray"}`, 0.8],
      [1.75, '{"text":"Left-click or sneak + right-click to preview","color":"gray"}', 0.8],
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
      if (!near || c.particles === false) continue
      const x = at.x + 0.5, y = at.y + 0.5, z = at.z + 0.5, a = t * 0.08
      // three arms spiralling up and outward around the crate
      for (let k = 0; k < 3; k++) {
        const h = ((t * 0.012) + k / 3) % 1, ang = a + k * 2.094 + h * 5
        const rad = 0.45 + h * 0.8
        run(server, `execute in ${at.dim} run particle ${dust(c.dust, 1.3)} ${f(x + Math.cos(ang) * rad)} ${f(y - 0.3 + h * 2.2)} ${f(z + Math.sin(ang) * rad)} 0 0 0 0 1 normal`)
      }
      // a soft cloud of pixels puffing out of the crate, like OG Network
      run(server, `execute in ${at.dim} run particle ${dust(c.dust, 1.6)} ${f(x)} ${f(y + 0.2)} ${f(z)} 0.6 0.45 0.6 0 3 normal`)
      if (t % 9 === 0) run(server, `execute in ${at.dim} run particle minecraft:end_rod ${f(x)} ${f(y - 0.6)} ${f(z)} 0.05 0 0.05 0.02 1 normal`)
    }
  })

  // ---------------------------------------------------------------- open
  const roll = (list) => {
    let r = Math.random() * totalWeight(list)
    for (let i = 0; i < list.length; i++) { r -= list[i].weight; if (r <= 0) return list[i] }
    return list[list.length - 1]
  }
  const openCrate = (p, id) => {
    const c = CRATES[id], server = p.server, n = p.username, at = load(server)[id]
    if (keys(p, id) <= 0) {
      p.tell(`§c§lCrates §7» You need a §f${c.keyName || c.name + ' Key'}§7 to open this crate. §e${c.keyHint}`)
      if (p.hasPermissions(2) && !p.mainHandItem.isEmpty())   // staff: show what the held item looks like, to match other key items
        p.tell('§8[crates] held item: ' + String(p.mainHandItem.id) + ' ' + String(p.mainHandItem.getComponents()).substring(0, 400))
      run(server, `execute at ${n} run playsound minecraft:block.note_block.bass player ${n} ~ ~ ~ 1 0.6`)
      return
    }
    const list = rewardsOf(server, id)
    if (!list.length) { p.tell('§cThis crate has no rewards yet.'); return }
    takeKeys(p, id, 1)
    const r = roll(list), what = label(server, r)
    if (r.cmd) run(server, r.cmd.split('{p}').join(n))
    else p.give(stackOf(server, r).copy())
    run(server, `title ${n} times 5 40 10`)
    run(server, `title ${n} subtitle ${JSON.stringify({ text: what, color: r.rare ? 'gold' : 'white' })}`)
    run(server, `title ${n} title {"text":"${c.name}","color":"${HOLO_COLORS[c.color] || 'gold'}","bold":true}`)
    run(server, `execute at ${n} run playsound minecraft:block.chest.open player ${n} ~ ~ ~ 1 1`)
    run(server, `execute at ${n} run playsound minecraft:entity.player.levelup player ${n} ~ ~ ~ 0.8 1.3`)
    run(server, `execute in ${at.dim} run particle minecraft:totem_of_undying ${at.x + 0.5} ${at.y + 1} ${at.z + 0.5} 0.3 0.5 0.3 0.4 ${r.rare ? 80 : 25} normal`)
    p.tell(`§a§lCrates §7» You won §f${what} §7(${pctOf(list, r)}% chance). §8Keys left: ${keys(p, id)}`)
    if (r.rare) {
      run(server, `tellraw @a ${JSON.stringify(['', { text: '✦ ', color: 'gold' }, { text: n, color: 'yellow', bold: true }, { text: ' won ', color: 'gray' }, { text: what, color: 'gold', bold: true }, { text: ' from the ' + c.name + '!', color: 'gray' }])}`)
      run(server, `execute in ${at.dim} run summon minecraft:firework_rocket ${at.x + 0.5} ${at.y + 1.5} ${at.z + 0.5} {LifeTime:15,FireworksItem:{id:"minecraft:firework_rocket",count:1,components:{"minecraft:fireworks":{explosions:[{shape:"star",colors:[I;16766720,16711680],has_twinkle:1b}]}}}}`)
    }
  }

  // ---------------------------------------------------------------- preview menu + in-game editor
  const PREVIEW_TAG = 'ot_crate_preview'
  const isPreviewItem = (stack) => !stack.isEmpty() && String(stack.getComponents()).indexOf(PREVIEW_TAG) >= 0
  const DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
  const ItemLore = Java.loadClass('net.minecraft.world.item.component.ItemLore')
  const ArrayList = Java.loadClass('java.util.ArrayList')
  const line = (s) => { var c = Text.of(s); try { c = c.italic(false) } catch (e) { } return c }
  // A copy of the reward item with extra tooltip lines (chance etc.), keeping its own lore/enchants.
  const shown = (server, r, extra) => {
    var st = stackOf(server, r).copy()
    try {
      var lines = new ArrayList(), old = st.get(DataComponents.LORE)
      if (old) old.lines().forEach(l => lines.add(l))
      lines.add(line(''))
      extra.forEach(x => lines.add(line(x)))
      st.set(DataComponents.LORE, new ItemLore(lines))
      if (r.name) st.set(DataComponents.CUSTOM_NAME, line((r.rare ? '§6' : '§f') + r.name))
    } catch (e) { }
    return st
  }
  const previewChat = (p, id) => {
    var list = rewardsOf(p.server, id)
    p.tell(`§6§l${CRATES[id].name} §7rewards:`)
    list.forEach(r => p.tell(`§7 • ${r.rare ? '§6' : '§f'}${label(p.server, r)} §8(${pctOf(list, r)}%)`))
  }
  const rowsFor = (n) => Math.max(3, Math.min(6, Math.ceil(n / 9) + 1))
  // Read-only: KubeJS chest GUI items can't be taken.
  const preview = (p, id) => {
    if (p.openChestGUI === undefined) { previewChat(p, id); return }
    try {
      var list = rewardsOf(p.server, id).slice(0, 45)
      p.openChestGUI(Text.of(CRATES[id].name + ' Rewards'), rowsFor(list.length), gui => {
        gui.playerSlots = true
        list.forEach((r, i) => gui.slot(i % 9, Math.floor(i / 9), slot => {
          slot.item = shown(p.server, r, [`§eChance: ${pctOf(list, r)}%`].concat(r.rare ? ['§6§lRARE'] : []))
        }))
      })
    } catch (e) {
      console.warn('[OVERTHRONE crates] preview menu failed, using chat: ' + e)
      if (p.hasPermissions(2)) p.tell('§c[crates] preview menu failed: ' + e)
      previewChat(p, id)
    }
  }
  // Staff editor: 5 rows of rewards + your inventory. Every change is saved straight away.
  const editor = (p, id) => {
    var server = p.server, list = rewardsOf(server, id)
    var changed = () => { saveEdited(server); editor(p, id) }
    p.openChestGUI(Text.of('Edit: ' + CRATES[id].name), 6, gui => {
      gui.playerSlots = true
      list.slice(0, 45).forEach((r, i) => gui.slot(i % 9, Math.floor(i / 9), slot => {
        slot.item = shown(server, r, [
          `§eChance: ${pctOf(list, r)}% §8(weight ${r.weight})`,
          r.rare ? '§6§lRARE §7(announced to the server)' : '§7Not announced',
          r.cmd ? '§8Command: /' + r.cmd : '§8Item reward',
          '§aLeft-click§7: more common  §cRight-click§7: rarer',
          '§eShift-left§7: announce on/off  §4Shift-right§7: remove',
        ])
        var step = () => (r.weight > 10 ? 5 : 1)
        slot.leftClicked = e => { r.weight += step(); changed() }
        slot.rightClicked = e => { r.weight = Math.max(1, r.weight - step()); changed() }
        slot.shiftLeftClicked = e => { r.rare = !r.rare; changed() }
        slot.shiftRightClicked = e => { list.splice(i, 1); changed() }
      }))
      gui.slot(4, 5, slot => {
        slot.item = shown(server, { item: 'minecraft:writable_book', count: 1, name: 'How to edit', weight: 0 }, [
          '§7Click any item in §fyour inventory§7 to add it',
          '§7as a reward (you keep the item).',
          `§7Rewards: §f${list.length}§7/45`,
          '§7Command rewards (money, shards):',
          '§f/crate reward cmd ' + id + ' <weight> <command>',
        ])
      })
      gui.inventoryClicked = e => {
        if (String(e.type) !== 'PICKUP' || e.button !== 0) return   // plain left-click only (no double adds)
        var st = e.item
        if (!st || st.isEmpty()) return
        if (list.length >= 45) { p.tell('§cThis crate is full (45 rewards).'); return }
        list.push({ snbt: toSnbt(server, st.copy()), weight: 10, rare: false })
        p.tell('§a[crates] Added ' + st.count + 'x ' + String(st.getHoverName().getString()) + ' (weight 10).')
        changed()
      }
    })
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
  // Any error is shown to staff in chat (and the console) instead of failing silently.
  const guarded = (what, event, fn) => {
    try { fn() } catch (e) {
      console.error('[OVERTHRONE crates] ' + what + ' failed: ' + e)
      try { if (event.player.hasPermissions(2)) event.player.tell('§c[crates] ' + what + ' failed: ' + e) } catch (e2) { }
    }
  }
  // Staff holding a key on a block that isn't a crate get told why, to make setup problems obvious.
  const explainMiss = (event) => {
    var p = event.player, b = event.block
    if (!p.hasPermissions(2)) return
    var ids = Object.keys(CRATES), holding = false
    for (var i = 0; i < ids.length; i++) if (isKey(p.mainHandItem, ids[i])) holding = true
    if (!holding) return
    var all = load(p.server), saved = Object.keys(all).map(k => `${k} @ ${all[k].x} ${all[k].y} ${all[k].z} ${all[k].dim}`).join(', ')
    p.tell(`§7[crates] Not a crate: you clicked ${b.x} ${b.y} ${b.z} ${b.level.dimension}. Saved crates: ${saved || 'none'}`)
  }
  const serverOf = (event) => event.player.server
  // Note: in KubeJS event.cancel() stops the handler right there, so it must be the LAST thing we do.
  BlockEvents.rightClicked(event => {
    var id = null
    guarded('opening', event, () => {
      id = crateAt(serverOf(event), event.block)
      if (!id) { if (String(event.hand) === 'MAIN_HAND') explainMiss(event); return }
      if (!debounce(event.player)) return
      if (event.player.isShiftKeyDown()) preview(event.player, id)   // sneak + right-click = preview
      else openCrate(event.player, id)
    })
    if (id) event.cancel()   // don't open the shulker box itself
  })
  BlockEvents.leftClicked(event => {
    var id = null
    guarded('preview', event, () => {
      id = crateAt(serverOf(event), event.block)
      if (id && debounce(event.player)) preview(event.player, id)
    })
    if (id) event.cancel()
  })
  BlockEvents.broken(event => {
    if (!event.player) return
    var id = crateAt(serverOf(event), event.block)
    if (!id) return
    if (!(event.player.hasPermissions(2) && event.player.isShiftKeyDown())) {
      // In creative a left-click breaks instantly, so treat it as a preview click.
      guarded('preview', event, () => { if (debounce(event.player)) preview(event.player, id) })
      event.cancel()
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
        if (sign > 0) giveKeys(p, id, n); else takeKeys(p, id, n)
        if (sign > 0) p.tell(`§a§lCrates §7» You received §f${n}x ${CRATES[id].keyName || CRATES[id].name + ' Key'}§7.`)
        reply(ctx, `${sign > 0 ? 'Gave' : 'Took'} ${n} ${id} key(s) ${sign > 0 ? 'to' : 'from'} ${p.username}.`); return 1
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
      .then(Commands.literal('preview').then(crateArg().executes(ctx => {
        const id = crateOf(ctx)
        if (!known(ctx, id)) return 0
        preview(ctx.source.playerOrException, id); return 1
      })))
      .then(Commands.literal('edit').requires(staff).then(crateArg().executes(ctx => {
        const id = crateOf(ctx)
        if (!known(ctx, id)) return 0
        try { editor(ctx.source.playerOrException, id) } catch (e) { reply(ctx, '§c[crates] editor failed: ' + e) }
        return 1
      })))
      .then(Commands.literal('reward').requires(staff)
        .then(Commands.literal('list').then(crateArg().executes(ctx => {
          const id = crateOf(ctx)
          if (!known(ctx, id)) return 0
          const list = rewardsOf(ctx.source.server, id)
          reply(ctx, `§6${CRATES[id].name}§7: ${list.length} rewards`)
          list.forEach((r, i) => reply(ctx, `§8${i + 1}. ${r.rare ? '§6' : '§f'}${label(ctx.source.server, r)} §7${pctOf(list, r)}% §8(weight ${r.weight})`))
          return 1
        })))
        .then(Commands.literal('reset').then(crateArg().executes(ctx => {
          const id = crateOf(ctx)
          if (!known(ctx, id)) return 0
          loadEdited(ctx.source.server)[id] = defaults(id); saveEdited(ctx.source.server)
          reply(ctx, `§eRewards for ${id} reset to the defaults.`); return 1
        })))
        .then(Commands.literal('cmd').then(crateArg().then(Commands.argument('weight', Arguments.INTEGER.create(event))
          .then(Commands.argument('command', StringArg.greedyString()).executes(ctx => {
            const p = ctx.source.playerOrException, id = crateOf(ctx)
            if (!known(ctx, id)) return 0
            const held = p.mainHandItem
            const cmd = String(StringArg.getString(ctx, 'command')).replace(/^\//, '')
            const r = { cmd: cmd, weight: Math.max(1, Arguments.INTEGER.getResult(ctx, 'weight')), rare: false,
              icon: held.isEmpty() ? 'minecraft:paper' : String(held.id),
              name: held.isEmpty() ? cmd : String(held.getHoverName().getString()) }
            rewardsOf(p.server, id).push(r); saveEdited(p.server)
            reply(ctx, `§aAdded command reward "${r.name}" to ${id}: /${cmd}`); return 1
          })))))
      )
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
