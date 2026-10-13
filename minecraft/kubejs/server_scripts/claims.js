// OVERTHRONE - land claims with a golden shovel (uses the Flan claim mod, server-side only).
// Flan does the claiming and protection; this script only helps players get started:
//   - new players get a Claim Tool (golden shovel) once, with a short how-to
//   - /claimtool   gives a golden shovel if you don't have one
//   - /claiminfo   how claiming works
// Claim blocks are given with:  flan giveClaimBlocks <player> <amount>
//   (Throne Shop, vote crate rewards, Tebex packages). Use a negative amount to take them back.

(function () {
  const GOT_TOOL = 'ot_claim_tool_given'
  const TOOL = 'minecraft:golden_shovel'
  const P = '§6§lCLAIMS §8» §7'

  const help = (p) => {
    p.tell('§6§l✦ Land Claims')
    p.tell('§71. Hold a §6golden shovel §7(§e/claimtool§7).')
    p.tell('§72. §fRight-click §7one corner of your base, then the §fopposite corner§7.')
    p.tell('§73. Nobody else can build, break or open chests inside.')
    p.tell('§8 • §7Each block of area costs §e1 claim block§7. Check yours: §e/flan list')
    p.tell('§8 • §7Get more: playing time, §e/throneshop§7, vote crates and the store.')
    p.tell('§8 • §7Manage trust and settings: §e/flan menu§7 · see claims: hold a §fstick')
    p.tell('§8 • §7Claims work in the §fWild§7 and §fSurvival§7, not in the hub or RPG World.')
  }

  // "clear <player> <item> 0" removes nothing and returns how many the player has
  const hasTool = (p) => Number(p.server.runCommandSilent(`clear ${p.username} ${TOOL} 0`)) > 0
  const giveTool = (p) => p.server.runCommandSilent(`give ${p.username} ${TOOL}[custom_name='{"text":"Claim Tool","color":"gold","bold":true,"italic":false}'] 1`)

  PlayerEvents.loggedIn(event => {
    var p = event.player
    if (p.persistentData.getBoolean(GOT_TOOL)) return
    p.persistentData.putBoolean(GOT_TOOL, true)
    try {
      p.server.scheduleInTicks(80, () => {
        giveTool(p)
        p.tell(P + '§aYou got a §6Claim Tool§a! Type §e/claiminfo §ato learn how to protect your base.')
      })
    } catch (e) { }
  })

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('claiminfo').executes(ctx => { help(ctx.source.playerOrException); return 1 }))
    event.register(Commands.literal('claimtool').executes(ctx => {
      var p = ctx.source.playerOrException
      if (hasTool(p)) { p.tell(P + 'You already have a golden shovel in your inventory.'); return 0 }
      giveTool(p)
      p.tell(P + '§aHere is your §6Claim Tool§a. Type §e/claiminfo §afor how it works.')
      return 1
    }))
  })
})()
