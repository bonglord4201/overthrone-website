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
  {
    id: "hell", name: "Hell", group: "Worlds",
    ui: { bg: "#170403", panel: "rgba(110, 10, 6, .55)", panelSolid: "#3a0805", edge: "rgba(255, 214, 205, .5)", select: "#8e0f08" },
    scene: {
      sky: [[0, "#1a0202"], [0.5, "#460604"], [0.82, "#a3170a"], [1, "#ff5a14"]],
      layers: [
        { type: "glow", x: 0.5, y: 1.05, r: 0.75, rgb: "255, 110, 30", a: 0.55 },
        { type: "spires", color: "#2e0604", base: 0.8, amp: 0.42, n: 16, seed: 3 },
        { type: "mountains", color: "#1c0302", base: 0.88, amp: 0.12, seed: 5 },
        { type: "lava", base: 0.9, seed: 7 },
        { type: "mountains", color: "#0d0101", base: 0.985, amp: 0.05, seed: 9 },
        { type: "vignette", a: 0.55 }
      ],
      particles: { type: "ember", rgb: "255, 120, 40", count: 80 }
    }
  },
  {
    id: "heaven", name: "Heaven", group: "Worlds",
    ui: { bg: "#bfe3ff", panel: "rgba(40, 90, 150, .62)", panelSolid: "#2c5f96", edge: "rgba(255, 236, 170, .95)", select: "#a8790a", pageFg: "#2f4560", brand: "#1d3a5c", brandAccent: "#c98a00" },
    scene: {
      sky: [[0, "#6db8f5"], [0.5, "#c6e5ff"], [1, "#fffaf0"]],
      layers: [
        { type: "rays", x: 0.5, y: -0.15, rgb: "255, 246, 205", a: 0.22, n: 14, seed: 2 },
        { type: "glow", x: 0.5, y: -0.05, r: 0.6, rgb: "255, 244, 200", a: 0.95 },
        { type: "clouds", y: 0.22, rgb: "255, 255, 255", a: 0.55, n: 5, size: 0.05, seed: 4 },
        { type: "clouds", y: 0.66, rgb: "255, 255, 255", a: 0.8, n: 7, size: 0.08, seed: 6 },
        { type: "clouds", y: 0.84, rgb: "255, 255, 255", a: 0.95, n: 9, size: 0.1, seed: 8 }
      ],
      particles: { type: "sparkle", rgb: "255, 220, 120", count: 40 }
    }
  },
  {
    id: "underwater", name: "Underwater", group: "Worlds",
    ui: { bg: "#03101f", panel: "rgba(4, 30, 64, .55)", panelSolid: "#08264a", edge: "rgba(190, 228, 255, .5)", select: "#0b4486" },
    scene: {
      sky: [[0, "#33b0e0"], [0.4, "#0b5a96"], [1, "#03183a"]],
      layers: [
        { type: "rays", x: 0.35, y: -0.2, rgb: "220, 245, 255", a: 0.12, n: 12, seed: 3 },
        { type: "hills", color: "#04254a", base: 0.86, amp: 0.08, seed: 4 },
        { type: "seaweed", color: "#0a4a3f", n: 14, seed: 5 },
        { type: "hills", color: "#021428", base: 0.95, amp: 0.05, seed: 6 },
        { type: "vignette", a: 0.4 }
      ],
      particles: { type: "bubble", rgb: "210, 240, 255", count: 45 }
    }
  },
  {
    id: "galaxy", name: "Galaxy", group: "Worlds",
    ui: { bg: "#07041a", panel: "rgba(30, 14, 70, .6)", panelSolid: "#1d0f45", edge: "rgba(200, 180, 255, .55)", select: "#5b2bb5" },
    scene: {
      sky: [[0, "#05030f"], [1, "#130a30"]],
      layers: [
        { type: "glow", x: 0.22, y: 0.3, r: 0.45, rgb: "140, 60, 255", a: 0.4 },
        { type: "glow", x: 0.78, y: 0.62, r: 0.5, rgb: "255, 60, 170", a: 0.28 },
        { type: "glow", x: 0.6, y: 0.12, r: 0.3, rgb: "60, 160, 255", a: 0.3 },
        { type: "stars", n: 320, rgb: "255, 255, 255", seed: 7 }
      ],
      particles: { type: "star", rgb: "255, 255, 255", count: 70 }
    }
  },
  {
    id: "neon", name: "Neon City", group: "Worlds",
    ui: { bg: "#0b0221", panel: "rgba(40, 6, 70, .62)", panelSolid: "#250640", edge: "rgba(255, 120, 230, .65)", select: "#b0127e" },
    scene: {
      sky: [[0, "#0b0221"], [0.45, "#2a0848"], [0.72, "#c22a8a"], [0.721, "#14042a"], [1, "#0b0221"]],
      layers: [
        { type: "stars", n: 140, rgb: "255, 220, 255", seed: 2, maxY: 0.6 },
        { type: "stripedSun", x: 0.5, y: 0.6, r: 0.16, top: "#ffe45c", bottom: "#ff2d95", gap: "#3a0b5c" },
        { type: "city", color: "#12042a", base: 0.722, amp: 0.2, win: "255, 200, 90", seed: 5 },
        { type: "grid", top: 0.722, rgb: "255, 70, 210" }
      ],
      particles: { type: "sparkle", rgb: "255, 120, 230", count: 30 }
    }
  },
  {
    id: "jungle", name: "Jungle", group: "Worlds",
    ui: { bg: "#06200d", panel: "rgba(8, 50, 20, .6)", panelSolid: "#0a3a18", edge: "rgba(200, 255, 170, .55)", select: "#1f7a2e" },
    scene: {
      sky: [[0, "#2c7a3a"], [0.55, "#0f3b1c"], [1, "#041509"]],
      layers: [
        { type: "rays", x: 0.6, y: -0.15, rgb: "230, 255, 180", a: 0.1, n: 10, seed: 3 },
        { type: "glow", x: 0.6, y: 0.05, r: 0.5, rgb: "210, 255, 150", a: 0.3 },
        { type: "hills", color: "#0d3d1b", base: 0.68, amp: 0.12, seed: 4 },
        { type: "canopy", color: "#0a2e14", base: 0.78, seed: 5 },
        { type: "hills", color: "#061f0d", base: 0.86, amp: 0.08, seed: 6 },
        { type: "canopy", color: "#031208", base: 0.95, seed: 7 },
        { type: "vignette", a: 0.45 }
      ],
      particles: { type: "firefly", rgb: "220, 255, 120", count: 35 }
    }
  },
  {
    id: "arctic", name: "Arctic", group: "Worlds",
    ui: { bg: "#cdeaff", panel: "rgba(20, 70, 120, .66)", panelSolid: "#1d4f7f", edge: "rgba(255, 255, 255, .9)", select: "#1d6fb0", pageFg: "#1d3a55", brand: "#163452", brandAccent: "#1d78c4" },
    scene: {
      sky: [[0, "#7cc8f7"], [0.55, "#d6efff"], [1, "#f4fbff"]],
      layers: [
        { type: "glow", x: 0.8, y: 0.12, r: 0.35, rgb: "255, 255, 240", a: 0.8 },
        { type: "mountains", color: "#a9cde8", base: 0.62, amp: 0.3, seed: 3 },
        { type: "mountains", color: "#7fadd1", base: 0.78, amp: 0.18, seed: 5 },
        { type: "hills", color: "#eef7ff", base: 0.9, amp: 0.05, seed: 7 }
      ],
      particles: { type: "snow", rgb: "255, 255, 255", count: 90 }
    }
  },
  {
    id: "desert", name: "Desert Sunset", group: "Worlds",
    ui: { bg: "#3a1408", panel: "rgba(90, 30, 20, .58)", panelSolid: "#5a2010", edge: "rgba(255, 220, 170, .65)", select: "#b8501d" },
    scene: {
      sky: [[0, "#2b1055"], [0.42, "#c83a6b"], [0.66, "#ff9a3c"], [1, "#ffd27a"]],
      layers: [
        { type: "sun", x: 0.5, y: 0.64, r: 0.11, c1: "#fff6cf", c2: "#ffb347" },
        { type: "dunes", color: "#c2551f", base: 0.74, amp: 0.06, seed: 3 },
        { type: "dunes", color: "#8f3412", base: 0.84, amp: 0.06, seed: 5 },
        { type: "dunes", color: "#541a07", base: 0.95, amp: 0.04, seed: 7 }
      ],
      particles: { type: "dust", rgb: "255, 225, 180", count: 30 }
    }
  },
  {
    id: "haunted", name: "Haunted", group: "Worlds",
    ui: { bg: "#0a0614", panel: "rgba(40, 18, 60, .62)", panelSolid: "#24103a", edge: "rgba(255, 170, 80, .55)", select: "#c25a0a" },
    scene: {
      sky: [[0, "#0a0614"], [0.6, "#2a1240"], [1, "#40182a"]],
      layers: [
        { type: "stars", n: 110, rgb: "255, 240, 220", seed: 3, maxY: 0.6 },
        { type: "moon", x: 0.76, y: 0.22, r: 0.07, rgb: "255, 244, 214" },
        { type: "hills", color: "#150a20", base: 0.8, amp: 0.1, seed: 4 },
        { type: "deadtrees", color: "#08040d", base: 0.86, n: 6, seed: 5 },
        { type: "hills", color: "#05020a", base: 0.95, amp: 0.04, seed: 6 },
        { type: "glow", x: 0.5, y: 1, r: 0.6, rgb: "120, 60, 160", a: 0.25 }
      ],
      particles: { type: "firefly", rgb: "255, 150, 40", count: 22 }
    }
  },
  {
    id: "sakura", name: "Sakura", group: "Worlds",
    ui: { bg: "#ffe3ee", panel: "rgba(130, 40, 80, .66)", panelSolid: "#7a2550", edge: "rgba(255, 240, 246, .9)", select: "#c22d7d", pageFg: "#6b2647", brand: "#5a1a3a", brandAccent: "#d42a78" },
    scene: {
      sky: [[0, "#ffc2da"], [0.6, "#ffe6f0"], [1, "#fff6f9"]],
      layers: [
        { type: "glow", x: 0.3, y: 0.2, r: 0.4, rgb: "255, 255, 255", a: 0.7 },
        { type: "hills", color: "#e9b0c9", base: 0.7, amp: 0.2, seed: 3 },
        { type: "hills", color: "#cf86a8", base: 0.84, amp: 0.07, seed: 5 },
        { type: "hills", color: "#a4527b", base: 0.95, amp: 0.04, seed: 7 }
      ],
      particles: { type: "petal", rgb: "255, 160, 195", count: 45 }
    }
  },
  {
    id: "storm", name: "Storm", group: "Worlds",
    ui: { bg: "#1b222c", panel: "rgba(20, 28, 40, .7)", panelSolid: "#1c2533", edge: "rgba(190, 210, 240, .5)", select: "#2f4a6e" },
    scene: {
      sky: [[0, "#141a22"], [0.6, "#2d3846"], [1, "#3d4a58"]],
      layers: [
        { type: "clouds", y: 0.05, rgb: "12, 16, 22", a: 0.95, n: 8, size: 0.13, seed: 3 },
        { type: "clouds", y: 0.2, rgb: "24, 31, 41", a: 0.85, n: 7, size: 0.09, seed: 5 },
        { type: "hills", color: "#0c1016", base: 0.9, amp: 0.06, seed: 6 }
      ],
      particles: { type: "rain", rgb: "180, 200, 230", count: 150, lightning: true }
    }
  },
  {
    id: "casino", name: "Casino", group: "Worlds",
    ui: { bg: "#04190c", panel: "rgba(0, 38, 14, .6)", panelSolid: "#0b3018", edge: "rgba(240, 214, 140, .6)", select: "#0d5b2c" },
    scene: {
      sky: [[0, "#13703a"], [1, "#052812"]],
      layers: [
        { type: "glow", x: 0.5, y: 0.35, r: 0.6, rgb: "70, 210, 120", a: 0.35 },
        { type: "felt", seed: 3 },
        { type: "vignette", a: 0.65 }
      ],
      particles: { type: "sparkle", rgb: "255, 215, 120", count: 30 }
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
