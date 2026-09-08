/* =========================================================
   PARTY CHAT
   A group chat that pops a bubble whenever anyone speaks:
     - a speech balloon above the speaker's marker on the map
     - a toast in #chatPops, which is fixed and above the games /
       handbook overlays, so a message is never missed
   Storage: chat_messages (see supabase-chat.sql). Polled like reactions.
   One shared scope — every name here is prefixed chat* / CHAT_.
   ========================================================= */
const CHAT_MAX     = 240;      // matches the chat_messages body length check
const CHAT_KEEP    = 60;       // messages kept in the panel
const CHAT_POLL_MS = 3000;
const CHAT_POP_MS  = 8000;     // bubble lifetime; the CSS fade ends just before this
const CHAT_BACKLOG = 10*60*1000;   // how much history to show on join

let chatMsgs    = [];
let chatLastTs  = Date.now() - CHAT_BACKLOG;
let chatSeen    = new Set();
let chatSaid    = {};          // player_id -> live map balloon
let chatOn      = false;
let chatUnread  = 0;
let chatTimer   = null;
let chatBooted  = false;

function chatStart(){
  if(chatBooted) return; chatBooted=true;
  chatWire();
  chatRender();
  chatPull();
  chatTimer=setInterval(chatPull,CHAT_POLL_MS);
}

function chatWire(){
  const btn=document.getElementById('chatBtn');
  if(btn) btn.onclick=()=>chatToggle();
  const x=document.getElementById('chatClose');
  if(x) x.onclick=()=>chatSetOpen(false);
  const form=document.getElementById('chatForm');
  if(form) form.onsubmit=e=>{
    e.preventDefault();
    const i=document.getElementById('chatInput');
    const t=i.value; i.value='';
    chatSend(t); i.focus();
  };
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') chatSetOpen(false); });
  // The toast stack hugs the tray on the map and the screen edge when an
  // overlay is up; watch both overlays rather than every open/close call site.
  const flag=()=>document.body.classList.toggle('ovopen',
    ['games','book'].some(id=>document.getElementById(id)?.classList.contains('on')));
  ['games','book'].forEach(id=>{
    const el=document.getElementById(id); if(!el||!window.MutationObserver) return;
    new MutationObserver(flag).observe(el,{attributes:true,attributeFilter:['class']});
  });
  flag();
}

function chatToggle(){ chatSetOpen(!chatOn); }
function chatSetOpen(v){
  const p=document.getElementById('chatPanel'); if(!p) return;
  chatOn=!!v;
  p.classList.toggle('on',chatOn);
  document.getElementById('chatBtn')?.classList.toggle('on',chatOn);
  if(chatOn){
    if(typeof closeEmojiPanel==='function') closeEmojiPanel();
    if(typeof closeOutfitPanel==='function') closeOutfitPanel();
    chatUnread=0; chatBadge(); chatScroll();
    setTimeout(()=>document.getElementById('chatInput')?.focus(),0);
  }
}

function chatBadge(){
  const b=document.getElementById('chatBadge'); if(!b) return;
  b.textContent=chatUnread>9?'9+':String(chatUnread);
  b.classList.toggle('on',chatUnread>0);
}

async function chatPull(){
  let rows;
  try{ rows=await db.listChat(chatLastTs); }catch(e){ console.warn('chat pull',e); return; }
  if(!rows||!rows.length) return;
  let dirty=false;
  for(const r of rows){
    if(r.ts>chatLastTs) chatLastTs=r.ts;
    if(chatSeen.has(r.id)) continue;
    chatSeen.add(r.id);
    dirty=true;
    if(r.player_id===me.id){ chatSettleMine(r); continue; }
    chatMsgs.push(r);
    chatPop(r); chatSay(r);
    if(!chatOn){ chatUnread++; }
  }
  if(chatSeen.size>400) chatSeen=new Set([...chatSeen].slice(-200));
  if(dirty){ chatTrim(); chatRender(); chatBadge(); }
}

/* Our own message comes back from the server — fold it into the optimistic row
   instead of showing it twice. */
function chatSettleMine(r){
  const m=chatMsgs.find(x=>x.pending&&x.body===r.body)||chatMsgs.find(x=>String(x.id).startsWith('tmp')&&x.body===r.body);
  if(m){ m.id=r.id; m.ts=r.ts; m.pending=false; m.failed=false; }
  else chatMsgs.push(r);
}

async function chatSend(text){
  const body=String(text||'').trim().replace(/\s+/g,' ').slice(0,CHAT_MAX);
  if(!body) return;
  if(!me.name){ return; }
  const m={ id:'tmp'+Date.now()+Math.random().toString(36).slice(2), player_id:me.id, player_name:me.name,
            av:me.av||0, body, lat:me.lat??null, lng:me.lng??null, ts:Date.now(), pending:true };
  chatMsgs.push(m); chatTrim(); chatRender();
  await chatPost(m);
}

async function chatPost(m){
  m.pending=true; m.failed=false; chatRender();
  try{
    await db.sendChat({ player_id:m.player_id, player_name:m.player_name, av:m.av, body:m.body, lat:m.lat, lng:m.lng, ts:m.ts });
    m.pending=false;
  }catch(e){
    console.warn('chat send',e); m.pending=false; m.failed=true;
  }
  chatRender();
}

window.chatRetry=function(id){
  const m=chatMsgs.find(x=>String(x.id)===String(id));
  if(m) chatPost(m);
};

function chatTrim(){
  chatMsgs.sort((a,b)=>a.ts-b.ts);
  if(chatMsgs.length>CHAT_KEEP) chatMsgs=chatMsgs.slice(-CHAT_KEEP);
}

function chatRender(){
  const log=document.getElementById('chatLog'); if(!log) return;
  if(!chatMsgs.length){
    log.innerHTML='<div class="empty">No messages yet. Say hello to the party.</div>';
    return;
  }
  const stuck=log.scrollHeight-log.scrollTop-log.clientHeight<40;
  log.innerHTML=chatMsgs.map(m=>{
    const mine=m.player_id===me.id;
    const cls='cm'+(mine?' me':'')+(m.pending?' pending':'')+(m.failed?' failed':'');
    const who=mine?'YOU':esc((m.player_name||'?').slice(0,12));
    const retry=m.failed?`<span class="rt" onclick="chatRetry('${esc(String(m.id))}')">not sent · tap to retry</span>`:'';
    return `<div class="${cls}"><span class="who">${who} · ${chatClock(m.ts)}</span>${esc(m.body)}${retry}</div>`;
  }).join('');
  if(stuck) chatScroll();
}

function chatScroll(){ const log=document.getElementById('chatLog'); if(log) log.scrollTop=log.scrollHeight; }

function chatClock(ts){
  const d=new Date(ts);
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}

/* toast bubble — sits over the map and over the games / handbook overlays */
function chatPop(m){
  const wrap=document.getElementById('chatPops'); if(!wrap) return;
  const d=document.createElement('div');
  d.className='cpop';
  d.innerHTML=`<b>${esc((m.player_name||'?').slice(0,12))}</b>${esc(m.body)}`;
  wrap.appendChild(d);
  while(wrap.children.length>3) wrap.removeChild(wrap.firstChild);
  setTimeout(()=>d.remove(),CHAT_POP_MS);
}

/* speech balloon above the speaker's marker */
function chatSay(m){
  const p=(typeof players==='object'&&players)?players[m.player_id]:null;
  const lat=m.lat??p?.lat, lng=m.lng??p?.lng;
  if(lat==null||lng==null||typeof map==='undefined'||!map) return;
  chatClearSay(m.player_id);
  const balloon=L.marker([lat,lng],{
    icon:L.divIcon({ className:'', html:`<div class="saywrap"><div class="pmsay">${esc(m.body.slice(0,120))}</div></div>`,
                     iconSize:[220,64], iconAnchor:[110,100] }),
    interactive:false, zIndexOffset:3000
  }).addTo(map);
  chatSaid[m.player_id]={ balloon, timer:setTimeout(()=>chatClearSay(m.player_id),CHAT_POP_MS) };
}
function chatClearSay(id){
  const s=chatSaid[id]; if(!s) return;
  clearTimeout(s.timer);
  try{ map.removeLayer(s.balloon); }catch(e){}
  delete chatSaid[id];
}

/* Auto-rejoin runs before this file loads, so pick the game up if it is already on. */
if(document.getElementById('game')?.classList.contains('on')) chatStart();
