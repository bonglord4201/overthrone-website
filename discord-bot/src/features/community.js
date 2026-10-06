// Suggestions, self-role button panels and announcements.
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { db, save } from "../store.js";
import { embed, ok, fail, EPHEMERAL, getChannel } from "../util.js";

const STATUS = {
  pending: { label: "⏳ Pending", color: 0xf1c40f },
  approved: { label: "✅ Approved", color: 0x2ecc71 },
  denied: { label: "❌ Denied", color: 0xe74c3c },
  implemented: { label: "🚀 Implemented", color: 0x3498db }
};

function suggestionEmbed(n, s, user) {
  const e = embed(`Suggestion #${n}`, s.text)
    .setColor(STATUS[s.status].color)
    .addFields({ name: "Status", value: STATUS[s.status].label + (s.note ? `\n**Staff note:** ${s.note}` : "") });
  if (user) e.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });
  else if (s.authorName) e.setAuthor({ name: s.authorName });
  return e;
}

export const commands = [
  {
    data: new SlashCommandBuilder().setName("suggest").setDescription("Suggest something for the server")
      .addStringOption((o) => o.setName("idea").setDescription("Your suggestion").setRequired(true).setMaxLength(1500)),
    async execute(i) {
      const ch = getChannel(i.guild, "suggestions");
      if (!ch) return i.reply({ flags: EPHEMERAL, embeds: [fail("Suggestions aren't set up yet.")] });
      const n = ++db.suggestionCounter;
      const s = { author: i.user.id, authorName: i.user.username, text: i.options.getString("idea"), status: "pending", channelId: ch.id };
      const msg = await ch.send({ embeds: [suggestionEmbed(n, s, i.user)] });
      await msg.react("👍").catch(() => {});
      await msg.react("👎").catch(() => {});
      await msg.startThread({ name: `Suggestion #${n} discussion` }).catch(() => {});
      s.messageId = msg.id;
      db.suggestions[n] = s;
      save();
      await i.reply({ flags: EPHEMERAL, embeds: [ok(`Suggestion #${n} posted in ${ch}!`)] });
    }
  },
  {
    data: new SlashCommandBuilder().setName("suggestion").setDescription("Staff: respond to a suggestion")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption((o) => o.setName("number").setDescription("Suggestion number").setRequired(true))
      .addStringOption((o) => o.setName("status").setDescription("New status").setRequired(true)
        .addChoices({ name: "Approved", value: "approved" }, { name: "Denied", value: "denied" }, { name: "Implemented", value: "implemented" }, { name: "Pending", value: "pending" }))
      .addStringOption((o) => o.setName("note").setDescription("Optional note").setMaxLength(500)),
    async execute(i) {
      const n = i.options.getInteger("number");
      const s = db.suggestions[n];
      if (!s) return i.reply({ flags: EPHEMERAL, embeds: [fail("No suggestion with that number.")] });
      s.status = i.options.getString("status");
      s.note = i.options.getString("note") ?? s.note;
      save();
      const ch = await i.client.channels.fetch(s.channelId).catch(() => null);
      const msg = await ch?.messages.fetch(s.messageId).catch(() => null);
      const author = await i.client.users.fetch(s.author).catch(() => null);
      await msg?.edit({ embeds: [suggestionEmbed(n, s, author)] });
      await author?.send({ embeds: [embed(`Your suggestion #${n} was updated`, `${STATUS[s.status].label}${s.note ? `\n**Note:** ${s.note}` : ""}\n\n> ${s.text.slice(0, 500)}`)] }).catch(() => {});
      await i.reply({ flags: EPHEMERAL, embeds: [ok(`Suggestion #${n} → ${STATUS[s.status].label}`)] });
    }
  },
  {
    data: (() => {
      const b = new SlashCommandBuilder().setName("rolepanel").setDescription("Post buttons members click to get/remove roles")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addStringOption((o) => o.setName("title").setDescription("Panel title").setRequired(true))
        .addRoleOption((o) => o.setName("role1").setDescription("Role").setRequired(true));
      for (let n = 2; n <= 10; n++) b.addRoleOption((o) => o.setName("role" + n).setDescription("Role"));
      return b.addStringOption((o) => o.setName("description").setDescription("Text above the buttons"));
    })(),
    async execute(i) {
      const me = i.guild.members.me;
      const roles = [];
      for (let n = 1; n <= 10; n++) { const r = i.options.getRole("role" + n); if (r) roles.push(r); }
      const bad = roles.find((r) => r.managed || r.id === i.guild.id || r.position >= me.roles.highest.position);
      if (bad) return i.reply({ flags: EPHEMERAL, embeds: [fail(`I can't give out ${bad}. Move my bot role **above** it in Server Settings → Roles.`)] });
      const rows = [];
      roles.forEach((r, n) => {
        if (n % 5 === 0) rows.push(new ActionRowBuilder());
        rows.at(-1).addComponents(new ButtonBuilder().setCustomId("role:" + r.id).setLabel(r.name.slice(0, 80)).setStyle(ButtonStyle.Secondary));
      });
      await i.channel.send({ embeds: [embed(i.options.getString("title"), i.options.getString("description") ?? "Click a button to get or remove a role.")], components: rows });
      await i.reply({ flags: EPHEMERAL, embeds: [ok("Role panel posted.")] });
    }
  },
  {
    data: new SlashCommandBuilder().setName("announce").setDescription("Post a branded announcement")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption((o) => o.setName("channel").setDescription("Where").setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
      .addStringOption((o) => o.setName("title").setDescription("Title").setRequired(true).setMaxLength(256))
      .addStringOption((o) => o.setName("message").setDescription("Text. Write \\n for a new line").setRequired(true).setMaxLength(4000))
      .addStringOption((o) => o.setName("ping").setDescription("Who to ping").addChoices({ name: "@everyone", value: "everyone" }, { name: "@here", value: "here" }, { name: "Nobody", value: "none" }))
      .addAttachmentOption((o) => o.setName("image").setDescription("Optional image")),
    async execute(i) {
      const ch = i.options.getChannel("channel");
      const ping = i.options.getString("ping") ?? "none";
      const e = embed("📢 " + i.options.getString("title"), i.options.getString("message").replaceAll("\\n", "\n"));
      const img = i.options.getAttachment("image");
      if (img?.contentType?.startsWith("image/")) e.setImage(img.url);
      await ch.send({ content: ping === "none" ? undefined : "@" + ping, embeds: [e], allowedMentions: { parse: ping === "none" ? [] : ["everyone"] } });
      await i.reply({ flags: EPHEMERAL, embeds: [ok(`Announcement posted in ${ch}.`)] });
    }
  }
];

export const buttons = {
  async role(i, roleId) {
    const role = i.guild.roles.cache.get(roleId);
    if (!role) return i.reply({ flags: EPHEMERAL, embeds: [fail("That role no longer exists.")] });
    const has = i.member.roles.cache.has(roleId);
    const res = await (has ? i.member.roles.remove(roleId) : i.member.roles.add(roleId)).catch(() => null);
    if (!res) return i.reply({ flags: EPHEMERAL, embeds: [fail("I couldn't change that role. Ask staff to move my role higher.")] });
    await i.reply({ flags: EPHEMERAL, embeds: [ok(has ? `Removed ${role}.` : `You now have ${role}!`)] });
  }
};

