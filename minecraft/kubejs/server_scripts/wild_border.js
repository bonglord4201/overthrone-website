// OVERTHRONE - world border for the Wild world (multiworld:wild), where /wild sends players.
// Vanilla /worldborder only changes the overworld, so this sets it on the Wild world directly.
// Keep SIZE equal to the area pre-generated with Chunky (radius 10000 = size 20000), so /wild and
// exploring never have to generate new chunks. Applied on every server start; /wildborder applies it now.

const WILD_BORDER = {
  world: 'multiworld:wild',
  centerX: 0,
  centerZ: 0,
  size: 20000      // width of the square in blocks (20000 = 10000 each way from the centre)
}

function wildBorderApply(server) {
  var found = null
  var it = server.getAllLevels().iterator()
  while (it.hasNext()) {
    var level = it.next()
    var key = level.dimension
    if (typeof key === 'function') key = level.dimension()
    var id = String(key && key.location ? key.location() : key)
    if (id.indexOf(WILD_BORDER.world) >= 0) found = level
  }
  if (!found) return 'missing'
  var border = found.getWorldBorder()
  border.setCenter(WILD_BORDER.centerX * 1.0, WILD_BORDER.centerZ * 1.0)
  border.setSize(WILD_BORDER.size * 1.0)
  return 'ok'
}

// Minecraft only sends the overworld's border to players, so send this world's border ourselves
// whenever someone enters the Wild world (and to everyone there after /wildborder).
function wildBorderSync(player, level) {
  try {
    const Packet = Java.loadClass('net.minecraft.network.protocol.game.ClientboundInitializeBorderPacket')
    player.connection.send(new Packet(level.getWorldBorder()))
    return true
  } catch (e) { console.error('wild_border sync: ' + e); return false }
}
function wildDimOf(e) {
  var key = e.level.dimension
  if (typeof key === 'function') key = e.level.dimension()
  return String(key && key.location ? key.location() : key)
}
const wildLastDim = {}
PlayerEvents.tick(event => {
  var p = event.player
  if (p.age % 20 != 0) return
  var d = wildDimOf(p), name = p.username
  if (wildLastDim[name] !== d) {
    wildLastDim[name] = d
    if (d.indexOf(WILD_BORDER.world) >= 0) {
      // Multiworld can load this world after server start (and borders on extra worlds aren't saved),
      // so make sure the border is set before sending it
      try { wildBorderApply(p.server) } catch (e) { console.error('wild_border apply: ' + e) }
      wildBorderSync(p, p.level)
    }
  }
})

ServerEvents.loaded(event => {
  try { wildBorderApply(event.server) } catch (e) { console.error('wild_border: ' + e) }
})

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event
  event.register(Commands.literal('wildborder')
    .requires(src => src.hasPermission(2))
    .executes(ctx => {
      var msg
      try {
        var r = wildBorderApply(ctx.source.server)
        if (r == 'ok') ctx.source.server.players.forEach(pl => { if (wildDimOf(pl).indexOf(WILD_BORDER.world) >= 0) wildBorderSync(pl, pl.level) })
        msg = r == 'ok'
          ? '§aWild border set: ' + WILD_BORDER.size + ' blocks wide, centred on ' + WILD_BORDER.centerX + ', ' + WILD_BORDER.centerZ
          : '§cCould not find the world ' + WILD_BORDER.world + ' (is it loaded?)'
      } catch (e) {
        msg = '§cwildborder error: §f' + e
      }
      ctx.source.sendSystemMessage(Text.of(msg))
      return 1
    }))
})
