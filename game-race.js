/* =========================================================
   GAME MODULE — LANDMARK RACE
   ========================================================= */
/* =========================================================
   LANDMARK CHECK-IN RACE — race.js
   Globals: renderRace, initRace, tickRace, stopRace
   All other top-level names prefixed race/Race/RACE_.
   ========================================================= */

const RACE_RADIUS_KM = 0.15;      // 150 m check-in range
const RACE_FETCH_MS  = 15000;     // re-fetch claims at most this often
const RACE_DEPART    = new Date("2026-09-28T22:00:00+08:00"); // office departure

let raceClaims = [];        // cached rows {player_id,player_name,av,target,points,ts}
let raceLastFetch = 0;
let raceBusy = false;
let raceOffline = false;

/* ---------- data helpers ---------- */

function raceSpotOrder(){ return Object.keys(SPOTS); }

function raceDayLabel(key){
  for(const d of DAYS) for(const e of d.ev) if(e[3]===key) return d.label;
  return "";
}

function raceMyPos(){
  // effective position: manual pin or live GPS
  if(me.lat==null) return null;
  return {lat:me.lat, lng:me.lng};
}

function raceNearestKm(){
  const p = raceMyPos(); if(!p) return null;
  let best = Infinity;
  for(const k in SPOTS){ const s=SPOTS[k]; const d=haversine(p.lat,p.lng,s.lat,s.lng); if(d<best) best=d; }
  return best;
}

function racePretrip(){
  const p = raceMyPos();
  if(!p) return true;
  const near = raceNearestKm();
  return near==null || near>100;
}

function raceDistTo(s){
  const p = raceMyPos(); if(!p) return null;
  return haversine(p.lat,p.lng,s.lat,s.lng);
}

function raceInRange(key,s){
  if(me.manual===key) return true;
  const d = raceDistTo(s);
  return d!=null && d<=RACE_RADIUS_KM;
}

/* first-arrival winner per target: lowest ts, tie -> lowest player_id */
function raceFirstArrivals(){
  const winners = {};
  for(const c of raceClaims){
    const cur = winners[c.target];
    if(!cur || c.ts<cur.ts || (c.ts===cur.ts && String(c.player_id)<String(cur.player_id))) winners[c.target]=c;
  }
  return winners;
}

function raceClaimsFor(key){
  return raceClaims.filter(c=>c.target===key).sort((a,b)=>a.ts-b.ts || String(a.player_id).localeCompare(String(b.player_id)));
}

/* per-player totals: base points already on row (10) + 15 if first-arrival winner */
function raceTotals(){
  const winners = raceFirstArrivals();
  const totals = {}; // id -> {id,name,av,spots,points}
  for(const c of raceClaims){
    if(!totals[c.player_id]) totals[c.player_id]={id:c.player_id,name:c.player_name,av:c.av||0,spots:0,points:0};
    const t = totals[c.player_id];
    t.spots += 1;
    t.points += (c.points||10);
    if(winners[c.target] && winners[c.target].player_id===c.player_id) t.points += 15;
    if(c.player_id===me.id){ t.name=me.name; t.av=me.av; }
    else if(players[c.player_id]){ t.name=players[c.player_id].name||t.name; t.av=players[c.player_id].av??t.av; }
  }
  return Object.values(totals).sort((a,b)=>b.points-a.points || b.spots-a.spots || a.name.localeCompare(b.name));
}

/* ---------- network ---------- */

async function raceFetchClaims(force){
  const now = Date.now();
  if(!force && now-raceLastFetch<RACE_FETCH_MS) return;
  raceLastFetch = now;
  try{
    const rows = await sb("quest_claims?select=player_id,player_name,av,target,points,ts&kind=eq.race");
    raceClaims = rows||[];
    raceOffline = false;
  }catch(e){ console.warn(e); raceOffline = true; }
}

async function raceCheckin(key){
  const s = SPOTS[key]; if(!s) return;
  if(!raceInRange(key,s)) return;
  const btn = document.querySelector(`.race-row[data-k="${key}"] .race-cta`);
  if(btn){ btn.disabled = true; btn.textContent = "…"; }
  const row = { player_id: me.id, player_name: me.name, av: me.av||0, kind:"race", target:key, points:10, ts: Date.now() };
  // optimistic local update
  const others = raceClaims.filter(c=>!(c.player_id===me.id && c.target===key));
  const existing = raceClaims.find(c=>c.player_id===me.id && c.target===key);
  raceClaims = existing ? raceClaims.map(c=>(c.player_id===me.id&&c.target===key)?row:c) : [...others,row];
  raceRenderBody();
  try{
    await sb("quest_claims?on_conflict=player_id,kind,target", { method:"POST", headers:{ Prefer:"resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
    raceOffline = false;
  }catch(e){ console.warn(e); raceOffline = true; }
  raceRenderBody();
}

/* ---------- UI ---------- */

function raceCrown(key){
  const w = raceFirstArrivals()[key];
  return w ? `<span class="race-crown" title="First arrival: ${esc(w.player_name)}">★</span>` : "";
}

function raceWhoRow(key){
  const list = raceClaimsFor(key);
  if(!list.length) return `<span class="race-nobody">no one yet</span>`;
  const winners = raceFirstArrivals();
  return list.map(c=>{
    const isWin = winners[key] && winners[key].player_id===c.player_id;
    return `<span class="race-who${isWin?' win':''}">${isWin?'★ ':''}${esc(c.player_name||'?')}</span>`;
  }).join(" ");
}

function raceCountdown(){
  const ms = RACE_DEPART - new Date();
  if(ms<=0) return "Departed — safe travels!";
  const d = Math.floor(ms/86400000), h=Math.floor(ms%86400000/3600000), m=Math.floor(ms%3600000/60000);
  return `${d}d ${h}h ${m}m to departure`;
}

function raceSpotRow(key, ranked){
  const s = SPOTS[key];
  const dist = raceDistTo(s);
  const inRange = raceInRange(key,s);
  const icon = ICON_URL[s.icon] || ICON_URL.temple;
  const distTxt = dist==null ? "—" : fmtKm(dist);
  const ctaHtml = ranked
    ? `<button class="race-cta" ${inRange?'':'disabled'} data-k="${key}">${inRange?'CHECK IN':distTxt}</button>`
    : `<button class="race-cta" disabled>preview</button>`;
  return `<div class="race-row" data-k="${key}">
    <img class="race-icon" src="${icon}" alt="">
    <div class="race-info">
      <div class="race-name">${raceCrown(key)}${esc(s.n)}</div>
      <div class="race-meta">${raceDayLabel(key)||'—'} · ${distTxt}${ranked?'':''}</div>
      <div class="race-whos">${raceWhoRow(key)}</div>
    </div>
    <div class="race-actions">
      ${ctaHtml}
      <button class="race-fly" data-fly="${key}" title="Show on map">MAP</button>
    </div>
  </div>`;
}

function raceListHtml(){
  const pretrip = racePretrip();
  const keys = raceSpotOrder();
  let ordered = keys;
  if(!pretrip){
    ordered = [...keys].sort((a,b)=>{
      const da=raceDistTo(SPOTS[a]), db=raceDistTo(SPOTS[b]);
      if(da==null&&db==null) return 0;
      if(da==null) return 1; if(db==null) return -1;
      return da-db;
    });
  }
  return ordered.map(k=>raceSpotRow(k, !pretrip)).join("");
}

function racePretripPanel(){
  return `<div class="race-pretrip">
    <div class="race-pt-h">STILL IN MALAYSIA</div>
    <div class="race-pt-count">${raceCountdown()}</div>
    <div class="race-pt-note">Check-ins unlock once you land in Kansai and get within 150 m of a stop (or pin yourself there). Here's a preview of every landmark on the route — tap MAP to see any of them now.</div>
  </div>`;
}

function raceYouStripHtml(){
  const totals = raceTotals();
  const mine = totals.find(t=>t.id===me.id);
  const rank = mine ? totals.findIndex(t=>t.id===me.id)+1 : "—";
  const spots = mine ? mine.spots : 0;
  const pts = mine ? mine.points : 0;
  return `<div class="race-you">
    <div class="race-you-cell"><b>${spots}</b><span>of 20 visited</span></div>
    <div class="race-you-cell"><b>${pts}</b><span>points</span></div>
    <div class="race-you-cell"><b>#${rank}</b><span>rank</span></div>
  </div>`;
}

function raceBoardHtml(){
  const totals = raceTotals();
  if(!totals.length) return `<div class="race-empty">No check-ins yet — be the first!</div>`;
  return totals.map((t,i)=>`<div class="race-brow${t.id===me.id?' me':''}">
    <span class="race-rank">${i+1}</span>
    <span class="race-bname">${esc(t.name||'?')}</span>
    <span class="race-bspots">${t.spots} spot${t.spots===1?'':'s'}</span>
    <span class="race-bpts">${t.points} pt</span>
  </div>`).join("");
}

function raceRenderBody(){
  const root = document.getElementById('gamePage'); if(!root) return;
  const you = root.querySelector('#raceYou');
  const board = root.querySelector('#raceBoard');
  const pre = root.querySelector('#racePretrip');
  const list = root.querySelector('#raceList');
  if(you) you.innerHTML = raceYouStripHtml();
  if(board) board.innerHTML = raceBoardHtml();
  const pretrip = racePretrip();
  if(pre) pre.innerHTML = pretrip ? racePretripPanel() : "";
  if(list) list.innerHTML = raceListHtml();
  if(root.querySelector('#raceOffline')) root.querySelector('#raceOffline').hidden = !raceOffline;
  raceWireRows();
}

function raceWireRows(){
  const root = document.getElementById('gamePage'); if(!root) return;
  root.querySelectorAll('.race-cta[data-k]').forEach(b=>{
    b.onclick = ()=>{ if(!b.disabled) raceCheckin(b.dataset.k); };
  });
  root.querySelectorAll('[data-fly]').forEach(b=>{
    b.onclick = ()=>{
      const s = SPOTS[b.dataset.fly]; if(!s) return;
      if(typeof closeGames==='function') closeGames();
      setFollow(false);
      map.flyTo([s.lat,s.lng],17);
    };
  });
}

/* ---------- contract ---------- */

function renderRace(){
  return `
  <style>
    .race-wrap{background:var(--paper); color:var(--ink); font-family:'VT323','Courier New',monospace; font-size:19px; padding:12px; min-height:100%}
    .race-wrap h3{font-family:'Press Start 2P',monospace; font-size:11px; color:var(--red); margin:14px 0 8px}
    .race-wrap h3:first-child{margin-top:0}
    .race-you{display:flex; gap:8px; margin-bottom:6px}
    .race-you-cell{flex:1; background:var(--cream); border:3px solid var(--ink); box-shadow:3px 3px 0 rgba(0,0,0,.3); text-align:center; padding:8px 4px}
    .race-you-cell b{display:block; font-family:'Press Start 2P',monospace; font-size:15px; color:var(--red)}
    .race-you-cell span{font-size:14px; color:#6b5f45}
    .race-board{background:var(--cream); border:3px solid var(--ink); box-shadow:3px 3px 0 rgba(0,0,0,.3); margin-bottom:4px; max-height:180px; overflow-y:auto}
    .race-brow{display:flex; align-items:center; gap:8px; padding:6px 8px; border-bottom:2px solid #d8c79c}
    .race-brow:last-child{border-bottom:none}
    .race-brow.me{background:#f4e6c2}
    .race-rank{font-family:'Press Start 2P',monospace; font-size:10px; color:var(--gold2); width:20px}
    .race-bname{flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
    .race-bspots{font-size:14px; color:#6b5f45}
    .race-bpts{font-family:'Press Start 2P',monospace; font-size:10px; color:var(--red); min-width:52px; text-align:right}
    .race-empty{padding:10px; color:#6b5f45; text-align:center}
    .race-pretrip{background:var(--navy); color:var(--cream); border:3px solid var(--gold); box-shadow:4px 4px 0 rgba(0,0,0,.35); padding:12px 14px; margin-bottom:12px}
    .race-pt-h{font-family:'Press Start 2P',monospace; font-size:11px; color:var(--gold); margin-bottom:8px}
    .race-pt-count{font-family:'Press Start 2P',monospace; font-size:15px; color:#fff; margin-bottom:8px}
    .race-pt-note{font-size:17px; color:#cdd6e6; max-width:60ch}
    .race-list{display:flex; flex-direction:column; gap:8px}
    .race-row{display:flex; align-items:center; gap:8px; background:var(--cream); border:3px solid var(--ink); box-shadow:3px 3px 0 rgba(0,0,0,.3); padding:8px}
    .race-icon{width:28px; height:28px; image-rendering:pixelated; flex:none}
    .race-info{flex:1; min-width:0}
    .race-name{font-size:19px; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
    .race-crown{color:var(--gold2); margin-right:2px}
    .race-meta{font-size:14px; color:#6b5f45}
    .race-whos{font-size:13px; color:#8a7a52; min-height:16px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
    .race-who.win{color:var(--red); font-weight:bold}
    .race-nobody{color:#a89a72; font-style:italic}
    .race-actions{display:flex; flex-direction:column; gap:4px; align-items:stretch; flex:none}
    .race-cta{font-family:'Press Start 2P',monospace; font-size:9px; padding:10px 8px; min-height:44px; min-width:78px; background:var(--red); color:#fff; border:3px solid var(--gold2); box-shadow:2px 2px 0 rgba(0,0,0,.3)}
    .race-cta:disabled{background:#c9bd9d; color:#7a7050; border-color:#a89a72}
    .race-fly{font-family:'Press Start 2P',monospace; font-size:8px; padding:6px 8px; min-height:28px; background:var(--navy); color:var(--gold); border:2px solid var(--gold)}
    .race-offline{background:#fff3d6; border:3px solid var(--gold2); padding:6px 10px; font-size:15px; margin-bottom:10px}
    @media (max-width:360px){ .race-name{font-size:17px} .race-cta{min-width:64px; font-size:8px} }
  </style>
  <div class="race-wrap">
    <div id="raceOffline" class="race-offline" hidden>Offline — showing last known standings. Check-ins will sync once you're back online.</div>
    <h3>YOU</h3>
    <div id="raceYou"></div>
    <h3>LEADERBOARD</h3>
    <div id="raceBoard" class="race-board"></div>
    <div id="racePretrip"></div>
    <h3>LANDMARKS</h3>
    <div id="raceList" class="race-list"></div>
  </div>`;
}

function initRace(){
  raceFetchClaims(true).then(raceRenderBody);
  raceRenderBody();
}

function tickRace(){
  raceFetchClaims(false).then(raceRenderBody);
  raceRenderBody();
}

function stopRace(){ /* no timers of our own to clear */ }
