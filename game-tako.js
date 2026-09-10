/* =========================================================
   GAME MODULE — TAKOYAKI FLIP (realtime, everyone joins)
   ========================================================= */
/* =========================================================
   TAKO TAB — Nexstream Kansai Quest
   All top-level names prefixed tako / Tako / TAKO_

   One shared griddle: everybody with the tab open is at the SAME stall.

   The lobby model is Sushi Roll's, and deliberately identical
   -----------------------------------------------------------
   Nothing runs until somebody presses START. A round is identified by
   `startAt`, the instant (epoch ms) chosen by whoever pressed it, and every
   phone folds that one instant into a seed and derives the whole round from
   it — when each of the nine takoyaki is poured, how long it cooks, when it
   turns golden, when it burns. So once a phone knows `startAt` it needs
   nothing else to arrive on time or in order. `startAt` rides on every
   periodic "state" ping as well as the one-shot "start" message, so a phone
   that missed the start picks the round up from the next ping; two people
   tapping START at once resolve by earliest-`startAt`-wins; anyone opening
   the tab after play has begun spectates that round and joins the next.
   game-sushi.js explains each of those rules and why — this file repeats the
   mechanics, not the essay. If you change one of the guards in takoAdopt(),
   change sushiAdopt() the same way, or the two games will drift.

   What is different is the game itself
   ------------------------------------
   Sushi Roll calls one ingredient at a time and you find it on a grid. Here
   nine balls cook at once on a 3×3 griddle and each is on its own clock:
       pour → cooking → GOLDEN (flip it!) → burnt → poured again
   Only the GOLDEN window scores. Tap it then and the ball is flipped (+1, a
   combo bonus every 5 in a row). Tap raw batter and you poke a hole in it
   (−1, combo lost). Let a golden ball go past and it burns — no points lost,
   but the combo is. With nine clocks running at once the skill is scanning,
   not reacting: from RUSH onwards there is almost always more than one ball
   golden, and never enough thumb for all of them.

   Every ball's timeline comes from the seeded PRNG, so every phone sees the
   same griddle — the same balls turning golden at the same moment. What each
   phone does NOT share is who flipped what: flips are local, like scores.
   Two colleagues side by side see identical griddles and their own flips.

   Realtime is used only to SHOW each other — scores, combos, who is at the
   stall — over one Supabase Realtime Broadcast channel built by rtChannel()
   in rt.js. If the socket never connects the game still plays solo rounds;
   it just says so and doesn't share scores.
   ========================================================= */

const TAKO_TOPIC     = "realtime:kansai-tako-v1";
const TAKO_PLAY_MS   = 60*1000;
const TAKO_COUNT_MS  = 5*1000;                     // lobby countdown between START and the first pour
const TAKO_RESULT_MS = 20*1000;                    // results held on screen, then back to the lobby
const TAKO_LATE_MS   = 3*1000;                     // adopt-and-play this far into play; later than that you spectate
const TAKO_FUTURE_MS = 30*1000;                    // clock-skew tolerance on an incoming startAt
const TAKO_BALLS     = 9;                          // holes on the griddle, 3×3
const TAKO_BOX       = 16;                         // slots drawn in the shared takeaway box
const TAKO_GONE_MS   = 12*1000;                    // drop a player off the board after this silence
const TAKO_SEND_MS   = 400;                        // throttle: at most 2.5 msgs/sec/phone
const TAKO_KEEP_MS   = 3*1000;                     // ...but say hello this often even when idle
const TAKO_UI_MS     = 100;                        // local UI loop — golden windows get short, so twice Sushi's rate
const TAKO_MISS_MS   = 350;                        // how long a poked ball flashes red
const TAKO_STAGGER   = 2500;                       // first pour of each ball lands somewhere in this many ms

/* ---------- the heat ramp ----------
   Five levels of 12s each. A ball's cycle takes its numbers from the level in
   force at the moment it is poured, so the griddle heats up gradually rather
   than every ball jumping at once on the boundary:
     pour   — raw batter sits this long (a random draw in the range), nothing to do
     cook   — turning, still nothing to do; the ball darkens
     ready  — the GOLDEN window: this is the only time a tap scores
     burn   — smoking; a tap here does nothing, then the hole is re-poured
   Cycles shorten and the golden window shrinks from 1.6s to 0.75s. */
const TAKO_LEVELS = [
  {at:    0, nm:"WARM-UP", pour:[1800,2600], cook:[1600,2200], ready:1600, burn:1400},
  {at:12000, nm:"BUSY",    pour:[1400,2200], cook:[1400,2000], ready:1300, burn:1200},
  {at:24000, nm:"RUSH",    pour:[1000,1800], cook:[1200,1800], ready:1100, burn:1000},
  {at:36000, nm:"SIZZLE",  pour:[ 800,1500], cook:[1000,1600], ready: 900, burn: 900},
  {at:48000, nm:"INFERNO", pour:[ 600,1200], cook:[ 900,1400], ready: 750, burn: 800},
];
function takoLevelAt(t){
  let lv = 0;
  for(let i = 0; i < TAKO_LEVELS.length; i++) if(t >= TAKO_LEVELS[i].at) lv = i;
  return lv;
}
/* Expected number of golden windows in a round (all nine balls together),
   from the average cycle length of each level. Nobody can flip them all —
   from RUSH on two or three are golden at once — so the shared goal below is
   a fraction of it. 0.45 is the knob: drop it if PACKED! never happens on the
   trip, raise it if every round packs the box with time to spare. */
const TAKO_WINDOWS = (function(){
  let n = 0;
  TAKO_LEVELS.forEach((L, i)=>{
    const dur = (TAKO_LEVELS[i+1] ? TAKO_LEVELS[i+1].at : TAKO_PLAY_MS) - L.at;
    const cyc = (L.pour[0]+L.pour[1])/2 + (L.cook[0]+L.cook[1])/2 + L.ready + L.burn;
    n += dur / cyc;
  });
  return Math.round(n * TAKO_BALLS);
})();
const TAKO_GOAL_PER = Math.round(TAKO_WINDOWS * 0.45);
/* Loose ceiling on a round's score: every ball cycling at the shortest
   possible cycle, every window flipped at the top combo bonus. Nowhere near
   reachable — it is what remote scores get clamped to, so a forged 9999
   cannot top the board. */
const TAKO_MAX_SCORE = (function(){
  let minCyc = Infinity;
  TAKO_LEVELS.forEach(L=>{ minCyc = Math.min(minCyc, L.pour[0] + L.cook[0] + L.ready + L.burn); });
  return TAKO_BALLS * Math.ceil(TAKO_PLAY_MS / minCyc) * 4;
})();

const TAKO = {
  root: null,
  room: {},          // player_id -> {id,name,av,score,combo,flips,sa,sp,seen}
  score: 0,
  combo: 0,
  flips: 0,          // balls flipped this round (shown beside the score)
  best: 0,
  startAt: 0,        // instant the current round starts/started; 0 = lobby
  seed: 0,           // uint32 fold of startAt, fed to the PRNG
  lastEnded: 0,      // startAt of the last round we finished, so a stale adopt is rejected
  spectating: false, // joined mid-play: watching, not scoring, until the next round
  ended: false,      // takoEndRound has already run for this startAt
  mode: "",          // last phase mode painted, so a mode change forces a re-render
  lastResult: null,  // {board, complete} from the round that just finished, shown in the lobby
  playing: false,    // griddle DOM is built for the current round
  lv: -1,            // level last painted, so a level-up can flash
  flipped: {},       // "ball:cycle" -> true once we flipped it
  burned: {},        // "ball:cycle" -> true once its burn broke (or spared) our combo
  missAt: [],        // per ball: when we last poked it, for the red flash
  board: [],         // snapshot shown during the results phase
  complete: false,   // did the room pack the box this round?
  uiTimer: null,
  sentAt: 0,
  dirty: false,
  lastSec: -1,
};

/* ---------- identity helpers (games can be opened before joining) ---------- */
function takoMeId(){ return (typeof me !== "undefined" && me && me.id) ? me.id : "anon"; }
function takoMeName(){ return (typeof me !== "undefined" && me && me.name) ? me.name : "You"; }
function takoMeAv(){ return (typeof me !== "undefined" && me && me.av != null) ? me.av : 0; }
function takoBestKey(){ return "takoFlipBest_" + takoMeId(); }
function takoGetBest(){ try{ return +(localStorage.getItem(takoBestKey())||0); }catch(e){ return 0; } }
function takoSetBest(v){ try{ localStorage.setItem(takoBestKey(), String(v)); }catch(e){} }

/* ---------- round identity + deterministic griddle ---------- */
/* Same fold and same PRNG as Sushi Roll, so the reasoning there (imul keeps
   it exact for a full 32-bit seed) holds here. Copied rather than shared:
   the modules are independent globals and a game must not break because
   another game's file failed to load. */
function takoSeed(startAt){
  const lo = startAt % 1000000, hi = Math.floor(startAt / 1000000);
  return (Math.imul(lo, 2654435761) ^ Math.imul(hi, 1597334677)) >>> 0;
}
function takoRand(rid, step, salt){
  let h = (Math.imul(rid|0, 2654435761) ^ Math.imul(step + 1, 1597334677) ^ Math.imul(salt||0, 2246822519)) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  h = (h + 0x6D2B79F5) >>> 0;
  let t = h;
  t = ((t ^ (t >>> 15)) * (t | 1)) >>> 0;
  t ^= t + (((t ^ (t >>> 7)) * (t | 61)) >>> 0);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function takoRange(rid, step, salt, range){
  return range[0] + Math.floor(takoRand(rid, step, salt) * (range[1] - range[0] + 1));
}
/* Every cycle of one ball for the whole round, laid end to end from a
   staggered first pour. Computed once per (round, ball) and cached — the
   loop asks ten times a second. Each cycle carries the absolute offsets its
   phases begin at, so "what is ball 4 doing at 37.2s" is one linear scan of
   ~15 entries. */
const takoCyc = {};                                          // "rid:ball" -> cycles[]
function takoCycles(rid, i){
  const key = rid + ":" + i;
  if(takoCyc[key]) return takoCyc[key];
  const out = [];
  let at = Math.floor(takoRand(rid, i, 1) * TAKO_STAGGER), k = 0;
  while(at < TAKO_PLAY_MS){
    const lv = takoLevelAt(at), L = TAKO_LEVELS[lv];
    const step = i * 100 + k;                                // one stream per (ball, cycle)
    const pour = takoRange(rid, step, 2, L.pour);
    const cook = takoRange(rid, step, 3, L.cook);
    const c = { k, lv, at, pour, cook, ready: L.ready, burn: L.burn,
                cookAt: at + pour, readyAt: at + pour + cook };
    c.burnAt = c.readyAt + c.ready;
    c.end    = c.burnAt + c.burn;
    out.push(c);
    at = c.end; k++;
  }
  takoCyc[key] = out;
  return out;
}
/* What ball `i` is doing `el` ms into the round. `left`/`total` describe the
   current phase so the UI can draw a draining bar on a golden ball. */
function takoBallAt(rid, i, el){
  const cs = takoCycles(rid, i);
  for(let n = 0; n < cs.length; n++){
    const c = cs[n];
    if(el < c.at) return { phase:"empty", c:null };
    if(el >= c.end) continue;
    if(el < c.cookAt)  return { phase:"raw",   c, left: c.cookAt - el,  total: c.pour };
    if(el < c.readyAt) return { phase:"cook",  c, left: c.readyAt - el, total: c.cook };
    if(el < c.burnAt)  return { phase:"ready", c, left: c.burnAt - el,  total: c.ready };
    return                    { phase:"burnt", c, left: c.end - el,     total: c.burn };
  }
  return { phase:"empty", c:null };
}
function takoKey(i, c){ return i + ":" + c.k; }

/* Everything about "where are we" derived from TAKO.startAt rather than the
   wall clock: 0 means nobody has started a round, so we're in the lobby. */
function takoPhase(){
  const sa = TAKO.startAt;
  const base = { startAt: sa, playing:false, el:0, lv:-1, playLeft:0, countLeft:0, resultLeft:0 };
  if(!sa) return Object.assign(base, { mode:"lobby" });
  const el = Date.now() - sa;
  if(el < 0)               return Object.assign(base, { mode:"count",  countLeft: -el });
  if(el < TAKO_PLAY_MS)    return Object.assign(base, { mode:"play", playing:true, el, lv: takoLevelAt(el), playLeft: TAKO_PLAY_MS - el });
  if(el < TAKO_PLAY_MS + TAKO_RESULT_MS)
    return Object.assign(base, { mode:"result", el, resultLeft: TAKO_PLAY_MS + TAKO_RESULT_MS - el });
  return Object.assign(base, { mode:"over", el });
}

/* =========================================================
   REALTIME — one Broadcast channel, built by rtChannel() in rt.js
   Two message shapes travel on it, both ephemeral: "start" and "state".
   ========================================================= */
const takoRT = rtChannel(TAKO_TOPIC, "tako");

/* ---------- adopting a round someone else started ----------
   Mirrors sushiAdopt() guard for guard — see the reasoning there. */
function takoAdopt(sa){
  sa = Math.floor(sa);
  if(!isFinite(sa) || sa <= 0) return;
  const now = Date.now();
  if(sa <= TAKO.lastEnded) return;                          // a round we already finished
  if(sa > now + TAKO_COUNT_MS + TAKO_FUTURE_MS) return;     // nonsense, or a wildly skewed clock
  if(now - sa >= TAKO_PLAY_MS + TAKO_RESULT_MS) return;     // long over
  if(!TAKO.startAt){ takoEnterRound(sa); return; }
  if(sa === TAKO.startAt) return;
  // START ANOTHER heard while we are reading results: nothing to protect, jump.
  if(sa > TAKO.startAt && now - TAKO.startAt >= TAKO_PLAY_MS){
    takoEndRound();
    takoEnterRound(sa);
    return;
  }
  // Simultaneous STARTs: earliest wins, only while both are still counting down.
  if(sa < TAKO.startAt && sa > now && now < TAKO.startAt) takoEnterRound(sa);
}

function takoOnMsg(event, p){
  if(event === "start"){
    if(p && p.sa) takoAdopt(+p.sa);
    return;
  }
  if(event !== "state" || !p || !p.id) return;
  if(p.id === takoMeId()) return;                        // our own echo, ignore
  const entry = {
    id: String(p.id).slice(0,64),
    name: String(p.name || "Someone").slice(0,40),
    av: +p.av || 0,
    score: Math.max(0, Math.min(TAKO_MAX_SCORE, +p.score || 0)),
    combo: Math.max(0, Math.min(TAKO_MAX_SCORE, +p.combo || 0)),
    flips: Math.max(0, Math.min(TAKO_MAX_SCORE, +p.flips || 0)),
    sa: Math.floor(+p.sa) || 0,
    sp: !!p.sp,
    seen: Date.now(),
  };
  TAKO.room[entry.id] = entry;
  takoAdopt(entry.sa);
}
function takoPush(force){
  const now = Date.now();
  if(!force && !TAKO.dirty && now - TAKO.sentAt < TAKO_KEEP_MS) return;
  if(now - TAKO.sentAt < TAKO_SEND_MS && !force) return;
  const ok = takoRT.broadcast("state", {
    id: takoMeId(), name: takoMeName(), av: takoMeAv(),
    score: TAKO.score, combo: TAKO.combo, flips: TAKO.flips,
    sa: TAKO.startAt, sp: TAKO.spectating ? 1 : 0,
  });
  if(ok){ TAKO.sentAt = now; TAKO.dirty = false; }
}

/* ---------- starting / entering / ending a round ---------- */
function takoStart(){
  if(TAKO.startAt && Date.now() - TAKO.startAt < TAKO_PLAY_MS) return;   // one already running
  takoEndRound();                    // bank the round we are leaving first (see sushiStart)
  const sa = Date.now() + TAKO_COUNT_MS;
  takoEnterRound(sa);
  takoRT.broadcast("start", { sa });
  takoPush(true);
  takoRenderAll();
}

function takoEnterRound(sa){
  TAKO.startAt = sa;
  TAKO.seed = takoSeed(sa);
  TAKO.score = 0; TAKO.combo = 0; TAKO.flips = 0; TAKO.lv = -1;
  TAKO.flipped = {}; TAKO.burned = {}; TAKO.missAt = [];
  TAKO.board = []; TAKO.complete = false; TAKO.ended = false; TAKO.playing = false;
  TAKO.spectating = (Date.now() - sa) > TAKO_LATE_MS;      // joined after the first pours: watch this one out
  for(const id in TAKO.room){ TAKO.room[id].score = 0; TAKO.room[id].combo = 0; TAKO.room[id].flips = 0; }
  for(const k in takoCyc) delete takoCyc[k];               // last round's griddle
  TAKO.lastSec = -1; TAKO.dirty = true;
  takoPush(true);
}

function takoEndRound(){
  if(TAKO.ended || !TAKO.startAt) return;
  TAKO.ended = true;
  TAKO.board = takoPlayers().map(p=>({...p}));
  TAKO.lastEnded = TAKO.startAt;
  if(!TAKO.spectating && TAKO.score > TAKO.best){ TAKO.best = TAKO.score; takoSetBest(TAKO.best); }
  TAKO.lastResult = { board: TAKO.board, complete: TAKO.complete };
}

function takoToLobby(){
  TAKO.startAt = 0; TAKO.seed = 0; TAKO.lv = -1; TAKO.playing = false;
  TAKO.score = 0; TAKO.combo = 0; TAKO.flips = 0;
  TAKO.spectating = false; TAKO.complete = false; TAKO.board = [];
  TAKO.lastSec = -1; TAKO.dirty = true;
  takoPush(true);
}

/* ---------- roster: the lobby list and the scoreboard are different lists ---------- */
function takoSelf(){
  return { id:takoMeId(), name:takoMeName(), av:takoMeAv(), score:TAKO.score, combo:TAKO.combo,
           flips:TAKO.flips, sa:TAKO.startAt, sp:TAKO.spectating, mine:true };
}
function takoPrune(){
  const now = Date.now();
  for(const id in TAKO.room) if(now - TAKO.room[id].seen > TAKO_GONE_MS) delete TAKO.room[id];
}
function takoPresent(){           // the lobby: anyone with the tab open
  takoPrune();
  const out = [];
  for(const id in TAKO.room) out.push(TAKO.room[id]);
  out.push(takoSelf());
  out.sort((a,b)=> a.name.localeCompare(b.name));
  return out;
}
function takoPlayers(){           // the scoreboard: this round's cooks, spectators excluded
  takoPrune();
  const out = [];
  for(const id in TAKO.room){
    const p = TAKO.room[id];
    if(p.sa === TAKO.startAt && !p.sp) out.push(p);
  }
  if(TAKO.startAt && !TAKO.spectating) out.push(takoSelf());
  out.sort((a,b)=> b.score - a.score || a.name.localeCompare(b.name));
  return out;
}
function takoGoal(n){ return TAKO_GOAL_PER * Math.max(1, n); }

/* =========================================================
   RENDER
   ========================================================= */
function renderTako(){
  return `
<style>
.tako-wrap{max-width:640px;margin:0 auto;color:var(--ink,#2a2418)}
.tako-head{display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:8px}
.tako-head h4{font-family:'Press Start 2P',monospace;font-size:11px;color:var(--gold,#c9a24a)}
.tako-conn{font-family:'Press Start 2P',monospace;font-size:8px;text-align:center;margin-bottom:10px}
.tako-conn.live{color:#4c8a52}
.tako-conn.connecting{color:var(--gold2,#8e6f2a)}
.tako-conn.offline{color:var(--red,#c8442b)}
.tako-card{background:var(--cream,#f3e8cf);border:3px solid var(--ink,#2a2418);box-shadow:4px 4px 0 rgba(0,0,0,.3);padding:14px;margin-bottom:12px}
.tako-ticket{text-align:center}
.tako-ticket .lbl{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--gold2,#8e6f2a);margin-bottom:6px}
.tako-ticket .big{font-size:64px;line-height:1.1}
.tako-ticket .nm{font-size:22px;margin-top:2px}
.tako-clock{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--red,#c8442b);text-align:center;margin-top:8px}
.tako-lvl{font-family:'Press Start 2P',monospace;font-size:8px;text-align:center;color:var(--gold2,#8e6f2a);margin:0 0 9px;line-height:1.5}
.tako-lvl.up{color:var(--red,#c8442b);animation:takoUp .4s steps(2) 2}
@keyframes takoUp{0%,100%{opacity:1}50%{opacity:.2}}
/* the griddle: a dark iron plate with nine round holes */
.tako-griddle{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:12px;background:#3a3129;border:3px solid #1d1712;box-shadow:inset 0 0 0 3px #4d423a}
.tako-ball{position:relative;aspect-ratio:1;border-radius:50%;border:3px solid #1d1712;background:#24201b;
  display:flex;align-items:center;justify-content:center;color:#fff;padding:0;overflow:hidden;
  -webkit-tap-highlight-color:transparent;touch-action:manipulation}
.tako-ball:active{transform:translate(1px,1px)}
.tako-ball .face{font-size:30px;line-height:1;pointer-events:none}
.tako-ball .tag{position:absolute;left:0;right:0;bottom:6px;font-family:'Press Start 2P',monospace;font-size:7px;letter-spacing:0;text-align:center;pointer-events:none;display:none}
.tako-ball .bar{position:absolute;left:0;bottom:0;height:5px;width:0;background:#fff;opacity:.9;pointer-events:none}
.tako-ball.s-empty{background:#24201b;border-style:dashed;border-color:#4d423a}
.tako-ball.s-raw{background:#f1e2b6}
.tako-ball.s-cook{background:#d9a35c}
.tako-ball.s-ready{background:#c0661c;border-color:var(--gold,#c9a24a);box-shadow:0 0 0 3px var(--gold,#c9a24a),0 0 14px #ffd36b}
.tako-ball.s-ready .tag{display:block;color:#fff;text-shadow:1px 1px 0 #000}
.tako-ball.s-done{background:#8f4a14;border-color:#2f5a33;box-shadow:0 0 0 3px #4c8a52}
.tako-ball.s-burnt{background:#2a1c12}
.tako-ball.miss{border-color:var(--red,#c8442b);box-shadow:0 0 0 3px var(--red,#c8442b);animation:takoMiss .35s steps(2) 1}
@keyframes takoMiss{0%,100%{filter:none}50%{filter:brightness(1.6)}}
.tako-ball[disabled]{opacity:.85}
.tako-you{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;font-size:19px}
.tako-you b{font-size:24px}
.tako-you .cmb{color:var(--red,#c8442b)}
.tako-box{margin-top:4px;display:grid;grid-template-columns:repeat(${TAKO_BOX/2},1fr);gap:3px;padding:8px;background:#e9dcbd;border:3px solid #b9935b}
.tako-box span{min-width:0;overflow:hidden;text-align:center;font-size:min(22px,6vw);opacity:.15;line-height:1.2}
.tako-box span.on{opacity:1}
.tako-roomline{display:flex;justify-content:space-between;font-size:16px;color:#4a4230;margin-top:6px}
.tako-done{font-family:'Press Start 2P',monospace;font-size:9px;color:#2f5a33;text-align:center;margin-top:8px}
.tako-board{background:var(--navy,#1b2a44);border:3px solid var(--gold,#c9a24a);padding:10px 12px;box-shadow:4px 4px 0 rgba(0,0,0,.3)}
.tako-board h5{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--gold,#c9a24a);margin-bottom:8px}
.tako-row{display:flex;justify-content:space-between;gap:8px;font-size:18px;color:#dce3f0;padding:2px 0}
.tako-row .rk{width:24px;flex:none;color:#8ea0c4}
.tako-row .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tako-row .fl{flex:none;color:#8ea0c4;font-size:15px}
.tako-row b{color:#fff;flex:none;min-width:2.2em;text-align:right}
.tako-row.me{color:var(--gold,#c9a24a)}
.tako-row.me b{color:var(--gold,#c9a24a)}
.tako-empty{font-size:15px;color:#8a7c5c;padding:6px 2px}
.tako-board .tako-empty{color:#8ea0c4}
.tako-mvp{font-size:19px;color:var(--ink,#2a2418);text-align:center}
.tako-mvp b{color:var(--red,#c8442b)}
.tako-start{display:block;width:100%;margin-top:12px;min-height:52px;font-family:'Press Start 2P',monospace;
  font-size:11px;line-height:1.6;background:var(--red,#c8442b);color:#fff;border:3px solid var(--ink,#2a2418);
  box-shadow:3px 3px 0 rgba(0,0,0,.3)}
.tako-start:active{transform:translate(1px,1px);box-shadow:2px 2px 0 rgba(0,0,0,.3)}
.tako-watch{font-family:'Press Start 2P',monospace;font-size:9px;text-align:center;color:var(--gold2,#8e6f2a);
  padding:12px 6px 4px;line-height:1.7}
.tako-help{font-size:15px;color:#8a7c5c;margin-top:10px;text-align:center}
@media (max-width:360px){ .tako-ticket .big{font-size:52px} .tako-ball .face{font-size:26px} .tako-griddle{gap:8px;padding:9px} }
</style>
<div class="tako-wrap">
  <div class="tako-head">${typeof art==="function"?art('takoyaki',28):""}<h4>TAKOYAKI FLIP</h4></div>
  <div class="tako-conn" id="takoConn">connecting…</div>
  <div class="tako-card" id="takoStage"></div>
  <div class="tako-card" id="takoBoxCard"></div>
  <div class="tako-board" id="takoBoard"><h5>AT THE STALL</h5><div class="tako-empty">Waiting for someone to open this tab…</div></div>
  <div class="tako-help">Anyone can tap START ROUND — it counts down for everyone at once, then nine takoyaki start cooking on one shared griddle. Each ball turns golden and says FLIP for a moment: tap it right then. Tap raw batter and you poke a hole in it (−1, combo lost); leave a golden ball and it burns (combo lost). 5 flips in a row starts a combo, and the griddle gets hotter every 12 seconds. Pack the box together before time runs out. Open the tab mid-round and you watch this one, then join the next.</div>
</div>`;
}

function takoRenderConn(){
  const el = TAKO.root && TAKO.root.querySelector("#takoConn");
  if(!el) return;
  const s = takoRT.status();
  el.className = "tako-conn " + s;
  el.textContent = s === "live" ? "● LIVE — SHARED GRIDDLE"
    : s === "connecting" ? "○ connecting to the stall…"
    : "○ OFFLINE — SOLO ROUNDS ONLY, SCORES NOT SHARED";
}

function takoLvlHtml(lv, up){
  const L = TAKO_LEVELS[lv];
  const golden = (L.ready/1000).toFixed(2).replace(/0$/,"");
  return `${up?"HOTTER! ":""}LV ${lv+1}/${TAKO_LEVELS.length} · ${L.nm} · GOLDEN FOR ${golden}s`;
}

function takoRenderStage(){
  const stage = TAKO.root && TAKO.root.querySelector("#takoStage");
  if(!stage) return;
  const ph = takoPhase();
  if(ph.mode === "over") return;    // cleared to the lobby by the next loop tick

  if(ph.mode === "lobby"){
    const solo = takoRT.status() !== "live";
    const lr = TAKO.lastResult;
    let mvpLine = "";
    if(lr){
      const mvp = lr.board && lr.board[0];
      mvpLine = `<div class="tako-mvp" style="margin-top:10px">Last round: ${
        mvp && mvp.score > 0 ? `MVP <b>${esc(mvp.name)}</b> — ${mvp.score} pt${mvp.score===1?"":"s"}`
                             : "the box stayed empty."
      }</div>`;
    }
    stage.innerHTML = `
      <div class="tako-ticket">
        <div class="lbl">LOBBY</div>
        <div class="big">🐙</div>
        <div class="nm">${solo ? "Offline — you can still run a solo round" : "Waiting for a cook to fire up the griddle"}</div>
      </div>
      ${mvpLine}
      <button type="button" class="tako-start" id="takoStart">${solo ? "START SOLO ROUND" : "START ROUND"}</button>
      <div class="tako-roomline"><span>${takoPresent().length} at the stall</span><span>Your best ${TAKO.best} pt${TAKO.best===1?"":"s"}</span></div>`;
    return;
  }

  if(ph.mode === "count"){
    stage.innerHTML = `
      <div class="tako-ticket">
        <div class="lbl">HEATING UP — STARTING IN</div>
        <div class="big">${Math.ceil(ph.countLeft/1000)}</div>
        <div class="nm">${takoPresent().length} cooks at the griddle</div>
      </div>`;
    return;
  }

  if(ph.mode === "result"){
    const board = TAKO.board.length ? TAKO.board : takoPlayers();
    const mvp = board[0];
    const total = board.reduce((s,p)=>s+p.score, 0);
    const goal = takoGoal(board.length);
    stage.innerHTML = `
      <div class="tako-ticket">
        <div class="lbl">ROUND OVER</div>
        <div class="big">${TAKO.complete ? "🥡" : "🔥"}</div>
        <div class="nm">${TAKO.complete ? "Box packed!" : "The box didn't fill this time."}</div>
      </div>
      <div class="tako-mvp" style="margin-top:10px">
        ${mvp && mvp.score>0 ? `MVP <b>${esc(mvp.name)}</b> — ${mvp.score} pt${mvp.score===1?"":"s"}` : "Nothing flipped. Next round, then."}
      </div>
      <div class="tako-roomline"><span>Stall total</span><span>${total} / ${goal}</span></div>
      <div class="tako-roomline"><span>You flipped</span><span>${TAKO.spectating ? "— (watching)" : TAKO.flips + " ball" + (TAKO.flips===1?"":"s")}</span></div>
      <div class="tako-roomline"><span>Your best round</span><span>${TAKO.best} pt${TAKO.best===1?"":"s"}</span></div>
      <button type="button" class="tako-start" id="takoStart">START ANOTHER</button>
      <div class="tako-clock">BACK TO THE LOBBY IN ${Math.ceil(ph.resultLeft/1000)}s</div>`;
    return;
  }

  // ph.mode === "play" — built ONCE per round; takoPaintGriddle() then mutates
  // the nine buttons in place so a thumb mid-tap never lands on a fresh element.
  let balls = "";
  for(let i = 0; i < TAKO_BALLS; i++){
    balls += `<button type="button" class="tako-ball s-empty" data-i="${i}" data-s="" ${TAKO.spectating?"disabled":""}>`
          +  `<span class="face"></span><span class="tag">FLIP!</span><i class="bar"></i></button>`;
  }
  stage.innerHTML = `
    <div class="tako-lvl" id="takoLvl">${takoLvlHtml(ph.lv, false)}</div>
    <div class="tako-griddle" id="takoGriddle">${balls}</div>
    ${TAKO.spectating
      ? `<div class="tako-watch">WATCHING — YOU'RE IN THE NEXT ROUND</div>`
      : `<div class="tako-you">
           <span>You <b id="takoScore">${TAKO.score}</b> pts</span>
           <span class="cmb" id="takoCombo">&nbsp;</span>
         </div>`}
    <div class="tako-clock" id="takoClock">${takoClockText(ph)}</div>`;
  TAKO.lv = ph.lv;
  TAKO.playing = true;
  takoWireGriddle();
  takoPaintGriddle(ph);
  takoPaintYou();
}

function takoWireGriddle(){
  const g = TAKO.root && TAKO.root.querySelector("#takoGriddle");
  if(!g) return;
  g.onclick = (e)=>{
    const b = e.target.closest(".tako-ball");
    if(b && !b.disabled) takoTap(+b.dataset.i);
  };
}

const TAKO_FACE = { empty:"", raw:"", cook:"🐙", ready:"🐙", done:"✓", burnt:"💨" };
/* Repaint the nine balls from the seeded timeline. Class/face only change on a
   phase change; the drain bar on a golden ball moves every tick. */
function takoPaintGriddle(ph){
  const g = TAKO.root && TAKO.root.querySelector("#takoGriddle");
  if(!g || ph.mode !== "play") return;
  const now = Date.now();
  const kids = g.children;
  for(let i = 0; i < kids.length; i++){
    const b = kids[i];
    const st = takoBallAt(TAKO.seed, i, ph.el);
    let phase = st.phase;
    if(st.c && (phase === "ready" || phase === "burnt") && TAKO.flipped[takoKey(i, st.c)]) phase = "done";
    const miss = (TAKO.missAt[i] || 0) > now - TAKO_MISS_MS;
    const cls = "tako-ball s-" + phase + (miss ? " miss" : "");
    if(b.dataset.s !== phase){
      b.dataset.s = phase;
      b.querySelector(".face").textContent = TAKO_FACE[phase];
    }
    if(b.className !== cls) b.className = cls;
    const bar = b.lastElementChild;
    bar.style.width = phase === "ready" ? Math.round(100 * st.left / st.total) + "%" : "0";
  }
}
function takoClockText(ph){
  const left = Math.ceil(ph.playLeft/1000) + "s LEFT";
  return TAKO.spectating ? left : left + " · " + TAKO.flips + " FLIPPED";
}
function takoPaintYou(){
  if(!TAKO.root || TAKO.spectating) return;
  const s = TAKO.root.querySelector("#takoScore"), c = TAKO.root.querySelector("#takoCombo"), k = TAKO.root.querySelector("#takoClock");
  if(s) s.textContent = TAKO.score;
  if(k) k.textContent = takoClockText(takoPhase());
  if(c) c.innerHTML = TAKO.combo >= 5 ? "COMBO ×"+(1+Math.min(3,Math.floor(TAKO.combo/5))) : (TAKO.combo ? TAKO.combo+" in a row" : "&nbsp;");
}

function takoRenderBox(){
  const card = TAKO.root && TAKO.root.querySelector("#takoBoxCard");
  if(!card) return;
  const ph = takoPhase();
  if(ph.mode === "lobby" || ph.mode === "count"){
    let box = "";
    for(let i=0;i<TAKO_BOX;i++) box += `<span>🍡</span>`;
    card.innerHTML = `
      <div class="tako-box">${box}</div>
      <div class="tako-roomline"><span>${takoPresent().length} at the stall</span><span>The box fills once the round starts</span></div>`;
    return;
  }
  const room = (TAKO.board.length && ph.mode !== "play") ? TAKO.board : takoPlayers();
  const total = room.reduce((s,p)=>s+p.score, 0);
  const goal = takoGoal(room.length);
  const filled = Math.min(TAKO_BOX, Math.floor(TAKO_BOX * total / goal));
  if(filled >= TAKO_BOX) TAKO.complete = true;
  let box = "";
  for(let i=0;i<TAKO_BOX;i++) box += `<span class="${i<filled?"on":""}">🍡</span>`;
  card.innerHTML = `
    <div class="tako-box">${box}</div>
    <div class="tako-roomline"><span>${room.length} at the griddle</span><span>${total} / ${goal}</span></div>
    ${TAKO.complete ? '<div class="tako-done">🎉 THE BOX IS PACKED 🎉</div>' : ""}`;
}

function takoRenderBoard(){
  const el = TAKO.root && TAKO.root.querySelector("#takoBoard");
  if(!el) return;
  const ph = takoPhase();
  if(ph.mode === "lobby" || ph.mode === "count"){
    const room = takoPresent();
    let h = `<h5>AT THE STALL (${room.length})</h5>`;
    if(room.length === 1 && takoRT.status() !== "live"){
      h += '<div class="tako-empty">Nobody else here yet. Colleagues appear as they open this tab.</div>';
    }
    room.slice(0,30).forEach(p=>{
      h += `<div class="tako-row ${p.mine?"me":""}"><span class="nm">${esc(p.name)}${p.mine?" (you)":""}</span></div>`;
    });
    el.innerHTML = h;
    return;
  }
  const room = (TAKO.board.length && ph.mode !== "play") ? TAKO.board : takoPlayers();
  let h = "<h5>THE GRIDDLE</h5>";
  if(room.length === 1 && takoRT.status() !== "live"){
    h += '<div class="tako-empty">Nobody else here yet. Scores appear as colleagues open this tab.</div>';
  }
  room.slice(0,30).forEach((p,i)=>{
    h += `<div class="tako-row ${p.mine?"me":""}"><span class="rk">${i+1}</span>`
      +  `<span class="nm">${esc(p.name)}${p.mine?" (you)":""}</span>`
      +  `<span class="fl">${p.flips||0} 🐙</span><b>${p.score}</b></div>`;
  });
  el.innerHTML = h;
}

function takoRenderAll(){
  takoRenderConn();
  takoRenderStage();
  takoRenderBox();
  takoRenderBoard();
}

/* =========================================================
   PLAY
   ========================================================= */
function takoClick(e){
  // Delegated on the root: the stage re-renders around the button.
  const b = e.target.closest && e.target.closest("#takoStart");
  if(b) takoStart();
}

function takoTap(i){
  const ph = takoPhase();
  if(ph.mode !== "play" || TAKO.spectating) return;
  if(!(i >= 0 && i < TAKO_BALLS)) return;
  const st = takoBallAt(TAKO.seed, i, ph.el);
  const key = st.c ? takoKey(i, st.c) : null;
  if(st.phase === "ready" && !TAKO.flipped[key]){
    TAKO.flipped[key] = true;
    TAKO.combo++;
    TAKO.flips++;
    TAKO.score += 1 + Math.min(3, Math.floor(TAKO.combo/5));
  }else if(st.phase === "raw" || st.phase === "cook"){
    // poked the batter: costs a point and the combo
    TAKO.score = Math.max(0, TAKO.score - 1);
    TAKO.combo = 0;
    TAKO.missAt[i] = Date.now();
  }else{
    // burnt, already flipped, or an empty hole: nothing gained, combo gone
    TAKO.combo = 0;
    TAKO.missAt[i] = Date.now();
  }
  TAKO.dirty = true;
  takoPush(true);
  takoPaintGriddle(ph);
  takoPaintYou();
  takoRenderBox();
  takoRenderBoard();
}

/* A golden ball that burned without our flip breaks the combo — once per cycle. */
function takoScanBurns(ph){
  if(TAKO.spectating) return;
  for(let i = 0; i < TAKO_BALLS; i++){
    const st = takoBallAt(TAKO.seed, i, ph.el);
    if(st.phase !== "burnt") continue;
    const key = takoKey(i, st.c);
    if(TAKO.burned[key]) continue;
    TAKO.burned[key] = true;
    if(!TAKO.flipped[key] && TAKO.combo){ TAKO.combo = 0; TAKO.dirty = true; takoPaintYou(); }
  }
}

function takoLoop(){
  if(!TAKO.root) return;
  takoPrune();
  const ph = takoPhase();

  if(ph.mode === "over"){ takoEndRound(); takoToLobby(); takoRenderAll(); return; }

  if(ph.mode === "play"){
    if(TAKO.board.length) TAKO.board = [];
    if(!TAKO.playing) takoRenderStage();          // first tick of play: build the griddle
  }else if(TAKO.playing){                          // play just ended
    TAKO.playing = false;
    takoEndRound();
  }

  if(ph.mode !== TAKO.mode){ TAKO.mode = ph.mode; TAKO.lastSec = -1; takoRenderAll(); }

  takoPush(false);
  takoRenderConn();

  if(ph.mode === "play"){
    takoScanBurns(ph);
    takoPaintGriddle(ph);
    if(ph.lv !== TAKO.lv){
      const l = TAKO.root.querySelector("#takoLvl");
      if(l){ l.textContent = takoLvlHtml(ph.lv, true); l.classList.add("up"); }
      TAKO.lv = ph.lv;
    }
    const sec = Math.floor(Date.now()/1000);
    if(sec !== TAKO.lastSec){                      // box, board and clock once a second, not ten times
      TAKO.lastSec = sec;
      const clock = TAKO.root.querySelector("#takoClock");
      if(clock) clock.textContent = takoClockText(ph);
      takoRenderBox();
      takoRenderBoard();
    }
  }else{
    const sec = Math.floor(Date.now()/1000);
    if(sec !== TAKO.lastSec){
      TAKO.lastSec = sec;
      takoRenderStage(); takoRenderBox(); takoRenderBoard();
    }
  }
}

function takoKeyDown(e){
  if(!TAKO.root) return;
  const n = "123456789".indexOf(e.key);
  if(n < 0) return;
  const ph = takoPhase();
  if(ph.mode !== "play" || TAKO.spectating) return;
  takoTap(n);                                      // 1–9 read off the griddle as shown, left to right
}

/* =========================================================
   MODULE CONTRACT — render / init / tick / stop
   ========================================================= */
function initTako(){
  TAKO.root = document.getElementById("gamePage");
  TAKO.best = takoGetBest();
  // A round we were already in survives a tab switch (same reasoning as Sushi).
  const resume = TAKO.startAt && (Date.now() - TAKO.startAt) < TAKO_PLAY_MS + TAKO_RESULT_MS;
  if(resume){
    TAKO.seed = takoSeed(TAKO.startAt);
  }else{
    TAKO.startAt = 0; TAKO.seed = 0; TAKO.lastEnded = 0;
    TAKO.spectating = false; TAKO.ended = false; TAKO.lastResult = null;
    TAKO.score = 0; TAKO.combo = 0; TAKO.flips = 0;
    TAKO.flipped = {}; TAKO.burned = {}; TAKO.missAt = [];
    TAKO.board = []; TAKO.complete = false;
    for(const k in takoCyc) delete takoCyc[k];
  }
  TAKO.mode = ""; TAKO.lv = -1; TAKO.playing = false;
  TAKO.room = {};
  TAKO.sentAt = 0; TAKO.dirty = true; TAKO.lastSec = -1;
  takoRT.open(takoOnMsg);
  TAKO.root.addEventListener("click", takoClick);
  takoRenderAll();
  takoLoop();
  TAKO.uiTimer = setInterval(takoLoop, TAKO_UI_MS);
  document.addEventListener("keydown", takoKeyDown);
}

function tickTako(){
  // Safety net for a throttled background tab; nudges a dropped socket.
  if(!TAKO.root) TAKO.root = document.getElementById("gamePage");
  if(!TAKO.uiTimer) TAKO.uiTimer = setInterval(takoLoop, TAKO_UI_MS);
  if(takoRT.wanted && !takoRT.joined) takoRT._connect();
  takoLoop();
}

function stopTako(){
  if(TAKO.uiTimer){ clearInterval(TAKO.uiTimer); TAKO.uiTimer = null; }
  document.removeEventListener("keydown", takoKeyDown);
  if(TAKO.root) TAKO.root.removeEventListener("click", takoClick);
  takoRT.close();
  TAKO.root = null;
  TAKO.room = {};
  // The round itself is deliberately NOT cleared — initTako() decides whether
  // what's left is still worth resuming, exactly as stopSushi() does.
}
