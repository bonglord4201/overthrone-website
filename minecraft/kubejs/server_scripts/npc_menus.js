// OVERTHRONE - NPCs that open real menus (OG Network style): Throne Shop, Kit Selector, Level Guide, Links,
// plus "command NPCs" that run a command for the player (e.g. /warp hunters, /ah).
//
// Staff (op):
//   /npcmenu spawn <throneshop|kits|levels|links>       new NPC where you stand, glowing, with a hologram above it
//   /npcmenu spawncmd <title> <command...>         new NPC that runs <command> for the player who clicks it
//                                                  e.g. /npcmenu spawncmd Hunters warp hunters
//   /npcmenu attach <throneshop|kits|levels|links>       give the NPC you are LOOKING AT this menu (keeps its skin/spot)
//   /npcmenu attachcmd <command...>                the NPC you are looking at runs this command when clicked
//   /npcmenu detach                                the NPC you are looking at goes back to normal
//   /npcmenu fixall                                hides the NPC name tags + redoes all menu holograms in your world
//   /npcmenu grab, then /npcmenu put   moves the NPC you looked at to where you stand (hologram too)
//   /npcmenu remove                                deletes the menu NPC you are looking at (and its hologram)
//   /npcmenu hologram <text...>                    (re)places the hologram over the NPC you are looking at.
//                                                  Use | for a new line, e.g. /npcmenu hologram &6&lJOBS|&7Right-click
// Players can also open the menus with commands: /throneshop  /kitmenu  /levelguide
// Bought cosmetics: /tags (chat tag)  /namecolor (name colour)  /flytime (flight on/off)
//
// Throne Shop balance: the shop reads your Throne Shards from the same placeholder your sidebar uses
// (the line with "SHARD" in config/serversetup/scoreboard.json) and takes them with "shards take".
//   /throneshop debug                (op) shows what the shop reads as your balance
//   /throneshop placeholder <text>   (op) set the balance placeholder by hand if the auto-detect is wrong

(function () {
  // ======================================================================= settings
  const TAKE_SHARDS = 'shards take {p} {n}'
  const STORE_URL = 'https://overthronesmp.tebex.store'
  const RANK_ORDER = ['ronin', 'valkyrie', 'monarch', 'godborn', 'overlord']
  const RANK_INFO = {
    ronin: { name: 'Ronin', color: '#E0434F', c: '&c', candle: 'minecraft:red_candle' },
    valkyrie: { name: 'Valkyrie', color: '#C04DFF', c: '&d', candle: 'minecraft:purple_candle' },
    monarch: { name: 'Monarch', color: '#E6B85C', c: '&6', candle: 'minecraft:yellow_candle' },
    godborn: { name: 'Godborn', color: '#F3E2B0', c: '&e', candle: 'minecraft:white_candle' },
    overlord: { name: 'Overlord', color: '#FF3B2F', c: '&4', candle: 'minecraft:orange_candle' },
  }
  const KIT_COOLDOWN_HOURS = 120   // must match kit_cooldown.js
  const FLY_BLOCKED_WORLDS = []    // world ids where bought flight doesn't work, e.g. ['multiworld:arena']

  // Rank perks shown in the shop (from the rank comparison on the store)
  const RANK_PERKS = {
    ronin: ['[RONIN] Prefix in Chat & Tab', 'View In-Game Chat on Discord', 'Colours in Books', '1x Class Reset Token on Purchase',
      'Create up to 100 Chest Shops', 'Create Double-Chest Shops', 'Access to 5 Auction House Slots', 'Access to Premium Jobs',
      '1 Active Job', 'Create up to 2 Homes', 'Access to 1 Player Vault (/vault)', 'Access to 3 Reset Vaults', 'Access to Ronin Kit (/kits)',
      'Mine Spawners with Silk Touch', '/craft /furnace /recipe /seen /ptime /pweather'],
    valkyrie: ['[VALKYRIE] Prefix in Chat & Tab', 'Show Items in Chat', 'Sign Formatting', 'Coloured Item Names in Anvils',
      '2x Class Reset Tokens on Purchase', 'Create up to 200 Chest Shops', 'Access to 7 Auction House Slots', '2 Active Jobs',
      'Create up to 3 Homes', 'Access to 2 Player Vaults', 'Access to 5 Reset Vaults', 'Create 1 Player Warp', 'Access to Valkyrie Kit (/kits)',
      '/enchantable /grindstone /stonecutter /loom', '/cartographytable /smithingtable /firstjoin'],
    monarch: ['[MONARCH] Prefix in Chat & Tab', '3x Class Reset Tokens on Purchase', 'Create up to 300 Chest Shops',
      'Access to 9 Auction House Slots', '3 Active Jobs', 'Create up to 4 Homes', 'Access to 3 Player Vaults', 'Access to 7 Reset Vaults',
      'Create up to 2 Player Warps', 'Access to Monarch Kit (/kits)', 'Mine Spawners without Silk Touch', '/anvil /echest'],
    godborn: ['[GODBORN] Prefix in Chat & Tab', '4x Class Reset Tokens on Purchase', 'Create up to 500 Chest Shops',
      'Remote Chest Shops (50 Blocks)', 'Access to 11 Auction House Slots', '4 Active Jobs', 'Create up to 5 Homes', 'Access to 5 Player Vaults',
      'Access to 9 Reset Vaults', 'Create up to 3 Player Warps', 'Access to Godborn Kit (/kits)',
      '/disposal /clearinventory /bal <player> /near', '/tprequest /rename /eglow'],
    overlord: ['[OVERLORD] Prefix in Chat & Tab', 'Custom Chat Formatting', '5x Class Reset Tokens on Purchase', '2 Classes & Abilities at Once',
      'Keep EXP on Death', 'Unlimited Chest Shops', 'Remote Chest Shops (200 Blocks)', 'Access to 15 Auction House Slots', '5 Active Jobs',
      'Create up to 6 Homes', 'Access to 7 Player Vaults', 'Access to 12 Reset Vaults', 'Create up to 4 Player Warps',
      'Access to Overlord Kit (/kits)', 'Customise Armor Stands', '/inv <player> /nick /color /me', '/hat /afk /sit /lay'],
  }

  // Rank commands with what they do (shown on the Commands sign in the shop)
  const RANK_CMDS = {
    ronin: [['/craft', 'open a crafting table'], ['/furnace', 'open a furnace'], ['/recipe', 'view an item\'s recipe'], ['/seen', 'view a player\'s last login'], ['/ptime', 'change the time for yourself'], ['/pweather', 'change the weather for yourself']],
    valkyrie: [['/enchantable', 'see what an item can be enchanted with'], ['/grindstone', 'open a grindstone'], ['/stonecutter', 'open a stonecutter'], ['/loom', 'open a loom'], ['/cartographytable', 'open a cartography table'], ['/smithingtable', 'open a smithing table'], ['/firstjoin', 'see when a player first joined']],
    monarch: [['/anvil', 'open an anvil'], ['/echest', 'open your ender chest']],
    godborn: [['/bal <player>', 'view another player\'s balance'], ['/disposal', 'open a trash menu'], ['/clearinventory', 'clear your inventory'], ['/rename', 'rename the item in your hand'], ['/tprequest', 'request to teleport to a player'], ['/near', 'see players near you'], ['/eglow', 'make yourself glow']],
    overlord: [['/inv <player>', 'view another player\'s inventory'], ['/nick', 'change your display name'], ['/color', 'change your chat colour'], ['/me', 'send an action message'], ['/hat', 'wear the item you\'re holding'], ['/afk', 'set yourself as AFK'], ['/sit', 'sit down'], ['/lay', 'lay down']],
  }

  // Chat tags (shown before your name in chat). Price in Throne Shards.
  const TAGS = [
    ['heart', '&c❤', 399], ['star', '&e★', 399], ['crown', '&6♔', 399], ['skull', '&7☠', 399], ['swords', '&b⚔', 399],
    ['flower', '&d✿', 399], ['bolt', '&e⚡', 399], ['snow', '&b❄', 399], ['music', '&a♫', 399], ['sun', '&6☀', 399],
    ['hunter', '&aHunter', 499], ['warlord', '&cWarlord', 499], ['kingslayer', '&6Kingslayer', 499], ['voidwalker', '&5Voidwalker', 499],
    ['bloodborne', '&4Bloodborne', 499], ['frostbound', '&bFrostbound', 499], ['arcanist', '&dArcanist', 499], ['shadow', '&8Shadow', 499],
    ['leviathan', '&9Leviathan', 499], ['dragonslayer', '&cDragonslayer', 499], ['throneguard', '&6Throneguard', 499], ['ghost', '&fGhost', 499],
  ]
  // Name colours (your name's colour in chat). Price in Throne Shards.
  const NAME_COLORS = [
    ['red', '&c', 'Red', 'minecraft:red_dye'], ['dark_red', '&4', 'Dark Red', 'minecraft:red_wool'], ['gold', '&6', 'Gold', 'minecraft:orange_dye'],
    ['yellow', '&e', 'Yellow', 'minecraft:yellow_dye'], ['green', '&a', 'Green', 'minecraft:lime_dye'], ['dark_green', '&2', 'Dark Green', 'minecraft:green_dye'],
    ['aqua', '&b', 'Aqua', 'minecraft:light_blue_dye'], ['dark_aqua', '&3', 'Dark Aqua', 'minecraft:cyan_dye'], ['blue', '&9', 'Blue', 'minecraft:blue_dye'],
    ['dark_blue', '&1', 'Dark Blue', 'minecraft:blue_wool'], ['pink', '&d', 'Pink', 'minecraft:pink_dye'], ['purple', '&5', 'Purple', 'minecraft:purple_dye'],
    ['white', '&f', 'White', 'minecraft:white_dye'], ['gray', '&7', 'Gray', 'minecraft:light_gray_dye'],
  ]
  const NAME_COLOR_PRICE = 650

  // Throne Shop. Categories hold items or more categories. Item "give" types:
  //   rank / key / tag / namecolor / fly (seconds) / cmd (commands, {p} = player)
  const keyItems = (id, label, color, one) => [
    { icon: 'minecraft:tripwire_hook', name: color + label, detail: '1x', price: one, give: { type: 'key', crate: id, n: 1 } },
    { icon: 'minecraft:tripwire_hook', name: color + label, detail: '5x', price: Math.round(one * 4.5), give: { type: 'key', crate: id, n: 5 } },
    { icon: 'minecraft:tripwire_hook', name: color + label, detail: '10x', price: Math.round(one * 8.5), give: { type: 'key', crate: id, n: 10 } },
    { icon: 'minecraft:tripwire_hook', name: color + label, detail: '25x', price: Math.round(one * 20), give: { type: 'key', crate: id, n: 25 } },
  ]
  const SHOP = {
    name: 'Throne Shop',
    children: [
      {
        slot: [1, 1], icon: 'minecraft:book', name: '&d&lRANKS', kind: 'COSMETIC',
        desc: ['Ranks are special player roles', 'that grant exclusive permissions,', 'features and commands.', '', 'They also give you a flashy prefix', 'to show off to other players.'],
        layout: 'ranks',
        children: RANK_ORDER.map((r, i) => {
          var I = RANK_INFO[r], prev = i ? RANK_INFO[RANK_ORDER[i - 1]] : null
          return {
            icon: ['minecraft:red_concrete', 'minecraft:purple_concrete', 'minecraft:yellow_concrete', 'minecraft:white_concrete', 'minecraft:redstone_block'][i],
            name: I.c + '&l[' + I.name + ']&f Rank', detail: 'Permanent', price: [2999, 5999, 9999, 14999, 19999][i], give: { type: 'rank', rank: r },
            perksName: I.c + '&l' + I.name + ' Perks', perksSub: prev ? '&d&lALL ' + prev.name.toUpperCase() + ' PERKS, AND:' : '',
            perks: RANK_PERKS[r].filter(l => l.charAt(0) != '/'),
            cmdsName: I.c + '&l' + I.name + ' Commands', cmdsSub: prev ? '&d&lALL ' + prev.name.toUpperCase() + ' COMMANDS, AND:' : '',
            cmds: RANK_CMDS[r],
          }
        }),
      },
      {
        slot: [3, 1], icon: 'minecraft:dark_oak_hanging_sign', name: '&a&lMESSAGE COSMETICS', kind: 'COSMETIC',
        desc: ['Message cosmetics include tags', 'that go before your username and', 'rank in chat.', '', 'Equip them with &e/tags&f.'],
        children: [
          {
            icon: 'minecraft:name_tag', name: '&b&lCHAT TAGS', layout: 'grid',
            children: TAGS.map(t => ({ icon: 'minecraft:name_tag', name: t[1] + (t[1].length > 4 ? '' : '&f Tag'), tagShow: t[1], detail: 'Apply using /tags', price: t[2], give: { type: 'tag', id: t[0] } })),
          },
          { icon: 'minecraft:oak_sign', name: '&e&lJOIN MESSAGES', soon: true },
        ],
      },
      {
        slot: [5, 1], icon: 'minecraft:amethyst_cluster', name: '&5&lCOLORS & GRADIENTS', kind: 'COSMETIC',
        desc: ['Name colors change how your name', 'is shown in chat.', '', 'Equip them with &e/namecolor&f.'],
        children: [
          {
            icon: 'minecraft:name_tag', name: '&a&lNAME COLORS', layout: 'grid',
            children: NAME_COLORS.map(c => ({ icon: c[3], name: c[1] + c[2] + ' Name Color', detail: 'Apply using /namecolor', price: NAME_COLOR_PRICE, give: { type: 'namecolor', id: c[0] } })),
          },
        ],
      },
      {
        slot: [7, 1], icon: 'minecraft:tripwire_hook', name: '&6&lCRATE KEYS', kind: 'ITEM',
        desc: ['Keys for the crates at spawn.', 'Paid keys are non-RNG: you pick', 'the reward you want!'],
        layout: 'spaced',
        children: [
          { icon: 'minecraft:lime_shulker_box', name: '&a&lVote Crate Keys', layout: 'spaced', children: keyItems('vote', 'Vote Crate Key', '&a&l', 100) },
          { icon: 'minecraft:cyan_shulker_box', name: '&b&lRune Crate Keys', layout: 'spaced', children: keyItems('runes', 'Rune Crate Key', '&b&l', 120) },
          { icon: 'minecraft:magenta_shulker_box', name: '&d&lArmor Crate Keys', layout: 'spaced', children: keyItems('armor', 'Armor Crate Key', '&d&l', 150) },
          { icon: 'minecraft:orange_shulker_box', name: '&6&lWeapon Crate Keys', layout: 'spaced', children: keyItems('weapon', 'Weapon Crate Key', '&6&l', 150) },
        ],
      },
      {
        slot: [1, 3], icon: 'minecraft:feather', name: '&f&lFLIGHT TIME', kind: 'VIRTUAL ITEM',
        desc: ['Want to fly into the skies to', 'help build or get out of sticky', 'situations with monsters? Flight', 'gives you the creative mode fly', 'ability.', '', 'Turn it on and off with &e/flytime&f.', 'Time only counts down while you fly.'],
        layout: 'spaced',
        children: [
          { icon: 'minecraft:feather', name: '&f&lFlight Time', detail: '30 minutes', price: 50, give: { type: 'fly', seconds: 1800 } },
          { icon: 'minecraft:feather', name: '&f&lFlight Time', detail: '1 hour', price: 100, give: { type: 'fly', seconds: 3600 } },
          { icon: 'minecraft:feather', name: '&f&lFlight Time', detail: '3 hours', price: 275, give: { type: 'fly', seconds: 10800 } },
          { icon: 'minecraft:feather', name: '&f&lFlight Time', detail: '6 hours', price: 500, give: { type: 'fly', seconds: 21600 } },
        ],
      },
      { slot: [3, 3], icon: 'minecraft:golden_shovel', name: '&a&lCLAIM BLOCKS', kind: 'VIRTUAL ITEM', desc: ['Claim blocks help protect your', 'builds and homes from other', 'players.'], soon: true },
      { slot: [5, 3], icon: 'minecraft:black_shulker_box', name: '&b&lAUTOSELL CHESTS', kind: 'ITEM', desc: ['Sell the contents of a chest to', 'the server shop automatically.'], soon: true },
      { slot: [7, 3], icon: 'minecraft:ender_chest', name: '&d&lLOOTBOXES', kind: 'ITEM', desc: ['Lootboxes contain exclusive tags,', 'runes, spawners and more.'], soon: true },
    ],
  }

  // ======================================================================= helpers
  const DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
  const ItemLore = Java.loadClass('net.minecraft.world.item.component.ItemLore')
  const ArrayList = Java.loadClass('java.util.ArrayList')
  const Placeholders = (() => { try { return Java.loadClass('com.zerog.neoessentials.api.PlaceholderAPI') } catch (e) { return null } })()

  // "&#FF0000&lText &7more" -> text component (& colour codes, &#RRGGBB, &l bold), built from vanilla parts
  const Comp = Java.loadClass('net.minecraft.network.chat.Component')
  const Style = Java.loadClass('net.minecraft.network.chat.Style')
  const TextColor = Java.loadClass('net.minecraft.network.chat.TextColor')
  const RGB = { black: 0x000000, dark_blue: 0x0000AA, dark_green: 0x00AA00, dark_aqua: 0x00AAAA, dark_red: 0xAA0000, dark_purple: 0xAA00AA,
    gold: 0xFFAA00, gray: 0xAAAAAA, dark_gray: 0x555555, blue: 0x5555FF, green: 0x55FF55, aqua: 0x55FFFF, red: 0xFF5555,
    light_purple: 0xFF55FF, yellow: 0xFFFF55, white: 0xFFFFFF }
  const LEGACY = { black: '0', dark_blue: '1', dark_green: '2', dark_aqua: '3', dark_red: '4', dark_purple: '5', gold: '6', gray: '7',
    dark_gray: '8', blue: '9', green: 'a', aqua: 'b', red: 'c', light_purple: 'd', yellow: 'e', white: 'f' }
  // nearest of the 16 chat colours for a #RRGGBB colour
  const nearest = (hex) => {
    var v = parseInt(hex.substring(1), 16), r = v >> 16 & 255, g = v >> 8 & 255, b = v & 255, best = 'f', bd = 1e9
    Object.keys(RGB).forEach(k => {
      var c = RGB[k], d = Math.pow(r - (c >> 16 & 255), 2) + Math.pow(g - (c >> 8 & 255), 2) + Math.pow(b - (c & 255), 2)
      if (d < bd) { bd = d; best = LEGACY[k] }
    })
    return best
  }
  const legacy = (s) => String(s).replace(/&#([0-9a-fA-F]{6})/g, (m, h) => '&' + nearest('#' + h)).replace(/&([0-9a-fk-or])/gi, '§$1')
  const comp = (s) => { var c = Text.of(legacy(s)); try { c = c.italic(false) } catch (e) { } return c }
  const icon = (server, id, name, lore, glint) => {
    var st = Item.of(id)
    try {
      st.set(DataComponents.CUSTOM_NAME, comp(name))
      var lines = new ArrayList()
      ;(lore || []).forEach(l => lines.add(comp(l == '' ? ' ' : '&7' + l)))
      st.set(DataComponents.LORE, new ItemLore(lines))
      if (glint) st.set(DataComponents.ENCHANTMENT_GLINT_OVERRIDE, true)
    } catch (e) { console.warn('[npc_menus] icon: ' + e) }
    return st
  }
  const fmt = (n) => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const dur = (ms) => {
    var s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60)
    return (d ? d + 'd ' : '') + (d || h ? h + 'h ' : '') + m + 'm ' + (s % 60) + 's'
  }
  const run = (server, cmd) => server.runCommandSilent(cmd)
  const asPlayer = (p, cmd) => run(p.server, `execute as ${p.username} at @s run ${cmd}`)

  // KubeJS takes your inventory out while its chest menu is open and puts it back a tick after it closes.
  // So anything that gives items, or opens another menu, is queued: close the menu, wait 2 ticks, then run it.
  const pending = {}
  const inKubeMenu = (p) => { try { return !p.containerMenu.equals(p.inventoryMenu) } catch (e) { return false } }
  const after = (p, fn) => {
    pending[p.username] = { p: p, fn: fn, ticks: 0 }
    try { p.closeMenu() } catch (x) { }
  }
  ServerEvents.tick(event => {
    var names = Object.keys(pending)
    for (var i = 0; i < names.length; i++) {
      var job = pending[names[i]]
      if (inKubeMenu(job.p)) { job.ticks = 0; continue }
      job.ticks++
      if (job.ticks < 2) continue
      delete pending[names[i]]
      try { job.fn() } catch (e) { console.error('[npc_menus] ' + e) }
    }
  })

  // grey glass background, OG style
  const fill = (gui, server, rows) => {
    for (var y = 0; y < rows; y++) for (var x = 0; x < 9; x++) {
      (function (xx, yy) { gui.slot(xx, yy, s => { s.item = pane(server, 'minecraft:gray_stained_glass_pane') }) })(x, y)
    }
  }
  const at = (i) => [i % 9, Math.floor(i / 9)]

  // ======================================================================= ranks
  const ranksOf = (p) => {
    var ids = []
    try {
      Java.loadClass('dev.ftb.mods.ftbranks.api.FTBRanksAPI').manager().getRanks(p).forEach(r => ids.push(String(r.getId())))
    } catch (e) { }
    return ids
  }
  const topRankIndex = (p) => {
    var ids = ranksOf(p), best = -1
    RANK_ORDER.forEach((r, i) => { if (ids.indexOf(r) >= 0 && i > best) best = i })
    return best
  }

  // ======================================================================= Throne Shards balance
  const store = (server) => server.persistentData
  const balancePlaceholder = (server) => {
    var manual = String(store(server).getString('ot_shard_placeholder') || '')
    if (manual) return manual
    try {
      var cfg = typeof ssReadJson == 'function' ? ssReadJson('config/serversetup/scoreboard.json', null) : null
      var lines = cfg == null ? [] : (cfg.lines || [])
      for (var i = 0; i < lines.length; i++) {
        var l = String(lines[i])
        if (/shard/i.test(l)) {
          var m = l.match(/%[^%\s]+%/) || l.match(/\{[^}\s]+\}/)
          if (m) return m[0]
        }
      }
    } catch (e) { }
    return ''
  }
  // returns { ok, value, exact, raw }
  const shardsOf = (p) => {
    var ph = balancePlaceholder(p.server)
    if (!ph || Placeholders == null) return { ok: false, raw: ph ? '(no placeholder mod)' : '(no placeholder found)' }
    var raw = ''
    try { raw = String(Placeholders.setPlaceholders(p, ph)) } catch (e) { return { ok: false, raw: String(e) } }
    var clean = raw.replace(/§./g, '').replace(/&[0-9a-fk-or]/gi, '').replace(/[,\s$]/g, '')
    var m = clean.match(/^(-?\d+(?:\.\d+)?)([kKmMbB]?)$/)
    if (!m || raw == ph) return { ok: false, raw: raw }
    var mult = { '': 1, k: 1e3, m: 1e6, b: 1e9 }[m[2].toLowerCase()]
    return { ok: true, value: Number(m[1]) * mult, exact: m[2] == '', raw: raw }
  }

  // ======================================================================= Throne Shop
  const strip = (s) => String(s).replace(/&#[0-9a-fA-F]{6}|&./g, '')
  const owned = (p) => String(p.persistentData.getString('ot_owned') || '').split(',').filter(x => x)
  const owns = (p, id) => owned(p).indexOf(id) >= 0
  const addOwned = (p, id) => { var o = owned(p); if (o.indexOf(id) < 0) { o.push(id); p.persistentData.putString('ot_owned', o.join(',')) } }
  const isOwned = (p, it) => {
    var g = it.give || {}
    if (g.type == 'rank') return RANK_ORDER.indexOf(g.rank) <= topRankIndex(p)
    if (g.type == 'tag') return owns(p, 'tag:' + g.id)
    if (g.type == 'namecolor') return owns(p, 'nc:' + g.id)
    return false
  }
  const balanceIcon = (s, bal) => icon(s, 'minecraft:amethyst_shard', '&d&lThrone Shards',
    ['&fYou have: &d&l' + (bal.ok ? fmt(bal.value) : '?'), '', '&fThrone Shards are the currency used', '&fto buy ranks, cosmetics and more.', '',
      '&fGet them on our webstore or', '&ffrom different gameplay activities.', '', '&e&lCLICK FOR A LINK TO THE WEBSTORE'], true)
  const storeLink = (p) => run(p.server, `tellraw ${p.username} ${JSON.stringify(['', { text: ' ➤ ', color: 'dark_gray' },
    { text: 'overthronesmp.tebex.store', color: 'light_purple', bold: true, underlined: true, clickEvent: { action: 'open_url', value: STORE_URL }, hoverEvent: { action: 'show_text', contents: 'Click to open the webstore' } }])}`)
  const pane = (s, id) => { var st = icon(s, id, ' ', []); try { st.set(DataComponents.HIDE_TOOLTIP, Java.loadClass('net.minecraft.util.Unit').INSTANCE) } catch (e) { } return st }

  // OG layout of the main page: G grey, P pink, W white, L lime
  const MAIN_ROWS = ['GGGGGGGGG', 'GGPGPGPGG', 'GPWPWPWPG', 'GGPGPGPGG', 'GLLLLLLLG', 'GGGGGGGGG']
  const PANES = { G: 'minecraft:gray_stained_glass_pane', P: 'minecraft:pink_stained_glass_pane', W: 'minecraft:white_stained_glass_pane', L: 'minecraft:lime_stained_glass_pane' }

  const categoryIcon = (s, c) => {
    var lore = []
    if (c.kind) lore.push('&8' + c.kind)
    if (c.desc) { lore.push(''); c.desc.forEach(d => lore.push('&f' + d)) }
    lore.push('')
    lore.push(c.soon ? '&8&lCOMING SOON' : '&7&lCLICK TO OPEN THIS CATEGORY')
    return icon(s, c.icon, c.name, lore, false)
  }
  const itemIcon = (p, it, bal) => {
    var lore = []
    lore.push('')
    lore.push('&d&l' + fmt(it.price) + ' Throne Shards')
    if (isOwned(p, it)) lore.push('&a&lYOU OWN THIS')
    else if (bal.ok && bal.value < it.price) lore.push('&c&lNOT ENOUGH SHARDS')
    return icon(p.server, it.icon, it.name + (it.detail ? ' &7(' + it.detail + ')' : ''), lore, false)
  }

  const shopMain = (p) => {
    var s = p.server, bal = shardsOf(p)
    p.openChestGUI(Text.of('Throne Shop'), 6, gui => {
      gui.playerSlots = true
      for (var y = 0; y < 6; y++) for (var x = 0; x < 9; x++) {
        (function (xx, yy) { gui.slot(xx, yy, sl => { sl.item = pane(s, PANES[MAIN_ROWS[yy][xx]]) }) })(x, y)
      }
      gui.slot(4, 0, sl => { sl.item = balanceIcon(s, bal); sl.leftClicked = e => after(p, () => storeLink(p)) })
      SHOP.children.forEach(c => gui.slot(c.slot[0], c.slot[1], sl => {
        sl.item = categoryIcon(s, c)
        sl.leftClicked = e => { if (!c.soon) after(p, () => shopPage(p, [c])) }
      }))
      gui.slot(4, 4, sl => { sl.item = icon(s, 'minecraft:lantern', '&e&lYour Cosmetics', ['&f/tags &7- equip a chat tag', '&f/namecolor &7- equip a name color', '&f/flytime &7- turn flight on/off'], false) })
      gui.slot(4, 5, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lClose', []); sl.leftClicked = e => { try { p.closeMenu() } catch (x) { } } })
      gui.slot(8, 5, sl => { sl.item = icon(s, 'minecraft:paper', '&e&lHow it works', ['&fClick a category, then click an', '&fitem to buy it with Throne Shards.', '', '&fGet Throne Shards at', '&doverthronesmp.tebex.store'], false) })
    })
  }

  // path = list of categories from the main page down to the open one
  const shopPage = (p, path) => {
    var s = p.server, bal = shardsOf(p), cat = path[path.length - 1], list = cat.children || []
    var spaced = cat.layout == 'spaced' && list.length <= 4
    var perRow = spaced ? 4 : 7
    var rows = cat.layout == 'ranks' ? 6 : Math.min(6, Math.max(4, Math.ceil(list.length / perRow) + 3))
    var title = 'Throne Shop > ' + path.map(c => strip(c.name)).map(t => t.charAt(0) + t.slice(1).toLowerCase()).join(' > ')
    p.openChestGUI(Text.of(title.length > 40 ? 'Throne Shop > ' + strip(cat.name) : title), rows, gui => {
      gui.playerSlots = true
      for (var y = 0; y < rows; y++) for (var x = 0; x < 9; x++) {
        (function (xx, yy) { gui.slot(xx, yy, sl => { sl.item = pane(s, PANES.G) }) })(x, y)
      }
      if (cat.layout == 'ranks') list.forEach((it, i) => {
        var x = 2 + i
        gui.slot(x, 1, sl => {
          sl.item = itemIcon(p, it, bal)
          sl.leftClicked = e => { if (!isOwned(p, it)) after(p, () => { buy(p, it); shopPage(p, path) }) }
        })
        gui.slot(x, 2, sl => { sl.item = icon(s, 'minecraft:book', it.perksName, (it.perksSub ? [it.perksSub, ''] : ['']).concat(it.perks.map(l => '&8• &f' + l)), false) })
        gui.slot(x, 3, sl => { sl.item = icon(s, 'minecraft:oak_sign', it.cmdsName, (it.cmdsSub ? [it.cmdsSub, ''] : ['']).concat(it.cmds.map(c => '&8• &f' + c[0] + ' &8| &7' + c[1].toUpperCase())), false) })
      })
      else list.forEach((it, i) => {
        var x = spaced ? 1 + (i % 4) * 2 : 1 + (i % 7), y = 1 + Math.floor(i / perRow)
        if (y >= rows - 1) return
        gui.slot(x, y, sl => {
          if (it.children || it.soon) {
            sl.item = categoryIcon(s, it)
            sl.leftClicked = e => { if (!it.soon) after(p, () => shopPage(p, path.concat([it]))) }
          } else {
            sl.item = itemIcon(p, it, bal)
            sl.leftClicked = e => { if (!isOwned(p, it)) after(p, () => { buy(p, it); shopPage(p, path) }) }
          }
        })
      })
      gui.slot(4, rows - 1, sl => {
        sl.item = icon(s, 'minecraft:hopper', '&e&lBack', ['&7Go back'], false)
        sl.leftClicked = e => after(p, () => path.length > 1 ? shopPage(p, path.slice(0, -1)) : shopMain(p))
      })
      gui.slot(5, rows - 1, sl => { sl.item = balanceIcon(s, bal); sl.leftClicked = e => after(p, () => storeLink(p)) })
    })
  }

  const buy = (p, it) => {
    var s = p.server, g = it.give, label = strip(it.name) + (it.detail ? ' (' + it.detail + ')' : '')
    if (isOwned(p, it)) { p.tell('§c§lThrone Shop §7» You already own this.'); return }
    var before = shardsOf(p)
    if (!before.ok) {
      p.tell('§c§lThrone Shop §7» The shop could not read your Throne Shards. Please tell staff.')
      console.warn('[throneshop] cannot read shards for ' + p.username + ': ' + before.raw)
      return
    }
    if (before.value < it.price) {
      p.tell(`§c§lThrone Shop §7» You need §d${fmt(it.price)} Throne Shards§7, you have §d${fmt(before.value)}§7.`)
      storeLink(p)
      return
    }
    run(s, TAKE_SHARDS.replace('{p}', p.username).replace('{n}', String(it.price)))
    var afterBal = shardsOf(p)
    var paid = afterBal.ok && (before.exact && afterBal.exact ? Math.round(before.value - afterBal.value) == it.price : afterBal.value < before.value)
    if (!paid) {
      p.tell('§c§lThrone Shop §7» Payment failed, nothing was taken. Please tell staff.')
      console.warn('[throneshop] shards take failed for ' + p.username + ' (' + before.raw + ' -> ' + afterBal.raw + ')')
      return
    }
    if (g.type == 'rank') run(s, `giverank ${p.username} ${g.rank}`)
    else if (g.type == 'key') run(s, `crate key give ${p.username} ${g.crate} ${g.n}`)
    else if (g.type == 'tag') { addOwned(p, 'tag:' + g.id); p.tell('§7Equip it with §e/tags§7.') }
    else if (g.type == 'namecolor') { addOwned(p, 'nc:' + g.id); p.tell('§7Equip it with §e/namecolor§7.') }
    else if (g.type == 'fly') { addFly(p, g.seconds) }
    else if (g.type == 'cmd') g.commands.forEach(c => run(s, c.split('{p}').join(p.username)))
    console.info('[throneshop] ' + p.username + ' bought ' + label + ' for ' + it.price + ' shards')
    p.tell(`§a§lThrone Shop §7» You bought §f${label}§7 for §d${fmt(it.price)} Throne Shards§7!`)
    run(s, `execute at ${p.username} run playsound minecraft:entity.player.levelup master ${p.username} ~ ~ ~ 1 1.4`)
  }

  // ======================================================================= chat tags + name colours
  const tagById = (id) => { for (var i = 0; i < TAGS.length; i++) if (TAGS[i][0] == id) return TAGS[i]; return null }
  const ncById = (id) => { for (var i = 0; i < NAME_COLORS.length; i++) if (NAME_COLORS[i][0] == id) return NAME_COLORS[i]; return null }
  const cosmeticsOf = (player) => {
    var out = { tag: '', nc: '' }
    if (player == null) return out
    var t = tagById(String(player.persistentData.getString('ot_tag') || ''))
    var c = ncById(String(player.persistentData.getString('ot_namecolor') || ''))
    if (t && owns(player, 'tag:' + t[0])) out.tag = '&8[' + t[1] + '&8] '
    if (c && owns(player, 'nc:' + c[0])) out.nc = c[1]
    return out
  }
  const CHAT_TAIL = '{neoessentials_displayname}&7: '
  const ChatFormats = (() => { try { return Java.loadClass('com.zerog.neoessentials.chat.PlayerChatFormatManager') } catch (e) { return null } })()
  // Same chat format the rank script builds, plus the tag before the name and the name colour.
  const chatFormat = (uuid, prefix, messageColor) => {
    if (ChatFormats == null) return
    var mgr = ChatFormats.getInstance(), pl = null
    try { pl = Utils.server.getPlayerList().getPlayer(uuid) } catch (e) { pl = null }
    var x = cosmeticsOf(pl)
    prefix = prefix || ''
    if (prefix == '' && !messageColor && !x.tag && !x.nc) { if (mgr.hasFormat(uuid)) mgr.clearFormat(uuid); return }
    var format = prefix + x.tag + (x.nc || (prefix == '' && !x.tag ? '&7' : '&f')) + CHAT_TAIL + (messageColor || '&f') + '{MESSAGE}'
    if (String(mgr.getFormat(uuid)) != format) mgr.setFormat(uuid, format)
  }
  // Take over the rank script's chat format function so ranks, tags and colours all show together.
  ServerEvents.loaded(event => {
    try { if (typeof rkChatFormat == 'function') { rkChatFormat = chatFormat; console.info('[npc_menus] chat tags + name colours hooked into ranks.js') } }
    catch (e) { console.warn('[npc_menus] could not hook ranks chat format: ' + e) }
  })
  const refreshChat = (p) => {
    try {
      if (typeof rkSyncPlayer == 'function') { rkSyncPlayer(p.server, p); return }
    } catch (e) { console.warn('[npc_menus] rkSyncPlayer: ' + e) }
    chatFormat(p.getUuid(), '', '')
  }

  const cosmeticMenu = (p, kind) => {
    var s = p.server, list = kind == 'tags' ? TAGS : NAME_COLORS
    var key = kind == 'tags' ? 'ot_tag' : 'ot_namecolor', pre = kind == 'tags' ? 'tag:' : 'nc:'
    var mine = list.filter(t => owns(p, pre + t[0])), cur = String(p.persistentData.getString(key) || '')
    var rows = Math.min(6, Math.max(3, Math.ceil(mine.length / 7) + 2))
    p.openChestGUI(Text.of(kind == 'tags' ? 'Your Chat Tags' : 'Your Name Colors'), rows, gui => {
      gui.playerSlots = true
      for (var y = 0; y < rows; y++) for (var x = 0; x < 9; x++) {
        (function (xx, yy) { gui.slot(xx, yy, sl => { sl.item = pane(s, PANES.G) }) })(x, y)
      }
      mine.forEach((t, i) => {
        if (1 + Math.floor(i / 7) >= rows - 1) return
        gui.slot(1 + (i % 7), 1 + Math.floor(i / 7), sl => {
          var on = cur == t[0]
          sl.item = kind == 'tags'
            ? icon(s, 'minecraft:name_tag', t[1] + (t[1].length > 4 ? '' : '&f Tag'), ['&7In chat: &8[' + t[1] + '&8] &f' + p.username, '', on ? '&a&lEQUIPPED' : '&e&lCLICK TO EQUIP'], on)
            : icon(s, t[3], t[1] + t[2] + ' Name Color', ['&7In chat: ' + t[1] + p.username, '', on ? '&a&lEQUIPPED' : '&e&lCLICK TO EQUIP'], on)
          sl.leftClicked = e => after(p, () => { p.persistentData.putString(key, t[0]); refreshChat(p); p.tell('§a✔ Equipped. §7It shows on your next message.'); cosmeticMenu(p, kind) })
        })
      })
      if (!mine.length) gui.slot(4, 1, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lYou don\'t own any yet', ['&7Buy them in the &dThrone Shop&7.'], false) })
      gui.slot(4, rows - 1, sl => {
        sl.item = icon(s, 'minecraft:bucket', '&c&lUnequip', ['&7Remove your ' + (kind == 'tags' ? 'chat tag' : 'name color')], false)
        sl.leftClicked = e => after(p, () => { p.persistentData.remove(key); refreshChat(p); p.tell('§7Removed.'); cosmeticMenu(p, kind) })
      })
    })
  }

  // ======================================================================= flight time
  const flyLeft = (p) => p.persistentData.getInt('ot_fly_left') || 0
  const flyBlocked = (p) => FLY_BLOCKED_WORLDS.indexOf(String(p.level.dimension)) >= 0
  const setFlight = (p, on) => {
    try {
      var a = p.getAbilities()
      if (on) { a.mayfly = true } else if (!p.isCreative() && !p.isSpectator()) { a.mayfly = false; a.flying = false }
      p.onUpdateAbilities()
    } catch (e) { console.warn('[npc_menus] flight: ' + e) }
  }
  const addFly = (p, sec) => {
    p.persistentData.putInt('ot_fly_left', flyLeft(p) + sec)
    p.tell('§a✈ +' + dur(sec * 1000) + 'of flight time. §7Turn it on with §e/flytime§7. Time left: §f' + dur(flyLeft(p) * 1000))
  }
  const flyToggle = (p) => {
    var on = p.persistentData.getBoolean('ot_fly_on')
    if (on) { p.persistentData.putBoolean('ot_fly_on', false); setFlight(p, false); p.tell('§e✈ Flight turned §cOFF§e. §7Time left: §f' + dur(flyLeft(p) * 1000)); return }
    if (flyLeft(p) <= 0) { p.tell('§c✈ You have no flight time. §7Buy some in the §dThrone Shop§7.'); return }
    if (flyBlocked(p)) { p.tell('§c✈ Flight is not allowed in this world.'); return }
    p.persistentData.putBoolean('ot_fly_on', true); setFlight(p, true)
    p.tell('§a✈ Flight turned §aON§a! §7Double-jump to fly. Time only counts down while flying. Left: §f' + dur(flyLeft(p) * 1000))
  }
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 20 != 0) return
    try { if (typeof rkChatFormat == 'function' && rkChatFormat !== chatFormat) rkChatFormat = chatFormat } catch (e) { }
    s.players.forEach(p => {
      if (!p.persistentData.getBoolean('ot_fly_on') || p.isCreative() || p.isSpectator()) return
      var a = p.getAbilities()
      if (flyBlocked(p)) { if (a.mayfly) { setFlight(p, false); p.tell('§c✈ Flight is off in this world.') } return }
      if (!a.mayfly) setFlight(p, true)
      if (!a.flying) return
      var left = flyLeft(p) - 1
      p.persistentData.putInt('ot_fly_left', Math.max(0, left))
      if (left == 60 || left == 10) p.tell('§e✈ ' + left + ' seconds of flight left!')
      if (left <= 0) {
        p.persistentData.putBoolean('ot_fly_on', false)
        setFlight(p, false)
        run(s, `effect give ${p.username} minecraft:slow_falling 15 0 true`)
        p.tell('§c✈ Your flight time ran out.')
      }
    })
  })
  PlayerEvents.loggedIn(event => {
    var p = event.player
    if (p.persistentData.getBoolean('ot_fly_on') && flyLeft(p) > 0) p.server.scheduleInTicks(20, () => setFlight(p, true))
  })

  // ======================================================================= Kit Selector
  const KIT_MS = KIT_COOLDOWN_HOURS * 3600 * 1000
  const kitMenu = (p) => {
    var s = p.server, ids = ranksOf(p), op = p.hasPermissions(2), now = Date.now()
    p.openChestGUI(Text.of('Kits'), 3, gui => {
      gui.playerSlots = true
      fill(gui, s, 3)
      RANK_ORDER.forEach((kit, i) => {
        var info = RANK_INFO[kit]
        var has = op || ids.indexOf(kit) >= 0
        var last = Number(String(p.persistentData.getString('ot_kitcd_' + kit)) || 0)
        var left = op ? 0 : (last ? KIT_MS - (now - last) : 0)
        var status = !has ? '&c&lNO PERMISSIONS' : left > 0 ? '&c&lON COOLDOWN' : '&a&lAVAILABLE'
        var lore = [status, '', '&f&lKIT INFORMATION:', '&8 • &7Cooldown: &f5d', '&8 • &7Remaining: &f' + (has && left > 0 ? dur(left) : 'None')]
        lore.push('')
        lore.push(!has ? '&7Unlock with the &f' + info.name + '&7 rank: &eoverthronesmp.tebex.store' : left > 0 ? '&7Come back when the timer runs out.' : '&e&lCLICK TO CLAIM')
        gui.slot(2 + i, 1, sl => {
          sl.item = icon(s, has ? info.candle : 'minecraft:gray_candle', info.c + '&l' + info.name, lore, has && left <= 0)
          sl.leftClicked = e => {
            if (!has) { p.tell('§c§lKits §7» You need the §f' + info.name + '§7 rank for this kit. §eoverthronesmp.tebex.store'); return }
            if (left > 0) { p.tell('§c§lKits §7» You can claim this kit again in §e' + dur(left) + '§7.'); return }
            after(p, () => claimKit(p, kit))
          }
        })
      })
    })
  }
  const claimKit = (p, kit) => {
    var key = 'ot_kitcd_' + kit, before = String(p.persistentData.getString(key) || '')
    try { p.runCommandSilent('kit ' + kit) } catch (e) { asPlayer(p, 'kit ' + kit) }
    // kit_cooldown.js normally records the claim; record it here too if it didn't (ops never get a cooldown)
    if (!p.hasPermissions(2) && String(p.persistentData.getString(key) || '') == before) p.persistentData.putString(key, String(Date.now()))
  }

  // ======================================================================= Level Guide
  const levelGuide = (p) => {
    var s = p.server
    var lvl = Math.max(1, p.persistentData.getInt('ot_level') || 1), xp = p.persistentData.getInt('ot_xp') || 0
    var need = Math.floor(150 + 18 * lvl + 0.002 * lvl * lvl), pct = lvl >= 5000 ? 100 : Math.floor(xp * 100 / need)
    var bar = ''
    for (var i = 0; i < 20; i++) bar += (i < pct / 5 ? '&a' : '&8') + '|'
    p.openChestGUI(Text.of('Level Guide'), 4, gui => {
      gui.playerSlots = true
      fill(gui, s, 4)
      gui.slot(4, 0, sl => { sl.item = icon(s, 'minecraft:experience_bottle', '&6&lYour Level: &e&l' + lvl, [bar + ' &f' + pct + '%', '&7XP: &f' + fmt(xp) + ' &7/ &f' + fmt(need), '', 'Max level is &65,000&7.'], true) })
      gui.slot(1, 2, sl => { sl.item = icon(s, 'minecraft:writable_book', '&a&lQuests', ['The best way to level up!', 'Every quest you finish gives XP.'], false) })
      gui.slot(3, 2, sl => { sl.item = icon(s, 'minecraft:iron_sword', '&c&lKill Mobs', ['Every mob gives a little XP.', 'Bosses give a lot!', '', '&8Normal mob XP has a per-minute limit.'], false) })
      gui.slot(5, 2, sl => { sl.item = icon(s, 'minecraft:diamond_ore', '&b&lMine Ores', ['Mining ores gives XP.', '', '&8Ore XP has a per-minute limit.'], false) })
      gui.slot(7, 2, sl => { sl.item = icon(s, 'minecraft:clock', '&e&lDaily Login', ['Your first login each day', 'gives &e200 + 5 per level&7 XP.'], false) })
      gui.slot(2, 1, sl => { sl.item = icon(s, 'minecraft:gold_ingot', '&6&lLevel 100', ['Announced to the whole server.'], lvl >= 100) })
      gui.slot(4, 1, sl => { sl.item = icon(s, 'minecraft:end_portal_frame', '&4&lLevel 300', ['Breaks the Seal: unlocks the realms', '&eAeonia&7 and &4Netherfall&7.', 'Mobs there give &a2x XP&7.'], lvl >= 300) })
      gui.slot(6, 1, sl => { sl.item = icon(s, 'minecraft:nether_star', '&6&lLevel 1000 & 5000', ['Announced to the whole server.', 'Level 5000 is the max level.'], lvl >= 1000) })
      gui.slot(8, 3, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lClose', []); sl.leftClicked = e => { try { p.closeMenu() } catch (x) { } } })
    })
  }

  // ======================================================================= Links
  const LINKS = [
    ['minecraft:light_blue_dye', '&9&lDiscord', 'https://discord.gg/overthronesmp'],
    ['minecraft:lime_dye', '&a&lWebsite', 'https://overthronesmp.net'],
    ['minecraft:gold_ingot', '&e&lStore', 'https://overthronesmp.tebex.store'],
    ['minecraft:book', '&c&lRules', 'https://overthronesmp.net/rules'],
    ['minecraft:emerald', '&2&lVote', 'https://overthronesmp.net/vote'],
  ]
  const linksMenu = (p) => {
    var s = p.server
    p.openChestGUI(Text.of('Server Links'), 3, gui => {
      gui.playerSlots = true
      fill(gui, s, 3)
      LINKS.forEach((l, i) => gui.slot(2 + i, 1, sl => {
        sl.item = icon(s, l[0], l[1], [l[2].replace('https://', ''), '', '&e&lCLICK FOR THE LINK IN CHAT'], true)
        sl.leftClicked = e => after(p, () => run(s, `tellraw ${p.username} ${JSON.stringify(['', { text: ' ➤ ', color: 'dark_gray' },
          { text: l[2], color: 'aqua', underlined: true, clickEvent: { action: 'open_url', value: l[2] }, hoverEvent: { action: 'show_text', contents: 'Click to open' } }])}`))
      }))
    })
  }

  const MENUS = { throneshop: shopMain, kits: kitMenu, levels: levelGuide, links: linksMenu }
  const TITLES = {
    throneshop: ['&d&lTHRONE SHOP', '&fRIGHT-CLICK TO VIEW'],
    kits: ['&6&lKITS', '&fRIGHT-CLICK TO VIEW'],
    levels: ['&a&lLEVEL GUIDE', '&fRIGHT-CLICK TO VIEW'],
    links: ['&b&lSERVER LINKS', '&fRIGHT-CLICK TO VIEW'],
  }
  const GLOW = { throneshop: 'light_purple', kits: 'gold', levels: 'green', links: 'aqua', cmd: 'yellow' }
  const openMenu = (p, type) => {
    if (p.openChestGUI === undefined) { p.tell('§cMenus need KubeJS chest GUIs.'); return }
    try { MENUS[type](p) } catch (e) { console.error('[npc_menus] ' + type + ': ' + e); if (p.hasPermissions(2)) p.tell('§c[npc_menus] ' + e) }
  }

  // ======================================================================= NPC clicks
  const lastClick = {}
  var clickDebug = false
  // returns true when the click was for one of our NPCs (then the NPC's own dialog must be stopped)
  const onNpcClick = (p, e, hand) => {
    if (p == null || e == null || p.level.isClientSide()) return false
    var tags = e.getTags(), type = null
    // Holding an Easy NPC tool (mover, wand, editor...) or staff sneak-clicking: let Easy NPC handle it.
    var held = ''
    try { held = String(p.getMainHandItem().getItem().builtInRegistryHolder().key().location()) } catch (x) { try { held = String(p.getMainHandItem().getId()) } catch (y) { held = '' } }
    if (clickDebug && p.hasPermissions(2)) p.tell('§8[npcmenu debug] clicked ' + e.type + ' holding=' + held + ' hand=' + hand)
    if (held.indexOf('easy_npc:') == 0) return false
    if (p.hasPermissions(2) && p.isShiftKeyDown()) return false
    Object.keys(MENUS).forEach(t => { if (tags.contains('ot_menu_' + t)) type = t })
    var cmd = String(e.persistentData.getString('ot_menu_cmd') || '')
    if (type == null && !cmd) return false
    var now = Date.now()
    if (String(hand) == 'MAIN_HAND' && now - (lastClick[p.username] || 0) > 500) {
      lastClick[p.username] = now
      if (type != null) { var pp = p, tt = type; p.server.scheduleInTicks(1, () => openMenu(pp, tt)) }
      else asPlayer(p, cmd.replace(/^\//, ''))
    }
    return true
  }
  // KubeJS's own event
  ItemEvents.entityInteracted(event => {
    var mine = false
    try { mine = onNpcClick(event.player, event.target, event.hand) } catch (x) { console.warn('[npc_menus] ' + x) }
    if (mine) event.cancel()   // stops the NPC's own dialog. Must be last (it ends the handler).
  })
  // NeoForge's events directly, in case the one above doesn't fire for Easy NPC
  ;['net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$EntityInteractSpecific',
    'net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$EntityInteract'].forEach(cls => {
    try {
      NativeEvents.onEvent(cls, ev => {
        try {
          if (onNpcClick(ev.getEntity(), ev.getTarget(), ev.getHand())) {
            ev.setCanceled(true)
            try { ev.setCancellationResult(Java.loadClass('net.minecraft.world.InteractionResult').SUCCESS) } catch (y) { }
          }
        } catch (x) { console.warn('[npc_menus] ' + x) }
      })
    } catch (e) { console.warn('[npc_menus] could not listen to ' + cls + ': ' + e) }
  })

  // ======================================================================= staff commands
  const say = (src, m) => src.sendSystemMessage(Text.of(m))
  const looked = (p) => {
    var hit = p.rayTrace(8, false), e = hit == null ? null : hit.entity
    return e == null || String(e.type).indexOf('easy_npc') < 0 ? null : e
  }
  const uuidOf = (e) => { try { return String(e.getStringUUID()) } catch (x) { return String(e.uuid) } }
  const holoJson = (lines) => JSON.stringify(lines.map((l, i) => {
    var c = compParts(l)
    if (i) c.unshift({ text: '\n' })
    return c
  }).reduce((a, b) => a.concat(b), ['']))
  const compParts = (s) => {
    // same colour parser as comp(), returning plain JSON parts (for holograms)
    var parts = [], color = 'white', bold = false, buf = '', str = String(s)
    var NAMED = { 0: 'black', 1: 'dark_blue', 2: 'dark_green', 3: 'dark_aqua', 4: 'dark_red', 5: 'dark_purple', 6: 'gold', 7: 'gray', 8: 'dark_gray', 9: 'blue', a: 'green', b: 'aqua', c: 'red', d: 'light_purple', e: 'yellow', f: 'white' }
    var flush = () => { if (buf) parts.push({ text: buf, color: color, bold: bold, italic: false }); buf = '' }
    for (var i = 0; i < str.length; i++) {
      if (str[i] == '&' && str[i + 1] == '#' && /^[0-9a-fA-F]{6}$/.test(str.substr(i + 2, 6))) { flush(); color = '#' + str.substr(i + 2, 6); bold = false; i += 7; continue }
      if (str[i] == '&' && i + 1 < str.length) {
        var c = str[i + 1].toLowerCase()
        if (NAMED[c] != null) { flush(); color = NAMED[c]; bold = false; i++; continue }
        if (c == 'l') { flush(); bold = true; i++; continue }
      }
      buf += str[i]
    }
    flush()
    if (!parts.length) parts.push({ text: '' })
    return parts
  }
  const placeHolo = (server, e, lines, id) => {
    var f = (n) => Number(n).toFixed(2)
    run(server, `kill @e[type=minecraft:text_display,tag=${id}]`)
    var json = holoJson(lines).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    run(server, `execute in ${e.level.dimension} run summon minecraft:text_display ${f(e.x)} ${f(e.y + 2.25)} ${f(e.z)} ` +
      `{Tags:["ot_menu_holo","${id}"],billboard:"center",alignment:"center",shadow:1b,background:0,` +
      `brightness:{sky:15,block:15},transformation:[1.3f,0f,0f,0f,0f,1.3f,0f,0f,0f,0f,1.3f,0f,0f,0f,0f,1f],text:'${json}'}`)
  }
  const setGlow = (server, e, color) => {
    run(server, `team add ot_glow_${color}`)
    run(server, `team modify ot_glow_${color} color ${color}`)
    run(server, `team join ot_glow_${color} ${uuidOf(e)}`)
    run(server, `data merge entity ${uuidOf(e)} {Glowing:1b}`)
  }
  const idOf = (e) => {
    var id = null
    e.getTags().forEach(t => { if (String(t).indexOf('ot_mid_') == 0) id = String(t) })
    if (id == null) { id = 'ot_mid_' + Date.now().toString(36); e.addTag(id) }
    return id
  }
  const OPEN_CMD = { throneshop: 'throneshop', kits: 'kitmenu', levels: 'levelguide', links: 'links' }
  // Easy NPC's own "on click: run command" (the same thing the setup's click_command NPCs use)
  const setClickAction = (server, e, command) => {
    var c = '/' + String(command).replace(/^\//, '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    run(server, `data merge entity ${uuidOf(e)} {ActionData:{ActionEventSet:{ON_INTERACTION:[{Type:"COMMAND",Cmd:"${c}",ExecAsUser:1b,PermLevel:0}]},ActionPermissionLevel:0},DialogData:{DialogDataSet:[],Type:"NONE"}}`)
  }
  // the hologram is the NPC's name, so the NPC's own name tag is removed (it showed through the hologram)
  const hideName = (server, e) => {
    run(server, `data merge entity ${uuidOf(e)} {CustomName:'""',CustomNameVisible:0b}`)
  }
  // Easy NPC runs its own "on click" command BEFORE the wand/mover get the click, which blocked the tools.
  // Our click handler opens the menus, so that Easy NPC action is removed.
  const clearClickAction = (server, e) => run(server, `data remove entity ${uuidOf(e)} ActionData.ActionEventSet.ON_INTERACTION`)
  const typeOfNpc = (e) => { var t = null; Object.keys(MENUS).forEach(k => { if (e.getTags().contains('ot_menu_' + k)) t = k }); return t }
  // re-does every menu NPC near you: hides its name, puts its hologram back, removes stray holograms
  const fixAll = (p) => {
    var s = p.server, ids = [], n = 0
    p.level.getEntities().forEach(e => {
      if (!e.getTags().contains('ot_menu_npc')) return
      var t = typeOfNpc(e), cmd = String(e.persistentData.getString('ot_menu_cmd') || '')
      if (t == null && !cmd) return
      var id = idOf(e)
      ids.push(id)
      hideName(s, e)
      clearClickAction(s, e)
      if (t != null) placeHolo(s, e, TITLES[t], id)
      n++
    })
    var stray = 0
    p.level.getEntities().forEach(e => {
      if (String(e.type) != 'minecraft:text_display' || !e.getTags().contains('ot_menu_holo')) return
      var mine = false
      e.getTags().forEach(t => { if (ids.indexOf(String(t)) >= 0) mine = true })
      if (!mine) { e.discard(); stray++ }
    })
    return [n, stray]
  }
  const makeMenuNpc = (server, e, type, cmd, title) => {
    Object.keys(MENUS).forEach(t => e.removeTag('ot_menu_' + t))
    e.persistentData.remove('ot_menu_cmd')
    if (cmd) e.persistentData.putString('ot_menu_cmd', cmd)
    else e.addTag('ot_menu_' + type)
    e.addTag('ot_menu_npc')
    var id = idOf(e)
    setGlow(server, e, GLOW[cmd ? 'cmd' : type])
    hideName(server, e)
    clearClickAction(server, e)
    placeHolo(server, e, cmd ? ['&e&l' + String(title || 'CLICK ME').toUpperCase(), '&fRIGHT-CLICK'] : TITLES[type], id)
  }
  const spawnNpc = (p, name, color) => {
    if (typeof npcBehaviour != 'function' || typeof npcSnbt != 'function') throw 'The serversetup NPC builder (npcs.js) is not loaded'
    var data = npcBehaviour({ name: name, name_color: color })
    delete data.DialogData; delete data.ActionData
    data.Tags = ['ot_menu_npc', 'ot_spawn_tmp']
    data.EasyNPCVersion = { _snbt: '3' }
    data.SkinData = { Type: 'DEFAULT' }
    data.VariantType = 'STEVE'
    data.Rotation = [{ _snbt: Number(p.yaw).toFixed(1) + 'f' }, { _snbt: '0f' }]
    var f = (n) => Number(n).toFixed(2)
    run(p.server, `execute in ${p.level.dimension} run summon easy_npc:humanoid ${f(p.x)} ${f(p.y)} ${f(p.z)} ${npcSnbt(data)}`)
    var found = null
    p.level.getEntities().forEach(en => { if (found == null && en.getTags().contains('ot_spawn_tmp')) found = en })
    if (found != null) found.removeTag('ot_spawn_tmp')
    return found
  }
  const grabbed = {}
  const NPC_NAMES = { throneshop: ['Throne Shop', '#E05CFF'], kits: ['Kit Selector', '#FFAA00'], levels: ['Level Guide', '#55FF55'], links: ['Server Links', '#55FFFF'] }

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    const StringArg = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
    const typeArg = () => Commands.argument('type', StringArg.word()).suggests((c, b) => { Object.keys(MENUS).forEach(t => b.suggest(t)); return b.buildFuture() })
    const typeOf = (ctx) => { var t = String(StringArg.getString(ctx, 'type')).toLowerCase(); return MENUS[t] ? t : null }
    const guard = (ctx, fn) => { try { return fn() } catch (e) { say(ctx.source, '§c[npcmenu] ' + e); console.error('[npcmenu] ' + e); return 0 } }

    event.register(Commands.literal('npcmenu').requires(src => src.hasPermission(2))
      .then(Commands.literal('spawn').then(typeArg().executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, t = typeOf(ctx)
        if (!t) { say(ctx.source, '§cUse: throneshop, kits, levels or links'); return 0 }
        var e = spawnNpc(p, NPC_NAMES[t][0], NPC_NAMES[t][1])
        if (e == null) { say(ctx.source, '§cThe NPC did not spawn (check the server log).'); return 0 }
        makeMenuNpc(p.server, e, t, null)
        say(ctx.source, '§a[npcmenu] ' + NPC_NAMES[t][0] + ' NPC placed. §7Change its skin with the Easy NPC editor; /npcmenu remove deletes it.')
        return 1
      }))))
      .then(Commands.literal('spawncmd').then(Commands.argument('title', StringArg.word()).then(Commands.argument('command', StringArg.greedyString()).executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, title = String(StringArg.getString(ctx, 'title')), cmd = String(StringArg.getString(ctx, 'command')).replace(/^\//, '')
        var e = spawnNpc(p, title, '#FFFF55')
        if (e == null) { say(ctx.source, '§cThe NPC did not spawn (check the server log).'); return 0 }
        makeMenuNpc(p.server, e, null, cmd, title)
        say(ctx.source, '§a[npcmenu] NPC "' + title + '" placed: clicking it runs §f/' + cmd)
        return 1
      })))))
      .then(Commands.literal('attach').then(typeArg().executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, t = typeOf(ctx), e = looked(p)
        if (!t) { say(ctx.source, '§cUse: throneshop, kits, levels or links'); return 0 }
        if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
        makeMenuNpc(p.server, e, t, null)
        say(ctx.source, '§a[npcmenu] This NPC now opens the ' + t + ' menu.')
        return 1
      }))))
      .then(Commands.literal('attachcmd').then(Commands.argument('command', StringArg.greedyString()).executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = looked(p), cmd = String(StringArg.getString(ctx, 'command')).replace(/^\//, '')
        if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
        makeMenuNpc(p.server, e, null, cmd, String(e.getName().getString()))
        say(ctx.source, '§a[npcmenu] Clicking this NPC now runs §f/' + cmd)
        return 1
      }))))
      .then(Commands.literal('debug').executes(ctx => { clickDebug = !clickDebug; say(ctx.source, '§e[npcmenu] click debug ' + (clickDebug ? 'ON: right-click an NPC' : 'OFF')); return 1 }))
      .then(Commands.literal('detach').executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = looked(p)
        if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
        Object.keys(MENUS).forEach(t => e.removeTag('ot_menu_' + t))
        e.removeTag('ot_menu_npc'); e.persistentData.remove('ot_menu_cmd')
        run(p.server, `kill @e[type=minecraft:text_display,tag=${idOf(e)}]`)
        run(p.server, `data merge entity ${uuidOf(e)} {Glowing:0b}`)
        say(ctx.source, '§a[npcmenu] NPC is back to normal.')
        return 1
      })))
      .then(Commands.literal('fixall').executes(ctx => guard(ctx, () => {
        var r = fixAll(ctx.source.playerOrException)
        say(ctx.source, '§a[npcmenu] Fixed ' + r[0] + ' menu NPCs (names hidden, holograms redone), removed ' + r[1] + ' old holograms.')
        return 1
      })))
      .then(Commands.literal('grab').executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = looked(p)
        if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
        grabbed[p.username] = e
        say(ctx.source, '§a[npcmenu] Got it. §7Now stand where it should go, face the way it should look, and type §f/npcmenu put')
        return 1
      })))
      .then(Commands.literal('put').executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = grabbed[p.username]
        if (e == null || !e.isAlive()) { say(ctx.source, '§cFirst look at the NPC and type /npcmenu grab'); return 0 }
        var f = (n) => Number(n).toFixed(2), id = uuidOf(e)
        run(p.server, `execute in ${p.level.dimension} run tp ${id} ${f(p.x)} ${f(p.y)} ${f(p.z)} ${f(p.yaw)} 0`)
        // the hub NPC lock (npclock) keeps NPCs on their saved spot: give it the new spot
        try { e.persistentData.remove('ss_npc_anchor') } catch (x) { }
        p.server.scheduleInTicks(2, () => {
          try {
            var holo = null
            e.getTags().forEach(t => { if (String(t).indexOf('ot_mid_') == 0) holo = String(t) })
            if (holo) run(p.server, `execute in ${p.level.dimension} run tp @e[type=minecraft:text_display,tag=${holo}] ${f(e.x)} ${f(e.y + 2.25)} ${f(e.z)}`)
            asPlayer(p, `npclock here`)
          } catch (x) { }
        })
        delete grabbed[p.username]
        say(ctx.source, '§a[npcmenu] NPC moved here (hologram too).')
        return 1
      })))
      .then(Commands.literal('remove').executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = looked(p)
        if (e == null || !e.getTags().contains('ot_menu_npc')) { say(ctx.source, '§cLook straight at a menu NPC (within 8 blocks).'); return 0 }
        run(p.server, `kill @e[type=minecraft:text_display,tag=${idOf(e)}]`)
        e.discard()
        say(ctx.source, '§a[npcmenu] NPC removed.')
        return 1
      })))
      .then(Commands.literal('hologram').then(Commands.argument('text', StringArg.greedyString()).executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = looked(p)
        if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
        placeHolo(p.server, e, String(StringArg.getString(ctx, 'text')).split('|'), idOf(e))
        say(ctx.source, '§a[npcmenu] Hologram placed.')
        return 1
      })))))

    event.register(Commands.literal('throneshop').executes(ctx => { openMenu(ctx.source.playerOrException, 'throneshop'); return 1 })
      .then(Commands.literal('debug').requires(src => src.hasPermission(2)).executes(ctx => {
        var p = ctx.source.playerOrException, b = shardsOf(p)
        say(ctx.source, '§7[throneshop] placeholder: §f' + (balancePlaceholder(p.server) || '(none)'))
        say(ctx.source, '§7[throneshop] it shows: §f' + b.raw + (b.ok ? ' §a-> ' + fmt(b.value) + (b.exact ? '' : ' (rounded)') : ' §c-> cannot read a number'))
        return 1
      }))
      .then(Commands.literal('placeholder').requires(src => src.hasPermission(2)).then(Commands.argument('text', StringArg.greedyString()).executes(ctx => {
        var t = String(StringArg.getString(ctx, 'text'))
        ctx.source.server.persistentData.putString('ot_shard_placeholder', t == 'auto' ? '' : t)
        say(ctx.source, '§a[throneshop] Balance placeholder set to §f' + (t == 'auto' ? '(auto)' : t))
        return 1
      }))))
    event.register(Commands.literal('tags').executes(ctx => { var p = ctx.source.playerOrException; try { cosmeticMenu(p, 'tags') } catch (e) { p.tell('§c' + e) } return 1 }))
    event.register(Commands.literal('namecolor').executes(ctx => { var p = ctx.source.playerOrException; try { cosmeticMenu(p, 'colors') } catch (e) { p.tell('§c' + e) } return 1 }))
    event.register(Commands.literal('flytime').executes(ctx => { flyToggle(ctx.source.playerOrException); return 1 }))
    event.register(Commands.literal('kitmenu').executes(ctx => { openMenu(ctx.source.playerOrException, 'kits'); return 1 }))
    event.register(Commands.literal('levelguide').executes(ctx => { openMenu(ctx.source.playerOrException, 'levels'); return 1 }))
  })
})()
