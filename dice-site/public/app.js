// ColorRoll page.
//
// The dice are never decided here. Each roll is a POST to /api/roll; the
// Worker picks the faces, saves the roll and sends it back, and the page only
// animates and shows what the server returned. If the API can't be reached
// when the page loads (opened as a plain file, or a preview), the page falls
// back to "preview mode": rolls are made and kept in this browser only and a
// banner says they can't be verified.

(() => {
  const COLORS = [
    { name: "Red", v: "--red", cls: "c-red" },
    { name: "Orange", v: "--orange", cls: "c-orange" },
    { name: "Yellow", v: "--yellow", cls: "c-yellow" },
    { name: "Green", v: "--green", cls: "c-green" },
    { name: "Blue", v: "--blue", cls: "c-blue" },
    { name: "Purple", v: "--purple", cls: "c-purple" }
  ];
  const THEMES = window.THEMES;
  const themeById = (id) => THEMES.find((t) => t.id === id);
  // Older theme names that were renamed.
  const OLD_THEMES = {
    "sab-blue": "dark-blue", "sab-green": "dark-green", "sab-red": "dark-red", "sab-black": "black",
    ocean: "underwater", midnight: "void", galaxy: "void", arctic: "frozen", desert: "egypt",
    sakura: "candy", haunted: "hell", blood: "hell", storm: "void", casino: "jungle"
  };
  const KEY_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const ID_RE = /^[A-HJ-NP-Za-km-z2-9]{10}$/;
  const MIN_SPIN_MS = 630;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };

  const store = {
    get(k, d) { try { const v = localStorage.getItem("colorroll:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("colorroll:" + k, JSON.stringify(v)); } catch {} }
  };

  function randomString(chars, len) {
    const limit = 256 - (256 % chars.length);
    let out = "";
    const buf = new Uint8Array(len * 2);
    while (out.length < len) {
      crypto.getRandomValues(buf);
      for (const b of buf) if (b < limit && out.length < len) out += chars[b % chars.length];
    }
    return out;
  }

  // Same hash the Worker uses, so the page knows its public roller ID before the first roll.
  async function rollerFromKey(key) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("colorroll:" + key));
    return [...new Uint8Array(digest)].slice(0, 6).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // ---- state ----
  const params = new URLSearchParams(location.search);
  const urlN = parseInt(params.get("n") || (location.pathname.match(/\/([1-6])\/?$/) || [])[1] || (location.hash.match(/^#([1-6])$/) || [])[1], 10);
  const state = {
    n: urlN >= 1 && urlN <= 6 ? urlN : store.get("n", 4),
    type: store.get("type", "color"),
    skin: params.get("theme") || store.get("skin", "hell"),
    sound: store.get("sound", true),
    volume: Math.min(1, Math.max(0, store.get("volume", 0.8))),
    comfort: store.get("comfort", false),
    counter: store.get("counter", 0),
    key: store.get("key", ""),
    roller: "",
    // The session code shown under the dice. Kept for the whole visit, but a refresh
    // starts a new code — a streamer who keeps refreshing to escape a bad history
    // leaves a trail of short sessions.
    session: "",
    history: [],
    current: null,
    preview: false
  };
  state.skin = OLD_THEMES[state.skin] || state.skin;
  if (!themeById(state.skin)) state.skin = "hell";
  if (!["color", "number"].includes(state.type)) state.type = "color";
  if (!(state.n >= 1 && state.n <= 6)) state.n = 4;
  if (!/^[A-Za-z0-9]{24,64}$/.test(state.key)) { state.key = randomString(KEY_CHARS, 32); store.set("key", state.key); }
  // One session per visit. It is kept in this tab while moving between ColorRoll
  // pages (Lounge, About, ...), and starts fresh when the page is refreshed or the
  // tab/site is closed (sessionStorage is cleared then).
  const tab = {
    get(k) { try { return JSON.parse(sessionStorage.getItem("colorroll:" + k)); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem("colorroll:" + k, JSON.stringify(v)); } catch {} }
  };
  const navType = ((performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) || {}).type;
  const saved = navType === "reload" ? null : tab.get("visit");
  const resumed = !!(saved && ID_RE.test(saved.session || ""));
  state.session = resumed ? saved.session : randomString(ID_CHARS, 10);
  if (resumed) {
    state.history = Array.isArray(saved.history) ? saved.history.slice(0, 20) : [];
    state.current = saved.current || null;
  }
  const saveVisit = () => tab.set("visit", { session: state.session, history: state.history, current: state.current });
  saveVisit();
  const save = () => ["n", "type", "skin", "sound", "volume", "counter", "comfort"].forEach((k) => store.set(k, state[k]));

  // ---- API (server, or this browser in preview mode) ----
  async function request(path, options) {
    let res;
    try {
      res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
    } catch {
      throw new Error("Can't reach the dice server. Check your connection and try again.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "The dice server had a problem."), { status: res.status });
    return data;
  }
  const server = {
    roll: (dice, kind) => request("/api/roll", { method: "POST", body: JSON.stringify({ key: state.key, dice, kind, session: state.session }) }).then((d) => d.roll),
    get: (id) => request("/api/roll/" + encodeURIComponent(id)),
    session: (code) => request("/api/session/" + encodeURIComponent(code)),
    history: (roller) => request("/api/roller/" + roller).then((d) => d.rolls),
    roller: (roller) => request("/api/roller/" + encodeURIComponent(roller)),
    report: (rollId, message) => request("/api/report", { method: "POST", body: JSON.stringify({ rollId, message }) }),
    recent: () => request("/api/recent").then((d) => d.rolls)
  };
  const preview = {
    all: () => { const a = store.get("preview-rolls", []); return Array.isArray(a) ? a : []; },
    async roll(dice, kind) {
      const all = preview.all();
      const mine = all.filter((r) => r.roller === state.roller);
      const faces = Array.from({ length: dice }, () => Number(randomString("012345", 1)));
      const roll = { id: randomString(ID_CHARS, 10), roller: state.roller, seq: (mine[0] ? mine[0].seq : 0) + 1, dice, kind, faces, at: new Date().toISOString(), session: state.session };
      all.unshift(roll);
      store.set("preview-rolls", all.slice(0, 500));
      return roll;
    },
    async session(code) {
      const rolls = preview.all().filter((r) => r.session === code).sort((a, b) => a.at.localeCompare(b.at));
      if (!rolls.length) throw Object.assign(new Error("No session has this code."), { status: 404 });
      return { session: code, roller: rolls[0].roller, rolls, flag: null };
    },
    async get(id) {
      const all = preview.all();
      const roll = all.find((r) => r.id === id);
      if (!roll) throw Object.assign(new Error("No roll has this ID. A made-up or edited ID will never be found."), { status: 404 });
      const same = all.filter((r) => r.roller === roll.roller);
      return {
        roll,
        before: same.filter((r) => r.seq < roll.seq).slice(0, 5),
        after: same.filter((r) => r.seq > roll.seq).reverse().slice(0, 5),
        flag: null
      };
    },
    history: async (roller) => preview.all().filter((r) => r.roller === roller).slice(0, 20),
    roller: async (roller) => ({ rolls: preview.all().filter((r) => r.roller === roller).slice(0, 20), flag: null }),
    report: async () => ({ ok: true }),
    recent: async () => preview.all().slice(0, 24)
  };
  const api = () => (state.preview ? preview : server);

  async function detectServer() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch("/api/health", { signal: ctrl.signal });
      clearTimeout(t);
      const data = await res.json();
      return !!data.ok;
    } catch {
      return false;
    }
  }

  // ---- time ----
  const clock = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });
  const fullDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" });
  function ago(iso) {
    const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
    if (s < 5) return "just now";
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    return Math.floor(s / 86400) + " days ago";
  }
  function gap(a, b) {
    const s = Math.round((Date.parse(b) - Date.parse(a)) / 1000);
    if (s < 60) return "+" + s + "s";
    if (s < 3600) return "+" + Math.floor(s / 60) + "m " + (s % 60) + "s";
    return "+" + Math.floor(s / 3600) + "h " + Math.floor((s % 3600) / 60) + "m";
  }
  function agoSpan(iso) {
    const n = el("span", { textContent: ago(iso) });
    n.dataset.ago = iso;
    return n;
  }
  function tickTimes() {
    if (state.current) $("rollMeta").replaceChildren("Roll ", el("b", { textContent: "#" + state.current.seq }), " · ", clock.format(new Date(state.current.at)), " · ", el("b", { textContent: ago(state.current.at) }));
    document.querySelectorAll("[data-ago]").forEach((n) => (n.textContent = ago(n.dataset.ago)));
  }

  // ---- dice ----
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function makeDie(type, mini) {
    const die = el("div", { className: "die" + (type === "number" ? " num" : "") + (mini ? " mini" : "") });
    const face = die.appendChild(el("div", { className: "face" }));
    if (type === "number") for (let i = 0; i < 9; i++) face.append(el("span", { className: "pip off" }));
    else face.append(el("span", { className: "dot" }));
    return die;
  }
  function setDie(die, f) {
    const face = die.firstChild;
    face.classList.remove("blank");
    if (die.classList.contains("num")) {
      const on = PIPS[f + 1];
      [...face.children].forEach((p, i) => p.classList.toggle("off", !on.includes(i)));
      die.classList.toggle("red-one", f === 0);
    } else {
      face.style.setProperty("--c", `var(${COLORS[f].v})`);
      die.style.setProperty("--glow", `var(${COLORS[f].v})`);
    }
    return die;
  }
  const die = (f, type, mini) => setDie(makeDie(type, mini), f);
  const faceName = (f, type) => (type === "number" ? String(f + 1) : COLORS[f].name);
  const describe = (r) => r.faces.map((f) => faceName(f, r.kind)).join(", ");
  const diceSet = (r, mini = true) => el("div", { className: "set", title: describe(r) }, ...r.faces.map((f) => die(f, r.kind, mini)));

  const diceEl = $("dice");
  function layoutDice(n, type) {
    diceEl.style.setProperty("--n", n);
    if (diceEl.children.length === n && diceEl.dataset.type === type) return;
    diceEl.replaceChildren(...Array.from({ length: n }, (_, i) => { const d = makeDie(type); d.style.setProperty("--i", i); return d; }));
    diceEl.dataset.type = type;
  }
  function showFaces(faces, type) {
    layoutDice(faces.length, type);
    faces.forEach((f, i) => setDie(diceEl.children[i], f));
    diceEl.setAttribute("aria-label", "Dice: " + faces.map((f) => faceName(f, type)).join(", "));
  }
  function showRoll(r) {
    state.current = r;
    showFaces(r.faces, r.kind);
    $("rollId").textContent = r.session || state.session;
    $("streak").textContent = r.seq;
    tickTimes();
  }
  function showBlank() {
    // Placeholder faces until the first real roll arrives; the session code shows right away.
    layoutDice(state.n, state.type);
    $("rollId").textContent = state.session;
    [...diceEl.children].forEach((d, i) => setDie(d, i % 6));
    $("rollMeta").textContent = "Press Roll again to roll";
  }

  // ---- sound (WebAudio) ----
  // Modelled on a real plastic-dice roll: a dense shaker rattle that builds a
  // little, then a louder cluster as the dice drop and settle. A master gain is
  // driven by the volume slider; the Sound switch mutes everything.
  let audio, noiseBuf, master, sampleBuf = null, sampleReq = false;
  function ac() {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      const len = Math.floor(audio.sampleRate * 0.4);
      noiseBuf = audio.createBuffer(1, len, audio.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      master = audio.createGain();
      master.gain.value = state.volume;
      master.connect(audio.destination);
      // The real ColorRoll dice clack, recorded from the original site.
      if (!sampleReq) {
        sampleReq = true;
        fetch("/sounds/dice.mp3").then((r) => r.arrayBuffer()).then((b) => audio.decodeAudioData(b)).then((buf) => { sampleBuf = buf; }).catch(() => {});
      }
    }
    return audio;
  }
  // Play the recorded dice clack, pitched slightly for variety. Returns false if
  // the sample isn't loaded yet, so the caller can fall back to the synth.
  function playSample(delay, vol, rate) {
    if (!state.sound || !sampleBuf) return false;
    try {
      const a = ac(), t = a.currentTime + delay, s = a.createBufferSource(), g = a.createGain();
      s.buffer = sampleBuf; s.playbackRate.value = rate;
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      s.connect(g).connect(master); s.start(t);
      return true;
    } catch { return false; }
  }
  function setVolume(v) {
    state.volume = Math.min(1, Math.max(0, v));
    if (master) master.gain.value = state.volume;
  }
  function tone(freq, dur, { type = "sine", vol = 0.12, to = freq, delay = 0 } = {}) {
    if (!state.sound) return;
    try {
      const a = ac(), t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.03);
    } catch {}
  }
  function noise(dur, { vol = 0.14, freq = 1600, q = 0.8, delay = 0 } = {}) {
    if (!state.sound) return;
    try {
      const a = ac(), t = a.currentTime + delay, s = a.createBufferSource(); s.buffer = noiseBuf;
      const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
      const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur + 0.02);
    } catch {}
  }
  // One "clack" of dice hitting — a short bright noise transient plus a low knock,
  // like plastic dice tumbling against each other.
  function clack(delay, vol) {
    // sharp top-end "tick" of the plastic edge
    noise(0.020, { vol: vol, freq: 3200 + Math.random() * 2600, q: 2.6, delay });
    // woody mid "knock" — the body of the dice hitting
    noise(0.05, { vol: vol * 0.6, freq: 680 + Math.random() * 360, q: 1.0, delay });
    // low thunk for weight
    tone(92 + Math.random() * 55, 0.055, { type: "triangle", vol: vol * 0.32, to: 50, delay });
  }
  // Dice shaking in a cup: dense clatter that swells slightly toward the middle
  // then thins as they settle — matches the roll sound on sites like online-dice.
  function rollSound() {
    if (!state.sound) return;
    // The recorded roll clip is the whole shake-and-settle; play it once, at true pitch.
    if (playSample(0, 0.9, 1.0)) return;
    // Synth fallback (used only until the sample has loaded).
    const dur = MIN_SPIN_MS / 1000;
    let t = 0;
    while (t < dur) {
      const prog = t / dur;
      const swell = 1 - Math.abs(prog - 0.45) * 1.1; // louder in the middle of the shake
      const v = (0.07 + Math.random() * 0.04) * Math.max(0.5, swell);
      clack(t, v);
      if (Math.random() < 0.5) clack(t + 0.010 + Math.random() * 0.018, v * 0.6);
      t += 0.024 + Math.random() * 0.04 + prog * 0.06; // gaps widen as they settle
    }
  }
  // Each die drops and settles: a knock plus a quick secondary bounce — no musical
  // note, so it sounds like real dice landing rather than a chime.
  function landTone(i) {
    if (sampleBuf) return; // the roll clip already includes the dice settling
    clack(0, 0.17);
    clack(0.035 + Math.random() * 0.03, 0.1);
  }

  const SUSPENSE = ["What color will it be?", "Here we go!", "Rolling…"];

  // Blank the die (plain white) so the colour is hidden while the dice shake.
  function setBlank(die) {
    die.firstChild.classList.add("blank");
    die.style.setProperty("--glow", "transparent");
    if (die.classList.contains("num")) [...die.firstChild.children].forEach((p) => p.classList.add("off"));
  }

  // Reveal the dice one at a time, left to right, with a pop and a climbing note.
  function revealRoll(r) {
    state.current = r;
    layoutDice(r.faces.length, r.kind);
    diceEl.setAttribute("aria-label", "Dice: " + r.faces.map((f) => faceName(f, r.kind)).join(", "));
    $("rollId").textContent = r.session || state.session;
    $("streak").textContent = r.seq;
    tickTimes();
    r.faces.forEach((f, i) => {
      const d = diceEl.children[i];
      setTimeout(() => {
        setDie(d, f);
        if (!reduced) { d.classList.remove("pop"); void d.offsetWidth; d.classList.add("pop"); }
        landTone(i);
      }, reduced ? 0 : i * 140);
    });
  }

  // ---- rolling ----
  let rolling = false;
  async function roll() {
    if (rolling) return;
    rolling = true;
    $("rollErr").hidden = true;
    const asked = api().roll(state.n, state.type);
    // Eye comfort still animates (it's safe now — the colour is hidden while the
    // dice shake, so there's no flashing). Only reduce-motion skips the animation.
    const animate = !reduced;
    let capTimer;
    if (animate) {
      layoutDice(state.n, state.type);
      diceEl.classList.remove("landed");
      [...diceEl.children].forEach((d) => { d.classList.remove("pop"); setBlank(d); });
      diceEl.classList.add("shaking");
      $("suspense").textContent = SUSPENSE[Math.floor(Math.random() * SUSPENSE.length)];
      $("suspense").hidden = false;
      rollSound();
      capTimer = setTimeout(() => { if (rolling) $("suspense").textContent = "Let's go!"; }, MIN_SPIN_MS * 0.55);
    }
    try {
      const [r] = await Promise.all([asked, new Promise((ok) => setTimeout(ok, animate ? MIN_SPIN_MS : 0))]);
      clearTimeout(capTimer);
      diceEl.classList.remove("shaking");
      $("suspense").hidden = true;
      revealRoll(r);
      state.history.unshift(r);
      state.history.length = Math.min(state.history.length, 20);
      renderHistory();
      saveVisit();
      $("announce").textContent = "Rolled " + describe(r);
    } catch (err) {
      clearTimeout(capTimer);
      diceEl.classList.remove("shaking");
      $("suspense").hidden = true;
      if (state.current && state.current.dice === state.n && state.current.kind === state.type) showRoll(state.current);
      else showBlank();
      $("rollErr").textContent = err.message;
      $("rollErr").hidden = false;
    } finally {
      rolling = false;
    }
  }

  // ---- history panel ----
  function renderHistory() {
    const h = state.history;
    const counts = [0, 0, 0, 0, 0, 0];
    h.forEach((r) => r.faces.forEach((f) => counts[f]++));
    const order = counts.map((c, f) => [f, c]).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
    const chip = (f, label) => el("span", { className: "chip" }, die(f, state.type, true), label);
    const empty = () => el("span", { className: "empty", textContent: "No rolls yet" });
    $("stats").replaceChildren(...(order.length ? order.map(([f, c], i) => chip(f, `x${c}` + (i === 0 ? " 🏆" : ""))) : [empty()]));

    // Longest run of back-to-back rolls that contain the same face.
    let best = { f: -1, run: 0 };
    for (let f = 0; f < 6; f++) {
      let cur = 0;
      for (let i = h.length - 1; i >= 0; i--) {
        cur = h[i].faces.includes(f) ? cur + 1 : 0;
        if (cur > best.run) best = { f, run: cur };
      }
    }
    $("longest").replaceChildren(best.run ? chip(best.f, `x${best.run} 🔥`) : empty());

    const rows = [];
    h.forEach((r, i) => {
      if (i < 2) rows.push(el("h3", { textContent: i === 0 ? "This roll:" : "Previous rolls:" }));
      const b = el("button", { type: "button", className: "row", title: "Verify roll " + r.id },
        el("span", { className: "no", textContent: `${i + 1}.` }),
        diceSet(r),
        el("span", { className: "when", textContent: clock.format(new Date(r.at)) }));
      b.addEventListener("click", () => openVerify(r.id));
      rows.push(b);
    });
    if (!rows.length) rows.push(el("p", { className: "empty", textContent: "Your rolls will show up here. Tap one to see its verify page." }));
    $("rolls").replaceChildren(...rows);
  }

  function renderPossible() {
    const p = $("possible");
    if (state.type === "number") { p.textContent = "Possible numbers are 1, 2, 3, 4, 5 and 6."; return; }
    p.replaceChildren("Possible colors are: ");
    COLORS.forEach((c, i) => {
      p.append(el("b", { className: c.cls, textContent: c.name }));
      p.append(i < COLORS.length - 2 ? ", " : i === COLORS.length - 2 ? " and " : ".");
    });
  }

  // ---- themes ----
  const UI_VARS = { bg: "--bg", panel: "--panel", panelSolid: "--panel-solid", edge: "--edge", select: "--select-fg", pageFg: "--page-fg", brand: "--brand", brandAccent: "--brand-accent", accent: "--accent", accentFg: "--accent-fg" };
  const UI_DEFAULTS = { pageFg: "rgba(255, 255, 255, .78)", brand: "#ffffff", brandAccent: "var(--go)", accent: "#ffe100", accentFg: "#3a1d00" };
  function buildThemeMenu() {
    const groups = new Map();
    for (const t of THEMES) {
      if (!groups.has(t.group)) groups.set(t.group, el("optgroup", { label: t.group }));
      const o = el("option", { value: t.id, textContent: t.name });
      o.style.color = t.ui.select;
      groups.get(t.group).append(o);
    }
    $("skin").replaceChildren(...groups.values());
  }
  // The logo PNG is red (hue ~4°); rotate its hue to the theme's accent so it recolors per theme.
  function logoHue(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
    if (!m) return "0deg";
    const n = parseInt(m[1], 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d < 0.03) return "0deg"; // near-grey accent: leave the logo red
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = h * 60; if (h < 0) h += 360;
    return Math.round(((h - 4) % 360 + 360) % 360) + "deg";
  }
  function applyTheme() {
    const t = themeById(state.skin);
    const root = document.documentElement.style;
    for (const [k, v] of Object.entries(UI_VARS)) root.setProperty(v, t.ui[k] || UI_DEFAULTS[k] || "");
    root.setProperty("--logo-hue", logoHue(t.ui.accent));
    window.Scene.use(t);
  }

  function applySettings() {
    applyTheme();
    $("count").value = state.n;
    $("type").value = state.type;
    $("skin").value = state.skin;
    $("sound").checked = state.sound;
    $("vol").value = state.volume;
    $("comfort").checked = state.comfort;
    document.body.classList.toggle("comfort", state.comfort);
    $("counter").textContent = state.counter;
    renderPossible();
  }

  // ---- verify dialog ----
  const vDlg = $("verifyDlg");
  const ROLLER_RE = /^[0-9a-f]{12}$/;
  const verifyLink = (id) => location.origin + location.pathname + "?verify=" + id;

  // A banner shown at the top of a result when the owner has flagged the roller.
  function flagBanner(flag) {
    if (!flag || !flag.flagged) return null;
    const title = flag.banned ? "Banned roller." : "Flagged roller.";
    const text = (flag.banned
      ? "The owner has banned this roller for cheating, so they can no longer roll here. "
      : "The owner has flagged this roller for cheating. ") + (flag.label ? `Reason: ${flag.label}. ` : "") + "Be careful trusting their rolls.";
    return el("div", { className: "verdict warn" }, el("span", { className: "mark", textContent: "!", ariaHidden: "true" }), el("div", {}, title, el("small", { textContent: text })));
  }

  async function checkId(raw) {
    const id = raw.trim();
    const out = $("vResult");
    const isCode = ID_RE.test(id);        // 10 chars: a session code (normal) or an older single-roll id
    const isRoller = ROLLER_RE.test(id);  // 12 hex: a roller id
    if (!isCode && !isRoller) {
      out.replaceChildren(verdict(false, "That isn't an ID.", "A session ID is 10 letters and numbers (like 5T2mvXJ825). A roller ID is 12 letters a–f and numbers."));
      return;
    }
    out.replaceChildren(el("p", { textContent: "Checking…" }));
    try {
      if (isRoller) return await showRoller(id);
      // A 10-character code is almost always a session; fall back to a single roll id.
      try { return await showSession(id); }
      catch (e) { if (e.status !== 404) throw e; }
      await showRoll(id);
    } catch (err) {
      out.replaceChildren(err.status === 404
        ? verdict(false, "Not a real ID.", `No session or roll with the ID ${id} was ever made on ${location.host || "this site"}. If a streamer showed you this ID, nothing was rolled here under it.`)
        : verdict(false, "Couldn't check right now.", err.message));
    }
  }

  async function showSession(code) {
    const data = await api().session(code); // throws 404 if no such session
    const out = $("vResult");
    const rolls = data.rolls; // chronological
    const rows = rolls.map((x, i) => {
      const prev = rolls[i - 1];
      return el("div", { className: "vrow" },
        el("span", { className: "seq", textContent: "#" + (i + 1) }),
        diceSet(x),
        el("span", { className: "when" }, el("b", { textContent: clock.format(new Date(x.at)) }), el("br"), i ? gap(prev.at, x.at) : ""));
    });
    const copy = el("button", { type: "button", className: "ghost", textContent: "Copy verify link" });
    copy.addEventListener("click", () => copyText(verifyLink(code), copy, "Copy verify link"));
    out.replaceChildren(...[
      flagBanner(data.flag),
      verdict(true, "Verified session.", `This is every roll made under ID ${code} on ${location.host || "this site"} — ${rolls.length} roll${rolls.length === 1 ? "" : "s"} in the order they happened. If a streamer only showed some of these on stream, the rest are re-rolls they hid.`),
      el("h3", { textContent: "All rolls under this ID" }),
      el("div", { className: "vlist" }, ...rows),
      el("div", { className: "share" }, copy),
      reportBlock(rolls.length ? rolls[rolls.length - 1].id : "")
    ].filter(Boolean));
  }

  async function showRoll(id) {
    const data = await api().get(id);
    const r = data.roll;
    const out = $("vResult");
    const box = el("div", { className: "dice" }, ...r.faces.map((f) => die(f, r.kind)));
    box.style.setProperty("--n", r.dice);

    const rollerBtn = el("button", { type: "button", className: "linkish", textContent: r.roller + (r.roller === state.roller ? " (you)" : "") });
    rollerBtn.addEventListener("click", () => { $("vId").value = r.roller; checkId(r.roller); });
    const facts = el("dl", { className: "facts" },
      el("dt", { textContent: "Result" }), el("dd", { textContent: describe(r) }),
      el("dt", { textContent: "Rolled at" }), el("dd", {}, fullDate.format(new Date(r.at)), " (", agoSpan(r.at), ")"),
      el("dt", { textContent: "Roller" }), el("dd", {}, rollerBtn),
      el("dt", { textContent: "Roll number" }), el("dd", { textContent: `#${r.seq} by this roller` }));

    // Timeline: the same roller's rolls around this one, oldest first, with the time between them.
    const line = [...data.before].reverse().concat([r], data.after);
    const list = el("div", { className: "vlist" }, ...line.map((x, i) => {
      const idBtn = el("button", { type: "button", textContent: x.id });
      idBtn.addEventListener("click", () => { $("vId").value = x.id; checkId(x.id); });
      return el("div", { className: "vrow" + (x.id === r.id ? " me" : "") },
        el("span", { className: "seq", textContent: "#" + x.seq }),
        el("div", {}, idBtn, diceSet(x)),
        el("span", { className: "when" }, el("b", { textContent: clock.format(new Date(x.at)) }), el("br"), i ? gap(line[i - 1].at, x.at) : ""));
    }));

    const copy = el("button", { type: "button", className: "ghost", textContent: "Copy verify link" });
    copy.addEventListener("click", () => copyText(verifyLink(r.id), copy, "Copy verify link"));

    out.replaceChildren(...[
      flagBanner(data.flag),
      verdict(true, "Official roll.", `This roll was made and saved by the ${location.host || "ColorRoll"} server. If the dice on stream match these, the roll is real.`),
      box,
      facts,
      el("h3", { textContent: "Rolls by the same roller" }),
      el("p", { className: "tl-note", textContent: "Highlighted is the roll you checked. Extra rolls right before it that weren't shown on stream mean the streamer re-rolled until they liked the result." }),
      list,
      el("div", { className: "share" }, copy),
      reportBlock(r.id)
    ].filter(Boolean));
  }

  async function showRoller(roller) {
    const data = await api().roller(roller);
    const out = $("vResult");
    if (!data.rolls.length) {
      out.replaceChildren(verdict(false, "No rolls yet.", `Nobody with the roller ID ${roller} has rolled on ${location.host || "this site"}.`));
      return;
    }
    const rows = data.rolls.map((x) => {
      const idBtn = el("button", { type: "button", textContent: x.id });
      idBtn.addEventListener("click", () => { $("vId").value = x.id; checkId(x.id); });
      return el("div", { className: "vrow" },
        el("span", { className: "seq", textContent: "#" + x.seq }),
        el("div", {}, idBtn, diceSet(x)),
        el("span", { className: "when" }, el("b", { textContent: clock.format(new Date(x.at)) })));
    });
    out.replaceChildren(...[
      flagBanner(data.flag),
      verdict(true, "Roller found.", `These are the last ${data.rolls.length} rolls by roller ${roller}. Tap any ID to see that roll on its own.`),
      el("div", { className: "vlist" }, ...rows),
      reportBlock("")
    ].filter(Boolean));
  }

  // A small "report this" block so players can send the owner a scam report.
  function reportBlock(rollId) {
    const wrap = el("details", { className: "report" });
    wrap.append(el("summary", { textContent: "Report this to the owner" }));
    const box = el("textarea", { className: "rtext", maxLength: 1000, rows: 3, placeholder: "What happened? e.g. streamer re-rolled until green, then showed only that roll." });
    const send = el("button", { type: "button", className: "go small", textContent: "Send report" });
    const msg = el("p", { className: "rmsg", hidden: true });
    send.addEventListener("click", async () => {
      const text = box.value.trim();
      if (text.length < 3) { msg.textContent = "Add a few words first."; msg.hidden = false; return; }
      send.disabled = true;
      try {
        await api().report(rollId, text);
        wrap.replaceChildren(el("p", { className: "rmsg ok", textContent: "Thanks — your report was sent to the owner." }));
      } catch (err) {
        msg.textContent = err.message;
        msg.hidden = false;
        send.disabled = false;
      }
    });
    wrap.append(el("div", { className: "rform" }, box, send, msg));
    return wrap;
  }

  function verdict(ok, title, text) {
    return el("div", { className: "verdict " + (ok ? "ok" : "bad") },
      el("span", { className: "mark", textContent: ok ? "✓" : "✗", ariaHidden: "true" }),
      el("div", {}, title, el("small", { textContent: text })));
  }
  function openVerify(id) {
    const target = id || state.session || (state.current && state.current.id) || "";
    $("vId").value = target;
    $("vResult").replaceChildren();
    if (!vDlg.open) vDlg.showModal();
    if (target) checkId(target);
  }
  $("verifyBtn").addEventListener("click", () => openVerify());
  $("verifyForm").addEventListener("submit", (e) => { e.preventDefault(); checkId($("vId").value); });

  // ---- odds dialog ----
  const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i; return r; };
  const pct = (p) => (p * 100 >= 10 ? (p * 100).toFixed(1) : (p * 100).toFixed(2)) + "%";
  // Odds panel: for the current number of dice, the chance your colour lands on
  // exactly k of them (fair 1-in-6 per die). Shown as a row of dice with k filled.
  function openOdds() {
    const n = state.n, what = state.type === "number" ? "number" : "color";
    $("oIntro").textContent = `You roll ${n} ${n === 1 ? "die" : "dice"} and pick one ${what}. These are the real, fair odds of it landing on exactly that many dice (each die is a true 1 in 6).`;
    const box = $("oddsTable");
    box.replaceChildren();
    const pick = state.type === "number" ? 0 : COLORS.findIndex((c) => true); // first colour as the example
    for (let k = 1; k <= n; k++) {
      const p = choose(n, k) * Math.pow(1 / 6, k) * Math.pow(5 / 6, n - k);
      // a little row of n dice, k of them coloured
      const strip = el("div", { className: "odds-dice" });
      for (let j = 0; j < n; j++) {
        const d = j < k ? die(state.type === "number" ? j : 0, state.type, true) : makeDie(state.type, true);
        if (j >= k) d.firstChild.classList.add("blank");
        strip.append(d);
      }
      const prob = (p * 100 >= 10 ? (p * 100).toFixed(1) : (p * 100).toFixed(3)) + "%";
      box.append(el("div", { className: "odds-row" },
        strip,
        el("div", { className: "odds-fig" },
          el("b", { textContent: `${k} ${k === 1 ? "die" : "dice"}` }),
          el("span", { textContent: prob }))));
    }
    $("oddsDlg").showModal();
  }
  $("oddsBtn").addEventListener("click", openOdds);

  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  });

  // ---- other controls ----
  async function copyText(text, btn, label) {
    try { await navigator.clipboard.writeText(text); btn.textContent = "Copied"; }
    catch { btn.textContent = text; }
    setTimeout(() => (btn.textContent = label), 1800);
  }
  $("copyId").addEventListener("click", (e) => copyText($("rollId").textContent, e.currentTarget, "Copy"));

  $("roll").addEventListener("click", () => roll());
  document.addEventListener("keydown", (e) => {
    if (e.repeat || document.querySelector("dialog[open]")) return;
    if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(e.target.tagName)) return;
    if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); roll(); }
  });
  $("count").addEventListener("change", (e) => { state.n = +e.target.value; save(); roll(); });
  $("type").addEventListener("change", (e) => { state.type = e.target.value; save(); renderPossible(); renderHistory(); roll(); });
  $("skin").addEventListener("change", (e) => { state.skin = e.target.value; save(); applyTheme(); });
  const navOdds = $("navOdds"); if (navOdds) navOdds.addEventListener("click", () => $("oddsBtn").click());
  const navVerify = $("navVerify"); if (navVerify) navVerify.addEventListener("click", () => $("verifyBtn").click());
  $("sound").addEventListener("change", (e) => { state.sound = e.target.checked; save(); });
  $("vol").addEventListener("input", (e) => { setVolume(parseFloat(e.target.value)); });
  $("vol").addEventListener("change", (e) => { setVolume(parseFloat(e.target.value)); save(); });
  $("comfort").addEventListener("change", (e) => { state.comfort = e.target.checked; document.body.classList.toggle("comfort", state.comfort); save(); });
  document.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => {
    state.counter += +b.dataset.d; $("counter").textContent = state.counter; save();
  }));
  $("resetCounter").addEventListener("click", () => { state.counter = 0; $("counter").textContent = 0; save(); });

  function setHistory(show) {
    $("historyPanel").hidden = !show;
    $("showHistory").hidden = show;
    store.set("history-hidden", !show);
  }
  $("hideHistory").addEventListener("click", () => setHistory(false));
  $("showHistory").addEventListener("click", () => setHistory(true));

  // ---- top streamers ----
  const TICK = '<svg class="tick" viewBox="0 0 24 24" aria-label="Verified"><path fill="#ffffff" d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3.1-1-3.1L5.2 6.3l1-3 3.2.1z"/><path fill="none" stroke="#1d0b0b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M7.8 12.3l2.8 2.8 5.6-5.8"/></svg>';
  function streamerCard(s) {
    const a = el("a", { className: "streamer" + (s.live ? " live" : ""), href: "https://www.tiktok.com/@" + encodeURIComponent(s.handle), target: "_blank", rel: "noopener noreferrer" });
    const pic = el("span", { className: "pic" });
    pic.append(s.avatar ? el("img", { src: s.avatar, alt: "", loading: "lazy", width: 50, height: 50 }) : el("span", { className: "noimg", textContent: s.name.slice(0, 1).toUpperCase() }));
    if (s.live) pic.append(el("span", { className: "badge", textContent: "Live" }));
    const name = el("span", { className: "name" }, el("span", { textContent: s.name }));
    if (s.verified) name.insertAdjacentHTML("beforeend", TICK);
    a.append(pic, el("span", { className: "who" }, name, el("span", { className: "handle", textContent: "@" + s.handle })));
    a.setAttribute("aria-label", `${s.name}, @${s.handle}${s.live ? ", live now" : ""} on TikTok`);
    return a;
  }
  async function loadStreamers() {
    let list = [];
    try { list = state.preview ? [] : (await request("/api/streamers")).streamers; } catch {}
    applyRoom(list);
    const left = [], right = [];
    list.forEach((s) => {
      const side = s.side === "left" || s.side === "right" ? s.side : left.length <= right.length ? "left" : "right";
      (side === "left" ? left : right).push(s);
    });
    for (const [panel, items] of [[$("streamersLeft"), left], [$("streamersRight"), right]]) {
      if (!panel) continue;
      panel.querySelector(".slist").replaceChildren(...items.map(streamerCard));
      panel.hidden = !items.length;
    }
    const layout = document.querySelector(".layout");
    if (layout) layout.classList.toggle("no-streamers", !list.length);
  }

  // Show the VIP room banner for a streamer, like "LEXOUSSAR'S VIP ROOM".
  function showRoom(s) {
    $("vipRoomName").textContent = (s.name || s.handle) + "'s";
    const pic = $("vipRoomPic");
    if (s.avatar) { pic.style.backgroundImage = `url(${s.avatar})`; pic.textContent = ""; }
    else { pic.style.backgroundImage = "none"; pic.textContent = ((s.name || "?")[0] || "?").toUpperCase(); }
    const live = $("vipRoomLive");
    if (s.live) { live.hidden = false; live.href = "https://www.tiktok.com/@" + encodeURIComponent(s.handle) + "/live"; }
    else live.hidden = true;
    $("vipRoom").hidden = false;
  }

  // A ?room=handle link shows that streamer's room banner.
  function applyRoom(list) {
    if (!$("vipRoom").hidden) return; // a signed-in VIP banner is already showing
    const room = (params.get("room") || "").trim().toLowerCase().replace(/^@/, "");
    const s = room && list.find((x) => (x.handle || "").toLowerCase() === room);
    if (s) showRoom(s);
  }

  // A signed-in VIP automatically sees their own room banner (server-verified).
  // This runs first and wins; a ?room link is only a fallback for logged-out viewers.
  async function loadVipRoom() {
    try {
      const res = await fetch("/vip/api/me", { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      if (d && d.streamer) showRoom(d.streamer);
    } catch {}
  }


  // ---- live rolls feed (left column) ----
  function avatarColor(s) { let h = 0; for (const c of String(s || "x")) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `hsl(${h % 360} 55% 42%)`; }
  async function renderLive() {
    if (document.hidden) return;
    let rolls = [];
    try { rolls = await api().recent(); } catch { return; }
    const feed = $("liveFeed");
    if (!feed) return;
    if (!rolls.length) { feed.replaceChildren(el("p", { className: "empty", textContent: "No rolls yet." })); return; }
    feed.replaceChildren(...rolls.map((r) => {
      const av = el("span", { className: "lr-av", textContent: (r.vip ? r.vip[0] : "P").toUpperCase() });
      av.style.background = avatarColor(r.vip || r.roller || r.id);
      const who = el("span", { className: "lr-who" + (r.vip ? " vip" : ""), textContent: r.vip ? "👑 " + r.vip : "Player" });
      const when = agoSpan(r.at); when.className = "when";
      const row = el("button", { type: "button", className: "lrow", title: "Verify roll " + r.id },
        av,
        el("span", { className: "lr-mid" }, who, diceSet(r)),
        el("span", { className: "lr-meta" }, when, el("code", { className: "lr-id", textContent: r.id })));
      row.addEventListener("click", () => openVerify(r.id));
      return row;
    }));
  }

  // ---- lounge chat (right column; same chat as /lounge) ----
  let chatLast = -1;
  async function loadChat() {
    if (document.hidden) return;
    const box = $("chatMessages");
    if (!box) return;
    let msgs = [];
    try { msgs = (await (await fetch("/api/chat")).json()).messages || []; } catch { return; }
    if (!msgs.length) { box.replaceChildren(el("p", { className: "empty", textContent: "No messages yet — say hi!" })); return; }
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    box.replaceChildren(...msgs.map((m) => el("div", { className: "cmsg" },
      el("span", { className: "cm-time", textContent: clock.format(new Date(m.at)) }),
      el("span", { className: "cm-who", textContent: m.name }),
      el("span", { className: "cm-text", textContent: m.body }))));
    if (nearBottom || msgs.length !== chatLast) box.scrollTop = box.scrollHeight;
    chatLast = msgs.length;
  }
  function setupChat() {
    const form = $("chatForm");
    if (!form) return;
    $("chatName").value = store.get("chat-name", "");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = $("chatName").value.trim(), body = $("chatBody").value.trim();
      if (!name || !body) return;
      const btn = form.querySelector(".send"); btn.disabled = true; $("chatErr").hidden = true;
      try {
        const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, body }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Couldn't send that message.");
        store.set("chat-name", name); $("chatBody").value = ""; await loadChat();
      } catch (err) { $("chatErr").textContent = err.message; $("chatErr").hidden = false; }
      finally { btn.disabled = false; $("chatBody").focus(); }
    });
  }

  // ---- site stats bar ----
  async function loadStats() {
    try {
      const s = await (await fetch("/api/stats")).json();
      const set = (id, n) => { const e = $(id); if (e) e.textContent = Number(n || 0).toLocaleString(); };
      set("statRolls", s.rolls); set("statPlayers", s.players); set("statVips", s.vips); set("statOnline", s.online);
      const oc = $("onlineCount"); if (oc) oc.textContent = Number(s.online || 0).toLocaleString();
    } catch {}
  }

  // ---- popular rooms (quick theme switch) ----
  function renderPopular() {
    const box = $("popularRooms");
    if (!box) return;
    const picks = ["frozen", "halloween", "candy", "egypt", "void", "hell", "neon", "jungle"].map(themeById).filter(Boolean);
    box.replaceChildren(...picks.map((t) => {
      const card = el("button", { type: "button", className: "room-card" + (t.id === state.skin ? " active" : ""), title: t.name });
      const prev = el("span", { className: "rc-prev" });
      if (t.image) prev.style.backgroundImage = `url(${t.image})`;
      else prev.style.background = `linear-gradient(145deg, ${t.ui.panelSolid || "#333"}, ${t.ui.accent || "#555"})`;
      card.append(prev, el("span", { className: "rc-name", textContent: t.name }));
      card.addEventListener("click", () => {
        state.skin = t.id; save(); applyTheme();
        box.querySelectorAll(".room-card").forEach((c) => c.classList.toggle("active", c === card));
        $("skin").value = t.id;
      });
      return card;
    }));
  }

  // ---- start ----
  async function start() {
    buildThemeMenu();
    applySettings();
    try { ac(); } catch {} // start loading the dice sound sample early
    if (store.get("history-hidden", false)) setHistory(false);
    showBlank();
    renderHistory();
    setInterval(tickTimes, 1000);
    const [online, roller] = await Promise.all([detectServer(), rollerFromKey(state.key)]);
    state.roller = roller;
    state.preview = !online;
    $("previewNotice").hidden = online;
    await loadVipRoom();   // signed-in VIP: show their own room first (wins over ?room)
    loadStreamers();       // populates streamers; applyRoom only fills a ?room if none shown yet
    // Coming back from another ColorRoll page keeps the same session, history and
    // last roll. A refresh or a new visit starts a new session with a fresh roll.
    renderHistory();
    renderPopular();
    if (resumed && state.current) showRoll(state.current);
    else await roll();
    loadStats(); setInterval(loadStats, 15000);
    const v = params.get("verify") || (location.hash.match(/^#verify-([A-Za-z0-9]{10})$/) || [])[1];
    if (v) openVerify(v);
  }
  start();
})();
