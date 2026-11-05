/* ==================================================================
   05 · Where the page table is read from (the old slide-out loader).
   The glass dock leaves this file out of its build: it reads only
   marketing.spotler.com, never GitHub (see glass-dock/src/01-dock-settings.js).
   ================================================================== */
SETTINGS.CONFIG_URLS = [
  "https://raw.githubusercontent.com/Spotler-Data-Science/spotler-mia-loader/" + SETTINGS.CONFIG_BRANCH + "/config/config.json",
  "https://cdn.jsdelivr.net/gh/Spotler-Data-Science/spotler-mia-loader@" + SETTINGS.CONFIG_BRANCH + "/config/config.json"
];
SETTINGS.CDN_ORIGINS.push("https://raw.githubusercontent.com");
