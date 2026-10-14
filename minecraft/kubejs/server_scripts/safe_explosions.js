// OVERTHRONE - no explosions or skill griefing in the safe worlds.
// 1. Any explosion (Tensura skills, creepers, TNT, modded bombs...) that starts in the hub or the RPG World is cancelled.
// 2. Tensura skills that break/absorb/change blocks (Predator absorb, Earth Manipulation...) are stopped in those worlds.
//    This uses Tensura's own "skill grief" check, the same one its claim add-ons use, so it only blocks the block damage:
//    the skill itself still works (combat, buffs, absorbing mobs...) and every other world is untouched.
// Same safe worlds as damage_zones.js. If Tensura ever renames the check, part 2 switches itself off and logs why.
//
// Staff (op):  /safeexplosions   shows whether explosions and skill griefing are blocked where you stand

(function () {
  const SAFE_WORLDS = ['multiworld:hub', 'multiworld:rpg']

  const dimOf = (level) => {
    var k = level.dimension
    if (typeof k === 'function') k = level.dimension()
    return String(k && k.location ? k.location() : k)
  }
  const isSafe = (level) => { try { return !!level && SAFE_WORLDS.indexOf(dimOf(level)) >= 0 } catch (e) { return false } }

  LevelEvents.beforeExplosion(event => {
    try {
      if (isSafe(event.level)) event.cancel()
    } catch (e) { }
  })

  // ---- Tensura skill griefing ----
  // Hooked once when the server starts (ServerEvents.loaded doesn't run again on /reload, so it never doubles up).
  var hookStatus = '§7unknown after /reload §8(restart to check)'
  const hookSkillGrief = () => {
    var status
    try {
      var otTsEvents = Java.loadClass('io.github.manasmods.tensura.event.TensuraSkillEvents')
      var otEvResult = Java.loadClass('dev.architectury.event.EventResult')
      var otGriefEv = otTsEvents.SKILL_GRIEF_PRE
      var otIfaces = otGriefEv.invoker().getClass().getInterfaces()
      if (otIfaces.length !== 1) throw 'unexpected listener type'
      var OtGriefListener = Java.loadClass(otIfaces[0].getName())
      var otWarned = {}
      otGriefEv.register(new OtGriefListener(function (instance, level, owner, x, y, z) {
        try {
          var lvl = level || (owner ? owner.level() : null)
          var d = lvl ? dimOf(lvl) : ''
          if (SAFE_WORLDS.indexOf(d) < 0) return otEvResult.pass()
          try {
            if (owner && owner.isPlayer && owner.isPlayer()) {
              var now = Date.now(), u = String(owner.getUUID())
              if (!otWarned[u] || now - otWarned[u] > 3000) {
                otWarned[u] = now
                owner.tell('§6§lSAFE ZONE §8» §7Skills can\'t break blocks in this world.')
              }
            }
          } catch (e) { }
          return otEvResult.interruptFalse()
        } catch (e) {
          return otEvResult.pass()
        }
      }))
      status = '§aACTIVE'
      console.info('[safe_explosions] Tensura skill grief protection active for ' + SAFE_WORLDS.join(', '))
    } catch (e) {
      status = '§cNOT ACTIVE §8(' + e + ')'
      console.warn('[safe_explosions] Tensura skill grief protection could not start: ' + e)
    }
    hookStatus = status
  }

  ServerEvents.loaded(event => { hookSkillGrief() })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('safeexplosions').requires(src => src.hasPermission(2)).executes(ctx => {
      var p = ctx.source.playerOrException, d = dimOf(p.level), safe = SAFE_WORLDS.indexOf(d) >= 0
      p.tell('§6§lEXPLOSIONS §8» §7World: §f' + d + ' §7- ' + (safe ? '§aBLOCKED (safe world)' : '§cALLOWED'))
      p.tell('§6§lSKILL GRIEF §8» §7Protection: ' + hookStatus + ' §7- here: ' + (safe ? '§aBLOCKED' : '§cALLOWED'))
      return 1
    }))
  })
})()
