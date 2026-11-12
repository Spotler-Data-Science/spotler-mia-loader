/* ==================================================================
   Showcase add-on (demo only): a second GTM tag next to the demo tag.
   A page row with a "showcase" object in the page table turns that
   page's chat into a showcase: it opens by itself, takes more of the
   screen, and instead of the start screen it shows a carousel of slides
   (badge, title, text, a goal, a suggested prompt, a button that sends a
   message to Mia) and a row of buttons. The text field stays below it.
   The look lives in the page table too (showcase.css); this file only
   holds the mechanics. The main tag hands over its helpers (h): el, SS,
   addStyle, trim. Kept apart from the main tag for GTM's 102,400
   character limit on a Custom HTML tag.
   ================================================================== */
(function () {
"use strict";
var el, SS, addStyle, trim;
var BASE_CSS = "/*CSS*/";
// The Services page's showcase, built in (the page table's, when a row has
// one, comes first). English Services pages: /services, /en-gb|en-de|en-au/services.
var BUILT_IN = /*SHOWCASE*/null;
var BUILT_IN_PATH = /^\/(?:en-gb\/|en-de\/|en-au\/)?services\/?$/i;
var SHOWCASE_ICONS = {
  bolt: ["M13 2 4 14h7l-1 8 9-12h-7z"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21a8 8 0 0 1 16 0"],
  spark: ["M12 3l1.8 4.6L18 9.5l-4.2 1.9L12 16l-1.8-4.6L6 9.5l4.2-1.9z", "M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"],
  copy: ["M9 9h10v12H9z", "M5 15V3h10"],
  check: ["m5 12 5 5 9-10"],
  arrow: ["M5 12h14", "m13 6 6 6-6 6"],
  left: ["m15 6-6 6 6 6"],
  right: ["m9 6 6 6-6 6"],
  layers: ["M12 3 21 8 12 13 3 8z", "M3 12.5l9 5 9-5", "M3 16.5l9 5 9-5"],
  grid: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h6v6h-6z"],
  calendar: ["M8 3v4", "M16 3v4", "M3 10h18", "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"],
  chat: ["M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"],
  mail: ["M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "m3 7 9 6 9-6"],
  chart: ["M4 20V10", "M10 20V4", "M16 20v-7", "M22 20H2"]
};
function scIcon(name, cls) {
  var span = el("span", { "class": "mia-sc-ico" + (cls ? " " + cls : ""), "aria-hidden": "true" });
  if (/^https:\/\/\S{1,300}$/.test(String(name || ""))) { span.appendChild(el("img", { src: name, alt: "" })); return span; }
  var d = SHOWCASE_ICONS[name];
  if (!d) return span;
  var svg = '<svg viewBox="0 0 24 24">';
  for (var i = 0; i < d.length; i++) svg += '<path d="' + d[i] + '"/>';
  span.innerHTML = svg + "</svg>";
  return span;
}
function scText(v, max) { return typeof v === "string" ? v.slice(0, max || 400) : ""; }

// The page's look, size and auto-open: called once the dock exists.
function applyShowcase(ui, sc) {
  var dock = document.getElementById("mia-dock");
  if (!dock || !sc) return;
  if (!document.getElementById("mia-showcase-base")) addStyle(BASE_CSS).id = "mia-showcase-base";
  var css = sc.css instanceof Array ? sc.css.join("\n") : scText(sc.css, 40000);
  if (css && !document.getElementById("mia-showcase-style")) addStyle(css).id = "mia-showcase-style";
  dock.classList.add("mia-showcase");
  var size = sc.size || {};
  if (size.width > 0) dock.style.setProperty("--mia-sc-w", Math.min(1600, +size.width) + "px");
  if (size.height > 0) dock.setAttribute("data-max-h", Math.min(1200, +size.height));
  var input = document.getElementById("mia-dock-in");
  if (input && sc.placeholder) { input.placeholder = scText(sc.placeholder, 120); input.setAttribute("aria-label", input.placeholder); }
  // opens by itself on page launch, unless the visitor closed it on this page
  var key = "spotler_mia_showcase_closed";
  var phone = dock.classList.contains("mia-touch") || window.innerWidth <= 640;
  if (sc.autoOpen !== false && (!phone || sc.autoOpenOnPhones) && SS.get(key) !== location.pathname) {
    setTimeout(function () { if (!ui.isOpen()) ui.open(); }, +sc.autoOpenDelayMs > 0 ? Math.min(10000, +sc.autoOpenDelayMs) : 400);
  }
  var wasOpen = false;
  new MutationObserver(function () {
    var open = dock.classList.contains("open");
    if (wasOpen && !open) SS.set(key, location.pathname);
    wasOpen = open;
  }).observe(dock, { attributes: true, attributeFilter: ["class"] });
}

// Slide pictures (inline SVG, 240 x 160): a slide's "art" names one; an
// https "image" works too. Spotler navy / blue, soft, gently animated in CSS.
var N = "#002A4D", B = "#0062FF", C = "#2FACE6", P = "#EAF2FF";
var SHOWCASE_ART = {
  connect: '<circle cx="120" cy="80" r="30" fill="' + B + '"/><circle class="mia-sc-pulse" cx="120" cy="80" r="30" fill="none" stroke="' + B + '" stroke-width="2"/>' +
    '<path d="M120 64l4.5 11.5L136 80l-11.5 4.5L120 96l-4.5-11.5L104 80l11.5-4.5z" fill="#fff"/>' +
    '<path class="mia-sc-flow-line" d="M90 80H52M150 80h38M120 50V24M120 110v26" stroke="' + B + '" stroke-width="2" fill="none"/>' +
    '<rect x="14" y="66" width="38" height="28" rx="8" fill="#fff" stroke="' + N + '" stroke-opacity=".15"/><path d="M22 74h22M22 81h14" stroke="' + N + '" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>' +
    '<rect x="188" y="66" width="38" height="28" rx="8" fill="#fff" stroke="' + N + '" stroke-opacity=".15"/><path d="M196 86l7-8 6 5 9-10" stroke="' + C + '" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<rect x="101" y="0" width="38" height="24" rx="8" fill="#fff" stroke="' + N + '" stroke-opacity=".15"/><path d="M109 7h22l-11 8z" fill="none" stroke="' + B + '" stroke-width="2" stroke-linejoin="round"/>' +
    '<rect x="101" y="136" width="38" height="24" rx="8" fill="#fff" stroke="' + N + '" stroke-opacity=".15"/><circle cx="112" cy="148" r="4" fill="' + C + '"/><path d="M120 148h11" stroke="' + N + '" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>',
  goal: '<rect x="8" y="22" width="120" height="50" rx="16" fill="#fff" stroke="' + N + '" stroke-opacity=".15"/><path d="M24 40h84M24 54h56" stroke="' + N + '" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/><path d="M30 72l-6 12 18-12z" fill="#fff"/>' +
    '<path class="mia-sc-twinkle" d="M156 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="' + C + '"/>' +
    '<rect x="82" y="88" width="150" height="62" rx="16" fill="' + B + '"/><path d="M98 106h96M98 119h118M98 132h70" stroke="#fff" stroke-opacity=".85" stroke-width="5" stroke-linecap="round"/>',
  email: '<rect x="34" y="10" width="172" height="140" rx="14" fill="#fff" stroke="' + N + '" stroke-opacity=".15"/><path d="M34 24a14 14 0 0 1 14-14h144a14 14 0 0 1 14 14v12H34z" fill="' + P + '"/>' +
    '<circle cx="50" cy="23" r="4" fill="' + B + '" opacity=".5"/><path d="M62 23h54" stroke="' + N + '" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>' +
    '<rect x="52" y="48" width="136" height="40" rx="8" fill="' + C + '" opacity=".25"/><path d="M52 102h120M52 114h96" stroke="' + N + '" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>' +
    '<rect x="52" y="126" width="56" height="14" rx="7" fill="' + B + '"/><rect x="150" y="122" width="46" height="20" rx="10" fill="' + P + '"/><path d="M160 132h26" stroke="' + B + '" stroke-width="3" stroke-linecap="round"/>' +
    '<g class="mia-sc-twinkle"><path d="M206 8l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="' + C + '"/></g>',
  journey: '<path class="mia-sc-flow-line" d="M36 80h52M112 80h40" stroke="' + B + '" stroke-width="3" fill="none"/><path d="M176 80h32" stroke="' + N + '" stroke-opacity=".2" stroke-width="3" stroke-dasharray="3 5"/>' +
    '<circle cx="24" cy="80" r="14" fill="' + B + '"/><circle cx="100" cy="80" r="14" fill="' + B + '"/><circle cx="164" cy="80" r="16" fill="#fff" stroke="#E5484D" stroke-width="3"/>' +
    '<circle class="mia-sc-pulse" cx="164" cy="80" r="16" fill="none" stroke="#E5484D" stroke-width="2"/><path d="M164 72v9" stroke="#E5484D" stroke-width="3" stroke-linecap="round"/><circle cx="164" cy="87" r="2" fill="#E5484D"/>' +
    '<circle cx="220" cy="80" r="12" fill="' + P + '" stroke="' + N + '" stroke-opacity=".15"/>' +
    '<path d="M164 100v26" stroke="#E5484D" stroke-opacity=".5" stroke-width="2" stroke-dasharray="3 4"/><rect x="128" y="126" width="72" height="22" rx="11" fill="#fff" stroke="#E5484D" stroke-opacity=".4"/><path d="M140 137h48" stroke="#E5484D" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>' +
    '<rect x="64" y="22" width="72" height="26" rx="13" fill="#fff" stroke="' + N + '" stroke-opacity=".15"/><path d="M76 35h48" stroke="' + N + '" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>',
  score: '<rect x="14" y="14" width="212" height="132" rx="14" fill="#fff" stroke="' + N + '" stroke-opacity=".15"/><path d="M34 124h172" stroke="' + N + '" stroke-opacity=".15" stroke-width="2"/>' +
    '<path class="mia-sc-draw" d="M34 62l30-8 30 4 30-6 30 34 22 6 30-2" fill="none" stroke="' + B + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="154" cy="86" r="22" fill="' + C + '" fill-opacity=".14" stroke="' + C + '" stroke-width="3"/><path d="M170 102l14 14" stroke="' + C + '" stroke-width="5" stroke-linecap="round"/>' +
    '<rect x="34" y="26" width="48" height="16" rx="8" fill="' + P + '"/><path d="M42 34h32" stroke="' + B + '" stroke-width="3" stroke-linecap="round"/>',
  shield: '<path d="M120 12l58 20v40c0 38-25 64-58 76-33-12-58-38-58-76V32z" fill="' + P + '" stroke="' + B + '" stroke-opacity=".35" stroke-width="2"/>' +
    '<circle class="mia-sc-pulse" cx="120" cy="80" r="30" fill="none" stroke="' + B + '" stroke-width="2"/><circle cx="120" cy="80" r="30" fill="' + B + '"/><path class="mia-sc-draw" d="M106 80l10 10 20-20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<rect x="176" y="112" width="56" height="28" rx="14" fill="#fff" stroke="' + N + '" stroke-opacity=".15"/><rect x="182" y="117" width="44" height="18" rx="9" fill="' + C + '" fill-opacity=".25"/><circle cx="216" cy="126" r="7" fill="' + B + '"/>' +
    '<rect x="6" y="20" width="54" height="24" rx="12" fill="#fff" stroke="' + N + '" stroke-opacity=".15"/><path d="M18 32h30" stroke="' + N + '" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>'
};
function scArt(s) {
  if (SHOWCASE_ART[s.art]) {
    var box = el("div", { "class": "mia-sc-art", "aria-hidden": "true" });
    box.innerHTML = '<svg viewBox="0 0 240 160">' + SHOWCASE_ART[s.art] + "</svg>";   // built-in pictures only, never page table text
    return box;
  }
  return /^https:\/\/\S{1,300}$/.test(String(s.image || "")) ? el("img", { "class": "mia-sc-art", src: s.image, alt: "" }) : null;
}
var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

// The carousel, in place of the start screen. onSend(text, source) starts or
// continues the chat, as the start screen's cards do.
function createShowcase(parent, sc, onSend) {
  var root = el("div", { id: "mia-showcase" });
  var slides = (sc.slides || []).slice(0, 12), cur = 0, timer = 0, stopped = false;
  var track = el("div", { "class": "mia-sc-track", "aria-roledescription": "carousel" });
  var dots = el("div", { "class": "mia-sc-dots" });
  var L = sc.labels || {};

  function ctaButton(cta, s) {
    var b = el("button", { "class": "mia-sc-cta", type: "button" }, [el("span", { text: scText(cta.label || "Generate my prompt", 60) }), scIcon("arrow")]);
    b.addEventListener("click", function () { send(fill(cta.send || "Generate my prompt: {goal}", s)); });
    return b;
  }
  function send(text) { text = trim(text); if (text) { stop(); onSend(text, "showcase"); } }
  function fill(tpl, s) { return String(tpl || "").replace(/\{goal\}/g, s.goal || "").replace(/\{prompt\}/g, s.prompt || "").replace(/\{title\}/g, s.title || ""); }

  slides.forEach(function (s, i) {
    var slide = el("div", { "class": "mia-sc-slide", role: "group", "aria-label": (i + 1) + " / " + slides.length });
    var head = el("div", { "class": "mia-sc-head" });
    var words = el("div", { "class": "mia-sc-words" });
    if (s.badge) words.appendChild(el("span", { "class": "mia-sc-badge", text: scText(s.badge, 60) }));
    if (s.title) words.appendChild(el("h2", { "class": "mia-sc-title", text: scText(s.title, 120) }));
    if (s.text) words.appendChild(el("p", { "class": "mia-sc-text", text: scText(s.text, 300) }));
    if (s.points && s.points.length) {
      // plain blocks, not ul / li: the site's own list styles never reach them
      var ul = el("div", { "class": "mia-sc-points", role: "list" });
      s.points.slice(0, 4).forEach(function (t) { ul.appendChild(el("div", { "class": "mia-sc-point", role: "listitem" }, [scIcon("check"), el("span", { text: scText(t, 120) })])); });
      words.appendChild(ul);
    }
    if (!s.goal && !s.prompt && s.cta) words.appendChild(ctaButton(s.cta, s));
    head.appendChild(words);
    var art = scArt(s);
    if (art) head.appendChild(art);
    slide.appendChild(head);

    if (s.goal || s.prompt) {
      var flow = el("div", { "class": "mia-sc-flow" });
      var left = el("div", { "class": "mia-sc-left" });
      if (s.goal) left.appendChild(el("div", { "class": "mia-sc-goal" }, [
        el("div", { "class": "mia-sc-label" }, [scIcon("user"), el("span", { text: scText(s.goalLabel || L.goal || "Your goal", 60) })]),
        el("p", { "class": "mia-sc-goal-text", text: scText(s.goal, 300) })
      ]));
      left.appendChild(ctaButton(s.cta || sc.cta || {}, s));
      flow.appendChild(left);
      if (s.prompt) {
        flow.appendChild(el("div", { "class": "mia-sc-between" }, [scIcon("arrow")]));
        var copyBtn = el("button", { "class": "mia-sc-copy", type: "button", "aria-label": scText(L.copy || "Copy prompt", 60), title: scText(L.copy || "Copy prompt", 60) }, [scIcon("copy")]);
        copyBtn.addEventListener("click", function () {
          var done = function () { copyBtn.classList.add("done"); setTimeout(function () { copyBtn.classList.remove("done"); }, 1500); };
          try { navigator.clipboard.writeText(s.prompt).then(done, function () {}); } catch (e) {}
        });
        flow.appendChild(el("div", { "class": "mia-sc-prompt" }, [
          el("div", { "class": "mia-sc-label" }, [scIcon("spark"), el("span", { text: scText(s.promptLabel || L.prompt || "Suggested MCP prompt", 60) }), copyBtn]),
          // the full text holds the space; the typed copy runs over it, so nothing moves
          el("p", { "class": "mia-sc-code" }, [el("span", { "class": "mia-sc-ghost", text: scText(s.prompt, 600) }), el("span", { "class": "mia-sc-typed", "aria-hidden": "true" })])
        ]));
      }
      slide.appendChild(flow);
    }
    track.appendChild(slide);
    var dot = el("button", { "class": "mia-sc-dot", type: "button", "aria-label": (i + 1) + " / " + slides.length + (s.step ? ": " + scText(s.step, 30) : "") },
      s.step ? [el("span", { text: scText(s.step, 30) })] : []);
    dot.addEventListener("click", function () { stop(); go(i); });
    dots.appendChild(dot);
  });

  var prev = el("button", { "class": "mia-sc-nav mia-sc-prev", type: "button", "aria-label": scText(L.previous || "Previous", 40) }, [scIcon("left")]);
  var next = el("button", { "class": "mia-sc-nav mia-sc-next", type: "button", "aria-label": scText(L.next || "Next", 40) }, [scIcon("right")]);
  prev.addEventListener("click", function () { stop(); go(cur - 1); });
  next.addEventListener("click", function () { stop(); go(cur + 1); });
  var stage = el("div", { "class": "mia-sc-stage" }, [track, prev, next]);
  var wrap = el("div", { "class": "mia-sc-wrap" });
  root.appendChild(wrap);
  wrap.appendChild(el("div", { "class": "mia-sc-card" }, [stage, dots]));
  if (slides.length < 2) { prev.style.display = next.style.display = dots.style.display = "none"; }

  if (sc.actions && sc.actions.length) {
    var row = el("div", { "class": "mia-sc-actions" });
    sc.actions.slice(0, 6).forEach(function (a) {
      if (!a || !a.label) return;
      var b = el("button", { "class": "mia-sc-action", type: "button" }, [scIcon(a.icon || "chat"), el("span", { text: scText(a.label, 60) })]);
      b.addEventListener("click", function () { send(a.send || a.label); });
      row.appendChild(b);
    });
    wrap.appendChild(row);
  }

  function go(i) {
    if (!slides.length) return;
    cur = (i + slides.length) % slides.length;
    var all = track.children, ds = dots.children;
    for (var k = 0; k < all.length; k++) {
      all[k].classList.toggle("on", k === cur); ds[k].classList.toggle("on", k === cur); ds[k].classList.toggle("done", k < cur);
      ds[k].setAttribute("aria-current", k === cur ? "step" : "false");
    }
    typeOut(all[cur]);
  }
  // the suggested prompt types itself out when its slide comes in
  var typing = 0;
  function typeOut(slide) {
    clearInterval(typing);
    var ghost = slide.querySelector(".mia-sc-ghost"), out = slide.querySelector(".mia-sc-typed");
    if (!ghost || !out) return;
    var full = ghost.textContent, n = 0;
    if (REDUCED) { out.textContent = full; return; }
    out.textContent = ""; slide.classList.add("typing");
    typing = setInterval(function () {
      n = Math.min(full.length, n + 3);
      out.textContent = full.slice(0, n);
      if (n >= full.length) { clearInterval(typing); slide.classList.remove("typing"); }
    }, 18);
  }
  function stop() { stopped = true; clearInterval(timer); }
  go(0);
  var ms = +sc.autoplayMs;
  if (ms >= 2000 && slides.length > 1) {
    timer = setInterval(function () { if (!stopped && !root.matches(":hover") && !root.contains(document.activeElement)) go(cur + 1); }, ms);
  }
  parent.appendChild(root);

  // No scrolling: on a short screen the page table's CSS tightens the
  // spacing first (@media max-height); if it still doesn't fit, the whole
  // showcase is scaled down to the room there is (not below 60%).
  function fit() {
    if (!root.parentNode) return;
    wrap.style.zoom = "";
    for (var i = 0, z = 1; i < 4; i++) {
      var have = root.clientHeight, need = root.scrollHeight;
      if (!have || need <= have + 1) break;
      z = Math.max(0.6, z * have / need - 0.005);
      wrap.style.zoom = z.toFixed(3);
      if (z === 0.6) break;
    }
  }
  var fitTimer;
  function refit() { clearTimeout(fitTimer); fitTimer = setTimeout(fit, 60); }
  window.addEventListener("resize", refit);
  try { new ResizeObserver(refit).observe(root); } catch (e) {}
  refit();
  return {
    el: root,
    fit: fit,
    hide: function () {
      stop(); clearInterval(typing);
      window.removeEventListener("resize", refit);
      if (!root.parentNode) return;
      root.classList.add("going");
      setTimeout(function () { if (root.parentNode) root.parentNode.removeChild(root); }, 220);
    }
  };
}

function use(h) { el = h.el; SS = h.SS; addStyle = h.addStyle; trim = h.trim; }
window.SpotlerMiaShowcase = {
  builtIn: function (path) { return BUILT_IN_PATH.test(path || "") ? BUILT_IN : null; },
  apply: function (ui, sc, h) { use(h); applyShowcase(ui, sc); },
  create: function (parent, sc, onSend, h) { use(h); return createShowcase(parent, sc, onSend); }
};
})();
