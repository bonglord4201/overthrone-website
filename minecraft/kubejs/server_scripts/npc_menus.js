// OVERTHRONE - NPCs that open real menus (OG Network style): Throne Shop, Kit Selector, Level Guide, Links,
// plus "command NPCs" that run a command for the player (e.g. /warp hunters, /ah).
//
// Staff (op):
//   /npcmenu spawn <cosmetics|crates|throneshop|kits|levels|links|claims|smp|professions>       new NPC where you stand, glowing, with a hologram above it
//   /npcmenu spawncmd <title> <command...>         new NPC that runs <command> for the player who clicks it
//                                                  e.g. /npcmenu spawncmd Hunters warp hunters
//   /npcmenu attach <cosmetics|crates|throneshop|kits|levels|links|claims|smp|professions>       give the NPC you are LOOKING AT this menu (keeps its skin/spot)
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
//   /npcmenu info                  what the NPC you look at is: its menu, id, holograms, and whether it's a copy sharing an id
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
      {
        slot: [3, 3], icon: 'minecraft:grass_block', name: '&a&lCLAIM BLOCKS', kind: 'VIRTUAL ITEM',
        desc: ['Claim blocks let you protect', 'more land. Claim with a &6golden', '&6shovel&f: right-click two opposite', 'corners of your base.'],
        layout: 'spaced',
        children: [
          { icon: 'minecraft:grass_block', name: '&a&lClaim Blocks', detail: '500 blocks', price: 100, give: { type: 'claim', n: 500 } },
          { icon: 'minecraft:grass_block', name: '&a&lClaim Blocks', detail: '1,000 blocks', price: 180, give: { type: 'claim', n: 1000 } },
          { icon: 'minecraft:grass_block', name: '&a&lClaim Blocks', detail: '2,500 blocks', price: 400, give: { type: 'claim', n: 2500 } },
          { icon: 'minecraft:grass_block', name: '&a&lClaim Blocks', detail: '5,000 blocks', price: 750, give: { type: 'claim', n: 5000 } },
        ],
      },
      { slot: [5, 3], icon: 'minecraft:black_shulker_box', name: '&b&lAUTOSELL CHESTS', kind: 'ITEM', desc: ['Sell the contents of a chest to', 'the server shop automatically.'], soon: true },
      {
        slot: [7, 3], icon: 'minecraft:blaze_powder', name: '&6&lPARTICLE EFFECTS', kind: 'COSMETIC',
        desc: ['Animated auras around you, trails', 'behind you and effects when you', 'get a kill. Everyone sees them,', 'no download needed.', '', '&8Some rare ones only come', '&8from crates.'],
        layout: 'spaced',
        children: [cosCat('aura', '&6&lAURAS', 'minecraft:blaze_powder'), cosCat('trail', '&c&lTRAILS', 'minecraft:campfire'), cosCat('killfx', '&4&lKILL EFFECTS', 'minecraft:wither_skeleton_skull')],
      },
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
    if (g.type == 'manas') return owns(p, 'manas:' + g.id)
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
      if (K && K.fx) { contents(['1x ' + K.title.replace(/s$/, '') + ' (animated)']); use((c.desc || []).concat(['Everyone sees it, no download needed.'])) }
      if (g.kind == 'join') { contents(['1x Join Message', '1x Leave Message']); example([grad(c.join.replace('{p}', n), c.stops, false), grad(c.leave.replace('{p}', n), c.stops, false)]) }
      use(['Apply using &e' + K.cmd + '&7 or &e/cosmetics', 'Wear one of each kind at a time.'])
    } else if (g.type == 'key') {
      contents([g.n + 'x ' + (KEY_NAMES[g.crate] || 'Crate Key')])
      use(['How to use: &fright-click&7 the crate at', 'spawn with the key in your hand.', '&fLeft-click&7 a crate to see its rewards.', 'Your keys: &e/crate keys&7 · Crates: &e/cratemenu'])
    } else if (g.type == 'fly') {
      contents([it.detail + ' of Flight Time'])
      use(['Turn it on/off with &e/flytime&7, then', 'double-jump to fly. Time only counts', 'down while you are flying.', 'Time left: &e/flytime left'])
    } else if (g.type == 'claim') {
      contents([it.detail.replace(' blocks', '') + ' Claim Blocks'])
      use(['Claim land with a &6golden shovel&7:', '&fright-click&7 one corner, then the', 'opposite corner. 1 block of area = 1', 'claim block. No shovel? &e/claimtool', 'Check your blocks: &e/flan list'])
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
    if (cat.cosKind) list = KINDS[cat.cosKind].list.filter(c => !c.crate && c.price).map(c => ({ icon: c.icon, name: c.name, price: c.price, give: { type: 'cos', kind: cat.cosKind, id: c.id } }))
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
    else if (g.type == 'claim') { run(s, `flan giveClaimBlocks ${p.username} ${g.n}`); p.tell('§7Claim with a §6golden shovel§7. Your claim blocks: §e/flan list') }
    else if (g.type == 'cos') {
      addOwned(p, g.kind + ':' + g.id)
      run(s, `tellraw ${p.username} ${JSON.stringify(['', { text: 'Equip it: ', color: 'gray' }, { text: '[CLICK HERE]', color: 'light_purple', bold: true, clickEvent: { action: 'run_command', value: KINDS[g.kind].cmd }, hoverEvent: { action: 'show_text', contents: 'Opens ' + KINDS[g.kind].cmd } }, { text: ' or type ' + KINDS[g.kind].cmd + ' / /cosmetics', color: 'gray' }])}`)
    }
    else if (g.type == 'manas') {
      run(s, `manas_cosmetics unlock ${p.username} ${g.id}`)
      addOwned(p, 'manas:' + g.id)
      run(s, `tellraw ${p.username} ${JSON.stringify(['', { text: 'Equip it: ', color: 'gray' }, { text: '[OPEN WARDROBE]', color: 'light_purple', bold: true, clickEvent: { action: 'run_command', value: '/wardrobe' }, hoverEvent: { action: 'show_text', contents: 'Opens your wardrobe' } }, { text: ' or type /wardrobe', color: 'gray' }])}`)
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
  // animated particle cosmetics (cosmetics_fx.js): auras, trails, kill effects
  const FXK = { aura: ['ot_aura', 'Auras', '/aura', 'minecraft:blaze_powder'], trail: ['ot_trail', 'Trails', '/trail', 'minecraft:campfire'], killfx: ['ot_killfx', 'Kill Effects', '/killeffect', 'minecraft:wither_skeleton_skull'] }
  if (typeof OT_FX !== 'undefined') Object.keys(FXK).forEach(k => {
    KINDS[k] = { key: FXK[k][0], title: FXK[k][1], cmd: FXK[k][2], icon: FXK[k][3], fx: true,
      list: OT_FX[k].map(c => ({ id: c.id, name: c.name, icon: c.icon, price: c.price, crate: !!c.crate, desc: c.desc })) }
  })
  const KIND_ORDER = ['tag', 'nc', 'cc', 'glow', 'grad', 'status', 'join'].concat(Object.keys(FXK).filter(k => KINDS[k]))
  // 3D cosmetics (Manas Cosmetics mod, list in manas_cosmetics.js) take the PARTICLE EFFECTS spot in the Throne Shop.
  // The particle effects (cosmetics_fx.js) stay in /cosmetics if that file is on, but aren't sold any more.
  SHOP.children = SHOP.children.filter(c => c.name != '&6&lPARTICLE EFFECTS')
  // (no const inside blocks: KubeJS's Rhino fails the WHOLE file on that, which stopped every NPC click on 2026-10-18)
  var manasCat = (key, name, ic, desc) => ({ icon: ic, name: name, layout: 'grid', desc: desc,
      children: OT_MANAS[key].filter(c => !c.crate && c.price).map(c => ({ icon: c.icon, name: c.name, price: c.price,
        desc: ['A real 3D cosmetic.', '', '&7Equip it in your wardrobe:', '&f/wardrobe'], give: { type: 'manas', id: c.id } })) })
  try {
    if (typeof OT_MANAS !== 'undefined') SHOP.children.push({
      slot: [7, 3], icon: 'minecraft:elytra', name: '&d&l3D COSMETICS', kind: 'COSMETIC',
      desc: ['Real 3D wings, halos, crowns,', 'horns and animated auras.', 'Everyone with the modpack sees them.', '', '&fEquip them: &e/wardrobe', '', '&8Some rare ones only come', '&8from the Cosmetic Crate.'],
      layout: 'spaced',
      children: [
        manasCat('wings', '&5&lWINGS', 'minecraft:elytra', ['Wings on your back.']),
        manasCat('halos', '&e&lHALOS', 'minecraft:gold_nugget', ['A glowing ring above your head.']),
        manasCat('heads', '&6&lCROWNS & HORNS', 'minecraft:golden_helmet', ['Crowns and horns on your head.']),
        manasCat('auras', '&b&lAURAS', 'minecraft:blaze_powder', ['Animated magic all around you.']),
      ],
    })
  } catch (e) { console.warn('[npc_menus] 3D cosmetics shop: ' + e) }
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
    if (KINDS[kind] && KINDS[kind].fx) return (c.desc || []).map(l => '&7' + l).concat(['&8Animated, everyone sees it,', '&8no download needed.'])
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
  // KubeJS names it getStringUuid(); keep the other spellings as fallbacks
  const uidOf = (e) => { try { return String(e.getStringUuid()) } catch (x) { try { return String(e.getStringUUID()) } catch (y) { return String(e.uuid) } } }
  const teamOf = (p) => 'otn_' + uidOf(p).replace(/-/g, '').substring(0, 12)
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
        if (e == null || !e.isAlive() || e.getVehicle() == null || uidOf(e.getVehicle()) != uidOf(p)) { spawnStatus(p, statusJson(c, phase)); return }
        if (s.tickCount % (ANIM_TICKS * 2) == 0) {
          var json = statusJson(c, phase)
          if (json != st.json) { st.json = json; s.runCommandSilent(`data merge entity ${uidOf(e)} {text:'${json.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'}`) }
        }
      } catch (x) { console.warn('[npc_menus] name tag: ' + x) }
    })
  })
  PlayerEvents.loggedIn(event => { var st = tagState[event.player.username]; if (st) st.key = '' })
  // clean-up: any old floating name/status text that isn't riding a player (left over from earlier versions, /reload, crashes)
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 100 != 0) return
    s.getAllLevels().forEach(level => level.getEntities().forEach(e => {
      try {
        var tags = e.getTags()
        if (!(tags.contains('ot_plate') || tags.contains('ot_status'))) return
        if (e.getVehicle() == null) e.discard()
      } catch (x) { }
    }))
  })
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
    else if (kind != 'join' && !KINDS[kind].fx) refreshChat(p)
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
      KIND_ORDER.forEach((k, i) => gui.slot(i < 7 ? 1 + i : 3 + (i - 7), i < 7 ? 1 : 2, sl => {
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
  // target: staff can open another player's menu to see exactly what that player sees (their ranks and timers),
  // view only: clicks do nothing then. /kitmenu <player>
  const kitMenu = (p, target) => {
    var who = target || p, viewing = who !== p
    var s = p.server, ids = ranksOf(who), op = who.hasPermissions(2), now = Date.now()
    p.openChestGUI(Text.of(viewing ? 'Kits: ' + who.username : 'Kits'), 3, gui => {
      gui.playerSlots = true
      fill(gui, s, 3)
      // free starter kit for everyone (NeoEssentials handles its own 1 day cooldown)
      gui.slot(1, 1, sl => {
        sl.item = icon(s, 'minecraft:candle', '&f&lStarter', ['&a&lAVAILABLE', '', '&f&lKIT INFORMATION:', '&8 • &7Free for everyone', '&8 • &7Cooldown: &f1d', '', viewing ? '&8View only' : '&e&lCLICK TO CLAIM'], true)
        sl.leftClicked = e => {
          if (viewing) return
          after(p, () => { try { p.runCommandSilent('kit starter') } catch (x) { p.tell('§c§lKits §7» Use §f/kit starter') } })
        }
      })
      RANK_ORDER.forEach((kit, i) => {
        var info = RANK_INFO[kit]
        var has = op || ids.indexOf(kit) >= 0
        var last = Number(String(who.persistentData.getString('ot_kitcd_' + kit)) || 0)
        var left = op ? 0 : (last ? KIT_MS - (now - last) : 0)
        var status = !has ? '&c&lNO PERMISSIONS' : left > 0 ? '&c&lON COOLDOWN' : '&a&lAVAILABLE'
        var lore = [status, '', '&f&lKIT INFORMATION:', '&8 • &7Cooldown: &f5d', '&8 • &7Remaining: &f' + (has && left > 0 ? dur(left) : 'None')]
        lore.push('')
        if (viewing) lore.push('&8View only' + (op ? ' (staff never get a cooldown)' : ''))
        else lore.push(!has ? '&7Unlock with the &f' + info.name + '&7 rank: &eoverthronesmp.tebex.store' : left > 0 ? '&7Come back when the timer runs out.' : '&e&lCLICK TO CLAIM')
        gui.slot(3 + i, 1, sl => {
          sl.item = icon(s, has ? info.candle : 'minecraft:gray_candle', info.c + '&l' + info.name, lore, has && left <= 0)
          sl.leftClicked = e => {
            if (viewing) return
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

  ServerEvents.command(event => {
    var parts = String(event.input || '').trim().replace(/^\//, '').split(/\s+/)
    if (parts.length != 1) return
    var c = parts[0].toLowerCase()
    if (c != 'kits' && c != 'neoessentials:kits') return
    var p = null
    try { p = event.parseResults.getContext().getSource().getPlayer() } catch (e) { p = null }
    if (!p) return    // console keeps the normal list
    // open the menu first: event.cancel() ends this function straight away, nothing after it runs
    p.server.scheduleInTicks(1, () => openMenu(p, 'kits'))
    event.cancel()
  })

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
      gui.slot(2, 3, sl => {
        sl.item = icon(s, 'minecraft:book', '&e&lHow Stats Work', ['You get &e1 stat point every level&7.', 'Spend them in &dYOUR STATS&7 on damage,', 'health, armor, crits, dodge, lifesteal,', 'speed and mining speed.', '', 'Every stat has a &cmax&7, so pick a build!', 'Unused points stay saved for future stats.', '', 'Reset: &d500 Throne Shards&7 or &a$2,000,000', 'Command: &e/stats'], false)
      })
      gui.slot(6, 3, sl => {
        sl.item = icon(s, 'minecraft:iron_pickaxe', '&6&lProfessions', ['Mining, Gemology, Farming, Foraging', 'and &cCombat&7 (from killing mobs).', 'Hit &6nodes&7 (blocks with floating text)', '&f3 times&7 to gather them for XP.', '', '&e&lCLICK TO VIEW YOUR PROFESSIONS'], false)
        sl.leftClicked = e => after(p, () => professionMenu(p))
      })
      gui.slot(4, 3, sl => {
        var free = pointsOf(p) - spentOf(statsOf(p))
        sl.item = icon(s, 'minecraft:enchanted_book', '&d&lYOUR STATS', ['Spend stat points on damage,', 'health, crits, dodge and more.', '', 'Free points: &e' + free, '', '&e&lCLICK TO OPEN'], free > 0)
        sl.leftClicked = e => after(p, () => statsMenu(p))
      })
      gui.slot(8, 3, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lClose', []); sl.leftClicked = e => { try { p.closeMenu() } catch (x) { } } })
    })
  }

  // ======================================================================= Stats (1 point per level, spent here)
  // Every stat is a percent bonus with a hard cap, so leftover points are simply saved for stats added later.
  // Bonuses are applied with otSetAttrBonus (professions.js) as attribute modifiers "overthrone:stat_<id>".
  const STATS = [
    { id: 'str', name: '&c&l⚔ Strength', icon: 'minecraft:iron_sword', attr: 'minecraft:generic.attack_damage', per: 0.01, max: 25, op: 'mult', what: 'melee damage' },
    { id: 'vit', name: '&4&l❤ Vitality', icon: 'minecraft:golden_apple', attr: 'minecraft:generic.max_health', per: 0.01, max: 25, op: 'mult', what: 'max health' },
    { id: 'def', name: '&7&l🛡 Defense', icon: 'minecraft:iron_chestplate', attr: 'minecraft:generic.armor', per: 0.01, max: 20, op: 'mult', what: 'armor' },
    { id: 'aspd', name: '&e&l🗡 Attack Speed', icon: 'minecraft:golden_sword', attr: 'minecraft:generic.attack_speed', per: 0.01, max: 15, op: 'mult', what: 'attack speed' },
    { id: 'crit', name: '&6&l🎯 Crit Chance', icon: 'minecraft:spectral_arrow', attr: 'apothic_attributes:crit_chance', per: 0.005, max: 20, op: 'add', what: 'crit chance' },
    { id: 'critdmg', name: '&6&l💥 Crit Damage', icon: 'minecraft:tnt', attr: 'apothic_attributes:crit_damage', per: 0.02, max: 25, op: 'add', what: 'crit damage' },
    { id: 'dodge', name: '&b&l💨 Dodge Chance', icon: 'minecraft:feather', attr: 'apothic_attributes:dodge_chance', per: 0.005, max: 10, op: 'add', what: 'dodge chance' },
    { id: 'steal', name: '&4&l🩸 Lifesteal', icon: 'minecraft:fermented_spider_eye', attr: 'apothic_attributes:life_steal', per: 0.005, max: 10, op: 'add', what: 'lifesteal' },
    { id: 'spd', name: '&f&l👟 Speed', icon: 'minecraft:leather_boots', attr: 'minecraft:generic.movement_speed', per: 0.005, max: 10, op: 'mult', what: 'movement speed' },
    { id: 'mine', name: '&8&l⛏ Mining Speed', icon: 'minecraft:diamond_pickaxe', attr: 'minecraft:player.block_break_speed', per: 0.02, max: 15, op: 'mult', what: 'mining speed' },
  ]
  const RESET_SHARDS = 500, RESET_MONEY = 2000000
  const TAKE_MONEY = 'eco take {p} {n}'
  const statsOf = (p) => { try { return JSON.parse(String(p.persistentData.getString('ot_stats')) || '{}') } catch (e) { return {} } }
  const spentOf = (st) => Object.keys(st).reduce((a, k) => a + (st[k] || 0), 0)
  const pointsOf = (p) => Math.max(1, p.persistentData.getInt('ot_level') || 1)   // 1 point per level
  const applyStats = (p) => {
    var st = statsOf(p)
    STATS.forEach(d => { if (typeof otSetAttrBonus == 'function') otSetAttrBonus(p, d.attr, 'overthrone:stat_' + d.id, (st[d.id] || 0) * d.per, d.op) })
  }
  PlayerEvents.loggedIn(event => { var p = event.player; p.server.scheduleInTicks(40, () => { try { applyStats(p) } catch (e) { } }) })
  PlayerEvents.respawned(event => { var p = event.player; p.server.scheduleInTicks(5, () => { try { applyStats(p) } catch (e) { } }) })
  const pctTxt = (n) => (Math.round(n * 1000) / 10) + '%'

  // money balance, read like the shards (from the scoreboard's money placeholder; staff can set it: /stats moneyplaceholder)
  const moneyPlaceholder = (server) => {
    var manual = String(store(server).getString('ot_money_placeholder') || '')
    if (manual) return manual
    try {
      var cfg = typeof ssReadJson == 'function' ? ssReadJson('config/serversetup/scoreboard.json', null) : null
      var lines = cfg == null ? [] : (cfg.lines || [])
      for (var i = 0; i < lines.length; i++) {
        var l = String(lines[i])
        if (/money|balance|\$/i.test(l) && !/shard/i.test(l)) { var m = l.match(/%[^%\s]+%/) || l.match(/\{[^}\s]+\}/); if (m) return m[0] }
      }
    } catch (e) { }
    return ''
  }
  const moneyOf = (p) => {
    var ph = moneyPlaceholder(p.server)
    if (!ph || Placeholders == null) return { ok: false, raw: ph ? '(no placeholder mod)' : '(no placeholder found)' }
    var raw = ''
    try { raw = String(Placeholders.setPlaceholders(p, ph)) } catch (e) { return { ok: false, raw: String(e) } }
    var clean = raw.replace(/§./g, '').replace(/&[0-9a-fk-or]/gi, '').replace(/[,\s$]/g, '')
    var m = clean.match(/^(-?\d+(?:\.\d+)?)([kKmMbB]?)$/)
    if (!m || raw == ph) return { ok: false, raw: raw }
    var mult = { '': 1, k: 1e3, m: 1e6, b: 1e9 }[m[2].toLowerCase()]
    return { ok: true, value: Number(m[1]) * mult, exact: m[2] == '', raw: raw }
  }
  // takes a payment and checks it really went through (like the Throne Shop does)
  const pay = (p, kind) => {
    var s = p.server, price = kind == 'shards' ? RESET_SHARDS : RESET_MONEY, read = kind == 'shards' ? shardsOf : moneyOf
    var label = kind == 'shards' ? fmt(price) + ' Throne Shards' : '$' + fmt(price)
    var before = read(p)
    if (!before.ok) { p.tell('§c§lStats §7» Could not read your ' + (kind == 'shards' ? 'shards' : 'money') + '. Please tell staff.'); console.warn('[stats] cannot read ' + kind + ' for ' + p.username + ': ' + before.raw); return false }
    if (before.value < price) { p.tell('§c§lStats §7» A reset costs §f' + label + '§7. You do not have enough.'); return false }
    run(s, (kind == 'shards' ? TAKE_SHARDS : TAKE_MONEY).replace('{p}', p.username).replace('{n}', String(price)))
    var after = read(p)
    var paid = after.ok && (before.exact && after.exact ? Math.round(before.value - after.value) == price : after.value < before.value)
    if (!paid) { p.tell('§c§lStats §7» Payment failed, nothing was taken. Please tell staff.'); console.warn('[stats] ' + kind + ' take failed for ' + p.username + ' (' + before.raw + ' -> ' + after.raw + ')'); return false }
    return true
  }
  const statsMenu = (p) => {
    var s = p.server, st = statsOf(p), total = pointsOf(p), free = total - spentOf(st)
    p.openChestGUI(Text.of('Your Stats'), 6, gui => {
      gui.playerSlots = true
      fill(gui, s, 6)
      gui.slot(4, 0, sl => { sl.item = icon(s, 'minecraft:nether_star', '&6&lStat Points: &e&l' + free, ['You get &e1 point every level&7.', 'Total earned: &f' + fmt(total) + ' &7- spent: &f' + spentOf(st), '', 'Every stat has a &cmax&7. Points you', 'can\'t use yet stay saved for', 'stats added in the future.'], free > 0) })
      STATS.forEach((d, i) => {
        var have = st[d.id] || 0, maxed = have >= d.max, x = [0, 2, 4, 6, 8][i % 5], y = i < 5 ? 2 : 3
        gui.slot(x, y, sl => {
          var bar = ''
          for (var b = 0; b < d.max; b++) bar += (b < have ? '&a' : '&8') + '|'
          sl.item = icon(s, d.icon, d.name + ' &7(' + have + '/' + d.max + ')', [bar, '&7Bonus: &a+' + pctTxt(have * d.per) + ' &7' + d.what, '&7Each point: &f+' + pctTxt(d.per) + ' &7- max &f+' + pctTxt(d.max * d.per), '',
            maxed ? '&a&lMAXED' : free <= 0 ? '&cNo free points (level up!)' : '&eLeft-click&7: +1 point', maxed || free <= 0 ? '' : '&eShift-left-click&7: +5 points'], have > 0)
          var spend = (add) => {
            after(p, () => {
              var cur = statsOf(p), left = pointsOf(p) - spentOf(cur), n = Math.min(add, left, d.max - (cur[d.id] || 0))
              if (n <= 0) { p.tell(left <= 0 ? '§c§lStats §7» You have no free points. Level up to get more!' : '§c§lStats §7» That stat is already maxed.'); statsMenu(p); return }
              cur[d.id] = (cur[d.id] || 0) + n
              p.persistentData.putString('ot_stats', JSON.stringify(cur))
              applyStats(p)
              run(s, `execute at ${p.username} run playsound minecraft:entity.player.levelup player ${p.username} ~ ~ ~ 0.6 1.6`)
              p.tell('§a§lStats §7» +' + n + ' ' + strip(d.name) + ' §7(now +' + pctTxt(cur[d.id] * d.per) + ' ' + d.what + ')')
              statsMenu(p)
            })
          }
          sl.leftClicked = e => spend(1)
          sl.shiftLeftClicked = e => spend(5)
        })
      })
      var resetLore = (cost) => ['Takes back &fall&7 your spent points', 'so you can build again.', '', '&7Cost: ' + cost, '', '&eClick to reset']
      gui.slot(2, 5, sl => {
        sl.item = icon(s, 'minecraft:amethyst_shard', '&d&lReset Stats (Shards)', resetLore('&d' + fmt(RESET_SHARDS) + ' Throne Shards'), false)
        sl.leftClicked = e => after(p, () => { if (spentOf(statsOf(p)) == 0) { p.tell('§7§lStats §7» You have no points spent.'); return } if (pay(p, 'shards')) { p.persistentData.putString('ot_stats', '{}'); applyStats(p); p.tell('§a§lStats §7» Your stats were reset. All points are free again.'); statsMenu(p) } })
      })
      gui.slot(6, 5, sl => {
        sl.item = icon(s, 'minecraft:emerald', '&a&lReset Stats (Money)', resetLore('&a$' + fmt(RESET_MONEY)), false)
        sl.leftClicked = e => after(p, () => { if (spentOf(statsOf(p)) == 0) { p.tell('§7§lStats §7» You have no points spent.'); return } if (pay(p, 'money')) { p.persistentData.putString('ot_stats', '{}'); applyStats(p); p.tell('§a§lStats §7» Your stats were reset. All points are free again.'); statsMenu(p) } })
      })
      gui.slot(0, 5, sl => { sl.item = icon(s, 'minecraft:arrow', '&e&lBack', ['Back to the Level Guide']); sl.leftClicked = e => after(p, () => levelGuide(p)) })
      gui.slot(8, 5, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lClose', []); sl.leftClicked = e => { try { p.closeMenu() } catch (x) { } } })
    })
  }

  // ======================================================================= Professions (professions.js)
  const PROF_MENU = [
    ['mining', '&7&l⛏ Mining', 'minecraft:iron_pickaxe', 'Gather ore nodes: coal, iron, gold, diamond...'],
    ['gemology', '&d&l💎 Gemology', 'minecraft:amethyst_shard', 'Gather gem nodes: amethyst, quartz, emerald...'],
    ['farming', '&a&l🌾 Farming', 'minecraft:wheat', 'Gather crop nodes: wheat, carrots, melons...'],
    ['foraging', '&2&l🌲 Foraging', 'minecraft:oak_log', 'Gather tree nodes: oak, birch, spruce...'],
    ['combat', '&c&l⚔ Combat', 'minecraft:iron_sword', 'Kill mobs! Stronger mobs give more.', '&7Perk: up to &a+10% melee damage'],
  ]
  const profNeed = (lvl) => typeof PROF_NEED === 'function' ? PROF_NEED(lvl) : Math.floor(100 * Math.pow(lvl, 1.4))
  const professionMenu = (p) => {
    var s = p.server, total = 0
    p.openChestGUI(Text.of('Professions'), 5, gui => {
      gui.playerSlots = true
      fill(gui, s, 5)
      PROF_MENU.forEach((pr, i) => {
        var lvl = Math.max(1, p.persistentData.getInt('ot_prof_' + pr[0] + '_lvl') || 1), xp = p.persistentData.getInt('ot_prof_' + pr[0] + '_xp') || 0
        var need = profNeed(lvl), max = lvl >= 100, pct = max ? 100 : Math.floor(xp * 100 / need), bar = ''
        total += lvl
        for (var b = 0; b < 20; b++) bar += (b < pct / 5 ? '&a' : '&8') + '|'
        gui.slot([0, 2, 4, 6, 8][i], 1, sl => {
          sl.item = icon(s, pr[2], pr[1] + ' &f&lLv ' + lvl, [bar + ' &f' + pct + '%', '&7XP: &f' + (max ? 'MAX' : fmt(xp) + ' &7/ &f' + fmt(need)), '', pr[3]].concat(pr[4] ? [pr[4]] : (pr[0] == 'mining' ? ['&7Perk: up to &a+20% mining speed'] : [])).concat(['', '&8Max level 100']), lvl > 1)
        })
      })
      gui.slot(4, 0, sl => { sl.item = icon(s, 'minecraft:nether_star', '&6&lYour Professions', ['Total level: &e' + total, '', 'Gather nodes to level up!'], true) })
      gui.slot(1, 3, sl => { sl.item = icon(s, 'minecraft:book', '&e&lHow It Works', ['Look for blocks with &6floating text&7:', 'they are &6nodes&7.', 'Break one to gather it and', 'earn &eprofession XP&7.'], false) })
      gui.slot(2, 3, sl => { sl.item = icon(s, 'minecraft:experience_bottle', '&a&lBonus Level XP', ['Every node also gives', '&anormal level XP&7 for your', '&f/level&7 too.'], false) })
      gui.slot(3, 3, sl => { sl.item = icon(s, 'minecraft:iron_bars', '&c&lNode Levels', ['Each node shows a level.', 'Your profession must be at', 'least that level to gather it.'], false) })
      gui.slot(5, 3, sl => { sl.item = icon(s, 'minecraft:clock', '&b&lRespawning', ['A gathered node shows a', '&ccountdown&7 and comes back', 'after &f1 minute&7 in the same spot.'], false) })
      gui.slot(6, 3, sl => { sl.item = icon(s, 'minecraft:chest', '&6&lNo Item Drops', ['Nodes give &eXP only&7, no items.', 'Normal blocks everywhere else', 'still drop as usual.'], false) })
      gui.slot(7, 3, sl => { sl.item = icon(s, 'minecraft:writable_book', '&d&lCommands', ['&e/professions &7- your levels in chat', '&e/professionmenu &7- open this menu', '&e/level &7- your main level'], false) })
      gui.slot(8, 4, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lClose', []); sl.leftClicked = e => { try { p.closeMenu() } catch (x) { } } })
    })
  }

  // ======================================================================= The Caverns (caverns.js)
  const cavernsMenu = (p) => {
    var s = p.server
    var st = typeof otCavernsStats === 'function' ? otCavernsStats(p) : { kills: 0, bosses: 0, nodes: 0, cash: 0, best: 0, time: 0 }
    var hrs = Math.floor(st.time / 3600), mins = Math.floor(st.time % 3600 / 60)
    var lvl = Math.max(1, p.persistentData.getInt('ot_level') || 1)
    p.openChestGUI(Text.of('The Caverns'), 6, gui => {
      gui.playerSlots = true
      for (var y = 0; y < 6; y++) for (var x = 0; x < 9; x++) {
        (function (xx, yy) { gui.slot(xx, yy, sl => { sl.item = pane(s, (yy == 0 || yy == 5 || xx == 0 || xx == 8) ? ((xx + yy) % 2 ? 'minecraft:black_stained_glass_pane' : 'minecraft:red_stained_glass_pane') : 'minecraft:gray_stained_glass_pane') }) })(x, y)
      }
      gui.slot(4, 0, sl => { sl.item = icon(s, 'minecraft:deepslate_diamond_ore', '&6&l⛏ THE CAVERNS ⛏', ['A deep mine full of &cmobs&7, &4bosses', '&7and &eevery kind of node&7.', '', '&aNo level needed: everyone can go!', '&7Earn &aCASH&7 for every kill and node.'], true) })
      // what's inside
      gui.slot(1, 1, sl => { sl.item = icon(s, 'minecraft:zombie_head', '&c&lMOBS', ['The Caverns are crawling with mobs.', 'Every kill gives &acash&7 and', '&cCombat XP&7.', '', '&7Stronger mobs pay more.'], false) })
      gui.slot(3, 1, sl => { sl.item = icon(s, 'minecraft:wither_skeleton_skull', '&4&lBOSSES', ['Bosses lurk in the deep.', 'They hit hard, so bring your', 'best gear and some friends.', '', '&aBosses pay the most: up to &a&l$10,000&7!'], true) })
      gui.slot(5, 1, sl => { sl.item = icon(s, 'minecraft:amethyst_cluster', '&e&lNODES', ['Every node type is down here:', '&7⛏ Mining  &d💎 Gemology', '&a🌾 Farming  &2🌲 Foraging', '', 'Hit a node &f3 times&7 to gather it.', 'It comes back after &f1 minute&7.'], false) })
      gui.slot(7, 1, sl => { sl.item = icon(s, 'minecraft:emerald', '&a&lCASH REWARDS', ['Every &fkill&7 and every &fnode&7 inside', 'the Caverns pays &a$100 &7to &a$10,000&7.', '', '&7Mobs: more health = more cash', '&7Nodes: higher level = more cash', '', '&8There is a per-minute limit.'], true) })
      // your trackers
      gui.slot(4, 2, sl => { sl.item = icon(s, 'minecraft:spyglass', '&b&lYOUR CAVERN TRACKERS', ['Your progress in the Caverns.', 'Everything below counts only', 'what you do &finside&7 the Caverns.'], false) })
      gui.slot(1, 3, sl => { sl.item = icon(s, 'minecraft:iron_sword', '&c&lMobs Killed', ['&f' + fmt(st.kills)], st.kills > 0) })
      gui.slot(2, 3, sl => { sl.item = icon(s, 'minecraft:dragon_head', '&4&lBosses Slain', ['&f' + fmt(st.bosses)], st.bosses > 0) })
      gui.slot(3, 3, sl => { sl.item = icon(s, 'minecraft:iron_pickaxe', '&e&lNodes Gathered', ['&f' + fmt(st.nodes)], st.nodes > 0) })
      gui.slot(4, 3, sl => { sl.item = icon(s, 'minecraft:gold_block', '&a&lCash Earned', ['&a$' + fmt(st.cash)], st.cash > 0) })
      gui.slot(5, 3, sl => { sl.item = icon(s, 'minecraft:diamond', '&b&lBest Payout', ['&a$' + fmt(st.best), '&7Your biggest single reward.'], st.best > 0) })
      gui.slot(6, 3, sl => { sl.item = icon(s, 'minecraft:clock', '&6&lTime Spent', ['&f' + hrs + 'h ' + mins + 'm'], false) })
      gui.slot(7, 3, sl => { sl.item = icon(s, 'minecraft:experience_bottle', '&a&lYour Level', ['&fLevel ' + lvl, '', '&7Kills and nodes here also give', '&7XP for your &f/level&7.'], false) })
      // profession levels
      PROF_MENU.forEach((pr, i) => {
        var pl = Math.max(1, p.persistentData.getInt('ot_prof_' + pr[0] + '_lvl') || 1), px = p.persistentData.getInt('ot_prof_' + pr[0] + '_xp') || 0
        var need = profNeed(pl), pct = pl >= 100 ? 100 : Math.floor(px * 100 / need), bar = ''
        for (var b = 0; b < 20; b++) bar += (b < pct / 5 ? '&a' : '&8') + '|'
        gui.slot(2 + i, 4, sl => { sl.item = icon(s, pr[2], pr[1] + ' &f&lLv ' + pl, [bar + ' &f' + pct + '%', '&7XP: &f' + (pl >= 100 ? 'MAX' : fmt(px) + ' &7/ &f' + fmt(need))], false) })
      })
      // buttons
      gui.slot(4, 5, sl => {
        sl.item = icon(s, 'minecraft:ender_pearl', '&a&l➤ GO TO THE CAVERNS', ['Teleports you to the Caverns.', '', '&e&lCLICK TO TELEPORT'], true)
        sl.leftClicked = e => after(p, () => { asPlayer(p, 'warp caverns'); p.tell('§6§l⛏ CAVERNS §7» Good luck down there! Every kill and node pays cash.') })
      })
      gui.slot(2, 5, sl => { sl.item = icon(s, 'minecraft:nether_star', '&6&lProfessions', ['Open your profession levels', 'and how nodes work.']); sl.leftClicked = e => after(p, () => professionMenu(p)) })
      gui.slot(6, 5, sl => { sl.item = icon(s, 'minecraft:book', '&e&lTips', ['&fLeft-click&7 a node 3 times to gather it.', 'Nodes need your profession to be', 'at least the node\'s level.', 'Bosses: team up and bring gear!', '', '&e/caverns &7- open this menu'], false) })
      gui.slot(8, 5, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lClose', []); sl.leftClicked = e => { try { p.closeMenu() } catch (x) { } } })
    })
  }

  // ======================================================================= Guide NPCs (2026-10-18)
  // Server Guide, Tensura Guide, Solo Leveling Guide, Hunter Association, Silas (market).
  // Same chest-menu style as the Caverns menu: coloured border, one icon per topic (hover to read), buttons at the bottom.
  // Facts here come from the Player Guide on the website (races: Tensura 2.0.1 defaults), our own scripts
  // (worlds, gates, Caverns, crates...) and what the owner confirmed in game (statue: crouch 2 seconds).
  const BORDERS = {
    red: ['minecraft:red_stained_glass_pane', 'minecraft:black_stained_glass_pane'],
    aqua: ['minecraft:light_blue_stained_glass_pane', 'minecraft:cyan_stained_glass_pane'],
    purple: ['minecraft:purple_stained_glass_pane', 'minecraft:magenta_stained_glass_pane'],
    gold: ['minecraft:orange_stained_glass_pane', 'minecraft:yellow_stained_glass_pane'],
  }
  // page: { title, rows, border, slots: [[x, y, itemId, name, lore, glint, onClick]] }
  const guidePage = (p, pg) => {
    var s = p.server, rows = pg.rows || 6, b = BORDERS[pg.border] || BORDERS.red
    p.openChestGUI(Text.of(pg.title), rows, gui => {
      gui.playerSlots = true
      for (var y = 0; y < rows; y++) for (var x = 0; x < 9; x++) {
        (function (xx, yy) {
          var edge = yy == 0 || yy == rows - 1 || xx == 0 || xx == 8
          gui.slot(xx, yy, sl => { sl.item = pane(s, edge ? b[(xx + yy) % 2] : 'minecraft:gray_stained_glass_pane') })
        })(x, y)
      }
      pg.slots.forEach(d => {
        gui.slot(d[0], d[1], sl => {
          sl.item = icon(s, d[2], d[3], d[4] || [], !!d[5])
          if (d[6]) sl.leftClicked = e => d[6]()
        })
      })
      if (pg.back) gui.slot(0, rows - 1, sl => { sl.item = icon(s, 'minecraft:arrow', '&e&l← Back', ['Back to ' + pg.back[0]]); sl.leftClicked = e => after(p, pg.back[1]) })
      gui.slot(8, rows - 1, sl => { sl.item = icon(s, 'minecraft:barrier', '&c&lClose', []); sl.leftClicked = e => { try { p.closeMenu() } catch (x) { } } })
    })
  }
  const tp = (p, cmd, msg) => after(p, () => { asPlayer(p, cmd); if (msg) p.tell(msg) })
  // the full written guide book (guide_books.js)
  const BOOK_LORE = ['', '&e&l📖 CLICK: GET THE FULL GUIDE BOOK']
  const giveBook = (p, which) => after(p, () => { if (typeof otGiveGuideBook === 'function') otGiveGuideBook(p, which); else p.tell('§cThe guide books are not loaded (guide_books.js).') })
  const CLICK_TP = '&e&lCLICK TO TELEPORT'

  // ---------------------------------------------------------------- Server Guide (new NPC)
  const serverGuide = (p) => guidePage(p, {
    title: 'Server Guide', border: 'gold', slots: [
      [4, 0, 'minecraft:nether_star', '&6&l✦ OVERTHRONE SERVER GUIDE ✦', ['Everything you need to get going.', 'Hover over an icon to read it,', 'click a world to go there.'], true],
      [1, 1, 'minecraft:writable_book', '&a&l① START HERE', ['&f1. &7Pick your &frace&7 (first join).', '&7   It also gives you a random', '&7   &dunique skill&7.', '&f2. &7Do your &fHunter Evaluation', '&7   (Hunter Association).', '&f3. &7Go to the &fRPG World &7(/rpg)', '&7   for quests, shops and NPCs.', '&f4. &7Fight in &fthe Caverns&7 for cash.', '&f5. &7Build a base in &fSurvival', '&7   and claim it (/claimtool).'], true],
      [3, 1, 'minecraft:experience_bottle', '&b&lLEVELS & STATS', ['Earn XP from quests, mobs and ores.', 'Every level = &f1 stat point&7.', 'Spend them: &f/stats', 'See your level: &f/level'], false],
      [5, 1, 'minecraft:emerald', '&a&lMONEY', ['Cash from &fthe Caverns&7 (kills + nodes),', 'quests, jobs and selling.', 'Daily reward: &f/dailyreward', 'Vote every day: &f/vote'], false],
      [7, 1, 'minecraft:tripwire_hook', '&e&lCRATES & KEYS', ['Keys from voting, the AFK room,', 'events, and Caverns kills', '&8(0.5%, bosses 5%)&7.', 'Crates are at &f/warp crates&7.'], false],
      // worlds (click to go)
      [1, 3, 'minecraft:beacon', '&6&lTHE HUB', ['The city above the clouds.', '&aSafe: no damage, no griefing.', 'Warp boards, NPCs, crates, shops.', '', CLICK_TP], true, () => tp(p, 'hub')],
      [2, 3, 'minecraft:lectern', '&d&lRPG WORLD', ['A protected city: quests, the', 'Arcade, the Arcanum, NPCs.', '&aSafe&7, except &cthe Caverns&7.', 'Can\'t break or place blocks.', '', CLICK_TP], true, () => tp(p, 'rpg')],
      [3, 3, 'minecraft:deepslate_diamond_ore', '&c&lTHE CAVERNS', ['Mobs, &4bosses&7 and every node.', '&cYou CAN die here.', 'Every kill and node pays &acash&7.', '', CLICK_TP], true, () => tp(p, 'warp caverns')],
      [4, 3, 'minecraft:grass_block', '&2&lSURVIVAL', ['Build your base here.', 'Claim land so nobody can grief it:', '&f/claimtool &7and &f/claiminfo', '', CLICK_TP], false, () => tp(p, 'survival')],
      [5, 3, 'minecraft:iron_pickaxe', '&7&lRESOURCE', ['Mine and gather freely.', 'It gets reset, so don\'t build here.', '', CLICK_TP], false, () => tp(p, 'resource')],
      [6, 3, 'minecraft:netherite_sword', '&4&lSMP WORLD', ['&cNo claims, raiding allowed.', '&cYou DROP your items when you', '&cdie here &7(everywhere else you keep them).', '', CLICK_TP], true, () => tp(p, 'smp')],
      [7, 3, 'minecraft:compass', '&a&lTHE WILD', ['A random spot in the overworld.', 'Gates open near players here.', '', CLICK_TP], false, () => tp(p, 'wild')],
      [2, 4, 'minecraft:totem_of_undying', '&e&lKEEP INVENTORY', ['You keep your items when you die', 'in every world &cexcept the SMP world&7.'], false],
      [4, 4, 'minecraft:shield', '&b&lNEW PLAYER SHIELD', ['No damage while you pick a race,', 'then for your first &f15 minutes', 'while you are below &flevel 5&7.'], false],
      [6, 4, 'minecraft:clock', '&7&lAFK ROOM', ['Stand in the AFK room for', 'AFK Shards: 6 shards = 1 AFK Key.', '&f/warp afk'], false],
      // buttons
      [2, 5, 'minecraft:slime_ball', '&b&lTensura Guide', ['Races, evolutions, skills.'], false, () => after(p, () => tensuraGuide(p))],
      [4, 5, 'minecraft:book', '&a&lServer Links', ['Discord, website, store, rules, vote.'], false, () => after(p, () => linksMenu(p))],
      [6, 5, 'minecraft:ender_eye', '&5&lSolo Leveling Guide', ['Hunter ranks, gates, dungeons.'], false, () => after(p, () => slGuide(p))],
    ]
  })

  // ---------------------------------------------------------------- Tensura Guide
  // Tensura races (website Player Guide, Tensura 2.0.1 defaults)
  const T_RACES = [
    ['minecraft:iron_block', 'Giant', 'a', 'Easy', ['Strongest start: 50 HP, big MP+AP.', 'Giant → Ancient Giant', '&8(300k EP + 20 Ancient Debris)', '→ Divine Giant &8(2M EP)']],
    ['minecraft:phantom_membrane', 'Lesser Daemon', 'a', 'Easy', ['Flies from day one, huge magic.', '→ Greater Daemon &8(20k EP)', '→ Arch Daemon &8(140k EP)', '→ Daemon Lord &8(2 of: body, name,', '&8   awakening) &7→ Devil Lord &8(all 3)']],
    ['minecraft:iron_axe', 'Ogre', 'a', 'Easy', ['Melee, most evolution paths.', '→ Kijin &8(get a Spirit)&7 or', '  Enlightened Ogre &8(100k EP)', '→ Mystic / Wicked Oni &8(10 Elemental', '&8   or Daemon Essence)', '→ Spirit / Death Oni &8(400k)', '→ Divine Oni / Fighter &8(2M)']],
    ['minecraft:rabbit_foot', 'Beastfolk', 'a', 'Easy', ['Fast melee, regeneration.', '→ Beast Lord &8(100k EP)', '→ Spirit Beast &8(400k + 4 bosses)', '→ Divine Beast &8(2M EP)']],
    ['minecraft:feather', 'Harpy', 'a', 'Easy', ['Magic + glides like an elytra.', '→ Harpy Queen &8(200k EP)', '→ Spirit Bird &8(800k EP)', '→ Divine Bird &8(2M EP)']],
    ['minecraft:oak_sapling', 'Elf', 'e', 'Intermediate', ['Fast, elemental magic.', '→ Enlightened Elf &8(100k EP)', '→ Elf Saint &8(400k + 4 bosses)', '→ Divine Elf &8(2M EP)']],
    ['minecraft:tropical_fish', 'Merfolk', 'e', 'Intermediate', ['Breathes underwater, fast swimmer.', '→ Enlightened Merfolk &8(100k)', '→ Merfolk Saint &8(400k + 4 bosses)', '→ Divine Fish &8(2M EP)']],
    ['minecraft:turtle_scute', 'Lizardman', 'e', 'Intermediate', ['Scale Armor, dragon bloodline.', '→ Dragonewt &8(10 Dragon Essence)', '→ True Dragonewt &8(800k EP)', '→ Divine Dragon &8(2M EP, wings)']],
    ['minecraft:porkchop', 'Orc', 'e', 'Intermediate', ['Tank with a hunger skill.', '→ High Orc &8(5k EP)', '→ Orc Lord &8(10 Royal Blood)', '→ Orc Disaster &8(200k + mastered Starved)', '→ Spirit Boar &8(400k) &7→ Divine Boar &8(2M)']],
    ['minecraft:player_head', 'Human', 'c', 'Hard', ['Weapons and battlewills.', '→ Enlightened Human &8(100k EP)', '→ Human Saint &8(400k + 4 bosses)', '→ Divine Human &8(2M EP)', '&7Or drink 5 &fZane Blood&7 → Vampire']],
    ['minecraft:anvil', 'Dwarf', 'c', 'Hard', ['Tough, slow, hits hard.', '→ Enlightened Dwarf &8(100k EP)', '→ Dwarf Saint &8(400k + 4 bosses)', '→ Divine Dwarf &8(2M EP)']],
    ['minecraft:leather', 'Goblin', 'c', 'Hard', ['12 HP, but evolves fast.', '→ Hobgoblin &8(2k EP)', '→ Enlightened Hobgoblin &8(100k)', '→ Hobgoblin Saint &8(400k + 4 bosses)', '→ Divine Oni &8(2M EP)']],
    ['minecraft:skeleton_skull', 'Wight', 'c', 'Hard', ['Undead mage, hates sunlight.', '→ Wight King &8(200k EP)', '→ Spirit Skeleton &8(800k EP)', '→ Divine Skeleton &8(2M EP)']],
    ['minecraft:redstone', 'Ghoul', 'c', 'Hard', ['Road to Divine Vampire.', '→ Vampire &8(1 Zane Blood)', '→ Vampire Overcomer &8(150k EP)', '→ Vampire Lord &8(400k EP)', '→ Divine Vampire &8(2M EP)']],
    ['minecraft:slime_ball', 'Slime', '4', 'Extreme', ['10 HP, 50% less physical damage.', '→ Metal Slime &8(absorb 100 Magic Ore)', '→ Demon Slime &8(awaken: True', '&8   Demon Lord or True Hero)', '→ God Slime &8(2M EP)']],
  ]
  // races from the other mods (in the race menu on this server). Their paths: press B → Evolution Menu.
  const X_RACES = [
    ['minecraft:blaze_powder', 'Attuned Wyrm', 'Mysticism'], ['minecraft:bone', 'Direwolf', 'Mysticism'], ['minecraft:dragon_breath', 'Dragonoid', 'Mysticism'],
    ['minecraft:soul_lantern', 'Forgotten', 'Mysticism'], ['minecraft:spider_eye', 'Insect', 'Mysticism'], ['minecraft:golden_apple', 'Lesser Angel', 'Mysticism'],
    ['minecraft:fire_charge', 'Lesser Elemental', 'Mysticism'], ['minecraft:ghast_tear', 'Phantom', 'Mysticism'], ['minecraft:chain', 'Restricted Human', 'Mysticism'],
    ['minecraft:sculk', 'Sculk Worm', 'Mysticism'], ['minecraft:cobweb', 'Small Lesser Taratect', 'Kumodesu'], ['minecraft:brown_dye', 'Kobold', 'SlimeThrone Extras'],
    ['minecraft:glow_berries', 'Wispfolk', 'SlimeThrone Extras'], ['minecraft:sweet_berries', 'Mystic Fox', 'SlimeThrone Extras'],
  ]
  const raceItem = (r) => [r[0], '&' + r[2] + '&l' + r[1] + ' &8(' + r[3] + ')', r[4]]
  const tensuraRaces = (p) => {
    var slots = [[4, 0, 'minecraft:totem_of_undying', '&b&lTENSURA RACES', ['Hover a race to see its path.', 'EP = your max MP + AP.', '&8k = thousand, M = million'], true]]
    T_RACES.forEach((r, i) => { var it = raceItem(r); slots.push([1 + (i % 7), 1 + Math.floor(i / 7), it[0], it[1], it[2], false]) })
    slots.push([4, 4, 'minecraft:chest', '&d&lMORE RACES (other mods) →', ['Mysticism, Kumodesu and', 'SlimeThrone Extras races.'], true, () => after(p, () => otherRaces(p))])
    guidePage(p, { title: 'Tensura Races', border: 'aqua', slots: slots, back: ['Tensura Guide', () => tensuraGuide(p)] })
  }
  const otherRaces = (p) => {
    var slots = [[4, 0, 'minecraft:enchanted_book', '&d&lMORE RACES', ['These come from other mods.', 'Each has its own evolutions:', 'press &fB&7 → &fEvolution Menu&7 to', 'see the exact path and goals.'], true]]
    X_RACES.forEach((r, i) => slots.push([1 + (i % 7), 1 + Math.floor(i / 7), r[0], '&d&l' + r[1], ['From: &f' + r[2], '', 'Path & requirements:', '&fB&7 → &fEvolution Menu&7 → Track'], false]))
    guidePage(p, { title: 'More Races', border: 'purple', rows: 5, slots: slots, back: ['Tensura Races', () => tensuraRaces(p)] })
  }
  const tensuraGuide = (p) => guidePage(p, {
    title: 'Tensura Guide', border: 'aqua', slots: [
      [4, 0, 'minecraft:slime_ball', '&b&l✦ TENSURA GUIDE ✦', ['Races, evolutions, skills and magic.', 'Hover to read, click to open.'], true],
      [1, 1, 'minecraft:written_book', '&a&l① START HERE', ['You pick a &frace&7 on your first join.', 'You also get &fone random unique', '&fskill&7 when you pick it.', '', 'Press &fB&7: your &fStatus Menu&7.', 'Kill mobs to gain &fEP&7 (your power).'].concat(BOOK_LORE), true, () => giveBook(p, 'tensura')],
      [1, 4, 'minecraft:written_book', '&3&l📖 TENSURA GUIDE BOOK', ['Everything in one book:', 'every race and its full path,', 'EP goals, awakening, naming,', 'skills, sunlight, flying.'].concat(BOOK_LORE), true, () => giveBook(p, 'tensura')],
      [3, 1, 'minecraft:totem_of_undying', '&b&lALL RACES →', ['Every race on the server,', 'its difficulty and how to', 'evolve it.', '', '&e&lCLICK TO OPEN'], true, () => after(p, () => tensuraRaces(p))],
      [5, 1, 'minecraft:experience_bottle', '&e&lHOW TO EVOLVE', ['Press &fB&7 → &fEvolution Menu&7.', 'Pick a goal, press &fTrack&7 to see', 'it on screen, then &fEvolve&7 at 100%.', '', 'Goals: about &f100k EP&7 first,', '&f400k-800k&7 next, &f2M&7 for Divine.', '&fSaint&7 forms also need &f4 bosses&7.'], false],
      [7, 1, 'minecraft:nether_star', '&6&lAWAKENING', ['&fTrue Demon Lord&7: a Majin with', '&f200k EP&7, then collect &f10,000 souls&7.', '&fTrue Hero&7: the other awakening.', '', 'Some evolutions (Demon Slime,', 'Devil Lord...) need an awakening.', '&fHarvest Festival&7: your followers', 'nearby evolve for free.'], true],
      [1, 3, 'minecraft:name_tag', '&d&lNAMING', ['A stronger player can name you', '&8(default key &fN&8)&7.', 'It can push you to your next form.'], false],
      [3, 3, 'minecraft:blaze_rod', '&c&lSKILLS & MAGIC', ['Skills level up as you use them', '&8(mastery)&7. Check them in &fB&7.', 'Race ability: &fCtrl + E&7.', '', '&cBanned skills&7 are removed', 'automatically. If your unique was', 'banned you get a new random one.'], false],
      [5, 3, 'minecraft:paper', '&e&lITEMS FOR EVOLVING', ['Some forms need items, not EP:', '&fZane Blood, Royal Blood,', '&fDragon Essence, Elemental or', '&fDaemon Essence, Magic Ore,', '&fAncient Debris&7.'], false],
      [7, 3, 'minecraft:recovery_compass', '&5&lCHANGE RACE', ['Talk to &fSeris the Rebirth Keeper', 'for a &fRace Reset Scroll', '&8(one every 12 hours)&7.', '', '&cIt resets your race, stats and', '&crace skills: be sure first!'], false],
      [2, 4, 'minecraft:sunflower', '&6&lSUNLIGHT', ['Wights, Ghouls and Vampires', 'burn in sunlight. A helmet stops', 'the burning; roofs and rain stop', 'the weakness.'], false],
      [4, 4, 'minecraft:elytra', '&f&lFLYING', ['&fLesser Daemon&7 and every daemon', 'fly from the start.', '&fTrue Dragonewt / Divine Dragon', 'grow wings. &fHarpies&7 glide.'], false],
      [6, 4, 'minecraft:spyglass', '&a&lYOUR POWER', ['&fEP&7 = max Magicules + max Aura.', '&fMajin&7 (Slime, Wight, Ghoul,', 'Lesser Daemon) turn EP into &bMP&7.', 'Everyone else into &cAP&7.'], false],
      [4, 5, 'minecraft:ender_eye', '&5&lSolo Leveling Guide', ['Hunter ranks, gates, dungeons.'], false, () => after(p, () => slGuide(p))],
    ]
  })

  // ---------------------------------------------------------------- Solo Leveling Guide
  const slInfo = (p) => {
    var rank = '-', cls = '-'
    try { var v = p.getData(Java.loadClass('net.solocraft.network.SololevelingModVariables').PLAYER_VARIABLES_ATTACHMENT.get()); if (String(v.ranking) != '') rank = String(v.ranking) } catch (e) { }
    try { if (typeof hudClass === 'function') cls = String(hudClass(p)) } catch (e) { }
    return [rank, cls]
  }
  const slGuide = (p) => {
    var me = slInfo(p)
    guidePage(p, {
      title: 'Solo Leveling Guide', border: 'purple', slots: [
        [4, 0, 'minecraft:ender_eye', '&5&l✦ SOLO LEVELING GUIDE ✦', ['From Hunter to Monarch.', '&7Your rank: &f' + me[0] + '  &7Class: &f' + me[1]], true],
        [1, 1, 'minecraft:written_book', '&a&l① START HERE', ['Go to the &fHunter Association', '&8(/warp hunters)&7 and do your', '&fHunter Evaluation&7.', 'It gives you your &fclass&7, &fstyle', '&7and &fhunter rank&7.'].concat(BOOK_LORE), true, () => giveBook(p, 'sl')],
        [6, 3, 'minecraft:written_book', '&5&l📖 SOLO LEVELING GUIDE BOOK', ['Everything in one book:', 'the evaluation, ranks, the Cartenon','Temple statues,', 'gates, levels and the Caverns.'].concat(BOOK_LORE), true, () => giveBook(p, 'sl')],
        [3, 1, 'minecraft:amethyst_shard', '&d&lTHE EVALUATION', ['Tabs: Contact, Scan, Class,', 'Style, Rank, Record.', '&fPress and HOLD the gem&7 until', 'the timer is done (about 1.5 s).', 'Ranks: &fE → D → C → B → A → S'], false],
        [5, 1, 'minecraft:armor_stand', '&e&lSTUCK IN THE CARTENON TEMPLE?', ['&cThe statues are NOT broken!', 'To use a statue, &fcrouch (sneak)', '&fnext to it for 2 seconds&7.', 'Hold sneak until it activates.'], true],
        [7, 1, 'minecraft:end_portal_frame', '&c&lGATES', ['&f3 gates open every hour&7, near a', 'random player in the &fOverworld', '&8(/wild)&7.', 'Clear them for loot and XP.', 'Team up for higher ranks.'], true],
        [2, 3, 'minecraft:iron_sword', '&c&lYOUR CLASS', ['Your class and style come from', 'the evaluation.', '&7Class: &f' + me[1], '&7Rank: &f' + me[0], 'More info (rank perk): &f/hunterinfo'], false],
        [4, 3, 'minecraft:experience_bottle', '&b&lLEVELS', ['Solo Leveling has its own levels', 'and stats, on top of the server', '&f/level&7 and your Tensura race.', 'They all stack.'], false],
        [3, 5, 'minecraft:ender_pearl', '&a&l➤ HUNTER ASSOCIATION', ['Go to the Hunter Association.', '', CLICK_TP], true, () => tp(p, 'warp hunters')],
        [5, 5, 'minecraft:slime_ball', '&b&lTensura Guide', ['Races, evolutions, skills.'], false, () => after(p, () => tensuraGuide(p))],
      ]
    })
  }

  // ---------------------------------------------------------------- Hunter Association
  const huntersMenu = (p) => {
    var me = slInfo(p)
    guidePage(p, {
      title: 'Hunter Association', border: 'red', rows: 5, slots: [
        [4, 0, 'minecraft:netherite_helmet', '&4&l✦ HUNTER ASSOCIATION ✦', ['Rise through the Hunter Ranks:', '&fE » D » C » B » A » S » ???', '', '&7Your rank: &f' + me[0] + '  &7Class: &f' + me[1]], true],
        [2, 1, 'minecraft:amethyst_shard', '&d&l① GET EVALUATED', ['Use the &fHunter Evaluator&7 at', 'the Hunter Association, then', '&fpress and HOLD the gem&7', '(about 1.5 s).', 'You get your class, style and rank.'], true],
        [4, 1, 'minecraft:armor_stand', '&e&lSTUCK IN THE CARTENON TEMPLE?', ['&cThe statues are NOT broken!', '&fCrouch next to a statue for', '&f2 seconds&7 to activate it.'], false],
        [6, 1, 'minecraft:end_portal_frame', '&c&lGATES', ['&f3 gates every hour&7 near a player', 'in the &fOverworld&7 (/wild).', 'Clear them to rank up faster.'], false],
        [2, 2, 'minecraft:book', '&a&lYOUR HUNTER INFO', ['&7Rank: &f' + me[0], '&7Class: &f' + me[1], '', 'Ranks with the perk can see more', 'with &f/hunterinfo&7.'], false],
        [4, 2, 'minecraft:ender_eye', '&5&lSOLO LEVELING GUIDE', ['Everything about hunters,', 'classes, gates and statues.', '', '&e&lCLICK TO OPEN'], true, () => after(p, () => slGuide(p))],
        [6, 2, 'minecraft:deepslate_diamond_ore', '&c&lTHE CAVERNS', ['Mobs and bosses for cash', 'and crate keys.', '', CLICK_TP], false, () => tp(p, 'warp caverns')],
        [4, 4, 'minecraft:ender_pearl', '&a&l➤ GO TO THE EVALUATOR', ['Teleports you to the Hunter', 'Association.', '', CLICK_TP], true, () => tp(p, 'warp hunters')],
      ]
    })
  }

  // ---------------------------------------------------------------- Silas (market)
  const marketMenu = (p) => guidePage(p, {
    title: 'Silas the Merchant', border: 'purple', rows: 4, slots: [
      [4, 0, 'minecraft:amethyst_cluster', '&d&l✦ SILAS THE MERCHANT ✦', ['"Ahh, my favourite customer!', 'Silks, steel, treasures from every', 'corner of the realm..."'], true],
      [2, 1, 'minecraft:ender_pearl', '&a&l➤ TAKE ME TO THE MARKET', ['Teleports you to the market.', '', CLICK_TP], true, () => tp(p, 'warp market', '§d§lSILAS §7» Mind your coin purse in there!')],
      [4, 1, 'minecraft:amethyst_shard', '&d&lWHAT ARE THRONE SHARDS?', ['The server\'s premium currency.', 'Get them from the &fAFK Crate&7', 'and the &fstore&7.', 'Spend them in the &fThrone Shop&7', 'or on a stat reset (500).'], false],
      [6, 1, 'minecraft:chest', '&5&lTHRONE SHOP', ['Spend your Throne Shards.', '', '&e&lCLICK TO OPEN'], true, () => after(p, () => shopMain(p))],
      [4, 2, 'minecraft:emerald', '&a&lMONEY TIPS', ['Fight in &fthe Caverns&7: every kill', 'and node pays cash.', '&f/dailyreward &7and &f/vote&7 daily.'], false],
    ]
  })

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

  // ======================================================================= Land claims (Flan, golden shovel)
  const claimsMenu = (p) => {
    var s = p.server
    p.openChestGUI(Text.of('Land Claims'), 3, gui => {
      gui.playerSlots = true
      fill(gui, s, 3)
      gui.slot(1, 1, sl => {
        sl.item = icon(s, 'minecraft:written_book', '&6&lHOW TO CLAIM', [
          '&f1. Hold a &6golden shovel&f.', '&f2. &eRight-click&f one corner of your base.', '&f3. &eRight-click&f the opposite corner.',
          '&fDone! Nobody else can build, break', '&for open chests inside your claim.', '',
          '&71 block of area = 1 claim block.', '&7Claims go from the ground up, so', '&7corner to corner is all you need.'], true)
        sl.leftClicked = e => after(p, () => run(s, `execute as ${p.username} run claiminfo`))
      })
      gui.slot(3, 1, sl => {
        sl.item = icon(s, 'minecraft:golden_shovel', '&a&lGET YOUR CLAIM TOOL', ['&fA free golden shovel to claim', '&fyour land with.', '', '&e&lCLICK TO GET IT'], true)
        sl.leftClicked = e => after(p, () => run(s, `execute as ${p.username} run claimtool`))
      })
      gui.slot(5, 1, sl => {
        sl.item = icon(s, 'minecraft:stick', '&b&lSEE CLAIMS', ['&fHold a &bstick&f and right-click a', '&fblock to see who owns that land', '&fand where its edges are.'], false)
      })
      gui.slot(7, 1, sl => {
        sl.item = icon(s, 'minecraft:emerald', '&e&lYOUR CLAIM BLOCKS', ['&fSee how many claim blocks you have', '&fand where your claims are.', '', '&fGet more: playing time, &d/throneshop&f,', '&fvote crates and the store.', '', '&e&lCLICK TO CHECK'], true)
        sl.leftClicked = e => after(p, () => run(s, `execute as ${p.username} run flan list`))
      })
      gui.slot(3, 2, sl => {
        sl.item = icon(s, 'minecraft:player_head', '&d&lTRUST FRIENDS', ['&fStand in your claim and type', '&e/flan menu&f to let friends build', '&for open chests, and change settings.'], false)
      })
      gui.slot(5, 2, sl => {
        sl.item = icon(s, 'minecraft:barrier', '&c&lWHERE CAN I CLAIM?', ['&fIn the &aWild&f and &aSurvival&f worlds.', '&fNot in the hub, the RPG World,', '&fthe Resource World or the &cSMP&f.', '', '&7Remove a claim: stand in it and', '&7type &e/flan delete'], false)
      })
    })
  }

  // ======================================================================= SMP world
  const smpMenu = (p) => {
    var s = p.server
    p.openChestGUI(Text.of('The SMP World'), 3, gui => {
      gui.playerSlots = true
      fill(gui, s, 3)
      gui.slot(1, 1, sl => {
        sl.item = icon(s, 'minecraft:written_book', '&a&lWHAT IS THE SMP?', [
          '&fSMP = &aSurvival Multiplayer&f.', '&fOne big shared survival world for', '&fthe whole server: build a base, farm,',
          '&ftrade, raid and make friends (or rivals).', '', '&7Everything you build stays,', '&7it never resets.'], false)
      })
      gui.slot(3, 1, sl => {
        sl.item = icon(s, 'minecraft:oak_sapling', '&2&lSETTLE DOWN', [
          '&fFind your own land with &e/rtp&f,', '&fthen build your home, farms', '&fand storage. Team up with friends', '&for start a town together.', '', '&7Tip: build far out and hide', '&7your base well.'], false)
      })
      gui.slot(5, 1, sl => {
        sl.item = icon(s, 'minecraft:tnt', '&c&lNO CLAIMS - RAIDING ON', [
          '&fLand claims &cdo not work&f in the SMP.', '&fAny base can be raided: players can', '&fbreak in, grief and steal your loot.', '',
          '&7Protect yourself: hide your base,', '&7lock it behind traps and walls,', '&7and keep valuables in your ender chest.', '',
          '&7Want a safe base? Build in the &aWild', '&7or &aSurvival&7 and claim it there.'], false)
      })
      gui.slot(7, 1, sl => {
        sl.item = icon(s, 'minecraft:bell', '&e&lANYTHING GOES', [
          '&fRaiding, griefing and stealing are', '&fpart of the game here. Make allies,', '&fmake enemies, trade or take.', '',
          '&cStill banned: hacks, cheats, x-ray', '&cand exploits. &e/rules'], false)
      })
      gui.slot(3, 2, sl => {
        sl.item = icon(s, 'minecraft:ender_pearl', '&a&lTRAVEL TO THE SMP', ['&fTakes you to the SMP spawn.', '&fType &e/smp&f any time to come back.', '', '&a&lCLICK TO GO'], true)
        sl.leftClicked = e => after(p, () => run(s, `execute as ${p.username} run smp`))
      })
      gui.slot(5, 2, sl => {
        sl.item = icon(s, 'minecraft:compass', '&b&lFIND LAND', ['&fIn the SMP world, type &e/rtp&f to', '&fjump to a random spot and', '&fexplore for the perfect base.'], false)
      })
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

  const MENUS = { cosmetics: p => cosmeticsMain(p), crates: crateMenu, throneshop: shopMain, kits: kitMenu, levels: levelGuide, links: linksMenu, claims: claimsMenu, smp: smpMenu, professions: professionMenu, caverns: cavernsMenu,
    serverguide: serverGuide, tensuraguide: tensuraGuide, slguide: slGuide, hunters: huntersMenu, market: marketMenu }
  const TITLES = {
    cosmetics: ['&d&lCOSMETICS', '&fRIGHT-CLICK TO VIEW'],
    crates: ['&e&lCRATES', '&fRIGHT-CLICK TO VIEW'],
    throneshop: ['&d&lTHRONE SHOP', '&fRIGHT-CLICK TO VIEW'],
    kits: ['&6&lKITS', '&fRIGHT-CLICK TO VIEW'],
    levels: ['&a&lLEVEL GUIDE', '&fRIGHT-CLICK TO VIEW'],
    links: ['&b&lSERVER LINKS', '&fRIGHT-CLICK TO VIEW'],
    claims: ['&6&lLAND CLAIMS', '&fRIGHT-CLICK TO VIEW'],
    smp: ['&a&lTHE SMP WORLD', '&fRIGHT-CLICK TO VIEW'],
    professions: ['&6&lPROFESSIONS', '&fRIGHT-CLICK TO VIEW'],
    caverns: ['&6&l⛏ THE CAVERNS', '&fRIGHT-CLICK TO VIEW'],
    serverguide: ['&6&l✦ SERVER GUIDE ✦', '&fNEW HERE? RIGHT-CLICK ME'],
    tensuraguide: ['&b&lTENSURA GUIDE', '&fRACES & EVOLUTION'],
    slguide: ['&5&lSOLO LEVELING GUIDE', '&fHUNTER TO MONARCH'],
    hunters: ['&4&lHUNTER ASSOCIATION', '&fRIGHT-CLICK TO VIEW'],
    market: ['&d&lSILAS', '&fTHE MERCHANT'],
  }
  const GLOW = { cosmetics: 'light_purple', crates: 'yellow', throneshop: 'light_purple', kits: 'gold', levels: 'green', links: 'aqua', claims: 'gold', smp: 'green', professions: 'gold', caverns: 'gold', serverguide: 'gold', tensuraguide: 'aqua', slguide: 'dark_purple', hunters: 'red', market: 'light_purple', cmd: 'yellow' }
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
  // the Easy NPC you're looking at: the CLOSEST one along your line of sight (within 8 blocks).
  // (The old ray trace could return an NPC standing behind or in front of the one you meant.)
  const looked = (p) => {
    try {
      // FIX 2026-10-18: getYRot/getXRot aren't visible to KubeJS here (TypeError), which silently dropped this to the old
      // ray trace below = the wrong NPC. KubeJS calls them yaw / pitch.
      var num = (a, b, c) => { try { var v = Number(a()); if (!isNaN(v)) return v } catch (x) { } try { var v2 = Number(b()); if (!isNaN(v2)) return v2 } catch (x) { } return Number(c()) }
      var yaw = num(() => p.yaw, () => p.getYaw(), () => p.getYRot()) * Math.PI / 180
      var pitch = num(() => p.pitch, () => p.getPitch(), () => p.getXRot()) * Math.PI / 180
      var lx = -Math.sin(yaw) * Math.cos(pitch), ly = -Math.sin(pitch), lz = Math.cos(yaw) * Math.cos(pitch)
      var ex = Number(p.getX()), ez = Number(p.getZ()), ey = num(() => p.getEyeY(), () => p.eyeY, () => Number(p.getY()) + 1.62)
      var best = null, bestAlong = 9
      p.level.getAllEntities().forEach(e => {
        try {
          if (String(e.type).indexOf('easy_npc') < 0) return
          var h = num(() => e.getBbHeight(), () => e.bbHeight, () => 1.8), w = num(() => e.getBbWidth(), () => e.bbWidth, () => 0.6)
          var dx = Number(e.getX()) - ex, dy = Number(e.getY()) + h / 2 - ey, dz = Number(e.getZ()) - ez
          var along = dx * lx + dy * ly + dz * lz                       // distance along your view
          if (along <= 0 || along > 8) return
          var px = dx - along * lx, py = dy - along * ly, pz = dz - along * lz
          var side = Math.sqrt(px * px + pz * pz), up = Math.abs(py)      // how far the ray passes from its middle
          if (side > w / 2 + 0.25 || up > h / 2 + 0.25) return
          if (along < bestAlong) { bestAlong = along; best = e }
        } catch (x) { }
      })
      return best
    } catch (x) {
      var hit = p.rayTrace(8, false), e2 = hit == null ? null : hit.entity
      return e2 == null || String(e2.type).indexOf('easy_npc') < 0 ? null : e2
    }
  }
  // tells staff exactly which NPC a command changed, and makes it flash so you can see it
  const pointOut = (src, e) => {
    try {
      say(src, '§7  → NPC §f' + (String(e.getName().getString()) || '(no name)') + ' §7at §f' + Math.floor(e.getX()) + ' ' + Math.floor(e.getY()) + ' ' + Math.floor(e.getZ()))
      e.getServer().runCommandSilent('particle minecraft:happy_villager ' + e.getX() + ' ' + (Number(e.getY()) + 2.2) + ' ' + e.getZ() + ' 0.3 0.3 0.3 0 15 force')
    } catch (x) { }
  }
  const uuidOf = (e) => { try { return String(e.getStringUuid()) } catch (x) { try { return String(e.getStringUUID()) } catch (y) { return String(e.uuid) } } }
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
  // every menu NPC has its own id tag (its hologram uses it). A copied/duplicated NPC can carry the same tag as the
  // original, which made changes show up on both: if another NPC shares this NPC's id, this one gets a fresh id.
  const copied = {}   // NPC uuid -> true when idOf found it was a copy of another NPC (same id tag)
  const idOf = (e) => {
    var id = null
    e.getTags().forEach(t => { if (String(t).indexOf('ot_mid_') == 0) id = String(t) })
    if (id != null) {
      var shared = false, me = uuidOf(e)
      try { e.level.getAllEntities().forEach(x => { try { if (!shared && uuidOf(x) != me && String(x.type).indexOf('easy_npc') >= 0 && x.getTags().contains(id)) shared = true } catch (y) { } }) } catch (x) { }
      if (shared) { e.removeTag(id); id = null; copied[uuidOf(e)] = true }
    }
    if (id == null) { id = 'ot_mid_' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); e.addTag(id) }
    return id
  }
  const OPEN_CMD = { cosmetics: 'cosmetics', crates: 'cratemenu', throneshop: 'throneshop', kits: 'kitmenu', levels: 'levelguide', links: 'links', claims: 'claimmenu', smp: 'smpmenu', professions: 'professionmenu' }
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
      if (copied[uuidOf(e)]) { delete copied[uuidOf(e)]; ownAnchor(e) }
      ids.push(id)
      hideName(s, e)
      clearClickAction(s, e)
      clearOldTitles(e)
      setGlow(s, e, GLOW[t != null ? t : 'cmd'])
      if (t != null) placeHolo(s, e, TITLES[t], id)
      n++
    })
    var stray = 0, npcAt = {}
    p.level.getEntities().forEach(e => { try { var i = null; e.getTags().forEach(t => { if (String(t).indexOf('ot_mid_') == 0) i = String(t) }); if (i && String(e.type).indexOf('easy_npc') >= 0) npcAt[i] = e } catch (x) { } })
    p.level.getEntities().forEach(e => {
      if (String(e.type) != 'minecraft:text_display' || !e.getTags().contains('ot_menu_holo')) return
      var mine = null
      e.getTags().forEach(t => { if (ids.indexOf(String(t)) >= 0) mine = String(t) })
      // no NPC of its own, or floating over somewhere else than its NPC (moved there by the old /npcmenu put)
      var far = false
      try { var o = npcAt[mine]; if (o) { var dx = e.x - o.x, dz = e.z - o.z; far = dx * dx + dz * dz > 1 } } catch (x) { }
      if (!mine || far) { e.discard(); stray++ }
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

  // FIX 2026-10-18: puts back THIS NPC's own hologram (from its menu type / style / command title). /npcmenu put used to
  // teleport every hologram carrying the NPC's id tag: a copied NPC carries the original's tag, so the ORIGINAL's
  // hologram (e.g. "SILAS THE MERCHANT") was moved over the copied NPC.
  const refreshHolo = (server, e) => {
    var id = idOf(e), t = typeOfNpc(e), cmd = String(e.persistentData.getString('ot_menu_cmd') || '')
    if (e.getTags().contains('ot_menu_npc') && t != null) { placeHolo(server, e, TITLES[t], id); return true }
    if (e.getTags().contains('ot_menu_npc') && cmd) { placeHolo(server, e, ['&e&l' + String(e.persistentData.getString('ot_menu_title') || 'CLICK ME').toUpperCase(), '&fRIGHT-CLICK'], id); return true }
    if (e.getTags().contains('ot_styled')) { restyle(server, e); return true }
    return false
  }
  // a copied NPC also carries the original's lock spot (serversetup/npcprotect.js would pull it back onto the original):
  // give it its own lock spot where it stands now
  const ownAnchor = (e) => {
    try { if (typeof npSetAnchor === 'function') { npSetAnchor(e, String(e.level.dimension), Number(e.getX()), Number(e.getY()), Number(e.getZ())); return true } } catch (x) { }
    try {
      var t = new (Java.loadClass('net.minecraft.nbt.CompoundTag'))()
      t.putString('dim', String(e.level.dimension)); t.putDouble('x', Number(e.getX())); t.putDouble('y', Number(e.getY())); t.putDouble('z', Number(e.getZ()))
      e.persistentData.put('ss_npc_anchor', t); return true
    } catch (x) { }
    return false
  }
  const makeMenuNpc = (server, e, type, cmd, title) => {
    Object.keys(MENUS).forEach(t => e.removeTag('ot_menu_' + t))
    e.persistentData.remove('ot_menu_cmd')
    if (cmd) { e.persistentData.putString('ot_menu_cmd', cmd); e.persistentData.putString('ot_menu_title', String(title || 'CLICK ME')) }
    else e.addTag('ot_menu_' + type)
    e.addTag('ot_menu_npc')
    var id = idOf(e)
    if (copied[uuidOf(e)]) { delete copied[uuidOf(e)]; ownAnchor(e) }
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
  const NPC_NAMES = { cosmetics: ['Cosmetics', '#FF55FF'], crates: ['Crates', '#FFFF55'], throneshop: ['Throne Shop', '#E05CFF'], kits: ['Kit Selector', '#FFAA00'], levels: ['Level Guide', '#55FF55'], links: ['Server Links', '#55FFFF'], claims: ['Land Claims', '#FFAA00'], smp: ['SMP World', '#55FF55'], professions: ['Profession Master', '#FFAA00'], caverns: ['Cavern Guide', '#FFAA00'], serverguide: ['Server Guide', '#FFAA00'], tensuraguide: ['Tensura Guide', '#55FFFF'], slguide: ['Solo Leveling Guide', '#AA00AA'], hunters: ['Hunter Association', '#FF5555'], market: ['Silas', '#FF55FF'] }

  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    const StringArg = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
    const typeArg = () => Commands.argument('type', StringArg.word()).suggests((c, b) => { Object.keys(MENUS).forEach(t => b.suggest(t)); return b.buildFuture() })
    const typeOf = (ctx) => { var t = String(StringArg.getString(ctx, 'type')).toLowerCase(); return MENUS[t] ? t : null }
    const guard = (ctx, fn) => { try { return fn() } catch (e) { say(ctx.source, '§c[npcmenu] ' + e); console.error('[npcmenu] ' + e); return 0 } }

    event.register(Commands.literal('npcmenu').requires(src => src.hasPermission(2))
      .then(Commands.literal('spawn').then(typeArg().executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, t = typeOf(ctx)
        if (!t) { say(ctx.source, '§cUse: ' + Object.keys(MENUS).join(', ')); return 0 }
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
        if (!t) { say(ctx.source, '§cUse: ' + Object.keys(MENUS).join(', ')); return 0 }
        if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
        makeMenuNpc(p.server, e, t, null)
        say(ctx.source, '§a[npcmenu] This NPC now opens the ' + t + ' menu.'); pointOut(ctx.source, e)
        return 1
      }))))
      .then(Commands.literal('attachcmd').then(Commands.argument('command', StringArg.greedyString()).executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = looked(p), cmd = String(StringArg.getString(ctx, 'command')).replace(/^\//, '')
        if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
        makeMenuNpc(p.server, e, null, cmd, String(e.getName().getString()))
        say(ctx.source, '§a[npcmenu] Clicking this NPC now runs §f/' + cmd); pointOut(ctx.source, e)
        return 1
      }))))
      // what the NPC you look at is: its menu, id, how many holograms carry its id, and other NPCs sharing it
      .then(Commands.literal('info').executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = looked(p)
        if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
        var id = null
        e.getTags().forEach(t => { if (String(t).indexOf('ot_mid_') == 0) id = String(t) })
        var holos = 0, twins = 0, me = uuidOf(e)
        if (id) p.level.getEntities().forEach(x => { try {
          if (!x.getTags().contains(id)) return
          if (String(x.type) == 'minecraft:text_display') holos++
          else if (uuidOf(x) != me) twins++
        } catch (y) { } })
        var t = typeOfNpc(e), cmd = String(e.persistentData.getString('ot_menu_cmd') || '')
        say(ctx.source, '§6[npcmenu] §7Menu: §f' + (t || (cmd ? 'command /' + cmd : (e.getTags().contains('ot_styled') ? 'styled only (own dialog)' : 'none'))) +
          ' §7· id: §f' + (id || 'none') + ' §7· holograms with this id: §f' + holos + (twins ? ' §c· ' + twins + ' other NPC(s) share this id (a copy): /npcmenu fixall' : ''))
        pointOut(ctx.source, e)
        return 1
      })))
      .then(Commands.literal('debug').executes(ctx => { clickDebug = !clickDebug; say(ctx.source, '§e[npcmenu] click debug ' + (clickDebug ? 'ON: right-click an NPC' : 'OFF')); return 1 }))
      .then(Commands.literal('detach').executes(ctx => guard(ctx, () => {
        var p = ctx.source.playerOrException, e = looked(p)
        if (e == null) { say(ctx.source, '§cLook straight at an NPC (within 8 blocks).'); return 0 }
        Object.keys(MENUS).forEach(t => e.removeTag('ot_menu_' + t))
        e.removeTag('ot_menu_npc'); e.persistentData.remove('ot_menu_cmd')
        run(p.server, `kill @e[type=minecraft:text_display,tag=${idOf(e)}]`)
        run(p.server, `data merge entity ${uuidOf(e)} {Glowing:0b}`)
        say(ctx.source, '§a[npcmenu] NPC is back to normal.'); pointOut(ctx.source, e)
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
        var f = (n) => Number(n).toFixed(2), id = uuidOf(e), nx = Number(f(p.x)), ny = Number(f(p.y)), nz = Number(f(p.z))
        // FIX 2026-10-18: the NPC lock (serversetup/npcprotect.js) holds every NPC on its saved spot. The NEW spot is saved
        // as its anchor BEFORE it moves (the old code removed the anchor and ran "/npclock here" without its radius,
        // which failed, so the NPC was left with no anchor and could be pushed around).
        var anchored = false
        try { if (typeof npSetAnchor === 'function') { npSetAnchor(e, String(p.level.dimension), nx, ny, nz); anchored = true } } catch (x) { }
        if (!anchored) {
          try {
            var t = new (Java.loadClass('net.minecraft.nbt.CompoundTag'))()
            t.putString('dim', String(p.level.dimension)); t.putDouble('x', nx); t.putDouble('y', ny); t.putDouble('z', nz)
            e.persistentData.put('ss_npc_anchor', t); anchored = true
          } catch (x) { }
        }
        run(p.server, `execute in ${p.level.dimension} run tp ${id} ${f(nx)} ${f(ny)} ${f(nz)} ${f(p.yaw)} 0`)
        p.server.scheduleInTicks(2, () => {
          try {
            // make sure the lock's protection flags (immovable, not pushable) are on, and the hologram follows
            try { if (typeof npProtect === 'function') npProtect(e) } catch (x) { }
            // its OWN hologram is placed fresh over it (idOf gives a copied NPC its own id first)
            if (!refreshHolo(p.server, e)) {
              var holo = idOf(e)
              run(p.server, `execute in ${p.level.dimension} run tp @e[type=minecraft:text_display,tag=${holo},limit=1,sort=nearest] ${f(e.x)} ${f(e.y + 2.25)} ${f(e.z)}`)
            }
          } catch (x) { }
        })
        delete grabbed[p.username]
        say(ctx.source, '§a[npcmenu] NPC moved here and locked in place' + (anchored ? '' : ' §c(lock spot could not be saved: tell your dev)') + '§a (hologram too).'); pointOut(ctx.source, e)
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

    // staff: read-only, shows an online player's Tensura race (same lookup the race fix uses)
    event.register(Commands.literal('racecheck').requires(src => src.hasPermission(2))
      .then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var p = Arguments.PLAYER.getResult(ctx, 'player'), race = null
        try {
          var inst = Java.loadClass('io.github.manasmods.manascore.race.api.RaceAPI').getRaceFrom(p).getRace()
          race = inst.isPresent() ? String(inst.get().getRaceId()) : 'none (no race chosen)'
        } catch (e) { race = 'could not read (' + e + ')' }
        say(ctx.source, '§b§lRace §7» §f' + p.username + '§7: §b' + race)
        return 1
      })))
    // staff: read-only check of an online player's Throne Shards (same number their scoreboard shows)
    event.register(Commands.literal('shardcheck').requires(src => src.hasPermission(2))
      .then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var p = Arguments.PLAYER.getResult(ctx, 'player'), b = shardsOf(p)
        say(ctx.source, b.ok ? '§d§lThrone Shards §7» §f' + p.username + '§7 has §d' + fmt(b.value) + (b.exact ? '' : ' (rounded)') + '§7 shards.'
          : '§c[shardcheck] Could not read ' + p.username + "'s shards (" + b.raw + ').')
        return 1
      })))
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
    if (KINDS.aura) { cosCmd('aura', p => cosmeticMenu(p, 'aura')); cosCmd('trail', p => cosmeticMenu(p, 'trail')); cosCmd('killeffect', p => cosmeticMenu(p, 'killfx')) }

    // Tebex / staff: otcosmetic give|take <player> <kind> <id>     (console works, player must be online)
    // kinds: tag, namecolor, chatcolor, glow, gradient, status, joinmessage   (ids: /otcosmetic list)
    const KIND_ALIAS = { tag: 'tag', namecolor: 'nc', chatcolor: 'cc', glow: 'glow', gradient: 'grad', status: 'status', joinmessage: 'join', aura: 'aura', trail: 'trail', killeffect: 'killfx' }
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
      // staff: read-only, shows a player's bought flight time and whether they are flying right now
      .then(Commands.literal('check').requires(src => src.hasPermission(2)).then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var p = Arguments.PLAYER.getResult(ctx, 'player'), flying = false, mayfly = false, gm = '?'
        try { flying = p.getAbilities().flying; mayfly = p.getAbilities().mayfly } catch (e) { }
        try { gm = String(p.gameMode.getGameModeForPlayer().getName()) } catch (e) { }
        ctx.source.sendSystemMessage(Text.of('§b[flytime] §f' + p.username + '§7: bought flight left §f' + dur(flyLeft(p) * 1000) +
          ' §7(shop flight ' + (p.persistentData.getBoolean('ot_fly_on') ? '§aON' : '§cOFF') + '§7) - can fly now: ' + (mayfly ? '§aYES' : '§cNO') +
          '§7, flying now: ' + (flying ? '§aYES' : '§cNO') + ' §7- gamemode: §f' + gm))
        return 1
      })))
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
    event.register(Commands.literal('kitmenu').executes(ctx => { openMenu(ctx.source.playerOrException, 'kits'); return 1 })
      // staff: see another player's kits and cooldowns the way they see them
      .then(Commands.argument('player', Arguments.PLAYER.create(event)).requires(src => src.hasPermission(2)).executes(ctx => {
        var me = ctx.source.playerOrException, who = Arguments.PLAYER.getResult(ctx, 'player')
        try { kitMenu(me, who) } catch (e) { me.tell('§c[npc_menus] ' + e) }
        return 1
      })))
    event.register(Commands.literal('levelguide').executes(ctx => { openMenu(ctx.source.playerOrException, 'levels'); return 1 }))
    event.register(Commands.literal('stats').executes(ctx => { var p = ctx.source.playerOrException; try { statsMenu(p) } catch (e) { p.tell('§c[stats] ' + e) } return 1 })
      .then(Commands.literal('check').requires(src => src.hasPermission(2)).then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var p = Arguments.PLAYER.getResult(ctx, 'player'), st = statsOf(p)
        say(ctx.source, '§6[stats] §f' + p.username + '§7: points §e' + (pointsOf(p) - spentOf(st)) + ' free§7 / ' + pointsOf(p) + ' total')
        STATS.forEach(d => { if (st[d.id]) say(ctx.source, '§7 - ' + strip(d.name) + ': §f' + st[d.id] + '/' + d.max + ' §a(+' + pctTxt(st[d.id] * d.per) + ')') })
        return 1
      })))
      .then(Commands.literal('reset').requires(src => src.hasPermission(2)).then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var p = Arguments.PLAYER.getResult(ctx, 'player')
        p.persistentData.putString('ot_stats', '{}'); applyStats(p)
        say(ctx.source, '§a[stats] Reset ' + p.username + "'s stats for free.")
        p.tell('§a§lStats §7» Staff reset your stats. All your points are free again.')
        return 1
      })))
      .then(Commands.literal('debug').requires(src => src.hasPermission(2)).executes(ctx => {
        var p = ctx.source.playerOrException, sh = shardsOf(p), mo = moneyOf(p)
        say(ctx.source, '§7[stats] shards placeholder §f' + (balancePlaceholder(p.server) || '(none)') + ' §7-> §f' + sh.raw + (sh.ok ? ' §a(ok)' : ' §c(cannot read)'))
        say(ctx.source, '§7[stats] money placeholder §f' + (moneyPlaceholder(p.server) || '(none)') + ' §7-> §f' + mo.raw + (mo.ok ? ' §a(ok)' : ' §c(cannot read)'))
        STATS.forEach(d => { var ok = typeof otSetAttrBonus == 'function' && otSetAttrBonus(p, d.attr, 'overthrone:stat_' + d.id, (statsOf(p)[d.id] || 0) * d.per, d.op); if (!ok) say(ctx.source, '§c[stats] ' + strip(d.name) + ': attribute ' + d.attr + ' not found') })
        return 1
      }))
      .then(Commands.literal('moneyplaceholder').requires(src => src.hasPermission(2)).then(Commands.argument('text', StringArg.greedyString()).executes(ctx => {
        var t = String(StringArg.getString(ctx, 'text'))
        ctx.source.server.persistentData.putString('ot_money_placeholder', t == 'auto' ? '' : t)
        say(ctx.source, '§a[stats] Money placeholder set to §f' + (t == 'auto' ? '(auto)' : t))
        return 1
      }))))
    event.register(Commands.literal('caverns').executes(ctx => { openMenu(ctx.source.playerOrException, 'caverns'); return 1 }))
    // guide menus (also usable without the NPCs)
    ;[['serverguide', 'serverguide'], ['tensuraguide', 'tensuraguide'], ['slguide', 'slguide'], ['huntermenu', 'hunters'], ['marketmenu', 'market']].forEach(c =>
      event.register(Commands.literal(c[0]).executes(ctx => { openMenu(ctx.source.playerOrException, c[1]); return 1 })))
    event.register(Commands.literal('professionmenu').executes(ctx => { openMenu(ctx.source.playerOrException, 'professions'); return 1 }))
    event.register(Commands.literal('claimmenu').executes(ctx => { openMenu(ctx.source.playerOrException, 'claims'); return 1 }))
    event.register(Commands.literal('smpmenu').executes(ctx => { openMenu(ctx.source.playerOrException, 'smp'); return 1 }))
  })
})()
