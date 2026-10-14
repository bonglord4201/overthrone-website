// OVERTHRONE - the Caverns (mine / boss area): cash rewards and trackers.
// Inside the Caverns area every mob kill and every node gathered pays cash, from CASH_MIN to CASH_MAX:
//   mobs   more max health = more cash (weak mobs ~$100-200, bosses up to $10,000)
//   nodes  higher node level = more cash (Lv 1 ~$100, Lv 100 ~$10,000)
// Each payout is randomised +-20%. A per-minute cap per player stops mob farms printing money.
// Trackers (shown in the Caverns NPC menu, /caverns): kills, bosses, nodes, cash earned, best payout, time inside.
//
// Staff (op):
//   /cavernadmin pos1          set one corner of the Caverns area where you stand
//   /cavernadmin pos2          set the opposite corner (same world). Corners go floor to ceiling: include the whole area.
//   /cavernadmin info          show the area and whether you are inside it
//   /cavernadmin stats <player>   a player's Caverns trackers
//   /cavernadmin reset <player>   reset a player's Caverns trackers

// ---------------------------------------------------------------- settings
const CAV_CASH_MIN = 100
const CAV_CASH_MAX = 10000
const CAV_CASH_PER_MINUTE = 50000          // most cash one player can earn per minute in the Caverns (0 = no cap)
const CAV_GIVE_MONEY = 'eco give {p} {n}'  // same economy as the stat resets (eco take)
const CAV_BOSS_HP = 150                    // mobs with at least this much max health count as bosses (same as /level)
const CAV_MOB_CASH = (maxHp) => maxHp * 10 // before the random +-20% and the min/max
const CAV_NODE_CASH = (lvl) => lvl * 100

// player trackers (persistentData)
const CAV_K = { kills: 'ot_cav_kills', bosses: 'ot_cav_bosses', nodes: 'ot_cav_nodes', cash: 'ot_cav_cash', best: 'ot_cav_best', time: 'ot_cav_time' }

// Shared with npc_menus.js (Caverns menu) and professions.js (node gathers).
var otCavernsArea = null
var otCavernsLoad = (s) => {
  try {
    var raw = String(s.persistentData.getString('ot_cav_area') || '')
    otCavernsArea = raw ? JSON.parse(raw) : null
  } catch (e) { otCavernsArea = null }
  return otCavernsArea
}
var otCavernsDim = (level) => {
  var k = level.dimension
  if (typeof k === 'function') k = level.dimension()
  return String(k && k.location ? k.location() : k)
}
var otInCaverns = (level, x, y, z) => {
  var a = otCavernsArea
  if (!a || a.x1 == null || a.x2 == null) return false
  if (otCavernsDim(level) != a.dim) return false
  return x >= Math.min(a.x1, a.x2) && x <= Math.max(a.x1, a.x2) + 1 &&
    y >= Math.min(a.y1, a.y2) && y <= Math.max(a.y1, a.y2) + 1 &&
    z >= Math.min(a.z1, a.z2) && z <= Math.max(a.z1, a.z2) + 1
}
var otCavernsStats = (p) => {
  var d = p.persistentData, r = {}
  Object.keys(CAV_K).forEach(k => { r[k] = Number(d.getLong(CAV_K[k])) || 0 })
  return r
}
// called by professions.js after a node is gathered: (player, node {prof, lvl, xp, dim, x, y, z})
var otOnNodeGathered = (p, n) => {
  try {
    if (!otInCaverns(p.level, n.x + 0.5, n.y + 0.5, n.z + 0.5)) return
    p.persistentData.putLong(CAV_K.nodes, (Number(p.persistentData.getLong(CAV_K.nodes)) || 0) + 1)
    otCavernsPay(p, CAV_NODE_CASH(Number(n.lvl) || 1), 'node')
  } catch (e) { console.warn('[caverns] node: ' + e) }
}

const cavWin = {}
var otCavernsPay = (p, base, why) => {
  var n = Math.round(base * (0.8 + Math.random() * 0.4))
  n = Math.max(CAV_CASH_MIN, Math.min(CAV_CASH_MAX, n))
  if (CAV_CASH_PER_MINUTE > 0) {
    var now = Date.now(), w = cavWin[p.username]
    if (!w || now - w.start > 60000) { w = { start: now, n: 0 }; cavWin[p.username] = w }
    n = Math.min(n, CAV_CASH_PER_MINUTE - w.n)
    if (n <= 0) {
      p.server.scheduleInTicks(25, () => p.server.runCommandSilent(`title ${p.username} actionbar ${JSON.stringify({ text: '⛏ Cavern cash limit reached, wait a moment', color: 'gray' })}`))
      return 0
    }
    w.n += n
  }
  var s = p.server
  s.runCommandSilent(CAV_GIVE_MONEY.replace('{p}', p.username).replace('{n}', String(n)))
  var d = p.persistentData
  d.putLong(CAV_K.cash, (Number(d.getLong(CAV_K.cash)) || 0) + n)
  if (n > (Number(d.getLong(CAV_K.best)) || 0)) d.putLong(CAV_K.best, n)
  var txt = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  // shown after the profession XP message so both are seen
  s.scheduleInTicks(25, () => s.runCommandSilent(`title ${p.username} actionbar ${JSON.stringify({ text: '⛏ +$' + txt + ' Cavern cash' + (why == 'boss' ? ' (BOSS!)' : ''), color: 'green', bold: why == 'boss' })}`))
  if (why == 'boss') s.runCommandSilent(`execute at ${p.username} run playsound minecraft:entity.player.levelup player ${p.username} ~ ~ ~ 0.8 1.2`)
  return n
}

;(function () {
  ServerEvents.loaded(event => { otCavernsLoad(event.server) })

  // mob kills inside the area (not players, not in creative)
  EntityEvents.death(event => {
    try {
      var e = event.entity, p = null
      try { p = event.source.getPlayer() } catch (x) { p = null }
      if (p == null || e.isPlayer() || p.isCreative() || !e.isLiving()) return
      if (otCavernsArea == null) otCavernsLoad(p.server)
      if (!otInCaverns(e.level, e.x, e.y, e.z)) return
      var maxHp = Number(e.getMaxHealth()) || 0
      if (maxHp <= 0) return
      var boss = maxHp >= CAV_BOSS_HP || e.getTags().contains('ot_boss'), d = p.persistentData   // ot_boss: set with /setboss (mob_spawns.js)
      d.putLong(CAV_K.kills, (Number(d.getLong(CAV_K.kills)) || 0) + 1)
      if (boss) d.putLong(CAV_K.bosses, (Number(d.getLong(CAV_K.bosses)) || 0) + 1)
      otCavernsPay(p, CAV_MOB_CASH(maxHp), boss ? 'boss' : 'mob')
    } catch (x) { console.warn('[caverns] kill: ' + x) }
  })

  // time spent inside, counted every 5 seconds
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 100 != 0) return
    if (otCavernsArea == null) return
    s.players.forEach(p => {
      try { if (otInCaverns(p.level, p.x, p.y, p.z)) p.persistentData.putLong(CAV_K.time, (Number(p.persistentData.getLong(CAV_K.time)) || 0) + 5) } catch (x) { }
    })
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    const say = (src, m) => src.sendSystemMessage(Text.of(m))
    const setPos = (ctx, which) => {
      var p = ctx.source.playerOrException, s = p.server
      var a = otCavernsLoad(s) || {}, dim = otCavernsDim(p.level)
      if (a.dim && a.dim != dim) a = {}   // new world: start over
      a.dim = dim
      a['x' + which] = Math.floor(p.x); a['y' + which] = Math.floor(p.y); a['z' + which] = Math.floor(p.z)
      s.persistentData.putString('ot_cav_area', JSON.stringify(a))
      otCavernsArea = a
      say(ctx.source, '§a[caverns] Corner ' + which + ' set to §f' + a['x' + which] + ' ' + a['y' + which] + ' ' + a['z' + which] + ' §7in ' + dim +
        (a.x1 != null && a.x2 != null ? ' §a- area ready!' : ' §7- now set the other corner.'))
      return 1
    }
    const fmtTime = (sec) => { var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h + 'h ' + m + 'm' }
    event.register(Commands.literal('cavernadmin').requires(src => src.hasPermission(2))
      .then(Commands.literal('pos1').executes(ctx => setPos(ctx, 1)))
      .then(Commands.literal('pos2').executes(ctx => setPos(ctx, 2)))
      .then(Commands.literal('info').executes(ctx => {
        var p = ctx.source.playerOrException, a = otCavernsLoad(p.server)
        if (!a || a.x1 == null || a.x2 == null) { say(ctx.source, '§c[caverns] Area not set yet. Use /cavernadmin pos1 and pos2.'); return 0 }
        say(ctx.source, '§6[caverns] §7' + a.dim + ' §f' + a.x1 + ' ' + a.y1 + ' ' + a.z1 + ' §7to §f' + a.x2 + ' ' + a.y2 + ' ' + a.z2)
        say(ctx.source, otInCaverns(p.level, p.x, p.y, p.z) ? '§aYou are INSIDE the Caverns.' : '§cYou are outside the Caverns.')
        return 1
      }))
      .then(Commands.literal('stats').then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var t = Arguments.PLAYER.getResult(ctx, 'player'), st = otCavernsStats(t)
        say(ctx.source, '§6[caverns] §f' + t.username + '§7: kills §f' + st.kills + '§7, bosses §f' + st.bosses + '§7, nodes §f' + st.nodes +
          '§7, cash §a$' + st.cash + '§7, best §a$' + st.best + '§7, time §f' + fmtTime(st.time))
        return 1
      })))
      .then(Commands.literal('reset').then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        var t = Arguments.PLAYER.getResult(ctx, 'player')
        Object.keys(CAV_K).forEach(k => t.persistentData.remove(CAV_K[k]))
        say(ctx.source, '§a[caverns] Reset ' + t.username + "'s Caverns trackers.")
        return 1
      }))))
  })
})()
