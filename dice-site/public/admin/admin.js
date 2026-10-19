// ColorRoll admin panel. It is only served at the secret address in the
// ADMIN_PATH secret, and everything it shows comes from that address's api/
// routes, which only answer a signed-in admin. This file holds no secrets.
//
// Sections: each tab in the top bar shows the <section id="section-NAME">
// with the same name. To add a section later, add a tab button, a section,
// and a loader in SECTIONS below.

(() => {
  const $ = (id) => document.getElementById(id);
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };

  async function api(path, method = "GET", body) {
    const res = await fetch("api/" + path, {
      method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin"
    }).catch(() => { throw new Error("Can't reach the server. Check your connection."); });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== "login") { showLogin(); throw new Error(data.error || "Sign in again."); }
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  let toastTimer;
  function toast(text) {
    $("toast").textContent = text;
    $("toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($("toast").hidden = true), 2200);
  }

  // ---- sign in ----
  function showLogin() {
    $("appView").hidden = true;
    $("loginView").hidden = false;
    $("password").focus();
  }
  async function showApp() {
    $("loginView").hidden = true;
    $("appView").hidden = false;
    openSection("streamers");
  }
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector("button");
    btn.disabled = true;
    $("loginErr").hidden = true;
    try {
      await api("login", "POST", { password: $("password").value });
      $("password").value = "";
      showApp();
    } catch (err) {
      $("loginErr").textContent = err.message;
      $("loginErr").hidden = false;
    } finally {
      btn.disabled = false;
    }
  });
  $("logout").addEventListener("click", async () => {
    await api("logout", "POST", {}).catch(() => {});
    showLogin();
  });

  // ---- sections ----
  const SECTIONS = { streamers: loadStreamers, cheats: loadCheats, reports: loadReports };
  function openSection(name) {
    document.querySelectorAll(".tab").forEach((t) => {
      const on = t.dataset.section === name;
      t.classList.toggle("on", on);
      if (on) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
    document.querySelectorAll(".section").forEach((s) => (s.hidden = s.id !== "section-" + name));
    SECTIONS[name]();
  }
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => openSection(t.dataset.section)));

  // ---- streamers ----
  let streamers = [];
  let editing = null; // the streamer being edited, or {} for a new one
  let picture;        // undefined = unchanged, null = removed, string = new data URL

  const TICK = '<svg class="tick" viewBox="0 0 24 24" aria-label="Verified"><path fill="#ffffff" d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3.1-1-3.1L5.2 6.3l1-3 3.2.1z"/><path fill="none" stroke="#1d0b0b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M7.8 12.3l2.8 2.8 5.6-5.8"/></svg>';
  const initial = (name) => (name || "?").trim().slice(0, 1).toUpperCase() || "?";

  async function loadStreamers() {
    try {
      streamers = (await api("streamers")).streamers;
      renderList();
    } catch (err) {
      $("list").replaceChildren(el("p", { className: "empty", textContent: err.message }));
    }
  }

  function renderList() {
    if (!streamers.length) {
      $("list").replaceChildren(el("p", { className: "empty", textContent: "No streamers yet. Press Add streamer to put the first one on the site." }));
      return;
    }
    $("list").replaceChildren(...streamers.map((s, i) => {
      const up = el("button", { type: "button", textContent: "▲", disabled: i === 0, ariaLabel: `Move ${s.name} up` });
      const down = el("button", { type: "button", textContent: "▼", disabled: i === streamers.length - 1, ariaLabel: `Move ${s.name} down` });
      up.addEventListener("click", () => move(i, -1));
      down.addEventListener("click", () => move(i, 1));

      const avatar = s.avatar ? el("img", { className: "avatar" + (s.live ? " live" : ""), src: s.avatar, alt: "" }) : el("span", { className: "avatar" + (s.live ? " live" : ""), textContent: initial(s.name) });

      const live = el("button", { type: "button", className: "pill live" + (s.live ? " on" : ""), textContent: s.live ? "Live" : "Offline", title: "Switch live on or off" });
      live.setAttribute("aria-pressed", String(s.live));
      live.addEventListener("click", () => quickSave(s, { live: !s.live }, s.live ? `${s.name} is offline` : `${s.name} is live`));
      const shown = el("button", { type: "button", className: "pill shown" + (s.visible ? " on" : ""), textContent: s.visible ? "Shown" : "Hidden", title: "Show or hide on the site" });
      shown.setAttribute("aria-pressed", String(s.visible));
      shown.addEventListener("click", () => quickSave(s, { visible: !s.visible }, s.visible ? `${s.name} is hidden` : `${s.name} is shown`));
      const side = el("span", { className: "pill static", textContent: s.side === "auto" ? "Auto side" : s.side === "left" ? "Left" : "Right" });

      const edit = el("button", { type: "button", className: "quiet", textContent: "Edit" });
      edit.addEventListener("click", () => openEditor(s));
      const del = el("button", { type: "button", className: "quiet danger", textContent: "Delete" });
      let armed;
      del.addEventListener("click", async () => {
        if (!armed) {
          del.textContent = "Tap again to delete";
          armed = setTimeout(() => { armed = null; del.textContent = "Delete"; }, 3000);
          return;
        }
        clearTimeout(armed);
        try {
          await api("streamers/" + s.id, "DELETE");
          toast(`${s.name} removed`);
          loadStreamers();
        } catch (err) { toast(err.message); }
      });

      return el("div", { className: "row" + (s.visible ? "" : " hidden-row") },
        el("div", { className: "move" }, up, down),
        avatar,
        el("div", { className: "who" }, el("b", { textContent: s.name + (s.verified ? " ✓" : "") }), el("small", { textContent: "@" + s.handle })),
        el("div", { className: "tags" }, live, shown, side),
        el("div", { className: "row-actions" }, edit, del));
    }));
  }

  async function quickSave(s, change, message) {
    try {
      await api("streamers/" + s.id, "PUT", change);
      toast(message);
      loadStreamers();
    } catch (err) { toast(err.message); }
  }

  async function move(i, dir) {
    const order = streamers.slice();
    [order[i], order[i + dir]] = [order[i + dir], order[i]];
    streamers = order;
    renderList();
    try { await api("streamers/order", "POST", { ids: order.map((s) => s.id) }); toast("Order saved"); }
    catch (err) { toast(err.message); loadStreamers(); }
  }

  // ---- add / edit form ----
  function openEditor(s) {
    editing = s || {};
    picture = undefined;
    $("editTitle").textContent = s ? `Edit ${s.name}` : "Add streamer";
    $("saveBtn").textContent = s ? "Save changes" : "Add streamer";
    $("fName").value = s ? s.name : "";
    $("fHandle").value = s ? s.handle : "";
    $("fSide").value = s ? s.side : "auto";
    $("fVerified").checked = s ? s.verified : true;
    $("fLive").checked = s ? s.live : false;
    $("fVisible").checked = s ? s.visible : true;
    $("fPic").value = "";
    $("editErr").hidden = true;
    $("editForm").hidden = false;
    $("addBtn").hidden = true;
    refreshPreview();
    $("editForm").scrollIntoView({ behavior: "smooth", block: "start" });
    $("fName").focus({ preventScroll: true });
  }
  function closeEditor() {
    editing = null;
    $("editForm").hidden = true;
    $("addBtn").hidden = false;
  }
  $("addBtn").addEventListener("click", () => openEditor(null));
  $("cancelEdit").addEventListener("click", closeEditor);

  const currentPicture = () => (picture === undefined ? editing && editing.avatar : picture);

  function refreshPreview() {
    const name = $("fName").value.trim() || "Streamer";
    const handle = $("fHandle").value.trim().replace(/^@/, "") || "username";
    const live = $("fLive").checked;
    const src = currentPicture();
    $("pic").replaceChildren(src ? el("img", { src, alt: "" }) : initial(name));
    $("removePic").hidden = !src;

    const pic = el("span", { className: "pic" }, src ? el("img", { src, alt: "" }) : el("span", { className: "noimg", textContent: initial(name) }));
    if (live) pic.append(el("span", { className: "badge", textContent: "Live" }));
    const nameEl = el("span", { className: "name" }, el("span", { textContent: name }));
    if ($("fVerified").checked) nameEl.insertAdjacentHTML("beforeend", TICK);
    $("preview").replaceChildren(el("div", { className: "scard" + (live ? " live" : "") }, pic, el("span", { className: "scard-who" }, nameEl, el("span", { className: "handle", textContent: "@" + handle }))));
  }
  ["fName", "fHandle", "fVerified", "fLive"].forEach((id) => $(id).addEventListener("input", refreshPreview));

  // Crop the chosen image to a 160×160 square in the browser, so uploads stay small.
  $("fPic").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const bmp = await createImageBitmap(file);
      const side = Math.min(bmp.width, bmp.height);
      const c = document.createElement("canvas");
      c.width = c.height = 160;
      c.getContext("2d").drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 160, 160);
      let url = c.toDataURL("image/webp", 0.86);
      if (!url.startsWith("data:image/webp")) url = c.toDataURL("image/jpeg", 0.86);
      picture = url;
      refreshPreview();
    } catch {
      $("editErr").textContent = "That picture couldn't be opened. Try a PNG or JPEG.";
      $("editErr").hidden = false;
    }
  });
  $("removePic").addEventListener("click", () => { picture = null; $("fPic").value = ""; refreshPreview(); });

  $("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      name: $("fName").value.trim(),
      handle: $("fHandle").value.trim().replace(/^@/, ""),
      side: $("fSide").value,
      verified: $("fVerified").checked,
      live: $("fLive").checked,
      visible: $("fVisible").checked
    };
    if (picture !== undefined) body.avatar = picture;
    $("saveBtn").disabled = true;
    $("editErr").hidden = true;
    try {
      if (editing.id) await api("streamers/" + editing.id, "PUT", body);
      else await api("streamers", "POST", body);
      toast(editing.id ? "Changes saved" : `${body.name} added`);
      closeEditor();
      loadStreamers();
    } catch (err) {
      $("editErr").textContent = err.message;
      $("editErr").hidden = false;
    } finally {
      $("saveBtn").disabled = false;
    }
  });

  // ---- catch cheats ----
  const ROLLER_RE = /^[0-9a-f]{12}$/;
  const ROLL_RE = /^[A-HJ-NP-Za-km-z2-9]{10}$/;
  const COLORS = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"];
  const SWATCH = ["#e3261b", "#ff8c00", "#ffd60a", "#0b8a2a", "#1240ff", "#7d1594"];
  const timeFull = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" });
  const timeShort = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const faceDot = (f, kind) => {
    const d = el("span", { className: "dot", title: kind === "number" ? String(f + 1) : COLORS[f] });
    if (kind === "number") { d.classList.add("num"); d.textContent = String(f + 1); }
    else d.style.background = SWATCH[f];
    return d;
  };
  const faceRow = (r) => el("span", { className: "dots" }, ...r.faces.map((f) => faceDot(f, r.kind)));

  async function loadCheats() {
    loadSuspects();
    loadFlags();
  }

  $("lookupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = $("lookupId").value.trim();
    const box = $("lookupResult");
    box.hidden = false;
    box.replaceChildren(el("p", { textContent: "Looking up…" }));
    try {
      let roller = raw;
      if (ROLL_RE.test(raw)) {
        // A 10-char code is usually a session; fall back to a single roll id. Both
        // resolve to the roller, whose full cross-session history we then load.
        const sess = await fetch("/api/session/" + raw, { credentials: "same-origin" }).then((r) => r.json()).catch(() => ({}));
        if (sess.roller) {
          roller = sess.roller;
        } else {
          const pub = await fetch("/api/roll/" + raw, { credentials: "same-origin" }).then((r) => r.json());
          if (!pub.roll) throw new Error("No session or roll has that ID.");
          roller = pub.roll.roller;
        }
      } else if (!ROLLER_RE.test(raw)) {
        throw new Error("That isn't a roller ID (12 characters) or a session/roll ID (10 characters).");
      }
      const data = await api("rollers/" + roller);
      renderLookup(data);
    } catch (err) {
      box.replaceChildren(el("p", { className: "error", textContent: err.message }));
    }
  });

  function renderLookup(data) {
    const s = data.stats;
    const f = data.flag;
    const head = el("div", { className: "lookup-head" },
      el("div", {}, el("span", { className: "mono big", textContent: data.roller }),
        f ? el("span", { className: "tag-flag" + (f.banned ? " banned" : "") , textContent: f.banned ? "Banned" : "Flagged" }) : ""),
      el("button", { type: "button", className: "primary", textContent: f ? "Edit flag / ban" : "Flag or ban" }));
    head.querySelector("button").addEventListener("click", () => openFlag(data.roller, f));

    const warn = s.bursts >= 3 || s.longestBurst >= 4;
    const summary = el("div", { className: "stat-row" },
      stat(s.total, "rolls shown"),
      stat(s.bursts, "quick re-rolls", warn),
      stat(s.longestBurst, "longest burst", s.longestBurst >= 4));
    const hint = el("p", { className: "sub", textContent: warn
      ? "This pattern looks like re-rolling: several rolls came within a few seconds of each other."
      : "Nothing jumps out, but check the times below yourself." });

    const rows = data.rolls.map((r, i) => {
      const prev = data.rolls[i + 1];
      const gapMs = prev ? Date.parse(r.at) - Date.parse(prev.at) : null;
      const quick = gapMs != null && gapMs >= 0 && gapMs < 6000;
      return el("div", { className: "crow" + (quick ? " quick" : "") },
        el("span", { className: "seq", textContent: "#" + r.seq }),
        faceRow(r),
        el("span", { className: "mono small", textContent: r.id }),
        el("span", { className: "when", textContent: timeShort.format(new Date(r.at)) + (gapMs != null ? "  (" + gapSecs(gapMs) + ")" : "") }));
    });

    $("lookupResult").replaceChildren(head, summary, hint, el("div", { className: "crows" }, ...rows));
  }
  const gapSecs = (ms) => ms < 0 ? "—" : ms < 60000 ? Math.round(ms / 1000) + "s" : Math.round(ms / 60000) + "m";
  const stat = (n, label, hot) => el("div", { className: "stat" + (hot ? " hot" : "") }, el("b", { textContent: String(n) }), el("span", { textContent: label }));

  async function loadSuspects() {
    const box = $("suspects");
    try {
      const { suspects } = await api("suspects");
      if (!suspects.length) { box.replaceChildren(el("p", { className: "empty small", textContent: "No burst-rolling in the last 7 days." })); return; }
      box.replaceChildren(...suspects.map((s) => {
        const b = el("button", { type: "button", className: "mini" + (s.flagged ? " flagged" : "") },
          el("span", { className: "mono", textContent: s.roller }),
          el("span", { className: "mini-meta", textContent: `${s.bursts} quick · burst ${s.longestBurst} · ${s.total} rolls` + (s.flagged ? " · flagged" : "") }));
        b.addEventListener("click", () => { openSection("cheats"); $("lookupId").value = s.roller; $("lookupForm").requestSubmit(); });
        return b;
      }));
    } catch (err) { box.replaceChildren(el("p", { className: "error small", textContent: err.message })); }
  }

  async function loadFlags() {
    const box = $("flags");
    try {
      const { flags } = await api("flags");
      if (!flags.length) { box.replaceChildren(el("p", { className: "empty small", textContent: "Nobody flagged yet." })); return; }
      box.replaceChildren(...flags.map((f) => {
        const b = el("button", { type: "button", className: "mini" + (f.banned ? " banned" : " flagged") },
          el("span", { className: "mono", textContent: f.roller }),
          el("span", { className: "mini-meta", textContent: (f.banned ? "Banned" : "Flagged") + (f.label ? " · " + f.label : "") }));
        b.addEventListener("click", () => { openSection("cheats"); $("lookupId").value = f.roller; $("lookupForm").requestSubmit(); });
        return b;
      }));
    } catch (err) { box.replaceChildren(el("p", { className: "error small", textContent: err.message })); }
  }

  // ---- flag dialog ----
  const flagDlg = $("flagDlg");
  let flagRoller = null;
  function openFlag(roller, existing) {
    flagRoller = roller;
    $("flagRoller").textContent = roller;
    $("flagTitle").textContent = existing ? "Edit flag" : "Flag roller";
    $("flagLabel").value = existing ? existing.label : "";
    $("flagNote").value = existing ? existing.note : "";
    $("flagBanned").checked = existing ? existing.banned : false;
    $("unflagBtn").hidden = !existing;
    flagDlg.showModal();
  }
  $("flagForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api("flags", "POST", { roller: flagRoller, banned: $("flagBanned").checked, label: $("flagLabel").value.trim(), note: $("flagNote").value.trim() });
      flagDlg.close();
      toast("Saved");
      $("lookupForm").requestSubmit();
      loadFlags();
    } catch (err) { toast(err.message); }
  });
  $("unflagBtn").addEventListener("click", async () => {
    try {
      await api("flags/" + flagRoller, "DELETE");
      flagDlg.close();
      toast("Flag removed");
      $("lookupForm").requestSubmit();
      loadFlags();
    } catch (err) { toast(err.message); }
  });
  flagDlg.addEventListener("click", (e) => { if (e.target === flagDlg || e.target.closest("[data-close-flag]")) flagDlg.close(); });

  // ---- reports ----
  async function loadReports() {
    const box = $("reports");
    try {
      const { reports } = await api("reports");
      updateReportCount(reports.filter((r) => r.status === "new").length);
      if (!reports.length) { box.replaceChildren(el("p", { className: "empty", textContent: "No reports yet." })); return; }
      box.replaceChildren(...reports.map(reportRow));
    } catch (err) { box.replaceChildren(el("p", { className: "empty", textContent: err.message })); }
  }
  function reportRow(r) {
    const idBtn = r.rollId
      ? el("button", { type: "button", className: "linkish mono", textContent: r.rollId })
      : el("span", { className: "muted", textContent: "no roll ID" });
    if (r.rollId) idBtn.addEventListener("click", () => { openSection("cheats"); $("lookupId").value = r.rollId; $("lookupForm").requestSubmit(); });

    const mark = el("button", { type: "button", className: "quiet", textContent: r.status === "new" ? "Mark reviewed" : "Mark new" });
    mark.addEventListener("click", async () => { await api("reports/" + r.id, "POST", { status: r.status === "new" ? "reviewed" : "new" }); loadReports(); });
    const del = el("button", { type: "button", className: "quiet danger", textContent: "Delete" });
    let armed;
    del.addEventListener("click", async () => {
      if (!armed) { del.textContent = "Tap again"; armed = setTimeout(() => { armed = null; del.textContent = "Delete"; }, 3000); return; }
      clearTimeout(armed); await api("reports/" + r.id, "DELETE"); loadReports();
    });

    return el("div", { className: "report-row" + (r.status === "reviewed" ? " done" : "") },
      el("div", { className: "report-top" }, idBtn, el("span", { className: "when", textContent: timeFull.format(new Date(r.at)) })),
      el("p", { className: "report-msg", textContent: r.message }),
      el("div", { className: "report-actions" }, mark, del));
  }
  function updateReportCount(n) {
    const c = $("reportCount");
    c.textContent = String(n);
    c.hidden = n === 0;
  }
  $("refreshReports").addEventListener("click", loadReports);

  // ---- start ----
  api("me").then(() => { showApp(); api("reports").then((d) => updateReportCount(d.reports.filter((r) => r.status === "new").length)).catch(() => {}); }, showLogin);
})();
