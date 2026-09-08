/* =========================================================
   GAME MODULE — TRIVIA
   ========================================================= */
/* =========================================================
   TRIVIA TAB — Nexstream Kansai Quest
   All top-level names prefixed trivia / Trivia / TRIVIA_
   ========================================================= */

const TRIVIA_ROTATE_MS = 30*60*1000; // one active question per 30 min, clock-derived

const TRIVIA_Q = [
  {id:"t01", q:"What flight number takes the group from Kuala Lumpur to Manila on the way out?", opts:["PR530","PR412","PR411","PR529"], a:0, ex:"PR530 departs KL 2:15 AM, 29 Sep, connecting through Manila."},
  {id:"t02", q:"Which flight continues from Manila into Kansai Airport?", opts:["PR411","PR530","PR412","PR529"], a:2, ex:"PR412 departs Manila 9:10 AM and lands at Kansai around 2:10 PM."},
  {id:"t03", q:"On the way home, which flight leaves Osaka for Manila?", opts:["PR530","PR411","PR412","PR529"], a:1, ex:"PR411 departs Osaka 3:15 PM on 4 Oct."},
  {id:"t04", q:"And the final leg back into Kuala Lumpur is which flight?", opts:["PR412","PR411","PR529","PR530"], a:2, ex:"PR529 leaves Manila 9:15 PM, arriving KL 1:15 AM on 5 Oct."},
  {id:"t05", q:"What time must everyone be at the office with luggage on 28 Sep?", opts:["8:00 PM","9:00 PM","10:00 PM","11:00 PM"], a:2, ex:"Chartered transport to the airport leaves on time at 10:00 PM."},
  {id:"t06", q:"Which hotel does the group check into first, on Day 1 in Kyoto?", opts:["WAYFARER Shinsaibashi","Rakuten STAY URBAN Kyoto Shijo Omiya","Arima Kirari","Gran Resort Princess Arima"], a:1, ex:"Rakuten STAY URBAN Kyoto Shijo Omiya, two nights from 29 Sep."},
  {id:"t07", q:"Which hotel does the group stay at in Osaka?", opts:["WAYFARER Shinsaibashi","Rakuten STAY Kyoto","Nankin-machi Inn","Ebisu Tower Hotel"], a:0, ex:"WAYFARER Shinsaibashi, two nights from 2 Oct."},
  {id:"t08", q:"On which day does the group visit Nara Park and Tōdai-ji?", opts:["Day 2","Day 3","Day 4","Day 5"], a:2, ex:"Day 4 (2 Oct): Arima Onsen → Nara → Osaka."},
  {id:"t09", q:"On which day does the group stay overnight in Arima Onsen?", opts:["Day 2 into Day 3","Day 3 into Day 4","Day 4 into Day 5","Day 1 into Day 2"], a:1, ex:"Check-in is Day 3 (1 Oct) afternoon, checkout Day 4 (2 Oct) morning."},
  {id:"t10", q:"Which temple, famous for thousands of red torii gates, is visited on Day 2?", opts:["Kiyomizu-dera","Tōdai-ji","Fushimi Inari Taisha","Yasaka Shrine"], a:2, ex:"Fushimi Inari Taisha — go early to beat the crowds, per the handbook."},
  {id:"t11", q:"Which four people are named as trip coordinators?", opts:["James, Zack, Chai Mun, Diviya","James, Wei, Aisyah, Ken","Zack, Ken, Nur, James","Diviya, Wei, Chai Mun, Aisyah"], a:0, ex:"James · Zack · Chai Mun · Diviya — save their numbers before flying."},
  {id:"t12", q:"Which of these lunches is explicitly free & easy, not company-arranged?", opts:["Arima kaiseki dinner","Nishiki Market lunch","Day 2 company dinner","Day 5 company dinner"], a:1, ex:"Free & easy lunches are at Kansai Airport, Nishiki Market and Kobe Chinatown."},
  {id:"t13", q:"Roughly how long is the Manila transit on each leg?", opts:["Under 3 hours","About 6 hours","Overnight","About 45 minutes"], a:0, ex:"The handbook notes transit is under 3 hours each way — stay near the gate."},
  {id:"t14", q:"What must a passport's remaining validity be from the return date?", opts:["3 months","6 months","1 year","No minimum"], a:1, ex:"At least 6 months' validity from the return date is required."},
  {id:"t15", q:"On Day 5 in Osaka, which market is visited in the afternoon?", opts:["Nishiki Market","Kuromon Market","Nankin-machi","Kiyomizu street market"], a:1, ex:"Kuromon Market, Osaka's street-food market, around 2:00 PM on Day 5."},
  {id:"t16", q:"Which side do you stand on when riding an escalator in Osaka?", opts:["Right, the opposite of Tokyo","Left, the same as Tokyo","Either side is fine","Standing isn't allowed"], a:0, ex:"Kansai flips it: stand on the right in Osaka and Kobe and leave the left clear. Tokyo is the one that stands on the left."},
  {id:"t17", q:"How much should you tip at a restaurant in Japan?", opts:["10%","A rounded-up amount","Nothing — tipping isn't done","15-20%"], a:2, ex:"No tipping, anywhere — leaving cash on the table just causes confusion."},
  {id:"t18", q:"What's the IC card used for trains, buses and konbini in the Kansai region called?", opts:["Suica","Pasmo","ICOCA","Kitaca"], a:2, ex:"ICOCA is the Kansai-region IC card; Suica also works but is Tokyo's."},
  {id:"t19", q:"Around what purchase amount unlocks tax-free shopping with your passport?", opts:["¥1,000","¥5,000","¥20,000","¥50,000"], a:1, ex:"Tax-free shopping applies to purchases over ¥5,000 at participating stores."},
  {id:"t20", q:"In the onsen, where does your small towel go once you're in the water?", opts:["Wrapped around you in the bath","Folded on your head or left at the side, never in the water","Draped over the edge of the tub","Left in the changing room"], a:1, ex:"The towel never touches the bathwater — fold it on your head or set it aside."},
  {id:"t21", q:"What's the correct order for a shrine visit ritual?", opts:["Clap twice, bow, rinse hands, pray","Bow at torii, rinse hands, toss coin, bow twice, clap twice, pray, bow once","Toss coin, clap once, pray, bow twice","Rinse hands, pray, bow at torii, clap"], a:1, ex:"Bow at the torii → rinse hands → coin → two bows → two claps → pray → one bow."},
  {id:"t22", q:"What should you do about rubbish while out and about, since bins are rare?", opts:["Leave it at the shrine", "Carry a small bag for it until you find a bin, e.g. at a konbini","Hand it to a shopkeeper","Bins are actually everywhere"], a:1, ex:"Bins are rare in Japan — carry a small bag; konbini have bins near the entrance."},
  {id:"t23", q:"What kind of plug and voltage does Japan use?", opts:["Type G, 240V","Type C, 220V","Type A, 100V","Type I, 230V"], a:2, ex:"Japan uses Type A two-flat-pin plugs at 100V."},
  {id:"t24", q:"What are you allowed to feed the deer in Nara Park?", opts:["Any fruit you're carrying","Only the official shika senbei crackers","Bread from konbini","Nothing at all, ever"], a:1, ex:"Feed them only the official shika senbei crackers — and they'll bow back."},
  {id:"t25", q:"Which convenience store chain is famous for Famichiki fried chicken?", opts:["7-Eleven","Lawson","FamilyMart","Ministop"], a:2, ex:"Famichiki is FamilyMart's signature fried chicken."},
  {id:"t26", q:"Karaage-kun nugget cups are the signature snack of which chain?", opts:["Lawson","7-Eleven","FamilyMart","Daily Yamazaki"], a:0, ex:"Karaage-kun is Lawson's fried-chicken nugget cup."},
  {id:"t27", q:"What is yatsuhashi?", opts:["A grilled skewer from Osaka","A Kyoto cinnamon-mochi sweet","A Kobe beef cut","A type of sushi rice"], a:1, ex:"Yatsuhashi is a Kyoto sweet, often cinnamon-flavoured mochi, sometimes folded around red bean."},
  {id:"t28", q:"What is kakinoha-zushi, a Nara specialty, wrapped in?", opts:["Bamboo leaf","Seaweed (nori)","Persimmon leaf","Banana leaf"], a:2, ex:"Kakinoha-zushi is pressed sushi wrapped in a persimmon (kaki) leaf."},
  {id:"t29", q:"What's the one unbreakable rule of eating kushikatsu in Osaka?", opts:["Eat it standing up","Never double-dip the sauce","Always order it with rice","Never eat it with your hands"], a:1, ex:"One dip only in the shared sauce — double-dipping is the cardinal sin of kushikatsu."},
  {id:"t30", q:"At Arima Onsen, what does Kin-no-yu (\"gold water\") refer to?", opts:["A clear carbonated spring","A brown iron-rich spring","A hotel dessert menu","A gold-leafed bathhouse roof"], a:1, ex:"Kin-no-yu is the brown, iron-rich water; Gin-no-yu is the clear, carbonated \"silver\" water."},
  {id:"t31", q:"What is 551 Horai, popular at Osaka's train station, best known for?", opts:["Ramen bowls","Pork buns (butaman)","Matcha soft-serve","Takoyaki"], a:1, ex:"551 Horai's pork buns are a grab-and-go Osaka station classic."},
];

let triviaRoot = null;
let triviaMyAnswers = {};      // q_id -> {choice, correct, ...}
let triviaTally = {};          // q_id -> {counts:[n,n,n,n], total}
let triviaScores = [];         // [{id,name,score}] sorted desc
let triviaLastFetchTs = 0;
let triviaActiveIdx = -1;
let triviaLoadedOnce = false;
let triviaPrevOpen = false;

function triviaIdx(){ return Math.floor(Date.now() / TRIVIA_ROTATE_MS) % TRIVIA_Q.length; }
function triviaQuestion(idx){ return TRIVIA_Q[idx]; }
function triviaMsLeft(){ const p = Date.now() % TRIVIA_ROTATE_MS; return TRIVIA_ROTATE_MS - p; }
function triviaFmtClock(ms){ const s = Math.max(0, Math.floor(ms/1000)); const m = Math.floor(s/60); const r = s%60; return m+":"+String(r).padStart(2,"0"); }

function renderTrivia(){
  return `
<style>
.trivia-wrap{max-width:640px;margin:0 auto;color:var(--ink,#2a2418)}
.trivia-timer{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--red,#c8442b);margin-bottom:12px;text-align:center}
.trivia-qcard{background:var(--cream,#f3e8cf);border:3px solid var(--ink,#2a2418);box-shadow:4px 4px 0 rgba(0,0,0,.3);padding:14px}
.trivia-qtext{font-size:21px;line-height:1.3;margin-bottom:12px}
.trivia-opts{display:flex;flex-direction:column;gap:8px}
.trivia-opt{min-height:48px;display:flex;align-items:center;padding:10px 12px;font-family:'VT323','Courier New',monospace;font-size:19px;
  background:var(--paper,#e9dcbd);border:3px solid var(--gold2,#8e6f2a);color:var(--ink,#2a2418);text-align:left;width:100%}
.trivia-opt:active{transform:translate(1px,1px)}
.trivia-opt.locked{opacity:.85}
.trivia-opt.correct{background:#4c8a52;border-color:#2f5a33;color:#fff}
.trivia-opt.wrong{background:var(--red,#c8442b);border-color:#7a2515;color:#fff}
.trivia-opt.picked::after{content:" ◂ your pick";font-size:14px;opacity:.85}
.trivia-explain{margin-top:10px;font-size:18px;color:#4a4230;border-left:4px solid var(--gold,#c9a24a);padding-left:10px}
.trivia-note{margin-top:8px;font-size:14px;color:#8a7c5c}
.trivia-tally{margin-top:12px}
.trivia-tbar-row{display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:14px}
.trivia-tbar-track{flex:1;height:10px;background:#d8c9a0;border:2px solid var(--ink,#2a2418);position:relative}
.trivia-tbar-fill{height:100%;background:var(--gold2,#8e6f2a)}
.trivia-tbar-row.correctopt .trivia-tbar-fill{background:#4c8a52}
.trivia-tbar-n{width:26px;text-align:right;flex:none}
.trivia-score{margin-top:16px;background:var(--navy,#1b2a44);border:3px solid var(--gold,#c9a24a);padding:10px 12px;box-shadow:4px 4px 0 rgba(0,0,0,.3)}
.trivia-score h5{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--gold,#c9a24a);margin-bottom:8px}
.trivia-srow{display:flex;justify-content:space-between;font-size:18px;color:#dce3f0;padding:2px 0}
.trivia-srow b{color:#fff}
.trivia-srow.me{color:var(--gold,#c9a24a)}
.trivia-srow .rk{width:24px;flex:none;color:#8ea0c4}
.trivia-myrank{margin-top:6px;padding-top:6px;border-top:2px dashed #3a4d6e;font-size:16px;color:#b9c3d6}
.trivia-prev{margin-top:14px}
.trivia-prevtoggle{width:100%;text-align:left;background:var(--paper,#e9dcbd);border:3px solid var(--ink,#2a2418);padding:8px 10px;font-family:'Press Start 2P',monospace;font-size:9px;color:var(--ink,#2a2418)}
.trivia-prevlist{margin-top:6px;display:flex;flex-direction:column;gap:5px}
.trivia-prow{display:flex;gap:8px;align-items:flex-start;background:var(--cream,#f3e8cf);border:2px solid var(--gold2,#8e6f2a);padding:6px 8px;font-size:15px}
.trivia-prow .mk{flex:none;font-family:'Press Start 2P',monospace;font-size:9px;padding:2px 4px;color:#fff}
.trivia-prow .mk.y{background:#4c8a52}
.trivia-prow .mk.n{background:var(--red,#c8442b)}
.trivia-empty{font-size:15px;color:#8a7c5c;padding:6px 2px}
@media (max-width:360px){ .trivia-qtext{font-size:19px} .trivia-opt{font-size:17px} }
</style>
<div class="trivia-wrap">
  <div class="trivia-timer" id="triviaTimer">Next question in --:--</div>
  <div class="trivia-qcard" id="triviaQCard">Loading…</div>
  <div class="trivia-score" id="triviaScore"><h5>SCOREBOARD</h5><div class="trivia-empty">Loading…</div></div>
  <div class="trivia-prev">
    <button class="trivia-prevtoggle" id="triviaPrevToggle" type="button">▸ Previous questions</button>
    <div class="trivia-prevlist" id="triviaPrevList" hidden></div>
  </div>
</div>`;
}

async function triviaLoadMyAnswers(){
  try{
    const rows = await sb("trivia_answers?select=q_id,choice,correct,ts&player_id=eq."+encodeURIComponent(me.id));
    triviaMyAnswers = {};
    for(const r of rows) triviaMyAnswers[r.q_id] = r;
  }catch(e){ console.warn("trivia: could not load my answers", e); }
}

async function triviaFetchTally(qid){
  try{
    const rows = await sb("trivia_answers?select=choice&q_id=eq."+encodeURIComponent(qid));
    const counts=[0,0,0,0]; for(const r of rows){ if(r.choice>=0 && r.choice<4) counts[r.choice]++; }
    triviaTally[qid] = { counts, total: rows.length };
  }catch(e){ console.warn("trivia: tally fetch failed", e); }
}

async function triviaFetchScores(){
  try{
    const rows = await sb("trivia_answers?select=player_id,player_name,correct");
    const byId = {};
    for(const r of rows){
      if(!byId[r.player_id]) byId[r.player_id] = {id:r.player_id, name:r.player_name, score:0};
      if(r.correct) byId[r.player_id].score++;
    }
    triviaScores = Object.values(byId).sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name));
  }catch(e){ console.warn("trivia: scores fetch failed", e); }
}

function triviaRenderScoreboard(){
  const el = triviaRoot && triviaRoot.querySelector("#triviaScore");
  if(!el) return;
  if(!triviaScores.length){ el.innerHTML = '<h5>SCOREBOARD</h5><div class="trivia-empty">No answers yet — be the first!</div>'; return; }
  const top = triviaScores.slice(0,5);
  let h = '<h5>SCOREBOARD</h5>';
  top.forEach((s,i)=>{
    h += `<div class="trivia-srow${s.id===me.id?' me':''}"><span><span class="rk">#${i+1}</span>${esc(s.name||'?')}</span><b>${s.score}</b></div>`;
  });
  const myRank = triviaScores.findIndex(s=>s.id===me.id);
  if(myRank>4){
    h += `<div class="trivia-myrank">You: #${myRank+1} · ${esc(me.name||'you')} — <b>${triviaScores[myRank].score}</b> pts</div>`;
  } else if(myRank===-1 && me.name){
    h += `<div class="trivia-myrank">You: unranked yet — answer a question to get on the board.</div>`;
  }
  el.innerHTML = h;
}

function triviaOptClass(idx, q, mine){
  if(!mine) return "trivia-opt";
  let c = "trivia-opt locked";
  if(idx===q.a) c += " correct";
  else if(idx===mine.choice) c += " wrong";
  if(idx===mine.choice) c += " picked";
  return c;
}

function triviaRenderQuestion(){
  const card = triviaRoot && triviaRoot.querySelector("#triviaQCard");
  if(!card) return;
  const idx = triviaActiveIdx;
  const q = triviaQuestion(idx);
  const mine = triviaMyAnswers[q.id];
  let h = `<div class="trivia-qtext">${esc(q.q)}</div><div class="trivia-opts">`;
  q.opts.forEach((opt,i)=>{
    h += `<button type="button" class="${triviaOptClass(i,q,mine)}" data-i="${i}" ${mine?'disabled':''}>${esc(opt)}</button>`;
  });
  h += `</div>`;
  if(mine){
    h += `<div class="trivia-explain">${mine.correct?'Correct! ':'Not quite. '}${esc(q.ex)}</div>`;
    if(mine._offline) h += `<div class="trivia-note">Answer saved locally only — couldn't reach the server, so it may not count on the scoreboard yet.</div>`;
    const t = triviaTally[q.id];
    if(t && t.total>0){
      h += `<div class="trivia-tally">`;
      q.opts.forEach((opt,i)=>{
        const n = t.counts[i]||0; const pct = t.total? Math.round(n*100/t.total):0;
        h += `<div class="trivia-tbar-row${i===q.a?' correctopt':''}"><span style="width:20px;flex:none">${i===q.a?'✓':''}</span><div class="trivia-tbar-track"><div class="trivia-tbar-fill" style="width:${pct}%"></div></div><span class="trivia-tbar-n">${n}</span></div>`;
      });
      h += `</div>`;
    }
  }
  card.innerHTML = h;
  if(!mine){
    card.querySelectorAll(".trivia-opt").forEach(b=>{
      b.onclick = ()=>triviaAnswer(q, +b.dataset.i);
    });
  }
}

async function triviaAnswer(q, choice){
  if(triviaMyAnswers[q.id]) return; // already locked
  const row = { player_id: me.id, player_name: me.name||"?", q_id: q.id, choice, correct: choice===q.a, ts: Date.now() };
  triviaMyAnswers[q.id] = row; // optimistic lock, instant feedback
  triviaRenderQuestion();
  try{
    await sb("trivia_answers?on_conflict=player_id,q_id", { method:"POST", headers:{ Prefer:"resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
    await Promise.all([ triviaFetchTally(q.id), triviaFetchScores() ]);
    triviaRenderQuestion();
    triviaRenderScoreboard();
  }catch(e){
    console.warn("trivia: save failed", e);
    row._offline = true;
    triviaRenderQuestion();
  }
}

function triviaRenderPrev(){
  const list = triviaRoot && triviaRoot.querySelector("#triviaPrevList");
  if(!list) return;
  const answered = Object.keys(triviaMyAnswers).map(qid=>({qid, ...triviaMyAnswers[qid]})).sort((a,b)=>b.ts-a.ts);
  if(!answered.length){ list.innerHTML = '<div class="trivia-empty">You haven\'t answered any questions yet.</div>'; return; }
  let h = "";
  answered.slice(0,20).forEach(a=>{
    const q = TRIVIA_Q.find(x=>x.id===a.qid);
    if(!q) return;
    h += `<div class="trivia-prow"><span class="mk ${a.correct?'y':'n'}">${a.correct?'✓':'✕'}</span><span>${esc(q.q)}</span></div>`;
  });
  list.innerHTML = h || '<div class="trivia-empty">You haven\'t answered any questions yet.</div>';
}

function triviaUpdateTimer(){
  const el = triviaRoot && triviaRoot.querySelector("#triviaTimer");
  if(el) el.textContent = "Next question in " + triviaFmtClock(triviaMsLeft());
}

async function triviaEnterQuestion(idx){
  triviaActiveIdx = idx;
  const q = triviaQuestion(idx);
  triviaRenderQuestion();
  if(triviaMyAnswers[q.id]){
    await triviaFetchTally(q.id);
    triviaRenderQuestion();
  }
}

function initTrivia(){
  triviaRoot = document.getElementById('gamePage');
  triviaActiveIdx = -1;
  triviaLoadedOnce = false;
  const toggle = triviaRoot.querySelector("#triviaPrevToggle");
  if(toggle){
    toggle.onclick = ()=>{
      triviaPrevOpen = !triviaPrevOpen;
      const list = triviaRoot.querySelector("#triviaPrevList");
      list.hidden = !triviaPrevOpen;
      toggle.textContent = (triviaPrevOpen?"▾ ":"▸ ") + "Previous questions";
      if(triviaPrevOpen) triviaRenderPrev();
    };
  }
  triviaUpdateTimer();
  (async ()=>{
    await triviaLoadMyAnswers();
    await triviaEnterQuestion(triviaIdx());
    await Promise.all([ triviaFetchTally(triviaQuestion(triviaActiveIdx).id), triviaFetchScores() ]);
    triviaRenderQuestion();
    triviaRenderScoreboard();
    if(triviaPrevOpen) triviaRenderPrev();
    triviaLastFetchTs = Date.now();
    triviaLoadedOnce = true;
  })();
}

function tickTrivia(){
  if(!triviaRoot) triviaRoot = document.getElementById('gamePage');
  triviaUpdateTimer();
  const idx = triviaIdx();
  if(idx !== triviaActiveIdx && triviaLoadedOnce){
    triviaEnterQuestion(idx);
    triviaFetchTally(TRIVIA_Q[idx].id).then(()=>triviaRenderQuestion());
    triviaFetchScores().then(()=>triviaRenderScoreboard());
    triviaLastFetchTs = Date.now();
    return;
  }
  if(triviaLoadedOnce && Date.now()-triviaLastFetchTs > 15000){
    triviaLastFetchTs = Date.now();
    const q = triviaQuestion(triviaActiveIdx);
    Promise.all([ triviaFetchTally(q.id), triviaFetchScores() ]).then(()=>{
      triviaRenderQuestion();
      triviaRenderScoreboard();
    });
  }
}

function stopTrivia(){
  triviaRoot = null;
}
