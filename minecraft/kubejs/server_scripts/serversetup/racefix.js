// ============================================================================
// Race persistence fix (Tensura / ManasCore + Epic Fight) - v4 (2026-10-14)
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
// One-time move: players who still have the old KubeJS copy and no race get it loaded once (old way),
//   the copy is then deleted. From their next login on, only the normal ManasCore load is used.
// ============================================================================

const RF_OLD_KEY = 'ss_manascore_storage'
const RfNbtIo = Java.loadClass('net.minecraft.nbt.NbtIo')
const RfNbtAccounter = Java.loadClass('net.minecraft.nbt.NbtAccounter')
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
    let file = event.getPlayerFile('dat').toPath()
    let tag = RfNbtIo.readCompressed(file, RfNbtAccounter.unlimitedHeap())
    tag.put('ManasCoreStorage', player.manasCore$getCombinedStorage().toNBT())
    RfNbtIo.writeCompressed(tag, file)
  } catch (e) {
    console.error('[racefix] could not save race data of ' + player.getGameProfile().getName() + ': ' + e)
  }
})

// one-time move from the old KubeJS copy (v1-v3)
const rfMoved = {}
NativeEvents.onEvent(Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerEvent$LoadFromFile'), event => {
  let player = event.getEntity()
  try {
    let data = player.persistentData
    if (data == null || !data.contains(RF_OLD_KEY)) return
    if (rfRaceId(player) == null) {
      player.manasCore$getCombinedStorage().load(data.getCompound(RF_OLD_KEY))
      rfMoved[String(player.getGameProfile().getName())] = true
      console.info('[racefix] moved old race copy of ' + player.getGameProfile().getName() + ' (race: ' + rfRaceId(player) + ')')
    }
    data.remove(RF_OLD_KEY)
  } catch (e) {
    console.error('[racefix] could not move old race copy of ' + player.getGameProfile().getName() + ': ' + e)
  }
})

PlayerEvents.loggedIn(event => {
  let player = event.player, name = String(player.getGameProfile().getName())
  if (!rfMoved[name]) return
  delete rfMoved[name]
  try { RfStorageManager.syncTracking(player, true) } catch (e) { }
  player.tell('§e[Race] Your race was restored. If you can\'t take damage, relog once.')
})
