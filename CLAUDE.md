# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Nexstream Kansai Quest** — a single-page, no-build web app for a company trip to Kansai (28 Sep – 3 Oct 2026): a live Leaflet map of where colleagues are, a traveller's handbook, and a Party Games hub (scavenger hunt, landmark race, trivia, arcade). Plain HTML/CSS/JS with `<script>` tags. No npm, no bundler, no framework, no tests.

## Commands

```bash
# Serve locally — geolocation needs localhost or HTTPS, so file:// won't fully work
python3 -m http.server 8000     # then open http://localhost:8000

# The only "test" this repo has: syntax-check every inline block and module
node -e '
const fs=require("fs");
const h=fs.readFileSync("index.html","utf8");
const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;let m,i=0;
while((m=re.exec(h))){i++;try{new Function(m[1]);}catch(e){console.log("block",i,"ERR",e.message);}}
for(const f of fs.readdirSync(".").filter(f=>f.endsWith(".js"))){
 try{new Function(fs.readFileSync(f,"utf8"));}catch(e){console.log(f,"ERR",e.message);}}
console.log("checked",i,"inline blocks + js files");'
```

## Deploying — read this first

**This folder is not a git repo.** There is no `.git`, so `git status`/`git push` will fail. The live copy lives at:

- Repo: `Nexstream/Company-Trip-2026` (public, default branch `main`)
- Live site: https://nexstream.github.io/Company-Trip-2026/ — GitHub Pages, `main` branch, root path

Files were uploaded through the **GitHub Contents API** (`gh api`, or the GitHub MCP `create_or_update_file`), one file per commit — commits are authored by the API identity `68409883+JamesCyangOng@users.noreply.github.com`, not local git. To ship a change: edit locally, then push each changed file individually via the API with `main`'s current blob SHA. Verify what is out of sync by diffing local files against `gh api repos/Nexstream/Company-Trip-2026/contents/<file>` (base64 `.content`) before and after.

## Architecture

**One global scope, load order matters.** `index.html` holds all CSS, all markup, and a large inline `<script>` (~line 234–699) that defines everything the modules depend on: `sb()`, the `db` helpers, `me`, `players`, `esc()`, `haversine()`, `drawSprite()`, `SPOTS`, `DAYS`, the map, the handbook shell and the games shell. Modules load *after* it at the bottom of the file, each with a `?v=<stamp>` cache-buster — **bump that stamp on every deploy that touches a module**, or GitHub Pages and mobile Safari will keep serving the old file after `index.html` has updated, which looks exactly like the change never shipped. Load order:

```
art.js → checklist.js → handbook.js → game-hunt.js → game-race.js → game-trivia.js → game-arcade.js → game-sushi.js → chat.js
```

Nothing is a module in the ESM sense — every top-level `const`/`function` is a browser global.

**Game module contract.** The games shell (`gameShowTab`) looks up four functions on `window` by name and tolerates missing ones:

| Function | When it runs |
|---|---|
| `render<Name>()` | returns the tab's HTML string |
| `init<Name>()` | after the HTML is injected — wire events here |
| `tick<Name>()` | every 5s while the overlay is open |
| `stop<Name>()` | on tab switch or overlay close — clear timers/rAF here |

`<Name>` comes from `GAME_TABS` (`Hunt`, `Race`, `Trivia`, `Arcade`). **Every other top-level name in a module must be prefixed** — `hunt*`/`HUNT_`, `race*`/`RACE_`, `trivia*`/`TRIVIA_`, `arcade*`/`ARCADE_`/`DEER_`, `ck*` — because there is no scope isolation. Adding a game means: new `game-*.js`, a `<script>` tag, and a `GAME_TABS` entry.

**Hunt claims need a photo, shot in Japan.** `CLAIM 📷` opens one shared hidden `<input type="file" accept="image/*" capture="environment">` — `capture` goes straight to the camera, so a picture from the camera roll (or from last year) cannot be passed off as proof. The button is also gated by `huntWhereAmI()`: a live GPS fix, no older than 10 minutes, inside the `HUNT_JAPAN` bounding box. A manual PIN explicitly does **not** count — it is self-declared, which would make the check pointless — so unlike `raceInRange()` the hunt does not honour `me.manual`. The reason is shown up front in the `#huntGeoNote` banner rather than only on tap, and re-checked when the shot comes back, since the camera can sit open for a while. The fix that let a claim through is written to the row's `lat`/`lng`. Note this makes claiming untestable outside Japan by design. The input is visually hidden but **laid out** — Safari will not open a picker for a programmatic `.click()` on a `display:none` input. It writes the claim through `huntClaim(ch, file)` rather than directly; `huntClaim(ch, file)` then shrinks, uploads and only writes the row once it has a URL, so a failed upload never leaves a proofless claim. Every claimant's proof shows as a thumbnail strip on the card, tap for a full-size lightbox appended to `<body>` (it has to clear the `z-index:900` games overlay). Thumbnails render with an empty `src` and a `data-path`; `huntSignProofs()` runs after each wire-up, batch-signs whatever is still blank in one request and fills the URLs in, caching them in `huntSigned` until a minute before expiry — otherwise the 5s `tickHunt()` re-render would re-sign every photo on screen every tick. Race claims are GPS-verified and take no photo.

**Handbook** renders through `TABS[].render()`; the five render functions live in `handbook.js` (`renderTips`, `renderMust`, `renderStay`, `renderPack`) except `renderItin` which is inline in index.html. `renderBook()` also calls `ckOnPackShown()` when the Pack tab is shown, which is how `checklist.js` hooks in.

**Party chat** lives in `chat.js` (`chat*`/`CHAT_` prefixes). It polls `chat_messages` every 3s like reactions do and pops every incoming message twice: a speech balloon above the speaker's map marker (a throwaway Leaflet `divIcon` marker, same trick as `popReaction`) and a toast in `#chatPops` — a `position:fixed`, `z-index:1200` stack outside `#game`, so a message still shows while the games or handbook overlay is open. `chatStart()` is called from `startGame()`; because auto-rejoin runs before `chat.js` loads, the module also self-starts at the bottom of the file if `#game` is already `.on`. Sends are optimistic and reconciled when the row comes back from the server (`chatSettleMine`); a failed send stays in the log with a tap-to-retry line.

**Chats and reactions echo in the NEARBY tray.** `trayEchoSay()` / `trayEchoReact()` (inline, beside `renderTray()`) stamp a short-lived `trayEcho[player_id]` entry that `renderTray()` paints as a `.echo` bubble on the speaker's card — 8s for a chat line, 4s for a reaction. It is absolutely positioned over the card's distance line, so the tray never changes height mid-message and `--trayh` stays put. The hooks are `popReaction()` (fires before the map guard, so a card still echoes when there is no fix) and, in `chat.js`, `chatPop()` for incoming plus `chatSend()` for your own line — `chatSettleMine()` deliberately has none, or your own message would echo twice. Because an echo re-renders the tray, `renderTray()` saves and restores `#cards`' `scrollLeft`.

**Overlay chrome is measured, not hardcoded.** `trackChrome()` (inline, called from `startGame()`) publishes the live heights of `#hud` and `#tray` as the `--hudh` / `--trayh` CSS vars on `:root`, via a `ResizeObserver` plus `resize`/`orientationchange`/`document.fonts.ready`. `#status` sits at `top:calc(var(--hudh) + 8px)` and `#sidebtns`/`#emojiPanel`/`#chatPanel` at `bottom:calc(var(--trayh) + 10px)`. Use those vars for anything new anchored to the top or bottom of the map — a fixed offset breaks as soon as the HUD wraps to two or three rows on a narrow phone, which is what used to bury the Games and Handbook buttons under the status box.

**Pixel art** is defined as arrays of character rows mapped through a palette (`ART_PAL`, `ICON_PAL`), rasterised to canvas once at load and cached as data URLs. `art('key', size)` returns an `<img>`; `ICON_URL[...]` holds the 8×8 map/itinerary icons. To add art, add rows to `ART16` in art.js — no image files.

## Data layer (Supabase PostgREST)

All persistence goes through `sb(path, opts)` in index.html — raw REST against `/rest/v1/`, with the project URL and **anon key hardcoded in index.html**. RLS is deliberately open to `anon` for every table: anyone with the link can read and write. That is an accepted tradeoff for a private trip game — do not store anything sensitive.

**`sb()` returns `null` for empty response bodies.** Writes send `Prefer: return=minimal`, which PostgREST answers with 201/204 and no body. Write code must not expect JSON back. (An earlier version only special-cased 204 and called `r.json()` on 201's empty body, throwing `JSON.parse: unexpected end of data` — which made optimistic UI updates roll back even though the row was saved.) `sb()` still throws on any non-OK status, which is what the offline/rollback paths in the game modules key off.

Tables (see `supabase-setup.sql`):

- **`players`** — one upsert-by-`id` row per person; position pushed every 30s, all players pulled every 6s. Rows older than `STALE_MS` (3h) are filtered out client-side.
- **`reactions`** — append-only emoji pops, polled every 3s, no client update/delete.
- **`quest_claims`** — shared by four features, split by `kind`: `'hunt'`, `'race'`, `'pack'` (the personal pack checklist, only ever queried filtered to your own `player_id`). Unique on `(player_id, kind, target)`, so writes are upserts with `?on_conflict=player_id,kind,target` + `Prefer: resolution=merge-duplicates`. `proof_path`, `lat` and `lng` are set by hunt claims only; they are null on race and pack rows and on hunt claims made before photo proof existed.
- **`trivia_answers`** — unique on `(player_id, q_id)`; one active question per 30min derived from the clock, not from server state.
- **`arcade_scores`** — append-only (`game='deerdash'`); anon has select+insert only.
- **`chat_messages`** — append-only party chat, polled every 3s by `chat.js`; anon has select+insert only, with a `char_length(body) between 1 and 240` check. `lat`/`lng` are captured at send time so the map balloon can be placed even if the sender has since moved.

**Storage.** One **private** bucket, `proofs`, holds the scavenger-hunt photos under `hunt/<challenge>/<player>-<ts>.jpg`. Anon may insert and select, never update or delete, so a proof cannot be swapped out once posted. Uploads do **not** go through `sb()` — Storage is a different API — they use `sbUpload(bucket, path, blob)`, which returns the **object path**; `sbSign(bucket, paths, ttl)` batch-mints 1-hour signed URLs for reading. Both are in index.html. Pair uploads with `shrinkImage(file)`, which canvas-downscales a phone photo to a 1280px JPEG (a 3000×2000 shot lands around 50 KB); a raw 8 MB camera file would otherwise blow past the bucket's 5 MB ceiling. Unclaiming deletes the row but leaves the file — anon has no delete on storage, so orphans are expected.

Private is a leak-limiter, not a security boundary: the repo is public and the anon key ships in index.html, so anyone who goes looking can mint their own signed URLs. What it buys is that a proof URL which is forwarded, scraped or indexed stops working within the hour. Only real auth would make the photos genuinely private, and that would cost the "open the link, type your name" join flow.

The `chat_messages` migration is recorded separately in `supabase-chat.sql` (applied 2026-09-08) and the proof bucket in `supabase-proofs.sql` (applied 2026-09-08); `supabase-setup.sql` is not checked into the repo.

`supabase-setup.sql` is a **record of migrations already applied** to project `afxsoxexfahehhjijzlr`, not a script to run against a live DB. When you add a table or column, apply it as a migration and then append the SQL there with the same `-- Migration N: name (applied <date>)` comment style.

## Identity and state

There are no accounts. `me` is `{id, name, av, lat, lng, emoji, ...}` with a random `id` generated once and persisted to `localStorage` under `kansai-quest-me`; on reload, a saved name auto-rejoins via `startGame(true)`. Arcade personal bests are also localStorage-only. Everything else is keyed by that `player_id` server-side, so "your" ticks and claims follow the saved id across sessions but not across cleared storage.

The pack checklist mirrors its state to `localStorage` under `kansai-quest-pack` as `{id, done[], pending[]}`, stamped with the `me.id` it belongs to and ignored if that no longer matches. A tick is applied to `ckDone` immediately and queued in `ckPending` until the server confirms it; a failed write keeps the tick and stays queued, retried by `ckFlush()` on the next Pack-tab open or the banner's "Retry now". `ckFetch()` replays the queue over the server's rows, so pending local edits win. This is the only feature that writes to `quest_claims` optimistically without rolling back.
