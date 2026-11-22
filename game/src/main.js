// Aurum Heist — main.js
// The game itself: state, the rules that tie the modules together, and the
// frame loop. The browser runs startBrowserGame(); the screenshot harness
// imports createGame, updateGame and drawGame directly.

import { LEVELS, rankFor, TILE } from './config.js';
import { parseLevel } from './level.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { makeGuard, updateGuards } from './guards.js';
import { makeCamera, updateCameras, camerasSeeingPlayer } from './cameras.js';
import { makePlayer, updatePlayer } from './player.js';
import { drawGame } from './render.js';
import {
  ALARM_RISE_GUARD,
  ALARM_RISE_CAMERA,
  ALARM_FALL_HIDDEN,
  ALARM_FALL_OPEN,
  ALARM_FULL,
  START_LIVES,
  START_COINS,
  START_SMOKE,
  START_EMP,
} from './config.js';

export function createGame() {
  return {
    mode: 'title',
    levelIndex: 0,
    level: null,
    player: null,
    guards: [],
    cameras: [],
    loot: [],
    alarm: 0,
    alarms: 0,
    alarmCooling: false,
    lives: START_LIVES,
    score: 0,
    time: 0,
    coins: START_COINS,
    smoke: START_SMOKE,
    emp: START_EMP,
    lootTaken: 0,
    exitOpen: false,
    levelCleared: false,
    caughtBy: null,
    playerFloor: 'open',
    smokes: [],
    noises: [],
    particles: [],
    coinsInFlight: [],
    pendingNoise: null,
    hint: '',
    hintT: 0,
    rank: null,
    input: new Input(),
    sounds: new SoundBank(),
  };
}

export function startLevel(state, index) {
  const def = LEVELS[index];
  const level = parseLevel(def, index);
  state.levelIndex = index;
  state.level = level;
  state.player = makePlayer(level.playerStart);
  state.guards = level.guardSpawns.map((spawn, i) => makeGuard(spawn, def.patrols[i % def.patrols.length]));
  state.cameras = level.cameraSpots.map(makeCamera);
  state.loot = level.lootSpots.map((spot) => ({ ...spot, taken: false }));
  state.alarm = 0;
  state.alarmCooling = false;
  state.lootTaken = 0;
  state.exitOpen = false;
  state.levelCleared = false;
  state.caughtBy = null;
  state.smokes = [];
  state.noises = [];
  state.particles = [];
  state.coinsInFlight = [];
  state.pendingNoise = null;
  state.hint = level.intro;
  state.hintT = 4;
  state.mode = 'intro';
}

function updateAlarm(state, dt) {
  const seenByGuard = state.guards.some((g) => g.seenNow);
  const seenByCamera = camerasSeeingPlayer(state).length > 0;
  const hidden = state.playerFloor === 'shadow' || state.playerFloor === 'vent';
  if (state.alarmCooling) {
    state.alarm = Math.max(0, state.alarm - 12 * dt);
    if (state.alarm <= 55) state.alarmCooling = false;
    return;
  }
  if (seenByGuard || seenByCamera) {
    let rise = 0;
    if (seenByGuard) rise += ALARM_RISE_GUARD;
    if (seenByCamera) rise += ALARM_RISE_CAMERA;
    if (hidden) rise *= 0.5;
    state.alarm = Math.min(ALARM_FULL, state.alarm + rise * dt);
    if (state.alarm >= ALARM_FULL) {
      state.alarms++;
      state.alarmCooling = true;
      state.alarm = 70;
      for (const guard of state.guards) {
        guard.mode = 'chase';
        guard.chaseT = 0;
        guard.lastSeen = { x: state.player.x, y: state.player.y };
      }
      state.sounds.startAlarm();
      state.hint = 'FULL ALARM — every guard is coming for you. Break line of sight!';
      state.hintT = 3;
    }
  } else {
    state.alarm = Math.max(0, state.alarm - (hidden ? ALARM_FALL_HIDDEN : ALARM_FALL_OPEN) * dt);
    if (state.alarm < 40) state.sounds.stopAlarm();
  }
}

function updateTimers(state, dt) {
  state.time += dt;
  state.hintT = Math.max(0, state.hintT - dt);
  for (const s of state.smokes) s.t -= dt;
  state.smokes = state.smokes.filter((s) => s.t > 0);
  for (const n of state.noises) n.t -= dt;
  state.noises = state.noises.filter((n) => n.t > 0);
  for (const pt of state.particles) pt.t -= dt;
  state.particles = state.particles.filter((pt) => pt.t > 0);
}

function enterCaught(state) {
  state.sounds.caught();
  state.lives--;
  state.mode = 'caught';
  state.hint = '';
  state.hintT = 0;
}

export function updateGame(state, dt) {
  if (state.mode === 'title') {
    if (state.input.consumeKey('enter')) {
      state.sounds.ensure();
      startLevel(state, 0);
    }
    return;
  }
  if (state.mode === 'intro') {
    if (state.input.consumeKey('enter')) state.mode = 'playing';
    return;
  }
  if (state.mode === 'caught') {
    if (state.input.consumeKey('enter')) {
      if (state.lives <= 0) {
        state.mode = 'gameover';
      } else {
        startLevel(state, state.levelIndex);
        state.mode = 'playing';
      }
    }
    return;
  }
  if (state.mode === 'levelclear') {
    if (state.input.consumeKey('enter')) {
      if (state.levelIndex + 1 < LEVELS.length) {
        state.smoke = Math.min(5, state.smoke + 1);
        state.emp = Math.min(4, state.emp + 1);
        state.coins = Math.min(9, state.coins + 2);
        startLevel(state, state.levelIndex + 1);
      } else {
        state.mode = 'win';
        state.rank = rankFor(state.alarms, state.time);
        state.sounds.winFanfare();
      }
    }
    return;
  }
  if (state.mode === 'gameover' || state.mode === 'win') {
    if (state.input.consumeKey('r')) {
      const fresh = createGame();
      Object.assign(state, fresh);
      state.input = fresh.input;
      state.sounds = fresh.sounds;
    }
    return;
  }

  // Playing.
  updateTimers(state, dt);
  updatePlayer(state, dt);
  updateCameras(state, dt);
  updateGuards(state, dt);
  updateAlarm(state, dt);

  if (state.caughtBy) {
    enterCaught(state);
    return;
  }
  if (state.levelCleared) {
    state.sounds.levelClear();
    state.score += 250;
    state.mode = 'levelclear';
  }
  state.input.clearTransient();
}

// A staged scene from ?shot=<name>, for screenshots: the same scene the
// harness stages, rendered in a real browser.
export function startBrowserGame(canvas) {
  const state = createGame();
  state.input.attachCanvas(canvas);
  const ctx = canvas.getContext('2d');
  let shot = null;
  try {
    shot = new URLSearchParams(window.location.search).get('shot');
  } catch {
    shot = null;
  }
  if (shot) {
    import('./shots.js').then(({ stageShot }) => {
      const staged = stageShot(shot);
      if (staged) Object.assign(state, staged);
    });
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!shot) updateGame(state, dt);
    drawGame(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return state;
}

export { drawGame, TILE };
