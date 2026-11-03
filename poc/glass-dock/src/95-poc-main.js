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
    // held messages (typed while Mia replies) aren't in the live chat yet: line up her reply
    var mine = shr && shr.querySelectorAll(".m:not(.queued) .b"), live = sr.querySelectorAll(".bpMessageBlocksBubble");
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

/* ---- typing while Mia replies (build 4, loader 1.6.9) ----
   The dock's field always takes the message and clears. During Mia's first
   reply the shared code holds it in the preview and sends it after the
   hand-over (queueWhileReplying). In the live chat the dock holds it the same
   way: under the chat, until her reply has landed, then everything held goes
   as one visitor turn, in the order typed (the 1.6.9 rule, so the messages
   don't interrupt each other's replies). Each of those sends waits in turn. */
var LIVE = { waiting: false, onReveal: false, outs: 0, since: 0, quiet: 0, held: [], timer: null };
var LIVE_TICK_MS = 250, LIVE_QUIET_MS = 1000, LIVE_GIVE_UP_MS = 60000;

// Has the bot answered the visitor's latest message? (a reply after the last
// outgoing message, which is newer than the ones there when we sent, and no
// typing dots: a multi-part reply is in once it's been quiet for a second)
function liveReplyIn() {
  var sr = webchatShadow();
  if (!sr) return false;
  var all = sr.querySelectorAll(".bpMessageContainer"), outs = 0, reply = false;
  for (var i = 0; i < all.length; i++) {
    if (all[i].getAttribute("data-direction") === "outgoing") { outs++; reply = false; }
    else if (outs && isReply(all[i])) reply = true;
  }
  return reply && outs > LIVE.outs && !sr.querySelector("[class*='TypingIndicator']");
}

function liveTick() {
  clearTimeout(LIVE.timer);
  if (!LIVE.waiting) return;
  var done = LIVE.onReveal ? BP.revealed : liveReplyIn();
  LIVE.quiet = done ? LIVE.quiet + LIVE_TICK_MS : 0;
  var late = now() - LIVE.since > LIVE_GIVE_UP_MS;
  if (!late && LIVE.quiet < (LIVE.onReveal ? 500 : LIVE_QUIET_MS)) { LIVE.timer = setTimeout(liveTick, LIVE_TICK_MS); return; }
  if (late) log("no reply after " + LIVE_GIVE_UP_MS / 1000 + "s: sending what's held");
  LIVE.waiting = false; LIVE.onReveal = false;
  if (!LIVE.held.length) return;
  var text = LIVE.held.join("\n");
  LIVE.held = [];
  BP.ctx.ui.clearHeld();
  log("sending the held message");
  sendAsUser(text);
}

// Every visitor message into the live chat (the dock's, and the one held
// during the first reply) starts the wait for Mia's reply.
function waitForReplies() {
  var send = sendAsUser;
  sendAsUser = function (text, attempt) {
    if (!attempt && BP.revealed) {
      var sr = webchatShadow();
      LIVE.waiting = true; LIVE.onReveal = false; LIVE.since = now(); LIVE.quiet = 0;
      LIVE.outs = sr ? sr.querySelectorAll(".bpMessageContainer[data-direction=outgoing]").length : 0;
      liveTick();
    }
    return send(text, attempt);
  };
  // restart, timeout, ended in another tab: nothing held is sent
  var reset = resetToShell;
  resetToShell = function (reason) { clearHeld(); return reset(reason); };
}

function holdInDock(text, untilReveal) {
  LIVE.held.push(text);
  BP.ctx.ui.hold(text);
  log("held while Mia replies (" + LIVE.held.length + ")");
  if (untilReveal && !LIVE.waiting) { LIVE.waiting = true; LIVE.onReveal = true; LIVE.since = now(); LIVE.quiet = 0; liveTick(); }
}

function liveSend(text) {
  if (BP.queued.length) { BP.queued.push(text); return; }   // the first reply's held text is about to go: join it
  if (LIVE.waiting) { holdInDock(text); return; }
  sendAsUser(text);
}

function clearHeld() {
  clearTimeout(LIVE.timer);
  LIVE.waiting = false; LIVE.onReveal = false; LIVE.held = [];
  if (BP.ctx.ui) BP.ctx.ui.clearHeld();
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
  waitForReplies();
  SETTINGS.CDN_ORIGINS.forEach(preconnect);

  var labels = SETTINGS.LABELS[region.id] || SETTINGS.LABELS["en-GB"];
  labels.calResume = SETTINGS.POC_CAL_RESUME[SETTINGS.POC_LANG[region.id] || "en"];
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
        if (BP.loaded && BP.revealed && LS.getJSON(LIVE_KEY)) liveSend(text);
        else dockSend(text, "teaser");
      },
      // the dock's field (the one text box): starts the chat, or goes into it;
      // while Mia replies it's held and sent once her reply is in (build 4)
      onSend: function (text) { dockSend(text, "typed"); return true; },
      // a booking open: the restart closes it too and starts afresh
      onRestart: function () {
        if (window.spotlerCloseHubSpotModal) try { window.spotlerCloseHubSpotModal(); } catch (e) {}
        if (LS.getJSON(LIVE_KEY) || BP.engaged) resetToShell("restart");
      }
    });
    ctx.ui.setPrompts(promptsFor(row, region.id));
    glassLiveChat();

    // a chat from an earlier page: reopened, unless the visitor had closed it
    if (State.getLive(region.id)) { if (SS.get(CLOSED_KEY) !== "1") ctx.ui.open(); else ctx.ui.startTyping(); resume(); }
    else { mountShell(); ctx.ui.startTyping(); }
    startTimeoutWatch();
  }

  // HubSpot's page reports its height as it changes step (calendar, form):
  // the card and the chat follow it, less the 16px gutter cropped top and bottom
  window.addEventListener("message", function (m) {
    if (!/^https:\/\/meetings[^.]*\.hubspot\.com$/.test(m.origin || "") || !ctx.ui) return;
    var d = m.data, h;
    if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { return; } }
    // what HubSpot says (keys only, no personal data): to see if it ever reports its height
    try { log("POC: HubSpot message", d && typeof d === "object" ? Object.keys(d).join(",") : typeof d); } catch (e) {}
    h = d && typeof d === "object" ? Number(d.height) : NaN;
    if (!(h > 300 && h < 3000)) return;
    log("POC: HubSpot page height " + h);
    // visible = page height less the crop at the top (the frame's offset) and 16px at the foot, plus the card's border
    var cal = document.getElementById("spotler-cal"), f = cal && cal.shadowRoot && cal.shadowRoot.querySelector(".stage iframe");
    ctx.ui.fitCalendarPage(Math.round(h + (f ? f.offsetTop : -16) - 14));
  });

  function dockSend(text, source) {
    if (BP.revealed) liveSend(text);
    else if (BP.engaged && ctx.shell) queueWhileReplying(text);          // her first reply: held in the preview
    else if (!ctx.shell) holdInDock(text, true);                        // a saved chat still loading (no preview)
    else startChat(text, source);
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
      onOpen: function () { startChat(null, "open"); },
      onQueue: function (text) { queueWhileReplying(text); }
    });
  }
  ctx.remountShell = mountShell;
}

onDomReady(function () {
  try { bootDock(); } catch (e) { log("POC boot failed", e); }
});
