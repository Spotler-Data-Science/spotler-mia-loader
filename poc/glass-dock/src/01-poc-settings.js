/* ==================================================================
   01 · POC settings (glass dock). Loaded after the shared 00-settings.
   A test only, for staging: every region the production loader covers.
   The production loader itself is untouched.
   ================================================================== */
SETTINGS.VERSION = "poc-glass-1.1";

// The POC's own page table, edited by hand: read first, with the production
// page table (SETTINGS.CONFIG_URLS) as the backup. Same format as
// config/config.json, plus the POC's fields (prompts, title, card
// description / icon). For now it's poc/glass-dock/config.json in GitHub;
// later the file on spotler.com: "https://marketing.spotler.com/botpress/config.json"
// (its server must send Access-Control-Allow-Origin for spotler.com).
SETTINGS.POC_CONFIG_URL = "https://raw.githubusercontent.com/Spotler-Data-Science/spotler-mia-loader/refs/heads/poc-glass-1.1/poc/glass-dock/config.json";

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
// Region → language of its questions (the other regions are English).
SETTINGS.POC_LANG = { "nl": "nl", "de-DE": "de", "es-ES": "es", "sv-SE": "sv" };
SETTINGS.POC_TYPE_MS = 80;       // per letter (a calm typing pace)
SETTINGS.POC_HOLD_MS = 4500;     // full question on screen
SETTINGS.POC_ERASE_MS = 30;      // per letter, deleting
SETTINGS.POC_GAP_MS = 700;       // empty pill between questions

// The chat's font: Open Sans, which spotler.com already loads (no download
// here). Used for the dock, the start screen, the preview and the live chat.
SETTINGS.POC_FONT = '"Open Sans", sans-serif';

// Privacy link per region (UK, NL and INT keep the shared loader's). en-DE
// and en-AU get their own copy of the INT labels, so INT is unchanged.
(function () {
  function copy(o) { var c = {}, k; for (k in o) if (o.hasOwnProperty(k)) c[k] = o[k]; return c; }
  var L = SETTINGS.LABELS;
  L["en-DE"] = copy(L["int"]); L["en-AU"] = copy(L["int"]);
  L["de-DE"].privacyUrl = "https://spotler.com/de-de/datenschutzerklaerung";
  L["en-DE"].privacyUrl = "https://spotler.com/en-de/privacy-statement";
  L["es-ES"].privacyUrl = "https://spotler.com/es-es/politica-de-privacidad";
  L["sv-SE"].privacyUrl = "https://spotler.com/sv-se/privacy-statement";
  L["en-AU"].privacyUrl = "https://spotler.com/en-au/privacy-statement";
})();

// The greeting when no page table can be read (the built-in rows): Mia
// helps, and makes sure the right colleague follows up by email. The same
// text as the default rows in poc/glass-dock/config.json.
SETTINGS.POC_OPENERS = {
  en: "Hi, I’m Mia, Spotler’s AI assistant. I can answer questions about our products, help you book a demo, or make sure the right colleague follows up by email.",
  nl: "Hoi, ik ben Mia, de AI-assistent van Spotler. Ik beantwoord vragen over onze producten, help je met een demo-afspraak of zorg dat de juiste collega per e-mail contact met je opneemt.",
  de: "Hallo, ich bin Mia, die KI-Assistentin von Spotler. Ich beantworte Fragen zu unseren Produkten, helfe Ihnen, eine Demo anzufordern, oder sorge dafür, dass sich die passende Ansprechperson per E-Mail bei Ihnen meldet.",
  es: "Hola, soy Mia, la asistente de IA de Spotler. Respondo preguntas sobre nuestros productos, te ayudo a solicitar una demo o me encargo de que la persona adecuada del equipo te contacte por email.",
  sv: "Hej, jag är Mia, Spotlers AI-assistent. Jag svarar på frågor om våra produkter, hjälper dig att boka en demo eller ser till att rätt kollega hör av sig till dig via e-post."
};
(function () {
  var rows = SETTINGS.DEFAULT_ROWS, i;
  for (i = 0; i < rows.length; i++) {
    if (rows[i].url_match === "*") rows[i].opener = SETTINGS.POC_OPENERS[SETTINGS.POC_LANG[rows[i].region] || "en"];
  }
})();
