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
//   /npcmenu remove                                deletes the menu NPC you are looking at (and its hologram)
//   /npcmenu hologram <text...>                    (re)places the hologram over the NPC you are looking at.
//                                                  Use | for a new line, e.g. /npcmenu hologram &6&lJOBS|&7Right-click
// Players can also open the menus with commands: /throneshop  /kitmenu  /levelguide
//
// Throne Shop balance: the shop reads your Throne Shards from the same placeholder your sidebar uses
// (the line with "SHARD" in config/serversetup/scoreboard.json) and takes them with "shards take".
//   /throneshop debug                (op) shows what the shop reads as your balance
//   /throneshop placeholder <text>   (op) set the balance placeholder by hand if the auto-detect is wrong

(function () {
  // ======================================================================= settings
  const TAKE_SHARDS = 'shards take {p} {n}'
  const RANK_ORDER = ['ronin', 'valkyrie', 'monarch', 'godborn', 'overlord']
  const RANK_INFO = {
    ronin: { name: 'Ronin', color: '#E0434F', candle: 'minecraft:red_candle' },
    valkyrie: { name: 'Valkyrie', color: '#C04DFF', candle: 'minecraft:purple_candle' },
    monarch: { name: 'Monarch', color: '#E6B85C', candle: 'minecraft:yellow_candle' },
    godborn: { name: 'Godborn', color: '#F3E2B0', candle: 'minecraft:white_candle' },
    overlord: { name: 'Overlord', color: '#FF3B2F', candle: 'minecraft:orange_candle' },
  }
  const KIT_COOLDOWN_HOURS = 120   // must match kit_cooldown.js

  // Throne Shop. Prices are in Throne Shards (1,000 shards = 4.99 AUD on the store). Change freely.
  // Each item: icon, name (& colour codes ok), lore lines, price, commands ({p} = player name), optional "rank".
  const SHOP = [
    {
      id: 'ranks', icon: 'minecraft:nether_star', name: '&c&lRANKS', slot: 20,
      desc: ['Ranks give you a prefix, more homes,', 'kits, commands and much more.', 'Every rank includes the ranks below it.'],
      items: [
        { icon: 'minecraft:red_dye', name: '&#E0434F&l[RONIN] &fRank', price: 2500, rank: 'ronin', commands: ['giverank {p} ronin'] },
        { icon: 'minecraft:purple_dye', name: '&#C04DFF&l[VALKYRIE] &fRank', price: 6000, rank: 'valkyrie', commands: ['giverank {p} valkyrie'] },
        { icon: 'minecraft:yellow_dye', name: '&#E6B85C&l[MONARCH] &fRank', price: 12000, rank: 'monarch', commands: ['giverank {p} monarch'] },
        { icon: 'minecraft:white_dye', name: '&#F3E2B0&l[GODBORN] &fRank', price: 22000, rank: 'godborn', commands: ['giverank {p} godborn'] },
        { icon: 'minecraft:orange_dye', name: '&#FF3B2F&l[OVERLORD] &fRank', price: 35000, rank: 'overlord', commands: ['giverank {p} overlord'] },
      ],
    },
    {
      id: 'keys', icon: 'minecraft:tripwire_hook', name: '&e&lCRATE KEYS', slot: 22,
      desc: ['Keys for the crates at spawn.', 'Paid keys are non-RNG: you pick', 'the reward you want!'],
      items: [
        { icon: 'minecraft:tripwire_hook', name: '&a&lVote Key', lore: ['Opens the Voting Crate.'], price: 200, commands: ['crate key give {p} vote 1'] },
        { icon: 'minecraft:tripwire_hook', name: '&a&l5x Vote Key', lore: ['Opens the Voting Crate.'], price: 900, commands: ['crate key give {p} vote 5'] },
        { icon: 'minecraft:tripwire_hook', name: '&b&lRune Key', lore: ['Opens the Rune Crate.'], price: 260, commands: ['crate key give {p} runes 1'] },
        { icon: 'minecraft:tripwire_hook', name: '&b&l5x Rune Key', lore: ['Opens the Rune Crate.'], price: 1000, commands: ['crate key give {p} runes 5'] },
        { icon: 'minecraft:tripwire_hook', name: '&d&lArmor Key', lore: ['Opens the Armor Crate.'], price: 600, commands: ['crate key give {p} armor 1'] },
        { icon: 'minecraft:tripwire_hook', name: '&d&l5x Armor Key', lore: ['Opens the Armor Crate.'], price: 1500, commands: ['crate key give {p} armor 5'] },
        { icon: 'minecraft:tripwire_hook', name: '&6&lWeapon Key', lore: ['Opens the Weapon Crate.'], price: 600, commands: ['crate key give {p} weapon 1'] },
        { icon: 'minecraft:tripwire_hook', name: '&6&l5x Weapon Key', lore: ['Opens the Weapon Crate.'], price: 1500, commands: ['crate key give {p} weapon 5'] },
      ],
    },
    {
      id: 'more', icon: 'minecraft:chest', name: '&d&lMORE COMING SOON', slot: 24,
      desc: ['New items are added here', 'over time. Stay tuned!'],
      items: [],
    },
  ]

  // ======================================================================= helpers
  const DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
  const ItemLore = Java.loadClass('net.minecraft.world.item.component.ItemLore')
  const ArrayList = Java.loadClass('java.util.ArrayList')
  const Placeholders = (() => { try { return Java.loadClass('com.zerog.neoessentials.api.PlaceholderAPI') } catch (e) { return null } })()

  // "&#FF0000&lText &7more" -> text component (supports & colour codes, &#RRGGBB and &l bold)
  const RA = {}
  const Serializer = Java.loadClass('net.minecraft.network.chat.Component$Serializer')
  const comp = (s) => Serializer.fromJson(JSON.stringify([{ text: '', italic: false }].concat(compParts(s))), RA.ra)
  const icon = (server, id, name, lore, glint) => {
    RA.ra = server.registryAccess()
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
      (function (xx, yy) { gui.slot(xx, yy, s => { s.item = icon(server, 'minecraft:gray_stained_glass_pane', ' ', []) }) })(x, y)
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
  const shopMain = (p) => {
    var s = p.server, bal = shardsOf(p)
    p.openChestGUI(Text.of('Throne Shop'), 6, gui => {
      gui.playerSlots = true
      fill(gui, s, 6)
      gui.slot(4, 0, sl => { sl.item = icon(s, 'minecraft:amethyst_shard', '&d&lYour Throne Shards', [bal.ok ? '&f' + fmt(bal.value) + ' &dShards' : '&cUnknown', '', 'Get more at &eoverthronesmp.tebex.store'], true) })
      SHOP.forEach(cat => {
        var xy = at(cat.slot)
        gui.slot(xy[0], xy[1], sl => {
          sl.item = icon(s, cat.icon, cat.name, cat.desc.concat(['', cat.items.length ? '&e&lCLICK TO OPEN THIS CATEGORY' : '&8Nothing here yet']), true)
          sl.leftClicked = e => { if (cat.items.length) after(p, () => shopCategory(p, cat)) }
        })
      })
      gui.slot(8, 5, sl => {
        sl.item = icon(s, 'minecraft:barrier', '&c&lClose', [])
        sl.leftClicked = e => { try { p.closeMenu() } catch (x) { } }
      })
    })
  }

  const shopCategory = (p, cat) => {
    var s = p.server, bal = shardsOf(p), top = topRankIndex(p)
    var rows = Math.max(3, Math.min(6, Math.ceil(cat.items.length / 7) + 2))
    p.openChestGUI(Text.of('Throne Shop > ' + cat.name.replace(/&#[0-9a-fA-F]{6}|&./g, '')), rows, gui => {
      gui.playerSlots = true
      fill(gui, s, rows)
      cat.items.forEach((it, i) => {
        var x = 1 + (i % 7), y = 1 + Math.floor(i / 7)
        gui.slot(x, y, sl => {
          var lore = (it.lore || []).slice(), owned = it.rank != null && RANK_ORDER.indexOf(it.rank) <= top
          lore.push('')
          lore.push('&fPrice: &d' + fmt(it.price) + ' Throne Shards')
          if (owned) lore.push('&a&lYOU ALREADY HAVE THIS')
          else if (bal.ok && bal.value < it.price) lore.push('&c&lNOT ENOUGH SHARDS')
          else lore.push('&e&lCLICK TO BUY')
          sl.item = icon(s, it.icon, it.name, lore, !owned)
          sl.leftClicked = e => { if (!owned) after(p, () => buy(p, cat, it)) }
        })
      })
      gui.slot(0, rows - 1, sl => {
        sl.item = icon(s, 'minecraft:arrow', '&e&lBack', [])
        sl.leftClicked = e => after(p, () => shopMain(p))
      })
      gui.slot(4, rows - 1, sl => { sl.item = icon(s, 'minecraft:amethyst_shard', '&d&lYour Throne Shards', [bal.ok ? '&f' + fmt(bal.value) : '&cUnknown'], true) })
    })
  }

  const buy = (p, cat, it) => {
    var s = p.server
    if (it.rank != null && RANK_ORDER.indexOf(it.rank) <= topRankIndex(p)) { p.tell('§c§lThrone Shop §7» You already have this rank (or a higher one).'); return }
    var before = shardsOf(p)
    if (!before.ok) {
      p.tell('§c§lThrone Shop §7» The shop could not read your Throne Shards. Please tell staff.')
      console.warn('[throneshop] cannot read shards for ' + p.username + ': ' + before.raw)
      return
    }
    if (before.value < it.price) {
      p.tell(`§c§lThrone Shop §7» You need §d${fmt(it.price)} Throne Shards§7, you have §d${fmt(before.value)}§7. Get more at §eoverthronesmp.tebex.store`)
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
    it.commands.forEach(c => run(s, c.split('{p}').join(p.username)))
    console.info('[throneshop] ' + p.username + ' bought ' + it.name.replace(/&#[0-9a-fA-F]{6}|&./g, '') + ' for ' + it.price + ' shards')
    p.tell(`§a§lThrone Shop §7» You bought §f${it.name.replace(/&#[0-9a-fA-F]{6}|&./g, '')}§7 for §d${fmt(it.price)} Throne Shards§7!`)
    run(s, `execute at ${p.username} run playsound minecraft:entity.player.levelup master ${p.username} ~ ~ ~ 1 1.4`)
  }

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
          sl.item = icon(s, has ? info.candle : 'minecraft:gray_candle', '&' + info.color + '&l' + info.name, lore, has && left <= 0)
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
  ItemEvents.entityInteracted(event => {
    var p = event.player, e = event.target
    if (p == null || e == null) return
    var tags = e.getTags(), type = null
    Object.keys(MENUS).forEach(t => { if (tags.contains('ot_menu_' + t)) type = t })
    var cmd = String(e.persistentData.getString('ot_menu_cmd') || '')
    if (type == null && !cmd) return
    var now = Date.now()
    if (String(event.hand) == 'MAIN_HAND' && now - (lastClick[p.username] || 0) > 500) {
      lastClick[p.username] = now
      if (type != null) { var pp = p, tt = type; p.server.scheduleInTicks(1, () => openMenu(pp, tt)) }
      else asPlayer(p, cmd.replace(/^\//, ''))
    }
    event.cancel()   // stops the NPC's own dialog. Must be last (it ends the handler).
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
  const makeMenuNpc = (server, e, type, cmd, title) => {
    Object.keys(MENUS).forEach(t => e.removeTag('ot_menu_' + t))
    e.persistentData.remove('ot_menu_cmd')
    if (cmd) e.persistentData.putString('ot_menu_cmd', cmd)
    else e.addTag('ot_menu_' + type)
    e.addTag('ot_menu_npc')
    var id = idOf(e)
    setGlow(server, e, GLOW[cmd ? 'cmd' : type])
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
    event.register(Commands.literal('kitmenu').executes(ctx => { openMenu(ctx.source.playerOrException, 'kits'); return 1 }))
    event.register(Commands.literal('levelguide').executes(ctx => { openMenu(ctx.source.playerOrException, 'levels'); return 1 }))
  })
})()
