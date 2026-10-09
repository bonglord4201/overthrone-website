// /setup builds every channel and role the bot needs (reusing ones that already exist).
// /settings lets you point the bot at your own channels/roles instead.
import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { db, save } from "../store.js";
import { embed, ok, EPHEMERAL } from "../util.js";
import { updateCounters, updateStatusMessage } from "./events.js";

const CHANNEL_KEYS = {
  welcome: "Welcome messages",
  status: "Live server status",
  suggestions: "Suggestions",
  levelups: "Level-up messages",
  logs: "Bot / message logs (staff)",
  modlogs: "Moderation logs (staff)",
  ticketlogs: "Ticket transcripts (staff)",
  tickets: "Ticket category"
};
const ROLE_KEYS = { staff: "Staff (can use staff commands)", linked: "Given when someone links Minecraft", autorole: "Given to every new member" };

async function ensureRole(guild, key, name, color) {
  let role = guild.roles.cache.get(db.settings.roles[key]) ?? guild.roles.cache.find((r) => r.name === name);
  if (!role) role = await guild.roles.create({ name, color, reason: "OVERTHRONE bot setup" });
  db.settings.roles[key] = role.id;
  return role;
}

async function ensureChannel(guild, key, name, opts) {
  let ch = guild.channels.cache.get(db.settings.channels[key]) ?? guild.channels.cache.find((c) => c.name === name && c.type === opts.type);
  if (!ch) ch = await guild.channels.create({ name, reason: "OVERTHRONE bot setup", ...opts });
  db.settings.channels[key] = ch.id;
  return ch;
}

export const commands = [
  {
    data: new SlashCommandBuilder().setName("setup").setDescription("Create all the channels and roles the bot uses")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(i) {
      await i.deferReply({ flags: EPHEMERAL });
      const g = i.guild;
      const me = g.members.me;
      const staff = await ensureRole(g, "staff", "Staff", 0xc1121f);
      await ensureRole(g, "linked", "Linked", 0x2ecc71);

      const everyone = g.roles.everyone.id;
      const staffOnly = [
        { id: everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: staff.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
        { id: me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles] }
      ];
      const readOnly = [
        { id: everyone, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel] },
        { id: me.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }
      ];

      const info = await ensureChannel(g, "_infoCategory", "👑 OVERTHRONE", { type: ChannelType.GuildCategory });
      const staffCat = await ensureChannel(g, "_staffCategory", "🔒 STAFF LOGS", { type: ChannelType.GuildCategory, permissionOverwrites: staffOnly });
      const stats = await ensureChannel(g, "_statsCategory", "📊 SERVER STATS", { type: ChannelType.GuildCategory });
      const noJoin = [{ id: everyone, deny: [PermissionFlagsBits.Connect] }, { id: me.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels] }];

      await ensureChannel(g, "welcome", "welcome", { type: ChannelType.GuildText, parent: info.id, permissionOverwrites: readOnly });
      await ensureChannel(g, "status", "server-status", { type: ChannelType.GuildText, parent: info.id, permissionOverwrites: readOnly });
      await ensureChannel(g, "suggestions", "suggestions", { type: ChannelType.GuildText, parent: info.id });
      await ensureChannel(g, "levelups", "level-ups", { type: ChannelType.GuildText, parent: info.id, permissionOverwrites: readOnly });
      await ensureChannel(g, "logs", "bot-logs", { type: ChannelType.GuildText, parent: staffCat.id, permissionOverwrites: staffOnly });
      await ensureChannel(g, "modlogs", "mod-logs", { type: ChannelType.GuildText, parent: staffCat.id, permissionOverwrites: staffOnly });
      await ensureChannel(g, "ticketlogs", "ticket-logs", { type: ChannelType.GuildText, parent: staffCat.id, permissionOverwrites: staffOnly });
      await ensureChannel(g, "tickets", "🎫 TICKETS", { type: ChannelType.GuildCategory, permissionOverwrites: staffOnly });
      await ensureChannel(g, "membersCounter", "👥 Members: …", { type: ChannelType.GuildVoice, parent: stats.id, permissionOverwrites: noJoin });
      await ensureChannel(g, "playersCounter", "🎮 Players: …", { type: ChannelType.GuildVoice, parent: stats.id, permissionOverwrites: noJoin });
      save();

      updateStatusMessage(i.client).catch(() => {});
      updateCounters(i.client, true).catch(() => {});

      await i.editReply({ embeds: [ok("Setup complete!").setDescription([
        "✅ **Setup complete!** Created or reused:",
        `• Roles: <@&${db.settings.roles.staff}> <@&${db.settings.roles.linked}>`,
        `• Channels: <#${db.settings.channels.welcome}> <#${db.settings.channels.status}> <#${db.settings.channels.suggestions}> <#${db.settings.channels.levelups}>`,
        `• Staff logs: <#${db.settings.channels.logs}> <#${db.settings.channels.modlogs}> <#${db.settings.channels.ticketlogs}>`,
        "",
        "**Next:**",
        "1. Give your staff the **Staff** role.",
        "2. Run `/ticket panel` in your support channel.",
        "3. Optional: `/settings role autorole` to give new members a role.",
        "4. Rename or move any channel you like — the bot remembers it by ID."
      ].join("\n"))] });
    }
  },
  {
    data: new SlashCommandBuilder().setName("settings").setDescription("Choose which channels and roles the bot uses")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((s) => s.setName("channel").setDescription("Set a channel")
        .addStringOption((o) => o.setName("type").setDescription("What it's for").setRequired(true)
          .addChoices(...Object.entries(CHANNEL_KEYS).map(([value, name]) => ({ name, value }))))
        .addChannelOption((o) => o.setName("channel").setDescription("The channel (a category for tickets)").setRequired(true)))
      .addSubcommand((s) => s.setName("role").setDescription("Set a role")
        .addStringOption((o) => o.setName("type").setDescription("What it's for").setRequired(true)
          .addChoices(...Object.entries(ROLE_KEYS).map(([value, name]) => ({ name, value }))))
        .addRoleOption((o) => o.setName("role").setDescription("The role").setRequired(true)))
      .addSubcommand((s) => s.setName("view").setDescription("Show the current settings")),
    async execute(i) {
      const sub = i.options.getSubcommand();
      if (sub === "channel") {
        const type = i.options.getString("type");
        const ch = i.options.getChannel("channel");
        if (type === "tickets" ? ch.type !== ChannelType.GuildCategory : !ch.isTextBased())
          return i.reply({ flags: EPHEMERAL, embeds: [embed(null, type === "tickets" ? "❌ Pick a **category** for tickets." : "❌ Pick a **text** channel.")] });
        db.settings.channels[type] = ch.id;
        save();
        if (type === "status") { db.settings.statusMessageId = null; updateStatusMessage(i.client).catch(() => {}); }
        return i.reply({ flags: EPHEMERAL, embeds: [ok(`${CHANNEL_KEYS[type]} → ${ch}`)] });
      }
      if (sub === "role") {
        const type = i.options.getString("type");
        const role = i.options.getRole("role");
        db.settings.roles[type] = role.id;
        save();
        return i.reply({ flags: EPHEMERAL, embeds: [ok(`${ROLE_KEYS[type]} → ${role}`)] });
      }
      const c = db.settings.channels, r = db.settings.roles;
      const lines = [
        ...Object.entries(CHANNEL_KEYS).map(([k, n]) => `**${n}:** ${c[k] ? `<#${c[k]}>` : "not set"}`),
        "",
        ...Object.entries(ROLE_KEYS).map(([k, n]) => `**${n}:** ${r[k] ? `<@&${r[k]}>` : "not set"}`)
      ];
      return i.reply({ flags: EPHEMERAL, embeds: [embed("Bot settings", lines.join("\n"))] });
    }
  }
];
