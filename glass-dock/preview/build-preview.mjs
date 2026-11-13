// The GTM plan page's render of the chat: the tag's own dock, showcase and
// glass conversation (no Botpress, scripted answers) on a fake spotler.com
// MCP page. Run from the repo root:
//   node glass-dock/preview/build-preview.mjs  ->  glass-dock/dist/mia-preview.html
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "terser";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCK = join(HERE, ".."), ROOT = join(DOCK, "..");
const SKIP = ["50-slideout.js", "50-slideout.css", "55-embedded.js", "55-embedded.css", "90-main.js", "70-hubspot.html", "05-config-urls.js",
              "95-dock-main.js", "60-botpress.js", "70-hubspot.js", "70-hubspot.css", "20-config.js"];
const files = [
  ...readdirSync(join(ROOT, "src")).filter(f => !SKIP.includes(f)).map(f => ({ f, p: join(ROOT, "src", f) })),
  ...readdirSync(join(DOCK, "src")).filter(f => !SKIP.includes(f)).map(f => ({ f, p: join(DOCK, "src", f) })),
  { f: "99-preview.js", p: join(HERE, "99-preview.js") }
].sort((a, b) => a.f.localeCompare(b.f));
const key = f => f.replace(/^\d+-/, "").replace(/\.(css|html|js)$/, "");
const minCss = s => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,>])\s*/g, "$1").replace(/;}/g, "}").trim();
const css = {}, js = [];
for (const { f, p } of files) {
  const src = readFileSync(p, "utf8");
  if (f.endsWith(".css")) css[key(f)] = minCss(src);
  else if (f.endsWith(".js")) js.push(`/* ---- ${f} ---- */\n` + src);
}
css.calendar = css.calendar || ""; css.calglass = css.calglass || "";
const addon = readFileSync(join(DOCK, "addon/showcase.js"), "utf8")
  .replace('"/*CSS*/"', JSON.stringify(minCss(readFileSync(join(DOCK, "addon/showcase.css"), "utf8"))))
  .replace("/*SHOWCASE*/null", JSON.stringify(JSON.parse(readFileSync(join(DOCK, "addon/showcase.json"), "utf8"))));
const body = `${addon}\n(function () {\n"use strict";\nvar CSS = ${JSON.stringify(css)};\nvar HTML = {};\n${js.join("\n")}\n})();`;
const min = await minify(body, { compress: { passes: 2 }, mangle: true, format: { ascii_only: true } });
if (!min.code) throw new Error("minify failed");
// Mia's photo from the plan page itself (a data: URL), so the render needs nothing from outside
const avatar = readFileSync(join(HERE, "avatar.txt"), "utf8").trim();
const page = readFileSync(join(HERE, "site.html"), "utf8").replace("<!--BUNDLE-->", () =>
  `<script>window.MIA_PREVIEW_AVATAR = ${JSON.stringify(avatar)};</script>\n<script>\n${min.code.replace(/<\/script/gi, "<\\/script")}\n</script>`);
writeFileSync(join(DOCK, "dist/mia-preview.html"), page);
console.log(`built preview -> glass-dock/dist/mia-preview.html (${(page.length / 1024).toFixed(1)} KB)`);
