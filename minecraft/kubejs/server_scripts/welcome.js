// OVERTHRONE - join welcome message + rotating chat announcements (OG Network style).
// Drop into kubejs/server_scripts/ and restart. Edit the text below; links are clickable in chat.
// Test (op): /announce = send the next announcement now, /announce welcome = see the join message.

(function () {
  const WEBSITE = 'https://overthronesmp.net'
  const STORE = 'https://overthronesmp.tebex.store'
  const DISCORD = 'https://discord.gg/overthronesmp'
  const RULES = 'https://overthronesmp.net/rules'
  const VOTES = [
    ['Minecraft-MP', 'https://minecraft-mp.com/server/364807/vote/'],
    ['MinecraftServers.org', 'https://minecraftservers.org/vote/694195'],
    ['MinecraftBestServers', 'https://minecraftbestservers.com/server-overthrone-smp.7252'],
  ]
  const ANNOUNCE_EVERY_MINUTES = 30

  // ---- little text-component helpers
  const t = (text, color, extra) => Object.assign({ text: text, color: color }, extra || {})
  const link = (text, url, color) => t(text, color, {
    underlined: false,
    clickEvent: { action: 'open_url', value: url },
    hoverEvent: { action: 'show_text', contents: t('Click to open ' + url, 'yellow') },
  })
  const RULE = t('                                                                 ', 'gold', { strikethrough: true })
  const send = (server, who, parts) => server.runCommandSilent(`tellraw ${who} ${JSON.stringify([''].concat(parts))}`)
  const nl = t('\n', 'white')

  const voteLines = () => {
    var out = []
    VOTES.forEach(v => { out.push(nl, t(' ➤ ', 'dark_gray'), link(v[0], v[1], 'aqua')) })
    return out
  }

  // ---- welcome (only the joining player sees it)
  const welcome = (p) => {
    send(p.server, p.username, [
      RULE, nl,
      t('Welcome ', 'white'), t(p.username, 'green', { bold: true }), t(' to ', 'white'),
      t('OVERTHRONE ', 'red', { bold: true }), t('SMP', 'gold', { bold: true }), nl, nl,
      t('▪ ', 'gold'), t('Website: ', 'white'), link('overthronesmp.net', WEBSITE, 'green'), nl,
      t('▪ ', 'gold'), t('Store: ', 'white'), link('overthronesmp.tebex.store', STORE, 'green'), nl,
      t('▪ ', 'gold'), t('Discord: ', 'white'), link('discord.gg/overthronesmp', DISCORD, 'green'), nl,
      t('▪ ', 'gold'), t('Rules: ', 'white'), link('overthronesmp.net/rules', RULES, 'green'), nl, nl,
      t('Vote ', 'gold', { bold: true }), t('» ', 'dark_gray'),
      t("Don't forget to vote every day for a free ", 'gray'), t('Vote Key', 'yellow'), t('! Type ', 'gray'),
      link('/vote', WEBSITE + '/vote', 'yellow'), t(' or click:', 'gray'),
    ].concat(voteLines()).concat([nl, RULE]))
  }

  PlayerEvents.loggedIn(event => {
    var p = event.player
    // a short delay so it lands after other mods' join spam
    try { p.server.scheduleInTicks(40, () => { try { welcome(p) } catch (e) { } }) } catch (e) { welcome(p) }
  })

  // ---- rotating announcements to everyone
  const ANNOUNCEMENTS = [
    () => [t('Server Rules!', 'green', { bold: true }), nl,
      t('Be sure to follow all our server rules found here!', 'gray'), nl, link(RULES, RULES, 'gold')],
    () => [t('Vote for rewards!', 'green', { bold: true }), nl,
      t('Every vote gives you a ', 'gray'), t('Vote Key', 'yellow'), t('. Vote on every site, every day! Type ', 'gray'),
      t('/vote', 'yellow'), t(' or click:', 'gray')].concat(voteLines()),
    () => [t('Support the server!', 'green', { bold: true }), nl,
      t('Ranks, keys and more at ', 'gray'), link('overthronesmp.tebex.store', STORE, 'gold')],
    () => [t('Join our Discord!', 'green', { bold: true }), nl,
      t('Events, giveaways and updates: ', 'gray'), link('discord.gg/overthronesmp', DISCORD, 'gold')],
  ]
  var next = 0
  const announce = (s) => {
    send(s, '@a', [RULE, nl].concat(ANNOUNCEMENTS[next % ANNOUNCEMENTS.length]()).concat([nl, RULE]))
    next++
  }
  ServerEvents.tick(event => {
    var s = event.server
    if (s.tickCount % (ANNOUNCE_EVERY_MINUTES * 1200) !== 0 || s.players.size() === 0) return
    announce(s)
  })

  // Staff test commands:  /announce          sends the next announcement to everyone now
  //                       /announce welcome  shows you the join message
  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('announce').requires(src => src.hasPermission(2))
      .executes(ctx => { announce(ctx.source.server); return 1 })
      .then(Commands.literal('welcome').executes(ctx => { welcome(ctx.source.playerOrException); return 1 })))
  })
})()
