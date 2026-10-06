import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from "discord.js";
import { config, embed, EPHEMERAL } from "../util.js";
import { getStatus } from "../mcstatus.js";
import { rcon, rconConfigured } from "../rcon.js";

export const linkButtons = () =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Website").setURL(config.links.website),
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Store").setURL(config.links.store),
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Vote").setURL(config.links.vote),
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Rules").setURL(config.links.rules)
  );

export async function statusEmbed(force = false) {
  const s = await getStatus(config, force);
  const e = embed(`${config.brand} — Server Status`)
    .setThumbnail(config.logo)
    .addFields(
      { name: "Status", value: s.online ? "🟢 **Online**" : "🔴 **Offline**", inline: true },
      { name: "Players", value: s.online ? `**${s.players}** / ${s.max}` : "—", inline: true },
      { name: "Version", value: config.server.version, inline: true },
      { name: "Server IP", value: "```" + config.server.address + "```" }
    );
  if (s.online && s.sample.length) e.addFields({ name: "Online now", value: s.sample.slice(0, 20).map((n) => "`" + n + "`").join(" ") });
  if (s.online && s.motd) e.setDescription(s.motd);
  e.setColor(s.online ? 0x2ecc71 : 0xe74c3c);
  return e;
}

const simple = (name, description, build) => ({
  data: new SlashCommandBuilder().setName(name).setDescription(description),
  execute: (i) => i.reply({ embeds: [build()], components: [linkButtons()] })
});

export const commands = [
  simple("ip", "Get the server IP", () =>
    embed("Join OVERTHRONE SMP", `**IP:** \`${config.server.address}\`\n**Version:** ${config.server.version}\n\nInstall the OVERTHRONE modpack first. The download is pinned in our Discord.`).setThumbnail(config.logo)),
  simple("store", "Visit the server store", () =>
    embed("OVERTHRONE Store", `Ranks, Throne Shards and more:\n${config.links.store}\n\nEvery purchase helps keep the server running.`)),
  simple("vote", "Vote for the server and get rewards", () =>
    embed("Vote for OVERTHRONE", `Vote every day on every site:\n${config.links.vote}\n\nEach vote gives you **1x Vote Key** and **$50,000** in-game.`)),
  simple("rules", "Read the server rules", () =>
    embed("Server Rules", `Read the full rules here:\n${config.links.rules}\n\nNot knowing the rules is not an excuse.`)),
  simple("website", "Get the website link", () => embed("OVERTHRONE Website", config.links.website)),
  {
    data: new SlashCommandBuilder().setName("status").setDescription("Live Minecraft server status"),
    async execute(i) {
      await i.deferReply();
      await i.editReply({ embeds: [await statusEmbed(true)], components: [linkButtons()] });
    }
  },
  {
    data: new SlashCommandBuilder().setName("players").setDescription("See who is online on the Minecraft server"),
    async execute(i) {
      await i.deferReply();
      let names = null;
      if (rconConfigured()) {
        try {
          const out = await rcon("list");
          const after = out.split(":").slice(1).join(":").trim();
          names = after ? after.split(",").map((s) => s.trim()).filter(Boolean) : [];
        } catch { /* fall back to ping */ }
      }
      const s = await getStatus(config, true);
      if (!s.online) return i.editReply({ embeds: [embed("Players Online", "🔴 The server is offline right now.")] });
      names ??= s.sample;
      const list = names.length ? names.map((n) => "`" + n + "`").join(" ").slice(0, 4000) : "Nobody is online right now.";
      await i.editReply({ embeds: [embed(`Players Online — ${s.players}/${s.max}`, list)] });
    }
  },
  {
    data: new SlashCommandBuilder().setName("help").setDescription("Everything this bot can do"),
    execute: (i) => i.reply({
      flags: EPHEMERAL,
      embeds: [embed(`${config.brand} Bot`, [
        "**Server** — `/ip` `/status` `/players` `/store` `/vote` `/rules` `/website`",
        "**Account** — `/link` `/verify` `/unlink` `/whois`",
        "**Community** — `/rank` `/leaderboard` `/suggest`",
        "**Support** — open a ticket from the ticket panel",
        "",
        "**Staff** — `/warn` `/warnings` `/clearwarnings` `/timeout` `/kick` `/ban` `/unban` `/purge` `/ticket` `/suggestion` `/giveaway`",
        "**Admin** — `/setup` `/settings` `/announce` `/rolepanel` `/mc`"
      ].join("\n"))]
    })
  }
];
