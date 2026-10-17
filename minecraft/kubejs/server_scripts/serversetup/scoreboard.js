// ============================================================================
// Sidebar scoreboard (2026-10-10) - texts in config/serversetup/scoreboard.json
//
// Every player gets their OWN sidebar (their own name, money, level...), sent straight to their
// client with vanilla scoreboard packets, so it works with an unmodded client and needs no mod.
// Nothing is added to the server's real scoreboard (/scoreboard stays clean). The red score numbers
// are hidden (blank number format). Values come from NeoEssentials placeholders, refreshed every
// "update_ticks"; only lines that changed are sent again. Re-sent completely on join, world change
// and respawn, so it shows in every world.
//   /sidebar              hide / show it for yourself
//   /sidebar test <text>  (op) show how a text with placeholders comes out for you
//   /sidebar where        (op) shows the id of the world you're in (for SB_HUB_WORLDS / SB_RPG_WORLDS)
//
// 2026-10-12 additions (OG Network style):
//   - HUB: the title is an animated OVERTHRONE SMP that sweeps black / red, and an
//     "Online: <players>" line is added above the last line.
//   - RPG world: a "Use /wild to leave spawn." line is added above the last line.
//   - Every other world (wild, SMP, nether, end...): a "Use /hub to return to spawn." line.
//   - {online} and {max_players} can be used in any line of scoreboard.json.
// ============================================================================

const SB_FILE = 'config/serversetup/scoreboard.json'
const SB_OBJECTIVE = 'ot_sidebar'
const SB_HIDDEN = 'ss_sidebar_hidden'
// World names (the part after the ':' of the world id, or the full id). Check with /sidebar where.
const SB_HUB_WORLDS = ['hub']
const SB_RPG_WORLDS = ['rpg', 'rpg_world', 'rpgworld', 'rpg_smp']
const SB_HUB_EXTRA = ['', '&f&lONLINE: &a&l{online}']
const SB_RPG_EXTRA = ['', '&fUse &6/wild &fto', '&fleave spawn.']
const SB_OTHER_EXTRA = ['', '&fUse &6/hub &fto', '&freturn to spawn.']   // every other world (wild, SMP, nether, end...)
const SB_TITLE_EVERY = 3   // ticks between frames of the animated hub title

const SbScoreboard = Java.loadClass('net.minecraft.world.scores.Scoreboard')
const SbObjective = Java.loadClass('net.minecraft.world.scores.Objective')
const SbCriteria = Java.loadClass('net.minecraft.world.scores.criteria.ObjectiveCriteria')
const SbRenderType = Java.loadClass('net.minecraft.world.scores.criteria.ObjectiveCriteria$RenderType')
const SbDisplaySlot = Java.loadClass('net.minecraft.world.scores.DisplaySlot')
const SbBlankFormat = Java.loadClass('net.minecraft.network.chat.numbers.BlankFormat')
const SbSetObjective = Java.loadClass('net.minecraft.network.protocol.game.ClientboundSetObjectivePacket')
const SbSetDisplay = Java.loadClass('net.minecraft.network.protocol.game.ClientboundSetDisplayObjectivePacket')
const SbSetScore = Java.loadClass('net.minecraft.network.protocol.game.ClientboundSetScorePacket')
const SbResetScore = Java.loadClass('net.minecraft.network.protocol.game.ClientboundResetScorePacket')
const SbOptional = Java.loadClass('java.util.Optional')
const SbPlaceholders = Java.loadClass('com.zerog.neoessentials.api.PlaceholderAPI')

const sbDummyBoard = new SbScoreboard()
let sbCfg = null
const sbState = {} // player uuid -> { lines: [json], title: json, dim }

function sbLoad() {
  let cfg = ssReadJson(SB_FILE, null)
  if (cfg == null) {
    console.error('[scoreboard] cannot read ' + SB_FILE + ' (missing file or JSON syntax error)')
    sbCfg = { enabled: false, lines: [] }
    return
  }
  cfg.lines = (cfg.lines || []).slice(0, 15)
  cfg.update_ticks = Math.max(5, Number(cfg.update_ticks || 20))
  cfg.disabled_worlds = (cfg.disabled_worlds || []).map(w => String(w))
  if (cfg.date_format) hudDateFormat = String(cfg.date_format)
  sbCfg = cfg
}

// ---- which kind of world a player is in: 'hub', 'rpg' or ''
function sbWorldIs(dim, names) {
  var d = String(dim).toLowerCase()
  for (var i = 0; i < names.length; i++) {
    var n = String(names[i]).toLowerCase()
    if (d == n || d.endsWith(':' + n)) return true
  }
  return false
}
function sbKind(player) {
  let dim = ssDimId(player.getLevel())
  if (sbWorldIs(dim, SB_HUB_WORLDS)) return 'hub'
  if (sbWorldIs(dim, SB_RPG_WORLDS)) return 'rpg'
  return ''
}

// the lines for this player's world: the normal lines, with the extra lines put above the last one
function sbLinesFor(player) {
  let kind = sbKind(player)
  let extra = kind == 'hub' ? SB_HUB_EXTRA : kind == 'rpg' ? SB_RPG_EXTRA : SB_OTHER_EXTRA
  if (extra.length == 0 || sbCfg.lines.length == 0) return sbCfg.lines
  let base = sbCfg.lines
  let out = base.slice(0, base.length - 1).concat(extra).concat([base[base.length - 1]])
  return out.slice(0, 15)
}

// ---- animated hub title: OVERTHRONE SMP with a red shine sweeping across black
const SB_TITLE_TEXT = 'OVERTHRONE SMP'
const SB_TITLE_PALETTE = ['2A2A2A', '3A0A0A', '5C0000', '8B0000', 'B3001B', 'E01020', 'FF2A2A', 'FF5050', 'FF2A2A', 'E01020', 'B3001B', '8B0000', '5C0000', '3A0A0A']
const SB_TITLE_FRAMES = (function () {
  var frames = []
  var n = SB_TITLE_PALETTE.length
  for (var f = 0; f < n; f++) {
    var s = ''
    for (var i = 0; i < SB_TITLE_TEXT.length; i++) s += '&#' + SB_TITLE_PALETTE[(i + n - f) % n] + '&l' + SB_TITLE_TEXT[i]
    frames.push(s)
  }
  return frames
})()
function sbTitleFor(player) {
  if (sbKind(player) != 'hub') return sbCfg.title || ''
  let frame = Math.floor(player.getServer().getTickCount() / SB_TITLE_EVERY) % SB_TITLE_FRAMES.length
  return SB_TITLE_FRAMES[frame]
}

// <gradient:RRGGBB-RRGGBB>text</gradient> -> one &#hex per character (keeps &l etc.)
function sbGradients(s) {
  return s.replace(/<gradient:#?([0-9a-fA-F]{6})-#?([0-9a-fA-F]{6})>(.*?)<\/gradient>/g, (all, a, b, text) => {
    let fmt = ''
    let plain = text.replace(/&[lonmk]/gi, m => { fmt += m; return '' })
    let chars = Array.from(plain)
    let ca = [0, 2, 4].map(i => parseInt(a.substring(i, i + 2), 16))
    let cb = [0, 2, 4].map(i => parseInt(b.substring(i, i + 2), 16))
    return chars.map((ch, i) => {
      let t = chars.length <= 1 ? 0 : i / (chars.length - 1)
      let hex = ca.map((v, k) => {
        let n = Math.round(v + (cb[k] - v) * t).toString(16).toUpperCase()
        return n.length < 2 ? '0' + n : n
      }).join('')
      return '&#' + hex + fmt + ch
    }).join('')
  })
}

// text with placeholders -> JSON component string for this player
function sbRender(player, text) {
  let s = String(text)
  if (s.indexOf('{online}') >= 0 || s.indexOf('{max_players}') >= 0) {
    let server = player.getServer()
    s = s.split('{online}').join(String(server.getPlayerCount())).split('{max_players}').join(String(server.getMaxPlayers()))
  }
  if (s.indexOf('{') >= 0) {
    try {
      s = String(SbPlaceholders.setPlaceholders(player, s))
    } catch (e) {
      console.warn('[scoreboard] placeholders: ' + e)
    }
  }
  s = sbGradients(s.replace(/§/g, '&'))
  return JSON.stringify({ text: '', extra: s.length == 0 ? [{ text: ' ' }] : ssLegacyToJson(s) })
}

function sbComponent(server, json) {
  return MnSerializer.fromJsonLenient(json, server.registryAccess())
}

function sbObjective(server, titleJson) {
  return new SbObjective(sbDummyBoard, SB_OBJECTIVE, SbCriteria.DUMMY, sbComponent(server, titleJson), SbRenderType.INTEGER, false, SbBlankFormat.INSTANCE)
}

function sbLineOwner(i) {
  return 'ot_line_' + (i < 10 ? '0' : '') + i
}

function sbSendLine(server, player, lines, i) {
  player.connection.send(new SbSetScore(sbLineOwner(i), SB_OBJECTIVE, lines.length - i, SbOptional.of(sbComponent(server, lines[i])), SbOptional.of(SbBlankFormat.INSTANCE)))
}

function sbRemove(player) {
  delete sbState[String(player.getStringUuid())]
  try {
    player.connection.send(new SbSetObjective(sbObjective(player.getServer(), '{"text":""}'), 1))
  } catch (e) { }
}

function sbWanted(player) {
  if (sbCfg == null || sbCfg.enabled != true) return false
  if (player.persistentData.getBoolean(SB_HIDDEN)) return false
  return sbCfg.disabled_worlds.indexOf(ssDimId(player.getLevel())) < 0
}

// full send (objective removed first: adding an objective that exists would disconnect the client)
function sbFull(server, player) {
  let title = sbRender(player, sbTitleFor(player))
  let lines = sbLinesFor(player).map(l => sbRender(player, l))
  let obj = sbObjective(server, title)
  player.connection.send(new SbSetObjective(obj, 1))
  player.connection.send(new SbSetObjective(obj, 0))
  player.connection.send(new SbSetDisplay(SbDisplaySlot.SIDEBAR, obj))
  for (let i = 0; i < lines.length; i++) sbSendLine(server, player, lines, i)
  sbState[String(player.getStringUuid())] = { lines: lines, title: title, dim: ssDimId(player.getLevel()) }
}

// only the title (used for the animated hub title between normal refreshes)
function sbTitleOnly(server, player) {
  let st = sbState[String(player.getStringUuid())]
  if (st == null) return
  let title = sbRender(player, sbTitleFor(player))
  if (title == st.title) return
  player.connection.send(new SbSetObjective(sbObjective(server, title), 2))
  st.title = title
}

// only what changed
function sbUpdate(server, player) {
  let uuid = String(player.getStringUuid())
  let st = sbState[uuid]
  let src = sbLinesFor(player)
  if (st == null || st.dim != ssDimId(player.getLevel()) || st.lines.length != src.length) {
    sbFull(server, player)
    return
  }
  sbTitleOnly(server, player)
  for (let i = 0; i < src.length; i++) {
    let json = sbRender(player, src[i])
    if (json == st.lines[i]) continue
    st.lines[i] = json
    sbSendLine(server, player, st.lines, i)
  }
}

ServerEvents.loaded(event => {
  sbLoad()
  // after /reload: send everyone the new layout
  Object.keys(sbState).forEach(k => delete sbState[k])
})

ServerEvents.tick(event => {
  let server = event.server
  if (sbCfg == null) sbLoad()
  let tick = server.getTickCount()
  let full = tick % sbCfg.update_ticks == 0
  let anim = tick % SB_TITLE_EVERY == 0
  if (!full && !anim) return
  server.getPlayerList().getPlayers().forEach(player => {
    try {
      let uuid = String(player.getStringUuid())
      if (!sbWanted(player)) {
        if (sbState[uuid] != null) sbRemove(player)
        return
      }
      if (full) sbUpdate(server, player)
      else if (sbKind(player) == 'hub') sbTitleOnly(server, player)
    } catch (e) {
      console.error('[scoreboard] ' + player.getGameProfile().getName() + ': ' + e)
    }
  })
})

// respawn / world change: send it all again on the next refresh
PlayerEvents.respawned(event => { delete sbState[String(event.player.getStringUuid())] })
PlayerEvents.loggedIn(event => { delete sbState[String(event.player.getStringUuid())] })
PlayerEvents.loggedOut(event => { delete sbState[String(event.player.getStringUuid())] })

ServerEvents.commandRegistry(event => {
  let Commands = event.commands
  let Arguments = event.arguments
  event.register(Commands.literal('sidebar')
    .executes(ctx => {
      let p = ctx.source.getPlayer()
      if (p == null) return 0
      let hidden = !p.persistentData.getBoolean(SB_HIDDEN)
      p.persistentData.putBoolean(SB_HIDDEN, hidden)
      if (hidden) sbRemove(p)
      else delete sbState[String(p.getStringUuid())]
      p.tell(hidden ? '§7Sidebar hidden. §f/sidebar §7shows it again.' : '§aSidebar shown.')
      return 1
    })
    .then(Commands.literal('where').requires(s => s.hasPermission(2)).executes(ctx => {
      let p = ctx.source.getPlayer()
      if (p == null) return 0
      let kind = sbKind(p)
      p.tell('§7[sidebar] world id: §f' + ssDimId(p.getLevel()) + ' §7-> ' + (kind == '' ? 'normal sidebar' : kind + ' sidebar'))
      return 1
    }))
    .then(Commands.literal('test').requires(s => s.hasPermission(2))
      .then(Commands.argument('text', Arguments.GREEDY_STRING.create(event)).executes(ctx => {
        let p = ctx.source.getPlayer()
        if (p == null) return 0
        let text = String(Arguments.GREEDY_STRING.getResult(ctx, 'text'))
        p.tell(sbComponent(ctx.source.getServer(), sbRender(p, text)))
        return 1
      }))))
})
