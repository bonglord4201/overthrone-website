const WD_FILE = 'config/serversetup/world_damage.json'
const WD_ALWAYS = { outOfWorld: true, genericKill: true }
const WdPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const WdIncomingDamage = Java.loadClass('net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent')
let wdConf = null

function wdLoad() {
  let c = ssReadJson(WD_FILE, null)
  let conf = { enabled: false, worlds: {}, allowVoid: true }
  if (c == null) {
    console.warn('[worlddamage] cannot read ' + WD_FILE + ' - no world is protected')
  } else {
    conf.enabled = c.enabled != false
    conf.allowVoid = c.allow_void_and_kill != false
    let worlds = c.protected_worlds || []
    worlds.forEach(w => { conf.worlds[String(w)] = true })
  }
  wdConf = conf
  return conf
}

function wdProtected(level) {
  let c = wdConf != null ? wdConf : wdLoad()
  return c.enabled && c.worlds[ssDimId(level)] == true
}

NativeEvents.onEvent(WdPriority.HIGHEST, WdIncomingDamage, event => {
  try {
    let victim = event.getEntity()
    if (!victim.isPlayer() || victim.getLevel().isClientSide()) return
    if (!wdProtected(victim.getLevel())) return
    if (wdConf.allowVoid && WD_ALWAYS[String(event.getSource().getMsgId())] == true) return
    event.setCanceled(true)
  } catch (e) {
    console.warn('[worlddamage] ' + e)
  }
})

ServerEvents.commandRegistry(event => {
  let Commands = event.commands
  event.register(Commands.literal('worlddamage').requires(s => s.hasPermission(2))
    .executes(ctx => {
      let c = wdConf != null ? wdConf : wdLoad()
      let list = Object.keys(c.worlds)
      ssMsg(ctx.source, '§6[worlddamage] §fNo player damage in: §e' + (c.enabled && list.length > 0 ? list.join(', ') : 'no world') + (c.enabled ? '' : ' §7(switched off in the file)'))
      let p = ctx.source.getPlayer()
      if (p != null) ssMsg(ctx.source, '§7You are in §f' + ssDimId(p.getLevel()) + '§7: ' + (wdProtected(p.getLevel()) ? '§aprotected (no damage)' : '§cnormal damage'))
      return 1
    })
    .then(Commands.literal('reload').executes(ctx => {
      let c = wdLoad()
      ssMsg(ctx.source, '§a[worlddamage] ' + WD_FILE + ' reloaded - no player damage in: ' + (c.enabled ? Object.keys(c.worlds).join(', ') || 'no world' : 'no world (switched off)'))
      return 1
    })))
})
