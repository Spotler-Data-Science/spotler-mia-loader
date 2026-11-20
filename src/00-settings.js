/* ==================================================================
   00 · Settings
   Everything a person might need to change in code lives here.
   Page openers, buttons, teasers and display modes do NOT live here:
   they come from config.json (the n8n page table). DEFAULT_ROWS below
   are only the fallback used when config.json can't be loaded.
   ================================================================== */
var SETTINGS = {
  VERSION: "1.6.9",

  // ---- Page table (published by n8n) ----
  // Tried in order. GitHub's own copy is live within ~5 minutes of a commit;
  // jsDelivr's @main alias can stay on an old commit for hours even after a
  // purge, so it is only the backup.
  // CONFIG_BRANCH: the git branch the page table is read from. "v1.5" for
  // the staging build only (it has the campaign column and the new-locale
  // rows); back to "main" at the switch, once v1.5 is merged.
  CONFIG_BRANCH: "v1.5",
  CONFIG_URLS: null,              // built from CONFIG_BRANCH below SETTINGS
  CONFIG_WAIT_MS: 1500,           // first visit: show the built-in default after this

  // ---- Botpress ----
  INJECT_URL: "https://cdn.botpress.cloud/webchat/v3.7/inject.js",
  // The bot this tag talks to. The tag calls botpress.init itself (no bot
  // config script). Ids: Botpress dashboard → bot → Webchat → Share.
  // ADK bot mia-dev (website contract v2: start/page/leadinfo/end events):
  BOT_ID: "76065f80-2d7f-43a4-9217-26d320157352",
  CLIENT_ID: "dadbe1bf-4b11-49a4-ab85-3e9dd59f3254",
  // The Studio bot "Live on site - Language Gate" (its old config script
  // 20260527141930-9RFHOWXE.js). It speaks the v1 contract (type "language",
  // proactiveClickAt), so a real rollback is pasting the previous tag back:
  // BOT_ID: "b4965474-62de-4d69-af64-13f61d4492dc",
  // CLIENT_ID: "bc17c11d-632b-451e-94bc-cb000c467d10",
  CDN_ORIGINS: ["https://cdn.botpress.cloud", "https://files.bpcontent.cloud"],   // + the page table's host (05-config-urls.js)

  // ---- Conversation lifecycle ----
  TIMEOUT_MS: 15 * 60 * 1000,     // must equal the Botpress inactivity timeout
  TIMEOUT_CHECK_MS: 30 * 1000,
  FORCE_SEND_MS: 4000,            // send the first message even if no conversation event came
  SAFETY_REVEAL_MS: 30000,        // reveal live Botpress even if no reply came (slow LLM)

  // ---- Rollout switch: regions the tag is allowed to run in.
  // config.json can override this with "enabledRegions" (emergency off-switch:
  // e.g. ["en-GB"] turns NL and INT off again without a GTM publish).
  ENABLED_REGIONS: ["en-GB", "nl", "int", "de-DE", "en-DE", "es-ES", "sv-SE", "en-AU"],

  // ---- Leadinfo (company recognition) ----
  // GTM's "Leadinfo - Data Layer Push" tag pushes
  // {event: "leadinfo_company", company_domain, company_name}. The company is
  // read only with this Cookiebot consent category (same gate as the old
  // "Leadinfo → Botpress Hand-over" tag, which is paused with the switch).
  LEADINFO_EVENT: "leadinfo_company",
  LEADINFO_REQUIRE_CONSENT: true,
  LEADINFO_CONSENT: "marketing",

  // ---- Slide-out panel ----
  DESKTOP_MIN_WIDTH: 1200,
  PANEL_WIDTH_WIDE: 400,          // at 1600px viewport and wider
  PANEL_WIDTH: 360,
  DEFAULT_BANNER_PX: 40,
  TEASER_DELAY_MS: 4000,
  TEASER_HIDE_MS: 25000,

  HALF_MIN_WIDTH: 1024,           // half-page card: laptops and up, never phones/tablets

  // Paths the new tag must leave alone (e.g. a page still on an old tag).
  // Pause the old campaign/slide-out tags when this tag goes live.
  LEGACY_EXCLUDE: [],

  // ---- Regions: first match wins, last entry is the fallback ----
  // id = the config.json region; locale = what the bot gets (website contract).
  REGIONS: [
    { id: "nl",    test: /^\/nl-nl(\/|$)/i, locale: "nl" },
    { id: "en-GB", test: /^\/en-gb(\/|$)/i, locale: "en-GB" },
    { id: "de-DE", test: /^\/de-de(\/|$)/i, locale: "de-DE" },
    { id: "en-DE", test: /^\/en-de(\/|$)/i, locale: "en-DE" },
    { id: "es-ES", test: /^\/es-es(\/|$)/i, locale: "es-ES" },
    { id: "sv-SE", test: /^\/sv-se(\/|$)/i, locale: "sv-SE" },
    { id: "en-AU", test: /^\/en-au(\/|$)/i, locale: "en-AU" },
    // Any other /xx-xx locale has no chat.
    { id: "none",  test: /^\/[a-z]{2}-[a-z]{2}(\/|$)/i },
    { id: "int",   test: /.*/,               locale: "int" }
  ],

  // ---- Labels (naming is still undecided: change here) ----
  LABELS: {
    "en-GB": { title: "Spotler AI Assistant", pill: "Ask Mia", placeholder: "Ask Mia a question...",
               restart: "Restart conversation", close: "Close chat", dismiss: "Dismiss", today: "Today", delivered: "Delivered",
               botName: "Mia", botTagline: "Your AI marketing assistant.",
               aiLabel: "AI assistant", privacy: "Privacy", privacyUrl: "https://spotler.com/en-gb/privacy-statement",
               calCancel: "Cancel", calTitle: "Book a meeting", calIntro: "Pick a time that works for you." },
    "int":   { title: "Spotler AI Assistant", pill: "Ask Mia", placeholder: "Ask Mia a question...",
               restart: "Restart conversation", close: "Close chat", dismiss: "Dismiss", today: "Today", delivered: "Delivered",
               botName: "Mia", botTagline: "Your AI marketing assistant.",
               aiLabel: "AI assistant", privacy: "Privacy", privacyUrl: "https://spotler.com/privacy-statement",
               calCancel: "Cancel", calTitle: "Book a meeting", calIntro: "Pick a time that works for you." },
    "nl":    { title: "Spotler AI-assistent", pill: "Vraag het Mia", placeholder: "Stel Mia een vraag...",
               restart: "Gesprek opnieuw starten", close: "Chat sluiten", dismiss: "Sluiten", today: "Vandaag", delivered: "Afgeleverd",
               botName: "Mia", botTagline: "Jouw AI-marketingassistent.",
               aiLabel: "AI-assistent", privacy: "Privacy", privacyUrl: "https://spotler.com/nl-nl/privacy-statement",
               calCancel: "Annuleren", calTitle: "Plan een afspraak", calIntro: "Kies een moment dat jou uitkomt." },
    // New locales: each with its own privacy page.
    "de-DE": { title: "Spotler KI-Assistent", pill: "Fragen Sie Mia", placeholder: "Stellen Sie Mia eine Frage...",
               restart: "Gespräch neu starten", close: "Chat schließen", dismiss: "Schließen", today: "Heute", delivered: "Zugestellt",
               botName: "Mia", botTagline: "Ihr KI-Marketingassistent.",
               aiLabel: "KI-Assistent", privacy: "Datenschutz", privacyUrl: "https://spotler.com/de-de/datenschutzerklaerung",
               calCancel: "Abbrechen", calTitle: "Termin buchen", calIntro: "Wählen Sie einen passenden Termin." },
    "es-ES": { title: "Asistente de IA de Spotler", pill: "Pregunta a Mia", placeholder: "Haz una pregunta a Mia...",
               restart: "Reiniciar conversación", close: "Cerrar chat", dismiss: "Cerrar", today: "Hoy", delivered: "Entregado",
               botName: "Mia", botTagline: "Tu asistente de marketing con IA.",
               aiLabel: "Asistente de IA", privacy: "Privacidad", privacyUrl: "https://spotler.com/es-es/politica-de-privacidad",
               calCancel: "Cancelar", calTitle: "Reserva una reunión", calIntro: "Elige el momento que mejor te venga." },
    "sv-SE": { title: "Spotler AI-assistent", pill: "Fråga Mia", placeholder: "Ställ en fråga till Mia...",
               restart: "Starta om samtalet", close: "Stäng chatten", dismiss: "Stäng", today: "Idag", delivered: "Levererat",
               botName: "Mia", botTagline: "Din AI-marknadsföringsassistent.",
               aiLabel: "AI-assistent", privacy: "Integritet", privacyUrl: "https://spotler.com/sv-se/privacy-statement",
               calCancel: "Avbryt", calTitle: "Boka ett möte", calIntro: "Välj en tid som passar dig." }
    // en-DE and en-AU: the INT labels with their own privacy page (set below SETTINGS).
  },

  // The English text in the bot's own Botpress config script: swapped for
  // the labels above where Botpress shows it.
  BOT_TEXT: { today: "Today", delivered: "Delivered", botTagline: "Your Marketing Intelligence Assistant.",
              placeholder: "Ask Mia a question...", footer: "Powered by Spotler AI" },

  // Mia's photo, built in (88px WebP): the Botpress-hosted file it used to load stopped loading (Nov 2026)
  AVATAR_URL: "data:image/webp;base64,UklGRjYFAABXRUJQVlA4ICoFAAAwGgCdASpYAFgAPm0ylEekIqIhJXVcQIANiWMAv6hDEzGKTVwdvCLFK9H97oUF+3eDP4YgUOK7TzZkHmzaE3qv2DP1Y6GZjtrk8ksujcaZVt+mpadO5USEG9M5Hpkx8QTD8trfFzQ8AYbj8YLT9EZVL1FxST9iNfgCxou0pLw7flK+FKaV+y42QNT//t9kzXkp10EnxWogNyutNEqayoLy4G3n9IQ4ikOmMa4vgfV2KMiSbMoo3mK7seNEuTaPfNtDbGOG20sJoBecuVNFKXuv643ff62A7qu0oAD+/ZxB2hDDmJbe/879qblT5ImHZa+Vth1hwCK0O2++K1rQ/w4/HZv467JG/DdLuT5bubdNy1V57WEF35fk6/SYdjHYjS9vkiztTiYsCtUW3Amg7Ej5356tHVn6aLP8YNfYb/2dIHzqiXfbfDT36oQtK+K9dJP8p8HTMG5aMZI2yRPvkMECWgRggwHhLkExp0oeGPmLAJx6p/jBrhe0k2O9AwVwOk0WiK5iyZ9b5vFoBslQ9UpHfc0g1y9qbo4vXrB1zEQPhrB7s7t2fcaFr0QGzRRSKqNHhh3iyroVpGvma6uIJk8rAs9mz60zJWWBOmpouabgvB5306yU7hwDUoHxQ6drWwQYZiuuGqUi7k+jXZ0PVZoySP4Hlx/tEjQ4IQLLG9xy6tHPZz2qi+8fWpee5nCByrTuXPfT7ZrqmNuMkKxmthzjEvD1O/CNnM6Q+r3TN0k5C+4wHvllb+VAaq20jTrIEMSH9lwQ93AS22iRcU9fA+D/MKXGxqPvKYYy/8ukH1CVAK1+oUG6mQYNB5V44bxxVdkDLDUHXBrNMW4AaLPdBqzYxmVwQLLiA1lNtnbh3P9D1wXW0GxHXWHv4fWt0rej6Unw/jnTAXPXwNgtGZcX+f2gz9VQFfa0NQgdyIbCVnr0+Jf0ynoGcXceWaAWqDbWYg2gitgbnnwiqAoT9nRzilLuW6+sjpruetg9wp5GAxPjrve5Pn0ybkQUSV+IxmJHkVf6s+VePaq+211KU4oB8/8s5ejAjW3EgrgnSi2RpphpB+GB4YB53O3IN1xUnKdzwVIcJ+L3GhFZUaU3pkAp4NUx7V5DjXDx0QmaGmeq7zJSBH56Iba8Z58/b/kY1MG/CF0MNydKePsdPKcJvLneLhrxVAvlb2bTtWIu5iwaLO9M3zjPbZfZJb37RZhngPGkNUWZkWQgOQaiHwL47P18DBd5rJrem3hKeDzGLHkDkC5DQwcSGnwx9Q44l52DfSYZOl0YKBBlZw/8+8fbUNFPxDrMmBSKL6pvpz0+8ETJ9gKxg3UbSS/I34YRUcmud6N+C+lYd0RLE6MPtJKL6CwExl+1sS1/oqDUJPgL2TmcRnTtph8dROhFDv/gdVHhf7l4zVz3VvKn5V5TT14XbcB4dkWsZILcgDUTxWLDf5zuktqdRC/FRaA8Y3F8V4VZiXiFmRSfdJ+WFmm1MRcD4A5/hlTH18843rDhFtWvQttYxVhxE7M9QCS/AbjH95dAwLJkLwP36Vr1hc80VXDrQhgcOrk997vF2yiK/iWitlKjmzrQV/eZLiJI93CtTeb7YK6bAaWDyuXR8dbIaIg13tUn9hFoo/2WYU5vwSLqZxPYHYf3rvaNrUvku/aXf4HueCd/eJbGFw+Z41ODXmNf4dKLKcpZE4H/Gkg16guRqZ9oDTTLM9xyi/3pj+vtk3TLsVauauR50shPMatUa/g98ZPaZEkEn7mTO7BugAAAAA==",

  // ---- Built-in fallback rows (used only if config.json is unavailable) ----
  // Blank line in an opener = a new bubble. Buttons attach to the last bubble.
  DEFAULT_ROWS: [
    { url_match: "*", region: "en-GB", mode: "slideout", page: "default",
      opener: "Hi, I’m Mia, Spotler’s AI assistant. I can answer questions about our products and help you book a demo, or make sure the right colleague follows up by email.",
      buttons: [
        { label: "What can Spotler do for me?", send: "What can Spotler do for me?" },
        { label: "Book a demo", send: "Book a demo" },
        { label: "See pricing", send: "See pricing" },
        { label: "Product support", send: "Product support" }
      ],
      teaser_text: "Questions about Spotler? Ask me anything!",
      teaser_send: "I have a question about Spotler" },
    { url_match: "*", region: "int", mode: "slideout", page: "default",
      opener: "Hi, I’m Mia, Spotler’s AI assistant. I can answer questions about our products and help you book a demo, or make sure the right colleague follows up by email.",
      buttons: [
        { label: "What can Spotler do for me?", send: "What can Spotler do for me?" },
        { label: "Book a demo", send: "Book a demo" },
        { label: "Product support", send: "Product support" },
        { label: "Pricing", send: "Pricing" }
      ],
      teaser_text: "Questions about Spotler? Ask me anything!",
      teaser_send: "I have a question about Spotler" },
    { url_match: "*", region: "nl", mode: "slideout", page: "default",
      opener: "Hoi, ik ben Mia, de AI-assistent van Spotler. Ik beantwoord vragen over onze producten, help je met een demo-afspraak of zorg dat de juiste collega je per e-mail opvolgt.",
      buttons: [
        { label: "Wat kan Spotler voor mij betekenen?", send: "Wat kan Spotler voor mij betekenen?" },
        { label: "Een demo boeken", send: "Een demo boeken" },
        { label: "Bekijk prijzen", send: "Bekijk prijzen" },
        { label: "Productondersteuning", send: "Productondersteuning" }
      ],
      teaser_text: "Vragen over Spotler? Vraag maar raak!",
      teaser_send: "Ik heb een vraag over Spotler" },
    { url_match: "*", region: "de-DE", mode: "slideout", page: "default",
      opener: "Hallo, ich bin Mia, die KI-Assistentin von Spotler. Ich beantworte Fragen zu unseren Produkten, helfe Ihnen, eine Demo zu buchen, oder sorge dafür, dass sich die richtige Ansprechperson per E-Mail bei Ihnen meldet.",
      buttons: [
        { label: "Was kann Spotler für mich tun?", send: "Was kann Spotler für mich tun?" },
        { label: "Demo buchen", send: "Demo buchen" },
        { label: "Preise ansehen", send: "Preise ansehen" },
        { label: "Produktsupport", send: "Produktsupport" }
      ],
      teaser_text: "Fragen zu Spotler? Fragen Sie einfach!",
      teaser_send: "Ich habe eine Frage zu Spotler" },
    { url_match: "*", region: "es-ES", mode: "slideout", page: "default",
      opener: "Hola, soy Mia, la asistente de IA de Spotler. Respondo preguntas sobre nuestros productos, te ayudo a reservar una demo o me aseguro de que la persona adecuada de nuestro equipo te escriba por email.",
      buttons: [
        { label: "¿Qué puede hacer Spotler por mí?", send: "¿Qué puede hacer Spotler por mí?" },
        { label: "Reservar una demo", send: "Reservar una demo" },
        { label: "Ver precios", send: "Ver precios" },
        { label: "Soporte de producto", send: "Soporte de producto" }
      ],
      teaser_text: "¿Preguntas sobre Spotler? ¡Pregúntame lo que quieras!",
      teaser_send: "Tengo una pregunta sobre Spotler" },
    { url_match: "*", region: "sv-SE", mode: "slideout", page: "default",
      opener: "Hej, jag är Mia, Spotlers AI-assistent. Jag svarar på frågor om våra produkter, hjälper dig att boka en demo eller ser till att rätt kollega hör av sig till dig via e-post.",
      buttons: [
        { label: "Vad kan Spotler göra för mig?", send: "Vad kan Spotler göra för mig?" },
        { label: "Boka en demo", send: "Boka en demo" },
        { label: "Se priser", send: "Se priser" },
        { label: "Produktsupport", send: "Produktsupport" }
      ],
      teaser_text: "Frågor om Spotler? Fråga mig vad som helst!",
      teaser_send: "Jag har en fråga om Spotler" }
    // en-DE and en-AU: copies of the INT row (set below SETTINGS).
  ]
};

// (SETTINGS.CONFIG_URLS, the page table's addresses, is set in 05-config-urls.js)

// English-language locales outside the UK: the INT labels with their own
// privacy page, and the INT fallback row.
(function () {
  var own = { "en-DE": "https://spotler.com/en-de/privacy-statement", "en-AU": "https://spotler.com/en-au/privacy-statement" };
  for (var region in own) {
    var copy = {}, k;
    for (k in SETTINGS.LABELS["int"]) if (SETTINGS.LABELS["int"].hasOwnProperty(k)) copy[k] = SETTINGS.LABELS["int"][k];
    copy.privacyUrl = own[region];
    SETTINGS.LABELS[region] = copy;
  }
})();
(function () {
  var rows = SETTINGS.DEFAULT_ROWS, base = null, i, k;
  for (i = 0; i < rows.length; i++) if (rows[i].region === "int") base = rows[i];
  ["en-DE", "en-AU"].forEach(function (region) {
    var copy = {};
    for (k in base) if (base.hasOwnProperty(k)) copy[k] = base[k];
    copy.region = region;
    rows.push(copy);
  });
})();
