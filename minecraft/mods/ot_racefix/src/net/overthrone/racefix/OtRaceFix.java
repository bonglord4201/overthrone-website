package net.overthrone.racefix;

import net.neoforged.fml.common.Mod;

/**
 * OVERTHRONE race fix. Epic Fight wraps the addAdditionalSaveData / readAdditionalSaveData calls in
 * Entity.saveWithoutId / Entity.load and calls them directly instead of the wrapped operation, so
 * ManasCore's own wrapper (which writes/reads the "ManasCoreStorage" tag: Tensura races, skills, EP)
 * is skipped. This mod writes and reads that tag itself, exactly the way ManasCore does.
 */
@Mod(OtRaceFix.MOD_ID)
public class OtRaceFix {
    public static final String MOD_ID = "ot_racefix";
}
