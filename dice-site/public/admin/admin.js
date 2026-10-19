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
  const SECTIONS = { streamers: loadStreamers };
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

  // ---- start ----
  api("me").then(showApp, showLogin);
})();
