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
