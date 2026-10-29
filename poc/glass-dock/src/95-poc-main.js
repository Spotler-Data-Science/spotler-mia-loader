/* ==================================================================
   95 · Boot (POC glass dock): INT pages only. Stands down if the
   production loader already runs here; claims the page first otherwise
   (give this tag a higher GTM firing priority than the production one).
   ================================================================== */
function detectRegion(path) {
  for (var i = 0; i < SETTINGS.REGIONS.length; i++) {
    if (SETTINGS.REGIONS[i].test.test(path)) return SETTINGS.REGIONS[i];
  }
  return SETTINGS.REGIONS[SETTINGS.REGIONS.length - 1];
}

function bootDock() {
  var path = location.pathname;
  var region = detectRegion(path);
  if (region.id !== SETTINGS.POC_REGION) return;     // not INT: leave the page to the production loader
  if (window.__spotlerMiaStarted || document.getElementById("bp-embedded-webchat")) {
    log("POC off: the production loader already runs here (give the POC tag a higher firing priority)");
    return;
  }
  window.__spotlerMiaStarted = SETTINGS.VERSION;     // the production loader now stands down on this page
  SETTINGS.CDN_ORIGINS.forEach(preconnect);

  var labels = SETTINGS.LABELS[region.id];
  var ctx = { region: region, labels: labels, row: null, ui: null, shell: null };
  BP.ctx = ctx;
  var started = false;

  loadConfig(function (cfg, source) {
    if (source === "late" || started) return;
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
      // text area: the card with greeting, buttons and the text field
      onFocus: function () {
        var sr = ctx.shell && ctx.shell.host && ctx.shell.host.shadowRoot;
        if (sr && !BP.engaged) setTimeout(function () { ctx.shell.focus(); }, 300);
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
