/* =========================================================
   GAME MODULE — ARCADE: DEER DASH
   ========================================================= */
/* =========================================================
   DEER DASH — endless runner mini-game for Nexstream Kansai Quest
   All top-level names prefixed: arcade / Arcade / ARCADE_ / DEER_
   ========================================================= */

const ARCADE_W = 360, ARCADE_H = 200, ARCADE_GROUND = 170;
const ARCADE_GRAVITY = 900, ARCADE_JUMP_V = -260, ARCADE_CUT_VY = -90;
const ARCADE_PLAYER_X = 50, ARCADE_PLAYER_W = 18;
const ARCADE_STAND_H = 20, ARCADE_DUCK_H = 12;
const ARCADE_SPEED_BASE = 140, ARCADE_SPEED_MAX = 340, ARCADE_SPEED_ACCEL = 6.5;
const ARCADE_AIRTIME = (2 * Math.abs(ARCADE_JUMP_V)) / ARCADE_GRAVITY;
const ARCADE_MAX_DT = 1 / 20; // cap delta so a backgrounded tab can't teleport the player

const DEER_TORII_ROWS = [
  "RRRRRRRR","R......R","RR....RR","..R..R..","..R..R..",
  "..R..R..","..R..R..","..R..R..","..R..R..","..R..R.."
];
const DEER_SENBEI_ROWS = [
  "........","..YYYY..",".YYYYYY.",".YYBYYY.",".YYYYYY.",".YYYYYY.","..YYYY..","........"
];
const DEER_PICK_PAL = { R:"#c8442b", Y:"#c9a24a", B:"#8e6f2a" };
// crouched traveller pose (5 rows) — reuses charPal's H/S/E/C letters
const DEER_DUCK_ROWS = [".HHHHHH.",".HSSSSH.",".SESSES.","CCCCCCCC",".LL..LL."];
// two-frame running legs, swapped in place of CHAR's last row while on ground
const DEER_RUN_LEGS = [".LL..LL.","L....LL.",".LL....L"];

const ARCADE_STATE = {
  root:null, canvas:null, ctx:null, dpr:1, raf:null, running:false, screen:'start',
  listeners:[], player:null, obstacles:[], particles:[], score:0, pickups:0,
  distance:0, elapsed:0, speed:ARCADE_SPEED_BASE, obCountdown:0, pickCountdown:-1,
  shake:0, over:false, lastTs:0, bg1:0, bg2:0, runFrame:0, runTimer:0,
  ducking:false, pointerDown:false, downY:0, duckFromSwipe:false, holding:false
};

function arcadeBestKey(){ return "arcadeDeerDashBest_" + (me && me.id ? me.id : "anon"); }
function arcadeGetBest(){ try{ return +(localStorage.getItem(arcadeBestKey())||0); }catch(e){ return 0; } }
function arcadeSetBest(v){ try{ localStorage.setItem(arcadeBestKey(), String(v)); }catch(e){} }

function renderArcade(){
  return `
<style>
  .arcade-wrap{max-width:480px;margin:0 auto;padding:10px 8px 16px;font-family:'VT323','Courier New',monospace;color:#f3e8cf}
  .arcade-stage{position:relative;width:100%;border:4px solid #c9a24a;box-shadow:0 0 0 4px #122036,5px 5px 0 rgba(0,0,0,.5);background:#7fb3e0}
  .arcade-stage canvas{display:block;width:100%;height:auto;aspect-ratio:${ARCADE_W}/${ARCADE_H};image-rendering:pixelated;touch-action:none;user-select:none;background:#7fb3e0}
  .arcade-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
    background:rgba(18,32,54,.93);padding:14px;text-align:center;overflow-y:auto}
  .arcade-h1{font-family:'Press Start 2P',monospace;font-size:16px;color:#c9a24a;line-height:1.6;margin-bottom:8px}
  .arcade-how{font-size:16px;color:#b9c3d6;margin-bottom:10px;max-width:34ch}
  .arcade-best{font-size:15px;color:#f3e8cf;margin-bottom:10px}
  .arcade-best b{color:#c9a24a}
  .arcade-btn{font-family:'Press Start 2P',monospace;font-size:12px;padding:12px 20px;border:4px solid #8e6f2a;
    background:#c8442b;color:#fff;box-shadow:4px 4px 0 #122036;cursor:pointer;margin:6px 0}
  .arcade-btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #122036}
  .arcade-score-row{font-family:'Press Start 2P',monospace;font-size:13px;color:#f3e8cf;margin:6px 0}
  .arcade-score-row.gold{color:#c9a24a}
  .arcade-board{width:100%;max-width:320px;margin-top:6px;border:3px solid #8e6f2a;background:#1b2a44;text-align:left}
  .arcade-board .arcade-bh{font-family:'Press Start 2P',monospace;font-size:9px;color:#c9a24a;padding:6px 8px;border-bottom:2px solid #8e6f2a}
  .arcade-row{display:flex;align-items:center;gap:8px;padding:4px 8px;font-size:16px;border-bottom:1px solid rgba(255,255,255,.08)}
  .arcade-row:last-child{border-bottom:none}
  .arcade-row .arcade-rank{color:#c9a24a;width:18px;font-family:'Press Start 2P',monospace;font-size:9px}
  .arcade-row canvas{width:20px;height:20px;image-rendering:pixelated;flex:none}
  .arcade-row .arcade-nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff}
  .arcade-row .arcade-sc{color:#c9a24a}
  .arcade-empty{font-size:15px;color:#b9c3d6;padding:8px}
  .arcade-overlay[hidden],.arcade-hud[hidden]{display:none!important}
  .arcade-hud{position:absolute;left:0;top:0;right:0;display:flex;justify-content:space-between;padding:6px 8px;
    font-family:'Press Start 2P',monospace;font-size:11px;color:#f3e8cf;background:rgba(18,32,54,.55);pointer-events:none}
  .arcade-ctrl{display:flex;justify-content:center;margin-top:10px}
  .arcade-duck{font-family:'Press Start 2P',monospace;font-size:12px;padding:14px 26px;border:4px solid #8e6f2a;
    background:#1b2a44;color:#c9a24a;box-shadow:4px 4px 0 rgba(0,0,0,.5);touch-action:none;user-select:none}
  .arcade-duck:active{transform:translate(2px,2px);box-shadow:2px 2px 0 rgba(0,0,0,.5);background:#2a3a5a}
  .arcade-note{font-size:13px;color:#b9c3d6;margin-top:6px}
</style>
<div class="arcade-wrap">
  <div class="arcade-stage" id="arcadeStage">
    <canvas id="arcadeCanvas"></canvas>
    <div class="arcade-hud" id="arcadeHud" hidden><span>SCORE <span id="arcadeScoreVal">0</span></span><span id="arcadeSpeedVal"></span></div>
    <div class="arcade-overlay" id="arcadeStartScreen">
      <div class="arcade-h1">DEER DASH</div>
      <div class="arcade-how">TAP / SPACE = jump &middot; hold DUCK or swipe down = duck &middot; grab senbei for bonus points</div>
      <div class="arcade-best">Your best: <b id="arcadeBestVal">0</b></div>
      <button class="arcade-btn" id="arcadeStartBtn">START</button>
      <div class="arcade-board" id="arcadeBoardStart"><div class="arcade-bh">TOP TRAVELLERS</div><div class="arcade-empty">Loading…</div></div>
    </div>
    <div class="arcade-overlay" id="arcadeOverScreen" hidden>
      <div class="arcade-h1">RUN OVER</div>
      <div class="arcade-score-row">SCORE <span id="arcadeFinalScore">0</span></div>
      <div class="arcade-score-row gold" id="arcadeNewBest" hidden>NEW BEST!</div>
      <div class="arcade-note" id="arcadeSaveNote"></div>
      <button class="arcade-btn" id="arcadeAgainBtn">PLAY AGAIN</button>
      <div class="arcade-board" id="arcadeBoardOver"><div class="arcade-bh">TOP TRAVELLERS</div><div class="arcade-empty">Loading…</div></div>
    </div>
  </div>
  <div class="arcade-ctrl">
    <button class="arcade-duck" id="arcadeDuckBtn">&#9660; DUCK</button>
  </div>
</div>`;
}

/* ---------------- setup / teardown ---------------- */
function initArcade(){
  const root = document.getElementById('gamePage');
  const st = ARCADE_STATE;
  st.root = root;
  st.canvas = root.querySelector('#arcadeCanvas');
  st.ctx = st.canvas.getContext('2d');
  st.listeners = [];
  st.screen = 'start';
  st.running = false;
  st.over = false;
  document.getElementById('arcadeBestVal') || null;
  root.querySelector('#arcadeBestVal').textContent = arcadeGetBest();
  arcadeResizeCanvas();
  arcadeOn(window,'resize', arcadeResizeCanvas);

  arcadeOn(root.querySelector('#arcadeStartBtn'),'click', arcadeStartRun);
  arcadeOn(root.querySelector('#arcadeAgainBtn'),'click', arcadeStartRun);

  const canvas = st.canvas;
  arcadeOn(canvas,'pointerdown', e=>{ e.preventDefault(); if(st.screen!=='playing') return;
    st.pointerDown=true; st.downY=e.clientY; st.duckFromSwipe=false; arcadeJumpStart(); });
  arcadeOn(window,'pointermove', e=>{ if(!st.pointerDown||st.screen!=='playing') return;
    if(!st.duckFromSwipe && (e.clientY-st.downY)>22){ st.duckFromSwipe=true; arcadeSetDuck(true); } });
  arcadeOn(window,'pointerup', arcadePointerEnd);
  arcadeOn(window,'pointercancel', arcadePointerEnd);
  arcadeOn(canvas,'touchmove', e=>{ if(st.screen==='playing') e.preventDefault(); }, {passive:false});

  const duckBtn = root.querySelector('#arcadeDuckBtn');
  arcadeOn(duckBtn,'pointerdown', e=>{ e.preventDefault(); if(st.screen==='playing') arcadeSetDuck(true); });
  arcadeOn(duckBtn,'pointerup', e=>{ e.preventDefault(); arcadeSetDuck(false); });
  arcadeOn(duckBtn,'pointerleave', ()=>arcadeSetDuck(false));
  arcadeOn(duckBtn,'pointercancel', ()=>arcadeSetDuck(false));

  arcadeOn(window,'keydown', e=>{
    if(st.screen!=='playing') return;
    if(e.code==='Space'||e.code==='ArrowUp'){ e.preventDefault(); if(!e.repeat) arcadeJumpStart(); }
    else if(e.code==='ArrowDown'||e.code==='KeyS'){ e.preventDefault(); arcadeSetDuck(true); }
  });
  arcadeOn(window,'keyup', e=>{
    if(e.code==='Space'||e.code==='ArrowUp') arcadeJumpEnd();
    else if(e.code==='ArrowDown'||e.code==='KeyS') arcadeSetDuck(false);
  });

  arcadeShowScreen('start');
  arcadeFetchBoard();
}

function stopArcade(){
  const st = ARCADE_STATE;
  if(st.raf!=null){ cancelAnimationFrame(st.raf); st.raf=null; }
  st.running = false;
  st.listeners.forEach(([t,ev,fn,opts])=>{ try{ t.removeEventListener(ev,fn,opts); }catch(e){} });
  st.listeners = [];
}

function tickArcade(){
  if(ARCADE_STATE.screen!=='playing') arcadeFetchBoard();
}

function arcadeOn(target, ev, fn, opts){ target.addEventListener(ev, fn, opts); ARCADE_STATE.listeners.push([target, ev, fn, opts]); }
function arcadePointerEnd(e){ const st=ARCADE_STATE; if(!st.pointerDown) return; st.pointerDown=false; arcadeJumpEnd(); if(st.duckFromSwipe){ arcadeSetDuck(false); st.duckFromSwipe=false; } }

function arcadeResizeCanvas(){
  const st = ARCADE_STATE;
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio||1));
  st.dpr = dpr;
  st.canvas.width = ARCADE_W*dpr;
  st.canvas.height = ARCADE_H*dpr;
  st.ctx.setTransform(dpr,0,0,dpr,0,0);
}

function arcadeShowScreen(name){
  const st = ARCADE_STATE, root = st.root;
  st.screen = name;
  root.querySelector('#arcadeStartScreen').hidden = name!=='start';
  root.querySelector('#arcadeOverScreen').hidden = name!=='over';
  root.querySelector('#arcadeHud').hidden = name!=='playing';
}

/* ---------------- game control ---------------- */
function arcadeStartRun(){
  const st = ARCADE_STATE;
  st.player = { footY: ARCADE_GROUND, vy:0, onGround:true, jumping:false, squashT:0 };
  st.obstacles = [];
  st.particles = [];
  st.score = 0; st.pickups = 0; st.distance = 0; st.elapsed = 0;
  st.speed = ARCADE_SPEED_BASE;
  st.obCountdown = 60; st.pickCountdown = -1;
  st.shake = 0; st.over = false; st.ducking = false; st.holding=false;
  st.bg1 = 0; st.bg2 = 0; st.runFrame = 0; st.runTimer = 0;
  arcadeShowScreen('playing');
  st.lastTs = performance.now();
  if(st.raf!=null) cancelAnimationFrame(st.raf);
  st.running = true;
  st.raf = requestAnimationFrame(arcadeLoop);
}

function arcadeJumpStart(){
  const st = ARCADE_STATE, p = st.player;
  if(!p || st.over) return;
  st.holding = true;
  if(p.onGround && !st.ducking){ p.vy = ARCADE_JUMP_V; p.onGround = false; p.jumping = true; }
}
function arcadeJumpEnd(){
  const st = ARCADE_STATE, p = st.player;
  st.holding = false;
  if(p && p.vy < ARCADE_CUT_VY) p.vy = ARCADE_CUT_VY;
}
function arcadeSetDuck(v){
  const st = ARCADE_STATE;
  st.ducking = v;
}

/* ---------------- main loop ---------------- */
function arcadeLoop(ts){
  const st = ARCADE_STATE;
  if(!st.running) return;
  let dt = (ts - st.lastTs)/1000;
  st.lastTs = ts;
  if(!isFinite(dt) || dt<0) dt = 0;
  dt = Math.min(dt, ARCADE_MAX_DT);
  arcadeUpdate(dt);
  arcadeDraw();
  st.raf = requestAnimationFrame(arcadeLoop);
}

function arcadeUpdate(dt){
  const st = ARCADE_STATE, p = st.player;
  if(st.over){
    st.shake = Math.max(0, st.shake-dt);
    if(st.shake<=0) arcadeEndRun();
    return;
  }
  st.elapsed += dt;
  st.speed = Math.min(ARCADE_SPEED_MAX, ARCADE_SPEED_BASE + st.elapsed*ARCADE_SPEED_ACCEL);
  st.distance += st.speed*dt;
  st.bg1 = (st.bg1 + st.speed*0.25*dt) % ARCADE_W;
  st.bg2 = (st.bg2 + st.speed*0.5*dt) % ARCADE_W;

  // physics — track FEET position so ducking (an instant crouch, not a fall)
  // never desyncs from the ground-collision state machine
  p.vy += ARCADE_GRAVITY*dt;
  p.footY += p.vy*dt;
  if(p.footY >= ARCADE_GROUND){
    if(!p.onGround && p.vy>0){ p.squashT = 0.14; }
    p.footY = ARCADE_GROUND; p.vy = 0; p.onGround = true; p.jumping = false;
  } else { p.onGround = false; }
  if(p.squashT>0) p.squashT = Math.max(0, p.squashT-dt);

  // running animation timer
  if(p.onGround){ st.runTimer += dt; if(st.runTimer>0.12){ st.runTimer=0; st.runFrame=(st.runFrame+1)%DEER_RUN_LEGS.length; } }

  // spawn obstacles
  st.obCountdown -= st.speed*dt;
  if(st.obCountdown<=0) arcadeSpawnObstacle();
  if(st.pickCountdown>0){ st.pickCountdown -= st.speed*dt; if(st.pickCountdown<=0){ arcadeSpawnPickup(); st.pickCountdown=-1; } }

  // move obstacles + collisions
  const ph = (st.ducking && p.onGround) ? ARCADE_DUCK_H : ARCADE_STAND_H;
  const pBottom = p.footY, pTop = p.footY-ph, pLeft = ARCADE_PLAYER_X, pRight = ARCADE_PLAYER_X+ARCADE_PLAYER_W;
  for(let i=st.obstacles.length-1;i>=0;i--){
    const o = st.obstacles[i];
    o.x -= st.speed*dt;
    if(o.x + o.w < -10){ st.obstacles.splice(i,1); continue; }
    const overlapX = (o.x < pRight) && (o.x+o.w > pLeft);
    if(!overlapX) continue;
    const overlapY = (o.y < pBottom) && (o.y+o.h > pTop);
    if(!overlapY) continue;
    if(o.type==='pickup'){
      if(!o.taken){ o.taken=true; st.pickups++; arcadeBurst(o.x+o.w/2, o.y+o.h/2); st.obstacles.splice(i,1); }
    } else {
      arcadeHit();
    }
  }

  // particles
  for(let i=st.particles.length-1;i>=0;i--){
    const pt = st.particles[i];
    pt.x += pt.vx*dt; pt.y += pt.vy*dt; pt.life -= dt;
    if(pt.life<=0) st.particles.splice(i,1);
  }

  st.score = Math.floor(st.distance/8) + st.pickups*15;
  const scoreEl = st.root.querySelector('#arcadeScoreVal');
  if(scoreEl) scoreEl.textContent = st.score;
}

function arcadeSpawnObstacle(){
  const st = ARCADE_STATE;
  const type = Math.random()<0.52 ? 'deer' : 'torii';
  if(type==='deer'){
    st.obstacles.push({type:'deer', x:ARCADE_W+10, w:22, h:20, y:ARCADE_GROUND-20, frame:0});
  } else {
    st.obstacles.push({type:'torii', x:ARCADE_W+10, w:16, h:12, y:144});
  }
  const gap = st.speed*(0.42+ARCADE_AIRTIME) + 20 + Math.random()*70;
  st.obCountdown = gap;
  if(Math.random()<0.55) st.pickCountdown = gap*0.5;
}
function arcadeSpawnPickup(){
  const st = ARCADE_STATE;
  st.obstacles.push({type:'pickup', x:ARCADE_W+10, w:12, h:12, y:156, taken:false});
}
function arcadeBurst(x,y){
  const st = ARCADE_STATE;
  for(let i=0;i<6;i++){
    const a = Math.random()*Math.PI*2;
    st.particles.push({x,y,vx:Math.cos(a)*60,vy:Math.sin(a)*60-20,life:0.4,max:0.4});
  }
}
function arcadeHit(){
  const st = ARCADE_STATE;
  if(st.over) return;
  st.over = true; st.shake = 0.32;
}
async function arcadeEndRun(){
  const st = ARCADE_STATE;
  st.running = false;
  if(st.raf!=null){ cancelAnimationFrame(st.raf); st.raf=null; }
  const cap = Math.round(st.elapsed*80 + 50);
  const finalScore = Math.max(0, Math.min(st.score, cap));
  const best = arcadeGetBest();
  const isNew = finalScore > best;
  if(isNew) arcadeSetBest(finalScore);
  const root = st.root;
  root.querySelector('#arcadeFinalScore').textContent = finalScore;
  root.querySelector('#arcadeNewBest').hidden = !isNew;
  root.querySelector('#arcadeBestVal').textContent = arcadeGetBest();
  arcadeShowScreen('over');
  const noteEl = root.querySelector('#arcadeSaveNote');
  noteEl.textContent = 'Saving score…';
  try{
    await sb('arcade_scores', { method:'POST', headers:{Prefer:'return=minimal'}, body: JSON.stringify({
      player_id: me.id, player_name: me.name, av: me.av, game:'deerdash', score: finalScore, ts: Date.now()
    })});
    noteEl.textContent = '';
  }catch(e){ console.warn(e); noteEl.textContent = 'Score not saved (offline).'; }
  arcadeFetchBoard();
}

/* ---------------- leaderboard ---------------- */
async function arcadeFetchBoard(){
  const st = ARCADE_STATE; if(!st.root) return;
  let rows;
  try{
    rows = await sb('arcade_scores?select=player_id,player_name,score,av&game=eq.deerdash&order=score.desc&limit=200');
  }catch(e){ console.warn(e); arcadeRenderBoard(null); return; }
  const best = {};
  for(const r of rows){
    const cur = best[r.player_id];
    if(!cur || r.score>cur.score) best[r.player_id] = r;
  }
  const top = Object.values(best).sort((a,b)=>b.score-a.score).slice(0,10);
  arcadeRenderBoard(top);
}
function arcadeRenderBoard(list){
  const st = ARCADE_STATE, root = st.root;
  const targets = [root.querySelector('#arcadeBoardStart'), root.querySelector('#arcadeBoardOver')];
  targets.forEach(box=>{
    if(!box) return;
    if(list===null){ box.innerHTML = '<div class="arcade-bh">TOP TRAVELLERS</div><div class="arcade-empty">Leaderboard unavailable offline.</div>'; return; }
    if(!list.length){ box.innerHTML = '<div class="arcade-bh">TOP TRAVELLERS</div><div class="arcade-empty">No runs yet — be the first!</div>'; return; }
    let h = '<div class="arcade-bh">TOP TRAVELLERS</div>';
    list.forEach((r,i)=>{
      h += `<div class="arcade-row"><span class="arcade-rank">${i+1}</span><canvas class="arcade-av" data-av="${r.av||0}" width="8" height="8"></canvas><span class="arcade-nm">${esc(r.player_name||'?')}</span><span class="arcade-sc">${r.score}</span></div>`;
    });
    box.innerHTML = h;
  });
  root.querySelectorAll('.arcade-av[data-av]').forEach(c=>{ drawSprite(c.getContext('2d'), CHAR, charPal(+c.dataset.av), 0, 0, 1); });
}

/* ---------------- drawing ---------------- */
function arcadeDraw(){
  const st = ARCADE_STATE, ctx = st.ctx, p = st.player;
  ctx.clearRect(0,0,ARCADE_W,ARCADE_H);
  ctx.save();
  if(st.shake>0){ const k=st.shake/0.32; ctx.translate((Math.random()-0.5)*8*k,(Math.random()-0.5)*6*k); }

  // sky
  ctx.fillStyle = '#8fc2e8'; ctx.fillRect(0,0,ARCADE_W,ARCADE_GROUND);
  // far hills (blocky pixel silhouette, no anti-aliased diagonals)
  arcadeHillRow(ctx, '#5c88b3', st.bg1, 108, ARCADE_HILL_FAR);
  // pagoda silhouettes further back, clearly distinct dark tone
  arcadeSilhouettes(ctx, st.bg1*0.7);
  // near hills
  arcadeHillRow(ctx, '#6d9a48', st.bg2*1.4, 140, ARCADE_HILL_NEAR);
  // ground
  ctx.fillStyle = '#c9a24a'; ctx.fillRect(0,ARCADE_GROUND,ARCADE_W,ARCADE_H-ARCADE_GROUND);
  ctx.fillStyle = '#8e6f2a';
  const gx = -(st.bg2*2)%20;
  for(let x=gx; x<ARCADE_W; x+=20) ctx.fillRect(x,ARCADE_GROUND,10,4);

  // obstacles
  st.obstacles.forEach(o=>{
    if(o.type==='deer'){ drawSprite(ctx, ICONS.deer, ICON_PAL, o.x, o.y, o.w/8); }
    else if(o.type==='torii'){ drawSprite(ctx, DEER_TORII_ROWS, DEER_PICK_PAL, o.x-4, o.y-6, 2); }
    else { drawSprite(ctx, DEER_SENBEI_ROWS, DEER_PICK_PAL, o.x-2, o.y-2, o.w/8); }
  });

  // particles
  st.particles.forEach(pt=>{ ctx.globalAlpha = Math.max(0,pt.life/pt.max); ctx.fillStyle='#c9a24a'; ctx.fillRect(pt.x-2,pt.y-2,4,4); ctx.globalAlpha=1; });

  // player — anchored to footY so ducking/squash never desyncs from physics
  if(p){
    const scale = 2.5;
    let squash = 1;
    if(p.squashT>0) squash = 1 - (p.squashT/0.14)*0.35;
    const ducking = st.ducking && p.onGround;
    const rows = ducking ? DEER_DUCK_ROWS : arcadePlayerRows(p);
    const baseH = rows.length*scale;
    const drawH = baseH*squash;
    const topY = p.footY - drawH;
    ctx.save();
    ctx.translate(ARCADE_PLAYER_X, topY);
    ctx.scale(1, squash || 1);
    drawSprite(ctx, rows, charPal(me.av||0), 0, 0, scale);
    ctx.restore();
  }
  ctx.restore();
}

function arcadePlayerRows(p){
  if(!p.onGround) return CHAR;
  const rows = CHAR.slice(0, CHAR.length-1);
  rows.push(DEER_RUN_LEGS[ARCADE_STATE.runFrame % DEER_RUN_LEGS.length]);
  return rows;
}

// blocky pixel-step hill silhouettes (no diagonal anti-aliasing, matches sprite look)
const ARCADE_HILL_FAR  = [2,4,6,8,10,9,7,5,4,6,8,9,7,5,3,2];
const ARCADE_HILL_NEAR = [1,3,6,9,7,4,2,1,3,5,8,6,3,1,2,4];
const ARCADE_HILL_BLOCK = 12;
const ARCADE_SIL_PAL = { K:'#243a5e', W:'#243a5e', R:'#243a5e' };
function arcadeHillRow(ctx, color, scrollX, baseY, pattern){
  ctx.fillStyle = color;
  const period = pattern.length*ARCADE_HILL_BLOCK;
  const off = ((scrollX % period)+period)%period;
  for(let i=-1;i<Math.ceil(ARCADE_W/ARCADE_HILL_BLOCK)+2;i++){
    const x = Math.floor(i*ARCADE_HILL_BLOCK - off);
    const h = pattern[((i%pattern.length)+pattern.length)%pattern.length]*4;
    ctx.fillRect(x, baseY-h, ARCADE_HILL_BLOCK+1, ARCADE_GROUND-(baseY-h));
  }
}
function arcadeSilhouettes(ctx, scrollX){
  const spacing = 160;
  const off = ((scrollX % spacing)+spacing)%spacing;
  for(let i=-1;i<3;i++){
    const x = Math.floor(i*spacing - off) + 40;
    drawSprite(ctx, ICONS.temple, ARCADE_SIL_PAL, x, 78, 4);
  }
}
