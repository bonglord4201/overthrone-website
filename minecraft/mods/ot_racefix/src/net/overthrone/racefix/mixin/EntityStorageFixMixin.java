package net.overthrone.racefix.mixin;

import io.github.manasmods.manascore.storage.api.StorageHolder;
import io.github.manasmods.manascore.storage.impl.CombinedStorage;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.world.entity.Entity;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(Entity.class)
public abstract class EntityStorageFixMixin {
    private static final String KEY = "ManasCoreStorage";

    // same as ManasCore's MixinEntity.saveStorage, but at the end of saveWithoutId so Epic Fight can't skip it
    @Inject(method = "saveWithoutId(Lnet/minecraft/nbt/CompoundTag;)Lnet/minecraft/nbt/CompoundTag;", at = @At("RETURN"))
    private void otRaceFix$save(CompoundTag tag, CallbackInfoReturnable<CompoundTag> cir) {
        try {
            if (tag == null || tag.contains(KEY)) return; // ManasCore already wrote it
            Object self = this;
            if (!(self instanceof StorageHolder holder)) return;
            CombinedStorage storage = holder.manasCore$getCombinedStorage();
            if (storage != null) tag.put(KEY, storage.toNBT());
        } catch (Throwable e) { otRaceFix$warn("save", e); }
    }

    // same as ManasCore's MixinEntity.loadStorage, at the end of load
    @Inject(method = "load(Lnet/minecraft/nbt/CompoundTag;)V", at = @At("TAIL"))
    private void otRaceFix$load(CompoundTag tag, CallbackInfo ci) {
        try {
            if (tag == null || !tag.contains(KEY)) return;
            Object self = this;
            if (!(self instanceof StorageHolder holder)) return;
            CombinedStorage storage = holder.manasCore$getCombinedStorage();
            if (storage == null) return;
            storage.load(tag.getCompound(KEY));
            storage.clearDirty();
        } catch (Throwable e) { otRaceFix$warn("load", e); }
    }

    private static boolean otRaceFix$warned = false;
    private static void otRaceFix$warn(String what, Throwable e) {
        if (otRaceFix$warned) return;
        otRaceFix$warned = true;
        System.err.println("[ot_racefix] " + what + " failed: " + e);
    }
}
