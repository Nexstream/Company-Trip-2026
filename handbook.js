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

function renderPack(){
  /* the pack list is a personal checklist; checklist.js owns its markup + ticks */
  if(typeof ckPackHtml==='function') return ckPackHtml();
  return `<h4>Pack list</h4><p>Checklist is still loading — reopen this tab in a moment.</p>`;
}

/* =========================================================
   SPOT DETAILS — curated info for every itinerary stop.
   Keyed by SPOTS keys. Any missing key falls back gracefully
   in renderSpotDetail(), so a new SPOT does not have to have
   an entry here on day one.
     tag   — city badge
     blurb — what the place actually is
     doing — things worth doing while you are there
     know  — practical "before you go" facts (hours, cost, rules)
     near  — [name, how far, what it is] for places NOT on our itinerary
   ========================================================= */
const SPOT_INFO = {
  kix: {
    tag:"Osaka", blurb:"Kansai International — the region's gateway, built on a man-made island in Osaka Bay. Terminal 1 is the 1.7 km curved shed by Renzo Piano, the longest airport terminal in the world.",
    doing:["Lunch on arrival day is free & easy — the 2F and 3F restaurant floors do ramen, curry and sushi sets.","Pick up an ICOCA IC card at the JR ticket counter so trains and konbini are a single tap for the rest of the trip.","Save the souvenir run for the departure hall on 4 Oct — regional KitKats, Osaka omiyage and duty-free are all past security."],
    know:["Free airport wi-fi, and 7-Eleven / Seven Bank ATMs in the arrivals hall take Malaysian cards.","Tax-free counters need your passport, so keep it out of your check-in bag.","Immigration and customs are faster if you fill in the Visit Japan Web QR codes before landing."],
    near:[["Aeroplaza","5 min covered walk","Konbini, food court and the hotel — handy if the coach is late."],["Sky View observation hall","Free shuttle bus","Runway-watching deck; only worth it if you have hours to kill."]]
  },
  kyotoH: {
    tag:"Kyoto", blurb:"Our first two nights, at Shijo-Omiya on Kyoto's west side. It sits on the Hankyu Kyoto line and at the terminus of the Randen, the city's last surviving street tram.",
    doing:["Hankyu Omiya station is a minute away — Kawaramachi and the Gion end of town is about five minutes on the train.","The Randen tram from Shijo-Omiya runs out to Arashiyama's bamboo grove if a free & easy block opens up.","Shijo-dori outside the door has late-night ramen and konbini for the 1 a.m. snack run."],
    know:["Rakuten STAY rooms are apartment-style: expect a washing machine and a small kitchenette rather than daily housekeeping.","Luggage can usually be left at reception before check-in and after check-out — ask a coordinator first.","Coin laundry in the building is the cheapest way to reset your packing halfway through the trip."],
    near:[["Mibu-dera","10 min walk","Temple that served as the Shinsengumi's headquarters — quiet, and free to enter the grounds."],["Nijo Castle","20 min walk","Shogun's Kyoto residence with the nightingale floors that squeak by design."],["Shinsen-en garden","15 min walk","Small ninth-century imperial garden with a red bridge, usually empty."]]
  },
  fushimi: {
    tag:"Kyoto", blurb:"Head shrine of some 30,000 Inari shrines across Japan, and the reason for the postcard: the Senbon Torii, thousands of vermilion gates donated by businesses, tunnelling up the side of Mt Inari.",
    doing:["Walk at least as far as the Yotsutsuji lookout — about 30–45 minutes up — where the trees open onto a view over southern Kyoto.","Look for the fox statues: kitsune are Inari's messengers and carry a key, a scroll or a jewel in their mouths.","Buy a fox-face ema plaque at the top of the first gate run and draw your own face on it."],
    know:["Free, and open 24 hours — there is no gate to close.","The full summit loop is 2–3 hours and 233 m of climbing. Our 8 a.m. slot is deliberately early; the crowds arrive around 10.","The crush is only in the first 10 minutes of gates. Keep walking and it empties out fast.","Steps most of the way. Wear the shoes you can climb in."],
    near:[["Approach street food lane","At the entrance","Grilled quail, taiyaki and inari-zushi — the fried tofu parcels the shrine gives its name to."],["Tofuku-ji","20 min walk","Big Zen complex with a famous maple valley and a modern rock garden."],["Fushimi sake district","2 stops by train","Gekkeikan and Kizakura breweries; tasting flights are cheap."]]
  },
  nishiki: {
    tag:"Kyoto", blurb:"\"Kyoto's Kitchen\" — a 400 m covered arcade of roughly 130 stalls that has been feeding the city for four centuries. Half of it is still a working market for local chefs.",
    doing:["Tamagoyaki on a stick — the rolled omelette stalls make it in front of you.","Tako tamago: a candied baby octopus with a quail egg stuffed in the head. Do it for the photo.","Free pickle (tsukemono) and yatsuhashi tasting at almost every shop — genuinely no obligation to buy.","Aritsugu for knives, if anyone wants a souvenir that outlives the snacks."],
    know:["Lunch here is free & easy. Most stalls run 10:00–18:00 and some shut on Wednesdays.","Cash is much smoother than card at the small stalls.","Eating while walking is frowned on — stand at the stall to finish, then move.","Bins are rare. The stall you bought from will usually take your skewer back."],
    near:[["Nishiki Tenmangu","East end of the arcade","Tiny shrine wedged between shops; rub the bronze ox for luck."],["Teramachi & Shinkyogoku arcades","Straight on from the east end","Two more covered streets of shops, games arcades and cheap eats."],["Daimaru depachika","3 min south on Shijo","Department-store food hall — the polished end of the same idea."]]
  },
  yasaka: {
    tag:"Kyoto", blurb:"The Gion Shrine, 1,350 years old and the guardian of the entertainment district behind it. Its main hall is ringed with hundreds of paper lanterns, each carrying the name of a local business.",
    doing:["Draw an omikuji paper fortune. A bad one gets tied to the rack so it stays behind.","Utsukushi-gozensha, the small sub-shrine to the left, dispenses \"beauty water\" — three drops on the skin, no more.","Walk straight through the back gate into Maruyama Park.","Come back after dark if a free & easy block allows: the lanterns are lit and the crowd thins."],
    know:["Free and open 24 hours; the office selling charms keeps normal hours.","Enter by the big vermilion Nishiromon gate at the very end of Shijo-dori — it is the one in every photo.","Home of Gion Matsuri in July, so expect festival paraphernalia year-round."],
    near:[["Maruyama Park","Directly behind","Kyoto's oldest public park and its famous weeping cherry tree."],["Hanamikoji, Gion","2 min west","The wooden teahouse street. Photography is banned on the private side alleys — the signs are enforced."],["Chion-in","5 min north","Colossal wooden sanmon gate and Japan's largest temple bell."]]
  },
  sannen: {
    tag:"Kyoto", blurb:"Two stone-paved lanes of preserved Edo-period machiya shophouses climbing towards Kiyomizu-dera. The name is a warning: stumble on the three-year slope and legend gives you three years of bad luck.",
    doing:["Yatsuhashi sampling — the cinnamon mochi triangles are handed out free at nearly every shop.","Matcha soft serve, and the Starbucks on Ninenzaka that occupies a tatami-floored townhouse.","Kimono rental groups pass through constantly; it is the best street on the trip for a group photo.","Ishibe-koji, the tiny walled alley off the side, is the quietest thirty metres in the district."],
    know:["Steep, uneven and cobbled. This is the part of the day where good shoes pay for themselves.","Photography is restricted on some side alleys and inside shops — look for the signs.","Busiest 11:00–15:00; our 2:30 slot will be lively."],
    near:[["Yasaka Pagoda (Hokan-ji)","3 min","The five-storey pagoda that anchors every Kyoto postcard."],["Kodai-ji","5 min","Temple with a bamboo grove and a good rock garden, far quieter than Kiyomizu."],["Ninenzaka Starbucks","On the lane","Order downstairs, sit upstairs on the tatami. No photos of other guests."]]
  },
  kiyomizu: {
    tag:"Kyoto", blurb:"A UNESCO World Heritage temple founded in 778, best known for the 13 m wooden stage jutting out over the hillside — built by joinery alone, without a single nail.",
    doing:["The stage view over Kyoto, best in the hour before sunset.","Otowa waterfall: three streams for longevity, love and success. Drink from one only — taking all three is considered greedy.","Jishu-jinja, the matchmaking shrine behind the main hall.","Tainai-meguri, a short walk through pitch darkness under the hall, for a few hundred yen."],
    know:["Entry is around ¥500, open from 06:00 and closing about 18:00.","The approach is all uphill from Sannenzaka — allow 15 minutes of climbing before you reach the gate.","Special night illuminations run some weeks in autumn; check the board at the entrance."],
    near:[["Sannenzaka / Ninenzaka","The approach itself","Where we have just come from."],["Kiyomizu-zaka","At the gate","Souvenir street: pickles, pottery, incense, Kyoto sweets."],["Yasaka Pagoda","8 min downhill","Photo stop on the way back down."]]
  },
  inamori: {
    tag:"Kyoto", blurb:"A morning stop honouring Kazuo Inamori — the Kyocera and KDDI founder whose \"amoeba management\" and Seiwajuku teachings shaped a generation of Japanese business. Expect exhibits on his life, philosophy and the companies he built rather than a temple visit.",
    doing:["Read the management philosophy panels — this is the one stop on the trip that is about work rather than sightseeing.","The Kamo River embankment path is a two-minute walk east and is the nicest place nearby to sit afterwards."],
    know:["Details on opening hours and whether the visit is guided are still with the coordinators — check the group chat the night before.","Business-casual is a safer bet here than anywhere else on the itinerary.","Photography inside exhibition rooms may be restricted; ask before shooting."],
    near:[["Kamo River path","2 min east","Grassy riverbank walk — the classic Kyoto sit-down with a konbini coffee."],["Kyoto Gyoen / Imperial Palace","15 min west","Huge gravel park around the old palace; free, and the grounds tour is walk-up."],["Demachi Masugata arcade","20 min north","Local shopping street, home of the Demachi Futaba mame-mochi queue."]]
  },
  nankin: {
    tag:"Kobe", blurb:"Nankin-machi, one of only three official Chinatowns in Japan. A 200 m grid of about a hundred shops and stalls around a small square with a pavilion, wedged between Motomachi and the port.",
    doing:["Butaman pork buns — Roushouki is the stall with the permanent queue, and it moves fast.","Kobe beef skewers and croquettes, which is how to taste Kobe beef without the steakhouse bill.","Xiaolongbao, sesame dango and tapioca from the square.","Three gates mark the edges: Choanmon east, Seianmon west, Nankinmon south. Walk out through one for the photo."],
    know:["Lunch here is free & easy. Stalls run roughly 10:00–20:00.","Cash. Almost every stall is cash-only and the queues do not want to wait for a card.","Stand and eat by the stall — the square has a few benches and everyone shares them."],
    near:[["Motomachi arcade","Directly adjacent","Long covered shopping street — cheaper than Daimaru, drier than the square."],["Meriken Park & Kobe Port Tower","12 min walk","Waterfront, the red lattice tower, and the earthquake memorial."],["Kitano Ijinkan","20 min walk uphill","Preserved Western merchant houses from the treaty-port era."]]
  },
  arimaH: {
    tag:"Kobe", blurb:"Arima Onsen, tucked behind Mt Rokko, is one of the three oldest hot springs in Japan and gets a mention in eighth-century chronicles. Two waters surface here: kinsen, the rust-brown \"gold\" iron-and-salt water, and ginsen, the clear carbonated \"silver\" water.",
    doing:["Try both waters — the hotel bath plus a public bath if there is time.","Yumotozaka, the slope of shops, sells tansan senbei carbonated crackers baked in front of you and best eaten warm.","The free foot bath (ashiyu) beside Kin-no-yu costs nothing and is open to anyone.","Nene Bridge and the small red Taiko Bridge over the gorge are the town's two photo spots."],
    know:["Wash thoroughly at the seated showers before getting in. Swimsuits are not worn.","Your small towel never touches the water — fold it on your head or leave it at the side.","Tattoos: ask the front desk first. Many places ask you to cover them or book a private bath.","The itinerary lists two possible hotels — Arima Kirari and The Gran Resort Princess Arima. Confirm with a coordinator.","Steep lanes, and the town is small enough to walk end to end in 20 minutes."],
    near:[["Kin-no-yu","5 min walk","The gold-water public bath, around ¥800, with the free foot bath outside."],["Gin-no-yu","8 min walk","The clear carbonated bath; quieter than Kin-no-yu."],["Tosen Jinja","5 min walk","The town's hot-spring shrine, up a short flight of steps."],["Arima Toys & Automata Museum","6 min walk","Wind-up toys and automata over several floors — better than it sounds."]]
  },
  ropeway: {
    tag:"Kobe", blurb:"A twelve-minute gondola that lifts you out of Arima and over the Shiraga valley to the top of Mt Rokko, climbing about 500 m on the way.",
    doing:["Sit facing back down the valley — the view opens up behind you, not ahead.","Late September is still green up here; the maples do not turn until late October.","Ride quietly and listen: the cabin gets very still over the middle of the gorge."],
    know:["Runs roughly 09:30–17:00 and costs about ¥1,030 one way.","High wind can suspend it at short notice, which is why the ropeway is early in the day.","Closed on some Tuesdays for maintenance — the group booking covers this, but it explains the timing.","Around 5–8 °C cooler at the top. Take the layer out of your bag before you board."],
    near:[["Arima Onsen town","Base station","Where we have come from."],["Rokko Shidare Observatory","At the summit end","Lattice-shell observatory next to the Garden Terrace."]]
  },
  terrace: {
    tag:"Kobe", blurb:"A hilltop complex at about 880 m looking down on Kobe, Osaka Bay and — on a clear day — Awaji Island. Locals call it the ten-million-dollar view.",
    doing:["Mihara-dai and Kenshoudai are the two viewing decks; Kenshoudai is the one with the wooden platform.","Rokko Shidare Observatory, the wooden lattice dome, is worth the separate ticket.","Soft serve and a pancake or gratin lunch — the restaurants here are the only food at this altitude."],
    know:["Free to walk in; individual attractions charge separately.","Windy and noticeably colder than sea level. This is the coldest point of the whole trip.","Best light is late afternoon, but our slot is late morning — the haze is usually lighter then anyway."],
    near:[["Rokko Shidare Observatory","2 min walk","Lattice-shell viewing dome, cooled in summer by stored winter ice."],["Rokko Alpine Botanical Garden","10 min by bus","Cool-climate plants that will not grow down at sea level."],["Rokko-Arima Ropeway summit station","5 min walk","The way we came up."]]
  },
  todaiji: {
    tag:"Nara", blurb:"A UNESCO temple founded in 738. The Daibutsuden hall shelters a 15 m bronze Great Buddha and remains one of the largest wooden buildings on earth — and the current hall is a 1709 rebuild only two-thirds the size of the original.",
    doing:["The Nandaimon gate on the way in holds two 8 m Nio guardians carved in 1203 — look up before you walk through.","Squeeze through the hole in the base of a pillar behind the Buddha; it is the size of his nostril and said to grant enlightenment.","Walk up to Nigatsu-do afterwards. It is free, the veranda looks back over the whole Nara basin, and almost nobody goes.","Ring-out at the Great Bell, which needs a swinging beam and several people."],
    know:["Around ¥800 for the Daibutsuden, open roughly 07:30–17:00.","The walk from the gate to the hall is about 10 minutes, all through deer.","Deer will follow you the entire approach if you are carrying anything that rustles."],
    near:[["Nigatsu-do","10 min walk uphill","Free hall with the best free view in Nara."],["Kasuga Taisha","15 min walk","Vermilion shrine reached through a forest of 3,000 stone lanterns."],["Isuien Garden","5 min walk","Walled strolling garden that borrows Todai-ji's gate as scenery."]]
  },
  narapark: {
    tag:"Nara", blurb:"Five hundred hectares of parkland shared with about 1,200 wild sika deer. They are treated as messengers of the gods, were protected by law for centuries, and are formally designated a natural treasure.",
    doing:["Buy shika senbei crackers from a licensed vendor, hold one up, and the deer will bow to you before you hand it over.","Ukimido, the hexagonal pavilion out on Sagiike pond, is the calmest corner of the park.","Walk the lantern paths towards Kasuga Taisha if you have half an hour spare."],
    know:["Feed them the ¥200 crackers and nothing else. No human food, no wrappers, no plastic.","Once they know you have crackers they will crowd, nudge and occasionally nip. Show empty hands and they lose interest.","Guard paper — maps, tickets and paper bags get eaten.","Early October is rutting season. The males are bolder than usual; the park cuts their antlers in October for exactly this reason.","Do not tease them by holding a cracker back for a photo. That is what gets people headbutted."],
    near:[["Nakatanido","15 min walk","Mochi shop famous for its lightning-fast two-man pounding show — check their board for show times."],["Naramachi","20 min walk","Old merchant quarter of lattice-fronted townhouses, cafés and small museums."],["Kofuku-ji","10 min walk","Five-storey pagoda on the park's western edge, free to walk around."]]
  },
  osakaH: {
    tag:"Osaka", blurb:"Our last two nights, in Shinsaibashi — Osaka's shopping and nightlife core, a few minutes' walk from the Dotonbori canal.",
    doing:["Shinsaibashi-suji, the covered arcade at the door, runs about 600 m straight down to Dotonbori and stays dry in rain.","Dotonbori after dark: the Glico running man, Ebisubashi bridge and the mechanical crab sign.","Amerikamura, five minutes west, for vintage shops and the young Osaka crowd.","Late-night kushikatsu or ramen — this district does not really close."],
    know:["Subway Shinsaibashi on the Midosuji line is the main artery; Namba is one stop south.","Konbini on every corner, and a Don Quijote open through the night for anything forgotten.","This is the loudest hotel of the trip. Earplugs if you are a light sleeper."],
    near:[["Dotonbori","8 min walk","The canal, the signs, and most of the food you came to Osaka for."],["Amerikamura","5 min walk","Second-hand clothes, record shops, Triangle Park."],["Hozenji Yokocho","10 min walk","Stone-paved alley with the moss-covered Fudo statue you splash with water."]]
  },
  ebisu: {
    tag:"Osaka", blurb:"The 77.4 m red wheel bolted to the front of the Dotonbori Don Quijote. It is not a circle — the cabins run an oval track around the building, which is why it looks wrong in photos.",
    doing:["Ride it at dusk, when the Dotonbori neon comes on underneath.","Don Quijote fills the floors below: snacks, cosmetics, souvenirs, and a whole aisle of things nobody needs.","Walk two minutes to Ebisubashi bridge for the Glico running man photo everyone takes."],
    know:["Around ¥600 for a roughly 15-minute ride, evenings included.","It has been closed for long stretches in the past — worth a look before the whole group queues.","Cabins are small; four people is cosy."],
    near:[["Glico sign, Ebisubashi","2 min","The photo. Expect a crowd on the bridge at all hours."],["Hozenji Yokocho","4 min","Lantern-lit alley one street back from the noise."],["Kani Doraku","3 min","The giant moving crab. Also an actual crab restaurant."]]
  },
  castle: {
    tag:"Osaka", blurb:"A 106-hectare park wrapped around Osaka Castle. Toyotomi Hideyoshi built the original in 1583; the keep you see went up in 1931 in concrete and now holds a museum with an observation deck on the eighth floor.",
    doing:["The 8F deck for the view out over the moats and the modern city.","The museum floors on Hideyoshi and the sieges of 1614–15.","Find Tako-ishi, the \"octopus stone\" in the Sakuramon wall — roughly 60 tonnes and 12 m across.","Nishinomaru Garden for the classic photo of the keep across open lawn."],
    know:["The park is free and always open; the keep charges about ¥600 and runs 09:00–17:00 with last entry at 16:30.","It is a 15-minute walk in from the nearest gate — the park is much bigger than it looks on a map.","Nishinomaru Garden charges separately.","Lifts inside the keep only go partway; the last floors are stairs."],
    near:[["Miraiza Osaka-jo","At the keep","Restaurants and shops inside the old army headquarters building."],["JO-TERRACE OSAKA","10 min walk","Row of cafés and bakeries by Osakajokoen station — the easy coffee stop."],["Osaka Museum of History","10 min walk","Ninth-floor windows look straight across at the castle."]]
  },
  tsuten: {
    tag:"Osaka", blurb:"The 103 m tower over Shinsekai, rebuilt in 1956 after the original was scrapped for wartime steel. Billiken — the American-born good-luck charm Osaka adopted as \"the god of things as they ought to be\" — sits on the fifth floor.",
    doing:["Rub the soles of Billiken's feet. That is the whole ritual and everyone does it.","The Tower Slide: a 60 m spiral chute down the outside of the tower, about 10 seconds of your life.","At night the tower's lighting colour forecasts tomorrow's weather.","Kushikatsu below — deep-fried skewers, and the one rule that matters is never double-dip the communal sauce."],
    know:["The observation deck is about ¥1,000; the Tower Slide and the open-air Tenbo Paradise deck are separate tickets.","The slide has height, age and clothing restrictions — skirts and loose items are not allowed. Check the board before queueing.","Lunch is scheduled here before the slide, which is the right order.","Weekends and holidays queue badly."],
    near:[["Shinsekai kushikatsu street","Directly below","Janjan Yokocho and the surrounding lanes — the reason to be here at lunch."],["Spa World","5 min walk","Multi-floor bathhouse with themed international baths."],["Tennoji Park & Zoo","10 min walk","Green space and the Abeno Harukas tower beyond it."]]
  },
  kuromon: {
    tag:"Osaka", blurb:"\"Osaka's Kitchen\" — a 580 m covered market of around 150 shops, trading for nearly two centuries. Half of it still supplies restaurants; the other half grills what you point at while you wait.",
    doing:["Grilled scallops, wagyu skewers, otoro tuna and sea urchin, all cooked at the counter.","Fresh fruit — the melon and strawberry stalls are as much a display as a shop.","Takoyaki and kushikatsu for anyone who has somehow not had enough yet.","Sennichimae Doguyasuji, three minutes away, sells the knives and the plastic food samples."],
    know:["Roughly 09:00–18:00; a lot of stalls start shutting around 17:00 and Sundays are quieter.","Cash. Assume cash everywhere.","Prices are tourist-facing compared with a supermarket — you are paying to eat it hot on the spot.","Stand and eat beside the stall; most have a small counter and a bin for you."],
    near:[["Doguyasuji","3 min walk","Kitchenware street — Japanese knives, and the plastic food replicas as souvenirs."],["Nipponbashi Den Den Town","5 min walk","Electronics, anime and retro games."],["Namba / Dotonbori","10 min walk","Back towards the hotel end of town."]]
  },
  nyasaka: {
    tag:"Osaka", blurb:"A small neighbourhood shrine with one enormous feature: a 12 m lion head, mouth agape, that serves as the stage. The open jaws are said to swallow bad luck and swallow up evil spirits.",
    doing:["The photo in front of the lion's mouth — that is what everyone comes for.","Omamori charms here are aimed at exam results and business success, which makes them a decent souvenir for colleagues.","Write an ema plaque; it takes five minutes and costs a few hundred yen."],
    know:["Free, and open roughly 06:30–17:00.","It is small. Fifteen to twenty minutes covers it comfortably.","During festivals the lion's eyes light up and its nose works as a speaker.","The January tug-of-war ritual is its big event, so autumn is the quiet season — which is why we get it to ourselves."],
    near:[["Namba Parks","10 min walk","Terraced rooftop garden built over the old baseball ground; free to walk up."],["Dotonbori","10 min walk","North towards the canal and dinner."],["Nankai Namba station","6 min walk","The airport line, for anyone doing their own transfer."]]
  }
};

/* whenVisited() in index.html returns only the FIRST matching event, which is fine
   for a map popup but wrong in the detail header: Kansai Airport is on Day 1 and
   Day 6, and Tsutenkaku is on Day 5 twice (lunch, then the slide). */
function spotWhenVisited(k){
  const out=[];
  for(const d of DAYS) for(const e of d.ev) if(e[3]===k) out.push(`${d.label} \u00b7 ${e[0]}`);
  return out.join(', ');
}

function spotNearbyStops(k,n){
  n = n||3;
  const s = SPOTS[k];
  if(!s) return [];
  return Object.keys(SPOTS)
    .filter(ok=>ok!==k)
    .map(ok=>({k:ok, s:SPOTS[ok], km:haversine(s.lat,s.lng,SPOTS[ok].lat,SPOTS[ok].lng)}))
    .sort((a,b)=>a.km-b.km)
    .slice(0,n);
}

function renderSpotDetail(k){
  const s = SPOTS[k];
  if(!s) return '';
  const info = SPOT_INFO[k];
  const nav = `<div class="spotnav">
    <button class="spotback">&larr; Back</button>
    <button class="fly" data-k="${esc(k)}">Map</button>
    <button class="go" data-k="${esc(k)}">I am here</button>
  </div>`;
  const wv = spotWhenVisited(k);
  const metaBits = [];
  if(info) metaBits.push(`<span class="badge">${esc(info.tag)}</span>`);
  if(wv) metaBits.push(`<span>${esc(wv)}</span>`);
  if(me.lat!=null) metaBits.push(`<span class="spotdist">${fmtKm(haversine(me.lat,me.lng,s.lat,s.lng))} from you</span>`);
  const head = `<div class="spothead">
    <img class="art-ev-ic" src="${ICON_URL[s.icon]||ICON_URL.temple}" alt="">
    <div>
      <h4>${esc(s.n)}</h4>
      <div class="spotmeta">${metaBits.join('')}</div>
    </div>
  </div>`;

  let body = '';
  if(info){
    body += `<p>${esc(info.blurb)}</p>`;
    if(info.doing && info.doing.length) body += `<h4>What to do</h4><ul>${info.doing.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
    if(info.know && info.know.length) body += `<h4>Good to know</h4><ul>${info.know.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
    if(info.near && info.near.length) body += `<h4>Nearby</h4><ul class="sinear">${info.near.map(([name,howFar,what])=>`<li><b>${esc(name)}</b> <span class="siw">${esc(howFar)}</span><div class="ds">${esc(what)}</div></li>`).join('')}</ul>`;
  } else {
    body += `<p class="ds">No notes for this stop yet.</p>`;
  }

  const others = spotNearbyStops(k,3);
  const othersHtml = `<h4>Other trip stops nearby</h4><ul class="sistops">${others.map(o=>{
    const owv = spotWhenVisited(o.k);
    return `<li><b>${esc(o.s.n)}</b> <span class="siw">${fmtKm(o.km)}</span>${owv?` <span class="ds">${esc(owv)}</span>`:''}<button class="fly" data-k="${esc(o.k)}">Map</button></li>`;
  }).join('')}</ul>`;

  return `${nav}${head}${body}${othersHtml}<button class="spotback">&larr; Back to the day</button>`;
}
