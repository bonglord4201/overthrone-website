// OVERTHRONE - one-time helper. Upload, run /reload, then type /dumpitems in game.
// Writes every modded item ID to kubejs/exported/item_ids.json (and logs/kubejs/server.log). Delete this script afterwards.

function overthroneItemIds() {
  try {
    return Item.getTypeList().toArray().map(id => String(id))
  } catch (e) {
    const BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
    return BuiltInRegistries.ITEM.keySet().toArray().map(key => String(key))
  }
}

function overthroneDump() {
  const byMod = {}
  let total = 0
  overthroneItemIds().forEach(id => {
    const mod = id.split(':')[0]
    if (mod === 'minecraft') return
    if (!byMod[mod]) byMod[mod] = []
    byMod[mod].push(id)
    total++
  })
  Object.keys(byMod).forEach(mod => byMod[mod].sort())
  JsonIO.write('kubejs/exported/item_ids.json', byMod)
  console.info('[OVERTHRONE] item_ids: ' + total + ' modded items from ' + Object.keys(byMod).length + ' mods')
  Object.keys(byMod).sort().forEach(mod => console.info('[OVERTHRONE] ' + mod + ': ' + byMod[mod].join(' ')))
  return total
}

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event
  event.register(Commands.literal('dumpitems')
    .requires(src => src.hasPermission(2))
    .executes(ctx => {
      try {
        const total = overthroneDump()
        ctx.source.sendSystemMessage(Text.green('Saved ' + total + ' modded item IDs to kubejs/exported/item_ids.json'))
      } catch (e) {
        ctx.source.sendSystemMessage(Text.red('dumpitems failed: ' + e))
        console.error('[OVERTHRONE] dumpitems failed: ' + e)
      }
      return 1
    }))
})
