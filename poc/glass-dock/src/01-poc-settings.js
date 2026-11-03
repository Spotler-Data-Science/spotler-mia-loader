/* ==================================================================
   01 · POC settings (glass dock). Loaded after the shared 00-settings.
   A test only, for staging: every region the production loader covers.
   The production loader itself is untouched.
   ================================================================== */
SETTINGS.VERSION = "poc-glass-0.36";

// The POC's own page table, edited by hand: read first, with the production
// page table (SETTINGS.CONFIG_URLS) as the backup. Same format as
// config/config.json, plus the POC's fields (prompts, title, card
// description / icon). For now it's poc/glass-dock/config.json in GitHub;
// later the file on spotler.com: "https://marketing.spotler.com/botpress/config.json"
// (its server must send Access-Control-Allow-Origin for spotler.com).
SETTINGS.POC_CONFIG_URL = "https://raw.githubusercontent.com/Spotler-Data-Science/spotler-mia-loader/refs/heads/claude/new-session-bl4psv/poc/glass-dock/config.json";

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
