/* =========================================================
   GAME MODULE — SUSHI ROLL (realtime, everyone joins)
   ========================================================= */
/* =========================================================
   SUSHI TAB — Nexstream Kansai Quest
   All top-level names prefixed sushi / Sushi / SUSHI_

   One shared kitchen: everybody with the tab open is in the SAME round.

   How a round stays in sync without a server or a host
   -----------------------------------------------------
   Nothing runs until somebody presses START. A round is identified by
   `startAt`, the absolute instant (epoch ms) chosen by whoever pressed it —
   not a slice of the wall clock the way the old design worked. Every phone
   folds that one instant into a seed and feeds it to the same PRNG used for
   the ingredient calls, the difficulty ramp and the box shuffle, so once a
   phone knows `startAt` it can compute the *entire* round on its own — the
   calls, when each one lands, how the grid is laid out — with nothing else
   needing to arrive on time or in order.

   `startAt` itself does need to arrive, though, and broadcast is lossy: it is
   server-relayed and unacked, so a message can simply vanish. The fix is that
   `startAt` doesn't travel only on a one-shot "start" event — it rides on
   every periodic state ping too, the same ping that carries score and combo.
   A phone that missed the START message picks the round up from the next
   ping instead, at most SUSHI_KEEP_MS later. The "start" broadcast is purely
   a latency optimisation so everyone who *did* get it starts counting down
   immediately instead of waiting for the next ping.

   Two people can tap START at once. There is no host to arbitrate, so every
   phone applies the same rule to whatever it hears: the earliest `startAt`
   wins, and only while still counting down — once play has begun, swapping
   rounds would wipe a score that is already on the board. Every phone applying
   that rule independently is what makes them converge on one round without
   anybody being in charge.

   A round started while everyone else is still reading the previous round's
   results is a different case, not the same-moment tie above — there is no
   score on the board to protect, because our own round already ended. So a
   newer `startAt` heard during our results phase is adopted immediately
   rather than only after our own intermission runs out; otherwise everybody
   who didn't personally tap START ANOTHER would sit out most of the next
   round's play and land in it as a spectator.

   Clock skew between phones offsets a round by exactly that skew — the same
   assumption the old clock-derived design already made, just now anchored to
   one person's START tap instead of to midnight UTC.

   Realtime is used only to SHOW each other: scores, combos and who is in the
   kitchen travel over a Supabase Realtime *Broadcast* channel. Broadcast is
   server-relayed and ephemeral — no table, no RLS policy, no publication
   change, nothing to clean up afterwards. If the socket never connects the
   game still plays solo rounds; it just says so and doesn't share scores.
   ========================================================= */

// Bumped from kansai-sushi: a phone still serving a cached pre-lobby
// game-sushi.js would keep broadcasting clock-derived round state, and a
// lobby client hearing that would try to make sense of a "round" nobody
// started. The version bump keeps the two protocols from ever sharing a room.
const SUSHI_TOPIC     = "realtime:kansai-sushi-v2";
const SUSHI_PLAY_MS   = 60*1000;
const SUSHI_COUNT_MS  = 5*1000;                    // lobby countdown between START and the first call
const SUSHI_RESULT_MS = 20*1000;                   // results held on screen, then back to the lobby
const SUSHI_LATE_MS   = 3*1000;                    // adopt-and-play this far into play; later than that you spectate
const SUSHI_FUTURE_MS = 30*1000;                   // clock-skew tolerance on an incoming startAt
const SUSHI_PIECES    = 12;                        // segments drawn on the mat
const SUSHI_GONE_MS   = 12*1000;                   // drop a player off the board after this silence
const SUSHI_SEND_MS   = 400;                       // throttle: at most 2.5 msgs/sec/phone
const SUSHI_KEEP_MS   = 3*1000;                    // ...but say hello this often even when idle
const SUSHI_UI_MS     = 200;                       // local UI loop

/* ---------- the difficulty ramp ----------
   A round is not one flat speed. It climbs through five levels, each filling
   exactly 12s of the 60s of play, so the arithmetic stays exact:
   4*3000 + 5*2400 + 6*2000 + 8*1500 + 10*1200 === SUSHI_PLAY_MS.
   Two things get harder as the levels go by:
     ms      — the window you get to find the called ingredient, 3s down to 1.2s
     shuffle — from RUSH on, the nine boxes are dealt to fresh positions on
               every single call, so muscle memory stops helping and you have to
               actually read the grid. Below that the layout is still random,
               just random once per round, which leaves everyone a few seconds
               to find their feet.
   Both are derived from the seeded (seed, step) PRNG, so every phone climbs the
   same ramp and lays the grid out the same way with nothing to send. */
const SUSHI_LEVELS = [
  {ms:3000, n: 4, nm:"PREP",      shuffle:false},
  {ms:2400, n: 5, nm:"BUSY",      shuffle:false},
  {ms:2000, n: 6, nm:"RUSH",      shuffle:true },
  {ms:1500, n: 8, nm:"CRUNCH",    shuffle:true },
  {ms:1200, n:10, nm:"OVERDRIVE", shuffle:true },
];
/* Flat step table: one entry per call, carrying the offset into the round it
   starts at. Steps are no longer equal, so the live one is looked up rather
   than divided out of the clock. */
const SUSHI_STEP_TAB = (function(){
  const t = []; let at = 0;
  SUSHI_LEVELS.forEach((L, li)=>{
    for(let i = 0; i < L.n; i++){ t.push({ at, ms: L.ms, lv: li }); at += L.ms; }
  });
  if(at !== SUSHI_PLAY_MS) console.warn("sushi: levels total " + at + "ms, expected " + SUSHI_PLAY_MS);
  return t;
})();
const SUSHI_STEPS = SUSHI_STEP_TAB.length;
/* Highest score physically reachable in a round: one tap per step, 1 point each
   plus a combo bonus that grows every 5 in a row. Computed rather than guessed
   so it stays true if the levels above change — it is what remote scores get
   clamped to, which blunts the most casual kind of forgery. */
const SUSHI_MAX_SCORE = (function(){
  let t = 0;
  for(let s = 0; s < SUSHI_STEPS; s++) t += 1 + Math.min(3, Math.floor((s+1)/5));
  return t;
})();
/* Roll target per person, derived rather than typed so it tracks the levels. It
   holds the same fraction of a *perfect* round as the flat-speed version did
   (67/105 ≈ 34/53) — which keeps the arithmetic honest but deliberately not the
   difficulty: a perfect round is a harder thing now that 24 of the 33 calls have
   a 1.2–2.0s window on a grid that keeps moving, so the mat will fill less often
   than it used to. That is the ramp doing its job, but this 0.64 is the knob to
   drop (0.55 or so) if THE ROLL IS COMPLETE stops happening at all on the trip. */
const SUSHI_GOAL_PER  = Math.round(SUSHI_MAX_SCORE * 0.64);

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
  room: {},          // player_id -> {id,name,av,score,combo,sa,sp,seen}
  score: 0,
  combo: 0,
  best: 0,
  startAt: 0,        // instant the current round starts/started; 0 = lobby
  seed: 0,            // uint32 fold of startAt, fed to the PRNG
  lastEnded: 0,       // startAt of the last round we finished, so a stale adopt is rejected
  spectating: false,  // joined mid-play: watching, not scoring, until the next round
  ended: false,       // sushiEndRound has already run for this startAt
  mode: "",           // last phase mode painted, so a mode change forces a re-render
  lastResult: null,   // {board, complete} from the round that just finished, shown in the lobby
  step: -1,          // step within the round
  tapped: false,     // already scored this step?
  lastWrong: false,
  lv: -1,            // level we last painted, so a level-up can flash
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

/* ---------- round identity + deterministic ingredient sequence ---------- */
/* A round is identified by the instant it starts, which is too large to feed
   the PRNG directly. Folded to a uint32 with imul so every phone derives a
   bit-identical seed from the same startAt. */
function sushiSeed(startAt){
  const lo = startAt % 1000000, hi = Math.floor(startAt / 1000000);
  return (Math.imul(lo, 2654435761) ^ Math.imul(hi, 1597334677)) >>> 0;
}
/* Which call is live `el` ms into the round. Unequal steps cannot be divided,
   so the table is walked backwards — 33 entries, five times a second, free. */
function sushiStepAt(el){
  for(let i = SUSHI_STEPS - 1; i >= 0; i--) if(el >= SUSHI_STEP_TAB[i].at) return i;
  return 0;
}
/* Everything about "where are we" derived from SUSHI.startAt rather than the
   wall clock: 0 means nobody has started a round, so we're in the lobby. */
function sushiPhase(){
  const sa = SUSHI.startAt;
  const base = { startAt: sa, playing:false, step:-1, lv:-1, stepMs:SUSHI_LEVELS[0].ms,
                 stepLeft:0, playLeft:0, countLeft:0, resultLeft:0 };
  if(!sa) return Object.assign(base, { mode:"lobby" });
  const el = Date.now() - sa;
  if(el < 0)               return Object.assign(base, { mode:"count",  countLeft: -el });
  if(el < SUSHI_PLAY_MS){
    const i = sushiStepAt(el), st = SUSHI_STEP_TAB[i];
    return Object.assign(base, { mode:"play", playing:true, step:i, lv:st.lv, stepMs:st.ms,
                                 stepLeft: st.at + st.ms - el, playLeft: SUSHI_PLAY_MS - el });
  }
  if(el < SUSHI_PLAY_MS + SUSHI_RESULT_MS)
    return Object.assign(base, { mode:"result", resultLeft: SUSHI_PLAY_MS + SUSHI_RESULT_MS - el });
  return Object.assign(base, { mode:"over" });
}
/* mulberry32 over a cheap (seed, step, salt) hash — identical on every phone.
   `salt` splits the one seed into independent streams: 0 (the default, so every
   existing two-argument call is untouched) picks the ingredient, and the box
   shuffle draws on its own salts so changing one does not move the other.
   Math.imul is what keeps this exact for a full 32-bit seed — the plain `*`
   this replaced silently drops low bits once the seed gets large, which would
   have made consecutive rounds roll near-identical sequences. */
function sushiRand(rid, step, salt){
  let h = (Math.imul(rid|0, 2654435761) ^ Math.imul(step + 1, 1597334677) ^ Math.imul(salt||0, 2246822519)) >>> 0;
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
  // roll. 33 steps a round, so the loop is free.
  let prev = -1, i = 0;
  for(let s = 0; s <= step; s++){
    i = Math.floor(sushiRand(rid, s) * SUSHI_ING.length) % SUSHI_ING.length;
    if(i === prev) i = (i + 1) % SUSHI_ING.length;   // never call the same thing twice running
    prev = i;
  }
  return SUSHI_ING[i];
}

/* ---------- where the nine boxes sit ----------
   Also derived from (rid, step): the grid has to be identical on every phone,
   because a ramp where one player kept a settled layout and another had it
   reshuffled under them would not be the same game. `seed` is the step number
   once shuffling kicks in, and -1 for the early levels — that shared seed is
   what makes their layout hold for the whole round. */
const sushiLay = {};                                        // "rid:seed" -> ingredients
function sushiLayout(rid, step){
  const i = Math.max(0, Math.min(SUSHI_STEPS - 1, step));   // step is -1 between rounds
  const seed = SUSHI_LEVELS[SUSHI_STEP_TAB[i].lv].shuffle ? i : -1;
  const key = rid + ":" + seed;
  if(sushiLay[key]) return sushiLay[key];
  const a = SUSHI_ING.slice();
  for(let j = a.length - 1; j > 0; j--){                    // Fisher-Yates
    const k = Math.floor(sushiRand(rid, seed, 101 + j) * (j + 1)) % (j + 1);
    const t = a[j]; a[j] = a[k]; a[k] = t;
  }
  sushiLay[key] = a;
  return a;
}

/* =========================================================
   REALTIME — one Broadcast channel, built by rtChannel() in rt.js
   The hand-rolled Phoenix-over-WebSocket client used to live here; it moved
   to rt.js when Takoyaki Flip needed the same thing, so both games share one
   implementation instead of two drifting copies. The object below has the
   exact shape this file always used (status/open/broadcast/close plus the
   joined/wanted/_connect internals tickSushi() pokes), just built by a call.
   Only two message shapes travel on it, both ephemeral: "start" and "state".
   ========================================================= */
const sushiRT = rtChannel(SUSHI_TOPIC, "sushi");

/* ---------- adopting a round someone else started ----------
   Every guard here is about a message that cannot be trusted to be timely,
   ordered, or sane — broadcast is lossy and unauthenticated. */
function sushiAdopt(sa){
  sa = Math.floor(sa);
  if(!isFinite(sa) || sa <= 0) return;
  const now = Date.now();
  if(sa <= SUSHI.lastEnded) return;                          // a round we already finished
  if(sa > now + SUSHI_COUNT_MS + SUSHI_FUTURE_MS) return;    // nonsense, or a wildly skewed clock
  if(now - sa >= SUSHI_PLAY_MS + SUSHI_RESULT_MS) return;    // long over
  if(!SUSHI.startAt){ sushiEnterRound(sa); return; }
  if(sa === SUSHI.startAt) return;
  // Someone tapped START ANOTHER while we were still reading the results. Those
  // results are already history, so jump to the new round rather than sit out the
  // rest of the intermission and then have to spectate a round we were invited to.
  // Gated on our own play being over, so this can never yank a live round away.
  if(sa > SUSHI.startAt && now - SUSHI.startAt >= SUSHI_PLAY_MS){
    sushiEndRound();          // banks the best score and stamps lastEnded before we move on
    sushiEnterRound(sa);
    return;
  }
  // Two people tapped START at the same moment: the earliest start wins, which is
  // a rule every phone can apply on its own, so they all converge on one round.
  // Only while still counting down — swapping rounds once play has begun would
  // wipe a score that is already on the board. The `sa > now` term matters too:
  // without it, a straggler's ping for a round that has already started (or
  // already finished) could still read as "earlier" than the countdown we are
  // legitimately in and steal it out from under us.
  if(sa < SUSHI.startAt && sa > now && now < SUSHI.startAt) sushiEnterRound(sa);
}

function sushiOnMsg(event, p){
  if(event === "start"){
    if(p && p.sa) sushiAdopt(+p.sa);
    return;
  }
  if(event !== "state" || !p || !p.id) return;
  if(p.id === sushiMeId()) return;                       // our own echo, ignore
  const entry = {
    id: String(p.id).slice(0,64),
    name: String(p.name || "Someone").slice(0,40),
    av: +p.av || 0,
    score: Math.max(0, Math.min(SUSHI_MAX_SCORE, +p.score || 0)),
    combo: Math.max(0, Math.min(SUSHI_STEPS, +p.combo || 0)),
    sa: Math.floor(+p.sa) || 0,
    sp: !!p.sp,
    seen: Date.now(),
  };
  SUSHI.room[entry.id] = entry;
  sushiAdopt(entry.sa);
}
function sushiPush(force){
  const now = Date.now();
  if(!force && !SUSHI.dirty && now - SUSHI.sentAt < SUSHI_KEEP_MS) return;
  if(now - SUSHI.sentAt < SUSHI_SEND_MS && !force) return;
  const ok = sushiRT.broadcast("state", {
    id: sushiMeId(), name: sushiMeName(), av: sushiMeAv(),
    score: SUSHI.score, combo: SUSHI.combo,
    sa: SUSHI.startAt, sp: SUSHI.spectating ? 1 : 0,
  });
  if(ok){ SUSHI.sentAt = now; SUSHI.dirty = false; }
}

/* ---------- starting / entering / ending a round ---------- */
function sushiStart(){
  // one already counting down or in play — the button should be hidden anyway
  if(SUSHI.startAt && Date.now() - SUSHI.startAt < SUSHI_PLAY_MS) return;
  // Bank the round we are leaving before scheduling the next one. Without this,
  // lastEnded stays 0 for anyone who arrived during an intermission and never
  // played, and a straggler's ping for the finished round would win the
  // earliest-start tie-break and drag them back onto its results screen.
  sushiEndRound();
  const sa = Date.now() + SUSHI_COUNT_MS;
  sushiEnterRound(sa);
  sushiRT.broadcast("start", { sa });
  sushiPush(true);
  sushiRenderAll();
}

function sushiEnterRound(sa){
  SUSHI.startAt = sa;
  SUSHI.seed = sushiSeed(sa);
  SUSHI.score = 0; SUSHI.combo = 0; SUSHI.step = -1; SUSHI.lv = -1;
  SUSHI.tapped = false; SUSHI.lastWrong = false;
  SUSHI.board = []; SUSHI.complete = false; SUSHI.ended = false;
  // Joined after the calls had already started: watch this one out rather than
  // enter with a handicap nobody else has.
  SUSHI.spectating = (Date.now() - sa) > SUSHI_LATE_MS;
  // Zero the roster's stale scores but KEEP the roster — it is the lobby list, and
  // wiping it would show "1 in the kitchen" through the whole countdown.
  for(const id in SUSHI.room){ SUSHI.room[id].score = 0; SUSHI.room[id].combo = 0; }
  for(const k in sushiLay) delete sushiLay[k];   // last round's box positions
  SUSHI.lastSec = -1; SUSHI.dirty = true;
  sushiPush(true);
}

function sushiEndRound(){
  if(SUSHI.ended || !SUSHI.startAt) return;
  SUSHI.ended = true;
  SUSHI.board = sushiPlayers().map(p=>({...p}));   // a real snapshot: sushiPlayers hands back live roster objects
  SUSHI.lastEnded = SUSHI.startAt;
  if(!SUSHI.spectating && SUSHI.score > SUSHI.best){ SUSHI.best = SUSHI.score; sushiSetBest(SUSHI.best); }
  SUSHI.lastResult = { board: SUSHI.board, complete: SUSHI.complete };
}

function sushiToLobby(){
  SUSHI.startAt = 0; SUSHI.seed = 0; SUSHI.step = -1; SUSHI.lv = -1;
  SUSHI.score = 0; SUSHI.combo = 0;
  SUSHI.spectating = false; SUSHI.complete = false; SUSHI.board = [];
  SUSHI.lastSec = -1; SUSHI.dirty = true;
  sushiPush(true);
}

/* ---------- roster: the lobby list and the scoreboard are different lists ---------- */
function sushiSelf(){
  return { id:sushiMeId(), name:sushiMeName(), av:sushiMeAv(), score:SUSHI.score,
           combo:SUSHI.combo, sa:SUSHI.startAt, sp:SUSHI.spectating, mine:true };
}
function sushiPrune(){
  const now = Date.now();
  for(const id in SUSHI.room) if(now - SUSHI.room[id].seen > SUSHI_GONE_MS) delete SUSHI.room[id];
}
function sushiPresent(){          // the lobby: anyone with the tab open
  sushiPrune();
  const out = [];
  for(const id in SUSHI.room) out.push(SUSHI.room[id]);
  out.push(sushiSelf());
  out.sort((a,b)=> a.name.localeCompare(b.name));
  return out;
}
function sushiPlayers(){          // the scoreboard: this round's chefs, spectators excluded
  sushiPrune();
  const out = [];
  for(const id in SUSHI.room){
    const p = SUSHI.room[id];
    if(p.sa === SUSHI.startAt && !p.sp) out.push(p);
  }
  if(SUSHI.startAt && !SUSHI.spectating) out.push(sushiSelf());
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
.sushi-lvl{font-family:'Press Start 2P',monospace;font-size:8px;text-align:center;color:var(--gold2,#8e6f2a);margin:9px 0 7px;line-height:1.5}
.sushi-lvl.up{color:var(--red,#c8442b);animation:sushiUp .4s steps(2) 2}   /* 0.8s: fits inside even a 1.2s call */
@keyframes sushiUp{0%,100%{opacity:1}50%{opacity:.2}}
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
.sushi-start{display:block;width:100%;margin-top:12px;min-height:52px;font-family:'Press Start 2P',monospace;
  font-size:11px;line-height:1.6;background:var(--red,#c8442b);color:#fff;border:3px solid var(--ink,#2a2418);
  box-shadow:3px 3px 0 rgba(0,0,0,.3)}
.sushi-start:active{transform:translate(1px,1px);box-shadow:2px 2px 0 rgba(0,0,0,.3)}
.sushi-watch{font-family:'Press Start 2P',monospace;font-size:9px;text-align:center;color:var(--gold2,#8e6f2a);
  padding:18px 6px;line-height:1.7}
.sushi-help{font-size:15px;color:#8a7c5c;margin-top:10px;text-align:center}
@media (max-width:360px){ .sushi-ticket .big{font-size:52px} .sushi-btn{min-height:56px;font-size:30px} }
</style>
<div class="sushi-wrap">
  <div class="sushi-head">${typeof art==="function"?art('sushi',28):""}<h4>SUSHI ROLL</h4></div>
  <div class="sushi-conn" id="sushiConn">connecting…</div>
  <div class="sushi-card" id="sushiStage"></div>
  <div class="sushi-card" id="sushiMatCard"></div>
  <div class="sushi-board" id="sushiBoard"><h5>IN THE LOBBY</h5><div class="sushi-empty">Waiting for someone to open this tab…</div></div>
  <div class="sushi-help">Anyone can tap START ROUND — it counts down for everyone at once, then the kitchen calls out ingredients: tap the one that's called, 5 in a row starts a combo. Speed climbs every 12 seconds, and from LV 3 the boxes are dealt to new positions on every call, so read before you tap. Fill the mat together before time runs out. Open the tab mid-round and you spectate this one, then join the next.</div>
</div>`;
}

function sushiRenderConn(){
  const el = SUSHI.root && SUSHI.root.querySelector("#sushiConn");
  if(!el) return;
  const s = sushiRT.status();
  el.className = "sushi-conn " + s;
  el.textContent = s === "live" ? "● LIVE — SHARED KITCHEN"
    : s === "connecting" ? "○ connecting to the kitchen…"
    : "○ OFFLINE — SOLO ROUNDS ONLY, SCORES NOT SHARED";
}

function sushiRenderStage(){
  const stage = SUSHI.root && SUSHI.root.querySelector("#sushiStage");
  if(!stage) return;
  const ph = sushiPhase();
  // The loop can enter here with a "result" phase and the clock can tick over to
  // "over" before this line runs. There is nothing to paint for a round that is
  // finished but not yet cleared — the next loop tick drops us to the lobby.
  if(ph.mode === "over") return;

  if(ph.mode === "lobby"){
    const solo = sushiRT.status() !== "live";
    const lr = SUSHI.lastResult;
    let mvpLine = "";
    if(lr){
      const mvp = lr.board && lr.board[0];
      mvpLine = `<div class="sushi-mvp" style="margin-top:10px">Last round: ${
        mvp && mvp.score > 0 ? `MVP <b>${esc(mvp.name)}</b> — ${mvp.score} pt${mvp.score===1?"":"s"}`
                             : "the mat didn't fill."
      }</div>`;
    }
    stage.innerHTML = `
      <div class="sushi-ticket">
        <div class="lbl">LOBBY</div>
        <div class="big">🍱</div>
        <div class="nm">${solo ? "Offline — you can still run a solo round" : "Waiting for a chef to start the round"}</div>
      </div>
      ${mvpLine}
      <button type="button" class="sushi-start" id="sushiStart">${solo ? "START SOLO ROUND" : "START ROUND"}</button>
      <div class="sushi-roomline"><span>${sushiPresent().length} in the lobby</span><span>Your best ${SUSHI.best} pt${SUSHI.best===1?"":"s"}</span></div>`;
    return;
  }

  if(ph.mode === "count"){
    stage.innerHTML = `
      <div class="sushi-ticket">
        <div class="lbl">STARTING IN</div>
        <div class="big">${Math.ceil(ph.countLeft/1000)}</div>
        <div class="nm">${sushiPresent().length} chefs in the kitchen</div>
      </div>`;
    return;
  }

  if(ph.mode === "result"){
    const board = SUSHI.board.length ? SUSHI.board : sushiPlayers();
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
      <button type="button" class="sushi-start" id="sushiStart">START ANOTHER</button>
      <div class="sushi-clock">BACK TO THE LOBBY IN ${Math.ceil(ph.resultLeft/1000)}s</div>`;
    return;
  }

  // ph.mode === "play"
  const called = sushiCalled(SUSHI.seed, ph.step);
  const L = SUSHI_LEVELS[ph.lv];
  const up = SUSHI.lv !== -1 && ph.lv > SUSHI.lv;      // climbed a level just now
  const lvLine = `<div class="sushi-lvl${up?" up":""}">${up?"LEVEL UP! ":""}LV ${ph.lv+1}/${SUSHI_LEVELS.length} · ${L.nm} · ${(L.ms/1000).toFixed(1)}s A CALL${L.shuffle?" · BOXES MOVING":""}</div>`;

  if(SUSHI.spectating){
    stage.innerHTML = `
      <div class="sushi-ticket">
        <div class="lbl">ORDER UP — ADD</div>
        <div class="big">${called.e}</div>
        <div class="nm">${called.n}</div>
      </div>
      ${lvLine}
      <div class="sushi-watch">WATCHING — YOU'RE IN THE NEXT ROUND</div>
      <div class="sushi-clock">${Math.ceil(ph.playLeft/1000)}s LEFT · CALL ${ph.step+1}/${SUSHI_STEPS}</div>`;
    SUSHI.lv = ph.lv;
    return;
  }

  const lay = sushiLayout(SUSHI.seed, ph.step);
  const pct = Math.round(100 * (ph.stepLeft / ph.stepMs));
  stage.innerHTML = `
    <div class="sushi-ticket">
      <div class="lbl">ORDER UP — ADD</div>
      <div class="big">${called.e}</div>
      <div class="nm">${called.n}</div>
      <div class="sushi-bar"><i style="width:${pct}%"></i></div>
    </div>
    ${lvLine}
    <div class="sushi-grid" id="sushiGrid">
      ${lay.map((g,i)=>`<button type="button" class="sushi-btn" data-k="${g.k}" title="${esc(g.n)}">${g.e}<span style="display:none">${i+1}</span></button>`).join("")}
    </div>
    <div class="sushi-you">
      <span>You <b>${SUSHI.score}</b> pt${SUSHI.score===1?"":"s"}</span>
      <span class="cmb">${SUSHI.combo >= 5 ? "COMBO ×"+(1+Math.min(3,Math.floor(SUSHI.combo/5))) : (SUSHI.combo? SUSHI.combo+" in a row" : "&nbsp;")}</span>
    </div>
    <div class="sushi-clock">${Math.ceil(ph.playLeft/1000)}s LEFT · CALL ${ph.step+1}/${SUSHI_STEPS}</div>`;
  SUSHI.lv = ph.lv;
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
  if(ph.mode !== "play" || SUSHI.spectating) return;
  const called = sushiCalled(SUSHI.seed, ph.step);
  [...grid.children].forEach(b=>{
    b.classList.remove("hit","miss");
    b.disabled = SUSHI.tapped;
    if(SUSHI.tapped && called && b.dataset.k === called.k) b.classList.add(SUSHI.lastWrong ? "miss" : "hit");
  });
}

function sushiRenderMat(){
  const card = SUSHI.root && SUSHI.root.querySelector("#sushiMatCard");
  if(!card) return;
  const ph = sushiPhase();
  if(ph.mode === "lobby" || ph.mode === "count"){
    let mat = "";
    for(let i=0;i<SUSHI_PIECES;i++) mat += `<span>🍣</span>`;
    const room = sushiPresent();
    card.innerHTML = `
      <div class="sushi-mat">${mat}</div>
      <div class="sushi-roomline"><span>${room.length} in the lobby</span><span>The mat fills once the round starts</span></div>`;
    return;
  }
  const room = (SUSHI.board.length && ph.mode !== "play") ? SUSHI.board : sushiPlayers();
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
  const ph = sushiPhase();
  if(ph.mode === "lobby" || ph.mode === "count"){
    const room = sushiPresent();
    let h = `<h5>IN THE LOBBY (${room.length})</h5>`;
    if(room.length === 1 && sushiRT.status() !== "live"){
      h += '<div class="sushi-empty">Nobody else here yet. Colleagues appear as they open this tab.</div>';
    }
    room.slice(0,30).forEach(p=>{
      h += `<div class="sushi-row ${p.mine?"me":""}"><span class="nm">${esc(p.name)}${p.mine?" (you)":""}</span></div>`;
    });
    el.innerHTML = h;
    return;
  }
  const room = (SUSHI.board.length && ph.mode !== "play") ? SUSHI.board : sushiPlayers();
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
function sushiClick(e){
  // The stage re-renders about once a second, so a handler bound directly to
  // the button would be swapped out from under the user's thumb. One
  // delegated listener on SUSHI.root survives every re-render.
  const b = e.target.closest && e.target.closest("#sushiStart");
  if(b) sushiStart();
}

function sushiTap(k){
  const ph = sushiPhase();
  if(ph.mode !== "play" || SUSHI.spectating || SUSHI.tapped) return;
  // The stage only repaints when sushiLoop notices the step changed, so for up
  // to SUSHI_UI_MS after a boundary the grid on screen still belongs to the
  // previous call — and from RUSH on, to a layout that has since been re-dealt.
  // Scoring such a tap against the new call would mark it wrong AND burn the new
  // call through SUSHI.tapped, punishing twice for one stale frame — 200ms of a
  // 1200ms OVERDRIVE call, where it hurts most. SUSHI.step is by definition the
  // call that is painted, so anything else is stale and simply does not count;
  // the combo for the call they were too slow on is already broken by sushiLoop.
  if(ph.step !== SUSHI.step) return;
  const called = sushiCalled(SUSHI.seed, ph.step);
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

function sushiLoop(){
  if(!SUSHI.root) return;
  sushiPrune();
  const ph = sushiPhase();

  if(ph.mode === "over"){ sushiEndRound(); sushiToLobby(); sushiRenderAll(); return; }

  if(ph.mode === "play"){
    if(SUSHI.board.length) SUSHI.board = [];
    if(ph.step !== SUSHI.step){        // a new ingredient was called
      // letting a call go by without tapping breaks the combo, same as a miss
      if(SUSHI.step !== -1 && !SUSHI.tapped && SUSHI.combo){ SUSHI.combo = 0; SUSHI.dirty = true; }
      SUSHI.step = ph.step;
      SUSHI.tapped = false; SUSHI.lastWrong = false;
      sushiRenderStage();
    }
  }else if(SUSHI.step !== -1){         // play just ended
    SUSHI.step = -1;
    sushiEndRound();
  }

  if(ph.mode !== SUSHI.mode){ SUSHI.mode = ph.mode; SUSHI.lastSec = -1; sushiRenderAll(); }

  sushiPush(false);
  sushiRenderConn();

  if(ph.mode === "play"){
    if(!SUSHI.spectating){
      const bar = SUSHI.root.querySelector(".sushi-bar i");
      if(bar) bar.style.width = Math.round(100 * (ph.stepLeft / ph.stepMs)) + "%";
    }
    const clock = SUSHI.root.querySelector(".sushi-clock");
    if(clock) clock.textContent = Math.ceil(ph.playLeft/1000) + "s LEFT · CALL " + (ph.step+1) + "/" + SUSHI_STEPS;
    sushiRenderMat();
    sushiRenderBoard();
  }else{
    // lobby / countdown / results: repaint once a second, not five times a second,
    // so the card doesn't flicker
    const sec = Math.floor(Date.now()/1000);
    if(sec !== SUSHI.lastSec){
      SUSHI.lastSec = sec;
      sushiRenderStage(); sushiRenderMat(); sushiRenderBoard();
    }
  }
}

function sushiKey(e){
  if(!SUSHI.root) return;
  const n = "123456789".indexOf(e.key);
  if(n < 0) return;
  const ph = sushiPhase();
  if(ph.mode !== "play" || SUSHI.spectating) return;
  const lay = sushiLayout(SUSHI.seed, ph.step);   // 1-9 read off the grid as shown
  if(lay[n]) sushiTap(lay[n].k);
}

/* =========================================================
   MODULE CONTRACT — render / init / tick / stop
   ========================================================= */
function initSushi(){
  SUSHI.root = document.getElementById("gamePage");
  SUSHI.best = sushiGetBest();
  // A round we were already in survives a tab switch: closing the overlay is one
  // keystroke, and forfeiting a score plus being demoted to spectator for the rest
  // of a 60s round is far too harsh a price for glancing at the map. Anything
  // finished, or from a previous session, resets to the lobby as before.
  const resume = SUSHI.startAt && (Date.now() - SUSHI.startAt) < SUSHI_PLAY_MS + SUSHI_RESULT_MS;
  if(resume){
    SUSHI.seed = sushiSeed(SUSHI.startAt);
  }else{
    SUSHI.startAt = 0; SUSHI.seed = 0; SUSHI.lastEnded = 0;
    SUSHI.spectating = false; SUSHI.ended = false; SUSHI.lastResult = null;
    SUSHI.score = 0; SUSHI.combo = 0;
    SUSHI.board = []; SUSHI.complete = false;
    for(const k in sushiLay) delete sushiLay[k];
  }
  SUSHI.mode = ""; SUSHI.step = -1; SUSHI.lv = -1;
  SUSHI.room = {};
  SUSHI.sentAt = 0; SUSHI.dirty = true; SUSHI.lastSec = -1;
  sushiRT.open(sushiOnMsg);
  SUSHI.root.addEventListener("click", sushiClick);
  sushiRenderAll();
  sushiLoop();
  SUSHI.uiTimer = setInterval(sushiLoop, SUSHI_UI_MS);
  document.addEventListener("keydown", sushiKey);
  // A round not resumed lands in the lobby; one already under way but not ours
  // is adopted from the next state ping (within SUSHI_KEEP_MS) — and because it
  // is already under way, sushiEnterRound will mark that adoption a spectator.
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
  if(SUSHI.root) SUSHI.root.removeEventListener("click", sushiClick);
  sushiRT.close();
  SUSHI.root = null;
  SUSHI.room = {};
  // The round itself is deliberately NOT cleared here: closing the overlay is one
  // keystroke (Escape, the backdrop, or switching to another game tab), and a
  // round already in progress should survive a quick look at the map rather than
  // costing the player their score and a demotion to spectator on the way back in.
  // initSushi() decides whether what's left is still worth resuming.
}
