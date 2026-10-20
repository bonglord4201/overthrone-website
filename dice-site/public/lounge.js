// ColorRoll Lounge: everyone's recent dice + a public chat.
// All server text is rendered with textContent (never innerHTML).
(() => {
  const $ = (id) => document.getElementById(id);
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
  const COLORS = ["#e3261b", "#ff8c00", "#ffd60a", "#0b8a2a", "#1240ff", "#7d1594"];
  // Vivid palette for usernames, picked deterministically per name.
  const NAME_COLORS = ["#ff5a4d", "#4da3ff", "#43d17a", "#ffcf3a", "#c07bff", "#ff6fc0", "#ff8c3a", "#43d9d1"];
  function hash(s) { let h = 0; for (const c of String(s || "x")) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
  const nameColor = (s) => NAME_COLORS[hash(s) % NAME_COLORS.length];

  const store = {
    get(k, d) { try { const v = localStorage.getItem("colorroll:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("colorroll:" + k, JSON.stringify(v)); } catch {} }
  };

  async function api(path, options) {
    const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  const clock = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
  function ago(iso) {
    const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
    if (s < 5) return "just now";
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    return Math.floor(s / 86400) + " days ago";
  }

  function avatar(label, color, img) {
    const a = el("span", { className: "av" });
    if (img) { a.classList.add("av-img"); a.style.backgroundImage = `url(${img})`; }
    else { a.textContent = (String(label || "?")[0] || "?").toUpperCase(); a.style.background = `linear-gradient(145deg, ${color}, rgba(0,0,0,.4))`; }
    return a;
  }
  // Real VIP pictures, looked up by streamer name (public list).
  let avatars = {};
  async function loadAvatars() {
    try { const d = await api("/api/streamers"); avatars = {}; for (const s of d.streamers || []) if (s.avatar) avatars[String(s.name).toLowerCase()] = s.avatar; } catch {}
  }
  function pip(face, kind) {
    if (kind === "number") return el("span", { className: "pip num", textContent: String(face + 1) });
    const p = el("span", { className: "pip" });
    p.style.background = COLORS[face] || "#888";
    p.style.setProperty("--pc", COLORS[face] || "transparent");
    return p;
  }

  // ---- recent dice ----
  let lastTop = null;
  async function loadFeed() {
    if (document.hidden) return;
    let rolls = [];
    try { rolls = (await api("/api/recent")).rolls; } catch { return; }
    const feed = $("feed");
    if (!rolls.length) { feed.replaceChildren(el("p", { className: "empty", textContent: "No rolls yet." })); return; }
    feed.replaceChildren(...rolls.map((r) => {
      const label = r.vip || "Player";
      const col = r.vip ? nameColor(r.vip) : "#5b6072";
      const who = el("span", { className: "who" + (r.vip ? " vip" : ""), textContent: r.vip ? "♛ " + r.vip : "Player" });
      who.style.color = col;
      const mid = el("span", { className: "mid" }, who, el("span", { className: "dice-mini" }, ...r.faces.map((f) => pip(f, r.kind))));
      const meta = el("span", { className: "meta" },
        el("span", { className: "when", textContent: ago(r.at) }),
        el("code", { className: "rid", textContent: "#" + r.id }));
      const b = el("button", { type: "button", className: "frow", title: "Verify roll " + r.id },
        r.vip ? avatar(label, col, avatars[r.vip.toLowerCase()]) : el("span", { className: "av av-dice" }), mid, meta);
      b.addEventListener("click", () => { location.href = "/?verify=" + encodeURIComponent(r.id); });
      return b;
    }));
    if (lastTop !== null && rolls[0].id !== lastTop && feed.firstChild) feed.firstChild.classList.add("fresh");
    lastTop = rolls[0].id;
  }

  // ---- chat ----
  let lastCount = -1;
  async function loadChat() {
    if (document.hidden) return;
    let msgs = [];
    try { msgs = (await api("/api/chat")).messages; } catch { return; }
    const box = $("messages");
    if (!msgs.length) { box.replaceChildren(el("div", { className: "empty" }, el("span", { className: "empty-ico", textContent: "💬" }), "No messages yet — be the first to say hi!")); return; }
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    box.replaceChildren(...msgs.map((m) => {
      const col = nameColor(m.name);
      const who = el("span", { className: "cm-who", textContent: m.name });
      who.style.color = col;
      return el("div", { className: "cmsg" },
        avatar(m.name, col),
        el("div", { className: "cbody-wrap" },
          el("div", { className: "cm-top" }, who, el("span", { className: "cm-time", textContent: clock.format(new Date(m.at)) })),
          el("div", { className: "cm-text", textContent: m.body })));
    }));
    if (nearBottom || msgs.length !== lastCount) box.scrollTop = box.scrollHeight;
    lastCount = msgs.length;
  }

  // ---- real online count (distinct rollers in the last ~10 min) ----
  async function loadOnline() {
    try { const s = await api("/api/stats"); $("online").textContent = Number(s.online || 0).toLocaleString(); } catch {}
  }

  $("chatName").value = store.get("chat-name", "");
  $("chatForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("chatName").value.trim();
    const body = $("chatBody").value.trim();
    if (!name || !body) return;
    const btn = e.target.querySelector(".send");
    btn.disabled = true; $("chatErr").hidden = true;
    try {
      await api("/api/chat", { method: "POST", body: JSON.stringify({ name, body }) });
      store.set("chat-name", name);
      $("chatBody").value = "";
      await loadChat();
    } catch (err) {
      $("chatErr").textContent = err.message;
      $("chatErr").hidden = false;
    } finally { btn.disabled = false; $("chatBody").focus(); }
  });

  loadAvatars().then(loadFeed); loadChat(); loadOnline();
  setInterval(loadAvatars, 60000);
  setInterval(loadFeed, 6000);
  setInterval(loadChat, 3000);
  setInterval(loadOnline, 15000);
})();
