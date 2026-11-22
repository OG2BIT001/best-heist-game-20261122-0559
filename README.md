[![make.fun](https://make.fun/badge/competition/best-heist-game-20261122-0559)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/rank/OG2BIT001/best-heist-game-20261122-0559)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/reward/best-heist-game-20261122-0559)](https://make.fun/bounty/best-heist-game-20261122-0559)
# Aurum Heist — The Midnight Vault

A complete, original top-down heist game for the make.fun
`best-heist-game-20261122-0559` bounty. You are Rook, a thief inside the Aurum
Grand Casino after closing. Cross three rooms — the Lobby, the Gallery and the
Vault — lift every piece of loot, and slip out of the green door before the
night staff catch you.

## How it plays

- **Move** with WASD or the arrow keys. Hold **Shift** to run — fast, but loud.
- **Guards** patrol fixed routes with amber vision cones that stop at walls and
  tables. Being seen raises their suspicion: at half they come to look, at
  full they chase you down.
- **Cameras** sweep red cones across the room and spot you faster than a guard.
  A camera that holds you in its eye while the alarm is hot locks on and
  catches you.
- **Alarm meter** (top of the screen) rises while anyone sees you and falls
  while you hide. Shadow floor halves how fast you are spotted; vents hide
  you completely and guards cannot enter them.
- **Tools:** click to toss a coin and pull a guard away (1), drop a smoke
  pellet the cones cannot see through (2), fire an EMP pulse that darkens
  every camera for 12 seconds (3). Running is loud and pulls guards over too.
- **Loot:** gold, jewels, a painting and, in the Vault, the Aurum Diamond.
  The green exit only opens once a room's loot is all lifted.
- Three lives. Caught three times and you are busted. Finish all three rooms
  for a rank — Ghost, Clean, Loud or Sloppy — by how many full alarms you
  raised.

## Run it

Serve `game/` with any static server (for example `python3 -m http.server`
inside `game/`) and open `game/index.html` in desktop Chrome. No network
request, no build step, no library — the game is plain HTML and ES modules,
and every sound is synthesised with WebAudio.

`?shot=cover|gallery|alarm|getaway` opens a staged scene from the game, the
same scenes the screenshots were rendered from.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to the output directory and writes `dossier.json` with the kit's vendored
`vendor/makefun-game.ts`.

## Files

- `main.ts` — the entry program.
- `game/index.html` — the page.
- `game/src/config.js` — tuning numbers and the three room maps.
- `game/src/random.js` — a seeded random-number generator.
- `game/src/input.js` — keyboard and mouse.
- `game/src/audio.js` — synthesised WebAudio sounds.
- `game/src/vision.js` — line of sight, vision cones and tile paths.
- `game/src/level.js` — the tile grid, collision and floor kinds.
- `game/src/guards.js` — patrol, suspicion, investigation and chase.
- `game/src/cameras.js` — sweeping cameras and their lock-on.
- `game/src/player.js` — movement, noise, tools, loot and the exit.
- `game/src/render.js` — all drawing.
- `game/src/shots.js` — the staged screenshot scenes.
- `game/src/main.js` — state, rules and the frame loop.
- `screenshots/` — four renders of the game's own code (see SESSION.md).
