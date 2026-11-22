// Aurum Heist — shots.js
// Staged scenes for the screenshots: real game states, built from the same
// createGame/startLevel the player gets, then posed — the thief mid-room,
// guards on patrol, a camera sweeping, the alarm climbing — and settled with
// a few ticks of the real update so every cone and meter is the game's own
// state, not a drawing made for the picture. The browser stages the same
// scenes from ?shot=<name>.

import { TILE } from './config.js';
import { createGame, startLevel, updateGame } from './main.js';

function settle(state, seconds) {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) updateGame(state, 1 / 60);
}

function placePlayer(state, tx, ty, angle) {
  state.player.x = tx * TILE + TILE / 2;
  state.player.y = ty * TILE + TILE / 2;
  state.player.angle = angle;
}

function takeLoot(state, n) {
  for (let i = 0; i < n && i < state.loot.length; i++) {
    state.loot[i].taken = true;
    state.score += state.loot[i].value;
  }
  state.lootTaken = Math.min(n, state.loot.length);
  state.exitOpen = state.lootTaken === state.loot.length;
}

function setGuardPose(state, index, tx, ty, angle, mode, suspicion) {
  const g = state.guards[index];
  if (!g) return;
  g.x = tx * TILE + TILE / 2;
  g.y = ty * TILE + TILE / 2;
  g.angle = angle;
  g.mode = mode;
  g.suspicion = suspicion;
  g.pauseT = 2;
}

export function stageShot(name) {
  if (name === 'cover') {
    const state = createGame();
    startLevel(state, 0);
    state.mode = 'playing';
    placePlayer(state, 12, 9, -Math.PI / 2);
    takeLoot(state, 1);
    setGuardPose(state, 0, 20, 6, Math.PI * 0.75, 'patrol', 35);
    setGuardPose(state, 1, 22, 13, -Math.PI * 0.25, 'patrol', 0);
    state.cameras[0].phase = 0.9;
    state.alarm = 38;
    state.score = 100;
    state.time = 74;
    state.hint = 'Two cones sweeping the floor — wait for the gap, then move.';
    state.hintT = 10;
    settle(state, 0.4);
    state.hintT = 10;
    return state;
  }
  if (name === 'gallery') {
    const state = createGame();
    startLevel(state, 1);
    state.mode = 'playing';
    placePlayer(state, 4, 5, 0);
    takeLoot(state, 2);
    setGuardPose(state, 0, 25, 5, Math.PI, 'patrol', 20);
    setGuardPose(state, 1, 24, 14, -Math.PI / 2, 'investigate', 65);
    setGuardPose(state, 2, 10, 14, Math.PI / 2, 'patrol', 0);
    state.cameras[0].phase = 2.1;
    state.cameras[1].phase = 0.6;
    state.alarm = 52;
    state.score = 450;
    state.time = 168;
    state.coins = 4;
    state.smoke = 2;
    state.hint = 'The middle guard is coming to look — slip into the vent.';
    state.hintT = 10;
    settle(state, 0.4);
    state.hintT = 10;
    return state;
  }
  if (name === 'alarm') {
    const state = createGame();
    startLevel(state, 1);
    state.mode = 'playing';
    placePlayer(state, 15, 9, Math.PI);
    takeLoot(state, 2);
    setGuardPose(state, 0, 13, 9, 0, 'chase', 100);
    setGuardPose(state, 1, 20, 12, Math.PI * 0.75, 'chase', 100);
    setGuardPose(state, 2, 10, 16, -Math.PI / 2, 'investigate', 80);
    state.smokes.push({ x: 15 * TILE + TILE / 2, y: 10 * TILE + TILE / 2, r: 78, t: 5 });
    state.cameras[0].phase = 1.2;
    state.cameras[1].phase = 2.6;
    state.alarm = 96;
    state.alarms = 1;
    state.score = 450;
    state.time = 201;
    state.smoke = 1;
    state.hint = 'FULL ALARM — break line of sight and get to shadow!';
    state.hintT = 10;
    settle(state, 0.25);
    state.alarm = 96;
    state.hintT = 10;
    return state;
  }
  if (name === 'getaway') {
    const state = createGame();
    startLevel(state, 2);
    state.mode = 'playing';
    placePlayer(state, 24, 17, Math.PI / 2);
    takeLoot(state, 5);
    setGuardPose(state, 0, 26, 5, Math.PI * 0.5, 'patrol', 0);
    setGuardPose(state, 1, 26, 14, -Math.PI * 0.5, 'patrol', 0);
    setGuardPose(state, 2, 10, 10, 0, 'patrol', 0);
    state.cameras[0].phase = 0.4;
    state.cameras[1].phase = 1.8;
    state.cameras[2].phase = 2.9;
    state.cameras[2].disabledT = 8;
    state.alarm = 18;
    state.score = 1450;
    state.time = 312;
    state.coins = 3;
    state.hint = 'The Aurum Diamond is yours. The green door is open — go!';
    state.hintT = 10;
    settle(state, 0.4);
    state.hintT = 10;
    return state;
  }
  return null;
}

export const SHOT_NAMES = ['cover', 'gallery', 'alarm', 'getaway'];
