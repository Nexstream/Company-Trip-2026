/* =========================================================
   LINK DEVICE
   Puts the same identity on a second device: the device that has
   the progress shows its `me.id` as a short code, the device that
   wants it types the code in and adopts that id as its own.
   One shared scope — every name here is prefixed link* / LINK_.
   ========================================================= */
const LINK_RE = /^p[0-9a-z]{1,8}$/;   // 'p' + up to 8 base36 chars — slice(2,10) can return fewer than 4 when the fraction has trailing zeros, so no lower-bound floor here; confirm() dialogs below are what guard against a typo, not this regex

let linkOn = false;
const LINK_MSG_DEFAULT = 'This device will become that traveller. Its own progress stays behind.';

/* Trim, drop whitespace, lowercase. No leading-'p' prepend: the code is always
   displayed and copied with its 'p', and guessing at a missing one is ambiguous
   whenever the random part itself starts with 'p' (~1 in 36 codes) — a p-less
   code just fails LINK_RE below with a clear rejection instead of silently
   querying the wrong id. */
function linkNormalize(s){
  return String(s||'').trim().replace(/\s+/g,'').toLowerCase();
}

/* The core: adopt `code` as this device's identity and reload as that
   traveller. opts.fromTitle marks the title-screen entry point (no player
   row of our own to clean up there — a device on the title screen never
   wrote one). opts.setMsg(text) surfaces feedback to whichever field called us. */
async function linkAdopt(code, opts){
  opts = opts||{};
  const fromTitle = !!opts.fromTitle;
  const setMsg = typeof opts.setMsg==='function' ? opts.setMsg : ()=>{};

  const norm = linkNormalize(code);
  if(!LINK_RE.test(norm)){ setMsg("That doesn't look like a device code."); return; }
  if(norm===me.id){ setMsg("That's this device's own code."); return; }

  let rows;
  try{ rows = await db.getPlayer(norm); }
  catch(e){ console.warn('link getPlayer',e); setMsg("Couldn't reach the server — check your connection and try again."); return; }

  let payload;
  if(rows && rows[0]){
    const r = rows[0];
    payload = { id:norm, name:r.name, av:r.av||0, emoji:r.emoji||null };
    // In-game, adopting a row is destructive (see below) — confirm before touching anything.
    // Not on the title screen: a device there has nothing to lose and reloads straight into the name.
    if(!fromTitle && !confirm('Link this device as "'+payload.name+'"? This device\'s own progress stays behind.')) return;
  } else if(fromTitle){
    // A device that joined but never got a GPS fix never wrote a players row.
    // Fall back to whatever the title screen already has typed in.
    const n = (document.getElementById('name')?.value||'').trim();
    if(!n){ setMsg("Type your name first, then link."); return; }
    payload = { id:norm, name:n, av:selectedAv||0, emoji:null };
  } else {
    // No row for this code, and we're in-game: could be a typo (of our own code or
    // someone else's) about to strand this device's progress under an id nobody can get back.
    if(!confirm('No traveller found for that code. Link anyway? This device\'s progress will be left behind, and the code may simply be mistyped.')){
      setMsg("Nothing linked. Check the code on your other device — it's under 🔗 there.");
      return;
    }
    payload = { id:norm, name:me.name, av:me.av, emoji:me.emoji||null };
  }

  // Clear the watch FIRST, and flag leaving: a GPS fix or the 30s heartbeat
  // landing after we've moved on would re-upsert the old row via pushMe() and
  // undo the cleanup below.
  if(watchId!=null) navigator.geolocation.clearWatch(watchId);
  leaving=true;

  // Write the new identity before deleting the old row: setItem is best-effort
  // (storage can be blocked/full), and if it lost the race against the delete
  // below, this device would reload into the title screen with a brand-new id,
  // stranding the progress under the old one instead.
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); }catch(e){}

  // In-game only — a title-screen device never wrote a player row, so there's
  // nothing orphaned to delete. Failure here must not block the link.
  if(!fromTitle){ try{ await db.deletePlayer(me.id); }catch(e){} }

  location.reload();   // auto-rejoin (bottom of index.html) brings this device up as that traveller
}

async function linkTitleSubmit(){
  const codeEl = document.getElementById('linkTitleCode');
  const msgEl  = document.getElementById('linkTitleMsg');
  if(msgEl) msgEl.textContent = '';
  await linkAdopt(codeEl?codeEl.value:'', { fromTitle:true, setMsg:t=>{ if(msgEl) msgEl.textContent=t; } });
}

async function linkFormSubmit(){
  const codeEl = document.getElementById('linkInput');
  const msgEl  = document.getElementById('linkMsg');
  await linkAdopt(codeEl?codeEl.value:'', { fromTitle:false, setMsg:t=>{ if(msgEl) msgEl.textContent=t; } });
}

async function linkCopyCode(){
  const msgEl = document.getElementById('linkMsg');
  try{
    await navigator.clipboard.writeText(me.id);
    if(msgEl){ msgEl.textContent='Copied!'; setTimeout(()=>{ if(msgEl.textContent==='Copied!') msgEl.textContent=LINK_MSG_DEFAULT; },2000); }
  }catch(e){
    // Clipboard API blocked/unavailable — select the code so a long-press/manual copy still works.
    const codeEl = document.getElementById('linkMyCode');
    try{
      const range=document.createRange(); range.selectNodeContents(codeEl);
      const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    }catch(e2){}
    if(msgEl) msgEl.textContent='Could not copy automatically — long-press the code above to copy it.';
  }
}

function linkSetOpen(v){
  const p=document.getElementById('linkPanel'); if(!p) return;
  linkOn=!!v;
  p.classList.toggle('on',linkOn);
  document.getElementById('linkBtn')?.classList.toggle('on',linkOn);
  if(linkOn){
    if(typeof closeEmojiPanel==='function') closeEmojiPanel();
    if(typeof closeOutfitPanel==='function') closeOutfitPanel();
    if(typeof chatSetOpen==='function') chatSetOpen(false);
    const codeEl=document.getElementById('linkMyCode'); if(codeEl) codeEl.textContent=me.id;
    const msgEl=document.getElementById('linkMsg'); if(msgEl) msgEl.textContent=LINK_MSG_DEFAULT;   // clear any stale error/copy text from a prior visit
  }
}
function linkToggle(){ linkSetOpen(!linkOn); }
function closeLinkPanel(){ linkSetOpen(false); }

function linkWire(){
  document.getElementById('linkBtn')?.addEventListener('click',linkToggle);
  document.getElementById('linkClose')?.addEventListener('click',()=>closeLinkPanel());
  document.getElementById('linkCopy')?.addEventListener('click',()=>linkCopyCode());
  const form=document.getElementById('linkForm');
  if(form) form.onsubmit=e=>{ e.preventDefault(); linkFormSubmit(); };
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeLinkPanel(); });

  // title screen
  const toggle=document.getElementById('linkTitleToggle'), field=document.getElementById('linkTitleField');
  if(toggle && field){
    toggle.onclick=()=>{
      const show=field.style.display==='none';
      field.style.display=show?'block':'none';
      if(show) document.getElementById('linkTitleCode')?.focus();
    };
  }
  document.getElementById('linkTitleGo')?.addEventListener('click',()=>linkTitleSubmit());
  document.getElementById('linkTitleCode')?.addEventListener('keydown',e=>{ if(e.key==='Enter') linkTitleSubmit(); });
}

linkWire();   // the markup always exists at load; no need to wait for startGame()
