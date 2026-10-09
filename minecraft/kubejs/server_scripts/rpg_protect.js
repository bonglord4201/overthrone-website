// OVERTHRONE - protects the RPG world: normal players can't break or place blocks, pour buckets,
// light fires, or blow anything up. OPs can build, and so can anyone given the tag:
//   /tag <name> add rpg_builder      (remove with: /tag <name> remove rpg_builder)
// Upload to kubejs/server_scripts/ and run /reload.

const RPG_WORLD_ID = 'multiworld:rpg'
const BLOCKED_ITEMS = ['bucket', 'flint_and_steel', 'fire_charge', 'bone_meal', 'end_crystal', 'armor_stand', 'item_frame', 'painting']

function inRpgWorld(level) {
  return level && String(level.dimension).indexOf(RPG_WORLD_ID) >= 0
}

function canBuild(player) {
  if (!player) return false
  return player.op || player.tags.contains('rpg_builder')
}

function deny(event, player) {
  if (player) player.setStatusMessage('§cYou can\'t change the RPG world.')
  event.cancel()
}

BlockEvents.broken(event => {
  if (inRpgWorld(event.level) && !canBuild(event.player)) deny(event, event.player)
})

BlockEvents.placed(event => {
  const player = event.player
  if (inRpgWorld(event.level) && player && !canBuild(player)) deny(event, player)
})

BlockEvents.rightClicked(event => {
  const player = event.player
  if (!inRpgWorld(event.level) || canBuild(player)) return
  const held = String(event.item.id)
  if (held !== 'minecraft:milk_bucket' && BLOCKED_ITEMS.some(name => held.indexOf(name) >= 0)) deny(event, player)
})

ItemEvents.rightClicked(event => {
  const player = event.player
  if (!inRpgWorld(event.level) || canBuild(player)) return
  const held = String(event.item.id)
  if (held.indexOf('bucket') >= 0 && held !== 'minecraft:milk_bucket') deny(event, player)   // drinking milk is fine
})

LevelEvents.afterExplosion(event => {
  if (inRpgWorld(event.level)) event.removeAllAffectedBlocks()
})
