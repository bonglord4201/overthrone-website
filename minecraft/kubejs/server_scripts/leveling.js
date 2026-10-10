// OVERTHRONE - player levels 1 to 5000.
// Drop into kubejs/server_scripts/ and run /reload (or restart).
//
// XP for the next level = 150 + 18*level + 0.002*level^2  (level 300 ~ 160h of real play, 5000 ~ 2800h)
// XP comes from killing mobs, mining ores, a daily login bonus, and quest rewards (/level xp give ...).
// Mob and ore XP has a per-minute cap so mob farms and AFK setups can't power-level.
//
// HUD: every player's numbers are mirrored to vanilla scoreboard objectives, so any HUD/scoreboard mod can show them:
//   ot_level   current level            ot_xp      XP into the current level
//   ot_xpneed  XP needed for next level  ot_xppct   progress to next level, 0-100
//
// Players:  /level                       your level and progress
//           /level info <player>         someone else's level
// Staff:    /level set <player> <level>
//           /level xp give|take <player> <amount>     (use "give" as an FTB Quests command reward)
//           /level reset <player>

const MAX_LEVEL = 5000
const need = (lvl) => Math.floor(150 + 18 * lvl + 0.002 * lvl * lvl)

// Realms locked behind a level. Put the realm dimension IDs here, e.g. 'mymod:ashen_realm': 300
// (stand in the realm and run /execute in ... or check F3 to see its ID).
const REALM_LOCKS = {
  // 'modid:realm_one': 300,
  // 'modid:realm_two': 300,
}
const REALM_XP_MULT = 2   // XP multiplier inside the locked realms (tougher mobs)

// Commands run on reaching a milestone. {player} is replaced with the player's name.
const MILESTONES = {
  100: ['tellraw @a ["",{"text":"✦ ","color":"gold"},{"text":"{player}","color":"yellow"},{"text":" reached ","color":"gray"},{"text":"Level 100","color":"gold","bold":true}]'],
  300: [
    'tellraw @a ["",{"text":"✦ ","color":"dark_red"},{"text":"{player}","color":"red","bold":true},{"text":" has broken the Seal. ","color":"gray"},{"text":"The Realms are open to them.","color":"gold"}]',
    'title {player} subtitle {"text":"The Realms are now open to you","color":"gold"}',
    'execute at {player} run summon minecraft:firework_rocket ~ ~1 ~ {LifeTime:20,FireworksItem:{id:"minecraft:firework_rocket",count:1,components:{"minecraft:fireworks":{explosions:[{shape:"large_ball",colors:[I;14688826,15909198],has_trail:1b}]}}}}',
  ],
  1000: ['tellraw @a ["",{"text":"✦ ","color":"gold"},{"text":"{player}","color":"yellow","bold":true},{"text":" reached ","color":"gray"},{"text":"Level 1000","color":"gold","bold":true}]'],
  5000: ['tellraw @a ["",{"text":"👑 ","color":"gold"},{"text":"{player}","color":"gold","bold":true},{"text":" has reached the MAX LEVEL: 5000","color":"yellow"}]'],
}

// ---------------------------------------------------------------- storage
const K_LVL = 'ot_level', K_XP = 'ot_xp', K_WIN = 'ot_xp_window', K_WAMT = 'ot_xp_window_amt', K_DAY = 'ot_xp_daily'

const getLvl = (p) => Math.max(1, p.persistentData.getInt(K_LVL) || 1)
const getXp = (p) => p.persistentData.getInt(K_XP) || 0

const syncScores = (p) => {
  const lvl = getLvl(p), xp = getXp(p)
  const nd = lvl >= MAX_LEVEL ? 0 : need(lvl)
  const pct = lvl >= MAX_LEVEL ? 100 : Math.floor(xp * 100 / nd)
  const s = p.server, n = p.username
  s.runCommandSilent(`scoreboard players set ${n} ot_level ${lvl}`)
  s.runCommandSilent(`scoreboard players set ${n} ot_xp ${xp}`)
  s.runCommandSilent(`scoreboard players set ${n} ot_xpneed ${nd}`)
  s.runCommandSilent(`scoreboard players set ${n} ot_xppct ${pct}`)
}

const runMilestone = (p, lvl) => {
  const cmds = MILESTONES[lvl]
  if (!cmds) return
  cmds.forEach(c => p.server.runCommandSilent(c.split('{player}').join(p.username)))
}

const setLevel = (p, lvl, xp) => {
  p.persistentData.putInt(K_LVL, Math.min(MAX_LEVEL, Math.max(1, lvl)))
  p.persistentData.putInt(K_XP, Math.max(0, xp || 0))
  syncScores(p)
}

// Adds XP and handles level-ups. Returns the XP actually added.
const addXp = (p, amount) => {
  amount = Math.floor(amount)
  if (amount <= 0) return 0
  let lvl = getLvl(p)
  if (lvl >= MAX_LEVEL) return 0
  let xp = getXp(p) + amount
  const start = lvl
  while (lvl < MAX_LEVEL && xp >= need(lvl)) {
    xp -= need(lvl); lvl++
    runMilestone(p, lvl)
  }
  if (lvl >= MAX_LEVEL) xp = 0
  setLevel(p, lvl, xp)
  if (lvl > start) {
    const n = p.username
    p.server.runCommandSilent(`title ${n} times 5 40 15`)
    p.server.runCommandSilent(`title ${n} title {"text":"LEVEL ${lvl}","color":"gold","bold":true}`)
    p.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${n} ~ ~ ~ 1 0.8`)
    p.tell(`§6✦ Level up! §eYou are now level §6§l${lvl}§e.`)
    const nextLock = Object.keys(REALM_LOCKS).map(k => REALM_LOCKS[k]).filter(l => l > lvl).sort((a, b) => a - b)[0]
    if (nextLock && nextLock - lvl <= 20) p.tell(`§8✦ §7The Realms open at level §c${nextLock}§7: §c${nextLock - lvl}§7 to go.`)
  } else {
    p.server.runCommandSilent(`title ${p.username} actionbar {"text":"+${amount} XP  (${xp} / ${need(lvl)})","color":"yellow"}`)
  }
  return amount
}

// Gameplay XP (mobs, ores) goes through a per-minute cap: about 3x the normal earning rate for the level.
const capPerMinute = (lvl) => Math.floor((2000 + 20 * lvl) / 60 * 3) * REALM_XP_MULT
const addCapped = (p, amount) => {
  const now = Date.now()
  if (now - p.persistentData.getDouble(K_WIN) > 60000) {
    p.persistentData.putDouble(K_WIN, now); p.persistentData.putInt(K_WAMT, 0)
  }
  const used = p.persistentData.getInt(K_WAMT)
  const allowed = Math.max(0, Math.min(Math.floor(amount), capPerMinute(getLvl(p)) - used))
  if (allowed <= 0) return 0
  p.persistentData.putInt(K_WAMT, used + allowed)
  return addXp(p, allowed)
}

const dimOf = (p) => String(p.level.dimension)
const realmMult = (p) => (REALM_LOCKS[dimOf(p)] !== undefined ? REALM_XP_MULT : 1)

// ---------------------------------------------------------------- XP sources
EntityEvents.death(event => {
  const e = event.entity
  if (!e || e.isPlayer()) return
  let p = null
  try { p = event.source.player } catch (err) { p = null }
  if (!p || !p.isPlayer || !p.isPlayer()) return
  let hp = 0
  try { hp = e.maxHealth } catch (err) { hp = 0 }
  if (!hp || hp <= 0) return
  // 0.5 XP per point of max health; bosses (150+ health) get 2 XP per point.
  if (hp >= 150) addXp(p, hp * 2 * realmMult(p))       // bosses: full XP, never capped
  else addCapped(p, Math.max(1, hp * 0.5) * realmMult(p))
})

const ORE_XP = {
  'minecraft:coal_ore': 2, 'minecraft:deepslate_coal_ore': 2,
  'minecraft:copper_ore': 2, 'minecraft:deepslate_copper_ore': 2,
  'minecraft:iron_ore': 3, 'minecraft:deepslate_iron_ore': 3,
  'minecraft:gold_ore': 4, 'minecraft:deepslate_gold_ore': 4, 'minecraft:nether_gold_ore': 2,
  'minecraft:redstone_ore': 3, 'minecraft:deepslate_redstone_ore': 3,
  'minecraft:lapis_ore': 4, 'minecraft:deepslate_lapis_ore': 4, 'minecraft:nether_quartz_ore': 2,
  'minecraft:diamond_ore': 12, 'minecraft:deepslate_diamond_ore': 12,
  'minecraft:emerald_ore': 14, 'minecraft:deepslate_emerald_ore': 14,
  'minecraft:ancient_debris': 25,
}
BlockEvents.broken(event => {
  const p = event.player
  if (!p || p.isCreative()) return
  const id = String(event.block.id)
  let xp = ORE_XP[id]
  if (xp === undefined && (id.endsWith('_ore') || event.block.hasTag('c:ores'))) xp = 3   // modded ores
  if (!xp) return
  addCapped(p, xp * realmMult(p))
})

// Daily first login: 200 + 5 per level.
PlayerEvents.loggedIn(event => {
  const p = event.player
  const today = new Date().toISOString().slice(0, 10)
  if (p.persistentData.getString(K_DAY) !== today) {
    p.persistentData.putString(K_DAY, today)
    const bonus = 200 + 5 * getLvl(p)
    p.tell(`§6✦ Daily login bonus: §e+${bonus} XP`)
    addXp(p, bonus)
  }
  syncScores(p)
})

// ---------------------------------------------------------------- realm locks
PlayerEvents.tick(event => {
  const p = event.player
  if (p.server.tickCount % 40 !== 0) return
  const req = REALM_LOCKS[dimOf(p)]
  if (req === undefined || getLvl(p) >= req || p.hasPermissions(2)) return
  const spawn = p.server.overworld().getSharedSpawnPos()
  p.server.runCommandSilent(`execute in minecraft:overworld run tp ${p.username} ${spawn.x + 0.5} ${spawn.y} ${spawn.z + 0.5}`)
  p.tell(`§c✦ This realm is sealed until level §l${req}§c. You are level ${getLvl(p)}: ${req - getLvl(p)} to go.`)
})

// ---------------------------------------------------------------- setup + commands
ServerEvents.loaded(event => {
  const s = event.server
  s.runCommandSilent('scoreboard objectives add ot_level dummy "Level"')
  s.runCommandSilent('scoreboard objectives add ot_xp dummy "XP"')
  s.runCommandSilent('scoreboard objectives add ot_xpneed dummy "XP Needed"')
  s.runCommandSilent('scoreboard objectives add ot_xppct dummy "Level Progress"')
})

const bar = (pct) => {
  let s = '§6'
  for (let i = 0; i < 20; i++) s += (i === Math.round(pct / 5) ? '§8' : '') + '|'
  return s
}
const describe = (p) => {
  const lvl = getLvl(p), xp = getXp(p)
  if (lvl >= MAX_LEVEL) return `§6✦ ${p.username}: §lLevel ${lvl} (MAX)`
  const pct = Math.floor(xp * 100 / need(lvl))
  return `§6✦ ${p.username}: §eLevel §6§l${lvl}§r  ${bar(pct)} §7${xp} / ${need(lvl)} XP (${pct}%)`
}

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event
  const staff = src => src.hasPermission(2)
  const reply = (ctx, msg) => ctx.source.sendSystemMessage(Text.of(msg))
  event.register(Commands.literal('level')
    .executes(ctx => { const p = ctx.source.playerOrException; p.tell(describe(p)); return 1 })
    .then(Commands.literal('info')
      .then(Commands.argument('target', Arguments.PLAYER.create(event)).executes(ctx => {
        reply(ctx, describe(Arguments.PLAYER.getResult(ctx, 'target'))); return 1
      })))
    .then(Commands.literal('set').requires(staff)
      .then(Commands.argument('target', Arguments.PLAYER.create(event))
        .then(Commands.argument('level', Arguments.INTEGER.create(event)).executes(ctx => {
          const p = Arguments.PLAYER.getResult(ctx, 'target')
          setLevel(p, Arguments.INTEGER.getResult(ctx, 'level'), 0)
          reply(ctx, `${p.username} is now level ${getLvl(p)}.`); return 1
        }))))
    .then(Commands.literal('reset').requires(staff)
      .then(Commands.argument('target', Arguments.PLAYER.create(event)).executes(ctx => {
        const p = Arguments.PLAYER.getResult(ctx, 'target')
        setLevel(p, 1, 0)
        reply(ctx, `${p.username} was reset to level 1.`); return 1
      })))
    .then(Commands.literal('xp').requires(staff)
      .then(Commands.literal('give')
        .then(Commands.argument('target', Arguments.PLAYER.create(event))
          .then(Commands.argument('amount', Arguments.INTEGER.create(event)).executes(ctx => {
            const p = Arguments.PLAYER.getResult(ctx, 'target')
            const amt = Arguments.INTEGER.getResult(ctx, 'amount')
            p.tell(`§6✦ §e+${amt} XP`)
            addXp(p, amt)
            reply(ctx, `Gave ${amt} XP to ${p.username} (now level ${getLvl(p)}).`); return 1
          }))))
      .then(Commands.literal('take')
        .then(Commands.argument('target', Arguments.PLAYER.create(event))
          .then(Commands.argument('amount', Arguments.INTEGER.create(event)).executes(ctx => {
            const p = Arguments.PLAYER.getResult(ctx, 'target')
            setLevel(p, getLvl(p), Math.max(0, getXp(p) - Arguments.INTEGER.getResult(ctx, 'amount')))
            reply(ctx, `${p.username} now has ${getXp(p)} XP into level ${getLvl(p)}.`); return 1
          })))))
  )
})
