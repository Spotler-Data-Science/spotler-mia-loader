/* ==================================================================
   95 · Boot (POC glass dock): INT pages only. Claims the page so the
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
        if (!o || o.region !== r.region || trim(o.url_match).toLowerCase() !== r.url_match || !(o.prompts instanceof Array)) continue;
        var list = o.prompts.filter(function (p) { return typeof p === "string" && trim(p); })
          .slice(0, 10).map(function (p) { return trim(p).slice(0, 120); });
        if (list.length) r.prompts = list;
        break;
      }
    });
    return cfg;
  };
}

function bootDock() {
  var path = location.pathname;
  var region = detectRegion(path);
  if (region.id !== SETTINGS.POC_REGION) return;     // not INT: leave the page to the production loader
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
  SETTINGS.CDN_ORIGINS.forEach(preconnect);

  var labels = SETTINGS.LABELS[region.id];
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
      if (fresh.prompts) ctx.ui.setPrompts(fresh.prompts);
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
    log("POC glass dock, page " + (row.page || "default"));
    addStyle(CSS.common);
    var hs = document.createElement("div");
    hs.innerHTML = HTML.hubspot;
    while (hs.firstChild) document.body.appendChild(hs.firstChild);

    ctx.ui = createDock(labels, {
      // arrow: the pill's question goes straight into the chat
      onAsk: function (text) {
        if (BP.loaded && BP.revealed && LS.getJSON(LIVE_KEY)) sendAsUser(text);
        else if (!BP.engaged) engage(text, "teaser");
      },
      // the dock's field (the one text box): starts the chat, or goes into it
      onSend: function (text) {
        if (!BP.engaged) { engage(text, "typed"); return true; }
        if (BP.revealed) { sendAsUser(text); return true; }
        return false;     // Mia is still answering the first message: keep it in the field
      },
      onRestart: function () { if (LS.getJSON(LIVE_KEY) || BP.engaged) resetToShell("restart"); }
    });
    if (row.prompts) ctx.ui.setPrompts(row.prompts);
    glassLiveChat();

    if (State.getLive(region.id)) { ctx.ui.open(); resume(); }
    else { mountShell(); ctx.ui.startTyping(); }
    startTimeoutWatch();
  }

  function mountShell() {
    if (ctx.shell && ctx.shell.host && ctx.shell.host.parentNode) ctx.shell.host.parentNode.removeChild(ctx.shell.host);
    var host = el("div", { id: "spotler-mia-shell" });
    host.style.setProperty("--mia-video-w", ctx.ui.videoWidth + "px");
    try { host.style.setProperty("--mia-font", getComputedStyle(document.body).fontFamily); } catch (e) {}   // the site's own font
    ctx.ui.body.insertBefore(host, ctx.ui.body.firstChild);
    ctx.shell = createShell(host, labels, ctx.row, {
      onSend: function (text, source) { engage(text, source); },
      onOpen: function () { engage(null, "open"); }
    });
  }
  ctx.remountShell = mountShell;
}

onDomReady(function () {
  try { bootDock(); } catch (e) { log("POC boot failed", e); }
});
