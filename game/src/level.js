// Aurum Heist — level.js
// The tile grid: parsing a level map into walls, loot, exits and spawns, and
// answering "can this thing stand here" for the player, the guards and sight.
//
// A row that comes up one character short is padded with floor before its
// closing wall, so a hand-typed map never shifts the right-hand wall.

import { TILE, COLS, ROWS, LOOT_VALUES } from './config.js';

const SIGHT_BLOCKERS = new Set(['#', 'T', 'c']);
const MOVE_BLOCKERS = new Set(['#', 'T', 'c']);

function normaliseRow(row) {
  let r = row;
  while (r.length < COLS) {
    r = r.endsWith('#') ? `${r.slice(0, -1)}.#` : `${r}.`;
  }
  return r.slice(0, COLS);
}

export function parseLevel(def, index) {
  const rows = def.map.map(normaliseRow);
  while (rows.length < ROWS) rows.push('#'.repeat(COLS));
  const level = {
    index,
    name: def.name,
    intro: def.intro,
    grid: rows.map((r) => r.split('')),
    playerStart: { x: TILE * 1.5, y: TILE * 1.5 },
    exit: { x: 0, y: 0 },
    lootSpots: [],
    guardSpawns: [],
    cameraSpots: [],
  };
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = level.grid[y][x];
      const cx = x * TILE + TILE / 2;
      const cy = y * TILE + TILE / 2;
      if (ch === 'P') level.playerStart = { x: cx, y: cy };
      else if (ch === 'E') level.exit = { x: cx, y: cy };
      else if (ch === 'L') level.lootSpots.push({ x: cx, y: cy, tile: [x, y] });
      else if (ch === 'g') level.guardSpawns.push({ x: cx, y: cy, tile: [x, y] });
    }
  }
  level.lootSpots.forEach((spot, i) => {
    spot.kind = def.lootKinds[i % def.lootKinds.length];
    spot.value = LOOT_VALUES[spot.kind];
  });
  for (const cam of def.cameras) {
    const [tx, ty] = cam.tile;
    level.cameraSpots.push({
      x: tx * TILE + TILE / 2,
      y: ty * TILE + TILE / 2,
      face: cam.face,
      sweep: cam.sweep,
      speed: cam.speed,
    });
  }
  return level;
}

export function tileAt(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
  return level.grid[ty][tx];
}

export function tileAtPixel(level, x, y) {
  return tileAt(level, Math.floor(x / TILE), Math.floor(y / TILE));
}

// Whether a tile blocks sight (walls, tables, camera mounts).
export function blocksSight(level, tx, ty) {
  return SIGHT_BLOCKERS.has(tileAt(level, tx, ty));
}

// Whether a tile blocks sight at a pixel position. The tile the ray starts
// in never blocks it: a camera on a wall tile can see out of its own wall.
export function blocksSightAtPixel(level, x, y) {
  return SIGHT_BLOCKERS.has(tileAtPixel(level, x, y));
}

// Whether the thief can stand on a tile: floor, carpet, shadow, vent, loot
// and the exit. Guards share this, except they never enter vents.
export function walkable(level, tx, ty) {
  return !MOVE_BLOCKERS.has(tileAt(level, tx, ty));
}

export function guardWalkable(level, tx, ty) {
  const ch = tileAt(level, tx, ty);
  return !MOVE_BLOCKERS.has(ch) && ch !== 'v';
}

// Whether the thief is standing on shadow floor (half as easy to spot) or in
// a vent (unseen by guards and cameras alike).
export function floorKindAtPixel(level, x, y) {
  const ch = tileAtPixel(level, x, y);
  if (ch === 's') return 'shadow';
  if (ch === 'v') return 'vent';
  return 'open';
}

// True when a circle at (x, y) with this radius touches a tile: the
// closest point of the tile's rectangle to the centre decides, so a circle
// sliding past a wall's corner is never wedged by the tile's bounding box.
function circleHitsTile(x, y, radius, tx, ty) {
  const rx = tx * TILE;
  const ry = ty * TILE;
  const cx = Math.max(rx, Math.min(x, rx + TILE));
  const cy = Math.max(ry, Math.min(y, ry + TILE));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < radius * radius;
}

// Circle-versus-tile collision: try the move on one axis at a time so the
// thief slides along walls instead of sticking to them.
export function moveCircle(level, pos, dx, dy, radius) {
  const tryAxis = (nx, ny) => {
    const minTx = Math.floor((nx - radius) / TILE);
    const maxTx = Math.floor((nx + radius) / TILE);
    const minTy = Math.floor((ny - radius) / TILE);
    const maxTy = Math.floor((ny + radius) / TILE);
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (!walkable(level, tx, ty) && circleHitsTile(nx, ny, radius, tx, ty)) return false;
      }
    }
    return true;
  };
  let { x, y } = pos;
  if (dx !== 0 && tryAxis(x + dx, y)) x += dx;
  if (dy !== 0 && tryAxis(x, y + dy)) y += dy;
  return { x, y };
}
