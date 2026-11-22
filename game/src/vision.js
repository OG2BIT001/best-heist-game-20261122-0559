// Aurum Heist — vision.js
// Line of sight and vision cones: who can see whom, and the polygon a cone
// paints on the floor. A wall, a table or a smoke cloud blocks sight; a vent
// hides the thief outright.

import { TILE } from './config.js';
import { blocksSightAtPixel, guardWalkable } from './level.js';

// True when the straight line from (x0, y0) to (x1, y1) crosses no tile that
// blocks sight. The tile the line starts in never blocks it, so a camera
// mounted on a wall tile can still see out of its own wall.
export function hasLineOfSight(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  const startTx = Math.floor(x0 / TILE);
  const startTy = Math.floor(y0 / TILE);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + dx * t;
    const y = y0 + dy * t;
    // The tile the ray starts in never blocks it, so a camera mounted on a
    // wall tile can still see out of its own wall.
    if (Math.floor(x / TILE) === startTx && Math.floor(y / TILE) === startTy) continue;
    if (blocksSightAtPixel(level, x, y)) return false;
  }
  return true;
}

// True when the segment crosses a smoke cloud.
export function crossesSmoke(smokes, x0, y0, x1, y1) {
  for (const s of smokes) {
    if (segmentHitsCircle(x0, y0, x1, y1, s.x, s.y, s.r)) return true;
  }
  return false;
}

function segmentHitsCircle(x0, y0, x1, y1, cx, cy, r) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(cx - x0, cy - y0) <= r;
  let t = ((cx - x0) * dx + (cy - y0) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = x0 + dx * t;
  const py = y0 + dy * t;
  return Math.hypot(cx - px, cy - py) <= r;
}

// How far a ray from (x, y) in direction `angle` travels before it hits a
// wall or runs out of range. Used to draw a cone that stops at the walls.
export function rayLength(level, x, y, angle, maxRange) {
  const step = 6;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const startTx = Math.floor(x / TILE);
  const startTy = Math.floor(y / TILE);
  for (let d = step; d <= maxRange; d += step) {
    const px = x + cos * d;
    const py = y + sin * d;
    // The tile the ray starts in never blocks it, so a camera mounted on a
    // wall tile can still see out of its own wall.
    if (Math.floor(px / TILE) === startTx && Math.floor(py / TILE) === startTy) continue;
    if (blocksSightAtPixel(level, px, py)) return d;
  }
  return maxRange;
}

// The cone's outline as a list of points, for drawing: the observer, then
// one point per ray fanning from one edge of the cone to the other.
export function conePolygon(level, x, y, angle, halfAngle, range, rays = 26) {
  const pts = [{ x, y }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const len = rayLength(level, x, y, a, range);
    pts.push({ x: x + Math.cos(a) * len, y: y + Math.sin(a) * len });
  }
  return pts;
}

// Whether an observer at (ox, oy) facing `angle` can see a target at
// (tx, ty): inside the cone's angle and range, with a clear line of sight,
// and not hidden by smoke or a vent.
export function canSee(level, smokes, ox, oy, angle, halfAngle, range, tx, ty, targetInVent) {
  if (targetInVent) return false;
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist > 1) {
    let diff = Math.atan2(dy, dx) - angle;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    if (Math.abs(diff) > halfAngle) return false;
  }
  if (crossesSmoke(smokes, ox, oy, tx, ty)) return false;
  return hasLineOfSight(level, ox, oy, tx, ty);
}

// Shortest tile path (breadth-first) from one tile to another over tiles the
// guards may walk. Returns a list of tile centres, or null when unreachable.
export function findTilePath(level, fromTx, fromTy, toTx, toTy) {
  const key = (x, y) => `${x},${y}`;
  const start = key(fromTx, fromTy);
  const goal = key(toTx, toTy);
  if (start === goal) return [{ x: fromTx, y: fromTy }];
  const prev = new Map([[start, null]]);
  const queue = [[fromTx, fromTy]];
  while (queue.length > 0) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (!guardWalkable(level, nx, ny)) continue;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      prev.set(k, [x, y]);
      if (k === goal) {
        const path = [];
        let cur = [nx, ny];
        while (cur) {
          path.unshift({ x: cur[0], y: cur[1] });
          cur = prev.get(key(cur[0], cur[1]));
        }
        return path;
      }
      queue.push([nx, ny]);
    }
  }
  return null;
}
