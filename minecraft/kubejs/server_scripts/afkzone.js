// OVERTHRONE - AFK room (OG Network style).
// Stand inside the AFK zone: a boss bar counts down 30:00. Every 30 minutes you get 1 AFK Shard.
// 6 AFK Shards turn into 1 AFK Key automatically (opens the AFK Crate, fill it with /crate edit afk).
// Leaving the zone resets the timer.
//
// Staff (op):
//   /afkzone pos1 / pos2           stand in two opposite corners of the room (corners include walls/floor/ceiling)
//   /afkzone board [height]        info board (like OG's "What are AFK Shards?") where you stand, facing you
//   /afkzone board flip            turn it round if it shows backwards
//   /afkzone board remove
//   /afkzone test                  stand in the room: shows if you count as inside (and why not)
//   /afkzone info                  shows the zone
//   /afkzone give <player> <n>     give AFK Shards (testing)
// Players: /afkshard              your AFK Shards and AFK Keys

(function () {
  const REWARD_MINUTES = 30
  const SHARDS_PER_KEY = 6
  const ANNOUNCE_EVERY_MINUTES = 45   // "AFK Rewards! ... /warp afk" chat message
  const P = '§b§lAFK ROOM §8» §7'

  const store = (s) => s.persistentData
  const run = (s, c) => s.runCommandSilent(c)
  const zone = (s) => {
    var z = String(store(s).getString('ot_afk_zone') || '')
    return z ? JSON.parse(z) : null
  }
  const dimOf = (p) => String(p.level.dimension.location ? p.level.dimension.location() : p.level.dimension)
  const inZone = (p, z) => {
    if (!z) return false
    var d = dimOf(p), zd = String(z.dim)
    if (d != zd && d.indexOf(zd) < 0 && zd.indexOf(d) < 0) return false
    var x = Number(p.getX()), y = Number(p.getY()), zz = Number(p.getZ())
    return x >= Number(z.x1) && x <= Number(z.x2) + 1 && y >= Number(z.y1) - 1 && y <= Number(z.y2) + 1 && zz >= Number(z.z1) && zz <= Number(z.z2) + 1
  }
  var lastErr = 0
  const report = (s, e) => {
    console.error('[afkzone] ' + e)
    if (Date.now() - lastErr < 60000) return
    lastErr = Date.now()
    s.getPlayerList().getPlayers().forEach(p => { if (p.hasPermissions(2)) p.tell('§c[afkzone] error: ' + e + ' §7(send this to Claude)') })
  }
  const shards = (p) => p.persistentData.getInt('ot_afk_shards') || 0
  const afkKeys = (p) => {
    var inv = p.getInventory(), n = 0
    for (var i = 0; i < inv.getContainerSize(); i++) {
      var st = inv.getItem(i)
      if (!st.isEmpty() && String(st.id) == 'minecraft:tripwire_hook' && String(st.getComponents()).indexOf('ot_key_afk') >= 0) n += st.getCount()
    }
    return n
  }
  const mmss = (sec) => Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2)
  const barId = (p) => 'ot_afk_' + String(p.getGameProfile().getName()).toLowerCase().replace(/[^a-z0-9_]/g, '')

  const addShards = (p, n) => {
    var total = shards(p) + n, keys = Math.floor(total / SHARDS_PER_KEY)
    total = total % SHARDS_PER_KEY
    p.persistentData.putInt('ot_afk_shards', total)
    p.tell(P + 'You earned §b' + n + ' AFK Shard' + (n > 1 ? 's' : '') + '§7! §8(' + total + '/' + SHARDS_PER_KEY + ')')
    if (keys > 0) {
      run(p.server, `crate key give ${p.username} afk ${keys}`)
      p.tell(P + '§a' + SHARDS_PER_KEY + ' AFK Shards turned into §b§l' + keys + ' AFK Key' + (keys > 1 ? 's' : '') + '§a!')
    }
    run(p.server, `execute at ${p.username} run playsound minecraft:entity.experience_orb.pickup master ${p.username} ~ ~ ~ 1 1.2`)
  }

  const inside = {}   // username -> seconds afk in the zone
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 20 != 0) return
    var z = zone(s)
    if (s.tickCount % (ANNOUNCE_EVERY_MINUTES * 1200) == 0 && z && s.players.size() > 0)
      run(s, `tellraw @a ${JSON.stringify(['', { text: 'AFK Rewards!', color: 'aqua', bold: true }, { text: '\nCheck out our AFK area by doing ', color: 'gray' },
        { text: '/warp afk', color: 'yellow', clickEvent: { action: 'run_command', value: '/warp afk' } },
        { text: ' and receive an AFK Key every ' + (REWARD_MINUTES * SHARDS_PER_KEY / 60) + ' hours.', color: 'gray' }])}`)
    s.getPlayerList().getPlayers().forEach(p => { try {
      var name = String(p.getGameProfile().getName()), id = barId(p)
      if (inZone(p, z)) {
        if (inside[name] == null) {
          inside[name] = 0
          run(s, `bossbar add ${id} ""`)
          run(s, `bossbar set ${id} color blue`)
          run(s, `bossbar set ${id} max ${REWARD_MINUTES * 60}`)
          run(s, `bossbar set ${id} players ${name}`)
          p.tell(P + 'You have entered the AFK Room! You will get a reward in §b' + mmss(REWARD_MINUTES * 60) + '§7!')
        }
        inside[name]++
        var left = REWARD_MINUTES * 60 - inside[name]
        if (left <= 0) { addShards(p, 1); inside[name] = 0; left = REWARD_MINUTES * 60 }
        run(s, `bossbar set ${id} value ${left}`)
        run(s, `bossbar set ${id} name ${JSON.stringify(['', { text: '⌚ | ', color: 'red' }, { text: 'Time until reward in: ', color: 'yellow' }, { text: mmss(left), color: 'red', bold: true }, { text: ' | ⌚', color: 'red' }])}`)
        run(s, `title ${name} actionbar ${JSON.stringify(['', { text: 'Your AFK Shards: ', color: 'gold' }, { text: shards(p) + '/' + SHARDS_PER_KEY, color: 'yellow' }, { text: '   Your AFK Keys: ', color: 'dark_aqua' }, { text: '' + afkKeys(p), color: 'aqua' }])}`)
      } else if (inside[name] != null) {
        delete inside[name]
        run(s, `bossbar remove ${id}`)
        p.tell(P + 'You left the AFK Room. Your timer has been reset.')
      }
    } catch (e) { report(s, e) } })
  })
  PlayerEvents.loggedOut(event => {
    var p = event.player
    if (inside[p.username] != null) { delete inside[p.username]; run(p.server, `bossbar remove ${barId(p)}`) }
  })

  // ---- info board
  const BOARD = [
    { text: 'WHAT ARE ', color: '#FF8C3A', bold: true }, { text: 'AFK SHARDS', color: '#FFB347', bold: true }, { text: '?\n', color: '#FF8C3A', bold: true },
    { text: '━━━━━━━━━━━━\n', color: '#C0502A' },
    { text: 'AFK SHARDS', color: '#FFB347', bold: true }, { text: ' are a small currency\nthat you earn from ', color: '#FF8C3A' }, { text: 'AFKING', color: '#8BD448' }, { text: '. You\nearn ', color: '#FF8C3A' },
    { text: '1 AFK SHARD', color: '#FFB347', bold: true }, { text: ' every ', color: '#FF8C3A' }, { text: REWARD_MINUTES + ' MINS', color: '#FF4D6D', bold: true }, { text: ' AFK.\n\n', color: '#FF8C3A' },
    { text: 'AFK SHARDS', color: '#FFB347', bold: true }, { text: ' automatically convert\nto ', color: '#FF8C3A' }, { text: '1 AFK KEY', color: '#8BD448', bold: true },
    { text: ' when you have ', color: '#FF8C3A' }, { text: SHARDS_PER_KEY + ' SHARDS', color: '#8BD448', bold: true }, { text: '!\n', color: '#FF8C3A' },
    { text: '━━━━━━━━━━━━\n', color: '#C0502A' },
    { text: '(/afkshard)', color: '#FFB347' },
  ]

  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    const say = (ctx, m) => ctx.source.sendSystemMessage(Text.of(m))
    const f = (n) => Number(n).toFixed(2)
    const pos = (key) => ctx => {
      var p = ctx.source.playerOrException
      store(p.server).putString(key, JSON.stringify({ dim: dimOf(p), x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) }))
      var a = String(store(p.server).getString('ot_afk_p1') || ''), b = String(store(p.server).getString('ot_afk_p2') || '')
      if (a && b) {
        a = JSON.parse(a); b = JSON.parse(b)
        if (a.dim != b.dim) { say(ctx, '§cBoth corners must be in the same world.'); return 0 }
        var z = { dim: a.dim, x1: Math.min(a.x, b.x), x2: Math.max(a.x, b.x), y1: Math.min(a.y, b.y), y2: Math.max(a.y, b.y) + 2, z1: Math.min(a.z, b.z), z2: Math.max(a.z, b.z) }
        store(p.server).putString('ot_afk_zone', JSON.stringify(z))
        say(ctx, P + '§aAFK zone saved: §f' + z.x1 + ' ' + z.y1 + ' ' + z.z1 + ' §7to §f' + z.x2 + ' ' + z.y2 + ' ' + z.z2 + ' §7(' + z.dim + ')')
      } else say(ctx, P + 'Corner saved. Now stand in the opposite corner and use the other pos command.')
      return 1
    }
    const board = (ctx, h) => {
      var p = ctx.source.playerOrException
      run(p.server, 'kill @e[type=minecraft:text_display,tag=ot_afk_board]')
      var json = JSON.stringify([''].concat(BOARD)).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      run(p.server, `execute in ${p.level.dimension} run summon minecraft:text_display ${f(p.x)} ${f(p.y + h)} ${f(p.z)} ` +
        `{Tags:["ot_afk_board"],Rotation:[${f(p.yaw)}f,0f],billboard:"fixed",alignment:"center",shadow:1b,line_width:400,background:0,` +
        `brightness:{sky:15,block:15},transformation:[1.4f,0f,0f,0f,0f,1.4f,0f,0f,0f,0f,1.4f,0f,0f,0f,0f,1f],text:'${json}'}`)
      say(ctx, P + '§aBoard placed. §7(/afkzone board remove to take it down; /afkzone board flip if it shows backwards)')
      return 1
    }
    event.register(Commands.literal('afkzone').requires(src => src.hasPermission(2))
      .then(Commands.literal('pos1').executes(pos('ot_afk_p1')))
      .then(Commands.literal('pos2').executes(pos('ot_afk_p2')))
      .then(Commands.literal('board').executes(ctx => board(ctx, 1))
        .then(Commands.literal('flip').executes(ctx => { run(ctx.source.server, 'execute as @e[type=minecraft:text_display,tag=ot_afk_board] at @s run tp @s ~ ~ ~ ~180 0'); say(ctx, P + 'Board turned round.'); return 1 }))
        .then(Commands.literal('remove').executes(ctx => { run(ctx.source.server, 'kill @e[type=minecraft:text_display,tag=ot_afk_board]'); say(ctx, P + 'Board removed.'); return 1 }))
        .then(Commands.argument('height', Arguments.INTEGER.create(event)).executes(ctx => board(ctx, Arguments.INTEGER.getResult(ctx, 'height')))))
      .then(Commands.literal('test').executes(ctx => {
        var p = ctx.source.playerOrException, z = zone(p.server)
        say(ctx, P + 'You: §f' + dimOf(p) + ' ' + Math.floor(p.getX()) + ' ' + Math.floor(p.getY()) + ' ' + Math.floor(p.getZ()))
        say(ctx, P + 'Zone: §f' + (z ? z.dim + ' ' + z.x1 + ' ' + z.y1 + ' ' + z.z1 + ' to ' + z.x2 + ' ' + z.y2 + ' ' + z.z2 : 'none'))
        say(ctx, P + 'Inside: ' + (inZone(p, z) ? '§aYES' : '§cNO') + '§7, timer running: ' + (inside[String(p.getGameProfile().getName())] != null ? '§aYES' : '§cNO'))
        return 1
      }))
      .then(Commands.literal('info').executes(ctx => { var z = zone(ctx.source.server); say(ctx, P + (z ? '§f' + JSON.stringify(z) : '§cNo zone yet: /afkzone pos1 and pos2')); return 1 }))
      .then(Commands.literal('give').then(Commands.argument('player', Arguments.PLAYER.create(event)).then(Commands.argument('amount', Arguments.INTEGER.create(event)).executes(ctx => {
        addShards(Arguments.PLAYER.getResult(ctx, 'player'), Arguments.INTEGER.getResult(ctx, 'amount')); return 1
      })))))
    event.register(Commands.literal('afkshard').executes(ctx => {
      var p = ctx.source.playerOrException
      p.tell('§6§lYour AFK Shards: §e' + shards(p) + '/' + SHARDS_PER_KEY + '   §3§lYour AFK Keys: §b' + afkKeys(p))
      p.tell('§7Stand in the AFK room (§e/warp afk§7) to earn 1 shard every ' + REWARD_MINUTES + ' minutes. ' + SHARDS_PER_KEY + ' shards = 1 AFK Key.')
      return 1
    }))
  })
})()
