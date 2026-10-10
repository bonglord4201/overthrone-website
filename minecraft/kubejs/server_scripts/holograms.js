// OVERTHRONE - floating text holograms (vanilla text_display entities, no extra mod needed).
// Drop into kubejs/server_scripts/ and run /reload.
//
// Op commands:
//   /holo place <name>            place it where you stand, 3 blocks above your feet
//   /holo place <name> <height>   same, with your own height (e.g. 4.5)
//   /holo remove <name>           delete every copy of that hologram
//   /holo list                    show the names you can place
// Placing again removes the old copy first, so it never doubles up.
// Add new holograms to HOLOGRAMS below: each line is [text, colour, bold].

const HOLOGRAMS = {
  // SLR Hunter Evaluation (the Evaluator block: player right-clicks it and holds the gem)
  evaluator: [
    ['⚔ HUNTER EVALUATION ⚔', '#E0B13E', true],
    ['STEP 1: Awaken as a Hunter', '#FF5555', true],
    ['Right-click the Evaluator & hold the gem', 'yellow'],
    ['Get your Hunter Rank (E - S) and Class', 'white'],
    ['Reroll your class until you accept', 'light_purple'],
    ['Your rank can never be rerolled', 'gray'],
  ],
}

const DEFAULT_HEIGHT = 3

const holoText = (lines) => {
  const parts = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    parts.push(JSON.stringify({ text: line[0] + (i < lines.length - 1 ? '\n' : ''), color: line[1], bold: !!line[2] }))
  }
  return '{"text":"","extra":[' + parts.join(',') + ']}'
}

// SNBT single-quoted string: escape backslashes and single quotes
const snbt = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"

const remove = (server, name) => server.runCommandSilent(`kill @e[type=minecraft:text_display,tag=holo_${name}]`)

const place = (ctx, name, height) => {
  const player = ctx.source.playerOrException
  const lines = HOLOGRAMS[name]
  if (!lines) {
    player.tell(`§cNo hologram called "${name}". Try /holo list`)
    return 0
  }
  remove(player.server, name)
  const x = player.x, y = player.y + height, z = player.z
  player.server.runCommandSilent(`execute at ${player.username} run summon minecraft:text_display ${x} ${y} ${z} `
    + `{Tags:["holo","holo_${name}"],billboard:"center",alignment:"center",shadow:1b,line_width:260,`
    + `background:1610612736,text:${snbt(holoText(lines))}}`)
  player.tell(`§a✦ Placed the "${name}" hologram. Move it by standing somewhere else and placing it again.`)
  return 1
}

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event
  event.register(Commands.literal('holo')
    .requires(src => src.hasPermission(2))
    .then(Commands.literal('list').executes(ctx => {
      ctx.source.sendSystemMessage(Text.of('Holograms: ' + Object.keys(HOLOGRAMS).join(', ')))
      return 1
    }))
    .then(Commands.literal('place')
      .then(Commands.argument('name', Arguments.STRING.create(event))
        .executes(ctx => place(ctx, Arguments.STRING.getResult(ctx, 'name'), DEFAULT_HEIGHT))
        .then(Commands.argument('height', Arguments.FLOAT.create(event))
          .executes(ctx => place(ctx, Arguments.STRING.getResult(ctx, 'name'), Arguments.FLOAT.getResult(ctx, 'height'))))))
    .then(Commands.literal('remove')
      .then(Commands.argument('name', Arguments.STRING.create(event)).executes(ctx => {
        remove(ctx.source.server, Arguments.STRING.getResult(ctx, 'name'))
        ctx.source.sendSystemMessage(Text.of('Removed.'))
        return 1
      })))
  )
})
