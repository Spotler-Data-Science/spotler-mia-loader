// The GTM plan page's render of the chat: the tag's own dock, showcase and
// glass conversation (no Botpress, scripted answers) on a fake spotler.com
// MCP page. Run from the repo root:
//   node glass-dock/preview/build-preview.mjs
// Builds:
//   glass-dock/dist/mia-preview-site.html  the page (HTML and CSS only, no scripts)
//   glass-dock/dist/mia-preview-run.js     function miaPreviewRun(window, document, ...): everything that runs,
//                                          called by the plan page on the frame's window and document. File
//                                          viewers (SharePoint, Teams) only trust scripts written in the file
//                                          itself, so nothing runs inside the frame on its own.
//   glass-dock/dist/mia-preview.html       both together, to open on its own (testing)
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
// Mia's photo from the plan page itself (a data: URL), and the prompt library's prompts
const avatar = readFileSync(join(HERE, "avatar.txt"), "utf8").trim();
const library = JSON.parse(readFileSync(join(HERE, "library.json"), "utf8"));
const GLOBALS = "window, document, location, navigator, screen, getComputedStyle, matchMedia, requestAnimationFrame, MutationObserver, ResizeObserver, parent";
const run = `function miaPreviewRun(${GLOBALS}) {
window.MIA_PREVIEW_AVATAR = ${JSON.stringify(avatar)};
window.MIA_LIBRARY = ${JSON.stringify(library)};
${readFileSync(join(HERE, "library.js"), "utf8")}
${addon}
(function () {
"use strict";
var CSS = ${JSON.stringify(css)};
var HTML = {};
${js.join("\n")}
})();
}`;
const min = await minify(run, { compress: { passes: 2 }, mangle: { reserved: ["miaPreviewRun"] }, format: { ascii_only: true } });
if (!min.code) throw new Error("minify failed");
const code = min.code.replace(/<\/script/gi, "<\\/script");
const site = readFileSync(join(HERE, "site.html"), "utf8");
writeFileSync(join(DOCK, "dist/mia-preview-site.html"), site.replace("<!--RUN-->", ""));
writeFileSync(join(DOCK, "dist/mia-preview-run.js"), code);
// standalone: the same function, called on its own window
const CALL = "miaPreviewRun(window, document, location, navigator, screen, getComputedStyle.bind(window), matchMedia.bind(window), requestAnimationFrame.bind(window), MutationObserver, ResizeObserver, window);";
writeFileSync(join(DOCK, "dist/mia-preview.html"), site.replace("<!--RUN-->", () => `<script>\n${code}\n${CALL}\n</script>`));
console.log(`built preview: site ${(site.length / 1024).toFixed(1)} KB, run ${(code.length / 1024).toFixed(1)} KB`);
