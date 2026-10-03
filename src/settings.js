// Site settings: the whitelist of editable keys, their defaults and validation.
// Every value here is public (it is rendered into the site), so never add
// secrets to this list. Secrets belong in `wrangler secret put`.

export const SETTINGS = {
  server_address:       { group: "Server", label: "Minecraft server address", type: "text", max: 100, default: "overthronesmp.net" },
  minecraft_version:    { group: "Server", label: "Minecraft version", type: "text", max: 40, default: "1.21.1" },
  mod_loader:           { group: "Server", label: "Mod loader", type: "text", max: 40, default: "NeoForge" },
  core_mod:             { group: "Server", label: "Core mod", type: "text", max: 80, default: "Tensura: Reincarnated" },
  discord_url:          { group: "Links", label: "Discord invite URL", type: "url", default: "https://discord.gg/overthonesmp" },
  tebex_url:            { group: "Links", label: "Tebex store URL (leave empty until the store exists)", type: "url", default: "" },
  social_youtube:       { group: "Links", label: "YouTube URL", type: "url", default: "" },
  social_tiktok:        { group: "Links", label: "TikTok URL", type: "url", default: "" },
  social_x:             { group: "Links", label: "X / Twitter URL", type: "url", default: "" },
  social_instagram:     { group: "Links", label: "Instagram URL", type: "url", default: "" },
  social_twitch:        { group: "Links", label: "Twitch URL", type: "url", default: "" },
  hero_tagline:         { group: "Home page", label: "Hero tagline", type: "text", max: 160, default: "Don’t reach the throne. Overthrow it." },
  realms_intro:         { group: "Home page", label: "Realms section intro", type: "text", max: 300, default: "Six realms, each with its own role." },
  ranks_intro:          { group: "Home page", label: "Hunter Progression intro", type: "text", max: 300, default: "The Hunter rank path runs from E to ???. Requirements are under development." },
  tensura_intro:        { group: "Home page", label: "Tensura Skills intro", type: "text", max: 400, default: "OVERTHRONE runs Tensura: Reincarnated. Browse its skills, magics and battlewills." },
  forums_intro:         { group: "Home page", label: "Forums page intro", type: "text", max: 300, default: "News, guides and discussion for OVERTHRONE SMP." },
  banner_enabled:       { group: "Announcement banner", label: "Show banner on every page", type: "bool", default: "0" },
  banner_text:          { group: "Announcement banner", label: "Banner text", type: "text", max: 200, default: "" },
  banner_link:          { group: "Announcement banner", label: "Banner link (optional)", type: "link", default: "" },
  seo_home_title:       { group: "SEO", label: "Home page title", type: "text", max: 120, default: "" },
  seo_home_description: { group: "SEO", label: "Home page description", type: "text", max: 300, default: "" },
  seo_og_description:   { group: "SEO", label: "Social share description", type: "text", max: 200, default: "" },
  vote_rewards:         { group: "Voting", label: "Voting rewards text (shown on /vote)", type: "text", max: 300, default: "" }
};

// Vote page slots: vote_1_name / vote_1_url ... A slot shows on /vote once it has a URL.
export const VOTE_SLOTS = 6;
for (let n = 1; n <= VOTE_SLOTS; n++) {
  SETTINGS[`vote_${n}_name`] = { group: "Voting", label: `Vote site ${n} name`, type: "text", max: 60, default: "" };
  SETTINGS[`vote_${n}_url`] = { group: "Voting", label: `Vote site ${n} link`, type: "url", default: "" };
}

export const isHttpUrl = (v) => /^https?:\/\/[^\s"'<>]+$/i.test(v);
export const isLink = (v) => isHttpUrl(v) || /^\/(?!\/)[^\s"'<>]*$/.test(v);

export function cleanSetting(key, value) {
  const def = SETTINGS[key];
  if (!def) return null;
  if (def.type === "bool") return value === true || value === "1" || value === 1 ? "1" : "0";
  const v = String(value ?? "").trim();
  if (def.type === "url" && v && !isHttpUrl(v)) throw new Error(def.label + " must start with https://");
  if (def.type === "link" && v && !isLink(v)) throw new Error(def.label + " must be a full URL or a path starting with /");
  if (def.max && v.length > def.max) throw new Error(def.label + " is too long (max " + def.max + ").");
  return v;
}

const defaults = () => Object.fromEntries(Object.entries(SETTINGS).map(([k, d]) => [k, d.default]));

let cache = { at: 0, value: null };

export async function getSettings(env, { fresh = false } = {}) {
  if (!fresh && cache.value && Date.now() - cache.at < 30000) return cache.value;
  const settings = defaults();
  const { results } = await env.DB.prepare("SELECT key, value FROM site_settings").all();
  for (const row of results) if (row.key in SETTINGS) settings[row.key] = row.value;
  cache = { at: Date.now(), value: settings };
  return settings;
}

export function clearSettingsCache() {
  cache = { at: 0, value: null };
}
