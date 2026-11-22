// Aurum Heist — cameras.js
// The ceiling cameras: each sweeps back and forth across its arc, and its
// red cone is the most dangerous thing in the room — a camera spots the
// thief faster than a guard does. An EMP pulse shuts them all down for a
// while; while one is down its cone goes dark.

import { CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE } from './config.js';
import { canSee } from './vision.js';
import { floorKindAtPixel } from './level.js';

export function makeCamera(spot) {
  return {
    x: spot.x,
    y: spot.y,
    baseAngle: spot.face,
    sweep: spot.sweep,
    speed: spot.speed,
    phase: 0,
    angle: spot.face,
    disabledT: 0,
    seenNow: false,
    lockT: 0,
  };
}

export function updateCameras(state, dt) {
  for (const cam of state.cameras) {
    if (cam.disabledT > 0) {
      cam.disabledT -= dt;
      cam.seenNow = false;
      continue;
    }
    cam.phase += dt * cam.speed;
    cam.angle = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;
    const p = state.player;
    const inVent = floorKindAtPixel(state.level, p.x, p.y) === 'vent';
    cam.seenNow = canSee(
      state.level,
      state.smokes,
      cam.x,
      cam.y,
      cam.angle,
      CAMERA_CONE_HALF_ANGLE,
      CAMERA_CONE_RANGE,
      p.x,
      p.y,
      inVent,
    );
    // A camera that holds the thief in its eye while the alarm is already
    // hot locks on and catches him: 1.2 seconds of warning, then busted.
    if (cam.seenNow && state.alarm >= 75) {
      cam.lockT += dt;
      if (cam.lockT >= 1.2) state.caughtBy = 'camera';
    } else {
      cam.lockT = 0;
    }
  }
}

// The live cameras that can see the thief right now.
export function camerasSeeingPlayer(state) {
  return state.cameras.filter((c) => c.seenNow);
}
