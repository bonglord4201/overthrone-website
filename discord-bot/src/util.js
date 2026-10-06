import fs from "node:fs";
import { EmbedBuilder, MessageFlags, PermissionFlagsBits } from "discord.js";
import { db } from "./store.js";

export const config = JSON.parse(fs.readFileSync(new URL("../config.json", import.meta.url), "utf8"));
export const COLOR = parseInt(config.color.replace("#", ""), 16);
export const EPHEMERAL = MessageFlags.Ephemeral;

export function embed(title, description) {
  const e = new EmbedBuilder().setColor(COLOR).setFooter({ text: config.brand, iconURL: config.logo }).setTimestamp();
  if (title) e.setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

export const ok = (text) => embed(null, "✅ " + text).setColor(0x2ecc71);
export const fail = (text) => embed(null, "❌ " + text).setColor(0xe74c3c);

export function isStaff(member) {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.ManageMessages)) return true;
  const staff = db.settings.roles.staff;
  return Boolean(staff && member.roles?.cache?.has(staff));
}

export function getChannel(guild, key) {
  const id = db.settings.channels[key];
  return id ? guild.channels.cache.get(id) ?? null : null;
}

export async function sendTo(guild, key, payload) {
  const ch = getChannel(guild, key);
  if (!ch?.isTextBased()) return null;
  return ch.send(payload).catch(() => null);
}

// "10m", "2h", "3d", "1w" -> milliseconds
export function parseDuration(text) {
  const m = String(text).trim().toLowerCase().match(/^(\d+)\s*(s|m|h|d|w)$/);
  if (!m) return null;
  return Number(m[1]) * { s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 }[m[2]];
}

export const ts = (ms, style = "R") => `<t:${Math.floor(ms / 1000)}:${style}>`;
export const MC_NAME = /^[A-Za-z0-9_]{3,16}$/;
export const head = (name) => `https://mc-heads.net/avatar/${encodeURIComponent(name)}/128`;
