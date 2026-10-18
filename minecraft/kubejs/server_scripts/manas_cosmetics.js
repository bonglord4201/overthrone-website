// priority: 10
// OVERTHRONE - our custom 3D cosmetics for the Manas Cosmetics mod (wings, halos, crowns, horns, auras).
// The cosmetic files themselves go in the server's config/manas_cosmetics/ folder (models/ + cosmetics/), from the
// repo folder minecraft/manas_cosmetics/ (made by scripts/build-manas-models.py and scripts/build-manas-auras.py).
// This file only lists them for the Throne Shop (npc_menus.js) and the Cosmetic Crate (crates.js).
// Unlocking uses the mod's own command: manas_cosmetics unlock <player> <id>. Players equip them in the mod's wardrobe:
// its keybind, /manas_cosmetics wardrobe, or /wardrobe.
//
// price = Throne Shards in the Throne Shop. crate: true = only from the Cosmetic Crate (not sold).
// Players need the Manas Cosmetics mod (in the modpack) to see them. weapons = weapon auras (slot weapon_aura).

var OT_MANAS = {
  wings: [
    { id: 'overthrone:demon_lord_wings', name: '&4&lDemon Lord Wings', icon: 'minecraft:crimson_fungus', price: 8000 },
    { id: 'overthrone:dragon_wings', name: '&b&lStorm Dragon Wings', icon: 'minecraft:prismarine_shard', price: 8000 },
    { id: 'overthrone:seraph_wings', name: '&f&lSeraph Wings', icon: 'minecraft:feather', price: 8000 },
    { id: 'overthrone:phoenix_wings', name: '&6&lPhoenix Wings', icon: 'minecraft:blaze_powder', price: 10000 },
    { id: 'overthrone:void_wings', name: '&5&lVoid Wings', icon: 'minecraft:ender_eye', crate: true },
    { id: 'overthrone:shadow_monarch_wings', name: '&5&lShadow Monarch Wings', icon: 'minecraft:phantom_membrane', crate: true },
  ],
  halos: [
    { id: 'overthrone:hero_halo', name: '&e&lHero Halo', icon: 'minecraft:gold_nugget', price: 4000 },
    { id: 'overthrone:fallen_halo', name: '&c&lFallen Halo', icon: 'minecraft:redstone', price: 4000 },
    { id: 'overthrone:void_halo', name: '&d&lVoid Halo', icon: 'minecraft:amethyst_shard', price: 4000 },
    { id: 'overthrone:demon_sigil', name: '&4&lDemon Sigil', icon: 'minecraft:enchanted_book', price: 6000 },
    { id: 'overthrone:soul_crystals', name: '&5&lSoul Crystals &7(orbit)', icon: 'minecraft:amethyst_cluster', crate: true },
  ],
  heads: [
    { id: 'overthrone:royal_crown', name: '&6&lRoyal Crown', icon: 'minecraft:golden_helmet', price: 5000 },
    { id: 'overthrone:ice_crown', name: '&b&lIce Crown', icon: 'minecraft:blue_ice', price: 6000 },
    { id: 'overthrone:demon_king_crown', name: '&8&lDemon King Crown', icon: 'minecraft:netherite_helmet', crate: true },
    { id: 'overthrone:demon_horns', name: '&4&lDemon Horns', icon: 'minecraft:goat_horn', price: 4000 },
    { id: 'overthrone:oni_horns', name: '&f&lOni Horns', icon: 'minecraft:bone', price: 4000 },
    { id: 'overthrone:ram_horns', name: '&6&lRam Horns', icon: 'minecraft:brown_dye', price: 4000 },
  ],
  auras: [
    { id: 'overthrone:true_hero', name: '&e&lTrue Hero Aura', icon: 'minecraft:sunflower', price: 6000 },
    { id: 'overthrone:storm_dragon', name: '&b&lStorm Dragon Aura', icon: 'minecraft:lightning_rod', price: 6000 },
    { id: 'overthrone:black_flame', name: '&5&lBlack Flame Aura', icon: 'minecraft:soul_campfire', price: 6000 },
    { id: 'overthrone:inferno', name: '&6&lInferno Aura', icon: 'minecraft:blaze_powder', price: 6000 },
    { id: 'overthrone:scorched_earth', name: '&c&lScorched Earth Aura', icon: 'minecraft:magma_block', price: 5000 },
    { id: 'overthrone:arcane_sage', name: '&9&lArcane Sage Aura', icon: 'minecraft:enchanted_book', price: 6000 },
    { id: 'overthrone:sakura_spirit', name: '&d&lSakura Spirit Aura', icon: 'minecraft:cherry_sapling', price: 5000 },
    { id: 'overthrone:frost_queen', name: '&b&lFrost Queen Aura', icon: 'minecraft:blue_ice', price: 6000 },
    { id: 'overthrone:great_sage', name: '&3&lGreat Sage Aura', icon: 'minecraft:heart_of_the_sea', price: 6000 },
    { id: 'overthrone:celestial', name: '&f&lCelestial Aura', icon: 'minecraft:nether_star', price: 7000 },
    { id: 'overthrone:void_pulse', name: '&5&lVoid Pulse Aura', icon: 'minecraft:ender_eye', price: 6000 },
    { id: 'overthrone:solomon_seal', name: '&6&lSeal of the Demon King', icon: 'minecraft:gold_block', price: 7000 },
    { id: 'overthrone:blood_moon', name: '&4&lBlood Moon Aura', icon: 'minecraft:red_dye', price: 6000 },
    { id: 'overthrone:spirit_ascension', name: '&a&lSpirit Ascension Aura', icon: 'minecraft:emerald', price: 5000 },
    { id: 'overthrone:pentagram_curse', name: '&d&lCursed Pentagram Aura', icon: 'minecraft:wither_rose', price: 6000 },
    { id: 'overthrone:clockwork_king', name: '&6&lClockwork King Aura', icon: 'minecraft:clock', price: 7000 },
    { id: 'overthrone:astral_navigator', name: '&9&lAstral Navigator Aura', icon: 'minecraft:compass', price: 7000 },
    { id: 'overthrone:solar_crown', name: '&e&lSolar Crown Aura', icon: 'minecraft:glowstone', price: 7000 },
    { id: 'overthrone:pulsar', name: '&b&lPulsar Aura', icon: 'minecraft:end_crystal', price: 7000 },
    { id: 'overthrone:eightfold_path', name: '&a&lEightfold Seal Aura', icon: 'minecraft:emerald_block', price: 7000 },
    { id: 'overthrone:ember_monarch', name: '&6&lEmber Monarch Aura', icon: 'minecraft:fire_charge', price: 6000 },
    { id: 'overthrone:dimension_rift', name: '&d&lDimension Rift Aura', icon: 'minecraft:crying_obsidian', crate: true },
    { id: 'overthrone:demon_lord_awakening', name: '&4&lDemon Lord Awakening', icon: 'minecraft:wither_skeleton_skull', crate: true },
    { id: 'overthrone:shadow_monarch', name: '&5&lShadow Monarch Aura', icon: 'minecraft:black_dye', crate: true },
  ],
  weapons: [
    { id: 'overthrone:black_flame_blade', name: '&5&lBlack Flame Blade', icon: 'minecraft:netherite_sword', price: 6000 },
    { id: 'overthrone:inferno_edge', name: '&6&lInferno Edge', icon: 'minecraft:golden_sword', price: 6000 },
    { id: 'overthrone:frostbite_edge', name: '&b&lFrostbite Edge', icon: 'minecraft:diamond_sword', price: 6000 },
    { id: 'overthrone:storm_blade', name: '&3&lStorm Blade', icon: 'minecraft:trident', price: 6000 },
    { id: 'overthrone:holy_blade', name: '&e&lHoly Blade', icon: 'minecraft:golden_sword', price: 6000 },
    { id: 'overthrone:bloodthirst', name: '&4&lBloodthirst', icon: 'minecraft:iron_sword', price: 6000 },
    { id: 'overthrone:void_edge', name: '&5&lVoid Edge', icon: 'minecraft:netherite_sword', price: 7000 },
    { id: 'overthrone:sakura_edge', name: '&d&lSakura Edge', icon: 'minecraft:stone_sword', price: 5000 },
    { id: 'overthrone:predator_mist', name: '&9&lPredator Mist', icon: 'minecraft:diamond_sword', price: 6000 },
    { id: 'overthrone:shadow_extraction', name: '&5&lShadow Extraction', icon: 'minecraft:netherite_sword', crate: true },
  ],
}

;(function () {
  // /wardrobe: opens the Manas Cosmetics wardrobe (same as /manas_cosmetics wardrobe, easier to remember)
  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('wardrobe').executes(ctx => {
      var p = ctx.source.playerOrException
      p.server.runCommandSilent('execute as ' + p.username + ' run manas_cosmetics wardrobe')
      return 1
    }))
  })
})()
