// OVERTHRONE - Seris the Rebirth Keeper gives a Tensura Race Reset Scroll, once every 12 hours per player.
// Drop into kubejs/server_scripts/ and run /reload (or restart).
//
// The NPC's buttons run:  racescroll claim @initiator   and   racescroll time @initiator
// These need no permission level, so they work even when Easy NPC limits an imported NPC's commands.
// A claim only works while the player stands next to Seris, and a player typing it can only claim for themselves.
// The cooldown is real time and is saved on the player, so it survives logouts and restarts.
//
// Staff:  /racescroll check <player>   time left for a player
//         /racescroll reset <player>   let a player claim again now

const SCROLL = 'tensura:race_reset_scroll'
const COOLDOWN_MS = 12 * 60 * 60 * 1000
const KEY = 'overthrone_race_scroll_last'
const NPC_NAME = 'Seris the Rebirth Keeper'
const NPC_RANGE = 8

// Looks for an entity named Seris within NPC_RANGE blocks. Checked directly: on 1.21 a command's
// result can't be read back from runCommandSilent, so a selector check would always fail.
const findSeris = (player, range) => {
  const box = player.getBoundingBox().inflate(range)
  const list = player.level.getEntities(player, box)
  for (let i = 0; i < list.size(); i++) {
    if (String(list.get(i).getName().getString()) === NPC_NAME) return list.get(i)
  }
  return null
}
const nearSeris = (player) => findSeris(player, NPC_RANGE) !== null

// Floating text above Seris (a vanilla text_display). Placed with /racescroll hologram.
const HOLO_TAG = 'seris_holo'
const HOLO_HEIGHT = 2.55   // above her name tag
const HOLO_TEXT = '{"text":"","extra":['
  + '{"text":"✦ REBIRTH KEEPER ✦\\\\n","color":"#E0B13E","bold":true},'
  + '{"text":"Free Race Reset Scroll\\\\n","color":"light_purple"},'
  + '{"text":"1 every 12 hours\\\\n","color":"gray"},'
  + '{"text":"Right-click to claim","color":"yellow"}]}'

// The NPC runs the command as itself; a player typing it may only use their own name.
const target = (ctx, Arguments) => {
  const player = Arguments.PLAYER.getResult(ctx, 'player')
  const typer = ctx.source.player
  if (typer && typer.username !== player.username) {
    typer.tell('§cYou can only do this for yourself.')
    return null
  }
  if (!nearSeris(player)) {
    player.tell('§5✦ §7Speak to §dSeris the Rebirth Keeper§7 to claim your scroll.')
    return null
  }
  return player
}

const timeLeft = (player) => {
  const last = player.persistentData.getDouble(KEY)
  return Math.max(0, last + COOLDOWN_MS - Date.now())
}

const fmt = (ms) => {
  const mins = Math.ceil(ms / 60000)
  const h = Math.floor(mins / 60), m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const claim = (player) => {
  const left = timeLeft(player)
  if (left > 0) {
    player.tell(`§5✦ §dSeris: §7The scroll must recharge. Come back in §d${fmt(left)}§7.`)
    player.server.runCommandSilent(`playsound minecraft:block.note_block.bass player ${player.username} ~ ~ ~ 0.6 0.7`)
    return 0
  }
  let scroll = null
  try { scroll = Item.of(SCROLL) } catch (e) { scroll = null }
  if (!scroll || scroll.isEmpty()) {
    player.tell('§c✦ The Race Reset Scroll could not be given. Please tell staff.')
    return 0
  }
  player.give(scroll)   // drops at the player's feet if the inventory is full
  player.persistentData.putDouble(KEY, Date.now())
  player.tell('§5✦ §dSeris: §7Take it, and choose wisely. §8(Next scroll in 12h)')
  player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.2`)
  return 1
}

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event
  event.register(Commands.literal('racescroll')
    .then(Commands.literal('claim')
      .then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {
        const player = target(ctx, Arguments)
        return player ? claim(player) : 0
      })))
    .then(Commands.literal('time')
      .then(Commands.argument('player', Arguments.PLAYER.create(event)).executes(ctx => {   // "When can I claim again?"
      const player = target(ctx, Arguments)
      if (!player) return 0
      const left = timeLeft(player)
      player.tell(left > 0 ? `§5✦ §dSeris: §7Your next scroll is ready in §d${fmt(left)}§7.` : '§5✦ §dSeris: §7A scroll is waiting for you. Ask and it is yours.')
      return 1
    })))
    .then(Commands.literal('hologram')   // op: stand near Seris and run it; run again to move/refresh it
      .requires(src => src.hasPermission(2))
      .executes(ctx => {
        const player = ctx.source.playerOrException
        const seris = findSeris(player, 16)
        player.server.runCommandSilent(`kill @e[type=minecraft:text_display,tag=${HOLO_TAG}]`)
        if (!seris) {
          player.tell('§cStand within 16 blocks of Seris the Rebirth Keeper and try again.')
          return 0
        }
        const x = seris.x, y = seris.y + HOLO_HEIGHT, z = seris.z
        player.server.runCommandSilent(`execute at ${player.username} run summon minecraft:text_display ${x} ${y} ${z} `
          + `{Tags:["${HOLO_TAG}"],billboard:"center",alignment:"center",shadow:1b,line_width:200,background:1610612736,text:'${HOLO_TEXT}'}`)
        player.tell('§a✦ Hologram placed above Seris. Remove it with /racescroll hologram remove')
        return 1
      })
      .then(Commands.literal('remove').executes(ctx => {
        ctx.source.server.runCommandSilent(`kill @e[type=minecraft:text_display,tag=${HOLO_TAG}]`)
        ctx.source.sendSystemMessage(Text.of('Seris hologram removed.'))
        return 1
      })))
    .then(Commands.literal('check')
      .requires(src => src.hasPermission(2))
      .then(Commands.argument('target', Arguments.PLAYER.create(event)).executes(ctx => {
        const who = Arguments.PLAYER.getResult(ctx, 'target')
        const left = timeLeft(who)
        ctx.source.sendSystemMessage(Text.of(left > 0 ? `${who.username} can claim again in ${fmt(left)}.` : `${who.username} can claim now.`))
        return 1
      })))
    .then(Commands.literal('reset')
      .requires(src => src.hasPermission(2))
      .then(Commands.argument('target', Arguments.PLAYER.create(event)).executes(ctx => {
        const who = Arguments.PLAYER.getResult(ctx, 'target')
        who.persistentData.remove(KEY)
        ctx.source.sendSystemMessage(Text.of(`${who.username} can claim a Race Reset Scroll again.`))
        return 1
      })))
  )
})
