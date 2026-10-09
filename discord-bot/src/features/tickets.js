// Ticket system: a panel with one button per ticket type -> private channel for the player + staff.
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChannelType, Events, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { db, save } from "../store.js";
import { config, embed, ok, fail, EPHEMERAL, isStaff, sendTo, ts } from "../util.js";

const typeOf = (id) => config.tickets.find((t) => t.id === id);

function panelRows() {
  const rows = [];
  config.tickets.forEach((t, n) => {
    if (n % 5 === 0) rows.push(new ActionRowBuilder());
    rows.at(-1).addComponents(new ButtonBuilder().setCustomId("ticket:open:" + t.id).setLabel(t.label).setEmoji(t.emoji).setStyle(ButtonStyle.Secondary));
  });
  return rows;
}

async function transcript(channel) {
  const all = [];
  let before;
  while (all.length < 2000) {
    const batch = await channel.messages.fetch({ limit: 100, before }).catch(() => null);
    if (!batch?.size) break;
    all.push(...batch.values());
    before = batch.last().id;
  }
  return all.reverse().map((m) => {
    const time = new Date(m.createdTimestamp).toISOString().replace("T", " ").slice(0, 19);
    const text = m.content || m.embeds.map((e) => [e.title, e.description].filter(Boolean).join(" — ")).join(" | ");
    const files = [...m.attachments.values()].map((a) => " [file] " + a.url).join("");
    return `[${time}] ${m.author.username}: ${text}${files}`;
  }).join("\n");
}

async function closeTicket(channel, closedBy, reason) {
  const t = db.tickets[channel.id];
  if (!t) return false;
  const text = await transcript(channel);
  const file = () => new AttachmentBuilder(Buffer.from(text || "(empty)", "utf8"), { name: `${channel.name}.txt` });
  const info = embed("🎫 Ticket closed", [
    `**Ticket:** #${t.number} (${typeOf(t.type)?.label ?? t.type})`,
    `**Opened by:** <@${t.owner}> ${ts(t.openedAt)}`,
    `**Closed by:** ${closedBy}`,
    `**Reason:** ${reason || "none"}`
  ].join("\n"));
  await sendTo(channel.guild, "ticketlogs", { embeds: [info], files: [file()] });
  const owner = await channel.client.users.fetch(t.owner).catch(() => null);
  await owner?.send({ embeds: [info], files: [file()] }).catch(() => {});
  delete db.tickets[channel.id];
  save();
  setTimeout(() => channel.delete("Ticket closed").catch(() => {}), 5000);
  return true;
}

export const commands = [
  {
    data: new SlashCommandBuilder().setName("ticket").setDescription("Ticket tools")
      .addSubcommand((s) => s.setName("panel").setDescription("Post the ticket panel in this channel (admin)"))
      .addSubcommand((s) => s.setName("close").setDescription("Close this ticket").addStringOption((o) => o.setName("reason").setDescription("Why")))
      .addSubcommand((s) => s.setName("add").setDescription("Add someone to this ticket").addUserOption((o) => o.setName("user").setDescription("Who").setRequired(true)))
      .addSubcommand((s) => s.setName("remove").setDescription("Remove someone from this ticket").addUserOption((o) => o.setName("user").setDescription("Who").setRequired(true))),
    async execute(i) {
      const sub = i.options.getSubcommand();
      if (sub === "panel") {
        if (!i.memberPermissions.has(PermissionFlagsBits.ManageGuild)) return i.reply({ flags: EPHEMERAL, embeds: [fail("Admins only.")] });
        const desc = config.tickets.map((t) => `${t.emoji} **${t.label}** — ${t.description}`).join("\n");
        await i.channel.send({ embeds: [embed("🎫 OVERTHRONE Support", `Need help? Pick a button below to open a **private** ticket with staff.\n\n${desc}\n\n*Abusing tickets will get you punished.*`).setThumbnail(config.logo)], components: panelRows() });
        return i.reply({ flags: EPHEMERAL, embeds: [ok("Ticket panel posted.")] });
      }
      const t = db.tickets[i.channelId];
      if (!t) return i.reply({ flags: EPHEMERAL, embeds: [fail("This isn't a ticket channel.")] });
      if (sub === "close") {
        if (t.owner !== i.user.id && !isStaff(i.member)) return i.reply({ flags: EPHEMERAL, embeds: [fail("Only staff or the ticket owner can close it.")] });
        await i.reply({ embeds: [embed(null, "🔒 Closing this ticket in 5 seconds…")] });
        return closeTicket(i.channel, i.user, i.options.getString("reason"));
      }
      if (!isStaff(i.member)) return i.reply({ flags: EPHEMERAL, embeds: [fail("Staff only.")] });
      const user = i.options.getUser("user");
      if (sub === "add") {
        await i.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, AttachFiles: true, ReadMessageHistory: true });
        return i.reply({ embeds: [ok(`${user} was added to the ticket.`)] });
      }
      await i.channel.permissionOverwrites.delete(user.id);
      return i.reply({ embeds: [ok(`${user} was removed from the ticket.`)] });
    }
  }
];

export const buttons = {
  async "ticket:open"(i, typeId) {
    const type = typeOf(typeId);
    if (!type) return i.reply({ flags: EPHEMERAL, embeds: [fail("That ticket type no longer exists.")] });
    const existing = Object.entries(db.tickets).find(([cid, t]) => t.owner === i.user.id && i.guild.channels.cache.has(cid));
    if (existing) return i.reply({ flags: EPHEMERAL, embeds: [fail(`You already have an open ticket: <#${existing[0]}>`)] });
    const category = i.guild.channels.cache.get(db.settings.channels.tickets);
    if (!category) return i.reply({ flags: EPHEMERAL, embeds: [fail("Tickets aren't set up yet. An admin needs to run `/setup`.")] });

    await i.deferReply({ flags: EPHEMERAL });
    const number = ++db.ticketCounter;
    const staffRole = db.settings.roles.staff;
    const allow = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.EmbedLinks];
    const channel = await i.guild.channels.create({
      name: `${type.id}-${String(number).padStart(4, "0")}-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 90),
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `${type.label} ticket for ${i.user.username} (${i.user.id})`,
      permissionOverwrites: [
        { id: i.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: i.user.id, allow },
        ...(staffRole ? [{ id: staffRole, allow }] : []),
        { id: i.guild.members.me.id, allow: [...allow, PermissionFlagsBits.ManageChannels] }
      ]
    });
    db.tickets[channel.id] = { owner: i.user.id, type: type.id, number, openedAt: Date.now() };
    save();

    const link = db.links[i.user.id];
    await channel.send({
      content: `${i.user}${staffRole ? ` <@&${staffRole}>` : ""}`,
      embeds: [embed(`${type.emoji} ${type.label} — Ticket #${number}`, [
        `Thanks ${i.user}, staff will be with you soon.`,
        link ? `**Linked Minecraft:** ${link.name}` : null,
        "",
        "**Please answer:**",
        ...type.questions.map((q, n) => `${n + 1}. ${q}`)
      ].filter((l) => l !== null).join("\n"))],
      components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket:close").setLabel("Close Ticket").setEmoji("🔒").setStyle(ButtonStyle.Danger))],
      allowedMentions: { users: [i.user.id], roles: staffRole ? [staffRole] : [] }
    });
    await i.editReply({ embeds: [ok(`Your ticket is open: ${channel}`)] });
  },

  async "ticket:close"(i) {
    const t = db.tickets[i.channelId];
    if (!t) return i.reply({ flags: EPHEMERAL, embeds: [fail("This ticket is already closed.")] });
    if (t.owner !== i.user.id && !isStaff(i.member)) return i.reply({ flags: EPHEMERAL, embeds: [fail("Only staff or the ticket owner can close it.")] });
    await i.reply({ embeds: [embed(null, "🔒 Closing this ticket in 5 seconds…")] });
    await closeTicket(i.channel, i.user, null);
  }
};

export function register(client) {
  client.on(Events.ChannelDelete, (ch) => {
    if (db.tickets[ch.id]) { delete db.tickets[ch.id]; save(); }
  });
}
