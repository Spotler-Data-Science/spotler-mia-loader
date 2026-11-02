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

function createDock(labels, handlers) {
  addStyle(CSS.dock);
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
  restartBtn.innerHTML = "&#8635;";
  var closeBtn = el("button", { type: "button", "aria-label": labels.close, title: labels.close });
  closeBtn.innerHTML = "&#10005;";
  var head = el("div", { id: "mia-dock-head" }, [
    img, el("div", { "class": "t" }, [el("b", { text: labels.botName }), el("span", { text: labels.title })]),
    restartBtn, closeBtn
  ]);
  var loading = el("div", { id: "mia-dock-loading", "aria-hidden": "true" }, [el("span")]);
  var webchat = el("div", { id: "bp-embedded-webchat" });
  var body = el("div", { id: "spotler-inline-body" }, [loading, webchat]);
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
  // The open chat's height: from just below the site's menu bar (16px
  // clear) down to the field, at most 720px.
  function chatHeight() {
    var touch = dock.classList.contains("mia-touch");
    var top = 16 * k, hdr = document.getElementById("header") || document.querySelector("header");
    if (hdr) {
      var r = hdr.getBoundingClientRect(), pos = getComputedStyle(hdr).position;
      if ((pos === "fixed" || pos === "sticky") && r.bottom > 0 && r.bottom < window.innerHeight / 2) top = r.bottom + 16 * k;
    }
    // below the field: the AI / privacy line and the gap to the screen edge
    var below = touch || window.innerWidth <= 640 ? (20 + 26) * k : 10 + 30;
    var room = window.innerHeight - below - pill.offsetHeight - top - 2;
    return Math.max(220, Math.min(touch ? room : 720, room));
  }
  function resize() {
    fitTouch();
    if (dock.classList.contains("open")) chat.style.height = chatHeight() + "px";
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
    if (running || dock.classList.contains("typing-field")) return;
    running = true;
    if (still) { (function swap() { if (!running) return; next(); q.textContent = current; timer = setTimeout(swap, 4000); })(); return; }
    next(); type(0);
  }
  function stopTyping() { running = false; clearTimeout(timer); }

  // ---- open / close: the chat grows up out of the pill, which stays put ----
  function open() {
    if (dock.classList.contains("open")) return;
    stopTyping();
    dock.classList.add("typing-field");
    dock.classList.add("open");
    chat.style.height = chatHeight() + "px";
    if (handlers.onOpen) handlers.onOpen();
  }
  function close() {
    dock.classList.remove("open");
    chat.style.height = "0px";
    if (!trim(input.value)) { dock.classList.remove("typing-field"); startTyping(); }
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
    var text = currentSend;   // closed: the whole question (or the teaser's message), even mid-typing
    open();
    if (handlers.onAsk) handlers.onAsk(text);
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTyped(); }
  });
  pill.addEventListener("click", function () {
    if (!dock.classList.contains("open")) open();
    focusField();
  });
  closeBtn.addEventListener("click", close);
  // a click anywhere outside the chat closes it (not the calendar's own modal)
  document.addEventListener("click", function (e) {
    if (!dock.classList.contains("open")) return;
    var t = e.target;
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

function glassLiveChat() {
  var tries = 0;
  (function attach() {
    var root = webchatShadow();
    if (!root) { if (++tries < 300) setTimeout(attach, 100); return; }
    function addCss() {
      if (root.querySelector && root.querySelector("style[data-mia-dock]")) return false;
      var css = document.createElement("style");
      css.setAttribute("data-mia-dock", "");
      css.textContent = root === document.getElementById("bp-embedded-webchat")
        ? DOCK_LIVE_CSS.replace(/(^|\})([^{}]+)\{/g, function (m, end, sel) {
            return end + sel.split(",").map(function (s) { return "#bp-embedded-webchat " + s; }).join(",") + "{";
          })
        : DOCK_LIVE_CSS;
      (root.head || root).appendChild(css);
      return true;
    }
    // Any other large, solid-white panel Botpress paints (class names vary
    // by version): see-through too. Bubbles and buttons keep their colour.
    function clearWhite() {
      var box = document.getElementById("bp-embedded-webchat").getBoundingClientRect();
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
    addCss(); clearWhite();
    log("glass styles on the live chat");
    var queued = false;
    new MutationObserver(function () {
      // straight away, before the browser paints: no unstyled frame
      if (addCss()) log("glass styles put back after Botpress re-rendered");
      if (queued) return;
      queued = true;
      setTimeout(function () { queued = false; clearWhite(); }, 50);
    }).observe(root, { childList: true, subtree: true });
  })();
}
