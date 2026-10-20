// ColorRoll ads.
//
// Ads are OFF until you (a) have an approved AdSense account and (b) paste your
// real ad-unit IDs into CONFIG.slots below, then flip CONFIG.enabled to true.
// While off, nothing renders and no placeholder/fake ad is ever shown.
//
// Ad-free for VIPs is decided by the SERVER, not the browser: we ask the Worker
// (/vip/api/me) whether the signed VIP cookie is valid. A browser-only flag can
// never turn ads off — only a real, server-verified VIP session does.
(() => {
  const CONFIG = {
    enabled: false,                       // <-- leave false until ad units are approved
    client: "ca-pub-5630157933832433",    // your AdSense publisher ID
    // Paste each real ad-unit's data-ad-slot number here. Empty = that slot stays blank.
    slots: { top: "", belowHistory: "", belowInfo: "" }
  };

  // Server-verified VIP check. Returns true only if the Worker accepts the VIP cookie.
  async function isVip() {
    try {
      const r = await fetch("/vip/api/me", { credentials: "same-origin" });
      return r.ok; // 200 => signed-in VIP; 401 => not a VIP
    } catch { return false; }
  }

  async function init() {
    if (!CONFIG.enabled) return;          // ads off -> show nothing at all
    if (!window.adsbygoogle) return;      // AdSense script blocked/not loaded -> no fake ads
    if (await isVip()) return;            // verified VIP -> ad-free

    document.querySelectorAll(".adslot[data-ad-slot]").forEach((box) => {
      const slot = CONFIG.slots[box.dataset.adSlot];
      if (!slot) return;                  // no real unit id -> leave blank (never a fake ad)
      const ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "block";
      ins.setAttribute("data-ad-client", CONFIG.client);
      ins.setAttribute("data-ad-slot", slot);
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "true");
      box.appendChild(ins);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); box.hidden = false; } catch {}
    });
  }

  init();
})();
