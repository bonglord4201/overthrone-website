// Renders the OVERTHRONE marks in logo.html to transparent PNGs.
//   node make_logo.mjs <out_dir>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const out = process.argv[2] || here;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 2100, height: 3300 }, deviceScaleFactor: 1 });
await page.goto(url.pathToFileURL(path.join(here, 'logo.html')).href);
await page.evaluate(() => document.fonts.ready);
for (const id of ['wordmark', 'badge', 'icon']) {
  await page.locator('#' + id).screenshot({ path: path.join(out, `overthrone-${id}.png`), omitBackground: true });
  console.log('wrote', `overthrone-${id}.png`);
}
await browser.close();
