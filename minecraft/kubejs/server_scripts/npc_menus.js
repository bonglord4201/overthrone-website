// OVERTHRONE - NPCs that open real menus (OG Network style): Throne Shop, Kit Selector, Level Guide, Links,
// plus "command NPCs" that run a command for the player (e.g. /warp hunters, /ah).
//
// Staff (op):
//   /npcmenu spawn <cosmetics|crates|throneshop|kits|levels|links>       new NPC where you stand, glowing, with a hologram above it
//   /npcmenu spawncmd <title> <command...>         new NPC that runs <command> for the player who clicks it
//                                                  e.g. /npcmenu spawncmd Hunters warp hunters
//   /npcmenu attach <cosmetics|crates|throneshop|kits|levels|links>       give the NPC you are LOOKING AT this menu (keeps its skin/spot)
//   /npcmenu attachcmd <command...>                the NPC you are looking at runs this command when clicked
//   /npcmenu detach                                the NPC you are looking at goes back to normal
//   /npcmenu styleall                              ALL your other NPCs within 64 blocks get the same glow + big title +
//                                                  RIGHT-CLICK TO VIEW (what they do when clicked is NOT changed)
//   /npcmenu style [title]                         same for the NPC you look at (title = its name if left out)
//   /npcmenu unstyle                               undo that for the NPC you look at
//   /npcmenu glow <off|on>                         glow off/on for the NPC you look at (stays that way)
//   /npcmenu clearholo [radius]                    deletes ALL floating text within radius (default 4) of you, not crates
//   /npcmenu fixall                                hides the NPC name tags + redoes all menu holograms in your world
//   /npcmenu grab, then /npcmenu put   moves the NPC you looked at to where you stand (hologram too)
//   /npcmenu remove                                deletes the menu NPC you are looking at (and its hologram)
//   /npcmenu hologram <text...>                    (re)places the hologram over the NPC you are looking at.
//                                                  Use | for a new line, e.g. /npcmenu hologram &6&lJOBS|&7Right-click
// Players can also open the menus with commands: /throneshop  /kitmenu  /levelguide
// Bought cosmetics: /cosmetics (all), /tags /namecolor /chatcolor /glowcolor /gradient /status /joinmessage, /flytime
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
  const CHAT_COLOR_PRICE = 650
  const GLOW_PRICE = 900
  const GRADIENT_PRICE = 1499
  const STATUS_PRICE = 499
  const JOIN_PRICE = 599

  // "&#RRGGBB" colour per letter, fading through the given colours
  const grad = (text, stops, bold) => {
    var t = String(text), out = '', n = t.length
    var rgb = stops.map(h => { var v = parseInt(h.replace('#', ''), 16); return [v >> 16 & 255, v >> 8 & 255, v & 255] })
    for (var i = 0; i < n; i++) {
      var f = n == 1 ? 0 : i / (n - 1) * (rgb.length - 1), k = Math.min(rgb.length - 2, Math.floor(f)), r = f - k
      if (rgb.length == 1) { k = 0; r = 0 }
      var a = rgb[k], b = rgb[Math.min(rgb.length - 1, k + 1)]
      var c = [0, 1, 2].map(j => Math.round(a[j] + (b[j] - a[j]) * r))
      out += '&#' + c.map(x => ('0' + x.toString(16)).slice(-2)).join('').toUpperCase() + (bold ? '&l' : '') + t[i]
    }
    return out
  }

  // Chat colours (your message colour)
  const CHAT_COLORS = NAME_COLORS.map(c => [c[0], c[1], c[2], c[3]])
  // Glow colours (glow outline around you): [id, team colour, & code, name, icon]
  const GLOWS = [
    ['red', 'red', '&c', 'Red', 'minecraft:red_stained_glass'], ['dark_red', 'dark_red', '&4', 'Dark Red', 'minecraft:red_terracotta'],
    ['gold', 'gold', '&6', 'Gold', 'minecraft:orange_stained_glass'], ['yellow', 'yellow', '&e', 'Yellow', 'minecraft:yellow_stained_glass'],
    ['green', 'green', '&a', 'Green', 'minecraft:lime_stained_glass'], ['dark_green', 'dark_green', '&2', 'Dark Green', 'minecraft:green_stained_glass'],
    ['aqua', 'aqua', '&b', 'Aqua', 'minecraft:light_blue_stained_glass'], ['dark_aqua', 'dark_aqua', '&3', 'Dark Aqua', 'minecraft:cyan_stained_glass'],
    ['blue', 'blue', '&9', 'Blue', 'minecraft:blue_stained_glass'], ['pink', 'light_purple', '&d', 'Pink', 'minecraft:pink_stained_glass'],
    ['purple', 'dark_purple', '&5', 'Purple', 'minecraft:purple_stained_glass'], ['white', 'white', '&f', 'White', 'minecraft:white_stained_glass'],
    ['gray', 'gray', '&7', 'Gray', 'minecraft:light_gray_stained_glass'], ['black', 'black', '&0', 'Black', 'minecraft:black_stained_glass'],
  ]
  // Gradient bundles: your name in chat fades through these colours, and your messages use the last colour
  const GRADIENTS = [
    ['inferno', 'Inferno', ['#FF1E00', '#FFB300']], ['ocean', 'Ocean', ['#00E5FF', '#2B59FF']], ['toxic', 'Toxic', ['#B6FF00', '#00FF95']],
    ['royal', 'Royal', ['#8A2BE2', '#FF4DFF']], ['sunset', 'Sunset', ['#FF4E50', '#F9D423']], ['frost', 'Frost', ['#E8FBFF', '#59C3FF']],
    ['bloodmoon', 'Bloodmoon', ['#8B0000', '#FF3B2F']], ['gilded', 'Gilded', ['#FFB800', '#FFF2A8']], ['abyss', 'Abyss', ['#00D2FF', '#3A47D5']],
    ['blossom', 'Blossom', ['#FF7EB3', '#FFD1E8']], ['aurora', 'Aurora', ['#00FFA3', '#DC1FFF']], ['throne', 'Throne', ['#FF3B2F', '#FFD700']],
    ['rainbow', 'Rainbow', ['#FF4040', '#FFD040', '#40FF60', '#40C0FF', '#C040FF']], ['shadow', 'Shadow', ['#9E9E9E', '#3A3A3A']],
  ]
  // Statuses: a line of text that floats above your head
  const STATUSES = [
    ['throne_seeker', 'Throne Seeker', ['#FF3B2F', '#FFD700']], ['dragon_tamer', 'Dragon Tamer', ['#00FF95', '#00B3FF']],
    ['loot_goblin', 'Loot Goblin', ['#7CFF00', '#FFD000']], ['crate_addict', 'Crate Addict', ['#FF6A00', '#FF00C8']],
    ['shard_hoarder', 'Shard Hoarder', ['#C04DFF', '#FF7AF5']], ['boss_slayer', 'Boss Slayer', ['#8B0000', '#FF4D4D']],
    ['certified_grinder', 'Certified Grinder', ['#FFAA00', '#FFF06A']], ['sleep_deprived', 'Sleep Deprived', ['#6A5ACD', '#B0C4FF']],
    ['main_character', 'Main Character', ['#FF4DA6', '#FFD1EC']], ['professional_noob', 'Professional Noob', ['#55FF55', '#00AA00']],
    ['afk_legend', 'AFK Legend', ['#AAAAAA', '#FFFFFF']], ['night_owl', 'Night Owl', ['#2B59FF', '#A0B4FF']],
    ['village_menace', 'Village Menace', ['#8B5A2B', '#FFB347']], ['big_brain', 'Big Brain', ['#FF7EB3', '#7AFCFF']],
    ['chaos_agent', 'Chaos Agent', ['#FF0000', '#8A00FF']], ['built_different', 'Built Different', ['#FFD700', '#FF6A00']],
    ['demon_lord', 'Demon Lord in Training', ['#4B0000', '#FF2A2A']], ['touch_grass', 'Should Touch Grass', ['#00C853', '#B2FF59']],
    ['gate_breaker', 'Gate Breaker', ['#00E5FF', '#FF00E5']], ['slime_supreme', 'Slime Supreme', ['#76FF03', '#00E676']],
    ['hunter_s', 'S-Rank Hunter', ['#FFD700', '#FF3B2F', '#C04DFF']],
  ]
  // Join messages: [id, join text, leave text, colours]  ({p} = player name)
  const JOIN_MESSAGES = [
    ['throne_room', '{p} has entered the throne room.', '{p} has left the throne room.', ['#FF3B2F', '#FFD700']],
    ['tremble', '{p} arrived — the realm trembles.', '{p} vanished into the mist.', ['#8A2BE2', '#FF4DFF']],
    ['dragon', '{p} rode in on a dragon.', '{p} flew off on a dragon.', ['#00FF95', '#00B3FF']],
    ['loot', '{p} spawned in. Hide your loot!', '{p} logged off. Your loot is safe... for now.', ['#7CFF00', '#FFD000']],
    ['gates', '{p} returned from the Gates.', '{p} went back through the Gates.', ['#00E5FF', '#FF00E5']],
    ['awakened', '{p} has awakened.', '{p} went back to sleep.', ['#FF4E50', '#F9D423']],
    ['legend', 'A legend has arrived: {p}!', 'The legend {p} has left.', ['#FFD700', '#FFF2A8']],
    ['shadow', '{p} stepped out of the shadows.', '{p} faded back into the shadows.', ['#9E9E9E', '#3A3A3A']],
  ]

  // Throne Shop. Categories hold items or more categories. Item "give" types:
  //   rank / key / tag / namecolor / fly (seconds) / cmd (commands, {p} = player)
  const keyItems = (id, label, color, one) => [
    { icon: 'minecraft:tripwire_hook', name: color + label, detail: '1x', price: one, give: { type: 'key', crate: id, n: 1 } },
    { icon: 'minecraft:tripwire_hook', name: color + label, detail: '5x', price: Math.round(one * 4.5), give: { type: 'key', crate: id, n: 5 } },
    { icon: 'minecraft:tripwire_hook', name: color + label, detail: '10x', price: Math.round(one * 8.5), give: { type: 'key', crate: id, n: 10 } },
    { icon: 'minecraft:tripwire_hook', name: color + label, detail: '25x', price: Math.round(one * 20), give: { type: 'key', crate: id, n: 25 } },
  ]
  const cosCat = (kind, name, ic) => ({ icon: ic, name: name, layout: 'grid', cosKind: kind, children: [] })
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
        desc: ['Message cosmetics include tags that', 'go before your username and rank in', 'chat, join and leave messages that', 'give you a stylish message when you', 'arrive or leave, and statuses that', 'put a message above your head.'],
        layout: 'spaced',
        children: [cosCat('tag', '&b&lCHAT TAGS', 'minecraft:name_tag'), cosCat('join', '&e&lJOIN MESSAGES', 'minecraft:feather'), cosCat('status', '&c&lSTATUSES', 'minecraft:oak_sign')],
      },
      {
        slot: [5, 1], icon: 'minecraft:magenta_dye', name: '&5&lCOLORS & GRADIENTS', kind: 'COSMETIC',
        desc: ['Name colors change how your name', 'shows in chat, chat colors change', 'your messages, glow colors give you', 'a glow outline, and gradient bundles', 'fade your name through colors.'],
        layout: 'spaced',
        children: [cosCat('nc', '&a&lNAME COLORS', 'minecraft:lime_dye'), cosCat('cc', '&e&lCHAT COLORS', 'minecraft:writable_book'), cosCat('glow', '&6&lGLOW COLORS', 'minecraft:glow_ink_sac'), cosCat('grad', grad('GRADIENT BUNDLES', ['#FF4DFF', '#00E5FF'], true), 'minecraft:bucket')],
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
  const comp = (s) => {
    if (String(s).indexOf('&#') >= 0) {
      try {
        var r = Text.of({ text: '', italic: false, extra: compParts(s) })
        if (String(r.getString()) == strip(s)) return r
      } catch (e) { }
    }
    var c = Text.of(legacy(s)); try { c = c.italic(false) } catch (e) { } return c
  }
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
    if (g.type == 'cos') return owns(p, g.kind + ':' + g.id)
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
  // OG-style hover text: what you get, an example, and how to use it
  const KEY_NAMES = { vote: 'Vote Crate Key', runes: 'Rune Crate Key', armor: 'Armor Crate Key', weapon: 'Weapon Crate Key' }
  const howTo = (p, it) => {
    var g = it.give || {}, n = p.username, L = []
    var contents = (a) => { L.push('&8&lCONTENTS:'); a.forEach(x => L.push('&f • ' + x)) }
    var example = (a) => { L.push(''); L.push('&8&lEXAMPLE:'); a.forEach(x => L.push(x)) }
    var use = (a) => { L.push(''); a.forEach(x => L.push('&7' + x)) }
    if (g.type == 'cos') {
      var c = cosById(g.kind, g.id), K = KINDS[g.kind]
      if (g.kind == 'tag') { contents(['1x Chat Tag']); example(['&8[' + c.show + '&8] &f' + n + '&7: &fHello everyone!']) }
      if (g.kind == 'nc') { contents(['1x Name Color']); example([c.code + n + '&7: &fHello everyone!']) }
      if (g.kind == 'cc') { contents(['1x Chat Color']); example(['&f' + n + '&7: ' + c.code + 'This is a test message!']) }
      if (g.kind == 'glow') { contents(['1x Glow Color']); example([c.name.split(' ')[0] + ' glowing outline around you,', '&7seen through walls by other players.']) }
      if (g.kind == 'grad') { contents(['1x Name Color Gradient', '1x Matching Chat Color']); example([grad(n, c.stops, false) + '&7: &' + c.stops[c.stops.length - 1] + 'This is a test message!']) }
      if (g.kind == 'status') { contents(['1x Status']); example(['&7Floats above your head:', c.text]) }
      if (g.kind == 'join') { contents(['1x Join Message', '1x Leave Message']); example([grad(c.join.replace('{p}', n), c.stops, false), grad(c.leave.replace('{p}', n), c.stops, false)]) }
      use(['Apply using &e' + K.cmd + '&7 or &e/cosmetics', 'Wear one of each kind at a time.'])
    } else if (g.type == 'key') {
      contents([g.n + 'x ' + (KEY_NAMES[g.crate] || 'Crate Key')])
      use(['How to use: &fright-click&7 the crate at', 'spawn with the key in your hand.', '&fLeft-click&7 a crate to see its rewards.', 'Your keys: &e/crate keys&7 · Crates: &e/cratemenu'])
    } else if (g.type == 'fly') {
      contents([it.detail + ' of Flight Time'])
      use(['Turn it on/off with &e/flytime&7, then', 'double-jump to fly. Time only counts', 'down while you are flying.', 'Time left: &e/flytime left'])
    } else if (g.type == 'rank') {
      contents(['Permanent ' + strip(it.name).replace(' Rank', '') + ' rank', 'Every rank below it is included'])
      use(['Hover the &fbook&7 and &fsign&7 under this', 'rank to see its perks and commands.', 'You get it straight away after buying.'])
    }
    return L
  }
  const itemIcon = (p, it, bal) => {
    var lore = howTo(p, it)
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
      gui.slot(4, 4, sl => { sl.item = icon(s, 'minecraft:lantern', '&e&lYour Cosmetics', ['&fEquip what you bought.', '&f/cosmetics &7(or /tags, /namecolor, /chatcolor,', '&7/glowcolor, /gradient, /status, /joinmessage)', '&f/flytime &7- turn flight on/off', '', '&e&lCLICK TO OPEN'], false); sl.leftClicked = e => after(p, () => cosmeticsMain(p)) })
      gui.slot(4, 5, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lClose', []); sl.leftClicked = e => { try { p.closeMenu() } catch (x) { } } })
      gui.slot(8, 5, sl => { sl.item = icon(s, 'minecraft:paper', '&e&lHow it works', ['&fClick a category, then click an', '&fitem to buy it with Throne Shards.', '', '&fGet Throne Shards at', '&doverthronesmp.tebex.store'], false) })
    })
  }

  // path = list of categories from the main page down to the open one
  const shopPage = (p, path) => {
    var s = p.server, bal = shardsOf(p), cat = path[path.length - 1], list = cat.children || []
    if (cat.cosKind) list = KINDS[cat.cosKind].list.map(c => ({ icon: c.icon, name: c.name, price: c.price, give: { type: 'cos', kind: cat.cosKind, id: c.id } }))
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
    else if (g.type == 'cos') {
      addOwned(p, g.kind + ':' + g.id)
      run(s, `tellraw ${p.username} ${JSON.stringify(['', { text: 'Equip it: ', color: 'gray' }, { text: '[CLICK HERE]', color: 'light_purple', bold: true, clickEvent: { action: 'run_command', value: KINDS[g.kind].cmd }, hoverEvent: { action: 'show_text', contents: 'Opens ' + KINDS[g.kind].cmd } }, { text: ' or type ' + KINDS[g.kind].cmd + ' / /cosmetics', color: 'gray' }])}`)
    }
    else if (g.type == 'cmd') g.commands.forEach(c => run(s, c.split('{p}').join(p.username)))
    console.info('[throneshop] ' + p.username + ' bought ' + label + ' for ' + it.price + ' shards')
    p.tell(`§a§lThrone Shop §7» You bought §f${label}§7 for §d${fmt(it.price)} Throne Shards§7!`)
    run(s, `execute at ${p.username} run playsound minecraft:entity.player.levelup master ${p.username} ~ ~ ~ 1 1.4`)
  }

  // ======================================================================= cosmetics (tags, colours, glow, gradients, statuses, join messages)
  // Every kind: persistentData key of the equipped one, prefix in the owned list, list of { id, name, icon, price, lore }
  const KINDS = {
    tag: { key: 'ot_tag', title: 'Chat Tags', cmd: '/tags', icon: 'minecraft:name_tag',
      list: TAGS.map(t => ({ id: t[0], name: t[1] + (t[1].length > 4 ? '' : '&f Tag'), icon: 'minecraft:name_tag', price: t[2], show: t[1] })) },
    nc: { key: 'ot_namecolor', title: 'Name Colors', cmd: '/namecolor', icon: 'minecraft:lime_dye',
      list: NAME_COLORS.map(c => ({ id: c[0], name: c[1] + c[2] + ' Name Color', icon: c[3], price: NAME_COLOR_PRICE, code: c[1] })) },
    cc: { key: 'ot_chatcolor', title: 'Chat Colors', cmd: '/chatcolor', icon: 'minecraft:writable_book',
      list: CHAT_COLORS.map(c => ({ id: c[0], name: c[1] + c[2] + ' Chat Color', icon: c[3].replace('_dye', '_wool').replace('minecraft:red_wool', 'minecraft:red_wool'), price: CHAT_COLOR_PRICE, code: c[1] })) },
    glow: { key: 'ot_glow', title: 'Glow Colors', cmd: '/glowcolor', icon: 'minecraft:glow_ink_sac',
      list: GLOWS.map(g => ({ id: g[0], name: g[2] + g[3] + ' Glow', icon: g[4], price: GLOW_PRICE, team: g[1] })) },
    grad: { key: 'ot_gradient', title: 'Gradient Bundles', cmd: '/gradient', icon: 'minecraft:bucket',
      list: GRADIENTS.map(g => ({ id: g[0], name: grad(g[1] + ' Gradient Bundle', g[2], true), icon: 'minecraft:bucket', price: GRADIENT_PRICE, stops: g[2] })) },
    status: { key: 'ot_status', title: 'Statuses', cmd: '/status', icon: 'minecraft:oak_sign',
      list: STATUSES.map(s => ({ id: s[0], name: grad(s[1], s[2], true) + ' &f&lStatus', icon: 'minecraft:oak_sign', price: STATUS_PRICE, text: grad(s[1], s[2], true), label: s[1], stops: s[2] })) },
    join: { key: 'ot_joinmsg', title: 'Join Messages', cmd: '/joinmessage', icon: 'minecraft:feather',
      list: JOIN_MESSAGES.map(j => ({ id: j[0], name: grad(j[1].replace('{p} ', '').replace(' {p}', '').replace('{p}', ''), j[3], false), icon: 'minecraft:feather', price: JOIN_PRICE, join: j[1], leave: j[2], stops: j[3] })) },
  }
  const KIND_ORDER = ['tag', 'nc', 'cc', 'glow', 'grad', 'status', 'join']
  const cosById = (kind, id) => { var l = KINDS[kind].list; for (var i = 0; i < l.length; i++) if (l[i].id == id) return l[i]; return null }
  // the equipped cosmetic of a kind (only if still owned)
  const equipped = (p, kind) => {
    if (p == null) return null
    var c = cosById(kind, String(p.persistentData.getString(KINDS[kind].key) || ''))
    return c && owns(p, kind + ':' + c.id) ? c : null
  }
  // older saves used tag:<id> / nc:<id>, same as the kind names, so they keep working
  const preview = (p, kind, c) => {
    var n = p.username
    if (kind == 'tag') return ['&7In chat: &8[' + c.show + '&8] &f' + n]
    if (kind == 'nc') return ['&7In chat: ' + c.code + n]
    if (kind == 'cc') return ['&7In chat: &f' + n + '&7: ' + c.code + 'Hello everyone!']
    if (kind == 'glow') return ['&7A ' + strip(c.name).toLowerCase() + ' outline around you.']
    if (kind == 'grad') return ['&7In chat: ' + grad(n, c.stops, false) + '&7: ' + '&' + c.stops[c.stops.length - 1] + 'This is a test message!', '&7Changes your name and chat colour.']
    if (kind == 'status') return ['&7Above your head: ' + c.text]
    if (kind == 'join') return ['&7Join: ' + grad(c.join.replace('{p}', n), c.stops, false), '&7Leave: ' + grad(c.leave.replace('{p}', n), c.stops, false)]
    return []
  }

  // ---- chat: tag, name colour / gradient, chat colour, all on top of the rank prefix
  const CHAT_TAIL = '{neoessentials_displayname}&7: '
  const ChatFormats = (() => { try { return Java.loadClass('com.zerog.neoessentials.chat.PlayerChatFormatManager') } catch (e) { return null } })()
  var serverRef = null
  ServerEvents.loaded(event => { serverRef = event.server })
  const playerByUuid = (uuid) => {
    try { if (serverRef != null) return serverRef.getPlayerList().getPlayer(uuid) } catch (e) { }
    return null
  }
  const chatFormat = (uuid, prefix, messageColor, player) => {
    if (ChatFormats == null) return
    var mgr = ChatFormats.getInstance(), pl = player || playerByUuid(uuid)
    var tag = equipped(pl, 'tag'), nc = equipped(pl, 'nc'), cc = equipped(pl, 'cc'), gr = equipped(pl, 'grad')
    prefix = prefix || ''
    if (prefix == '' && !messageColor && !tag && !nc && !cc && !gr) { if (mgr.hasFormat(uuid)) mgr.clearFormat(uuid); return }
    var tagTxt = tag ? '&8[' + tag.show + '&8] ' : ''
    var name = gr ? grad(String(pl.username), gr.stops, false) + '&7: ' : (nc ? nc.code : (prefix == '' && !tagTxt ? '&7' : '&f')) + CHAT_TAIL
    var msg = cc ? cc.code : (gr ? '&' + gr.stops[gr.stops.length - 1] : (messageColor || '&f'))
    var format = prefix + tagTxt + name + msg + '{MESSAGE}'
    if (String(mgr.getFormat(uuid)) != format) mgr.setFormat(uuid, format)
  }
  // Take over the rank script's chat format function so ranks and cosmetics all show together.
  ServerEvents.loaded(event => {
    try { if (typeof rkChatFormat == 'function') { rkChatFormat = chatFormat; console.info('[npc_menus] cosmetics hooked into ranks.js chat format') } }
    catch (e) { console.warn('[npc_menus] could not hook ranks chat format: ' + e) }
  })
  // Puts rank prefix + cosmetics into the player's chat format directly (does not depend on the ranks.js hook).
  const applyChat = (p) => {
    var prefix = '', color = ''
    try {
      if (typeof rkTopRank == 'function' && typeof rkPrefix == 'function') { var top = rkTopRank(p); prefix = top == 'player' ? '' : String(rkPrefix(top)) }
    } catch (e) { console.warn('[npc_menus] rank prefix: ' + e) }
    try { if (typeof chColorFor == 'function') color = String(chColorFor(p) || '') } catch (e) { }
    try { chatFormat(p.getUuid(), prefix, color, p) } catch (e) { console.warn('[npc_menus] chat format: ' + e) }
  }
  const refreshChat = (p) => {
    try { if (typeof rkSyncPlayer == 'function') rkSyncPlayer(p.server, p) } catch (e) { console.warn('[npc_menus] rkSyncPlayer: ' + e) }
    applyChat(p)
  }

  // ---- glow
  const applyGlow = (p) => {
    var s = p.server, g = equipped(p, 'glow')
    if (g == null) run(s, `effect clear ${p.username} minecraft:glowing`)
    else run(s, `effect give ${p.username} minecraft:glowing infinite 0 true`)
    var pl = tagState[p.username]; if (pl) pl.key = ''          // team colour follows the glow
  }

  // ---- nameplates: a floating name above every player = [rank prefix] [tag] name (+ status line above it).
  // Gradient names and statuses slowly flow through their colours. The vanilla name tag is hidden so it doesn't double up.
  const ANIM_TICKS = 3                       // update rate of animated plates (ticks)
  const gradAnim = (text, stops, bold, phase) => {
    // looping gradient: colours slide along the text as phase goes 0 -> 1
    var t = String(text), out = '', n = Math.max(1, t.length)
    var loop = stops.concat([stops[0]])
    var rgb = loop.map(h => { var v = parseInt(h.replace('#', ''), 16); return [v >> 16 & 255, v >> 8 & 255, v & 255] })
    for (var i = 0; i < t.length; i++) {
      var u = ((i / n) * 0.7 + phase) % 1, f = u * (rgb.length - 1), k = Math.min(rgb.length - 2, Math.floor(f)), r = f - k
      var a = rgb[k], c2 = rgb[k + 1]
      var c = [0, 1, 2].map(j => Math.round(a[j] + (c2[j] - a[j]) * r))
      out += '&#' + c.map(x => ('0' + x.toString(16)).slice(-2)).join('').toUpperCase() + (bold ? '&l' : '') + t[i]
    }
    return out
  }
  const plateParts = (str) => {
    // like compParts, but also understands &r (reset) and skips other format codes
    var parts = [], color = 'white', bold = false, buf = '', s2 = String(str)
    var NAMED = { 0: 'black', 1: 'dark_blue', 2: 'dark_green', 3: 'dark_aqua', 4: 'dark_red', 5: 'dark_purple', 6: 'gold', 7: 'gray', 8: 'dark_gray', 9: 'blue', a: 'green', b: 'aqua', c: 'red', d: 'light_purple', e: 'yellow', f: 'white' }
    var flush = () => { if (buf) parts.push({ text: buf, color: color, bold: bold }); buf = '' }
    for (var i = 0; i < s2.length; i++) {
      var ch = s2[i]
      if ((ch == '&' || ch == '§') && s2[i + 1] == '#' && /^[0-9a-fA-F]{6}$/.test(s2.substr(i + 2, 6))) { flush(); color = '#' + s2.substr(i + 2, 6); bold = false; i += 7; continue }
      if ((ch == '&' || ch == '§') && i + 1 < s2.length && /[0-9a-fk-or]/i.test(s2[i + 1])) {
        var c = s2[i + 1].toLowerCase(); flush()
        if (NAMED[c] != null) { color = NAMED[c]; bold = false }
        else if (c == 'l') bold = true
        else if (c == 'r') { color = 'white'; bold = false }
        i++; continue
      }
      buf += ch
    }
    flush()
    return parts
  }
  const rankPrefixOf = (p) => {
    try {
      if (typeof rkTopRank == 'function' && typeof rkPrefix == 'function') { var top = rkTopRank(p); return top == 'player' ? '' : String(rkPrefix(top)) }
    } catch (e) { }
    return ''
  }
  const _unusedPlateText = (p, phase) => {
    var name = String(p.username), tag = equipped(p, 'tag'), nc = equipped(p, 'nc'), gr = equipped(p, 'grad'), st = equipped(p, 'status')
    var line = rankPrefixOf(p) + (tag ? '&8[' + tag.show + '&8] ' : '') + (gr ? gradAnim(name, gr.stops, false, phase) : (nc ? nc.code : '&f') + name)
    var parts = []
    if (st) parts = parts.concat(plateParts(gradAnim(st.label, st.stops, true, phase))).concat([{ text: '\n' }])
    return JSON.stringify([''].concat(parts).concat(plateParts(line)))
  }
  // The real Minecraft name tag (follows the player perfectly, like OG): each player gets their own scoreboard team
  // whose prefix is [rank] [tag] and whose colour is their name colour (or glow colour). Your own tag is never shown to you.
  const COLOR_NAME = { 0: 'black', 1: 'dark_blue', 2: 'dark_green', 3: 'dark_aqua', 4: 'dark_red', 5: 'dark_purple', 6: 'gold', 7: 'gray',
    8: 'dark_gray', 9: 'blue', a: 'green', b: 'aqua', c: 'red', d: 'light_purple', e: 'yellow', f: 'white' }
  const tagState = {}     // username -> { key, status entity, statusText }
  const teamOf = (p) => 'otn_' + String(p.getStringUUID()).replace(/-/g, '').substring(0, 12)
  const nameColor = (p) => {
    var g = equipped(p, 'glow'); if (g) return g.team
    var nc = equipped(p, 'nc'); if (nc) return COLOR_NAME[nc.code.charAt(1)] || 'white'
    var gr = equipped(p, 'grad'); if (gr) return COLOR_NAME[nearest(gr.stops[0])] || 'white'
    return 'white'
  }
  const updateNameTag = (p) => {
    var st = tagState[p.username] || (tagState[p.username] = { key: '' })
    var tag = equipped(p, 'tag')
    var prefix = rankPrefixOf(p) + (tag ? '&8[' + tag.show + '&8] ' : '')
    var color = nameColor(p), team = teamOf(p)
    var cur = null
    try { cur = p.getTeam() } catch (e) { cur = null }
    var key = prefix + '|' + color + '|' + (cur == null ? '' : String(cur.getName()))
    if (key == st.key) return
    var s = p.server
    run(s, `team add ${team}`)
    run(s, `team modify ${team} prefix ${JSON.stringify([''].concat(plateParts(prefix)))}`)
    run(s, `team modify ${team} color ${color}`)
    run(s, 'team modify ' + team + ' nametagVisibility always')
    if (cur == null || String(cur.getName()) != team) run(s, `team join ${team} ${p.username}`)
    try { cur = p.getTeam() } catch (e) { cur = null }
    st.key = prefix + '|' + color + '|' + (cur == null ? '' : String(cur.getName()))
  }
  // status: a text display riding on the player, so it moves exactly with them (no lag), animated colours
  const killPlate = (p) => {
    var st = tagState[p.username]
    if (st && st.e) { try { st.e.discard() } catch (x) { } st.e = null }
    run(p.server, `kill @e[type=minecraft:text_display,tag=ot_plate_${p.username}]`)
  }
  const removeStatus = (p) => { killPlate(p); var st = tagState[p.username]; if (st) st.key = '' }
  const statusJson = (c, phase) => JSON.stringify([''].concat(plateParts(gradAnim(c.label, c.stops, true, phase))))
  const spawnStatus = (p, json) => {
    killPlate(p)
    var f = (n) => Number(n).toFixed(2), tag = 'ot_plate_' + p.username
    var j = json.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    run(p.server, `execute in ${p.level.dimension} run summon minecraft:text_display ${f(p.x)} ${f(p.y + 2)} ${f(p.z)} ` +
      `{Tags:["ot_plate","${tag}"],billboard:"center",alignment:"center",shadow:1b,background:0,` +
      `transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0.72f,0f],scale:[0.85f,0.85f,0.85f]},text:'${j}'}`)
    var found = null
    p.level.getEntities().forEach(e => { if (found == null && e.getTags().contains(tag)) found = e })
    if (found) { try { found.startRiding(p, true) } catch (x) { console.warn('[npc_menus] status ride: ' + x) } }
    var st = tagState[p.username] || (tagState[p.username] = { key: '' })
    st.e = found; st.json = json
  }
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 2 != 0) return
    var phase = (s.tickCount / (ANIM_TICKS * 40)) % 1
    s.players.forEach(p => {
      try {
        if (s.tickCount % 20 == 0) updateNameTag(p)
        var st = tagState[p.username] || (tagState[p.username] = { key: '' })
        var c = equipped(p, 'status')
        if (c == null || p.isSpectator() || p.isInvisible()) { if (st.e) killPlate(p); return }
        var e = st.e
        if (e == null || !e.isAlive() || e.getVehicle() == null || e.getVehicle().getStringUUID() != p.getStringUUID()) { spawnStatus(p, statusJson(c, phase)); return }
        if (s.tickCount % (ANIM_TICKS * 2) == 0) {
          var json = statusJson(c, phase)
          if (json != st.json) { st.json = json; s.runCommandSilent(`data merge entity ${e.getStringUUID()} {text:'${json.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'}`) }
        }
      } catch (x) { console.warn('[npc_menus] name tag: ' + x) }
    })
  })
  PlayerEvents.loggedIn(event => { var st = tagState[event.player.username]; if (st) st.key = '' })
  ServerEvents.loaded(event => { run(event.server, 'kill @e[type=minecraft:text_display,tag=ot_plate]'); run(event.server, 'kill @e[type=minecraft:text_display,tag=ot_status]') })

  // ---- join / leave messages
  const announce = (s, c, text, name) => run(s, `tellraw @a ${JSON.stringify([''].concat(compParts(grad(text.replace('{p}', name), c.stops, false))))}`)
  PlayerEvents.loggedIn(event => {
    var p = event.player
    p.server.scheduleInTicks(30, () => {
      try { var c = equipped(p, 'join'); if (c) announce(p.server, c, c.join, p.username) } catch (e) { }
      try { applyGlow(p) } catch (e) { }
    })
    // after ranks.js has set the rank prefix on join, add the cosmetics on top
    p.server.scheduleInTicks(60, () => { try { applyChat(p) } catch (e) { } })
  })
  PlayerEvents.loggedOut(event => {
    var p = event.player
    try { var c = equipped(p, 'join'); if (c) announce(p.server, c, c.leave, p.username) } catch (e) { }
    try { killPlate(p) } catch (e) { }
  })

  // ---- equip menus: /cosmetics, /tags, /namecolor, /chatcolor, /glowcolor, /gradient, /status, /joinmessage
  const equip = (p, kind, id) => {
    if (id == null) p.persistentData.remove(KINDS[kind].key)
    else p.persistentData.putString(KINDS[kind].key, id)
    // a gradient replaces a plain name colour and the other way round
    if (id != null && kind == 'grad') p.persistentData.remove(KINDS.nc.key)
    if (id != null && kind == 'nc') p.persistentData.remove(KINDS.grad.key)
    if (kind == 'glow') applyGlow(p)
    else if (kind == 'status') removeStatus(p)
    else if (kind != 'join') refreshChat(p)
    var tst = tagState[p.username]; if (tst) tst.key = ''
  }
  const cosmeticsMain = (p) => {
    var s = p.server
    p.openChestGUI(Text.of('Your Cosmetics'), 4, gui => {
      gui.playerSlots = true
      gui.slot(4, 0, sl => { sl.item = icon(s, 'minecraft:book', '&d&lHOW COSMETICS WORK', [
        '&f1. Buy cosmetics in the &dThrone Shop', '&f   (hub NPC or &e/throneshop&f).', '&f2. Open this menu (&e/cosmetics&f) and click', '&f   a category below.',
        '&f3. Click a cosmetic you own to &aequip&f it.', '&f   Click &cUnequip&f to take it off.', '', '&7You can wear one of each kind at once:', '&7a tag, name colour OR gradient, chat colour,', '&7glow, status and join message.'], true) })
      gui.slot(3, 3, sl => { sl.item = icon(s, 'minecraft:amethyst_shard', '&d&lThrone Shop', ['&fBuy more cosmetics.', '', '&e&lCLICK TO OPEN'], true); sl.leftClicked = e => after(p, () => shopMain(p)) })
      gui.slot(5, 3, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lClose', []); sl.leftClicked = e => { try { p.closeMenu() } catch (x) { } } })
      for (var y = 0; y < 4; y++) for (var x = 0; x < 9; x++) {
        if ((y == 0 && x == 4) || (y == 3 && (x == 3 || x == 5))) continue
        (function (xx, yy) { gui.slot(xx, yy, sl => { sl.item = pane(s, PANES.G) }) })(x, y)
      }
      KIND_ORDER.forEach((k, i) => gui.slot(1 + i, 1, sl => {
        var K = KINDS[k], cur = equipped(p, k), n = K.list.filter(c => owns(p, k + ':' + c.id)).length
        sl.item = icon(s, K.icon, '&e&l' + K.title.toUpperCase(), ['&fYou own: &a' + n + '&7/' + K.list.length, '&fEquipped: ' + (cur ? cur.name : '&7none'), '', '&7Also: &e' + K.cmd, '', '&e&lCLICK TO OPEN'], cur != null)
        sl.leftClicked = e => after(p, () => cosmeticMenu(p, k))
      }))
    })
  }
  const cosmeticMenu = (p, kind) => {
    var s = p.server, K = KINDS[kind]
    var mine = K.list.filter(c => owns(p, kind + ':' + c.id)), cur = equipped(p, kind)
    var rows = Math.min(6, Math.max(3, Math.ceil(mine.length / 7) + 2))
    p.openChestGUI(Text.of('Your ' + K.title), rows, gui => {
      gui.playerSlots = true
      for (var y = 0; y < rows; y++) for (var x = 0; x < 9; x++) {
        (function (xx, yy) { gui.slot(xx, yy, sl => { sl.item = pane(s, PANES.G) }) })(x, y)
      }
      mine.forEach((c, i) => {
        if (1 + Math.floor(i / 7) >= rows - 1) return
        gui.slot(1 + (i % 7), 1 + Math.floor(i / 7), sl => {
          var on = cur != null && cur.id == c.id
          sl.item = icon(s, c.icon, c.name, preview(p, kind, c).concat(['', on ? '&a&lEQUIPPED' : '&e&lCLICK TO EQUIP']), on)
          sl.leftClicked = e => after(p, () => { equip(p, kind, c.id); p.tell('§a✔ Equipped ' + strip(c.name) + '.'); cosmeticMenu(p, kind) })
        })
      })
      if (!mine.length) gui.slot(4, 1, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lYou don\'t own any yet', ['&7Buy them in the &dThrone Shop&7.'], false) })
      gui.slot(3, rows - 1, sl => { sl.item = icon(s, 'minecraft:arrow', '&e&lAll Cosmetics', [], false); sl.leftClicked = e => after(p, () => cosmeticsMain(p)) })
      gui.slot(5, rows - 1, sl => {
        sl.item = icon(s, 'minecraft:bucket', '&c&lUnequip', ['&7Remove your ' + K.title.toLowerCase().replace(/s$/, '')], false)
        sl.leftClicked = e => after(p, () => { equip(p, kind, null); p.tell('§7Removed.'); cosmeticMenu(p, kind) })
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
    if (serverRef == null) serverRef = s
    // every 30 s: make sure chat cosmetics are still in the chat format (other scripts may rewrite it)
    if (s.tickCount % 600 == 0) s.players.forEach(p => {
      if (equipped(p, 'tag') || equipped(p, 'nc') || equipped(p, 'cc') || equipped(p, 'grad')) applyChat(p)
    })
    s.players.forEach(p => {
      if (!p.persistentData.getBoolean('ot_fly_on') || p.isCreative() || p.isSpectator()) return
      var a = p.getAbilities()
      if (flyBlocked(p)) { if (a.mayfly) { setFlight(p, false); p.tell('§c✈ Flight is off in this world.') } return }
      if (!a.mayfly) setFlight(p, true)
      if (!a.flying) return
      var left = flyLeft(p) - 1
      p.persistentData.putInt('ot_fly_left', Math.max(0, left))
      // live countdown above the hotbar while flying
      run(s, `title ${p.username} actionbar {"text":"✈ Flight time left: ${dur(Math.max(0, left) * 1000)}","color":"aqua"}`)
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

  // ======================================================================= Crates
  const CRATE_INFO = [
    { id: 'vote', x: 1, y: 2, icon: 'minecraft:lime_shulker_box', name: '&a&lVOTING CRATE', get: ['&fFree keys: vote every day!', '&fType &e/vote&f or click here.'], vote: true },
    { id: 'runes', x: 3, y: 2, icon: 'minecraft:cyan_shulker_box', name: '&b&lRUNE CRATE', get: ['&fKeys on the store or for', '&dThrone Shards&f.'] },
    { id: 'armor', x: 5, y: 2, icon: 'minecraft:magenta_shulker_box', name: '&d&lARMOR CRATE', get: ['&fKeys on the store or for', '&dThrone Shards&f.'] },
    { id: 'weapon', x: 7, y: 2, icon: 'minecraft:orange_shulker_box', name: '&6&lWEAPON CRATE', get: ['&fKeys on the store or for', '&dThrone Shards&f.'] },
    { id: 'legendary', x: 2, y: 3, icon: 'minecraft:yellow_shulker_box', name: '&6&lLEGENDARY CRATE', get: ['&fEarn keys from events & quests.'] },
    { id: 'mythic', x: 4, y: 3, icon: 'minecraft:purple_shulker_box', name: '&5&lMYTHIC CRATE', get: ['&fEarn keys from bosses & Gates.'] },
    { id: 'event', x: 6, y: 3, icon: 'minecraft:red_shulker_box', name: '&c&lEVENT CRATE', get: ['&fKeys from server events.'] },
  ]
  const keyCount = (p, id) => {
    var n = 0
    try {
      var inv = p.getInventory()
      for (var i = 0; i < inv.getContainerSize(); i++) {
        var st = inv.getItem(i)
        if (!st.isEmpty() && String(st.id) == 'minecraft:tripwire_hook' && String(st.getComponents()).indexOf('ot_key_' + id) >= 0) n += st.getCount()
      }
    } catch (e) { }
    return n
  }
  const voteLinks = (p) => {
    var V = [['Minecraft-MP', 'https://minecraft-mp.com/server/364807/vote/'], ['MinecraftServers.org', 'https://minecraftservers.org/vote/694195'], ['MinecraftBestServers', 'https://minecraftbestservers.com/server-overthrone-smp.7252']]
    run(p.server, `tellraw ${p.username} ${JSON.stringify({ text: 'Vote on every site, every day for a free Vote Key:', color: 'green' })}`)
    V.forEach(v => run(p.server, `tellraw ${p.username} ${JSON.stringify(['', { text: ' ➤ ', color: 'dark_gray' }, { text: v[0], color: 'aqua', underlined: true, clickEvent: { action: 'open_url', value: v[1] }, hoverEvent: { action: 'show_text', contents: 'Click to vote' } }])}`))
  }
  const crateMenu = (p) => {
    var s = p.server, counts = {}
    CRATE_INFO.forEach(c => { counts[c.id] = keyCount(p, c.id) })   // counted before the menu takes the inventory
    var keysCat = null
    SHOP.children.forEach(c => { if (strip(c.name).indexOf('CRATE KEYS') >= 0) keysCat = c })
    p.openChestGUI(Text.of('Crates'), 6, gui => {
      gui.playerSlots = true
      for (var y = 0; y < 6; y++) for (var x = 0; x < 9; x++) {
        (function (xx, yy) { gui.slot(xx, yy, sl => { sl.item = pane(s, PANES.G) }) })(x, y)
      }
      gui.slot(4, 0, sl => { sl.item = icon(s, 'minecraft:tripwire_hook', '&e&lCRATES', ['&fCrates are at spawn.', '', '&e&lRight-click&f a crate with its key to open it.', '&e&lLeft-click&f a crate to see its rewards.', '', '&c&lPaid keys are non-RNG:', '&fyou pick the reward you want!'], true) })
      CRATE_INFO.forEach(c => gui.slot(c.x, c.y, sl => {
        var lore = c.get.slice()
        lore.push('')
        lore.push('&fYour keys: ' + (counts[c.id] > 0 ? '&a&l' : '&c&l') + counts[c.id])
        var shopSub = null
        if (keysCat) keysCat.children.forEach(k => { if (k.children && k.children[0] && k.children[0].give.crate == c.id) shopSub = k })
        if (c.vote) lore.push('', '&e&lCLICK FOR THE VOTE LINKS')
        else if (shopSub) lore.push('', '&e&lCLICK TO BUY KEYS')
        sl.item = icon(s, c.icon, c.name, lore, counts[c.id] > 0)
        sl.leftClicked = e => {
          if (c.vote) after(p, () => voteLinks(p))
          else if (shopSub) after(p, () => shopPage(p, [keysCat, shopSub]))
        }
      }))
      gui.slot(3, 5, sl => { sl.item = icon(s, 'minecraft:amethyst_shard', '&d&lThrone Shop', ['&fBuy crate keys with Throne Shards.', '', '&e&lCLICK TO OPEN'], true); sl.leftClicked = e => after(p, () => keysCat ? shopPage(p, [keysCat]) : shopMain(p)) })
      gui.slot(4, 5, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lClose', []); sl.leftClicked = e => { try { p.closeMenu() } catch (x) { } } })
      gui.slot(5, 5, sl => { sl.item = icon(s, 'minecraft:gold_ingot', '&e&lWebstore', ['&fKeys, ranks and Throne Shards.', '', '&e&lCLICK FOR THE LINK'], false); sl.leftClicked = e => after(p, () => storeLink(p)) })
    })
  }

  const MENUS = { cosmetics: p => cosmeticsMain(p), crates: crateMenu, throneshop: shopMain, kits: kitMenu, levels: levelGuide, links: linksMenu }
  const TITLES = {
    cosmetics: ['&d&lCOSMETICS', '&fRIGHT-CLICK TO VIEW'],
    crates: ['&e&lCRATES', '&fRIGHT-CLICK TO VIEW'],
    throneshop: ['&d&lTHRONE SHOP', '&fRIGHT-CLICK TO VIEW'],
    kits: ['&6&lKITS', '&fRIGHT-CLICK TO VIEW'],
    levels: ['&a&lLEVEL GUIDE', '&fRIGHT-CLICK TO VIEW'],
    links: ['&b&lSERVER LINKS', '&fRIGHT-CLICK TO VIEW'],
  }
  const GLOW = { cosmetics: 'light_purple', crates: 'yellow', throneshop: 'light_purple', kits: 'gold', levels: 'green', links: 'aqua', cmd: 'yellow' }
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
    if (held.indexOf('easy_npc') == 0) return false   // easy_npc:..., easy_npc_config_ui:easy_npc_wand, ...
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
    run(server, `team modify ot_glow_${color} nametagVisibility never`)
    run(server, `team join ot_glow_${color} ${uuidOf(e)}`)
    // /npcmenu glow off puts the tag ot_noglow on an NPC: it stays off through fixall/styleall
    run(server, `data merge entity ${uuidOf(e)} {Glowing:${e.getTags().contains('ot_noglow') ? 0 : 1}b}`)
  }
  const idOf = (e) => {
    var id = null
    e.getTags().forEach(t => { if (String(t).indexOf('ot_mid_') == 0) id = String(t) })
    if (id == null) { id = 'ot_mid_' + Date.now().toString(36); e.addTag(id) }
    return id
  }
  const OPEN_CMD = { cosmetics: 'cosmetics', crates: 'cratemenu', throneshop: 'throneshop', kits: 'kitmenu', levels: 'levelguide', links: 'links' }
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
      if (e.getTags().contains('ot_styled') && !e.getTags().contains('ot_menu_npc')) { restyle(s, e); ids.push(idOf(e)); n++; return }
      if (!e.getTags().contains('ot_menu_npc')) return
      var t = typeOfNpc(e), cmd = String(e.persistentData.getString('ot_menu_cmd') || '')
      if (t == null && !cmd) return
      var id = idOf(e)
      ids.push(id)
      hideName(s, e)
      clearClickAction(s, e)
      clearOldTitles(e)
      setGlow(s, e, GLOW[t != null ? t : 'cmd'])
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
  // ---- "style only": glow + big hologram for your other NPCs (dialogs/commands/skins untouched)
  const TEAM_OF = {}
  Object.keys(LEGACY).forEach(k => { TEAM_OF[LEGACY[k]] = k })
  const nameInfo = (e) => {
    var out = { text: '', hex: '#FFAA00' }
    try {
      var nm = e.getCustomName()
      if (nm == null) return out
      out.text = String(nm.getString()).trim()
      var c = nm.getStyle().getColor()
      if (c == null && nm.getSiblings().size() > 0) c = nm.getSiblings().get(0).getStyle().getColor()
      if (c != null) { var v = Number(c.getValue()); out.hex = '#' + ('000000' + v.toString(16)).slice(-6).toUpperCase() }
    } catch (x) { }
    return out
  }
  // removes the small old title text (e.g. "Click to open your quest book") floating over this NPC
  const clearOldTitles = (e) => {
    var n = 0
    e.level.getEntities().forEach(t => {
      if (String(t.type) != 'minecraft:text_display') return
      var mine = false
      t.getTags().forEach(g => { var x = String(g); if (x.indexOf('ot_') == 0 || x == 'holo' || x.indexOf('holo_') == 0) mine = true })
      if (mine) return
      var dx = t.x - e.x, dz = t.z - e.z, dy = t.y - e.y
      if (dx * dx + dz * dz <= 2.25 && dy > 0.5 && dy < 4.5) { t.discard(); n++ }
    })
    return n
  }
  // NPCs with a dialog show their name as the dialog window's title, so their name must stay.
  const hasDialog = (e) => {
    try {
      var d = e.nbt.getCompound('DialogData'), t = String(d.getString('Type'))
      return t != '' && t != 'NONE' && d.getList('DialogDataSet', 10).size() > 0
    } catch (x) { return false }
  }
  const styleNpc = (server, e, title, hex) => {
    e.persistentData.putString('ot_style_title', title)
    e.persistentData.putString('ot_style_color', hex)
    e.addTag('ot_styled')
    setGlow(server, e, TEAM_OF[nearest(hex)] || 'gold')
    // the small name under the hologram: removed (the hologram is the name now), except on dialog NPCs
    if (!hasDialog(e)) hideName(server, e)
    clearOldTitles(e)
    placeHolo(server, e, ['&' + hex + '&l' + String(title).toUpperCase(), '&fRIGHT-CLICK TO VIEW'], idOf(e))
  }
  const restyle = (server, e) => styleNpc(server, e, String(e.persistentData.getString('ot_style_title')), String(e.persistentData.getString('ot_style_color') || '#FFAA00'))

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
    clearOldTitles(e)   // the setup's small "Click for ..." text over this NPC
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
  const glowCmd = (ctx, on) => {
    var p = ctx.source.playerOrException, e = looked(p)
    if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
    if (on) e.removeTag('ot_noglow'); else e.addTag('ot_noglow')
    run(p.server, `data merge entity ${uuidOf(e)} {Glowing:${on ? 1 : 0}b}`)
    say(ctx.source, '§a[npcmenu] Glow ' + (on ? 'ON' : 'OFF') + ' for this NPC. §7It stays that way (fixall/styleall keep it).')
    return 1
  }
  // deletes every floating text within <radius> blocks of you (crate holograms are kept)
  const clearHolo = (ctx, radius) => {
    var p = ctx.source.playerOrException, n = 0
    p.level.getEntities().forEach(t => {
      if (String(t.type) != 'minecraft:text_display' || t.distanceTo(p) > radius) return
      var crate = false
      t.getTags().forEach(g => { if (String(g).indexOf('ot_crate') == 0) crate = true })
      if (crate) return
      t.discard(); n++
    })
    say(ctx.source, '§a[npcmenu] Removed ' + n + ' floating texts within ' + radius + ' blocks. §7Now /npcmenu fixall and /npcmenu styleall put the right ones back.')
    return 1
  }
  const NPC_NAMES = { cosmetics: ['Cosmetics', '#FF55FF'], crates: ['Crates', '#FFFF55'], throneshop: ['Throne Shop', '#E05CFF'], kits: ['Kit Selector', '#FFAA00'], levels: ['Level Guide', '#55FF55'], links: ['Server Links', '#55FFFF'] }

  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    const StringArg = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
    const typeArg = () => Commands.argument('type', StringArg.word()).suggests((c, b) => { Object.keys(MENUS).forEach(t => b.suggest(t)); return b.buildFuture() })
    const typeOf = (ctx) => { var t = String(StringArg.getString(ctx, 'type')).toLowerCase(); return MENUS[t] ? t : null }
    const guard = (ctx, fn) => { try { return fn() } catch (e) { say(ctx.source, '§c[npcmenu] ' + e); console.error('[npcmenu] ' + e); return 0 } }

    event.register(Commands.literal('npcmenu').requires(src => src.hasPermission(2))
      .then(Commands.literal('spawn').then(typeArg().executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, t = typeOf(ctx)
        if (!t) { say(ctx.source, '§cUse: cosmetics, crates, throneshop, kits, levels or links'); return 0 }
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
        if (!t) { say(ctx.source, '§cUse: cosmetics, crates, throneshop, kits, levels or links'); return 0 }
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
      .then(Commands.literal('style').executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = looked(p)
        if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
        var ni = nameInfo(e)
        if (!ni.text) { say(ctx.source, '§cThis NPC has no name. Use /npcmenu style <title>'); return 0 }
        styleNpc(p.server, e, ni.text, ni.hex)
        say(ctx.source, '§a[npcmenu] Styled "' + ni.text + '". §7Clicking it works exactly like before.')
        return 1
      })).then(Commands.argument('title', StringArg.greedyString()).executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = looked(p)
        if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
        var t = String(StringArg.getString(ctx, 'title')), ni = nameInfo(e)
        styleNpc(p.server, e, t, ni.hex)
        say(ctx.source, '§a[npcmenu] Styled "' + t + '". §7Clicking it works exactly like before.')
        return 1
      }))))
      .then(Commands.literal('styleall').executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, done = [], skipped = 0, kept = []
        p.level.getEntities().forEach(e => {
          if (String(e.type).indexOf('easy_npc') < 0 || e.getTags().contains('ot_menu_npc')) return
          if (e.distanceTo(p) > 64) return
          if (hasDialog(e)) kept.push(nameInfo(e).text || String(e.persistentData.getString('ot_style_title')))
          if (e.getTags().contains('ot_styled')) { restyle(p.server, e); done.push(String(e.persistentData.getString('ot_style_title'))); return }
          var ni = nameInfo(e)
          if (!ni.text) { skipped++; return }
          styleNpc(p.server, e, ni.text, ni.hex)
          done.push(ni.text)
        })
        say(ctx.source, '§a[npcmenu] Styled ' + done.length + ' NPCs: §f' + done.join(', ') + (skipped ? ' §7(' + skipped + ' without a name skipped)' : ''))
        say(ctx.source, '§7Only the look changed: glow, big title, RIGHT-CLICK TO VIEW. Dialogs/commands/skins are the same.')
        if (kept.length) say(ctx.source, '§e' + kept.join(', ') + '§7 kept their small name: it is also the title of their dialog window.')
        return 1
      })))
      .then(Commands.literal('unstyle').executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = looked(p)
        if (e == null || !e.getTags().contains('ot_styled')) { say(ctx.source, '§cLook straight at a styled NPC.'); return 0 }
        run(p.server, `kill @e[type=minecraft:text_display,tag=${idOf(e)}]`)
        run(p.server, `team leave ${uuidOf(e)}`)
        run(p.server, `data merge entity ${uuidOf(e)} {Glowing:0b}`)
        var nameJson = JSON.stringify({ text: String(e.persistentData.getString('ot_style_title')), color: String(e.persistentData.getString('ot_style_color') || '#FFAA00'), bold: true })
        run(p.server, `data merge entity ${uuidOf(e)} {CustomName:'${nameJson.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',CustomNameVisible:1b}`)
        e.removeTag('ot_styled')
        say(ctx.source, '§a[npcmenu] Back to how it was (its small title text comes back with /setupcoords apply).')
        return 1
      })))
      .then(Commands.literal('glow')
        .then(Commands.literal('off').executes(ctx => guard(ctx, () => glowCmd(ctx, false))))
        .then(Commands.literal('on').executes(ctx => guard(ctx, () => glowCmd(ctx, true)))))
      .then(Commands.literal('clearholo').executes(ctx => guard(ctx, () => clearHolo(ctx, 4)))
        .then(Commands.argument('radius', Arguments.INTEGER.create(event)).executes(ctx => guard(ctx, () => clearHolo(ctx, Arguments.INTEGER.getResult(ctx, 'radius'))))))
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
    const cosCmd = (name, fn) => event.register(Commands.literal(name).executes(ctx => { var p = ctx.source.playerOrException; try { fn(p) } catch (e) { p.tell('§c' + e); console.error('[npc_menus] ' + e) } return 1 }))
    cosCmd('cosmetics', p => cosmeticsMain(p))
    cosCmd('tags', p => cosmeticMenu(p, 'tag'))
    cosCmd('namecolor', p => cosmeticMenu(p, 'nc'))
    cosCmd('chatcolor', p => cosmeticMenu(p, 'cc'))
    cosCmd('glowcolor', p => cosmeticMenu(p, 'glow'))
    cosCmd('gradient', p => cosmeticMenu(p, 'grad'))
    cosCmd('status', p => cosmeticMenu(p, 'status'))
    cosCmd('joinmessage', p => cosmeticMenu(p, 'join'))

    // Tebex / staff: otcosmetic give|take <player> <kind> <id>     (console works, player must be online)
    // kinds: tag, namecolor, chatcolor, glow, gradient, status, joinmessage   (ids: /otcosmetic list)
    const KIND_ALIAS = { tag: 'tag', namecolor: 'nc', chatcolor: 'cc', glow: 'glow', gradient: 'grad', status: 'status', joinmessage: 'join' }
    const kindSuggest = (c, b) => { Object.keys(KIND_ALIAS).forEach(k => b.suggest(k)); return b.buildFuture() }
    const idSuggest = (c, b) => {
      var k = KIND_ALIAS[String(StringArg.getString(c, 'kind')).toLowerCase()]
      if (k) KINDS[k].list.forEach(x => b.suggest(x.id))
      return b.buildFuture()
    }
    const cosGive = (ctx, take) => {
      var src = ctx.source, p = Arguments.PLAYER.getResult(ctx, 'player')
      var kname = String(StringArg.getString(ctx, 'kind')).toLowerCase(), k = KIND_ALIAS[kname], id = String(StringArg.getString(ctx, 'id')).toLowerCase()
      if (!k) { say(src, '§c[otcosmetic] Unknown kind "' + kname + '". Use: ' + Object.keys(KIND_ALIAS).join(', ')); return 0 }
      var c = cosById(k, id)
      if (!c) { say(src, '§c[otcosmetic] Unknown ' + kname + ' "' + id + '". See /otcosmetic list ' + kname); return 0 }
      if (take) {
        p.persistentData.putString('ot_owned', owned(p).filter(x => x != k + ':' + id).join(','))
        if (String(p.persistentData.getString(KINDS[k].key)) == id) equip(p, k, null)
        say(src, '§a[otcosmetic] Took ' + kname + ' ' + id + ' from ' + p.username)
      } else {
        addOwned(p, k + ':' + id)
        say(src, '§a[otcosmetic] Gave ' + kname + ' ' + id + ' to ' + p.username)
        p.tell('§d§lThrone Shop §7» You received §f' + strip(c.name) + '§7!')
        run(p.server, `tellraw ${p.username} ${JSON.stringify(['', { text: 'Equip it: ', color: 'gray' }, { text: '[CLICK HERE]', color: 'light_purple', bold: true, clickEvent: { action: 'run_command', value: KINDS[k].cmd } }, { text: ' or type ' + KINDS[k].cmd, color: 'gray' }])}`)
      }
      console.info('[otcosmetic] ' + (take ? 'take ' : 'give ') + p.username + ' ' + kname + ' ' + id)
      return 1
    }
    const giveTake = (take) => Commands.argument('player', Arguments.PLAYER.create(event))
      .then(Commands.argument('kind', StringArg.word()).suggests(kindSuggest)
        .then(Commands.argument('id', StringArg.word()).suggests(idSuggest).executes(ctx => cosGive(ctx, take))))
    event.register(Commands.literal('otcosmetic').requires(src => src.hasPermission(2))
      .then(Commands.literal('give').then(giveTake(false)))
      .then(Commands.literal('take').then(giveTake(true)))
      .then(Commands.literal('list').then(Commands.argument('kind', StringArg.word()).suggests(kindSuggest).executes(ctx => {
        var k = KIND_ALIAS[String(StringArg.getString(ctx, 'kind')).toLowerCase()]
        if (!k) { say(ctx.source, '§cUse: ' + Object.keys(KIND_ALIAS).join(', ')); return 0 }
        say(ctx.source, '§e' + KINDS[k].list.map(x => x.id).join(', '))
        return 1
      }))))
    event.register(Commands.literal('flytime').executes(ctx => { flyToggle(ctx.source.playerOrException); return 1 })
      .then(Commands.literal('left').executes(ctx => {
        var p = ctx.source.playerOrException
        p.tell('§b✈ Flight time left: §f' + dur(flyLeft(p) * 1000) + (p.persistentData.getBoolean('ot_fly_on') ? ' §a(ON)' : ' §7(OFF)'))
        return 1
      }))
      .then(Commands.literal('give').requires(src => src.hasPermission(2)).then(Commands.argument('player', Arguments.PLAYER.create(event))
        .then(Commands.argument('minutes', Arguments.INTEGER.create(event)).executes(ctx => {
          var p = Arguments.PLAYER.getResult(ctx, 'player'), m = Arguments.INTEGER.getResult(ctx, 'minutes')
          addFly(p, m * 60)
          ctx.source.sendSystemMessage(Text.of('§a[flytime] Gave ' + p.username + ' ' + m + ' minutes of flight.'))
          return 1
        }))))
      .then(Commands.literal('take').requires(src => src.hasPermission(2)).then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var p = Arguments.PLAYER.getResult(ctx, 'player')
        p.persistentData.putInt('ot_fly_left', 0); p.persistentData.putBoolean('ot_fly_on', false); setFlight(p, false)
        ctx.source.sendSystemMessage(Text.of('§a[flytime] Removed all flight time from ' + p.username + '.'))
        return 1
      }))))
    event.register(Commands.literal('cratemenu').executes(ctx => { openMenu(ctx.source.playerOrException, 'crates'); return 1 }))
    event.register(Commands.literal('kitmenu').executes(ctx => { openMenu(ctx.source.playerOrException, 'kits'); return 1 }))
    event.register(Commands.literal('levelguide').executes(ctx => { openMenu(ctx.source.playerOrException, 'levels'); return 1 }))
  })
})()
