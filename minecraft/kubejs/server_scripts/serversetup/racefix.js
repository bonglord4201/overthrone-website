// ============================================================================
// Race persistence fix (Tensura / ManasCore + Epic Fight) - v3 (2026-10-14)
//
// Epic Fight 21.17.3.1 skips ManasCore's save wrapper, so a player's race/skills/EP are never
// written to the player file and reset on restart (Tanvir, 2026-10-10). This keeps a copy in the
// player's KubeJS persistent data and loads it back when the player file is read.
//
// v1/v2 copied the storage every few seconds while the player was online. With that running,
// players could not take ANY damage (2026-10-14). v3 only copies it when the player logs out and
// when the server stops, never while they play.
// Players without a race keep no copy, so new players get Tensura's normal race selection screen.
// ============================================================================

const RF_KEY = 'ss_manascore_storage'
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

function rfBackup(player) {
  try {
    if (rfRaceId(player) == null) { player.persistentData.remove(RF_KEY); return }
    player.persistentData.put(RF_KEY, player.manasCore$getCombinedStorage().toNBT())
  } catch (e) {
    console.warn('[racefix] could not copy race data of ' + player.getGameProfile().getName() + ': ' + e)
  }
}

NativeEvents.onEvent(RfLoadFromFile, event => {
  let player = event.getEntity()
  try {
    let data = player.persistentData
    if (data == null || !data.contains(RF_KEY) || rfRaceId(player) != null) return
    player.manasCore$getCombinedStorage().load(data.getCompound(RF_KEY))
    rfRestored[String(player.getGameProfile().getName())] = true
    console.info('[racefix] restored race data of ' + player.getGameProfile().getName() + ' (race: ' + rfRaceId(player) + ')')
  } catch (e) {
    console.error('[racefix] could not restore race data of ' + player.getGameProfile().getName() + ': ' + e)
  }
})

PlayerEvents.loggedIn(event => {
  let player = event.player, name = String(player.getGameProfile().getName())
  if (!rfRestored[name]) return
  delete rfRestored[name]
  try { RfStorageManager.syncTracking(player, true) } catch (e) { console.warn('[racefix] sync failed for ' + name + ': ' + e) }
})

PlayerEvents.loggedOut(event => rfBackup(event.player))

// server stop / restart: players still online are saved too
NativeEvents.onEvent(Java.loadClass('net.neoforged.neoforge.event.server.ServerStoppingEvent'), event => {
  try { event.getServer().getPlayerList().getPlayers().forEach(p => rfBackup(p)) } catch (e) { console.warn('[racefix] ' + e) }
})
