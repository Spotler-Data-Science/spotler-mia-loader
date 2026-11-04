/* ==================================================================
   01 · POC settings (glass dock). Loaded after the shared 00-settings.
   Every region the production loader covers. The production loader's own
   settings are untouched.
   ================================================================== */
SETTINGS.VERSION = "poc-glass-1.0";

// The bot the dock talks to (the production loader's own setting is left
// alone). Ids: Botpress dashboard -> bot -> Webchat -> Share.
SETTINGS.BOT_ID = "7fd567ab-816f-4219-9588-ef0fbe77a342";
SETTINGS.CLIENT_ID = "877f50a2-6eee-4e43-99bd-eb9548fdf9c3";

// The dock's page table: marketing's file on spotler.com, read first, with
// the production page table (SETTINGS.CONFIG_URLS, GitHub) as the backup.
// Same format as config/config.json, plus the dock's fields (prompts,
// title, card description / icon). Its server must allow www.spotler.com to
// read it (Access-Control-Allow-Origin).
SETTINGS.POC_CONFIG_URL = "https://marketing.spotler.com/botpress/config.json";

// What the pill types, one after the other, in the page's language, when
// the page table has no "prompts" for the page. On a page with its own row,
// that page's teaser comes first (the arrow sends its teaser_send).
SETTINGS.POC_PROMPTS = {
  en: ["How can Spotler help my business?", "Which Spotler product fits an online shop?", "Can I book a demo this week?",
       "How does Spotler use AI in email marketing?", "What does Spotler cost?"],
  nl: ["Hoe kan Spotler mijn bedrijf helpen?", "Welk Spotler-product past bij een webshop?", "Kan ik deze week een demo boeken?",
       "Hoe gebruikt Spotler AI in e-mailmarketing?", "Wat kost Spotler?"],
  de: ["Wie kann Spotler meinem Unternehmen helfen?", "Welches Spotler-Produkt passt zu einem Onlineshop?", "Kann ich diese Woche eine Demo buchen?",
       "Wie nutzt Spotler KI im E-Mail-Marketing?", "Was kostet Spotler?"],
  es: ["¿Cómo puede Spotler ayudar a mi empresa?", "¿Qué producto de Spotler encaja con una tienda online?", "¿Puedo reservar una demo esta semana?",
       "¿Cómo usa Spotler la IA en el email marketing?", "¿Cuánto cuesta Spotler?"],
  sv: ["Hur kan Spotler hjälpa mitt företag?", "Vilken Spotler-produkt passar en webbutik?", "Kan jag boka en demo den här veckan?",
       "Hur använder Spotler AI i e-postmarknadsföring?", "Vad kostar Spotler?"]
};
// The bar's text when the chat is closed with a demo booking still open.
SETTINGS.POC_CAL_RESUME = { en: "Finish booking your demo", nl: "Rond je demo-afspraak af", de: "Demo-Buchung abschließen",
                            es: "Termina de reservar tu demo", sv: "Slutför din demobokning" };
// Region → language of its questions (the other regions are English).
SETTINGS.POC_LANG = { "nl": "nl", "de-DE": "de", "es-ES": "es", "sv-SE": "sv" };
SETTINGS.POC_TYPE_MS = 80;       // per letter (a calm typing pace)
SETTINGS.POC_HOLD_MS = 4500;     // full question on screen
SETTINGS.POC_ERASE_MS = 30;      // per letter, deleting
SETTINGS.POC_GAP_MS = 700;       // empty pill between questions

// the visitor closed the chat: it stays closed when they move to another page
var CLOSED_KEY = "spotler_mia_dock_closed";
