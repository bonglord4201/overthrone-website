// /mc — control the Minecraft server from Discord through RCON (admins only).
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { rcon } from "../rcon.js";
import { embed, ok, fail, EPHEMERAL, MC_NAME, sendTo } from "../util.js";

const block = (s) => "```\n" + (s || "(no reply)").slice(0, 3900) + "\n```";

async function run(i, command, title) {
  await i.deferReply({ flags: EPHEMERAL });
  try {
    const out = await rcon(command);
    await i.editReply({ embeds: [embed(title, `\`/${command}\`` + "\n" + block(out))] });
    sendTo(i.guild, "logs", { embeds: [embed("🖥️ Console command from Discord", `**By:** ${i.user}\n\`/${command.slice(0, 1000)}\``)] });
  } catch (e) {
    await i.editReply({ embeds: [fail(e.message)] });
  }
}

export const commands = [
  {
    data: new SlashCommandBuilder().setName("mc").setDescription("Control the Minecraft server (admin)")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((s) => s.setName("command").setDescription("Run any console command")
        .addStringOption((o) => o.setName("command").setDescription("Without the /  e.g. time set day").setRequired(true)))
      .addSubcommand((s) => s.setName("say").setDescription("Broadcast a message in-game")
        .addStringOption((o) => o.setName("message").setDescription("Message").setRequired(true).setMaxLength(256)))
      .addSubcommand((s) => s.setName("whitelist").setDescription("Add or remove a player from the whitelist")
        .addStringOption((o) => o.setName("action").setDescription("Add or remove").setRequired(true).addChoices({ name: "add", value: "add" }, { name: "remove", value: "remove" }))
        .addStringOption((o) => o.setName("player").setDescription("Minecraft name").setRequired(true)))
      .addSubcommand((s) => s.setName("list").setDescription("Online players (from the console)")),
    async execute(i) {
      const sub = i.options.getSubcommand();
      if (sub === "command") return run(i, i.options.getString("command").replace(/^\//, ""), "Console");
      if (sub === "list") return run(i, "list", "Online players");
      if (sub === "say") {
        const msg = i.options.getString("message");
        const json = JSON.stringify(["", { text: "[Discord] ", color: "blue", bold: true }, { text: i.user.username + ": ", color: "gray" }, { text: msg, color: "white" }]);
        return run(i, "tellraw @a " + json, "Broadcast sent");
      }
      const player = i.options.getString("player").trim();
      if (!MC_NAME.test(player)) return i.reply({ flags: EPHEMERAL, embeds: [fail("That isn't a valid Minecraft username.")] });
      return run(i, `whitelist ${i.options.getString("action")} ${player}`, "Whitelist");
    }
  }
];

