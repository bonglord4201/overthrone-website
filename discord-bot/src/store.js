// Tiny JSON database kept in data/db.json. No native modules, so it runs on any Node host.
import fs from "node:fs";
import path from "node:path";

const DIR = path.resolve("data");
const FILE = path.join(DIR, "db.json");

const DEFAULTS = {
  settings: { channels: {}, roles: {}, statusMessageId: null },
  links: {},          // discordId -> { name, uuid, linkedAt }
  pendingLinks: {},   // discordId -> { name, code, expires }
  warnings: {},       // discordId -> [{ id, reason, by, at }]
  levels: {},         // discordId -> { xp, level, last }
  tickets: {},        // channelId -> { owner, type, number, openedAt }
  ticketCounter: 0,
  suggestions: {},    // number -> { messageId, channelId, author, text, status }
  suggestionCounter: 0,
  giveaways: {}       // messageId -> { channelId, prize, winners, endsAt, host, entrants, ended }
};

let data;
try {
  data = JSON.parse(fs.readFileSync(FILE, "utf8"));
} catch {
  data = {};
}
for (const [k, v] of Object.entries(DEFAULTS)) if (data[k] === undefined) data[k] = structuredClone(v);
for (const k of ["channels", "roles"]) data.settings[k] ??= {};

let timer = null;
function flush() {
  timer = null;
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, FILE);
}

export const db = data;

// Call after changing anything in db. Writes are batched (1s).
export function save() {
  if (!timer) timer = setTimeout(flush, 1000);
}

export function saveNow() {
  if (timer) clearTimeout(timer);
  flush();
}

process.on("exit", () => { if (timer) flush(); });
