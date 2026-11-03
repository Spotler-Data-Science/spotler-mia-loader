/* ==================================================================
   52 · Glass dock (POC)
   Resting: a glass pill fixed to the bottom that types a question,
   holds it, erases it and types the next. Nothing from Botpress loads.
     arrow      → that question goes straight into the chat
     text area  → the chat grows up out of the pill: greeting, buttons,
                  and the pill's row becomes the (empty) text field
   The chat holds the usual static preview and the live chat, so the
   hand-over is the production one; the pill's field is their one text box.
   ================================================================== */
CSS.shell += CSS.shellglass;
CSS.calendar += CSS.calglass;   // the in-chat calendar in the dock's style

function createDock(labels, handlers) {
  addStyle(CSS.dock);
  addStyle(CSS.start);
  var arrowSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';

  // the pill's row: the typing question at rest, the text field when open
  var q = el("span", { id: "mia-dock-q" });
  var input = el("input", { id: "mia-dock-in", type: "text", placeholder: labels.placeholder, "aria-label": labels.placeholder, autocomplete: "off" });
  var arrow = el("button", { "class": "mia-arrow", type: "button", "aria-label": "Send" });
  arrow.innerHTML = arrowSvg;
  var pill = el("div", { id: "mia-dock-pill" }, [q, input, arrow]);

  // the chat that grows above it
  var img = el("img", { src: SETTINGS.AVATAR_URL, alt: "" });
  var restartBtn = el("button", { type: "button", "aria-label": labels.restart, title: labels.restart });
  // drawn icons, not text characters, so they sit dead centre in their circles
  restartBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/></svg>';
  var closeBtn = el("button", { type: "button", "aria-label": labels.close, title: labels.close });
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>';
  var head = el("div", { id: "mia-dock-head" }, [
    img, el("div", { "class": "t" }, [el("b", { text: labels.botName }), el("span", { text: labels.title })]),
    restartBtn, closeBtn
  ]);
  var loading = el("div", { id: "mia-dock-loading", "aria-hidden": "true" }, [el("span")]);
  var webchat = el("div", { id: "bp-embedded-webchat" });
  // typed while Mia replies in the live chat: held at the foot of the chat
  // (see-through, no status) until her reply lands, then sent (95-poc-main)
  var held = el("div", { id: "mia-dock-held", "aria-live": "polite" });
  var body = el("div", { id: "spotler-inline-body" }, [loading, webchat, held]);
  var chat = el("div", { id: "mia-dock-chat", role: "dialog", "aria-label": labels.title }, [head, body]);
  // the AI / privacy line, under the field when open
  var ft = el("div", { id: "mia-dock-ft" }, [footerNote(labels)]);
  var dock = el("div", { id: "mia-dock", "class": "mia-glass" }, [chat, pill, ft]);
  document.body.appendChild(dock);
  try { dock.style.setProperty("--mia-font", getComputedStyle(document.body).fontFamily); } catch (e) {}   // the site's own font

  // Phones: if the page is shrunk to fit (layout wider than the screen),
  // scale the pill back up so it matches the browser's own toolbar.
  var k = 1;
  function fitTouch() {
    var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (!isMobileOrTabletUA() && !(coarse && Math.min(screen.width, screen.height) < 700)) return;
    dock.classList.add("mia-touch");
    var portrait = window.innerHeight >= window.innerWidth;
    var sw = portrait ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
    // layout width; a pinch zoom only narrows innerWidth, so the larger one is the page's own
    var cw = Math.max(document.documentElement.clientWidth, window.innerWidth);
    k = sw && cw > sw * 1.02 ? Math.min(cw / sw, 3) : 1;
    dock.style.setProperty("--mia-k", k.toFixed(3));
  }
  // The open chat's height: from just below the site's menu bar (8px
  // clear) down to the field, at most 720px.
  function chatHeight(full) {
    var touch = dock.classList.contains("mia-touch");
    var top = 16 * k, hdr = document.getElementById("header") || document.querySelector("header");
    if (hdr) {
      var r = hdr.getBoundingClientRect(), pos = getComputedStyle(hdr).position;
      if ((pos === "fixed" || pos === "sticky") && r.bottom > 0 && r.bottom < window.innerHeight / 2) top = r.bottom + 8 * k;
    }
    // below the field: the AI / privacy line and the gap to the screen edge
    var below = touch || window.innerWidth <= 640 ? (20 + 26) * k : 24 + 30;
    var room = window.innerHeight - below - pill.offsetHeight - top - 2;
    // the calendar (full) gets up to 800px plus the field's and line's room: HubSpot's page
    // is ~715px, so more would just be empty glass
    return Math.max(220, Math.min(touch ? room : (full ? 800 : 720), room));
  }
  // While the calendar is open it covers the whole dock: the field and the
  // AI / privacy line give it their room, and come back when it closes.
  function calOpen() {
    var cal = document.getElementById("spotler-cal");
    return !!(cal && body.contains(cal) && cal.classList.contains("on"));
  }
  function sizeChat() {
    if (!dock.classList.contains("open")) return;
    // the calendar (HubSpot's page wants ~715px) gets all the height there is
    var cal = calOpen(), h = chatHeight(cal);
    if (cal) h += pill.offsetHeight + (parseFloat(getComputedStyle(ft).height) || 0);
    chat.style.height = h + "px";
  }
  function resize() {
    fitTouch();
    sizeChat();
  }
  fitTouch();
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", function () { setTimeout(resize, 300); });

  // ---- the typing question ----
  // each question: a string, or {text, send} (a page teaser: shown text, sent text)
  var prompts = SETTINGS.POC_PROMPTS.en, idx = 0, current = "", currentSend = "", timer = null, running = false;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function next() {
    var p = prompts[idx++ % prompts.length];
    current = typeof p === "string" ? p : p.text;
    currentSend = typeof p === "string" ? p : (p.send || p.text);
  }
  function type(n) {
    if (!running) return;
    q.textContent = current.slice(0, n);
    if (n < current.length) timer = setTimeout(function () { type(n + 1); }, SETTINGS.POC_TYPE_MS);
    else timer = setTimeout(function () { erase(n); }, SETTINGS.POC_HOLD_MS);
  }
  function erase(n) {
    if (!running) return;
    q.textContent = current.slice(0, n);
    if (n > 0) timer = setTimeout(function () { erase(n - 1); }, SETTINGS.POC_ERASE_MS);
    else timer = setTimeout(function () { next(); type(0); }, SETTINGS.POC_GAP_MS);
  }
  function startTyping() {
    if (running || dock.classList.contains("typing-field") || dock.classList.contains("cal-pending")) return;
    running = true;
    if (still) { (function swap() { if (!running) return; next(); q.textContent = current; timer = setTimeout(swap, 4000); })(); return; }
    next(); type(0);
  }
  function stopTyping() { running = false; clearTimeout(timer); }

  // ---- open / close: the chat grows up out of the pill, which stays put ----
  function open() {
    if (dock.classList.contains("open")) return;
    stopTyping();
    dock.classList.remove("cal-pending");
    dock.classList.add("typing-field");
    dock.classList.add("open");
    sizeChat();
    if (handlers.onOpen) handlers.onOpen();
  }
  function close() {
    dock.classList.remove("open");
    chat.style.height = "0px";
    if (calOpen()) { showBookingPending(); return; }   // the calendar stays; the bar invites them back
    if (!trim(input.value)) { dock.classList.remove("typing-field"); startTyping(); }
  }
  // A booking left open: the bar says so (no typing questions) until it's
  // finished or cancelled; tapping it reopens the chat on the calendar.
  function showBookingPending() {
    stopTyping();
    dock.classList.remove("typing-field");
    dock.classList.add("cal-pending");
    q.textContent = labels.calResume || "Finish booking your demo";
  }
  function clearBookingPending() {
    if (!dock.classList.contains("cal-pending")) return;
    dock.classList.remove("cal-pending");
    q.textContent = "";
    if (!dock.classList.contains("open")) startTyping();
  }
  function focusField() { try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); } }

  // The field sends into the chat (the preview's and Botpress's own text
  // boxes are hidden: this is the one text box, before and during the chat).
  function sendTyped() {
    var text = trim(input.value);
    if (!text) { focusField(); return; }
    if (handlers.onSend && handlers.onSend(text) !== false) input.value = "";
  }

  arrow.addEventListener("click", function (e) {
    e.stopPropagation();
    if (dock.classList.contains("open")) { sendTyped(); return; }
    if (dock.classList.contains("cal-pending")) { open(); return; }   // back to the booking
    var text = currentSend;   // closed: the whole question (or the teaser's message), even mid-typing
    open();
    if (handlers.onAsk) handlers.onAsk(text);
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTyped(); }
  });
  pill.addEventListener("click", function (e) {
    if (!dock.classList.contains("open")) {
      open();
      // phones: open the chat but keep the keyboard down; tapping the field brings it up
      if (!dock.classList.contains("mia-touch")) focusField();
      return;
    }
    if (e.target !== input) focusField();
  });
  closeBtn.addEventListener("click", close);
  new MutationObserver(function () {
    var on = calOpen();
    if (on === dock.classList.contains("cal-open")) return;
    if (on) { sizeChat(); dock.classList.add("cal-open"); }     // measure the field before it goes
    else { dock.classList.remove("cal-open"); sizeChat(); clearBookingPending(); }
  }).observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

  // a click anywhere outside the chat closes it (not the calendar's own modal)
  document.addEventListener("click", function (e) {
    if (!dock.classList.contains("open")) return;
    var t = e.target;
    // with the calendar open the booking is kept: the bar then says "finish booking"
    if (!t || dock.contains(t) || (t.closest && t.closest("#hubspot-modal"))) return;
    close();
  }, true);
  restartBtn.addEventListener("click", function () { if (handlers.onRestart) handlers.onRestart(); });

  return {
    body: body,
    webchat: webchat,
    loading: loading,
    videoWidth: 380,
    open: open,
    close: close,
    isOpen: function () { return dock.classList.contains("open"); },
    setPrompts: function (list) { if (list && list.length) { prompts = list; idx = 0; } },
    startTyping: startTyping,
    // the live chat gives up the held messages' height, so they never cover her reply
    hold: function (text) {
      held.appendChild(el("div", { "class": "h" }, [el("p", { text: text })]));
      webchat.style.height = "calc(100% - " + held.offsetHeight + "px)";
    },
    clearHeld: function () { held.innerHTML = ""; webchat.style.height = ""; },
    setRow: function () {}
  };
}

// Glass look for the live chat too, so the hand-over stays in style.
var DOCK_LIVE_CSS =
  // clear all the way through: the dock's glass is the only background
  ".bpContainer,.bpWebchat,.bpMessageListContainer,.bpMessageListViewport,[class*='bpModal'],[class*='bpHeader']{background:transparent !important;background-color:transparent !important}" +
  ".bpContainer{border:0 !important;box-shadow:none !important}" +
  // the dock's own field is the text box: no Botpress composer (and no mic)
  ".bpComposerContainer{display:none !important}" +
  ".bpMessageListMarqueeContainer,.bpMessageAvatarContainer{display:none !important}" +
  // laid out exactly like the preview, so the hand-over doesn't re-flow:
  // the site's font, the preview's spacing (no room kept for a composer),
  // the same bubble padding and text size
  ".bpContainer,.bpContainer *{font-family:var(--mia-font,inter,sans-serif) !important}" +
  ".bpMessageListContainer{margin-bottom:0 !important;padding:4px !important}" +
  ".bpMessageListViewport{padding:8px 24px 16px !important}" +
  ".bpMessageContainer[data-direction=incoming] .bpMessageBlocksBubble{background:transparent !important;padding:0 !important;color:#0B1F4D !important;font-size:15px !important;line-height:23px !important;max-width:100% !important}" +
  ".bpMessageContainer[data-direction=outgoing] .bpMessageBlocksBubble{background:rgba(214,230,255,.85) !important;color:#0B1F4D !important;border-radius:18px !important;padding:9px 16px !important;font-size:15px !important;line-height:23px !important;max-width:85% !important}" +
  ".bpMessageBlocksButton{background:rgba(255,255,255,.55) !important;border:1px solid rgba(11,31,77,.14) !important;color:#0B1F4D !important;border-radius:999px !important;padding:4px 12px !important;font-size:14px !important;line-height:20px !important}" +
  ".bpComposerFooter{display:none !important}" +
  // Botpress's "scroll to newest" arrow: not wanted
  ".bpMessageListScrollDownButton{display:none !important}";

// Every part of the live chat: Botpress nests its chat in more than one
// shadow root (and can use an iframe), so each one gets our styles.
function liveRoots() {
  var wrap = document.getElementById("bp-embedded-webchat"), out = [];
  if (!wrap) return out;
  (function walk(node) {
    var all = node.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      if (all[i].shadowRoot) { out.push(all[i].shadowRoot); walk(all[i].shadowRoot); }
      if (all[i].tagName === "IFRAME") {
        try { var d = all[i].contentDocument; if (d && d.body) { out.push(d.body); walk(d.body); } } catch (e) {}
      }
    }
  })(wrap);
  if (!out.length && wrap.querySelector("[class*='bp']")) out.push(wrap);
  return out;
}

function glassLiveChat() {
  var wrap = null, watched = [];
  function addCss(root) {
    if (root.querySelector && root.querySelector("style[data-mia-dock]")) return false;
    var css = document.createElement("style");
    css.setAttribute("data-mia-dock", "");
    css.textContent = root === wrap
      ? DOCK_LIVE_CSS.replace(/(^|\})([^{}]+)\{/g, function (m, end, sel) {
          return end + sel.split(",").map(function (s) { return "#bp-embedded-webchat " + s; }).join(",") + "{";
        })
      : DOCK_LIVE_CSS;
    (root.head || root).appendChild(css);
    return true;
  }
  // Any other large, solid-white panel Botpress paints (class names vary
  // by version): see-through too. Bubbles and buttons keep their colour.
  function clearWhite(root) {
    var box = wrap.getBoundingClientRect();
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var n = all[i];
      if (n.__miaClear || /bpMessageBlocks|bpComposer|button/i.test(n.className + " " + n.tagName)) continue;
      var m = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(getComputedStyle(n).backgroundColor);
      if (!m || +m[1] < 235 || +m[2] < 235 || +m[3] < 235 || (m[4] !== undefined && +m[4] < 0.5)) continue;
      var r = n.getBoundingClientRect();
      if (r.width < box.width * 0.6 || r.height < box.height * 0.3) continue;
      n.style.setProperty("background", "transparent", "important");
      n.__miaClear = true;
    }
  }
  // find new parts (at most every 50ms) and style them
  var queued = false;
  function discover() {
    var roots = liveRoots(), added = 0;
    for (var i = 0; i < roots.length; i++) {
      if (addCss(roots[i])) added++;
      if (watched.indexOf(roots[i]) === -1) { watched.push(roots[i]); mo.observe(roots[i], { childList: true, subtree: true }); }
      clearWhite(roots[i]);
    }
    if (added) log("glass styles on the live chat (" + added + " part" + (added > 1 ? "s" : "") + ")");
  }
  // on every change: known parts get their styles back straight away, before
  // the browser paints (no unstyled frame); new parts are found shortly after
  var mo = new MutationObserver(function () {
    for (var i = 0; i < watched.length; i++) if (addCss(watched[i])) log("glass styles put back after Botpress re-rendered");
    if (!queued) { queued = true; setTimeout(function () { queued = false; discover(); }, 50); }
  });

  // Watch the chat box from the start, with no time limit: Botpress only
  // loads when someone starts a chat, which can be minutes after the page
  // (the old 30-second poll gave up first, and the chat came up unstyled).
  wrap = document.getElementById("bp-embedded-webchat");
  if (!wrap) return;
  mo.observe(wrap, { childList: true, subtree: true });
  discover();
}
