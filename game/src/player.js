// Aurum Heist — player.js
// The thief: walking and running, noise, the coin toss, smoke pellets and
// the EMP, loot pickup and the exit. One file, one job: everything the
// player's own input does to the game state.

import {
  TILE,
  PLAYER_RADIUS,
  WALK_SPEED,
  RUN_SPEED,
  NOISE_RUN_RADIUS,
  NOISE_COIN_RADIUS,
  SMOKE_RADIUS,
  SMOKE_LIFETIME,
  EMP_LIFETIME,
} from './config.js';
import { moveCircle, floorKindAtPixel } from './level.js';

export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    angle: 0,
    running: false,
    moving: false,
    noiseT: 0,
    stepT: 0,
  };
}

// Guards within radius of a noise walk over to look at where it came from.
export function emitNoise(state, x, y, radius) {
  state.noises.push({ x, y, r: radius, t: 0.6 });
  for (const guard of state.guards) {
    if (guard.mode === 'chase') continue;
    if (Math.hypot(guard.x - x, guard.y - y) > radius) continue;
    guard.mode = 'investigate';
    guard.investigate = { x, y };
    guard.suspicion = Math.max(guard.suspicion, 55);
  }
}

function useSmoke(state) {
  if (state.smoke <= 0) return;
  state.smoke--;
  state.smokes.push({ x: state.player.x, y: state.player.y, r: SMOKE_RADIUS, t: SMOKE_LIFETIME });
  state.sounds.smokePop();
  state.hint = 'Smoke down — their cones cannot see through it.';
  state.hintT = 2.5;
}

function useEmp(state) {
  if (state.emp <= 0) return;
  state.emp--;
  for (const cam of state.cameras) cam.disabledT = EMP_LIFETIME;
  state.sounds.empZap();
  state.hint = 'EMP pulse — every camera is dark for 12 seconds.';
  state.hintT = 2.5;
}

function tossCoin(state, x, y) {
  if (state.coins <= 0) return;
  const p = state.player;
  const dx = x - p.x;
  const dy = y - p.y;
  if (Math.hypot(dx, dy) > 340) return;
  state.coins--;
  state.coinsInFlight.push({ x, y, t: 0 });
  state.sounds.coinToss();
  state.pendingNoise = { x, y, r: NOISE_COIN_RADIUS };
}

export function updatePlayer(state, dt) {
  const p = state.player;
  const input = state.input;
  const mv = input.moveVector();
  p.running = input.down('shift');
  p.moving = mv.x !== 0 || mv.y !== 0;
  const speed = p.running ? RUN_SPEED : WALK_SPEED;
  if (p.moving) {
    const moved = moveCircle(state.level, p, mv.x * speed * dt, mv.y * speed * dt, PLAYER_RADIUS);
    p.x = moved.x;
    p.y = moved.y;
    p.angle = Math.atan2(mv.y, mv.x);
    p.stepT -= dt;
    if (p.stepT <= 0) {
      p.stepT = p.running ? 0.24 : 0.38;
      state.sounds.footstep();
    }
    if (p.running) {
      p.noiseT -= dt;
      if (p.noiseT <= 0) {
        p.noiseT = 0.45;
        emitNoise(state, p.x, p.y, NOISE_RUN_RADIUS);
      }
    }
  }

  const click = input.consumeClick();
  if (click) tossCoin(state, click.x, click.y);
  if (input.consumeKey('1')) useSmoke(state);
  if (input.consumeKey('2')) useEmp(state);
  if (input.consumeKey('m')) state.sounds.toggleMute();

  // A tossed coin lands, clinks, and pulls the nearest guard over.
  for (const coin of state.coinsInFlight) coin.t += dt;
  state.coinsInFlight = state.coinsInFlight.filter((c) => {
    if (c.t >= 0.45) {
      emitNoise(state, c.x, c.y, NOISE_COIN_RADIUS);
      state.noises.push({ x: c.x, y: c.y, r: 16, t: 0.4 });
      return false;
    }
    return true;
  });

  // Loot: walk over it to lift it.
  for (const loot of state.loot) {
    if (loot.taken) continue;
    if (Math.hypot(p.x - loot.x, p.y - loot.y) < TILE * 0.7) {
      loot.taken = true;
      state.score += loot.value;
      state.lootTaken++;
      state.sounds.pickup();
      state.particles.push({ x: loot.x, y: loot.y, kind: 'sparkle', t: 0.7 });
      state.hint = state.lootTaken === state.loot.length
        ? 'That is everything. The green door is open — get out!'
        : `Lifted the ${loot.kind} (+${loot.value}). ${state.loot.length - state.lootTaken} left.`;
      state.hintT = 2.5;
    }
  }

  // The exit only opens once every piece of loot is lifted.
  state.exitOpen = state.lootTaken === state.loot.length;
  if (state.exitOpen && Math.hypot(p.x - state.level.exit.x, p.y - state.level.exit.y) < TILE * 0.8) {
    state.levelCleared = true;
  }

  // Where the thief stands decides how fast the alarm notices him.
  state.playerFloor = floorKindAtPixel(state.level, p.x, p.y);
}
