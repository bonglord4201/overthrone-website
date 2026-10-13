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

function applyWildBorder(server) {
  let done = false
  server.getAllLevels().forEach(level => {
    if (String(level.dimension().location()) !== WILD_BORDER.world) return
    const border = level.getWorldBorder()
    border.setCenter(WILD_BORDER.centerX, WILD_BORDER.centerZ)
    border.setSize(WILD_BORDER.size)
    done = true
  })
  return done
}

ServerEvents.loaded(event => {
  applyWildBorder(event.server)
})

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event
  event.register(Commands.literal('wildborder')
    .requires(src => src.hasPermission(2))
    .executes(ctx => {
      const ok = applyWildBorder(ctx.source.server)
      ctx.source.sendSystemMessage(ok
        ? Text.green('Wild border set: ' + WILD_BORDER.size + ' blocks wide, centred on ' + WILD_BORDER.centerX + ', ' + WILD_BORDER.centerZ)
        : Text.red('Could not find the world ' + WILD_BORDER.world))
      return 1
    }))
})
