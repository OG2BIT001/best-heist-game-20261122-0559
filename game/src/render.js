// Aurum Heist — render.js
// All drawing, and nothing else: the room, the cones, the thief, the guards,
// the loot, the alarm meter and the screens between runs. It uses only plain
// canvas 2D calls (fills, arcs, polygons, text) so the same code renders in a
// browser and in the screenshot harness.

import {
  TILE,
  VIEW_W,
  VIEW_H,
  COLS,
  ROWS,
  GUARD_CONE_RANGE,
  GUARD_CONE_HALF_ANGLE,
  CAMERA_CONE_RANGE,
  CAMERA_CONE_HALF_ANGLE,
} from './config.js';
import { conePolygon } from './vision.js';
import { tileAt } from './level.js';

const INK = '#e8e4d8';
const DIM = '#9aa3b2';
const GOLD = '#f2c14e';
const TEAL = '#2dd4bf';
const AMBER = '#ffb020';
const RED = '#ff4d4d';

function drawCone(ctx, level, x, y, angle, halfAngle, range, color, edge) {
  const pts = conePolygon(level, x, y, angle, halfAngle, range);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawFloor(ctx, level) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = tileAt(level, x, y);
      const px = x * TILE;
      const py = y * TILE;
      if (ch === '#') continue;
      if (ch === ',') {
        ctx.fillStyle = '#5a1f28';
      } else if (ch === 's') {
        ctx.fillStyle = '#12161f';
      } else if (ch === 'v') {
        ctx.fillStyle = '#0d1117';
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#232a3a' : '#202636';
      }
      ctx.fillRect(px, py, TILE, TILE);
      if (ch === ',') {
        ctx.strokeStyle = '#7a5a22';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
      }
      if (ch === 'v') {
        ctx.fillStyle = '#2a3140';
        for (let i = 0; i < 3; i++) ctx.fillRect(px + 6, py + 9 + i * 9, TILE - 12, 4);
      }
    }
  }
}

function drawWallsAndTables(ctx, level) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = tileAt(level, x, y);
      const px = x * TILE;
      const py = y * TILE;
      if (ch === '#') {
        ctx.fillStyle = '#10141f';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#2c3550';
        ctx.fillRect(px, py, TILE, 3);
      } else if (ch === 'T') {
        ctx.fillStyle = '#3a2c1c';
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = '#6b4f2a';
        ctx.fillRect(px + 5, py + 5, TILE - 10, TILE - 10);
        ctx.fillStyle = '#8a6a35';
        ctx.fillRect(px + 9, py + 9, TILE - 18, TILE - 18);
      }
    }
  }
}

function drawLoot(ctx, loot) {
  if (loot.taken) return;
  const { x, y, kind } = loot;
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'gold') {
    ctx.fillStyle = '#8a6a1f';
    ctx.fillRect(-11, -4, 22, 9);
    ctx.fillStyle = GOLD;
    ctx.fillRect(-11, -8, 22, 6);
    ctx.fillStyle = '#ffe08a';
    ctx.fillRect(-8, -8, 5, 6);
  } else if (kind === 'jewel') {
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#cffafe';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'painting') {
    ctx.fillStyle = '#7a5a22';
    ctx.fillRect(-14, -11, 28, 22);
    ctx.fillStyle = '#c2703d';
    ctx.fillRect(-11, -8, 22, 16);
    ctx.fillStyle = '#2dd4bf';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(11, -3);
    ctx.lineTo(7, 11);
    ctx.lineTo(-7, 11);
    ctx.lineTo(-11, -3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawExit(ctx, level, open, time) {
  const { x, y } = level.exit;
  const pulse = open ? 0.7 + 0.3 * Math.sin(time * 5) : 0.4;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = open ? '#34d399' : '#64748b';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 18, y - 18, 36, 36);
  ctx.restore();
  ctx.fillStyle = open ? '#065f46' : '#1f2937';
  ctx.fillRect(x - 15, y - 15, 30, 30);
  ctx.fillStyle = open ? '#6ee7b7' : '#94a3b8';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'OUT' : 'EXIT', x, y);
}

function drawCamera(ctx, cam) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  const disabled = cam.disabledT > 0;
  ctx.fillStyle = disabled ? '#475569' : '#1f2937';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = disabled ? '#94a3b8' : RED;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.stroke();
  if (disabled) {
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(6, 6);
    ctx.moveTo(6, -6);
    ctx.lineTo(-6, 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGuard(ctx, guard) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(0, 4, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(guard.angle);
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath();
  ctx.arc(5, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4, -9, 16, 4);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(11, -2, 4, 4);
  ctx.restore();
  if (guard.mode === 'chase') {
    drawMark(ctx, guard.x, guard.y - 26, '!', RED);
  } else if (guard.suspicion >= 60) {
    drawMark(ctx, guard.x, guard.y - 26, '?', AMBER);
  }
}

function drawMark(ctx, x, y, ch, color) {
  ctx.fillStyle = color;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, x, y);
}

function drawPlayer(ctx, player) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.arc(0, 5, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(player.angle);
  ctx.fillStyle = '#0d9488';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#134e4a';
  ctx.beginPath();
  ctx.arc(-4, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath();
  ctx.arc(6, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(2, -5, 8, 10);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(9, -3, 5, 6);
  ctx.restore();
}

function drawSmoke(ctx, smoke) {
  for (const s of smoke) {
    ctx.save();
    ctx.globalAlpha = 0.55 * Math.min(1, s.t);
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35 * Math.min(1, s.t);
    ctx.beginPath();
    ctx.arc(s.x - s.r * 0.4, s.y + s.r * 0.25, s.r * 0.6, 0, Math.PI * 2);
    ctx.arc(s.x + s.r * 0.45, s.y - s.r * 0.3, s.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticles(ctx, particles) {
  for (const pt of particles) {
    const a = Math.max(0, pt.t / 0.7);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('*', pt.x, pt.y - (0.7 - pt.t) * 26);
    ctx.restore();
  }
}

function drawNoises(ctx, noises) {
  for (const n of noises) {
    ctx.save();
    ctx.globalAlpha = 0.5 * (n.t / 0.6);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r * (1 - n.t / 0.6) + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function alarmColor(alarm) {
  if (alarm >= 75) return RED;
  if (alarm >= 40) return AMBER;
  return '#34d399';
}

function drawHud(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 11, 18, 0.88)';
  ctx.fillRect(0, 0, VIEW_W, 56);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 56, VIEW_W, 2);
  ctx.fillStyle = INK;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${state.level.name.toUpperCase()}  ·  ROOM ${state.levelIndex + 1}/3`, 16, 29);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = DIM;
  const lootText = `LOOT ${state.lootTaken}/${state.loot.length}`;
  ctx.fillText(lootText, 300, 29);
  ctx.fillStyle = INK;
  ctx.fillText('ALARM', 410, 29);
  const bx = 480;
  const bw = 190;
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(bx, 18, bw, 20);
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(bx, 18, Math.max(0, (bw * state.alarm) / 100), 20);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, 18, bw, 20);
  if (state.alarm >= 100) {
    ctx.fillStyle = RED;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('ALARM!', bx + bw + 12, 29);
  }
  ctx.fillStyle = INK;
  ctx.font = '16px sans-serif';
  let lives = '';
  for (let i = 0; i < 3; i++) lives += i < state.lives ? '● ' : '○ ';
  ctx.fillText(`LIVES ${lives}`, 700, 29);
  ctx.font = '15px sans-serif';
  ctx.fillText(`SMOKE ${state.smoke} [1] EMP ${state.emp} [2] COINS ${state.coins}`, 860, 29);
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${state.score}`, VIEW_W - 16, 16);
  ctx.fillStyle = DIM;
  ctx.fillText(`${Math.floor(state.time / 60)}:${String(Math.floor(state.time % 60)).padStart(2, '0')}`, VIEW_W - 16, 40);
  ctx.restore();

  if (state.hintT > 0 && state.hint) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 11, 18, 0.8)';
    ctx.fillRect(0, VIEW_H - 34, VIEW_W, 34);
    ctx.fillStyle = '#fde68a';
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.hint, VIEW_W / 2, VIEW_H - 17);
    ctx.restore();
  }
}

function drawPanel(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(4, 6, 10, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const w = 640;
  const h = 120 + lines.length * 30;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillStyle = '#0f1524';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, VIEW_W / 2, y + 52);
  ctx.fillStyle = INK;
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, y + 104 + i * 30));
  ctx.restore();
}

export function drawGame(ctx, state) {
  ctx.save();
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const level = state.level;
  drawFloor(ctx, level);
  drawWallsAndTables(ctx, level);
  drawExit(ctx, level, state.exitOpen, state.time);
  for (const loot of state.loot) drawLoot(ctx, loot);
  drawSmoke(ctx, state.smokes);
  drawNoises(ctx, state.noises);
  for (const cam of state.cameras) {
    if (cam.disabledT <= 0) {
      drawCone(ctx, level, cam.x, cam.y, cam.angle, CAMERA_CONE_HALF_ANGLE, CAMERA_CONE_RANGE, RED, '#ff8080');
    }
  }
  for (const guard of state.guards) {
    const hot = guard.seenNow || guard.mode === 'chase';
    drawCone(ctx, level, guard.x, guard.y, guard.angle, GUARD_CONE_HALF_ANGLE, GUARD_CONE_RANGE, hot ? RED : AMBER, hot ? '#ff8080' : '#ffd27a');
  }
  for (const cam of state.cameras) drawCamera(ctx, cam);
  for (const guard of state.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, state.player);
  drawParticles(ctx, state.particles);
  ctx.restore();

  drawHud(ctx, state);

  if (state.mode === 'title') {
    drawPanel(ctx, 'AURUM HEIST', [
      'The Aurum Grand Casino. One thief. Three rooms. One diamond.',
      'WASD / arrows to move · SHIFT to run (loud) · CLICK to toss a coin',
      '1 smoke pellet · 2 EMP pulse · M mute · stay out of the cones',
      'Lift every piece of loot, then slip out of the green door.',
      '',
      'Press ENTER to begin the heist',
    ], GOLD);
  } else if (state.mode === 'intro') {
    drawPanel(ctx, state.level.name.toUpperCase(), [state.level.intro, '', 'Press ENTER to enter the room'], TEAL);
  } else if (state.mode === 'caught') {
    drawPanel(ctx, 'CAUGHT!', [
      state.caughtBy === 'camera' ? 'A camera held you in its eye too long.' : 'A guard got his hands on you.',
      `Lives left: ${state.lives}`,
      '',
      'Press ENTER to slip back in',
    ], RED);
  } else if (state.mode === 'levelclear') {
    drawPanel(ctx, 'ROOM CLEARED', [
      `Loot lifted: ${state.lootTaken} pieces · Score ${state.score}`,
      state.levelIndex + 1 < 3 ? 'The next room is waiting.' : 'That was the last room.',
      '',
      'Press ENTER to continue',
    ], TEAL);
  } else if (state.mode === 'gameover') {
    drawPanel(ctx, 'BUSTED', [
      'The night staff march you out past the tables.',
      `Final score: ${state.score}`,
      '',
      'Press R to try the whole heist again',
    ], RED);
  } else if (state.mode === 'win') {
    drawPanel(ctx, 'THE GETAWAY', [
      `The Aurum Diamond is yours. Rank: ${state.rank}`,
      `Score ${state.score} · Time ${Math.floor(state.time / 60)}:${String(Math.floor(state.time % 60)).padStart(2, '0')} · Alarms raised ${state.alarms}`,
      'The van is waiting two streets over. Drive.',
      '',
      'Press R to run it again',
    ], GOLD);
  }
}
