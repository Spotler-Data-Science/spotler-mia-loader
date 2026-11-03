/* ==================================================================
   53 · Start screen (POC)
   Before the first message the open chat shows a start screen instead
   of an empty chat: a headline, the greeting, option cards and a few
   "others often ask" questions. Everything comes from the page's row
   (page table / marketing file), per page and language:
     title                headline (default: "Hello, I'm Mia" per language)
     opener               the greeting under it (must say Mia is an AI assistant)
     buttons[]            the cards: label, send, and optionally
                            description  the grey line under the label
                            icon         calendar | pricing | support | explore |
                                         product | chat | mail | document | none,
                                         or a picture: an https:// link (png, svg, jpg)
     prompts              the first three become "others often ask"
   A card without description or icon gets one picked from its wording.
   ================================================================== */
var START_ICONS = {
  calendar: ["M8 3v4", "M16 3v4", "M3 10h18", "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"],
  pricing: ["M12 3 21 8 12 13 3 8z", "M3 12.5l9 5 9-5", "M3 16.5l9 5 9-5"],
  support: ["M4 14v-2a8 8 0 0 1 16 0v2", "M4 14h3v6H5a1 1 0 0 1-1-1z", "M20 14h-3v6h2a1 1 0 0 0 1-1z"],
  explore: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "m15.5 8.5-2 5-5 2 2-5z"],
  product: ["M21 8 12 3 3 8v8l9 5 9-5z", "M3 8l9 5 9-5", "M12 13v8"],
  chat: ["M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"],
  mail: ["M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "m3 7 9 6 9-6"],
  document: ["M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z", "M14 3v5h5"]
};

// Defaults per language: the headline, the "others often ask" heading, and a
// description for each kind of card.
SETTINGS.POC_START = {
  en: { title: "Hello, I’m Mia", others: "Others often ask",
        calendar: "Meet one of our product experts", pricing: "Compare our packages", support: "Get help and find answers", explore: "See what Spotler can do for you" },
  nl: { title: "Hoi, ik ben Mia", others: "Anderen vragen vaak",
        calendar: "Met een van onze productexperts", pricing: "Vergelijk onze pakketten", support: "Hulp en antwoorden", explore: "Ontdek wat Spotler voor je kan doen" },
  de: { title: "Hallo, ich bin Mia", others: "Andere fragen oft",
        calendar: "Mit einem unserer Produktexperten", pricing: "Unsere Pakete im Vergleich", support: "Hilfe und Antworten", explore: "Was Spotler für Sie tun kann" },
  es: { title: "Hola, soy Mia", others: "Otros suelen preguntar",
        calendar: "Con uno de nuestros expertos en producto", pricing: "Compara nuestros paquetes", support: "Ayuda y respuestas", explore: "Descubre lo que Spotler puede hacer por ti" },
  sv: { title: "Hej, jag är Mia", others: "Andra frågar ofta",
        calendar: "Med en av våra produktexperter", pricing: "Jämför våra paket", support: "Hjälp och svar", explore: "Se vad Spotler kan göra för dig" }
};

// A card's kind from its wording, in any of the site languages.
function guessIcon(text) {
  var t = String(text || "").toLowerCase();
  if (/demo|meeting|afspraak|termin|reuni|möte|boka/.test(t)) return "calendar";
  if (/pric|cost|preis|prijs|prijz|kost|precio|pris/.test(t)) return "pricing";
  if (/support|help|hilfe|ondersteun|soporte|hjälp/.test(t)) return "support";
  return "explore";
}

function startIcon(name) {
  if (/^https:\/\//.test(name)) {
    return el("span", { "class": "mia-ico i-img", "aria-hidden": "true" }, [el("img", { src: name, alt: "" })]);
  }
  var paths = START_ICONS[name];
  var box = el("span", { "class": "mia-ico i-" + name, "aria-hidden": "true" });
  if (!paths) return box;
  var svg = '<svg viewBox="0 0 24 24">';
  for (var i = 0; i < paths.length; i++) svg += '<path d="' + paths[i] + '"/>';
  box.innerHTML = svg + "</svg>";
  return box;
}

// Builds the start screen into `parent`. onPick(text, source) sends a
// card's or a question's message. Returns { el, hide }.
function createStart(parent, row, lang, prompts, onPick) {
  var L = SETTINGS.POC_START[lang] || SETTINGS.POC_START.en;
  var screen = el("div", { id: "mia-start" });

  var intro = el("div", { "class": "mia-intro" }, [el("h2", { text: row.title || L.title })]);
  String(row.opener || "").split(/\n\s*\n/).map(trim).filter(Boolean).forEach(function (p) {
    intro.appendChild(el("p", { text: p }));
  });
  screen.appendChild(intro);

  if (row.buttons && row.buttons.length) {
    var cards = el("div", { "class": "mia-cards" });
    row.buttons.slice(0, 6).forEach(function (b) {
      var send = b.send || b.label;
      var kind = b.icon || guessIcon(b.label + " " + send);
      var desc = b.description != null ? b.description : (L[kind] || "");
      var card = el("button", { "class": "mia-card", type: "button" }, [
        kind === "none" ? null : startIcon(kind),
        el("span", { "class": "mia-t" }, [el("b", { text: b.label }), desc ? el("span", { text: desc }) : null])
      ]);
      card.insertAdjacentHTML("beforeend", '<svg class="mia-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>');
      card.addEventListener("click", function () { onPick(send, "button"); });
      cards.appendChild(card);
    });
    screen.appendChild(cards);
  }

  var asks = (prompts || []).slice(0, 3);
  if (asks.length) {
    var chips = el("div", { "class": "mia-chips" });
    asks.forEach(function (p) {
      var text = typeof p === "string" ? p : p.text, send = typeof p === "string" ? p : (p.send || p.text);
      var chip = el("button", { "class": "mia-chip", type: "button", text: text });
      chip.addEventListener("click", function () { onPick(send, "button"); });
      chips.appendChild(chip);
    });
    screen.appendChild(el("div", { "class": "mia-ask" }, [el("h3", { text: L.others }), chips]));
  }

  parent.appendChild(screen);

  // No scrolling on first open: if it doesn't fit, step down until it does
  // (3rd question goes, card lines go, the questions go, extra greeting
  // paragraphs go, a smaller headline). Re-fitted whenever its size settles.
  var FIT = 5;
  function fit() {
    for (var i = 1; i <= FIT; i++) screen.classList.remove("fit-" + i);
    if (!screen.clientHeight) return;
    for (var l = 1; l <= FIT && screen.scrollHeight > screen.clientHeight + 1; l++) screen.classList.add("fit-" + l);
  }
  var fitTimer;
  function refit() { clearTimeout(fitTimer); fitTimer = setTimeout(fit, 120); }   // after the open animation
  if (window.ResizeObserver) new ResizeObserver(refit).observe(screen);
  else window.addEventListener("resize", refit);
  refit();

  return {
    el: screen,
    fit: function () { clearTimeout(fitTimer); fit(); },
    hide: function () {
      if (!screen.parentNode) return;
      screen.classList.add("going");
      setTimeout(function () { if (screen.parentNode) screen.parentNode.removeChild(screen); }, 220);
    }
  };
}
