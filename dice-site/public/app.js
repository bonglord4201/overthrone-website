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
  const SKINS = ["blue", "sab-blue", "green", "sab-green", "red", "sab-red", "pink", "bw", "sab-black", "heaven", "hell", "underwater", "bronze", "silver", "gold", "casino", "midnight"];
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
    skin: SKINS.includes(params.get("skin")) ? params.get("skin") : store.get("skin", "hell"),
    sound: store.get("sound", true),
    counter: store.get("counter", 0),
    key: store.get("key", ""),
    roller: "",
    history: [],
    current: null,
    preview: false
  };
  if (state.skin === "ocean") state.skin = "underwater";
  if (!SKINS.includes(state.skin)) state.skin = "hell";
  if (!["color", "number"].includes(state.type)) state.type = "color";
  if (!(state.n >= 1 && state.n <= 6)) state.n = 4;
  if (!/^[A-Za-z0-9]{24,64}$/.test(state.key)) { state.key = randomString(KEY_CHARS, 32); store.set("key", state.key); }
  const save = () => ["n", "type", "skin", "sound", "counter"].forEach((k) => store.set(k, state[k]));

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
    roll: (dice, kind) => request("/api/roll", { method: "POST", body: JSON.stringify({ key: state.key, dice, kind }) }).then((d) => d.roll),
    get: (id) => request("/api/roll/" + encodeURIComponent(id)),
    history: (roller) => request("/api/roller/" + roller).then((d) => d.rolls)
  };
  const preview = {
    all: () => { const a = store.get("preview-rolls", []); return Array.isArray(a) ? a : []; },
    async roll(dice, kind) {
      const all = preview.all();
      const mine = all.filter((r) => r.roller === state.roller);
      const faces = Array.from({ length: dice }, () => Number(randomString("012345", 1)));
      const roll = { id: randomString(ID_CHARS, 10), roller: state.roller, seq: (mine[0] ? mine[0].seq : 0) + 1, dice, kind, faces, at: new Date().toISOString() };
      all.unshift(roll);
      store.set("preview-rolls", all.slice(0, 500));
      return roll;
    },
    async get(id) {
      const all = preview.all();
      const roll = all.find((r) => r.id === id);
      if (!roll) throw Object.assign(new Error("No roll has this ID. A made-up or edited ID will never be found."), { status: 404 });
      const same = all.filter((r) => r.roller === roll.roller);
      return {
        roll,
        before: same.filter((r) => r.seq < roll.seq).slice(0, 5),
        after: same.filter((r) => r.seq > roll.seq).reverse().slice(0, 5)
      };
    },
    history: async (roller) => preview.all().filter((r) => r.roller === roller).slice(0, 20)
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
    if (die.classList.contains("num")) {
      const on = PIPS[f + 1];
      [...face.children].forEach((p, i) => p.classList.toggle("off", !on.includes(i)));
      die.classList.toggle("red-one", f === 0);
    } else {
      face.style.setProperty("--c", `var(${COLORS[f].v})`);
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
    $("rollId").textContent = r.id;
    $("streak").textContent = r.seq;
    tickTimes();
  }
  function showBlank() {
    // Placeholder faces until the first real roll arrives.
    layoutDice(state.n, state.type);
    [...diceEl.children].forEach((d, i) => setDie(d, i % 6));
    $("rollId").textContent = "----------";
    $("rollMeta").textContent = "Press Go to roll";
  }

  // ---- sound ----
  let audio;
  function beep(freq, dur, kind = "triangle", vol = 0.08) {
    if (!state.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.type = kind; o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch {}
  }

  // ---- rolling ----
  let rolling = false;
  async function roll() {
    if (rolling) return;
    rolling = true;
    $("rollErr").hidden = true;
    const asked = api().roll(state.n, state.type);
    let timer;
    if (!reduced) {
      layoutDice(state.n, state.type);
      diceEl.classList.remove("landed");
      diceEl.classList.add("tumbling");
      $("rollId").textContent = "··········";
      timer = setInterval(() => {
        [...diceEl.children].forEach((d) => setDie(d, Math.floor(Math.random() * 6)));
        beep(320 + Math.random() * 260, 0.04, "square", 0.03);
      }, 70);
    }
    try {
      const [r] = await Promise.all([asked, new Promise((ok) => setTimeout(ok, reduced ? 0 : MIN_SPIN_MS))]);
      clearInterval(timer);
      diceEl.classList.remove("tumbling");
      showRoll(r);
      if (!reduced) { void diceEl.offsetWidth; diceEl.classList.add("landed"); }
      state.history.unshift(r);
      state.history.length = Math.min(state.history.length, 20);
      renderHistory();
      $("announce").textContent = "Rolled " + describe(r);
      beep(150, 0.16, "sine", 0.18); beep(90, 0.22, "sine", 0.12);
    } catch (err) {
      clearInterval(timer);
      diceEl.classList.remove("tumbling");
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

  function applySettings() {
    document.documentElement.dataset.skin = state.skin;
    $("count").value = state.n;
    $("type").value = state.type;
    $("skin").value = state.skin;
    $("sound").checked = state.sound;
    $("counter").textContent = state.counter;
    renderPossible();
  }

  // ---- verify dialog ----
  const vDlg = $("verifyDlg");
  const verifyLink = (id) => location.origin + location.pathname + "?verify=" + id;

  async function checkId(raw) {
    const id = raw.trim();
    const out = $("vResult");
    if (!ID_RE.test(id)) {
      out.replaceChildren(verdict(false, "That isn't a roll ID.", "A roll ID is exactly 10 letters and numbers, like 5T2mvXJ825."));
      return;
    }
    out.replaceChildren(el("p", { textContent: "Checking…" }));
    let data;
    try {
      data = await api().get(id);
    } catch (err) {
      out.replaceChildren(err.status === 404
        ? verdict(false, "Not a real roll.", `No roll with the ID ${id} was ever made on ${location.host || "this site"}. If a streamer showed you this ID, the result was not rolled here.`)
        : verdict(false, "Couldn't check right now.", err.message));
      return;
    }
    const r = data.roll;
    const box = el("div", { className: "dice" }, ...r.faces.map((f) => die(f, r.kind)));
    box.style.setProperty("--n", r.dice);

    const facts = el("dl", { className: "facts" },
      el("dt", { textContent: "Result" }), el("dd", { textContent: describe(r) }),
      el("dt", { textContent: "Rolled at" }), el("dd", {}, fullDate.format(new Date(r.at)), " (", agoSpan(r.at), ")"),
      el("dt", { textContent: "Roller" }), el("dd", { textContent: r.roller + (r.roller === state.roller ? " (you)" : "") }),
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

    out.replaceChildren(
      verdict(true, "Official roll.", `This roll was made and saved by the ${location.host || "ColorRoll"} server. If the dice on stream match these, the roll is real.`),
      box,
      facts,
      el("h3", { textContent: "Rolls by the same roller" }),
      el("p", { className: "tl-note", textContent: "Highlighted is the roll you checked. Extra rolls right before it that weren't shown on stream mean the streamer re-rolled until they liked the result." }),
      list,
      el("div", { className: "share" }, copy));
  }
  function verdict(ok, title, text) {
    return el("div", { className: "verdict " + (ok ? "ok" : "bad") },
      el("span", { className: "mark", textContent: ok ? "✓" : "✗", ariaHidden: "true" }),
      el("div", {}, title, el("small", { textContent: text })));
  }
  function openVerify(id) {
    const target = id || (state.current && state.current.id) || "";
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
  function openOdds() {
    const n = state.n, what = state.type === "number" ? "number" : "color";
    $("oIntro").textContent = `You pick one ${what} and roll ${n} ${n === 1 ? "die" : "dice"}. This is how likely each result is.`;
    const t = $("oddsTable");
    t.replaceChildren(el("tr", {}, el("th", { textContent: `Your ${what} shows` }), el("th", { textContent: "Chance" }), el("th", { textContent: "About 1 in" })));
    const row = (label, p, hl) => t.append(el("tr", { className: hl ? "hl" : "" }, el("td", { textContent: label }), el("td", { textContent: pct(p) }), el("td", { textContent: (1 / p < 10 ? (1 / p).toFixed(1) : Math.round(1 / p).toLocaleString()) })));
    row("At least once", 1 - Math.pow(5 / 6, n), true);
    for (let k = 0; k <= n; k++) {
      const p = choose(n, k) * Math.pow(1 / 6, k) * Math.pow(5 / 6, n - k);
      row(k === 0 ? "Not at all" : k === n && n > 1 ? `On all ${n} dice` : `Exactly ${k} time${k > 1 ? "s" : ""}`, p);
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
    if (e.key === "Escape" && document.body.classList.contains("stream")) return setStream(false);
    if (e.repeat || document.querySelector("dialog[open]")) return;
    if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(e.target.tagName)) return;
    if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); roll(); }
  });
  $("count").addEventListener("change", (e) => { state.n = +e.target.value; save(); roll(); });
  $("type").addEventListener("change", (e) => { state.type = e.target.value; save(); renderPossible(); renderHistory(); roll(); });
  $("skin").addEventListener("change", (e) => { state.skin = e.target.value; save(); applySettings(); });
  $("sound").addEventListener("change", (e) => { state.sound = e.target.checked; save(); });
  document.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => {
    state.counter += +b.dataset.d; $("counter").textContent = state.counter; save();
  }));
  $("resetCounter").addEventListener("click", () => { state.counter = 0; $("counter").textContent = 0; save(); });

  function setStream(on) {
    document.body.classList.toggle("stream", on);
    $("stream").checked = on;
    $("exitStream").hidden = !on;
  }
  $("stream").addEventListener("change", (e) => setStream(e.target.checked));
  $("exitStream").addEventListener("click", () => setStream(false));

  // ---- background embers ----
  const cvs = $("embers"), ctx = cvs.getContext("2d");
  let W = 0, H = 0, sparks = [];
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cvs.width = W * dpr; cvs.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const spark = (y) => ({ x: Math.random() * W, y: y ?? H + 10, r: 0.8 + Math.random() * 2.2, vy: 0.3 + Math.random() * 0.9, vx: (Math.random() - 0.5) * 0.4, ph: Math.random() * 6.28 });
  function frame() {
    if (!document.hidden) {
      const rgb = getComputedStyle(document.documentElement).getPropertyValue("--ember").trim();
      ctx.clearRect(0, 0, W, H);
      ctx.shadowColor = `rgba(${rgb}, .9)`; ctx.shadowBlur = 8;
      for (const s of sparks) {
        s.y -= s.vy; s.ph += 0.05; s.x += s.vx + Math.sin(s.ph) * 0.3;
        if (s.y < -10) Object.assign(s, spark());
        const a = Math.max(0, Math.min(1, s.y / H)) * (0.5 + 0.5 * Math.sin(s.ph * 2));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${rgb}, ${a.toFixed(3)})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }
  if (!reduced) {
    resize();
    addEventListener("resize", resize);
    sparks = Array.from({ length: Math.round(Math.min(70, W / 18)) }, () => spark(Math.random() * H));
    requestAnimationFrame(frame);
  }

  // ---- start ----
  async function start() {
    applySettings();
    if (location.host) $("hostName").textContent = location.host;
    showBlank();
    renderHistory();
    setInterval(tickTimes, 1000);
    const [online, roller] = await Promise.all([detectServer(), rollerFromKey(state.key)]);
    state.roller = roller;
    state.preview = !online;
    $("previewNotice").hidden = online;
    try { state.history = await api().history(roller); } catch { state.history = []; }
    renderHistory();
    const last = state.history[0];
    if (last && last.dice === state.n && last.kind === state.type) showRoll(last);
    else await roll();
    const v = params.get("verify") || (location.hash.match(/^#verify-([A-Za-z0-9]{10})$/) || [])[1];
    if (v) openVerify(v);
  }
  start();
})();
