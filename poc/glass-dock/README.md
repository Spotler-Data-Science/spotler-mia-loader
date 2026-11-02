# Glass dock (POC)

A test of a different way into Mia, for the staging site on **INT pages only**.
The production loader (`src/`, `dist/`) is not changed by this folder.

## What it does

- **Resting:** a glass pill fixed to the bottom centre of the page. It types a
  question, holds it, erases it and types the next. Nothing from Botpress
  loads.
- **Arrow pressed:** the question in the pill goes straight into the chat. The
  chat grows up out of the pill, shows the question, Botpress loads, and the
  live chat takes over (the production hand-over).
- **Text clicked:** the chat grows up out of the pill with the greeting and the
  buttons; the pill's row becomes the (empty) text field, in the same place.
  Botpress loads only when they send something.
- **One text box:** the pill's field is the only one, before and during the
  conversation (the preview's and Botpress's composers are hidden; no mic).
- **Open:** one glass element grows upward (width 600 → up to 860px on
  desktop, height to fit), with the same glass, opacity and corner radius.
  The live chat stays see-through.
- **Close (✕):** back to the typing pill; a running conversation is kept.

**Look:** clear white glass with a soft shadow. The send buttons (pill, card,
live chat) and the pill's typing cursor are the site's "Get a demo" cyan
`#2FACE6`, with a white arrow like that button.

The questions are in `src/01-poc-settings.js` (`POC_PROMPTS`). A page-table row
with a `prompts` list (strings) overrides them for that page.

## Editing the text (marketing.spotler.com)

The tag reads **https://marketing.spotler.com/botpress/config.json** first and
the GitHub page table only if that file can't be read. It's the same format
as `config/config.json` (start from `config.example.json` here). On the INT
rows (`"region": "int"`; `"url_match": "*"` is every page without its own row):

| Field | What it changes |
|---|---|
| `prompts` | the questions the pill types, in order (a list, up to 10, 120 characters each) |
| `opener` | the greeting when someone clicks in (a blank line starts a new bubble) |
| `buttons` | the buttons under it: `[{"label": "…", "send": "…"}]` |

The file's server must send `Access-Control-Allow-Origin: https://www.spotler.com`
(or `*`), or browsers refuse to read it and the tag falls back to GitHub; the
console then shows `config fetch failed (marketing.spotler.com)`. A good read
shows `config from network v<version>`. Changes show within about 5 minutes,
and every first message must still say Mia is Spotler's AI assistant.

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
