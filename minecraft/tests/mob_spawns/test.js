const T = require('./harness.js')
const { level, server, Ent, tick, pdata } = T
const holos = (tag) => level.ents.filter(e => e.type == 'minecraft:text_display' && (!tag || e.tags.has(tag)))
const mobs = (type) => level.ents.filter(e => e.type == type)
// a saved spawn: goblin archer, alive
const g = new Ent('tensura:goblin_archer', 10, 60, 10, ['ot_spawn', 'ot_sp_a1']); level.ents.push(g)
// stale duplicate holos left by old version (3 copies) + an orphan from a deleted spawn
for (let i = 0; i < 3; i++) { const h = new Ent('minecraft:text_display', 10, 62.6, 10, ['ot_spawnholo', 'ot_sp_a1']); level.ents.push(h) }
level.ents.push(new Ent('minecraft:text_display', 50, 62, 50, ['ot_spawnholo', 'ot_sp_dead']))
pdata['ot_spawns'] = JSON.stringify({ a1: { type: 'tensura:goblin_archer', key: 'entity.tensura.goblin_archer', kind: 'mob', mins: 2, dim: 'multiworld:rpg', x: 10, y: 60, z: 10, h: 2.6, uuid: g.uuid, down: 0 },
  a2: { type: 'tensura:goblin_archer', key: 'entity.tensura.goblin_archer', kind: 'mob', mins: 2, dim: 'multiworld:rpg', x: 10.3, y: 60, z: 10.2, h: 2.6, uuid: null, down: 0 } })
T.H.loaded.forEach(f => f({ server }))
tick()
console.log('spawns after merge:', Object.keys(JSON.parse(pdata['ot_spawns'])))
console.log('holos for a1:', holos('ot_sp_a1').length, '| orphan left:', holos('ot_sp_dead').length, '| text:', holos('ot_sp_a1')[0].text.slice(0, 60))
// kill the goblin -> timer counts down every second on the ONE holo
g.alive = false; level.ents = level.ents.filter(e => e !== g)
T.H.death.forEach(f => f({ entity: Object.assign(g, { level: { server } }), source: { getPlayer: () => null } }))
let seen = []
for (let i = 0; i < 4; i++) { tick(); seen.push((holos('ot_sp_a1')[0].text.match(/Respawns in ([0-9:]+)/) || [])[1]) }
console.log('countdown:', seen.join(' '), '| holos:', holos('ot_sp_a1').length)
// run to respawn; make summon land 3 blocks away (pushed) -> must adopt, no repeated summons
for (let i = 0; i < 125; i++) tick()
console.log('goblins alive:', mobs('tensura:goblin_archer').length, '| holos:', holos('ot_sp_a1').length, '| text:', holos('ot_sp_a1')[0].text.slice(0, 70))
for (let i = 0; i < 120; i++) tick()
console.log('after 2 more min goblins:', mobs('tensura:goblin_archer').length, '| holos:', holos().length)
// area unloaded while a stale copy appears, then loaded again
T.setLoaded(false); tick(); level.ents.push(new Ent('minecraft:text_display', 10, 62.6, 10, ['ot_spawnholo', 'ot_sp_a1'])); T.setLoaded(true); tick()
console.log('after reload copy -> holos:', holos('ot_sp_a1').length)
