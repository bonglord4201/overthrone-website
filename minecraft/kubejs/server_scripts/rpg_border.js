// OVERTHRONE - world border for the RPG world only (vanilla /worldborder only changes the overworld).
// Edit the 3 numbers below, upload to kubejs/server_scripts/, then /reload and type /rpgborder.
// It is applied again automatically every time the server starts.

const RPG_BORDER = {
  world: 'multiworld:rpg',
  centerX: 27,     // middle of the RPG map (X)
  centerZ: -24,    // middle of the RPG map (Z)
  size: 600        // width of the square in blocks (600 = 300 each way from the centre)
}

function applyRpgBorder(server) {
  let done = false
  server.getAllLevels().forEach(level => {
    var key = level.dimension
    if (typeof key === 'function') key = level.dimension()
    if (String(key && key.location ? key.location() : key).indexOf(RPG_BORDER.world) < 0) return
    const border = level.getWorldBorder()
    border.setCenter(RPG_BORDER.centerX, RPG_BORDER.centerZ)
    border.setSize(RPG_BORDER.size)
    border.setDamagePerBlock(0)
    border.setWarningBlocks(0)
    done = true
  })
  return done
}

ServerEvents.loaded(event => {
  try { applyRpgBorder(event.server) } catch (e) { console.error('rpg_border: ' + e) }
})

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event
  event.register(Commands.literal('rpgborder')
    .requires(src => src.hasPermission(2))
    .executes(ctx => {
      var msg
      try {
        msg = applyRpgBorder(ctx.source.server)
          ? '§aRPG border set: ' + RPG_BORDER.size + ' blocks wide, centred on ' + RPG_BORDER.centerX + ', ' + RPG_BORDER.centerZ
          : '§cCould not find the world ' + RPG_BORDER.world
      } catch (e) { msg = '§crpgborder error: §f' + e }
      ctx.source.sendSystemMessage(Text.of(msg))
      return 1
    }))
})
