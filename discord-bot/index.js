// OVERTHRONE SMP Discord bot — start with:  node index.js
import "dotenv/config";
import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { fail, EPHEMERAL } from "./src/util.js";
import { saveNow } from "./src/store.js";
import * as info from "./src/features/info.js";
import * as linking from "./src/features/linking.js";
import * as setup from "./src/features/setup.js";
import * as events from "./src/features/events.js";
import * as tickets from "./src/features/tickets.js";
import * as moderation from "./src/features/moderation.js";
import * as levels from "./src/features/levels.js";
import * as giveaways from "./src/features/giveaways.js";
import * as community from "./src/features/community.js";
import * as minecraft from "./src/features/minecraft.js";

const features = [info, linking, setup, events, tickets, moderation, levels, giveaways, community, minecraft];

if (!process.env.DISCORD_TOKEN) {
  console.error("DISCORD_TOKEN is missing. Create a .env file next to index.js (copy .env.example).");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel]
});

const commands = new Map();
const buttons = new Map();
for (const f of features) {
  for (const c of f.commands ?? []) commands.set(c.data.name, c);
  for (const [prefix, fn] of Object.entries(f.buttons ?? {})) buttons.set(prefix, fn);
  f.register?.(client);
}

async function registerCommands(guild) {
  try {
    await guild.commands.set([...commands.values()].map((c) => c.data.toJSON()));
    console.log(`Registered ${commands.size} slash commands in "${guild.name}"`);
  } catch (e) {
    console.error(`Couldn't register commands in "${guild.name}":`, e.message);
  }
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag} — in ${c.guilds.cache.size} server(s)`);
  for (const g of c.guilds.cache.values()) await registerCommands(g);
});
client.on(Events.GuildCreate, registerCommands);

async function safeReply(i, err) {
  console.error(err);
  const payload = { flags: EPHEMERAL, embeds: [fail("Something went wrong: " + (err?.message ?? err))] };
  if (i.deferred || i.replied) await i.followUp(payload).catch(() => {});
  else await i.reply(payload).catch(() => {});
}

client.on(Events.InteractionCreate, async (i) => {
  if (!i.inGuild()) return i.isRepliable() && i.reply({ content: "Use me inside the OVERTHRONE Discord server.", flags: EPHEMERAL }).catch(() => {});
  try {
    if (i.isChatInputCommand()) {
      const cmd = commands.get(i.commandName);
      if (cmd) await cmd.execute(i);
    } else if (i.isButton()) {
      // customId "a:b:c" -> handler "a:b" with arg "c", or handler "a" with arg "b:c"
      const parts = i.customId.split(":");
      for (let n = parts.length; n > 0; n--) {
        const fn = buttons.get(parts.slice(0, n).join(":"));
        if (fn) { await fn(i, parts.slice(n).join(":")); break; }
      }
    }
  } catch (err) {
    await safeReply(i, err);
  }
});

process.on("unhandledRejection", (e) => console.error("Unhandled:", e));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { saveNow(); client.destroy(); process.exit(0); });

client.login(process.env.DISCORD_TOKEN);
