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

// The carousel, in place of the start screen. onSend(text, source) starts or
// continues the chat, as the start screen's cards do.
function createShowcase(parent, sc, onSend) {
  var root = el("div", { id: "mia-showcase" });
  var slides = (sc.slides || []).slice(0, 12), cur = 0, timer = 0, stopped = false;
  var track = el("div", { "class": "mia-sc-track", "aria-roledescription": "carousel" });
  var dots = el("div", { "class": "mia-sc-dots" });
  var L = sc.labels || {};

  function send(text) { text = trim(text); if (text) { stop(); onSend(text, "showcase"); } }
  function fill(tpl, s) { return String(tpl || "").replace(/\{goal\}/g, s.goal || "").replace(/\{prompt\}/g, s.prompt || "").replace(/\{title\}/g, s.title || ""); }

  slides.forEach(function (s, i) {
    var slide = el("div", { "class": "mia-sc-slide", role: "group", "aria-label": (i + 1) + " / " + slides.length });
    var head = el("div", { "class": "mia-sc-head" });
    var words = el("div", { "class": "mia-sc-words" });
    if (s.badge) words.appendChild(el("span", { "class": "mia-sc-badge" }, [scIcon(s.badgeIcon || "bolt"), el("span", { text: scText(s.badge, 60) })]));
    if (s.title) words.appendChild(el("h2", { "class": "mia-sc-title", text: scText(s.title, 120) }));
    if (s.text) words.appendChild(el("p", { "class": "mia-sc-text", text: scText(s.text, 300) }));
    head.appendChild(words);
    if (/^https:\/\/\S{1,300}$/.test(String(s.image || ""))) head.appendChild(el("img", { "class": "mia-sc-img", src: s.image, alt: "" }));
    slide.appendChild(head);

    if (s.goal || s.prompt) {
      var flow = el("div", { "class": "mia-sc-flow" });
      var left = el("div", { "class": "mia-sc-left" });
      if (s.goal) left.appendChild(el("div", { "class": "mia-sc-goal" }, [
        el("div", { "class": "mia-sc-label" }, [scIcon("user"), el("span", { text: scText(s.goalLabel || L.goal || "Your goal", 60) })]),
        el("p", { "class": "mia-sc-goal-text", text: scText(s.goal, 300) })
      ]));
      var cta = s.cta || sc.cta || {};
      var ctaBtn = el("button", { "class": "mia-sc-cta", type: "button" }, [el("span", { text: scText(cta.label || "Generate my prompt", 60) }), scIcon("arrow")]);
      ctaBtn.addEventListener("click", function () { send(fill(cta.send || "Generate my prompt: {goal}", s)); });
      left.appendChild(ctaBtn);
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
          el("p", { "class": "mia-sc-code", text: scText(s.prompt, 600) })
        ]));
      }
      slide.appendChild(flow);
    }
    track.appendChild(slide);
    var dot = el("button", { "class": "mia-sc-dot", type: "button", "aria-label": (i + 1) + " / " + slides.length });
    dot.addEventListener("click", function () { stop(); go(i); });
    dots.appendChild(dot);
  });

  var prev = el("button", { "class": "mia-sc-nav mia-sc-prev", type: "button", "aria-label": scText(L.previous || "Previous", 40) }, [scIcon("left")]);
  var next = el("button", { "class": "mia-sc-nav mia-sc-next", type: "button", "aria-label": scText(L.next || "Next", 40) }, [scIcon("right")]);
  prev.addEventListener("click", function () { stop(); go(cur - 1); });
  next.addEventListener("click", function () { stop(); go(cur + 1); });
  var stage = el("div", { "class": "mia-sc-stage" }, [track, prev, next]);
  root.appendChild(el("div", { "class": "mia-sc-card" }, [stage, dots]));
  if (slides.length < 2) { prev.style.display = next.style.display = dots.style.display = "none"; }

  if (sc.actions && sc.actions.length) {
    var row = el("div", { "class": "mia-sc-actions" });
    sc.actions.slice(0, 6).forEach(function (a) {
      if (!a || !a.label) return;
      var b = el("button", { "class": "mia-sc-action", type: "button" }, [scIcon(a.icon || "chat"), el("span", { text: scText(a.label, 60) })]);
      b.addEventListener("click", function () { send(a.send || a.label); });
      row.appendChild(b);
    });
    root.appendChild(row);
  }

  function go(i) {
    if (!slides.length) return;
    cur = (i + slides.length) % slides.length;
    var all = track.children, ds = dots.children;
    for (var k = 0; k < all.length; k++) { all[k].classList.toggle("on", k === cur); ds[k].classList.toggle("on", k === cur); ds[k].setAttribute("aria-current", k === cur ? "true" : "false"); }
  }
  function stop() { stopped = true; clearInterval(timer); }
  go(0);
  var ms = +sc.autoplayMs;
  if (ms >= 2000 && slides.length > 1) {
    timer = setInterval(function () { if (!stopped && !root.matches(":hover") && !root.contains(document.activeElement)) go(cur + 1); }, ms);
  }
  parent.appendChild(root);
  return {
    el: root,
    fit: function () {},
    hide: function () {
      stop();
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
