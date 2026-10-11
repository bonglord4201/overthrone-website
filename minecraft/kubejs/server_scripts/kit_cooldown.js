// OVERTHRONE - enforces rank-kit cooldowns ourselves, because NeoEssentials saves the cooldown but doesn't apply it.
// Drop into kubejs/server_scripts/ and restart. Blocks "/kit <name>" until the cooldown is over.
// Ops skip the cooldown (so staff can test kits); everyone else waits.
//
// Staff (op):  /kitcd check <player>                 shows that player's kit timers
//              /kitcd reset <player>                 clears all their kit timers
// Note: only the /kit command is covered. If players can also claim kits by clicking a /kits menu, tell Claude.

(function () {
  const COOLDOWN_HOURS = 120   // 5 days
  const KITS = ['ronin', 'valkyrie', 'monarch', 'godborn', 'overlord']
  const COMMANDS = ['kit', 'kits', 'neoessentials:kit', 'neoessentials:kits']
  const keyOf = (kit) => 'ot_kitcd_' + kit
  const MS = COOLDOWN_HOURS * 3600 * 1000

  const left = (ms) => {
    var h = Math.floor(ms / 3600000), m = Math.ceil((ms % 3600000) / 60000)
    if (m === 60) { h++; m = 0 }
    var d = Math.floor(h / 24)
    h = h % 24
    return (d ? d + 'd ' : '') + (d || h ? h + 'h ' : '') + m + 'm'
  }

  ServerEvents.command(event => {
    var input = String(event.input || '').trim().replace(/^\//, '')
    var parts = input.split(/\s+/)
    if (parts.length < 2) return
    if (COMMANDS.indexOf(parts[0].toLowerCase()) < 0) return
    var kit = parts[1].toLowerCase()
    if (KITS.indexOf(kit) < 0) return
    var p = null
    try { p = event.parseResults.getContext().getSource().getPlayer() } catch (e) { p = null }
    if (!p) return                       // console / command blocks: no cooldown
    if (p.hasPermissions(2)) return      // ops skip it
    var last = Number(String(p.persistentData.getString(keyOf(kit))) || 0)
    var now = Date.now()
    if (last && now - last < MS) {
      p.tell(`§c✦ You can claim the §l${kit}§c kit again in §e${left(MS - (now - last))}§c.`)
      event.cancel()
      return
    }
    p.persistentData.putString(keyOf(kit), String(now))
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    const reply = (ctx, msg) => {
      try { var pl = ctx.source.player; if (pl) pl.tell(msg); else console.info(String(msg).replace(/§./g, '')) }
      catch (e) { console.info(String(msg).replace(/§./g, '')) }
    }
    event.register(Commands.literal('kitcd').requires(src => src.hasPermission(2))
      .then(Commands.literal('check').then(Commands.argument('target', Arguments.PLAYER.create(event)).executes(ctx => {
        var p = Arguments.PLAYER.getResult(ctx, 'target'), now = Date.now()
        KITS.forEach(k => {
          var last = Number(String(p.persistentData.getString(keyOf(k))) || 0)
          var msg = last && now - last < MS ? '§e' + left(MS - (now - last)) + ' left' : '§aready'
          reply(ctx, `§6${k}§7: ${msg}`)
        })
        return 1
      })))
      .then(Commands.literal('reset').then(Commands.argument('target', Arguments.PLAYER.create(event)).executes(ctx => {
        var p = Arguments.PLAYER.getResult(ctx, 'target')
        KITS.forEach(k => p.persistentData.remove(keyOf(k)))
        reply(ctx, `§aCleared kit timers for ${p.username}.`)
        return 1
      })))
    )
  })
})()
