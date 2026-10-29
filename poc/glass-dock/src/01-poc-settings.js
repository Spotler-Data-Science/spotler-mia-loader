/* ==================================================================
   01 · POC settings (glass dock). Loaded after the shared 00-settings.
   A test only: INT pages, staging. The production loader is untouched.
   ================================================================== */
SETTINGS.VERSION = "poc-glass-0.2";
SETTINGS.POC_REGION = "int";

// What the pill types, one after the other (a page row's "prompts" column,
// a list of strings, wins when the page table has one).
SETTINGS.POC_PROMPTS = [
  "How can Spotler help my business?",
  "Which Spotler product fits an online shop?",
  "Can I book a demo this week?",
  "How does Spotler use AI in email marketing?",
  "What does Spotler cost?"
];
SETTINGS.POC_TYPE_MS = 45;       // per letter
SETTINGS.POC_HOLD_MS = 2200;     // full question on screen
SETTINGS.POC_ERASE_MS = 22;      // per letter, deleting
SETTINGS.POC_GAP_MS = 450;       // empty pill between questions
