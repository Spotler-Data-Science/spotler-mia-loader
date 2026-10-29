"""Headless checks for the glass-dock POC, against the mocked Botpress.
Run from the repo root: node build.mjs && node poc/glass-dock/build.mjs && python3 poc/glass-dock/test.py"""
import asyncio, json, os, sys
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
POC = open(os.path.join(ROOT, "poc/glass-dock/dist/mia-poc-glass.gtm.html")).read()
PROD = open(os.path.join(ROOT, "dist/mia-loader.gtm.html")).read()
RAW = open(os.path.join(ROOT, "test/mock/page.html")).read()
INJECT = open(os.path.join(ROOT, "test/mock/inject.js")).read()
CONFIG = open(os.path.join(ROOT, "test/mock/config.json")).read()
OUT = os.path.join(ROOT, "poc/glass-dock/out"); os.makedirs(OUT, exist_ok=True)
PNG = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000" "1f15c4890000000d49444154789c63f8cfc0f01f0005000201a5f6e0540000000049454e44ae426082")
PROMPTS = ["How can Spotler help my business?", "Which Spotler product fits an online shop?", "Can I book a demo this week?",
           "How does Spotler use AI in email marketing?", "What does Spotler cost?"]

results = []
def check(name, cond, detail=""):
    results.append(bool(cond))
    print(("PASS " if cond else "FAIL ") + name + (("  -- " + str(detail)) if detail and not cond else ""))

async def setup(ctx, tags, phone=False):
    page_html = RAW.replace("<!--TAG-->", "\n".join(tags))
    if phone: page_html = page_html.replace("</head>", '<meta name="viewport" content="width=device-width, initial-scale=1"></head>', 1)
    reqs = []
    async def handler(route):
        url = route.request.url; reqs.append(url)
        if "cdn.botpress.cloud" in url: return await route.fulfill(body=INJECT, content_type="application/javascript")
        if url.endswith((".webp", ".png")): return await route.fulfill(body=PNG, content_type="image/png")
        if "raw.githubusercontent.com" in url or "cdn.jsdelivr.net" in url:
            return await route.fulfill(body=CONFIG, content_type="application/json", headers={"access-control-allow-origin": "*"})
        if url.endswith("/logo.svg"): return await route.fulfill(body="<svg xmlns='http://www.w3.org/2000/svg'/>", content_type="image/svg+xml")
        if "spotler.com" in url: return await route.fulfill(body=page_html, content_type="text/html")
        return await route.fulfill(status=404, body="")
    await ctx.route("**/*", handler)
    return reqs

def bp(reqs): return [u for u in reqs if "cdn.botpress.cloud" in u]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROMIUM") or None)

        # 1. resting pill types questions; nothing from Botpress
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        reqs = await setup(ctx, [POC])
        page = await ctx.new_page()
        logs = []; page.on("console", lambda m: logs.append(m.text))
        await page.goto("https://www.spotler.com/")
        await page.wait_for_timeout(1200)
        seen = set()
        for _ in range(12):
            seen.add(await page.evaluate("document.getElementById('mia-dock-q').textContent")); await page.wait_for_timeout(250)
        st = await page.evaluate("""() => { const d=document.getElementById('mia-dock'), p=document.getElementById('mia-dock-pill'), r=p.getBoundingClientRect();
            return { open: d.classList.contains('open'), bottom: Math.round(innerHeight - r.bottom), centre: Math.round(r.left + r.width/2 - innerWidth/2),
                     fixed: getComputedStyle(d).position, blur: getComputedStyle(p).backdropFilter || getComputedStyle(p).webkitBackdropFilter } }""")
        check("1a pill fixed at the bottom centre, glass (blur), card closed", st["fixed"] == "fixed" and st["bottom"] == 24 and abs(st["centre"]) <= 1 and "blur" in (st["blur"] or "") and not st["open"], st)
        check("1b pill types a question letter by letter", len(seen) >= 4 and any(PROMPTS[0].startswith(s) and 0 < len(s) < len(PROMPTS[0]) for s in seen), sorted(seen)[:6])
        check("1c no Botpress on page view", not bp(reqs), bp(reqs))
        check("1d INT page: production loader not started", not await page.evaluate("!!document.getElementById('spotler-agent-panel')"))
        await page.screenshot(path=f"{OUT}/1-pill.png")

        # 2. click the text: card with greeting, buttons, empty focused field; still no Botpress
        await page.click("#mia-dock-q")
        await page.wait_for_timeout(700)
        c = await page.evaluate("""() => { const sr=document.getElementById('spotler-mia-shell').shadowRoot, ta=sr.querySelector('textarea');
            return { open: document.getElementById('mia-dock').classList.contains('open'), text: sr.textContent, buttons: sr.querySelectorAll('.btn').length,
                     value: ta.value, focused: sr.activeElement === ta } }""")
        check("2a text click opens the card: greeting + buttons + empty text field (focused)", c["open"] and "Hi, I" in c["text"] and c["buttons"] >= 3 and c["value"] == "" and c["focused"], c)
        check("2b still no Botpress", not bp(reqs), bp(reqs))
        await page.screenshot(path=f"{OUT}/2-card.png")
        # typing your own message then starts the chat as usual
        await page.evaluate("""() => { const sr=document.getElementById('spotler-mia-shell').shadowRoot, ta=sr.querySelector('textarea');
            ta.value='Do you integrate with Shopify?'; ta.dispatchEvent(new Event('input')); ta.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter'})); }""")
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        log = await page.evaluate("window.__bpLog")
        check("2c own message typed in the card goes to the chat", ["sendMessage", "Do you integrate with Shopify?"] in log, log[-4:])
        await page.wait_for_timeout(800)
        g = await page.evaluate("""() => { const r=window.__bpShadow; return { glass: !!r.querySelector('style[data-mia-dock]'), bg: getComputedStyle(r.querySelector('.bpContainer')).backgroundColor } }""")
        check("2d live chat gets the glass styles (transparent)", g["glass"] and g["bg"] in ("rgba(0, 0, 0, 0)", "transparent"), g)
        await page.screenshot(path=f"{OUT}/2-live.png")
        await ctx.close()

        # 3. arrow: the pill's question goes straight into the chat
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        reqs = await setup(ctx, [POC])
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/")
        await page.wait_for_timeout(1500)
        await page.click(".mia-arrow")
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        log = await page.evaluate("window.__bpLog")
        sent = [e[1] for e in log if e[0] == "sendMessage"]
        ev = [json.loads(e[1]) for e in log if e[0] == "sendEvent"]
        check("3a arrow sends the pill's whole question straight into the chat", sent == [PROMPTS[0]] and await page.evaluate("document.getElementById('mia-dock').classList.contains('open')"), sent)
        check("3b start event: locale int, source teaser", ev and ev[0]["type"] == "start" and ev[0]["locale"] == "int" and ev[0]["source"] == "teaser", ev)
        await page.wait_for_timeout(800)
        await page.screenshot(path=f"{OUT}/3-arrow-live.png")
        # close: back to the pill, typing again; the conversation stays
        await page.click("#mia-dock-head button[aria-label='Close chat']")
        await page.wait_for_timeout(1200)
        q1 = await page.evaluate("document.getElementById('mia-dock-q').textContent")
        check("3c close: back to the typing pill", not await page.evaluate("document.getElementById('mia-dock').classList.contains('open')") and q1 != "", q1)
        await ctx.close()

        # 4. other regions: the POC leaves the page to the production loader
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await setup(ctx, [POC, PROD])
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/en-gb/pricing")
        await page.wait_for_timeout(1500)
        r = await page.evaluate("({ dock: !!document.getElementById('mia-dock'), panel: !!document.getElementById('spotler-agent-panel') })")
        check("4a en-GB page with both tags: production slide-out, no dock", r == {"dock": False, "panel": True}, r)
        await page.goto("https://www.spotler.com/pricing")
        await page.wait_for_timeout(1500)
        r = await page.evaluate("({ dock: !!document.getElementById('mia-dock'), panel: !!document.getElementById('spotler-agent-panel') })")
        check("4b INT page with both tags (POC first): dock only, production stands down", r == {"dock": True, "panel": False}, r)
        await ctx.close()

        # production tag first: the POC takes the INT page over
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        reqs = await setup(ctx, [PROD, POC])
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/pricing")
        await page.wait_for_timeout(2500)
        r = await page.evaluate("""({ dock: !!document.getElementById('mia-dock'), panel: !!document.getElementById('spotler-agent-panel'),
            squeezed: document.body.classList.contains('agent-panel-open'), chats: document.querySelectorAll('#bp-embedded-webchat').length })""")
        check("4c INT page, production tag first: POC takes over (no slide-out, page not squeezed, one chat box)", r == {"dock": True, "panel": False, "squeezed": False, "chats": 1}, r)
        await page.click(".mia-arrow")
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        n = [e for e in await page.evaluate("window.__bpLog") if e[0] == "init"]
        check("4d after the takeover the arrow starts one Botpress chat in the dock", len(n) == 1 and await page.evaluate("!!document.querySelector('#mia-dock #bp-embedded-webchat.bp-ready')"), n)
        await ctx.close()

        # 5. phone width
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        await setup(ctx, [POC], phone=True)
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/")
        await page.wait_for_timeout(1200)
        m = await page.evaluate("(() => { const r=document.getElementById('mia-dock-pill').getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(innerWidth - r.right), w: document.documentElement.scrollWidth <= innerWidth } })()")
        check("5a phone: pill fits the width (12px each side), no sideways scroll", m["left"] == 12 and m["right"] == 12 and m["w"], m)
        await page.screenshot(path=f"{OUT}/5-phone.png")
        await ctx.close()
        await b.close()
    print(f"\n{sum(results)}/{len(results)} passed")
    sys.exit(0 if all(results) else 1)

asyncio.run(main())
