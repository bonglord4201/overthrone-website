const T = require('./harness.js')
const { level, server, Ent, tick, pdata, cmds } = T
const holos = (tag) => level.ents.filter(e => e.type == 'minecraft:text_display' && (!tag || e.tags.has(tag)))
const mobs = (type) => level.ents.filter(e => e.type == type)
// push every summoned mob 3 blocks away (crowd)
const orig = server.runCommandSilent
server.runCommandSilent = (c) => { orig(c); const m = c.match(/run summon (tensura:\S+)/); if (m) { const e = level.ents[level.ents.length - 1]; e.x += 3 } }
// wild old goblin 15 blocks away
const wild = new Ent('tensura:goblin_archer', 25, 60, 10); wild.tickCount = 5000; level.ents.push(wild)
pdata['ot_spawns'] = JSON.stringify({ a1: { type: 'tensura:goblin_archer', key: 'k', kind: 'mob', mins: 1, dim: 'multiworld:rpg', x: 10, y: 60, z: 10, h: 2.6, uuid: null, down: 1 } })
T.H.loaded.forEach(f => f({ server }))
for (let i = 0; i < 90; i++) tick()
const summons = cmds.filter(c => /summon tensura/.test(c)).length
const tagged = mobs('tensura:goblin_archer').filter(e => e.tags.has('ot_sp_a1'))
console.log('summons:', summons, '| goblins:', mobs('tensura:goblin_archer').length, '| tagged:', tagged.length, '| wild one adopted?', wild.tags.has('ot_sp_a1'), '| holos:', holos().length)
// rotation: two bosses, group waiting -> exactly one "Random Boss" text, no boss texts
pdata['ot_spawns'] = JSON.stringify({ b1: { type: 'x:boss1', key: 'k1', kind: 'boss', mins: 5, dim: 'multiworld:rpg', x: 0, y: 60, z: 0, h: 3, uuid: null, down: 0, dormant: true, group: 'g1' },
  b2: { type: 'x:boss2', key: 'k2', kind: 'boss', mins: 5, dim: 'multiworld:rpg', x: 0, y: 60, z: 1, h: 3, uuid: null, down: 0, dormant: true, group: 'g1' } })
pdata['ot_spawn_groups'] = JSON.stringify({ g1: { dim: 'multiworld:rpg', x: 0, y: 64, z: 0, mins: 1, members: ['b1', 'b2'], queue: [], down: T.now() + 5000 } })
