/* =========================================================
   REALTIME CHANNEL — hand-rolled Phoenix channel over one WebSocket
   Shared by the lobby games (Sushi Roll, Takoyaki Flip). Kept
   dependency-free on purpose: no CDN, no build, same as the rest of the
   app. It speaks just enough of the Phoenix protocol to join one public
   Supabase Realtime *Broadcast* topic, heartbeat it, and relay messages.
   Broadcast is server-relayed and ephemeral — no table, no RLS policy,
   no publication change, nothing to clean up afterwards. If the socket
   never connects the games still run solo rounds; they just say so.

   One shared scope — every name here is prefixed rt* / RT_.
   Loads before the game modules that call it (see the <script> order in
   index.html); it needs SUPABASE_URL and SUPABASE_ANON_KEY from the
   inline block, nothing else.

   rtChannel(topic, tag) returns one channel object per call. Each game
   owns its own — they never share a socket — with this shape:
     status()            "live" | "connecting" | "offline" | "idle"
     open(onMsg)         connect (and keep reconnecting) — onMsg(event, payload)
     broadcast(ev, p)    send; returns false while not joined
     close()             stop wanting the socket and drop it
     joined / wanted     read by the games' tick() safety nets
     _connect()          also poked by tick() when a backgrounded tab
                         let the browser drop the socket
   `tag` only labels console warnings so two games' noise can be told apart.
   ========================================================= */
function rtChannel(topic, tag){
  tag = tag || "rt";
  return {
    topic,
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
      catch(e){ console.warn(tag + ": websocket unavailable", e); return this._retry(); }
      this.ws = ws;
      this.joined = false;

      ws.onopen = ()=>{
        this.tries = 0;
        this._send({ topic: this.topic, event: "phx_join", payload: { config: {
          broadcast: { self: false, ack: false },   // every game applies its own taps locally
          presence:  { key: "" },                   // presence unused: state msgs carry it
          private:   false                          // public channel — no RLS involved
        }}});
        this.hbTimer = setInterval(()=>this._send({ topic:"phoenix", event:"heartbeat", payload:{} }), 25000);
      };
      ws.onmessage = (ev)=>{
        let m; try{ m = JSON.parse(ev.data); }catch(e){ return; }
        if(m.event === "phx_reply" && m.topic === this.topic){
          if(m.payload && m.payload.status === "ok") this.joined = true;
          else console.warn(tag + ": join refused", m.payload);
          return;
        }
        if(m.event === "phx_error" || m.event === "phx_close"){ this.joined = false; return; }
        if(m.event === "broadcast" && m.payload && this.onMsg){
          try{ this.onMsg(m.payload.event, m.payload.payload); }catch(e){ console.warn(tag + ": bad msg", e); }
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
      return this._send({ topic: this.topic, event: "broadcast",
        payload: { type:"broadcast", event, payload } });
    },
    close(){
      this.wanted = false; this.joined = false; this._clearHb();
      if(this.reTimer){ clearTimeout(this.reTimer); this.reTimer = null; }
      if(this.ws){ try{ this.ws.close(); }catch(e){} this.ws = null; }
      this.onMsg = null;
    },
  };
}
