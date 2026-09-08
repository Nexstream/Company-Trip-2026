/* =========================================================
   GAME MODULE — SCAVENGER HUNT
   ========================================================= */
/* =========================================================
   SCAVENGER HUNT MODULE — globals must start with hunt/Hunt/HUNT_
   ========================================================= */

const HUNT_CHALLENGES = [
  {id:"famichiki", em:"🍗", t:"Eat a Famichiki", d:"FamilyMart's legendary fried chicken. Listen for the door chime on the way in.", pts:10},
  {id:"konbini3", em:"🏪", t:"Hit all three konbini", d:"7-Eleven, FamilyMart and Lawson — visit all three on the same day.", pts:10},
  {id:"deerbow", em:"🦌", t:"Get a deer to bow back", d:"Nara Park. Bow to a deer holding a senbei cracker and wait for the bow back.", pts:20},
  {id:"glico", em:"🏃", t:"Find the Glico running man", d:"Photograph the neon runner sign over the Dotonbori canal.", pts:10},
  {id:"vending", em:"🥫", t:"Baffling vending machine drink", d:"Buy something from a vending machine you cannot identify before opening it.", pts:10},
  {id:"arimawaters", em:"♨️", t:"Gold water, silver water", d:"Try both Kin-no-yu (iron gold) and Gin-no-yu (carbonated silver) at Arima Onsen.", pts:20},
  {id:"ropeway", em:"🚡", t:"Ropeway, eyes open", d:"Ride the Rokko Arima Ropeway without closing your eyes once.", pts:10},
  {id:"toriisquad", em:"⛩️", t:"Whole squad under a torii", d:"Get the entire party inside one photo at Fushimi Inari.", pts:20},
  {id:"toriiclimb", em:"🧗", t:"Into the torii tunnel", d:"Walk at least as far as the Yotsutsuji viewpoint at Fushimi Inari.", pts:20},
  {id:"takoyakihot", em:"🔥", t:"Takoyaki that hurts", d:"Eat takoyaki straight off the griddle, hot enough to regret it.", pts:10},
  {id:"pockyrare", em:"🍫", t:"A Pocky flavour that doesn't exist at home", d:"Find and try one you can't buy back home.", pts:10},
  {id:"orderjapanese", em:"🗣️", t:"Order entirely in Japanese", d:"Complete a full food or drink order without switching to English.", pts:20},
  {id:"geiko", em:"👘", t:"Spot a geiko in Gion", d:"Walk Hanamikoji at dusk from Yasaka Shrine and spot one for real.", pts:30},
  {id:"donki", em:"🌀", t:"Survive Donki at 11pm", d:"Emerge from Don Quijote with at least one purchase you can't explain.", pts:20},
  {id:"mochipound", em:"🍡", t:"Watch the mochi pounding show", d:"Catch the lightning-fast mochi-pounding performance at Nakatanidou, Nara.", pts:20},
  {id:"buddha", em:"🙏", t:"Great Buddha awe selfie", d:"A photo that captures how big the Daibutsu at Tōdai-ji actually is.", pts:10},
  {id:"ferriswheel", em:"🎡", t:"Ride the Ebisu Tower wheel", d:"Take a lap on the Ebisu Tower Ferris wheel in Shinsaibashi.", pts:10},
  {id:"kushikatsu", em:"🍢", t:"No double-dipping", d:"Eat kushikatsu and successfully avoid the cardinal sin of the communal sauce.", pts:10},
  {id:"tsutenslide", em:"🛝", t:"Ride the tower slide", d:"Take the slide down Tsutenkaku Tower.", pts:20},
  {id:"gachapon", em:"🎰", t:"Win the gacha", d:"Pull a capsule toy from any gachapon machine.", pts:10},
  {id:"onsentowel", em:"🧖", t:"Master onsen towel etiquette", d:"Get through Arima Onsen without your small towel touching the water.", pts:20},
  {id:"shrineritual", em:"🔔", t:"The full shrine ritual", d:"Bow, rinse, toss a coin, bow twice, clap twice, pray, bow once — start to finish, no skipped steps.", pts:10},
  {id:"lionroar", em:"🦁", t:"Roar at the giant lion", d:"Face off with the giant lion-head stage at Namba Yasaka Shrine.", pts:10},
  {id:"escalatorswitch", em:"🚶", t:"Switch sides like a local", d:"Notice and correctly follow the escalator-standing side in both Kyoto and Osaka.", pts:20},
];
const HUNT_BY_ID = Object.fromEntries(HUNT_CHALLENGES.map(c=>[c.id,c]));
const HUNT_TOTAL_POSSIBLE = HUNT_CHALLENGES.reduce((s,c)=>s+c.pts,0);

let huntClaims = [];          // raw rows {player_id,player_name,av,target,points,ts}
let huntFilterMode = "all";   // all | unclaimed | claimed
let huntPending = new Set();  // target ids with an in-flight write
let huntErr = {};             // target id -> inline error string (transient)
let huntLoadFailed = false;

function huntTotalsByPlayer(){
  const map = {};
  for(const c of huntClaims){
    if(!map[c.player_id]) map[c.player_id] = {id:c.player_id, name:c.player_name, av:c.av||0, pts:0, cnt:0};
    map[c.player_id].pts += (c.points||0);
    map[c.player_id].cnt += 1;
  }
  return Object.values(map).sort((a,b)=>b.pts-a.pts || a.name.localeCompare(b.name));
}
function huntClaimsFor(target){ return huntClaims.filter(c=>c.target===target); }
function huntMineFor(target){ return huntClaims.find(c=>c.target===target && c.player_id===me.id); }
function huntMyRank(totals){
  const myPts = (totals.find(p=>p.id===me.id)||{pts:0}).pts;
  let rank = 1;
  for(const p of totals){ if(p.id!==me.id && p.pts>myPts) rank++; }
  return rank;
}

function renderHunt(){
  return `
  <style>
    .hunt-wrap{padding:10px 10px 20px;max-width:640px;margin:0 auto}
    .hunt-head{background:var(--navy);border:3px solid var(--gold);box-shadow:4px 4px 0 rgba(0,0,0,.4);
      color:var(--cream);padding:10px 12px;margin-bottom:10px;display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center}
    .hunt-head .hunt-stat{font-family:'Press Start 2P',monospace;font-size:9px;line-height:1.6}
    .hunt-head .hunt-stat b{color:var(--gold);font-size:13px;display:block;font-family:'VT323','Courier New',monospace}
    .hunt-lb{background:var(--cream);border:3px solid var(--ink);box-shadow:4px 4px 0 rgba(0,0,0,.3);padding:8px 10px;margin-bottom:10px;color:var(--ink)}
    .hunt-lb h4{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--red);margin-bottom:8px}
    .hunt-lb-row{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:19px;border-top:1px solid #cbb98d}
    .hunt-lb-row:first-child{border-top:none}
    .hunt-lb-row .hunt-rk{font-family:'Press Start 2P',monospace;font-size:9px;width:20px;color:var(--gold2)}
    .hunt-lb-row img{width:24px;height:24px;image-rendering:pixelated;flex:none}
    .hunt-lb-row .hunt-nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .hunt-lb-row .hunt-pt{font-weight:bold;color:var(--gold2)}
    .hunt-lb-empty{font-size:17px;color:#6b5f45}
    .hunt-filters{display:flex;gap:6px;margin-bottom:10px}
    .hunt-filters button{flex:1;font-family:'Press Start 2P',monospace;font-size:8px;padding:10px 4px;background:var(--cream);border:3px solid var(--ink);color:var(--ink);min-height:44px}
    .hunt-filters button.on{background:var(--navy);color:var(--gold)}
    .hunt-card{background:var(--cream);border:3px solid var(--ink);box-shadow:4px 4px 0 rgba(0,0,0,.3);padding:10px 12px;margin-bottom:10px;color:var(--ink);position:relative}
    .hunt-card.hunt-done{border-color:var(--gold);box-shadow:4px 4px 0 var(--gold2);background:#f5ecd2}
    .hunt-row-top{display:flex;gap:10px;align-items:flex-start}
    .hunt-em{font-size:26px;line-height:1;flex:none;width:32px;text-align:center}
    .hunt-info{flex:1;min-width:0}
    .hunt-title{font-family:'Press Start 2P',monospace;font-size:10px;color:var(--ink);margin-bottom:4px;display:flex;align-items:center;gap:6px}
    .hunt-title .hunt-check{color:var(--gold2)}
    .hunt-desc{font-size:19px;color:#4a4030;line-height:1.25}
    .hunt-meta{display:flex;justify-content:space-between;align-items:center;margin-top:8px;gap:8px;flex-wrap:wrap}
    .hunt-pts{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--gold2)}
    .hunt-claimbtn{font-family:'Press Start 2P',monospace;font-size:9px;padding:12px 14px;min-height:44px;border:3px solid var(--gold2);background:var(--red);color:#fff;box-shadow:3px 3px 0 rgba(0,0,0,.35)}
    .hunt-claimbtn.hunt-on{background:var(--navy2);color:var(--gold)}
    .hunt-claimbtn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 rgba(0,0,0,.35)}
    .hunt-who{display:flex;align-items:center;gap:4px;margin-top:6px}
    .hunt-who img{width:18px;height:18px;image-rendering:pixelated;border:1px solid var(--ink);border-radius:0;margin-right:-6px}
    .hunt-who .hunt-whocount{font-size:15px;color:#6b5f45;margin-left:10px}
    .hunt-err{font-size:15px;color:var(--red);margin-top:6px}
    .hunt-netnote{font-size:15px;color:#6b5f45;text-align:center;margin:6px 0 12px}
  </style>
  <div class="hunt-wrap">
    <div class="hunt-head">
      <div class="hunt-stat">CLAIMED<b id="huntMyCount">0 / ${HUNT_CHALLENGES.length}</b></div>
      <div class="hunt-stat">POINTS<b id="huntMyPoints">0</b></div>
      <div class="hunt-stat">RANK<b id="huntMyRank">—</b></div>
    </div>
    <div class="hunt-lb" id="huntLbBox">
      <h4>PARTY LEADERBOARD</h4>
      <div id="huntLbList"><div class="hunt-lb-empty">Loading…</div></div>
    </div>
    ${huntLoadFailed ? '<div class="hunt-netnote">Can\'t reach the server right now — showing what we have.</div>' : ''}
    <div class="hunt-filters" id="huntFilters">
      <button data-m="all" class="on">ALL</button>
      <button data-m="unclaimed">UNCLAIMED</button>
      <button data-m="claimed">CLAIMED</button>
    </div>
    <div id="huntList"></div>
  </div>`;
}

function huntAvatarImg(av){
  try{ return spriteURL(CHAR, charPal(av||0)); }catch(e){ return ""; }
}

function huntRenderLeaderboard(){
  const box = document.getElementById('huntLbList');
  const rankBox = document.getElementById('huntMyRank');
  const cntBox = document.getElementById('huntMyCount');
  const ptsBox = document.getElementById('huntMyPoints');
  if(!box) return;
  const totals = huntTotalsByPlayer();
  const top = totals.slice(0,8);
  if(!top.length){
    box.innerHTML = '<div class="hunt-lb-empty">No claims yet — be the first!</div>';
  } else {
    box.innerHTML = top.map((p,i)=>`
      <div class="hunt-lb-row">
        <span class="hunt-rk">#${i+1}</span>
        <img src="${huntAvatarImg(p.av)}" alt="">
        <span class="hunt-nm">${esc(p.name)}${p.id===me.id?' (you)':''}</span>
        <span class="hunt-pt">${p.pts}pt</span>
      </div>`).join('');
  }
  const mine = huntClaims.filter(c=>c.player_id===me.id);
  const myPts = mine.reduce((s,c)=>s+(c.points||0),0);
  if(cntBox) cntBox.textContent = `${mine.length} / ${HUNT_CHALLENGES.length}`;
  if(ptsBox) ptsBox.textContent = `${myPts} / ${HUNT_TOTAL_POSSIBLE}`;
  if(rankBox) rankBox.textContent = totals.length ? '#'+huntMyRank(totals) : '—';
}

function huntWhoHtml(target){
  const list = huntClaimsFor(target);
  if(!list.length) return '<span class="hunt-whocount">nobody yet</span>';
  const shown = list.slice(0,3);
  const faces = shown.map(c=>`<img src="${huntAvatarImg(c.av)}" title="${esc(c.player_name)}" alt="">`).join('');
  const extra = list.length>3 ? `<span class="hunt-whocount">+${list.length-3} more</span>` : `<span class="hunt-whocount">${esc(list.map(c=>c.player_name).join(', '))}</span>`;
  return faces+extra;
}

function huntRenderRow(ch){
  const mine = huntMineFor(ch.id);
  const busy = huntPending.has(ch.id);
  const err = huntErr[ch.id];
  return `
  <div class="hunt-card ${mine?'hunt-done':''}" data-target="${ch.id}">
    <div class="hunt-row-top">
      <div class="hunt-em">${ch.em}</div>
      <div class="hunt-info">
        <div class="hunt-title">${mine?'<span class="hunt-check">✔</span>':''}${esc(ch.t)}</div>
        <div class="hunt-desc">${esc(ch.d)}</div>
        <div class="hunt-meta">
          <span class="hunt-pts">${ch.pts} PTS</span>
          <button class="hunt-claimbtn hunt-claim ${mine?'hunt-on':''}" data-target="${ch.id}" ${busy?'disabled':''}>${busy?'…':(mine?'UNCLAIM':'CLAIM')}</button>
        </div>
        <div class="hunt-who">${huntWhoHtml(ch.id)}</div>
        ${err?`<div class="hunt-err">${esc(err)}</div>`:''}
      </div>
    </div>
  </div>`;
}

function huntFilteredChallenges(){
  return HUNT_CHALLENGES.filter(ch=>{
    if(huntFilterMode==='claimed') return !!huntMineFor(ch.id);
    if(huntFilterMode==='unclaimed') return !huntMineFor(ch.id);
    return true;
  });
}

function huntRenderList(){
  const el = document.getElementById('huntList');
  if(!el) return;
  const list = huntFilteredChallenges();
  el.innerHTML = list.length ? list.map(huntRenderRow).join('') : '<div class="hunt-lb-empty" style="padding:10px 0">Nothing here.</div>';
}

function huntRenderAll(){ huntRenderLeaderboard(); huntRenderList(); }

async function huntFetchClaims(){
  try{
    const rows = await sb("quest_claims?select=*&kind=eq.hunt");
    huntClaims = rows || [];
    huntLoadFailed = false;
  }catch(e){
    console.warn(e);
    huntLoadFailed = true;
  }
}

async function huntClaim(ch){
  if(huntPending.has(ch.id)) return;
  huntPending.add(ch.id);
  huntClaims.push({player_id:me.id, player_name:me.name, av:me.av, kind:"hunt", target:ch.id, points:ch.pts, ts:Date.now()});
  huntErr[ch.id] = null;
  huntRenderAll(); huntWireList();
  try{
    await sb("quest_claims?on_conflict=player_id,kind,target", {
      method:"POST",
      headers:{Prefer:"resolution=merge-duplicates,return=minimal"},
      body: JSON.stringify({player_id:me.id, player_name:me.name, av:me.av, kind:"hunt", target:ch.id, points:ch.pts, ts:Date.now()})
    });
  }catch(e){
    console.warn(e);
    huntClaims = huntClaims.filter(c=>!(c.player_id===me.id && c.target===ch.id));
    huntErr[ch.id] = "Couldn't save — try again";
  }
  huntPending.delete(ch.id);
  huntRenderAll(); huntWireList();
}

async function huntUnclaim(ch){
  if(huntPending.has(ch.id)) return;
  huntPending.add(ch.id);
  const backup = huntClaims;
  huntClaims = huntClaims.filter(c=>!(c.player_id===me.id && c.target===ch.id));
  huntErr[ch.id] = null;
  huntRenderAll(); huntWireList();
  try{
    await sb("quest_claims?player_id=eq."+encodeURIComponent(me.id)+"&kind=eq.hunt&target=eq."+encodeURIComponent(ch.id), {
      method:"DELETE", headers:{Prefer:"return=minimal"}
    });
  }catch(e){
    console.warn(e);
    huntClaims = backup;
    huntErr[ch.id] = "Couldn't undo — try again";
  }
  huntPending.delete(ch.id);
  huntRenderAll(); huntWireList();
}

function huntWireList(){
  const root = document.getElementById('gamePage');
  if(!root) return;
  root.querySelectorAll('.hunt-claim').forEach(btn=>{
    btn.onclick = ()=>{
      const ch = HUNT_BY_ID[btn.dataset.target];
      if(!ch) return;
      if(huntMineFor(ch.id)) huntUnclaim(ch); else huntClaim(ch);
    };
  });
}

function initHunt(){
  const root = document.getElementById('gamePage');
  if(!root) return;
  const filters = root.querySelector('#huntFilters');
  if(filters){
    filters.querySelectorAll('button').forEach(b=>{
      b.onclick = ()=>{
        huntFilterMode = b.dataset.m;
        filters.querySelectorAll('button').forEach(x=>x.classList.toggle('on', x===b));
        huntRenderList();
        huntWireList();
      };
    });
  }
  huntRenderAll();
  huntWireList();
  huntFetchClaims().then(()=>{ huntRenderAll(); huntWireList(); });
}

function tickHunt(){
  huntFetchClaims().then(()=>{ huntRenderAll(); huntWireList(); });
}

function stopHunt(){
  huntErr = {};
}
