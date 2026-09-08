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
<li>Stand on the left of escalators in Osaka (yes, it's the opposite of Tokyo).</li>
<li>Google Maps is accurate for trains, including platform numbers and fares.</li>
</ul>
<h4>Etiquette</h4>
<ul>
<li>Keep your voice down on trains and don't take phone calls on board.</li>
<li>No eating while walking in shopping streets; stand to the side or eat at the stall.</li>
<li>Bins are rare. Carry a small bag for your rubbish; konbini have bins near the entrance.</li>
<li>Remove shoes where you see a raised step or shoe racks: temples, ryokan, some restaurants.</li>
<li>At shrines: bow at the torii, rinse hands at the basin, toss a coin, bow twice, clap twice, pray, bow once.</li>
<li>Don't touch or feed the Nara deer anything except the official shika senbei crackers. Bow to them and they'll bow back.</li>
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
<h4>Useful phrases</h4>
<ul>
<li>Sumimasen — excuse me / sorry (use it for everything)</li>
<li>Arigatou gozaimasu — thank you</li>
<li>Kore o kudasai — this one, please</li>
<li>Eigo no menyuu arimasu ka? — is there an English menu?</li>
<li>Oishii! — delicious</li>
<li>Toire wa doko desu ka? — where's the toilet?</li>
</ul>`; }

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

function renderPack(){ return `
<h4>Pack list</h4>
<ul class="art-pack">
<li>${art('passport',26)}<span>Passport (6+ months validity), insurance copy, flight and hotel confirmations</span></li>
<li>${art('backpack',26)}<span>Breathable layers plus a light jacket or cardigan for cool evenings and A/C coaches</span></li>
<li>${art('shoes',26)}<span>Well broken-in walking shoes; slip-ons are handy for temples and the onsen town</span></li>
<li>${art('umbrella',26)}<span>Compact umbrella or light raincoat, sunscreen, hat</span></li>
<li>${art('plug',26)}<span>Type A power adapter, power bank, cables</span></li>
<li>${art('iccard',26)}<span>Small notes and coins pouch; IC card if you have one from a previous trip</span></li>
<li>${art('bottle',26)}<span>Reusable water bottle, personal medication, a small rubbish bag</span></li>
<li>${art('shopbag',26)}<span>Spare space in your luggage for konbini snacks and Donki hauls</span></li>
</ul>
<h4>Night before</h4>
<ul>
<li>Be at the office with luggage before 10:00 PM on 28 Sep. The chartered transport leaves on time.</li>
<li>Charge everything, install your eSIM, and download offline maps for Kyoto, Kobe, Nara and Osaka.</li>
</ul>`; }
