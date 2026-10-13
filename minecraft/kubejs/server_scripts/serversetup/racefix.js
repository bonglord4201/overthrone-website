// ============================================================================
// Race persistence fix (Tensura / ManasCore + Epic Fight) - v2 (2026-10-14)
//
// Tensura keeps a player's race, skills and EP in ManasCore "entity storage". Epic Fight 21.17.3.1
// skips ManasCore's save wrapper, so the race is never written to the player file and resets on
// relog/restart (Tanvir, 2026-10-10). Fix: ManasCore's storage NBT is copied into the player's
// KubeJS persistent data and loaded back with ManasCore's own CombinedStorage.load when the file
// is read.
//
// v2 changes (v1 left players unable to take damage and hid the race selection screen):
//  - a copy is only kept while the player HAS a race. Players without a race (new players, or
//    after a Race Reset Scroll) have no copy, so nothing is restored and Tensura shows its normal
//    race selection screen.
//  - the race's attribute modifiers are no longer re-applied on every login.
//  - the client sync only runs when a copy was actually restored.
// If a mod update fixes the save, the race is loaded natively and the copy is not used.
// ============================================================================

const RF_KEY = 'ss_manascore_storage'
const RF_BACKUP_TICKS = 100
const RfStorageManager = Java.loadClass('io.github.manasmods.manascore.storage.impl.StorageManager')
const RfRaceAPI = Java.loadClass('io.github.manasmods.manascore.race.api.RaceAPI')
const RfLoadFromFile = Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerEvent$LoadFromFile')
const rfRestored = {}

function rfRaceId(player) {
  try {
    let race = RfRaceAPI.getRaceFrom(player).getRace()
    return race.isPresent() ? String(race.get().getRaceId()) : null
  } catch (e) {
    return null
  }
}

// keep a copy only while the player has a race; no race = no copy (normal selection screen)
function rfBackup(player) {
  try {
    if (rfRaceId(player) == null) {
      player.persistentData.remove(RF_KEY)
      return
    }
    player.persistentData.put(RF_KEY, player.manasCore$getCombinedStorage().toNBT())
  } catch (e) {
    console.warn('[racefix] could not copy race data of ' + player.getGameProfile().getName() + ': ' + e)
  }
}

function rfRestore(player) {
  let data = player.persistentData
  if (data == null || !data.contains(RF_KEY)) return false
  if (rfRaceId(player) != null) return false   // native load worked
  player.manasCore$getCombinedStorage().load(data.getCompound(RF_KEY))
  return true
}

NativeEvents.onEvent(RfLoadFromFile, event => {
  let player = event.getEntity()
  try {
    if (rfRestore(player)) {
      rfRestored[String(player.getGameProfile().getName())] = true
      console.info('[racefix] restored race data of ' + player.getGameProfile().getName() + ' (race: ' + rfRaceId(player) + ')')
    }
  } catch (e) {
    console.error('[racefix] could not restore race data of ' + player.getGameProfile().getName() + ': ' + e)
  }
})

PlayerEvents.loggedIn(event => {
  let player = event.player, name = String(player.getGameProfile().getName())
  if (rfRestored[name]) {
    delete rfRestored[name]
    try { RfStorageManager.syncTracking(player, true) } catch (e) { console.warn('[racefix] sync failed for ' + name + ': ' + e) }
  }
})

PlayerEvents.loggedOut(event => rfBackup(event.player))

ServerEvents.tick(event => {
  let server = event.server
  if (server.getTickCount() % RF_BACKUP_TICKS != 0) return
  server.getPlayerList().getPlayers().forEach(p => rfBackup(p))
})
