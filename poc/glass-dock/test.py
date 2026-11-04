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
HS_PAGE = open(os.path.join(ROOT, "test/mock/hubspot-meetings.html")).read()
PROMPTS = ["How can Spotler help my business?", "Which Spotler product fits an online shop?", "Can I book a demo this week?",
           "How does Spotler use AI in email marketing?", "What does Spotler cost?"]

results = []
def check(name, cond, detail=""):
    results.append(bool(cond))
    print(("PASS " if cond else "FAIL ") + name + (("  -- " + str(detail)) if detail and not cond else ""))

async def setup(ctx, tags, phone=False, mkt=None, mkt_cors=True):
    page_html = RAW.replace("<!--TAG-->", "\n".join(tags))
    if phone: page_html = page_html.replace("</head>", '<meta name="viewport" content="width=device-width, initial-scale=1"></head>', 1)
    reqs = []
    async def handler(route):
        url = route.request.url; reqs.append(url)
        if "cdn.botpress.cloud" in url: return await route.fulfill(body=INJECT, content_type="application/javascript")
        if url.endswith((".webp", ".png")): return await route.fulfill(body=PNG, content_type="image/png")
        if "poc/glass-dock/config.json" in url:
            if mkt is None: return await route.fulfill(status=404, body="")
            if not mkt_cors: return await route.abort("failed")   # what a CORS block looks like to the page
            return await route.fulfill(body=mkt, content_type="application/json", headers={"access-control-allow-origin": "*"} if mkt_cors else {})
        if "raw.githubusercontent.com" in url or "cdn.jsdelivr.net" in url:
            return await route.fulfill(body=CONFIG, content_type="application/json", headers={"access-control-allow-origin": "*"})
        if "meetings" in url and "hubspot.com" in url: return await route.fulfill(body=HS_PAGE, content_type="text/html")
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
        st = await page.evaluate("""() => { const d=document.getElementById('mia-dock'), r=d.getBoundingClientRect();
            return { open: d.classList.contains('open'), bottom: Math.round(innerHeight - r.bottom), centre: Math.round(r.left + r.width/2 - innerWidth/2),
                     fixed: getComputedStyle(d).position, blur: getComputedStyle(d).backdropFilter || getComputedStyle(d).webkitBackdropFilter } }""")
        check("1a pill fixed at the bottom centre, glass (blur), card closed", st["fixed"] == "fixed" and st["bottom"] == 24 and abs(st["centre"]) <= 1 and "blur" in (st["blur"] or "") and not st["open"], st)
        check("1b pill types a question letter by letter", len(seen) >= 4 and any(PROMPTS[0].startswith(s) and 0 < len(s) < len(PROMPTS[0]) for s in seen), sorted(seen)[:6])
        check("1c no Botpress on page view", not bp(reqs), bp(reqs))
        c = await page.evaluate("[getComputedStyle(document.querySelector('.mia-arrow')).backgroundColor, getComputedStyle(document.getElementById('mia-dock-q'), '::after').backgroundColor]")
        check("1e glass send button (see-through Get-a-demo cyan) and the same cyan cursor", c[0].startswith("rgba(47, 172, 230, 0.6") and c[1] == "rgb(47, 172, 230)", c)
        check("1d INT page: production loader not started", not await page.evaluate("!!document.getElementById('spotler-agent-panel')"))
        await page.screenshot(path=f"{OUT}/1-pill.png")

        # 2. click the text: the chat grows up out of the pill; greeting, buttons, the pill's row is the empty focused field
        LOOK = """() => { const d=document.getElementById('mia-dock'), p=document.getElementById('mia-dock-pill').getBoundingClientRect(), s=getComputedStyle(d);
            return { rowTop: Math.round(p.top), rowBottom: Math.round(p.bottom), rowH: Math.round(p.height), width: Math.round(d.getBoundingClientRect().width),
                     height: Math.round(d.getBoundingClientRect().height), radius: s.borderTopLeftRadius, bg: s.backgroundImage, opacity: s.opacity } }"""
        before = await page.evaluate(LOOK)
        await page.click("#mia-dock-q")
        mid = None
        START = "[document.getElementById('mia-start').className, getComputedStyle(document.querySelector('#mia-start h2')).fontSize, Math.round(document.querySelector('#mia-start .mia-cards').getBoundingClientRect().height)]"
        early = await page.evaluate(START)
        await page.wait_for_timeout(200); mid = await page.evaluate(LOOK)
        await page.wait_for_timeout(600)
        after = await page.evaluate(LOOK)
        late = await page.evaluate(START)
        check("8j opening: the start screen has its final layout from the first frame (no small-then-bigger jump)", early == late, [early, late])
        c = await page.evaluate("""() => { const sr=document.getElementById('spotler-mia-shell').shadowRoot, i=document.getElementById('mia-dock-in'), s=document.getElementById('mia-start');
            return { open: document.getElementById('mia-dock').classList.contains('open'), text: s.textContent, buttons: s.querySelectorAll('.mia-card').length,
                     value: i.value, focused: document.activeElement === i, shellComposer: getComputedStyle(sr.querySelector('.cmp')).display,
                     mic: !!sr.querySelector('.cmp .mic') && getComputedStyle(sr.querySelector('.cmp')).display !== 'none' } }""")
        await page.screenshot(path=f"{OUT}/2-start.png")
        st = await page.evaluate("""() => { const s=document.getElementById('mia-start'), cards=[...s.querySelectorAll('.mia-card')];
            return { title: s.querySelector('h2').textContent, cards: cards.map(c => [c.querySelector('b').textContent, (c.querySelector('.mia-t span')||{}).textContent || '', !!c.querySelector('.mia-ico svg')]),
                     ask: s.querySelector('.mia-ask h3').textContent, chips: [...s.querySelectorAll('.mia-chip')].map(c => c.textContent),
                     cols: getComputedStyle(s.querySelector('.mia-cards')).gridTemplateColumns.split(' ').length } }""")
        check("8a start screen: headline, a card per button (icon + a line under each), two columns", st["title"] == "Hello, I\u2019m Mia" and len(st["cards"]) == 4
              and all(c[1] and c[2] for c in st["cards"]) and st["cols"] == 2, st)
        ns = await page.evaluate("""() => { const s=document.getElementById('mia-start'); return { sh: s.scrollHeight, ch: s.clientHeight, fit: s.className } }""")
        check("8f the start screen fits without scrolling on first open", ns["sh"] <= ns["ch"] + 1, ns)
        ic = await page.evaluate("""() => [...document.querySelectorAll('#mia-dock-head button[aria-label]')].map(b => { const r=b.getBoundingClientRect(), s=b.querySelector('svg').getBoundingClientRect();
            return [Math.abs((r.left + r.width/2) - (s.left + s.width/2)), Math.abs((r.top + r.height/2) - (s.top + s.height/2))] })""")
        hn = await page.evaluate("[getComputedStyle(document.querySelector('#mia-dock-head img')).display, !!document.getElementById('mia-dock-cancel')]")
        check("8h normal chat header: Mia shown, no Cancel", hn == ["block", False], hn)
        check("8g restart and close icons sit dead centre in their buttons", len(ic) == 2 and all(dx < 0.6 and dy < 0.6 for dx, dy in ic), ic)
        check("8b 'Others often ask': the first three of the pill's questions", st["ask"] == "Others often ask" and st["chips"] == PROMPTS[:3], st)
        check("2a text click opens the chat: greeting + buttons; the pill's row is the empty, focused text field; no other composer or mic", c["open"] and "Hi, I" in c["text"] and c["buttons"] >= 3 and c["value"] == "" and c["focused"] and c["shellComposer"] == "none" and not c["mic"], c)
        check("2f the text field stays in the pill's row (same size; lifts 30px for the privacy line)", before["rowH"] == after["rowH"] and before["rowTop"] - after["rowTop"] == 30, [before, after])
        check("2g opens wider (600 → up to 860px) and taller, growing smoothly (mid-way in between)",
              after["width"] == 860 and before["width"] == 600 and before["width"] < mid["width"] < after["width"] and before["height"] < mid["height"] < after["height"], [before, mid, after])
        o = await page.evaluate("""() => { const d=document.getElementById('mia-dock').getBoundingClientRect(), h=document.getElementById('header').getBoundingClientRect(),
            p=document.getElementById('mia-dock-pill').getBoundingClientRect(), f=document.getElementById('mia-dock-ft'), fr=f.getBoundingClientRect(), i=getComputedStyle(document.getElementById('mia-dock-in'));
            return { top: Math.round(d.top), header: Math.round(h.bottom), dockBottomGap: Math.round(innerHeight - d.bottom), ftTop: Math.round(fr.top), ftH: Math.round(fr.height), pillBottom: Math.round(p.bottom),
                     ftText: f.textContent, ftLink: (f.querySelector('a') || {}).href, inBorder: i.borderTopWidth, inBg: i.backgroundColor, inBorderC: i.borderTopColor,
                     inH: Math.round(document.getElementById('mia-dock-in').getBoundingClientRect().height), btnH: Math.round(document.querySelector('.mia-arrow').getBoundingClientRect().height) } }""")
        check("2j the open chat stops 8px below the site's menu bar", o["header"] + 7 <= o["top"] <= o["header"] + 11, o)
        check("2k AI assistant · Privacy sits below the text field (30px row); the open glass keeps the closed pill's 24px from the bottom", o["ftTop"] >= o["pillBottom"] - 1 and o["ftH"] == 30 and o["dockBottomGap"] == 24 and o["ftText"] == "AI assistant · Privacy" and o["ftLink"] == "https://spotler.com/privacy-statement", o)
        al = await page.evaluate("""() => { const d=document.getElementById('mia-dock').getBoundingClientRect(), f=document.getElementById('mia-dock-in').getBoundingClientRect(), a=document.querySelector('#mia-dock-pill .mia-arrow').getBoundingClientRect();
            return [Math.round(f.left - d.left), Math.round(a.left - f.right), Math.round(d.right - a.right)] }""")
        check("2m open: field and send button in line with the messages (29px in), 28px between them", al == [29, 28, 29], al)
        check("2l open, the field looks like a field: white box, thin grey outline, as tall as the send button", o["inBorder"] == "1px" and o["inBg"] not in ("rgba(0, 0, 0, 0)", "transparent") and o["inBorderC"].startswith("rgba(11, 31, 77") and o["inH"] == o["btnH"], o)
        check("2h same glass, opacity and corner radius open as closed", before["radius"] == after["radius"] == "34px" and before["bg"] == after["bg"] and before["opacity"] == after["opacity"] == "1", [before, after])
        check("2b still no Botpress", not bp(reqs), bp(reqs))
        await page.screenshot(path=f"{OUT}/2-card.png")
        # typing your own message then starts the chat as usual
        await page.fill("#mia-dock-in", "Do you integrate with Shopify?")
        await page.press("#mia-dock-in", "Enter")
        await page.wait_for_timeout(800)
        st = await page.evaluate("""() => { const sr=document.getElementById('spotler-mia-shell').shadowRoot, b=sr.querySelector('.m.out .b'), s=sr.querySelector('.st');
            return b && s ? { bubbleBottom: Math.round(b.getBoundingClientRect().bottom), statusTop: Math.round(s.getBoundingClientRect().top) } : null }""")
        check("2m 'Delivered' sits clear under the bubble (no overlap)", st and st["statusTop"] >= st["bubbleBottom"], st)
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        log = await page.evaluate("window.__bpLog")
        check("2c own message typed in the card goes to the chat", ["sendMessage", "Do you integrate with Shopify?"] in log, log[-4:])
        await page.wait_for_timeout(800)
        g = await page.evaluate("""() => { const r=window.__bpShadow; return { glass: !!r.querySelector('style[data-mia-dock]'), bg: getComputedStyle(r.querySelector('.bpContainer')).backgroundColor,
            composer: getComputedStyle(r.querySelector('.bpComposerContainer')).display, field: document.getElementById('mia-dock-in').value } }""")
        check("2d live chat stays see-through, no Botpress composer (the pill's field is the text box), field cleared", g["glass"] and g["bg"] in ("rgba(0, 0, 0, 0)", "transparent") and g["composer"] == "none" and g["field"] == "", g)
        await page.fill("#mia-dock-in", "And with Magento?")
        await page.click(".mia-arrow")
        await page.wait_for_timeout(400)
        log = await page.evaluate("window.__bpLog")
        check("2i in the conversation, the pill's field (arrow) sends into the live chat", ["sendMessage", "And with Magento?"] in log, log[-3:])
        # Botpress re-renders and drops our styles: they come back, so the chat never turns white
        await page.evaluate("() => { const r=window.__bpShadow; r.querySelector('style[data-mia-dock]').remove(); const w=document.createElement('div'); w.className='bpX'; w.style.cssText='position:absolute;inset:0;background:#fff'; r.querySelector('.bpContainer').appendChild(w); }")
        await page.wait_for_timeout(400)
        g = await page.evaluate("""() => { const r=window.__bpShadow; return { css: !!r.querySelector('style[data-mia-dock]'), bg: getComputedStyle(r.querySelector('.bpContainer')).backgroundColor,
            white: getComputedStyle(r.querySelector('.bpX')).backgroundColor, ftBp: getComputedStyle(r.querySelector('.bpFooter') || document.body).display } }""")
        ff = await page.evaluate("""() => { const sr=document.getElementById('spotler-mia-shell').shadowRoot, r=window.__bpShadow;
            return [getComputedStyle(sr.querySelector('.c')).fontFamily, getComputedStyle(r.querySelector('.bpMessageBlocksBubble')).fontFamily] }""")
        check("2p live chat in the same font as the preview (no re-wrap at the swap)", ff[0] and ff[0] == ff[1], ff)
        same = await page.evaluate("""async () => { const r=window.__bpShadow; r.querySelector('style[data-mia-dock]').remove();
            await Promise.resolve(); return !!r.querySelector('style[data-mia-dock]') }""")
        check("2q Botpress re-renders: our styles are back before the next frame is painted", same)
        sd = await page.evaluate("() => { const r=window.__bpShadow, b=document.createElement('button'); b.className='bpMessageListScrollDownButton'; r.querySelector('.bpContainer').appendChild(b); return getComputedStyle(b).display }")
        check("2o no Botpress scroll-down arrow", sd == "none", sd)
        check("2n Botpress re-renders: glass styles put back, a new white panel cleared (stays see-through)", g["css"] and g["bg"] in ("rgba(0, 0, 0, 0)", "transparent") and g["white"] in ("rgba(0, 0, 0, 0)", "transparent"), g)
        await page.screenshot(path=f"{OUT}/2-live.png")
        await ctx.close()

        # 11. the in-chat calendar, in the dock's style
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await setup(ctx, [POC])
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/"); await page.wait_for_timeout(1500)
        await page.click(".mia-arrow")
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        await page.evaluate("window.__bpEmit('customEvent', { action: 'showHubSpotCalendar', url: 'https://meetings-eu1.hubspot.com/isabelle-chadwick' })")
        await page.wait_for_timeout(5000)
        cal = await page.evaluate("""() => { const l=document.getElementById('spotler-cal'), r=l.shadowRoot, s=getComputedStyle(r.querySelector('.sheet')), c=r.querySelector('.card').getBoundingClientRect(),
            d=document.getElementById('mia-dock'), lr=l.getBoundingClientRect(), dr=d.getBoundingClientRect(),
            bar=r.querySelector('.bar').getBoundingClientRect(), intro=r.querySelector('.card').getBoundingClientRect(), back=getComputedStyle(r.querySelector('.back'));
            return { inDock: !!l.closest('#mia-dock'), on: l.classList.contains('on'), sheetBg: s.backgroundColor, cancelOnTop: !document.getElementById('mia-dock-cancel') && getComputedStyle(r.querySelector('.bar')).display === 'none',
                     headMia: getComputedStyle(document.querySelector('#mia-dock-head img')).display + '/' + getComputedStyle(document.querySelector('#mia-dock-head .t')).display, headH: Math.round(document.getElementById('mia-dock-head').getBoundingClientRect().height), backBg: back.backgroundColor,
                     heading: getComputedStyle(r.querySelector('.intro .b')).fontSize, radius: getComputedStyle(r.querySelector('.card')).borderTopLeftRadius,
                     ft: r.querySelector('.ft').textContent, cardH: Math.round(c.height), iframe: !!r.querySelector('.stage iframe'),
                     field: Math.round(document.getElementById('mia-dock-pill').getBoundingClientRect().height), chatBehind: getComputedStyle(document.getElementById('bp-embedded-webchat')).opacity, dockTop: Math.round(dr.top), header: Math.round(document.getElementById('header').getBoundingClientRect().bottom), headerTop: Math.round(document.getElementById('header').getBoundingClientRect().top), dockFt: Math.round(document.getElementById('mia-dock-ft').getBoundingClientRect().height),
                     covers: Math.round(dr.bottom - lr.bottom), ftInside: r.querySelector('.ft').getBoundingClientRect().bottom <= lr.bottom + 1 && r.querySelector('.card').getBoundingClientRect().bottom <= r.querySelector('.ft').getBoundingClientRect().top } }""")
        check("11a calendar inside the dock: glass behind (no white sheet), no Cancel, a rounded white card",
              cal["inDock"] and cal["on"] and cal["sheetBg"] == "rgba(0, 0, 0, 0)" and cal["cancelOnTop"]
              and cal["radius"] == "20px" and cal["iframe"] and cal["cardH"] > 300, cal)
        fit = await page.evaluate("""() => { const r=document.getElementById('spotler-cal').shadowRoot, f=r.querySelector('.stage iframe'), h=document.getElementById('mia-dock-head').getBoundingClientRect();
            return { scaled: getComputedStyle(f).transform, intro: getComputedStyle(r.querySelector('.intro')).display, head: Math.round(h.height) } }""")
        check("11j HubSpot's page at full size and width (never scaled), no heading, a compact header", fit["scaled"] == "none" and fit["intro"] == "none" and fit["head"] <= 50, fit)
        check("11c the calendar covers the whole dock: no 'Ask Mia' field; a header with just restart and close (no Mia, no AI / privacy line)",
              cal["field"] == 0 and cal["dockFt"] == 0 and cal["headMia"] == "none/none" and cal["headH"] <= 44 and cal["covers"] <= 2 and cal["chatBehind"] == "0", cal)
        check("11d the calendar grows over the menu bar, up to its top edge (bottom unchanged)", cal["headerTop"] + 10 <= cal["dockTop"] <= cal["headerTop"] + 14 and cal["dockTop"] < cal["header"], cal)
        await page.screenshot(path=f"{OUT}/10-calendar.png")
        BAR = """() => { const d=document.getElementById('mia-dock'), p=document.getElementById('mia-dock-pill').getBoundingClientRect();
            return { open: d.classList.contains('open'), cal: document.getElementById('spotler-cal').classList.contains('on'), bar: Math.round(p.height),
                     text: document.getElementById('mia-dock-q').textContent } }"""
        for how in ("a click outside", "the close button"):
            if how == "a click outside": await page.mouse.click(40, 450)
            else: await page.click("#mia-dock-head button[aria-label='Close chat']")
            await page.wait_for_timeout(1500)
            st = await page.evaluate(BAR)
            lock = await page.evaluate("document.documentElement.classList.contains('mia-scroll-lock')")
            check(f"11l {how} with the calendar open: the page scrolls again", lock is False, lock)
            check(f"11e {how} with the calendar open: chat closes, the booking is kept, the bar says 'Finish booking your demo' (and stays put)",
                  st == {"open": False, "cal": True, "bar": 68, "text": "Finish booking your demo"}, st)
            await page.click("#mia-dock-q"); await page.wait_for_timeout(900)
            st = await page.evaluate(BAR)
            check(f"11g after {how}: tapping the bar reopens the chat on the calendar", st["open"] and st["cal"] and st["bar"] == 0, st)
        await page.evaluate("document.getElementById('spotler-cal').shadowRoot.querySelector('.back').click()")
        await page.wait_for_timeout(1000)   # the chat fades back in (0.4s)
        back = await page.evaluate("[document.getElementById('spotler-cal').classList.contains('on'), Math.round(document.getElementById('mia-dock-pill').getBoundingClientRect().height), getComputedStyle(document.getElementById('bp-embedded-webchat')).opacity]")
        check("11b 'Cancel' closes the calendar: back to the chat with the field", back == [False, 68, "1"], back)
        dt = await page.evaluate("[Math.round(document.getElementById('mia-dock').getBoundingClientRect().top), Math.round(document.getElementById('header').getBoundingClientRect().bottom)]")
        check("11k after 'Cancel' the chat slides back down below the menu bar", dt[1] + 6 <= dt[0] <= dt[1] + 12, dt)
        # booking cancelled after the chat was closed on it: the bar goes back to typing questions
        await page.click("#mia-dock-head button[aria-label='Close chat']"); await page.wait_for_timeout(1200)
        q = await page.evaluate("[document.getElementById('mia-dock').classList.contains('cal-pending'), document.getElementById('mia-dock-q').textContent]")
        check("11h no booking open: closing the chat brings back the typing questions", q[0] is False and q[1] != "Finish booking your demo", q)
        # another page: a chat the visitor closed stays closed; an open one reopens
        await page.goto("https://www.spotler.com/pricing"); await page.wait_for_timeout(2500)
        st = await page.evaluate("document.getElementById('mia-dock').classList.contains('open')")
        check("12a closed chat, new page: it stays closed", st is False, st)
        await page.click("#mia-dock-q"); await page.wait_for_timeout(900)
        await page.goto("https://www.spotler.com/"); await page.wait_for_timeout(2500)
        st = await page.evaluate("document.getElementById('mia-dock').classList.contains('open')")
        check("12b open chat, new page: it opens again", st is True, st)
        await ctx.close()

        # a tall screen: the calendar card stops at HubSpot's own height (no stretched white space)
        ctx = await b.new_context(viewport={"width": 1440, "height": 1600})
        await setup(ctx, [POC])
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/"); await page.wait_for_timeout(1500)
        await page.click(".mia-arrow")
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        await page.evaluate("window.__bpEmit('customEvent', { action: 'showHubSpotCalendar', url: 'https://meetings-eu1.hubspot.com/isabelle-chadwick?posth=1' })")
        await page.wait_for_timeout(5000)
        tall = await page.evaluate("""() => { const r=document.getElementById('spotler-cal').shadowRoot; return { card: Math.round(r.querySelector('.card').getBoundingClientRect().height),
            dock: Math.round(document.getElementById('mia-dock').getBoundingClientRect().height) } }""")
        check("11f tall screen: calendar card at most 740px, dock not stretched", tall["card"] <= 740 and tall["dock"] <= 960, tall)
        sc = await page.evaluate("getComputedStyle(document.getElementById('spotler-cal').shadowRoot.querySelector('.stage iframe')).transform")
        check("11i tall screen: HubSpot's page at full size (no scaling)", sc == "none", sc)
        fitted = await page.evaluate("""() => { const r=document.getElementById('spotler-cal').shadowRoot, c=r.querySelector('.card'), f=r.querySelector('.stage iframe');
            return { max: c.style.maxHeight, card: Math.round(c.getBoundingClientRect().height), page: f.contentDocument ? null : 'x' } }""")
        check("11m HubSpot's reported page height sets the card's height (Back / Confirm sit under the form)", fitted["max"].endswith("px") and abs(int(float(fitted["max"][:-2])) - fitted["card"]) <= 2, fitted)
        # the restart button with the calendar open: the calendar closes, a fresh start
        await page.click("#mia-dock-head button[aria-label='%s']" % "Restart conversation")
        await page.wait_for_timeout(1200)
        rs = await page.evaluate("[document.getElementById('spotler-cal').classList.contains('on'), document.getElementById('mia-dock').classList.contains('cal-open')]")
        check("11n restart with the calendar open: the calendar closes too", rs == [False, False], rs)
        await ctx.close()

        # 9. the chat started long after the page loaded (the white chat on staging): still styled
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await setup(ctx, [POC])
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/"); await page.wait_for_timeout(35000)
        await page.click(".mia-arrow")
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        await page.wait_for_timeout(600)
        n = await page.evaluate("""() => { const r=window.__bpShadow; return { css: !!r.querySelector('style[data-mia-dock]'), bg: getComputedStyle(r.querySelector('.bpContainer')).backgroundColor,
            composer: getComputedStyle(r.querySelector('.bpComposerContainer')).display } }""")
        check("9a chat started 35s after the page loaded: still styled, see-through, no Botpress composer", n == {"css": True, "bg": "rgba(0, 0, 0, 0)", "composer": "none"}, n)
        await ctx.close()

        # 8. the start screen's card and question send their message, and it gives way to the chat
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await setup(ctx, [POC])
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/"); await page.wait_for_timeout(1500)
        await page.click("#mia-dock-q"); await page.wait_for_timeout(700)
        label = await page.evaluate("document.querySelectorAll('#mia-start .mia-card b')[1].textContent")
        await page.click("#mia-start .mia-card >> nth=1")
        await page.wait_for_timeout(400)
        gone = await page.evaluate("!document.getElementById('mia-start')")
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        log = await page.evaluate("window.__bpLog")
        ev = [json.loads(e[1]) for e in log if e[0] == "sendEvent"]
        check("8c a card sends its message (source button) and the start screen gives way to the chat", gone and ["sendMessage", label] in log and ev and ev[0]["source"] == "button", [label, gone, log[-3:]])
        await ctx.close()
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await setup(ctx, [POC])
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/"); await page.wait_for_timeout(1500)
        await page.click("#mia-dock-q"); await page.wait_for_timeout(700)
        await page.click("#mia-start .mia-chip >> nth=2")
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        check("8d an 'others often ask' question sends that question", ["sendMessage", PROMPTS[2]] in await page.evaluate("window.__bpLog"))
        await ctx.close()

        # 3. arrow: the pill's question goes straight into the chat
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        reqs = await setup(ctx, [POC])
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/")
        await page.wait_for_timeout(1500)
        # at the moment of the swap: where the last message is in the preview and in the live chat
        await page.evaluate("""() => { const w=document.getElementById('bp-embedded-webchat'); new MutationObserver((_, o) => { if (!w.classList.contains('bp-ready')) return; o.disconnect();
            const sr=document.getElementById('spotler-mia-shell').shadowRoot, b=[...sr.querySelectorAll('.b')], l=[...window.__bpShadow.querySelectorAll('.bpMessageBlocksBubble')];
            const u=sr.querySelector('.m.out .b'), lu=window.__bpShadow.querySelector('.bpMessageContainer[data-direction=outgoing] .bpMessageBlocksBubble');
            window.__swap = { shell: Math.round(b[b.length-1].getBoundingClientRect().top), live: Math.round(l[l.length-1].getBoundingClientRect().top),
                              you: Math.round(u.getBoundingClientRect().top), liveYou: Math.round(lu.getBoundingClientRect().top),
                              slid: getComputedStyle(sr.querySelector('.vp')).transform }; }).observe(w, { attributes: true }); }""")
        await page.click(".mia-arrow")
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        log = await page.evaluate("window.__bpLog")
        sent = [e[1] for e in log if e[0] == "sendMessage"]
        ev = [json.loads(e[1]) for e in log if e[0] == "sendEvent"]
        check("3a arrow sends the pill's whole question straight into the chat", sent == [PROMPTS[0]] and await page.evaluate("document.getElementById('mia-dock').classList.contains('open')"), sent)
        sw = await page.evaluate("window.__swap")
        # (the mock's live chat isn't styled like Botpress, so Mia's reply can't line up here;
        # on the real site it does: 41px bubble, 20px "Delivered", reply right under)
        check("3e at the swap your message sits exactly where it is in the preview (no double image), and the preview didn't slide",
              sw and abs(sw["you"] - sw["liveYou"]) <= 1 and sw["slid"] == "none", sw)
        check("3b start event: locale int, source teaser", ev and ev[0]["type"] == "start" and ev[0]["locale"] == "int" and ev[0]["source"] == "teaser", ev)
        await page.wait_for_timeout(800)
        await page.screenshot(path=f"{OUT}/3-arrow-live.png")
        # close: back to the pill, typing again; the conversation stays
        await page.click("#mia-dock-head button[aria-label='Close chat']")
        await page.wait_for_timeout(1200)
        q1 = await page.evaluate("document.getElementById('mia-dock-q').textContent")
        # a click outside the chat closes it too
        await page.click("#mia-dock-q"); await page.wait_for_timeout(600)
        await page.mouse.click(60, 400); await page.wait_for_timeout(300)
        check("3d a click outside the open chat closes it", not await page.evaluate("document.getElementById('mia-dock').classList.contains('open')"))
        check("3c close: back to the typing pill", not await page.evaluate("document.getElementById('mia-dock').classList.contains('open')") and q1 != "", q1)
        await ctx.close()

        # 4. other regions: the POC leaves the page to the production loader
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await setup(ctx, [POC, PROD])
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/en-gb/pricing")
        await page.wait_for_timeout(1500)
        r = await page.evaluate("({ dock: !!document.getElementById('mia-dock'), panel: !!document.getElementById('spotler-agent-panel') })")
        check("4a en-GB page with both tags: the dock (every region now), no slide-out", r == {"dock": True, "panel": False}, r)
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

        # 7. every region: its language (questions, labels, greeting) and page-specific teasers
        async def region_page(path, wait=1800):
            ctx = await b.new_context(viewport={"width": 1440, "height": 900})
            reqs = await setup(ctx, [POC])
            page = await ctx.new_page()
            await page.goto("https://www.spotler.com" + path)
            await page.wait_for_timeout(wait)
            return ctx, page, reqs
        for path, lang, ph, opener, ft in [("/de-de/", "de", "Stellen Sie Mia eine Frage...", "Hallo, ich bin Mia", "KI-Assistent · Datenschutz"),
                                           ("/sv-se/", "sv", "Ställ en fråga till Mia...", "Hej, jag är Mia", "AI-assistent · Integritet"),
                                           ("/es-es/", "es", "Haz una pregunta a Mia...", "Hola, soy Mia", "Asistente de IA · Privacidad"),
                                           ("/nl-nl/", "nl", "Stel Mia een vraag...", "Hoi", "AI-assistent · Privacy")]:
            ctx, page, _ = await region_page(path)
            q = await page.evaluate("document.getElementById('mia-dock-q').textContent")
            first = {"de": "Wie kann Spotler meinem Unternehmen helfen?", "sv": "Hur kan Spotler hjälpa mitt företag?",
                     "es": "¿Cómo puede Spotler ayudar a mi empresa?", "nl": "Hoe kan Spotler mijn bedrijf helpen?"}[lang]
            await page.click("#mia-dock-q"); await page.wait_for_timeout(700)
            d = await page.evaluate("""() => ({ ph: document.getElementById('mia-dock-in').placeholder, ft: document.getElementById('mia-dock-ft').textContent,
                text: document.getElementById('mia-start').textContent })""")
            check(f"7 {path}: questions, field, greeting and privacy line in its language", q and first.startswith(q) and d["ph"] == ph and opener in d["text"] and d["ft"] == ft, [q, d["ph"], d["ft"], d["text"][:60]])
            await ctx.close()
        ctx, page, _ = await region_page("/en-gb/pricing/compare", 2400)
        q = await page.evaluate("document.getElementById('mia-dock-q').textContent")
        check("7e a page with its own row types its teaser first", q and "Want help comparing plans and pricing?".startswith(q), q)
        await page.click(".mia-arrow")
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        log = await page.evaluate("window.__bpLog")
        ev = [json.loads(e[1]) for e in log if e[0] == "sendEvent"]
        check("7f its arrow sends the teaser's message, start event en-GB / pricing", ["sendMessage", "Help me compare plans and pricing"] in log and ev and ev[0]["locale"] == "en-GB" and ev[0]["pageKey"] == "pricing", [log[-3:], ev[:1]])
        await ctx.close()
        ctx, page, _ = await region_page("/fr-fr/", 1200)
        check("7g a locale without chat (/fr-fr/): no dock", not await page.evaluate("!!document.getElementById('mia-dock')"))
        await ctx.close()

        # 6. marketing's own file (marketing.spotler.com) is read first: its questions and greeting
        MKT = json.dumps({"version": "mkt-1", "rows": [{"url_match": "*", "region": "int", "mode": "slideout", "page": "default",
            "title": "Welcome to Spotler", "opener": "Hello from marketing: I'm Mia, Spotler's AI assistant.",
            "buttons": [{"label": "Show me Mail+", "send": "Show me Mail+", "description": "Our email platform in two minutes", "icon": "mail"},
                        {"label": "Case studies", "send": "Show me case studies", "icon": "https://www.spotler.com/icons/cases.svg"}],
            "prompts": ["Marketing question one?", "Marketing question two?"]}]})
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        reqs = await setup(ctx, [POC], mkt=MKT)
        page = await ctx.new_page()
        logs = []; page.on("console", lambda m: logs.append(m.text))
        await page.goto("https://www.spotler.com/")
        await page.wait_for_timeout(2600)
        q = await page.evaluate("document.getElementById('mia-dock-q').textContent")
        await page.click("#mia-dock-q"); await page.wait_for_timeout(700)
        t = await page.evaluate("document.getElementById('mia-start').textContent")
        mk = await page.evaluate("""() => { const c=document.querySelector('#mia-start .mia-card'); return [document.querySelector('#mia-start h2').textContent, c.querySelector('.mia-t span').textContent, c.querySelector('.mia-ico').className] }""")
        check("6e the file sets the headline, and a card's description and icon", mk == ["Welcome to Spotler", "Our email platform in two minutes", "mia-ico i-mail"], mk)
        pic = await page.evaluate("(document.querySelectorAll('#mia-start .mia-card')[1].querySelector('.mia-ico img') || {}).src")
        check("6f a card's icon can be a picture (https link)", pic == "https://www.spotler.com/icons/cases.svg", pic)
        check("6a marketing's file read first: the pill types its questions", q and "Marketing question one?".startswith(q) and any("config from network vmkt-1" in l for l in logs), [q, [l for l in logs if "config" in l]])
        check("6b clicking in shows marketing's greeting and buttons", "Hello from marketing" in t and "Show me Mail+" in t, t[:120])
        check("6c the POC's own file comes first, the production page table not needed", reqs and not any("/config/config.json" in u for u in reqs), [u for u in reqs if "config.json" in u])
        await ctx.close()
        # its server not allowing spotler.com (no CORS header) or down: the GitHub page table instead
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await setup(ctx, [POC], mkt=MKT, mkt_cors=False)
        page = await ctx.new_page()
        logs = []; page.on("console", lambda m: logs.append(m.text))
        await page.goto("https://www.spotler.com/")
        await page.wait_for_timeout(2600)
        q = await page.evaluate("document.getElementById('mia-dock-q').textContent")
        check("6d marketing's file blocked or down: GitHub page table and the built-in questions", any("config fetch failed (raw.githubusercontent.com)" in l for l in logs) and any("config from network" in l for l in logs) and not "Marketing question".startswith(q or "x"), [q, [l for l in logs if "config" in l]])
        await ctx.close()

        # a narrow desktop window: the button shrinks with the bar and fits inside it
        ctx = await b.new_context(viewport={"width": 600, "height": 800})
        await setup(ctx, [POC])
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/"); await page.wait_for_timeout(1200)
        f = await page.evaluate("""() => { const p=document.getElementById('mia-dock-pill').getBoundingClientRect(), a=document.querySelector('.mia-arrow').getBoundingClientRect();
            return { pillTop: Math.round(p.top), pillBottom: Math.round(p.bottom), pillRight: Math.round(p.right), top: Math.round(a.top), bottom: Math.round(a.bottom), right: Math.round(a.right), h: Math.round(a.height) } }""")
        check("5d narrow window: the send button fits inside the bar", f["h"] == 38 and f["top"] > f["pillTop"] and f["bottom"] < f["pillBottom"] and f["right"] < f["pillRight"], f)
        await ctx.close()

        # 5. phone width
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        await setup(ctx, [POC], phone=True)
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/")
        await page.wait_for_timeout(1200)
        m = await page.evaluate("(() => { const r=document.getElementById('mia-dock').getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(innerWidth - r.right), w: document.documentElement.scrollWidth <= innerWidth } })()")
        h = await page.evaluate("[Math.round(document.getElementById('mia-dock-pill').getBoundingClientRect().height), parseFloat(getComputedStyle(document.getElementById('mia-dock-q')).fontSize)]")
        check("5a phone: pill a touch smaller than Safari's bar (48px, 16px text), 20px each side, no sideways scroll", m["left"] == 20 and m["right"] == 20 and m["w"] and h == [48, 16], [m, h])
        sh = await page.evaluate("getComputedStyle(document.getElementById('mia-dock')).boxShadow")
        import re as _re
        reach = max([int(a) + int(b) for a, b in _re.findall(r"\) 0px (\d+)px (\d+)px", sh)] or [999])
        gap = await page.evaluate("Math.round(innerHeight - document.getElementById('mia-dock').getBoundingClientRect().bottom)")
        check("5c phone: the shadow ends inside the gap below the pill (nothing reaches the bottom edge to be cut off)", gap == 20 and reach <= gap - 6, [gap, reach, sh])
        await page.screenshot(path=f"{OUT}/5-phone.png")
        await page.tap("#mia-dock-q"); await page.wait_for_timeout(800)
        kb = await page.evaluate("document.activeElement === document.getElementById('mia-dock-in')")
        check("8h phone: the first tap opens the chat without the keyboard (field not focused)", await page.evaluate("document.getElementById('mia-dock').classList.contains('open')") and not kb, kb)
        ns = await page.evaluate("(() => { const s=document.getElementById('mia-start'); return { sh: s.scrollHeight, ch: s.clientHeight, fit: s.className } })()")
        check("8i phone: the start screen fits without scrolling", ns["sh"] <= ns["ch"] + 1, ns)
        ph = await page.evaluate("""() => { const s=document.getElementById('mia-start'); return { cols: getComputedStyle(s.querySelector('.mia-cards')).gridTemplateColumns.split(' ').length,
            fits: s.getBoundingClientRect().right <= innerWidth, scroll: getComputedStyle(s).overflowY,
            headline: s.querySelector('h2').getBoundingClientRect().top >= s.getBoundingClientRect().top - 1 } }""")
        check("8e phone: start screen in one column, inside the screen; if tall it starts at the headline and scrolls", ph == {"cols": 1, "fits": True, "scroll": "auto", "headline": True}, ph)
        await page.screenshot(path=f"{OUT}/5-phone-start.png")
        await page.tap("#mia-dock-in"); await page.wait_for_timeout(300)
        check("8j phone: tapping the field then brings up the keyboard (field focused)", await page.evaluate("document.activeElement === document.getElementById('mia-dock-in')"))
        await ctx.close()

        # a page wider than the phone (shrunk to fit): the pill is scaled back up to the same physical size
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True,
                                  user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")
        await setup(ctx, [POC])             # no viewport tag: laid out 980px wide, shrunk onto the phone
        page = await ctx.new_page()
        await page.goto("https://www.spotler.com/")
        await page.wait_for_timeout(1200)
        z = await page.evaluate("""(() => { const d=document.getElementById('mia-dock'), cw=document.documentElement.clientWidth, k=parseFloat(d.style.getPropertyValue('--mia-k'));
            return { cw, k, h: Math.round(document.getElementById('mia-dock-pill').getBoundingClientRect().height), physical: Math.round(document.getElementById('mia-dock-pill').getBoundingClientRect().height * 390 / cw) } })()""")
        check("5b page shrunk to fit: pill scaled up, still about 48pt on screen", z["cw"] > 900 and z["k"] > 1 and abs(z["physical"] - 48) <= 2, z)
        await ctx.close()

        # 10. Typing in the dock while Mia replies (build 4, loader 1.6.9): real keystrokes, a slow reply.
        # The field takes the message and clears; it's held, then sent once her reply is in; several go in order.
        SENT = "() => window.__bpLog.filter(e => e[0] === 'sendMessage').map(e => e[1])"
        LIVE_MSGS = """() => [...window.__bpShadow.querySelectorAll('.bpMessageContainer[data-direction=outgoing], .bpMessageContainer[data-direction=incoming]')]
            .filter(m => !m.querySelector('.bpTypingIndicatorContainer')).map(m => m.getAttribute('data-direction')[0] + ':' + m.textContent)"""
        async def type_in_dock(page, text):
            await page.click("#mia-dock-in"); await page.keyboard.type(text); await page.keyboard.press("Enter")
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await setup(ctx, [POC])
        await ctx.add_init_script("window.__replyDelay = 2500;")
        page = await ctx.new_page()
        logs = []; page.on("console", lambda m, logs=logs: logs.append(m.text))
        await page.goto("https://www.spotler.com/"); await page.wait_for_timeout(1200)
        await page.click("#mia-dock-pill"); await page.wait_for_timeout(700)
        await type_in_dock(page, "What is Spotler Activate?")
        await page.wait_for_timeout(1200)                   # Mia is writing her first reply (typing dots in the preview)
        for t in ["and how much does it cost?", "in GBP please"]:
            await type_in_dock(page, t)
        h = await page.evaluate("""() => { const sr=document.getElementById('spotler-mia-shell').shadowRoot, q=[...sr.querySelectorAll('.m.queued')];
            return { queued: q.map(m => m.textContent), field: document.getElementById('mia-dock-in').value, typing: !!sr.querySelector('.typing'),
              status: q.some(m => m.nextElementSibling && m.nextElementSibling.classList.contains('st')) } }""")
        sent = await page.evaluate(SENT)
        check("10a first reply: the dock takes both messages, field clears, held in the preview (no Delivered), nothing sent yet",
              h["queued"] == ["and how much does it cost?", "in GBP please"] and h["field"] == "" and h["typing"] and not h["status"]
              and sent == ["What is Spotler Activate?"], [h, sent])
        await page.wait_for_function("document.getElementById('bp-embedded-webchat').classList.contains('bp-ready')", timeout=8000)
        await page.wait_for_function("(" + SENT + ")().length === 2", timeout=6000)
        await page.wait_for_timeout(3200)                   # her second reply
        first = "and how much does it cost?\nin GBP please"
        sent, msgs = await page.evaluate(SENT), await page.evaluate(LIVE_MSGS)
        check("10b sent once her reply landed, as one visitor turn: 2 visitor messages and 2 answers, in order",
              sent == ["What is Spotler Activate?", first]
              and msgs == ["o:What is Spotler Activate?", "i:Bot reply to: What is Spotler Activate?", "o:" + first, "i:Bot reply to: " + first], [sent, msgs])
        # later replies, in the live chat: the same, held under the chat
        await page.wait_for_timeout(1200)                   # her reply has been in for a second: the next message goes straight away
        await type_in_dock(page, "Do you integrate with Shopify?")
        await page.wait_for_timeout(900)                    # her reply is pending (typing dots)
        await type_in_dock(page, "and Magento?")
        await type_in_dock(page, "and WooCommerce?")
        h = await page.evaluate("""() => { const held=document.getElementById('mia-dock-held'), w=document.getElementById('bp-embedded-webchat'), body=document.getElementById('spotler-inline-body');
            return { held: [...held.querySelectorAll('.h')].map(x => x.textContent), field: document.getElementById('mia-dock-in').value,
              visible: getComputedStyle(held).display !== 'none', chatBottom: Math.round(w.getBoundingClientRect().bottom), heldTop: Math.round(held.getBoundingClientRect().top),
              typing: !!window.__bpShadow.querySelector('.bpTypingIndicatorContainer') } }""")
        sent = await page.evaluate(SENT)
        check("10c live chat: the field clears, both held under the chat (not covering it), not sent while she replies",
              h["held"] == ["and Magento?", "and WooCommerce?"] and h["field"] == "" and h["visible"] and h["chatBottom"] <= h["heldTop"] + 1
              and h["typing"] and sent[-1] == "Do you integrate with Shopify?", [h, sent[-2:]])
        await page.wait_for_function("(" + SENT + ")().length === 4", timeout=6000)
        h = await page.evaluate("() => ({ held: document.getElementById('mia-dock-held').children.length, h: document.getElementById('bp-embedded-webchat').style.height })")
        await page.wait_for_timeout(3200)
        second = "and Magento?\nand WooCommerce?"
        sent, msgs = await page.evaluate(SENT), await page.evaluate(LIVE_MSGS)
        check("10d sent after her reply, as one turn, in order; the held strip goes and the chat gets its height back",
              sent[2:] == ["Do you integrate with Shopify?", second] and h == {"held": 0, "h": ""}
              and msgs[4:] == ["o:Do you integrate with Shopify?", "i:Bot reply to: Do you integrate with Shopify?", "o:" + second, "i:Bot reply to: " + second], [sent[2:], h, msgs[4:]])
        check("10e logged: held and sent, twice", sum("held while Mia replies" in l for l in logs) == 4 and sum("sending the held message" in l for l in logs) == 2,
              [l for l in logs if "held" in l])
        # restart drops anything still held
        await type_in_dock(page, "one more thing")
        await page.wait_for_timeout(600)
        await type_in_dock(page, "never mind")
        await page.click("#mia-dock-head button[aria-label='Restart conversation']")
        await page.wait_for_timeout(3500)
        sent = await page.evaluate(SENT)
        check("10f restart while a message is held: it's dropped, not sent into the new chat",
              "never mind" not in sent and await page.evaluate("document.getElementById('mia-dock-held').children.length") == 0, sent[-2:])
        await ctx.close()
        await b.close()
    print(f"\n{sum(results)}/{len(results)} passed")
    sys.exit(0 if all(results) else 1)

asyncio.run(main())
