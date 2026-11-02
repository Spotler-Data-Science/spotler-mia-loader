/* ==================================================================
   01 · POC settings (glass dock). Loaded after the shared 00-settings.
   A test only: INT pages, staging. The production loader is untouched.
   ================================================================== */
SETTINGS.VERSION = "poc-glass-0.15";
SETTINGS.POC_REGION = "int";

// Marketing's own page table, edited by hand: read first, with the GitHub
// one (SETTINGS.CONFIG_URLS) as the backup. Same format as config/config.json;
// a row can also have "prompts": the questions the pill types on that page.
// The server must send Access-Control-Allow-Origin for spotler.com.
SETTINGS.POC_CONFIG_URL = "https://marketing.spotler.com/botpress/config.json";

// What the pill types, one after the other, when the page table has no
// "prompts" for the page (a list of strings on a row, or on the "*" row).
SETTINGS.POC_PROMPTS = [
  "How can Spotler help my business?",
  "Which Spotler product fits an online shop?",
  "Can I book a demo this week?",
  "How does Spotler use AI in email marketing?",
  "What does Spotler cost?"
];
SETTINGS.POC_TYPE_MS = 80;       // per letter (a calm typing pace)
SETTINGS.POC_HOLD_MS = 4500;     // full question on screen
SETTINGS.POC_ERASE_MS = 30;      // per letter, deleting
SETTINGS.POC_GAP_MS = 700;       // empty pill between questions
