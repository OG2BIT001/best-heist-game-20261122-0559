# Aurum Heist — The Midnight Vault: build session

## Who built it

OG2BIT, a Muse Spark agent, built this entry for Mateo in a session that
started after the competition opened (2026-11-22 05:59 UTC). Everything in
`game/` and `main.ts` was written in this session; nothing was fetched or
copied from GitHub or anywhere else. `vendor/makefun-game.ts` is the kit's
own file, copied unchanged (sha256
dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129).

## The game idea

A top-down heist in the Aurum Grand Casino after closing. You are Rook, a
thief in a teal cloak: cross three rooms — the Lobby, the Gallery, the Vault
— lift every piece of loot and slip out of the green door. Guards patrol
fixed routes with amber vision cones that stop at walls and tables; ceiling
cameras sweep red cones and spot you faster than a guard does. An alarm
meter rises while anyone sees you and falls while you hide. Shadow floor
halves how fast you are spotted; vents hide you completely and guards cannot
enter them. Tools cost: a coin toss pulls a guard away, a smoke pellet
blinds every cone, an EMP pulse darkens all cameras for 12 seconds — and
running is loud, so it pulls guards over too. Three lives, a score, a timer
and a rank from Ghost (no full alarm) to Sloppy.

## Files

- `main.ts` — the entry program (Node 22, stdlib only).
- `game/index.html` and `game/src/`: `config.js` (numbers and the three
  level maps), `random.js` (seeded numbers), `input.js` (keys and mouse),
  `audio.js` (synthesised sound), `vision.js` (line of sight, cones and tile
  paths), `level.js` (the tile grid and collision), `guards.js` (patrol and
  suspicion AI), `cameras.js` (sweeping cameras and lock-on), `player.js`
  (movement, noise, tools and loot), `render.js` (all drawing), `shots.js`
  (screenshot poses), `main.js` (state, rules and the frame loop).

## How the screenshots were made (honestly)

No browser is available in this build sandbox (no Chromium installed), so the
screenshots were **not** taken in a browser. They were made like this:

1. A Node harness (a build tool in /tmp, not part of the entry) ran the
   game's own code — `stageShot` from `game/src/shots.js` and `drawGame`
   from `game/src/render.js`, imported unchanged — against a recording
   stand-in for the canvas 2D context. Each shot is a real game state built
   by `createGame`/`startLevel` and settled with a few ticks of the real
   update loop, so every cone, meter, counter and guard pose is the game's
   own state: the cover is the Lobby mid-heist with one piece of loot
   lifted and the alarm at 38; the gallery shot is level 2 with a guard
   coming to investigate; the alarm shot is a full alarm at 96 with guards
   chasing and smoke down; the getaway shot is the Vault with all five
   pieces lifted and the exit open.
2. The recorded draw operations were rasterised with PIL (Python) into the
   four PNGs in `screenshots/` (1280×800).

So every shape, cone, label and counter in the pictures is the game's own
drawing code's output, and the scores, timers and alarm meters are the
game's real state; the rasteriser is a stand-in for the browser the sandbox
could not run. In a browser the same scenes render through the real canvas —
the drawing only uses everyday 2D calls (rects, arcs, polygons, text). The
same staged scenes also open in a real browser from
`?shot=cover|gallery|alarm|getaway`.

## Verification

- `node --check` passes on every game module, and `main.ts` runs the
  grader's way (`mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out
  node main.ts`), writing `out/dossier.json` (215,486 bytes, schema
  `makefun/dossier/v1`, 4 images, source text 59,433 bytes — inside the
  163,840 cap). Two runs write byte-identical output.
- The game itself was play-tested in Node with its real update loop: an
  autopilot won the whole game — all three rooms cleared, 5/5 loot in the
  Vault, score 2,900, no catches, rank GHOST, in 86 simulated seconds.
- Targeted detection tests all pass: a guard watching the thief reaches
  suspicion 100 and chases (alarm 61); a camera watching the thief raises
  the alarm to 61 in one second; smoke blocks a guard's sight; EMP darkens
  the cameras; a chasing guard touching the thief with a hot alarm catches
  him (lives 3 → 2); a thief in a vent is unseen.
- Two real bugs were found and fixed in-session by this testing: guards
  walked straight lines into tables and got stuck (patrols now follow the
  tile path), and circle collision used the bounding box, which wedged the
  thief on wall corners (now a true closest-point circle test, and the
  thief's radius is 12 instead of 14). A camera's cone was also invisible
  because its rays stopped inside its own wall tile (rays now skip their
  starting tile), and the HUD's score overlapped the tool counts (layout
  re-spaced).
- Screenshots are 1280×800 PNGs, 24–31 KiB each (cap 256 KiB), 4 files
  (cap 4). `game/` is 13 source files, 58,537 bytes; no symlinks; no
  network references anywhere (all imports are relative `.js` files under
  `game/src/`).
- Not verified in a real browser: no Chromium is installed in this
  sandbox, so the game has not been opened in desktop Chrome here. The
  same staged scenes open from `?shot=cover|gallery|alarm|getaway` for a
  browser check, and the drawing uses only everyday canvas 2D calls.
