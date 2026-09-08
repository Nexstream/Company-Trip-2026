function renderTips(){ return `
<h4 class="art-h4">${art('yennote',22)}Money</h4>
<ul>
<li>Cash still matters: many small eateries, shrines and market stalls are cash-only. Carry ¥5,000–10,000 in small notes and coins.</li>
<li>Withdraw yen from 7-Eleven (Seven Bank) or post office ATMs; they accept Malaysian cards and have English menus.</li>
<li>No tipping, anywhere. Leaving money on the table causes confusion.</li>
<li>Tax-free shopping: show your passport at stores with the "Tax Free" sign on purchases over ¥5,000.</li>
</ul>
<h4 class="art-h4">${art('iccard',22)}Getting around</h4>
<ul>
<li class="art-kv">${art('iccard',24)}<span class="art-txt">Get an IC card (ICOCA in Kansai) at any station machine, or add Suica/ICOCA to your phone wallet. Tap in and out on trains, buses and at konbini.</span></li>
<li>Kansai Airport to Kyoto by road takes ~1.5 h; the group coach handles the big transfers, so IC cards are for free & easy time.</li>
<li>Stand on the <b>right</b> of escalators in Osaka and Kobe, walking side on the left — Kansai is the famous exception, and Tokyo is the other way round. Kyoto is mixed; copy the person in front of you.</li>
<li>Google Maps is accurate for trains, including platform numbers and fares.</li>
</ul>
<h4 class="art-h4">${art('onsenbucket',22)}Onsen (Arima)</h4>
<ul>
<li>Wash thoroughly at the seated showers before entering the bath. Swimsuits aren't worn.</li>
<li>Your small towel never goes into the water; fold it on your head or leave it on the side.</li>
<li>Tattoos: ask the hotel front desk. Many onsen ask you to cover them or use a private bath.</li>
<li class="art-kv">${art('onsenbucket',24)}<span class="art-txt">Kin-no-yu is the brown "gold" iron water, Gin-no-yu the clear "silver" carbonated water. Try both.</span></li>
</ul>
<h4 class="art-h4">${art('plug',22)}Phone & power</h4>
<ul>
<li class="art-kv">${art('esim',24)}<span class="art-txt">Buy an eSIM before you fly (Ubigi, Airalo, or your telco's roaming pass). Airport SIM counters are slower.</span></li>
<li class="art-kv">${art('plug',24)}<span class="art-txt">Japan uses Type A two-flat-pin plugs at 100V. Bring an adapter; most phone chargers handle the voltage.</span></li>
<li>Download Google Translate's Japanese pack for offline camera translation of menus.</li>
</ul>
<h4>Language &amp; etiquette</h4>
<p>Phrases, the lines staff will say to you, and what to do or avoid at a shrine, a table or an onsen all live on the <b>Japanese</b> tab.</p>`; }

function renderLang(){ return `
<p>Almost nobody expects you to speak Japanese — but five words, said with a small bow, change how the whole trip feels. Romaji is written the way you say it: <b>ou</b> = long "oh", <b>ii</b> = long "ee", <b>r</b> is halfway to an "l", and every vowel gets its own beat (<i>a-ri-ga-to-o</i>).</p>

<h4>Start with these five</h4>
<div class="kon">
  <div class="k"><div class="kn">Say these all day</div><ul class="phr">
    <li><b>Sumimasen</b> — "excuse me / sorry / hello over here". The Swiss army knife: use it to get a waiter's attention, squeeze past someone, or apologise.</li>
    <li><b>Arigatou gozaimasu</b> — thank you. Shorten to <b>arigatou</b> only with friends.</li>
    <li><b>Onegaishimasu</b> — "please / I'd like this one". Say it as you hand over money, a card, or point at a menu.</li>
    <li><b>Daijoubu desu</b> — "I'm fine, thanks / no need". The politest way to decline anything without knowing what was asked.</li>
    <li><b>Hai</b> / <b>Iie</b> — yes / no. <b>Hai</b> also just means "I'm listening".</li>
  </ul></div>
</div>

<h4>Greetings</h4>
<ul class="phr">
<li><b>Ohayou gozaimasu</b> — good morning (until about 10am; use it at hotel breakfast)</li>
<li><b>Konnichiwa</b> — hello / good afternoon</li>
<li><b>Konbanwa</b> — good evening</li>
<li><b>Sayounara</b> — goodbye, but it is heavier than it looks. Leaving a shop, <b>arigatou gozaimasu</b> is more natural.</li>
<li><b>Gomen nasai</b> — a real apology (stepped on a foot). <b>Sumimasen</b> covers the small stuff.</li>
</ul>

<h4>Ordering and eating</h4>
<ul class="phr">
<li><b>Kore o kudasai</b> — "this one, please" (point at the menu or the plastic food model)</li>
<li><b>Kore, hitotsu kudasai</b> — "one of these, please". Two = <b>futatsu</b>, three = <b>mittsu</b>.</li>
<li><b>Eigo no menyuu arimasu ka?</b> — "is there an English menu?"</li>
<li><b>Osusume wa nan desu ka?</b> — "what do you recommend?" — best question in Japan</li>
<li><b>Nama biiru, futatsu onegaishimasu</b> — "two draft beers, please"</li>
<li><b>O-mizu kudasai</b> — "water, please" (it is free and comes with ice)</li>
<li><b>Itadakimasu</b> — said before you eat, hands together. Everyone at the table says it.</li>
<li><b>Gochisousama desu</b> — "thank you for the meal", said to the chef as you leave. Locals will hear it and smile.</li>
<li><b>Oishii!</b> — delicious. Say it out loud; it is a compliment, not a comment.</li>
<li><b>Kanpai!</b> — cheers. Glasses up, wait for it, then drink.</li>
<li><b>Betsu-betsu de onegaishimasu</b> — "separate bills, please". Many small places cannot split — ask first.</li>
<li><b>O-kaikei onegaishimasu</b> — "the bill, please" (or cross your index fingers into an X)</li>
</ul>

<h4>Shopping and paying</h4>
<ul class="phr">
<li><b>Ikura desu ka?</b> — "how much is it?"</li>
<li><b>Kaado de onegaishimasu</b> — "by card, please". Cash = <b>genkin de onegaishimasu</b>.</li>
<li><b>Menzei dekimasu ka?</b> — "can I get tax-free?" (passport in hand, over ¥5,000)</li>
<li><b>Kore, shichaku dekimasu ka?</b> — "can I try this on?"</li>
<li><b>Mite mo ii desu ka?</b> — "may I look / pick it up?"</li>
<li><b>Chotto kangaemasu</b> — "let me think about it" — the graceful way to walk away</li>
</ul>

<h4>Lost, stuck, or asking for help</h4>
<ul class="phr">
<li><b>Toire wa doko desu ka?</b> — "where is the toilet?" Swap in <b>eki</b> (station), <b>konbini</b>, <b>basu-tei</b> (bus stop).</li>
<li><b>... ni ikitai desu</b> — "I want to go to ...". Show the name on your phone and say it.</li>
<li><b>Eigo ga hanaseru hito wa imasu ka?</b> — "is there someone who speaks English?"</li>
<li><b>Wakarimasen</b> — "I don't understand". <b>Nihongo wa wakarimasen</b> = "I don't speak Japanese".</li>
<li><b>Mou ichido onegaishimasu</b> — "once more, please"</li>
<li><b>Yukkuri onegaishimasu</b> — "slowly, please"</li>
<li><b>Shashin, ii desu ka?</b> — "is a photo okay?" Ask before pointing a camera at a person, a shop interior, or food being made.</li>
<li><b>Tetsudatte kudasai</b> — "please help me". In a real emergency: <b>Tasukete!</b></li>
<li><b>Michi ni mayoimashita</b> — "I'm lost"</li>
</ul>

<h4>Now the useful half: what they will say to you</h4>
<p>You will hear the same dozen lines at every till, counter and platform in Kansai. Recognising them is worth more than anything you can say.</p>
<ul class="phr">
<li><b>Irasshaimase!</b> — "welcome!", shouted the moment you walk in. <span class="ans">No reply needed. A nod is plenty.</span></li>
<li><b>Fukuro wa irimasu ka?</b> / <b>Rejibukuro wa?</b> — "do you need a bag?" Bags cost ¥3–5 now. <span class="ans">Say: Hai, onegaishimasu — or Daijoubu desu if you brought one.</span></li>
<li><b>Atatamemasu ka?</b> — "shall I heat this up?" (any konbini bento, fried chicken or bun) <span class="ans">Say: Hai, onegaishimasu.</span></li>
<li><b>O-hashi wa irimasu ka?</b> — "do you need chopsticks?" Also <b>supuun</b> (spoon), <b>fooku</b> (fork), <b>sutoroo</b> (straw). <span class="ans">Say: Hai, onegaishimasu / Daijoubu desu.</span></li>
<li><b>Ten-nai de o-meshiagari desu ka?</b> / <b>O-mochikaeri desu ka?</b> — "eating in, or taking away?" Not small talk: eat-in is taxed 10%, takeaway 8%. <span class="ans">Say: Mochikaeri desu (takeaway) or Ten-nai de (eat in).</span></li>
<li><b>Pointo kaado wa o-mochi desu ka?</b> — "do you have a point card?" <span class="ans">Say: Daijoubu desu.</span></li>
<li><b>O-shiharai wa?</b> / <b>Genkin desu ka, kaado desu ka?</b> — "how are you paying?" <span class="ans">Say: Kaado de / Genkin de. Then put the money in the little tray, not in the hand.</span></li>
<li><b>Nan-mei sama desu ka?</b> — "how many people?" at a restaurant door <span class="ans">Say: Futari desu (2), San-nin desu (3) — or just hold up fingers.</span></li>
<li><b>Shoushou o-machi kudasai</b> — "one moment please". <b>O-matase shimashita</b> = "sorry to keep you waiting".</li>
<li><b>Kashikomarimashita</b> — a very polite "certainly". It means yes, your order landed.</li>
<li><b>Tsugi no kata, douzo</b> — "next person, please". <b>Douzo</b> on its own = "go ahead / here you are".</li>
<li><b>Kochira e douzo</b> — "this way, please". Follow them.</li>
<li><b>Arigatou gozaimashita</b> — thank you, past tense, called out as you leave. <span class="ans">Say arigatou gozaimasu back on the way out the door.</span></li>
</ul>

<h4>On the train, over the speaker</h4>
<ul class="phr">
<li><b>Mamonaku, ... ni touchaku shimasu</b> — "we will shortly arrive at ..."</li>
<li><b>Doa ga shimarimasu, go-chuui kudasai</b> — "doors closing, please take care"</li>
<li><b>Ashimoto ni go-chuui kudasai</b> — "watch your step" (also on every escalator)</li>
<li><b>Kakekomi jousha wa o-yame kudasai</b> — "please do not run for the train". Let it go; the next one is in four minutes.</li>
<li><b>Yuusenseki</b> — priority seat. Stand up if an elderly passenger boards.</li>
<li><b>Kyuukou</b> / <b>Tokkyuu</b> / <b>Futsuu</b> — express / limited express / local. Check the board: an express may skip your stop.</li>
</ul>

<h4>Numbers and prices</h4>
<ul class="phr">
<li>1–10: <b>ichi, ni, san, yon, go, roku, nana, hachi, kyuu, juu</b></li>
<li><b>hyaku</b> = 100 · <b>sen</b> = 1,000 · <b>man</b> = 10,000. So ¥2,500 is <b>ni-sen go-hyaku en</b>, and ¥10,000 is <b>ichi-man en</b> — the "man" jump is what trips people up.</li>
<li>People: <b>hitori</b> (1), <b>futari</b> (2), then <b>san-nin, yo-nin, go-nin</b>.</li>
<li>Things: <b>hitotsu, futatsu, mittsu, yottsu, itsutsu</b>.</li>
<li>Rough feel for money: ¥100 ≈ RM3. A konbini lunch is ¥600–800, a bowl of ramen ¥900–1,200, a can of coffee ¥140.</li>
</ul>

<h4>Signs worth recognising</h4>
<ul class="phr">
<li><span class="jp">出口</span> <b>deguchi</b> — exit · <span class="jp">入口</span> <b>iriguchi</b> — entrance</li>
<li><span class="jp">お手洗い</span> / <span class="jp">トイレ</span> — toilet · <span class="jp">男</span> men · <span class="jp">女</span> women</li>
<li><span class="jp">押</span> push · <span class="jp">引</span> pull</li>
<li><span class="jp">税込</span> <b>zeikomi</b> — tax included · <span class="jp">税抜</span> <b>zeinuki</b> — tax NOT included, the real price is higher</li>
<li><span class="jp">現金のみ</span> <b>genkin nomi</b> — cash only</li>
<li><span class="jp">営業中</span> open · <span class="jp">準備中</span> <b>junbi-chuu</b> — "preparing", i.e. closed for now</li>
<li><span class="jp">無料</span> free · <span class="jp">有料</span> paid · <span class="jp">割引</span> discount</li>
<li><span class="jp">撮影禁止</span> <b>satsuei kinshi</b> — no photography. Take this one seriously.</li>
<li><span class="jp">立入禁止</span> <b>tachiiri kinshi</b> — no entry · <span class="jp">禁煙</span> no smoking</li>
<li><span class="jp">大人</span> adult · <span class="jp">子供</span> child (ticket machines)</li>
</ul>

<h4>Kansai talk — you are not in Tokyo</h4>
<p>Kansai-ben is its own thing and Osakans are proud of it. You do not need to use it, but you will hear it, and trying one word gets a genuine laugh.</p>
<ul class="phr">
<li><b>Maido!</b> — Osaka's all-purpose "hey / thanks / welcome", especially from market and takoyaki stalls</li>
<li><b>Ookini</b> — thank you, the Kyoto and Osaka version of arigatou</li>
<li><b>Nanbo?</b> — "how much?" instead of <i>ikura</i></li>
<li><b>Meccha oishii!</b> — "seriously delicious". <b>Meccha</b> = very, and it is pure Kansai.</li>
<li><b>Honma?</b> — "really?" · <b>Akan</b> — "no good / don't"</li>
<li><b>Nandeyanen!</b> — "what are you on about!" — the classic comedy retort. Use it on a colleague, not a stranger.</li>
<li>If someone points two fingers at you like a gun and says <b>bang</b>, play dead. It is an Osaka joke and locals love that visitors get it.</li>
</ul>

<h4 class="art-h4">${art('torii',22)}At a shrine or a temple</h4>
<p>Kyoto and Nara are full of working places of worship, not monuments. The whole sequence takes a minute and people will notice you doing it.</p>
<ul class="phr">
<li>Bow once at the <b>torii</b> gate before you walk through, and keep to the sides of the path — the middle is left for the gods.</li>
<li>At the stone basin (<b>temizuya</b>): right hand pours over the left, swap, tip a little into your cupped left hand to rinse your mouth, spit beside the basin — never into it — then stand the ladle upright to rinse the handle.</li>
<li>At the hall: toss a coin in the box (¥5, a <b>go-en</b>, is the lucky one), ring the bell, then <b>bow twice, clap twice, make your wish, bow once</b>.</li>
<li>Temples are different: no clapping. Bow, put your hands together quietly, bow again.</li>
<li>Draw an <b>omikuji</b> fortune for ¥100–200. A bad one gets tied to the rack there so it stays behind.</li>
<li>Keep your voice low, do not eat inside the grounds, and step out of the way of anyone actually praying.</li>
<li><span class="badge">Nara</span> The deer are considered messengers of the gods and roam free. Feed them only the official <b>shika senbei</b>, and bow at one — many will bow back.</li>
</ul>

<h4>Culture: do and do not</h4>
<div class="kon">
  <div class="k"><div class="kn">Please do</div><ul class="phr">
    <li>Nod or bow slightly when greeting, thanking, or receiving something. A small nod is enough — nobody expects a deep bow from us.</li>
    <li>Put cash and cards in the small tray on the counter, and take change from it with two hands. Handing money directly is the number one visitor slip.</li>
    <li>Receive a business card with both hands, read it, and set it on the table — never straight into a back pocket.</li>
    <li>Queue on the platform markings, stand aside, and let everyone off before you board.</li>
    <li>Take your shoes off wherever you see a raised step, a shoe rack, or slippers waiting. Toilet slippers stay in the toilet.</li>
    <li>Carry your rubbish until you find a bin, and sort it — burnable, plastic, cans, PET bottles.</li>
    <li>Pour for the person next to you rather than yourself, and lift your glass with both hands when someone pours for you.</li>
    <li>Wash and rinse fully at the seated showers before you get into an onsen. See the Japan tips tab for the rest.</li>
    <li>Be early. In Japan, five minutes early is on time — for the coach, the restaurant, everything.</li>
    <li>Buy omiyage (boxed local snacks) to bring back for the office. It is a real social expectation, and every station sells them.</li>
    <li>Stand on the <b>right</b> of escalators in Osaka and Kobe and leave the left clear — the opposite of Tokyo, and one of the few things Kansai will quietly correct you on. Kyoto is mixed; follow the person in front.</li>
  </ul></div>
  <div class="k"><div class="kn">Please do not</div><ul class="phr">
    <li>Do not tip. Ever. It is confusing at best and can be taken as an insult.</li>
    <li>Do not take phone calls on a train, and keep your phone on manner mode. Talking loudly in a carriage is the one thing that genuinely annoys locals.</li>
    <li>Do not eat or drink on local trains and subways. Shinkansen and long-distance trains are fine.</li>
    <li>Do not eat while walking through arcades and markets. Stand at the stall or step to the side.</li>
    <li>Do not stick chopsticks upright in rice, or pass food chopstick-to-chopstick — both are funeral rituals.</li>
    <li>Do not double-dip the kushikatsu sauce. There is one communal pot, and the rule is posted on the wall.</li>
    <li>Do not point at people with one finger; use an open hand. Do not beckon palm-up.</li>
    <li>Do not blow your nose loudly at the table. Sniff, or step out.</li>
    <li>Do not smoke on the street. Osaka and Kyoto both fine street smoking — use the marked smoking rooms.</li>
    <li>Do not get in an onsen unwashed, in a swimsuit, or with your towel in the water. Ask the front desk about tattoos first.</li>
    <li>Do not step on tatami in shoes or slippers, or sit on the raised entrance step.</li>
    <li>Do not cross against a red man, even on an empty street. Nobody does.</li>
  </ul></div>
</div>

<div class="warn"><b>The three that actually get visitors in trouble.</b> 1 — Do not photograph geiko or maiko in Gion. Hanamikoji and its side lanes carry a ¥10,000 fine and it is enforced; shoot the street, not the person. 2 — Obey <span class="jp">撮影禁止</span> (no photography) signs inside temples, halls and shops; a phone raised anyway is treated as disrespect, not a mistake. 3 — In Nara, feed the deer only the official shika senbei, feed it fast, and show your empty hands. Teasing them with a held-back cracker is how people get headbutted.</div>

<p class="ds" style="color:#6b5f45;font-size:18px">Download the Google Translate Japanese pack before you fly — camera mode reads menus and signs offline. But try the words first; effort counts for far more than accuracy here.</p>`; }

function renderMust(){ return `
<div class="art-hero">
  <div class="art-tile">${art('takoyaki',40)}<span>Takoyaki</span></div>
  <div class="art-tile">${art('okonomiyaki',40)}<span>Okonomiyaki</span></div>
  <div class="art-tile">${art('ramen',40)}<span>Ramen</span></div>
  <div class="art-tile">${art('sushi',40)}<span>Nigiri</span></div>
  <div class="art-tile">${art('onigiri',40)}<span>Onigiri</span></div>
  <div class="art-tile">${art('matcha',40)}<span>Matcha</span></div>
</div>
<h4>Konbini — the convenience store pilgrimage</h4>
<p>Open 24 hours, on every corner, and the food is seriously good. Go at least once a day. Heat-up, ATM, toilets, luggage tape, umbrellas, and a bin are all inside.</p>
<div class="kon">
  <div class="k"><div class="kn">7-Eleven</div><ul>
    <li>${art('tamagoyaki',22)}<span>Egg sandwich (tamago sando)</span></li><li>${art('onigiri',22)}<span>Onigiri: tuna mayo, salmon, ume</span></li><li>${art('famichiki',22)}<span>Nanachiki fried chicken</span></li><li>${art('yennote',22)}<span>Seven Bank ATM for cash</span></li><li>${art('bottle',22)}<span>Smoothies blended in-store</span></li></ul></div>
  <div class="k"><div class="kn">FamilyMart</div><ul>
    <li>${art('famichiki',22)}<span>Famichiki — the famous fried chicken</span></li><li>${art('famichiki',22)}<span>Spicy Famichiki and chicken steak</span></li><li>${art('melonpan',22)}<span>Melon pan and cream buns</span></li><li>${art('cancoffee',22)}<span>Frappé machine drinks</span></li><li>${art('konbini',22)}<span>Listen for the door chime</span></li></ul></div>
  <div class="k"><div class="kn">Lawson</div><ul>
    <li>${art('famichiki',22)}<span>Karaage-kun nugget cups</span></li><li>${art('mochi',22)}<span>Premium roll cake (Uchi Café)</span></li><li>${art('mochi',22)}<span>Basque cheesecake</span></li><li>${art('bottle',22)}<span>Natural Lawson for healthier snacks</span></li><li>${art('cancoffee',22)}<span>Best coffee of the three</span></li></ul></div>
</div>
<p>Also try: strawberry sandwiches, Pocky flavours you can't get at home, Calbee jagariko sticks, canned highball, and hot drinks from the heated shelf in the morning.</p>
<div class="art-hero">
  <div class="art-tile">${art('strawsando',32)}<span>Strawberry sando</span></div>
  <div class="art-tile">${art('beercan',32)}<span>Highball</span></div>
  <div class="art-tile">${art('senbei',32)}<span>Senbei</span></div>
</div>

<h4>Other stops worth squeezing in</h4>
<ul>
<li><span class="badge">Osaka</span> Don Quijote (Donki) — chaotic megastore for snacks, cosmetics, souvenirs. The Dotonbori branch has a ferris wheel on its front.</li>
<li><span class="badge">Osaka</span> Dotonbori at night — Glico running man sign, takoyaki, kushikatsu. Ten minutes' walk from the Shinsaibashi hotel.</li>
<li><span class="badge">Osaka</span> Shinsaibashi-suji shopping arcade — right at our hotel's doorstep.</li>
<li><span class="badge">Kyoto</span> Daiso / Seria — 100-yen shops for chopsticks, stationery, and gift wrapping.</li>
<li><span class="badge">Kyoto</span> Gion at dusk — walk from Yasaka Shrine down Hanamikoji; you might spot a geiko.</li>
<li>${art('kobeskewer',22)}<span><span class="badge">Kobe</span> Kobe beef — Nankin-machi has affordable skewers if the full steak isn't in budget.</span></li>
<li>${art('mochi',22)}<span><span class="badge">Nara</span> Nakatanidou — the mochi shop with the lightning-fast pounding show, near Kintetsu Nara station.</span></li>
<li>${art('vending',22)}<span><span class="badge">Anywhere</span> Vending machines — hot corn soup, Boss coffee, Pocari Sweat. Try the weird ones.</span></li>
<li><span class="badge">Anywhere</span> Gacha capsule machines and Uniqlo Japan-only tees.</li>
</ul>
<h4>Eat this in each city</h4>
<ul>
<li class="art-kv">${art('yudofu',24)}${art('matcha',24)}${art('tamagoyaki',24)}<span class="art-txt">Kyoto: yudofu (tofu hot pot), matcha everything, yatsuhashi sweets, Nishiki Market tamagoyaki.</span></li>
<li class="art-kv">${art('kobeskewer',24)}${art('porkbun',24)}${art('senbei',24)}<span class="art-txt">Kobe: Kobe beef, butaman (pork buns) at Rosho-ki in Chinatown, Arima's carbonated senbei crackers.</span></li>
<li class="art-kv">${art('kakinoha',24)}${art('mochi',24)}<span class="art-txt">Nara: kakinoha-zushi (sushi wrapped in persimmon leaf), mochi.</span></li>
<li class="art-kv">${art('takoyaki',24)}${art('okonomiyaki',24)}${art('porkbun',24)}<span class="art-txt">Osaka: takoyaki, okonomiyaki, kushikatsu (never double-dip the sauce), 551 Horai pork buns at the station.</span></li>
</ul>`; }

function renderStay(){ return `
<h4 class="art-h4"><img class="art-ic" src="${ICON_URL.plane}" alt="" style="width:22px;height:22px">Flights — Philippine Airlines via Manila</h4>
<ul>
<li>Outbound 29 Sep: KL 2:15 AM → Manila 6:15 AM (PR530) · Manila 9:10 AM → Kansai 2:10 PM (PR412)</li>
<li>Return 4 Oct: Osaka 3:15 PM → Manila 6:40 PM (PR411) · Manila 9:15 PM → KL 1:15 AM on 5 Oct (PR529)</li>
<li>Transit in Manila is under 3 hours each way; stay near the gate.</li>
</ul>
<h4 class="art-h4"><img class="art-ic" src="${ICON_URL.hotel}" alt="" style="width:22px;height:22px">Hotels</h4>
<ul>
<li>29 Sep – 1 Oct · Kyoto: Rakuten STAY URBAN Kyoto Shijo Omiya (2 nights)</li>
<li>1 – 2 Oct · Arima Onsen: listed as Arima Kirari on the hotel slide and The Gran Resort Princess Arima in the itinerary — check with coordinators (1 night)</li>
<li>2 – 4 Oct · Osaka: WAYFARER Shinsaibashi (2 nights)</li>
</ul>
<h4>Meals</h4>
<ul>
<li>Company-arranged: breakfasts, most dinners, flight meals, and the Arima kaiseki dinner.</li>
<li>Free & easy: lunches at Kansai Airport, Nishiki Market, and Kobe Chinatown.</li>
<li>Allergies and dietary needs were collected and factored into bookings; flag changes to a coordinator.</li>
</ul>
<h4 class="art-h4">${art('umbrella',22)}Weather</h4>
<p>Early October in Kansai: 23–26°C by day, 15–18°C in the evening, scattered showers possible. Layers make the biggest difference.</p>
<h4>Coordinators</h4>
<p>James · Zack · Chai Mun · Diviya — reach out with questions before or during the trip. Save their numbers before you fly.</p>
<div class="warn">Passport must be valid for at least 6 months from the return date. Group travel insurance is arranged for everyone; keep a copy on your phone.</div>`; }

function renderPack(){
  /* the pack list is a personal checklist; checklist.js owns its markup + ticks */
  if(typeof ckPackHtml==='function') return ckPackHtml();
  return `<h4>Pack list</h4><p>Checklist is still loading — reopen this tab in a moment.</p>`;
}
