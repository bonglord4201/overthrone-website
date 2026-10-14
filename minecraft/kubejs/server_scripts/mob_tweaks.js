// OVERTHRONE - mob tweaks: set a mob's health and cap how hard it hits.
// Matches mobs by their id (e.g. "somemod:barghest"), so it works whichever mod adds them.
//   hp      max health (set once per mob, so a hurt mob doesn't heal when its chunk reloads; set again if you change it)
//   damage  the most one hit can do to anything (melee, projectiles, abilities). Fire from being set
//           on fire is not the mob's hit, so burning still works as normal.
//
// Staff (op):  /mobtweaks   lists the tweaks and the ids of matching mobs near you

(function () {
  const uidOf = (e) => { try { return String(e.getStringUuid()) } catch (x) { try { return String(e.getUuid()) } catch (y) { return String(e.uuid) } } }   // KubeJS renames getUUID
  const TWEAKS = [
    { match: 'barghest', hp: 40, damage: 5 },
    { match: 'direwolf', hp: 5, damage: 5 },   // tensura:direwolf (any mob with "direwolf" in its id)
  ]
  const DONE = 'ot_mobtweak'

  const idOf = (e) => { try { var s = e.getEncodeId(); return s ? String(s) : '' } catch (x) { return '' } }
  const tweakFor = (e) => {
    var id = idOf(e)
    if (!id) return null
    var path = id.substring(id.indexOf(':') + 1)
    for (var i = 0; i < TWEAKS.length; i++) if (path.indexOf(TWEAKS[i].match) >= 0) return TWEAKS[i]
    return null
  }

  const applyHp = (e, t) => {
    try {
      // remembers the HP it set, so changing a number below also updates mobs that were already tweaked
      if (!t.hp || !e.isLiving() || e.persistentData.getInt(DONE + '_hp') == t.hp) return
      e.level.server.runCommandSilent('attribute ' + uidOf(e) + ' minecraft:generic.max_health base set ' + t.hp)
      e.setHealth(t.hp)
      e.persistentData.putInt(DONE + '_hp', t.hp)
    } catch (x) { }
  }

  // runs as mobs spawn or load in; the attribute command needs the mob in the world, so wait a tick
  EntityEvents.spawned(event => {
    var e = event.entity, t = tweakFor(e)
    if (!t) return
    event.level.server.scheduleInTicks(1, () => applyHp(e, t))
  })

  // cap the damage of every hit whose attacker (or the attacker's projectile) is a tweaked mob
  NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent', event => {
    try {
      var src = event.getSource(), t = null
      if (src.getEntity()) t = tweakFor(src.getEntity())
      if (!t && src.getDirectEntity()) t = tweakFor(src.getDirectEntity())
      if (t && t.damage && event.getAmount() > t.damage) event.setAmount(t.damage)
    } catch (x) { }
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('mobtweaks').requires(src => src.hasPermission(2)).executes(ctx => {
      var p = ctx.source.playerOrException
      TWEAKS.forEach(t => p.tell('§6§lMOB TWEAKS §8» §f' + t.match + ' §7- HP: §c' + t.hp + ' §7- max hit: §c' + t.damage))
      var found = {}
      p.level.getAllEntities().forEach(e => {
        try { if (tweakFor(e) && e.distanceTo(p) < 64) found[idOf(e)] = (found[idOf(e)] || 0) + 1 } catch (x) { }
      })
      var ids = Object.keys(found)
      p.tell(ids.length ? '§7Nearby: §f' + ids.map(k => k + ' x' + found[k]).join(', ') : '§7No matching mobs within 64 blocks.')
      return 1
    }))
  })
})()
