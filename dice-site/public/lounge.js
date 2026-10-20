// ColorRoll Lounge: everyone's recent dice + a public chat.
// All server text is rendered with textContent (never innerHTML), so messages
// can't inject markup.
(() => {
  const $ = (id) => document.getElementById(id);
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
  const COLORS = ["#e3261b", "#ff8c00", "#ffd60a", "#0b8a2a", "#1240ff", "#7d1594"];

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

  function pip(face, kind) {
    if (kind === "number") return el("span", { className: "pip num", textContent: String(face + 1) });
    const p = el("span", { className: "pip" });
    p.style.background = COLORS[face] || "#888";
    return p;
  }

  // ---- recent dice ----
  async function loadFeed() {
    if (document.hidden) return;
    let rolls = [];
    try { rolls = (await api("/api/recent")).rolls; } catch { return; }
    const feed = $("feed");
    if (!rolls.length) { feed.replaceChildren(el("p", { className: "empty", textContent: "No rolls yet." })); return; }
    feed.replaceChildren(...rolls.map((r) => {
      const dice = el("span", { className: "dice-mini" }, ...r.faces.map((f) => pip(f, r.kind)));
      const left = el("span", { className: "fleft" }, dice);
      if (r.vip) left.append(el("span", { className: "vip-tag", textContent: "👑 " + r.vip }));
      const meta = el("span", { className: "fmeta" },
        el("code", { className: "rid", textContent: r.id }),
        el("span", { className: "when", textContent: ago(r.at) }));
      const b = el("button", { type: "button", className: "frow", title: "Verify roll " + r.id }, left, meta);
      b.addEventListener("click", () => { location.href = "/?verify=" + encodeURIComponent(r.id); });
      return b;
    }));
  }

  // ---- chat ----
  let lastCount = -1;
  async function loadChat() {
    if (document.hidden) return;
    let msgs = [];
    try { msgs = (await api("/api/chat")).messages; } catch { return; }
    const box = $("messages");
    if (!msgs.length) { box.replaceChildren(el("p", { className: "empty", textContent: "No messages yet — say hi!" })); return; }
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    box.replaceChildren(...msgs.map((m) =>
      el("div", { className: "msg" },
        el("span", { className: "time", textContent: clock.format(new Date(m.at)) }),
        el("span", { className: "who", textContent: m.name }),
        el("span", { className: "text", textContent: m.body }))
    ));
    if (nearBottom || msgs.length !== lastCount) box.scrollTop = box.scrollHeight;
    lastCount = msgs.length;
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

  loadFeed(); loadChat();
  setInterval(loadFeed, 6000);
  setInterval(loadChat, 3000);
})();
