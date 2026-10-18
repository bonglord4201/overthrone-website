// priority: 10
// OVERTHRONE - our custom 3D cosmetics for the Manas Cosmetics mod (wings, halos, crowns, horns, auras).
// The cosmetic files themselves go in the server's config/manas_cosmetics/ folder (models/ + cosmetics/), from the
// repo folder minecraft/manas_cosmetics/ (made by scripts/build-manas-models.py and scripts/build-manas-auras.py).
// This file only lists them for the Throne Shop (npc_menus.js) and the Cosmetic Crate (crates.js).
// Unlocking uses the mod's own command: manas_cosmetics unlock <player> <id>. Players equip them in the mod's wardrobe:
// its keybind, /manas_cosmetics wardrobe, or /wardrobe.
//
// price = Throne Shards in the Throne Shop. crate: true = only from the Cosmetic Crate (not sold).
// Players need the Manas Cosmetics mod (in the modpack) to see them.

var OT_MANAS = {
  wings: [
    { id: 'overthrone:demon_lord_wings', name: '&4&lDemon Lord Wings', icon: 'minecraft:crimson_fungus', price: 6000 },
    { id: 'overthrone:dragon_wings', name: '&b&lStorm Dragon Wings', icon: 'minecraft:prismarine_shard', price: 6000 },
    { id: 'overthrone:seraph_wings', name: '&f&lSeraph Wings', icon: 'minecraft:feather', price: 6000 },
    { id: 'overthrone:shadow_monarch_wings', name: '&5&lShadow Monarch Wings', icon: 'minecraft:phantom_membrane', crate: true },
  ],
  halos: [
    { id: 'overthrone:hero_halo', name: '&e&lHero Halo', icon: 'minecraft:gold_nugget', price: 3500 },
    { id: 'overthrone:fallen_halo', name: '&c&lFallen Halo', icon: 'minecraft:redstone', price: 3500 },
    { id: 'overthrone:void_halo', name: '&d&lVoid Halo', icon: 'minecraft:amethyst_shard', price: 3500 },
  ],
  heads: [
    { id: 'overthrone:royal_crown', name: '&6&lRoyal Crown', icon: 'minecraft:golden_helmet', price: 4000 },
    { id: 'overthrone:demon_king_crown', name: '&8&lDemon King Crown', icon: 'minecraft:netherite_helmet', crate: true },
    { id: 'overthrone:demon_horns', name: '&4&lDemon Horns', icon: 'minecraft:goat_horn', price: 3000 },
    { id: 'overthrone:oni_horns', name: '&f&lOni Horns', icon: 'minecraft:bone', price: 3000 },
  ],
  auras: [
    { id: 'overthrone:true_hero', name: '&e&lTrue Hero Aura', icon: 'minecraft:sunflower', price: 5000 },
    { id: 'overthrone:storm_dragon', name: '&b&lStorm Dragon Aura', icon: 'minecraft:lightning_rod', price: 5000 },
    { id: 'overthrone:black_flame', name: '&5&lBlack Flame Aura', icon: 'minecraft:soul_campfire', price: 5000 },
    { id: 'overthrone:inferno', name: '&6&lInferno Aura', icon: 'minecraft:blaze_powder', price: 5000 },
    { id: 'overthrone:arcane_sage', name: '&9&lArcane Sage Aura', icon: 'minecraft:enchanted_book', price: 5000 },
    { id: 'overthrone:sakura_spirit', name: '&d&lSakura Spirit Aura', icon: 'minecraft:cherry_sapling', price: 4000 },
    { id: 'overthrone:frost_queen', name: '&b&lFrost Queen Aura', icon: 'minecraft:blue_ice', price: 5000 },
    { id: 'overthrone:great_sage', name: '&3&lGreat Sage Aura', icon: 'minecraft:heart_of_the_sea', price: 5000 },
    { id: 'overthrone:celestial', name: '&f&lCelestial Aura', icon: 'minecraft:nether_star', price: 6000 },
    { id: 'overthrone:void_pulse', name: '&5&lVoid Pulse Aura', icon: 'minecraft:ender_eye', price: 5000 },
    { id: 'overthrone:solomon_seal', name: '&6&lSeal of the Demon King', icon: 'minecraft:gold_block', price: 6000 },
    { id: 'overthrone:blood_moon', name: '&4&lBlood Moon Aura', icon: 'minecraft:red_dye', price: 5000 },
    { id: 'overthrone:spirit_ascension', name: '&a&lSpirit Ascension Aura', icon: 'minecraft:emerald', price: 4000 },
    { id: 'overthrone:pentagram_curse', name: '&d&lCursed Pentagram Aura', icon: 'minecraft:wither_rose', price: 5000 },
    { id: 'overthrone:demon_lord_awakening', name: '&4&lDemon Lord Awakening', icon: 'minecraft:wither_skeleton_skull', crate: true },
    { id: 'overthrone:shadow_monarch', name: '&5&lShadow Monarch Aura', icon: 'minecraft:black_dye', crate: true },
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
