// Aurum Heist — guards.js
// The night staff: patrol routes, suspicion, investigation and chase. A
// guard who sees the thief grows suspicious; suspicious enough and he walks
// over to look; certain and he runs the thief down.

import {
  TILE,
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_INVESTIGATE_SPEED,
  GUARD_CONE_RANGE,
  GUARD_CONE_HALF_ANGLE,
} from './config.js';
import { canSee, findTilePath } from './vision.js';
import { moveCircle, floorKindAtPixel } from './level.js';

export function makeGuard(spawn, patrol) {
  return {
    x: spawn.x,
    y: spawn.y,
    angle: 0,
    patrol: patrol.map(([tx, ty]) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 })),
    wpIndex: 1 % patrol.length,
    mode: 'patrol',
    suspicion: 0,
    pauseT: 0,
    investigate: null,
    chaseT: 0,
    repathT: 0,
    path: null,
    pathIndex: 0,
    lastSeen: null,
    seenNow: false,
    stepT: 0,
  };
}

// True when this guard can see the thief right now.
export function guardSeesPlayer(state, guard) {
  const p = state.player;
  const inVent = floorKindAtPixel(state.level, p.x, p.y) === 'vent';
  return canSee(
    state.level,
    state.smokes,
    guard.x,
    guard.y,
    guard.angle,
    GUARD_CONE_HALF_ANGLE,
    GUARD_CONE_RANGE,
    p.x,
    p.y,
    inVent,
  );
}

function moveToward(state, guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  const moved = moveCircle(state.level, guard, nx - guard.x, ny - guard.y, 13);
  guard.x = moved.x;
  guard.y = moved.y;
  guard.angle = Math.atan2(dy, dx);
  guard.stepT -= dt;
  if (guard.stepT <= 0) {
    guard.stepT = 0.42;
    state.sounds.footstep();
  }
  return dist <= speed * dt + 2;
}

function followPath(state, guard, speed, dt) {
  if (!guard.path || guard.pathIndex >= guard.path.length) return true;
  const node = guard.path[guard.pathIndex];
  const px = node.x * TILE + TILE / 2;
  const py = node.y * TILE + TILE / 2;
  if (moveToward(state, guard, px, py, speed, dt)) guard.pathIndex++;
  return guard.pathIndex >= guard.path.length;
}

function repathTo(state, guard, tx, ty) {
  const fromTx = Math.floor(guard.x / TILE);
  const fromTy = Math.floor(guard.y / TILE);
  const path = findTilePath(state.level, fromTx, fromTy, Math.floor(tx / TILE), Math.floor(ty / TILE));
  guard.path = path;
  guard.pathIndex = 0;
  guard.repathT = 0.5;
}

export function updateGuards(state, dt) {
  const p = state.player;
  for (const guard of state.guards) {
    guard.seenNow = guardSeesPlayer(state, guard);
    if (guard.seenNow) {
      const dist = Math.hypot(p.x - guard.x, p.y - guard.y);
      const closeness = 1.6 - dist / GUARD_CONE_RANGE;
      const inShadow = floorKindAtPixel(state.level, p.x, p.y) === 'shadow';
      const rate = (inShadow ? 0.55 : 1) * Math.max(0.6, closeness);
      guard.suspicion = Math.min(100, guard.suspicion + 55 * rate * dt);
      guard.lastSeen = { x: p.x, y: p.y };
      if (guard.suspicion >= 100 && guard.mode !== 'chase') {
        guard.mode = 'chase';
        guard.chaseT = 0;
        state.sounds.spotted();
      } else if (guard.suspicion >= 60 && guard.mode === 'patrol') {
        guard.mode = 'investigate';
        guard.investigate = { ...guard.lastSeen };
        repathTo(state, guard, guard.investigate.x, guard.investigate.y);
      }
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - 14 * dt);
      if (guard.mode === 'chase') {
        guard.chaseT += dt;
        if (guard.chaseT > 2.5) {
          guard.mode = guard.lastSeen ? 'investigate' : 'patrol';
          guard.investigate = guard.lastSeen ? { ...guard.lastSeen } : null;
          if (guard.investigate) repathTo(state, guard, guard.investigate.x, guard.investigate.y);
        }
      }
    }

    if (guard.mode === 'patrol') {
      if (guard.pauseT > 0) {
        guard.pauseT -= dt;
        guard.angle += dt * 0.9;
      } else {
        // Patrol legs are walked along the tile path, so a guard routes
        // around tables and walls instead of pushing into them.
        if (!guard.path) {
          const wp = guard.patrol[guard.wpIndex];
          repathTo(state, guard, wp.x, wp.y);
        }
        if (followPath(state, guard, GUARD_PATROL_SPEED, dt)) {
          guard.wpIndex = (guard.wpIndex + 1) % guard.patrol.length;
          guard.pauseT = 1.1;
          guard.path = null;
        }
      }
    } else if (guard.mode === 'investigate') {
      guard.repathT -= dt;
      if (guard.repathT <= 0 && guard.investigate) repathTo(state, guard, guard.investigate.x, guard.investigate.y);
      if (followPath(state, guard, GUARD_INVESTIGATE_SPEED, dt)) {
        guard.pauseT = 1.6;
        guard.mode = 'patrol';
        guard.investigate = null;
        guard.path = null;
      }
    } else if (guard.mode === 'chase') {
      guard.repathT -= dt;
      if (guard.repathT <= 0) repathTo(state, guard, p.x, p.y);
      followPath(state, guard, GUARD_CHASE_SPEED, dt);
      // Close enough to grab the thief while the alarm is hot: caught.
      if (Math.hypot(p.x - guard.x, p.y - guard.y) < 26 && state.alarm >= 50) {
        state.caughtBy = 'guard';
      }
    }
  }
}
