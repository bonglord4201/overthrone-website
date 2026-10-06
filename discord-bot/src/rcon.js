// Minimal Minecraft RCON client. One short connection per command, commands run one at a time.
import net from "node:net";

const AUTH = 3, EXEC = 2;
let chain = Promise.resolve();

export function rconConfigured() {
  return Boolean(process.env.RCON_HOST && process.env.RCON_PORT && process.env.RCON_PASSWORD);
}

function packet(id, type, body) {
  const b = Buffer.from(body, "utf8");
  const buf = Buffer.alloc(14 + b.length);
  buf.writeInt32LE(10 + b.length, 0);
  buf.writeInt32LE(id, 4);
  buf.writeInt32LE(type, 8);
  b.copy(buf, 12);
  return buf; // last two bytes stay 0 (body + packet terminators)
}

function runOnce(command, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.createConnection({ host: process.env.RCON_HOST, port: Number(process.env.RCON_PORT) });
    let buf = Buffer.alloc(0);
    let authed = false;
    let out = "";
    let settle;
    const done = (err, val) => {
      clearTimeout(timer);
      clearTimeout(settle);
      sock.destroy();
      err ? reject(err) : resolve(val);
    };
    const timer = setTimeout(() => done(new Error("RCON timed out. Check RCON_HOST/RCON_PORT and that the port is open.")), timeoutMs);

    sock.on("connect", () => sock.write(packet(1, AUTH, process.env.RCON_PASSWORD)));
    sock.on("error", (e) => done(new Error("RCON connection failed: " + e.message)));
    sock.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      while (buf.length >= 4) {
        const len = buf.readInt32LE(0);
        if (buf.length < 4 + len) break;
        const id = buf.readInt32LE(4);
        const type = buf.readInt32LE(8);
        const body = buf.toString("utf8", 12, 4 + len - 2);
        buf = buf.subarray(4 + len);
        if (!authed) {
          if (id === -1) return done(new Error("RCON password is wrong."));
          if (type === EXEC || id === 1) {
            authed = true;
            sock.write(packet(2, EXEC, command));
          }
          continue;
        }
        if (id === 2) {
          out += body;
          // Long replies come in several packets; wait briefly for more before finishing.
          clearTimeout(settle);
          settle = setTimeout(() => done(null, out), 150);
        }
      }
    });
    sock.on("close", () => { if (authed && out) done(null, out); });
  });
}

// Run a console command on the Minecraft server. Returns the reply text (colour codes removed).
export function rcon(command, timeoutMs = 8000) {
  if (!rconConfigured()) return Promise.reject(new Error("RCON is not set up yet (RCON_HOST / RCON_PORT / RCON_PASSWORD in .env)."));
  const run = chain.then(() => runOnce(command, timeoutMs));
  chain = run.catch(() => {});
  return run.then((s) => s.replace(/§[0-9a-fk-or]/gi, "").trim());
}
