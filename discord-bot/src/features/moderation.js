// Moderation commands, warnings and the invite-link filter. Everything is logged to the mod-logs channel.
import crypto from "node:crypto";
import { Events, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { db, save } from "../store.js";
import { config, embed, ok, fail, EPHEMERAL, isStaff, parseDuration, sendTo, ts } from "../util.js";

const P = PermissionFlagsBits;

function modlog(guild, action, target, by, reason, extra = "") {
  return sendTo(guild, "modlogs", { embeds: [embed(action, `**User:** ${target} (${target.id})\n**By:** ${by}\n**Reason:** ${reason}${extra}`)] });
}

async function dm(user, title, text) {
  await user.send({ embeds: [embed(title, text)] }).catch(() => {});
}

// Stops staff from punishing people above them (or the bot from trying and failing).
function canAct(i, member) {
  if (!member) return null;
  if (member.id === i.user.id) return "You can't do that to yourself.";
  if (member.id === i.guild.ownerId) return "You can't do that to the server owner.";
  if (i.member.id !== i.guild.ownerId && member.roles.highest.position >= i.member.roles.highest.position) return "They have the same or a higher role than you.";
  return null;
}

const reasonOpt = (o) => o.setName("reason").setDescription("Reason").setMaxLength(500);
const userOpt = (o) => o.setName("user").setDescription("Who").setRequired(true);

export const commands = [
  {
    data: new SlashCommandBuilder().setName("warn").setDescription("Warn a member")
      .setDefaultMemberPermissions(P.ModerateMembers).addUserOption(userOpt).addStringOption((o) => reasonOpt(o).setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user");
      const reason = i.options.getString("reason");
      const member = await i.guild.members.fetch(user.id).catch(() => null);
      const why = canAct(i, member);
      if (why) return i.reply({ flags: EPHEMERAL, embeds: [fail(why)] });
      const list = (db.warnings[user.id] ??= []);
      list.push({ id: crypto.randomBytes(3).toString("hex"), reason, by: i.user.id, at: Date.now() });
      save();
      await dm(user, `⚠️ You were warned in ${i.guild.name}`, `**Reason:** ${reason}\nYou now have **${list.length}** warning(s).`);
      await i.reply({ embeds: [ok(`${user} was warned. They have **${list.length}** warning(s).`)] });
      modlog(i.guild, "⚠️ Warn", user, i.user, reason, `\n**Total warnings:** ${list.length}`);
    }
  },
  {
    data: new SlashCommandBuilder().setName("warnings").setDescription("See a member's warnings")
      .setDefaultMemberPermissions(P.ModerateMembers).addUserOption(userOpt),
    async execute(i) {
      const user = i.options.getUser("user");
      const list = db.warnings[user.id] ?? [];
      const text = list.length ? list.map((w) => `\`${w.id}\` ${ts(w.at, "d")} by <@${w.by}> — ${w.reason}`).join("\n").slice(0, 4000) : "No warnings.";
      await i.reply({ flags: EPHEMERAL, embeds: [embed(`Warnings for ${user.username} (${list.length})`, text)] });
    }
  },
  {
    data: new SlashCommandBuilder().setName("clearwarnings").setDescription("Remove one or all warnings")
      .setDefaultMemberPermissions(P.ModerateMembers).addUserOption(userOpt)
      .addStringOption((o) => o.setName("id").setDescription("Warning ID to remove (leave empty to remove all)")),
    async execute(i) {
      const user = i.options.getUser("user");
      const id = i.options.getString("id");
      const list = db.warnings[user.id] ?? [];
      if (id) {
        const n = list.findIndex((w) => w.id === id);
        if (n < 0) return i.reply({ flags: EPHEMERAL, embeds: [fail("No warning with that ID.")] });
        list.splice(n, 1);
      } else delete db.warnings[user.id];
      save();
      await i.reply({ flags: EPHEMERAL, embeds: [ok(id ? `Removed warning \`${id}\`.` : `Cleared all warnings for ${user}.`)] });
      modlog(i.guild, "🧹 Warnings cleared", user, i.user, id ? `Removed ${id}` : "All warnings");
    }
  },
  {
    data: new SlashCommandBuilder().setName("timeout").setDescription("Timeout (mute) a member")
      .setDefaultMemberPermissions(P.ModerateMembers).addUserOption(userOpt)
      .addStringOption((o) => o.setName("duration").setDescription("e.g. 10m, 2h, 1d (max 28d). Use 0 to remove").setRequired(true))
      .addStringOption(reasonOpt),
    async execute(i) {
      const user = i.options.getUser("user");
      const reason = i.options.getString("reason") ?? "No reason given";
      const raw = i.options.getString("duration");
      const member = await i.guild.members.fetch(user.id).catch(() => null);
      const why = canAct(i, member) ?? (member ? null : "They aren't in the server.");
      if (why) return i.reply({ flags: EPHEMERAL, embeds: [fail(why)] });
      if (raw.trim() === "0") {
        await member.timeout(null, reason);
        await i.reply({ embeds: [ok(`Removed ${user}'s timeout.`)] });
        return modlog(i.guild, "🔊 Timeout removed", user, i.user, reason);
      }
      const ms = parseDuration(raw);
      if (!ms || ms > 28 * 864e5) return i.reply({ flags: EPHEMERAL, embeds: [fail("Use a duration like `10m`, `2h` or `3d` (max 28d).")] });
      await member.timeout(ms, reason);
      await dm(user, `🔇 You were timed out in ${i.guild.name}`, `**Duration:** ${raw}\n**Reason:** ${reason}`);
      await i.reply({ embeds: [ok(`${user} was timed out for **${raw}**.`)] });
      modlog(i.guild, "🔇 Timeout", user, i.user, reason, `\n**Duration:** ${raw} (ends ${ts(Date.now() + ms)})`);
    }
  },
  {
    data: new SlashCommandBuilder().setName("kick").setDescription("Kick a member")
      .setDefaultMemberPermissions(P.KickMembers).addUserOption(userOpt).addStringOption(reasonOpt),
    async execute(i) {
      const user = i.options.getUser("user");
      const reason = i.options.getString("reason") ?? "No reason given";
      const member = await i.guild.members.fetch(user.id).catch(() => null);
      const why = canAct(i, member) ?? (member?.kickable === false ? "I can't kick them (their role is above mine)." : member ? null : "They aren't in the server.");
      if (why) return i.reply({ flags: EPHEMERAL, embeds: [fail(why)] });
      await dm(user, `👢 You were kicked from ${i.guild.name}`, `**Reason:** ${reason}`);
      await member.kick(reason);
      await i.reply({ embeds: [ok(`${user.username} was kicked.`)] });
      modlog(i.guild, "👢 Kick", user, i.user, reason);
    }
  },
  {
    data: new SlashCommandBuilder().setName("ban").setDescription("Ban a member")
      .setDefaultMemberPermissions(P.BanMembers).addUserOption(userOpt).addStringOption(reasonOpt)
      .addIntegerOption((o) => o.setName("delete_days").setDescription("Delete their messages from the last X days (0-7)").setMinValue(0).setMaxValue(7)),
    async execute(i) {
      const user = i.options.getUser("user");
      const reason = i.options.getString("reason") ?? "No reason given";
      const member = await i.guild.members.fetch(user.id).catch(() => null);
      const why = member ? (canAct(i, member) ?? (member.bannable ? null : "I can't ban them (their role is above mine).")) : null;
      if (why) return i.reply({ flags: EPHEMERAL, embeds: [fail(why)] });
      await dm(user, `🔨 You were banned from ${i.guild.name}`, `**Reason:** ${reason}\nYou can appeal at ${config.links.website}`);
      await i.guild.members.ban(user.id, { reason, deleteMessageSeconds: (i.options.getInteger("delete_days") ?? 0) * 86400 });
      await i.reply({ embeds: [ok(`${user.username} was banned.`)] });
      modlog(i.guild, "🔨 Ban", user, i.user, reason);
    }
  },
  {
    data: new SlashCommandBuilder().setName("unban").setDescription("Unban a user")
      .setDefaultMemberPermissions(P.BanMembers)
      .addStringOption((o) => o.setName("user_id").setDescription("Their Discord user ID").setRequired(true)).addStringOption(reasonOpt),
    async execute(i) {
      const id = i.options.getString("user_id").trim();
      const reason = i.options.getString("reason") ?? "No reason given";
      const user = await i.guild.members.unban(id, reason).catch(() => null);
      if (!user) return i.reply({ flags: EPHEMERAL, embeds: [fail("That user isn't banned (or the ID is wrong).")] });
      await i.reply({ embeds: [ok(`${user.username} was unbanned.`)] });
      modlog(i.guild, "♻️ Unban", user, i.user, reason);
    }
  },
  {
    data: new SlashCommandBuilder().setName("purge").setDescription("Bulk-delete recent messages in this channel")
      .setDefaultMemberPermissions(P.ManageMessages)
      .addIntegerOption((o) => o.setName("amount").setDescription("How many (1-100)").setRequired(true).setMinValue(1).setMaxValue(100))
      .addUserOption((o) => o.setName("user").setDescription("Only delete this person's messages")),
    async execute(i) {
      const amount = i.options.getInteger("amount");
      const user = i.options.getUser("user");
      await i.deferReply({ flags: EPHEMERAL });
      let msgs = await i.channel.messages.fetch({ limit: 100 });
      if (user) msgs = msgs.filter((m) => m.author.id === user.id);
      const deleted = await i.channel.bulkDelete([...msgs.values()].slice(0, amount), true);
      await i.editReply({ embeds: [ok(`Deleted **${deleted.size}** message(s). (Messages older than 14 days can't be bulk-deleted.)`)] });
      sendTo(i.guild, "modlogs", { embeds: [embed("🧹 Purge", `**Channel:** ${i.channel}\n**By:** ${i.user}\n**Deleted:** ${deleted.size}${user ? `\n**From:** ${user}` : ""}`)] });
    }
  }
];

const INVITE = /(discord\.(gg|io|me|li)|discord(app)?\.com\/invite)\/[a-z0-9-]+/i;

export function register(client) {
  client.on(Events.MessageCreate, async (msg) => {
    if (!config.autoMod.blockInvites || !msg.guild || msg.author.bot) return;
    if (!INVITE.test(msg.content) || isStaff(msg.member)) return;
    // Allow links to our own Discord.
    const own = config.links.discord.split("/").pop().toLowerCase();
    if ((msg.content.toLowerCase().match(new RegExp(INVITE.source, "gi")) ?? []).every((l) => l.endsWith("/" + own))) return;
    await msg.delete().catch(() => {});
    const note = await msg.channel.send({ content: `${msg.author}, advertising other Discord servers isn't allowed here.` }).catch(() => null);
    setTimeout(() => note?.delete().catch(() => {}), 8000);
    sendTo(msg.guild, "modlogs", { embeds: [embed("🚫 Invite link removed", `**User:** ${msg.author}\n**Channel:** ${msg.channel}\n\n${msg.content.slice(0, 1500)}`)] });
  });
}
