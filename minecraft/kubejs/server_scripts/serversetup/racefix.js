// ============================================================================
// Race persistence fix (Tensura / ManasCore + Epic Fight) - v5 (2026-10-14)
//
// THE BUG (checked in both mods' source code):
//   ManasCore saves a player's race/skills/EP by wrapping the call to addAdditionalSaveData inside
//   Entity.saveWithoutId and writing a "ManasCoreStorage" tag. Epic Fight wraps the SAME call
//   (MixinEntity.epicfight$saveWithoutId) but calls addAdditionalSaveData() itself instead of the
//   wrapped operation, so ManasCore's wrapper is skipped and "ManasCoreStorage" never reaches the
//   player file. Still the case in Epic Fight's newest 1.21.1 code. Loading is not affected.
//
// OLD FIX (v1-v3): kept a copy in KubeJS persistent data and loaded it back AFTER the player file
//   was read. Loading the race that late (after Tensura set the player up) left players unable to
//   take ANY damage.
//
// THIS FIX: right after Minecraft writes a player's file (PlayerEvent.SaveToFile: autosave, logout,
//   server stop), the "ManasCoreStorage" tag is added to that file. On the next load ManasCore reads
//   it itself, at the normal moment, exactly as if Epic Fight's bug did not exist.
//
// LOAD: ManasCore does not read the tag back on this server either, so it is loaded here once when the
//   player file is read (v5). Nothing is copied while players are online.
// ============================================================================

const RF_OLD_KEY = 'ss_manascore_storage'
const RfNbtIo = Java.loadClass('net.minecraft.nbt.NbtIo')
const RfNbtAccounter = Java.loadClass('net.minecraft.nbt.NbtAccounter')
const RfLevelResource = Java.loadClass('net.minecraft.world.level.storage.LevelResource')
const RfRaceAPI = Java.loadClass('io.github.manasmods.manascore.race.api.RaceAPI')
const RfStorageManager = Java.loadClass('io.github.manasmods.manascore.storage.impl.StorageManager')

function rfRaceId(player) {
  try {
    let race = RfRaceAPI.getRaceFrom(player).getRace()
    return race.isPresent() ? String(race.get().getRaceId()) : null
  } catch (e) {
    return null
  }
}

// after the player file is written: add ManasCore's storage to it
NativeEvents.onEvent(Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerEvent$SaveToFile'), event => {
  let player = event.getEntity()
  try {
    // the player's file in <world>/playerdata/ (the event's own directory can't be trusted: on this
    // server it pointed at the server folder)
    let file = player.getServer().getWorldPath(RfLevelResource.PLAYER_DATA_DIR).resolve(String(player.getStringUuid()) + '.dat')
    if (!file.toFile().exists()) return
    let tag = RfNbtIo.readCompressed(file, RfNbtAccounter.unlimitedHeap())
    tag.put('ManasCoreStorage', player.manasCore$getCombinedStorage().toNBT())
    RfNbtIo.writeCompressed(tag, file)
  } catch (e) {
    console.error('[racefix] could not save race data of ' + player.getGameProfile().getName() + ': ' + e)
  }
})

// Load side. ManasCore should read "ManasCoreStorage" itself, but on this server it doesn't (Epic Fight
// wraps the load call too). So when the player file is read and the player has no race, the saved tag
// is loaded here - once, at file-read time, with nothing copied while they play (that is what blocked
// damage in v1). Also takes over the old KubeJS copy from v1-v3 once and deletes it.
const rfLoaded = {}
NativeEvents.onEvent(Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerEvent$LoadFromFile'), event => {
  let player = event.getEntity(), name = String(player.getGameProfile().getName())
  try {
    let data = player.persistentData
    let old = data != null && data.contains(RF_OLD_KEY) ? data.getCompound(RF_OLD_KEY) : null
    if (old != null) data.remove(RF_OLD_KEY)
    if (rfRaceId(player) != null) { console.info('[racefix] ' + name + ': race loaded normally (' + rfRaceId(player) + ')'); return }
    let saved = null
    let file = player.getServer().getWorldPath(RfLevelResource.PLAYER_DATA_DIR).resolve(String(player.getStringUuid()) + '.dat')
    if (file.toFile().exists()) {
      let tag = RfNbtIo.readCompressed(file, RfNbtAccounter.unlimitedHeap())
      if (tag.contains('ManasCoreStorage')) saved = tag.getCompound('ManasCoreStorage')
    }
    let src = saved != null ? 'player file' : old != null ? 'old KubeJS copy' : null
    if (src == null) { console.info('[racefix] ' + name + ': no saved race data (new player or never saved)'); return }
    player.manasCore$getCombinedStorage().load(saved != null ? saved : old)
    rfLoaded[name] = true
    console.info('[racefix] ' + name + ': race loaded from ' + src + ' (' + rfRaceId(player) + ')')
  } catch (e) {
    console.error('[racefix] could not load race data of ' + name + ': ' + e)
  }
})

PlayerEvents.loggedIn(event => {
  let player = event.player, name = String(player.getGameProfile().getName())
  if (!rfLoaded[name]) return
  delete rfLoaded[name]
  try { RfStorageManager.syncTracking(player, true) } catch (e) { console.warn('[racefix] sync failed for ' + name + ': ' + e) }
})
