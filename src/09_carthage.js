/* ================= Carthage, 146 BC: Scipio's final assault ================= */
/* The level runs north (+z): harbour, siege camp, assault front, wall breach, streets, temple, palace. */
const STAGES = [
  { name: 'The harbour', z1: 72, cp: [0, 3], allies: 0, goal: 'reach', text: 'Follow the road to the siege camp' },
  { name: 'The siege camp', z1: 150, cp: [0, 76], allies: 0, goal: 'event', text: 'Report to Scipio' },
  { name: 'The assault front', z1: 246, cp: [0, 156.5], allies: 16, goal: 'clear', text: 'Break the enemy line', waves: [[21]] },
  { name: 'The wall breach', z1: 287, cp: [0, 248.5], allies: 14, goal: 'clear', text: 'Take the breach', waves: [[31]] },
  { name: 'The streets', z1: 400, cp: [0, 289.5], allies: 9, goal: 'clear', text: 'Clear the streets', waves: [[41], [42], [43]], sub: [[0, 318.5], [0, 349.5]] },
  { name: 'The temple', z1: 462, cp: [0, 402.5], allies: 9, goal: 'clear', text: 'Defeat the temple guard', waves: [[51], [52]], sub: [[0, 423.5]] },
  { name: 'The palace', z1: 523, cp: [0, 464.5], allies: 10, goal: 'boss', text: 'Defeat Hasdrubal', waves: [[61], [62], [63]], sub: [[5, 495.5], [5, 504.5]] }
];
/* Within a stage each beaten group of defenders is a small checkpoint of its own: full health, fresh legionaries, and a fall restarts from there. */
/* Enemy tiers, each harder than the last. For comparison a Norman at Hastings is hp 72, dmg 3-5, block .22, hurt 1.4. */
const C_TIER = [null,
  { hp: 76, dmg: [4, 6], block: .24, cool: [.8, 1.7], hurt: 1.1, speed: [3.9, 4.5], loot: 1 },     /* 1 skirmishers on the assault front */
  { hp: 86, dmg: [5, 7], block: .28, cool: [.75, 1.55], hurt: 1.05, speed: [3.9, 4.4], loot: 1 },    /* 2 citizen spearmen in the breach */
  { hp: 96, dmg: [6, 8], block: .33, cool: [.7, 1.4], hurt: 1, speed: [4, 4.5], loot: 2 },        /* 3 veterans in the streets */
  { hp: 108, dmg: [7, 9], block: .38, cool: [.6, 1.25], hurt: 1, speed: [4, 4.5], loot: 2 },      /* 4 temple guard */
  { hp: 120, dmg: [8, 10], block: .42, cool: [.55, 1.1], hurt: 1, speed: [4.1, 4.6], loot: 3 }    /* 5 palace guard */
];
const NUMW = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
const C_TUNE = { playerDmg: [12, 16], allyHp: 100, allyDmg: [5, 7], allyBlock: .33, allyCool: [.8, 1.6], arrowPlayer: 8, arrowAlly: 6, bossHp: 380, bossDmg: [10, 14], bossHurt: 1, guardHp: 140 };
const carth = { scene: null, army: null, civ: null, trees: [], rects: [], gates: [], rules: null, leash: 24, hpBg: null, hpFill: null, fxMesh: null, clouds: null,
  ground(x, z) {
    if (z < 249) return 0;
    if (z < 267) return Math.abs(x) < 7.3 ? .3 * clamp(5 - Math.floor(Math.abs(z - 258) / 1.8), 0, 5) : 0;      /* rubble in the breach */
    if (z < 425) return 0;
    if (z < 434) return .3 * (Math.floor((z - 425) / .9) + 1);                                                    /* temple steps */
    if (z < 480) return 3;
    if (z < 486.3) return 3 + .3 * (Math.floor((z - 480) / .9) + 1);                                              /* palace steps */
    return 5.1;
  },
  flames: null, flameAt: [], smokeAt: [], gateDoor: null, beacon: null, arrowMesh: null, markMesh: null, arrows: [],
  si: 0, wave: 0, done: false, barrier: 1e9, left: 0, cut: null, cutDone: false, deaths: 0, kills: 0, slotN: 0, spawnStage: 0,
  wallUp: false, doneWall: false, wallArchers: [], parade: [], scipio: null, boss: null,
  volleyT: 5, smokeT: 0, shotT: 3, tieT: 0, introT: 0, bannerT: 0, warned: false, hudKey: '' };

function palm(L, x, z, s, rng, yb) {
  yb = yb || 0; let px = x; const lean = (rng() - .5) * .3, n = 6;
  for (let i = 0; i < n; i++) { L.push([px, yb + (i + .5) * .95 * s, z, .36 * s, .97 * s, .36 * s, jit(0x8a6a48, .1, rng)]); px += lean * .3; }
  const y = yb + n * .95 * s, G1 = jit(0x3f8a3a, .1, rng), G2 = jit(0x347a36, .1, rng);
  for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    L.push([px + d[0] * s, y + .1, z + d[1] * s, d[0] ? 1.8 * s : .5 * s, .16, d[1] ? 1.8 * s : .5 * s, G1]);
    L.push([px + d[0] * 2.1 * s, y - .25, z + d[1] * 2.1 * s, d[0] ? s : .42 * s, .16, d[1] ? s : .42 * s, G2]);
  }
  for (const d of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) L.push([px + d[0] * .8 * s, y + .22, z + d[1] * .8 * s, s, .14, s, G2]);
  L.push([px, y + .1, z, .7 * s, .5, .7 * s, G1]);
}
function standard(L, x, z, kind, yb) {
  yb = yb || 0;
  const A = (cx, cy, cz, sx, sy, sz, c) => L.push([cx, cy + yb, cz, sx, sy, sz, c]);
  A(x, 2.6, z, .12, 5.2, .12, [.4, .28, .16]);
  if (kind === 'aquila') { A(x, 5.3, z, .9, .12, .12, GOLD); A(x, 5.65, z, .3, .5, .3, GOLD); A(x - .45, 5.8, z, .5, .16, .12, GOLD); A(x + .45, 5.8, z, .5, .16, .12, GOLD); A(x, 4.6, z, .5, .5, .06, [.62, .1, .1]); }
  else if (kind === 'vexillum') {
    A(x, 5.1, z, 1.3, .1, .1, GOLD); A(x, 4.5, z, 1.1, 1.1, .06, [.62, .1, .1]); A(x, 3.88, z, 1.1, .12, .06, GOLD);
    for (const s of [-1, 1]) { A(x, 4.55, z + s * .04, .5, .12, .02, GOLD); A(x, 4.5, z + s * .04, .12, .6, .02, GOLD); }
  } else {
    const Wt = [.95, .93, .86];
    A(x, 5.1, z, 1.5, .1, .1, GOLD); A(x, 4.2, z, 1.3, 1.7, .06, [.36, .16, .43]);
    for (const s of [-1, 1]) { const zz = z + s * .04; A(x, 4.75, zz, .3, .3, .02, Wt); A(x, 4.5, zz, .8, .1, .02, Wt); A(x, 4.27, zz, .3, .2, .02, Wt); A(x, 4.05, zz, .56, .2, .02, Wt); A(x, 3.83, zz, .82, .2, .02, Wt); }
  }
}
function ship(L, x, z, rng) {
  const H = jit(0x5c3d24, .06, rng), red = [.6, .12, .1];
  L.push([x, .1, z, 17, 1.5, 3.6, H]);
  L.push([x - 9.2, .5, z, 1.6, 1.2, 2.6, H]); L.push([x - 10.3, 1.3, z, .8, 1.4, 1.4, H]); L.push([x - 10.6, 2.3, z, .5, 1, .8, H]);
  L.push([x + 9.2, .2, z, 1.6, 1.1, 2.4, H]); L.push([x + 10.6, -.2, z, 1.6, .5, .8, [.75, .6, .25]]); L.push([x + 9.6, 1.2, z, .5, 1.3, .5, H]);
  L.push([x, .9, z, 16.6, .14, 3.3, jit(0xa58458, .05, rng)]);
  L.push([x, 1.25, z + 1.75, 16.8, .5, .12, red]); L.push([x, 1.25, z - 1.75, 16.8, .5, .12, red]);
  L.push([x - 1, 4.4, z, .3, 7, .3, [.3, .21, .13]]); L.push([x - 1, 7.2, z, .22, .22, 6.5, [.3, .21, .13]]); L.push([x - 1, 6.7, z, .5, .8, 6.1, [.9, .86, .74]]);
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) L.push([x - 7 + i * 1.7, .1, z + s * 2.9, .12, .12, 2.4, [.7, .55, .35]]);
  L.push([x + 8.3, .75, z + 1.83, .5, .5, .06, [.95, .95, .9]]); L.push([x + 8.3, .75, z + 1.86, .2, .2, .04, DARK]);
}
function catapult(L, x, z) {
  const Wd = [.42, .3, .17], Wk = [.3, .2, .12];
  L.push([x - 1, .45, z, .35, .35, 3.6, Wd]); L.push([x + 1, .45, z, .35, .35, 3.6, Wd]); L.push([x, .45, z - 1.5, 2.3, .35, .35, Wd]); L.push([x, .45, z + 1.5, 2.3, .35, .35, Wd]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.push([x + sx * 1.3, .45, z + sz * 1.3, .25, .9, .9, Wk]);
  L.push([x - 1, 1.6, z + .6, .3, 2.2, .3, Wd]); L.push([x + 1, 1.6, z + .6, .3, 2.2, .3, Wd]); L.push([x, 2.6, z + .6, 2.3, .3, .3, Wd]);
  for (let i = 0; i < 5; i++) L.push([x, .9 + i * .5, z + .2 - i * .5, .22, .5, .55, Wd]);
  L.push([x, 3.3, z - 2.1, .6, .25, .6, Wk]);
}

function buildCarthage() {
  const sc = new T.Scene(), C = carth; C.scene = sc;
  sc.background = new T.Color(0xa9cdea); sc.fog = new T.Fog(0xa9cdea, 85, 240);
  sc.add(new T.HemisphereLight(0xf4f8ff, 0x9a8460, .62));
  const sun = new T.DirectionalLight(0xfff0cf, .5); sun.position.set(-50, 80, -30); sc.add(sun);
  const fill = new T.DirectionalLight(0xe4ecff, .14); fill.position.set(40, 30, 60); sc.add(fill);
  const seaT = groundTexture(21, 52, 118, 168); seaT.repeat.set(220, 280);
  const sea = new T.Mesh(new T.PlaneGeometry(900, 1100).rotateX(-PI / 2), new T.MeshLambertMaterial({ map: seaT })); sea.position.set(0, -.5, 250); sc.add(sea);
  const landT = groundTexture(22, 214, 180, 122); landT.repeat.set(85, 176);
  const land = new T.Mesh(new T.PlaneGeometry(340, 704).rotateX(-PI / 2), new T.MeshLambertMaterial({ map: landT })); land.position.set(140, 0, 356); sc.add(land);

  const rng = rngSeed(146), Rc = C.rects, G = C.gates;
  const blk = (x0, x1, z0, z1, h, plat) => Rc.push({ x0: x0, x1: x1, z0: z0, z1: z1, h: h, plat: !!plat });
  const circ = (x, z, r) => C.trees.push({ x: x, z: z, r: r });
  const Zn = [[], [], [], [], [], [], []];
  let L = Zn[0];
  const P = (cx, cy, cz, sx, sy, sz, c) => L.push([cx, cy, cz, sx, sy, sz, c]);
  const J = (hex, a) => jit(hex, a === undefined ? .05 : a, rng);
  const box = (x0, x1, y0, y1, z0, z1, c) => L.push([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0, c]);
  const STONE = 0xd8c9a2, STONE_D = 0xb9a884, WOODC = 0x7a5632, WOOD_D = [.31, .22, .14], PURPLE = [.36, .16, .43];
  const PLASTER = [0xf2ead8, 0xe8d9b8, 0xe0c9a0, 0xd9b98c, 0xeadfc8, 0xd6a98a], AWN = [0xa5432b, 0x2f6d8a, 0xd9a520, 0x5b2a6e, 0xe6dcc0];

  /* ---------- 0 the harbour ---------- */
  for (let i = 0; i < 19; i++) P(-18 + i * 2, -.25, 1.5, 1.92, .5, 9, J(0x8a6a44, .08));
  for (let i = 0; i < 10; i++) P(-18 + i * 4, -1.1, -2.8, .5, 2.2, .5, WOOD_D);
  ship(L, -9.5, -8.6, rng); ship(L, 12.5, -9.4, rng);
  P(-9.5, .55, -4.6, 1.3, .12, 4.4, J(0x9a7a50)); P(12.5, .55, -5, 1.3, .12, 5, J(0x9a7a50));
  for (let i = 0; i < 124; i++) P((rng() - .5) * .4, .03, 7 + i * 2, 5.6 + rng() * .6, .06, 2.05, J(0xb08f5a, .05));
  const crate = (x, z, s, y) => { P(x, (y || 0) + s / 2, z, s, s, s, J(0x9a7446, .08)); P(x, (y || 0) + s / 2, z, s + .04, .1, s + .04, WOOD_D); };
  crate(-9, 11, 1.1); crate(-10.2, 11.7, .9); crate(-9.4, 12.5, 1); crate(-9.5, 11.6, .8, 1.05); crate(8.6, 9.5, 1.2); crate(9.9, 10.1, 1); crate(9.1, 9.8, .8, 1.15);
  blk(-10.9, -8.3, 10.3, 13.2, 1.9, true); blk(7.8, 10.6, 8.8, 10.8, 2, true);
  /* single crates: steps up onto the stacks, and things to hop on along the way */
  const step = (x, z, yb) => { crate(x, z, 1, yb || 0); blk(x - .5, x + .5, z - .5, z + .5, (yb || 0) + 1, true); };
  step(-7.7, 11.8); step(11.2, 9.8); step(-3.6, 30); step(-4.7, 30.2); step(3.8, 52);
  for (let i = 0; i < 8; i++) P(5 + (i % 3) * .5, .35, 13 + ((i / 3) | 0) * .5, .34, .7, .34, J(0xb5623a, .08));
  circ(5.5, 13.5, 1);
  const tent = (x, z, w, d, hex) => { for (let i = 0; i < 5; i++) P(x, .2 + i * .4, z, w * (1 - i / 5.4), .42, d, J(hex, .05)); P(x, 1, z - d / 2 - .02, .7, 1.5, .06, [.2, .15, .1]); circ(x, z, Math.max(w, d) / 2 + .1); };
  tent(-17, 27, 3.6, 4.6, 0x9a6a44); tent(-17, 37, 3.6, 4.6, 0xd8cba8); tent(17, 31, 3.6, 4.6, 0x9a6a44);
  P(-14, 2.2, 8, .3, 4.4, .3, WOOD_D); P(-13, 4.3, 8, 2.6, .25, .25, WOOD_D); P(-11.9, 3.6, 8, .08, 1.2, .08, [.8, .75, .6]); circ(-14, 8, .5);
  for (let z = 6; z < 252; z += 6.5) { const h = 3 + rng() * 3.5; P(36.5 + rng() * 3, h / 2, z, 12 + rng() * 4, h, 7.2, J(0xb89a66, .06)); if (rng() < .6) P(38 + rng() * 4, h + .7, z + rng() * 2, 5 + rng() * 3, 1.4, 4, J(0xa98a5a, .07)); }
  blk(30, 95, -60, 252, 5); blk(-95, -30, -60, 252, 0); blk(-30, -18, -60, 4, 0); blk(18, 30, -60, 4, 0);
  for (let i = 0; i < 30; i++) {
    const s = i % 2 ? 1 : -1, x = s * (20.5 + rng() * 7.5), z = 9 + rng() * 238;
    if (z > 66 && z < 154 || C.trees.some(t => hyp(t.x - x, t.z - z) < 4)) continue;
    palm(L, x, z, .85 + rng() * .35, rng); circ(x, z, .45);
  }
  for (let i = 0; i < 60; i++) { const x = (rng() * 2 - 1) * 28, z = 8 + rng() * 240; if (Math.abs(x) < 4 || (z > 70 && z < 150)) continue; P(x, .12, z, .5 + rng() * .6, .24, .5 + rng() * .5, rng() < .5 ? J(0xa58a5c, .08) : J(0x7d8a4a, .1)); }

  /* ---------- 1 the siege camp ---------- */
  L = Zn[1];
  const pal = (x0, x1, z0, z1) => { const ax = x1 - x0 > z1 - z0, n = Math.round((ax ? x1 - x0 : z1 - z0) / .95);
    for (let i = 0; i <= n; i++) { const t = i / n, h = 2.7 + (i % 2) * .45; P(ax ? lerp(x0, x1, t) : x0, h / 2, ax ? z0 : lerp(z0, z1, t), .9, h, .9, J(WOODC, .09)); } };
  pal(-27, -5.2, 72, 72); pal(5.2, 27, 72, 72); pal(-27, -6.2, 148, 148); pal(6.2, 27, 148, 148); pal(-27, -27, 72, 148); pal(27, 27, 72, 148);
  for (const g of [[72, 5.6], [148, 6.6]]) {
    for (const s of [-1, 1]) { P(s * g[1], 3, g[0], 1.7, 6, 1.7, J(WOODC, .06)); P(s * g[1], 6.2, g[0], 2.4, .3, 2.4, WOOD_D); for (const a of [-1, 1]) for (const b of [-1, 1]) P(s * g[1] + a * 1, 6.9, g[0] + b * 1, .2, 1.1, .2, WOOD_D); P(s * g[1], 7.5, g[0], 2.5, .2, 2.5, J(WOODC, .06)); }
    P(0, 6.8, g[0], g[1] * 2 + 1.6, .5, .7, WOOD_D);
  }
  blk(-31, -4.7, 71.5, 72.5, 3.2); blk(4.7, 31, 71.5, 72.5, 3.2); blk(-31, -5.7, 147.5, 148.5, 3.2); blk(5.7, 31, 147.5, 148.5, 3.2); blk(-31, -26.5, 72, 148, 3.2); blk(26.5, 31, 72, 148, 3.2);
  G.push({ z: 72, x0: -4.7, x1: 4.7 }, { z: 148, x0: -5.7, x1: 5.7 });
  for (const x of [-21.5, -15, -8.5, 8.5, 15, 21.5]) for (const z of [80, 88, 96]) tent(x, z, 3.6, 4.8, rng() < .5 ? 0x9a6a44 : 0xcfc0a0);
  step(-5.8, 100); step(-5.8, 101.1); step(-5.8, 100.5, 1);
  for (const x of [-12, 12]) { for (const a of [[-.6, 0], [.6, 0], [0, -.6], [0, .6]]) P(x + a[0], .15, 104 + a[1], .5, .3, .5, J(0x8a8478, .08)); P(x, .2, 104, .9, .16, .2, WOOD_D); P(x, .2, 104, .2, .16, .9, WOOD_D); C.flameAt.push([x, .25, 104, .7]); circ(x, 104, 1); }
  P(0, .035, 132.5, 4, .05, 6, [.6, .1, .1]);
  standard(L, -2.7, 135.3, 'aquila'); standard(L, 2.7, 135.3, 'vexillum'); circ(-2.7, 135.3, .3); circ(2.7, 135.3, .3);
  catapult(L, -17, 139.5); catapult(L, 17, 139.5); circ(-17, 139.5, 2.3); circ(17, 139.5, 2.3);
  for (const s of [-1, 1]) { P(s * 12, .9, 110, 3, .12, .12, WOOD_D); for (let i = 0; i < 4; i++) P(s * 12 - 1.1 + i * .75, .6, 110.15, .6, 1.1, .1, [.63, .11, .11]); circ(s * 12, 110, 1.6); }
  standard(L, 4.4, 75.5, 'vexillum');
  C.gateDoor = new T.Mesh(buildBoxes([[-2.9, 2, 148, 5.6, 4, .3, jit(WOODC, .04, rng)], [2.9, 2, 148, 5.6, 4, .3, jit(WOODC, .04, rng)], [0, 2, 147.82, .3, 4, .1, WOOD_D], [-2.9, 3, 147.82, 5.4, .2, .1, WOOD_D], [2.9, 3, 147.82, 5.4, .2, .1, WOOD_D], [-2.9, 1, 147.82, 5.4, .2, .1, WOOD_D], [2.9, 1, 147.82, 5.4, .2, .1, WOOD_D]]), MAT_STATIC);
  sc.add(C.gateDoor);

  /* ---------- 2 the assault front ---------- */
  L = Zn[2];
  for (const s of [-1, 1]) { for (let x = 9; x < 29; x += 2.1) P(s * x, .5, 160 + rng() * .6, 2.2, 1 + rng() * .3, 2.6, J(0xa98558, .07)); for (let x = 10; x < 29; x += 1.3) P(s * x, .6, 166 + rng() * .5, .18, 1.2, .18, WOOD_D); }
  blk(-31, -8, 158.8, 161.7, 1.2, true); blk(8, 31, 158.8, 161.7, 1.2, true); G.push({ z: 160.2, x0: -7.8, x1: 7.8 });
  for (const m of [[-10, 178], [9, 181], [-4, 188], [13, 192], [-15, 195], [5, 198], [-9, 203]]) { P(m[0], .95, m[1], 2.3, 1.9, .22, J(WOODC, .08)); P(m[0], .5, m[1] - .5, .15, 1, .9, WOOD_D); circ(m[0], m[1], 1.15); }
  for (let i = 0; i < 34; i++) { const x = (rng() * 2 - 1) * 27, z = 164 + rng() * 80, s = .3 + rng() * .7; P(x, s / 2 - .05, z, s * 1.3, s, s, J(0xa89268, .08)); }
  const siegeTower = (x, z) => { P(x, 5.6, z, 3.6, 11.2, 3.6, J(0x80603a, .06)); for (let i = 0; i < 4; i++) P(x, 1.6 + i * 2.8, z - 1.85, 3.2, 1.9, .1, J(0x9a8460, .08)); P(x, 11.5, z, 4, .3, 4, WOOD_D);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { P(x + sx * 1.6, 12.2, z + sz * 1.6, .3, 1.2, .3, WOOD_D); P(x + sx * 1.95, .6, z + sz * 1.3, .3, 1.2, 1.2, WOOD_D); } P(x, 10.9, z + 2.6, 2.2, .2, 2.4, J(0x80603a)); blk(x - 2, x + 2, z - 2, z + 2, 11); };
  siegeTower(-19.5, 248.4); siegeTower(22, 248.8);
  standard(L, 4.6, 152.4, 'vexillum');

  /* ---------- 3 the wall and the breach ---------- */
  L = Zn[3];
  const wallSeg = (x0, x1) => { box(x0, x1, 0, 12, 254, 262, J(STONE, .03)); box(x0 - .05, x1 + .05, 3.8, 4.1, 253.95, 262.05, J(STONE_D)); box(x0 - .05, x1 + .05, 7.8, 8.1, 253.95, 262.05, J(STONE_D)); box(x0, x1, 12, 12.3, 253.8, 262.2, J(STONE_D));
    for (let x = x0 + 1; x < x1 - .6; x += 2.4) { P(x, 13, 254.4, 1.3, 1.4, .9, J(STONE, .04)); P(x, 13, 261.6, 1.3, 1.4, .9, J(STONE, .04)); } };
  const tower = (x0, x1, h) => { box(x0, x1, 0, h, 252, 264, J(STONE, .03)); box(x0 - .2, x1 + .2, h, h + .4, 251.8, 264.2, J(STONE_D));
    for (let x = x0 + .6; x < x1; x += 2.2) for (const z of [252.3, 263.7]) P(x, h + 1.1, z, 1.2, 1.4, .8, J(STONE, .04));
    for (let z = 254.4; z < 263; z += 2.2) for (const x of [x0 + .3, x1 - .3]) P(x, h + 1.1, z, .8, 1.4, 1.2, J(STONE, .04));
    P((x0 + x1) / 2, h * .6, 251.96, 1, 1.7, .1, DARK); };
  wallSeg(-31, -15); wallSeg(15, 38); wallSeg(46, 72); tower(-35.5, -31, 15); tower(38, 46, 16); tower(-15, -9.2, 16); tower(9.2, 15, 16);
  for (const s of [-1, 1]) { box(s > 0 ? 7.2 : -9.2, s > 0 ? 9.2 : -7.2, 0, 9, 252.6, 263.4, J(STONE, .04)); P(s * 8.6, 10, 256, 1.2, 2, 2.4, J(STONE, .05)); P(s * 8.9, 9.6, 260.5, .7, 1.3, 1.8, J(STONE_D)); P(s * 7.9, 9.3, 258.4, .9, .7, 1.4, J(STONE, .05)); }
  for (let i = 0; i < 5; i++) P(0, .15 + .3 * i, 258, 14.4, .3, 3.6 * (5 - i), J(STONE_D, .06));
  for (let i = 0; i < 46; i++) { const s = rng() < .5 ? -1 : 1, x = s * (5.3 + rng() * 1.7), z = 246 + rng() * 24, q = .35 + rng() * .5; P(x, C.ground(x, z) + q / 2, z, q * 1.2, q, q, J(STONE, .08)); }
  blk(-95, -7.2, 252, 264, 12); blk(7.2, 95, 252, 264, 12); G.push({ z: 254.2, x0: -6.6, x1: 6.6 }, { z: 261.8, x0: -6.6, x1: 6.6 });
  for (const s of [-1, 1]) for (let z = 264.5; z < 286; z += 7.2) { const h = 2.6 + rng() * 3.4, c = J(PLASTER[(rng() * 6) | 0], .05); box(s > 0 ? 16 : -29, s > 0 ? 29 : -16, 0, h, z, z + 6.6, c); P(s * (17.5 + rng() * 3), h + .6, z + 1.5, 2.2, 1.2, 1.6, c); P(s * 16.02, 1.1, z + 3.3, .1, 2.2, 1.1, DARK); if (rng() < .6) { C.flameAt.push([s * (19 + rng() * 4), h + .1, z + 3.3, 1.3]); C.smokeAt.push([s * 21, h + 1.5, z + 3.3]); } }
  blk(-95, -16, 264, 287, 5); blk(16, 95, 264, 287, 5);
  for (let i = 0; i < 16; i++) { const x = (rng() * 2 - 1) * 14, z = 266 + rng() * 18; if (Math.abs(x) < 3) continue; const q = .3 + rng() * .5; P(x, q / 2, z, q * 1.4, q, q, J(STONE_D, .08)); }
  standard(L, 5.4, 247.2, 'vexillum');

  /* ---------- 4 the streets ---------- */
  L = Zn[4];
  const house = (x0, x1, z0, z1, h, face, fire) => {
    const c = J(PLASTER[(rng() * 6) | 0], .04), dk = [c[0] * .88, c[1] * .86, c[2] * .82];
    box(x0, x1, 0, h, z0, z1, c); box(x0 - .12, x1 + .12, h, h + .5, z0 - .12, z1 + .12, dk);
    const xf = face > 0 ? x1 : x0, n = Math.max(1, Math.floor((h - 1) / 2.7)), zc = (z0 + z1) / 2, wz = z1 - z0;
    for (let f = 0; f < n; f++) for (const k of [-.27, .27]) { if (f === 0 && k < 0) continue; P(xf + face * .03, 2 + f * 2.7, zc + k * wz, .1, 1, .75, DARK); if (rng() < .5) P(xf + face * .07, 1.45 + f * 2.7, zc + k * wz, .14, .1, .95, J(WOODC)); }
    P(xf + face * .03, 1.05, zc - .27 * wz, .1, 2.1, 1.05, J(0x4a3220, .1));
    if (rng() < .45) P(xf + face * .75, 2.75, zc + .27 * wz, 1.5, .1, 1.7, J(AWN[(rng() * 5) | 0], .06));
    if (rng() < .5) P(lerp(x0, x1, .3 + rng() * .4), h + .85, lerp(z0, z1, .3 + rng() * .4), 1.4, .7, 1.4, dk);
    if (fire) { C.flameAt.push([xf + face * .25, 2.2, zc + .27 * wz, 1]); C.flameAt.push([(x0 + x1) / 2, h + .5, zc, 1.9]); C.smokeAt.push([(x0 + x1) / 2, h + 2, zc]); }
  };
  const row = (side, zA, zB, xFace, depth, hMin, hMax, fireP) => {
    let z = zA;
    while (z < zB - .01) { let d = 5 + rng() * 3.5; if (zB - z - d < 4) d = zB - z; const h = hMin + rng() * (hMax - hMin);
      house(side < 0 ? xFace - depth : xFace, side < 0 ? xFace : xFace + depth, z, z + d, h, -side, rng() < (fireP || 0)); z += d; }
    const b0 = side < 0 ? Math.max(-31, xFace - depth - 16) : xFace + depth, b1 = side < 0 ? xFace - depth : xFace + depth + 16;
    if (b1 - b0 > 1) box(b0, b1, 0, hMax + 1 + rng() * 4, zA, zB, J(PLASTER[(rng() * 6) | 0], .05));
    blk(side < 0 ? -95 : xFace, side < 0 ? xFace : 95, zA, zB, hMin);
  };
  for (const s of [-1, 1]) {
    row(s, 287, 312.5, s * 6.5, 14, 6.5, 13);
    row(s, 317.5, 328, s * 6.5, 14, 6.5, 12);
    row(s, 328, 346, s * 12, 9, 7, 12);
    row(s, 346, 352.5, s * 6.5, 14, 7, 12);
    row(s, 357.5, 400, s * 6.5, 14, 7, 14, .32);
    for (const z of [312.5, 352.5]) { box(s > 0 ? 19.5 : -31, s > 0 ? 34 : -19.5, 0, 9.5, z, z + 5, J(PLASTER[(rng() * 6) | 0], .05)); P(s * 19.44, 1.2, z + 2.5, .12, 2.4, 1.6, DARK); blk(s > 0 ? 19.5 : -95, s > 0 ? 95 : -19.5, z, z + 5, 9.5); }
    for (const z of [333, 341]) P(s * 11.94, 1.2, z, .12, 2.4, 1.5, DARK);
    /* an archers' balcony at the far end of the market */
    P(s * 9.5, 3.75, 345.2, 4, .2, 1.6, J(WOODC, .06)); P(s * 7.7, 1.85, 344.6, .2, 3.7, .2, WOOD_D); P(s * 11.3, 1.85, 344.6, .2, 3.7, .2, WOOD_D); P(s * 9.5, 4.4, 344.5, 4, .15, .12, WOOD_D);
    for (const z of [331.5, 342]) { for (const a of [-1, 1]) for (const b of [-1, 1]) P(s * 9.2 + a * .9, 1.05, z + b * .7, .12, 2.1, .12, WOOD_D); P(s * 9.2, 2.15, z, 2.3, .1, 1.9, J(AWN[(rng() * 5) | 0], .06)); P(s * 9.2, .7, z, 1.9, .1, 1.3, J(WOODC, .08)); for (let i = 0; i < 4; i++) P(s * 9.2 - .6 + i * .4, .9, z, .28, .28, .28, i % 2 ? [.78, .3, .16] : [.85, .7, .25]); circ(s * 9.2, z, 1.35); }
  }
  P(0, .03, 343.5, 13, .05, 113, J(0xd0c09c, .02)); P(0, .035, 337, 24, .05, 18, J(0xd8c8a4, .02));
  P(0, .35, 337, 3.4, .7, 3.4, J(STONE)); P(0, .72, 337, 2.8, .06, 2.8, [.3, .55, .7]); P(0, 1.1, 337, .6, 1.5, .6, J(STONE_D)); P(0, 1.9, 337, 1.2, .2, 1.2, J(STONE)); circ(0, 337, 2.15);
  const barricade = z => { for (const s of [-1, 1]) { P(s * 4.9, .65, z, 2.9, 1.3, 1.1, J(0x80603a, .08)); P(s * 5.2, 1.5, z + .1, 1.6, .5, .8, J(0x9a7446, .08)); P(s * 4.1, .45, z - .7, .9, .9, .9, J(0x9a7446, .08)); P(s * 5.7, .5, z + .8, .3, 1, 1, WOOD_D); blk(s < 0 ? -6.5 : 3.4, s < 0 ? -3.4 : 6.5, z - .6, z + .6, 1.5, true); } step(5.9, z - 1.65); G.push({ z: z, x0: -3.2, x1: 3.2 }); };
  barricade(307); barricade(380);
  G.push({ z: 287, x0: -6.2, x1: 6.2 }, { z: 328, x0: -6.2, x1: 6.2 }, { z: 346, x0: -6.2, x1: 6.2 }, { z: 400, x0: -6.2, x1: 6.2 });
  for (let i = 0; i < 26; i++) { const s = rng() < .5 ? -1 : 1, z = 289 + rng() * 108; if ((z > 311 && z < 319) || (z > 327 && z < 358)) continue; P(s * (5.7 + rng() * .4), .35, z, .4, .7, .4, J(0xb5623a, .08)); }
  standard(L, 4.9, 289.2, 'vexillum');
  /* skyline */
  for (let i = 0; i < 150; i++) { const x = 36 + rng() * 44, z = 262 + rng() * 360, h = 5 + rng() * 9 + (z > 430 ? 5 : 0) + (z > 500 ? 5 : 0); P(x, h / 2, z, 7 + rng() * 6, h, 7 + rng() * 6, J(PLASTER[(rng() * 6) | 0], .06)); }
  box(-32.5, -31, 0, 8, 262, 640, J(STONE, .03));

  /* ---------- 5 the temple ---------- */
  L = Zn[5];
  for (let i = 0; i < 10; i++) for (let j = 0; j < 6; j++) P(-18 + i * 4, .04, 402.2 + j * 4, 3.9, .06, 3.9, (i + j) % 2 ? J(0xe0d2b2, .02) : J(0xd2c09a, .02));
  const column = (x, yb, z, h, r) => { P(x, yb + .15, z, r * 2.6, .3, r * 2.6, J(0xe9e0cc, .02)); P(x, yb + .3 + h / 2, z, r * 2, h, r * 2, J(0xefe7d6, .02)); P(x, yb + h + .45, z, r * 2.7, .3, r * 2.7, [.62, .16, .14]); P(x, yb + h + .7, z, r * 3, .2, r * 3, J(0xe9e0cc, .02)); circ(x, z, r + .12); };
  for (const s of [-1, 1]) {
    row(s, 400, 425, s * 20, 11, 8, 12);
    P(s * 19.94, 1.3, 408, .12, 2.6, 1.8, DARK); P(s * 19.94, 1.3, 418, .12, 2.6, 1.8, DARK);
    P(s * 12, 2.6, 412, 1, 5.2, 1, J(STONE)); P(s * 12, 5.5, 412, .7, .6, .7, GOLD); circ(s * 12, 412, .8);
    standard(L, s * 16.5, 403.6, 'tanit'); palm(L, s * 15.5, 421.5, .95, rng); circ(s * 15.5, 421.5, .5);
    box(s > 0 ? 10 : -31, s > 0 ? 34 : -10, 0, 9.5, 425, 462, J(STONE, .03));
    for (let z = 426; z < 461; z += 2.4) P(s * 10.5, 10.2, z, .9, 1.4, 1.3, J(STONE, .04));
    for (let z = 429; z < 461; z += 6) P(s * 9.97, 5.6, z, .1, 2.6, 1.6, J(STONE_D, .04));
  }
  for (let i = 0; i < 10; i++) box(-10, 10, .3 * i, .3 * (i + 1), 425 + .9 * i, 434.05, i % 2 ? J(0xe6dcc4, .02) : J(0xdccfb0, .02));
  box(-10, 10, 0, 3, 434, 462, J(0xdccfb0, .02)); P(0, 3.02, 448, 19.6, .05, 27.6, J(0xe8dfca, .02));
  blk(-95, -10, 425, 462, 9.5); blk(10, 95, 425, 462, 9.5);
  for (const x of [-8.5, -5.1, -1.7, 1.7, 5.1, 8.5]) { column(x, 3, 437, 6.2, .45); column(x, 3, 459, 6.2, .45); }
  for (const z of [441.4, 445.8, 450.2, 454.6]) { column(-8.5, 3, z, 6.2, .45); column(8.5, 3, z, 6.2, .45); }
  box(-9.6, 9.6, 10.1, 11, 435.9, 460.1, J(0xe9e0cc, .02)); box(-9.68, 9.68, 10.4, 10.72, 435.82, 460.18, [.2, .32, .56]);
  for (let i = 0; i < 5; i++) for (const z of [435.9, 458.7]) box(-9.6 + i * 1.9, 9.6 - i * 1.9, 11 + i * .55, 11.55 + i * .55, z, z + 1.4, i === 0 ? [.62, .16, .14] : J(0xe9e0cc, .02));
  box(-9.2, 9.2, 11, 11.45, 437.3, 458.7, J(0xb5623a, .04)); P(0, 13.6, 436.6, .7, .7, .3, GOLD);
  box(-1.3, 1.3, 3, 4.1, 448.2, 449.8, J(STONE)); blk(-1.3, 1.3, 448.2, 449.8, 4.1, true);
  P(0, 3.6, 453, 2.2, 1.2, 1.6, J(STONE_D)); P(0, 5.6, 453, 1.3, 2.8, .9, GOLD); P(0, 7.4, 453, .8, .8, .8, GOLD); P(0, 8, 453, 1.4, .22, .2, GOLD); P(-.6, 8.2, 453, .2, .4, .2, GOLD); P(.6, 8.2, 453, .2, .4, .2, GOLD); blk(-1.2, 1.2, 452.1, 453.9, 8);
  for (const x of [-3.2, 3.2]) { P(x, 3.5, 449, .5, 1, .5, STEEL_D); P(x, 4.05, 449, .8, .14, .8, STEEL_D); C.flameAt.push([x, 4.1, 449, .6]); circ(x, 449, .55); }
  standard(L, 5.4, 402.2, 'vexillum');

  /* ---------- 6 the palace ---------- */
  L = Zn[6];
  box(-7, 7, 0, 3, 462, 480.05, J(0xdccfb0, .02)); P(0, 3.02, 471, 5, .05, 17.6, [.42, .19, .5]);
  for (let i = 0; i < 7; i++) box(-7, 7, 3 + .3 * i, 3 + .3 * (i + 1), 480 + .9 * i, 486.35, i % 2 ? J(0xe6dcc4, .02) : J(0xdccfb0, .02));
  box(-16, 16, 0, 5.1, 486.3, 522, J(0xdccfb0, .02));
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) P(-14 + i * 4, 5.12, 488.6 + j * 4.2, 3.9, .05, 4.1, (i + j) % 2 ? J(0xe8dfca, .02) : J(0xd9c6a2, .02));
  for (const s of [-1, 1]) {
    box(s > 0 ? 7 : -31, s > 0 ? 34 : -7, 0, 10, 462, 486.3, J(STONE, .03));
    for (let z = 463; z < 486; z += 2.4) P(s * 7.5, 10.7, z, .9, 1.4, 1.3, J(STONE, .04));
    for (const z of [466.5, 472.5, 478]) { P(s * 5.7, 3.35, z, 1, .7, 1.9, J(STONE_D)); P(s * 5.7, 4.1, z - .15, .8, .9, 1.3, J(0xcbb37a, .04)); P(s * 5.7, 4.75, z - .75, .7, .7, .7, J(0xcbb37a, .04)); circ(s * 5.7, z, .95); }
    box(s > 0 ? 16 : -31, s > 0 ? 34 : -16, 0, 13, 486.3, 524, J(STONE, .03));
    for (let z = 489.5; z < 519; z += 4.7) column(s * 14.3, 5.1, z, 5, .4);
    box(s > 0 ? 13.4 : -16, s > 0 ? 16 : -13.4, 11, 11.4, 487, 521, J(0xb5623a, .04));
    for (const z of [492, 508]) { P(s * 9.5, 5.4, z, 1.6, .6, 1.6, J(STONE_D)); palm(L, s * 9.5, z, .8, rng, 5.6); circ(s * 9.5, z, .95); }
    box(s > 0 ? 12 : -18, s > 0 ? 18 : -12, 5.1, 20.5, 519.6, 524, J(0xe2d6ba, .02)); box(s > 0 ? 11.7 : -18.3, s > 0 ? 18.3 : -11.7, 20.5, 21.3, 519.3, 524.3, J(0xd4a017, .04));
    P(s * 15, 12.6, 519.5, 2.6, 7, .1, PURPLE); P(s * 15, 16.2, 519.45, 3, .2, .14, GOLD);
    for (const b of [[14.6, .5, .5], [14.2, 1.4, .16], [13.75, .5, .36], [13.4, .95, .36], [13.05, 1.4, .36]]) P(s * 15, b[0], 519.42, b[1], b[2], .04, [.95, .93, .86]);
    column(s * 4.6, 5.1, 519.4, 7.2, .5);
  }
  blk(-95, -7, 462, 486.3, 10); blk(7, 95, 462, 486.3, 10); blk(-95, -16, 486.3, 524, 13); blk(16, 95, 486.3, 524, 13); blk(-95, 95, 520.6, 560, 17);
  blk(-16, -12, 519.6, 520.6, 20); blk(12, 16, 519.6, 520.6, 20);
  box(-3, 3, 5.1, 5.45, 497, 503, J(STONE)); P(0, 5.47, 500, 5.2, .04, 5.2, [.3, .55, .72]); blk(-3, 3, 497, 503, 5.5, true);
  box(-12, 12, 5.1, 17.5, 521, 534, J(0xe6dcc4, .02)); box(-12.5, 12.5, 17.5, 18.4, 520.5, 534.5, J(0xd4a017, .04));
  box(-2.7, 2.7, 5.1, 11.6, 520.82, 521.05, [.25, .17, .08]); box(-3.2, -2.7, 5.1, 12, 520.75, 521.05, GOLD); box(2.7, 3.2, 5.1, 12, 520.75, 521.05, GOLD); box(-3.2, 3.2, 11.6, 12.2, 520.75, 521.05, GOLD);
  P(0, 13.4, 520.8, 3.6, .5, .12, GOLD); P(0, 13.4, 520.74, 1, 1, .14, [.8, .2, .15]);
  G.push({ z: 425, x0: -9.6, x1: 9.6 }, { z: 462, x0: -6.6, x1: 6.6 }, { z: 486.3, x0: -6.6, x1: 6.6 });
  standard(L, 5.2, 464.2, 'vexillum', 3);

  for (const z of Zn) if (z.length) sc.add(new T.Mesh(buildBoxes(z), MAT_STATIC));

  const cl = [];
  for (let i = 0; i < 14; i++) { const x = (rng() * 2 - 1) * 240, z = 250 + (rng() * 2 - 1) * 330, y = 70 + rng() * 26, w = 18 + rng() * 26, d = 10 + rng() * 16; cl.push([x, y, z, w, 3.2, d, [1, 1, 1]]); cl.push([x + (rng() - .5) * w * .5, y + 2.6, z, w * .55, 2.6, d * .6, [1, 1, 1]]); }
  C.clouds = new T.Mesh(buildBoxes(cl), new T.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: .93 })); sc.add(C.clouds);
  const sunBlock = new T.Mesh(new T.BoxGeometry(22, 22, 22), new T.MeshBasicMaterial({ color: 0xfff6c8, fog: false })); sunBlock.position.set(-150, 170, 560); sc.add(sunBlock);

  /* fire: two boxes per flame, flickered every frame */
  C.flames = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ fog: false }), C.flameAt.length * 2);
  C.flames.instanceColor = new T.BufferAttribute(new Float32Array(C.flameAt.length * 6), 3);
  for (let i = 0; i < C.flameAt.length; i++) { _col.setHex(0xff7a1c); _col.toArray(C.flames.instanceColor.array, i * 6); _col.setHex(0xffd95a); _col.toArray(C.flames.instanceColor.array, i * 6 + 3); }
  C.flames.frustumCulled = false; sc.add(C.flames);

  C.arrowMesh = new T.InstancedMesh(buildBoxes([[0, 0, 0, .045, .045, .8, WOOD], [0, 0, .44, .07, .07, .1, STEEL], [0, 0, -.36, .02, .15, .14, [.92, .9, .85]], [0, 0, -.36, .15, .02, .14, [.92, .9, .85]]]), MAT_STATIC, 160);
  C.arrowMesh.frustumCulled = false; C.arrowMesh.count = 0; C.arrowMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); sc.add(C.arrowMesh);
  const quad = new T.PlaneGeometry(1, 1); quad.rotateX(-PI / 2);
  C.markMesh = new T.InstancedMesh(quad, new T.MeshBasicMaterial({ map: TEX_RING, color: 0xffa020, transparent: true, opacity: .9, depthWrite: false }), 48);
  C.markMesh.frustumCulled = false; C.markMesh.count = 0; C.markMesh.renderOrder = 2; sc.add(C.markMesh);
  C.beacon = new T.Mesh(new T.BoxGeometry(1.2, 18, 1.2), new T.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: .3, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
  C.beacon.visible = false; C.beacon.renderOrder = 6; sc.add(C.beacon);

  Object.assign(C, combatLayers(sc));
  C.army = new Army(sc, 260, true); C.civ = new Army(sc, 60, false); C.rules = carthRules;
}

/* ---------- who is who ---------- */
const SKIN2 = [0xd9a47a, 0xc99468, 0xb98058, 0x9a6844, 0xe0b088], HAIR2 = [0x2a1c12, 0x3a2a1a, 0x1c1410, 0x5a3a1e];
const CIVC = [0xe8dcc0, 0xd9a520, 0x2f7d8a, 0xb5623a, 0x6a8a3a, 0xc94f3a, 0xe6c9a0, 0x7a4a8a];
function lookLegion() { const sk = pick(SKIN); return { tunic: pick(MAIL), sleeve: 0xa42424, skirt: 0xa42424, trousers: sk, skin: sk, hair: pick(HAIR), helmet: 'roman', plume: Math.random() < .7 ? 0x9a1c1c : 0x262626, beard: false, shield: 'scutum', shieldTint: 0xa01c1c, weapon: 'gladius', stab: true }; }
const LOOK_HERO = { tunic: 0x9aa0aa, sleeve: 0xf2ecda, skirt: 0xf2ecda, trousers: 0xe8b98f, skin: 0xe8b98f, hair: 0x7a4a22, helmet: 'roman', plume: 0xf2c230, beard: false, shield: 'scutum', shieldTint: 0xa01c1c, weapon: 'gladius', stab: true };
const LOOK_CENTURION = { tunic: 0xb9bec8, sleeve: 0xa42424, skirt: 0xa42424, trousers: 0xd9a47a, skin: 0xd9a47a, hair: 0x3a2a1a, helmet: 'roman', helmetTint: 0xc8ccd4, crestT: 0x9a1c1c, beard: false, shield: 'scutum', shieldTint: 0xa01c1c, weapon: 'gladius', stab: true, scale: 1.05 };
const LOOK_SCIPIO = { tunic: 0xc9973a, sleeve: 0xf2ecda, skirt: 0xf2ecda, trousers: 0xe0b088, skin: 0xe0b088, hair: 0x3a2a1a, helmet: 'roman', helmetTint: 0xe6c060, plume: 0xb01c1c, cloak: 0xa01c1c, beard: false, shield: 'none', weapon: 'gladius', stab: true, scale: 1.16 };
const LOOK_HASDRUBAL = { tunic: 0xe0b848, sleeve: 0x4a2466, skirt: 0x4a2466, cloak: 0x5b2a6e, trousers: 0xc99468, skin: 0xc99468, hair: 0x1c1410, helmet: true, helmetTint: 0xf2d060, plume: 0xf2f0e8, crown: true, beard: true, shield: 'round', shieldTint: 0x5b2a6e, weapon: 'sword', scale: 1.28 };
function lookPunic(tier) {
  const sk = pick(SKIN2), base = { trousers: sk, skin: sk, hair: pick(HAIR2), beard: Math.random() < .7, shield: 'round' };
  if (tier === 1) return Object.assign(base, { tunic: pick([0xd9cdb0, 0xcbb78c, 0xb58a5a]), helmet: Math.random() < .3, helmetTint: 0xb98a3a, cap: 0x8a3a2a, shieldTint: pick([0xc9a66b, 0xe6dcc0, 0x8a5a3a]), weapon: pick(['spear', 'spear', 'sword']) });
  if (tier === 2) return Object.assign(base, { tunic: 0xe8e2d2, sleeve: 0x6a3a80, skirt: 0x6a3a80, helmet: true, helmetTint: 0xc9a040, plume: 0xf0ead8, shieldTint: 0xe8e2d2, weapon: 'spear' });
  if (tier === 3) return Object.assign(base, { tunic: 0xb8873a, sleeve: 0x5b2a6e, skirt: 0x5b2a6e, helmet: true, helmetTint: 0xc9a040, plume: 0x5b2a6e, shieldTint: 0x5b2a6e, weapon: 'sword' });
  if (tier === 4) return Object.assign(base, { tunic: 0xf2ecda, skirt: 0xf2ecda, cloak: 0xf2ecda, helmet: true, helmetTint: 0xf0cc66, plume: 0xf8f4e8, shieldTint: 0xf2ecda, weapon: 'spear', scale: 1.05 });
  return Object.assign(base, { tunic: 0xd9b040, sleeve: 0x3d1f52, skirt: 0x3d1f52, cloak: 0x4a2466, helmet: true, helmetTint: 0xf0cc66, plume: 0x6a2a8a, shieldTint: 0xd9b040, weapon: 'sword', scale: 1.08 });
}
function lookArcher() { const sk = pick(SKIN2); return { tunic: pick([0xd9cdb0, 0xb58a5a, 0x8a6a8a]), skirt: 0x6a3a80, trousers: sk, skin: sk, hair: pick(HAIR2), helmet: false, cap: 0x8a3a2a, beard: Math.random() < .5, shield: 'bow', weapon: 'none', bow: true }; }
function lookCiv() {
  const sk = pick(SKIN2), kid = Math.random() < .22, woman = Math.random() < .5, c = pick(CIVC);
  return { tunic: c, robe: Math.random() < .7 ? c : pick(CIVC), trousers: sk, skin: sk, hair: pick(HAIR2), helmet: false, veil: woman && Math.random() < .6 ? pick(CIVC) : 0, cap: !woman && Math.random() < .4 ? pick([0x9b2226, 0xe6dcc0, 0x5b2a6e]) : 0,
    beard: !woman && !kid && Math.random() < .5, shield: 'none', weapon: 'none', scale: kid ? rand(.62, .72) : rand(.92, 1.02) };
}
function cAdd(look, o) { const u = carth.army.add(Object.assign({}, look, o)); u.gy = carth.ground(u.x, u.z); u.y = u.gy; return u; }
function mkAlly(x, z, o) {
  const u = cAdd(lookLegion(), Object.assign({ team: 0, kind: 'line', x: x, z: z, yaw: 0, hp: C_TUNE.allyHp, dmg: C_TUNE.allyDmg, blockChance: C_TUNE.allyBlock, coolR: C_TUNE.allyCool, speed: rand(5, 5.5), slot: carth.slotN++ }, o || {}));
  if (!u.npc) battle.sax.push(u); return u;
}
function mkFoe(tier, x, z, sq, o) {
  const Tt = C_TIER[tier];
  const u = cAdd(lookPunic(tier), Object.assign({ team: 1, kind: 'line', x: x, z: z, yaw: PI, hp: Tt.hp, dmg: Tt.dmg, blockChance: Tt.block, coolR: Tt.cool, hurt: Tt.hurt, loot: Tt.loot, speed: rand(Tt.speed[0], Tt.speed[1]), hold: true, aggro: 15, sq: sq, stage: carth.spawnStage }, o || {}));
  battle.nor.push(u); return u;
}
function mkArcher(x, z, sq, y) {
  const up = y !== undefined;
  const u = cAdd(lookArcher(), { team: 1, kind: 'line', x: x, z: z, yaw: PI, hp: 50, dmg: [2, 4], blockChance: 0, hurt: 1.2, speed: 3.6, archer: true, hold: !up, aggro: 22, sq: sq, stage: carth.spawnStage, fixed: up, untargetable: up });
  if (up) { u.gy = y; u.y = y; }
  battle.nor.push(u); return u;
}
function spawnWallArchers() {
  const C = carth; if (C.wallUp) return; C.wallUp = true; C.wallArchers = [];
  for (const x of [-29, -25.5, -22, -18.5, 17.5, 21, 24.5, 28, 31.5, 35]) { const a = mkArcher(x, 255.7, 30, 12.3); a.wallA = true; C.wallArchers.push(a); }
  for (const x of [-12, 12]) { const a = mkArcher(x, 253.6, 30, 16.4); a.wallA = true; C.wallArchers.push(a); }
}
function spawnFoes(i) {
  const B = battle, C = carth; C.spawnStage = i;
  if (i === 2) { for (let k = 0; k < 14; k++) mkFoe(1, (k - 6.5) * 2.6 + rand(-.4, .4), 208 + (k % 2) * 3 + rand(-.5, .5), 21, { aggro: 30 }); spawnWallArchers(); }
  else if (i === 3) { for (let k = 0; k < 6; k++) mkFoe(2, (k - 2.5) * 2.1, 265.6 + rand(-.3, .3), 31, { aggro: 13 }); for (let k = 0; k < 6; k++) mkFoe(2, (k - 2.5) * 3.2, 273 + rand(-1, 1), 31, { aggro: 13 }); spawnWallArchers(); }
  else if (i === 4) {
    for (let k = 0; k < 5; k++) mkFoe(3, (k - 2) * 2.3, 309.6 + (k % 2) * 1.6, 41); mkArcher(0, 314.6, 41);
    for (let k = 0; k < 7; k++) mkFoe(3, (k - 3) * 2.6, 339.8 + (k % 2) * 2.2, 42); mkArcher(0, 343.6, 42);
    for (const x of [-9.5, 9.5]) { const a = mkArcher(x, 345.2, 42, 3.85); a.tie = 42; }
    for (let k = 0; k < 6; k++) mkFoe(3, (k - 2.5) * 2.1, 382.6 + (k % 2) * 1.8, 43); for (const x of [-2.6, 2.6]) mkArcher(x, 388.6, 43);
  } else if (i === 5) {
    for (let k = 0; k < 4; k++) mkFoe(4, (k - 1.5) * 2.6, 422.4, 51, { aggro: 16 });
    for (let k = 0; k < 5; k++) mkFoe(4, (k % 3 - 1) * 3.2, 440.6 + ((k / 3) | 0) * 4.2, 52, { aggro: 12 });
  } else if (i === 6) {
    for (let k = 0; k < 4; k++) mkFoe(5, (k - 1.5) * 3.6, 491.5 + (k % 2) * 2, 61, { aggro: 13 });
    for (let k = 0; k < 4; k++) mkFoe(5, (k - 1.5) * 4.4, 507 + (k % 2) * 1.6, 62, { aggro: 12 });
    for (const x of [-2.85, -.95, .95, 2.85]) B.nor.push(cAdd(lookPunic(5), { team: 1, kind: 'guard', wall: true, x: x, z: 513.4, yaw: PI, hp: C_TUNE.guardHp, dmg: [8, 11], blockChance: .5, coolR: [.55, 1.1], hurt: 1, loot: 4, speed: 3.6, rad: .42, mass: 4, sq: 63, stage: 6 }));
    C.boss = cAdd(LOOK_HASDRUBAL, { team: 1, kind: 'king', x: 0, z: 516.6, yaw: PI, hp: C_TUNE.bossHp, dmg: C_TUNE.bossDmg, range: 1.8, blockChance: .45, coolR: [.6, 1.1], hurt: C_TUNE.bossHurt, speed: 3.4, rad: .52, mass: 8, sq: 63, stage: 6, surrenders: true, loot: 30 });
    B.nor.push(C.boss);
  }
}
/* Civilians only run away. Nothing in the game can hurt them. */
const EX_A1 = [[-18.6, 315], [18.6, 315]], EX_MKT = [[-11.3, 333], [11.3, 333], [-11.3, 341], [11.3, 341], [-18.6, 355], [18.6, 355]], EX_PLZ = [[-19.3, 408], [19.3, 408], [-19.3, 418], [19.3, 418]];
function spawnCivs(i) {
  const C = carth;
  const add = (x, z, exits) => { if (C.civ.units.length >= 58) return; const u = C.civ.add(Object.assign(lookCiv(), { team: 2, civ: true, x: x, z: z, yaw: rand(-PI, PI), speed: rand(4.4, 5.3), rad: .34 })); u.exits = exits; u.exit = null; u.fleeing = false; u.fleeT = 0; u.gy = C.ground(x, z); u.y = u.gy; };
  if (i === 3) for (let k = 0; k < 7; k++) add(rand(-11, 11), rand(277.5, 285), EX_A1);
  else if (i === 4) { for (let k = 0; k < 5; k++) add(rand(-5, 5), rand(292, 303), EX_A1); for (let k = 0; k < 9; k++) add(rand(-10, 10), rand(330, 335), EX_MKT); for (let k = 0; k < 6; k++) add(rand(-5, 5), rand(360, 376), EX_PLZ); }
  else if (i === 5) for (let k = 0; k < 9; k++) add(rand(-17, 17), rand(404, 419), EX_PLZ);
}
function stepCivs(dt) {
  const B = battle, C = carth, p = B.player;
  for (const c of C.civ.units) {
    if (c.hidden) continue;
    let mvx = 0, mvz = 0;
    if (!c.fleeing) {
      c.thinkT -= dt;
      if (c.thinkT <= 0) {
        c.thinkT = rand(.2, .4);
        for (const r of B.sax) if (r.alive && hyp(r.x - c.x, r.z - c.z) < 15) {
          let best = null, bs = 1e9;
          for (const e of c.exits) { const s = hyp(e[0] - c.x, e[1] - c.z) - .7 * hyp(e[0] - p.x, e[1] - p.z); if (s < bs) { bs = s; best = e; } }
          c.exit = best; c.fleeing = true; c.panic = true; break;
        }
      }
    } else {
      const e = c.exit, far = hyp(e[0] - c.x, e[1] - c.z);
      c.fleeT += dt;
      if (far < 1.1 || c.fleeT > 16) { c.hidden = true; continue; }
      const r = route(c, e[0], e[1]), dx = r[0] - c.x, dz = r[1] - c.z, d = hyp(dx, dz) || 1e-4;
      mvx = dx / d * c.speed; mvz = dz / d * c.speed; c.yaw = turnTo(c.yaw, Math.atan2(dx, dz), 10 * dt);
    }
    c.vx = damp(c.vx, mvx, 10, dt); c.vz = damp(c.vz, mvz, 10, dt);
    c.x += c.vx * dt; c.z += c.vz * dt; collide(c);
    c.gy = damp(c.gy, C.ground(c.x, c.z), 16, dt);
    if (!B.sim) animate(c, dt, B.t);
  }
}

/* ---------- arrows ---------- */
const _ad = new T.Vector3(), _az = new T.Vector3(0, 0, 1);
function fireArrow(a, tx, tz, dmg) {
  const C = carth; if (C.arrows.length >= 150) return;
  const sx = a.x + Math.sin(a.yaw) * .5, sy = a.y + 1.5, sz = a.z + Math.cos(a.yaw) * .5, ty = C.ground(tx, tz) + .9;
  const d = hyp(tx - sx, tz - sz), Tf = clamp(d / 20, .7, 2.4), g = 16;
  C.arrows.push({ x: sx, y: sy, z: sz, vx: (tx - sx) / Tf, vy: (ty - sy) / Tf + .5 * g * Tf, vz: (tz - sz) / Tf, t: 0, T: Tf, g: g, tx: tx, tz: tz, ty: ty, dmg: dmg, stuck: 0 });
  a.drawT = .4;
  const v = loud(a); if (v > .05) sfx.twang(v);
}
function stepArrows(dt) {
  const B = battle, C = carth, A = C.arrows;
  for (let i = A.length - 1; i >= 0; i--) {
    const a = A[i];
    if (a.stuck > 0) { a.stuck -= dt; if (a.stuck <= 0) { A[i] = A[A.length - 1]; A.pop(); } continue; }
    a.t += dt; a.x += a.vx * dt; a.y += a.vy * dt; a.z += a.vz * dt; a.vy -= a.g * dt;
    if (a.t < a.T) continue;
    let hit = null, bd = .8;
    for (const u of B.sax) { if (!u.alive) continue; const d = hyp(u.x - a.x, u.z - a.z) - (u.isPlayer ? .05 : 0); if (d < bd) { bd = d; hit = u; } }
    if (hit) {
      const v = loud(hit), human = hit.isPlayer && !B.autopilot;
      const blocked = human ? hit.blocking : (hit.blockT > 0 || Math.random() < (hit.isPlayer ? hit.blockChance : .4));
      if (blocked) { if (v > .05) sfx.thunk(v); burst(hit.x, hit.gy + 1.3, hit.z, 3, 0xe8d8a8, 2.2, .3, .07); }
      else { if (v > .05) sfx.hit(v); hurt(hit, hit.isPlayer ? a.dmg : C_TUNE.arrowAlly, null); }
      A[i] = A[A.length - 1]; A.pop();
    } else { a.stuck = 5; a.y = a.ty - .55; }
  }
}
function writeArrows() {
  const B = battle, C = carth, p = B.player; let n = 0, m = 0;
  for (const a of C.arrows) {
    if (n >= 160) break;
    _ad.set(a.vx, a.vy, a.vz).normalize(); _q.setFromUnitVectors(_az, _ad);
    _v.set(a.x, a.y, a.z); _s.set(1, 1, 1); _m.compose(_v, _q, _s); C.arrowMesh.setMatrixAt(n++, _m);
    /* a ring on the ground shows the player where an arrow is about to land */
    if (!a.stuck && m < 48 && p && hyp(a.tx - p.x, a.tz - p.z) < 7) { const k = 2.4 - 1.5 * clamp(a.t / a.T, 0, 1); _m.makeScale(k, 1, k); _m.setPosition(a.tx, a.ty - .82, a.tz); C.markMesh.setMatrixAt(m++, _m); }
  }
  C.arrowMesh.count = n; C.arrowMesh.instanceMatrix.needsUpdate = true; C.markMesh.count = m; C.markMesh.instanceMatrix.needsUpdate = true;
}

/* ---------- stages and checkpoints ---------- */
function announce(title, sub, secs) { setCaption(title, sub, 'low'); carth.bannerT = secs; }
function setBeacon(x, z) { const b = carth.beacon; if (x === null) { b.visible = false; return; } b.visible = true; b.position.set(x, carth.ground(x, z) + 9, z); }
function vanish(u) { u.alive = false; u.gone = true; u.hidden = true; burst(u.x, u.gy + 1, u.z, 6, 0xd8d8d0, 1.6, .6, .15); }
function completeStage() {
  const B = battle, C = carth, i = C.si;
  C.done = true; C.barrier = 1e9;
  if (i === 3) { C.doneWall = true; for (const a of C.wallArchers) if (a.alive) vanish(a); }
  if (B.sim) return;
  const nx = STAGES[i + 1];
  if (i >= 2) { sfx.chime(); announce(['', '', 'The line is broken', 'The breach is ours', 'The streets are clear', 'The temple is taken'][i], 'Advance to ' + nx.name.toLowerCase(), 3.2); }
  setBeacon(nx.cp[0], nx.cp[1] + 1.5);
  carthRules.hud(true);
}
function reinforce(n) {
  const B = battle, p = B.player; let alive = 0;
  for (const u of B.sax) if (u.alive && !u.isPlayer) alive++;
  for (let k = alive; k < n; k++) mkAlly(clamp(p.x + rand(-3.5, 3.5), -5.2, 5.2), p.z - rand(6, 13));
  p.hp = p.maxHp;
}
function enterStage(i, wave) {
  const B = battle, C = carth, S = STAGES[i], p = B.player;
  C.si = i; C.wave = wave || 0; C.done = false; C.left = 0; C.volleyT = 5;
  C.barrier = S.goal === 'reach' ? 1e9 : i === 1 ? 147.2 : S.z1 - .8;
  spawnFoes(i);
  if (C.wave === 0) spawnCivs(i);
  else for (const e of B.nor) for (let w = 0; w < C.wave; w++) if (S.waves[w].indexOf(e.sq) >= 0 || e.tie && S.waves[w].indexOf(e.tie) >= 0) { e.alive = false; e.gone = true; e.hidden = true; }
  reinforce(S.allies);
  if (B.sim) return;
  Save.flush();
  if (i === 0) setBeacon(0, 77); else if (i === 1) setBeacon(0, 124); else setBeacon(null);
  if (B.phase === 'fight') {
    sfx.chime(); announce(S.name, 'Checkpoint ' + NUMW[i] + ' of seven', 3);
    if (i === 2 && !C.warned) { C.warned = true; B.edgeT = 6; B.toast = 'Arrows! Hold block to raise your shield.'; }
    carthRules.hud(true);
  }
}
/* Build the level's people from scratch at checkpoint i (a fresh start, or after the player falls). */
function populate(i, wave) {
  const B = battle, C = carth;
  wave = wave || 0;
  useLevel('carthage');
  C.kills = B.player && B.level === 'carthage' && i > 0 ? B.player.kills : 0;
  C.army.reset(); C.civ.reset(); B.units = C.army.units; B.sax = []; B.nor = []; C.arrows.length = 0; fx.list.length = 0; drops.length = 0; C.slotN = 0;
  B.t = 0; B.over = false; B.result = null; B.endT = 0; B.cardShown = false; B.edgeT = 0; B.lastHurt = -99; B.shake = 0; B.phase = 'wait';
  C.wallUp = false; C.doneWall = i > 3; C.wallArchers = []; C.parade = []; C.boss = null; C.cut = null; C.cutDone = i > 1; C.gateDoor.visible = i <= 1; C.bannerT = 0;
  const S = STAGES[i], at = wave > 0 ? S.sub[wave - 1] : S.cp;
  B.player = cAdd(LOOK_HERO, { team: 0, kind: 'line', isPlayer: true, x: at[0], z: at[1], yaw: 0, hp: TUNE.playerHp, dmg: C_TUNE.playerDmg, range: 2, speed: 5.6, rad: .42, mass: 1.6, blockChance: .45, windup: .13, strikeEnd: .25, attackDur: .4, hitAt: .2, cool: 0 });
  B.player.kills = C.kills; B.sax.push(B.player);
  if (i === 0) {
    cAdd(LOOK_CENTURION, { team: 0, npc: true, mass: 60, x: 2.6, z: 9.5, yaw: PI + .35 });
    for (const q of [[-5, 4.5, .6], [6.5, 3, -1.2], [-12, 9, 1.2], [11.5, 13, -2]]) mkAlly(q[0], q[1], { npc: true, mass: 60, yaw: q[2] });
  }
  if (i <= 1) {
    C.scipio = cAdd(LOOK_SCIPIO, { team: 0, npc: true, mass: 60, x: 0, z: 132.6, yaw: PI });
    mkAlly(-2.7, 134.2, { npc: true, mass: 60, yaw: PI }); mkAlly(2.7, 134.2, { npc: true, mass: 60, yaw: PI });
    for (let k = 0; k < 16; k++) { const s = k < 8 ? -1 : 1, q = k % 8; C.parade.push(mkAlly(s * (6.6 + (q % 2) * 1.9), 113 + (q >> 1) * 2.4, { npc: true, mass: 60, yaw: -s * PI / 2 })); }
  }
  enterStage(i, wave);
  cam.yaw = 0; cam.pitch = .55; followCam(0, true);
}
function releaseParade() {
  const B = battle, C = carth;
  for (const u of C.parade) if (u.npc) { u.npc = false; u.mass = 1; u.cheer = false; B.sax.push(u); }
  if (C.scipio) C.scipio.raise = 0;
}
function startCut() { carth.cut = { t: 0, seg: -1 }; battle.phase = 'cut'; $('hint').style.opacity = 0; setBeacon(null); for (const k in keys) keys[k] = false; }
function finishCut() {
  const B = battle, C = carth;
  C.cut = null; C.cutDone = true; releaseParade(); C.gateDoor.visible = false;
  if (!B.sim) { B.phase = 'fight'; setCaption('', ''); followCam(0, true); }
  completeStage();
}
function stepCut(dt) {
  const B = battle, C = carth, c = C.cut, S = C.scipio;
  c.t += dt; const t = c.t, seg = t < 2.9 ? 0 : t < 5.6 ? 1 : 2;
  if (seg !== c.seg) {
    c.seg = seg;
    if (seg === 0) { setCaption('Scipio Aemilianus', 'Commander of the army of Rome', 'low'); sfx.horn(165); }
    else if (seg === 1) { setCaption('Carthago delenda est', 'Carthage must fall', 'low'); sfx.roar(); for (const u of C.parade) u.cheer = true; }
  }
  if (seg === 0) { camera.position.set(S.x + 2.8 - t * .3, 2.5, S.z - 6.6 + t * .25); camera.lookAt(S.x, 2.15, S.z); if (t > .7) S.raise = damp(S.raise, 1, 8, dt); }
  else if (seg === 1) { const k = (t - 2.9) / 2.7; camera.position.set(-10 + k * 3, 8 + k * 1.5, 106 - k * 2); camera.lookAt(3, 3, 190); }
  else { finishCut(); return; }
  for (const u of B.units) if (u.alive) { u.vx = u.vz = 0; animate(u, dt, B.t + t); }
}
function stepCarthIntro(dt) {
  const B = battle, C = carth, p = B.player;
  C.introT += dt; const t = C.introT;
  if (t >= 3.8) { beginCarthage(); return; }
  const k0 = clamp(t / 3.8, 0, 1), k = k0 * k0 * (3 - 2 * k0);
  camera.position.set(lerp(-27, p.x, k), lerp(13, 1.75 + Math.sin(.55) * cam.dist, k), lerp(-27, p.z - Math.cos(.55) * cam.dist, k));
  camera.lookAt(lerp(3, p.x, k), lerp(1, 1.9, k), lerp(8, p.z + .9, k));
  for (const u of B.units) if (u.alive) { u.vx = u.vz = 0; animate(u, dt, t); }
}
function beginCarthage() {
  const B = battle, C = carth; if (B.phase === 'fight') return;
  B.phase = 'fight';
  $('hud').hidden = false; $('tallyH').hidden = true; $('tallyC').hidden = false; $('tallyS').hidden = true; $('btnPause').hidden = false; refreshTouchUi();
  showHint(); followCam(0, true);
  announce(STAGES[C.si].name, 'Checkpoint ' + NUMW[C.si] + ' of seven', 3.2);
  if (C.si === 2 && !C.warned) { C.warned = true; B.edgeT = 6; B.toast = 'Arrows! Hold block to raise your shield.'; }
  carthRules.hud(true);
}

const _slot = [0, 0, 0];
const carthRules = {
  clamp(u) {
    const B = battle, C = carth;
    if (u.z < -2.3) u.z = -2.3;
    if (u.team === 0 && u.z > C.barrier) {
      u.z = C.barrier;
      if (u === B.player && !B.over && u.vz > 1) { B.edgeT = 1.4; B.toast = C.si === 1 ? 'Report to Scipio before you leave the camp.' : 'Defeat the defenders before you advance.'; }
    }
  },
  flee(u, mv) {
    const dx = -u.x, dz = 519.6 - u.z, d = hyp(dx, dz) || 1;
    mv[0] = dx / d * 5; mv[1] = dz / d * 5;
    if (d < 1.8) vanish(u);
  },
  wake(u) { for (const e of battle.nor) if (e.sq === u.sq && e.hold) { e.hold = false; e.thinkT = rand(0, .3); } },
  follow(u) {
    const p = battle.player;
    if (u.isPlayer) { _slot[0] = u.z > 262 || (u.z > 100 && u.z < 150) ? 4.4 : 0; _slot[1] = Math.min(carth.barrier - .3, u.z + 6, 519); _slot[2] = 0; return _slot; }     /* only when simulating */
    const k = u.slot % 15, row = (k / 5) | 0, col = k % 5;
    _slot[0] = p.x + (col - 2) * 1.7 + (row % 2 ? .85 : 0); _slot[1] = p.z - 2.4 - row * 1.9; _slot[2] = 0; return _slot;
  },
  shoot(u, t) {
    const d = hyp(t.x - u.x, t.z - u.z), Tf = clamp(d / 20, .7, 2.4), lead = t.isPlayer ? .45 : .2, sc = rand(0, t.isPlayer ? 1.1 : 1.6), a = rand(0, PI * 2);
    u.yaw = Math.atan2(t.x - u.x, t.z - u.z);
    fireArrow(u, t.x + t.vx * Tf * lead + Math.cos(a) * sc, t.z + t.vz * Tf * lead + Math.sin(a) * sc, C_TUNE.arrowPlayer);
  },
  fixed(u, dt) {
    const B = battle;
    if (u.wallA) {
      if (u.aim) { const t = u.aim; u.shotT -= dt; u.yaw = turnTo(u.yaw, Math.atan2(t.x - u.x, t.z - u.z), 6 * dt); if (u.shotT <= 0) { if (t.alive) carthRules.shoot(u, t); u.aim = null; } }
      return;
    }
    u.shotT -= dt;
    if (u.shotT <= 0) {
      u.shotT = rand(3, 4.6); let best = null, bd = 28;
      for (const r of B.sax) { if (!r.alive) continue; const d = hyp(r.x - u.x, r.z - u.z); if (d < bd) { bd = d; best = r; } }
      if (best) carthRules.shoot(u, best);
    }
  },
  after(dt) {
    const B = battle, C = carth, p = B.player, S = STAGES[C.si];
    stepArrows(dt); stepCivs(dt);
    /* volleys from the wall */
    if (C.wallUp && !C.doneWall) {
      C.volleyT -= dt;
      if (C.volleyT <= 0) {
        C.volleyT = rand(4.4, 6.2);
        const tg = []; for (const r of B.sax) if (r.alive && r.z > 198 && r.z < 263) tg.push(r);
        const pIn = p.alive && p.z > 198 && p.z < 263;
        if (tg.length) for (const a of C.wallArchers) if (a.alive) { a.aim = pIn && Math.random() < .3 ? p : tg[(Math.random() * tg.length) | 0]; a.shotT = rand(.1, .8); }
      }
    }
    /* archers on a balcony leave when the squad below them is beaten */
    C.tieT -= dt;
    if (C.tieT <= 0) {
      C.tieT = .5;
      for (const a of B.nor) if (a.alive && a.tie) { let any = false; for (const e of B.nor) if (e.alive && !e.fixed && e.sq === a.tie) { any = true; break; } if (!any) vanish(a); }
    }
    if (B.over) return;
    if (!p.alive) { endBattle('fallen'); return; }
    const Wv = S.waves;
    if (Wv && C.wave < Wv.length) {
      let any = false; for (const e of B.nor) if (e.alive && !e.fixed && Wv[C.wave].indexOf(e.sq) >= 0) { any = true; break; }
      if (!any) { C.wave++; if (C.wave < Wv.length) { reinforce(S.allies); if (!B.sim) { sfx.chime(); announce('Reinforcements', 'The legion catches up with you', 2.6); } } }
    }
    if (!C.done) {
      if (S.goal === 'reach') { if (p.z >= S.z1 - .5) completeStage(); }
      else if (S.goal === 'event') { if (!C.cutDone && p.z > 104) { if (B.sim) finishCut(); else startCut(); } }
      else {
        let left = 0; for (const e of B.nor) if (e.alive && !e.fixed && e.stage === C.si) left++;
        C.left = left;
        if (S.goal === 'boss') { if (!C.boss.alive) endBattle('victory'); }
        else if (left === 0) completeStage();
      }
    } else if (C.si < 6 && p.z >= S.z1) enterStage(C.si + 1);
  },
  end(result) {
    const B = battle, C = carth;
    setBeacon(null);
    if (result === 'victory') {
      for (const u of B.sax) if (u.alive) { u.cheer = true; u.target = null; u.blockT = 0; }
      for (const u of B.nor) if (u.alive && !u.fixed) { u.flee = true; u.hold = false; u.target = null; u.blockT = 0; u.wall = false; }
      sfx.win();
    } else { C.deaths++; sfx.lose(); }
  },
  hud(force) {
    const B = battle, C = carth, p = B.player; if (!p) return;
    const S = STAGES[C.si], hp = Math.ceil(p.hp / p.maxHp * 10), boss = C.boss && C.si === 6 ? Math.round(C.boss.hp / C.boss.maxHp * 100) : -1;
    const goal = C.done && C.si < 6 ? 'Advance to ' + STAGES[C.si + 1].name.toLowerCase() : S.text;
    const key = C.si + '|' + goal + '|' + C.left + '|' + hp + '|' + boss + '|' + p.kills;
    if (!force && key === C.hudKey) return; C.hudKey = key;
    $('cStage').textContent = S.name; $('cNum').textContent = (C.si + 1) + '/7'; $('cGoal').textContent = goal;
    $('cFoes').textContent = C.left; $('cBoss').hidden = boss < 0; if (boss >= 0) $('cBossHp').style.width = boss + '%';
    hudPlayer(hp, p.kills);
  }
};

/* per-frame dressing: fire, smoke, catapult shots, the checkpoint beacon */
function stepCarthFx(dt, time) {
  const B = battle, C = carth, F = C.flameAt, p = B.player;
  for (let i = 0; i < F.length; i++) {
    const f = F[i], h = 1 + .35 * Math.sin(time * 11 + i * 1.7) + .2 * Math.sin(time * 17.3 + i * 2.9);
    _m.makeScale(f[3], f[3] * h, f[3]); _m.setPosition(f[0], f[1] + f[3] * h / 2, f[2]); C.flames.setMatrixAt(i * 2, _m);
    _m.makeScale(f[3] * .55, f[3] * h * 1.25, f[3] * .55); _m.setPosition(f[0], f[1] + f[3] * h * .625, f[2]); C.flames.setMatrixAt(i * 2 + 1, _m);
  }
  C.flames.instanceMatrix.needsUpdate = true;
  if (C.beacon.visible) { C.beacon.material.opacity = .22 + .12 * Math.sin(time * 4); C.beacon.rotation.y = time; }
  if (!p || mode !== 'carthage') return;
  C.smokeT -= dt;
  if (C.smokeT <= 0) {
    C.smokeT = .28;
    for (const s of C.smokeAt) if (Math.abs(s[2] - p.z) < 75 && fx.list.length < 260 && Math.random() < .6)
      fx.list.push({ x: s[0] + rand(-.6, .6), y: s[1], z: s[2] + rand(-.6, .6), vx: rand(.2, .9), vy: rand(1.4, 2.2), vz: rand(-.3, .3), life: 3.6, max: 3.6, size: rand(.7, 1.3), c: 0x4c4844, g: -.25, floor: -99, boom: false });
  }
  if (C.cutDone && C.si <= 3 && B.phase === 'fight') {
    C.shotT -= dt;
    if (C.shotT <= 0) {
      C.shotT = rand(2.6, 4.4);
      const sx = Math.random() < .5 ? -17 : 17, tx = rand(-45, 45), tz = rand(296, 332), Tf = 4.6, g = 10;
      fx.list.push({ x: sx, y: 3.4, z: 137.4, vx: (tx - sx) / Tf, vy: -3.2 / Tf + .5 * g * Tf, vz: (tz - 137.4) / Tf, life: 7, max: 7, size: .75, c: 0xff9a2a, g: g, floor: .3, boom: true });
    }
  }
}
