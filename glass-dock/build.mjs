// Builds the glass-dock POC tag: the production loader's shared src/
// files plus this folder's src/ (the dock, its boot, its settings),
// joined in filename order. Run from the repo root:
//   node glass-dock/build.mjs  →  glass-dock/dist/mia-glass-dock-<version>.live.gtm.html (mia-live)
//                              and glass-dock/dist/mia-glass-dock-<version>.staging.gtm.html (mia-dev)
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "terser";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
// Production files the POC doesn't use: its own container and boot replace them.
// 70-hubspot.html is the slide-out's pop-up calendar: the dock always shows it in the chat.
// 05-config-urls.js is the old loader's GitHub page table: the dock never reads GitHub.
const SKIP = ["50-slideout.js", "50-slideout.css", "55-embedded.js", "55-embedded.css", "90-main.js", "70-hubspot.html", "05-config-urls.js"];
// --demo: the staging showcase demo, with glass-dock/demo/ added (staging bot only)
const DEMO = process.argv.includes("--demo");
const files = [
  ...readdirSync(join(ROOT, "src")).filter(f => !SKIP.includes(f)).map(f => ({ f, p: join(ROOT, "src", f) })),
  ...readdirSync(join(HERE, "src")).map(f => ({ f, p: join(HERE, "src", f) })),
  ...(DEMO ? readdirSync(join(HERE, "demo")).map(f => ({ f, p: join(HERE, "demo", f) })) : [])
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
const version = /SETTINGS\.VERSION = "([^"]+)"/.exec(readFileSync(join(HERE, "src/01-dock-settings.js"), "utf8"))[1];
const ver = version.replace(/^glass-dock-/, "");
const body = `(function () {\n"use strict";\nvar CSS = ${JSON.stringify(css)};\nvar HTML = ${JSON.stringify(html)};\n${js.join("\n")}\n})();`;

// Two tags from one build, as with 1.0: staging talks to mia-dev, live to
// mia-live. Every bot / client id in the source is set to the target's, so
// each file holds only its own ids. The files carry the version in their
// name, so earlier builds are never overwritten.
const BOTS = {
  live:    { name: "mia-live", bot: "7fd567ab-816f-4219-9588-ef0fbe77a342", client: "877f50a2-6eee-4e43-99bd-eb9548fdf9c3" },
  staging: { name: "mia-dev",  bot: "76065f80-2d7f-43a4-9217-26d320157352", client: "dadbe1bf-4b11-49a4-ab85-3e9dd59f3254" }
};
const ALL_BOTS = Object.values(BOTS).map(b => b.bot), ALL_CLIENTS = Object.values(BOTS).map(b => b.client);
mkdirSync(join(HERE, "dist"), { recursive: true });
for (const [target, t] of Object.entries(BOTS)) {
  if (DEMO && target !== "staging") continue;
  const name = DEMO ? "demo-staging" : target;
  let src = body;
  ALL_BOTS.forEach(id => { src = src.split(id).join(t.bot); });
  ALL_CLIENTS.forEach(id => { src = src.split(id).join(t.client); });
  const banner = `/* Spotler Mia ${version}${DEMO ? "-demo" : ""} - ${name} (${t.name}) - built ${stamp} - every region */`;
  const min = await minify(src, { ecma: 5, compress: { passes: 2 }, mangle: true, format: { ascii_only: true } });
  if (!min.code) throw new Error("minify failed");
  if (/[^\x00-\x7e]/.test(banner + min.code)) throw new Error("non-ASCII character in the GTM tag");
  if (/github|jsdelivr/i.test(banner + min.code)) throw new Error("the tag must not reference GitHub");
  const out = `glass-dock/dist/mia-glass-dock-${ver}.${name}.gtm.html`;
  writeFileSync(join(ROOT, out), `<script>\n${banner}\n${min.code}\n</script>\n`);
  if (target === "staging") writeFileSync(join(HERE, `dist/mia-glass-dock-${ver}${DEMO ? ".demo" : ""}.debug.html`), `<script>\n${banner}\n${src}\n</script>\n`);
  console.log(`built ${files.length} files → ${out} (${(min.code.length / 1024).toFixed(1)} KB)`);
}
