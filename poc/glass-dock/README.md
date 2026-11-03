# Glass dock (POC)

A test of a different way into Mia, for the staging site, on **every region the
production loader covers** (UK, NL, INT, DE, en-DE, ES, SE, AU; not on other
`/xx-xx` locales).
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

## Editing the text

The tag reads **`poc/glass-dock/config.json`** in this repo first (branch
`claude/new-session-bl4psv`), and the production page table only if that file
can't be read or isn't valid. Edit it on GitHub:
https://github.com/Spotler-Data-Science/spotler-mia-loader/edit/claude/new-session-bl4psv/poc/glass-dock/config.json
Changes show within about 5 minutes. Later it moves to
`https://marketing.spotler.com/botpress/config.json` (`POC_CONFIG_URL` in
`src/01-poc-settings.js`; that server must send `Access-Control-Allow-Origin`).

It's the same format as `config/config.json`. On a row (`"url_match": "*"` is
every page of that region without its own row):

| Field | What it changes |
|---|---|
| `prompts` | the questions the pill types, in order (a list, up to 10, 120 characters each); the first three are the start screen's "Others often ask" |
| `opener` | the start screen's greeting under the headline (a blank line starts a new paragraph; must say Mia is an AI assistant) |
| `title` | the start screen's headline (default per language: "Hello, I'm Mia", "Hallo, ich bin Mia"…) |
| `buttons` | the start screen's cards: `[{"label": "…", "send": "…", "description": "…", "icon": "…"}]`. `description` (the grey line) and `icon` are optional: without them they're picked from the label (demo, pricing, support, otherwise explore). Icons: `calendar`, `pricing`, `support`, `explore`, `product`, `chat`, `mail`, `document`, `none`, or a picture: an `https://` link to a png, svg or jpg (shown 44×44) |

The file's server must send `Access-Control-Allow-Origin: https://www.spotler.com`
(or `*`), or browsers refuse to read it and the tag falls back to GitHub; the
console then shows `config fetch failed (marketing.spotler.com)`. A good read
shows `config from network v<version>`. Changes show within about 5 minutes,
and every first message must still say Mia is Spotler's AI assistant.

The start screen never scrolls on first open: when it doesn't fit, it drops
(in this order) the third question, the cards' grey lines, the questions,
extra greeting paragraphs, then uses a smaller headline.

On phones the first tap on the bar opens the chat without the keyboard;
tapping the field brings the keyboard up.

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

1. In the **staging** GTM, the POC tag fires on **All Pages** (it works out the
   region itself and stays off on locales without chat).
2. Firing order doesn't matter: it claims the page and a production loader
   firing later stands down; if the production loader got there first and only
   shows its preview, the POC takes its slide-out off the page. If a production
   chat is already running, the POC leaves it alone.
3. Check the console for `[Mia] POC glass dock, region …, page …`.

## Languages and pages

- Labels (placeholder, header, privacy line and link) follow the region.
- The greeting and buttons come from the page table, per region and page.
- The pill's questions: the row's `prompts` if the page table has them;
  otherwise, on a page with its own row, its teaser first (the arrow sends its
  `teaser_send`), then five general questions in the region's language
  (`POC_PROMPTS` in `src/01-poc-settings.js`: English, Dutch, German, Spanish,
  Swedish).

## Known POC limits

- Botpress's live chat is restyled to glass by injected CSS; a Botpress update
  can undo parts of it.
- The source sent to the bot for the arrow is `teaser` (inside the website
  contract).
- No page-table, n8n or production-tag changes.
- Pages set to a half or full campaign card get the dock instead of the card.
