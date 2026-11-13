/* 98 · Preview only. A box's position on the preview's own screen. Drawn inline in the plan page,
   the preview is a scaled box somewhere on that page: window.__viewOrigin gives its corner and scale.
   Opened on its own, it is the real window and this is just getBoundingClientRect. */
function viewRect(n) {
  var r = n.getBoundingClientRect(), o = window.__viewOrigin && window.__viewOrigin();
  if (!o) return r;
  return { top: (r.top - o.top) / o.k, bottom: (r.bottom - o.top) / o.k, left: (r.left - o.left) / o.k, right: (r.right - o.left) / o.k,
           width: r.width / o.k, height: r.height / o.k };
}
