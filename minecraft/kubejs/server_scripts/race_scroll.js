// OVERTHRONE - Seris the Rebirth Keeper gives a Tensura Race Reset Scroll, once every 12 hours per player.
// Drop into kubejs/server_scripts/ and run /reload (or restart).
//
// The NPC's "Claim" button runs:  execute as @initiator run racescroll claim
// Players can't run /racescroll themselves (it needs permission level 2), so the only way to claim is the NPC.
// The cooldown is real time and is saved on the player, so it survives logouts and restarts.
//
// The NPC's "When can I claim?" button runs:  execute as @initiator run racescroll time
//
// Staff:  /racescroll check <player>   time left for a player
//         /racescroll reset <player>   let a player claim again now

const SCROLL = 'tensura:race_reset_scroll'
const COOLDOWN_MS = 12 * 60 * 60 * 1000
const KEY = 'overthrone_race_scroll_last'

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
  // vanilla /give drops the scroll at the player's feet if their inventory is full
  const given = player.server.runCommandSilent(`give ${player.username} ${SCROLL} 1`)
  if (!given) {
    player.tell('§c✦ The Race Reset Scroll could not be given. Please tell staff.')
    return 0
  }
  player.persistentData.putDouble(KEY, Date.now())
  player.tell('§5✦ §dSeris: §7Take it, and choose wisely. §8(Next scroll in 12h)')
  player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.2`)
  return 1
}

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event
  event.register(Commands.literal('racescroll')
    .requires(src => src.hasPermission(2))
    .then(Commands.literal('claim').executes(ctx => claim(ctx.source.playerOrException)))
    .then(Commands.literal('time').executes(ctx => {   // the NPC's "When can I claim?" button
      const player = ctx.source.playerOrException
      const left = timeLeft(player)
      player.tell(left > 0 ? `§5✦ §dSeris: §7Your next scroll is ready in §d${fmt(left)}§7.` : '§5✦ §dSeris: §7A scroll is waiting for you. Ask and it is yours.')
      return 1
    }))
    .then(Commands.literal('check')
      .then(Commands.argument('target', Arguments.PLAYER.create(event)).executes(ctx => {
        const target = Arguments.PLAYER.getResult(ctx, 'target')
        const left = timeLeft(target)
        ctx.source.sendSystemMessage(Text.of(left > 0 ? `${target.username} can claim again in ${fmt(left)}.` : `${target.username} can claim now.`))
        return 1
      })))
    .then(Commands.literal('reset')
      .then(Commands.argument('target', Arguments.PLAYER.create(event)).executes(ctx => {
        const target = Arguments.PLAYER.getResult(ctx, 'target')
        target.persistentData.remove(KEY)
        ctx.source.sendSystemMessage(Text.of(`${target.username} can claim a Race Reset Scroll again.`))
        return 1
      })))
  )
})
