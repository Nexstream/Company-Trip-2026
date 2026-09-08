/* =========================================================
   GAME MODULE — SUSHI ROLL (realtime, everyone joins)
   ========================================================= */
/* =========================================================
   SUSHI TAB — Nexstream Kansai Quest
   All top-level names prefixed sushi / Sushi / SUSHI_

   One shared kitchen: everybody with the tab open is in the SAME round.

   How it stays in sync without a server or a host
   -----------------------------------------------
   Rounds are derived from the wall clock (same trick as Trivia), and the
   sequence of called ingredients inside a round comes from a seeded PRNG over
   (roundId, step). Every phone therefore computes an identical round on its
   own — no message needs to arrive on time for the game to be fair.

   Realtime is used only to SHOW each other: scores, combos and who is in the
   kitchen travel over a Supabase Realtime *Broadcast* channel. Broadcast is
   server-relayed and ephemeral — no table, no RLS policy, no publication
   change, nothing to clean up afterwards. If the socket never connects the
   game still plays; it just says so and scores you solo.
   ========================================================= */

const SUSHI_TOPIC     = "realtime:kansai-sushi";   // shared room, everyone joins
const SUSHI_ROUND_MS  = 90*1000;                   // 60s play + 30s results
const SUSHI_PLAY_MS   = 60*1000;
const SUSHI_STEP_MS   = 3*1000;                    // one ingredient called per 3s
const SUSHI_STEPS     = SUSHI_PLAY_MS / SUSHI_STEP_MS;
const SUSHI_GOAL_PER  = 34;                        // roll target per person (~2/3 of a perfect round)
const SUSHI_PIECES    = 12;                        // segments drawn on the mat
const SUSHI_GONE_MS   = 12*1000;                   // drop a player off the board after this silence
const SUSHI_SEND_MS   = 400;                       // throttle: at most 2.5 msgs/sec/phone
const SUSHI_KEEP_MS   = 3*1000;                    // ...but say hello this often even when idle
const SUSHI_UI_MS     = 200;                       // local UI loop
/* Highest score physically reachable in a round: one tap per step, 1 point each
   plus a combo bonus that grows every 5 in a row. Computed rather than guessed
   so it stays true if the constants above change — it is what remote scores get
   clamped to, which blunts the most casual kind of forgery. */
const SUSHI_MAX_SCORE = (function(){
  let t = 0;
  for(let s = 0; s < SUSHI_STEPS; s++) t += 1 + Math.min(3, Math.floor((s+1)/5));
  return t;
})();

const SUSHI_ING = [
  {k:"rice",  e:"🍚", n:"Rice"},
  {k:"sake",  e:"🐟", n:"Salmon"},
  {k:"ebi",   e:"🍤", n:"Ebi"},
  {k:"naruto",e:"🍥", n:"Narutomaki"},
  {k:"ika",   e:"🦑", n:"Squid"},
  {k:"avo",   e:"🥑", n:"Avocado"},
  {k:"kyuri", e:"🥒", n:"Cucumber"},
  {k:"tamago",e:"🍳", n:"Tamago"},
  {k:"shiso", e:"🌿", n:"Shiso"},
];

const SUSHI = {
  root: null,
  room: {},          // player_id -> {id,name,av,score,combo,rid,seen}
  score: 0,
  combo: 0,
  best: 0,
  rid: -1,           // round we are currently playing
  step: -1,          // step within the round
  tapped: false,     // already scored this step?
  lastWrong: false,
  board: [],         // snapshot shown during the results phase
  complete: false,   // did the room finish the roll this round?
  uiTimer: null,
  sentAt: 0,
  dirty: false,
  lastSec: -1,
};

/* ---------- identity helpers (games can be opened before joining) ---------- */
function sushiMeId(){ return (typeof me !== "undefined" && me && me.id) ? me.id : "anon"; }
function sushiMeName(){ return (typeof me !== "undefined" && me && me.name) ? me.name : "You"; }
function sushiMeAv(){ return (typeof me !== "undefined" && me && me.av != null) ? me.av : 0; }
function sushiBestKey(){ return "sushiRollBest_" + sushiMeId(); }
function sushiGetBest(){ try{ return +(localStorage.getItem(sushiBestKey())||0); }catch(e){ return 0; } }
function sushiSetBest(v){ try{ localStorage.setItem(sushiBestKey(), String(v)); }catch(e){} }

/* ---------- clock-derived round + deterministic ingredient sequence ---------- */
function sushiRoundId(){ return Math.floor(Date.now() / SUSHI_ROUND_MS); }
function sushiPhase(){
  const el = Date.now() % SUSHI_ROUND_MS;
  const playing = el < SUSHI_PLAY_MS;
  return {
    rid: sushiRoundId(),
    playing,
    step: playing ? Math.floor(el / SUSHI_STEP_MS) : -1,
    stepLeft: playing ? SUSHI_STEP_MS - (el % SUSHI_STEP_MS) : 0,
    playLeft: playing ? SUSHI_PLAY_MS - el : 0,
    nextIn: SUSHI_ROUND_MS - el,
  };
}
/* mulberry32 over a cheap (rid, step) hash — identical on every phone */
function sushiRand(rid, step){
  let h = (rid * 2654435761) ^ ((step + 1) * 1597334677);
  h = (h ^ (h >>> 15)) >>> 0;
  h = (h + 0x6D2B79F5) >>> 0;
  let t = h;
  t = ((t ^ (t >>> 15)) * (t | 1)) >>> 0;
  t ^= t + (((t ^ (t >>> 7)) * (t | 61)) >>> 0);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function sushiCalled(rid, step){
  if(step < 0) return null;
  // Walk the round from the start: the anti-repeat nudge below shifts an index,
  // so "what was called last step" has to be the *resolved* value, not the raw
  // roll. 20 steps a round, so the loop is free.
  let prev = -1, i = 0;
  for(let s = 0; s <= step; s++){
    i = Math.floor(sushiRand(rid, s) * SUSHI_ING.length) % SUSHI_ING.length;
    if(i === prev) i = (i + 1) % SUSHI_ING.length;   // never call the same thing twice running
    prev = i;
  }
  return SUSHI_ING[i];
}

/* =========================================================
   REALTIME — hand-rolled Phoenix channel over one WebSocket
   Kept dependency-free on purpose: no CDN, no build, same as the rest of the
   app. Only two message shapes travel on it, both ephemeral.
   ========================================================= */
const sushiRT = {
  ws: null,
  ref: 0,
  joined: false,
  tries: 0,
  hbTimer: null,
  reTimer: null,
  onMsg: null,
  wanted: false,

  status(){
    if(this.joined) return "live";
    if(this.ws && this.ws.readyState === 0) return "connecting";
    return this.wanted ? "offline" : "idle";
  },
  open(onMsg){
    this.onMsg = onMsg;
    this.wanted = true;
    this._connect();
  },
  _url(){
    return SUPABASE_URL.replace(/^http/, "ws")
      + "/realtime/v1/websocket?apikey=" + encodeURIComponent(SUPABASE_ANON_KEY) + "&vsn=1.0.0";
  },
  _connect(){
    if(!this.wanted) return;
    if(this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) return;
    let ws;
    try{ ws = new WebSocket(this._url()); }
    catch(e){ console.warn("sushi: websocket unavailable", e); return this._retry(); }
    this.ws = ws;
    this.joined = false;

    ws.onopen = ()=>{
      this.tries = 0;
      this._send({ topic: SUSHI_TOPIC, event: "phx_join", payload: { config: {
        broadcast: { self: false, ack: false },   // we apply our own taps locally
        presence:  { key: "" },                   // presence unused: state msgs carry it
        private:   false                          // public channel — no RLS involved
      }}});
      this.hbTimer = setInterval(()=>this._send({ topic:"phoenix", event:"heartbeat", payload:{} }), 25000);
    };
    ws.onmessage = (ev)=>{
      let m; try{ m = JSON.parse(ev.data); }catch(e){ return; }
      if(m.event === "phx_reply" && m.topic === SUSHI_TOPIC){
        if(m.payload && m.payload.status === "ok") this.joined = true;
        else console.warn("sushi: join refused", m.payload);
        return;
      }
      if(m.event === "phx_error" || m.event === "phx_close"){ this.joined = false; return; }
      if(m.event === "broadcast" && m.payload && this.onMsg){
        try{ this.onMsg(m.payload.event, m.payload.payload); }catch(e){ console.warn("sushi: bad msg", e); }
      }
    };
    ws.onclose = ()=>{ this.joined = false; this._clearHb(); this._retry(); };
    ws.onerror  = ()=>{ /* onclose follows and drives the retry */ };
  },
  _retry(){
    if(!this.wanted || this.reTimer) return;
    const wait = Math.min(16000, 1000 * Math.pow(2, Math.min(4, this.tries++)));
    this.reTimer = setTimeout(()=>{ this.reTimer = null; this._connect(); }, wait);
  },
  _clearHb(){ if(this.hbTimer){ clearInterval(this.hbTimer); this.hbTimer = null; } },
  _send(msg){
    if(!this.ws || this.ws.readyState !== 1) return false;
    msg.ref = String(++this.ref);
    try{ this.ws.send(JSON.stringify(msg)); return true; }
    catch(e){ return false; }
  },
  broadcast(event, payload){
    if(!this.joined) return false;
    return this._send({ topic: SUSHI_TOPIC, event: "broadcast",
      payload: { type:"broadcast", event, payload } });
  },
  close(){
    this.wanted = false; this.joined = false; this._clearHb();
    if(this.reTimer){ clearTimeout(this.reTimer); this.reTimer = null; }
    if(this.ws){ try{ this.ws.close(); }catch(e){} this.ws = null; }
    this.onMsg = null;
  },
};

function sushiOnMsg(event, p){
  if(event !== "state" || !p || !p.id) return;
  if(p.id === sushiMeId()) return;                       // our own echo, ignore
  SUSHI.room[p.id] = {
    id: String(p.id).slice(0,64),
    name: String(p.name || "Someone").slice(0,40),
    av: +p.av || 0,
    score: Math.max(0, Math.min(SUSHI_MAX_SCORE, +p.score || 0)),
    combo: Math.max(0, Math.min(SUSHI_STEPS, +p.combo || 0)),
    rid: +p.rid || 0,
    seen: Date.now(),
  };
}
function sushiPush(force){
  const now = Date.now();
  if(!force && !SUSHI.dirty && now - SUSHI.sentAt < SUSHI_KEEP_MS) return;
  if(now - SUSHI.sentAt < SUSHI_SEND_MS && !force) return;
  const ok = sushiRT.broadcast("state", {
    id: sushiMeId(), name: sushiMeName(), av: sushiMeAv(),
    score: SUSHI.score, combo: SUSHI.combo, rid: SUSHI.rid,
  });
  if(ok){ SUSHI.sentAt = now; SUSHI.dirty = false; }
}

/* ---------- room bookkeeping ---------- */
function sushiRoom(){
  const now = Date.now(), out = [];
  for(const id in SUSHI.room){
    const p = SUSHI.room[id];
    if(now - p.seen > SUSHI_GONE_MS){ delete SUSHI.room[id]; continue; }
    if(p.rid === SUSHI.rid) out.push(p);
  }
  out.push({ id: sushiMeId(), name: sushiMeName(), av: sushiMeAv(),
             score: SUSHI.score, combo: SUSHI.combo, rid: SUSHI.rid, mine: true });
  out.sort((a,b)=> b.score - a.score || a.name.localeCompare(b.name));
  return out;
}
function sushiGoal(n){ return SUSHI_GOAL_PER * Math.max(1, n); }

/* =========================================================
   RENDER
   ========================================================= */
function renderSushi(){
  return `
<style>
.sushi-wrap{max-width:640px;margin:0 auto;color:var(--ink,#2a2418)}
.sushi-head{display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:8px}
.sushi-head h4{font-family:'Press Start 2P',monospace;font-size:11px;color:var(--gold,#c9a24a)}
.sushi-conn{font-family:'Press Start 2P',monospace;font-size:8px;text-align:center;margin-bottom:10px}
.sushi-conn.live{color:#4c8a52}
.sushi-conn.connecting{color:var(--gold2,#8e6f2a)}
.sushi-conn.offline{color:var(--red,#c8442b)}
.sushi-card{background:var(--cream,#f3e8cf);border:3px solid var(--ink,#2a2418);box-shadow:4px 4px 0 rgba(0,0,0,.3);padding:14px;margin-bottom:12px}
.sushi-ticket{text-align:center}
.sushi-ticket .lbl{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--gold2,#8e6f2a);margin-bottom:6px}
.sushi-ticket .big{font-size:64px;line-height:1.1}
.sushi-ticket .nm{font-size:22px;margin-top:2px}
.sushi-bar{height:10px;background:#d8c9a0;border:2px solid var(--ink,#2a2418);margin-top:10px}
.sushi-bar i{display:block;height:100%;background:var(--red,#c8442b);transition:width .15s linear}
.sushi-clock{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--red,#c8442b);text-align:center;margin-top:8px}
.sushi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.sushi-btn{min-height:64px;font-size:34px;background:var(--paper,#e9dcbd);border:3px solid var(--gold2,#8e6f2a);
  color:var(--ink,#2a2418);display:flex;align-items:center;justify-content:center;line-height:1}
.sushi-btn:active{transform:translate(1px,1px)}
.sushi-btn.hit{background:#4c8a52;border-color:#2f5a33}
.sushi-btn.miss{background:var(--red,#c8442b);border-color:#7a2515}
.sushi-btn[disabled]{opacity:.5}
.sushi-you{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;font-size:19px}
.sushi-you b{font-size:24px}
.sushi-you .cmb{color:var(--red,#c8442b)}
.sushi-mat{margin-top:4px;display:grid;grid-template-columns:repeat(${SUSHI_PIECES},1fr);gap:2px;overflow:hidden}
.sushi-mat span{min-width:0;overflow:hidden;text-align:center;font-size:min(20px,4.8vw);opacity:.18;line-height:1.2}
.sushi-mat span.on{opacity:1}
.sushi-roomline{display:flex;justify-content:space-between;font-size:16px;color:#4a4230;margin-top:6px}
.sushi-done{font-family:'Press Start 2P',monospace;font-size:9px;color:#2f5a33;text-align:center;margin-top:8px}
.sushi-board{background:var(--navy,#1b2a44);border:3px solid var(--gold,#c9a24a);padding:10px 12px;box-shadow:4px 4px 0 rgba(0,0,0,.3)}
.sushi-board h5{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--gold,#c9a24a);margin-bottom:8px}
.sushi-row{display:flex;justify-content:space-between;gap:8px;font-size:18px;color:#dce3f0;padding:2px 0}
.sushi-row .rk{width:24px;flex:none;color:#8ea0c4}
.sushi-row .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sushi-row b{color:#fff;flex:none}
.sushi-row.me{color:var(--gold,#c9a24a)}
.sushi-row.me b{color:var(--gold,#c9a24a)}
.sushi-empty{font-size:15px;color:#8a7c5c;padding:6px 2px}
.sushi-board .sushi-empty{color:#8ea0c4}
.sushi-mvp{font-size:19px;color:var(--ink,#2a2418);text-align:center}
.sushi-mvp b{color:var(--red,#c8442b)}
.sushi-help{font-size:15px;color:#8a7c5c;margin-top:10px;text-align:center}
@media (max-width:360px){ .sushi-ticket .big{font-size:52px} .sushi-btn{min-height:56px;font-size:30px} }
</style>
<div class="sushi-wrap">
  <div class="sushi-head">${typeof art==="function"?art('sushi',28):""}<h4>SUSHI ROLL</h4></div>
  <div class="sushi-conn" id="sushiConn">connecting…</div>
  <div class="sushi-card" id="sushiStage"></div>
  <div class="sushi-card" id="sushiMatCard"></div>
  <div class="sushi-board" id="sushiBoard"><h5>THE KITCHEN</h5><div class="sushi-empty">Waiting for the round…</div></div>
  <div class="sushi-help">Everyone with this tab open is in the same round. Tap the ingredient that's called — 5 in a row starts a combo. Fill the mat together before time runs out.</div>
</div>`;
}

function sushiRenderConn(){
  const el = SUSHI.root && SUSHI.root.querySelector("#sushiConn");
  if(!el) return;
  const s = sushiRT.status();
  el.className = "sushi-conn " + s;
  el.textContent = s === "live" ? "● LIVE — SHARED KITCHEN"
    : s === "connecting" ? "○ connecting to the kitchen…"
    : "○ OFFLINE — PLAYING SOLO, SCORES NOT SHARED";
}

function sushiRenderStage(){
  const stage = SUSHI.root && SUSHI.root.querySelector("#sushiStage");
  if(!stage) return;
  const ph = sushiPhase();

  if(!ph.playing){
    const board = SUSHI.board.length ? SUSHI.board : sushiRoom();
    const mvp = board[0];
    const total = board.reduce((s,p)=>s+p.score, 0);
    const goal = sushiGoal(board.length);
    stage.innerHTML = `
      <div class="sushi-ticket">
        <div class="lbl">ROUND OVER</div>
        <div class="big">${SUSHI.complete ? "🍣" : "🍚"}</div>
        <div class="nm">${SUSHI.complete ? "Roll complete!" : "The mat didn't fill this time."}</div>
      </div>
      <div class="sushi-mvp" style="margin-top:10px">
        ${mvp && mvp.score>0 ? `MVP <b>${esc(mvp.name)}</b> — ${mvp.score} pt${mvp.score===1?"":"s"}` : "No pieces cut. Next round, then."}
      </div>
      <div class="sushi-roomline"><span>Room total</span><span>${total} / ${goal}</span></div>
      <div class="sushi-roomline"><span>Your best round</span><span>${SUSHI.best} pt${SUSHI.best===1?"":"s"}</span></div>
      <div class="sushi-clock">NEXT ROUND IN ${Math.ceil(ph.nextIn/1000)}s</div>`;
    return;
  }

  const called = sushiCalled(ph.rid, ph.step);
  const pct = Math.round(100 * (ph.stepLeft / SUSHI_STEP_MS));
  stage.innerHTML = `
    <div class="sushi-ticket">
      <div class="lbl">ORDER UP — ADD</div>
      <div class="big">${called.e}</div>
      <div class="nm">${called.n}</div>
      <div class="sushi-bar"><i style="width:${pct}%"></i></div>
    </div>
    <div class="sushi-grid" id="sushiGrid">
      ${SUSHI_ING.map((g,i)=>`<button type="button" class="sushi-btn" data-k="${g.k}" title="${esc(g.n)}">${g.e}<span style="display:none">${i+1}</span></button>`).join("")}
    </div>
    <div class="sushi-you">
      <span>You <b>${SUSHI.score}</b> pt${SUSHI.score===1?"":"s"}</span>
      <span class="cmb">${SUSHI.combo >= 5 ? "COMBO ×"+(1+Math.min(3,Math.floor(SUSHI.combo/5))) : (SUSHI.combo? SUSHI.combo+" in a row" : "&nbsp;")}</span>
    </div>
    <div class="sushi-clock">${Math.ceil(ph.playLeft/1000)}s LEFT · STEP ${ph.step+1}/${SUSHI_STEPS}</div>`;
  sushiWireGrid();
  sushiPaintGrid();
}

function sushiWireGrid(){
  const grid = SUSHI.root && SUSHI.root.querySelector("#sushiGrid");
  if(!grid) return;
  grid.onclick = (e)=>{
    const b = e.target.closest(".sushi-btn");
    if(b && !b.disabled) sushiTap(b.dataset.k);
  };
}
function sushiPaintGrid(){
  const grid = SUSHI.root && SUSHI.root.querySelector("#sushiGrid");
  if(!grid) return;
  const ph = sushiPhase();
  const called = sushiCalled(ph.rid, ph.step);
  [...grid.children].forEach(b=>{
    b.classList.remove("hit","miss");
    b.disabled = SUSHI.tapped;
    if(SUSHI.tapped && called && b.dataset.k === called.k) b.classList.add(SUSHI.lastWrong ? "miss" : "hit");
  });
}

function sushiRenderMat(){
  const card = SUSHI.root && SUSHI.root.querySelector("#sushiMatCard");
  if(!card) return;
  const room = SUSHI.board.length && !sushiPhase().playing ? SUSHI.board : sushiRoom();
  const total = room.reduce((s,p)=>s+p.score, 0);
  const goal = sushiGoal(room.length);
  const filled = Math.min(SUSHI_PIECES, Math.floor(SUSHI_PIECES * total / goal));
  if(filled >= SUSHI_PIECES) SUSHI.complete = true;
  let mat = "";
  for(let i=0;i<SUSHI_PIECES;i++) mat += `<span class="${i<filled?"on":""}">🍣</span>`;
  card.innerHTML = `
    <div class="sushi-mat">${mat}</div>
    <div class="sushi-roomline"><span>${room.length} in the kitchen</span><span>${total} / ${goal}</span></div>
    ${SUSHI.complete ? '<div class="sushi-done">🎉 THE ROLL IS COMPLETE 🎉</div>' : ""}`;
}

function sushiRenderBoard(){
  const el = SUSHI.root && SUSHI.root.querySelector("#sushiBoard");
  if(!el) return;
  const room = SUSHI.board.length && !sushiPhase().playing ? SUSHI.board : sushiRoom();
  let h = "<h5>THE KITCHEN</h5>";
  if(room.length === 1 && sushiRT.status() !== "live"){
    h += '<div class="sushi-empty">Nobody else here yet. Scores appear as colleagues open this tab.</div>';
  }
  room.slice(0,30).forEach((p,i)=>{
    h += `<div class="sushi-row ${p.mine?"me":""}"><span class="rk">${i+1}</span>`
      +  `<span class="nm">${esc(p.name)}${p.mine?" (you)":""}</span>`
      +  `<b>${p.score}</b></div>`;
  });
  el.innerHTML = h;
}

function sushiRenderAll(){
  sushiRenderConn();
  sushiRenderStage();
  sushiRenderMat();
  sushiRenderBoard();
}

/* =========================================================
   PLAY
   ========================================================= */
function sushiTap(k){
  const ph = sushiPhase();
  if(!ph.playing || SUSHI.tapped) return;
  const called = sushiCalled(ph.rid, ph.step);
  if(!called) return;
  SUSHI.tapped = true;
  if(k === called.k){
    SUSHI.lastWrong = false;
    SUSHI.combo++;
    SUSHI.score += 1 + Math.min(3, Math.floor(SUSHI.combo/5));
  }else{
    SUSHI.lastWrong = true;
    SUSHI.combo = 0;
  }
  SUSHI.dirty = true;
  sushiPush(true);
  sushiPaintGrid();
  sushiRenderMat();
  sushiRenderBoard();
}

function sushiEnterRound(rid){
  SUSHI.rid = rid;
  SUSHI.score = 0; SUSHI.combo = 0; SUSHI.step = -1;
  SUSHI.tapped = false; SUSHI.lastWrong = false;
  SUSHI.board = []; SUSHI.complete = false;
  SUSHI.room = {};                 // last round's scores are meaningless now
  sushiPush(true);
}
function sushiEndRound(){
  SUSHI.board = sushiRoom();       // freeze the result for the intermission
  if(SUSHI.score > SUSHI.best){ SUSHI.best = SUSHI.score; sushiSetBest(SUSHI.best); }
}

function sushiLoop(){
  if(!SUSHI.root) return;
  const ph = sushiPhase();

  if(ph.rid !== SUSHI.rid){
    if(SUSHI.rid !== -1) sushiEndRound();
    const keepBoard = SUSHI.board;
    sushiEnterRound(ph.rid);
    SUSHI.board = keepBoard;       // still shown until the new round starts playing
  }
  if(ph.playing){
    if(SUSHI.board.length) SUSHI.board = [];
    if(ph.step !== SUSHI.step){    // new ingredient called
      // letting a step go by without tapping breaks the combo, same as a miss
      if(SUSHI.step !== -1 && !SUSHI.tapped && SUSHI.combo){ SUSHI.combo = 0; SUSHI.dirty = true; }
      SUSHI.step = ph.step;
      SUSHI.tapped = false; SUSHI.lastWrong = false;
      sushiRenderStage();
    }
  }else if(SUSHI.step !== -1){     // play just ended
    SUSHI.step = -1;
    sushiEndRound();
  }

  sushiPush(false);
  sushiRenderConn();
  if(ph.playing){
    const bar = SUSHI.root.querySelector(".sushi-bar i");
    if(bar) bar.style.width = Math.round(100 * (ph.stepLeft / SUSHI_STEP_MS)) + "%";
    const clock = SUSHI.root.querySelector(".sushi-clock");
    if(clock) clock.textContent = Math.ceil(ph.playLeft/1000) + "s LEFT · STEP " + (ph.step+1) + "/" + SUSHI_STEPS;
    sushiRenderMat();
    sushiRenderBoard();
  }else{
    // intermission: repaint once a second, not five times, so it doesn't flicker
    const sec = Math.ceil(ph.nextIn/1000);
    if(sec !== SUSHI.lastSec){
      SUSHI.lastSec = sec;
      sushiRenderStage();
      sushiRenderMat();
      sushiRenderBoard();
    }
  }
}

function sushiKey(e){
  if(!SUSHI.root) return;
  const n = "123456789".indexOf(e.key);
  if(n >= 0 && SUSHI_ING[n]) sushiTap(SUSHI_ING[n].k);
}

/* =========================================================
   MODULE CONTRACT — render / init / tick / stop
   ========================================================= */
function initSushi(){
  SUSHI.root = document.getElementById("gamePage");
  SUSHI.best = sushiGetBest();
  SUSHI.rid = -1; SUSHI.step = -1;
  SUSHI.room = {}; SUSHI.board = []; SUSHI.complete = false;
  SUSHI.score = 0; SUSHI.combo = 0; SUSHI.sentAt = 0; SUSHI.dirty = true; SUSHI.lastSec = -1;
  sushiRT.open(sushiOnMsg);
  sushiRenderAll();
  sushiLoop();
  SUSHI.uiTimer = setInterval(sushiLoop, SUSHI_UI_MS);
  document.addEventListener("keydown", sushiKey);
}

function tickSushi(){
  // The shell ticks every 5s; the real loop runs at SUSHI_UI_MS. This is just a
  // safety net for a backgrounded tab whose interval was throttled, and it
  // nudges the socket if the browser dropped it while we were away.
  if(!SUSHI.root) SUSHI.root = document.getElementById("gamePage");
  if(!SUSHI.uiTimer) SUSHI.uiTimer = setInterval(sushiLoop, SUSHI_UI_MS);
  if(sushiRT.wanted && !sushiRT.joined) sushiRT._connect();
  sushiLoop();
}

function stopSushi(){
  if(SUSHI.uiTimer){ clearInterval(SUSHI.uiTimer); SUSHI.uiTimer = null; }
  document.removeEventListener("keydown", sushiKey);
  sushiRT.close();
  SUSHI.root = null;
  SUSHI.room = {};
}
