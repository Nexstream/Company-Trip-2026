/* =========================================================
   PACK CHECKLIST — personal ticks, synced to your player id
   Rows live in quest_claims with kind='pack'; only your own
   rows are ever fetched, so nobody sees your packing progress
   in the UI. Ticking is optimistic and rolls back if the write
   fails, and the list stays usable with no network at all.
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

let ckDone = new Set();      // item ids this player has ticked
let ckLoaded = false;        // have we ever successfully read from the server
let ckOffline = false;       // last write or read failed
let ckBusy = new Set();      // ids with a write in flight

/* ---------- server ---------- */
async function ckFetch(){
  try{
    const rows = await sb("quest_claims?select=target&kind=eq.pack&player_id=eq."+encodeURIComponent(me.id));
    ckDone = new Set((rows||[]).map(r=>r.target));
    ckLoaded = true; ckOffline = false;
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
.ck-note{font-size:17px;color:#8a7c5e;margin:-8px 0 12px}
.ck-err{color:var(--red)}
</style>`; }
function ckPackHtml(){
  return ckStyles()
    + `<h4>Pack list</h4>` + ckProgress()
    + `<div class="ck-note">${ckOffline ? '<span class="ck-err">Offline — ticks are showing locally but not saved yet.</span>'
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
  const wasOn = ckDone.has(id);
  ckBusy.add(id);
  if(wasOn) ckDone.delete(id); else ckDone.add(id);   // optimistic
  ckRepaint();
  try{ await ckWrite(id, !wasOn); ckOffline=false; }
  catch(e){
    console.warn('checklist write', e);
    if(wasOn) ckDone.add(id); else ckDone.delete(id); // roll back
    ckOffline=true;
  }
  ckBusy.delete(id); ckRepaint();
}
async function ckResetAll(){
  const ids=[...ckDone]; if(!ids.length) return;
  ckDone=new Set(); ckRepaint();
  try{
    await sb("quest_claims?kind=eq.pack&player_id=eq."+encodeURIComponent(me.id),
             {method:"DELETE", headers:{Prefer:"return=minimal"}});
    ckOffline=false;
  }catch(e){ console.warn('checklist reset', e); ckDone=new Set(ids); ckOffline=true; }
  ckRepaint();
}
function ckWire(){
  const page=document.getElementById('page'); if(!page) return;
  page.querySelectorAll('li.ck-row').forEach(li=>{
    li.onclick=()=>ckToggle(li.dataset.ck);
    li.onkeydown=e=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); ckToggle(li.dataset.ck); } };
  });
  const r=page.querySelector('.ck-reset'); if(r) r.onclick=ckResetAll;
}
/* Called by renderBook after the Pack tab is painted. First open pulls the
   saved ticks, then repaints once so the boxes come up already filled in. */
function ckOnPackShown(){
  ckWire();
  if(!ckLoaded) ckFetch().then(()=>ckRepaint());
}