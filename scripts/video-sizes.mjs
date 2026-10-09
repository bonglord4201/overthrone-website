// Writes public/video/sizes.json (file name -> byte size) for src/video.js.
// Run after adding or replacing a video:  node scripts/video-sizes.mjs
import { readdirSync, statSync, writeFileSync } from "node:fs";

const dir = new URL("../public/video/", import.meta.url);
const sizes = {};
for (const name of readdirSync(dir)) {
  if (/\.(mp4|webm)$/i.test(name)) sizes[name] = statSync(new URL(name, dir)).size;
}
writeFileSync(new URL("sizes.json", dir), JSON.stringify(sizes, null, 2) + "\n");
console.log(sizes);
