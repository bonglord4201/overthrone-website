// OVERTHRONE - better hub NPCs + clickable links.
//
// /links [discord|website|store|rules|vote]   (everyone) clickable links in chat. The NPC buttons run this,
//                                             because an NPC dialog itself can't hold clickable links.
// /npcfix apply      (op) upgrades config/serversetup/npc_texts.json in place:
//                      Ranks NPC  - new intro, "Open Store" button, "Buy on Store" on every rank page
//                      Info NPC   - buttons for Discord / Website / Store / Vote / Rules
//                      Crates NPC - current crates text, "Vote for Keys" + "Buy Keys" buttons
//                      Hunters    - new NPC "Hunter Association" with a "Go to Hunters" (/warp hunters) button
//                    Rank perk pages and every other NPC are left exactly as they are.
//                    A copy of the old file is saved first as config/serversetup/npc_texts.backup.json.
// /npcfix hunters    (op) puts the Hunters NPC where you stand (uses /placenpc if the setup knows it).
// /npcfix refresh    (op) puts the new texts/buttons on the NPCs already standing in the hub WITHOUT moving them.
// Order:  /npcfix apply   then   /npcfix refresh   then   /npcfix hunters

(function () {
  const TEXTS = 'config/serversetup/npc_texts.json'
  const BACKUP = 'config/serversetup/npc_texts.backup.json'
  const StringArg = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
  const LINKS = {
    discord: ['Discord', 'discord.gg/overthronesmp', 'https://discord.gg/overthronesmp', '#5865F2'],
    website: ['Website', 'overthronesmp.net', 'https://overthronesmp.net', '#55FF55'],
    store: ['Store', 'overthronesmp.tebex.store', 'https://overthronesmp.tebex.store', '#FFD84A'],
    rules: ['Rules', 'overthronesmp.net/rules', 'https://overthronesmp.net/rules', '#FF5555'],
  }
  const VOTES = [
    ['Minecraft-MP', 'https://minecraft-mp.com/server/364807/vote/'],
    ['MinecraftServers.org', 'https://minecraftservers.org/vote/694195'],
    ['MinecraftBestServers', 'https://minecraftbestservers.com/server-overthrone-smp.7252'],
  ]

  // ---------------------------------------------------------------- /links
  const linkPart = (label, url, color) => ({
    text: label, color: color, bold: true, underlined: true,
    clickEvent: { action: 'open_url', value: url },
    hoverEvent: { action: 'show_text', contents: { text: 'Click to open ' + url, color: 'yellow' } },
  })
  const tell = (p, parts) => p.server.runCommandSilent(`tellraw ${p.username} ${JSON.stringify([''].concat(parts))}`)
  const showLink = (p, id) => {
    var l = LINKS[id]
    tell(p, [{ text: ' ➤ ', color: 'dark_gray' }, { text: l[0] + ': ', color: 'white' }, linkPart(l[1], l[2], l[3])])
  }
  const showVotes = (p) => {
    tell(p, [{ text: 'Vote every day for a free Vote Key! Click a site:', color: 'gray' }])
    VOTES.forEach(v => tell(p, [{ text: ' ➤ ', color: 'dark_gray' }, linkPart(v[0], v[1], 'aqua')]))
  }
  const header = (p, title) => tell(p, [{ text: '━━━━━━ ' + title + ' ━━━━━━', color: 'red', bold: true }])

  // Talk to an NPC -> its clickable links go straight to chat.
  const lastTalk = {}
  const npcLinks = (p, name) => {
    if (name == 'ranks' || name == 'rank') {
      tell(p, [{ text: 'Buy a rank here:', color: 'gold', bold: true }]); showLink(p, 'store')
    } else if (/info/.test(name)) {
      header(p, 'OVERTHRONE LINKS'); Object.keys(LINKS).forEach(id => showLink(p, id)); showVotes(p)
    } else if (/crate/.test(name)) {
      tell(p, [{ text: 'Get crate keys:', color: 'gold', bold: true }]); showLink(p, 'store'); showVotes(p)
    }
  }
  ItemEvents.entityInteracted(event => {
    try {
      var p = event.player, e = event.target
      if (p == null || e == null || String(e.type).indexOf('easy_npc') < 0) return
      if (e.getTags().contains('ot_menu_npc')) return   // menu NPCs (npc_menus.js) open a menu instead
      var now = Date.now(), last = lastTalk[p.username] || 0
      if (now - last < 1500) return
      lastTalk[p.username] = now
      npcLinks(p, String(e.persistentData.getString('ot_style_title') || e.getName().getString()).toLowerCase().trim())
    } catch (x) { console.warn('[hub_npcs] ' + x) }
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    var cmd = Commands.literal('links').executes(ctx => {
      var p = ctx.source.playerOrException
      header(p, 'OVERTHRONE LINKS')
      Object.keys(LINKS).forEach(id => showLink(p, id))
      showVotes(p)
      return 1
    })
    Object.keys(LINKS).forEach(id => {
      cmd = cmd.then(Commands.literal(id).executes(ctx => {
        var p = ctx.source.playerOrException
        console.info('[links] ' + p.username + ' ' + id)
        tell(p, [{ text: 'Click the link to open it:', color: 'gray' }])
        showLink(p, id)
        return 1
      }))
    })
    cmd = cmd.then(Commands.literal('vote').executes(ctx => { showVotes(ctx.source.playerOrException); return 1 }))
    event.register(cmd)

    event.register(Commands.literal('npcfix').requires(src => src.hasPermission(2))
      .then(Commands.literal('apply').executes(ctx => apply(ctx.source)))
      .then(Commands.literal('refresh').executes(ctx => refresh(ctx.source)))
      .then(Commands.literal('look').then(Commands.argument('which', StringArg.word())
        .suggests((c, b) => { ['crates', 'ranks', 'info', 'hunters'].forEach(x => b.suggest(x)); return b.buildFuture() })
        .executes(ctx => lookFix(ctx.source, String(StringArg.getString(ctx, 'which')).toLowerCase()))))
      .then(Commands.literal('hunters').executes(ctx => placeHunters(ctx.source))))
  })

  // ---------------------------------------------------------------- npc_texts.json upgrade
  const say = (src, msg) => src.sendSystemMessage(Text.of(msg))
  const btn = (label, command) => ({ label: label, command: command })
  // keep the colour code the old first line used (e.g. "§6"), so the title keeps its look
  const codeOf = (line) => { var m = String(line || '').match(/^((?:[§&][0-9a-fk-or])+)/i); return m ? m[1] : '' }
  const hasBtn = (page, label) => (page.buttons || []).some(b => String(b.label) == label)
  const startPage = (def) => {
    var pages = def.dialog.pages || {}
    var start = def.dialog.start || Object.keys(pages)[0]
    return { label: start, page: pages[start] }
  }
  const find = (npcs, test) => {
    var keys = Object.keys(npcs)
    for (var i = 0; i < keys.length; i++) {
      var d = npcs[keys[i]]
      if (d != null && test(keys[i].toLowerCase(), String(d.name || '').toLowerCase(), d)) return keys[i]
    }
    return null
  }

  const HUNTERS = {
    name: 'Hunter Association', name_color: '#E02020', skin_variant: 'STEVE',
    dialog: {
      start: 'main',
      pages: {
        main: {
          lines: [
            'Hunter Association',
            'Rise through the Hunter Ranks:',
            'E » D » C » B » A » S » ???',
            'Take quests, hunt monsters, claim bounties.',
            'Check your rank and quests inside.',
          ],
          buttons: [btn('Go to Hunters', '/warp hunters')],
        },
      },
    },
  }

  const CRATE_LINES = (c) => [
    c + 'Vote Keys: /vote every day.',
    'Weapon, Armor & Rune Keys: store.',
    'Right-click a crate with a key to open it.',
    'Left-click a crate to see the rewards.',
  ]
  const CRATE_BUTTONS = () => [btn('Vote for Keys', '/vote'), btn('Buy Keys', '/links store')]
  const CRATES_DEF = {
    name: 'Crates', name_color: '#FFAA00',
    dialog: { start: 'main', pages: { main: { lines: CRATE_LINES(''), buttons: CRATE_BUTTONS() } } },
  }

  function upgrade(npcs, out) {
    // Ranks
    var k = find(npcs, (key, name, d) => d.dialog != null && (key == 'ranks' || key == 'rank' || name == 'ranks' || name == 'rank'))
    if (k == null) out.push('§cRanks NPC not found (skipped)')
    else {
      var d = npcs[k], s = startPage(d), c = codeOf(s.page.lines && s.page.lines[0])
      s.page.lines = [
        c + 'Support the server and get a rank!',
        'Ronin » Valkyrie » Monarch » Godborn » Overlord',
        'Every rank includes all perks of the ranks below it.',
        'Click a rank to see its perks.',
      ]
      s.page.buttons = s.page.buttons || []
      if (!hasBtn(s.page, 'Open Store')) s.page.buttons.push(btn('Open Store', '/links store'))
      var rankPages = 0
      s.page.buttons.forEach(b => {
        var page = b.page != null ? d.dialog.pages[String(b.page)] : null
        if (page == null || String(b.page) == s.label) return
        rankPages++
        page.lines = (page.lines || []).map(l => /TODO/.test(String(l)) ? 'Buy it at overthronesmp.tebex.store' : l)
        page.buttons = page.buttons || []
        if (!hasBtn(page, 'Buy on Store')) page.buttons.unshift(btn('Buy on Store', '/links store'))
      })
      out.push('§aRanks NPC §7(' + k + ')§a: new intro, Open Store button, Buy on Store on ' + rankPages + ' rank pages')
    }
    // Server info
    k = find(npcs, (key, name, d) => d.dialog != null && (/info/.test(key) || /info/.test(name)))
    if (k == null) out.push('§cServer Info NPC not found (skipped)')
    else {
      var d2 = npcs[k], s2 = startPage(d2), c2 = codeOf(s2.page.lines && s2.page.lines[0])
      s2.page.lines = [
        c2 + 'Welcome to OVERTHRONE SMP!',
        'All our links are now in your chat.',
        'Close this and click a link to open it.',
      ]
      var keep = (s2.page.buttons || []).filter(b => b.page != null)
      s2.page.buttons = [
        btn('Discord', '/links discord'), btn('Website', '/links website'), btn('Store', '/links store'),
        btn('Vote', '/vote'), btn('Rules', '/links rules'),
      ].concat(keep)
      out.push('§aServer Info NPC §7(' + k + ')§a: link buttons added')
    }
    // Crates
    k = find(npcs, (key, name, d) => d.dialog != null && (/crate/.test(key) || /crate/.test(name)))
    if (k == null) out.push('§cCrates NPC not found (skipped)')
    else {
      var d3 = npcs[k], s3 = startPage(d3), c3 = codeOf(s3.page.lines && s3.page.lines[0])
      s3.page.lines = CRATE_LINES(c3)
      s3.page.buttons = CRATE_BUTTONS()
      out.push('§aCrates NPC §7(' + k + ')§a: new text, Vote for Keys + Buy Keys buttons')
    }
    // Hunters (new)
    k = find(npcs, (key, name) => key == 'hunters' || /hunter/.test(name))
    if (k == null) { npcs.hunters = HUNTERS; out.push('§aHunters NPC added §7(key: hunters)') }
    else { npcs[k].dialog = HUNTERS.dialog; out.push('§aHunters NPC §7(' + k + ')§a updated') }
  }

  function apply(src) {
    if (typeof ssReadJson != 'function' || typeof ssWriteJson != 'function') {
      say(src, '§c[npcfix] The serversetup scripts are not loaded, nothing changed.')
      return 0
    }
    var data = ssReadJson(TEXTS, null)
    if (data == null) { say(src, '§c[npcfix] Cannot read ' + TEXTS + ' (missing or broken JSON), nothing changed.'); return 0 }
    var out = []
    try {
      data = JSON.parse(JSON.stringify(data))
      ssWriteJson(BACKUP, JSON.parse(JSON.stringify(data)))
      var npcs = data.npcs != null ? data.npcs : data
      upgrade(npcs, out)
      ssWriteJson(TEXTS, data)
    } catch (e) {
      console.error('[npcfix] ' + e)
      say(src, '§c[npcfix] Error: ' + e + ' §7(send this to Claude)')
      return 0
    }
    say(src, '§6[npcfix] ' + TEXTS + ' updated §7(old copy: ' + BACKUP + ')')
    out.forEach(l => say(src, ' ' + l))
    say(src, '§eNow run: §f/npcfix refresh §ethen stand where you want him and §f/npcfix hunters')
    return 1
  }

  // ---------------------------------------------------------------- update NPCs in place (no moving)
  function refresh(src) {
    if (typeof ssReadJson != 'function' || typeof ssNpcUpdateNbt != 'function') {
      say(src, '§c[npcfix] The serversetup scripts are not loaded, nothing changed.')
      return 0
    }
    var data = ssReadJson(TEXTS, null)
    if (data == null) { say(src, '§c[npcfix] Cannot read ' + TEXTS + ', nothing changed.'); return 0 }
    try {
      data = JSON.parse(JSON.stringify(data))
      var npcs = data.npcs != null ? data.npcs : data
      var done = []
      Object.keys(npcs).forEach(key => {
        var def = npcs[key]
        if (def == null || def.name == null) return
        var name = String(def.name).replace(/"/g, '')
        // only the data (name, dialog, buttons) is merged: position and skin stay as they are
        src.server.runCommandSilent(`execute as @e[type=easy_npc:humanoid,tag=setup_npc,name="${name}"] run data merge entity @s ${ssNpcUpdateNbt(key, def)}`)
        done.push(name)
      })
      say(src, '§a[npcfix] Updated in place (not moved): §f' + done.join(', '))
      say(src, '§7Talk to each NPC to check. If one did not change, tell Claude its name.')
    } catch (e) {
      console.error('[npcfix] ' + e)
      say(src, '§c[npcfix] Error: ' + e + ' §7(send this to Claude)')
      return 0
    }
    return 1
  }

  // ---------------------------------------------------------------- fix the NPC you are looking at
  // For an NPC that /npcfix refresh misses (e.g. not a setup NPC, or renamed in game).
  function lookFix(src, which) {
    var p = src.player
    if (p == null) { say(src, '§c[npcfix] Run this in game while looking at the NPC.'); return 0 }
    if (typeof ssNpcUpdateNbt != 'function') { say(src, '§c[npcfix] The serversetup NPC builder is not loaded.'); return 0 }
    var hit = p.rayTrace(8, false), e = hit == null ? null : hit.entity
    if (e == null || String(e.type).indexOf('easy_npc') < 0) { say(src, '§c[npcfix] Look straight at the NPC (within 8 blocks) and try again.'); return 0 }
    var def = null
    if (which == 'crates') def = CRATES_DEF
    else if (which == 'hunters') def = HUNTERS
    else {
      var data = typeof ssReadJson == 'function' ? ssReadJson(TEXTS, null) : null
      if (data != null) {
        data = JSON.parse(JSON.stringify(data))
        var npcs = data.npcs != null ? data.npcs : data
        var k = which == 'ranks'
          ? find(npcs, (key, name, d) => d.dialog != null && (key == 'ranks' || key == 'rank' || name == 'ranks' || name == 'rank'))
          : find(npcs, (key, name, d) => d.dialog != null && (/info/.test(key) || /info/.test(name)))
        if (k != null) def = npcs[k]
      }
    }
    if (def == null) { say(src, '§c[npcfix] Use: /npcfix look crates|ranks|info|hunters (run /npcfix apply first for ranks/info)'); return 0 }
    var id
    try { id = String(e.getStringUuid()) } catch (x) { try { id = String(e.getStringUUID()) } catch (y) { id = String(e.uuid) } }
    var first = ''
    try { var sp = def.dialog.pages[def.dialog.start || Object.keys(def.dialog.pages)[0]]; first = String(sp.lines[0]) + ' | ' + String(sp.lines[1]) } catch (x) { }
    say(src, '§7[npcfix] Text being put on the NPC starts with: §f' + first)
    // run as you (not silent) so Minecraft shows in chat if the merge is refused
    p.runCommand(`data merge entity ${id} ${ssNpcUpdateNbt(which, def)}`)
    say(src, '§a[npcfix] Done. Close and talk to the NPC again to check.')
    return 1
  }

  // ---------------------------------------------------------------- Hunters NPC placement
  function placeHunters(src) {
    var p = src.player
    if (p == null) { say(src, '§c[npcfix] Run this in game, standing where the NPC should go.'); return 0 }
    var data = typeof ssReadJson == 'function' ? ssReadJson(TEXTS, null) : null
    var npcs = data == null ? null : (data.npcs != null ? data.npcs : data)
    var key = npcs == null ? null : find(npcs, (k, name) => k == 'hunters' || /hunter/.test(name))
    if (key == null) { say(src, '§c[npcfix] Run /npcfix apply first.'); return 0 }
    // the setup knows the NPC -> /placenpc (saves the spot in coordinates.json and locks him there)
    if (typeof SS_NPC_KEYS != 'undefined' && SS_NPC_KEYS.indexOf(key) >= 0) {
      p.server.runCommandSilent(`execute as ${p.username} at @s run placenpc ${key}`)
      say(src, '§a[npcfix] Placed with /placenpc ' + key + '.')
      return 1
    }
    // otherwise summon him directly with the setup's own NPC data
    if (typeof ssNpcNbt != 'function') { say(src, '§c[npcfix] The serversetup NPC builder is not loaded.'); return 0 }
    var f = (n) => Number(n).toFixed(2)
    var nbt = String(ssNpcNbt(key, npcs[key], 'ot_hunters_npc'))
    nbt = nbt.substring(0, nbt.length - 1) + `,Rotation:[${f(p.yaw)}f,0f]}`
    p.server.runCommandSilent(`kill @e[type=easy_npc:humanoid,tag=ot_hunters_npc]`)
    p.server.runCommandSilent(`execute in ${p.level.dimension} run summon easy_npc:humanoid ${f(p.x)} ${f(p.y)} ${f(p.z)} ${nbt}`)
    say(src, '§a[npcfix] Hunters NPC summoned here. §7(/npcfix hunters again moves him)')
    return 1
  }
})()
