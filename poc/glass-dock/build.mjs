// Builds the glass-dock POC tag: the production loader's shared src/
// files plus this folder's src/ (the dock, its boot, its settings),
// joined in filename order. Run from the repo root:
//   node poc/glass-dock/build.mjs  →  poc/glass-dock/dist/mia-poc-glass.gtm.html
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "terser";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
// Production files the POC doesn't use: its own container and boot replace them.
const SKIP = ["50-slideout.js", "50-slideout.css", "55-embedded.js", "55-embedded.css", "90-main.js"];
const files = [
  ...readdirSync(join(ROOT, "src")).filter(f => !SKIP.includes(f)).map(f => ({ f, p: join(ROOT, "src", f) })),
  ...readdirSync(join(HERE, "src")).map(f => ({ f, p: join(HERE, "src", f) }))
].sort((a, b) => a.f.localeCompare(b.f));

const key = f => f.replace(/^\d+-/, "").replace(/\.(css|html|js)$/, "");
const minCss = s => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ")
  .replace(/\s*([{}:;,>])\s*/g, "$1").replace(/;}/g, "}").trim();
const minHtml = s => s.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();

const css = {}, html = {}, js = [];
for (const { f, p } of files) {
  const src = readFileSync(p, "utf8");
  if (f.endsWith(".css")) css[key(f)] = minCss(src);
  else if (f.endsWith(".html")) html[key(f)] = minHtml(src);
  else if (f.endsWith(".js")) {
    const es = src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "").replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
    if (/(^|[^\w.])(let|const|class)\s|=>|`/m.test(es)) throw new Error(`ES6 syntax in ${f}: GTM Custom HTML needs ES5`);
    js.push(`/* ---- ${f} ---- */\n` + src);
  }
}

const stamp = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
const version = /SETTINGS\.VERSION = "([^"]+)"/.exec(readFileSync(join(HERE, "src/01-poc-settings.js"), "utf8"))[1];
const banner = (where) => `/* Spotler Mia glass dock POC ${version} - built ${stamp} - all regions, ${where} - source: github.com/Spotler-Data-Science/spotler-mia-loader/poc/glass-dock */`;
// Each version gets its own files (poc-glass-1.1 -> mia-poc-glass-1.1.*), so an
// earlier version's tag in dist/ is never overwritten.
const OUT = `mia-poc-glass-${version.replace(/^poc-glass-/, "")}`;
const body = `(function () {\n"use strict";\nvar CSS = ${JSON.stringify(css)};\nvar HTML = ${JSON.stringify(html)};\n${js.join("\n")}\n})();`;
const min = await minify(body, { ecma: 5, compress: { passes: 2 }, mangle: true, format: { ascii_only: true } });
if (!min.code) throw new Error("minify failed");
if (/[^\x00-\x7e]/.test(banner("") + min.code)) throw new Error("non-ASCII character in the GTM tag");

// The live tag (mia-live): the same build with the live bot and client
// swapped in, as poc-glass-1.0 was made. Each staging ID must occur once.
const IDS = [
  ["76065f80-2d7f-43a4-9217-26d320157352", "7fd567ab-816f-4219-9588-ef0fbe77a342"],   // bot: mia-dev -> mia-live
  ["dadbe1bf-4b11-49a4-ab85-3e9dd59f3254", "877f50a2-6eee-4e43-99bd-eb9548fdf9c3"]    // client: mia-dev -> mia-live
];
let live = min.code;
for (const [dev, prod] of IDS) {
  if (live.split(dev).length !== 2) throw new Error(`staging ID ${dev} not found exactly once`);
  live = live.replace(dev, prod);
}

mkdirSync(join(HERE, "dist"), { recursive: true });
writeFileSync(join(HERE, `dist/${OUT}.gtm.html`), `<script>\n${banner("staging (mia-dev)")}\n${min.code}\n</script>\n`);
writeFileSync(join(HERE, `dist/${OUT}.debug.html`), `<script>\n${banner("staging (mia-dev)")}\n${body}\n</script>\n`);
writeFileSync(join(HERE, `dist/${OUT}.live.gtm.html`), `<script>\n${banner("live (mia-live)")}\n${live}\n</script>\n`);
console.log(`built ${files.length} files → poc/glass-dock/dist/${OUT}.gtm.html (staging) and ${OUT}.live.gtm.html (live), ${(min.code.length / 1024).toFixed(1)} KB`);
