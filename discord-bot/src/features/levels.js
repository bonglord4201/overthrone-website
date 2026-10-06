// Chat levels: members earn XP for chatting (once per minute), level up, and can earn reward roles.
import { Events, SlashCommandBuilder } from "discord.js";
import { db, save } from "../store.js";
import { config, embed, getChannel } from "../util.js";

export const xpFor = (level) => 5 * level ** 2 + 50 * level + 100; // XP needed to go from `level` to `level + 1`

function progressBar(cur, need, size = 14) {
  const filled = Math.round((cur / need) * size);
  return "▰".repeat(filled) + "▱".repeat(size - filled);
}

function ranking() {
  return Object.entries(db.levels).sort(([, a], [, b]) => b.level - a.level || b.xp - a.xp);
}

export const commands = [
  {
    data: new SlashCommandBuilder().setName("rank").setDescription("See your chat level")
      .addUserOption((o) => o.setName("user").setDescription("Someone else")),
    async execute(i) {
      const user = i.options.getUser("user") ?? i.user;
      const d = db.levels[user.id] ?? { xp: 0, level: 0 };
      const pos = ranking().findIndex(([id]) => id === user.id) + 1;
      const need = xpFor(d.level);
      await i.reply({ embeds: [embed(`${user.username}'s rank`)
        .setThumbnail(user.displayAvatarURL({ size: 128 }))
        .addFields(
          { name: "Level", value: `**${d.level}**`, inline: true },
          { name: "Rank", value: pos ? `#${pos}` : "—", inline: true },
          { name: "XP", value: `${d.xp} / ${need}`, inline: true },
          { name: "Progress", value: progressBar(d.xp, need) }
        )] });
    }
  },
  {
    data: new SlashCommandBuilder().setName("leaderboard").setDescription("Top 10 most active chatters"),
    async execute(i) {
      const top = ranking().slice(0, 10);
      const medals = ["🥇", "🥈", "🥉"];
      const text = top.length ? top.map(([id, d], n) => `${medals[n] ?? `**${n + 1}.**`} <@${id}> — Level **${d.level}** (${d.xp} XP)`).join("\n") : "Nobody has XP yet. Start chatting!";
      await i.reply({ embeds: [embed("🏆 Chat Leaderboard", text)], allowedMentions: { users: [] } });
    }
  }
];

export function register(client) {
  client.on(Events.MessageCreate, async (msg) => {
    if (!config.levels.enabled || !msg.guild || msg.author.bot) return;
    const d = (db.levels[msg.author.id] ??= { xp: 0, level: 0, last: 0 });
    if (Date.now() - d.last < config.levels.cooldownSeconds * 1000) return;
    d.last = Date.now();
    d.xp += config.levels.xpMin + Math.floor(Math.random() * (config.levels.xpMax - config.levels.xpMin + 1));
    let leveled = false;
    while (d.xp >= xpFor(d.level)) { d.xp -= xpFor(d.level); d.level++; leveled = true; }
    save();
    if (!leveled) return;

    const reward = config.levels.roleRewards?.[String(d.level)];
    let rewardText = "";
    if (reward) {
      const role = msg.guild.roles.cache.get(reward) ?? msg.guild.roles.cache.find((r) => r.name === reward);
      if (role && (await msg.member.roles.add(role).catch(() => null))) rewardText = `\nYou unlocked the **${role.name}** role!`;
    }
    const ch = getChannel(msg.guild, "levelups") ?? msg.channel;
    ch.send({ content: `${msg.author}`, embeds: [embed(null, `⬆️ ${msg.author} reached **Level ${d.level}**!${rewardText}`)] }).catch(() => {});
  });
}
