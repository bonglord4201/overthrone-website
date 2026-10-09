// Minecraft Server List Ping: the same request the multiplayer screen makes. No RCON needed.
import net from "node:net";

function varint(n) {
  const out = [];
  n >>>= 0;
  do {
    let b = n & 0x7f;
    n >>>= 7;
    if (n) b |= 0x80;
    out.push(b);
  } while (n);
  return Buffer.from(out);
}

function readVarint(buf, off) {
  let n = 0, shift = 0, b;
  do {
    if (off >= buf.length) return null;
    b = buf[off++];
    n |= (b & 0x7f) << shift;
    shift += 7;
    if (shift > 35) throw new Error("bad varint");
  } while (b & 0x80);
  return { value: n, off };
}

function withLength(payload) {
  return Buffer.concat([varint(payload.length), payload]);
}

export function flattenText(c) {
  if (c == null) return "";
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map(flattenText).join("");
  return (c.text ?? "") + (c.extra ? c.extra.map(flattenText).join("") : "");
}

export function pingServer(host, port = 25565, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const sock = net.createConnection({ host, port });
    const started = Date.now();
    let buf = Buffer.alloc(0);
    const timer = setTimeout(() => { sock.destroy(); reject(new Error("timeout")); }, timeoutMs);
    const fail = (e) => { clearTimeout(timer); sock.destroy(); reject(e); };

    sock.on("connect", () => {
      const hostBuf = Buffer.from(host, "utf8");
      const portBuf = Buffer.alloc(2);
      portBuf.writeUInt16BE(port);
      const handshake = Buffer.concat([varint(0), varint(767), varint(hostBuf.length), hostBuf, portBuf, varint(1)]);
      sock.write(Buffer.concat([withLength(handshake), withLength(Buffer.from([0]))]));
    });
    sock.on("error", fail);
    sock.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      try {
        const len = readVarint(buf, 0);
        if (!len || buf.length < len.off + len.value) return;
        const id = readVarint(buf, len.off);
        const strLen = readVarint(buf, id.off);
        const json = JSON.parse(buf.toString("utf8", strLen.off, strLen.off + strLen.value));
        clearTimeout(timer);
        sock.destroy();
        resolve({
          online: true,
          latency: Date.now() - started,
          players: json.players?.online ?? 0,
          max: json.players?.max ?? 0,
          sample: (json.players?.sample ?? []).map((p) => p.name).filter((n) => n && !n.startsWith("§")),
          motd: flattenText(json.description).replace(/§[0-9a-fk-or]/gi, "").trim(),
          version: json.version?.name ?? ""
        });
      } catch (e) {
        fail(e);
      }
    });
  });
}

let cache = { at: 0, value: null };

// Cached for 30s so commands and the status loop share one ping.
export async function getStatus(cfg, force = false) {
  if (!force && cache.value && Date.now() - cache.at < 30_000) return cache.value;
  let value;
  try {
    value = await pingServer(cfg.server.statusHost, cfg.server.statusPort);
  } catch {
    value = { online: false, players: 0, max: 0, sample: [], motd: "", version: "", latency: 0 };
  }
  cache = { at: Date.now(), value };
  return value;
}
