// Minecraft <-> Discord account linking.
// /link <name> sends a 6-digit code to that player IN-GAME (via RCON), /verify <code> proves they own it.
import crypto from "node:crypto";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { db, save } from "../store.js";
import { rcon, rconConfigured } from "../rcon.js";
import { config, embed, ok, fail, EPHEMERAL, MC_NAME, head, isStaff, sendTo, ts } from "../util.js";

const CODE_TTL = 10 * 60 * 1000;
const lastRequest = new Map();

export const findLinkByName = (name) =>
  Object.entries(db.links).find(([, l]) => l.name.toLowerCase() === name.toLowerCase());

async function mojangUuid(name) {
  try {
    const r = await fetch("https://api.mojang.com/users/profiles/minecraft/" + encodeURIComponent(name), { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const j = await r.json();
    return { uuid: j.id, name: j.name };
  } catch {
    return null;
  }
}

const tellraw = (name, parts) => rcon(`tellraw ${name} ${JSON.stringify(["", ...parts])}`);

async function applyLinkedRole(member, name) {
  const roleId = db.settings.roles.linked;
  if (roleId) await member.roles.add(roleId).catch(() => {});
  if (config.linking.setNickname && member.manageable) await member.setNickname(name).catch(() => {});
}

// Shared by /link and the "Link my account" button.
async function startLink(i, rawName) {
      const name = String(rawName ?? "").trim();
      if (!MC_NAME.test(name)) return i.reply({ flags: EPHEMERAL, embeds: [fail("That isn't a valid Minecraft username.")] });
      if (db.links[i.user.id]) return i.reply({ flags: EPHEMERAL, embeds: [fail(`You're already linked to **${db.links[i.user.id].name}**. Use \`/unlink\` first.`)] });
      const taken = findLinkByName(name);
      if (taken) return i.reply({ flags: EPHEMERAL, embeds: [fail(`**${name}** is already linked to another Discord account. Open a ticket if that's wrong.`)] });
      if (!rconConfigured()) return i.reply({ flags: EPHEMERAL, embeds: [fail("Linking isn't set up yet. Tell a staff member (RCON missing).")] });
      const wait = (lastRequest.get(i.user.id) ?? 0) + 30_000 - Date.now();
      if (wait > 0) return i.reply({ flags: EPHEMERAL, embeds: [fail(`Slow down, try again in ${Math.ceil(wait / 1000)}s.`)] });
      lastRequest.set(i.user.id, Date.now());

      await i.deferReply({ flags: EPHEMERAL });
      const code = String(crypto.randomInt(100000, 1000000));
      let reply;
      try {
        reply = await tellraw(name, [
          { text: "[OVERTHRONE] ", color: "dark_red", bold: true },
          { text: "Discord link code: ", color: "gray" },
          { text: code, color: "gold", bold: true, clickEvent: { action: "copy_to_clipboard", value: code } },
          { text: `\nRequested by ${i.user.username}. Click "Enter code" in Discord (or type /verify ${code}). Not you? Ignore this.`, color: "dark_gray" }
        ]);
      } catch (e) {
        return i.editReply({ embeds: [fail("Couldn't reach the Minecraft server: " + e.message)] });
      }
      if (/no player was found|not found|unknown/i.test(reply)) {
        return i.editReply({ embeds: [fail(`**${name}** isn't online. Join the server (\`${config.server.address}\`) and run \`/link\` again.`)] });
      }
      db.pendingLinks[i.user.id] = { name, code, expires: Date.now() + CODE_TTL };
      save();
      await i.editReply({
        embeds: [embed("Check your Minecraft chat 📬",
          `We sent a **6-digit code** to **${name}** in-game.\nClick **Enter code** below (or run \`/verify\`) within 10 minutes.`).setThumbnail(head(name))],
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("link:code").setLabel("Enter code").setEmoji("🔑").setStyle(ButtonStyle.Success))]
      });
    }

// Shared by /verify and the "Enter code" button.
async function finishVerify(i, rawCode) {
      const p = db.pendingLinks[i.user.id];
      const code = String(rawCode ?? "").trim();
      if (!p || p.expires < Date.now()) {
        delete db.pendingLinks[i.user.id];
        save();
        return i.reply({ flags: EPHEMERAL, embeds: [fail("No active code. Click **Link my account** (or run `/link`) first.")] });
      }
      if (p.code !== code) return i.reply({ flags: EPHEMERAL, embeds: [fail("Wrong code. Check your Minecraft chat.")] });
      if (findLinkByName(p.name)) return i.reply({ flags: EPHEMERAL, embeds: [fail("That account was just linked by someone else.")] });

      await i.deferReply({ flags: EPHEMERAL });
      const profile = await mojangUuid(p.name);
      const name = profile?.name ?? p.name;
      db.links[i.user.id] = { name, uuid: profile?.uuid ?? null, linkedAt: Date.now() };
      delete db.pendingLinks[i.user.id];
      save();

      await applyLinkedRole(i.member, name);
      for (const cmd of config.linking.rewardCommands ?? []) await rcon(cmd.replaceAll("{player}", name)).catch(() => {});
      await tellraw(name, [{ text: "[OVERTHRONE] ", color: "dark_red", bold: true }, { text: `Linked to Discord: ${i.user.username}`, color: "green" }]).catch(() => {});

      await i.editReply({ embeds: [ok(`Linked! Your Discord is now connected to **${name}**.`).setThumbnail(head(name))] });
      sendTo(i.guild, "logs", { embeds: [embed("🔗 Account linked", `${i.user} ↔ **${name}**`).setThumbnail(head(name))] });
    }

const modal = (id, title, field, label, placeholder, min, max) => new ModalBuilder().setCustomId(id).setTitle(title).addComponents(
  new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(field).setLabel(label).setPlaceholder(placeholder)
    .setStyle(TextInputStyle.Short).setMinLength(min).setMaxLength(max).setRequired(true)));

// The link panel's buttons open small forms, so players never have to type a command.
export const buttons = {
  async "link:start"(i) {
    if (db.links[i.user.id]) return i.reply({ flags: EPHEMERAL, embeds: [ok(`You're already linked to **${db.links[i.user.id].name}**.`)] });
    return i.showModal(modal("link:name", "Link your Minecraft account", "name", "Your exact Minecraft username", "Be online on the server first", 3, 16));
  },
  async "link:code"(i) {
    return i.showModal(modal("link:verify", "Enter your link code", "code", "6-digit code from Minecraft chat", "123456", 6, 6));
  }
};

export const modals = {
  async "link:name"(i) { return startLink(i, i.fields.getTextInputValue("name")); },
  async "link:verify"(i) { return finishVerify(i, i.fields.getTextInputValue("code")); }
};

export const commands = [
  {
    data: new SlashCommandBuilder().setName("link").setDescription("Link your Minecraft account to Discord")
      .addStringOption((o) => o.setName("minecraft_name").setDescription("Your exact Minecraft username").setRequired(true)),
    async execute(i) { return startLink(i, i.options.getString("minecraft_name")); }
  },
  {
    data: new SlashCommandBuilder().setName("verify").setDescription("Finish linking with the code from Minecraft")
      .addStringOption((o) => o.setName("code").setDescription("The 6-digit code you got in-game").setRequired(true)),
    async execute(i) { return finishVerify(i, i.options.getString("code")); }
  },
  {
    data: new SlashCommandBuilder().setName("unlink").setDescription("Unlink your Minecraft account")
      .addUserOption((o) => o.setName("user").setDescription("Staff only: unlink someone else")),
    async execute(i) {
      const target = i.options.getUser("user") ?? i.user;
      if (target.id !== i.user.id && !isStaff(i.member)) return i.reply({ flags: EPHEMERAL, embeds: [fail("Only staff can unlink other people.")] });
      const link = db.links[target.id];
      if (!link) return i.reply({ flags: EPHEMERAL, embeds: [fail(`${target.id === i.user.id ? "You aren't" : "They aren't"} linked.`)] });
      delete db.links[target.id];
      save();
      const member = await i.guild.members.fetch(target.id).catch(() => null);
      if (member && db.settings.roles.linked) await member.roles.remove(db.settings.roles.linked).catch(() => {});
      await i.reply({ flags: EPHEMERAL, embeds: [ok(`Unlinked **${link.name}** from ${target}.`)] });
      sendTo(i.guild, "logs", { embeds: [embed("⛓️ Account unlinked", `${target} ✕ **${link.name}** (by ${i.user})`)] });
    }
  },
  {
    data: new SlashCommandBuilder().setName("whois").setDescription("See whose Minecraft and Discord accounts are linked")
      .addUserOption((o) => o.setName("user").setDescription("A Discord member"))
      .addStringOption((o) => o.setName("minecraft_name").setDescription("A Minecraft username")),
    async execute(i) {
      const user = i.options.getUser("user");
      const name = i.options.getString("minecraft_name");
      let id, link;
      if (name) [id, link] = findLinkByName(name) ?? [];
      else { id = (user ?? i.user).id; link = db.links[id]; }
      if (!link) return i.reply({ flags: EPHEMERAL, embeds: [fail("No linked account found.")] });
      await i.reply({ embeds: [embed("Linked account")
        .setThumbnail(head(link.name))
        .addFields(
          { name: "Discord", value: `<@${id}>`, inline: true },
          { name: "Minecraft", value: `**${link.name}**`, inline: true },
          { name: "Linked", value: ts(link.linkedAt, "D"), inline: true }
        )] });
    }
  }
];

// Give the Linked role back if a linked member leaves and rejoins.
export function onMemberJoin(member) {
  const link = db.links[member.id];
  if (link) applyLinkedRole(member, link.name);
}
