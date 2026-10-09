// The target layout for the OVERTHRONE Discord, used by /server preview|apply|content.
//
// Existing channels and roles are matched by name, ignoring emoji, separators and case
// ("📜・rules" matches "rules"), so nothing is renamed or recreated. Only missing ones are
// created. Channels that aren't listed here are left where they are.
import { PermissionFlagsBits as P } from "discord.js";

// Roles, top to bottom. "staff" roles can see the staff area; "support" roles also see tickets.
export const ROLES = [
  { key: "admin", name: "Admin", aliases: ["admin", "admins", "administrator", "head admin"], color: 0xc1121f, hoist: true, staff: true, support: true,
    perms: [P.ManageGuild, P.ManageRoles, P.ManageChannels, P.ManageMessages, P.ManageThreads, P.ManageNicknames, P.KickMembers, P.BanMembers, P.ModerateMembers, P.ViewAuditLog, P.MentionEveryone, P.MuteMembers, P.MoveMembers, P.DeafenMembers] },
  { key: "developer", name: "Developer", aliases: ["developer", "developers", "dev", "devs", "server developer"], color: 0x9b59b6, hoist: true, staff: true, perms: [] },
  { key: "moderator", name: "Moderator", aliases: ["moderator", "moderators", "mod", "discord mod", "discord moderator"], color: 0x3498db, hoist: true, staff: true, support: true,
    perms: [P.ManageMessages, P.ManageThreads, P.ManageNicknames, P.KickMembers, P.ModerateMembers, P.ViewAuditLog, P.MuteMembers, P.MoveMembers] },
  { key: "ingame", name: "In-Game Admin", aliases: ["in game admin", "ingame admin", "game admin", "in game staff", "ingame staff", "in game mod"], color: 0xe67e22, hoist: true, staff: true, support: true, perms: [] },
  { key: "builder", name: "Builder", aliases: ["builder", "builders", "build team"], color: 0xf1c40f, hoist: true, staff: true, perms: [] },
  { key: "helper", name: "Helper", aliases: ["helper", "helpers", "trial mod", "trial moderator"], color: 0x2ecc71, hoist: true, staff: true, support: true, perms: [P.ModerateMembers] },
  { key: "staff", name: "Staff", aliases: ["staff", "staff team"], color: 0x8b0000, hoist: false, staff: true, support: true, perms: [] },
  { key: "linked", name: "Linked", aliases: ["linked", "verified"], color: 0x2ecc71, hoist: false, perms: [] },
  { key: "ping_announcements", name: "Announcements Ping", aliases: ["announcements ping", "announcement ping"], color: 0x95a5a6, ping: "📢", perms: [] },
  { key: "ping_updates", name: "Updates Ping", aliases: ["updates ping", "update ping"], color: 0x95a5a6, ping: "💻", perms: [] },
  { key: "ping_events", name: "Events Ping", aliases: ["events ping", "event ping"], color: 0x95a5a6, ping: "🎉", perms: [] },
  { key: "ping_giveaways", name: "Giveaways Ping", aliases: ["giveaways ping", "giveaway ping"], color: 0x95a5a6, ping: "🎁", perms: [] }
];

// Permission templates:
//   readonly  everyone reads, only Admin (and the bot) posts
//   community everyone reads and chats
//   staff     only staff roles see it
//   team      only Admin + the listed role keys see it
//   botlog    only staff see it, only the bot posts
//   voice     everyone joins and talks
export const LAYOUT = [
  { key: "stats", name: "📊 SERVER STATS", aliases: ["server stats", "stats"], perm: null, optional: true, channels: [] },   // only ordered if it exists
  { key: "info", name: "📌 INFORMATION", aliases: ["the throne", "throne", "information", "info", "overthrone", "overthrone smp", "start here", "important"], perm: "readonly", channels: [
    { key: "welcome", name: "👋・welcome", aliases: ["welcome"], bot: "welcome" },
    { key: "rules", name: "📜・rules", aliases: ["rules", "server rules"] },
    { key: "announcements", name: "📢・announcements", aliases: ["announcements", "announcement", "news"] },
    { key: "updates", name: "💻・updates", aliases: ["updates", "update", "server updates"] },
    { key: "changelog", name: "📋・changelog", aliases: ["changelog", "changelogs", "patch notes"] },
    { key: "status", name: "📡・server-status", aliases: ["server status", "status"], bot: "status" },
    { key: "links", name: "🌐・website-links", aliases: ["website links", "links", "website", "useful links"] },
    { key: "roles", name: "⭐・roles", aliases: ["roles", "self roles", "get roles", "reaction roles"] }
  ] },
  // Optional: if there is no "How to Play" category these channels stay exactly where and how they are.
  { key: "play", name: "📖 HOW TO PLAY", aliases: ["how to play", "getting started", "new players"], perm: "readonly", optional: true, channels: [
    { key: "howtoplay", name: "📖・how-to-play", aliases: ["how to play", "modpack", "install"], perm: null },   // never touched
    { key: "mods", name: "🧩・mods-guide", aliases: ["mods guide", "mods", "mod list", "keybinds"] },
    { key: "commands", name: "⌨️・useful-commands", aliases: ["useful commands", "commands", "command list"] },
    { key: "faq", name: "❓・faq", aliases: ["faq", "frequently asked questions"] }
  ] },
  { key: "guides", name: "🗺️ GUIDES & ROADMAP", aliases: ["guides road map", "guides roadmap", "guides", "roadmap", "road map", "wiki"], perm: "readonly", channels: [
    { key: "hunterprogression", name: "⚔️・hunter-progression", aliases: ["hunter progression"] },
    { key: "hunterranks", name: "🩸・hunter-ranks", aliases: ["hunter ranks"] },
    { key: "classes", name: "🧙・classes", aliases: ["classes"] },
    { key: "races", name: "🧬・races", aliases: ["races"] },
    { key: "skills", name: "✨・skills", aliases: ["skills"] },
    { key: "equipment", name: "⚔️・equipment", aliases: ["equipment", "gear"] },
    { key: "quests", name: "📜・quests", aliases: ["quests"] },
    { key: "gates", name: "🚪・gates", aliases: ["gates"] },
    { key: "bosses", name: "👿・bosses", aliases: ["bosses"] },
    { key: "events", name: "🎯・events", aliases: ["events"] },
    { key: "dungeons", name: "🏰・dungeons", aliases: ["dungeons"] }
  ] },
  { key: "community", name: "💬 COMMUNITY", aliases: ["the community", "community", "chat", "social"], perm: "community", channels: [
    { key: "general", name: "💬・general", aliases: ["general", "general chat", "chat", "main chat"], optional: true },
    { key: "media", name: "📷・media", aliases: ["media", "screenshots", "clips", "showcase"], optional: true },
    { key: "suggestions", name: "💡・suggestions", aliases: ["suggestions", "suggestion", "ideas"], bot: "suggestions" },
    { key: "lfg", name: "🤝・looking-for-party", aliases: ["looking for party", "looking for group", "looking for guild", "lfg", "party finder"], optional: true },
    { key: "trading", name: "🪙・trading", aliases: ["trading", "trade", "market", "marketplace"], optional: true },
    { key: "botcmds", name: "🤖・bot-commands", aliases: ["bot commands", "commands bot", "bots", "bot spam"], optional: true },
    { key: "levelups", name: "🏆・level-ups", aliases: ["level ups", "levelups", "level up"], bot: "levelups", perm: "readonly", optional: true }
  ] },
  { key: "support", name: "🎫 SUPPORT", aliases: ["support", "help", "tickets support"], perm: "readonly", channels: [
    { key: "tickets", name: "🎫・open-a-ticket", aliases: ["open a ticket", "create ticket", "create a ticket", "tickets", "ticket", "support", "get help"] }
  ] },
  { key: "voice", name: "🔊 VOICE", aliases: ["voice", "voice channels", "vc"], perm: "voice", channels: [
    { key: "vcgeneral", name: "🔊 General", aliases: ["general", "general vc", "general voice", "lounge"], voice: true, optional: true },
    { key: "vcgaming", name: "🎮 Gaming", aliases: ["gaming", "gaming vc", "minecraft"], voice: true, optional: true }
  ] },
  { key: "staff", name: "🛡️ STAFF", aliases: ["staff", "staff only", "staff area", "staff logs", "admin", "management", "team"], perm: "staff", channels: [
    { key: "staffchat", name: "🛡️・staff-chat", aliases: ["staff chat", "staff", "staff general", "staff talk"] },
    { key: "staffannouncements", name: "📣・staff-announcements", aliases: ["staff announcements", "staff news"] },
    { key: "devchat", name: "🛠️・dev-chat", aliases: ["dev chat", "dev", "developers", "development", "dev team"], perm: "team", team: ["developer"] },
    { key: "buildteam", name: "🧱・build-team", aliases: ["build team", "builders", "builds", "build chat"], perm: "team", team: ["builder"] },
    { key: "ingamestaff", name: "⛏️・in-game-staff", aliases: ["in game staff", "ingame staff", "in game admins", "game staff"], perm: "team", team: ["ingame", "moderator"] },
    { key: "modlogs", name: "📕・mod-logs", aliases: ["mod logs", "modlogs", "moderation logs"], bot: "modlogs", perm: "botlog" },
    { key: "botlogs", name: "📘・bot-logs", aliases: ["bot logs", "botlogs", "logs", "message logs"], bot: "logs", perm: "botlog" },
    { key: "ticketlogs", name: "📗・ticket-logs", aliases: ["ticket logs", "ticketlogs", "transcripts"], bot: "ticketlogs", perm: "botlog" }
  ] }
];

// Words in a channel name that mean it should be staff-only, even if it isn't in the layout.
export const PRIVATE_WORDS = ["staff", "admin", "admins", "moderator", "moderators", "modchat", "modlogs", "log", "logs", "dev", "devs", "developer", "developers", "builder", "builders", "internal", "private", "management", "owner", "owners", "transcripts", "applications"];

// Permission bits used by the templates.
export const PERM = {
  view: [P.ViewChannel, P.ReadMessageHistory],
  chat: [P.SendMessages, P.SendMessagesInThreads, P.CreatePublicThreads, P.AddReactions, P.AttachFiles, P.EmbedLinks, P.UseExternalEmojis],
  noPost: [P.SendMessages, P.SendMessagesInThreads, P.CreatePublicThreads, P.CreatePrivateThreads],
  voice: [P.Connect, P.Speak, P.Stream, P.UseVAD],
  bot: [P.ViewChannel, P.ReadMessageHistory, P.SendMessages, P.EmbedLinks, P.AttachFiles, P.ManageMessages, P.ManageChannels, P.Connect]
};

// "📜・rules" -> "rules", "GUIDES/ROAD MAP" -> "guides road map"
export const norm = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
