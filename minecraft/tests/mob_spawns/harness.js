const fs = require('fs')
const src = fs.readFileSync(process.argv[2], 'utf8')
const H = { tick: [], loaded: [], death: [] }
let NOW = 1_000_000_000_000
Date.now = () => NOW
let uidc = 0
class Ent {
  constructor(type, x, y, z, tags = []) { this.type = type; this.x = x; this.y = y; this.z = z; this.tags = new Set(tags); this.alive = true; this.uuid = 'u' + (++uidc); this.tickCount = 0; this.pd = {}; this.text = null }
  getEncodeId() { return this.type } isLiving() { return this.type != 'minecraft:text_display' } isAlive() { return this.alive } isPlayer() { return false }
  getTags() { const t = this.tags; return { contains: (x) => t.has(x), forEach: (f) => [...t].forEach(f) } }
  addTag(t) { this.tags.add(t) } removeTag(t) { this.tags.delete(t) }
  getX() { return this.x } getY() { return this.y } getZ() { return this.z }
  getStringUuid() { return this.uuid } discard() { this.alive = false; level.ents = level.ents.filter(e => e !== this) }
  kill() { this.discard() } setPersistenceRequired() { } teleportTo(x, y, z) { this.x = x; this.y = y; this.z = z }
  get persistentData() { const pd = this.pd; return { getString: k => pd[k] || '', putString: (k, v) => pd[k] = v } }
  getMaxHealth() { return 20 } getHealth() { return 20 } setHealth() { } getBbHeight() { return 2 }
}
const level = { ents: [], dimension: 'multiworld:rpg', getAllEntities() { const a = this.ents.slice(); return { forEach: f => a.forEach(f) } },
  getEntity(u) { return this.ents.find(e => e.uuid == String(u)) || null }, isPositionEntityTicking() { return loadedArea },
  getChunkSource() { return { hasChunk: () => loadedArea } }, players() { return { forEach() { } } } }
let loadedArea = true
const cmds = []
const pdata = {}
const server = { tickCount: 0, persistentData: { getString: k => pdata[k] || '', putString: (k, v) => pdata[k] = v },
  getAllLevels() { return { forEach: f => f(level) } },
  runCommandSilent(c) {
    cmds.push(c)
    let m = c.match(/run summon (\S+) (\S+) (\S+) (\S+)(?: (\{.*))?$/)
    if (m && loadedArea) { const e = new Ent(m[1], +m[2], +m[3], +m[4]); if (m[1] == 'minecraft:text_display') { (m[5].match(/Tags:\[([^\]]*)\]/)[1]).split(',').forEach(t => e.addTag(t.replace(/"/g, ''))); e.text = 'summoned' } level.ents.push(e) }
    m = c.match(/run kill @e\[type=minecraft:text_display,tag=(\S+)\]$/)
    if (m && loadedArea) level.ents.filter(e => e.type == 'minecraft:text_display' && e.tags.has(m[1])).forEach(e => e.discard())
    m = c.match(/^data merge entity (u\d+) \{text:'(.*)'\}$/)
    if (m) { const e = level.getEntity(m[1]); if (e) e.text = m[2] }
  } }
global.Java = { loadClass: (n) => { if (n == 'java.util.UUID') return { fromString: s => s }; if (n == 'net.minecraft.core.BlockPos') return function () { }; throw new Error('no ' + n) } }
global.ServerEvents = { tick: f => H.tick.push(f), loaded: f => H.loaded.push(f), commandRegistry: () => { } }
global.EntityEvents = { death: f => H.death.push(f) }
global.Text = { of: x => x }
eval(src)
const tick = () => { NOW += 1000; server.tickCount += 20; level.ents.forEach(e => e.tickCount += 20); H.tick.forEach(f => f({ server })) }
module.exports = { H, level, server, Ent, tick, cmds, pdata, setLoaded: v => loadedArea = v, now: () => NOW }
