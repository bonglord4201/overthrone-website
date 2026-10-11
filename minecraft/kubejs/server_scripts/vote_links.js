// OVERTHRONE - /vote: clickable vote links in chat.
// KEEP THIS FILE: the vote menu mod doesn't register /vote itself, it only replaces it with its menu.
// This file makes /vote exist; if the menu mod isn't working, players get these chat links instead.

(function () {
  const SITES = [
    ['Minecraft-MP', 'https://minecraft-mp.com/server/364807/vote/', 'aqua'],
    ['MinecraftServers.org', 'https://minecraftservers.org/vote/694195', 'green'],
    ['MinecraftBestServers', 'https://minecraftbestservers.com/server-overthrone-smp.7252', 'gold'],
  ]
  const ALL = 'https://overthronesmp.net/vote'

  const line = (label, url, color) => JSON.stringify(['',
    { text: ' ➤ ', color: 'dark_gray' },
    { text: label, color: color, bold: true, underlined: true,
      clickEvent: { action: 'open_url', value: url },
      hoverEvent: { action: 'show_text', contents: { text: 'Click to vote on ' + label, color: 'yellow' } } },
  ])

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('vote').executes(ctx => {
      const p = ctx.source.playerOrException, n = p.username, run = (c) => p.server.runCommandSilent(c)
      run(`tellraw ${n} {"text":"━━━━━━━━ VOTE FOR OVERTHRONE ━━━━━━━━","color":"red","bold":true}`)
      run(`tellraw ${n} {"text":"Every vote gives you a Vote Key (+ rewards). Vote on every site, every day!","color":"gray"}`)
      SITES.forEach(s => run(`tellraw ${n} ${line(s[0], s[1], s[2])}`))
      run(`tellraw ${n} ${line('All vote links: overthronesmp.net/vote', ALL, 'gold')}`)
      return 1
    }))
  })
})()
