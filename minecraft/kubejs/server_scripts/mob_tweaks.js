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
    { match: 'direwolf', hp: 5, damage: 2 },   // tensura:direwolf (any mob with "direwolf" in its id)
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

  // Max health: the base value is set so the mob's TOTAL max health is the number below, even if Tensura adds
  // extra health on top (EP). Checked when the mob spawns/loads and again every 5 seconds, in case anything raises it.
  var Attributes = null
  try { Attributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes') } catch (x) { }
  const applyHp = (e, t) => {
    try {
      if (!t.hp || !e.isLiving() || !e.isAlive()) return
      var max = Number(e.getMaxHealth())
      if (Math.abs(max - t.hp) > 0.5) {
        var done = false
        if (Attributes != null) {
          try {
            var inst = e.getAttribute(Attributes.MAX_HEALTH)
            var extra = max - Number(inst.getBaseValue())          // what other mods add on top
            inst.setBaseValue(Math.max(1, t.hp - extra))
            done = true
          } catch (x) { }
        }
        if (!done) e.level.server.runCommandSilent('attribute ' + uidOf(e) + ' minecraft:generic.max_health base set ' + t.hp)
      }
      max = Number(e.getMaxHealth())
      // first time: start at full (new) health; afterwards only trim health that is over the max
      if (e.persistentData.getInt(DONE + '_hp') != t.hp) { e.setHealth(max); e.persistentData.putInt(DONE + '_hp', t.hp) }
      else if (Number(e.getHealth()) > max) e.setHealth(max)
    } catch (x) { }
  }

  // runs as mobs spawn or load in; the mob must be in the world first, so wait a tick
  EntityEvents.spawned(event => {
    var e = event.entity, t = tweakFor(e)
    if (!t) return
    event.level.server.scheduleInTicks(1, () => applyHp(e, t))
  })
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % 100 != 0) return
    s.getAllLevels().forEach(level => {
      try { level.getAllEntities().forEach(e => { try { var t = tweakFor(e); if (t) applyHp(e, t) } catch (x) { } }) } catch (x) { }
    })
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
      var n = 0
      p.level.getAllEntities().forEach(e => {
        try {
          if (!tweakFor(e) || e.distanceTo(p) >= 64 || n >= 8) return
          n++
          p.tell('§7- §f' + idOf(e) + ' §7health §c' + Number(e.getHealth()).toFixed(1) + '§7/§c' + Number(e.getMaxHealth()).toFixed(1))
        } catch (x) { }
      })
      if (!n) p.tell('§7No matching mobs within 64 blocks.')
      return 1
    }))
  })
})()
