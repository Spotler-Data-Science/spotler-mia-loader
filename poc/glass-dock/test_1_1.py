"""poc-glass-1.1 checks on the staging tag, against the mocked Botpress and
this branch's poc/glass-dock/config.json. The mock page gets spotler.com-like
styles (Montserrat body, 16px paragraphs) to show the chat's own styles win.
Run from the repo root: node build.mjs && node poc/glass-dock/build.mjs && python poc/glass-dock/test_1_1.py"""
import asyncio, os, sys
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
POC = open(os.path.join(ROOT, "poc/glass-dock/dist/mia-poc-glass-1.1.gtm.html"), encoding="utf8").read()
RAW = open(os.path.join(ROOT, "test/mock/page.html"), encoding="utf8").read()
INJECT = open(os.path.join(ROOT, "test/mock/inject.js"), encoding="utf8").read()
PROD_CFG = open(os.path.join(ROOT, "test/mock/config.json"), encoding="utf8").read()
POC_CFG = open(os.path.join(ROOT, "poc/glass-dock/config.json"), encoding="utf8").read()
PNG = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000" "1f15c4890000000d49444154789c63f8cfc0f01f0005000201a5f6e0540000000049454e44ae426082")
# spotler.com-like site styles: its body font and paragraph style
SITE_CSS = "<style>body{font-family:Montserrat,sans-serif} p{font-size:16px;line-height:26px;margin:0 0 20px;font-family:Montserrat,sans-serif} a{font-family:Montserrat,sans-serif}</style>"

EN_OPENER = "Hi, I’m Mia, Spotler’s AI assistant. I can answer questions about our products, help you book a demo, or make sure the right colleague follows up by email."
REGIONS = [  # region, home path, products path or None, opener, chip, privacy link
    ("en-GB", "/en-gb/", "/en-gb/products", EN_OPENER, "Which product would suit me?", "https://spotler.com/en-gb/privacy-statement"),
    ("INT", "/", "/products", EN_OPENER, None, "https://spotler.com/privacy-statement"),
    ("en-DE", "/en-de/", "/en-de/products", EN_OPENER, "Which product would suit me?", "https://spotler.com/en-de/privacy-statement"),
    ("en-AU", "/en-au/", "/en-au/products", EN_OPENER, "Which product would suit me?", "https://spotler.com/en-au/privacy-statement"),
    ("NL", "/nl-nl/", "/nl-nl/producten", "Hoi, ik ben Mia, de AI-assistent van Spotler. Ik beantwoord vragen over onze producten, help je met een demo-afspraak of zorg dat de juiste collega per e-mail contact met je opneemt.",
     "Welk product past bij mij?", "https://spotler.com/nl-nl/privacy-statement"),
    ("DE", "/de-de/", None, "Hallo, ich bin Mia, die KI-Assistentin von Spotler. Ich beantworte Fragen zu unseren Produkten, helfe Ihnen, eine Demo anzufordern, oder sorge dafür, dass sich die passende Ansprechperson per E-Mail bei Ihnen meldet.",
     None, "https://spotler.com/de-de/datenschutzerklaerung"),
    ("ES", "/es-es/", None, "Hola, soy Mia, la asistente de IA de Spotler. Respondo preguntas sobre nuestros productos, te ayudo a solicitar una demo o me encargo de que la persona adecuada del equipo te contacte por email.",
     None, "https://spotler.com/es-es/politica-de-privacidad"),
    ("SV", "/sv-se/", None, "Hej, jag är Mia, Spotlers AI-assistent. Jag svarar på frågor om våra produkter, hjälper dig att boka en demo eller ser till att rätt kollega hör av sig till dig via e-post.",
     None, "https://spotler.com/sv-se/privacy-statement"),
]

results = []
def check(name, cond, detail=""):
    results.append(bool(cond))
    print(("PASS " if cond else "FAIL ") + name + (("  -- " + str(detail)) if detail and not cond else ""))

async def setup(ctx, early_hidden=False, cfg=POC_CFG, phone=False):
    pre = "<script>document.documentElement.classList.add('mia-hidden')</script>" if early_hidden else ""
    meta = '<meta name="viewport" content="width=device-width, initial-scale=1">' if phone else ""
    page_html = RAW.replace("</head>", meta + SITE_CSS + "</head>", 1).replace("<!--TAG-->", pre + "\n" + POC)
    async def handler(route):
        url = route.request.url
        if "cdn.botpress.cloud" in url: return await route.fulfill(body=INJECT, content_type="application/javascript")
        if url.endswith((".webp", ".png")): return await route.fulfill(body=PNG, content_type="image/png")
        if "poc/glass-dock/config.json" in url:
            return await route.fulfill(body=cfg, content_type="application/json", headers={"access-control-allow-origin": "*"})
        if "raw.githubusercontent.com" in url or "cdn.jsdelivr.net" in url:
            return await route.fulfill(body=PROD_CFG, content_type="application/json", headers={"access-control-allow-origin": "*"})
        if url.endswith("/logo.svg"): return await route.fulfill(body="<svg xmlns='http://www.w3.org/2000/svg'/>", content_type="image/svg+xml")
        if "spotler.com" in url: return await route.fulfill(body=page_html, content_type="text/html")
        return await route.fulfill(status=404, body="")
    await ctx.route("**/*", handler)

OPENED = """() => { const s=document.getElementById('mia-start'), ft=document.querySelector('#mia-dock-ft p'), a=document.querySelector('#mia-dock-ft a');
    const cs=e => e ? getComputedStyle(e) : null;
    return { opener: s ? [...s.querySelectorAll('.mia-intro p')].map(p => p.textContent).join(' ').trim() : null,
             chips: s ? [...s.querySelectorAll('.mia-chip')].map(c => c.textContent.trim()) : [],
             href: a ? a.getAttribute('href') : null, ftText: ft ? ft.textContent : null,
             ftSize: [cs(ft).fontSize, cs(a).fontSize, cs(document.getElementById('mia-dock-ft')).fontSize],
             fonts: { footer: cs(ft).fontFamily, link: cs(a).fontFamily, headline: cs(s && s.querySelector('h2')).fontFamily,
                      chip: s && s.querySelector('.mia-chip') ? cs(s.querySelector('.mia-chip')).fontFamily : null,
                      field: cs(document.getElementById('mia-dock-in')).fontFamily,
                      head: cs(document.querySelector('#mia-dock-head b')).fontFamily,
                      preview: cs(document.getElementById('spotler-mia-shell').shadowRoot.querySelector('.c')).fontFamily } } }"""

def is_open_sans(f): return bool(f) and f.replace("'", '"').startswith('"Open Sans"')

async def opened(b, path):
    ctx = await b.new_context(viewport={"width": 1440, "height": 900})
    await setup(ctx)
    page = await ctx.new_page()
    await page.goto("https://www.spotler.com" + path)
    await page.wait_for_timeout(1000)
    await page.click("#mia-dock-q")
    await page.wait_for_timeout(900)
    o = await page.evaluate(OPENED)
    return ctx, page, o

HIDDEN = """() => { const d=document.getElementById('mia-dock'), r=d.getBoundingClientRect(), s=getComputedStyle(d);
    const hit=document.elementFromPoint(r.left + r.width/2, r.bottom - 20);
    return { visibility: s.visibility, opacity: s.opacity, clip: s.clipPath, hitDock: !!(hit && d.contains(hit)),
             open: d.classList.contains('open'), w: Math.round(r.width), h: Math.round(r.height) } }"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROMIUM") or None)

        # 1. opener, footer link, footer size and fonts on each region's home page; the chip on its products page
        for region, home, products, opener, chip, link in REGIONS:
            ctx, page, o = await opened(b, home)
            check(f"{region}: opener", o["opener"] == opener, o["opener"])
            check(f"{region}: privacy link {link}", o["href"] in (link, None), o["href"])
            check(f"{region}: footer 14px (p, a, row)", o["ftSize"] == ["14px", "14px", "14px"], o["ftSize"])
            bad = {k: v for k, v in o["fonts"].items() if not is_open_sans(v)}
            check(f"{region}: Open Sans in the fixed texts (footer, link, headline, chips, field, header, preview)", not bad, bad)
            await ctx.close()
            if products:
                ctx, page, o = await opened(b, products)
                old = any("Not sure" in c or "Niet zeker" in c for c in o["chips"])
                if chip: check(f"{region}: products chip '{chip}'", chip in o["chips"] and not old, o["chips"])
                # INT: its default row's own "prompts" list replaces the page chip on every INT page (as in 1.0)
                else: check(f"{region}: products page shows no old chip (INT's prompts list applies)", not old, o["chips"])
                await ctx.close()

        # 2. a removed row (event management) falls back to the region's questions
        ctx, page, o = await opened(b, "/b2b/event-management")
        check("removed row: event-management page has no events chip", not any("event" in c.lower() for c in o["chips"]), o["chips"])
        await ctx.close()

        # 3. the conversation in Open Sans; then the hide switch with a running conversation
        ctx, page, o = await opened(b, "/")
        await page.fill("#mia-dock-in", "Do you integrate with Shopify?")
        await page.press("#mia-dock-in", "Enter")
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        await page.wait_for_timeout(1000)
        f = await page.evaluate("""() => { const r=window.__bpShadow; return { bubble: getComputedStyle(r.querySelector('.bpMessageBlocksBubble')).fontFamily,
            container: getComputedStyle(r.querySelector('.bpContainer')).fontFamily } }""")
        check("conversation (Botpress area) in Open Sans", is_open_sans(f["bubble"]) and is_open_sans(f["container"]), f)
        await page.evaluate("document.getElementById('bp-embedded-webchat').__miaMark = 1")
        CONV = """() => ({ msgs: [...window.__bpShadow.querySelectorAll('.bpMessageContainer')].map(m => m.textContent),
                          same: document.getElementById('bp-embedded-webchat').__miaMark === 1, open: document.getElementById('mia-dock').classList.contains('open') })"""
        before = await page.evaluate(CONV); look0 = await page.evaluate(HIDDEN)
        await page.evaluate("document.documentElement.classList.add('mia-hidden')")
        await page.wait_for_timeout(300)
        h = await page.evaluate(HIDDEN)
        cal = await page.evaluate("[...document.querySelectorAll('#hubspot-modal')].map(e => getComputedStyle(e).visibility)")
        check("mia-hidden: open chat hidden (invisible, no clicks reach it)", h["visibility"] == "hidden" and h["opacity"] == "0" and not h["hitDock"], h)
        check("mia-hidden: booking modal hidden too (if on the page)", all(v == "hidden" for v in cal), cal)
        await page.evaluate("document.documentElement.classList.remove('mia-hidden')")
        await page.wait_for_timeout(300)
        after = await page.evaluate(CONV); look1 = await page.evaluate(HIDDEN)
        check("mia-hidden removed: chat back, still open, same size", look1["visibility"] == "visible" and look1["hitDock"] and look1["open"]
              and (look1["w"], look1["h"]) == (look0["w"], look0["h"]), [look0, look1])
        check("mia-hidden removed: conversation intact (same messages, same Botpress element)", after["msgs"] == before["msgs"] and len(before["msgs"]) >= 2 and after["same"], [before, after])
        # still usable after
        await page.fill("#mia-dock-in", "And Magento?"); await page.click(".mia-arrow"); await page.wait_for_timeout(400)
        log = await page.evaluate("window.__bpLog")
        check("after restore: sending still works", ["sendMessage", "And Magento?"] in log, log[-3:])
        await ctx.close()

        # 4. closed pill: hidden and back
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}); await setup(ctx)
        page = await ctx.new_page(); await page.goto("https://www.spotler.com/"); await page.wait_for_timeout(1000)
        await page.evaluate("document.documentElement.classList.add('mia-hidden')"); h = await page.evaluate(HIDDEN)
        await page.evaluate("document.documentElement.classList.remove('mia-hidden')"); v = await page.evaluate(HIDDEN)
        check("closed pill: hidden with the class, back without it", h["visibility"] == "hidden" and not h["hitDock"] and v["visibility"] == "visible" and v["hitDock"], [h, v])
        await ctx.close()

        # 5. class set before the tag loads
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}); await setup(ctx, early_hidden=True)
        page = await ctx.new_page(); await page.goto("https://www.spotler.com/"); await page.wait_for_timeout(1500)
        h = await page.evaluate(HIDDEN)
        await page.evaluate("document.documentElement.classList.remove('mia-hidden')"); await page.wait_for_timeout(200)
        v = await page.evaluate(HIDDEN)
        check("class set before the chat loads: hidden from the start, appears when removed", h["visibility"] == "hidden" and not h["hitDock"] and v["visibility"] == "visible" and v["hitDock"], [h, v])
        await ctx.close()

        # 6. phone: footer 14px too
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True); await setup(ctx, phone=True)
        page = await ctx.new_page(); await page.goto("https://www.spotler.com/"); await page.wait_for_timeout(1000)
        await page.click("#mia-dock-q"); await page.wait_for_timeout(900)
        o = await page.evaluate(OPENED)
        check("phone: footer 14px", o["ftSize"] == ["14px", "14px", "14px"], o["ftSize"])
        await ctx.close()

        await b.close()
    print(f"\n{sum(results)}/{len(results)} passed")
    sys.exit(0 if all(results) else 1)

asyncio.run(main())
