// Welcome messages, logging, live status message, stat counters and the bot's "Playing" status.
import { ActivityType, AuditLogEvent, Events } from "discord.js";
import { db, save } from "../store.js";
import { config, embed, getChannel, sendTo, ts } from "../util.js";
import { getStatus } from "../mcstatus.js";
import { linkButtons, statusEmbed } from "./info.js";
import { onMemberJoin } from "./linking.js";

export async function updateStatusMessage(client) {
  for (const guild of client.guilds.cache.values()) {
    const ch = getChannel(guild, "status");
    if (!ch?.isTextBased()) continue;
    const payload = { embeds: [(await statusEmbed()).setFooter({ text: `${config.brand} • updates every minute`, iconURL: config.logo })], components: [linkButtons()] };
    const msg = db.settings.statusMessageId ? await ch.messages.fetch(db.settings.statusMessageId).catch(() => null) : null;
    if (msg) await msg.edit(payload).catch(() => {});
    else {
      const sent = await ch.send(payload).catch(() => null);
      if (sent) { db.settings.statusMessageId = sent.id; save(); }
    }
  }
}

let lastCounter = 0;
// Discord only allows renaming a channel twice per 10 minutes, so counters update every 10 minutes.
export async function updateCounters(client, force = false) {
  if (!force && Date.now() - lastCounter < 10 * 60 * 1000) return;
  lastCounter = Date.now();
  const s = await getStatus(config);
  for (const guild of client.guilds.cache.values()) {
    const m = getChannel(guild, "membersCounter");
    const p = getChannel(guild, "playersCounter");
    const mName = `👥 Members: ${guild.memberCount.toLocaleString("en-US")}`;
    const pName = s.online ? `🎮 Players: ${s.players}/${s.max}` : "🔴 Server: Offline";
    if (m && m.name !== mName) await m.setName(mName).catch(() => {});
    if (p && p.name !== pName) await p.setName(pName).catch(() => {});
  }
}

async function updatePresence(client) {
  const s = await getStatus(config);
  client.user.setPresence({
    status: s.online ? "online" : "dnd",
    activities: [{ type: ActivityType.Watching, name: s.online ? `${s.players} players • ${config.server.address}` : `${config.server.address} (offline)` }]
  });
}

export function register(client) {
  client.once(Events.ClientReady, () => {
    const tick = async () => {
      await updatePresence(client).catch(() => {});
      await updateStatusMessage(client).catch(() => {});
      await updateCounters(client).catch(() => {});
    };
    tick();
    setInterval(tick, 60_000);
  });

  client.on(Events.GuildMemberAdd, async (member) => {
    const auto = db.settings.roles.autorole;
    if (auto) await member.roles.add(auto).catch(() => {});
    onMemberJoin(member);
    await sendTo(member.guild, "welcome", {
      content: `${member}`,
      embeds: [embed(`Welcome to ${config.brand}!`, [
        `**${member.user.username}**, the throne awaits. You are member **#${member.guild.memberCount.toLocaleString("en-US")}**.`,
        "",
        `🎮 **IP:** \`${config.server.address}\` (${config.server.version})`,
        "🔗 Link your Minecraft account with `/link`",
        `📜 Read the rules: ${config.links.rules}`,
        `🗳️ Vote daily for rewards: ${config.links.vote}`
      ].join("\n")).setThumbnail(member.user.displayAvatarURL({ size: 256 })).setImage(config.banner)],
      components: [linkButtons()]
    });
    sendTo(member.guild, "logs", { embeds: [embed("📥 Member joined", `${member} (${member.user.username})\nAccount created ${ts(member.user.createdTimestamp)}`).setColor(0x2ecc71)] });
  });

  client.on(Events.GuildMemberRemove, (member) => {
    const link = db.links[member.id];
    sendTo(member.guild, "logs", { embeds: [embed("📤 Member left", `${member.user.username} (${member.id})${link ? `\nMinecraft: **${link.name}**` : ""}`).setColor(0xe67e22)] });
  });

  client.on(Events.MessageDelete, async (msg) => {
    if (!msg.guild || msg.author?.bot || msg.partial) return;
    if (msg.channel.id === db.settings.channels.logs) return;
    const files = [...msg.attachments.values()].map((a) => a.url).join("\n");
    sendTo(msg.guild, "logs", { embeds: [embed("🗑️ Message deleted", `**Author:** ${msg.author}\n**Channel:** ${msg.channel}\n\n${(msg.content || "*no text*").slice(0, 3500)}${files ? "\n\n" + files : ""}`).setColor(0xe74c3c)] });
  });

  client.on(Events.MessageUpdate, (before, after) => {
    if (!after.guild || after.author?.bot || before.partial || before.content === after.content) return;
    sendTo(after.guild, "logs", { embeds: [embed("✏️ Message edited", `**Author:** ${after.author}\n**Channel:** ${after.channel} — [jump](${after.url})`)
      .addFields({ name: "Before", value: (before.content || "*empty*").slice(0, 1000) }, { name: "After", value: (after.content || "*empty*").slice(0, 1000) })
      .setColor(0xf1c40f)] });
  });

  client.on(Events.GuildBanAdd, async (ban) => {
    // Bans made through /ban are already logged; this catches bans made by right-click.
    const log = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => null);
    const entry = log?.entries.first();
    if (entry?.executorId === ban.client.user.id) return;
    sendTo(ban.guild, "modlogs", { embeds: [embed("🔨 Member banned", `**User:** ${ban.user.username} (${ban.user.id})\n**By:** ${entry?.executor ?? "unknown"}\n**Reason:** ${ban.reason ?? "none"}`)] });
  });
}
