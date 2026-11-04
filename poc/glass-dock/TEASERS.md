# Mia: page questions (teasers) review

On a page with its own row, the pill now loops that page's **4 questions** and
does not fall back to the general ones. Pressing the arrow sends the question
shown. The first three also appear as "Others often ask" on the start screen.

**Length rule:** at most 32 characters. The pill fits about 34 characters on a
phone (275px at 16px), about 50 on desktop. 39 of the 42 old teasers were
longer than 32 characters, so most were cut off on phones with "...".

**Where:** `rows[].prompts` in the page table
(https://marketing.spotler.com/botpress/config.json, version 2026-11-04.2).
`teaser_text` / `teaser_send` now equal the first question (only used if a
page has no `prompts`). The slide-out's own page table (config/config.json) is
unchanged.

**To check:**
- NL transactional emails page said **98.8%** delivery, the English page **99.8%**.
  I left the number out of the Dutch questions; please confirm the right figure.
- `/resources` and `/kennisbank`: the first question asks to subscribe to Spotler
  Insights; the bot needs to handle it (the old send text was
  "I want to subscribe to the Spotler Insights newsletter").
- `/ecommerce/email-marketing-automation` (INT, en-DE, en-AU) keeps
  "Show me the video of Mail+" word for word, in case the bot listens for it.
- German, Spanish and Swedish have no page rows yet: every page there uses the
  region's 5 general questions. Tell me which pages to add.

## English: en-GB (the same questions on INT, en-DE and en-AU, under /ecommerce/...)

| Page | Was (one teaser, then the general questions) | Now (these 4 loop) |
|---|---|---|
| `/b2b/email-marketing-automation` | Curious what email automation could do? (39) | How does email automation work?<br>Can I automate lead nurturing?<br>Which email flows work best?<br>Does it connect to my CRM? |
| `/b2b/crm-lead-management` | Questions about CRM or lead management? (39) | How does your CRM work?<br>How does lead scoring work?<br>Can sales see marketing data?<br>Can I move my CRM data over? |
| `/b2b/event-management` | Flawless and engaging events? Let me help you with that! (56) | How do I manage event sign-ups?<br>Can I send event reminders?<br>Can I check guests in on site?<br>How do I follow up after events? |
| `/b2b/website-personalisation` | Let's make your website content more relevant for your visitors (63) | How does personalisation work?<br>Can I show content per visitor?<br>Can I see which companies visit?<br>Do I need a developer for this? |
| `/b2b/conversational-marketing` | If you want to start conversations with your customers, talk to me first ;-) (76) | What's conversational marketing?<br>Can I add a chatbot to my site?<br>Does it work with WhatsApp?<br>Can it hand chats to my team? |
| `/b2b/social-media-publishing` | Want to plan your social posts in advance? Let me help you! (59) | Can I schedule my social posts?<br>Which channels can I post to?<br>Can I see how my posts perform?<br>Can my team approve posts first? |
| `commerce/customer-data-platform` | Wondering if a CDP suits you? (29) | What is a CDP and do I need one?<br>Which data can I bring together?<br>How do I build segments?<br>Does it connect to my webshop? |
| `commerce/email-marketing-automation` | Want to boost your conversions via email? (41) | How can email lift my sales?<br>Can I win back abandoned carts?<br>Which email flows work best?<br>Does it connect to my webshop? |
| `commerce/transactional-emails` | 99.8% delivery of all your transactional emails. Want to know how? (66) | How do you get 99.8% delivery?<br>What are transactional emails?<br>Can I send order confirmations?<br>Does it work with my webshop? |
| `commerce/onsite-search-merchandising` | Best search engine for your store? Let's chat! (46) | How can search boost my sales?<br>Can I boost products in search?<br>Does search handle typos?<br>Which platforms do you support? |
| `commerce/whatsapp-sms-social-media` | Apply real-time messaging with customers? Let me help you! (58) | Can I send WhatsApp campaigns?<br>Can I send SMS campaigns?<br>Can I answer chats in one inbox?<br>Which channels do you support? |
| `/pricing` | Want help comparing plans and pricing? (38) | Which plan fits my business?<br>What does Spotler cost?<br>What's included in each plan?<br>Can I get a custom quote? |
| `/products` | Not sure which product fits? Ask! (33) | Which product fits my needs?<br>How do your products differ?<br>Do your products work together?<br>Can I book a demo? |
| `/b2b` | Questions about B2B marketing tools? (36) | How can Spotler help B2B teams?<br>How do I generate more leads?<br>Which B2B tools do you offer?<br>Can I book a demo? |
| `commerce` | Want to boost your ecommerce marketing? (39) | How can Spotler grow my store?<br>Which tools suit a webshop?<br>Does it connect to my platform?<br>Can I book a demo? |
| `/public-sector` | Questions about public sector solutions? (40) | Do you work with public sector?<br>Are you GDPR compliant?<br>Where is my data stored?<br>Can I book a demo? |
| `/integrations` | Checking we fit your tech stack? (32) | Does Spotler fit my tech stack?<br>Which integrations do you have?<br>Do you have an API?<br>Can you connect to my CRM? |
| `/success-stories` | Want results like these? Let's chat! (36) | What results do clients get?<br>Any stories from my industry?<br>How fast do clients see results?<br>Can I book a demo? |
| `/services` | Curious about what we do to help you use our software efficiently? (66) | What services do you offer?<br>Can you help me get started?<br>Do you offer training?<br>Can you run campaigns for me? |
| `/resources` | Subscribe to the Spotler Insights newsletter to stay informed (61) | Subscribe me to Spotler Insights<br>Any guides on email marketing?<br>Which guide should I read first?<br>Do you have webinars? |

## Dutch: nl

| Page | Was (one teaser, then the general questions) | Now (these 4 loop) |
|---|---|---|
| `/nl-nl/b2b/email-marketing-automation` | Benieuwd naar wat e-mail marketing voor jou kan doen? (53) | Hoe werkt e-mail automation?<br>Hoe volg ik leads slim op?<br>Met welke flows begin ik?<br>Koppelt het met mijn CRM? |
| `/nl-nl/b2b/crm-lead-management` | Stel je vraag over CRM en lead management gerust aan mij (56) | Hoe werkt jullie CRM?<br>Hoe werkt lead scoring?<br>Ziet sales ook marketingdata?<br>Kan ik mijn CRM-data overzetten? |
| `/nl-nl/b2b/event-management` | Vlekkeloze events die aanslaan? Laat mij je helpen (50) | Hoe beheer ik inschrijvingen?<br>Kan ik herinneringen sturen?<br>Kan ik gasten laten inchecken?<br>Hoe volg ik na een event op? |
| `/nl-nl/b2b/website-personalisatie` | Zullen we jouw website content relevanter maken voor bezoekers? (63) | Hoe werkt personalisatie?<br>Kan ik content personaliseren?<br>Zie ik welke bedrijven bezoeken?<br>Heb ik hier een developer voor? |
| `/nl-nl/b2b/conversational-marketing` | Als je goede conversaties met klanten wil, moet je eerst even met mij praten ;-) (80) | Wat is conversational marketing?<br>Kan ik een chatbot toevoegen?<br>Werkt het met WhatsApp?<br>Kan mijn team chats overnemen? |
| `/nl-nl/b2b/social-media-publishing` | Wil je al je social posts vooraf inplannen? Laat mij je helpen! (63) | Kan ik social posts inplannen?<br>Op welke kanalen kan ik posten?<br>Zie ik hoe mijn posts presteren?<br>Kan mijn team posts goedkeuren? |
| `/nl-nl/commerce/customer-data-platform` | Vraag je jezelf af of een CDP ook bij jou past? (47) | Heb ik een CDP nodig?<br>Welke data breng ik samen?<br>Hoe maak ik klantsegmenten?<br>Koppelt het met mijn webshop? |
| `/nl-nl/commerce/email-marketing-automation` | Wil je graag meer conversies via e-mail genereren? (50) | Hoe levert e-mail meer omzet op?<br>Kan ik winkelwagens terugwinnen?<br>Welke flows werken het best?<br>Koppelt het met mijn webshop? |
| `/nl-nl/commerce/transactionele-emails` | 98.8% van al je transactionele e-mails afgeleverd. Wil je weten hoe? (68) | Hoe zit het met deliverability?<br>Wat zijn transactionele e-mails?<br>Kan ik bevestigingsmails sturen?<br>Werkt het met mijn webshop? |
| `/nl-nl/commerce/onsite-search-merchandising` | De beste zoekfunctie binnen jouw webshop? Let's chat! (53) | Hoe helpt zoeken mijn omzet?<br>Kan ik producten uitlichten?<br>Kan zoeken tikfouten aan?<br>Welke platformen werken ermee? |
| `/nl-nl/commerce/whatsapp-sms-socials` | Real-time messaging met klanten toepassen? Laat mij je helpen! (62) | Kan ik WhatsApp inzetten?<br>Kan ik sms-campagnes sturen?<br>Alle chats in één inbox?<br>Welke kanalen zijn er? |
| `/nl-nl/prijzen` | Hulp nodig bij het bepalen welk prijsplan bij jou past? (55) | Welk plan past bij mij?<br>Wat kost Spotler?<br>Wat zit er in elk plan?<br>Kan ik een offerte krijgen? |
| `/nl-nl/producten` | Niet zeker welk product bij jou past? Ik kan je helpen! (55) | Welk product past bij mij?<br>Wat is het verschil?<br>Werken de producten samen?<br>Kan ik een demo boeken? |
| `/nl-nl/b2b` | Stel je vraag over B2B marketing tools aan mij (46) | Hoe helpt Spotler B2B-teams?<br>Hoe genereer ik meer leads?<br>Welke B2B-tools hebben jullie?<br>Kan ik een demo boeken? |
| `/nl-nl/commerce` | Wil je een boost geven aan je ecommerce marketing activiteiten? (63) | Hoe groeit mijn webshop?<br>Welke tools voor mijn webshop?<br>Koppelt het met mijn platform?<br>Kan ik een demo boeken? |
| `/nl-nl/publieke-sector` | Heb je vragen over onze oplossingen voor de publieke sector? (60) | Werken jullie met overheden?<br>Zijn jullie AVG-proof?<br>Waar wordt mijn data opgeslagen?<br>Kan ik een demo boeken? |
| `/nl-nl/integraties` | Let's connect om te kijken of we ook met jouw tech stack kunnen integreren! (75) | Past Spotler bij mijn techstack?<br>Welke koppelingen zijn er?<br>Hebben jullie een API?<br>Koppelt het met mijn CRM? |
| `/nl-nl/succesverhalen` | Wil je ook zulke mooie resultaten behalen? Let's chat! (54) | Welke resultaten halen klanten?<br>Verhalen uit mijn branche?<br>Hoe snel zien klanten resultaat?<br>Kan ik een demo boeken? |
| `/nl-nl/services` | Nieuwsgierig naar wat we doen om jou efficient onze software te laten gebruiken? (80) | Welke services bieden jullie?<br>Helpen jullie bij de start?<br>Bieden jullie trainingen aan?<br>Kunnen jullie campagnes draaien? |
| `/nl-nl/kennisbank` | Schrijf je in op de Spotler Insights nieuwsbrief en blijf op de hoogte (70) | Meld me aan voor Insights<br>Tips voor e-mailmarketing?<br>Welke gids lees ik eerst?<br>Hebben jullie webinars? |
