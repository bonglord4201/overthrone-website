// ColorRoll themes.
//
// Each theme has page colors (`ui`, written to CSS variables) and a `scene`
// that public/scene.js paints behind the page: a sky gradient, a list of
// drawn layers (back to front) and one kind of moving particle.
// To add a theme, copy one entry and change it; it shows up in the menu.
//
// Layer positions are fractions of the screen: x 0 = left, y 0 = top.
// Colors written as "r, g, b" take a separate alpha (`a`).

window.THEMES = [
  // ---------- Worlds ----------
  // Each world builds a framed scene: sky, a light source (eclipse/sun/glow),
  // background structures, a hero structure, waterfalls, side pillars, a glossy
  // reflective floor, then particles.
  {
    id: "hell", name: "Hell", group: "Worlds",
    ui: { bg: "#170403", panel: "rgba(110, 10, 6, .55)", panelSolid: "#3a0805", edge: "rgba(255, 214, 205, .5)", select: "#8e0f08" },
    scene: {
      sky: [[0, "#120101"], [0.45, "#4a0705"], [0.8, "#9c160a"], [1, "#2a0402"]],
      layers: [
        { type: "eclipse", x: 0.5, y: 0.2, r: 0.1, rgb: "255, 70, 30", core: "#1a0302" },
        { type: "spires", color: "#280504", base: 0.84, amp: 0.46, n: 18, seed: 3 },
        { type: "castle", color: "#180303", base: 0.86, h: 0.28, seed: 4, gate: "255, 110, 40", win: "255, 140, 50" },
        { type: "pillars", color: "#1e0403", base: 0.9, top: 0.14, line: "rgba(255,120,60,.25)" },
        { type: "mountains", color: "#0e0201", base: 0.9, amp: 0.1, seed: 6 },
        { type: "lava", base: 0.87, seed: 7 },
        { type: "floor", y: 0.9, rgb: "255, 80, 30", dark: "22, 2, 2", glow: "255, 130, 50" },
        { type: "vignette", a: 0.5 }
      ],
      particles: { type: "ember", rgb: "255, 120, 40", count: 80 }
    }
  },
  {
    id: "heaven", name: "Heaven", group: "Worlds",
    ui: { bg: "#bfe3ff", panel: "rgba(40, 90, 150, .62)", panelSolid: "#2c5f96", edge: "rgba(255, 236, 170, .95)", select: "#a8790a", pageFg: "#2f4560", brand: "#1d3a5c", brandAccent: "#c98a00" },
    scene: {
      sky: [[0, "#6db8f5"], [0.5, "#cfeaff"], [1, "#fff6e4"]],
      layers: [
        { type: "rays", x: 0.5, y: -0.12, rgb: "255, 246, 205", a: 0.28, n: 16, seed: 2 },
        { type: "glow", x: 0.5, y: 0, r: 0.6, rgb: "255, 244, 200", a: 0.95 },
        { type: "clouds", y: 0.2, rgb: "255, 255, 255", a: 0.5, n: 5, size: 0.05, seed: 4 },
        { type: "castle", color: "#eadfae", base: 0.82, h: 0.3, seed: 5, gate: "255, 240, 190", win: "255, 230, 150" },
        { type: "pillars", color: "#f0e6bf", base: 0.86, top: 0.1, line: "rgba(200,170,90,.4)" },
        { type: "clouds", y: 0.74, rgb: "255, 255, 255", a: 0.85, n: 7, size: 0.09, seed: 6 },
        { type: "floor", y: 0.86, rgb: "255, 240, 190", dark: "150, 180, 210", glow: "255, 255, 240" },
        { type: "clouds", y: 0.96, rgb: "255, 255, 255", a: 0.95, n: 9, size: 0.11, seed: 8 }
      ],
      particles: { type: "sparkle", rgb: "255, 220, 120", count: 44 }
    }
  },
  {
    id: "underwater", name: "Underwater", group: "Worlds",
    ui: { bg: "#03101f", panel: "rgba(4, 30, 64, .55)", panelSolid: "#08264a", edge: "rgba(190, 228, 255, .5)", select: "#0b4486" },
    scene: {
      sky: [[0, "#2ea6e0"], [0.4, "#0b5a96"], [1, "#021530"]],
      layers: [
        { type: "rays", x: 0.4, y: -0.2, rgb: "220, 245, 255", a: 0.14, n: 12, seed: 3 },
        { type: "castle", color: "#06284c", base: 0.86, h: 0.32, seed: 4, gate: "90, 200, 255", win: "120, 220, 255" },
        { type: "waterfalls", top: 0, base: 0.86, n: 5, rgb: "150, 220, 255", seed: 5 },
        { type: "pillars", color: "#052540", base: 0.9, top: 0.12, line: "rgba(120,220,255,.3)" },
        { type: "seaweed", color: "#0a4a3f", n: 14, seed: 6 },
        { type: "floor", y: 0.9, rgb: "80, 190, 255", dark: "2, 14, 30", glow: "150, 230, 255" },
        { type: "vignette", a: 0.4 }
      ],
      particles: { type: "bubble", rgb: "210, 240, 255", count: 46 }
    }
  },
  {
    id: "void", name: "Void", group: "Worlds",
    ui: { bg: "#07041a", panel: "rgba(30, 14, 70, .6)", panelSolid: "#1d0f45", edge: "rgba(200, 180, 255, .55)", select: "#5b2bb5" },
    scene: {
      sky: [[0, "#05030f"], [1, "#160b34"]],
      layers: [
        { type: "stars", n: 300, rgb: "255, 255, 255", seed: 7 },
        { type: "glow", x: 0.78, y: 0.6, r: 0.5, rgb: "255, 60, 170", a: 0.25 },
        { type: "eclipse", x: 0.5, y: 0.34, r: 0.13, rgb: "150, 70, 255", core: "#060310" },
        { type: "mountains", color: "#120a2c", base: 0.88, amp: 0.14, seed: 4 },
        { type: "crystals", base: 0.9, n: 16, rgb: "170, 110, 255", seed: 5 },
        { type: "floor", y: 0.9, rgb: "150, 90, 255", dark: "5, 3, 16", glow: "200, 150, 255" }
      ],
      particles: { type: "star", rgb: "220, 200, 255", count: 70 }
    }
  },
  {
    id: "neon", name: "Neon City", group: "Worlds",
    ui: { bg: "#0b0221", panel: "rgba(40, 6, 70, .62)", panelSolid: "#250640", edge: "rgba(255, 120, 230, .65)", select: "#b0127e" },
    scene: {
      sky: [[0, "#0b0221"], [0.45, "#2a0848"], [0.72, "#c22a8a"], [0.721, "#14042a"], [1, "#0b0221"]],
      layers: [
        { type: "stars", n: 140, rgb: "255, 220, 255", seed: 2, maxY: 0.6 },
        { type: "stripedSun", x: 0.5, y: 0.58, r: 0.16, top: "#ffe45c", bottom: "#ff2d95", gap: "#3a0b5c" },
        { type: "city", color: "#160430", base: 0.722, amp: 0.26, win: "255, 200, 90", seed: 5 },
        { type: "pillars", color: "#1c0540", base: 0.722, top: 0.1, line: "rgba(255,80,220,.5)" },
        { type: "grid", top: 0.722, rgb: "255, 70, 210" }
      ],
      particles: { type: "sparkle", rgb: "255, 120, 230", count: 32 }
    }
  },
  {
    id: "jungle", name: "Jungle", group: "Worlds",
    ui: { bg: "#06200d", panel: "rgba(8, 50, 20, .6)", panelSolid: "#0a3a18", edge: "rgba(200, 255, 170, .55)", select: "#1f7a2e" },
    scene: {
      sky: [[0, "#2c7a3a"], [0.55, "#0f3b1c"], [1, "#041509"]],
      layers: [
        { type: "rays", x: 0.6, y: -0.15, rgb: "230, 255, 180", a: 0.12, n: 10, seed: 3 },
        { type: "glow", x: 0.6, y: 0.05, r: 0.5, rgb: "210, 255, 150", a: 0.3 },
        { type: "hills", color: "#0d3d1b", base: 0.66, amp: 0.12, seed: 4 },
        { type: "castle", color: "#0a2e16", base: 0.82, h: 0.24, seed: 5, win: "180, 255, 120" },
        { type: "waterfalls", top: 0.1, base: 0.84, n: 4, rgb: "200, 255, 210", seed: 8 },
        { type: "pillars", color: "#0a2c14", base: 0.88, top: 0.12, line: "rgba(150,255,120,.3)" },
        { type: "canopy", color: "#031208", base: 0.95, seed: 7 },
        { type: "floor", y: 0.9, rgb: "120, 255, 150", dark: "3, 18, 8", glow: "180, 255, 150" },
        { type: "vignette", a: 0.45 }
      ],
      particles: { type: "firefly", rgb: "220, 255, 120", count: 35 }
    }
  },
  {
    id: "frozen", name: "Frozen", group: "Worlds",
    ui: { bg: "#cdeaff", panel: "rgba(20, 70, 120, .66)", panelSolid: "#1d4f7f", edge: "rgba(255, 255, 255, .9)", select: "#1d6fb0", pageFg: "#1d3a55", brand: "#163452", brandAccent: "#1d78c4" },
    scene: {
      sky: [[0, "#8fd0f7"], [0.55, "#d6efff"], [1, "#eef8ff"]],
      layers: [
        { type: "glow", x: 0.5, y: 0.08, r: 0.4, rgb: "255, 255, 250", a: 0.85 },
        { type: "mountains", color: "#a9cde8", base: 0.6, amp: 0.3, seed: 3 },
        { type: "castle", color: "#cfe8fa", base: 0.84, h: 0.34, seed: 5, gate: "180, 230, 255", win: "150, 210, 255" },
        { type: "pillars", color: "#dcefff", base: 0.88, top: 0.12, line: "rgba(120,180,230,.4)" },
        { type: "crystals", base: 0.9, n: 14, rgb: "170, 220, 255", seed: 6 },
        { type: "floor", y: 0.9, rgb: "200, 235, 255", dark: "150, 190, 220", glow: "255, 255, 255" }
      ],
      particles: { type: "snow", rgb: "255, 255, 255", count: 90 }
    }
  },
  {
    id: "egypt", name: "Egypt", group: "Worlds",
    ui: { bg: "#3a1408", panel: "rgba(90, 40, 16, .58)", panelSolid: "#5a2c10", edge: "rgba(255, 220, 150, .7)", select: "#9a6418" },
    scene: {
      sky: [[0, "#2b1055"], [0.4, "#b84a3a"], [0.64, "#ff9a3c"], [1, "#ffcf7a"]],
      layers: [
        { type: "eclipse", x: 0.5, y: 0.26, r: 0.11, rgb: "255, 200, 90", core: "#3a1a08" },
        { type: "pyramids", color: "#7a3c12", base: 0.74, h: 0.3, lit: "rgba(255,210,130,.35)", seed: 3 },
        { type: "pillars", color: "#532808", base: 0.88, top: 0.1, line: "rgba(255,200,120,.35)" },
        { type: "dunes", color: "#b56a1f", base: 0.82, amp: 0.05, seed: 5 },
        { type: "dunes", color: "#6e3a0f", base: 0.92, amp: 0.04, seed: 7 },
        { type: "floor", y: 0.9, rgb: "255, 190, 90", dark: "40, 18, 6", glow: "255, 220, 130" }
      ],
      particles: { type: "dust", rgb: "255, 225, 170", count: 32 }
    }
  },
  {
    id: "candy", name: "Candy", group: "Worlds",
    ui: { bg: "#ffd9ec", panel: "rgba(150, 40, 100, .6)", panelSolid: "#8c2a60", edge: "rgba(255, 240, 248, .92)", select: "#c42d80", pageFg: "#6b2650", brand: "#5a1a44", brandAccent: "#d42a86" },
    scene: {
      sky: [[0, "#8fd4ff"], [0.5, "#ffc2e2"], [1, "#fff0f7"]],
      layers: [
        { type: "glow", x: 0.5, y: 0.1, r: 0.45, rgb: "255, 255, 255", a: 0.8 },
        { type: "clouds", y: 0.22, rgb: "255, 240, 250", a: 0.75, n: 6, size: 0.06, seed: 2 },
        { type: "castle", color: "#ff9ccb", base: 0.82, h: 0.3, seed: 4, gate: "255, 255, 255", win: "255, 120, 190" },
        { type: "pillars", color: "#ff7ab8", base: 0.88, top: 0.12, line: "rgba(255,255,255,.5)" },
        { type: "crystals", base: 0.9, n: 14, rgb: "255, 150, 210", seed: 6 },
        { type: "floor", y: 0.9, rgb: "255, 160, 215", dark: "150, 70, 120", glow: "255, 255, 255" }
      ],
      particles: { type: "petal", rgb: "255, 170, 215", count: 44 }
    }
  },
  {
    id: "blood", name: "Blood Moon", group: "Worlds",
    ui: { bg: "#0d0304", panel: "rgba(70, 10, 12, .6)", panelSolid: "#330608", edge: "rgba(255, 150, 150, .55)", select: "#a81020" },
    scene: {
      sky: [[0, "#0a0203"], [0.5, "#2a0407"], [1, "#55070e"]],
      layers: [
        { type: "eclipse", x: 0.5, y: 0.24, r: 0.12, rgb: "255, 40, 50", core: "#160203" },
        { type: "stars", n: 90, rgb: "255, 200, 200", seed: 2, maxY: 0.55 },
        { type: "spires", color: "#1e0305", base: 0.84, amp: 0.4, n: 14, seed: 3 },
        { type: "pillars", color: "#220406", base: 0.9, top: 0.14, line: "rgba(255,70,80,.3)" },
        { type: "crystals", base: 0.9, n: 14, rgb: "255, 50, 70", seed: 5 },
        { type: "floor", y: 0.9, rgb: "255, 50, 60", dark: "14, 2, 3", glow: "255, 90, 90" }
      ],
      particles: { type: "ember", rgb: "255, 60, 70", count: 60 }
    }
  },

  // ---------- Metal ----------
  {
    id: "gold", name: "Gold", group: "Metal",
    ui: { bg: "#6b4a00", panel: "rgba(90, 60, 0, .62)", panelSolid: "#5c4000", edge: "rgba(255, 245, 200, .85)", select: "#9a6b00", pageFg: "#3d2a00", brand: "#3d2a00", brandAccent: "#ffffff" },
    scene: {
      sky: [[0, "#fff3b0"], [0.35, "#f2c230"], [0.7, "#b8860b"], [1, "#6b4a00"]],
      layers: [{ type: "sheen", a: 0.22, seed: 3 }, { type: "vignette", a: 0.35 }],
      particles: { type: "sparkle", rgb: "255, 255, 220", count: 50 }
    }
  },
  {
    id: "silver", name: "Silver", group: "Metal",
    ui: { bg: "#8d939b", panel: "rgba(40, 46, 56, .72)", panelSolid: "#3a4049", edge: "rgba(255, 255, 255, .8)", select: "#4a5260", pageFg: "#1e232b", brand: "#1e232b", brandAccent: "#ffffff" },
    scene: {
      sky: [[0, "#ffffff"], [0.4, "#c9ced6"], [0.75, "#8a919b"], [1, "#5a6069"]],
      layers: [{ type: "sheen", a: 0.3, seed: 4 }, { type: "vignette", a: 0.3 }],
      particles: { type: "sparkle", rgb: "255, 255, 255", count: 45 }
    }
  },
  {
    id: "bronze", name: "Bronze", group: "Metal",
    ui: { bg: "#2a160a", panel: "rgba(60, 30, 12, .6)", panelSolid: "#4a2810", edge: "rgba(255, 210, 160, .65)", select: "#8a4b1d" },
    scene: {
      sky: [[0, "#f0b47a"], [0.4, "#a8662f"], [0.8, "#5c3418"], [1, "#2a160a"]],
      layers: [{ type: "sheen", a: 0.18, seed: 5 }, { type: "vignette", a: 0.4 }],
      particles: { type: "sparkle", rgb: "255, 205, 150", count: 40 }
    }
  },

  // ---------- Colors ----------
  {
    id: "blue", name: "Blue", group: "Colors",
    ui: { bg: "#0b2f8f", panel: "rgba(10, 40, 130, .55)", panelSolid: "#0d2f86", edge: "rgba(210, 230, 255, .6)", select: "#1250c4" },
    scene: { sky: [[0, "#4aa3ff"], [0.5, "#1f63e0"], [1, "#0b2f8f"]], layers: [{ type: "glow", x: 0.5, y: 0, r: 0.6, rgb: "160, 210, 255", a: 0.45 }], particles: { type: "bubble", rgb: "220, 235, 255", count: 30 } }
  },
  {
    id: "dark-blue", name: "Dark Blue", group: "Colors",
    ui: { bg: "#020814", panel: "rgba(4, 16, 48, .65)", panelSolid: "#061538", edge: "rgba(80, 150, 255, .6)", select: "#0b3fa8" },
    scene: { sky: [[0, "#020814"], [0.7, "#06205e"], [1, "#0c4bd6"]], layers: [{ type: "stars", n: 120, rgb: "150, 190, 255", seed: 3 }], particles: { type: "ember", rgb: "60, 140, 255", count: 50 } }
  },
  {
    id: "green", name: "Green", group: "Colors",
    ui: { bg: "#0a5a1f", panel: "rgba(6, 70, 24, .55)", panelSolid: "#0b4a1d", edge: "rgba(210, 255, 220, .6)", select: "#0b7a2a" },
    scene: { sky: [[0, "#5be37e"], [0.5, "#1fa346"], [1, "#0a5a1f"]], layers: [{ type: "glow", x: 0.5, y: 0, r: 0.6, rgb: "200, 255, 200", a: 0.4 }], particles: { type: "sparkle", rgb: "230, 255, 220", count: 30 } }
  },
  {
    id: "dark-green", name: "Dark Green", group: "Colors",
    ui: { bg: "#020d05", panel: "rgba(3, 30, 12, .65)", panelSolid: "#052812", edge: "rgba(80, 230, 120, .55)", select: "#0b6b24" },
    scene: { sky: [[0, "#020d05"], [0.7, "#064d1b"], [1, "#12a03c"]], layers: [], particles: { type: "firefly", rgb: "90, 255, 130", count: 35 } }
  },
  {
    id: "red", name: "Red", group: "Colors",
    ui: { bg: "#8a0b07", panel: "rgba(120, 10, 6, .5)", panelSolid: "#6e0a06", edge: "rgba(255, 220, 214, .6)", select: "#b5140d" },
    scene: { sky: [[0, "#ff6a5a"], [0.5, "#e0261b"], [1, "#8a0b07"]], layers: [{ type: "glow", x: 0.5, y: 0, r: 0.6, rgb: "255, 200, 190", a: 0.4 }], particles: { type: "sparkle", rgb: "255, 230, 220", count: 30 } }
  },
  {
    id: "dark-red", name: "Dark Red", group: "Colors",
    ui: { bg: "#0f0202", panel: "rgba(40, 4, 3, .65)", panelSolid: "#2c0504", edge: "rgba(255, 90, 80, .55)", select: "#a8100b" },
    scene: { sky: [[0, "#0f0202"], [0.7, "#5a0604"], [1, "#c9140c"]], layers: [], particles: { type: "ember", rgb: "255, 60, 40", count: 60 } }
  },
  {
    id: "pink", name: "Pink", group: "Colors",
    ui: { bg: "#b8337a", panel: "rgba(150, 30, 90, .5)", panelSolid: "#8c2259", edge: "rgba(255, 230, 242, .7)", select: "#c22d7d", brandAccent: "#5a0d34" },
    scene: { sky: [[0, "#ffb3d9"], [0.5, "#f06bb0"], [1, "#b8337a"]], layers: [{ type: "glow", x: 0.5, y: 0, r: 0.6, rgb: "255, 235, 245", a: 0.5 }], particles: { type: "petal", rgb: "255, 225, 240", count: 30 } }
  },
  {
    id: "bw", name: "Black & White", group: "Colors",
    ui: { bg: "#e6e6e6", panel: "rgba(15, 15, 15, .9)", panelSolid: "#141414", edge: "rgba(0, 0, 0, .85)", select: "#111111", pageFg: "#2a2a2a", brand: "#111111", brandAccent: "#e3261b" },
    scene: { sky: [[0, "#ffffff"], [1, "#d4d4d4"]], layers: [], particles: { type: "dust", rgb: "0, 0, 0", count: 25 } }
  },
  {
    id: "black", name: "Black", group: "Colors",
    ui: { bg: "#000000", panel: "rgba(18, 18, 18, .85)", panelSolid: "#111111", edge: "rgba(255, 255, 255, .35)", select: "#111111" },
    scene: { sky: [[0, "#1c1c1c"], [0.6, "#000000"]], layers: [{ type: "stars", n: 90, rgb: "255, 255, 255", seed: 3 }], particles: { type: "star", rgb: "255, 255, 255", count: 30 } }
  }
];
