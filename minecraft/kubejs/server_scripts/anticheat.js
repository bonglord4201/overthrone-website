// OVERTHRONE - anti-cheat for a modded server.
// Never punishes things mods make normal: flying, speed, jump height, no-fall, big reach weapons, vein mining.
//
// What it checks:
//   1. X-ray behaviour: finds far too many diamonds / emeralds / ancient debris compared to the stone it digs.
//      -> staff alert + log (no auto-ban: luck and vein-mining tools can trigger it, staff should look first)
//   2. Kill-aura / auto-clicker: more than MAX_CPS hits per second -> staff alert; if it keeps happening: strike.
//      Hitting from further than the player's reach stat + REACH_MARGIN -> staff alert only (see REACH_STRIKES).
//   3. Duped / hacked items: a stack bigger than the item's max (e.g. 127 diamonds in one slot) in a player's inventory.
//      -> the extra items are removed + strike
//   Strikes: 1st = warning in chat, 2nd = kick with the reason, 3rd = ban with the reason.
//   Ops are never punished (they still get alerts about others).
//
// A server can NOT see a player's resource packs or texture packs (they never leave the player's PC),
// so X-ray texture packs are caught by check 1 (how they mine), not by looking at the pack.
//
// Staff (op):
//   /ac log                     last 20 alerts
//   /ac check <player>          strikes + this session's mining numbers
//   /ac strikes reset <player>  clear their strikes
//   /ac alerts                  turn alerts in your chat on/off

(function () {
  // ---------------------------------------------------------------- settings
  const MAX_CPS = 17            // hits per second, counted once per server tick (20 max); humans stay well under this
  const MAX_REACH = 8.0         // lowest reach limit, in blocks from the eyes to the edge of the target (vanilla is 3)
  const REACH_MARGIN = 4.0      // allowed on top of the player's own reach stat (mod weapons/skills raise that stat)
  const REACH_STRIKES = false   // false = far hits only alert staff (mod skills can hit far); true = they count towards strikes
  const XRAY_MIN_ORES = 12      // valuable ores in the window before the ratio is judged
  const XRAY_RATIO = 0.05       // valuable ores per stone block mined (legit strip mining is around 0.005)
  const XRAY_WINDOW_MIN = 30    // minutes the mining counts cover
  const VALUABLE = /(diamond_ore|emerald_ore|ancient_debris)/
  const STONE = /(^minecraft:(stone|deepslate|tuff|netherrack|granite|diorite|andesite|basalt|blackstone|calcite|cobbled_deepslate)$)/

  const P = '§8[§cAntiCheat§8] '
  const run = (s, c) => s.runCommandSilent(c)
  const store = (s) => s.persistentData
  const quiet = {}   // staff who turned alerts off

  // ---------------------------------------------------------------- log + alerts
  const log = (s, msg) => {
    var line = new Date().toISOString().slice(5, 16).replace('T', ' ') + ' ' + msg
    console.warn('[anticheat] ' + msg)
    var list = String(store(s).getString('ot_ac_log') || '').split('\n').filter(x => x)
    list.push(line)
    while (list.length > 100) list.shift()
    store(s).putString('ot_ac_log', list.join('\n'))
    s.players.forEach(p => { if (p.hasPermissions(2) && !quiet[p.username]) p.tell(P + '§e' + msg) })
  }

  // ---------------------------------------------------------------- strikes
  const strikes = (p) => p.persistentData.getInt('ot_ac_strikes') || 0
  const strike = (p, reason) => {
    if (p.hasPermissions(2)) { log(p.server, p.username + ' (staff, not punished): ' + reason); return }
    var n = strikes(p) + 1
    p.persistentData.putInt('ot_ac_strikes', n)
    var s = p.server
    if (n == 1) {
      p.tell(P + '§cWarning: §f' + reason + '§c. This is your only warning. Next time you will be kicked, then banned.')
      log(s, p.username + ' warned (strike 1): ' + reason)
    } else if (n == 2) {
      log(s, p.username + ' kicked (strike 2): ' + reason)
      run(s, `kick ${p.username} AntiCheat: ${reason}. You were warned. Next time is a ban.`)
    } else {
      log(s, p.username + ' BANNED (strike ' + n + '): ' + reason)
      run(s, `ban ${p.username} AntiCheat: ${reason}. Appeal with a ticket on our Discord.`)
    }
  }

  // ---------------------------------------------------------------- 1. X-ray behaviour (mining ratio)
  const mining = {}
  const mineOf = (name) => {
    var m = mining[name], now = Date.now()
    if (!m || now - m.start > XRAY_WINDOW_MIN * 60000) { m = { start: now, stone: 0, ores: 0, alerted: false }; mining[name] = m }
    return m
  }
  BlockEvents.broken(event => {
    var p = event.player
    if (p == null) return
    // professions.js gathering nodes are mined on purpose again and again: never count them as X-ray
    if (typeof otIsNodeBlock === 'function' && otIsNodeBlock(event.block)) return
    var id = String(event.block.id)
    var m = mineOf(p.username)
    if (STONE.test(id)) m.stone++
    else if (VALUABLE.test(id)) {
      m.ores++
      if (!m.alerted && m.ores >= XRAY_MIN_ORES && m.ores / Math.max(1, m.stone) > XRAY_RATIO) {
        m.alerted = true
        log(p.server, p.username + ' possible X-ray: ' + m.ores + ' valuable ores vs ' + m.stone + ' stone in ' +
          Math.round((Date.now() - m.start) / 60000) + ' min (at ' + Math.floor(p.x) + ' ' + Math.floor(p.y) + ' ' + Math.floor(p.z) + ' ' + p.level.dimension + ')')
      }
    }
  })

  // ---------------------------------------------------------------- 2. kill-aura / auto-clicker
  const hits = {}
  const farAlerted = {}
  const onAttack = (p, target) => {
    if (p == null || target == null || p.level.isClientSide()) return
    var now = Date.now(), h = hits[p.username], tick = p.server.tickCount
    if (!h || now - h.start > 1000) { h = { start: now, n: 0, tick: -1 }; hits[p.username] = h }
    // sweeping / area weapons hit many mobs in the same tick: that counts as one click
    if (h.tick != tick) { h.n++; h.tick = tick }
    // measured like Minecraft does: from the player's eyes to the nearest edge of the target's hitbox,
    // so big mobs and bosses don't look further away than they are
    var dist = 0
    try { dist = Math.sqrt(target.getBoundingBox().distanceToSqr(p.getEyePosition())) }
    catch (e) { try { dist = Math.sqrt(p.distanceToSqr(target)) } catch (x) { dist = 0 } }
    // the player's own reach stat (raised by modded weapons, Better Combat, skills...) plus a margin for lag
    var range = 3
    try { range = Number(p.entityInteractionRange()) } catch (e) { range = 3 }
    var limit = Math.max(MAX_REACH, range + REACH_MARGIN)
    var reason = null, farOnly = false
    if (h.n > MAX_CPS) reason = 'attacking ' + h.n + ' times per second'
    else if (dist > limit) { reason = 'hitting from ' + dist.toFixed(1) + ' blocks away (limit ' + limit.toFixed(1) + ')'; farOnly = true }
    if (reason == null) return
    if (farOnly && !REACH_STRIKES) {
      // at most one far-hit alert per player per minute, so a long fight doesn't spam staff chat
      if (now - (farAlerted[p.username] || 0) > 60000) {
        farAlerted[p.username] = now
        log(p.server, p.username + ' far hit (alert only, no strike): ' + reason)
      }
      return
    }
    var c = p.persistentData.getInt('ot_ac_combat') + 1
    p.persistentData.putInt('ot_ac_combat', c)
    log(p.server, p.username + ' combat flag #' + c + ': ' + reason)
    // one odd hit can be lag; 5 flags = strike, then the counter starts again
    if (c >= 5) { p.persistentData.putInt('ot_ac_combat', 0); strike(p, 'combat hacks (' + reason + ')') }
    h.n = -1000   // don't flag the same second twice
  }
  try {
    NativeEvents.onEvent('net.neoforged.neoforge.event.entity.player.AttackEntityEvent', ev => {
      try { onAttack(ev.getEntity(), ev.getTarget()) } catch (e) { console.warn('[anticheat] ' + e) }
    })
  } catch (e) { console.warn('[anticheat] combat check off: ' + e) }

  // ---------------------------------------------------------------- 3. over-stacked items (dupes / hacked items)
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 100 != 0) return   // every 5 seconds
    s.players.forEach(p => {
      if (p.isCreative()) return
      var inv = p.getInventory(), found = null
      for (var i = 0; i < inv.getContainerSize(); i++) {
        var st = inv.getItem(i)
        if (st.isEmpty()) continue
        var max = st.getMaxStackSize()
        if (st.getCount() > max) {
          found = st.getCount() + 'x ' + st.id + ' in one slot (max ' + max + ')'
          st.setCount(max)
        }
      }
      if (found) strike(p, 'impossible item stack: ' + found)
    })
  })

  // ---------------------------------------------------------------- staff commands
  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    const say = (ctx, m) => ctx.source.sendSystemMessage(Text.of(m))
    event.register(Commands.literal('ac').requires(src => src.hasPermission(2))
      .then(Commands.literal('log').executes(ctx => {
        var list = String(store(ctx.source.server).getString('ot_ac_log') || '').split('\n').filter(x => x).slice(-20)
        say(ctx, P + '§7Last ' + list.length + ' alerts:')
        list.forEach(l => say(ctx, '§8- §7' + l))
        return 1
      }))
      .then(Commands.literal('check').then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var p = Arguments.PLAYER.getResult(ctx, 'player'), m = mineOf(p.username)
        say(ctx, P + '§f' + p.username + '§7: strikes §f' + strikes(p) + '§7, combat flags §f' + p.persistentData.getInt('ot_ac_combat'))
        say(ctx, '§7 Mining (last ' + Math.round((Date.now() - m.start) / 60000) + ' min): §f' + m.ores + '§7 valuable ores, §f' + m.stone + '§7 stone')
        return 1
      })))
      .then(Commands.literal('strikes').then(Commands.literal('reset').then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var p = Arguments.PLAYER.getResult(ctx, 'player')
        p.persistentData.putInt('ot_ac_strikes', 0); p.persistentData.putInt('ot_ac_combat', 0)
        say(ctx, P + '§aStrikes cleared for ' + p.username)
        return 1
      }))))
      .then(Commands.literal('alerts').executes(ctx => {
        var p = ctx.source.playerOrException
        quiet[p.username] = !quiet[p.username]
        say(ctx, P + '§7Alerts ' + (quiet[p.username] ? '§cOFF' : '§aON'))
        return 1
      })))
  })
})()
