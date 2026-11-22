// Aurum Heist — config.js
// Every number and every level of the game. One file, one job: the tuning
// constants, the three room maps and the patrols and cameras that live in them.
//
// Tile letters used by the maps:
//   '#' wall   '.' marble floor   ',' carpet   's' shadow floor   'v' vent
//   'T' table (blocks movement and sight)   'L' loot   'E' exit
//   'P' the thief's start   'g' guard spawn   'c' camera mount (a wall tile)

export const TILE = 40;
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const COLS = 32;
export const ROWS = 20;

export const PLAYER_RADIUS = 12;
export const WALK_SPEED = 150;
export const RUN_SPEED = 235;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 168;
export const GUARD_INVESTIGATE_SPEED = 95;

export const GUARD_CONE_RANGE = 185;
export const GUARD_CONE_HALF_ANGLE = 0.61;
export const CAMERA_CONE_RANGE = 235;
export const CAMERA_CONE_HALF_ANGLE = 0.44;

export const ALARM_RISE_GUARD = 34;
export const ALARM_RISE_CAMERA = 44;
export const ALARM_FALL_HIDDEN = 16;
export const ALARM_FALL_OPEN = 7;
export const ALARM_HOT = 55;
export const ALARM_FULL = 100;

export const NOISE_RUN_RADIUS = 135;
export const NOISE_COIN_RADIUS = 105;
export const SMOKE_RADIUS = 78;
export const SMOKE_LIFETIME = 6;
export const EMP_LIFETIME = 12;

export const START_LIVES = 3;
export const START_COINS = 5;
export const START_SMOKE = 3;
export const START_EMP = 2;

export const LOOT_VALUES = { gold: 100, jewel: 150, painting: 200, diamond: 500 };

// The three rooms. Each map is 20 rows of 32 characters. Patrols are lists of
// tile waypoints, one list per guard, in the order the 'g' spawns appear
// reading the map top to bottom, left to right. Cameras sweep around the
// angle they face; sweep is how far either side of it they turn.
export const LEVELS = [
  {
    name: 'The Lobby',
    intro: 'Slip past the night staff, lift every piece of loot, reach the green door.',
    map: [
      '################################',
      '#P.....,.........L.............#',
      '#......,......................#',
      '#..TT..,.....####.....TT......#',
      '#......,.....#........,.......#',
      '#......,.....#..g.....,.......#',
      '#..s...,...s.#........,.......#',
      '#..s...,...s.#....L...,....s..#',
      '#......,.....#........,.......#',
      '#......,..........TT..........#',
      '#..L...,...s..........s.......#',
      '#......,.....####.....g.......#',
      '#......,.....#........,.......#',
      '#..s...,...s.#..TT...,....s..#',
      '#..s...,...s.#........,.......#',
      '#......,.....#...L...,........#',
      '#......,.....#........,.......#',
      '#......,.....####.............#',
      '#........................E...#',
      '################################',
    ],
    patrols: [
      [[17, 5], [17, 9], [24, 9], [24, 5]],
      [[24, 11], [24, 15], [17, 15], [17, 11]],
    ],
    cameras: [{ tile: [31, 10], face: Math.PI, sweep: 0.5, speed: 0.45 }],
    lootKinds: ['gold', 'jewel', 'gold', 'painting'],
  },
  {
    name: 'The Gallery',
    intro: 'The gallery is watched from above. Vents are blind spots — crawl through them.',
    map: [
      '################################',
      '#P....,......####......L.......#',
      '#.....,......#..#..............#',
      '#..TT.,......#..#..TT....g....#',
      '#.....,......#..#........,....#',
      '#..s..,..v...#..#..s.....,....#',
      '#..s..,..v...#..#..s.....,....#',
      '#.....,......#..#....L...,...s#',
      '#.....,......####........,....#',
      '#.....,.......................#',
      '#..L..,....TT......TT....s....#',
      '#.....,.......................#',
      '#..s..,.g...#.##.....g........#',
      '#..s..,.....#..#......,....L..#',
      '#.....,.....#..#..TT..,.......#',
      '#.....,..v..#..#......,....s..#',
      '#.....,..v..#..#......,....s..#',
      '#.....,......#..#......,......#',
      '#.....,......####..........E..#',
      '################################',
    ],
    patrols: [
      [[24, 3], [24, 7], [28, 7], [28, 3]],
      [[22, 12], [22, 16], [27, 16], [27, 12]],
      [[8, 12], [13, 12], [14, 17], [8, 17]],
    ],
    cameras: [
      { tile: [31, 1], face: Math.PI, sweep: 0.6, speed: 0.5 },
      { tile: [0, 18], face: 0, sweep: 0.6, speed: 0.4 },
    ],
    lootKinds: ['gold', 'painting', 'jewel', 'gold'],
  },
  {
    name: 'The Vault',
    intro: 'The Aurum Diamond sits behind three cameras and the tightest patrols of the night.',
    map: [
      '################################',
      '#P.....,....#######.....L......#',
      '#......,....#.....#............#',
      '#..TT..,....#.L...#.TT....g...#',
      '#......,..........#......,.....#',
      '#..s...,...s#.....#..s...,...s#',
      '#..s...,...s#.....#..s...,...s#',
      '#......,....#######....TT......#',
      '#......,................L.....#',
      '#..v...g..s....TT....s....v..#',
      '#..v...,...s..........s....v..#',
      '#......,....####...####.......#',
      '#......,....#..#...#..#..g...#',
      '#..L...,...s#..#...#..#......#',
      '#..s...,...s#..#...#..#.TT...#',
      '#..s...,...s#..#...#..#......#',
      '#......,....#..#...#..#..L...#',
      '#......,....####...####.......#',
      '#........................E...#',
      '################################',
    ],
    patrols: [
      [[25, 3], [25, 7], [29, 7], [29, 3]],
      [[25, 12], [25, 16], [28, 16], [28, 12]],
      [[8, 9], [13, 9], [13, 10], [8, 11]],
    ],
    cameras: [
      { tile: [15, 1], face: Math.PI / 2, sweep: 0.55, speed: 0.55 },
      { tile: [31, 9], face: Math.PI, sweep: 0.5, speed: 0.5 },
      { tile: [0, 18], face: 0, sweep: 0.55, speed: 0.45 },
    ],
    lootKinds: ['diamond', 'painting', 'jewel', 'gold', 'gold'],
  },
];

// Rank names for the end screen, by how many full alarms the run set off.
export function rankFor(alarms, seconds) {
  if (alarms === 0) return 'GHOST';
  if (alarms === 1) return 'CLEAN';
  if (alarms <= 3) return 'LOUD';
  return 'SLOPPY';
}
