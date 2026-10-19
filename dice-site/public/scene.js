// Paints the theme backgrounds from public/themes.js.
//
// Two fixed canvases sit behind the page: #sky holds the still picture
// (redrawn only when the theme or window size changes) and #fx holds the
// moving particles. With reduced motion turned on, only the still picture
// is drawn.

(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sky = document.getElementById("sky");
  const fx = document.getElementById("fx");
  const sctx = sky.getContext("2d");
  const fctx = fx.getContext("2d");
  let W = 0, H = 0, theme = null, parts = [], flash = 0, raf = 0;

  // Seeded random numbers so a scene looks the same every time it is drawn.
  function rand(seed) {
    let a = (seed * 2654435761) >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rgba = (rgb, a) => `rgba(${rgb}, ${a})`;

  // A ridge line across the screen: `jag` adds rocky noise, `freq` sets how wide the bumps are.
  function ridge(ctx, { color, base, amp, seed }, { jag = 0, freq = 1, step = 8 } = {}) {
    const r = rand(seed || 1);
    const p = [r() * 6.28, r() * 6.28, r() * 6.28];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W + step; x += step) {
      const u = (x / W) * freq;
      const n = 0.55 * Math.sin(u * 5 + p[0]) + 0.3 * Math.sin(u * 11 + p[1]) + 0.15 * Math.sin(u * 23 + p[2]);
      const y = base * H - amp * H * (0.5 + 0.5 * n) - jag * amp * H * (r() - 0.5) * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  const DRAW = {
    glow(ctx, l) {
      const R = l.r * Math.max(W, H);
      const g = ctx.createRadialGradient(l.x * W, l.y * H, 0, l.x * W, l.y * H, R);
      g.addColorStop(0, rgba(l.rgb, l.a));
      g.addColorStop(1, rgba(l.rgb, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },
    rays(ctx, l) {
      const r = rand(l.seed), ox = l.x * W, oy = l.y * H, len = Math.hypot(W, H) * 1.4;
      for (let i = 0; i < l.n; i++) {
        const ang = Math.PI * (0.25 + 0.5 * r()), w = 0.015 + 0.04 * r();
        ctx.fillStyle = rgba(l.rgb, l.a * (0.3 + 0.7 * r()));
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(ang - w) * len, oy + Math.sin(ang - w) * len);
        ctx.lineTo(ox + Math.cos(ang + w) * len, oy + Math.sin(ang + w) * len);
        ctx.closePath();
        ctx.fill();
      }
    },
    stars(ctx, l) {
      const r = rand(l.seed), maxY = l.maxY || 1;
      for (let i = 0; i < l.n; i++) {
        ctx.fillStyle = rgba(l.rgb, 0.2 + 0.8 * r() * r());
        ctx.beginPath();
        ctx.arc(r() * W, r() * H * maxY, 0.3 + 1.2 * r() * r(), 0, 6.283);
        ctx.fill();
      }
    },
    mountains: (ctx, l) => ridge(ctx, l, { jag: 1, freq: 1.4, step: 10 }),
    hills: (ctx, l) => ridge(ctx, l, { freq: 0.8, step: 6 }),
    dunes: (ctx, l) => ridge(ctx, l, { freq: 0.45, step: 6 }),
    spires(ctx, l) {
      const r = rand(l.seed);
      ctx.fillStyle = l.color;
      for (let i = 0; i < l.n; i++) {
        const x = r() * W, w = W * (0.025 + 0.05 * r()), h = l.amp * H * (0.35 + 0.65 * r());
        const y0 = l.base * H;
        ctx.beginPath();
        ctx.moveTo(x - w, y0);
        const steps = 5;
        for (let s = 1; s <= steps; s++) ctx.lineTo(x - w + (w * s) / steps + (r() - 0.5) * w * 0.3, y0 - (h * s) / steps);
        for (let s = steps - 1; s >= 0; s--) ctx.lineTo(x + w - (w * s) / steps + (r() - 0.5) * w * 0.3, y0 - (h * s) / steps);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillRect(0, l.base * H - 1, W, H);
    },
    lava(ctx, l) {
      const r = rand(l.seed);
      ctx.save();
      ctx.shadowColor = "rgba(255, 140, 30, .9)";
      ctx.shadowBlur = 14;
      for (let i = 0; i < 7; i++) {
        const y = H * (l.base + (1 - l.base) * r());
        ctx.strokeStyle = `rgba(255, ${150 + Math.round(r() * 80)}, 40, ${0.6 + 0.4 * r()})`;
        ctx.lineWidth = 1.5 + 3 * r();
        ctx.beginPath();
        let x = -20, yy = y;
        ctx.moveTo(x, yy);
        while (x < W + 20) { x += 20 + 40 * r(); yy += (r() - 0.5) * 18; ctx.lineTo(x, yy); }
        ctx.stroke();
      }
      ctx.restore();
    },
    city(ctx, l) {
      const r = rand(l.seed), y0 = l.base * H;
      let x = 0;
      while (x < W) {
        const w = 24 + 60 * r(), h = l.amp * H * (0.25 + 0.75 * r());
        ctx.fillStyle = l.color;
        ctx.fillRect(x, y0 - h, w, h + 1);
        for (let wy = y0 - h + 8; wy < y0 - 6; wy += 10) {
          for (let wx = x + 5; wx < x + w - 6; wx += 9) {
            if (r() < 0.22) { ctx.fillStyle = rgba(l.win, 0.4 + 0.5 * r()); ctx.fillRect(wx, wy, 4, 5); }
          }
        }
        x += w + 2 * r();
      }
    },
    canopy(ctx, l) {
      const r = rand(l.seed), y0 = l.base * H;
      ctx.fillStyle = l.color;
      for (let x = -30; x < W + 30; x += 30 + 30 * r()) {
        const rad = 30 + 45 * r();
        ctx.beginPath();
        ctx.arc(x, y0 - rad * 0.4 * r(), rad, 0, 6.283);
        ctx.fill();
      }
      ctx.fillRect(0, y0, W, H);
    },
    clouds(ctx, l) {
      const r = rand(l.seed);
      ctx.fillStyle = rgba(l.rgb, l.a);
      for (let i = 0; i < l.n; i++) {
        const cx = r() * W, cy = l.y * H + (r() - 0.5) * H * 0.06, s = l.size * Math.max(W, 700);
        const puffs = 5 + Math.floor(r() * 5);
        ctx.beginPath();
        for (let p = 0; p < puffs; p++) {
          const px = cx + (p - puffs / 2) * s * 0.55, pr = s * (0.45 + 0.55 * r());
          ctx.moveTo(px + pr, cy);
          ctx.arc(px, cy - pr * 0.25 * r(), pr, 0, 6.283);
        }
        ctx.fill();
      }
    },
    seaweed(ctx, l) {
      const r = rand(l.seed);
      ctx.strokeStyle = l.color;
      ctx.lineCap = "round";
      for (let i = 0; i < l.n; i++) {
        const x = r() * W, h = H * (0.1 + 0.22 * r()), sway = 10 + 20 * r();
        ctx.lineWidth = 5 + 9 * r();
        ctx.beginPath();
        ctx.moveTo(x, H);
        ctx.bezierCurveTo(x + sway, H - h * 0.33, x - sway, H - h * 0.66, x + sway * 0.5, H - h);
        ctx.stroke();
      }
    },
    deadtrees(ctx, l) {
      const r = rand(l.seed);
      ctx.strokeStyle = l.color;
      ctx.lineCap = "round";
      const branch = (x, y, len, ang, depth) => {
        if (depth === 0 || len < 4) return;
        const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        ctx.lineWidth = depth * 1.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
        branch(x2, y2, len * (0.6 + 0.2 * r()), ang - 0.3 - 0.4 * r(), depth - 1);
        branch(x2, y2, len * (0.6 + 0.2 * r()), ang + 0.3 + 0.4 * r(), depth - 1);
      };
      for (let i = 0; i < l.n; i++) branch(r() * W, l.base * H + 10, H * (0.06 + 0.06 * r()), -Math.PI / 2 + (r() - 0.5) * 0.3, 6);
    },
    moon(ctx, l) {
      DRAW.glow(ctx, { x: l.x, y: l.y, r: l.r * 4, rgb: l.rgb, a: 0.35 });
      ctx.fillStyle = rgba(l.rgb, 1);
      ctx.beginPath();
      ctx.arc(l.x * W, l.y * H, l.r * Math.min(W, H), 0, 6.283);
      ctx.fill();
    },
    sun(ctx, l) {
      const R = l.r * Math.min(W, H) * 1.6;
      const g = ctx.createRadialGradient(l.x * W, l.y * H, 0, l.x * W, l.y * H, R);
      g.addColorStop(0, l.c1); g.addColorStop(0.55, l.c2); g.addColorStop(1, "rgba(255, 180, 70, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },
    stripedSun(ctx, l) {
      const R = l.r * Math.min(W, H) * 1.4, cx = l.x * W, cy = l.y * H;
      DRAW.glow(ctx, { x: l.x, y: l.y, r: l.r * 2.5, rgb: "255, 80, 170", a: 0.35 });
      const g = ctx.createLinearGradient(0, cy - R, 0, cy + R);
      g.addColorStop(0, l.top); g.addColorStop(1, l.bottom);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();
      ctx.fillStyle = l.gap;
      for (let i = 0; i < 6; i++) ctx.fillRect(cx - R, cy + R * (0.1 + i * 0.16), R * 2, 2 + i * 1.6);
    },
    grid(ctx, l) {
      const y0 = l.top * H, vx = W / 2;
      ctx.save();
      ctx.strokeStyle = rgba(l.rgb, 0.65);
      ctx.shadowColor = rgba(l.rgb, 1);
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.3;
      for (let i = 1; i <= 14; i++) { const y = y0 + (H - y0) * Math.pow(i / 14, 2); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      for (let k = -24; k <= 24; k++) { ctx.beginPath(); ctx.moveTo(vx + k * 6, y0); ctx.lineTo(vx + k * W * 0.09, H); ctx.stroke(); }
      ctx.restore();
    },
    sheen(ctx, l) {
      const r = rand(l.seed);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-0.5);
      const span = Math.hypot(W, H);
      for (let i = 0; i < 9; i++) {
        const x = (r() - 0.5) * span, w = span * (0.02 + 0.08 * r());
        const g = ctx.createLinearGradient(x, 0, x + w, 0);
        const a = l.a * (0.3 + 0.7 * r());
        g.addColorStop(0, "rgba(255, 255, 255, 0)"); g.addColorStop(0.5, `rgba(255, 255, 255, ${a})`); g.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(x, -span / 2, w, span);
      }
      ctx.restore();
    },
    felt(ctx, l) {
      const r = rand(l.seed);
      for (let i = 0; i < (W * H) / 140; i++) {
        ctx.fillStyle = r() < 0.5 ? "rgba(0, 0, 0, .08)" : "rgba(255, 255, 255, .05)";
        ctx.fillRect(r() * W, r() * H, 1.5, 1.5);
      }
    },
    // A dark disc with a bright rim: the eclipse several themes open on.
    eclipse(ctx, l) {
      const cx = l.x * W, cy = l.y * H, R = l.r * Math.min(W, H);
      const halo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 3);
      halo.addColorStop(0, rgba(l.rgb, 0.55)); halo.addColorStop(1, rgba(l.rgb, 0));
      ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.shadowColor = rgba(l.rgb, 1); ctx.shadowBlur = R * 0.5;
      ctx.strokeStyle = rgba(l.rgb, 0.95); ctx.lineWidth = Math.max(2, R * 0.05);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = l.core || "#07060c";
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();
    },
    // Tall columns framing the left and right edges, like a temple doorway.
    pillars(ctx, l) {
      const y0 = l.base * H, w = Math.max(26, W * 0.05), top = l.top * H;
      ctx.fillStyle = l.color;
      for (const x of [w * 0.6, W - w * 1.6]) {
        ctx.fillRect(x, top, w, y0 - top);
        // capital + base blocks
        ctx.fillRect(x - w * 0.18, top, w * 1.36, w * 0.5);
        ctx.fillRect(x - w * 0.22, y0 - w * 0.5, w * 1.44, w * 0.5);
        // flutes
        if (l.line) {
          ctx.strokeStyle = l.line; ctx.lineWidth = 1;
          for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + (w * i) / 4, top + w * 0.5); ctx.lineTo(x + (w * i) / 4, y0 - w * 0.5); ctx.stroke(); }
        }
      }
    },
    // A central fortress: stacked towers with a glowing gate and lit windows.
    castle(ctx, l) {
      const r = rand(l.seed), cx = W / 2, base = l.base * H, bw = Math.min(W * 0.5, 540);
      ctx.fillStyle = l.color;
      const body = base - l.h * H;
      ctx.fillRect(cx - bw / 2, body, bw, base - body);
      // towers
      const towers = 5;
      for (let i = 0; i < towers; i++) {
        const tx = cx - bw / 2 + (bw * (i + 0.5)) / towers;
        const th = l.h * H * (i === Math.floor(towers / 2) ? 1.5 : 0.7 + r() * 0.5);
        const tw = bw / towers * 0.6;
        ctx.fillRect(tx - tw / 2, base - th, tw, th);
        ctx.beginPath(); // conical roof
        ctx.moveTo(tx - tw / 2, base - th); ctx.lineTo(tx, base - th - tw * 0.9); ctx.lineTo(tx + tw / 2, base - th); ctx.closePath(); ctx.fill();
      }
      // glow gate
      if (l.gate) {
        const g = ctx.createRadialGradient(cx, base, 0, cx, base, bw * 0.3);
        g.addColorStop(0, rgba(l.gate, 0.9)); g.addColorStop(1, rgba(l.gate, 0));
        ctx.fillStyle = g; ctx.fillRect(cx - bw * 0.3, base - bw * 0.3, bw * 0.6, bw * 0.3);
      }
      // windows
      if (l.win) {
        ctx.fillStyle = rgba(l.win, 0.9);
        for (let i = 0; i < 40; i++) ctx.fillRect(cx - bw / 2 + r() * bw, body + r() * (base - body), 3, 5);
      }
    },
    pyramids(ctx, l) {
      const r = rand(l.seed), base = l.base * H;
      for (const [cx, h] of [[W * 0.5, l.h * H], [W * 0.32, l.h * H * 0.7], [W * 0.7, l.h * H * 0.8]]) {
        const half = h * 0.9;
        ctx.fillStyle = l.color;
        ctx.beginPath(); ctx.moveTo(cx, base - h); ctx.lineTo(cx - half, base); ctx.lineTo(cx + half, base); ctx.closePath(); ctx.fill();
        // lit face
        ctx.fillStyle = l.lit || "rgba(255,255,255,.08)";
        ctx.beginPath(); ctx.moveTo(cx, base - h); ctx.lineTo(cx, base); ctx.lineTo(cx + half, base); ctx.closePath(); ctx.fill();
      }
    },
    // Glowing crystal shards rising from the floor.
    crystals(ctx, l) {
      const r = rand(l.seed), base = l.base * H;
      for (let i = 0; i < l.n; i++) {
        const x = r() * W, h = H * (0.05 + 0.18 * r()), w = h * (0.14 + 0.1 * r()), lean = (r() - 0.5) * 0.3;
        ctx.save();
        ctx.translate(x, base); ctx.rotate(lean);
        ctx.shadowColor = rgba(l.rgb, 0.9); ctx.shadowBlur = 14;
        const grd = ctx.createLinearGradient(0, -h, 0, 0);
        grd.addColorStop(0, rgba(l.rgb, 0.95)); grd.addColorStop(1, rgba(l.rgb, 0.25));
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(-w, -h * 0.35); ctx.lineTo(-w * 0.5, 0); ctx.lineTo(w * 0.5, 0); ctx.lineTo(w, -h * 0.35); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    },
    // Translucent waterfalls falling from a height down to the floor.
    waterfalls(ctx, l) {
      const r = rand(l.seed), top = l.top * H, bottom = l.base * H;
      for (let i = 0; i < l.n; i++) {
        const x = r() * W, w = 10 + 30 * r();
        const g = ctx.createLinearGradient(0, top, 0, bottom);
        g.addColorStop(0, rgba(l.rgb, 0)); g.addColorStop(0.3, rgba(l.rgb, 0.4)); g.addColorStop(1, rgba(l.rgb, 0.12));
        ctx.fillStyle = g; ctx.fillRect(x, top, w, bottom - top);
      }
    },
    // A glossy foreground floor that mirrors the glow above it.
    floor(ctx, l) {
      const y0 = l.y * H;
      const g = ctx.createLinearGradient(0, y0, 0, H);
      g.addColorStop(0, rgba(l.rgb, 0.5)); g.addColorStop(0.25, rgba(l.rgb, 0.16)); g.addColorStop(1, rgba(l.dark || "0, 0, 0", 0.55));
      ctx.fillStyle = g; ctx.fillRect(0, y0, W, H - y0);
      // a bright reflected streak down the middle
      const s = ctx.createLinearGradient(0, y0, 0, H);
      s.addColorStop(0, rgba(l.glow || l.rgb, 0.4)); s.addColorStop(1, rgba(l.glow || l.rgb, 0));
      ctx.fillStyle = s; ctx.fillRect(W * 0.3, y0, W * 0.4, H - y0);
    },
    vignette(ctx, l) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
      g.addColorStop(0, "rgba(0, 0, 0, 0)");
      g.addColorStop(1, `rgba(0, 0, 0, ${l.a})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  };

  // Loaded background photos, kept so switching back to a theme is instant.
  const imgCache = new Map();

  function paintGradientScene() {
    const g = sctx.createLinearGradient(0, 0, 0, H);
    (theme.sky || [[0, "#000"], [1, "#000"]]).forEach(([stop, c]) => g.addColorStop(stop, c));
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, W, H);
    for (const l of (theme.layers || [])) {
      sctx.save();
      DRAW[l.type](sctx, l);
      sctx.restore();
    }
  }

  // Draw an image to cover the whole canvas (like CSS background-size: cover).
  function drawCover(img) {
    const scale = Math.max(W / img.width, H / img.height);
    const w = img.width * scale, h = img.height * scale;
    sctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }

  function paintTint() {
    if (!theme.tint) return;
    const g = sctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.tint[0]);
    g.addColorStop(1, theme.tint[1]);
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, W, H);
  }

  function paintSky() {
    if (!theme.image) { paintGradientScene(); return; }
    // Show the fallback gradient immediately, then the photo once it loads.
    paintGradientScene();
    const token = theme.id;
    const cached = imgCache.get(theme.image);
    if (cached && cached.complete && cached.naturalWidth) {
      drawCover(cached); paintTint(); return;
    }
    const img = cached || new Image();
    if (!cached) {
      img.decoding = "async";
      img.src = theme.image;
      imgCache.set(theme.image, img);
    }
    img.onload = () => {
      // Ignore if the viewer switched themes before this finished loading.
      if (theme.id !== token) return;
      paintGradientScene();
      drawCover(img);
      paintTint();
    };
  }

  // ---- particles ----
  const R = Math.random;
  const MAKE = {
    ember: (fresh) => ({ x: R() * W, y: fresh ? R() * H : H + 10, r: 0.8 + R() * 2.2, vy: 0.3 + R() * 0.9, vx: (R() - 0.5) * 0.4, ph: R() * 6.28 }),
    bubble: (fresh) => ({ x: R() * W, y: fresh ? R() * H : H + 10, r: 1.5 + R() * 5, vy: 0.4 + R() * 1, ph: R() * 6.28 }),
    snow: (fresh) => ({ x: R() * W, y: fresh ? R() * H : -10, r: 1 + R() * 2.6, vy: 0.4 + R() * 1, ph: R() * 6.28 }),
    petal: (fresh) => ({ x: R() * W, y: fresh ? R() * H : -10, r: 3.5 + R() * 3.5, vy: 0.5 + R() * 0.9, vx: 0.3 + R() * 0.8, rot: R() * 6.28, ph: R() * 6.28 }),
    rain: (fresh) => ({ x: R() * W * 1.2, y: fresh ? R() * H : -20, len: 10 + R() * 14, vy: 12 + R() * 7 }),
    star: () => ({ x: R() * W, y: R() * H, r: 0.6 + R() * 1.3, ph: R() * 6.28, sp: 0.02 + R() * 0.05 }),
    sparkle: () => ({ x: R() * W, y: R() * H, r: 3 + R() * 5, ph: R() * 6.28, sp: 0.015 + R() * 0.03 }),
    firefly: () => ({ x: R() * W, y: H * (0.3 + 0.7 * R()), vx: (R() - 0.5) * 0.6, vy: (R() - 0.5) * 0.6, ph: R() * 6.28 }),
    dust: (fresh) => ({ x: fresh ? R() * W : -10, y: R() * H, r: 0.6 + R() * 1.6, vx: 0.2 + R() * 0.6, ph: R() * 6.28 })
  };
  const STEP = {
    ember(p, rgb) {
      p.y -= p.vy; p.ph += 0.05; p.x += p.vx + Math.sin(p.ph) * 0.3;
      if (p.y < -10) return false;
      const a = Math.max(0, Math.min(1, p.y / H)) * (0.5 + 0.5 * Math.sin(p.ph * 2));
      fctx.shadowColor = rgba(rgb, 0.9); fctx.shadowBlur = 8;
      fctx.fillStyle = rgba(rgb, a.toFixed(3));
      fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 6.283); fctx.fill();
      fctx.shadowBlur = 0;
    },
    bubble(p, rgb) {
      p.y -= p.vy; p.ph += 0.04; p.x += Math.sin(p.ph) * 0.5;
      if (p.y < -10) return false;
      fctx.strokeStyle = rgba(rgb, 0.55); fctx.lineWidth = 1.2;
      fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 6.283); fctx.stroke();
      fctx.fillStyle = rgba(rgb, 0.5);
      fctx.beginPath(); fctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.25, 0, 6.283); fctx.fill();
    },
    snow(p, rgb) {
      p.y += p.vy; p.ph += 0.02; p.x += Math.sin(p.ph) * 0.6;
      if (p.y > H + 10) return false;
      fctx.fillStyle = rgba(rgb, 0.85);
      fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 6.283); fctx.fill();
    },
    petal(p, rgb) {
      p.y += p.vy; p.x += p.vx + Math.sin(p.ph) * 0.6; p.ph += 0.03; p.rot += 0.03;
      if (p.y > H + 10 || p.x > W + 20) return false;
      fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
      fctx.fillStyle = rgba(rgb, 0.85);
      fctx.beginPath(); fctx.ellipse(0, 0, p.r, p.r * 0.5 * (0.6 + 0.4 * Math.abs(Math.sin(p.ph))), 0, 0, 6.283); fctx.fill();
      fctx.restore();
    },
    rain(p, rgb) {
      p.y += p.vy; p.x -= p.vy * 0.18;
      if (p.y > H + 20) return false;
      fctx.strokeStyle = rgba(rgb, 0.35); fctx.lineWidth = 1;
      fctx.beginPath(); fctx.moveTo(p.x, p.y); fctx.lineTo(p.x + p.len * 0.18, p.y - p.len); fctx.stroke();
    },
    star(p, rgb) {
      p.ph += p.sp;
      fctx.fillStyle = rgba(rgb, (0.15 + 0.85 * Math.abs(Math.sin(p.ph))).toFixed(3));
      fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 6.283); fctx.fill();
    },
    sparkle(p, rgb) {
      p.ph += p.sp;
      if (p.ph > Math.PI) return false;
      const a = Math.sin(p.ph), s = p.r * a;
      fctx.strokeStyle = rgba(rgb, a.toFixed(3)); fctx.lineWidth = 1.2;
      fctx.shadowColor = rgba(rgb, 1); fctx.shadowBlur = 6;
      fctx.beginPath(); fctx.moveTo(p.x - s, p.y); fctx.lineTo(p.x + s, p.y); fctx.moveTo(p.x, p.y - s); fctx.lineTo(p.x, p.y + s); fctx.stroke();
      fctx.shadowBlur = 0;
    },
    firefly(p, rgb) {
      p.vx += (R() - 0.5) * 0.08; p.vy += (R() - 0.5) * 0.08;
      p.vx = Math.max(-0.7, Math.min(0.7, p.vx)); p.vy = Math.max(-0.7, Math.min(0.7, p.vy));
      p.x += p.vx; p.y += p.vy; p.ph += 0.04;
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) return false;
      const a = 0.25 + 0.75 * Math.abs(Math.sin(p.ph));
      fctx.shadowColor = rgba(rgb, 1); fctx.shadowBlur = 12;
      fctx.fillStyle = rgba(rgb, a.toFixed(3));
      fctx.beginPath(); fctx.arc(p.x, p.y, 2, 0, 6.283); fctx.fill();
      fctx.shadowBlur = 0;
    },
    dust(p, rgb) {
      p.x += p.vx; p.ph += 0.03; p.y += Math.sin(p.ph) * 0.2;
      if (p.x > W + 10) return false;
      fctx.fillStyle = rgba(rgb, 0.3);
      fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 6.283); fctx.fill();
    }
  };

  function frame() {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const pc = theme.particles;
    fctx.clearRect(0, 0, W, H);
    for (let i = 0; i < parts.length; i++) {
      if (STEP[pc.type](parts[i], pc.rgb) === false) parts[i] = MAKE[pc.type](false);
    }
    if (pc.lightning) {
      if (flash < 0.02 && R() < 0.004) flash = 1;
      if (flash > 0.02) { fctx.fillStyle = `rgba(225, 235, 255, ${(flash * 0.35).toFixed(3)})`; fctx.fillRect(0, 0, W, H); flash *= 0.86; }
    }
  }

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    for (const [c, ctx, d] of [[sky, sctx, dpr], [fx, fctx, Math.min(dpr, 1.5)]]) {
      c.width = Math.round(W * d); c.height = Math.round(H * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
  }

  function start() {
    cancelAnimationFrame(raf);
    paintSky();
    fctx.clearRect(0, 0, W, H);
    if (reduced) return;
    const pc = theme.particles;
    const n = Math.round(pc.count * Math.min(1, (W * H) / (1280 * 800)) + pc.count * 0.25);
    parts = Array.from({ length: Math.min(n, pc.count) }, () => MAKE[pc.type](true));
    raf = requestAnimationFrame(frame);
  }

  let resizeTimer;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { size(); if (theme) start(); }, 120);
  });

  window.Scene = {
    use(t) { theme = t; if (!W) size(); start(); }
  };
})();
