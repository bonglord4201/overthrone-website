(() => {
  "use strict";

  // Public site settings. Never put Tebex private credentials here.
  // The Worker writes the admin-panel values onto <body> (data-server-address,
  // data-tebex-url); these are the fallbacks if it can't.
  const CONFIG = {
    serverAddress: document.body.dataset.serverAddress || "overthronesmp.net",
    tebexUrl: document.body.dataset.tebexUrl || "" // public https:// Tebex store URL once it exists
  };

  const live = document.querySelector("[data-status]");
  const announce = (message) => {
    if (!live) return;
    live.textContent = "";
    setTimeout(() => { live.textContent = message; }, 30);
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; } catch {}
    }
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.className = "clip-helper";
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand("copy"); } catch {}
    field.remove();
    return ok;
  };

  const flash = (button, text) => {
    const label = button.querySelector("[data-label]") || button;
    if (!label.dataset.original) label.dataset.original = label.textContent;
    label.textContent = text;
    clearTimeout(button._flashTimer);
    button._flashTimer = setTimeout(() => {
      label.textContent = label.dataset.original;
      delete label.dataset.original;
    }, 1800);
  };

  document.querySelectorAll("[data-copy-ip]").forEach((button) => {
    button.addEventListener("click", async () => {
      const ok = await copyText(CONFIG.serverAddress);
      flash(button, ok ? "COPIED!" : CONFIG.serverAddress);
      announce(ok ? "Server address copied" : "Copy failed. The server address is " + CONFIG.serverAddress);
    });
  });

  const menu = document.querySelector("[data-menu]");
  const nav = document.querySelector("[data-nav]");
  if (menu && nav) {
    const setOpen = (open, returnFocus) => {
      nav.classList.toggle("open", open);
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (!open && returnFocus) menu.focus();
    };
    const isOpen = () => nav.classList.contains("open");
    menu.addEventListener("click", () => setOpen(!isOpen()));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) setOpen(false, true); });
    document.addEventListener("click", (e) => {
      if (isOpen() && !nav.contains(e.target) && !menu.contains(e.target)) setOpen(false);
    });
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
  }

  // Store: switches from "opening soon" to a link once a Tebex URL is configured.
  if (/^https:\/\/\S+$/.test(CONFIG.tebexUrl)) {
    document.querySelectorAll("[data-store-soon]").forEach((el) => { el.hidden = true; });
    document.querySelectorAll("[data-store-open]").forEach((el) => { el.hidden = false; el.href = CONFIG.tebexUrl; });
  }

  // Vote page: remember which sites this visitor voted on today (this browser only).
  const voteCards = document.querySelectorAll("a[data-vote-slot]:not([hidden])");
  if (voteCards.length) {
    const today = new Date().toISOString().slice(0, 10);
    const key = "overthrone-votes";
    let state = {};
    try { state = JSON.parse(localStorage.getItem(key) || "{}"); } catch {}
    if (state.day !== today) state = { day: today, sites: [] };
    const done = document.querySelector("[data-vote-done]");
    const total = document.querySelector("[data-vote-total]");
    const meter = document.querySelector("[data-vote-meter]");
    const progress = document.querySelector("[data-vote-progress]");
    const paint = () => {
      let n = 0;
      voteCards.forEach((card) => {
        const on = state.sites.includes(card.href);
        card.classList.toggle("is-voted", on);
        if (on) n++;
      });
      if (done) done.textContent = n;
      if (total) total.textContent = voteCards.length;
      if (meter) meter.style.width = Math.round((n / voteCards.length) * 100) + "%";
      if (progress) progress.hidden = false;
    };
    voteCards.forEach((card) => card.addEventListener("click", () => {
      if (!state.sites.includes(card.href)) state.sites.push(card.href);
      try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
      setTimeout(paint, 300);
    }));
    paint();
  }

  // Trailer: a styled play button over the poster; native controls once it is playing.
  const trailer = document.querySelector("[data-trailer]");
  const trailerPlay = document.querySelector("[data-trailer-play]");
  if (trailer && trailerPlay) {
    const label = trailerPlay.querySelector("[data-trailer-label]");
    const showOverlay = (text) => {
      trailer.controls = false;
      if (label && text) label.textContent = text;
      trailerPlay.hidden = false;
    };
    showOverlay();
    trailerPlay.addEventListener("click", () => {
      trailerPlay.hidden = true;
      trailer.controls = true;
      const p = trailer.play();
      if (p && p.catch) p.catch(() => {});
      trailer.focus();
    });
    trailer.addEventListener("ended", () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      trailer.currentTime = 0;
      showOverlay("Watch again");
    });
  }

  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
