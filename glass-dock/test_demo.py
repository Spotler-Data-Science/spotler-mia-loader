"""Headless checks for the demo build's showcase (Services page), against the mocked Botpress.
Run from the repo root: node glass-dock/build.mjs --demo && python3 glass-dock/test_demo.py"""
import asyncio, os, sys, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DOCK_TAG", os.path.join(ROOT, "glass-dock/dist/mia-glass-dock-1.11.demo-staging.gtm.html"))
spec = importlib.util.spec_from_file_location("t", os.path.join(ROOT, "glass-dock/test.py")); t = importlib.util.module_from_spec(spec)
sys.modules["t"] = t; spec.loader.exec_module(t)   # test.py only defines things until main() runs
from playwright.async_api import async_playwright
REAL = open(os.path.join(ROOT, "glass-dock/config.json"), encoding="utf-8").read()
SENT = "() => window.__bpLog.filter(e => e[0] === 'sendMessage').map(e => e[1])"
check, OUT = t.check, t.OUT

async def page_at(b, path, vp={"width": 1440, "height": 900}, phone=False, ctx=None):
    ctx = ctx or await b.new_context(viewport=vp, **({"is_mobile": True, "has_touch": True} if phone else {}))
    await t.setup(ctx, [t.POC], phone=phone, mkt=REAL)
    page = await ctx.new_page(); logs = []; page.on("console", lambda m: logs.append(m.text))
    await page.goto("https://www.spotler.com" + path); await page.wait_for_timeout(2200)
    return ctx, page, logs

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROMIUM") or None)
        ctx, page, logs = await page_at(b, "/en-gb/services")
        r = await page.evaluate("""() => { const d=document.getElementById('mia-dock'), s=document.getElementById('mia-showcase'), r=d.getBoundingClientRect();
            return { open: d.classList.contains('open'), show: !!s, start: !!document.getElementById('mia-start'), w: Math.round(r.width), h: Math.round(r.height),
              slides: s ? s.querySelectorAll('.mia-sc-slide').length : 0, dots: s ? s.querySelectorAll('.mia-sc-dot').length : 0,
              on: s ? s.querySelector('.mia-sc-slide.on .mia-sc-title').textContent : '', ph: document.getElementById('mia-dock-in').placeholder,
              actions: s ? [...s.querySelectorAll('.mia-sc-action')].map(a => a.textContent) : [], styled: !!document.getElementById('mia-showcase-style'),
              ver: (logs => 1)() } }""")
        check("D1 Services page: the chat opens by itself, showing the showcase (not the start screen)", r["open"] and r["show"] and not r["start"], r)
        check("D2 bigger chat: 1100px wide, as tall as the screen allows (to 860)", r["w"] == 1100 and r["h"] >= 900 - 160, [r["w"], r["h"]])
        check("D3 4 slides, 4 dots, the first slide on", r["slides"] == 4 and r["dots"] == 4 and r["on"] == "Tell Mia what you want to achieve.", r)
        check("D4 the field's placeholder from the page table", r["ph"] == "Tell Mia what you want to achieve...", r["ph"])
        check("D5 three action buttons, the page table's look applied", r["actions"] == ["See MCP examples", "Explore use cases", "Book a walkthrough"] and r["styled"], r)
        check("D6 the demo version in the log", any("glass dock glass-dock-1.11-demo" in l for l in logs), [l for l in logs if "glass dock" in l])
        await page.screenshot(path=f"{OUT}/demo-1.png")
        await page.click(".mia-sc-next"); await page.wait_for_timeout(400)
        a = await page.evaluate("document.querySelector('.mia-sc-slide.on .mia-sc-title').textContent")
        await page.click(".mia-sc-prev"); await page.click(".mia-sc-prev"); await page.wait_for_timeout(400)
        z = await page.evaluate("document.querySelector('.mia-sc-slide.on .mia-sc-title').textContent")
        check("D7 next / previous move the slides, and wrap round", a == "Write your next email from a brief." and z == "Find where your journeys lose people.", [a, z])
        await page.screenshot(path=f"{OUT}/demo-4.png")
        await page.click(".mia-sc-dot >> nth=0"); await page.wait_for_timeout(300)
        await page.click(".mia-sc-slide.on .mia-sc-cta"); await page.wait_for_timeout(1500)
        sent = await page.evaluate(SENT)
        check("D8 'Generate my prompt' sends 'Generate my prompt: <goal>' and the showcase gives way to the chat",
              sent[:1] == ["Generate my prompt: I want to build a campaign that nurtures ecommerce leads and recommends the next best action."]
              and not await page.evaluate("!!document.getElementById('mia-showcase')"), sent)
        await page.screenshot(path=f"{OUT}/demo-chat.png")
        await ctx.close()

        ctx, page, logs = await page_at(b, "/services")
        await page.click(".mia-sc-action >> nth=2"); await page.wait_for_timeout(1500)
        check("D9 INT /services: an action button sends its message", (await page.evaluate(SENT))[:1] == ["I'd like to book a Spotler MCP walkthrough"], await page.evaluate(SENT))
        await ctx.close()

        ctx, page, logs = await page_at(b, "/en-gb/services")
        await page.type("#mia-dock-in", "Help me plan a re-engagement campaign"); await page.keyboard.press("Enter"); await page.wait_for_timeout(1500)
        check("D10 the text field works from the showcase", (await page.evaluate(SENT))[:1] == ["Help me plan a re-engagement campaign"], await page.evaluate(SENT))
        await ctx.close()

        ctx, page, logs = await page_at(b, "/en-gb/services")
        await page.click("#mia-dock-head button >> nth=-1"); await page.wait_for_timeout(700)
        closed = not await page.evaluate("document.getElementById('mia-dock').classList.contains('open')")
        await page.reload(); await page.wait_for_timeout(2200)
        still = not await page.evaluate("document.getElementById('mia-dock').classList.contains('open')")
        check("D11 closed by the visitor: stays closed on reload (this session)", closed and still, [closed, still])
        await page.click("#mia-dock-q"); await page.wait_for_timeout(900)
        check("D12 reopened from the pill: the showcase again", await page.evaluate("!!document.getElementById('mia-showcase')"))
        await ctx.close()

        ctx, page, logs = await page_at(b, "/en-gb/pricing")
        r = await page.evaluate("[document.getElementById('mia-dock').classList.contains('open'), !!document.getElementById('mia-showcase-style'), document.getElementById('mia-dock-in').placeholder]")
        await page.click("#mia-dock-q"); await page.wait_for_timeout(900)
        st = await page.evaluate("[!!document.getElementById('mia-start'), !!document.getElementById('mia-showcase'), Math.round(document.getElementById('mia-dock').getBoundingClientRect().width)]")
        check("D13 other pages unchanged: no auto-open, normal start screen and size", not r[0] and not r[1] and st[0] and not st[1] and st[2] <= 860, [r, st])
        await ctx.close()

        ctx, page, logs = await page_at(b, "/en-gb/services", vp={"width": 390, "height": 844}, phone=True)
        o = await page.evaluate("document.getElementById('mia-dock').classList.contains('open')")
        await page.click("#mia-dock-q"); await page.wait_for_timeout(900)
        sw = await page.evaluate("document.getElementById('mia-showcase').scrollWidth <= innerWidth")
        await page.screenshot(path=f"{OUT}/demo-phone.png")
        check("D14 phones: no auto-open; opened, the showcase fits the screen width", not o and sw, [o, sw])
        await ctx.close()
        await b.close()
    print(f"\n{sum(t.results)}/{len(t.results)} passed")
    sys.exit(0 if all(t.results) else 1)
asyncio.run(main())
