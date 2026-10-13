# OVERTHRONE Race Fix (ot_racefix)

Server + client safe, needs only NeoForge 1.21.1 (it is a no-op without ManasCore).

**Bug:** ManasCore (Tensura's library) saves/loads a player's race, skills and EP by wrapping the
`addAdditionalSaveData` / `readAdditionalSaveData` calls inside `Entity.saveWithoutId` / `Entity.load`
and writing a `ManasCoreStorage` tag. Epic Fight (`MixinEntity.epicfight$saveWithoutId` / `epicfight$load`)
wraps the same calls but invokes them directly instead of `operation.call(...)`, so ManasCore's wrappers
never run and races reset on every restart.

**Fix:** one mixin on `Entity`:
- end of `saveWithoutId`: if the tag has no `ManasCoreStorage`, write `CombinedStorage.toNBT()` (same as ManasCore)
- end of `load`: if the tag has `ManasCoreStorage`, `CombinedStorage.load(...)` + `clearDirty()` (same as ManasCore)

Replaces `kubejs/server_scripts/serversetup/racefix.js` (delete that script).

Build: compiled with `javac --release 21` against small stub classes (Minecraft/ManasCore/NeoForge are
not on the classpath; names are Mojang-mapped at runtime) and the Mixin jar.
