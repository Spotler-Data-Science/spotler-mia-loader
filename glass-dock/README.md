# Glass dock (the live Mia tag)

Mia on spotler.com: a glass pill at the bottom of the page that opens into the
chat, on **every region** (UK, NL, INT, DE, en-DE, ES, SE, AU; not on other
`/xx-xx` locales). The GTM tag is `dist/mia-glass-dock.gtm.html`.
It reuses the shared code in `../src/` (Botpress, page table, calendar); the
old slide-out loader (`../dist/`) is replaced by it.

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
- **Typing while Mia replies** (loader 1.6.9): the field takes the message and
  clears. It shows as held (faded, no "Delivered"): in the preview during her
  first reply, under the live chat after that. Once her reply is in, everything
  held goes as one visitor turn, in the order typed. A restart drops it.

**Look:** clear white glass with a soft shadow. The send buttons (pill, card,
live chat) and the pill's typing cursor are the site's "Get a demo" cyan
`#2FACE6`, with a white arrow like that button.

The questions come from the page table: each region's default row (`*`) has
a `prompts` list; on a page with its own row, that page's teaser is typed
first, then the region's list. A page row with its own `prompts` list replaces
the cycle on that page. `DOCK_PROMPTS` in `src/01-dock-settings.js` is only the
fallback when the file can't be read.

## Editing the text

The tag reads the page table from the site's own WordPress uploads:
`/wp-content/uploads/2026/11/botpress-config.json` on whatever host the page is
on (spotler.com, www.spotler.com, the staging site), so it's always the same
site and no CORS header is needed (`DOCK_CONFIG_PATH` in
`src/01-dock-settings.js`). It never reads GitHub. The master copy is
`glass-dock/config.json` in this repo; to publish a change, replace the media
file in WordPress (a "replace media" plugin keeps the URL the same), on live
and on staging. If the file can't be read: the copy the browser saved on an
earlier visit, else the built-in defaults (no page-specific questions).

It's the same format as `config/config.json`. On a row (`"url_match": "*"` is
every page of that region without its own row):

| Field | What it changes |
|---|---|
| `prompts` | the questions the pill types, in order (a list, up to 10, 120 characters each); the first three are the start screen's "Others often ask" |
| `opener` | the start screen's greeting under the headline (a blank line starts a new paragraph; must say Mia is an AI assistant) |
| `title` | the start screen's headline (default per language: "Hello, I'm Mia", "Hallo, ich bin Mia"…) |
| `buttons` | the start screen's cards: `[{"label": "…", "send": "…", "description": "…", "icon": "…"}]`. `description` (the grey line) and `icon` are optional: without them they're picked from the label (demo, pricing, support, otherwise explore). Icons: `calendar`, `pricing`, `support`, `explore`, `product`, `chat`, `mail`, `document`, `none`, or a picture: an `https://` link to a png, svg or jpg (shown 44×44) |

A good read shows `config from network v<version>` in the console; a missing
or broken file shows `config fetch failed (<host>)`. Changes show within about 5 minutes,
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
| `src/01-dock-settings.js` | version, INT only, the questions and typing speeds |
| `src/41-shellglass.css` | glass look for the static preview |
| `src/52-dock.css`, `src/52-dock.js` | the pill, the card, the typing, glass styles for the live chat |
| `src/95-dock-main.js` | boot: INT only, the pill's arrow and text, resume |

The production `50-slideout`, `55-embedded` and `90-main` are left out.

```bash
node build.mjs                        # production tag (the tests use it too)
node glass-dock/build.mjs         # → glass-dock/dist/mia-glass-dock-<version>.live.gtm.html and .staging.gtm.html
CHROMIUM=/opt/pw-browsers/chromium python3 glass-dock/test.py
```

## Putting it live

1. In GTM, the tag fires on **All Pages** (it works out the region itself and
   stays off on locales without chat). Pause the old Mia slide-out tag.
2. If the old tag still fires, firing order doesn't matter: the dock claims the
   page and the old loader stands down; if the old loader got there first and
   only shows its preview, the dock takes its slide-out off the page. If an old
   chat is already running, the dock leaves it alone.
3. Check the console for `[Mia] glass dock glass-dock-…, region …, page …`.

## Languages and pages

- Labels (placeholder, header, privacy line and link) follow the region.
- The greeting and buttons come from the page table, per region and page.
- The pill's questions: the page row's own `prompts` if it has them;
  otherwise, on a page with its own row, its teaser first (the arrow sends its
  `teaser_send`), then the region default row's `prompts` (or, without the
  file, the built-in `DOCK_PROMPTS` in `src/01-dock-settings.js`: English, Dutch,
  German, Spanish, Swedish).

## Known limits

- Botpress's live chat is restyled to glass by injected CSS; a Botpress update
  can undo parts of it.
- The source sent to the bot for the arrow is `teaser` (inside the website
  contract).
- Pages set to a half or full campaign card get the dock instead of the card.
