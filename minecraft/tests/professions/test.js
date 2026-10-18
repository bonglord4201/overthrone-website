// Simulates professions.js nodes: a node gathered, its area unloads before the timer ends, then loads again.
// Expect: the block comes back once loaded, exactly one floating text, and its text counts down / resets.
const fs = require('fs')
const src = fs.readFileSync(process.argv[2], 'utf8')
const H = { tick: [], loaded: [], left: [] }
let NOW = 1_000_000_000_000; Date.now = () => NOW
let uidc = 0, loadedArea = true
const blocks = {}
class Ent {
  constructor(type, x, y, z) { this.type = type; this.x = x; this.y = y; this.z = z; this.tags = new Set(); this.uuid = 'u' + (++uidc); this.text = null }
  getEncodeId() { return this.type }
  getTags() { const t = this.tags; return { contains: x => t.has(x), forEach: f => [...t].forEach(f) } }
  getStringUuid() { return this.uuid } discard() { level.ents = level.ents.filter(e => e !== this) }
}
const level = { ents: [], dimension: 'multiworld:rpg', getAllEntities() { const a = loadedArea ? this.ents.slice() : []; return { forEach: f => a.forEach(f) } },
  isPositionEntityTicking() { return loadedArea }, isLoaded() { return loadedArea }, players() { return { forEach() { } } } }
const cmds = [], pdata = {}
const server = { tickCount: 0, persistentData: { getString: k => pdata[k] || '', putString: (k, v) => pdata[k] = v },
  getAllLevels() { return { forEach: f => f(level) } }, scheduleInTicks(n, f) { f() },
  runCommandSilent(c) {
    cmds.push(c); let m
    if (!loadedArea) return
    if ((m = c.match(/run summon minecraft:text_display (\S+) (\S+) (\S+) \{Tags:\[([^\]]*)\].*text:'(.*)'\}$/))) { const e = new Ent('minecraft:text_display', +m[1], +m[2], +m[3]); m[4].split(',').forEach(t => e.tags.add(t.replace(/"/g, ''))); e.text = m[5]; level.ents.push(e) }
    if ((m = c.match(/kill @e\[type=minecraft:text_display,tag=(\S+)\]$/))) level.ents.filter(e => e.tags.has(m[1])).forEach(e => e.discard())
    if ((m = c.match(/^data merge entity (u\d+) \{text:'(.*)'\}$/))) { const e = level.ents.find(x => x.uuid == m[1]); if (e) e.text = m[2] }
    if ((m = c.match(/^execute in \S+ (?:if block (\S+) (\S+) (\S+) (\S+) )?run setblock (\S+) (\S+) (\S+) (\S+)$/))) {
      const k = m[5] + ',' + m[6] + ',' + m[7]
      if (m[1] && (blocks[m[1] + ',' + m[2] + ',' + m[3]] || 'minecraft:air') != m[4]) return
      blocks[k] = m[8]
    }
  } }
global.Java = { loadClass: n => { if (n == 'net.minecraft.core.BlockPos') return function () { }; return {} } }
global.ServerEvents = { tick: f => H.tick.push(f), loaded: f => H.loaded.push(f), commandRegistry: () => { } }
global.EntityEvents = { death: () => { } }
global.PlayerEvents = { loggedIn: () => { }, respawned: () => { } }
global.BlockEvents = { leftClicked: f => H.left.push(f), broken: () => { } }
global.Text = { of: x => x }
eval(src)
const tick = () => { NOW += 1000; server.tickCount += 20; H.tick.forEach(f => f({ server })) }
const key = 'multiworld:rpg|5|60|5'
pdata['ot_nodes'] = JSON.stringify({ [key]: { dim: 'multiworld:rpg', x: 5, y: 60, z: 5, state: 'minecraft:stone', prof: 'mining', lvl: 1, xp: 10, name: 'stone' } })
blocks['5,60,5'] = 'minecraft:stone'
// two stale copies left by the old version, one frozen at 36s
for (let i = 0; i < 2; i++) { const e = new Ent('minecraft:text_display', 5.5, 61.5, 5.5); e.tags.add('ot_node'); e.tags.add('ot_node_x'); level.ents.push(e) }
H.loaded.forEach(f => f({ server }))
tick()
const holos = () => level.ents.filter(e => e.type == 'minecraft:text_display')
console.log('start: texts', holos().length, '(orphans removed, one for the node)')
const p = { username: 'Bob', server, isCreative: () => false, persistentData: { getInt: () => 1, putInt() { } }, tell() { } }
for (let i = 0; i < 3; i++) { NOW += 300; H.left.forEach(f => f({ player: p, block: { level, x: 5, y: 60, z: 5, id: 'minecraft:stone' }, cancel() { } })) }
tick()
console.log('gathered: block', blocks['5,60,5'], '| text:', /Respawns in/.test(holos()[0].text) ? holos()[0].text.match(/Respawns in \d+s/)[0] : holos()[0].text)
for (let i = 0; i < 20; i++) tick()
console.log('20s later:', holos()[0].text.match(/Respawns in \d+s/)[0])
loadedArea = false
for (let i = 0; i < 60; i++) tick()
loadedArea = true
tick(); tick()
console.log('area reloaded after timer ended: block', blocks['5,60,5'], '| texts', holos().length, '| text ready:', /Hit 3x/.test(holos()[0].text))
// a node stuck empty by the old bug (no timer) heals itself
blocks['5,60,5'] = 'minecraft:air'
for (let i = 0; i < 5; i++) tick()
console.log('stuck empty node healed:', blocks['5,60,5'])
