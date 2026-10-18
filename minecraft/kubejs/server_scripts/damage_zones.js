// OVERTHRONE - where players can get hurt.
// Safe worlds (no damage at all): the hub and the RPG World, EXCEPT inside the Caverns area (players can be hurt there). Everywhere else (Wild/Overworld, SMP,
// Survival, Resource, Nether, End, dungeons...) players take damage normally.
// Uses the player's own "invulnerable" flag, so it also clears a flag some other mod or script
// left switched on (that made players immune everywhere: "Target is invulnerable").
//
// Staff (op):
//   /damagezones          shows your world, whether it is safe and your current flag
//   /newbieshield <player> <minutes>   give/extend a player's new player protection (0 = end it)

(function () {
  const SAFE_WORLDS = ['multiworld:hub', 'multiworld:rpg']

  const dimOf = (e) => {
    var k = e.level.dimension
    if (typeof k === 'function') k = e.level.dimension()
    return String(k && k.location ? k.location() : k)
  }
  // the Caverns (the area set with /cavernadmin pos1/pos2, caverns.js) is a combat zone even inside the RPG World
  // false = the Caverns are safe like the rest of the RPG world (no player deaths there).
  // 2026-10-18: briefly switched off because deaths in the Caverns set off a crash bug in the Solo Leveling mod
  // (XPGainTShadowProcedure); back on, with slr_death_guard.js handling those deaths.
  const CAVERNS_COMBAT = true
  const inCaverns = (p) => {
    if (!CAVERNS_COMBAT) return false
    try {
      if (typeof otInCaverns != 'function') return false
      if (otCavernsArea == null && typeof otCavernsLoad == 'function') otCavernsLoad(p.server)   // after /reload the area isn't loaded yet
      return otInCaverns(p.level, p.x, p.y, p.z)
    } catch (e) { return false }
  }
  const isSafe = (p) => SAFE_WORLDS.indexOf(dimOf(p)) >= 0 && !inCaverns(p)

  // New player protection: no damage at all while picking a race, then for the first SHIELD_MINUTES of play
  // (only for players below SHIELD_MAX_LEVEL, so veterans never get it). A timer shows above the hotbar.
  const SHIELD_MINUTES = 15
  const SHIELD_MAX_LEVEL = 5
  const SHIELD_KEY = 'ot_newbie_secs'
  var RaceAPI = null
  try { RaceAPI = Java.loadClass('io.github.manasmods.manascore.race.api.RaceAPI') } catch (e) { }
  const hasRace = (p) => { if (RaceAPI == null) return true; try { return RaceAPI.getRaceFrom(p).getRace().isPresent() } catch (e) { return true } }
  const shieldLeft = (p) => {
    if ((p.persistentData.getInt('ot_level') || 1) >= SHIELD_MAX_LEVEL) return 0
    return Math.max(0, SHIELD_MINUTES * 60 - (p.persistentData.getInt(SHIELD_KEY) || 0))
  }
  const shielded = (p) => !hasRace(p) || shieldLeft(p) > 0

  const apply = (p) => {
    var want = isSafe(p) || shielded(p)
    if (p.isInvulnerable() != want) p.setInvulnerable(want)
  }

  // once a second for everyone online (also covers teleports, portals, /mw tp and logins)
  ServerEvents.tick(event => {
    if (event.server.tickCount % 20 != 0) return
    event.server.players.forEach(p => {
      try {
        if (hasRace(p) && !isSafe(p)) {
          var left = shieldLeft(p)
          if (left > 0) {
            p.persistentData.putInt(SHIELD_KEY, (p.persistentData.getInt(SHIELD_KEY) || 0) + 1)
            var m = Math.floor((left - 1) / 60), sec = (left - 1) % 60
            p.server.runCommandSilent(`title ${p.username} actionbar ${JSON.stringify({ text: '🛡 New player protection: ' + m + ':' + (sec < 10 ? '0' : '') + sec + ' left', color: 'aqua' })}`)
            if (left == 1) p.tell('§b🛡 Your new player protection has ended. §7Mobs can hurt you now: stay safe!')
          }
        }
        apply(p)
      } catch (e) { }
    })
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('damagezones').requires(src => src.hasPermission(2)).executes(ctx => {
      var p = ctx.source.playerOrException
      p.tell('§6§lDAMAGE §8» §7World: §f' + dimOf(p) + ' §7- ' + (isSafe(p) ? '§aSAFE (no damage)' : '§cDANGER (damage on)') +
        ' §7- invulnerable flag: §f' + p.isInvulnerable())
      return 1
    }))
    const { arguments: Arguments } = event
    event.register(Commands.literal('newbieshield').requires(src => src.hasPermission(2))
      .then(Commands.argument('player', Arguments.PLAYER.create(event)).then(Commands.argument('minutes', Arguments.INTEGER.create(event)).executes(ctx => {
        var t = Arguments.PLAYER.getResult(ctx, 'player'), m = Math.max(0, Arguments.INTEGER.getResult(ctx, 'minutes'))
        t.persistentData.putInt(SHIELD_KEY, Math.max(0, SHIELD_MINUTES - m) * 60)
        ctx.source.sendSystemMessage(Text.of('§b[damage] ' + t.username + ' has ' + m + ' min of new player protection' + (m > SHIELD_MINUTES ? ' (max ' + SHIELD_MINUTES + ')' : '') + '. §7Only works below level ' + SHIELD_MAX_LEVEL + '.'))
        return 1
      }))))
  })
})()
