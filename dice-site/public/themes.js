// ColorRoll themes.
//
// Each theme has:
//   ui     page colors, written to CSS variables (panels, edges, text, accents).
//   image  a full-bleed background photo in public/images/th/ (the art).
//   sky    a fallback gradient shown for the instant before the image loads.
//   tint   optional [topRGBA, bottomRGBA] overlay drawn over the image so text
//          stays readable over busy artwork.
//   particles  one kind of moving particle drawn on top (scene.js).
//
// To swap in your own higher-resolution art for a theme, drop a file with the
// same name into public/images/th/ (e.g. hell.webp) and redeploy.

window.THEMES = [
  // ---------- Worlds ----------
  {
    id: "hell", name: "Inferno", group: "Worlds",
    ui: { bg: "#140202", panel: "rgba(70, 8, 6, .42)", panelSolid: "#3a0805", edge: "rgba(255, 150, 110, .55)", select: "#9c1409", accent: "#ff5a1e", accentFg: "#1a0400" },
    image: "images/th/hell.webp",
    sky: [[0, "#2a0503"], [1, "#0a0101"]],
    tint: ["rgba(20,2,2,.15)", "rgba(10,1,1,.55)"],
    particles: { type: "ember", rgb: "255, 120, 50", count: 70 }
  },
  {
    id: "heaven", name: "Celestial Kingdom", group: "Worlds",
    ui: { bg: "#cfe6ff", panel: "rgba(36, 70, 120, .4)", panelSolid: "#2c5f96", edge: "rgba(255, 244, 200, .85)", select: "#9a6b12", pageFg: "#223a56", brand: "#1d3a5c", brandAccent: "#c98a00", accent: "#f2c04a", accentFg: "#2a1c00" },
    image: "images/th/heaven.webp",
    sky: [[0, "#bfe0ff"], [1, "#fff6e4"]],
    tint: ["rgba(255,250,235,.05)", "rgba(40,60,90,.35)"],
    particles: { type: "sparkle", rgb: "255, 225, 140", count: 40 }
  },
  {
    id: "underwater", name: "Abyssal Ocean", group: "Worlds",
    ui: { bg: "#03101f", panel: "rgba(5, 34, 66, .44)", panelSolid: "#08264a", edge: "rgba(130, 225, 255, .55)", select: "#0b5e96", accent: "#2bc4e0", accentFg: "#00141c" },
    image: "images/th/underwater.webp",
    sky: [[0, "#0b5a96"], [1, "#021530"]],
    tint: ["rgba(4,30,60,.2)", "rgba(2,12,30,.55)"],
    particles: { type: "bubble", rgb: "180, 235, 255", count: 46 }
  },
  {
    id: "neon", name: "Cyberpunk Neon", group: "Worlds",
    ui: { bg: "#0b0221", panel: "rgba(36, 8, 60, .46)", panelSolid: "#250640", edge: "rgba(255, 120, 230, .6)", select: "#b0127e", accent: "#ff3df0", accentFg: "#1a0016" },
    image: "images/th/neon.webp",
    sky: [[0, "#2a0848"], [1, "#0b0221"]],
    tint: ["rgba(20,4,40,.2)", "rgba(10,2,25,.5)"],
    particles: { type: "sparkle", rgb: "255, 110, 240", count: 34 }
  },
  {
    id: "jungle", name: "Ancient Jungle", group: "Worlds",
    ui: { bg: "#06200d", panel: "rgba(10, 46, 22, .46)", panelSolid: "#0a3a18", edge: "rgba(190, 255, 160, .5)", select: "#1f7a2e", accent: "#4fd36a", accentFg: "#04170a" },
    image: "images/th/jungle.webp",
    sky: [[0, "#1c5a2c"], [1, "#041509"]],
    tint: ["rgba(6,30,14,.2)", "rgba(3,16,8,.55)"],
    particles: { type: "firefly", rgb: "210, 255, 120", count: 34 }
  },
  {
    id: "void", name: "Cosmic Void", group: "Worlds",
    ui: { bg: "#07041a", panel: "rgba(28, 14, 64, .48)", panelSolid: "#1d0f45", edge: "rgba(200, 170, 255, .55)", select: "#6a2bb5", accent: "#a265ff", accentFg: "#0c0320" },
    image: "images/th/void.webp",
    sky: [[0, "#160b34"], [1, "#05030f"]],
    tint: ["rgba(10,6,28,.15)", "rgba(5,3,16,.5)"],
    particles: { type: "star", rgb: "220, 200, 255", count: 70 }
  },
  {
    id: "frozen", name: "Frostbound Empire", group: "Worlds",
    ui: { bg: "#cdeaff", panel: "rgba(22, 64, 104, .46)", panelSolid: "#1d4f7f", edge: "rgba(235, 248, 255, .85)", select: "#1d6fb0", pageFg: "#1d3a55", brand: "#163452", brandAccent: "#1d78c4", accent: "#6fc3ff", accentFg: "#002036" },
    image: "images/th/frozen.webp",
    sky: [[0, "#8fd0f7"], [1, "#eef8ff"]],
    tint: ["rgba(220,240,255,.06)", "rgba(20,50,80,.4)"],
    particles: { type: "snow", rgb: "255, 255, 255", count: 90 }
  },
  {
    id: "egypt", name: "Golden Pharaoh", group: "Worlds",
    ui: { bg: "#241206", panel: "rgba(74, 42, 14, .46)", panelSolid: "#4a2c10", edge: "rgba(255, 216, 140, .6)", select: "#9a6418", accent: "#ffbd3c", accentFg: "#1f1200" },
    image: "images/th/egypt.webp",
    sky: [[0, "#b8632a"], [1, "#2a1206"]],
    tint: ["rgba(40,20,6,.15)", "rgba(24,12,4,.5)"],
    particles: { type: "dust", rgb: "255, 225, 160", count: 34 }
  },
  {
    id: "candy", name: "Candy Dream", group: "Worlds",
    ui: { bg: "#ffd9ec", panel: "rgba(140, 42, 96, .4)", panelSolid: "#8c2a60", edge: "rgba(255, 246, 250, .9)", select: "#c42d80", pageFg: "#6b2650", brand: "#5a1a44", brandAccent: "#d42a86", accent: "#ff5fae", accentFg: "#3a0022" },
    image: "images/th/candy.webp",
    sky: [[0, "#ffc2e2"], [1, "#d7f0ff"]],
    tint: ["rgba(255,245,250,.04)", "rgba(120,50,90,.3)"],
    particles: { type: "petal", rgb: "255, 170, 215", count: 42 }
  },
    // ---------- Metal ----------
  {
    id: "gold", name: "Gold", group: "Metal",
    ui: { bg: "#6b4a00", panel: "rgba(90, 60, 0, .5)", panelSolid: "#5c4000", edge: "rgba(255, 245, 200, .85)", select: "#9a6b00", pageFg: "#3d2a00", brand: "#3d2a00", brandAccent: "#ffffff", accent: "#ffd84a", accentFg: "#2a1c00" },
    sky: [[0, "#fff3b0"], [0.35, "#f2c230"], [0.7, "#b8860b"], [1, "#6b4a00"]],
    layers: [{ type: "sheen", a: 0.22, seed: 3 }, { type: "vignette", a: 0.35 }],
    particles: { type: "sparkle", rgb: "255, 255, 220", count: 50 }
  },
  {
    id: "silver", name: "Silver", group: "Metal",
    ui: { bg: "#8d939b", panel: "rgba(40, 46, 56, .6)", panelSolid: "#3a4049", edge: "rgba(255, 255, 255, .8)", select: "#4a5260", pageFg: "#1e232b", brand: "#1e232b", brandAccent: "#ffffff", accent: "#cfe0f0", accentFg: "#10151b" },
    sky: [[0, "#ffffff"], [0.4, "#c9ced6"], [0.75, "#8a919b"], [1, "#5a6069"]],
    layers: [{ type: "sheen", a: 0.3, seed: 4 }, { type: "vignette", a: 0.3 }],
    particles: { type: "sparkle", rgb: "255, 255, 255", count: 45 }
  },
  {
    id: "bronze", name: "Bronze", group: "Metal",
    ui: { bg: "#2a160a", panel: "rgba(60, 30, 12, .52)", panelSolid: "#4a2810", edge: "rgba(255, 210, 160, .65)", select: "#8a4b1d", accent: "#e0954a", accentFg: "#1c0e04" },
    sky: [[0, "#f0b47a"], [0.4, "#a8662f"], [0.8, "#5c3418"], [1, "#2a160a"]],
    layers: [{ type: "sheen", a: 0.18, seed: 5 }, { type: "vignette", a: 0.4 }],
    particles: { type: "sparkle", rgb: "255, 205, 150", count: 40 }
  },

  // ---------- Colors ----------
  {
    id: "blue", name: "Blue", group: "Colors",
    ui: { bg: "#0b2f8f", panel: "rgba(10, 40, 130, .5)", panelSolid: "#0d2f86", edge: "rgba(210, 230, 255, .6)", select: "#1250c4", accent: "#4aa3ff", accentFg: "#001028" },
    sky: [[0, "#4aa3ff"], [0.5, "#1f63e0"], [1, "#0b2f8f"]],
    layers: [{ type: "glow", x: 0.5, y: 0, r: 0.6, rgb: "160, 210, 255", a: 0.45 }],
    particles: { type: "bubble", rgb: "220, 235, 255", count: 30 }
  },
  {
    id: "dark-blue", name: "Dark Blue", group: "Colors",
    ui: { bg: "#020814", panel: "rgba(4, 16, 48, .6)", panelSolid: "#061538", edge: "rgba(80, 150, 255, .6)", select: "#0b3fa8", accent: "#3c8cff", accentFg: "#00122e" },
    sky: [[0, "#020814"], [0.7, "#06205e"], [1, "#0c4bd6"]],
    layers: [{ type: "stars", n: 120, rgb: "150, 190, 255", seed: 3 }],
    particles: { type: "ember", rgb: "60, 140, 255", count: 50 }
  },
  {
    id: "green", name: "Green", group: "Colors",
    ui: { bg: "#0a5a1f", panel: "rgba(6, 70, 24, .5)", panelSolid: "#0b4a1d", edge: "rgba(210, 255, 220, .6)", select: "#0b7a2a", accent: "#2bd35a", accentFg: "#00180a" },
    sky: [[0, "#5be37e"], [0.5, "#1fa346"], [1, "#0a5a1f"]],
    layers: [{ type: "glow", x: 0.5, y: 0, r: 0.6, rgb: "200, 255, 200", a: 0.4 }],
    particles: { type: "sparkle", rgb: "230, 255, 220", count: 30 }
  },
  {
    id: "dark-green", name: "Dark Green", group: "Colors",
    ui: { bg: "#020d05", panel: "rgba(3, 30, 12, .6)", panelSolid: "#052812", edge: "rgba(80, 230, 120, .55)", select: "#0b6b24", accent: "#2bd35a", accentFg: "#00140a" },
    sky: [[0, "#020d05"], [0.7, "#064d1b"], [1, "#12a03c"]],
    layers: [],
    particles: { type: "firefly", rgb: "90, 255, 130", count: 35 }
  },
  {
    id: "red", name: "Red", group: "Colors",
    ui: { bg: "#8a0b07", panel: "rgba(120, 10, 6, .5)", panelSolid: "#6e0a06", edge: "rgba(255, 220, 214, .6)", select: "#b5140d", accent: "#ff5a3d", accentFg: "#1c0200" },
    sky: [[0, "#ff6a5a"], [0.5, "#e0261b"], [1, "#8a0b07"]],
    layers: [{ type: "glow", x: 0.5, y: 0, r: 0.6, rgb: "255, 200, 190", a: 0.4 }],
    particles: { type: "sparkle", rgb: "255, 230, 220", count: 30 }
  },
  {
    id: "dark-red", name: "Dark Red", group: "Colors",
    ui: { bg: "#0f0202", panel: "rgba(40, 4, 3, .6)", panelSolid: "#2c0504", edge: "rgba(255, 90, 80, .55)", select: "#a8100b", accent: "#ff4433", accentFg: "#180201" },
    sky: [[0, "#0f0202"], [0.7, "#5a0604"], [1, "#c9140c"]],
    layers: [],
    particles: { type: "ember", rgb: "255, 60, 40", count: 60 }
  },
  {
    id: "pink", name: "Pink", group: "Colors",
    ui: { bg: "#b8337a", panel: "rgba(150, 30, 90, .5)", panelSolid: "#8c2259", edge: "rgba(255, 230, 242, .7)", select: "#c22d7d", accent: "#ff6fc0", accentFg: "#2a0019" },
    sky: [[0, "#ffb3d9"], [0.5, "#f06bb0"], [1, "#b8337a"]],
    layers: [{ type: "glow", x: 0.5, y: 0, r: 0.6, rgb: "255, 235, 245", a: 0.5 }],
    particles: { type: "petal", rgb: "255, 225, 240", count: 30 }
  },
  {
    id: "bw", name: "Black & White", group: "Colors",
    ui: { bg: "#e6e6e6", panel: "rgba(15, 15, 15, .88)", panelSolid: "#141414", edge: "rgba(0, 0, 0, .85)", select: "#111111", pageFg: "#2a2a2a", brand: "#111111", brandAccent: "#e3261b", accent: "#111111", accentFg: "#ffffff" },
    sky: [[0, "#ffffff"], [1, "#d4d4d4"]],
    layers: [],
    particles: { type: "dust", rgb: "0, 0, 0", count: 25 }
  },
  {
    id: "black", name: "Black", group: "Colors",
    ui: { bg: "#000000", panel: "rgba(18, 18, 18, .82)", panelSolid: "#111111", edge: "rgba(255, 255, 255, .35)", select: "#111111", accent: "#ffffff", accentFg: "#000000" },
    sky: [[0, "#1c1c1c"], [0.6, "#000000"]],
    layers: [{ type: "stars", n: 90, rgb: "255, 255, 255", seed: 3 }],
    particles: { type: "star", rgb: "255, 255, 255", count: 30 }
  }
];
