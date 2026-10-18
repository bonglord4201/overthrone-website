// OVERTHRONE - written guide books: "Tensura Guide" and "Solo Leveling Guide".
// Players get them by clicking START HERE (or the book tile) in the Tensura / Solo Leveling Guide NPC menus (npc_menus.js),
// or with /tensurabook and /slbook. One book per click, at most once every 30 seconds per player.
//
// Content rule: only facts that are verified. Tensura = the website Player Guide (Tensura: Reincarnated 2.0.1 defaults).
// Mysticism races = the mod's own race descriptions (its lang file); their evolution paths aren't verified yet, so the book
// points to the in-game Evolution Menu. Solo Leveling = what is confirmed on this server (evaluation, statues, gates).
// To change a page, edit the text below: & colour codes work (&a green, &l bold...), each string in a page is one line.
//
// Shared: otGiveGuideBook(player, 'tensura' | 'sl')

var otGiveGuideBook = null
;(function () {
  const COOLDOWN_MS = 30000
  const NAMED = { 0: 'black', 1: 'dark_blue', 2: 'dark_green', 3: 'dark_aqua', 4: 'dark_red', 5: 'dark_purple', 6: 'gold', 7: 'gray', 8: 'dark_gray', 9: 'blue', a: 'green', b: 'aqua', c: 'red', d: 'light_purple', e: 'yellow', f: 'white' }
  // one line with & codes -> text component parts (default colour: black, readable on the book's paper)
  const parts = (line) => {
    var out = [], color = 'black', bold = false, buf = '', s = String(line)
    var flush = () => { if (buf) out.push({ text: buf, color: color, bold: bold }); buf = '' }
    for (var i = 0; i < s.length; i++) {
      if (s[i] == '&' && i + 1 < s.length) {
        var c = s[i + 1].toLowerCase()
        if (NAMED[c] != null) { flush(); color = NAMED[c]; bold = false; i++; continue }
        if (c == 'l') { flush(); bold = true; i++; continue }
        if (c == 'r') { flush(); color = 'black'; bold = false; i++; continue }
      }
      buf += s[i]
    }
    flush()
    return out
  }
  const pageJson = (lines) => {
    var all = ['']
    lines.forEach((l, i) => { if (i) all.push({ text: '\n' }); parts(l).forEach(x => all.push(x)) })
    return JSON.stringify(all)
  }
  // a race page: name, difficulty, what it's good at, then its path one step per line
  const race = (name, diff, about, path) => [].concat(['&5&l' + name, '&8' + diff, '', about, '', '&lHow to evolve:'], path)
  // each string is one paragraph (wrapped automatically), '' is an empty line. A long section continues on the next page.

  // ------------------------------------------------------------------ TENSURA GUIDE
  const TENSURA = [
    ['&3&lTENSURA GUIDE', '&8OVERTHRONE', '', '&lContents', '1. Start here', '2. EP, evolving', '3. Tensura races', '4. Mysticism races', '5. Awakening', '6. Skills and tips', '', '&8Turn the page to start.'],
    ['&2&l1. START HERE', '', 'You pick a &lrace&r on your first join. You also get &lone random unique skill&r.', '', 'Press &lB&r to open your Status Menu: your stats, skills and evolutions.', '', 'Kill mobs to gain &lEP&r. By default you get 3% of what you kill.'],
    ['&2&l2. YOUR POWER: EP', '', '&lEP&r = your max Magicules (MP) + your max Aura (AP).', '', '&lMajin&r races (Slime, Wight, Ghoul, Lesser Daemon) turn most EP into &1MP&r for skills and magic.', '', 'Every other race turns most EP into &4AP&r for battlewills and fighting.'],
    ['&2&lHOW TO EVOLVE', '', '1. Press &lB&r.', '2. Open the &lEvolution Menu&r.', '3. Pick a form and press &lTrack&r: the goal shows on your screen.', '4. Press &lEvolve&r when it reaches 100%.', '', '&8The Evolution Menu always shows the exact goal for your next form.'],
    ['&2&lEVOLUTION GOALS', '', 'First forms: about &l100,000 EP&r.', 'Third stage: &l400k to 800k EP&r.', 'Divine forms: &l2,000,000 EP&r.', '', '&lSaint&r forms also need you to beat &l4 different bosses&r.', '', 'Some forms need an &litem&r instead: Zane Blood, Royal Blood, Dragon, Elemental or Daemon Essence, Magic Ore or Ancient Debris.'],
    ['&2&l3. TENSURA RACES', '', '&aEasy&r: Giant, Lesser Daemon, Ogre, Beastfolk, Harpy', '', '&6Intermediate&r: Elf, Merfolk, Lizardman, Orc', '', '&cHard&r: Human, Dwarf, Goblin, Wight, Ghoul', '', '&4Extreme&r: Slime', '', '&8One page per race next.'],
    race('Giant', 'Easy', 'The strongest start: 50 HP, big MP and AP, and Giantification to grow huge.', ['> Ancient Giant &8(300k EP + 20 Ancient Debris)', '> Divine Giant &8(2M EP)']),
    race('Lesser Daemon', 'Easy, Majin', 'Flies from day one, the biggest magic pool of any starter and lots of spells.', ['> Greater Daemon &8(20k EP)', '> Arch Daemon &8(140k EP)', '> Daemon Lord &8(2 of: a body, a name, an awakening)', '> Devil Lord &8(all 3)']),
    race('Ogre', 'Easy', 'Strong melee fighter with the most branches. Bonds with Fire Spirits.', ['> Kijin &8(get a Spirit)&r or Enlightened Ogre &8(100k EP)', '> Mystic Oni &8(10 Elemental Essence)&r or Wicked Oni &8(10 Daemon Essence)', '> Spirit Oni or Death Oni &8(400k EP)', '> Divine Oni or Divine Fighter &8(2M EP)']),
    race('Beastfolk', 'Easy', 'Fast, high Aura, Beast Transformation and Self Regeneration.', ['> Beast Lord &8(100k EP)', '> Spirit Beast &8(400k EP + 4 bosses)', '> Divine Beast &8(2M EP)']),
    race('Harpy', 'Easy', 'A big magic pool, Magic Jamming, and wings to glide like an elytra.', ['> Harpy Queen &8(200k EP)', '> Spirit Bird &8(800k EP)', '> Divine Bird &8(2M EP)']),
    race('Elf', 'Intermediate', 'Quick, with a talent for elemental magic. Bonds with Wind Spirits.', ['> Enlightened Elf &8(100k EP)', '> Elf Saint &8(400k EP + 4 bosses)', '> Divine Elf &8(2M EP)']),
    race('Merfolk', 'Intermediate', 'Breathes underwater and speeds through it with Hydraulic Propulsion. Bonds with Water Spirits.', ['> Enlightened Merfolk &8(100k EP)', '> Merfolk Saint &8(400k EP + 4 bosses)', '> Divine Fish &8(2M EP)']),
    race('Lizardman', 'Intermediate', 'Scale Armor and a dragon bloodline. The last two forms grow real wings.', ['> Dragonewt &8(10 Dragon Essence)', '> True Dragonewt &8(800k EP)', '> Divine Dragon &8(2M EP)']),
    race('Orc', 'Intermediate', 'Tanky (28 HP) but low on magic. The Orc Lord route learns Starved, a hunger skill.', ['> High Orc &8(5k EP)', '> Orc Lord &8(10 Royal Blood)', '> Orc Disaster &8(200k EP + mastered Starved)', '> Spirit Boar &8(400k EP)', '> Divine Boar &8(2M EP)', '&8High Orc can also go straight to Spirit Boar at 400k EP.']),
    race('Human', 'Hard', 'Very little magic but solid Aura: you fight with weapons and battlewills.', ['> Enlightened Human &8(100k EP)', '> Human Saint &8(400k EP + 4 bosses)', '> Divine Human &8(2M EP)', '&8Or drink 5 Zane Blood to become a Vampire.']),
    race('Dwarf', 'Hard', 'Tough and hits hard, but slow and low on magic. Bonds with Earth Spirits.', ['> Enlightened Dwarf &8(100k EP)', '> Dwarf Saint &8(400k EP + 4 bosses)', '> Divine Dwarf &8(2M EP)']),
    race('Goblin', 'Hard', 'Only 12 HP, but you evolve fast.', ['> Hobgoblin &8(2k EP)', '> Enlightened Hobgoblin &8(100k EP)', '> Hobgoblin Saint &8(400k EP + 4 bosses)', '> Divine Oni &8(2M EP)', '&8A Hobgoblin that defeats (or dies to) the Elemental Colossus becomes an Ogre.']),
    race('Wight', 'Hard, Majin', 'Undead with a huge magic pool. Undead mobs leave you alone. Sunlight burns you.', ['> Wight King &8(200k EP)', '> Spirit Skeleton &8(800k EP)', '> Divine Skeleton &8(2M EP)', '&8Or eat an Enchanted Golden Apple while you have Weakness to turn Human.']),
    race('Ghoul', 'Hard, Majin', 'Paralysis, Strength and Self Regeneration, but sunlight cripples you. The road to Divine Vampire.', ['> Vampire &8(1 Zane Blood)', '> Vampire Overcomer &8(150k EP)', '> Vampire Lord &8(400k EP)', '> Divine Vampire &8(2M EP)']),
    race('Slime', 'Extreme, Majin', '10 HP and slow, but 50% less physical damage, Absorb & Dissolve and Self Regeneration.', ['> Metal Slime &8(absorb 100 Magic Ore with Absorb & Dissolve)', '> Demon Slime &8(awaken as True Demon Lord or True Hero)', '> God Slime &8(2M EP)']),
    ['&2&l4. MYSTICISM RACES', '', 'These come from the Mysticism mod. Their paths and goals are in your &lEvolution Menu&r: press &lB&r, open the Evolution Menu and press &lTrack&r.', '', '&8The descriptions on the next pages are the mod\'s own.'],
    ['&5&lAttuned Wyrm', 'A wyrm that has yet to find an element to evolve into.', '', '&5&lDirewolf', 'Monsters that love havoc. Friendly ones can carry others on their back. Great potential for growth.'],
    ['&5&lDragonoid', 'A child of the stars. You can only ever evolve once, but your stats grow with your EP.', '', '&5&lForgotten', 'The ghost of a soul that couldn\'t be reincarnated, left to linger forever.'],
    ['&5&lInsect', 'Physical fighters from another world.', '&4Picking it RE-ROLLS your race into one of the insect races.', '', '&5&lLesser Angel', 'A spiritual life-form, like Daemons.'],
    ['&5&lLesser Elemental', 'An Elemental whose mind is not yet formed. What shape will it take?', '', '&5&lPhantom', 'A demi-spiritual creature born in the Underworld.'],
    ['&5&lSculk Worm', 'Ancient sculk dwellers. Starts weak, grows into a monstrosity.', '', '&5&lRestricted Human', 'See its goals in the Evolution Menu (B).', '', '&8Also on the server: Small Lesser Taratect, Kobold, Wispfolk and Mystic Fox.'],
    ['&2&l5. AWAKENING', '', '&lTrue Demon Lord&r: a Majin with 200,000 EP, then collect &l10,000 souls&r.', '', '&lTrue Hero&r: the other awakening.', '', 'Some forms need an awakening, like Demon Slime and Devil Lord.'],
    ['&2&lHARVEST FESTIVAL', 'When a player awakens as a True Demon Lord, their followers nearby evolve for free.', '', '&2&lNAMING', 'A stronger player can name you (default key &lN&r). It can push you to your next form, if that form doesn\'t need an awakening.'],
    ['&2&l6. SKILLS & MAGIC', '', 'Skills grow as you use them (mastery). See them in &lB&r.', '', 'Race ability: &lCtrl + E&r (bat swarm, slime jump...).', '', '&4Banned skills&r are removed automatically. If your unique was banned you get a new random one.'],
    ['&2&lSUNLIGHT', 'Wights, Ghouls and Vampires burn in sunlight. A helmet stops the burning, roofs and rain stop the debuffs.', '', 'Vampire Lord and Divine Vampire have no sunlight weakness. Every vampire is weaker on a New Moon.'],
    ['&2&lFLYING', 'Lesser Daemon and every daemon after it fly from the start.', '', 'True Dragonewt and Divine Dragon grow wings. Harpies glide.', '', 'Vampires can turn into bats (Ctrl + E).'],
    ['&2&lDIVINE FORMS', 'Up to 1,000,000 MP and AP, about 900 to 1,200 HP and &lDivine Ki Release&r.', '', 'Divine Vampire: Infinite Regeneration. Divine Giant: Titanification. Divine Fighter: Divine Berserker.'],
    ['&2&lCHANGE RACE', 'Talk to &lSeris the Rebirth Keeper&r for a &lRace Reset Scroll&r (one every 12 hours).', '', '&4It resets your race, stats, naming, awakening, spirits and race skills.&r Only use it if you\'re sure.'],
    ['&3&lGOOD LUCK!', '', 'Lost? Talk to the &lServer Guide&r or the &lTensura Guide&r NPC.', '', 'Full guide on the website:', '&9overthronesmp.net/guide', '', '&8OVERTHRONE'],
  ]

  // ------------------------------------------------------------------ SOLO LEVELING GUIDE
  const SL = (rank, cls) => [
    ['&5&lSOLO LEVELING', '&5&lGUIDE', '&8OVERTHRONE', '', 'From Hunter to Monarch.', '', '&lRank:&r ' + rank, '&lClass:&r ' + cls, '&8(when you got this book)', '', '&8Turn the page to start.'],
    ['&2&l1. START HERE', '', 'Go to the &lHunter Association&r: type &l/warp hunters&r.', '', 'Do your &lHunter Evaluation&r there. It gives you your &lclass&r, your &lstyle&r and your &lhunter rank&r.'],
    ['&2&l2. THE EVALUATION', '', 'Use the Hunter Evaluator. Its tabs: Contact, Scan, Class, Style, Rank, Record.', '', '&lPress and HOLD the gem&r until the timer is done (about 1.5 seconds). Letting go early stops it.'],
    ['&2&lHUNTER RANKS', '', '&lE > D > C > B > A > S', '', 'E is the lowest, S the highest.', '', 'Your rank and class are on the first page of this book and in the Solo Leveling Guide menu.', '', 'Rank perk: &l/hunterinfo'],
    ['&2&l3. STUCK IN THE CARTENON TEMPLE?', '', '&4The statues are NOT broken!', '', 'To use a statue, &lcrouch (sneak) next to it for 2 seconds&r. Keep holding sneak until it activates.'],
    ['&2&l4. GATES', '', '&l3 gates open every hour&r, near a random player in the &lOverworld&r (/wild).', '', 'Clear them for loot and XP. Higher ranks are harder, so team up.'],
    ['&2&lLEVELS & STATS', '', 'Solo Leveling has its own levels and stats.', '', 'They stack with your server level (&l/level&r, &l/stats&r) and your Tensura race. All of them make you stronger.'],
    ['&2&lTHE CAVERNS', '', 'Mobs, bosses and gathering nodes: &l/warp caverns&r', '', 'Every kill and node pays &2cash&r, bosses pay more. Kills can drop crate keys (0.5%, set bosses 5%).', '', '&4You CAN die there.'],
    ['&5&lGOOD LUCK, HUNTER!', '', 'Lost? Talk to the &lServer Guide&r NPC or the &lHunter Association&r.', '', 'Full guide on the website:', '&9overthronesmp.net/guide', '', '&8OVERTHRONE'],
  ]

  const last = {}
  const slInfo = (p) => {
    var rank = 'not evaluated', cls = 'not evaluated'
    try { var v = p.getData(Java.loadClass('net.solocraft.network.SololevelingModVariables').PLAYER_VARIABLES_ATTACHMENT.get()); if (String(v.ranking) != '') rank = String(v.ranking) } catch (e) { }
    try { if (typeof hudClass === 'function') { var c = String(hudClass(p)); if (c && c != '-') cls = c } } catch (e) { }
    return [rank, cls]
  }
  // a book page shows 14 lines, 114 pixels wide. The text above is word-wrapped here (colours carry over to the next
  // line) and then packed 14 lines per page, so nothing is ever cut off and pages are full.
  const WIDE = { i: 2, l: 3, t: 4, I: 4, f: 5, k: 5, ' ': 4, '!': 2, '.': 2, ',': 2, ':': 2, ';': 2, '|': 2, "'": 2, '`': 3, '"': 4, '(': 4, ')': 4, '*': 4, '[': 4, ']': 4, '{': 4, '}': 4, '<': 5, '>': 5, '@': 7, '~': 7 }
  const charW = (c, bold) => (WIDE[c] != null ? WIDE[c] : 6) + (bold ? 1 : 0)
  const MAXW = 112, LINES = 14
  const wrap = (line) => {
    var s = String(line), out = [], cur = '', w = 0, prefix = '', bold = false, word = '', ww = 0, wordPrefix = ''
    var push = () => { out.push(cur); cur = wordPrefix; w = 0 }   // the next line starts in the colour the word started in
    var addWord = () => {
      if (!word) return
      var space = w > 0 ? charW(' ', bold) : 0
      if (w > 0 && w + space + ww > MAXW) { push(); space = 0 }
      cur += (space ? ' ' : '') + word; w += space + ww
      word = ''; ww = 0
    }
    for (var i = 0; i < s.length; i++) {
      var c = s[i]
      if (word === '') wordPrefix = prefix
      if (c == '&' && i + 1 < s.length && /[0-9a-flr]/i.test(s[i + 1])) {
        var k = s[i + 1].toLowerCase()
        word += '&' + k
        if (k == 'l') { if (!bold) prefix += '&l'; bold = true } else { bold = false; prefix = k == 'r' ? '' : '&' + k }
        i++; continue
      }
      if (c == ' ') { addWord(); continue }
      word += c; ww += charW(c, bold)
    }
    addWord()
    if (cur !== '' || !out.length) out.push(cur)
    // leading spaces of indented lines were dropped by the word split: keep the indent on the first line
    var m = String(line).match(/^ +/)
    if (m && out.length) out[0] = m[0] + out[0]
    return out
  }
  // sections flow one after another (an empty line between them); a section starts on a new page when fewer than
  // 5 lines are left, so its title is never alone at the bottom of a page. The cover always gets its own page.
  const paginate = (pages) => {
    var out = [], cur = []
    var flush = () => { while (cur.length && cur[cur.length - 1] === '') cur.pop(); if (cur.length) out.push(cur); cur = [] }
    pages.forEach((pg, idx) => {
      var lines = []
      pg.forEach(l => { if (l === '') lines.push(''); else wrap(l).forEach(x => lines.push(x)) })
      if (idx == 1) flush()
      if (cur.length && LINES - cur.length - 1 < Math.min(5, lines.length)) flush()
      if (cur.length) cur.push('')
      lines.forEach(l => {
        if (cur.length >= LINES) flush()
        if (!cur.length && l === '') return
        cur.push(l)
      })
    })
    flush()
    return out
  }
  // the /give command for a written book (1.21.1: each page is a JSON text component in a string)
  const bookCmd = (name, title, pages) => {
    var pj = paginate(pages).map(pg => "'" + pageJson(pg).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'")
    return 'give ' + name + ' minecraft:written_book[written_book_content={title:"' + title + '",author:"OVERTHRONE",pages:[' + pj.join(',') + ']}]'
  }
  otGiveGuideBook = (p, which) => {
    var now = Date.now(), k = p.username + '|' + which
    if (last[k] && now - last[k] < COOLDOWN_MS) { p.tell('§7You just got that book. §8(wait ' + Math.ceil((COOLDOWN_MS - (now - last[k])) / 1000) + 's)'); return false }
    last[k] = now
    var info = which == 'sl' ? slInfo(p) : null
    var cmd = which == 'sl' ? bookCmd(p.username, 'Solo Leveling Guide', SL(info[0], info[1])) : bookCmd(p.username, 'Tensura Guide', TENSURA)
    p.server.runCommandSilent(cmd)
    p.server.runCommandSilent('execute at ' + p.username + ' run playsound minecraft:item.book.page_turn player ' + p.username + ' ~ ~ ~ 1 1')
    p.tell(which == 'sl' ? '§5§l📖 §dYou got the §5§lSolo Leveling Guide§d book! §7Right-click it to read.' : '§3§l📖 §bYou got the §3§lTensura Guide§b book! §7Right-click it to read.')
    return true
  }
  // for tests / other scripts
  otGiveGuideBook.bookCmd = bookCmd
  otGiveGuideBook.pages = { tensura: TENSURA, sl: SL }
  otGiveGuideBook.paginate = paginate

  ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(Commands.literal('tensurabook').executes(ctx => { otGiveGuideBook(ctx.source.playerOrException, 'tensura'); return 1 }))
    event.register(Commands.literal('slbook').executes(ctx => { otGiveGuideBook(ctx.source.playerOrException, 'sl'); return 1 }))
  })
})()
