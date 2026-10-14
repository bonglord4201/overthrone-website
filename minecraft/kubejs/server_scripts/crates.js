// OVERTHRONE - OG-style crates: a block (e.g. a shulker box) you right-click to open with a key and left-click to preview.
// Drop into kubejs/server_scripts/ and run /reload (or restart).
//
// Setup (op):  place the crate block, LOOK at it, then  /crate create <crate>     e.g. /crate create vote
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
//              /crate reward claimblocks <crate> <weight> <amount>   adds a claim block reward (Flan)
//              /crate reward cmd <crate> <weight> <command>   adds a command reward (money, level XP, shards...);
//                                      hold the item you want as its icon (rename it in an anvil to set the name). {p} = player.
//              /crate reward list <crate>     /crate reward reset <crate>   (back to the defaults in this file)
// The chance of a reward = its weight / total weight. The defaults below are used until you edit a crate in game.
// particles: false turns off the built-in crate particles.

(function () {
  // The command that gives Throne Shards, without the amount ({p} = player). Set to '' to turn the shard rewards off:
  // the Throne Shard rewards are skipped while it's empty.
  const SHARDS_CMD = 'shards give {p}'

  // Builds an item string with a coloured name and enchant levels (levels above vanilla max are fine).
  // color can be one colour, or a list of hex colours for a multi-coloured (gradient) name like OG's.
  const hex = (h) => [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]
  const gradient = (text, stops) => {
    var out = [''], cols = stops.map(hex), n = Math.max(1, text.length - 1)
    for (var i = 0; i < text.length; i++) {
      var pos = i / n * (cols.length - 1), seg = Math.min(cols.length - 2, Math.floor(pos)), u = pos - seg
      var c = [0, 1, 2].map(j => Math.round(cols[seg][j] + (cols[seg + 1][j] - cols[seg][j]) * u))
      out.push({ text: text[i], color: '#' + c.map(v => ('0' + v.toString(16)).slice(-2)).join(''), bold: true, italic: false })
    }
    return out
  }
  const gear = (id, name, color, ench, extra) => {
    var e = Object.keys(ench).map(k => `"minecraft:${k}":${ench[k]}`).join(',')
    var comp = Array.isArray(color) ? gradient(name, color) : { text: name, color: color, bold: true, italic: false }
    var nm = JSON.stringify(comp).replace(/'/g, "\\'")
    return `minecraft:${id}[custom_name='${nm}',` +
      `enchantments={levels:{${e}}}${extra ? ',' + extra : ''}]`
  }
  const PROT4 = { protection: 9, blast_protection: 9, fire_protection: 9, projectile_protection: 9, unbreaking: 8, mending: 1 }

  // NEW CRATES: copy a block below and give it a name, colour and dust: [r, g, b] (0.0-1.0). Every crate
  // automatically gets the same particle effect (circling ring + colour motes + specks) in its own colours.
  const CRATES = {
    vote: {
      name: 'VOTING CRATE', keyName: 'Vote Key', color: 'green', dust: [0.35, 0.95, 0.25], spores: [[0.35, 0.95, 0.25], [0.75, 1.0, 0.3], [0.2, 0.8, 0.6], [1.0, 1.0, 0.6]], keyHint: 'Free keys daily: /vote',
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
        { cmd: 'flan giveClaimBlocks {p} 100', icon: 'minecraft:grass_block', name: '100 Claim Blocks', weight: 15 },
        { cmd: 'flan giveClaimBlocks {p} 250', icon: 'minecraft:grass_block', name: '250 Claim Blocks', weight: 6 },
        { cmd: 'flan giveClaimBlocks {p} 1000', icon: 'minecraft:grass_block', name: '1,000 Claim Blocks', weight: 1, rare: true },
      ],
    },
    // "redeem" crates (like OG's armor/weapon crates): open the menu, pick an item, pay its key cost.
    armor: {
      type: 'redeem', name: 'ARMOR CRATE', keyName: 'Armor Key', color: 'purple', dust: [1.0, 0.35, 0.85], spores: [[1.0, 0.35, 0.85], [0.75, 0.3, 1.0], [1.0, 0.7, 0.9], [0.55, 0.2, 0.9]],
      petals: 'minecraft:cherry_leaves',   // extra falling pink petals
      keyHint: 'Keys available on store', particles: true,
      rewards: [
        { give: gear('netherite_helmet', 'Throne Guard Helmet', ['#ff2a2a', '#ffb000'], PROT4), cost: 3 },
        { give: gear('netherite_chestplate', 'Throne Guard Chestplate', ['#ff2a2a', '#ffb000'], PROT4), cost: 3 },
        { give: gear('netherite_leggings', 'Throne Guard Leggings', ['#ff2a2a', '#ffb000'], PROT4), cost: 3 },
        { give: gear('netherite_boots', 'Throne Guard Boots', ['#ff2a2a', '#ffb000'], PROT4), cost: 3 },
        { give: gear('elytra', "Monarch's Wings", ['#c86bff', '#ff7ad9'], { unbreaking: 8, mending: 1 }), cost: 2 },
        { give: gear('shield', 'Bastion Shield', ['#ffe36b', '#ff8c00'], { unbreaking: 8, mending: 1 }), cost: 2 },
        { give: gear('netherite_helmet', 'Abyssal Helm', ['#00e5ff', '#3d5afe'], { respiration: 8, aqua_affinity: 1, thorns: 3, unbreaking: 8, mending: 1 }), cost: 4 },
        { give: gear('netherite_leggings', 'Shadowstep Leggings', ['#c86bff', '#4a00e0', '#c86bff'], { swift_sneak: 3, thorns: 3, unbreaking: 8, mending: 1 }), cost: 4 },
        { give: gear('netherite_boots', 'Frostbound Boots', ['#e0f7ff', '#4fc3f7', '#0091ea'], { frost_walker: 10, feather_falling: 9, thorns: 3, unbreaking: 8, mending: 1 }), cost: 4 },
      ],
    },
    // Random-win crates (like the vote crate): start empty, fill them in game with /crate edit <crate>.
    // Keys for random crates should be earned in game (events, quests, voting), not sold: paid keys stay non-RNG.
    legendary: {
      name: 'LEGENDARY CRATE', keyName: 'Legendary Key', color: 'gold', dust: [1.0, 0.75, 0.1],
      keyHint: 'Earn keys from events & quests', particles: true, rewards: [],
    },
    mythic: {
      name: 'MYTHIC CRATE', keyName: 'Mythic Key', color: 'purple', dust: [0.65, 0.25, 1.0],
      keyHint: 'Earn keys from bosses & Gates', particles: true, rewards: [],
    },
    event: {
      name: 'EVENT CRATE', keyName: 'Event Key', color: 'red', dust: [1.0, 0.15, 0.2],
      keyHint: 'Keys from server events', particles: true, rewards: [],
    },
    spawner: {
      name: 'SPAWNER CRATE', keyName: 'Spawner Key', color: 'blue', dust: [0.25, 0.45, 1.0],
      keyHint: 'Earn keys in game', particles: true, rewards: [],
    },
    afk: {
      name: 'AFK CRATE', keyName: 'AFK Key', color: 'red', dust: [1.0, 0.15, 0.2], spores: [[1.0, 0.15, 0.2], [0.8, 0.0, 0.05], [1.0, 0.45, 0.35], [1.0, 0.75, 0.7]],
      keyHint: 'Earn keys in the AFK room: /warp afk', particles: true,
      // Same rewards and odds as OG Network's AFK crate, switched to OVERTHRONE stuff (Petals -> Throne Shards,
      // Oni/Blossom/Emperor kits -> Ronin/Valkyrie/Monarch kits). Weights 20/10/6/4/1 = OG's 8.97/4.49/2.69/1.79/0.44%.
      // Kit rewards run "kit <name> <player>" from the console: the player gets the kit's items ONCE and does NOT get
      // the rank. (Console kits skip kit_cooldown.js, so winning a kit doesn't start the rank-kit cooldown.)
      rewards: [
        { item: 'minecraft:diamond', count: 32, weight: 20 },
        { item: 'minecraft:golden_apple', count: 10, weight: 20 },
        { item: 'minecraft:experience_bottle', count: 64, weight: 20 },
        { cmd: 'eco give {p} 5000', icon: 'minecraft:emerald', name: '$5,000', weight: 20 },
        { cmd: SHARDS_CMD + ' 10', icon: 'minecraft:amethyst_shard', name: '10x Throne Shards', weight: 20, shards: true },
        { cmd: 'level xp give {p} 1500', icon: 'minecraft:nether_star', name: '1,500 Level XP', weight: 20 },
        { cmd: 'eco give {p} 10000', icon: 'minecraft:emerald', name: '$10,000', weight: 10 },
        { cmd: 'kit ronin {p}', icon: 'minecraft:iron_helmet', name: '1x Ronin Kit', weight: 10 },
        { item: 'minecraft:netherite_ingot', count: 16, weight: 10 },
        { cmd: 'crate key give {p} legendary 1', icon: 'minecraft:tripwire_hook', name: '1x Legendary Key', weight: 10 },
        { cmd: 'flan giveClaimBlocks {p} 100', icon: 'minecraft:grass_block', name: '100 Claim Blocks', weight: 6 },
        { cmd: 'kit valkyrie {p}', icon: 'minecraft:diamond_helmet', name: '1x Valkyrie Kit', weight: 6 },
        { cmd: 'eco give {p} 50000', icon: 'minecraft:emerald_block', name: '$50,000', weight: 6 },
        { cmd: 'crate key give {p} mythic 1', icon: 'minecraft:tripwire_hook', name: '1x Mythic Key', weight: 6 },
        { cmd: SHARDS_CMD + ' 50', icon: 'minecraft:amethyst_shard', name: '50x Throne Shards', weight: 6, shards: true },
        { item: 'minecraft:enchanted_golden_apple', count: 8, weight: 6 },
        { cmd: 'flan giveClaimBlocks {p} 500', icon: 'minecraft:grass_block', name: '500 Claim Blocks', weight: 4 },
        { cmd: 'kit monarch {p}', icon: 'minecraft:netherite_helmet', name: '1x Monarch Kit', weight: 4, rare: true },
        { cmd: SHARDS_CMD + ' 100', icon: 'minecraft:amethyst_shard', name: '100x Throne Shards', weight: 4, rare: true, shards: true },
        { cmd: 'eco give {p} 100000', icon: 'minecraft:emerald_block', name: '$100,000', weight: 4, rare: true },
        { item: 'minecraft:enchanted_golden_apple', count: 32, weight: 4, rare: true },
        { item: 'minecraft:villager_spawn_egg', count: 1, weight: 4 },
        { cmd: 'flan giveClaimBlocks {p} 1000', icon: 'minecraft:grass_block', name: '1,000 Claim Blocks', weight: 1, rare: true },
        { cmd: SHARDS_CMD + ' 200', icon: 'minecraft:amethyst_shard', name: '200x Throne Shards', weight: 1, rare: true, shards: true },
        { cmd: 'eco give {p} 1000000', icon: 'minecraft:emerald_block', name: '$1,000,000', weight: 1, rare: true },
      ],
    },
    cosmetic: {
      name: 'COSMETIC CRATE', keyName: 'Cosmetic Key', color: 'white', dust: [0.9, 0.9, 1.0],
      keyHint: 'Earn keys in game', particles: true, rewards: [],
    },
    // Rune Crate: starts empty. Fill it in game with your modded rune items: /crate edit runes
    // (click an item in your inventory to add it; left/right-click a reward to change its key cost).
    runes: {
      type: 'redeem', name: 'RUNE CRATE', keyName: 'Rune Key', color: 'aqua', dust: [0.2, 0.85, 1.0],
      keyHint: 'Keys available on store', particles: true,
      rewards: [],
    },
    weapon: {
      type: 'redeem', name: 'WEAPON CRATE', keyName: 'Weapon Key', color: 'gold', dust: [1.0, 0.55, 0.1], spores: [[1.0, 0.55, 0.1], [1.0, 0.85, 0.2], [1.0, 0.25, 0.1], [1.0, 0.95, 0.7]],
      keyHint: 'Keys available on store', particles: true,
      rewards: [
        { give: gear('netherite_sword', "Sovereign's Reach", ['#a855f7', '#ec4899'], { sweeping_edge: 8, fire_aspect: 2, knockback: 8, looting: 8, unbreaking: 8, mending: 1 }), cost: 3 },
        { give: gear('netherite_sword', 'Trinity Edge', ['#ff0000', '#ff9900', '#ffee00'], { sharpness: 8, smite: 10, bane_of_arthropods: 10 }), cost: 3 },
        { give: gear('netherite_axe', "Headsman's Cleaver", ['#ff1f1f', '#7a0000'], { sharpness: 8, smite: 10, bane_of_arthropods: 10, unbreaking: 8, mending: 1 }), cost: 3 },
        { give: gear('bow', "Warlord's Longbow", ['#3cff7a', '#00b3ff'], { power: 8, flame: 1, punch: 8 }), cost: 3 },
        { give: gear('netherite_pickaxe', 'Throneforged Pick I', ['#00c6ff', '#0072ff'], { silk_touch: 1, efficiency: 8, unbreaking: 8, mending: 1 }), cost: 2 },
        { give: gear('netherite_pickaxe', 'Throneforged Pick II', ['#00c6ff', '#7f00ff'], { fortune: 8, efficiency: 8, unbreaking: 8, mending: 1 }), cost: 2 },
        { give: gear('netherite_axe', 'Throneforged Axe I', ['#f7971e', '#ffd200'], { sharpness: 8, fire_aspect: 2, silk_touch: 1, efficiency: 8, unbreaking: 8, mending: 1 }), cost: 4 },
        { give: gear('netherite_axe', 'Throneforged Axe II', ['#f7971e', '#ff4e50'], { fortune: 8, efficiency: 8, unbreaking: 8, mending: 1 }), cost: 2 },
        { give: gear('netherite_sword', 'Overthrone Blade', ['#ff0000', '#ffd700', '#ff0000'], { sharpness: 8, smite: 10, bane_of_arthropods: 10, sweeping_edge: 8, fire_aspect: 2, knockback: 7, looting: 8, unbreaking: 8, mending: 1 }), cost: 4 },
        { give: gear('netherite_hoe', 'Throneforged Hoe I', ['#56ab2f', '#a8e063'], { silk_touch: 1, efficiency: 8, unbreaking: 8, mending: 1 }), cost: 2 },
        { give: gear('netherite_hoe', 'Throneforged Hoe II', ['#11998e', '#38ef7d'], { fortune: 8, efficiency: 8, unbreaking: 8, mending: 1 }), cost: 2 },
        { give: gear('netherite_shovel', 'Throneforged Spade I', ['#c79081', '#dfa579'], { silk_touch: 1, efficiency: 8, unbreaking: 8, mending: 1 }), cost: 2 },
        { give: gear('netherite_shovel', 'Throneforged Spade II', ['#b06ab3', '#4568dc'], { fortune: 8, efficiency: 8, unbreaking: 8, mending: 1 }), cost: 2 },
        { give: gear('bow', 'Bloodmoon Bow', ['#8b0000', '#ff3b3b', '#8b0000'], { power: 8, flame: 1, punch: 8, infinity: 1, unbreaking: 8, mending: 1 }), cost: 4 },
        { give: gear('crossbow', 'Dreadforge Crossbow', ['#ff6a00', '#ee0979'], { piercing: 9, multishot: 1, quick_charge: 5, unbreaking: 8, mending: 1 }), cost: 4 },
        { give: gear('trident', 'Tidecaller', ['#00f2fe', '#4facfe'], { channeling: 1, impaling: 10, loyalty: 8, unbreaking: 8, mending: 1 }), cost: 4 },
        { give: gear('trident', "Leviathan's Wrath", ['#43e97b', '#00c6ff', '#0072ff'], { riptide: 8, channeling: 1, impaling: 10, loyalty: 8, unbreaking: 8, mending: 1 }), cost: 4 },
      ],
    },
  }

  // ---- "CRATES INFO" board (floating text near the crates). Edit the lines here, then /crate infoboard place again.
  const INFO_BOARD = [
    { text: 'CRATES INFO', color: '#FF3B3B', bold: true },
    { text: '' },
    { text: 'Get VOTE KEYS by voting every day: /vote', color: '#5CFF5C', bold: true },
    { text: 'WEAPON, ARMOR & RUNE KEYS at overthronesmp.tebex.store', color: '#FFD84A', bold: true },
    { text: 'LEGENDARY, MYTHIC & EVENT KEYS: events, bosses & quests', color: '#FF8CFF', bold: true },
    { text: 'Left-click a crate to see its rewards', color: '#FFFFFF' },
    { text: '' },
    { text: 'ALL PAID KEYS ARE NON-RNG', color: '#FF4D4D', bold: true },
    { text: 'YOU GET TO PICK WHAT YOU WIN', color: '#FF4D4D', bold: true },
  ]
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
      var c = all[ids[i]]
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
    // claim block rewards show a dirt block (older saved ones used a golden shovel or dirt)
    Object.keys(edited).forEach(k => (edited[k] || []).forEach(r => {
      if (r.cmd && String(r.cmd).indexOf('flan giveClaimBlocks') == 0 && (r.icon == 'minecraft:golden_shovel' || r.icon == 'minecraft:dirt')) r.icon = 'minecraft:grass_block'
    }))
    return edited
  }
  const saveEdited = (server) => server.persistentData.putString(REWARD_STORE, JSON.stringify(edited))
  const defaults = (id) => CRATES[id].rewards
    .filter(r => !(r.shards && !SHARDS_CMD))
    .map(r => ({ item: r.item, count: r.count, give: r.give, cost: r.cost, cmd: r.cmd, icon: r.icon, name: r.name, weight: r.weight || 1, rare: !!r.rare }))
  const rewardsOf = (server, id) => {
    var all = loadEdited(server)
    if (!all[id]) all[id] = defaults(id)
    return all[id]
  }
  const toSnbt = (server, stack) => String(stack.save(server.registryAccess()))
  const stackOf = (server, r) => {
    if (r.snbt) { try { return ItemStackJ.parseOptional(server.registryAccess(), TagParser.parseTag(r.snbt)) } catch (e) { return Item.of('minecraft:barrier') } }
    if (r.give) { try { return Item.of(r.give) } catch (e) { return Item.of('minecraft:barrier') } }
    if (r.item) return Item.of(r.item, r.count || 1)
    return Item.of(r.icon || 'minecraft:paper')
  }
  const isRedeem = (id) => CRATES[id].type === 'redeem'
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
      [1.95, c.type === 'redeem' ? '{"text":"Click to browse rewards","color":"gray"}' : `{"text":"Right-click with a ${c.keyName || 'key'} to open","color":"gray"}`, 0.8],
      [1.75, c.type === 'redeem' ? '{"text":"Pick a reward and pay with keys","color":"gray"}' : '{"text":"Left-click or sneak + right-click to preview","color":"gray"}', 0.8],
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
  // Numbers must be written as decimals (1.00, not 1): Minecraft rejects a colour list that mixes 1 and 0.35.
  const dust = (c, s) => `minecraft:dust{color:[${c[0].toFixed(2)},${c[1].toFixed(2)},${c[2].toFixed(2)}],scale:${s.toFixed(2)}}`
  // Every crate gets the same particle effect in its own colours: give a crate just a dust colour and
  // it gets a matching palette (its colour, a lighter and a darker shade, and a near-white tint).
  const paletteOf = (c) => {
    if (c.spores) return c.spores
    var d = c.dust, mix = (k, to) => d.map(v => Math.min(1, v + (to - v) * k))
    c.spores = [d, mix(0.45, 1), d.map(v => v * 0.65), mix(0.75, 1)]
    return c.spores
  }
  const fade = (c1, c2, s) => `minecraft:dust_color_transition{from_color:[${c1[0].toFixed(2)},${c1[1].toFixed(2)},${c1[2].toFixed(2)}],to_color:[${c2[0].toFixed(2)},${c2[1].toFixed(2)},${c2[2].toFixed(2)}],scale:${s.toFixed(2)}}`
  ServerEvents.tick(event => {
    const server = event.server, t = server.tickCount
    const all = load(server), ids = Object.keys(all)
    for (let i = 0; i < ids.length; i++) {
      var c = CRATES[ids[i]], at = all[ids[i]]
      if (!c) continue
      var near = false
      var ps = server.players
      for (let j = 0; j < ps.size(); j++) {
        var p = ps.get(j)
        if (String(p.level.dimension) !== at.dim) continue
        var dx = p.x - at.x - 0.5, dy = p.y - at.y, dz = p.z - at.z - 0.5
        var d2 = dx * dx + dy * dy + dz * dz
        if (d2 < 48 * 48) near = true
        if (d2 < 5 * 5 && t % 20 === 0)   // "Keys available" for this player, over the hotbar
          run(server, `title ${p.username} actionbar {"text":"${c.name} · Keys available: ${keys(p, ids[i])}","color":"yellow"}`)
      }
      if (!near || c.particles === false) continue
      var x = at.x + 0.5, y = at.y + 0.5, z = at.z + 0.5, a = t * 0.08
      // A ring of light circling the shulker at mid height: 3 "comets" moving round it every tick (a new small
      // pixel a little further round each tick; small pixels fade fast, so each leaves a short tail and you see it
      // move). Each pixel fades from the crate colour to white as it dies.
      var spin = t * 0.28
      for (var k = 0; k < 3; k++) {
        var ang = spin + k * 2.094
        run(server, `execute in ${at.dim} run particle ${fade(c.dust, [1.0, 1.0, 1.0], 1.15)} ${f(x + Math.cos(ang) * 0.9)} ${f(y)} ${f(z + Math.sin(ang) * 0.9)} 0 0 0 0 1 normal`)
      }
      // Spore-blossom style motes in several colours drifting around the crate, plus real spore blossom specks.
      if (t % 2 === 0) {
        var pal = paletteOf(c), col = pal[Math.floor(Math.random() * pal.length)]
        var r3 = 0.6 + Math.random() * 0.9, ang3 = Math.random() * Math.PI * 2
        run(server, `execute in ${at.dim} run particle ${fade(col, pal[(pal.indexOf(col) + 1) % pal.length], 0.9)} ` +
          `${f(x + Math.cos(ang3) * r3)} ${f(y - 0.4 + Math.random() * 1.2)} ${f(z + Math.sin(ang3) * r3)} 0 0 0 0 1 normal`)
      }
      // spore-blossom specks in the crate's own colours (the real spore blossom particle can't be recoloured)
      if (t % 3 === 0) {
        var sp = paletteOf(c)[Math.floor(Math.random() * paletteOf(c).length)]
        run(server, `execute in ${at.dim} run particle ${dust(sp, 0.55)} ${f(x)} ${f(y + 0.2)} ${f(z)} 1.0 0.7 1.0 0 3 normal`)
      }
      if (c.petals && t % 4 === 0) run(server, `execute in ${at.dim} run particle ${c.petals} ${f(x)} ${f(y + 0.9)} ${f(z)} 0.9 0.3 0.9 0 1 normal`)
      if (t % 8 === 0) run(server, `execute in ${at.dim} run particle minecraft:white_ash ${f(x)} ${f(y + 0.8)} ${f(z)} 1.3 0.8 1.3 0 6 normal`)
      if (t % 16 === 0) run(server, `execute in ${at.dim} run particle minecraft:end_rod ${f(x)} ${f(y - 0.6)} ${f(z)} 0.05 0 0.05 0.02 1 normal`)
    }
  })

  // ---------------------------------------------------------------- open
  const roll = (list) => {
    let r = Math.random() * totalWeight(list)
    for (let i = 0; i < list.length; i++) { r -= list[i].weight; if (r <= 0) return list[i] }
    return list[list.length - 1]
  }
  const openCrate = (p, id) => {
    if (isRedeem(id)) { preview(p, id); return }
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
    list.forEach((r, i) => {
      if (!isRedeem(id)) { p.tell(`§7 • ${r.rare ? '§6' : '§f'}${label(p.server, r)} §8(${pctOf(list, r)}%)`); return }
      run(p.server, `tellraw ${p.username} ${JSON.stringify(['', { text: ' • ' + label(p.server, r).replace(/^1x /, '') + ' ', color: 'white' },
        { text: '(' + r.cost + ' keys) ', color: 'gray' },
        { text: '[Redeem]', color: 'green', bold: true, clickEvent: { action: 'run_command', value: `/crate redeem ${id} ${i + 1}` } }])}`)
    })
  }
  const rowsFor = (n) => Math.max(3, Math.min(6, Math.ceil(n / 9) + 1))
  // OG-style menu: rewards in the middle (7 wide, 3 rows = 21 per page), worst to best, with a red/black glass border,
  // a Close button, an Available Keys button and Previous/Next Page arrows on the bottom row.
  const INNER = 7, INNER_ROWS = 3, PER_PAGE = INNER * INNER_ROWS
  const glass = (server, x, y) => {
    var st = Item.of((x + y) % 2 == 0 ? 'minecraft:red_stained_glass_pane' : 'minecraft:black_stained_glass_pane')
    try { st.set(DataComponents.HIDE_TOOLTIP, Java.loadClass('net.minecraft.util.Unit').INSTANCE) } catch (e) { }
    return st
  }
  const button = (id, name, lore) => {
    var st = Item.of(id)
    try {
      var lines = new ArrayList()
      lore.forEach(x => lines.add(line(x)))
      st.set(DataComponents.LORE, new ItemLore(lines))
      st.set(DataComponents.CUSTOM_NAME, line(name))
    } catch (e) { }
    return st
  }
  // worst to best: random crates most common first, redeem crates cheapest first (only the display order changes)
  const displayOrder = (id, list) => list.map((r, i) => ({ r: r, i: i }))
    .sort((a, b) => isRedeem(id) ? (a.r.cost - b.r.cost) || (a.i - b.i) : (b.r.weight - a.r.weight) || (a.i - b.i))
    .map(o => o.r)
  // Read-only: KubeJS chest GUI items can't be taken.
  const preview = (p, id, page) => {
    if (p.openChestGUI === undefined) { previewChat(p, id); return }
    try {
      var all = rewardsOf(p.server, id)
      var list = displayOrder(id, all)
      if (!list.length) p.tell('§7This crate has no rewards yet.' + (p.hasPermissions(2) ? ' §8Staff: /crate edit ' + id : ''))
      var pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
      page = Math.max(0, Math.min(pages - 1, page || 0))
      var shownList = list.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
      var title = CRATES[id].name + ' Rewards' + (pages > 1 ? ' (' + (page + 1) + '/' + pages + ')' : '')
      p.openChestGUI(Text.of(title), 6, gui => {
        gui.playerSlots = true
        var setReward = (slot, r) => {
          if (isRedeem(id)) {
            var have = keys(p, id), ok = have >= r.cost
            slot.item = shown(p.server, r, [`§fRequired Keys: §e${r.cost}`, `§7You have: ${ok ? '§a' : '§c'}${have}`,
              ok ? '§eLeft-click§7: redeem this reward' : '§cYou need more ' + (CRATES[id].keyName || 'keys') + 's'])
            // KubeJS takes your items out while its menu is open and puts them back after it closes, so close the
            // menu, wait for the items to come back, then redeem and reopen.
            slot.leftClicked = e => {
              pendingRedeem[p.username] = { p: p, id: id, r: r, page: page, closedTicks: 0 }
              try { p.closeMenu() } catch (x) { }   // KubeJS's name for closing the open menu
            }
          } else {
            slot.item = shown(p.server, r, [`§eChance: ${pctOf(all, r)}%`].concat(r.rare ? ['§6§lRARE'] : []))
          }
        }
        for (var y = 0; y < 6; y++) for (var x = 0; x < 9; x++) {
          (function (xx, yy) {
            var inside = xx >= 1 && xx <= INNER && yy >= 1 && yy <= INNER_ROWS
            var i = inside ? (yy - 1) * INNER + (xx - 1) : -1
            gui.slot(xx, yy, slot => {
              if (i >= 0 && i < shownList.length) setReward(slot, shownList[i])
              else slot.item = glass(p.server, xx, yy)
            })
          })(x, y)
        }
        gui.slot(4, 5, slot => {
          slot.item = button('minecraft:barrier', '§c§lClose Menu', ['§7Click here to close this menu.', '', '§6§lLEFT-CLICK: §eCLOSE MENU'])
          slot.leftClicked = e => { try { p.closeMenu() } catch (x) { } }
        })
        var have = keys(p, id)
        gui.slot(6, 5, slot => {
          slot.item = button('minecraft:tripwire_hook', '§a§lAvailable Keys', ['§7All the keys you can use on this crate.', '',
            '§fKeys: ' + (have > 0 ? '§a' + have + ' ' + (CRATES[id].keyName || 'Key') + (have == 1 ? '' : 's') : '§cYou have no keys for this crate.')])
        })
        // page arrows: close this menu, wait for KubeJS to give the player's items back, then open the other page
        // (same safe way as redeeming, see pendingRedeem below)
        if (page > 0) gui.slot(0, 5, slot => {
          slot.item = button('minecraft:arrow', '§e§lPrevious Page', ['§7Page ' + page + ' of ' + pages])
          slot.leftClicked = e => { pendingRedeem[p.username] = { p: p, id: id, page: page - 1, closedTicks: 0 }; try { p.closeMenu() } catch (x) { } }
        })
        if (page < pages - 1) gui.slot(8, 5, slot => {
          slot.item = button('minecraft:arrow', '§e§lNext Page', ['§7Page ' + (page + 2) + ' of ' + pages])
          slot.leftClicked = e => { pendingRedeem[p.username] = { p: p, id: id, page: page + 1, closedTicks: 0 }; try { p.closeMenu() } catch (x) { } }
        })
      })
    } catch (e) {
      console.warn('[OVERTHRONE crates] preview menu failed, using chat: ' + e)
      if (p.hasPermissions(2)) p.tell('§c[crates] preview menu failed: ' + e)
      previewChat(p, id)
    }
  }
  // KubeJS takes your items out while its menu is open and puts them back a tick after it closes. So a redeem
  // click is queued, the menu is closed, and the redeem runs once the menu has been shut for 2 ticks.
  const pendingRedeem = {}
  // A menu is open when the player's current menu isn't their normal inventory.
  const inKubeMenu = (p) => { try { return !p.containerMenu.equals(p.inventoryMenu) } catch (e) { return false } }
  ServerEvents.tick(event => {
    var names = Object.keys(pendingRedeem)
    for (var i = 0; i < names.length; i++) {
      var job = pendingRedeem[names[i]]
      if (inKubeMenu(job.p)) { job.closedTicks = 0; continue }
      if (++job.closedTicks < 2) continue
      delete pendingRedeem[names[i]]
      try { if (job.r) redeem(job.p, job.id, job.r); preview(job.p, job.id, job.page || 0) } catch (e) { console.error('[OVERTHRONE crates] redeem failed: ' + e) }
    }
  })

  // Redeem crates: pay the key cost, get the item.
  const redeem = (p, id, r) => {
    var c = CRATES[id], n = p.username, server = p.server
    if (keys(p, id) < r.cost) {
      p.tell(`§c§lCrates §7» You need §f${r.cost} ${c.keyName}s§7 for that (you have ${keys(p, id)}). §e${c.keyHint}`)
      run(server, `execute at ${n} run playsound minecraft:block.note_block.bass player ${n} ~ ~ ~ 1 0.6`)
      return
    }
    takeKeys(p, id, r.cost)
    p.give(stackOf(server, r).copy())
    var what = label(server, r).replace(/^1x /, '')
    run(server, `title ${n} times 5 40 10`)
    run(server, `title ${n} subtitle ${JSON.stringify({ text: what, color: 'gold' })}`)
    run(server, `title ${n} title ${JSON.stringify({ text: c.name, color: HOLO_COLORS[c.color] || 'gold', bold: true })}`)
    run(server, `execute at ${n} run playsound minecraft:entity.player.levelup player ${n} ~ ~ ~ 0.8 1.3`)
    p.tell(`§a§lCrates §7» You redeemed §f${what} §7for ${r.cost} keys. §8Keys left: ${keys(p, id)}`)
  }

  // Staff editor: 5 rows of rewards + your inventory. Every change is saved straight away.
  const editor = (p, id) => {
    var server = p.server, list = rewardsOf(server, id)
    var changed = () => { saveEdited(server); editor(p, id) }
    p.openChestGUI(Text.of('Edit: ' + CRATES[id].name), 6, gui => {
      gui.playerSlots = true
      list.slice(0, 45).forEach((r, i) => gui.slot(i % 9, Math.floor(i / 9), slot => {
        if (isRedeem(id)) {
          slot.item = shown(server, r, [`§fRequired Keys: §e${r.cost}`,
            '§aLeft-click§7: cost +1  §cRight-click§7: cost -1', '§4Shift-right§7: remove'])
          slot.leftClicked = e => { r.cost += 1; changed() }
          slot.rightClicked = e => { r.cost = Math.max(1, r.cost - 1); changed() }
          slot.shiftRightClicked = e => { list.splice(i, 1); changed() }
          return
        }
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
        list.push({ snbt: toSnbt(server, st.copy()), weight: 10, cost: 3, rare: false })
        p.tell('§a[crates] Added ' + st.count + 'x ' + String(st.getHoverName().getString()) + (isRedeem(id) ? ' (costs 3 keys).' : ' (weight 10).'))
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
  // Crate clicks: block the vanilla action first (cancel), and run the crate a tick later. That way the shulker
  // never opens or breaks, even if something in the crate code fails (errors go to staff chat + server log).
  const later = (p, what, fn) => {
    var go = () => { try { fn() } catch (e) {
      console.error('[OVERTHRONE crates] ' + what + ' failed: ' + e)
      try { if (p.hasPermissions(2)) p.tell('§c[crates] ' + what + ' failed: ' + e) } catch (e2) { }
    } }
    try { p.server.scheduleInTicks(1, () => go()) } catch (e) { go() }
  }
  BlockEvents.rightClicked(event => {
    var p = event.player, id = null
    try { id = crateAt(serverOf(event), event.block) } catch (e) { console.error('[OVERTHRONE crates] ' + e) }
    if (!id) { try { if (String(event.hand) === 'MAIN_HAND') explainMiss(event) } catch (e) { } return }
    if (debounce(p)) {
      var sneak = p.isShiftKeyDown()
      later(p, 'opening', () => { if (sneak) preview(p, id); else openCrate(p, id) })
    }
    event.cancel()   // don't open the shulker box itself (must be last: cancel ends the handler)
  })
  BlockEvents.leftClicked(event => {
    var p = event.player, id = null
    try { id = crateAt(serverOf(event), event.block) } catch (e) { }
    if (!id) return
    if (debounce(p)) later(p, 'preview', () => preview(p, id))
    event.cancel()
  })
  BlockEvents.broken(event => {
    var p = event.player
    if (!p) return
    var id = null
    try { id = crateAt(serverOf(event), event.block) } catch (e) { }
    if (!id) return
    if (p.hasPermissions(2) && p.isShiftKeyDown()) return   // staff: sneak + break really breaks it
    // In creative a left-click breaks instantly, so treat it as a preview click.
    if (debounce(p)) later(p, 'preview', () => preview(p, id))
    event.cancel()
  })

  // ---------------------------------------------------------------- commands
  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    const reply = (ctx, m) => ctx.source.sendSystemMessage(Text.of(m))
    const crateArg = () => Commands.argument('crate', StringArg.word())
    const crateOf = (ctx) => String(StringArg.getString(ctx, 'crate')).toLowerCase()
    const known = (ctx, id) => { if (CRATES[id]) return true; reply(ctx, '§cUnknown crate. Crates: ' + Object.keys(CRATES).join(', ')); return false }
    const staff = src => src.hasPermission(2)
    // CRATES INFO board: <height> blocks above your feet (default 3). It stays still (doesn't turn to follow
    // players) and faces the way you're looking, like a sign. Full brightness (glows in the dark) and a dark
    // background so it's easy to read. /crate infoboard flip turns it round if it shows backwards.
    const placeInfoBoard = (ctx, height) => {
      const p = ctx.source.playerOrException, server = p.server
      run(server, 'kill @e[type=minecraft:text_display,tag=ot_crate_infoboard]')
      var comp = ['']
      INFO_BOARD.forEach((l, i) => { comp.push(Object.assign({}, l, { text: (i ? '\n' : '') + l.text })) })
      // Inside the command the text is a quoted string, where Minecraft only accepts \\ and \' escapes:
      // so the JSON's own backslashes (the \n line breaks) must be doubled first, then quotes escaped.
      var json = JSON.stringify(comp).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      run(server, `execute in ${p.level.dimension} run summon minecraft:text_display ${f(p.x)} ${f(p.y + Math.max(0, height))} ${f(p.z)} ` +
        `{Tags:["ot_crate_infoboard"],Rotation:[${f(p.yaw)}f,0f],billboard:"fixed",alignment:"center",shadow:1b,line_width:400,background:-1325400064,` +
        `brightness:{sky:15,block:15},transformation:[1.6f,0f,0f,0f,0f,1.6f,0f,0f,0f,0f,1.6f,0f,0f,0f,0f,1f],text:'${json}'}`)
      reply(ctx, `§aCrates info board placed ${height} blocks above you. §7(/crate infoboard place <height> to move it, /crate infoboard remove to take it down)`)
      return 1
    }
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
        // Use the block you're LOOKING at (within 6 blocks); if none, the block you're standing on.
        var hit = null
        try { var rt = p.rayTrace(6, false); if (rt && rt.block) hit = rt.block } catch (e) { hit = null }
        var bx, by, bz, what
        if (hit) { bx = Number(hit.x); by = Number(hit.y); bz = Number(hit.z); what = String(hit.id) }
        else { bx = Math.floor(p.x); by = Math.floor(p.y - 0.2); bz = Math.floor(p.z); what = 'the block under you' }
        all[id] = { x: bx, y: by, z: bz, dim: String(p.level.dimension) }
        save(p.server); placeHologram(p.server, id)
        reply(ctx, `§a✦ ${CRATES[id].name} set on ${what} at ${bx} ${by} ${bz}.`); return 1
      })))
      .then(Commands.literal('remove').requires(staff).then(crateArg().executes(ctx => {
        const id = crateOf(ctx), all = load(ctx.source.server)
        run(ctx.source.server, `kill @e[type=minecraft:text_display,tag=ot_crate_${id}]`)
        delete all[id]; save(ctx.source.server)
        reply(ctx, `§eRemoved crate ${id}.`); return 1
      })))
      .then(Commands.literal('redeem').then(crateArg().then(Commands.argument('number', Arguments.INTEGER.create(event)).executes(ctx => {
        const p = ctx.source.playerOrException, id = crateOf(ctx)
        if (!known(ctx, id) || !isRedeem(id)) return 0
        const r = rewardsOf(p.server, id)[Arguments.INTEGER.getResult(ctx, 'number') - 1]
        if (!r) { reply(ctx, '§cNo reward with that number.'); return 0 }
        redeem(p, id, r); return 1
      }))))
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
          list.forEach((r, i) => reply(ctx, `§8${i + 1}. ${r.rare ? '§6' : '§f'}${label(ctx.source.server, r)} §7` +
            (isRedeem(id) ? `costs ${r.cost} keys` : `${pctOf(list, r)}% §8(weight ${r.weight})`)))
          return 1
        })))
        .then(Commands.literal('reset').then(crateArg().executes(ctx => {
          const id = crateOf(ctx)
          if (!known(ctx, id)) return 0
          loadEdited(ctx.source.server)[id] = defaults(id); saveEdited(ctx.source.server)
          reply(ctx, `§eRewards for ${id} reset to the defaults.`); return 1
        })))
        .then(Commands.literal('claimblocks').then(crateArg().then(Commands.argument('weight', Arguments.INTEGER.create(event))
          .then(Commands.argument('amount', Arguments.INTEGER.create(event)).executes(ctx => {
            const id = crateOf(ctx)
            if (!known(ctx, id)) return 0
            const n = Math.max(1, Arguments.INTEGER.getResult(ctx, 'amount'))
            const r = { cmd: 'flan giveClaimBlocks {p} ' + n, weight: Math.max(1, Arguments.INTEGER.getResult(ctx, 'weight')), rare: false,
              icon: 'minecraft:grass_block', name: String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' Claim Blocks' }
            rewardsOf(ctx.source.server, id).push(r); saveEdited(ctx.source.server)
            reply(ctx, `§aAdded "${r.name}" to ${id} (weight ${r.weight}).`); return 1
          })))))
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
      .then(Commands.literal('infoboard').requires(staff)
        .then(Commands.literal('place')
          .executes(ctx => placeInfoBoard(ctx, 3))
          .then(Commands.argument('height', Arguments.INTEGER.create(event)).executes(ctx => placeInfoBoard(ctx, Arguments.INTEGER.getResult(ctx, 'height')))))
        .then(Commands.literal('flip').executes(ctx => {
          run(ctx.source.server, 'execute as @e[type=minecraft:text_display,tag=ot_crate_infoboard] at @s run tp @s ~ ~ ~ ~180 0')
          reply(ctx, '§aCrates info board turned round.'); return 1
        }))
        .then(Commands.literal('remove').executes(ctx => {
          run(ctx.source.server, 'kill @e[type=minecraft:text_display,tag=ot_crate_infoboard]')
          reply(ctx, '§eCrates info board removed.'); return 1
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
