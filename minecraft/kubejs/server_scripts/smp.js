// OVERTHRONE - the SMP world.
// The SMP world is the old Multiworld world "wild" (multiworld:wild). Its id stays "wild" on purpose:
// renaming a Multiworld world makes a brand-new empty world, so players only ever see the name "SMP".
// (/wild now goes to the Overworld, see config/serversetup/worlds.json.)
// No claims in the SMP (raiding allowed): multiworld:wild is in Flan's blacklistedWorlds.
//
// Everyone:
//   /smp              go to the SMP spawn
// Staff (op):
//   /smp set          stand where players should arrive in the SMP world, facing the way they should look
//   /smp info         shows the saved spot

(function () {
  const SMP_WORLD = 'multiworld:wild'
  const STORE = 'ot_smp_spawn'
  const P = '§a§lSMP §8» §7'

  const dimOf = (e) => {
    var k = e.level.dimension
    if (typeof k === 'function') k = e.level.dimension()
    return String(k && k.location ? k.location() : k)
  }
  const saved = (server) => { try { var s = String(server.persistentData.getString(STORE) || ''); return s ? JSON.parse(s) : null } catch (e) { return null } }

  const goSmp = (p) => {
    var server = p.server, s = saved(server), name = p.username
    if (s) {
      server.runCommandSilent(`execute in ${SMP_WORLD} run tp ${name} ${s.x} ${s.y} ${s.z} ${s.yaw} ${s.pitch}`)
    } else {
      // until /smp set has been used: the SMP world's own spawn point
      var level = null
      server.getAllLevels().forEach(l => { if (level == null && dimOf({ level: l }) == SMP_WORLD) level = l })
      if (level == null) { p.tell(P + '§cThe SMP world is not loaded. Tell a staff member.'); return 0 }
      var sp = level.getSharedSpawnPos()
      server.runCommandSilent(`execute in ${SMP_WORLD} run tp ${name} ${sp.x + 0.5} ${sp.y} ${sp.z + 0.5}`)
    }
    server.runCommandSilent(`playsound minecraft:entity.enderman.teleport player ${name} ~ ~ ~ 0.6 1.2`)
    p.tell(P + '§aWelcome to the §2§lSMP§a! §7Find a spot with §e/rtp§7. §cNo claims here: bases can be raided!')
    return 1
  }

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    const say = (ctx, m) => ctx.source.sendSystemMessage(Text.of(m))
    const f = (n) => Number(n).toFixed(2)
    event.register(Commands.literal('smp')
      .executes(ctx => goSmp(ctx.source.playerOrException))
      .then(Commands.literal('set').requires(src => src.hasPermission(2)).executes(ctx => {
        var p = ctx.source.playerOrException
        if (dimOf(p) != SMP_WORLD) { say(ctx, P + '§cStand in the SMP world first (§f/mw tp wild§c).'); return 0 }
        var s = { x: f(p.getX()), y: f(p.getY()), z: f(p.getZ()), yaw: f(p.yaw), pitch: f(p.pitch) }
        p.server.persistentData.putString(STORE, JSON.stringify(s))
        say(ctx, P + '§aSMP spawn saved: §f' + s.x + ' ' + s.y + ' ' + s.z)
        return 1
      }))
      .then(Commands.literal('info').requires(src => src.hasPermission(2)).executes(ctx => {
        var s = saved(ctx.source.server)
        say(ctx, P + (s ? '§f' + s.x + ' ' + s.y + ' ' + s.z + ' §7in §f' + SMP_WORLD : '§cNot set yet: players go to the world spawn. Use /smp set in the SMP world.'))
        return 1
      })))
  })
})()
