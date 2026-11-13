/* The prompt library section of the preview page (runs in the frame's window and document). */
try { (function () {
  var L = window.MIA_LIBRARY, P = { mail: "Mail+", activate: "Activate" }, J = L.jobs;
  var NAMES = { context: "Context", task: "Task", details: "Details", prefs: "Preferences", review: "Review step", output: "Output" };
  var state = { p: "all", j: "all", all: false };
  var $ = function (id) { return document.getElementById(id); };
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  $("lib-anat").innerHTML = ["context", "task", "details", "prefs", "review", "output"].map(function (k, i) {
    return "<div><b>0" + (i + 1) + "</b><i>" + NAMES[k] + "</i><span>" + esc(L.parts[k].why) + "</span></div>"; }).join("");
  function seg(id, opts, key) {
    $(id).innerHTML = opts.map(function (o) { return '<button type="button" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("");
    [].forEach.call($(id).children, function (b) { b.addEventListener("click", function () { state[key] = b.getAttribute("data-v"); state.all = false; render(); }); });
  }
  seg("lib-prod", [["all", "All products"], ["mail", "Mail+"], ["activate", "Activate"]], "p");
  seg("lib-job", [["all", "All tasks"], ["campaign", J.campaign], ["audience", J.audience], ["plan", J.plan]], "j");
  function render() {
    [].forEach.call($("lib-prod").children, function (b) { b.classList.toggle("on", b.getAttribute("data-v") === state.p); });
    [].forEach.call($("lib-job").children, function (b) { b.classList.toggle("on", b.getAttribute("data-v") === state.j); });
    var list = L.items.filter(function (u) { return (state.p === "all" || u.p === state.p) && (state.j === "all" || u.j === state.j); });
    var shown = state.all ? list : list.slice(0, 6);
    $("lib-grid").innerHTML = shown.map(function (u, i) {
      return '<div class="lc" data-i="' + L.items.indexOf(u) + '"><div class="tg"><span>' + P[u.p] + "</span><span>" + J[u.j] + "</span></div><h4>" + esc(u.t) +
        '</h4><p class="d">' + esc(u.d) + '</p><div class="ac"><button type="button" class="sh">Show prompt</button><button type="button" class="cp">Copy</button></div><div class="pp">' +
        u.parts.map(function (x) { return '<div class="' + (x[0] === "review" ? "rv" : "") + '"><em>' + NAMES[x[0]] + "</em><q>" + esc(x[1]) + "</q></div>"; }).join("") + "</div></div>";
    }).join("");
    $("lib-all").style.display = list.length > 6 ? "" : "none";
    $("lib-all").textContent = state.all ? "Show fewer" : "Show all " + list.length + " prompts";
    [].forEach.call($("lib-grid").children, function (c) {
      var u = L.items[+c.getAttribute("data-i")];
      c.querySelector(".sh").addEventListener("click", function () { c.classList.toggle("open"); this.textContent = c.classList.contains("open") ? "Hide prompt" : "Show prompt"; });
      c.querySelector(".cp").addEventListener("click", function () {
        var b = this, t = u.parts.map(function (x) { return x[1]; }).join("\n\n");
        try { navigator.clipboard.writeText(t).then(function () { b.textContent = "Copied"; b.classList.add("done"); }, function () {}); } catch (e) {}
      });
    });
  }
  $("lib-all").addEventListener("click", function () { state.all = !state.all; render(); });
  $("lib-mia").addEventListener("click", function () { if (window.miaPreview) window.miaPreview.say("Write a prompt for me"); });
  render();
})(); } catch (e) {}
