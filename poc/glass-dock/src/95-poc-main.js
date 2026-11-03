/* ==================================================================
   95 · Boot (POC glass dock): every region. Claims the page so the
   production loader stands down. If the production loader got here
   first and only shows its preview (no chat running), the POC takes
   its panel off the page and runs instead; with a chat running, the
   POC leaves it alone.
   ================================================================== */
var PROD_UI = ["spotler-agent-panel", "spotler-agent-pill", "spotler-agent-teaser", "spotler-inline-agent"];
var PROD_CLASSES = ["agent-panel-open", "mia-fit-1", "mia-fit-2", "mia-fit-3", "mia-fit-4", "mia-bar-fit", "mia-bar-tight", "mia-full-page"];

function removeProductionLoader() {
  var gone = false;
  PROD_UI.forEach(function (id) {
    var n = document.getElementById(id);
    if (n && n.parentNode) { n.parentNode.removeChild(n); gone = true; }
  });
  PROD_CLASSES.forEach(function (c) { document.body.classList.remove(c); });
  var drop = document.querySelectorAll(".mia-drop");
  for (var i = 0; i < drop.length; i++) drop[i].classList.remove("mia-drop");
  return gone;
}

// The production loader may still be waiting for its page table: watch
// for its panel for a while and take it off as soon as it appears.
function keepProductionOff() {
  if (removeProductionLoader()) log("POC: production slide-out removed");
  if (!window.MutationObserver) return;
  var mo = new MutationObserver(function () {
    if (removeProductionLoader()) log("POC: production slide-out removed");
  });
  mo.observe(document.body, { childList: true });
  setTimeout(function () { mo.disconnect(); }, 15000);
}
function detectRegion(path) {
  for (var i = 0; i < SETTINGS.REGIONS.length; i++) {
    if (SETTINGS.REGIONS[i].test.test(path)) return SETTINGS.REGIONS[i];
  }
  return SETTINGS.REGIONS[SETTINGS.REGIONS.length - 1];
}

// The POC's page table: marketing's file first, GitHub as the backup, its
// own cache (never mixed with the production loader's), and the rows keep
// their "prompts" (the shared check only keeps the production columns).
function usePocConfig() {
  SETTINGS.CONFIG_URLS = [SETTINGS.POC_CONFIG_URL].concat(SETTINGS.CONFIG_URLS);
  CONFIG_CACHE_KEY = "spotler_mia_poc_config";
  var check = validateConfig;
  validateConfig = function (raw) {
    var cfg = check(raw);
    cfg.rows.forEach(function (r) {
      for (var i = 0; i < raw.rows.length; i++) {
        var o = raw.rows[i];
        if (!o || o.region !== r.region || trim(o.url_match).toLowerCase() !== r.url_match) continue;
        if (o.prompts instanceof Array) {
          var list = o.prompts.filter(function (p) { return typeof p === "string" && trim(p); })
            .slice(0, 10).map(function (p) { return trim(p).slice(0, 120); });
          if (list.length) r.prompts = list;
        }
        // the start screen: headline, and a description / icon per card
        if (typeof o.title === "string" && trim(o.title)) r.title = trim(o.title).slice(0, 80);
        (r.buttons || []).forEach(function (b) {
          for (var j = 0; o.buttons && j < o.buttons.length; j++) {
            var ob = o.buttons[j];
            if (!ob || trim(ob.label) !== b.label) continue;
            if (typeof ob.description === "string") b.description = trim(ob.description).slice(0, 80);
            if (typeof ob.icon === "string" && (START_ICONS[ob.icon] || ob.icon === "none" || /^https:\/\/\S{1,300}$/.test(ob.icon))) b.icon = ob.icon;
            break;
          }
        });
        break;
      }
    });
    return cfg;
  };
}

// The pill's questions for this page: the page table's "prompts" if it has
// them; otherwise the page's own teaser first (on a page with its own row),
// then the general questions in the region's language.
function promptsFor(row, regionId) {
  if (row.prompts && row.prompts.length) return row.prompts;
  var list = (SETTINGS.POC_PROMPTS[SETTINGS.POC_LANG[regionId] || "en"] || SETTINGS.POC_PROMPTS.en).slice();
  if (row.page && row.page !== "default" && row.teaser_text) list.unshift({ text: row.teaser_text, send: row.teaser_send || row.teaser_text });
  return list;
}

// The hand-over without a visible move: the shared code slides the visible
// preview to line up with the live chat before the fade (a small "shunt").
// Here the hidden live chat is lined up to the preview instead, so nothing
// moves at the swap; the leftover offset is settled when Mia's next message
// arrives, when the chat moves anyway.
function lineUpLiveChat(sr) {
  try {
    var host = BP.ctx.shell && BP.ctx.shell.host, shr = host && host.shadowRoot;
    var mine = shr && shr.querySelectorAll(".b"), live = sr.querySelectorAll(".bpMessageBlocksBubble");
    if (!mine || !mine.length || !live.length) return 0;
    var d = Math.round(live[live.length - 1].getBoundingClientRect().top - mine[mine.length - 1].getBoundingClientRect().top);
    if (!d || Math.abs(d) > 160) return 0;
    var last = live[live.length - 1], msg = last.closest ? last.closest(".bpMessageContainer") : null;
    var list = sr.querySelector(".bpMessageListViewport") || (msg && msg.parentNode);
    if (!list) return 0;
    list.style.transition = "none";
    list.style.transform = "translateY(" + (-d) + "px)";
    log("lined up the live chat " + (-d) + "px (nothing moves at the swap)");
    var settle = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType === 1 && (/bpMessageContainer/.test(n.className) || (n.querySelector && n.querySelector(".bpMessageContainer")))) {
            settle.disconnect();
            list.style.transition = "transform .35s cubic-bezier(.2,.8,.2,1)";
            list.style.transform = "";
            return;
          }
        }
      }
    });
    settle.observe(sr, { childList: true, subtree: true });
    return 0;
  } catch (e) { return 0; }
}

function bootDock() {
  var path = location.pathname;
  var region = detectRegion(path);
  if (region.id === "none" || SETTINGS.ENABLED_REGIONS.indexOf(region.id) === -1) { log("POC off: no chat for this locale"); return; }
  if (window.__spotlerMiaStarted || document.getElementById("bp-embedded-webchat")) {
    if (window.botpress || LS.getJSON(LIVE_KEY)) {
      log("POC off: the production chat is in use on this page");
      return;
    }
    log("POC: production loader " + window.__spotlerMiaStarted + " started first, taking over");
  }
  window.__spotlerMiaStarted = SETTINGS.VERSION;     // a production loader firing later stands down
  keepProductionOff();
  usePocConfig();
  alignShell = lineUpLiveChat;
  SETTINGS.CDN_ORIGINS.forEach(preconnect);

  var labels = SETTINGS.LABELS[region.id] || SETTINGS.LABELS["en-GB"];
  var ctx = { region: region, labels: labels, row: null, ui: null, shell: null };
  BP.ctx = ctx;
  var started = false;

  loadConfig(function (cfg, source) {
    // The live file arrived after the page started on a saved or built-in
    // copy: take its questions and greeting, unless a chat is under way.
    if (source === "late") {
      if (!started || BP.engaged || BP.loaded) return;
      var fresh = pickRow(cfg, path, region.id);
      ctx.row = fresh;
      ctx.ui.setPrompts(promptsFor(fresh, region.id));
      if (!ctx.ui.isOpen()) mountShell();
      log("POC: page settings updated from the live file");
      return;
    }
    if (started) return;
    started = true;
    State.cleanLegacy();
    start(pickRow(cfg, path, region.id));
  });

  function start(row) {
    ctx.row = row;
    log("POC glass dock, region " + region.id + ", page " + (row.page || "default"));
    addStyle(CSS.common);
    var hs = document.createElement("div");
    hs.innerHTML = HTML.hubspot;
    while (hs.firstChild) document.body.appendChild(hs.firstChild);

    ctx.ui = createDock(labels, {
      // arrow: the pill's question goes straight into the chat
      onAsk: function (text) {
        if (BP.loaded && BP.revealed && LS.getJSON(LIVE_KEY)) sendAsUser(text);
        else if (!BP.engaged) startChat(text, "teaser");
      },
      // the dock's field (the one text box): starts the chat, or goes into it
      onSend: function (text) {
        if (!BP.engaged) { startChat(text, "typed"); return true; }
        if (BP.revealed) { sendAsUser(text); return true; }
        return false;     // Mia is still answering the first message: keep it in the field
      },
      onRestart: function () { if (LS.getJSON(LIVE_KEY) || BP.engaged) resetToShell("restart"); }
    });
    ctx.ui.setPrompts(promptsFor(row, region.id));
    glassLiveChat();

    if (State.getLive(region.id)) { ctx.ui.open(); resume(); }
    else { mountShell(); ctx.ui.startTyping(); }
    startTimeoutWatch();
  }

  // The start screen, before the first message (and again after a restart).
  var startScreen = null;
  function startChat(text, source) {
    if (startScreen) { startScreen.hide(); startScreen = null; }
    engage(text, source);
  }

  function mountShell() {
    if (ctx.shell && ctx.shell.host && ctx.shell.host.parentNode) ctx.shell.host.parentNode.removeChild(ctx.shell.host);
    if (startScreen && startScreen.el.parentNode) startScreen.el.parentNode.removeChild(startScreen.el);
    startScreen = State.getLive(region.id) ? null
      : createStart(ctx.ui.body, ctx.row, SETTINGS.POC_LANG[region.id] || "en", promptsFor(ctx.row, region.id), startChat);
    var host = el("div", { id: "spotler-mia-shell" });
    host.style.setProperty("--mia-video-w", ctx.ui.videoWidth + "px");
    try { host.style.setProperty("--mia-font", getComputedStyle(document.body).fontFamily); } catch (e) {}   // the site's own font
    ctx.ui.body.insertBefore(host, ctx.ui.body.firstChild);
    ctx.shell = createShell(host, labels, ctx.row, {
      onSend: function (text, source) { startChat(text, source); },
      onOpen: function () { startChat(null, "open"); }
    });
  }
  ctx.remountShell = mountShell;
}

onDomReady(function () {
  try { bootDock(); } catch (e) { log("POC boot failed", e); }
});
