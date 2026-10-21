// Minimal stand-in for Botpress webchat v3.7 inject.js (tests only).
(function () {
  var handlers = {};
  var log = window.__bpLog = [];
  window.__bpEmit = function (name, arg) { emit(name, arg); };
  function emit(name, arg) { (handlers[name] || []).forEach(function (fn) { try { fn(arg); } catch (e) { console.error(e); } }); }
  function clientKey() { return "bp-webchat-test-client-client"; }
  var root, list;
  function addMsg(dir, text) {
    var m = document.createElement("div");
    m.className = "bpReset bpMessageContainer";
    m.setAttribute("data-direction", dir);
    m.innerHTML = '<div class="bpMessageBlocksBubble"><p class="bpMessageBlocksTextText"></p></div>';
    m.querySelector("p").textContent = text;
    list.appendChild(m);
  }
  function newConv() { return "conv_" + Math.random().toString(36).slice(2, 10); }
  var convId = null, initialized = false;
  // Like v3.7: init is read-only, a second init is ignored, and the chat is
  // embedded only when configuration.embeddedChatId names an element (else
  // it would be the floating button, which never reaches the tag).
  window.botpress = {
    on: function (n, fn) { log.push(["on", n]); (handlers[n] = handlers[n] || []).push(fn); },
    __init: function (props) {
      if (initialized) { log.push(["init ignored"]); return Promise.resolve(); }
      initialized = true;
      var raw = (props && props.configuration) || {};
      log.push(["init", JSON.stringify(raw)]);
      log.push(["initProps", JSON.stringify({ botId: props.botId, clientId: props.clientId, selector: props.selector })]);
      // Like v3.7's versioned schema: without version "v2" the object is a
      // legacy v0 config that keeps only these keys (no embeddedChatId).
      var cfg = raw;
      if (raw.version !== "v2") {
        cfg = {};
        ["botName", "botDescription", "composerPlaceholder", "color", "radius", "fontFamily", "showPoweredBy", "storageLocation"].forEach(function (k) {
          if (raw.hasOwnProperty(k)) cfg[k] = raw[k];
        });
        if (raw.showPoweredBy === false) cfg.footer = "";
      }
      var host = cfg.version === "v2" && cfg.embeddedChatId && document.getElementById(cfg.embeddedChatId);
      if (!host) {
        log.push(["fab"]);
        var fab = document.createElement("div"); fab.id = "fab-root"; fab.className = "bpChatContainer";
        document.body.appendChild(fab);
        return Promise.resolve();
      }
      // Like v3.7 with a v2 config: an unnamed host (no #webchat-root), a
      // header bar with the bot's tagline and a close button, and an intro
      // in the empty chat. window.__bpRender picks where it renders:
      // "shadow" (default), "iframe" (same origin) or "light" (no shadow).
      // window.__bpHeaderClass renames the header bar (the tag must then
      // find it by shape).
      root = document.createElement("div");
      var mode = window.__bpRender || "shadow", sr;
      if (mode === "iframe") {
        var fr = document.createElement("iframe"); fr.style.cssText = "border:0;width:100%;height:100%";
        host.appendChild(fr);
        sr = fr.contentDocument.body; sr.style.margin = "0";
      } else {
        host.appendChild(root);
        sr = mode === "light" ? root : root.attachShadow({ mode: "open" });
      }
      window.__bpShadow = sr;
      var hc = window.__bpHeaderClass || "bpHeaderContainer";
      sr.innerHTML = '<div class="bpContainer" style="height:100%;background:#fdfdfd;font:14px sans-serif;border-radius:16px;overflow:hidden">' +
        '<div class="' + hc + '" style="display:flex;align-items:center;gap:8px;height:56px;padding:0 12px"><b></b> <span class="desc"></span><button aria-label="close"><svg width="12" height="12"></svg></button></div>' +
        '<div class="list" style="padding:12px"><div class="bpIntro"><b class="introName"></b><span class="introDesc"></span></div><div class="bpReset bpMessageContainer bpDate" data-direction="system" style="margin-top:16px;font-size:12px;line-height:16px"><span>Today</span></div></div>' +
        '<textarea class="bpComposer"></textarea><div class="bpFooter"></div></div>';
      sr.querySelector(".introName").textContent = cfg.botName || "";
      sr.querySelector(".introDesc").textContent = cfg.botDescription || "";
      list = sr.querySelector(".list");
      sr.querySelector("." + hc + " b").textContent = cfg.botName || "";
      sr.querySelector(".desc").textContent = cfg.botDescription || "";
      sr.querySelector(".bpComposer").setAttribute("placeholder", cfg.composerPlaceholder || "");
      var ft = sr.querySelector(".bpFooter"), md = cfg.footer || "", re = /\[([^\]]+)\]\(([^)]+)\)/g, last = 0, mm;
      while ((mm = re.exec(md))) {
        ft.appendChild(document.createTextNode(md.slice(last, mm.index)));
        var a = document.createElement("a"); a.href = mm[2]; a.textContent = mm[1]; ft.appendChild(a); last = re.lastIndex;
      }
      ft.appendChild(document.createTextNode(md.slice(last)));
      setTimeout(function () { emit("webchat:initialized"); }, 50);
      setTimeout(function () {
        var stored = JSON.parse(localStorage.getItem(clientKey()) || "null") || { state: { user: { userId: "u1" } }, version: 1 };
        if (stored.state.conversationId) { convId = stored.state.conversationId; log.push(["resume", convId]); }
        else { convId = newConv(); stored.state.conversationId = convId; localStorage.setItem(clientKey(), JSON.stringify(stored)); log.push(["new", convId]); }
        emit("conversation", convId);
        setTimeout(function () { emit("webchat:ready"); }, 100);
      }, 150);
      return Promise.resolve();
    },
    updateUser: function (u) { log.push(["updateUser", JSON.stringify(u.data)]); return Promise.resolve(); },
    sendEvent: function (e) { log.push(["sendEvent", JSON.stringify(e)]); if (e.type === "language" && !e.__quiet && !window.__skipGreeting) { addMsg("incoming", "Greeting from Botpress"); } return Promise.resolve(); },
    sendMessage: function (t) {
      log.push(["sendMessage", t]);
      setTimeout(function () { addMsg("outgoing", t); var d = document.createElement("span"); d.className = "bpStatus"; d.textContent = "Delivered"; list.appendChild(d); emit("message", { text: t }); }, 200);
      // Like v3.7: the typing dots are an incoming message of their own
      // until the reply replaces them.
      var typing;
      setTimeout(function () {
        typing = document.createElement("div");
        typing.className = "bpReset bpMessageContainer"; typing.setAttribute("data-direction", "incoming");
        typing.innerHTML = '<div class="bpTypingIndicatorContainer" style="height:30px;width:48px"><div class="bpTypingIndicatorLoader"></div></div>';
        list.appendChild(typing);
      }, 250);
      setTimeout(function () {
        if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
        addMsg("incoming", window.__replyText || ("Bot reply to: " + t)); emit("message", { text: "reply" });
      }, window.__replyDelay || 700);
      return Promise.resolve();
    },
    restartConversation: function () {
      log.push(["restartConversation"]);
      list.innerHTML = "";
      convId = newConv();
      var stored = JSON.parse(localStorage.getItem(clientKey()) || "null") || { state: { user: { userId: "u1" } } };
      stored.state.conversationId = convId; localStorage.setItem(clientKey(), JSON.stringify(stored));
      setTimeout(function () { emit("conversation", convId); }, 100);
      return Promise.resolve();
    }
  };
  Object.defineProperty(window.botpress, "init", { value: window.botpress.__init, writable: false });
})();
