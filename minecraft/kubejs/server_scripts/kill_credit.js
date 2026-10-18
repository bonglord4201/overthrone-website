// OVERTHRONE - who gets the credit for a kill (shared helper, used by caverns.js, leveling.js, professions.js,
// overthrone_quests.js, cosmetics_fx.js and mob_spawns.js).
// Why: those scripts used event.source.getPlayer(). When the killing hit is a Tensura skill/magic (e.g. "tensura.paralyzing"),
// Tensura's damage types don't expose the attacker to KubeJS, so getPlayer() fails and the player got NO cash and NO level XP,
// while the mob still dropped normal XP orbs (Minecraft itself still knew who hit it).
// Now, in order: the damage source's player -> the source's attacker / projectile owner -> the player Minecraft gives the
// kill credit to (getKillCredit: the player who hurt it in the last few seconds, the same rule as XP orbs) -> the mob's last
// attacker. A pet/summon owned by a player gives the credit to its owner.
// Read-only: it never changes the death, the drops or the damage.
//
// Staff (op):  /killcredit   the last 8 mob kills: who got the credit and how it was found ("none" = nobody got rewards)

var otKillLog = []
var otKillerOf = (event) => {
  const asPlayer = (a) => {
    try { if (a != null && a.isPlayer()) return a } catch (x) { }
    try { if (a != null && typeof a.getOwner === 'function') { var o = a.getOwner(); if (o != null && o.isPlayer()) return o } } catch (x) { }
    return null
  }
  var src = null, e = null, p = null, how = 'none'
  try { src = event.source } catch (x) { }
  try { e = event.entity } catch (x) { }
  if (src != null) {
    try { p = src.getPlayer(); if (p != null) how = 'damage source' } catch (x) { }
    if (p == null) { try { p = asPlayer(src.getEntity()); if (p != null) how = 'attacker' } catch (x) { } }
    if (p == null) { try { p = asPlayer(src.getActual()); if (p != null) how = 'attacker' } catch (x) { } }
    if (p == null) { try { p = asPlayer(src.actual); if (p != null) how = 'attacker' } catch (x) { } }
    if (p == null) { try { p = asPlayer(src.getDirectEntity()); if (p != null) how = 'projectile' } catch (x) { } }
    if (p == null) { try { p = asPlayer(src.getImmediate()); if (p != null) how = 'projectile' } catch (x) { } }
  }
  if (p == null && e != null) { try { p = asPlayer(e.getKillCredit()); if (p != null) how = 'kill credit (skill)' } catch (x) { } }
  if (p == null && e != null) { try { p = asPlayer(e.getLastHurtByMob()); if (p != null) how = 'last attacker' } catch (x) { } }
  try { if (p != null && e != null && p === e) { p = null; how = 'none' } } catch (x) { }   // a player's own death is never "their kill"
  // remember mob kills for /killcredit (each death is checked by several scripts: log it once)
  try {
    if (e != null && !e.isPlayer()) {
      var u = String(e.getStringUuid())
      if (!otKillLog.length || otKillLog[0].u != u) {
        var dt = '?'; try { dt = String(src.getType().msgId()) } catch (x) { try { dt = String(src.getMsgId()) } catch (y) { } }
        otKillLog.unshift({ u: u, mob: String(e.getEncodeId()), by: p ? String(p.username) : '-', how: how, dmg: dt })
        if (otKillLog.length > 8) otKillLog.pop()
      }
    }
  } catch (x) { }
  return p
}

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event
  event.register(Commands.literal('killcredit').requires(src => src.hasPermission(2)).executes(ctx => {
    ctx.source.sendSystemMessage(Text.of('§6[killcredit] §7Last mob kills (newest first):'))
    if (!otKillLog.length) ctx.source.sendSystemMessage(Text.of('§7  none since the last restart/reload'))
    otKillLog.forEach(k => ctx.source.sendSystemMessage(Text.of('§7- §f' + k.mob + ' §7killed by §e' + k.by + ' §7via §b' + k.how + ' §8(' + k.dmg + ')')))
    return 1
  }))
})
