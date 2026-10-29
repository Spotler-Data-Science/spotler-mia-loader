/* ==================================================================
   52 · Glass dock (POC)
   Resting: a glass pill fixed to the bottom that types a question,
   holds it, erases it and types the next. Nothing from Botpress loads.
     arrow      → that question goes straight into the chat
     text area  → the card opens: greeting, buttons, empty text field
   The card holds the usual static preview and the live chat, so the
   hand-over is the production one.
   ================================================================== */
CSS.shell += CSS.shellglass;

function createDock(labels, handlers) {
  addStyle(CSS.dock);
  var arrowSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';

  var q = el("span", { id: "mia-dock-q" });
  var arrow = el("button", { "class": "mia-arrow", type: "button", "aria-label": "Send this question" });
  arrow.innerHTML = arrowSvg;
  var pill = el("div", { id: "mia-dock-pill", "class": "mia-glass", role: "button", tabindex: "0", "aria-label": labels.placeholder }, [q, arrow]);

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
  var card = el("div", { id: "mia-dock-card", "class": "mia-glass", role: "dialog", "aria-label": labels.title }, [head, body]);
  var dock = el("div", { id: "mia-dock" }, [card, pill]);
  document.body.appendChild(dock);

  // ---- the typing pill ----
  var prompts = SETTINGS.POC_PROMPTS, idx = 0, current = "", timer = null, running = false;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function next() { current = prompts[idx++ % prompts.length]; }
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
    if (running) return;
    running = true;
    if (still) { (function swap() { if (!running) return; next(); q.textContent = current; timer = setTimeout(swap, 4000); })(); return; }
    next(); type(0);
  }
  function stopTyping() { running = false; clearTimeout(timer); }

  function open() {
    if (dock.classList.contains("open")) return;
    stopTyping();
    dock.classList.add("open");
    if (handlers.onOpen) handlers.onOpen();
  }
  function close() {
    dock.classList.remove("open");
    startTyping();
  }

  arrow.addEventListener("click", function (e) {
    e.stopPropagation();
    var text = current;   // the whole question, even mid-typing
    open();
    if (handlers.onAsk) handlers.onAsk(text);
  });
  pill.addEventListener("click", function () { open(); if (handlers.onFocus) handlers.onFocus(); });
  pill.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); if (handlers.onFocus) handlers.onFocus(); } });
  closeBtn.addEventListener("click", close);
  restartBtn.addEventListener("click", function () { if (handlers.onRestart) handlers.onRestart(); });

  return {
    body: body,
    webchat: webchat,
    loading: loading,
    videoWidth: 380,
    open: open,
    close: close,
    isOpen: function () { return dock.classList.contains("open"); },
    setPrompts: function (list) { if (list && list.length) prompts = list; },
    startTyping: startTyping,
    setRow: function () {}
  };
}

// Glass look for the live chat too, so the hand-over stays in style.
var DOCK_LIVE_CSS =
  ".bpContainer{background:transparent !important;border:0 !important;box-shadow:none !important}" +
  ".bpMessageListMarqueeContainer,.bpMessageAvatarContainer{display:none !important}" +
  ".bpMessageListViewport{padding-left:20px !important;padding-right:20px !important}" +
  ".bpMessageContainer[data-direction=incoming] .bpMessageBlocksBubble{background:transparent !important;padding:0 !important;color:#0B1F4D !important;font-size:15px !important;line-height:23px !important;max-width:100% !important}" +
  ".bpMessageContainer[data-direction=outgoing] .bpMessageBlocksBubble{background:rgba(214,230,255,.85) !important;color:#0B1F4D !important;border-radius:18px !important}" +
  ".bpMessageBlocksButton{background:rgba(255,255,255,.55) !important;border:1px solid rgba(11,31,77,.14) !important;color:#0B1F4D !important;border-radius:999px !important}" +
  ".bpComposerContainer{background:rgba(255,255,255,.72) !important;border-radius:999px !important}" +
  ".bpComposerFooter{color:#5B6B8C !important}";

function glassLiveChat() {
  var tries = 0;
  (function attach() {
    var root = webchatShadow();
    if (!root) { if (++tries < 300) setTimeout(attach, 100); return; }
    if (root.querySelector && root.querySelector("style[data-mia-dock]")) return;
    var css = document.createElement("style");
    css.setAttribute("data-mia-dock", "");
    css.textContent = root === document.getElementById("bp-embedded-webchat")
      ? DOCK_LIVE_CSS.replace(/(^|\})([^{}]+)\{/g, function (m, end, sel) {
          return end + sel.split(",").map(function (s) { return "#bp-embedded-webchat " + s; }).join(",") + "{";
        })
      : DOCK_LIVE_CSS;
    (root.head || root).appendChild(css);
    log("glass styles on the live chat");
  })();
}
