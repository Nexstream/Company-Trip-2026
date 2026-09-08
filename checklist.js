/* =========================================================
   PACK CHECKLIST — personal ticks, synced to your player id
   Rows live in quest_claims with kind='pack'; only your own
   rows are ever fetched, so nobody sees your packing progress
   in the UI.

   Ticking never blocks on the network. A tick goes into ckDone
   straight away, is mirrored to localStorage so it survives a
   reload, and is queued in ckPending until the server confirms
   it. Failed writes stay queued and are retried the next time
   the Pack tab is opened, so the list is fully usable offline —
   an earlier version rolled the tick back on failure while the
   banner claimed it had been kept locally.
   ========================================================= */
const CK_ITEMS = [
  {id:'passport',  art:'passport', t:'Passport (6+ months validity), insurance copy, flight and hotel confirmations'},
  {id:'layers',    art:'backpack', t:'Breathable layers plus a light jacket or cardigan for cool evenings and A/C coaches'},
  {id:'shoes',     art:'shoes',    t:'Well broken-in walking shoes; slip-ons are handy for temples and the onsen town'},
  {id:'umbrella',  art:'umbrella', t:'Compact umbrella or light raincoat, sunscreen, hat'},
  {id:'adapter',   art:'plug',     t:'Type A power adapter, power bank, cables'},
  {id:'cash',      art:'iccard',   t:'Small notes and coins pouch; IC card if you have one from a previous trip'},
  {id:'bottle',    art:'bottle',   t:'Reusable water bottle, personal medication, a small rubbish bag'},
  {id:'space',     art:'shopbag',  t:'Spare space in your luggage for konbini snacks and Donki hauls'},
];
const CK_NIGHT = [
  {id:'office', t:'Be at the office with luggage before 10:00 PM on 28 Sep. The chartered transport leaves on time.'},
  {id:'charge', t:'Charge everything, install your eSIM, and download offline maps for Kyoto, Kobe, Nara and Osaka.'},
];
const CK_ALL = CK_ITEMS.concat(CK_NIGHT);

const CK_CACHE_KEY = 'kansai-quest-pack';

let ckDone = new Set();      // item ids this player has ticked
let ckPending = new Map();   // id -> desired state the server has not confirmed yet
let ckLoaded = false;        // have we ever successfully read from the server
let ckOffline = false;       // a read failed, or ticks are still waiting to sync
let ckBusy = new Set();      // ids with a write in flight
let ckFlushing = false;      // a retry pass is already running

/* ---------- device cache ---------- */
/* Keyed to the player id so a cleared/rejoined identity does not inherit
   someone else's ticks from the same browser. */
function ckLoadCache(){
  try{
    const raw = JSON.parse(localStorage.getItem(CK_CACHE_KEY) || 'null');
    if(!raw || raw.id !== me.id) return;
    if(Array.isArray(raw.done))    ckDone    = new Set(raw.done);
    if(Array.isArray(raw.pending)) ckPending = new Map(raw.pending);
    ckOffline = ckPending.size > 0;
  }catch(e){ /* corrupt or unavailable storage — start from an empty list */ }
}
function ckSaveCache(){
  try{
    localStorage.setItem(CK_CACHE_KEY, JSON.stringify(
      {id:me.id, done:[...ckDone], pending:[...ckPending]}));
  }catch(e){ /* private mode / quota — ticks still work for this session */ }
}
ckLoadCache();

/* ---------- server ---------- */
async function ckFetch(){
  try{
    const rows = await sb("quest_claims?select=target&kind=eq.pack&player_id=eq."+encodeURIComponent(me.id));
    const server = new Set((rows||[]).map(r=>r.target));
    // Ticks we have not managed to push yet win over the server's older view.
    for(const [id,on] of ckPending){ if(on) server.add(id); else server.delete(id); }
    ckDone = server;
    ckLoaded = true; ckOffline = ckPending.size > 0;
    ckSaveCache();
  }catch(e){ console.warn('checklist load', e); ckOffline = true; }
}
async function ckWrite(id, on){
  if(on){
    await sb("quest_claims?on_conflict=player_id,kind,target", {method:"POST",
      headers:{Prefer:"resolution=merge-duplicates,return=minimal"},
      body: JSON.stringify({player_id:me.id, player_name:me.name, av:me.av,
                            kind:'pack', target:id, points:0, ts:Date.now()})});
  } else {
    await sb("quest_claims?kind=eq.pack&player_id=eq."+encodeURIComponent(me.id)+
             "&target=eq."+encodeURIComponent(id), {method:"DELETE", headers:{Prefer:"return=minimal"}});
  }
}
/* Retry everything still queued. Stops at the first failure so we do not
   hammer a dead connection; the rest stays queued for the next attempt. */
async function ckFlush(){
  if(ckFlushing || !ckPending.size) return;
  ckFlushing = true;
  try{
    for(const [id,on] of [...ckPending]){
      try{ await ckWrite(id,on); ckPending.delete(id); }
      catch(e){ console.warn('checklist retry', e); ckOffline = true; return; }
    }
    ckOffline = false;
  } finally {
    ckFlushing = false; ckSaveCache(); ckRepaint();
  }
}

/* ---------- markup ---------- */
function ckRow(it){
  const on = ckDone.has(it.id);
  const icon = (it.art && typeof art==='function') ? art(it.art,26) : '';
  return `<li class="ck-row${on?' ck-on':''}" data-ck="${it.id}" role="checkbox" aria-checked="${on?'true':'false'}" tabindex="0">
    <span class="ck-box">${on?'✔':''}</span>${icon}<span class="ck-txt">${esc(it.t)}</span></li>`;
}
function ckProgress(){
  const n = CK_ALL.filter(i=>ckDone.has(i.id)).length, total = CK_ALL.length;
  const pct = Math.round(n/total*100);
  return `<div class="ck-prog"><div class="ck-bar"><i style="width:${pct}%"></i></div>
    <span class="ck-count">${n} of ${total} done</span>
    ${n?`<button type="button" class="ck-reset">Reset</button>`:''}</div>`;
}
function ckStyles(){ return `<style>
.ck-prog{display:flex;align-items:center;gap:10px;margin:0 0 14px;flex-wrap:wrap}
.ck-bar{flex:1;min-width:120px;height:14px;background:#d9c9a2;border:3px solid var(--ink);position:relative}
.ck-bar i{display:block;height:100%;background:var(--red);transition:width .18s steps(6)}
.ck-count{font-family:'Press Start 2P',monospace;font-size:8px;color:var(--ink);white-space:nowrap}
.ck-reset{font-family:'Press Start 2P',monospace;font-size:7px;padding:6px 8px;background:var(--cream);color:var(--ink);border:2px solid var(--ink)}
ul.ck-list{list-style:none;margin:0 0 14px;padding:0;max-width:70ch}
li.ck-row{display:flex;align-items:flex-start;gap:9px;padding:9px 8px;margin-bottom:6px;min-height:44px;
  border:3px solid var(--gold2);background:var(--cream);cursor:pointer;user-select:none}
li.ck-row:focus{outline:none;border-color:var(--red)}
li.ck-row.ck-on{border-color:var(--gold);background:#f5ecd2}
li.ck-row.ck-on .ck-txt{text-decoration:line-through;color:#8a7c5e}
.ck-box{flex:none;width:26px;height:26px;border:3px solid var(--ink);background:#fff;
  font-family:'Press Start 2P',monospace;font-size:11px;color:var(--red);display:flex;align-items:center;justify-content:center}
li.ck-row.ck-on .ck-box{background:var(--gold)}
.ck-row img{flex:none;margin-top:1px}
.ck-txt{flex:1;min-width:0}
.ck-note{font-size:17px;color:#8a7c5e;margin:-8px 0 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ck-err{color:var(--red)}
.ck-retry{font-family:'Press Start 2P',monospace;font-size:7px;padding:6px 8px;background:var(--cream);color:var(--ink);border:2px solid var(--ink)}
</style>`; }
function ckPackHtml(){
  return ckStyles()
    + `<h4>Pack list</h4>` + ckProgress()
    + `<div class="ck-note">${ckOffline
        ? `<span class="ck-err">Saved on this phone only — no connection. ${ckPending.size ? 'Ticks will sync on their own.' : ''}</span>
           <button type="button" class="ck-retry">Retry now</button>`
        : 'Only you see these ticks. They follow your name across devices.'}</div>`
    + `<ul class="ck-list">${CK_ITEMS.map(ckRow).join('')}</ul>`
    + `<h4>Night before</h4>`
    + `<ul class="ck-list">${CK_NIGHT.map(ckRow).join('')}</ul>`;
}

/* ---------- behaviour ---------- */
function ckRepaint(){
  const page=document.getElementById('page');
  if(!page || typeof tab==='undefined' || tab!=='pack') return;
  page.innerHTML = ckPackHtml(); ckWire();
}
async function ckToggle(id){
  if(ckBusy.has(id)) return;
  const on = !ckDone.has(id);
  ckBusy.add(id);
  if(on) ckDone.add(id); else ckDone.delete(id);   // the tick lands immediately
  ckPending.set(id, on); ckSaveCache(); ckRepaint();
  try{ await ckWrite(id, on); ckPending.delete(id); ckOffline = ckPending.size > 0; }
  catch(e){
    // Keep the tick — it is cached and stays queued for the next retry.
    console.warn('checklist write', e); ckOffline = true;
  }
  ckBusy.delete(id); ckSaveCache(); ckRepaint();
}
async function ckResetAll(){
  if(!ckDone.size) return;
  const ids=[...ckDone];
  ckDone=new Set();
  ids.forEach(id=>ckPending.set(id,false));
  ckSaveCache(); ckRepaint();
  try{
    await sb("quest_claims?kind=eq.pack&player_id=eq."+encodeURIComponent(me.id),
             {method:"DELETE", headers:{Prefer:"return=minimal"}});
    // No pack rows left, so anything still queued is moot.
    ckPending=new Map(); ckOffline=false;
  }catch(e){ console.warn('checklist reset', e); ckOffline=true; }
  ckSaveCache(); ckRepaint();
}
function ckWire(){
  const page=document.getElementById('page'); if(!page) return;
  page.querySelectorAll('li.ck-row').forEach(li=>{
    li.onclick=()=>ckToggle(li.dataset.ck);
    li.onkeydown=e=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); ckToggle(li.dataset.ck); } };
  });
  const r=page.querySelector('.ck-reset'); if(r) r.onclick=ckResetAll;
  const t=page.querySelector('.ck-retry'); if(t) t.onclick=ckRetry;
}
async function ckRetry(){
  if(!ckLoaded){ await ckFetch(); ckRepaint(); }
  await ckFlush();
}
/* Called by renderBook after the Pack tab is painted. First open pulls the
   saved ticks, then repaints once so the boxes come up already filled in.
   Every open is also a chance to push ticks made while offline. */
function ckOnPackShown(){
  ckWire();
  if(!ckLoaded) ckFetch().then(()=>{ ckRepaint(); ckFlush(); });
  else ckFlush();
}
