// /server: organises the whole Discord safely.
//   /server preview   read-only: shows every change it would make (and any staff channel members can see)
//   /server apply     backs everything up, then sets up roles, categories and permissions
//   /server content   posts the info channels' content (and the ticket + role panels)
//   /server restore   puts channel permissions, categories and order back from a backup
// Nothing is ever deleted or renamed by preview/apply. Unknown channels are left alone, except
// that ones with staff-like names (staff, admin, logs, dev...) are made staff-only.
import fs from "node:fs";
import path from "node:path";
import {
  ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChannelType, OverwriteType,
  PermissionFlagsBits as P, PermissionsBitField, SlashCommandBuilder
} from "discord.js";
import { db, save } from "../store.js";
import { config, embed, ok, fail, EPHEMERAL } from "../util.js";
import { ROLES, LAYOUT, PRIVATE_WORDS, PERM, norm } from "../blueprint.js";

const BACKUP_DIR = path.resolve("data", "backups");
const CONTENT_FILE = new URL("../../content.json", import.meta.url);
const TEXTISH = [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum];
const isVoice = (c) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice;
// Threads (and anything else without its own permissions) are never touched or backed up.
const hasPerms = (c) => !c.isThread?.() && Boolean(c.permissionOverwrites);

db.server ??= { layout: {}, roles: {}, createdRoles: [], createdChannels: [], content: {}, lastBackup: null, firstBackup: null };

// ------------------------------------------------------------------ matching
function matchRoles(guild) {
  const used = new Set();
  const out = {};
  for (const def of ROLES) {
    const known = db.server.roles[def.key] ?? (def.key === "staff" || def.key === "linked" ? db.settings.roles[def.key] : null);
    let role = known ? guild.roles.cache.get(known) : null;
    if (!role) {
      const names = [def.name, ...def.aliases].map(norm);
      role = guild.roles.cache
        .filter((r) => !r.managed && r.id !== guild.id && !used.has(r.id) && names.includes(norm(r.name)))
        .sort((a, b) => b.position - a.position).first() ?? null;
    }
    if (role) used.add(role.id);
    out[def.key] = role;
  }
  return out;
}

function matchLayout(guild) {
  const all = [...guild.channels.cache.values()].filter(hasPerms);
  const used = new Set();
  const dupes = [];
  const result = [];
  for (const cat of LAYOUT) {
    const catNames = [cat.name, ...cat.aliases].map(norm);
    const known = guild.channels.cache.get(db.server.layout[cat.key]);
    // Several categories can match ("OVERTHRONE SMP" and an old "👑 OVERTHRONE"): take the one
    // that already holds the most of this group's channels.
    const childNames = cat.channels.flatMap((d) => [d.name, ...d.aliases].map(norm));
    const score = (c) => all.filter((x) => x.parentId === c.id && childNames.includes(norm(x.name))).length;
    const category = known?.type === ChannelType.GuildCategory ? known
      : all.filter((c) => c.type === ChannelType.GuildCategory && !used.has(c.id) && catNames.includes(norm(c.name)))
        .sort((a, b) => score(b) - score(a) || a.rawPosition - b.rawPosition)[0] ?? null;
    if (category) used.add(category.id);
    const channels = cat.channels.map((def) => {
      const names = [def.name, ...def.aliases].map(norm);
      const typeOk = (c) => (def.voice ? isVoice(c) : TEXTISH.includes(c.type));
      const botId = def.bot ? db.settings.channels[def.bot] : null;
      const knownCh = guild.channels.cache.get(db.server.layout[cat.key + "/" + def.key]) ?? (botId ? guild.channels.cache.get(botId) : null);
      // Prefer the copy that's already in the right category, then the one the bot uses, then the first.
      const candidates = all.filter((c) => typeOk(c) && !used.has(c.id) && names.includes(norm(c.name)))
        .sort((a, b) => (category && b.parentId === category.id) - (category && a.parentId === category.id)
          || (knownCh && b.id === knownCh.id) - (knownCh && a.id === knownCh.id) || a.rawPosition - b.rawPosition);
      const channel = candidates[0] ?? null;
      if (channel) {
        used.add(channel.id);
        for (const extra of candidates.filter((c) => c.id !== channel.id)) dupes.push({ extra, keep: channel });
      }
      return { def, channel };
    });
    result.push({ cat, category, channels });
  }
  const others = all.filter((c) => !used.has(c.id) && c.type !== ChannelType.GuildCategory && !db.tickets[c.id]);
  const ticketCat = guild.channels.cache.get(db.settings.channels.tickets) ?? null;
  return { result, others, dupes, ticketCat };
}

const looksPrivate = (name) => norm(name).split(" ").some((w) => PRIVATE_WORDS.includes(w));

// ------------------------------------------------------------------ permissions
function roleIdsOf(roles, keys) { return keys.map((k) => roles[k]?.id).filter(Boolean); }

function template(kind, guild, roles, team = []) {
  const everyone = guild.roles.everyone.id;
  const me = guild.members.me.id;
  const staffIds = roleIdsOf(roles, ROLES.filter((r) => r.staff).map((r) => r.key));
  const adminIds = roleIdsOf(roles, ["admin"]);
  const role = (id, allow, deny = []) => ({ id, type: OverwriteType.Role, allow, deny });
  const bot = { id: me, type: OverwriteType.Member, allow: PERM.bot, deny: [] };
  switch (kind) {
    case "readonly": return [role(everyone, [...PERM.view, P.AddReactions], PERM.noPost), ...adminIds.map((id) => role(id, [P.SendMessages, P.CreatePublicThreads, P.MentionEveryone])), bot];
    case "community": return [role(everyone, [...PERM.view, ...PERM.chat]), bot];
    case "voice": return [role(everyone, [P.ViewChannel, ...PERM.voice]), bot];
    case "staff": return [role(everyone, [], [P.ViewChannel]), ...staffIds.map((id) => role(id, [...PERM.view, ...PERM.chat, ...PERM.voice])), bot];
    case "team": return [role(everyone, [], [P.ViewChannel]), ...[...adminIds, ...roleIdsOf(roles, team)].map((id) => role(id, [...PERM.view, ...PERM.chat])), bot];
    case "botlog": return [role(everyone, [], [P.ViewChannel]), ...staffIds.map((id) => role(id, PERM.view, PERM.noPost)), bot];
    default: return null;
  }
}

// Keeps overwrites we don't manage (muted roles, other bots...). For private templates only
// other bots' overwrites are kept, so nobody else can keep a way in.
function mergeOverwrites(channel, wanted, isPrivate, botIds) {
  const managed = new Set(wanted.map((o) => o.id));
  const keep = [...channel.permissionOverwrites.cache.values()]
    .filter((o) => !managed.has(o.id) && (!isPrivate || botIds.has(o.id)))
    .map((o) => ({ id: o.id, type: o.type, allow: o.allow.bitfield, deny: o.deny.bitfield }));
  return [...keep, ...wanted];
}

const sameOverwrites = (channel, list) => {
  const cur = channel.permissionOverwrites.cache;
  if (cur.size !== list.length) return false;
  return list.every((o) => {
    const c = cur.get(o.id);
    return c && c.allow.bitfield === new PermissionsBitField(o.allow).bitfield && c.deny.bitfield === new PermissionsBitField(o.deny).bitfield;
  });
};

const everyoneCanSee = (guild, ch) => ch.permissionsFor(guild.roles.everyone)?.has(P.ViewChannel);

// ------------------------------------------------------------------ backup
function backup(guild, label) {
  const snap = {
    label, takenAt: new Date().toISOString(), guild: guild.id,
    channels: [...guild.channels.cache.values()].filter(hasPerms).map((c) => ({
      id: c.id, name: c.name, type: c.type, parentId: c.parentId, position: c.rawPosition,
      overwrites: [...c.permissionOverwrites.cache.values()].map((o) => ({ id: o.id, type: o.type, allow: o.allow.bitfield.toString(), deny: o.deny.bitfield.toString() }))
    })),
    roles: [...guild.roles.cache.values()].map((r) => ({ id: r.id, name: r.name, position: r.position, permissions: r.permissions.bitfield.toString(), color: r.color, hoist: r.hoist }))
  };
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const file = path.join(BACKUP_DIR, `backup-${snap.takenAt.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(snap, null, 2));
  db.server.lastBackup = file;
  db.server.firstBackup ??= file;
  save();
  return file;
}

// ------------------------------------------------------------------ plan
// Golden rules: never delete, rename, move or reorder anything that already exists, and never
// change existing roles. Existing channels are only touched to fix a real problem:
//   hide      a staff channel members can see       -> staff-only
//   readonly  an info/guide channel members post in  -> members can read but not post
//   sync      an already-private staff channel       -> staff roles + bot get access (members see no change)
const PRIVATE = ["staff", "team", "botlog"];
const everyoneCanPost = (guild, ch) => ch.permissionsFor(guild.roles.everyone)?.has(P.SendMessages);

function decide(guild, ch, kind) {
  if (PRIVATE.includes(kind)) return everyoneCanSee(guild, ch) ? "hide" : "sync";
  if (kind === "readonly" && !isVoice(ch) && everyoneCanSee(guild, ch) && everyoneCanPost(guild, ch)) return "readonly";
  return null;
}

async function buildPlan(guild) {
  await guild.channels.fetch();
  await guild.roles.fetch();
  const roles = matchRoles(guild);
  const { result, others, dupes, ticketCat } = matchLayout(guild);
  const botIds = new Set((await guild.members.fetch().catch(() => guild.members.cache)).filter((m) => m.user.bot).map((m) => m.id));
  const steps = [];
  const warnings = [];
  const actions = [];   // { ch, kind, team, action }

  for (const def of ROLES) {
    const r = roles[def.key];
    steps.push(r ? `✓ Role **${r.name}** already exists (left as it is)` : `➕ Create role **${def.name}**`);
  }
  for (const { cat, category, channels } of result) {
    if (!category && cat.optional) {
      // No category for this group: the channels stay exactly where they are (only problems are fixed).
      const kept = [];
      for (const { def, channel } of channels) {
        if (!channel) continue;
        const kind = def.perm === undefined ? cat.perm : def.perm;
        const act = kind ? decide(guild, channel, kind) : null;
        if (act) { actions.push({ ch: channel, kind, team: def.team, action: act }); steps.push(`✏️ **#${channel.name}**: members can post here, it will be made read-only (it stays where it is)`); }
        else kept.push("#" + channel.name);
      }
      if (kept.length) steps.push(`✓ No changes at all: ${kept.join(", ")}`);
      continue;
    }
    if (category) {
      // Categories are only touched to hide a staff category that members can see.
      const act = PRIVATE.includes(cat.perm) ? decide(guild, category, cat.perm) : null;
      if (act) actions.push({ ch: category, kind: cat.perm, action: act });
      steps.push(`📁 **${category.name}**${act === "hide" ? " · 🔒 members can see this category, it will be made staff-only" : ""}`);
    } else steps.push(`➕ Create category **${cat.name}**`);
    const unchanged = [];
    for (const { def, channel } of channels) {
      const kind = def.perm === undefined ? cat.perm : def.perm;
      if (!channel) {
        if (!def.optional) steps.push(`   ➕ Create ${def.voice ? "voice channel" : "channel"} **${def.name}**${PRIVATE.includes(kind) ? " (staff-only)" : ""}`);
        continue;
      }
      const act = kind ? decide(guild, channel, kind) : null;
      if (act) actions.push({ ch: channel, kind, team: def.team, action: act });
      if (act === "hide") { steps.push(`   🔒 **#${channel.name}**: members can see it right now, it will be made staff-only`); warnings.push(`#${channel.name} is visible to everyone`); }
      else if (act === "readonly") steps.push(`   ✏️ **#${channel.name}**: members can post here, it will be made read-only`);
      else unchanged.push((isVoice(channel) ? "🔊" : "#") + channel.name);
    }
    if (unchanged.length) steps.push(`   ✓ No changes: ${unchanged.join(", ")}`);
  }
  for (const ch of others) {
    if (looksPrivate(ch.name) && everyoneCanSee(guild, ch)) {
      actions.push({ ch, kind: "staff", action: "hide" });
      steps.push(`🔒 **#${ch.name}**: looks like a staff channel and members can see it, it will be made staff-only`);
      warnings.push(`#${ch.name} is visible to everyone`);
    }
  }
  if (ticketCat && everyoneCanSee(guild, ticketCat)) warnings.push(`ticket category ${ticketCat.name} is visible to everyone`);
  for (const { extra, keep } of dupes) steps.push(`ℹ️ **#${extra.name}** is similar to **#${keep.name}**. Both are left as they are.`);
  steps.push("ℹ️ Every other channel and category is left exactly as it is. Nothing is moved, renamed, reordered or deleted.");
  return { roles, result, others, ticketCat, botIds, steps, warnings, actions };
}

function planFile(plan, title) {
  const text = [title, "", ...plan.steps.map((s) => s.replace(/\*\*/g, ""))].join("\n");
  return new AttachmentBuilder(Buffer.from(text, "utf8"), { name: "server-plan.txt" });
}

// ------------------------------------------------------------------ apply
async function fix(guild, ch, kind, team, action, roles, botIds) {
  const reason = "OVERTHRONE /server apply";
  if (action === "hide") return ch.permissionOverwrites.set(mergeOverwrites(ch, template(kind, guild, roles, team), true, botIds), reason);
  if (action === "sync") {
    const merged = mergeOverwrites(ch, template(kind, guild, roles, team), false, botIds);
    if (!sameOverwrites(ch, merged)) await ch.permissionOverwrites.set(merged, reason);
    return;
  }
  if (action === "readonly") {
    // Only take posting away from @everyone; every other overwrite stays exactly as it is.
    const everyone = guild.roles.everyone.id;
    await ch.permissionOverwrites.edit(everyone, Object.fromEntries(PERM.noPost.map((bit) => [new PermissionsBitField(bit).toArray()[0], false])), { reason });
    await ch.permissionOverwrites.edit(guild.members.me.id, { ViewChannel: true, SendMessages: true, EmbedLinks: true, AttachFiles: true, ManageMessages: true }, { reason, type: OverwriteType.Member });
    if (roles.admin) await ch.permissionOverwrites.edit(roles.admin.id, { SendMessages: true }, { reason });
  }
}

async function apply(guild, plan, log) {
  const me = guild.members.me;
  const roles = plan.roles;
  const reason = "OVERTHRONE /server apply";

  // Roles: only create the missing ones (existing roles are never changed).
  for (const def of ROLES) {
    let r = roles[def.key];
    if (!r) {
      r = await guild.roles.create({ name: def.name, color: def.color, hoist: Boolean(def.hoist), mentionable: false, permissions: def.perms, reason });
      db.server.createdRoles.push(r.id);
      log(`➕ Role ${r.name}`);
    }
    roles[def.key] = r;
    db.server.roles[def.key] = r.id;
  }
  db.settings.roles.staff = roles.staff.id;
  db.settings.roles.linked = roles.linked.id;
  db.settings.staffRoles = ROLES.filter((d) => d.staff).map((d) => roles[d.key].id);
  db.settings.supportRoles = ROLES.filter((d) => d.support).map((d) => roles[d.key].id);

  // Fix the problems found by the plan.
  for (const { ch, kind, team, action } of plan.actions) {
    await fix(guild, ch, kind, team, action, roles, plan.botIds);
    if (action === "hide") log(`🔒 #${ch.name} is now staff-only`);
    if (action === "readonly") log(`✏️ #${ch.name} is now read-only for members`);
  }

  // Remember every layout channel, and create the missing ones (at the bottom of their category).
  for (const { cat, category: found, channels } of plan.result) {
    let category = found;
    if (!category && cat.optional) {
      for (const { def, channel } of channels) if (channel) { db.server.layout[cat.key + "/" + def.key] = channel.id; if (def.bot) db.settings.channels[def.bot] = channel.id; }
      continue;
    }
    if (!category) {
      category = await guild.channels.create({ name: cat.name, type: ChannelType.GuildCategory, permissionOverwrites: cat.perm ? template(cat.perm, guild, roles) : undefined, reason });
      db.server.createdChannels.push(category.id);
      log(`➕ Category ${category.name}`);
    }
    db.server.layout[cat.key] = category.id;
    for (const { def, channel: foundCh } of channels) {
      let channel = foundCh;
      if (!channel) {
        if (def.optional) continue;
        const kind = def.perm ?? cat.perm;
        channel = await guild.channels.create({
          name: def.name, type: def.voice ? ChannelType.GuildVoice : ChannelType.GuildText, parent: category.id,
          permissionOverwrites: kind ? template(kind, guild, roles, def.team) : undefined, reason
        });
        db.server.createdChannels.push(channel.id);
        log(`➕ ${def.voice ? "Voice channel" : "Channel"} ${channel.name} in ${category.name}`);
      }
      db.server.layout[cat.key + "/" + def.key] = channel.id;
      if (def.bot) db.settings.channels[def.bot] = channel.id;
    }
  }

  // Ticket category: private, every support role can see every ticket.
  let ticketCat = plan.ticketCat;
  const supportOnly = [
    { id: guild.roles.everyone.id, type: OverwriteType.Role, allow: [], deny: [P.ViewChannel] },
    ...db.settings.supportRoles.map((id) => ({ id, type: OverwriteType.Role, allow: [...PERM.view, ...PERM.chat], deny: [] })),
    { id: me.id, type: OverwriteType.Member, allow: PERM.bot, deny: [] }
  ];
  if (!ticketCat) {
    ticketCat = await guild.channels.create({ name: "🎫 TICKETS", type: ChannelType.GuildCategory, permissionOverwrites: supportOnly, reason });
    db.server.createdChannels.push(ticketCat.id);
    log("➕ Category 🎫 TICKETS (private, for ticket channels)");
  } else {
    const merged = mergeOverwrites(ticketCat, supportOnly, everyoneCanSee(guild, ticketCat), plan.botIds);
    if (!sameOverwrites(ticketCat, merged)) await ticketCat.permissionOverwrites.set(merged, reason);
  }
  db.settings.channels.tickets = ticketCat.id;
  save();
}

// ------------------------------------------------------------------ content
const channelFor = (guild, key) => {
  for (const cat of LAYOUT) {
    if (cat.channels.some((d) => d.key === key)) return guild.channels.cache.get(db.server.layout[cat.key + "/" + key]) ?? null;
  }
  return null;
};

function fillMentions(guild, text) {
  return String(text).replace(/\{#([a-z]+)\}/g, (m, key) => {
    const ch = channelFor(guild, key);
    return ch ? `<#${ch.id}>` : "#" + key;
  });
}

function buildMessage(guild, msg) {
  const embeds = (msg.embeds ?? []).map((e) => {
    const b = embed(e.title ? fillMentions(guild, e.title) : null, e.description ? fillMentions(guild, e.description) : null);
    for (const f of e.fields ?? []) b.addFields({ name: f.name, value: fillMentions(guild, f.value), inline: Boolean(f.inline) });
    if (e.image) b.setImage(e.image);
    if (e.thumbnail) b.setThumbnail(e.thumbnail);
    return b;
  });
  const components = [];
  for (let n = 0; n < (msg.buttons ?? []).length; n += 5) {
    components.push(new ActionRowBuilder().addComponents(msg.buttons.slice(n, n + 5).map((b) => b.id
      // { id } = a bot button (for example "link:start"), { url } = a link button.
      ? new ButtonBuilder().setStyle(b.style === "secondary" ? ButtonStyle.Secondary : ButtonStyle.Success).setCustomId(b.id).setLabel(b.label).setEmoji(b.emoji ?? "✨")
      : new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(b.label).setURL(b.url).setEmoji(b.emoji ?? "🔗"))));
  }
  return { embeds, components, allowedMentions: { parse: [] } };
}

async function archiveAndClear(channel, guild, log) {
  const all = [];
  let before;
  while (all.length < 500) {
    const batch = await channel.messages.fetch({ limit: 100, before }).catch(() => null);
    if (!batch?.size) break;
    all.push(...batch.values());
    before = batch.last().id;
  }
  const mine = new Set(Object.values(db.server.content).flat());
  const old = all.filter((m) => !mine.has(m.id) && !m.pinned);
  if (!old.length) return;
  const text = old.reverse().map((m) => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.username}: ${m.content}${m.embeds.map((e) => ` [embed] ${e.title ?? ""} ${e.description ?? ""}`).join("")}`).join("\n\n");
  const logCh = guild.channels.cache.get(db.settings.channels.logs);
  await logCh?.send({ embeds: [embed("🗄️ Old content archived", `Before posting new content in ${channel}, its ${old.length} old message(s) were saved here.`)], files: [new AttachmentBuilder(Buffer.from(text, "utf8"), { name: `${channel.name}-old.txt` })] }).catch(() => {});
  for (const m of old) await m.delete().catch(() => {});
  log(`🗄️ Archived and cleared ${old.length} old message(s) in #${channel.name}`);
}

async function postContent(guild, clearOld, log, only = null) {
  let content;
  try { content = JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8")); } catch { throw new Error("content.json is missing next to index.js. Upload it with the bot files."); }
  await guild.channels.fetch();
  for (const block of content.channels) {
    if (only && block.key !== only) continue;
    const ch = channelFor(guild, block.key);
    if (!ch?.isTextBased()) { log(`⏭️ No channel for "${block.key}" (run /server apply first)`); continue; }
    if (clearOld) await archiveAndClear(ch, guild, log);
    const payloads = block.messages.map((m) => buildMessage(guild, m));
    const ids = db.server.content[block.key] ?? [];
    const existing = [];
    for (const id of ids) existing.push(await ch.messages.fetch(id).catch(() => null));
    if (existing.length === payloads.length && existing.every(Boolean)) {
      for (let n = 0; n < payloads.length; n++) await existing[n].edit(payloads[n]);
      log(`✏️ Updated #${ch.name}`);
    } else {
      for (const m of existing) await m?.delete().catch(() => {});
      const sent = [];
      for (const p of payloads) sent.push((await ch.send(p)).id);
      db.server.content[block.key] = sent;
      log(`📝 Posted ${sent.length} message(s) in #${ch.name}`);
    }
    save();
  }

  // Ticket panel (the bot's own tickets) in the support channel.
  const ticketsCh = channelFor(guild, "tickets");
  if ((!only || only === "tickets") && ticketsCh && !(await ticketsCh.messages.fetch(db.server.content._ticketPanel ?? "0").catch(() => null))) {
    const { panelMessage } = await import("./tickets.js");
    const sent = await ticketsCh.send(panelMessage());
    db.server.content._ticketPanel = sent.id;
    log(`🎫 Ticket panel posted in #${ticketsCh.name}`);
  }

  // Ping roles panel.
  const rolesCh = channelFor(guild, "roles");
  const pingDefs = ROLES.filter((r) => r.ping && db.server.roles[r.key]);
  if ((!only || only === "roles") && rolesCh && pingDefs.length) {
    const row = new ActionRowBuilder().addComponents(pingDefs.map((d) =>
      new ButtonBuilder().setCustomId("role:" + db.server.roles[d.key]).setLabel(d.name.replace(" Ping", "")).setEmoji(d.ping).setStyle(ButtonStyle.Secondary)));
    const payload = { embeds: [embed("⭐ Pick your notifications", "Click a button to get pinged for what you care about. Click again to remove it.\n\n📢 **Announcements**: big news\n💻 **Updates**: server and modpack updates\n🎉 **Events**: in-game events\n🎁 **Giveaways**: giveaways")], components: [row] };
    const old = await rolesCh.messages.fetch(db.server.content._rolePanel ?? "0").catch(() => null);
    if (old) await old.edit(payload);
    else db.server.content._rolePanel = (await rolesCh.send(payload)).id;
    log(`⭐ Role panel ${old ? "updated" : "posted"} in #${rolesCh.name}`);
  }
  save();
}

// ------------------------------------------------------------------ restore
async function restore(guild, file, log) {
  const snap = JSON.parse(fs.readFileSync(file, "utf8"));
  if (snap.guild !== guild.id) throw new Error("That backup is from a different server.");
  await guild.channels.fetch();
  const cats = snap.channels.filter((c) => c.type === ChannelType.GuildCategory);
  for (const c of snap.channels) {
    const ch = guild.channels.cache.get(c.id);
    if (!ch) continue;
    if (ch.type !== ChannelType.GuildCategory && ch.parentId !== c.parentId) {
      await ch.setParent(c.parentId, { lockPermissions: false, reason: "OVERTHRONE /server restore" }).catch(() => {});
    }
    await ch.permissionOverwrites.set(c.overwrites.map((o) => ({ id: o.id, type: o.type, allow: BigInt(o.allow), deny: BigInt(o.deny) })), "OVERTHRONE /server restore").catch((e) => log(`⚠️ #${ch.name}: ${e.message}`));
  }
  for (const r of snap.roles) {
    const role = guild.roles.cache.get(r.id);
    if (role && !role.managed && role.position < guild.members.me.roles.highest.position && role.permissions.bitfield.toString() !== r.permissions) {
      await role.setPermissions(BigInt(r.permissions), "OVERTHRONE /server restore").catch(() => {});
    }
  }
  log(`♻️ Restored permissions and categories for ${snap.channels.length} channels (${cats.length} categories) from ${path.basename(file)}.`);
  log("New roles and channels made by /server apply were kept. Delete them by hand if you don't want them.");
}

// ------------------------------------------------------------------ command
const needsAdmin = (i) => {
  if (!i.guild.members.me.permissions.has(P.Administrator)) {
    i.editReply({ embeds: [fail("I need the **Administrator** permission to organise the server. Give my bot role Administrator in Server Settings → Roles, and drag it near the top.")] });
    return true;
  }
  return false;
};

export const commands = [
  {
    data: new SlashCommandBuilder().setName("server").setDescription("Organise the Discord: roles, categories, permissions and content")
      .setDefaultMemberPermissions(P.Administrator)
      .addSubcommand((s) => s.setName("preview").setDescription("Show what /server apply would change. Changes nothing."))
      .addSubcommand((s) => s.setName("apply").setDescription("Back up, then set up roles, categories and permissions")
        .addBooleanOption((o) => o.setName("confirm").setDescription("Set to True to really apply").setRequired(true)))
      .addSubcommand((s) => s.setName("content").setDescription("Post or refresh the info channels, ticket panel and role panel")
        .addStringOption((o) => o.setName("only").setDescription("Just one channel (default: all of them)").addChoices(
          ...["welcome", "link", "rules", "links", "faq", "commands", "mods", "quests", "bosses", "races", "tickets", "roles"].map((v) => ({ name: v, value: v }))))
        .addBooleanOption((o) => o.setName("clear_old").setDescription("Archive (to bot-logs) and remove the old messages in those channels first")))
      .addSubcommand((s) => s.setName("restore").setDescription("Put permissions, categories and order back from a backup")
        .addBooleanOption((o) => o.setName("confirm").setDescription("Set to True to really restore").setRequired(true))
        .addBooleanOption((o) => o.setName("original").setDescription("True = back to before the FIRST /server apply (default: before the last one)"))),
    async execute(i) {
      const sub = i.options.getSubcommand();
      await i.deferReply({ flags: EPHEMERAL });
      if (needsAdmin(i)) return;
      const g = i.guild;
      const lines = [];
      const log = (l) => lines.push(l);
      const done = (title, extraFiles = []) => i.editReply({
        embeds: [embed(title, (lines.join("\n") || "Nothing needed changing.").slice(0, 4000))],
        files: [...extraFiles, ...(lines.join("\n").length > 4000 ? [new AttachmentBuilder(Buffer.from(lines.join("\n")), { name: "server-log.txt" })] : [])]
      });

      if (sub === "preview") {
        const plan = await buildPlan(g);
        const head = plan.warnings.length
          ? `🔓 **${plan.warnings.length} privacy problem(s) found:** ${plan.warnings.slice(0, 8).join(", ")}${plan.warnings.length > 8 ? "…" : ""}\n\n`
          : "🔒 No staff channels are visible to members.\n\n";
        const body = head + plan.steps.join("\n");
        return i.editReply({
          embeds: [embed("🔎 /server preview: nothing has been changed", (body.length > 3900 ? body.slice(0, 3900) + "\n…(full plan in the file)" : body) + "\n\nHappy with it? Run `/server apply confirm:True`.")],
          files: [planFile(plan, "OVERTHRONE /server preview")]
        });
      }

      if (sub === "apply") {
        if (!i.options.getBoolean("confirm")) return i.editReply({ embeds: [fail("Nothing changed. Run `/server apply confirm:True` to apply.")] });
        await g.channels.fetch();
        const file = backup(g, "before /server apply");
        const plan = await buildPlan(g);
        log(`💾 Backup saved: ${path.basename(file)} (undo any time with \`/server restore confirm:True\`)`);
        await apply(g, plan, log);
        log("");
        log("**Next:** give your team their roles (Admin, Moderator, Helper, Developer, Builder, In-Game Admin), then run `/server content`.");
        return done("✅ Server organised", [new AttachmentBuilder(file, { name: path.basename(file) })]);
      }

      if (sub === "content") {
        await postContent(g, Boolean(i.options.getBoolean("clear_old")), log, i.options.getString("only"));
        return done("✅ Content posted");
      }

      if (sub === "restore") {
        if (!i.options.getBoolean("confirm")) return i.editReply({ embeds: [fail("Nothing changed. Run `/server restore confirm:True` to restore.")] });
        const file = i.options.getBoolean("original") ? db.server.firstBackup : db.server.lastBackup;
        if (!file || !fs.existsSync(file)) return i.editReply({ embeds: [fail("No backup found. Backups are made by `/server apply`.")] });
        await restore(g, file, log);
        return done("♻️ Restored");
      }
    }
  }
];

// For the offline test harness only.
export const _internals = { buildPlan, apply, postContent, restore, backup };
