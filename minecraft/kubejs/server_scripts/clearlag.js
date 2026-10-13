// OVERTHRONE - removes dropped items from the ground every hour (all worlds), with chat warnings:
// 1 minute, 30 seconds, then 10, 9, 8 ... 1.
// Items that can't be picked up (shop/display items from mods) are left alone.
// Staff (op): /clearlag now      clear right away (with the 10 second countdown)
//             /clearlag status   time until the next clear

(function () {
  const EVERY_MINUTES = 60
  const P = '§8[§cClearLag§8] '
  var nextAt = 0          // server tick of the next clear
  var running = false

  const say = (s, msg) => s.runCommandSilent(`tellraw @a ${JSON.stringify([{ text: '' }].concat(msg))}`)
  const t = (text, color, bold) => ({ text: text, color: color, bold: !!bold })

  const clearItems = (s) => {
    var n = 0
    s.getAllLevels().forEach(level => {
      level.getEntities().forEach(e => {
        if (String(e.type) != 'minecraft:item') return
        var keep = false
        try { keep = e.nbt.getShort('PickupDelay') >= 32767 } catch (x) { keep = false }   // display items
        if (keep) return
        e.discard()
        n++
      })
    })
    return n
  }

  ServerEvents.tick(event => {
    var s = event.server, now = s.tickCount
    if (nextAt == 0) nextAt = now + EVERY_MINUTES * 1200
    var left = Math.ceil((nextAt - now) / 20)        // seconds left
    if ((nextAt - now) % 20 != 0) return             // only act on whole seconds
    if (left == 60) say(s, [t('⚠ ', 'gold'), t('Items on the ground will be removed in ', 'yellow'), t('1 minute', 'red', true), t('!', 'yellow')])
    else if (left == 30) say(s, [t('⚠ ', 'gold'), t('Items on the ground will be removed in ', 'yellow'), t('30 seconds', 'red', true), t('!', 'yellow')])
    else if (left >= 1 && left <= 10) say(s, [t('⚠ ', 'gold'), t('Clearing ground items in ', 'yellow'), t(left + '', 'red', true), t('...', 'yellow')])
    else if (left <= 0) {
      var n = clearItems(s)
      say(s, [t('✔ ', 'green'), t('Removed ', 'gray'), t(n + '', 'white', true), t(' items from the ground.', 'gray')])
      console.info('[clearlag] removed ' + n + ' items')
      nextAt = now + EVERY_MINUTES * 1200
    }
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('clearlag').requires(src => src.hasPermission(2))
      .then(Commands.literal('now').executes(ctx => {
        var s = ctx.source.server
        nextAt = s.tickCount + 11 * 20
        ctx.source.sendSystemMessage(Text.of(P + '§7Clearing in 10 seconds.'))
        return 1
      }))
      .then(Commands.literal('status').executes(ctx => {
        var s = ctx.source.server, left = Math.max(0, Math.ceil((nextAt - s.tickCount) / 20))
        ctx.source.sendSystemMessage(Text.of(P + '§7Next clear in §f' + Math.floor(left / 60) + 'm ' + (left % 60) + 's'))
        return 1
      })))
  })
})()
