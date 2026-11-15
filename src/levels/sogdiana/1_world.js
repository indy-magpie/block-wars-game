/* ================= Sogdiana, 328 BC: the hunt for Spitamenes ================= */
/* Not a march but an open map. South: the Macedonian scout camp. Middle: the walled town of Gabae and its bazaar.
   East: the camp of the Massagetae horsemen. North: the citadel, and in it the hall of Spitamenes.
   The player is a Companion on foot with only a knife. A guard who sees him raises the alarm, and every guard in that place comes for him. */
const S_TUNE = {
  /* the knife is weak on purpose: one guard can be beaten at a cost, two will usually beat him, so the level is won by not being seen */
  playerHp: 100, knife: [3, 5], backstab: 999,
  guardHp: 78, guardDmg: [8, 11], guardCool: [.7, 1.3], bodyHp: 96, bodyDmg: [9, 12], riderHp: 88, riderDmg: [9, 12], bossHp: 110, bossDmg: [10, 13],
  /* see: how far a guard sees, in a wedge of `half` radians each side; sneaking shrinks it; a trader's robe shrinks it far more inside the town */
  see: 12, seeRobe: 1.7, seeBoss: 9, half: .95, hear: 2.1, hearSneak: .9, sneakSee: .6, susUp: .7, susDown: .45, grace: 1, search: 5, walk: 2, run: 4.7,
  robe: 15, bribe: 10, potter: 12, chief: 20, bread: 4, stipend: 30, stash: 6
};
const S_PLACE = { camp: 'The scout camp', road: 'The road to Gabae', town: 'Gabae', bazaar: 'The bazaar', riders: 'The Massagetae camp', court: 'The citadel', hall: 'The hall of Spitamenes', wild: 'The steppe' };
const S_STASH = [[-21.5, 27.2], [-19.5, 63.4], [30, 91.6], [-20.4, 136.4], [66.3, 87.6], [-50.5, 85.6]];
const sog = { scene: null, army: null, civ: null, trees: [], rects: [], gates: [], rules: null, leash: 0, ground: () => 0, hpBg: null, hpFill: null, fxMesh: null, dropMesh: null, clouds: null,
  flags: null, cp: [0, -4, 0], zones: {}, guards: [], acts: [], hay: [], boss: null, coenus: null, chief: null, riders: [], body: [], doormen: [],
  door: null, doorRect: null, grate: null, grateRect: null, jar: null, pots: [], beacon: null, markMesh: null, coneMesh: null, flames: null, flameAt: [],
  grid: null, field: null, field2: null, queue: null, fieldT: 0, visT: 0, seenT: -99, lkx: 0, lkz: 0, inHay: false, act: null, talk: null,
  deaths: 0, kills: 0, introT: 0, bannerT: 0, hudKey: '', place: '', seen: {}, fresh: true };
function sogFlags() {
  return { briefed: false, robe: false, gatePass: false, gate: null, inTown: false, potter: null, jarAsked: false, jar: false, jarGiven: false, channel: false, password: false, campKnown: false,
    chief: null, token: false, grate: false, gateOpen: false, courtPass: false, inCitadel: false, way: null, end: null, stash: {}, alarms: 0, takedowns: 0 };
}

function buildSogdiana() {
  const sc = new T.Scene(), S = sog; S.scene = sc;
  sc.background = new T.Color(0xb9d4e8); sc.fog = new T.Fog(0xd2d6cc, 95, 270);
  sc.add(new T.HemisphereLight(0xfff6e4, 0x9a8258, .62));
  const sun = new T.DirectionalLight(0xffe4b4, .5); sun.position.set(-60, 70, -40); sc.add(sun);
  const fill = new T.DirectionalLight(0xdfe8ff, .14); fill.position.set(50, 30, 60); sc.add(fill);
  const gt = groundTexture(31, 190, 166, 106); gt.repeat.set(150, 150);
  const land = new T.Mesh(new T.PlaneGeometry(600, 600).rotateX(-PI / 2), new T.MeshLambertMaterial({ map: gt })); land.position.set(10, 0, 70); sc.add(land);

  const rng = rngSeed(328), Rc = S.rects, L = [];
  const blk = (x0, x1, z0, z1, h, plat) => { const r = { x0: x0, x1: x1, z0: z0, z1: z1, h: h, plat: !!plat }; Rc.push(r); return r; };
  const circ = (x, z, r) => S.trees.push({ x: x, z: z, r: r });
  const P = (cx, cy, cz, sx, sy, sz, c) => L.push([cx, cy, cz, sx, sy, sz, c]);
  const J = (hex, a) => jit(hex, a === undefined ? .05 : a, rng);
  const box = (x0, x1, y0, y1, z0, z1, c) => L.push([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0, c]);
  const MUD = 0xd2b07c, MUD_D = 0xb8935e, MUD_L = 0xe2c796, WOODC = 0x7a5632, WOOD_D = [.31, .22, .14], BLUE = 0x2f6fb0;
  const DYE = [0xb3472d, 0x1f7f84, 0xd9a61c, 0x6a3f8a, 0xe8dcc0, 0x3f7a4a];

  /* ---------- pieces ---------- */
  const wall = (x0, x1, z0, z1, h) => {
    box(x0, x1, 0, h, z0, z1, J(MUD, .03)); box(x0 - .06, x1 + .06, h * .45, h * .45 + .25, z0 - .06, z1 + .06, J(MUD_D, .03)); blk(x0, x1, z0, z1, h);
    if (x1 - x0 > z1 - z0) for (let x = x0 + .8; x < x1 - .5; x += 2.2) P(x, h + .45, (z0 + z1) / 2, 1.2, .9, z1 - z0, J(MUD_L, .04));
    else for (let z = z0 + .8; z < z1 - .5; z += 2.2) P((x0 + x1) / 2, h + .45, z, x1 - x0, .9, 1.2, J(MUD_L, .04));
  };
  const tower = (x0, x1, z0, z1, h) => {
    box(x0, x1, 0, h, z0, z1, J(MUD, .03)); box(x0 - .2, x1 + .2, h, h + .35, z0 - .2, z1 + .2, J(MUD_D, .03)); blk(x0, x1, z0, z1, h);
    for (const q of [[x0 + .45, z0 + .45], [x1 - .45, z0 + .45], [x0 + .45, z1 - .45], [x1 - .45, z1 - .45]]) P(q[0], h + .9, q[1], .9, 1.1, .9, J(MUD_L, .04));
    P((x0 + x1) / 2, h * .62, z0 - .03, .5, 1.3, .08, DARK); P((x0 + x1) / 2, h * .62, z1 + .03, .5, 1.3, .08, DARK);
    P(x0 - .03, h * .62, (z0 + z1) / 2, .08, 1.3, .5, DARK); P(x1 + .03, h * .62, (z0 + z1) / 2, .08, 1.3, .5, DARK);
  };
  const house = (x0, x1, z0, z1, h) => {
    const c = J([MUD, MUD_L, 0xc9a26c, 0xdcc08e][(rng() * 4) | 0], .04), dk = [c[0] * .86, c[1] * .84, c[2] * .8];
    box(x0, x1, 0, h, z0, z1, c); box(x0 - .1, x1 + .1, h, h + .4, z0 - .1, z1 + .1, dk); blk(x0, x1, z0, z1, h + .4);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    /* a door and a small window on each side wide enough for them; roof beams poke out under the parapet */
    for (const f of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const wide = f[0] ? z1 - z0 : x1 - x0; if (wide < 3.2) continue;
      const k = (rng() - .5) * (wide - 2.6), k2 = clamp(k + (k > 0 ? -2 : 2), -wide / 2 + .8, wide / 2 - .8);
      if (f[0]) {
        const fx_ = f[0] < 0 ? x0 - .03 : x1 + .03;
        P(fx_, 1, cz + k, .1, 2, 1, J(0x5a3c22, .1)); if (wide > 4.6) P(fx_, 2.45, cz + k2, .1, .7, .6, DARK);
        for (let b = z0 + .6; b < z1 - .3; b += 1.3) P(fx_ + f[0] * .1, h - .35, b, .3, .16, .16, WOOD_D);
      } else {
        const fz_ = f[1] < 0 ? z0 - .03 : z1 + .03;
        P(cx + k, 1, fz_, 1, 2, .1, J(0x5a3c22, .1)); if (wide > 4.6) P(cx + k2, 2.45, fz_, .6, .7, .1, DARK);
        for (let b = x0 + .6; b < x1 - .3; b += 1.3) P(b, h - .35, fz_ + f[1] * .1, .16, .16, .3, WOOD_D);
      }
    }
    if (rng() < .45) P(lerp(x0, x1, .3 + rng() * .4), h + .8, lerp(z0, z1, .3 + rng() * .4), 1.3, .8, 1.3, dk);                                  /* a roof room */
    if (rng() < .35) P(cx, h + .47, cz, Math.min(2.2, x1 - x0 - 1), .12, Math.min(1.5, z1 - z0 - 1), J(DYE[(rng() * 6) | 0], .06));             /* a rug drying on the roof */
  };
  const fillB = (x0, x1, z0, z1) => {
    const ax = x1 - x0 >= z1 - z0; let a = ax ? x0 : z0; const b = ax ? x1 : z1;
    while (a < b - .01) {
      let d = 4.5 + rng() * 3.5; if (b - a - d < 3.6) d = b - a;
      const h = 3 + rng() * 1.6;
      if (ax) house(a, a + d, z0, z1, h); else house(x0, x1, a, a + d, h);
      a += d;
    }
  };
  /* a counter under a striped awning; the counter is low cover and something to hop on */
  const stall = (x, z, hex) => {
    box(x - 2, x + 2, 0, 1.2, z - .7, z + .7, J(WOODC, .08)); blk(x - 2, x + 2, z - .7, z + .7, 1.2, true);
    for (const q of [[-2.1, -1.3], [2.1, -1.3], [-2.1, 1.3], [2.1, 1.3]]) P(x + q[0], 1.5, z + q[1], .14, 3, .14, WOOD_D);
    for (let i = 0; i < 6; i++) P(x - 1.9 + i * .76, 3.05, z, .76, .1, 3, i % 2 ? J(hex, .05) : J(0xe8dcc0, .04));
  };
  const jarAt = (x, y, z, s, hex) => { P(x, y + .3 * s, z, .42 * s, .6 * s, .42 * s, J(hex, .06)); P(x, y + .66 * s, z, .26 * s, .14 * s, .26 * s, J(hex, .08)); };
  const hay = (x, z) => { P(x, .55, z, 2.3, 1.1, 2.3, J(0xd9b84a, .06)); P(x + .15, 1.3, z - .1, 1.6, .5, 1.6, J(0xe2c45a, .06)); P(x - .2, 1.62, z + .1, .9, .2, .9, J(0xd0ac40, .06)); S.hay.push([x, z]); };
  const crate = (x, z, s, y) => { P(x, (y || 0) + s / 2, z, s, s, s, J(0x9a7446, .08)); P(x, (y || 0) + s / 2, z, s + .04, .1, s + .04, WOOD_D); };
  const crates = (x, z) => { crate(x - .62, z, 1.2); crate(x + .62, z, 1.2); crate(x, z + .1, .8, 1.2); blk(x - 1.22, x + 1.22, z - .6, z + .6, 1.2, true); };
  const poplar = (x, z, s) => {
    const h = (4.6 + rng() * 2.6) * s; P(x, h * .25, z, .3 * s, h * .5, .3 * s, J(0x6a5238, .1));
    for (let i = 0; i < 4; i++) P(x, h * (.42 + i * .17), z, (1.5 - i * .3) * s, h * .2, (1.5 - i * .3) * s, J(i % 2 ? 0x5f8a3a : 0x6f9a40, .08));
    circ(x, z, .4);
  };
  const rock = (x, z, w, h, d) => { P(x, h / 2, z, w, h, d, J(0x9a8f80, .06)); P(x + w * .12, h + .12, z - d * .1, w * .55, .3, d * .5, J(0xa89c8a, .06)); blk(x - w / 2, x + w / 2, z - d / 2, z + d / 2, h, true); };
  const yurt = (x, z, r, band) => {
    P(x, .9, z, r * 2, 1.8, r * 2, J(0xe6dcc4, .04)); P(x, 1.7, z, r * 2 + .06, .28, r * 2 + .06, J(band, .05)); P(x, 2.15, z, r * 1.6, .6, r * 1.6, J(0xd8ccb0, .04));
    P(x, 2.65, z, r * 1.05, .5, r * 1.05, J(0xcfc2a4, .04)); P(x, 3, z, r * .4, .25, r * .4, DARK); P(x - r - .03, .8, z, .08, 1.6, .9, J(band, .05));
    blk(x - r, x + r, z - r, z + r, 3);
  };
  const beast = (x, z, alongX, camel) => {
    const c = J(camel ? 0xc9a066 : [0x6a4628, 0x8a6a48, 0x2a2420, 0xb8a888][(rng() * 4) | 0], .06), l = camel ? 2.3 : 2, hgt = camel ? 1.5 : 1.25;
    const Q = (dx, y, dz, sx, sy, sz, cc) => alongX ? P(x + dx, y, z + dz, sx, sy, sz, cc) : P(x + dz, y, z + dx, sz, sy, sx, cc);
    Q(0, hgt, 0, l, .8, .75, c);
    for (const a of [-.75, .75]) for (const b of [-.25, .25]) Q(a * l / 2.2, hgt / 2 - .2, b, .22, hgt - .2, .22, c);
    Q(l / 2 + .15, hgt + .65, 0, .35, 1.1, .4, c); Q(l / 2 + .5, hgt + 1.15, 0, .7, .4, .42, c);
    if (camel) Q(-.1, hgt + .6, 0, .9, .5, .6, c); else Q(-l / 2 - .1, hgt + .1, 0, .15, .7, .15, DARK);
    circ(x, z, 1.15);
  };
  const tent = (x, z, w, d, hex) => { for (let i = 0; i < 5; i++) P(x, .2 + i * .4, z, w * (1 - i / 5.4), .42, d, J(hex, .05)); P(x, 1, z - d / 2 - .02, .7, 1.5, .06, [.2, .15, .1]); circ(x, z, Math.max(w, d) / 2 + .1); };
  const fire = (x, z) => { for (const q of [[-.3, 0], [.3, 0], [0, -.3], [0, .3]]) P(x + q[0], .12, z + q[1], q[0] ? .2 : .7, .2, q[0] ? .7 : .2, WOOD_D); circ(x, z, .7); S.flameAt.push([x, .2, z, .55]); };
  const flag = (x, y, z, hex, alongX) => { P(x, y / 2, z, .14, y, .14, WOOD_D); if (alongX) P(x + .75, y - .6, z, 1.4, 1, .06, J(hex, .04)); else P(x, y - .6, z + .75, .06, 1, 1.4, J(hex, .04)); };
  const pot = (x, z) => { jarAt(x, 0, z, 1.25, 0xb8703a); P(x, .84, z, .4, .06, .4, J(0x8a5028, .06)); circ(x, z, .42); S.pots.push([x, z]); };

  /* ---------- the country around ---------- */
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * PI * 2 + rng() * .15, d = 190 + rng() * 40, x = 10 + Math.cos(a) * d, z = 70 + Math.sin(a) * d, w = 44 + rng() * 36, h = 12 + rng() * 20;
    P(x, h / 2, z, w, h, w * .8, J(0x86808e, .05)); P(x + rng() * 8 - 4, h + 3.5, z, w * .6, 7, w * .5, J(0x8f8a98, .05)); P(x + rng() * 8 - 4, h + 9, z, w * .34, 5, w * .3, J(0x9a96a4, .04)); P(x + rng() * 6 - 3, h + 13, z, w * .18, 3.5, w * .16, J(0xf4f4f8, .02));
  }
  for (let i = 0; i < 21; i++) P((rng() - .5) * .5, .03, 5 + i * 2, 4.4 + rng() * .5, .06, 2.05, J(0xc9a672, .05));                 /* the road north */
  for (let i = 0; i < 6; i++) P(37 + i * 2, .03, 78 + (rng() - .5) * .4, 2.05, .06, 4 + rng() * .5, J(0xc9a672, .05));             /* the track to the horsemen */
  for (let i = 0; i < 29; i++) P(25 + i * 2, .04, 118.2 + Math.sin(i * .7) * .12, 2.05, .08, 1.7, J(BLUE, .06));                   /* the stream that feeds the citadel */
  for (let i = 0; i < 300; i++) {
    const x = -58 + rng() * 136, z = -9 + rng() * 154;
    if (x > -37 && x < 37 && z > 46 && z < 141) continue;
    P(x, .08, z, .2 + rng() * .3, .16, .2 + rng() * .3, rng() < .6 ? J(0x9a9a52, .12) : J(0xa89c8a, .08));
  }
  for (const q of [[-9, 18], [8, 21], [-14, 36], [20, 40], [-28, 14], [-40, 40], [-47, 60], [-44, 104], [-33, 122], [44, 52], [52, 44], [30, 16], [46, 104], [58, 112], [70, 100],
    [31, 121.6], [38, 115], [47, 121.5], [56, 115.2], [66, 121.4], [74, 115.4], [-52, 20], [62, 22], [-30, 132], [36, 136], [-6, 143]]) poplar(q[0], q[1], .9 + rng() * .4);
  rock(-19.6, 25.6, 2.6, 1.2, 1.8); rock(-23.2, 28.6, 1.8, .9, 2.2); rock(-13, 30, 1.6, .8, 1.4); rock(24, 22, 2.2, 1.1, 1.8); rock(-36, 30, 2, 1, 2); rock(40, 34, 1.8, .9, 1.6);
  rock(-45, 72, 2.2, 1.1, 1.8); rock(42, 108, 2, 1, 1.8); rock(-30, 112, 2.4, 1.2, 2); rock(56, 54, 2, 1, 2);
  hay(-16, 40); hay(18, 44.5); hay(-41, 66); hay(41.5, 96); hay(46.5, 82.5); hay(59, 92.5); hay(31, 112);

  /* ---------- the scout camp ---------- */
  box(-11, -5, 0, 2.2, 1.6, 6.6, J(0xe9e0cc, .03)); blk(-11, -5, 1.6, 6.6, 3.6);
  for (let i = 0; i < 4; i++) box(-11 + i * .5, -5 - i * .5, 2.2 + i * .4, 2.6 + i * .4, 1.45, 6.75, J(i % 2 ? 0xa82a22 : 0xe9e0cc, .03));
  P(-4.97, 1.1, 4.1, .06, 2.2, 1.4, [.2, .15, .1]);
  tent(7.5, 3.5, 3.4, 4.2, 0xd8cba8); tent(9.5, -3.5, 3.4, 4.2, 0x9a6a44);
  fire(4.6, -1.4); crate(-3.6, -2.2, 1); crate(-4.5, -2.8, .8); blk(-5, -3, -3.3, -1.6, 1, true);
  P(-3.4, 2.7, 5.4, .14, 5.4, .14, WOOD_D); P(-3.4, 4.9, 5.4, .12, 1.3, 1.3, GOLD); P(-3.4, 4.9, 5.4, .13, .5, 1.9, GOLD); P(-3.4, 4.9, 5.4, .13, 1.9, .5, GOLD); circ(-3.4, 5.4, .3);     /* the sun of Macedon */
  beast(-9.5, -3.2, true, false); beast(-12.2, -5.4, true, false); box(-13.5, -7.5, .9, 1, -1.9, -1.75, WOOD_D); P(-13.5, .5, -1.82, .14, 1, .14, WOOD_D); P(-7.5, .5, -1.82, .14, 1, .14, WOOD_D);

  /* ---------- the caravan on the road ---------- */
  stall(11, 30.2, 0x1f7f84);
  for (let i = 0; i < 5; i++) P(9.6 + i * .7, 1.32, 30.2, .6, .22, 1, J(DYE[i], .05));
  P(10, 1.3, 33, .12, 2.6, .12, WOOD_D); P(10, 2.5, 33, 2.4, .1, .1, WOOD_D); for (let i = 0; i < 4; i++) P(9.1 + i * .6, 1.75, 33, .5, 1.4, .1, J(DYE[(i + 1) % 6], .05)); circ(10, 33, .5);
  beast(15.4, 27.4, false, true); beast(16.2, 33.6, false, true);
  for (const q of [[13.6, 30.4], [14.4, 29.6], [13.8, 31.2]]) P(q[0], .4, q[1], .9, .8, .7, J(0xb89a6a, .08)); blk(13.1, 14.9, 29.2, 31.6, .8, true);

  /* ---------- the walls of Gabae ---------- */
  wall(-36, -6, 48, 50, 6); wall(6, 36, 48, 50, 6); tower(-6.4, -3, 46.8, 51.2, 8.4); tower(3, 6.4, 46.8, 51.2, 8.4); box(-3, 3, 5, 6.7, 48.1, 49.9, J(MUD_D, .03));
  wall(-36, -34, 50, 65, 6); wall(-36, -34, 71, 96, 6);
  wall(34, 36, 50, 72.6, 6); wall(34, 36, 83.4, 96, 6); tower(34, 37.4, 72.6, 75, 8); tower(34, 37.4, 81, 83.4, 8); box(34.1, 35.9, 5, 6.6, 75, 81, J(MUD_D, .03));
  wall(-36, -24, 96, 98, 6); wall(24, 36, 96, 98, 6);
  tower(-38, -33.5, 45.5, 50, 9); tower(33.5, 38, 45.5, 50, 9); tower(-38, -33.5, 94, 98.5, 9); tower(33.5, 38, 94, 98.5, 9);
  /* the broken stretch of the west wall: a heap of rubble that can be climbed in three jumps */
  box(-36, -34, 0, 1.6, 65, 71, J(MUD_D, .04)); blk(-36, -34, 65, 71, 1.6, true);
  box(-37.6, -36, 0, .8, 65.6, 70.4, J(MUD, .05)); blk(-37.6, -36, 65.6, 70.4, .8, true);
  box(-34, -32.8, 0, .8, 65.6, 70.4, J(MUD, .05)); blk(-34, -32.8, 65.6, 70.4, .8, true);
  for (let i = 0; i < 16; i++) P(-35 + (rng() - .5) * 7, .25 + rng() * .2, 68 + (rng() - .5) * 8, .5 + rng() * .6, .5, .5 + rng() * .6, J(MUD_D, .08));
  for (let i = 0; i < 5; i++) P(-35 + (rng() - .5) * 1.4, 1.75 + rng() * .3, 65.6 + i * 1.2, .7 + rng() * .5, .5, .7, J(MUD_L, .06));

  /* ---------- the town ---------- */
  for (let i = 0; i < 23; i++) P((rng() - .5) * .3, .03, 51 + i * 2, 5.6 + rng() * .3, .06, 2.05, J(0xc4a274, .05));           /* the main street */
  fillB(-31, -3, 53, 62); fillB(-31, -21, 62, 66); fillB(-18, -15, 62, 66);
  fillB(3, 31, 53, 62); fillB(15, 31, 62, 75);
  fillB(-31, -25, 70, 93); fillB(-22, -15, 70, 93); fillB(-15, -3, 84, 93);
  fillB(15, 22, 81, 93); fillB(22, 31, 81, 84); fillB(3, 15, 84, 93);
  /* the bazaar */
  for (let i = 0; i < 40; i++) P(-14 + rng() * 28, .025, 63 + rng() * 20, 1.6, .05, 1.6, J(0xcaa878, .06));
  stall(-10.5, 80, BLUE); stall(10.5, 80, 0xd9a61c); stall(-10.5, 65.5, 0xb3472d); stall(10.5, 65.5, 0x3f7a4a);
  for (let i = 0; i < 5; i++) jarAt(-12 + i * .75, 1.2, 80, .8 + (i % 2) * .25, BLUE);                                          /* the potter's blue jars */
  P(-13.4, 2.2, 78.4, .14, 4.4, .14, WOOD_D); for (let i = 0; i < 3; i++) jarAt(-13.4, 4.2 + i * .62, 78.4, 1 - i * .2, BLUE); circ(-13.4, 78.4, .35);
  for (let i = 0; i < 6; i++) P(9 + i * .6, 1.3, 80 + (i % 2) * .3 - .15, .5, .14, .5, J(0xd9b074, .06));                         /* flat bread */
  for (let i = 0; i < 4; i++) P(-12 + i, 1.26, 65.5, .9, .1, 1.2, J(DYE[i], .05));                                               /* rugs */
  for (let i = 0; i < 7; i++) P(9.1 + i * .48, 1.38, 65.5 + (i % 2) * .34 - .17, .36, .36, .36, J(i % 3 ? 0x6f9a40 : 0xd9a61c, .08)); /* melons */
  P(7, .45, 73, 2, .9, 2, J(0xa89c8a, .05)); P(7, .92, 73, 1.4, .06, 1.4, J(BLUE, .05)); P(6.1, 1.6, 73, .14, 1.6, .14, WOOD_D); P(7.9, 1.6, 73, .14, 1.6, .14, WOOD_D); P(7, 2.4, 73, 2, .14, .14, WOOD_D); circ(7, 73, 1.35);
  box(-8.2, -5.8, .4, 1.2, 71.3, 72.7, J(WOODC, .08)); P(-8.3, .45, 71.2, .12, .9, .9, WOOD_D); P(-5.7, .45, 72.8, .12, .9, .9, WOOD_D); blk(-8.2, -5.8, 71.3, 72.7, 1.2, true);
  hay(-13.5, 73.4); hay(13.4, 70.2); hay(-19.5, 64.8); hay(-23.5, 71.3); hay(32.6, 66); hay(-32.6, 58); hay(26.5, 91.5); hay(-32.6, 86); hay(8, 94.8);
  for (const q of [[-14, 62.9], [14, 62.9], [-4.2, 83.3], [4.2, 83.3], [14.2, 83.2]]) { jarAt(q[0], 0, q[1], 1.5, 0xb8703a); circ(q[0], q[1], .45); }
  /* the east street and the guards' table */
  box(26.3, 28.7, 0, 1.1, 75.4, 76.6, J(WOODC, .08)); blk(26.3, 28.7, 75.4, 76.6, 1.1, true); P(26.6, 1.25, 76, .3, .3, .3, J(0xd9b074, .06)); P(28.4, 1.2, 76, .5, .2, .4, STEEL_D);
  crates(21, 76.2);
  /* the dyers' yard */
  for (const q of [[23.6, 86.2, 0], [25.6, 86.2, 1], [27.6, 86.2, 2], [29.4, 86.4, 3]]) { P(q[0], .5, q[1], 1.3, 1, 1.3, J(0xa89c8a, .05)); P(q[0], 1.02, q[1], 1, .06, 1, J(DYE[q[2]], .05)); blk(q[0] - .65, q[0] + .65, q[1] - .65, q[1] + .65, 1, true); }
  P(23, 1.5, 90, .12, 3, .12, WOOD_D); P(29.5, 1.5, 90, .12, 3, .12, WOOD_D); P(26.25, 2.9, 90, 6.6, .08, .08, WOOD_D); for (let i = 0; i < 5; i++) P(23.9 + i * 1.2, 2.1, 90, .9, 1.5, .08, J(DYE[i], .05)); circ(23, 90, .3); circ(29.5, 90, .3);

  /* ---------- the citadel ---------- */
  wall(-24, -6, 96, 98, 8.5); wall(6, 24, 96, 98, 8.5); tower(-6.6, -3, 95.4, 98.6, 10.6); tower(3, 6.6, 95.4, 98.6, 10.6); box(-3, 3, 5.4, 8.5, 96.1, 97.9, J(MUD_D, .03));
  wall(-24, -22, 98, 138, 8.5); wall(-24, 24, 138, 140, 8.5); wall(22, 24, 98, 117, 8.5); wall(22, 24, 119.4, 138, 8.5);
  box(22, 24, 1.5, 8.5, 117, 119.4, J(MUD_D, .03)); S.grateRect = blk(22, 24, 117, 119.4, 8.5);
  tower(-26, -21.5, 96, 100.5, 11.5); tower(21.5, 26, 96, 100.5, 11.5); tower(-26, -21.5, 137.5, 142, 11.5); tower(21.5, 26, 137.5, 142, 11.5);
  flag(-4.8, 13.2, 96.8, 0xb3472d, true); flag(4.8, 13.2, 96.8, 0xb3472d, true);
  for (let i = 0; i < 12; i++) P((rng() - .5) * .3, .03, 99 + i * 2, 5.6, .06, 2.05, J(0xc4a274, .05));
  /* the court: a stable, a barracks, the cistern where the channel comes in */
  box(-22, -18, 0, 3, 100, 110, J(MUD_L, .04)); box(-22.05, -17.8, 3, 3.3, 99.9, 110.1, J(WOODC, .06)); blk(-22, -18, 100, 110, 3.3);
  for (let i = 0; i < 4; i++) P(-17.97, 1.1, 101.3 + i * 2.5, .08, 2.2, 1.6, DARK);
  box(18, 22, 0, 3.4, 100, 112, J(MUD, .04)); box(17.9, 22.05, 3.4, 3.8, 99.9, 112.1, J(MUD_D, .04)); blk(18, 22, 100, 112, 3.8);
  for (let i = 0; i < 3; i++) P(17.97, 1, 102 + i * 4, .08, 2, 1, J(0x5a3c22, .1));
  for (let i = 0; i < 4; i++) P(21 - i * 2, .04, 118.2, 2.05, .08, 1.7, J(BLUE, .06));
  box(14, 20.4, 0, .1, 116.4, 120, J(BLUE, .05));
  box(13.3, 13.9, 0, 1.2, 115.4, 121, J(0xa89c8a, .05)); blk(13.3, 13.9, 115.4, 121, 1.2, true);
  box(13.3, 21.9, 0, 1.2, 115.2, 115.8, J(0xa89c8a, .05)); blk(13.3, 21.9, 115.2, 115.8, 1.2, true);
  hay(16.2, 122.6); hay(20, 133.6); hay(-20.4, 121.2); hay(-9.5, 100.4);
  crates(9, 99.4); crates(-20, 127); crates(-14.2, 129.6); crates(17.4, 126.6);
  fire(-9, 107);
  /* the hall: an open court of pillars, with the lord's seat at the far end */
  const HW = 0xdcc08e;
  const HH = 2.9;      /* low enough for the camera to look over, high enough to hide behind */
  box(-12, -2.5, 0, HH, 124, 125, J(HW, .03)); blk(-12, -2.5, 124, 125, HH); box(2.5, 12, 0, HH, 124, 125, J(HW, .03)); blk(2.5, 12, 124, 125, HH);
  box(-12, 12, 0, HH, 135, 136, J(HW, .03)); blk(-12, 12, 135, 136, HH); box(-12, -11, 0, HH, 125, 135, J(HW, .03)); blk(-12, -11, 125, 135, HH);
  box(11, 12, 0, HH, 125, 130.6, J(HW, .03)); blk(11, 12, 125, 130.6, HH); box(11, 12, 0, HH, 133.4, 135, J(HW, .03)); blk(11, 12, 133.4, 135, HH);
  box(-12.1, 12.1, HH, HH + .3, 123.9, 125.1, J(BLUE, .04)); box(-12.1, 12.1, HH, HH + .3, 134.9, 136.1, J(BLUE, .04)); box(-12.1, -10.9, HH, HH + .3, 125.1, 134.9, J(BLUE, .04));
  box(10.9, 12.1, HH, HH + .3, 125.1, 130.6, J(BLUE, .04)); box(10.9, 12.1, HH, HH + .3, 133.4, 134.9, J(BLUE, .04));
  for (const z of [130.6, 133.4]) box(10.8, 12.2, 0, HH + .9, z - .25, z + .25, J(0xe9e0cc, .03));      /* door posts */
  box(-10.9, 10.9, 0, .05, 125.1, 134.9, J(0xc9b48a, .04)); box(-2, 2, .05, .09, 125.1, 134, J(0xa5332b, .05)); box(-1.6, 1.6, .09, .11, 125.4, 133.8, J(0xc0452f, .05));
  for (const q of [[-6, 127.5], [6, 127.5], [-6, 131.5], [6, 131.5]]) { box(q[0] - .5, q[0] + .5, 0, 4.2, q[1] - .5, q[1] + .5, J(0xe9e0cc, .03)); box(q[0] - .65, q[0] + .65, 3.8, 4.2, q[1] - .65, q[1] + .65, J(BLUE, .04)); blk(q[0] - .5, q[0] + .5, q[1] - .5, q[1] + .5, 4.2); }
  box(-1.3, 1.3, .4, 1, 129, 130.2, J(WOODC, .06)); P(-1.1, .2, 129.1, .2, .4, .2, WOOD_D); P(1.1, .2, 129.1, .2, .4, .2, WOOD_D); P(-1.1, .2, 130.1, .2, .4, .2, WOOD_D); P(1.1, .2, 130.1, .2, .4, .2, WOOD_D);
  P(0, 1.03, 129.6, 1.8, .04, .9, J(0xe6dcc0, .04)); P(-.4, 1.08, 129.5, .2, .08, .2, J(0xb3472d, .05)); P(.5, 1.08, 129.8, .2, .08, .2, J(BLUE, .05)); blk(-1.3, 1.3, 129, 130.2, 1, true);
  box(-1, 1, 0, .6, 134.1, 135, J(0x8a6420, .05)); box(-1, 1, .6, 2.4, 134.7, 135, J(0x8a6420, .05)); box(-1.1, -.8, .6, 1.2, 134.1, 134.8, GOLD); box(.8, 1.1, .6, 1.2, 134.1, 134.8, GOLD); blk(-1, 1, 134.1, 135, 2.4);
  flag(-9.6, 5.2, 135.5, 0xb3472d, true); flag(8.4, 5.2, 135.5, 0xb3472d, true);

  /* ---------- the camp of the Massagetae ---------- */
  yurt(60.5, 74, 2.6, 0xb3472d); yurt(52, 68.5, 2.1, 0x1f7f84); yurt(63, 84.5, 2.1, 0xd9a61c); yurt(55, 89, 2.1, 0xb3472d); yurt(68.5, 78.6, 2.1, 0x1f7f84);
  fire(56.4, 79);
  beast(47.5, 88.5, true, false); beast(49.8, 91.4, true, false); beast(70.5, 69.5, false, false); beast(72.6, 73, false, false); beast(66, 68, true, false);
  P(57.2, 1.4, 72.2, .12, 2.8, .12, WOOD_D); for (let i = 0; i < 3; i++) P(57.2, 2.2 + i * .3, 72.2 + .3 + i * .1, .06, .2, .6 + i * .15, J(0x2a2420, .05)); circ(57.2, 72.2, .3);

  /* ---------- a ruined watchtower in the west ---------- */
  box(-52.4, -48, 0, 2.6, 82, 83, J(MUD_D, .05)); blk(-52.4, -48, 82, 83, 2.6); box(-52.4, -51.4, 0, 4.2, 83, 87, J(MUD_D, .05)); blk(-52.4, -51.4, 83, 87, 4.2);
  box(-49, -48, 0, 1.2, 83, 85.4, J(MUD, .05)); blk(-49, -48, 83, 85.4, 1.2, true);
  for (let i = 0; i < 9; i++) P(-50 + (rng() - .5) * 6, .25, 86 + rng() * 4, .6 + rng() * .5, .5, .6 + rng() * .5, J(MUD_D, .08));

  for (const q of S_STASH) pot(q[0], q[1]);
  sc.add(new T.Mesh(buildBoxes(L), MAT_STATIC));

  /* things that change during play: the citadel door, the grate, the potter's jar */
  S.doorRect = blk(-3, 3, 96.4, 97.6, 5.4);
  const D = []; for (let i = 0; i < 6; i++) D.push([-2.5 + i, 2.7, 97, .98, 5.4, .3, jit(i % 2 ? 0x6a4628 : 0x7a5632, .05, rng)]);
  D.push([0, 1.4, 96.82, 6, .2, .08, STEEL_D], [0, 3.8, 96.82, 6, .2, .08, STEEL_D]);
  S.door = new T.Mesh(buildBoxes(D), MAT_STATIC); sc.add(S.door);
  const G = []; for (let i = 0; i < 5; i++) G.push([24.02, .75, 117.3 + i * .45, .1, 1.5, .1, STEEL_D]); G.push([24.02, 1.2, 118.2, .1, .1, 2.3, STEEL_D], [24.02, .4, 118.2, .1, .1, 2.3, STEEL_D]);
  S.grate = new T.Mesh(buildBoxes(G), MAT_STATIC); sc.add(S.grate);
  S.jar = new T.Mesh(buildBoxes([[27.5, 1.4, 76, .42, .6, .42, BLUE], [27.5, 1.76, 76, .26, .14, .26, 0x3f84c8]]), MAT_STATIC); sc.add(S.jar);

  /* fire, the objective beacon, markers over heads and the guards' fields of view */
  const F = S.flameAt;
  S.flames = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ fog: false }), F.length * 2);
  S.flames.instanceColor = new T.BufferAttribute(new Float32Array(F.length * 6), 3);
  for (let i = 0; i < F.length; i++) { _col.setHex(0xff7a1c); _col.toArray(S.flames.instanceColor.array, i * 6); _col.setHex(0xffd95a); _col.toArray(S.flames.instanceColor.array, i * 6 + 3); }
  S.flames.frustumCulled = false; sc.add(S.flames);
  S.beacon = new T.Mesh(new T.BoxGeometry(1.2, 18, 1.2), new T.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: .3, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
  S.beacon.visible = false; S.beacon.renderOrder = 6; sc.add(S.beacon);
  S.markMesh = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ fog: false }), 96);
  S.markMesh.instanceColor = new T.BufferAttribute(new Float32Array(96 * 3), 3);
  S.markMesh.frustumCulled = false; S.markMesh.count = 0; S.markMesh.renderOrder = 5; S.markMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); sc.add(S.markMesh);
  const wp = [0, 0, 0], wi = [], seg = 12;
  for (let i = 0; i <= seg; i++) { const a = -S_TUNE.half + 2 * S_TUNE.half * i / seg; wp.push(Math.sin(a), 0, Math.cos(a)); }
  for (let i = 1; i <= seg; i++) wi.push(0, i, i + 1);
  const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute(wp, 3)); wg.setIndex(wi);
  S.coneMesh = new T.InstancedMesh(wg, new T.MeshBasicMaterial({ transparent: true, opacity: .2, depthWrite: false, side: T.DoubleSide, fog: false }), 32);
  S.coneMesh.instanceColor = new T.BufferAttribute(new Float32Array(32 * 3), 3);
  S.coneMesh.frustumCulled = false; S.coneMesh.count = 0; S.coneMesh.renderOrder = 1; S.coneMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); sc.add(S.coneMesh);

  Object.assign(S, combatLayers(sc));
  S.army = new Army(sc, 56, true); S.civ = new Army(sc, 44, false); S.rules = sogRules;
  S.field = new Int16Array(GNX * GNZ); S.field2 = new Int16Array(GNX * GNZ); S.queue = new Int32Array(GNX * GNZ);
}

/* ---------- who is who ---------- */
const SKIN3 = [0xd9a47a, 0xc99468, 0xb98058, 0xe0b088], HAIR3 = [0x2a1c12, 0x3a2a1a, 0x1c1410, 0x5a3a1e];
const LOOK_COMPANION = { tunic: 0xe9e2d0, skirt: 0xe9e2d0, robe: 0x1f7f84, trousers: 0xe8b98f, skin: 0xe8b98f, hair: 0x7a4a22, helmet: false, cap: 0xcbb38a, beard: false, cloak: 0x8a5a3a, shield: 'none', weapon: 'knife', stab: true };
const LOOK_COENUS = { tunic: 0xc9973a, sleeve: 0xf2ecda, skirt: 0xf2ecda, trousers: 0xe0b088, skin: 0xe0b088, hair: 0x5a3a1e, helmet: 'roman', helmetTint: 0xd8a848, plume: 0xf2f0e8, cloak: 0x6a2a7a, beard: true, shield: 'none', weapon: 'sword', scale: 1.14 };
function lookHetairos() { const sk = pick(SKIN); return { tunic: 0xb98a3a, sleeve: 0xf2ecda, skirt: 0xf2ecda, trousers: sk, skin: sk, hair: pick(HAIR), helmet: 'roman', helmetTint: 0xc9a040, plume: 0x6a2a7a, cloak: 0x7a3a8a, beard: false, shield: 'none', weapon: 'spear' }; }
function lookSogdian() { const sk = pick(SKIN3); return { tunic: pick([0xb3472d, 0xc9762c, 0x9a3a2a]), sleeve: 0xd9a61c, trousers: pick([0x3a5a6a, 0x5a4a3a, 0x2f4a55]), skin: sk, hair: pick(HAIR3), helmet: Math.random() < .5, helmetTint: 0xb98a3a, cap: 0xd9a61c, beard: true, shield: 'round', shieldTint: pick([0xc9a66b, 0xb3472d, 0x1f7f84]), weapon: 'spear' }; }
function lookBodyguard() { const sk = pick(SKIN3); return { tunic: 0xb9a060, sleeve: 0x1f5f84, trousers: 0x1f5f84, cloak: 0x1f5f84, skin: sk, hair: pick(HAIR3), helmet: true, helmetTint: 0xe0b848, plume: 0x1f7f84, beard: true, shield: 'round', shieldTint: 0x1f5f84, weapon: 'sword', scale: 1.08 }; }
const LOOK_SPITAMENES = { tunic: 0x6a2a7a, sleeve: 0xd9a61c, robe: 0x6a2a7a, trousers: 0x3a2a4a, cloak: 0xa5332b, skin: 0xc99468, hair: 0x1c1410, helmet: true, helmetTint: 0xf0cc66, plume: 0xa5332b, beard: true, shield: 'none', weapon: 'sword', scale: 1.24 };
function lookRider() { const sk = pick(SKIN3); return { tunic: pick([0x7a5a36, 0x8a4a2a, 0x5a6a4a]), sleeve: 0xb3472d, trousers: pick([0xb3472d, 0x6a4a2a, 0x3a5a4a]), skin: sk, hair: pick(HAIR3), helmet: false, cap: pick([0xe6dcc4, 0xb3472d, 0x3a2a1a]), beard: Math.random() < .7, shield: 'none', weapon: 'axe', scale: 1.04 }; }
const LOOK_CHIEF = { tunic: 0x8a4a2a, sleeve: 0xd9a61c, robe: 0x8a4a2a, trousers: 0xb3472d, cloak: 0xe6dcc4, skin: 0xb98058, hair: 0x9c9a8c, helmet: false, cap: 0xd9a61c, beard: true, shield: 'none', weapon: 'none', scale: 1.14 };
function lookTownsman() {
  const sk = pick(SKIN3), kid = Math.random() < .2, woman = Math.random() < .5, c = pick([0xe8dcc0, 0xd9a520, 0x1f7f84, 0xb5623a, 0x6a8a3a, 0xc94f3a, 0xe6c9a0, 0x7a4a8a]);
  return { tunic: c, robe: c, sleeve: Math.random() < .5 ? pick([0xe8dcc0, 0xd9a61c]) : c, trousers: sk, skin: sk, hair: pick(HAIR3), helmet: false, veil: woman ? pick([0xe8dcc0, 0xd9a61c, 0xb3472d, 0x1f7f84]) : 0,
    cap: !woman && Math.random() < .6 ? pick([0xb3472d, 0xe6dcc0, 0x3a2a1a]) : 0, beard: !woman && !kid && Math.random() < .6, shield: 'none', weapon: 'none', scale: kid ? rand(.62, .72) : rand(.92, 1.02) };
}
function lookSeller(c) { const sk = pick(SKIN3); return { tunic: c, robe: c, sleeve: 0xe8dcc0, trousers: sk, skin: sk, hair: pick(HAIR3), helmet: false, cap: 0xe6dcc0, beard: true, shield: 'none', weapon: 'none' }; }

function sAdd(look, o) { const u = sog.army.add(Object.assign({}, look, o)); u.y = u.gy = 0; return u; }
function mkGuard(look, x, z, yaw, zone, o) {
  const u = sAdd(look, Object.assign({ team: 1, kind: 'line', x: x, z: z, yaw: yaw, hp: S_TUNE.guardHp, dmg: S_TUNE.guardDmg, blockChance: .25, coolR: S_TUNE.guardCool, hurt: 1, loot: 2, speed: S_TUNE.walk,
    hold: true, aggro: 0, zone: zone, mode: 'post', sus: 0, sees: false, seeD: 99, seeR: 0, run: rand(4.5, 4.9), px: x, pz: z, pyaw: yaw, patrol: null, loop: false, pi: 0, pdir: 1, arr: false, waitT: 0,
    door: null, boss: false, rider: false, path: null, pk: 0, lookT: 0, modeT: 0, told: false, wp: null, wpT: 0, ti: 0, turnT: 4 }, o || {}));
  battle.nor.push(u); sog.guards.push(u); return u;
}
function mkCiv(look, x, z, yaw, o) {
  const u = sog.civ.add(Object.assign({}, look, { team: 2, civ: true, x: x, z: z, yaw: yaw, rad: .36, speed: 1.3 }, o || {}));
  u.face = yaw; u.gx = x; u.gz = z; u.y = u.gy = 0; return u;
}
function partOf(u, name) { const b = sog.army.b[name]; for (const p of u.parts) if (p.b === b) return p; return null; }
function tint(p, hex) { if (p) { p.c = hex; p.b.setColor(p.i, hex, 1, 1, 1); } }
function wearRobe(u) { const r = partOf(u, 'robe'); if (r) r.off = false; tint(partOf(u, 'cloak'), 0xd9a520); tint(partOf(u, 'cap'), 0xa5332b); u.flashOn = false; }

/* Put everyone in their places. Flags (what the player has bought, learnt and decided) are kept when he is caught and starts again from his last checkpoint. */
function sogPopulate(fresh) {
  const B = battle, S = sog;
  useLevel('sogdiana');
  if (fresh) { S.flags = sogFlags(); S.cp = [0, -4, 0]; S.deaths = 0; S.kills = 0; S.seen = {}; }
  else S.kills = B.player ? B.player.kills : 0;
  S.fresh = fresh;
  const F = S.flags;
  S.army.reset(); S.civ.reset(); B.units = S.army.units; B.sax = []; B.nor = []; fx.list.length = 0; drops.length = 0;
  B.t = 0; B.over = false; B.result = null; B.endT = 0; B.cardShown = false; B.edgeT = 0; B.lastHurt = -99; B.shake = 0; B.phase = 'wait';
  S.guards = []; S.acts = []; S.riders = []; S.body = []; S.doormen = []; S.talk = null; S.act = null; S.bannerT = 0; S.seenT = -99; S.visT = 0; S.fieldT = 0; S.inHay = false; S.place = ''; S.hudKey = '';
  S.zones = {}; for (const k of ['gate', 'egate', 'town', 'court', 'hall', 'camp']) S.zones[k] = { state: 'calm' };
  /* doors, grate and jar as the flags left them */
  const dr = S.doorRect; if (F.gateOpen) { dr.x0 = dr.x1 = 1e6; } else { dr.x0 = -3; dr.x1 = 3; }
  S.door.visible = !F.gateOpen; S.grate.visible = !F.grate; S.grateRect.duck = F.grate; S.jar.visible = !F.jar && !F.jarGiven;
  gridBuild();

  const p = B.player = sAdd(LOOK_COMPANION, { team: 0, kind: 'line', isPlayer: true, noBlock: true, x: S.cp[0], z: S.cp[1], yaw: S.cp[2], hp: S_TUNE.playerHp, dmg: S_TUNE.knife, range: 1.8, speed: 5.6, rad: .42, mass: 1.6, blockChance: 0,
    windup: .11, strikeEnd: .22, attackDur: .36, hitAt: .17, cool: 0 });
  p.kills = S.kills; B.sax.push(p);
  partOf(p, 'robe').off = true; if (F.robe) wearRobe(p);

  /* the scout camp */
  S.coenus = sAdd(LOOK_COENUS, { team: 0, npc: true, mass: 60, x: 0, z: 2.5, yaw: PI });
  sAdd(lookHetairos(), { team: 0, npc: true, mass: 60, x: -2.6, z: 3.8, yaw: PI - .3 }); sAdd(lookHetairos(), { team: 0, npc: true, mass: 60, x: 2.6, z: 3.8, yaw: PI + .3 });
  sAdd(lookHetairos(), { team: 0, npc: true, mass: 60, x: 6, z: -1.6, yaw: -PI / 2 });

  /* the gates of the town: these guards challenge travellers, they do not hunt for them */
  for (const s of [-1, 1]) S.doormen.push(mkGuard(lookSogdian(), s * 1.9, 48.3, PI, 'gate', { door: 'gate' }));
  for (const s of [-1, 1]) S.doormen.push(mkGuard(lookSogdian(), 35.1, 78 + s * 1.9, PI / 2, 'egate', { door: 'gate' }));
  /* patrols in the town */
  mkGuard(lookSogdian(), 0, 56, 0, 'town', { patrol: [[0, 55.5, 2.5], [0, 90, 2.5]] });
  mkGuard(lookSogdian(), -4.5, 68.4, PI / 2, 'town', { patrol: [[-4.5, 68.4, 1.5], [9.5, 68.4, 1.5], [9.5, 76, 1.5], [-4.5, 76, 1.5]], loop: true });
  mkGuard(lookSogdian(), -17, 68, -PI / 2, 'town', { patrol: [[-17, 68, 3], [-27, 68, 3]] });
  mkGuard(lookSogdian(), -22, 51.5, PI / 2, 'town', { patrol: [[-22, 51.5, 2.5], [22, 51.5, 2.5]] });
  mkGuard(lookSogdian(), 30.5, 79, -PI / 2, 'town', { patrol: [[30.5, 79, 3.5], [18.5, 79, 3.5]] });
  /* the citadel */
  for (const s of [-1, 1]) S.doormen.push(mkGuard(lookSogdian(), s * 1.9, 94.2, PI, 'court', { door: 'cit', helmet: true }));
  mkGuard(lookSogdian(), -15, 101.6, PI / 2, 'court', { patrol: [[-15, 101.6, 1.5], [15, 101.6, 1.5], [15, 112.4, 1.5], [-15, 112.4, 1.5]], loop: true });
  mkGuard(lookSogdian(), -17, 116, 0, 'court', { patrol: [[-17, 116, 2.5], [-17, 133.5, 2.5]] });
  if (F.chief !== 'paid' && F.chief !== 'talked')
    for (const q of [[-10.5, 108.2, 2.2], [-7.5, 108.2, -2.2], [-9, 105.2, 0]]) mkGuard(lookRider(), q[0], q[1], q[2], 'court', { rider: true, hp: S_TUNE.riderHp, dmg: S_TUNE.riderDmg, loot: 3 });
  for (const s of [-1, 1]) S.body.push(mkGuard(lookBodyguard(), s * 2.2, 122.4, PI, 'hall', { door: 'hall', hp: S_TUNE.bodyHp, dmg: S_TUNE.bodyDmg, blockChance: .35, loot: 4 }));
  S.boss = mkGuard(LOOK_SPITAMENES, 0, 131.6, PI, 'hall', { kind: 'king', boss: true, surrenders: true, hp: S_TUNE.bossHp, dmg: S_TUNE.bossDmg, range: 1.75, rad: .5, mass: 8, blockChance: .4, loot: 0, speed: 3.6, run: 3.6 });

  /* people who are no one's enemy */
  S.trader = mkCiv(lookSeller(0x1f7f84), 8.4, 30.2, -PI / 2);
  S.potter = mkCiv(lookSeller(0x2f6fb0), -10.5, 82, PI); mkCiv(lookSeller(0xd9a61c), 10.5, 82, PI); mkCiv(lookSeller(0xb3472d), -10.5, 63.6, 0); mkCiv(lookSeller(0x3f7a4a), 10.5, 63.6, 0);
  for (let i = 0; i < 9; i++) mkCiv(lookTownsman(), rand(-7, 12), rand(68, 76.5), rand(-PI, PI), { roam: [-5, 12, 68, 76.5] });
  for (let i = 0; i < 3; i++) mkCiv(lookTownsman(), rand(-2.4, 2.4), rand(54, 60), rand(-PI, PI), { roam: [-2.4, 2.4, 53.5, 61] });
  for (let i = 0; i < 2; i++) mkCiv(lookTownsman(), rand(16, 24), rand(77.5, 80.4), rand(-PI, PI), { roam: [16, 25, 77.4, 80.5] });
  S.chief = null;
  if (F.chief !== 'paid') {
    const spots = [[56.4, 76.8, 0], [57.8, 80.4, -2], [50, 73, 1], [60, 88, 2.6], [66, 82, -1.2], [52.5, 85, .4]];
    if (F.chief === 'angry') for (const q of spots) mkGuard(lookRider(), q[0], q[1], q[2], 'camp', { rider: true, hp: S_TUNE.riderHp, dmg: S_TUNE.riderDmg, loot: 3 });
    else { S.chief = mkCiv(LOOK_CHIEF, 54, 79, -PI / 2); for (const q of spots) S.riders.push(mkCiv(lookRider(), q[0], q[1], q[2])); }
  }
  sogActs(); B.acts = S.acts;
  cam.yaw = S.cp[2]; cam.pitch = .55; followCam(0, true);
}
