# Glass dock (POC)

A test of a different way into Mia, for the staging site on **INT pages only**.
The production loader (`src/`, `dist/`) is not changed by this folder.

## What it does

- **Resting:** a glass pill fixed to the bottom centre of the page. It types a
  question, holds it, erases it and types the next. Nothing from Botpress
  loads.
- **Arrow pressed:** the question in the pill goes straight into the chat. The
  card opens, shows the question, Botpress loads, and the live chat takes over
  (the production hand-over).
- **Text clicked:** the card opens with the greeting, the buttons and an empty
  text field, ready to type. Botpress loads only when they send something.
- **Close (✕):** back to the typing pill; a running conversation is kept.

The questions are in `src/01-poc-settings.js` (`POC_PROMPTS`). A page-table row
with a `prompts` list (strings) overrides them for that page.

## How it's built

The tag is the production loader's shared code (page table, preview, Botpress
hand-over, consent, calendar, labels) plus this folder's files:

| File | Role |
|---|---|
| `src/01-poc-settings.js` | version, INT only, the questions and typing speeds |
| `src/41-shellglass.css` | glass look for the static preview |
| `src/52-dock.css`, `src/52-dock.js` | the pill, the card, the typing, glass styles for the live chat |
| `src/95-poc-main.js` | boot: INT only, the pill's arrow and text, resume |

The production `50-slideout`, `55-embedded` and `90-main` are left out.

```bash
node build.mjs                        # production tag (the tests use it too)
node poc/glass-dock/build.mjs         # → poc/glass-dock/dist/mia-poc-glass.gtm.html
CHROMIUM=/opt/pw-browsers/chromium python3 poc/glass-dock/test.py
```

## Putting it on staging

1. In the **staging** GTM environment, add a new Custom HTML tag with
   `dist/mia-poc-glass.gtm.html`, firing on all pages (it does nothing outside INT).
2. Firing order doesn't matter. On INT pages it claims the page and a
   production loader firing later stands down; if the production loader got
   there first and only shows its preview, the POC takes its slide-out off
   the page (`POC: production slide-out removed`) and runs instead. If a
   production chat is already running, the POC leaves it alone. On other
   regions it does nothing.
3. Check the console for `[Mia] POC glass dock, page …`.

## Known POC limits

- Botpress's live chat is restyled to glass by injected CSS; a Botpress update
  can undo parts of it.
- The source sent to the bot for the arrow is `teaser` (inside the website
  contract).
- No page-table, n8n or production-tag changes; no languages other than INT.
