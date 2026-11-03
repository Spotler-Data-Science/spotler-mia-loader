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
// 70-hubspot.html is the slide-out's pop-up calendar: the dock always shows it in the chat.
const SKIP = ["50-slideout.js", "50-slideout.css", "55-embedded.js", "55-embedded.css", "90-main.js", "70-hubspot.html"];
const files = [
  ...readdirSync(join(ROOT, "src")).filter(f => !SKIP.includes(f)).map(f => ({ f, p: join(ROOT, "src", f) })),
  ...readdirSync(join(HERE, "src")).map(f => ({ f, p: join(HERE, "src", f) }))
].sort((a, b) => a.f.localeCompare(b.f));

const key = f => f.replace(/^\d+-/, "").replace(/\.(css|html|js)$/, "");
const minCss = s => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ")
  .replace(/\s*([{}:;,>])\s*/g, "$1").replace(/;}/g, "}").trim();
const minHtml = s => s.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();

// Shared styles for parts the dock always hides (display: none in its own
// CSS): dropped from the tag. A rule goes only if every one of its
// selectors targets a hidden part or something inside one.
const HIDDEN = {
  shell: ["mq", "mq-av", "mq-txt", "mq-title", "mq-desc", "op", "av", "cmp", "ft"],        // 41-shellglass: marquee, opener, avatars, composer, footer
  calendar: ["intro", "bar", "back", "ft"]         // 54-calglass: heading, Cancel, the line under it
};
function prune(src, names) {
  const hidden = new RegExp("\\.(" + names.join("|") + ")(?![\\w-])");
  let out = "", i = 0;
  while (i < src.length) {
    const open = src.indexOf("{", i);
    if (open < 0) { out += src.slice(i); break; }
    const head = src.slice(i, open);
    let depth = 1, j = open + 1;
    while (depth && j < src.length) { if (src[j] === "{") depth++; else if (src[j] === "}") depth--; j++; }
    const inner = src.slice(open + 1, j - 1);
    if (head.startsWith("@media")) {
      const kept = prune(inner, names);
      if (kept) out += head + "{" + kept + "}";
    } else if (head.startsWith("@")) {
      out += head + "{" + inner + "}";
    } else {
      const sels = head.split(",").filter(s => !hidden.test(s));
      if (sels.length) out += sels.join(",") + "{" + inner + "}";
    }
    i = j;
  }
  return out;
}

const css = {}, html = {}, js = [];
for (const { f, p } of files) {
  const src = readFileSync(p, "utf8");
  if (f.endsWith(".css")) css[key(f)] = HIDDEN[key(f)] ? prune(minCss(src), HIDDEN[key(f)]) : minCss(src);
  else if (f.endsWith(".html")) html[key(f)] = minHtml(src);
  else if (f.endsWith(".js")) {
    const es = src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "").replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
    if (/(^|[^\w.])(let|const|class)\s|=>|`/m.test(es)) throw new Error(`ES6 syntax in ${f}: GTM Custom HTML needs ES5`);
    js.push(`/* ---- ${f} ---- */\n` + src);
  }
}

const stamp = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
const version = /SETTINGS\.VERSION = "([^"]+)"/.exec(readFileSync(join(HERE, "src/01-poc-settings.js"), "utf8"))[1];
const banner = `/* Spotler Mia glass dock POC ${version} - built ${stamp} - staging test, every region - source: github.com/Spotler-Data-Science/spotler-mia-loader/poc/glass-dock */`;
const body = `(function () {\n"use strict";\nvar CSS = ${JSON.stringify(css)};\nvar HTML = ${JSON.stringify(html)};\n${js.join("\n")}\n})();`;
const min = await minify(body, { ecma: 5, compress: { passes: 2 }, mangle: true, format: { ascii_only: true } });
if (!min.code) throw new Error("minify failed");
if (/[^\x00-\x7e]/.test(banner + min.code)) throw new Error("non-ASCII character in the GTM tag");

mkdirSync(join(HERE, "dist"), { recursive: true });
writeFileSync(join(HERE, "dist/mia-poc-glass.gtm.html"), `<script>\n${banner}\n${min.code}\n</script>\n`);
writeFileSync(join(HERE, "dist/mia-poc-glass.debug.html"), `<script>\n${banner}\n${body}\n</script>\n`);
console.log(`built ${files.length} files → poc/glass-dock/dist/mia-poc-glass.gtm.html (${(min.code.length / 1024).toFixed(1)} KB)`);
