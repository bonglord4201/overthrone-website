// OVERTHRONE donor ranks – single source for the rank comparison table.
// Order is fixed: Ronin → Valkyrie → Monarch → Godborn → Overlord (highest donor rank).
//
// Every rank inherits everything from the rank below it. Rows marked `from`
// are unlocked at that rank and shown as ✓ for it and every higher rank.
// Rows with `values` scale per rank (0 / null / false render as ✕).

// Tebex package IDs (Tebex → Packages → the number in each rank's URL). Used to link the
// rank names in the Tebex comparison block to each rank's store page.
export const STORE_URL = "https://overthronesmp.tebex.store";
export const PACKAGE_IDS = { ronin: 7711787, valkyrie: 7711799, monarch: 7711809, godborn: 7711825, overlord: 7711838 };

export const RANKS = [
  { key: "ronin", name: "Ronin", color: "#E0434F" },
  { key: "valkyrie", name: "Valkyrie", color: "#C04DFF" },
  { key: "monarch", name: "Monarch", color: "#E6B85C" },
  { key: "godborn", name: "Godborn", color: "#F3E2B0" },
  { key: "overlord", name: "Overlord", color: "#FF3B2F" }
];

const R = ["ronin", "valkyrie", "monarch", "godborn", "overlord"];
const from = (rank) => R.map((_, i) => i >= R.indexOf(rank));

export const SECTIONS = [
  {
    title: "Rank & Chat",
    rows: [
      { label: "Prefix in Chat & Tab", values: ["[RONIN]", "[VALKYRIE]", "[MONARCH]", "[GODBORN]", "[OVERLORD]"], prefix: true },
      { label: "View In-Game Chat on Discord", values: from("ronin") },
      { label: "Colours in Books", values: from("ronin") },
      { label: "Show Items in Chat", values: from("valkyrie") },
      { label: "Sign Formatting", values: from("valkyrie") },
      { label: "Coloured Item Names in Anvils", values: from("valkyrie") },
      { label: "Custom Chat Formatting", values: from("overlord") }
    ]
  },
  {
    title: "Classes & Progression",
    rows: [
      { label: "Class Reset Tokens (on purchase)", values: ["1×", "2×", "3×", "4×", "5×"] },
      { label: "Classes & Abilities at Once", values: [1, 1, 1, 1, 2] },
      { label: "Keep EXP on Death", values: from("overlord") }
    ]
  },
  {
    title: "Economy & Trading",
    rows: [
      { label: "Chest Shops", values: [100, 200, 300, 500, "Unlimited"] },
      { label: "Double-Chest Shops", values: from("ronin") },
      { label: "Remote Chest Shops", values: [0, 0, 0, "50 Blocks", "200 Blocks"] },
      { label: "Auction House Slots", values: [5, 7, 9, 11, 15] },
      { label: "Auction House Priority", values: ["Lvl 1", "Lvl 2", "Lvl 3", "Lvl 4", "Lvl 5"] },
      { label: "Premium Jobs", values: from("ronin") },
      { label: "Active Jobs", values: [1, 2, 3, 4, 5] }
    ]
  },
  {
    title: "Storage, Homes & Warps",
    rows: [
      { label: "Homes", values: [2, 3, 4, 5, 6] },
      { label: "Player Vaults (/vault)", values: [1, 2, 3, 5, 7] },
      { label: "Reset Vaults", values: [3, 5, 7, 9, 12] },
      { label: "Player Warps", values: [0, 1, 2, 3, 4] },
      { label: "Player Warp Priority", values: [0, 0, "Lvl 1", "Lvl 2", "Lvl 3"] }
    ]
  },
  {
    title: "Kits & World",
    rows: [
      { label: "Rank Kits Unlocked (/kits)", values: [1, 2, 3, 4, 5], note: "Your rank kit plus every lower rank kit." },
      { label: "Mine Spawners with Silk Touch", values: from("ronin") },
      { label: "Mine Spawners without Silk Touch", values: from("monarch") },
      { label: "Customise Armor Stands", values: from("overlord") }
    ]
  }
];

// Commands, grouped, with the rank that unlocks each (higher ranks inherit).
export const COMMANDS = [
  {
    title: "Utility Commands",
    rows: [
      ["/craft", "ronin"], ["/furnace", "ronin"], ["/recipe", "ronin"],
      ["/enchantable", "valkyrie"], ["/grindstone", "valkyrie"], ["/stonecutter", "valkyrie"],
      ["/cartographytable", "valkyrie"], ["/loom", "valkyrie"], ["/smithingtable", "valkyrie"],
      ["/anvil", "monarch"], ["/echest", "monarch"],
      ["/disposal", "godborn"], ["/clearinventory", "godborn"]
    ]
  },
  {
    title: "Economy / Player Commands",
    rows: [
      ["/seen", "ronin"], ["/firstjoin", "valkyrie"], ["/bal <player>", "godborn"],
      ["/near", "godborn"], ["/tprequest", "godborn"], ["/inv <player>", "overlord"]
    ]
  },
  {
    title: "Cosmetic / Chat Commands",
    rows: [
      ["/rename", "godborn"], ["/eglow", "godborn"], ["/nick", "overlord"],
      ["/color", "overlord"], ["/me", "overlord"], ["/hat", "overlord"]
    ]
  },
  {
    title: "Convenience Commands",
    rows: [
      ["/ptime", "ronin"], ["/pweather", "ronin"], ["/afk", "overlord"], ["/sit", "overlord"], ["/lay", "overlord"]
    ]
  }
];

export const commandValues = (rank) => from(rank);
