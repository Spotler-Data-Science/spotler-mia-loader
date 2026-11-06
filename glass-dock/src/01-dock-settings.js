/* ==================================================================
   01 · Glass dock settings. Loaded after the shared 00-settings.
   Every region the production loader covers. The production loader's own
   settings are untouched.
   ================================================================== */
SETTINGS.VERSION = "glass-dock-1.9";

// The bot the dock talks to (the production loader's own setting is left
// alone). Ids: Botpress dashboard -> bot -> Webchat -> Share.
SETTINGS.BOT_ID = "7fd567ab-816f-4219-9588-ef0fbe77a342";
SETTINGS.CLIENT_ID = "877f50a2-6eee-4e43-99bd-eb9548fdf9c3";

// The dock's page table: a file in the site's own WordPress uploads, read
// from whatever host the page is on (spotler.com, www.spotler.com or
// staging), so it's always the same site and no CORS header is needed.
// Nothing else (no GitHub: the live tag never depends on a repository).
// Same format as config/config.json, plus the dock's fields (prompts, title,
// card description / icon). If it can't be read: the copy this browser saved
// on an earlier visit, else the built-in defaults (each region's greeting,
// cards and general questions; no page-specific questions).
// Updating it: replace the media file so the URL stays the same.
SETTINGS.DOCK_CONFIG_PATH = "/wp-content/uploads/2026/11/botpress-config.json";
SETTINGS.DOCK_CONFIG_URL = location.protocol + "//" + location.host + SETTINGS.DOCK_CONFIG_PATH;
SETTINGS.CONFIG_URLS = [SETTINGS.DOCK_CONFIG_URL];

// One font for the whole chat (fixed texts and the Botpress conversation):
// the Open Sans spotler.com already loads; no font of the tag's own.
SETTINGS.DOCK_FONT = "'Open Sans', sans-serif";

// What the pill types, one after the other, in the page's language, when
// the page table has no "prompts" for the page. On a page with its own row,
// that page's teaser comes first (the arrow sends its teaser_send).
// Each region's built-in greeting (used when the page table can't be read).
// No "Hi, I'm Mia" opening: the headline already says it, and the header
// ("Spotler AI Assistant") and footer ("AI assistant · Privacy") say it's AI.
// The old slide-out loader keeps its own wording (src/00-settings.js).
SETTINGS.DOCK_OPENERS = {
  "en": "I can answer questions about our products and help you book a demo, or make sure the right colleague follows up by email.",
  "nl": "Ik beantwoord vragen over onze producten, help je met een demo-afspraak of zorg dat de juiste collega je per e-mail opvolgt.",
  "de": "Ich beantworte Fragen zu unseren Produkten, helfe Ihnen, eine Demo zu buchen, oder sorge dafür, dass sich die richtige Ansprechperson per E-Mail bei Ihnen meldet.",
  "es": "Respondo preguntas sobre nuestros productos, te ayudo a reservar una demo o me aseguro de que la persona adecuada de nuestro equipo te escriba por email.",
  "sv": "Jag svarar på frågor om våra produkter, hjälper dig att boka en demo eller ser till att rätt kollega hör av sig till dig via e-post."
};
(function () {
  var lang = { "nl": "nl", "de-DE": "de", "es-ES": "es", "sv-SE": "sv" };
  SETTINGS.DEFAULT_ROWS.forEach(function (r) { r.opener = SETTINGS.DOCK_OPENERS[lang[r.region] || "en"]; });
})();

// How close to the end of the page (px) the resting pill slides away, so it
// doesn't cover the site's footer; scrolling back up brings it back.
SETTINGS.DOCK_AWAY_PX = 120;

SETTINGS.DOCK_PROMPTS = {
  en: ["How can Spotler help me?", "Which product fits a webshop?", "Can I book a demo this week?", "How does Spotler use AI?", "What does Spotler cost?"],
  nl: ["Hoe helpt Spotler mijn bedrijf?", "Wat past bij een webshop?", "Kan ik een demo boeken?", "Hoe gebruikt Spotler AI?", "Wat kost Spotler?"],
  de: ["Wie hilft Spotler meiner Firma?", "Was passt zu einem Onlineshop?", "Kann ich eine Demo buchen?", "Wie nutzt Spotler KI?", "Was kostet Spotler?"],
  es: ["¿Cómo me ayuda Spotler?", "¿Qué va bien para una tienda?", "¿Puedo reservar una demo?", "¿Cómo usa Spotler la IA?", "¿Cuánto cuesta Spotler?"],
  sv: ["Hur kan Spotler hjälpa mig?", "Vad passar en webbutik?", "Kan jag boka en demo?", "Hur använder Spotler AI?", "Vad kostar Spotler?"]
};
// The bar's text when the chat is closed with a demo booking still open.
SETTINGS.DOCK_CAL_RESUME = { en: "Finish booking your demo", nl: "Rond je demo-afspraak af", de: "Demo-Buchung abschließen",
                            es: "Termina de reservar tu demo", sv: "Slutför din demobokning" };
// Region → language of its questions (the other regions are English).
SETTINGS.DOCK_LANG = { "nl": "nl", "de-DE": "de", "es-ES": "es", "sv-SE": "sv" };
SETTINGS.DOCK_TYPE_MS = 80;       // per letter (a calm typing pace)
SETTINGS.DOCK_HOLD_MS = 4500;     // full question on screen
SETTINGS.DOCK_ERASE_MS = 30;      // per letter, deleting
SETTINGS.DOCK_GAP_MS = 700;       // empty pill between questions

// the visitor closed the chat: it stays closed when they move to another page
var CLOSED_KEY = "spotler_mia_dock_closed";
