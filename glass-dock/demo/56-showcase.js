/* ==================================================================
   56 · Showcase hook (demo build only). The showcase itself is a second
   GTM tag (glass-dock/addon, built as ...demo-showcase.gtm.html): this
   keeps the page table's showcase object and hands it to that tag.
   Without the add-on, the page gets the normal start screen.
   ================================================================== */
SETTINGS.VERSION += "-demo";

function cleanShowcase(o) {
  try {
    var s = JSON.stringify(o);
    if (!s || s.length > 60000) return null;
    o = JSON.parse(s);
    return o && o.slides instanceof Array && o.slides.length ? o : null;
  } catch (e) { return null; }
}
var SHOWCASE_HELPERS = { el: el, SS: SS, addStyle: addStyle, trim: trim };
function showcaseAddon() { var a = window.SpotlerMiaShowcase; return a && a.apply && a.create ? a : null; }
// The page's showcase: the page table's if its row has one, else the add-on's built-in one for this page
function showcaseFor(row, a) {
  if (row.showcase) return row.showcase;
  return a && a.builtIn ? cleanShowcase(a.builtIn(location.pathname)) : null;
}
// The add-on fires before this tag (GTM tag sequencing); if it's late, wait
// for it up to 5s, then swap the start screen for the showcase.
function applyShowcase(ui, row, remount) {
  var tries = 0;
  (function go() {
    var a = showcaseAddon(), sc;
    if (a) {
      if (!(sc = showcaseFor(row, a))) return;
      row.showcase = sc;
      a.apply(ui, sc, SHOWCASE_HELPERS);
      if (tries && document.getElementById("mia-start") && remount) remount();
      return;
    }
    if (++tries <= 50) setTimeout(go, 100); else log("showcase add-on not found");
  })();
}
function createShowcase(parent, row, onSend) {
  var a = showcaseAddon(), sc = a && showcaseFor(row, a);
  return sc ? a.create(parent, sc, onSend, SHOWCASE_HELPERS) : null;
}
