// Giveaways with an "Enter" button. Survives bot restarts (stored in data/db.json).
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { db, save } from "../store.js";
import { embed, ok, fail, EPHEMERAL, parseDuration, ts } from "../util.js";

function gEmbed(g) {
  return embed(`🎉 GIVEAWAY: ${g.prize}`, g.ended
    ? `**Ended** ${ts(g.endsAt)}\n**Winner(s):** ${g.winnerIds?.length ? g.winnerIds.map((id) => `<@${id}>`).join(", ") : "nobody entered"}\nHosted by <@${g.host}>`
    : `Click **Enter** to join!\n\n**Ends:** ${ts(g.endsAt)} (${ts(g.endsAt, "f")})\n**Winners:** ${g.winners}\n**Entries:** ${g.entrants.length}\nHosted by <@${g.host}>`)
    .setColor(g.ended ? 0x7f8c8d : 0xf1c40f);
}

const enterRow = (disabled = false) => new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("giveaway:enter").setLabel("Enter").setEmoji("🎉").setStyle(ButtonStyle.Success).setDisabled(disabled)
);

function pick(list, n) {
  const pool = [...list];
  const out = [];
  while (pool.length && out.length < n) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}

async function finish(client, messageId, reroll = false) {
  const g = db.giveaways[messageId];
  if (!g) return null;
  g.ended = true;
  g.winnerIds = pick(g.entrants, g.winners);
  save();
  const ch = await client.channels.fetch(g.channelId).catch(() => null);
  if (!ch) return g;
  const msg = await ch.messages.fetch(messageId).catch(() => null);
  await msg?.edit({ embeds: [gEmbed(g)], components: [enterRow(true)] }).catch(() => {});
  await ch.send(g.winnerIds.length
    ? `🎉 ${reroll ? "New winner" : "Congratulations"} ${g.winnerIds.map((id) => `<@${id}>`).join(", ")}! You won **${g.prize}**! Open a ticket to claim it.`
    : `Nobody entered the giveaway for **${g.prize}**.`).catch(() => {});
  return g;
}

export const commands = [
  {
    data: new SlashCommandBuilder().setName("giveaway").setDescription("Run giveaways")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand((s) => s.setName("start").setDescription("Start a giveaway in this channel")
        .addStringOption((o) => o.setName("prize").setDescription("What they win").setRequired(true))
        .addStringOption((o) => o.setName("duration").setDescription("e.g. 30m, 1d, 1w").setRequired(true))
        .addIntegerOption((o) => o.setName("winners").setDescription("How many winners").setMinValue(1).setMaxValue(20)))
      .addSubcommand((s) => s.setName("end").setDescription("End a giveaway now")
        .addStringOption((o) => o.setName("message_id").setDescription("The giveaway message ID").setRequired(true)))
      .addSubcommand((s) => s.setName("reroll").setDescription("Pick new winners")
        .addStringOption((o) => o.setName("message_id").setDescription("The giveaway message ID").setRequired(true))),
    async execute(i) {
      const sub = i.options.getSubcommand();
      if (sub === "start") {
        const ms = parseDuration(i.options.getString("duration"));
        if (!ms) return i.reply({ flags: EPHEMERAL, embeds: [fail("Use a duration like `30m`, `1d` or `1w`.")] });
        const g = { channelId: i.channelId, prize: i.options.getString("prize"), winners: i.options.getInteger("winners") ?? 1, endsAt: Date.now() + ms, host: i.user.id, entrants: [], ended: false };
        const msg = await i.channel.send({ embeds: [gEmbed(g)], components: [enterRow()] });
        db.giveaways[msg.id] = g;
        save();
        return i.reply({ flags: EPHEMERAL, embeds: [ok(`Giveaway started! Message ID: \`${msg.id}\``)] });
      }
      const id = i.options.getString("message_id").trim();
      if (!db.giveaways[id]) return i.reply({ flags: EPHEMERAL, embeds: [fail("No giveaway with that message ID.")] });
      if (sub === "end" && db.giveaways[id].ended) return i.reply({ flags: EPHEMERAL, embeds: [fail("That giveaway already ended. Use `/giveaway reroll`.")] });
      await i.deferReply({ flags: EPHEMERAL });
      await finish(i.client, id, sub === "reroll");
      await i.editReply({ embeds: [ok(sub === "end" ? "Giveaway ended." : "Rerolled.")] });
    }
  }
];

export const buttons = {
  async "giveaway:enter"(i) {
    const g = db.giveaways[i.message.id];
    if (!g || g.ended) return i.reply({ flags: EPHEMERAL, embeds: [fail("This giveaway has ended.")] });
    const n = g.entrants.indexOf(i.user.id);
    if (n >= 0) g.entrants.splice(n, 1); else g.entrants.push(i.user.id);
    save();
    await i.update({ embeds: [gEmbed(g)] });
    await i.followUp({ flags: EPHEMERAL, embeds: [n >= 0 ? ok("You left the giveaway.") : ok("You're entered! Good luck 🍀")] });
  }
};

export function register(client) {
  client.once(Events.ClientReady, () => {
    setInterval(() => {
      for (const [id, g] of Object.entries(db.giveaways)) if (!g.ended && g.endsAt <= Date.now()) finish(client, id);
      // Forget giveaways that ended more than 30 days ago.
      for (const [id, g] of Object.entries(db.giveaways)) if (g.ended && g.endsAt < Date.now() - 30 * 864e5) { delete db.giveaways[id]; save(); }
    }, 15_000);
  });
}
