"""Headless checks for the demo build's showcase (Services page), against the mocked Botpress.
Run from the repo root: node glass-dock/build.mjs --demo && python3 glass-dock/test_demo.py"""
import asyncio, os, sys, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DOCK_TAG", os.path.join(ROOT, "glass-dock/dist/mia-glass-dock-1.11.demo-staging.gtm.html"))
spec = importlib.util.spec_from_file_location("t", os.path.join(ROOT, "glass-dock/test.py")); t = importlib.util.module_from_spec(spec)
sys.modules["t"] = t; spec.loader.exec_module(t)   # test.py only defines things until main() runs
from playwright.async_api import async_playwright
ADDON = open(os.path.join(ROOT, "glass-dock/dist/mia-glass-dock-1.11.demo-showcase.gtm.html")).read()
LATE = "<script>setTimeout(function(){var s=document.createElement('script');s.textContent=" + __import__("json").dumps(ADDON.split("\n", 2)[2].rsplit("</script>", 1)[0]) + ";document.head.appendChild(s);}, 1200)</script>"
REAL = open(os.path.join(ROOT, "glass-dock/config.json"), encoding="utf-8").read()
_c = __import__("json").loads(REAL)
for _r in _c["rows"]: _r.pop("showcase", None)
_c["version"] = "2026-11-06.1"
PLAIN = __import__("json").dumps(_c)   # the page table as staging has it now: no showcase
SENT = "() => window.__bpLog.filter(e => e[0] === 'sendMessage').map(e => e[1])"
check, OUT = t.check, t.OUT

async def page_at(b, path, vp={"width": 1440, "height": 900}, phone=False, ctx=None, tags=None, cfg=None):
    ctx = ctx or await b.new_context(viewport=vp, **({"is_mobile": True, "has_touch": True} if phone else {}))
    await t.setup(ctx, tags or [ADDON, t.POC], phone=phone, mkt=cfg or REAL)
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
        check("D3 6 slides, 6 steps, the first slide on", r["slides"] == 6 and r["dots"] == 6 and r["on"] == "Your AI assistant, working inside Spotler.", r)
        check("D4 the field's placeholder from the page table", r["ph"] == "Tell Spot what you want to achieve...", r["ph"])
        check("D5 three action buttons, the page table's look applied", r["actions"] == ["See MCP examples", "Explore use cases", "Book a walkthrough"] and r["styled"], r)
        check("D6 the demo version in the log", any("glass dock glass-dock-1.11-demo" in l for l in logs), [l for l in logs if "glass dock" in l])
        await page.screenshot(path=f"{OUT}/demo-1.png")
        await page.click(".mia-sc-next"); await page.wait_for_timeout(400)
        a = await page.evaluate("document.querySelector('.mia-sc-slide.on .mia-sc-title').textContent")
        await page.click(".mia-sc-prev"); await page.click(".mia-sc-prev"); await page.wait_for_timeout(400)
        z = await page.evaluate("document.querySelector('.mia-sc-slide.on .mia-sc-title').textContent")
        check("D7 next / previous move the slides, and wrap round", a == "Tell Spot what you want to achieve." and z == "You stay in charge.", [a, z])
        await page.screenshot(path=f"{OUT}/demo-4.png")
        await page.click(".mia-sc-dot >> nth=1"); await page.wait_for_timeout(300)
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
        ctx, page, logs = await page_at(b, "/en-gb/services", tags=[t.POC, LATE])
        await page.wait_for_timeout(800)
        r = await page.evaluate("[document.getElementById('mia-dock').classList.contains('open'), !!document.getElementById('mia-showcase'), !!document.getElementById('mia-start')]")
        check("D15 add-on loads late (after the demo tag): the showcase still opens, no start screen left", r == [True, True, False], r)
        await ctx.close()

        ctx, page, logs = await page_at(b, "/en-gb/services", tags=[t.POC])
        await page.wait_for_timeout(5500)
        await page.click("#mia-dock-q"); await page.wait_for_timeout(900)
        r = await page.evaluate("[!!document.getElementById('mia-start'), !!document.getElementById('mia-showcase')]")
        check("D16 no add-on: the normal start screen, nothing breaks", r == [True, False] and any("showcase add-on not found" in l for l in logs), [r, [l for l in logs if "showcase" in l]])
        await ctx.close()
        for path, want in (("/en-gb/services", True), ("/services/", True), ("/en-au/services", True), ("/en-gb/pricing", False), ("/nl-nl/services", False)):
            ctx, page, logs = await page_at(b, path, cfg=PLAIN)
            r = await page.evaluate("[document.getElementById('mia-dock').classList.contains('open'), !!document.getElementById('mia-showcase'), document.querySelectorAll('.mia-sc-slide').length, !!document.getElementById('mia-showcase-style')]")
            check(f"D18 page table without showcase, {path}: built-in showcase {'shown' if want else 'not shown'}", r == ([True, True, 6, True] if want else [False, False, 0, False]), r)
            if path == "/en-gb/services":
                await page.screenshot(path=f"{OUT}/demo-builtin.png")
                await page.click(".mia-sc-dot >> nth=1"); await page.wait_for_timeout(300)
                await page.click(".mia-sc-slide.on .mia-sc-cta"); await page.wait_for_timeout(1500)
                check("D19 built-in: 'Generate my prompt' sends the goal", (await page.evaluate(SENT))[:1] == ["Generate my prompt: I want to build a campaign that nurtures ecommerce leads and recommends the next best action."], await page.evaluate(SENT))
            await ctx.close()
        # laptops: no scrolling inside the showcase, on any slide, and the box keeps one height between slides
        for w, h in ((1280, 600), (1366, 657), (1536, 730), (1440, 780), (1920, 960)):
            ctx, page, logs = await page_at(b, "/en-gb/services", vp={"width": w, "height": h}, cfg=PLAIN)
            await page.wait_for_timeout(400)
            res = []
            for k in range(6):
                res.append(await page.evaluate("""() => { const s=document.getElementById('mia-showcase'), c=s.querySelector('.mia-sc-card').getBoundingClientRect();
                    return [s.scrollHeight - s.clientHeight, Math.round(c.height), s.querySelector('.mia-sc-wrap').style.zoom || '1'] }"""))
                await page.click(".mia-sc-next"); await page.wait_for_timeout(450)
            await page.screenshot(path=f"{OUT}/demo-{w}x{h}.png")
            check(f"D20 {w}x{h}: no scrolling on any slide, same height on every slide (scale {res[0][2]})", all(r[0] <= 1 for r in res) and len({r[1] for r in res}) == 1, res)
            await ctx.close()
        ctx, page, logs = await page_at(b, "/en-gb/services")
        await page.click(".mia-sc-slide.on .mia-sc-cta"); await page.wait_for_timeout(1500)
        check("D21 first slide's button asks what the MCP is", (await page.evaluate(SENT))[:1] == ["What is the Spotler MCP and what can it do for me?"], await page.evaluate(SENT))
        await ctx.close()
        ctx, page, logs = await page_at(b, "/en-gb/services")
        await page.click(".mia-sc-dot >> nth=2"); await page.wait_for_timeout(200)
        mid = await page.evaluate("document.querySelector('.mia-sc-slide.on .mia-sc-typed').textContent.length")
        await page.wait_for_timeout(1500)
        r = await page.evaluate("""() => { const s=document.querySelector('.mia-sc-slide.on'); return [s.querySelector('.mia-sc-typed').textContent === s.querySelector('.mia-sc-ghost').textContent,
            !!s.querySelector('.mia-sc-art svg'), !document.querySelector('.mia-sc-badge .mia-sc-ico'), document.querySelector('.mia-sc-dot.on').textContent] }""")
        check("D22 the prompt types itself out, each slide has a picture, no bolt in the badge, step names", 0 < mid and r == [True, True, True, "Emails"], [mid, r])
        await page.screenshot(path=f"{OUT}/demo-emails.png")
        # a showcase left over (e.g. mounted twice) never stays over the live chat
        await page.evaluate("document.getElementById('mia-dock-chat').querySelector('#mia-showcase').parentNode.appendChild(document.getElementById('mia-showcase').cloneNode(true))")
        await page.evaluate("document.querySelectorAll('.mia-sc-action')[1].click()"); await page.wait_for_timeout(1500)
        check("D23 after an action button: no showcase left over the chat", await page.evaluate("document.querySelectorAll('#mia-showcase').length") == 0)
        await ctx.close()
        # a site with heavy styles of its own (lists, paragraphs, headings): nothing leaks into the slides
        HOSTILE = ("ul, ol { list-style: disc !important; margin: -24px 0 0 !important; padding-left: 30px; } li { margin: 0 0 -6px; line-height: 1.1; display: list-item; }"
                   " p { margin: 0 0 -20px; height: 24px; line-height: 2; float: left; } h2 { margin: 40px 0; text-transform: uppercase; } span { display: inline; }")
        ctx, page, logs = await page_at(b, "/en-gb/services", vp={"width": 1536, "height": 840})
        await page.add_style_tag(content=HOSTILE); await page.wait_for_timeout(500)
        r = await page.evaluate("""() => { const s=document.querySelector('.mia-sc-slide.on'), t=s.querySelector('.mia-sc-text').getBoundingClientRect(), h=s.querySelector('.mia-sc-title').getBoundingClientRect(),
            l=s.querySelector('.mia-sc-points').getBoundingClientRect(), pts=[...s.querySelectorAll('.mia-sc-point')].map(e => e.getBoundingClientRect());
            return { order: h.bottom <= t.top + 1 && t.bottom <= l.top + 1, gaps: pts.every((p, i) => !i || pts[i-1].bottom <= p.top + 1),
                     bullets: getComputedStyle(s.querySelector('.mia-sc-point')).display, upper: getComputedStyle(s.querySelector('.mia-sc-title')).textTransform } }""")
        await page.screenshot(path=f"{OUT}/demo-hostile.png")
        check("D24 the site's list / paragraph / heading styles don't reach the slides", r["order"] and r["gaps"] and r["bullets"] == "flex" and r["upper"] == "none", r)
        await ctx.close()
        # moves on by itself: slide 1 after 5s, the others after 20s; going back stops it (until a restart)
        ON = "[...document.querySelectorAll('.mia-sc-slide')].findIndex(s => s.classList.contains('on'))"
        ctx, page, logs = await page_at(b, "/en-gb/services")
        a0 = await page.evaluate(ON); await page.wait_for_timeout(4300); a1 = await page.evaluate(ON)
        await page.wait_for_timeout(1800); a2 = await page.evaluate(ON); await page.wait_for_timeout(7000); a3 = await page.evaluate(ON)
        txt = await page.evaluate("document.querySelector('.mia-sc-slide').textContent + document.getElementById('mia-dock-in').placeholder")
        big = await page.evaluate("[document.querySelector('.mia-sc-slide .mia-sc-art').getBoundingClientRect().width, document.querySelectorAll('.mia-sc-slide animateMotion').length]")
        check("D25 every slide moves on after 7s (not before)", (a0, a1, a2, a3) == (0, 0, 1, 2), (a0, a1, a2, a3))
        await page.click(".mia-sc-dot >> nth=5"); await page.wait_for_timeout(2500)
        await page.screenshot(path=f"{OUT}/demo-charge.png")
        r = await page.evaluate("""() => { const s=document.querySelector('.mia-sc-slide.on'), a=s.querySelector('.mia-sc-art').getBoundingClientRect(), h=s.querySelector('.mia-sc-head').getBoundingClientRect();
            return [s.querySelector('.mia-sc-art').className, Math.round(a.width), Math.abs((a.top + a.bottom) / 2 - (h.top + h.bottom) / 2) < 7] }""")
        check("D29 'You stay in charge': the big picture, centred", r[0] == "mia-sc-art mia-sc-art-lg" and r[1] >= 300 and r[2], r)
        await page.click(".mia-sc-dot >> nth=1"); await page.wait_for_timeout(300)
        check("D26 Spot, not Mia; no 'such as Mia'; a bigger, moving first picture", "Mia" not in txt and "Tell Spot" in txt and big[0] >= 300 and big[1] >= 4, [txt[:200], big])
        await page.click(".mia-sc-prev"); await page.wait_for_timeout(7800)
        a3 = await page.evaluate(ON)
        check("D27 after going back, no more moving on by itself", a3 == 0, a3)
        await page.click("#mia-dock-head button >> nth=0"); await page.wait_for_timeout(7800)
        check("D28 a restart brings the timer back", await page.evaluate(ON) == 1, await page.evaluate(ON))
        await page.screenshot(path=f"{OUT}/demo-hub.png")
        await ctx.close()
        for f in ("demo-staging", "demo-showcase"):
            n = len(open(os.path.join(ROOT, f"glass-dock/dist/mia-glass-dock-1.11.{f}.gtm.html")).read())
            check(f"D17 {f} tag under GTM's 102,400 characters", n <= 102400, n)
        await b.close()
    print(f"\n{sum(t.results)}/{len(t.results)} passed")
    sys.exit(0 if all(t.results) else 1)
asyncio.run(main())
