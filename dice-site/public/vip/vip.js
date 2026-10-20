// VIP page: a streamer signs in and flips only their own Live switch.
(() => {
  const $ = (id) => document.getElementById(id);

  async function api(path, method = "GET", body) {
    const res = await fetch("api/" + path, {
      method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin"
    }).catch(() => { throw new Error("Can't reach the server. Check your connection."); });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== "login") { showLogin(); throw new Error(data.error || "Please sign in again."); }
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  function showLogin() {
    $("panelView").hidden = true;
    $("loginView").hidden = false;
    $("user").focus();
  }
  function showPanel(s) {
    $("loginView").hidden = true;
    $("panelView").hidden = false;
    $("name").textContent = s.name;
    $("handle").textContent = "@" + s.handle;
    const av = $("avatar");
    if (s.avatar) { av.style.backgroundImage = `url(${s.avatar})`; av.textContent = ""; }
    else { av.style.backgroundImage = "none"; av.textContent = (s.name[0] || "?").toUpperCase(); }
    const room = location.origin + "/?room=" + encodeURIComponent(s.handle);
    $("roomUrl").href = room;
    $("roomUrl").textContent = room.replace(/^https?:\/\//, "");
    setLive(s.live);
  }
  function setLive(on) {
    $("live").checked = on;
    $("status").classList.toggle("on", on);
    $("statusText").textContent = on ? "Live now" : "Offline";
  }

  $("loginView").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector("button");
    btn.disabled = true; $("loginErr").hidden = true;
    try {
      await api("login", "POST", { user: $("user").value.trim(), password: $("password").value });
      $("password").value = "";
      showPanel((await api("me")).streamer);
    } catch (err) {
      $("loginErr").textContent = err.message;
      $("loginErr").hidden = false;
    } finally { btn.disabled = false; }
  });

  let savedTimer;
  $("live").addEventListener("change", async (e) => {
    const want = e.target.checked;
    try {
      const { streamer } = await api("live", "POST", { live: want });
      setLive(streamer.live);
      $("saved").textContent = streamer.live ? "You're now live" : "You're now offline";
      $("saved").hidden = false;
      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => ($("saved").hidden = true), 2000);
    } catch (err) {
      setLive(!want); // revert the toggle
      $("saved").textContent = err.message;
      $("saved").hidden = false;
    }
  });

  $("copyRoom").addEventListener("click", async () => {
    const url = $("roomUrl").href;
    try { await navigator.clipboard.writeText(url); } catch {}
    const btn = $("copyRoom"), label = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = label), 1500);
  });

  $("logout").addEventListener("click", async () => {
    await api("logout", "POST", {}).catch(() => {});
    showLogin();
  });

  api("me").then((d) => showPanel(d.streamer), showLogin);
})();
