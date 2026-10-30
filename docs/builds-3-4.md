# Builds 3 and 4 (Mia improvements, phase 2): findings and status

Loader 1.6.9, branch `builds-3-4` (from 1.6.8, `7632c9a`). Scope: the Mia repo, `docs/scope/mia-improvements-build-scope__mia-improvements-build-scope.md`, sections 3 and 4.

## Build 3, clickable links: inside Botpress webchat, not configurable (stopped)

**Finding.** Botpress webchat renders markdown links without an `href`, by design. In `https://cdn.botpress.cloud/webchat/v3.7/inject.js` the markdown link renderer is:

```js
a: ({ node, href, children, ...rest }) =>
  jsx("a", { ...rest, className: "bpMessageBlocksTextLink", onMouseUp: () => window.open(href, "_blank", "noopener,noreferrer"), children })
```

The `href` is taken out of the props and the URL is only opened by a `mouseup` handler. The same renderer is in v3.3, v3.5, v3.6 and v3.7; v3.7 is the newest on the CDN (v3.8 and later answer 404). No webchat configuration option changes it.

**What that means for visitors.** A mouse click (press and release on the link) opens the page in a new tab. Nothing else does: no keyboard (the anchor has no `href`, so it can't take focus or be activated with Enter), no programmatic `.click()` (which is probably what the 27 Oct test tool used, and why it reported every link as dead), no middle-click, no "Copy link", no URL preview on hover. Screen readers announce it as text, not a link.

**Our side.** The loader does not touch link `href`s. The static shell shows only Mia's first reply, for under a second before the hand-over, and its mirror is plain text (the live chat it copies from has no URL to copy).

**Not done**, by the scope's rule (document, ask Botpress, don't patch webchat):
- No change to webchat, and no loader code that rewrites webchat's anchors.
- A possible loader workaround, for Louis to decide: listen to the bot's messages (`botpress.on("message")`), map each link's text to its URL from the markdown, and set `href` and `target="_blank"` on the matching `bpMessageBlocksTextLink` anchors. It works from outside webchat (like the existing text and header adjustments) but depends on webchat's class names and message order.

**To check by hand on staging** (5 minutes): on `/en-gb/pricing`, ask "How much is Mail+?", then click the "pricing page" link with a mouse. If a new tab opens on `https://spotler.com/en-gb/pricing`, mouse users are fine today and the defect is keyboard, accessibility and copy-link only.

## Build 4, typing while Mia replies: shell fixed, live chat blocked by webchat

**Two places blocked the second message (H3):**

1. **The shell (ours), during Mia's first reply.** The tag disabled the shell's textarea from the first send until the hand-over. Typing went nowhere (27 Oct run 2: "went to the page"). **Fixed in 1.6.9:** the textarea stays enabled (the opener buttons and the mic stay off). A message sent meanwhile shows in the shell as held, without "Delivered"; Mia's reply slides in above it; after the hand-over the held text is sent as one normal visitor turn (several lines are joined into one message). Tests 23a to 23c.
2. **The live chat (Botpress), on every later reply.** Webchat keeps its textarea enabled but its send function returns early while the bot reply is pending (`disableSendButton = isAwaitingResponse` in v3.7; the composer shows a loader instead of the send button). The text stays in the box (27 Oct run 1) and the visitor has to press Enter again once the reply is in. Not configurable; same rule as build 3: documented, in the support message below.

**Done-when** ("H3 with real typing gives 2 visitor messages and 2 answers"): met for H3 as written (the second message is typed during Mia's first reply, which is the shell). Tests 23a and 23b check exactly that with real keystrokes against the mocked webchat. It still needs the staging check with a person typing.

## Draft message to Botpress support

> Subject: Webchat v3.7: markdown links render without href; composer won't send while a reply is pending
>
> Hi,
>
> We embed webchat v3.7 (`cdn.botpress.cloud/webchat/v3.7/inject.js`, `botpress.init` with a v2 configuration and `embeddedChatId`) on spotler.com. Two things we can't change through the configuration:
>
> 1. **Links in bot messages have no href.** A text message with `[pricing page](https://spotler.com/en-gb/pricing)` renders as `<a class="bpMessageBlocksTextLink">pricing page</a>`. The markdown renderer drops `href` and opens the URL in an `onMouseUp` handler. Keyboard users can't reach or open the link, screen readers don't announce it as a link, middle-click and "Copy link" don't work, and automated tests that call `.click()` see nothing happen. Could the anchor keep `href` with `target="_blank"` and `rel="noopener noreferrer"` (as your button-type links and the footer already do), or could this be a configuration option?
>
> 2. **Messages typed while the bot is replying can't be sent.** While `isAwaitingResponse` is true the composer's send returns early, so a visitor who presses Enter during a reply keeps the text in the box and nothing is sent. Is there a setting to allow sending (or queueing) while a reply is pending?
>
> We're on v3.7, the newest version on your CDN. Happy to share a test page.
>
> Thanks,
> Louis Grieves, Spotler
