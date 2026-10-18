const T = require('./harness.js')
const { level, server, Ent, tick, pdata } = T
// an orc spawn, plus 20 High Orcs piled up around it (not the spawn's type, untracked), a player's pet and a named mob
const g = new Ent('tensura:orc', 10, 60, 10, ['ot_spawn', 'ot_sp_o1']); level.ents.push(g)
pdata['ot_spawns'] = JSON.stringify({ o1: { type: 'tensura:orc', key: 'k', kind: 'mob', mins: 1, dim: 'multiworld:rpg', x: 10, y: 60, z: 10, h: 2.6, uuid: g.uuid, down: 0 } })
for (let i = 0; i < 20; i++) { const e = new Ent('tensura:high_orc', 12 + i % 5, 60, 12); e.tickCount = i * 100; level.ents.push(e) }
const pet = new Ent('tensura:high_orc', 11, 60, 11); pet.getOwnerUUID = () => 'p1'; level.ents.push(pet)
const named = new Ent('tensura:high_orc', 11, 60, 11); named.hasCustomName = () => true; level.ents.push(named)
const leftover = new Ent('tensura:orc', 13, 60, 13, ['ot_spawn', 'ot_sp_o1']); level.ents.push(leftover)
const far = new Ent('tensura:high_orc', 200, 60, 200); level.ents.push(far)
server.getPlayerList = () => ({ getPlayer: u => u == 'p1' ? {} : null })
T.H.loaded.forEach(f => f({ server }))
for (let i = 0; i < 6; i++) tick()
const ho = level.ents.filter(e => e.type == 'tensura:high_orc')
console.log('high orcs left:', ho.length, '(8 loose + pet + named + far) | pet kept:', level.ents.includes(pet), '| named kept:', level.ents.includes(named),
  '| far one kept:', level.ents.includes(far), '| tracked orc kept:', level.ents.includes(g), '| old-tag leftover removed:', !level.ents.includes(leftover))
