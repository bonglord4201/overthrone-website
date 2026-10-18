// Simulates grief_guard.js: skill breaks (far away / several in one tick) are cancelled, a normal hand break isn't,
// fire blocks are cleared around players in the hub/RPG World only.
const fs = require('fs'); const src = fs.readFileSync(process.argv[2], 'utf8')
const H = { native: {}, tick: [], spawned: [] }
global.NativeEvents = { onEvent: (c, f) => { H.native[c] = f } }
global.EntityEvents = { spawned: (t, f) => H.spawned.push(f) }
global.ServerEvents = { tick: f => H.tick.push(f), commandRegistry: () => { } }
global.Text = { of: x => x }
const blocks = [{ path: 'tensura:black_fire', rep: true, empty: true }, { path: 'tensura:magic_ore', rep: false, empty: false }, { path: 'somemod:campfire', rep: false, empty: false }, { path: 'minecraft:fire', rep: true, empty: true }]
global.Java = { loadClass: n => {
  if (n.endsWith('BuiltInRegistries')) return { BLOCK: { keySet: () => blocks.map(b => b.path), get: id => { const b = blocks.find(x => x.path == id); return { defaultBlockState: () => ({ canBeReplaced: () => b.rep, getCollisionShape: () => ({ isEmpty: () => b.empty }) }) } } } }
  if (n.endsWith('EmptyBlockGetter')) return { INSTANCE: {} }
  if (n.endsWith('BlockPos')) return { ZERO: {} }
  throw 'no ' + n } }
eval(src)
const cmds = []
const hub = { dimension: 'multiworld:hub' }, smp = { dimension: 'multiworld:wild' }
const player = { username: 'Sk', getX: () => 0, getY: () => 64, getZ: () => 0, level: hub }
const server = { tickCount: 0, players: [player], runCommandSilent: c => { cmds.push(c); return /black_fire/.test(c) ? 3 : 0 } }
const tick = () => { server.tickCount++; H.tick.forEach(f => f({ server })) }
const brk = (level, x, y, z) => { let c = false; H.native['net.neoforged.neoforge.event.level.BlockEvent$BreakEvent']({ getLevel: () => level, getPlayer: () => player, getPos: () => ({ getX: () => x, getY: () => y, getZ: () => z }), setCanceled: v => c = v }); return c }
tick()
console.log('hand break 2 blocks away cancelled?', brk(hub, 2, 65, 0))
tick()
console.log('skill break 20 blocks away cancelled?', brk(hub, 20, 64, 0))
tick()
console.log('2 breaks in the same tick: first', brk(hub, 1, 64, 0), 'second', brk(hub, 1, 64, 1))
console.log('far break in the SMP world cancelled?', brk(smp, 20, 64, 0))
for (let i = 0; i < 40; i++) tick()
console.log('fire commands:', cmds.filter(c => /fill/.test(c)))
player.level = smp; cmds.length = 0; for (let i = 0; i < 40; i++) tick()
console.log('in SMP world fire commands:', cmds.length)
