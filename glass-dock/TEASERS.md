# Mia: page questions (teasers) review

On a page with its own row, the pill loops that page's **4 questions** and does
not fall back to the general ones. Pressing the arrow sends the question shown.
The first three also appear as "Others often ask" on the start screen. Pages
without their own row (blog posts, news, legal pages) loop the region's 5
general questions.

**Length rule:** at most 32 characters, and checked to fit the pill at phone
size (about 34 characters, 275px at 16px; about 50 on desktop). 39 of the 42 old
teasers, and most of the old general questions, were longer and were cut off on
phones with "...".

**Where:** `rows[].prompts` in the page table
(https://marketing.spotler.com/botpress/config.json, version 2026-11-04.3).
`teaser_text` / `teaser_send` equal the first question (only used if a page has
no `prompts`). The slide-out's own page table (config/config.json) is unchanged.

**Notes:**
- No delivery percentage in any question (the pages disagreed: 99.8% / 98.8%).
- `/resources`, `/kennisbank`, `/ressourcen`, `/recursos`, `/kunskapsbank`: the
  first question asks to subscribe to Spotler Insights; the bot needs to handle it.
- `/ecommerce/email-marketing-automation` (INT, en-DE, en-AU) keeps
  "Show me the video of Mail+" word for word (the bot shows the video).
- German, Spanish and Swedish are new: the same 20 pages as English and Dutch,
  plus the case-study detail pages (`/de-de/anwendungsfall/...`,
  `/sv-se/kundcases/...`; Spanish ones are under `/es-es/historias-de-exito/`).
- German uses "KI" in the general questions, as the German labels do.

## General questions (pages without their own row, e.g. blog posts)

| Region | Now (these 5 loop) |
|---|---|
| en-GB | How can Spotler help me?<br>Which product fits a webshop?<br>Can I book a demo this week?<br>How does Spotler use AI?<br>What does Spotler cost? |
| nl | Hoe helpt Spotler mijn bedrijf?<br>Wat past bij een webshop?<br>Kan ik een demo boeken?<br>Hoe gebruikt Spotler AI?<br>Wat kost Spotler? |
| int | How can Spotler help me?<br>Which product fits a webshop?<br>Can I book a demo this week?<br>How does Spotler use AI?<br>What does Spotler cost? |
| de-DE | Wie hilft Spotler meiner Firma?<br>Was passt zu einem Onlineshop?<br>Kann ich eine Demo buchen?<br>Wie nutzt Spotler KI?<br>Was kostet Spotler? |
| en-DE | How can Spotler help me?<br>Which product fits a webshop?<br>Can I book a demo this week?<br>How does Spotler use AI?<br>What does Spotler cost? |
| es-ES | ¿Cómo me ayuda Spotler?<br>¿Qué va bien para una tienda?<br>¿Puedo reservar una demo?<br>¿Cómo usa Spotler la IA?<br>¿Cuánto cuesta Spotler? |
| sv-SE | Hur kan Spotler hjälpa mig?<br>Vad passar en webbutik?<br>Kan jag boka en demo?<br>Hur använder Spotler AI?<br>Vad kostar Spotler? |
| en-AU | How can Spotler help me?<br>Which product fits a webshop?<br>Can I book a demo this week?<br>How does Spotler use AI?<br>What does Spotler cost? |

## English: en-GB (the same questions on INT, en-DE and en-AU, under /ecommerce/...)

| Page | Was | Now (these 4 loop) |
|---|---|---|
| `/b2b/email-marketing-automation` | Curious what email automation could do? (39) | How does email automation work?<br>Can I automate lead nurturing?<br>Which email flows work best?<br>Does it connect to my CRM? |
| `/b2b/crm-lead-management` | Questions about CRM or lead management? (39) | How does your CRM work?<br>How does lead scoring work?<br>Can sales see marketing data?<br>Can I move my CRM data over? |
| `/b2b/event-management` | Flawless and engaging events? Let me help you with that! (56) | How do I manage event sign-ups?<br>Can I send event reminders?<br>Can I check guests in on site?<br>How do I follow up after events? |
| `/b2b/website-personalisation` | Let's make your website content more relevant for your visitors (63) | How does personalisation work?<br>Can I show content per visitor?<br>Can I see which companies visit?<br>Do I need a developer for this? |
| `/b2b/conversational-marketing` | If you want to start conversations with your customers, talk to me first ;-) (76) | What's conversational marketing?<br>Can I add a chatbot to my site?<br>Does it work with WhatsApp?<br>Can it hand chats to my team? |
| `/b2b/social-media-publishing` | Want to plan your social posts in advance? Let me help you! (59) | Can I schedule my social posts?<br>Which channels can I post to?<br>Can I see how my posts perform?<br>Can my team approve posts first? |
| `commerce/customer-data-platform` | Wondering if a CDP suits you? (29) | What is a CDP and do I need one?<br>Which data can I bring together?<br>How do I build segments?<br>Does it connect to my webshop? |
| `commerce/email-marketing-automation` | Want to boost your conversions via email? (41) | How can email lift my sales?<br>Can I win back abandoned carts?<br>Which email flows work best?<br>Does it connect to my webshop? |
| `commerce/transactional-emails` | 99.8% delivery of all your transactional emails. Want to know how? (66) | How reliable is your delivery?<br>What are transactional emails?<br>Can I send order confirmations?<br>Does it work with my webshop? |
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

## INT only: the Mail+ video page

`/ecommerce/email-marketing-automation`: Show me the video of Mail+ · How can email lift my sales? · Can I win back abandoned carts? · Which email flows work best?

## Dutch: nl

| Page | Was | Now (these 4 loop) |
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

## German: de-DE

| Page | Was | Now (these 4 loop) |
|---|---|---|
| `/de-de/b2b/email-marketing-automatisierung` | nothing (the general questions) | Wie funktioniert Automation?<br>Leads automatisch nachfassen?<br>Welche E-Mail-Flows lohnen sich?<br>Gibt es eine CRM-Anbindung? |
| `/de-de/b2b/crm-lead-management` | nothing (the general questions) | Wie funktioniert Ihr CRM?<br>Wie funktioniert Lead Scoring?<br>Sieht Sales die Marketingdaten?<br>Kann ich CRM-Daten übernehmen? |
| `/de-de/b2b/event-management` | nothing (the general questions) | Wie verwalte ich Anmeldungen?<br>Kann ich Erinnerungen senden?<br>Gibt es einen Check-in vor Ort?<br>Wie fasse ich nach Events nach? |
| `/de-de/b2b/website-personalisierung` | nothing (the general questions) | Was bringt Personalisierung?<br>Inhalte pro Besucher anzeigen?<br>Sehe ich, welche Firmen kommen?<br>Brauche ich dafür Entwickler? |
| `/de-de/b2b/dialogorientiertes-marketing` | nothing (the general questions) | Was ist Dialogmarketing?<br>Kann ich einen Chatbot einbauen?<br>Funktioniert es mit WhatsApp?<br>Übernimmt mein Team Chats? |
| `/de-de/b2b/social-media-publishing` | nothing (the general questions) | Kann ich Social Posts planen?<br>Welche Kanäle gibt es?<br>Sehe ich, wie Posts performen?<br>Kann mein Team Posts freigeben? |
| `/de-de/commerce/kundendatenplattform` | nothing (the general questions) | Brauche ich eine CDP?<br>Welche Daten bündelt sie?<br>Wie erstelle ich Segmente?<br>Passt sie zu meinem Onlineshop? |
| `/de-de/commerce/email-marketing-automatisierung` | nothing (the general questions) | Wie steigert E-Mail den Umsatz?<br>Warenkorbabbrecher zurückholen?<br>Welche E-Mail-Flows lohnen sich?<br>Passt es zu meinem Onlineshop? |
| `/de-de/commerce/transaktions-emails` | nothing (the general questions) | Wie sicher ist die Zustellung?<br>Was sind Transaktions-E-Mails?<br>Auch Bestellbestätigungen?<br>Passt es zu meinem Onlineshop? |
| `/de-de/commerce/onsite-search-merchandising` | nothing (the general questions) | Wie steigert Suche den Umsatz?<br>Kann ich Produkte hervorheben?<br>Versteht die Suche Tippfehler?<br>Welche Shopsysteme passen? |
| `/de-de/commerce/whatsapp-sms-social-media` | nothing (the general questions) | Kann ich WhatsApp nutzen?<br>Kann ich SMS versenden?<br>Alle Chats in einem Postfach?<br>Welche Kanäle gibt es? |
| `/de-de/preise` | nothing (the general questions) | Welcher Plan passt zu mir?<br>Was kostet Spotler?<br>Was ist in jedem Plan enthalten?<br>Bekomme ich ein Angebot? |
| `/de-de/produkte` | nothing (the general questions) | Welches Produkt passt zu mir?<br>Was ist der Unterschied?<br>Arbeiten die Produkte zusammen?<br>Kann ich eine Demo buchen? |
| `/de-de/b2b` | nothing (the general questions) | Wie hilft Spotler B2B-Teams?<br>Wie gewinne ich mehr Leads?<br>Welche B2B-Tools gibt es?<br>Kann ich eine Demo buchen? |
| `/de-de/commerce` | nothing (the general questions) | Wie wächst mein Onlineshop?<br>Welche Tools für meinen Shop?<br>Passt es zu meiner Plattform?<br>Kann ich eine Demo buchen? |
| `/de-de/oeffentlicher-sektor` | nothing (the general questions) | Arbeiten Sie mit Behörden?<br>Sind Sie DSGVO-konform?<br>Wo liegen meine Daten?<br>Kann ich eine Demo buchen? |
| `/de-de/integrationen` | nothing (the general questions) | Passt Spotler zu meinem Stack?<br>Welche Integrationen gibt es?<br>Gibt es eine API?<br>Gibt es eine CRM-Anbindung? |
| `/de-de/erfolgsgeschichten` | nothing (the general questions) | Was erreichen Ihre Kunden?<br>Beispiele aus meiner Branche?<br>Wie schnell gibt es Ergebnisse?<br>Kann ich eine Demo buchen? |
| `/de-de/anwendungsfall` | nothing (the general questions) | Was erreichen Ihre Kunden?<br>Beispiele aus meiner Branche?<br>Wie schnell gibt es Ergebnisse?<br>Kann ich eine Demo buchen? |
| `/de-de/services` | nothing (the general questions) | Welche Services bieten Sie?<br>Helfen Sie beim Start?<br>Bieten Sie Schulungen an?<br>Übernehmen Sie Kampagnen? |
| `/de-de/ressourcen` | nothing (the general questions) | Spotler Insights abonnieren<br>Tipps fürs E-Mail-Marketing?<br>Welchen Guide zuerst lesen?<br>Gibt es Webinare? |

## Spanish: es-ES

| Page | Was | Now (these 4 loop) |
|---|---|---|
| `/es-es/b2b/email-marketing-automation` | nothing (the general questions) | ¿Qué es el email automation?<br>¿Puedo automatizar mis leads?<br>¿Qué flujos de email funcionan?<br>¿Se conecta con mi CRM? |
| `/es-es/b2b/crm-gestion-de-leads` | nothing (the general questions) | ¿Cómo funciona vuestro CRM?<br>¿Cómo funciona el lead scoring?<br>¿Une ventas y marketing?<br>¿Puedo migrar mis datos de CRM? |
| `/es-es/b2b/gestion-de-eventos` | nothing (the general questions) | ¿Cómo gestiono inscripciones?<br>¿Puedo enviar recordatorios?<br>¿Hay check-in en el evento?<br>¿Cómo hago el seguimiento? |
| `/es-es/b2b/personalizacion-del-sitio-web` | nothing (the general questions) | ¿Qué aporta la personalización?<br>¿Contenido según cada visitante?<br>¿Veo qué empresas me visitan?<br>¿Necesito un desarrollador? |
| `/es-es/b2b/marketing-conversacional` | nothing (the general questions) | ¿Qué es el marketing por chat?<br>¿Puedo añadir un chatbot?<br>¿Funciona con WhatsApp?<br>¿Mi equipo puede seguir chats? |
| `/es-es/b2b/publicacion-en-redes-sociales` | nothing (the general questions) | ¿Puedo programar publicaciones?<br>¿En qué redes puedo publicar?<br>¿Veo cómo rinden mis posts?<br>¿Mi equipo puede aprobar posts? |
| `/es-es/commerce/plataforma-de-datos-de-clientes` | nothing (the general questions) | ¿Necesito un CDP?<br>¿Qué datos puedo unificar?<br>¿Cómo creo segmentos?<br>¿Se conecta con mi tienda? |
| `/es-es/commerce/email-marketing-automation` | nothing (the general questions) | ¿Cómo vendo más con el email?<br>¿Recupero carritos abandonados?<br>¿Qué flujos de email funcionan?<br>¿Se conecta con mi tienda? |
| `/es-es/commerce/correos-electronicos-transaccionales` | nothing (the general questions) | ¿Qué tan fiable es la entrega?<br>¿Qué son emails transaccionales?<br>¿Puedo enviar confirmaciones?<br>¿Funciona con mi tienda online? |
| `/es-es/commerce/busqueda-y-comercializacion` | nothing (the general questions) | ¿Cómo vende más la búsqueda?<br>¿Puedo destacar productos?<br>¿Entiende errores de escritura?<br>¿Con qué plataformas funciona? |
| `/es-es/commerce/whatsapp-sms-redes-sociales` | nothing (the general questions) | ¿Puedo usar WhatsApp?<br>¿Puedo enviar campañas de SMS?<br>¿Todos los chats en un buzón?<br>¿Qué canales hay? |
| `/es-es/precios` | nothing (the general questions) | ¿Qué plan encaja conmigo?<br>¿Cuánto cuesta Spotler?<br>¿Qué incluye cada plan?<br>¿Puedo pedir un presupuesto? |
| `/es-es/productos` | nothing (the general questions) | ¿Qué producto encaja conmigo?<br>¿En qué se diferencian?<br>¿Los productos funcionan juntos?<br>¿Puedo reservar una demo? |
| `/es-es/b2b` | nothing (the general questions) | ¿Cómo ayuda Spotler en B2B?<br>¿Cómo consigo más leads?<br>¿Qué herramientas B2B tenéis?<br>¿Puedo reservar una demo? |
| `/es-es/commerce` | nothing (the general questions) | ¿Cómo hago crecer mi tienda?<br>¿Qué herramientas para tiendas?<br>¿Se conecta con mi plataforma?<br>¿Puedo reservar una demo? |
| `/es-es/sector-publico` | nothing (the general questions) | ¿Trabajáis con administraciones?<br>¿Cumplís con el RGPD?<br>¿Dónde se guardan mis datos?<br>¿Puedo reservar una demo? |
| `/es-es/integraciones` | nothing (the general questions) | ¿Encaja Spotler en mi stack?<br>¿Qué integraciones tenéis?<br>¿Tenéis una API?<br>¿Se conecta con mi CRM? |
| `/es-es/historias-de-exito` | nothing (the general questions) | ¿Qué resultados logran clientes?<br>¿Casos de mi sector?<br>¿Cuándo se ven resultados?<br>¿Puedo reservar una demo? |
| `/es-es/servicios` | nothing (the general questions) | ¿Qué servicios ofrecéis?<br>¿Me ayudáis a empezar?<br>¿Ofrecéis formación?<br>¿Gestionáis campañas por mí? |
| `/es-es/recursos` | nothing (the general questions) | Suscríbeme a Spotler Insights<br>¿Guías de email marketing?<br>¿Qué guía leo primero?<br>¿Tenéis webinars? |

## Swedish: sv-SE

| Page | Was | Now (these 4 loop) |
|---|---|---|
| `/sv-se/b2b/email-marketing-automation` | nothing (the general questions) | Hur fungerar e-postautomation?<br>Kan jag automatisera leads?<br>Vilka e-postflöden funkar bäst?<br>Kopplas det till mitt CRM? |
| `/sv-se/b2b/crm-lead-management` | nothing (the general questions) | Hur fungerar ert CRM?<br>Hur fungerar lead scoring?<br>Ser sälj marknadsdatan?<br>Kan jag flytta min CRM-data? |
| `/sv-se/b2b/evenemangshantering` | nothing (the general questions) | Hur hanterar jag anmälningar?<br>Kan jag skicka påminnelser?<br>Kan gäster checka in på plats?<br>Hur följer jag upp evenemang? |
| `/sv-se/b2b/personlig-anpassning-av-webbplats` | nothing (the general questions) | Vad ger personalisering?<br>Visa innehåll per besökare?<br>Ser jag vilka företag besöker?<br>Behöver jag en utvecklare? |
| `/sv-se/b2b/konversationsbaserad-marknadsforing` | nothing (the general questions) | Hur funkar chattmarknadsföring?<br>Kan jag lägga till en chatbot?<br>Fungerar det med WhatsApp?<br>Kan mitt team ta över chattar? |
| `/sv-se/b2b/publicering-i-sociala-medier` | nothing (the general questions) | Kan jag schemalägga inlägg?<br>Vilka kanaler kan jag posta i?<br>Ser jag hur inläggen presterar?<br>Kan teamet godkänna inlägg? |
| `/sv-se/handel/plattform-for-kunddata` | nothing (the general questions) | Behöver jag en CDP?<br>Vilken data kan jag samla?<br>Hur skapar jag segment?<br>Kopplas den till min webbshop? |
| `/sv-se/handel/email-marketing-automation` | nothing (the general questions) | Hur ökar e-post min försäljning?<br>Vinna tillbaka kundvagnar?<br>Vilka e-postflöden funkar bäst?<br>Kopplas det till min webbshop? |
| `/sv-se/handel/transaktionella-epostmeddelanden` | nothing (the general questions) | Hur pålitlig är leveransen?<br>Vad är transaktionella mejl?<br>Skicka orderbekräftelser?<br>Funkar det med min webbshop? |
| `/sv-se/handel/sokning-pa-plats-merchandising` | nothing (the general questions) | Hur ökar sökning försäljningen?<br>Kan jag lyfta fram produkter?<br>Klarar sökningen stavfel?<br>Vilka plattformar stöds? |
| `/sv-se/handel/whatsapp-sms-sociala-medier` | nothing (the general questions) | Kan jag använda WhatsApp?<br>Kan jag skicka sms-kampanjer?<br>Alla chattar i en inkorg?<br>Vilka kanaler finns det? |
| `/sv-se/priser` | nothing (the general questions) | Vilken plan passar mig?<br>Vad kostar Spotler?<br>Vad ingår i varje plan?<br>Kan jag få en offert? |
| `/sv-se/produkter` | nothing (the general questions) | Vilken produkt passar mig?<br>Vad är skillnaden?<br>Fungerar produkterna ihop?<br>Kan jag boka en demo? |
| `/sv-se/b2b` | nothing (the general questions) | Hur hjälper Spotler B2B-team?<br>Hur får jag fler leads?<br>Vilka B2B-verktyg finns?<br>Kan jag boka en demo? |
| `/sv-se/handel` | nothing (the general questions) | Hur växer min webbshop?<br>Vilka verktyg för min webbshop?<br>Kopplas det till min plattform?<br>Kan jag boka en demo? |
| `/sv-se/offentlig-sektor` | nothing (the general questions) | Jobbar ni med offentlig sektor?<br>Följer ni GDPR?<br>Var lagras min data?<br>Kan jag boka en demo? |
| `/sv-se/integrationer` | nothing (the general questions) | Passar Spotler min tech stack?<br>Vilka integrationer finns?<br>Har ni ett API?<br>Kopplas det till mitt CRM? |
| `/sv-se/framgangshistorier` | nothing (the general questions) | Vilka resultat får kunderna?<br>Exempel från min bransch?<br>Hur snabbt syns resultat?<br>Kan jag boka en demo? |
| `/sv-se/kundcases` | nothing (the general questions) | Vilka resultat får kunderna?<br>Exempel från min bransch?<br>Hur snabbt syns resultat?<br>Kan jag boka en demo? |
| `/sv-se/tjanster` | nothing (the general questions) | Vilka tjänster erbjuder ni?<br>Hjälper ni mig att komma igång?<br>Erbjuder ni utbildning?<br>Kan ni sköta kampanjer åt mig? |
| `/sv-se/kunskapsbank` | nothing (the general questions) | Prenumerera på Spotler Insights<br>Tips om e-postmarknadsföring?<br>Vilken guide läser jag först?<br>Har ni webbinarier? |
