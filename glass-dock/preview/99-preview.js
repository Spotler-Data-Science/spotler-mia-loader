/* ==================================================================
   99 · Preview (the GTM plan page's render, not a tag). The real dock,
   showcase and glass conversation from the tag, on a fake spotler.com
   page; Botpress can't run there, so Mia's answers are scripted here,
   from the Spotler MCP knowledge base.
   ================================================================== */
(function () {
  if (window.MIA_PREVIEW_AVATAR) SETTINGS.AVATAR_URL = window.MIA_PREVIEW_AVATAR;
  var labels = SETTINGS.LABELS["en-GB"];
  labels.calResume = SETTINGS.DOCK_CAL_RESUME.en;
  var sc = window.SpotlerMiaShowcase && window.SpotlerMiaShowcase.builtIn("/services");
  var H = { el: el, SS: SS, addStyle: addStyle, trim: trim };
  var ui, shell = null, show = null, busy = false, lastPrompt = "";

  var PROMPT_CSS =
    ".pc{position:relative;max-width:560px;padding:14px 16px 12px;border-radius:18px;background:#fff;border:1px solid rgba(0,98,255,.22);" +
    "box-shadow:0 0 0 4px rgba(0,98,255,.05),0 14px 34px rgba(0,98,255,.16)}" +
    ".pc .pc-h{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:13px;font-weight:700;color:#0047CC}" +
    ".pc .pc-h button{margin-left:auto;padding:4px 10px;border:0;border-radius:999px;background:rgba(0,98,255,.08);color:#0047CC;font:inherit;font-size:12px;font-weight:700;cursor:pointer}" +
    ".pc .pc-h button.done{background:rgba(31,122,62,.12);color:#1F7A3E}" +
    ".pc p{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13.5px;line-height:21px;color:#1B3A57;white-space:pre-wrap}" +
    ".stand{display:flex;align-items:center;gap:10px;min-width:260px;padding:16px 18px;border-radius:16px;background:#DCE4EE;color:#4A5F78;font-size:14px;font-weight:600}" +
    ".stand i{width:28px;height:28px;border-radius:8px;background:#C3D0DE;flex:0 0 auto}" +
    ".b ul{margin:6px 0 0;padding-left:18px}.b li{margin:3px 0}";

  // --- the scripted Mia ----------------------------------------------------
  var PRODUCTS = [
    [/e-?mail|newsletter|mailing|subject line|invitation|webinar/i, "Mail+"],
    [/journey|cart|basket|audience|popup|product set|personali[sz]|segment/i, "Activate"],
    [/survey|nps|score|feedback|review/i, "FeedbackPro"],
    [/pipeline|opportunit|contact|deal|crm|account/i, "CRM"]
  ];
  function productFor(t) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i][0].test(t)) return PRODUCTS[i][1]; return ""; }
  function promptFor(goal) {
    goal = trim(goal).replace(/[.!?]+$/, "");
    for (var i = 0; sc && i < sc.slides.length; i++) if (sc.slides[i].goal && sc.slides[i].goal.replace(/[.!?]+$/, "") === goal) return sc.slides[i].prompt;
    var p = productFor(goal), g = goal.replace(/^(i want to|i'd like to|i would like to|help me|can you|please)\s+/i, "");
    g = g.charAt(0).toLowerCase() + g.slice(1);
    return (p ? "In Spotler " + p + ", " : "Using the Spotler MCP, ") + g + ". Use my account data, keep anything you create as a draft, and show me your plan first and wait for my go-ahead.";
  }
  var ABOUT = { texts: [
      "The Spotler MCP is a secure connector. It lets AI assistants such as Claude and ChatGPT work with your Spotler account, in plain words.",
      "Ask questions about your live data, prepare emails, journeys, records and surveys as drafts, and check results. Each product has its own connection, with the same permissions as your own login."],
    buttons: ["Show me examples", "Is my data safe?", "Book a walkthrough"] };
  var EXAMPLES = { texts: ["Here are a few things people ask, by product:"],
    list: ["Mail+: “Create a draft webinar invitation in the style of my last newsletter.”",
           "Activate: “Why did my abandoned cart journey stop getting new people?”",
           "FeedbackPro: “Why did our score drop this month?”",
           "CRM: “What is our pipeline value by stage?”"],
    buttons: ["Write a prompt for me", "What can I use it for?"] };
  var USES = { texts: ["Most people start with one of these:"],
    list: ["Turning a brief into a draft email in Mail+", "Finding where a journey loses people in Activate",
           "Explaining a score change in FeedbackPro", "Health checks and reports across the accounts you manage"],
    buttons: ["Show me examples", "Write a prompt for me"] };
  var SAFE = { texts: ["Yes. You sign in with your own Spotler login, and the MCP only gets the permissions you already have.",
      "It prepares and analyses: it never sends to your audience by itself, and changes that can’t be undone always need your confirmation."],
    buttons: ["What can I use it for?", "Book a walkthrough"] };
  var PRICE = { texts: ["The MCP is part of each product and works with your existing login. The FeedbackPro MCP is free of charge; for the others, your account manager can tell you what’s included in your plan."],
    buttons: ["Book a walkthrough", "Show me examples"] };
  var BOOK = { texts: ["Great. Pick a time that suits you, and we’ll walk you through the Spotler MCP with one of your own goals."],
    stand: "Booking calendar opens here, inside the chat", buttons: [] };
  var ASK = { texts: ["Tell me what you want to achieve, in your own words, and I’ll write the prompt for Spot to run."], buttons: [] };

  function answer(text) {
    var g = /^generate my prompt:\s*(.+)$/i.exec(text);
    if (g || (/^shorter|make it shorter$/i.test(text) && lastPrompt)) {
      var p = g ? promptFor(g[1]) : lastPrompt.split(/(?<=\.)\s/)[0] + " Show me your plan first and wait for my go-ahead.";
      lastPrompt = p;
      return { texts: [g ? "Here’s a prompt for Spot. Copy it into Spot, or any AI tool connected through the Spotler MCP:" : "A shorter version:"],
        prompt: p, buttons: g ? ["Make it shorter", "Try another goal", "Book a walkthrough"] : ["Try another goal", "Book a walkthrough"] };
    }
    if (/what is|how does it work|what('|’)?s an mcp|explain/i.test(text)) return ABOUT;
    if (/example/i.test(text)) return EXAMPLES;
    if (/use (it|the spotler mcp) for|use cases?/i.test(text)) return USES;
    if (/safe|secur|privacy|data|permission/i.test(text)) return SAFE;
    if (/price|cost|pay|plan/i.test(text)) return PRICE;
    if (/book|walkthrough|demo|talk to/i.test(text)) return BOOK;
    if (/write a prompt|another goal|generate/i.test(text)) return ASK;
    if (text.split(/\s+/).length >= 4) return answer("Generate my prompt: " + text);
    return { texts: ["I can explain the Spotler MCP, show examples, or turn your goal into a prompt for Spot."], buttons: ["What is the Spotler MCP?", "Show me examples", "Write a prompt for me"] };
  }

  // --- the conversation, in the tag's own glass bubbles ----------------------
  function say(text) {
    text = trim(text);
    if (!text || busy) return;
    if (show) { show.hide(); show = null; }
    if (!ui.isOpen()) ui.open();
    busy = true;
    shell.showUser(text);
    var r = answer(text);
    setTimeout(function () { shell.showTyping(); }, 750);   // after the "Delivered" line (600ms)
    setTimeout(function () {
      shell.showReply([{ texts: r.texts, buttons: r.buttons }]);
      var root = shell.host.shadowRoot, grows = root.querySelectorAll(".grow"), g = grows[grows.length - 1];
      // extras (prompt card, stand-in) go under the first bubble: wrap a lone bubble in a column
      var b1 = g && g.querySelector(".b");
      if (b1 && (r.prompt || r.stand) && !b1.parentNode.classList.contains("col")) {
        var colw = el("div", { "class": "col" }); b1.parentNode.insertBefore(colw, b1); colw.appendChild(b1);
      }
      if (r.list && g) {
        var ul = el("ul"); r.list.forEach(function (t) { ul.appendChild(el("li", { text: t })); });
        g.querySelector(".b").appendChild(ul);
      }
      if (r.prompt && g) {
        var copy = el("button", { type: "button", text: "Copy" });
        copy.addEventListener("click", function () {
          try { navigator.clipboard.writeText(r.prompt).then(function () { copy.textContent = "Copied"; copy.classList.add("done"); }, function () {}); } catch (e) {}
        });
        var card = el("div", { "class": "pc" }, [el("div", { "class": "pc-h" }, [el("span", { text: "Prompt for Spot" }), copy]), el("p", { text: r.prompt })]);
        var first = g.querySelector(".b");
        first.parentNode.insertBefore(card, first.nextSibling);
      }
      if (r.stand && g) {
        var b0 = g.querySelector(".b");
        b0.parentNode.insertBefore(el("div", { "class": "stand" }, [el("i"), el("span", { text: r.stand })]), b0.nextSibling);
      }
      if (g) [].forEach.call(g.querySelectorAll(".btn"), function (b) {
        b.disabled = false;
        b.addEventListener("click", function () { say(b.textContent === "Write a prompt for me" ? "Write a prompt for me" : b.textContent); });
      });
      busy = false;
    }, 1800);
  }

  function mount() {
    if (shell && shell.host.parentNode) shell.host.parentNode.removeChild(shell.host);
    var host = el("div", { id: "spotler-mia-shell" });
    host.style.setProperty("--mia-font", SETTINGS.DOCK_FONT);
    ui.body.insertBefore(host, ui.body.firstChild);
    shell = createShell(host, labels, { opener: "", buttons: [] }, { onSend: say, onOpen: function () {}, onQueue: function () {} });
    addStyle(PROMPT_CSS, host.shadowRoot);
    busy = false; lastPrompt = "";
    if (show && show.el.parentNode) show.el.parentNode.removeChild(show.el);
    show = sc ? window.SpotlerMiaShowcase.create(ui.body, sc, function (t) { say(t); }, H) : null;
  }

  onDomReady(function () {
    addStyle(CSS.common);
    ui = createDock(labels, {
      onAsk: function (t) { say(t); },
      onSend: function (t) { say(t); return true; },
      onLayout: function () { if (show) show.fit(); },
      onRestart: function () { mount(); }
    });
    ui.setPrompts(["What is the Spotler MCP?", "Is my data safe with the MCP?", "Show me MCP examples", "Book an MCP walkthrough"]);
    if (sc) { window.SpotlerMiaShowcase.apply(ui, sc, H); }
    mount();
    ui.startTyping();
  });
})();
