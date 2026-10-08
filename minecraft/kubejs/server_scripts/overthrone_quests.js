// =====================================================================================
//  OVERTHRONE SMP - Hunter Association Quest Board (100 quests)
//  KubeJS server script, NeoForge 1.21.1.  Drop into: kubejs/server_scripts/
//
//  Players:  /quest          show the current quest, progress and rewards
//            /quest claim    turn in / claim the reward (RPG world only)
//            /quest list     chapter overview
//  Admins:   /questadmin check        list any quest/reward IDs that don't exist in this modpack
//            /questadmin set <1-101>  jump to a quest      /questadmin reset   back to quest 1
//            /questadmin complete     finish the current objective (testing)
//            Other players: /execute as <player> run questadmin set 25
//
//  Progress only counts inside the RPG world (see RPG_DIMENSIONS), so SMP play
//  can't be used to farm RPG quests. Rewards are only handed out in the RPG world,
//  so they land in the player's RPG inventory.
// =====================================================================================

// ------------------------------------------------------------------ settings
const RPG_DIMENSIONS = ['multiworld:rpg']          // where quest progress counts and rewards can be claimed
const MONEY_CMD = 'eco give {player} {amount}'      // your economy's "give money" command ({player} / {amount})
const MONEY_SYMBOL = '$'

// ------------------------------------------------------------------ quest data
// type: 'kill' (entity id) | 'mine' (block id or #tag) | 'craft' (item id) | 'deliver' (item id or #tag, items are taken on claim)
// rewards: money, xp (levels), items: [ [give-string, count, fallback-give-string?], ... ]
// Item give-strings may include 1.21 components, e.g. minecraft:iron_sword[enchantments={levels:{"minecraft:sharpness":2}}]
const ench = (item, list) => item + '[enchantments={levels:{' + list + '}}]'
const book = (list) => 'minecraft:enchanted_book[stored_enchantments={levels:{' + list + '}}]'
const potion = (p) => 'minecraft:potion[potion_contents={potion:"minecraft:' + p + '"}]'

const CHAPTERS = [
  { name: 'E-Rank: The Awakening', color: '§a', from: 1 },
  { name: 'D-Rank: The Wilds', color: '§e', from: 21 },
  { name: 'C-Rank: Into the Depths', color: '§6', from: 41 },
  { name: 'B-Rank: The Hunt Beyond', color: '§c', from: 61 },
  { name: 'S-Rank: Overthrow', color: '§4', from: 81 }
]

const QUESTS = [
  // ---------------------------------------------------------------- E-RANK (1-20)
  { title: 'First Steps', type: 'deliver', target: '#minecraft:logs', count: 16, lore: 'Every Hunter starts with an axe and a sore back. Bring the Guild some timber.', rewards: { money: 200, xp: 2, items: [['minecraft:bread', 8]] } },
  { title: 'Tools of the Trade', type: 'craft', target: 'minecraft:stone_pickaxe', count: 1, lore: 'Stone before steel. Craft yourself a proper pickaxe.', rewards: { money: 200, xp: 2, items: [['minecraft:torch', 16]] } },
  { title: 'Night Watch', type: 'kill', target: 'minecraft:zombie', count: 10, lore: 'The dead walk when the sun sleeps. Put ten of them back in the ground.', rewards: { money: 300, xp: 3, items: [['minecraft:iron_ingot', 4]] } },
  { title: 'Bone Collector', type: 'kill', target: 'minecraft:skeleton', count: 10, lore: 'Skeleton archers have been picking off travellers. Thin their ranks.', rewards: { money: 300, xp: 3, items: [['minecraft:arrow', 32]] } },
  { title: 'Eight Legs', type: 'kill', target: 'minecraft:spider', count: 8, lore: 'Spiders nest close to the roads. Clear them out.', rewards: { money: 300, xp: 3, items: [['minecraft:cooked_beef', 12]] } },
  { title: 'Into the Stone', type: 'mine', target: '#minecraft:coal_ores', count: 16, lore: 'Light keeps the monsters away. Mine coal for the Guild\'s torches.', rewards: { money: 350, xp: 3, items: [['minecraft:torch', 32]] } },
  { title: 'Iron Will', type: 'mine', target: '#minecraft:iron_ores', count: 12, lore: 'Brann needs ore for his forge. Find iron.', rewards: { money: 400, xp: 4, items: [['minecraft:shield', 1]] } },
  { title: 'Harvest', type: 'deliver', target: 'minecraft:wheat', count: 32, lore: 'A Hunter that doesn\'t eat doesn\'t hunt. Bring wheat for the Guild kitchen.', rewards: { money: 350, xp: 3, items: [['minecraft:bread', 16]] } },
  { title: 'Shield Bearer', type: 'craft', target: 'minecraft:shield', count: 1, lore: 'Learn to block before you learn to strike. Craft a shield.', rewards: { money: 300, xp: 3, items: [['minecraft:iron_ingot', 8]] } },
  { title: 'Rank E Trial: Creeper Hunt', type: 'kill', target: 'minecraft:creeper', count: 10, lore: 'Your first trial. Creepers have levelled three farms this week. End them, quietly.', milestone: true, rewards: { money: 1000, xp: 6, items: [[ench('minecraft:iron_sword', '"minecraft:sharpness":2'), 1]] } },
  { title: 'Drowned Depths', type: 'kill', target: 'minecraft:drowned', count: 8, lore: 'Something drags fishermen under at night. Hunt the drowned.', rewards: { money: 450, xp: 4, items: [['minecraft:iron_ingot', 6]] } },
  { title: 'The Smith\'s Request', type: 'deliver', target: 'minecraft:iron_ingot', count: 24, lore: 'Brann Ironfist is out of iron, again. Help him out.', rewards: { money: 600, xp: 4, items: [['minecraft:iron_chestplate', 1]] } },
  { title: 'Stock the Larder', type: 'deliver', target: 'minecraft:cooked_beef', count: 16, lore: 'Hunters return hungry. Fill the Guild\'s larder.', rewards: { money: 450, xp: 3, items: [['minecraft:golden_carrot', 8]] } },
  { title: 'Desert Dust', type: 'kill', target: 'minecraft:husk', count: 10, lore: 'Husks stalk the dunes and never tire. Bring them rest.', rewards: { money: 500, xp: 4, items: [['minecraft:gold_ingot', 4]] } },
  { title: 'Cold Bones', type: 'kill', target: 'minecraft:stray', count: 8, lore: 'Strays freeze their victims with every arrow. Silence them.', rewards: { money: 500, xp: 4, items: [[ench('minecraft:bow', '"minecraft:power":1'), 1]] } },
  { title: 'Copper Veins', type: 'mine', target: '#minecraft:copper_ores', count: 24, lore: 'Copper for the Guild\'s lightning rods. Dig deep.', rewards: { money: 450, xp: 3, items: [['minecraft:spyglass', 1]] } },
  { title: 'Woodcutter', type: 'deliver', target: '#minecraft:logs', count: 64, lore: 'The Guild Hall needs a new wing. Bring a mountain of timber.', rewards: { money: 500, xp: 4, items: [[ench('minecraft:iron_axe', '"minecraft:efficiency":2'), 1]] } },
  { title: 'Bowyer', type: 'craft', target: 'minecraft:bow', count: 3, lore: 'New recruits need bows. Craft three.', rewards: { money: 400, xp: 3, items: [['minecraft:arrow', 64]] } },
  { title: 'Slime Trouble', type: 'kill', target: 'minecraft:slime', count: 10, lore: 'Slimes keep bouncing out of the swamps. Squash them.', rewards: { money: 550, xp: 4, items: [['minecraft:golden_apple', 1]] } },
  { title: 'E-Rank Exam: The Bone March', type: 'kill', target: 'minecraft:skeleton', count: 25, lore: 'Prove you are ready for D-Rank. Twenty-five skeletons, no excuses.', milestone: true, rewards: { money: 2000, xp: 8, items: [['minecraft:diamond', 3], ['mowziesmobs:naga_fang_dagger', 1, ench('minecraft:iron_sword', '"minecraft:sharpness":3')]] } },

  // ---------------------------------------------------------------- D-RANK (21-40)
  { title: 'Golden Hour', type: 'mine', target: '#minecraft:gold_ores', count: 12, lore: 'Gold glitters for kings and Hunters alike. Find some.', rewards: { money: 800, xp: 5, items: [['minecraft:golden_apple', 2]] } },
  { title: 'Witch Hunt', type: 'kill', target: 'minecraft:witch', count: 5, lore: 'Witches brew poison in the marshes. Break their cauldrons.', rewards: { money: 900, xp: 5, items: [['minecraft:experience_bottle', 16]] } },
  { title: 'Phantoms of the Night', type: 'kill', target: 'minecraft:phantom', count: 6, lore: 'Those who never sleep are hunted from above. Strike them from the sky.', rewards: { money: 900, xp: 5, items: [['minecraft:golden_carrot', 16]] } },
  { title: 'Silk and Steel', type: 'deliver', target: 'minecraft:string', count: 32, lore: 'The Guild\'s fletchers need string. Lots of it.', rewards: { money: 700, xp: 4, items: [[ench('minecraft:bow', '"minecraft:power":2'), 1]] } },
  { title: 'The Archer\'s Mark', type: 'kill', target: 'minecraft:skeleton', count: 30, lore: 'Skeleton camps are growing. Show them a real archer.', rewards: { money: 1000, xp: 5, items: [['artifacts:night_vision_goggles', 1, ench('minecraft:crossbow', '"minecraft:quick_charge":1')]] } },
  { title: 'Lapis Lore', type: 'mine', target: '#minecraft:lapis_ores', count: 10, lore: 'The Archmage needs lapis for her enchantments.', rewards: { money: 900, xp: 5, items: [['minecraft:experience_bottle', 16]] } },
  { title: 'Enchanter\'s Table', type: 'craft', target: 'minecraft:enchanting_table', count: 1, lore: 'Steel is strong. Enchanted steel is stronger. Craft an enchanting table.', rewards: { money: 1000, xp: 6, items: [['minecraft:lapis_lazuli', 32]] } },
  { title: 'Redstone Pulse', type: 'mine', target: '#minecraft:redstone_ores', count: 16, lore: 'Redstone runs the Guild\'s gates. Bring the dust.', rewards: { money: 900, xp: 5, items: [['minecraft:golden_carrot', 16]] } },
  { title: 'Raider Scouts', type: 'kill', target: 'minecraft:pillager', count: 10, lore: 'Pillager scouts were seen near the outposts. Strike first.', rewards: { money: 1200, xp: 6, items: [[ench('minecraft:crossbow', '"minecraft:piercing":2'), 1]] } },
  { title: 'D-Rank Trial: The Raid Captains', type: 'kill', target: 'minecraft:vindicator', count: 5, lore: 'Vindicators lead the raids. Cut off the head and the body falls.', milestone: true, rewards: { money: 3000, xp: 10, items: [[ench('minecraft:diamond_sword', '"minecraft:sharpness":2'), 1], ['mowziesmobs:spear', 1, 'minecraft:diamond 2']] } },
  { title: 'Leatherworker', type: 'deliver', target: 'minecraft:leather', count: 24, lore: 'Armour starts with leather. Bring hides to the tanner.', rewards: { money: 900, xp: 5, items: [['minecraft:saddle', 1]] } },
  { title: 'Endless Night', type: 'kill', target: 'minecraft:enderman', count: 5, lore: 'Endermen steal from the Guild\'s walls. Don\'t look them in the eye.', rewards: { money: 1300, xp: 6, items: [['minecraft:ender_pearl', 4]] } },
  { title: 'Pearl Diver', type: 'deliver', target: 'minecraft:ender_pearl', count: 8, lore: 'The Archmage studies ender pearls. Bring her eight.', rewards: { money: 1500, xp: 6, items: [['minecraft:ender_chest', 1]] } },
  { title: 'Sea Legs', type: 'kill', target: 'minecraft:drowned', count: 20, lore: 'The drowned have taken a whole bay. Take it back.', rewards: { money: 1200, xp: 6, items: [['minecraft:golden_apple', 2]] } },
  { title: 'Blacksmith\'s Steel', type: 'craft', target: 'minecraft:iron_chestplate', count: 1, lore: 'Brann wants to see if you can forge your own armour.', rewards: { money: 1000, xp: 5, items: [['minecraft:iron_leggings', 1]] } },
  { title: 'Bog Walkers', type: 'kill', target: 'minecraft:bogged', count: 8, lore: 'Poison-arrow skeletons stalk the swamps and trial halls. Hunt the bogged.', rewards: { money: 1300, xp: 6, items: [['minecraft:arrow', 64]] } },
  { title: 'Emerald Trade', type: 'deliver', target: 'minecraft:emerald', count: 16, lore: 'Silas pays well for emeralds. Very well.', rewards: { money: 1800, xp: 6, items: [['minecraft:diamond', 2]] } },
  { title: 'Cave Crawlers', type: 'kill', target: 'minecraft:cave_spider', count: 15, lore: 'Venomous spiders nest in the old mineshafts. Burn them out.', rewards: { money: 1400, xp: 6, items: [['minecraft:golden_apple', 2]] } },
  { title: 'Smelter', type: 'deliver', target: 'minecraft:gold_ingot', count: 32, lore: 'The crown wants gold for its treasury.', rewards: { money: 1600, xp: 6, items: [['minecraft:golden_apple', 3], ['minecraft:clock', 1]] } },
  { title: 'D-Rank Exam: Trial of Winds', type: 'kill', target: 'minecraft:breeze', count: 6, lore: 'The Breezes guard the trial chambers. Defeat six to earn C-Rank.', milestone: true, rewards: { money: 5000, xp: 12, items: [['minecraft:trident', 1], ['minecraft:diamond', 5]] } },

  // ---------------------------------------------------------------- C-RANK (41-60)
  { title: 'Diamond Fever', type: 'mine', target: '#minecraft:diamond_ores', count: 5, lore: 'Real Hunters carry diamond. Find your first.', rewards: { money: 2000, xp: 7, items: [[ench('minecraft:diamond_pickaxe', '"minecraft:efficiency":2'), 1]] } },
  { title: 'Mob Slayer', type: 'kill', target: 'minecraft:zombie', count: 50, lore: 'A horde gathers in the east. Fifty zombies, Hunter.', rewards: { money: 2200, xp: 7, items: [['minecraft:golden_apple', 3]] } },
  { title: 'Silverfish Infestation', type: 'kill', target: 'minecraft:silverfish', count: 20, lore: 'Silverfish chew through the stronghold walls. Exterminate them.', rewards: { money: 2000, xp: 7, items: [['minecraft:ender_eye', 4]] } },
  { title: 'Obsidian Forge', type: 'deliver', target: 'minecraft:obsidian', count: 16, lore: 'The Guild is building a vault. Bring obsidian.', rewards: { money: 2200, xp: 7, items: [['minecraft:diamond', 3]] } },
  { title: 'Arsenal', type: 'craft', target: 'minecraft:diamond_sword', count: 1, lore: 'Forge a diamond blade worthy of a C-Rank Hunter.', rewards: { money: 2500, xp: 8, items: [[book('"minecraft:sharpness":3'), 1], ['artifacts:power_glove', 1, 'minecraft:golden_apple 3']] } },
  { title: 'Ocean\'s Guardians', type: 'kill', target: 'minecraft:guardian', count: 10, lore: 'Guardians lash out at every passing ship. Break their monument\'s defence.', rewards: { money: 3000, xp: 8, items: [['minecraft:diamond', 3]] } },
  { title: 'Undead Legion', type: 'kill', target: 'minecraft:skeleton', count: 50, lore: 'A skeleton legion marches at night. Break it.', rewards: { money: 2500, xp: 8, items: [[ench('minecraft:bow', '"minecraft:power":3,"minecraft:unbreaking":2'), 1]] } },
  { title: 'Night Terrors', type: 'kill', target: 'minecraft:phantom', count: 15, lore: 'The phantoms grow bolder every night. Ground them.', rewards: { money: 3000, xp: 8, items: [['minecraft:golden_apple', 4]] } },
  { title: 'Amethyst Song', type: 'mine', target: 'minecraft:amethyst_cluster', count: 16, lore: 'Amethyst hums with old magic. Harvest the geodes.', rewards: { money: 2500, xp: 8, items: [['minecraft:experience_bottle', 32]] } },
  { title: 'C-Rank Trial: The Evokers', type: 'kill', target: 'minecraft:evoker', count: 2, lore: 'Evokers summon fangs from the earth. Defeat two and claim their totems.', milestone: true, rewards: { money: 8000, xp: 15, items: [['minecraft:totem_of_undying', 1], ['mowziesmobs:blowgun', 1, ench('minecraft:bow', '"minecraft:power":3')]] } },
  { title: 'Glow Ink', type: 'kill', target: 'minecraft:glow_squid', count: 10, lore: 'The scribes need glowing ink for the quest board.', rewards: { money: 2600, xp: 8, items: [['minecraft:golden_carrot', 32]] } },
  { title: 'Builder\'s Stone', type: 'deliver', target: 'minecraft:stone_bricks', count: 128, lore: 'The Hunter Association is expanding. Bring stone bricks for the walls.', rewards: { money: 2800, xp: 8, items: [['minecraft:diamond', 3]] } },
  { title: 'The Ravager', type: 'kill', target: 'minecraft:ravager', count: 2, lore: 'Ravagers flatten villages. Stop two of the beasts.', rewards: { money: 4000, xp: 10, items: [[ench('minecraft:diamond_axe', '"minecraft:sharpness":3'), 1]] } },
  { title: 'Emerald Mine', type: 'mine', target: '#minecraft:emerald_ores', count: 6, lore: 'Emeralds hide in the mountains. Find them.', rewards: { money: 3500, xp: 9, items: [['minecraft:emerald', 16]] } },
  { title: 'Masterwork Crossbows', type: 'craft', target: 'minecraft:crossbow', count: 3, lore: 'The Royal Guard needs crossbows. Craft three.', rewards: { money: 2800, xp: 8, items: [['minecraft:arrow', 64], ['artifacts:feral_claws', 1, 'minecraft:golden_apple 2']] } },
  { title: 'Creeper Purge', type: 'kill', target: 'minecraft:creeper', count: 40, lore: 'The creepers are breeding in the caves. Purge them.', rewards: { money: 3500, xp: 9, items: [['minecraft:golden_apple', 4]] } },
  { title: 'Witch Coven', type: 'kill', target: 'minecraft:witch', count: 15, lore: 'A whole coven has gathered in the swamp. Break it.', rewards: { money: 4000, xp: 10, items: [[potion('strong_strength'), 3]] } },
  { title: 'Golden Feast', type: 'deliver', target: 'minecraft:golden_carrot', count: 32, lore: 'The King is hosting a feast. Golden carrots, and plenty of them.', rewards: { money: 3500, xp: 9, items: [['minecraft:golden_apple', 6]] } },
  { title: 'Diamond Hoard', type: 'deliver', target: 'minecraft:diamond', count: 16, lore: 'The crown\'s treasury demands diamonds.', rewards: { money: 6000, xp: 10, items: [['minecraft:netherite_upgrade_smithing_template', 1]] } },
  { title: 'C-Rank Exam: The Monument Warden', type: 'kill', target: 'minecraft:elder_guardian', count: 1, lore: 'An Elder Guardian curses the sea. Slay it to earn B-Rank.', milestone: true, rewards: { money: 12000, xp: 18, items: [[ench('minecraft:trident', '"minecraft:loyalty":3,"minecraft:impaling":2'), 1], [ench('minecraft:diamond_chestplate', '"minecraft:protection":2'), 1]] } },

  // ---------------------------------------------------------------- B-RANK (61-80)
  { title: 'Jungle Jaws', type: 'kill', target: 'mowziesmobs:foliaath', count: 5, lore: 'Man-eating plants lurk in the jungle. Uproot five Foliaaths.', rewards: { money: 5000, xp: 10, items: [['minecraft:diamond', 4]] } },
  { title: 'The Diamond Eater', type: 'kill', target: 'mowziesmobs:grottol', count: 1, lore: 'A Grottol is eating the deep diamond veins. Catch it before it digs away.', rewards: { money: 6000, xp: 10, items: [['minecraft:diamond', 6]] } },
  { title: 'Lantern Light', type: 'kill', target: 'mowziesmobs:lantern', count: 8, lore: 'Floating lanterns lure Hunters into the dark forest. Pop them.', rewards: { money: 5000, xp: 10, items: [['minecraft:experience_bottle', 32]] } },
  { title: 'Naga of the Coast', type: 'kill', target: 'mowziesmobs:naga', count: 3, lore: 'Sea serpents spit acid at ships near the cliffs. Bring them down.', rewards: { money: 7000, xp: 12, items: [['minecraft:diamond', 4], ['artifacts:cloud_in_a_bottle', 1, 'minecraft:golden_apple 4']] } },
  { title: 'Iron Wall', type: 'kill', target: 'minecraft:vindicator', count: 20, lore: 'A mansion\'s guards raid the roads. Twenty vindicators.', rewards: { money: 6000, xp: 11, items: [[ench('minecraft:diamond_axe', '"minecraft:sharpness":3,"minecraft:unbreaking":2'), 1]] } },
  { title: 'Netherite Dream', type: 'deliver', target: 'minecraft:diamond', count: 32, lore: 'Trade a fortune in diamonds for something rarer.', rewards: { money: 9000, xp: 12, items: [['minecraft:netherite_ingot', 1]] } },
  { title: 'Sky Breaker', type: 'kill', target: 'minecraft:breeze', count: 20, lore: 'The trial chambers are restless. Twenty Breezes.', rewards: { money: 7000, xp: 12, items: [['minecraft:wind_charge', 32]] } },
  { title: 'Trial Master', type: 'deliver', target: 'minecraft:trial_key', count: 5, lore: 'Prove you have conquered the trial chambers. Bring five trial keys.', rewards: { money: 7500, xp: 12, items: [['minecraft:golden_apple', 8]] } },
  { title: 'The Iron Colossus', type: 'kill', target: 'mowziesmobs:ferrous_wroughtnaut', count: 1, lore: 'A living suit of armour guards an ancient vault. Topple the Wroughtnaut.', rewards: { money: 12000, xp: 15, items: [['minecraft:netherite_ingot', 1]] } },
  { title: 'B-Rank Trial: The Frost Tyrant', type: 'kill', target: 'mowziesmobs:frostmaw', count: 1, lore: 'The Frostmaw rules the frozen peaks. Shatter it.', milestone: true, rewards: { money: 20000, xp: 20, items: [['mowziesmobs:ice_crystal', 1, ench('minecraft:diamond_sword', '"minecraft:sharpness":4')], ['minecraft:diamond', 8]] } },
  { title: 'Monster Hunter', type: 'kill', target: 'minecraft:zombie', count: 100, lore: 'One hundred zombies. A real Hunter doesn\'t count, but the Guild does.', rewards: { money: 8000, xp: 12, items: [[ench('minecraft:diamond_sword', '"minecraft:looting":2'), 1]] } },
  { title: 'Bone Throne', type: 'kill', target: 'minecraft:skeleton', count: 100, lore: 'Build the Guild a throne of bones. One hundred skeletons.', rewards: { money: 8000, xp: 12, items: [[ench('minecraft:bow', '"minecraft:power":4'), 1]] } },
  { title: 'Arachnophobia', type: 'kill', target: 'minecraft:spider', count: 75, lore: 'The spider queen\'s brood is endless. Seventy-five more.', rewards: { money: 7500, xp: 12, items: [['minecraft:diamond', 6]] } },
  { title: 'Endless Ender', type: 'kill', target: 'minecraft:enderman', count: 30, lore: 'Endermen gather in the dark plains. Thirty of them.', rewards: { money: 10000, xp: 14, items: [['minecraft:ender_pearl', 16]] } },
  { title: 'Master Miner', type: 'mine', target: '#minecraft:diamond_ores', count: 25, lore: 'Twenty-five diamond veins. The deep belongs to you now.', rewards: { money: 12000, xp: 15, items: [[ench('minecraft:diamond_pickaxe', '"minecraft:fortune":2,"minecraft:efficiency":3'), 1], ['artifacts:digging_claws', 1, 'minecraft:diamond 3']] } },
  { title: 'Royal Armoury', type: 'craft', target: 'minecraft:diamond_chestplate', count: 1, lore: 'Forge a diamond chestplate for the Royal Guard.', rewards: { money: 8000, xp: 12, items: [[ench('minecraft:diamond_leggings', '"minecraft:protection":2'), 1]] } },
  { title: 'Sea Monsters', type: 'kill', target: 'minecraft:guardian', count: 40, lore: 'Clear a whole ocean monument of its guardians.', rewards: { money: 11000, xp: 14, items: [['minecraft:heart_of_the_sea', 1]] } },
  { title: 'Pillage the Pillagers', type: 'kill', target: 'minecraft:pillager', count: 50, lore: 'Turn the raiders\' own tactics against them. Fifty pillagers.', rewards: { money: 11000, xp: 14, items: [[ench('minecraft:crossbow', '"minecraft:multishot":1,"minecraft:quick_charge":2'), 1]] } },
  { title: 'Coven\'s End', type: 'kill', target: 'minecraft:witch', count: 30, lore: 'End the witches\' coven for good.', rewards: { money: 12000, xp: 14, items: [['minecraft:totem_of_undying', 1]] } },
  { title: 'B-Rank Exam: Tides of Ruin', type: 'kill', target: 'minecraft:elder_guardian', count: 3, lore: 'Three monuments, three Elder Guardians. Earn your S-Rank.', milestone: true, rewards: { money: 30000, xp: 25, items: [[ench('minecraft:diamond_helmet', '"minecraft:protection":3'), 1], [ench('minecraft:diamond_boots', '"minecraft:protection":3,"minecraft:feather_falling":3'), 1], ['mowziesmobs:wrought_axe', 1, ench('minecraft:diamond_axe', '"minecraft:sharpness":4')]] } },

  // ---------------------------------------------------------------- S-RANK (81-100)
  { title: 'The Ancient City', type: 'kill', target: 'minecraft:warden', count: 1, lore: 'Deep below lies a city of silence and a guardian that hunts by sound. Kill the Warden.', rewards: { money: 40000, xp: 25, items: [['minecraft:netherite_ingot', 1], ['minecraft:recovery_compass', 1]] } },
  { title: 'Deep Dark Relics', type: 'deliver', target: 'minecraft:echo_shard', count: 8, lore: 'The Archmage wants echo shards from the ancient cities.', rewards: { money: 20000, xp: 18, items: [['minecraft:netherite_ingot', 1]] } },
  { title: 'Hunter\'s Tithe', type: 'deliver', target: 'minecraft:emerald_block', count: 16, lore: 'Every S-Rank pays tribute to the crown.', rewards: { money: 25000, xp: 18, items: [['minecraft:diamond_block', 2]] } },
  { title: 'Slayer Legion', type: 'kill', target: 'minecraft:creeper', count: 100, lore: 'One hundred creepers. Try not to lose your house.', rewards: { money: 20000, xp: 18, items: [['minecraft:golden_apple', 16]] } },
  { title: 'Raid Breaker', type: 'kill', target: 'minecraft:ravager', count: 10, lore: 'Ten ravagers. The villages will sing your name.', rewards: { money: 25000, xp: 20, items: [['minecraft:totem_of_undying', 2], ['artifacts:lucky_scarf', 1, 'minecraft:diamond 4']] } },
  { title: 'Evoker\'s End', type: 'kill', target: 'minecraft:evoker', count: 10, lore: 'Hunt down ten evokers in their mansions.', rewards: { money: 30000, xp: 20, items: [['minecraft:totem_of_undying', 2]] } },
  { title: 'Crystal Heart', type: 'kill', target: 'mowziesmobs:frostmaw', count: 2, lore: 'Two more Frostmaws have awoken in the north.', rewards: { money: 35000, xp: 22, items: [['minecraft:diamond', 16]] } },
  { title: 'Iron Graveyard', type: 'kill', target: 'mowziesmobs:ferrous_wroughtnaut', count: 3, lore: 'Every vault has its guardian. Topple three Wroughtnauts.', rewards: { money: 35000, xp: 22, items: [['minecraft:netherite_ingot', 2]] } },
  { title: 'Sky Lord', type: 'kill', target: 'minecraft:breeze', count: 50, lore: 'Master the winds. Fifty Breezes.', rewards: { money: 30000, xp: 20, items: [['minecraft:wind_charge', 64], ['minecraft:diamond', 16]] } },
  { title: 'S-Rank Trial: Shadow of the Throne', type: 'kill', target: 'minecraft:warden', count: 2, lore: 'Two Wardens. Only the strongest Hunters walk out of the deep dark twice.', milestone: true, rewards: { money: 60000, xp: 30, items: [[ench('minecraft:netherite_sword', '"minecraft:sharpness":3,"minecraft:unbreaking":2'), 1]] } },
  { title: 'Treasury of Kings', type: 'deliver', target: 'minecraft:gold_block', count: 32, lore: 'King Aldric is rebuilding the treasury. Thirty-two gold blocks.', rewards: { money: 40000, xp: 22, items: [['minecraft:enchanted_golden_apple', 1]] } },
  { title: 'The Thousand Cuts', type: 'kill', target: 'minecraft:zombie', count: 250, lore: 'Two hundred and fifty zombies. Your blade should be tired by now.', rewards: { money: 40000, xp: 22, items: [['minecraft:netherite_ingot', 2]] } },
  { title: 'Bone Lord', type: 'kill', target: 'minecraft:skeleton', count: 250, lore: 'Two hundred and fifty skeletons. Become the Bone Lord.', rewards: { money: 40000, xp: 22, items: [[ench('minecraft:bow', '"minecraft:power":5,"minecraft:infinity":1'), 1]] } },
  { title: 'Deep Diamond', type: 'mine', target: '#minecraft:diamond_ores', count: 64, lore: 'Sixty-four diamond veins. The mountains have nothing left to hide.', rewards: { money: 50000, xp: 25, items: [['minecraft:netherite_ingot', 2]] } },
  { title: 'Guardian of the Deep', type: 'kill', target: 'minecraft:elder_guardian', count: 6, lore: 'Six Elder Guardians. The seas are yours.', rewards: { money: 50000, xp: 25, items: [['minecraft:conduit', 1], ['artifacts:crystal_heart', 1, 'minecraft:enchanted_golden_apple 1']] } },
  { title: 'Netherite Pact', type: 'deliver', target: 'minecraft:netherite_ingot', count: 4, lore: 'Pledge four netherite ingots to the crown\'s war chest.', rewards: { money: 60000, xp: 25, items: [['minecraft:enchanted_golden_apple', 2], ['minecraft:totem_of_undying', 2]] } },
  { title: 'The Ender\'s Gaze', type: 'kill', target: 'minecraft:enderman', count: 100, lore: 'One hundred endermen. Look them all in the eye.', rewards: { money: 45000, xp: 25, items: [['minecraft:ender_chest', 1], ['minecraft:ender_pearl', 16]] } },
  { title: 'Legend of the Coast', type: 'kill', target: 'mowziesmobs:naga', count: 15, lore: 'Fifteen Naga. The coast will be safe for a generation.', rewards: { money: 50000, xp: 25, items: [['minecraft:enchanted_golden_apple', 2]] } },
  { title: 'Tokens of Survival', type: 'deliver', target: 'minecraft:totem_of_undying', count: 5, lore: 'Only a Hunter who has cheated death five times may face the final trial.', rewards: { money: 80000, xp: 35, items: [[ench('minecraft:netherite_helmet', '"minecraft:protection":3,"minecraft:unbreaking":3'), 1]] } },
  { title: 'OVERTHRONE', type: 'kill', target: 'minecraft:warden', count: 3, lore: 'The final trial. Three Wardens. Do this, and the throne trembles at your name.', milestone: true, final: true, rewards: { money: 150000, xp: 50, items: [['minecraft:netherite_sword[custom_name=\'{"text":"Throneslayer","color":"gold","bold":true,"italic":false}\',enchantments={levels:{"minecraft:sharpness":5,"minecraft:unbreaking":3,"minecraft:looting":3}}]', 1], ['minecraft:enchanted_golden_apple', 3]] } }
]

// ------------------------------------------------------------------ helpers
const KEY_INDEX = 'otq_index'   // 0-based index of the current quest (100 = all done)
const KEY_PROG = 'otq_prog'     // progress on the current quest
const placedBlocks = {}         // blocks players placed (so they can't place & re-mine ores)

let registryCache = null
function registries() {
  if (registryCache) return registryCache
  try {
    const BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
    const ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
    registryCache = { reg: BuiltInRegistries, rl: ResourceLocation }
  } catch (e) {
    registryCache = { reg: null, rl: null }
  }
  return registryCache
}
function idExists(kind, rawId) {
  if (!rawId || rawId.charAt(0) === '#') return true // tags are checked by the game itself
  const id = rawId.split('[')[0].split(' ')[0]
  const r = registries()
  if (!r.reg) return true
  try {
    const loc = r.rl.parse(id)
    if (kind === 'entity') return r.reg.ENTITY_TYPE.containsKey(loc)
    if (kind === 'block') return r.reg.BLOCK.containsKey(loc)
    return r.reg.ITEM.containsKey(loc)
  } catch (e) {
    return false
  }
}
function targetKind(q) { return q.type === 'kill' ? 'entity' : q.type === 'mine' ? 'block' : 'item' }
function questValid(q) { return idExists(targetKind(q), q.target) }

function dimensionId(level) {
  // KubeJS exposes the dimension id in a few shapes depending on version; normalise to "namespace:path"
  let s = ''
  try { s = String(level.getDimension()) } catch (e) {
    try { s = String(level.dimension().location()) } catch (e2) { s = String(level.dimension) }
  }
  const m = s.match(/([a-z0-9_.-]+:[a-z0-9_./-]+)\]?\s*$/)
  return m ? m[1] : s
}
function inRpg(player) {
  if (RPG_DIMENSIONS.length === 0) return true
  const dim = dimensionId(player.level)
  for (let i = 0; i < RPG_DIMENSIONS.length; i++) if (RPG_DIMENSIONS[i] === dim) return true
  return false
}
function getIndex(player) { return player.persistentData.getInt(KEY_INDEX) }
function getProg(player) { return player.persistentData.getInt(KEY_PROG) }
function setState(player, index, prog) {
  player.persistentData.putInt(KEY_INDEX, index)
  player.persistentData.putInt(KEY_PROG, prog)
}
function chapterOf(index) {
  let c = CHAPTERS[0]
  for (let i = 0; i < CHAPTERS.length; i++) if (index + 1 >= CHAPTERS[i].from) c = CHAPTERS[i]
  return c
}
function run(player, cmd) { player.server.runCommandSilent(cmd) }
function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }
function prettyId(id) {
  const base = id.split('[')[0].replace(/^#/, '').split(':').pop()
  let s = base.replace(/_/g, ' ')
  s = s.replace(/\b\w/g, (m) => m.toUpperCase())
  if (id.charAt(0) === '#') s = 'any ' + s.replace(/s$/, '')
  return s
}
function bar(cur, need) {
  const n = 20
  const fill = Math.max(0, Math.min(n, Math.floor((cur / need) * n)))
  let s = '§a'
  for (let i = 0; i < n; i++) s += (i === fill ? '§8' : '') + '|'
  return s
}
function objectiveText(q) {
  const verb = q.type === 'kill' ? 'Slay' : q.type === 'mine' ? 'Mine' : q.type === 'craft' ? 'Craft' : 'Bring'
  return verb + ' ' + q.count + 'x ' + prettyId(q.target)
}
function stackMatches(stack, target) {
  if (!stack || stack.isEmpty()) return false
  if (target.charAt(0) === '#') return stack.hasTag(target.substring(1))
  return String(stack.id) === target
}
function countInInventory(player, target) {
  const inv = player.inventory
  let total = 0
  for (let i = 0; i < inv.getContainerSize(); i++) {
    const s = inv.getItem(i)
    if (stackMatches(s, target)) total += s.count
  }
  return total
}
function takeFromInventory(player, target, amount) {
  const inv = player.inventory
  let left = amount
  for (let i = 0; i < inv.getContainerSize() && left > 0; i++) {
    const s = inv.getItem(i)
    if (stackMatches(s, target)) {
      const t = Math.min(left, s.count)
      s.shrink(t)
      left -= t
    }
  }
  inv.setChanged()
  return left === 0
}
function rewardLines(q) {
  const lines = []
  if (q.rewards.money) lines.push('§6  ' + MONEY_SYMBOL + fmt(q.rewards.money))
  if (q.rewards.xp) lines.push('§a  ' + q.rewards.xp + ' XP levels')
  const items = q.rewards.items || []
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    let id = it[0]
    let count = it[1]
    if (!idExists('item', id) && it[2]) { const fb = it[2].split(' '); id = fb[0]; count = Number(fb[1] || 1) }
    const named = id.indexOf('custom_name') >= 0 ? 'Throneslayer (legendary)' : prettyId(id)
    const enchanted = id.indexOf('enchantments=') >= 0 ? ' §d(enchanted)' : ''
    lines.push('§f  ' + count + 'x ' + named + enchanted)
  }
  return lines
}

// skip forward past quests whose target doesn't exist in this modpack
function currentQuest(player) {
  let index = getIndex(player)
  let moved = false
  while (index < QUESTS.length && !questValid(QUESTS[index])) { index++; moved = true }
  if (moved) setState(player, index, 0)
  return index < QUESTS.length ? QUESTS[index] : null
}

function showQuest(player) {
  const q = currentQuest(player)
  const index = getIndex(player)
  player.tell('§8§m                                                ')
  if (!q) {
    player.tell('§6§l  ✦ ALL 100 QUESTS COMPLETE ✦')
    player.tell('§7  You have conquered the Hunter Association\'s quest board.')
    player.tell('§7  The throne knows your name, §6' + player.username + '§7.')
    player.tell('§8§m                                                ')
    return
  }
  const ch = chapterOf(index)
  const cur = q.type === 'deliver' ? countInInventory(player, q.target) : getProg(player)
  const shown = Math.min(cur, q.count)
  player.tell(ch.color + '§l  ' + ch.name.toUpperCase())
  player.tell('§f§l  Quest ' + (index + 1) + '/100 §8» ' + (q.milestone ? '§6§l' : '§e§l') + q.title + (q.milestone ? ' §6✦' : ''))
  player.tell('§7§o  "' + q.lore + '"')
  player.tell('')
  player.tell('§b  Objective: §f' + objectiveText(q))
  player.tell('  ' + bar(shown, q.count) + ' §f' + shown + '§7/§f' + q.count)
  if (q.type === 'deliver') player.tell('§8  Items are taken from your inventory when you claim.')
  player.tell('')
  player.tell('§e  Rewards:')
  const lines = rewardLines(q)
  for (let i = 0; i < lines.length; i++) player.tell(lines[i])
  player.tell('')
  if (shown >= q.count) player.tell('§a§l  ✔ Ready! §r§aTalk to the Questmaster or type §f/quest claim')
  else player.tell('§8  Progress only counts in the RPG world.')
  player.tell('§8§m                                                ')
}

function giveRewards(player, q) {
  const name = player.username
  if (q.rewards.money) run(player, MONEY_CMD.replace('{player}', name).replace('{amount}', String(q.rewards.money)))
  if (q.rewards.xp) run(player, 'xp add ' + name + ' ' + q.rewards.xp + ' levels')
  const items = q.rewards.items || []
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    let id = it[0]
    let count = it[1]
    if (!idExists('item', id)) {
      if (!it[2]) continue
      const fb = it[2].split(' ')
      id = fb[0]
      count = Number(fb[1] || 1)
    }
    run(player, 'give ' + name + ' ' + id + ' ' + count)
  }
}

function completeQuest(player, q) {
  const index = getIndex(player)
  giveRewards(player, q)
  setState(player, index + 1, 0)
  const name = player.username
  run(player, 'playsound minecraft:ui.toast.challenge_complete master ' + name)
  run(player, 'title ' + name + ' times 10 60 20')
  run(player, 'title ' + name + ' subtitle {"text":"' + q.title.replace(/"/g, '\\"') + '","color":"gray"}')
  run(player, 'title ' + name + ' title {"text":"QUEST COMPLETE","color":"gold","bold":true}')
  player.tell('§6§l✦ Quest ' + (index + 1) + ' complete! §r§7Rewards added to your inventory.')
  if (q.milestone) {
    const nextCh = index + 1 < QUESTS.length ? chapterOf(index + 1) : null
    run(player, 'tellraw @a ["",{"text":"[Hunter Association] ","color":"dark_red","bold":true},{"text":"' + name + '","color":"gold"},{"text":" has passed ","color":"gray"},{"text":"' + q.title.replace(/"/g, '\\"') + '","color":"yellow"},{"text":"!","color":"gray"}]')
    if (nextCh && chapterOf(index).name !== nextCh.name) player.tell(nextCh.color + '§l✦ New chapter unlocked: ' + nextCh.name)
  }
  if (q.final) {
    run(player, 'tellraw @a ["",{"text":"✦ ","color":"gold"},{"text":"' + name + '","color":"gold","bold":true},{"text":" has completed ALL 100 QUESTS and earned the title of OVERTHRONE! ","color":"yellow"},{"text":"✦","color":"gold"}]')
    run(player, 'playsound minecraft:ui.toast.challenge_complete master @a')
  }
  if (getIndex(player) < QUESTS.length) player.tell('§7Type §f/quest §7to see your next quest.')
}

function claim(player) {
  const q = currentQuest(player)
  if (!q) { showQuest(player); return }
  if (!inRpg(player)) {
    player.tell('§cYou can only claim quest rewards in the RPG world. §7Type §f/rpg §7to go there.')
    return
  }
  if (q.type === 'deliver') {
    const have = countInInventory(player, q.target)
    if (have < q.count) {
      player.tell('§cYou need §f' + q.count + 'x ' + prettyId(q.target) + '§c in your inventory. §7(You have ' + have + ')')
      return
    }
    takeFromInventory(player, q.target, q.count)
    completeQuest(player, q)
    return
  }
  if (getProg(player) < q.count) {
    player.tell('§cNot finished yet: §f' + getProg(player) + '/' + q.count + ' §7- ' + objectiveText(q))
    return
  }
  completeQuest(player, q)
}

function addProgress(player, type, matches, amount) {
  if (!player || !inRpg(player)) return
  const q = currentQuest(player)
  if (!q || q.type !== type || !matches(q.target)) return
  const before = getProg(player)
  if (before >= q.count) return
  const now = Math.min(q.count, before + amount)
  player.persistentData.putInt(KEY_PROG, now)
  const name = player.username
  if (now >= q.count) {
    run(player, 'playsound minecraft:entity.player.levelup master ' + name)
    player.tell('§a§l✔ Quest objective complete: §r§f' + q.title + ' §7- talk to the Questmaster or type §f/quest claim')
  } else {
    run(player, 'title ' + name + ' actionbar {"text":"' + q.title.replace(/"/g, '\\"') + ': ' + now + '/' + q.count + '","color":"yellow"}')
  }
}

// ------------------------------------------------------------------ progress events
EntityEvents.death(event => {
  const src = event.source
  let player = src ? src.player : null
  if (!player && src && src.actual && src.actual.isPlayer && src.actual.isPlayer()) player = src.actual
  if (!player) return
  const type = String(event.entity.type)
  addProgress(player, 'kill', (t) => t === type, 1)
})

BlockEvents.placed(event => {
  if (!event.player) return
  const b = event.block
  placedBlocks[dimensionId(event.level) + ':' + b.x + ',' + b.y + ',' + b.z] = true
})

BlockEvents.broken(event => {
  const player = event.player
  if (!player) return
  const b = event.block
  const key = dimensionId(event.level) + ':' + b.x + ',' + b.y + ',' + b.z
  if (placedBlocks[key]) { delete placedBlocks[key]; return }
  const id = String(b.id)
  addProgress(player, 'mine', (t) => (t.charAt(0) === '#' ? b.hasTag(t.substring(1)) : t === id), 1)
})

ItemEvents.crafted(event => {
  const player = event.player
  if (!player) return
  const id = String(event.item.id)
  addProgress(player, 'craft', (t) => t === id, Math.max(1, event.item.count))
})

// ------------------------------------------------------------------ commands
ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event

  event.register(
    Commands.literal('quest')
      .executes(ctx => { const p = ctx.source.player; if (p) showQuest(p); return 1 })
      .then(Commands.literal('claim').executes(ctx => { const p = ctx.source.player; if (p) claim(p); return 1 }))
      .then(Commands.literal('list').executes(ctx => {
        const p = ctx.source.player
        if (!p) return 0
        const done = Math.min(getIndex(p), QUESTS.length)
        p.tell('§8§m                                                ')
        p.tell('§6§l  HUNTER ASSOCIATION QUEST BOARD §r§7(' + done + '/100)')
        for (let i = 0; i < CHAPTERS.length; i++) {
          const from = CHAPTERS[i].from
          const to = i + 1 < CHAPTERS.length ? CHAPTERS[i + 1].from - 1 : QUESTS.length
          const chDone = Math.max(0, Math.min(done, to) - (from - 1))
          const total = to - from + 1
          const mark = chDone >= total ? '§a✔' : chDone > 0 ? '§e➤' : '§8✖'
          p.tell('  ' + mark + ' ' + CHAPTERS[i].color + CHAPTERS[i].name + ' §7' + chDone + '/' + total)
        }
        p.tell('§8§m                                                ')
        return 1
      }))
  )

  // Admin commands. They act on whoever runs them; to target another player use:
  //   /execute as <player> run questadmin set 25
  // (No argument types are used, so this works on every KubeJS version.)
  try {
    const admin = Commands.literal('questadmin').requires(src => src.hasPermission(2))
    admin.then(Commands.literal('check').executes(ctx => {
      const out = []
      for (let i = 0; i < QUESTS.length; i++) {
        const q = QUESTS[i]
        if (!questValid(q)) out.push('§cQuest ' + (i + 1) + ' (' + q.title + '): ' + q.target + ' not found - will be skipped')
        const items = q.rewards.items || []
        for (let j = 0; j < items.length; j++) {
          if (!idExists('item', items[j][0])) out.push('§eQuest ' + (i + 1) + ': reward ' + items[j][0].split('[')[0] + ' not found - ' + (items[j][2] ? 'gives ' + items[j][2] + ' instead' : 'skipped'))
        }
      }
      const p = ctx.source.player
      const say = (m) => { if (p) p.tell(m); else console.info(m.replace(/§./g, '')) }
      say(out.length ? '§6Quest check found ' + out.length + ' issue(s):' : '§aAll 100 quests and rewards are valid for this modpack.')
      for (let i = 0; i < out.length; i++) say(out[i])
      return 1
    }))
    admin.then(Commands.literal('reset').executes(ctx => {
      const p = ctx.source.player
      if (!p) return 0
      setState(p, 0, 0)
      p.tell('§aQuest progress reset to quest 1.')
      return 1
    }))
    const setNode = Commands.literal('set')
    for (let n = 1; n <= QUESTS.length + 1; n++) {
      const num = n
      setNode.then(Commands.literal(String(num)).executes(ctx => {
        const p = ctx.source.player
        if (!p) return 0
        setState(p, num - 1, 0)
        p.tell('§aMoved to quest ' + num + '. §7Type §f/quest')
        return 1
      }))
    }
    admin.then(setNode)
    admin.then(Commands.literal('complete').executes(ctx => {   // finish the current objective (for testing)
      const p = ctx.source.player
      const q = p ? currentQuest(p) : null
      if (!q) return 0
      p.persistentData.putInt(KEY_PROG, q.count)
      p.tell('§aObjective marked complete. §7Type §f/quest claim')
      return 1
    }))
    event.register(admin)
  } catch (e) {
    console.error('[OVERTHRONE quests] admin commands failed to register: ' + e)
  }
})
