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
  { f: "98-viewrect.js", p: join(HERE, "98-viewrect.js") },
  { f: "99-preview.js", p: join(HERE, "99-preview.js") }
].sort((a, b) => a.f.localeCompare(b.f));
const key = f => f.replace(/^\d+-/, "").replace(/\.(css|html|js)$/, "");
const minCss = s => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,>])\s*/g, "$1").replace(/;}/g, "}").trim();
const css = {}, js = [];
for (const { f, p } of files) {
  const src = readFileSync(p, "utf8");
  if (f.endsWith(".css")) css[key(f)] = minCss(src);
  // the dock's on-screen measures go through viewRect (98-viewrect.js), so they hold when drawn inline and scaled
  else if (f.endsWith(".js")) js.push(`/* ---- ${f} ---- */\n` + (f === "52-dock.js" ? src.replace(/(\w+)\.getBoundingClientRect\(\)/g, "viewRect($1)") : src));
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

// Inline: the page drawn in a shadow root on the plan page (no frame at all), with a stand-in window and
// document scoped to it. Viewers such as Teams block frames' scripts and the page's reach into frames;
// this needs only the plan page's own script.
const siteCss = site.slice(site.indexOf("<style>") + 7, site.indexOf("</style>"))
  .replace(":root {", ":host {").replace("html, body {", ".mr-root, .vp {");
const siteBody = site.slice(site.indexOf("<body>") + 6, site.indexOf("<!--RUN-->"));
const fontsHref = /<link href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/.exec(site)[1];
const inline = `function miaPreviewInline(host) {
${code}
var CSS_ = ${JSON.stringify(siteCss + ".mr-root{position:relative;width:100%;height:100%;overflow:hidden}.vp{height:100%;overflow-y:auto;overscroll-behavior:contain}")};
var BODY_ = ${JSON.stringify(siteBody)};
try { if (!document.querySelector("link[data-mr-fonts]")) { var lk = document.createElement("link"); lk.rel = "stylesheet"; lk.href = ${JSON.stringify(fontsHref.replace(/&amp;/g, "&"))}; lk.setAttribute("data-mr-fonts", ""); document.head.appendChild(lk); } } catch (e) {}
var sh = host.attachShadow({ mode: "open" });
var st = document.createElement("style"); st.textContent = CSS_; sh.appendChild(st);
var root = document.createElement("div"); root.className = "mr-root"; sh.appendChild(root);
var vp = document.createElement("div"); vp.className = "vp"; vp.innerHTML = BODY_; root.appendChild(vp);
function on(t) { return t === "scroll" ? vp : window; }
Object.defineProperty(root, "scrollHeight", { get: function () { return vp.scrollHeight; } });
Object.defineProperty(root, "scrollTop", { get: function () { return vp.scrollTop; } });
var LOC = { pathname: "/en-gb/spotler-mcp", host: "spotler.com", hostname: "spotler.com", protocol: "https:", href: "https://spotler.com/en-gb/spotler-mcp", search: "", hash: "" };
var W = {
  get innerWidth() { return 1280; }, get innerHeight() { return 800; },
  get pageYOffset() { return vp.scrollTop; }, get scrollY() { return vp.scrollTop; },
  scrollTo: function (o, y) { if (typeof o === "object") vp.scrollTo(o); else vp.scrollTo(o, y); },
  addEventListener: function (t, f, o) { on(t).addEventListener(t, f, o); },
  removeEventListener: function (t, f, o) { on(t).removeEventListener(t, f, o); },
  matchMedia: window.matchMedia ? window.matchMedia.bind(window) : null, getComputedStyle: window.getComputedStyle.bind(window),
  MutationObserver: window.MutationObserver, ResizeObserver: window.ResizeObserver,
  get localStorage() { return window.localStorage; }, get sessionStorage() { return window.sessionStorage; },
  location: LOC, navigator: navigator, screen: screen, dataLayer: [], console: console, parent: window,
  __viewOrigin: function () { var r = host.getBoundingClientRect(); return { top: r.top, left: r.left, k: r.width / 1280 || 1 }; }
};
var D = {
  getElementById: function (id) { return sh.getElementById(id); },
  querySelector: function (q) { return sh.querySelector(q); },
  querySelectorAll: function (q) { return sh.querySelectorAll(q); },
  createElement: function (t) { return document.createElement(t); },
  createElementNS: function (n, t) { return document.createElementNS(n, t); },
  createTextNode: function (t) { return document.createTextNode(t); },
  body: root, head: sh, readyState: "complete", cookie: "",
  documentElement: root,   // a real element (it is watched for changes); its page measures are the mock page's
  addEventListener: function (t, f, o) { sh.addEventListener(t, f, o); },
  removeEventListener: function (t, f, o) { sh.removeEventListener(t, f, o); },
  get hidden() { return document.hidden; }, get activeElement() { return sh.activeElement; }
};
miaPreviewRun(W, D, LOC, navigator, screen, window.getComputedStyle.bind(window), window.matchMedia.bind(window), window.requestAnimationFrame.bind(window), window.MutationObserver, window.ResizeObserver, window);
}`;
const imin = await minify(inline, { compress: { passes: 2 }, mangle: { reserved: ["miaPreviewInline"] }, format: { ascii_only: true } });
if (!imin.code) throw new Error("minify inline failed");
writeFileSync(join(DOCK, "dist/mia-preview-inline.js"), imin.code.replace(/<\/script/gi, "<\\/script").replace(/<script/gi, "<scr\\u0069pt"));
console.log(`built inline preview (${(imin.code.length / 1024).toFixed(1)} KB)`);

