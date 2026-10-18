const T = require('./harness.js')
const { level, server, Ent, tick, pdata } = T
const holos = (tag) => level.ents.filter(e => e.type == 'minecraft:text_display' && (!tag || e.tags.has(tag)))
pdata['ot_spawns'] = JSON.stringify({ b1: { type: 'x:boss1', key: 'k1', kind: 'boss', mins: 5, dim: 'multiworld:rpg', x: 0, y: 60, z: 0, h: 3, uuid: null, down: 0, dormant: true, group: 'g1' },
  b2: { type: 'x:boss2', key: 'k2', kind: 'boss', mins: 5, dim: 'multiworld:rpg', x: 0, y: 60, z: 1, h: 3, uuid: null, down: 0, dormant: true, group: 'g1' } })
pdata['ot_spawn_groups'] = JSON.stringify({ g1: { dim: 'multiworld:rpg', x: 0, y: 64, z: 0, mins: 1, members: ['b1', 'b2'], queue: [], down: T.now() + 3000 } })
level.ents.push(new Ent('minecraft:text_display', 0, 64, 0, ['ot_spawnholo', 'ot_grp_g1']), new Ent('minecraft:text_display', 0, 64, 0, ['ot_spawnholo', 'ot_grp_g1']), new Ent('minecraft:text_display', 0, 63, 0, ['ot_spawnholo', 'ot_sp_b1']))
T.H.loaded.forEach(f => f({ server }))
tick()
console.log('waiting: group texts', holos('ot_grp_g1').length, '| boss texts', holos('ot_sp_b1').length + holos('ot_sp_b2').length, '|', (holos('ot_grp_g1')[0].text.match(/Arrives in ([0-9:]+)/) || [])[1])
for (let i = 0; i < 5; i++) tick()
const out = level.ents.filter(e => e.type.startsWith('x:boss'))
console.log('boss out:', out.map(e => e.type).join(','), '| group texts', holos('ot_grp_g1').length, '| boss texts', holos('ot_sp_b1').length + holos('ot_sp_b2').length)
