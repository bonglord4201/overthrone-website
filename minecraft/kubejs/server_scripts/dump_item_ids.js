// OVERTHRONE - one-time helper: writes every modded item ID on the server to kubejs/exported/item_ids.json
// (and to logs/kubejs/server.log). Upload it, run /reload, send the file to Claude, then delete this script.

ServerEvents.loaded(event => {
  const BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
  const byMod = {}
  let total = 0
  BuiltInRegistries.ITEM.keySet().forEach(key => {
    const id = String(key)
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
})
