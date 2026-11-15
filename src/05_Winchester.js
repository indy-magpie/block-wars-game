/* ================= Winchester ================= */
const winchester = { scene: null, army: null, asker: null, flame: null, marchers: [] };
function buildWinchester() {
  const sc = new T.Scene(); winchester.scene = sc;
  sc.background = new T.Color(0xc3d2d6); sc.fog = new T.Fog(0xc3d2d6, 24, 100);
  sc.add(new T.HemisphereLight(0xe2ecf4, 0x6a5f48, .8));
  const sun = new T.DirectionalLight(0xffe2b4, .85); sun.position.set(-6, 7, 5); sc.add(sun);
  const gt = groundTexture(7, 104, 132, 72); gt.repeat.set(110, 110);
  const g = new T.Mesh(new T.PlaneGeometry(440, 440).rotateX(-PI / 2), new T.MeshLambertMaterial({ map: gt })); sc.add(g);

  const rng = rngSeed(1066), L = [];
  for (let i = 0; i < 46; i++) L.push([(rng() - .5) * .5, .04, 9 - i * 1.5, 5.4 + rng() * .9, .08, 1.6, jit(0x8b7557, .07, rng)]);
  for (let i = 0; i < 80; i++) L.push([(rng() - .5) * 4.8, .1, 8 - rng() * 62, .26 + rng() * .22, .05, .26 + rng() * .22, jit(0xa39c8c, .1, rng)]);
  const WALL = [0xd8c8a0, 0xcab68a, 0xe2d5b4, 0xbda678], THATCH = [0xb39a52, 0xa58c48, 0xbfa65e], TIMBER = 0x4a3524;
  const house = (x, z, w, d, h, side) => {
    L.push([x, h / 2, z, w, h, d, jit(WALL[(rng() * 4) | 0], .04, rng)]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.push([x + sx * w / 2, h / 2, z + sz * d / 2, .3, h + .02, .3, jit(TIMBER, .08, rng)]);
    L.push([x, h - .12, z, w + .3, .24, d + .3, jit(TIMBER, .08, rng)]);
    L.push([x, h * .5, z, w + .12, .16, d + .12, jit(TIMBER, .08, rng)]);
    L.push([x + side * (w / 2 + .04), .95, z + (rng() - .5) * d * .3, .12, 1.9, 1.0, jit(0x3a2a1c, .08, rng)]);
    L.push([x + side * (w / 2 + .04), 1.75, z + d * .32 * (rng() < .5 ? -1 : 1), .12, .5, .6, DARK]);
    const half0 = w / 2 + .55, n = Math.max(3, Math.round(half0 / .5)), th = THATCH[(rng() * 3) | 0];
    for (let i = 0; i < n; i++) L.push([x, h + .2 + i * .42, z, half0 * 2 * (1 - i / n) + .2, .44, d + 1.0 - i * .06, jit(th, .07, rng)]);
  };
  [[-7.6, 4, 5.5, 6, 2.7], [-8.2, -5, 6.5, 7, 3.0], [-7.4, -16, 5, 6, 2.6], [-8.4, -26, 7, 8, 3.2], [-7.6, -37, 5.5, 6, 2.8]].forEach(a => house(a[0], a[1], a[2], a[3], a[4], 1));
  [[7.8, 2, 6, 6.5, 2.9], [7.4, -7, 5, 6, 2.6], [8.3, -18, 6.8, 7.5, 3.1], [7.6, -29, 5.5, 6, 2.7], [8.0, -39, 6, 6, 2.9]].forEach(a => house(a[0], a[1], a[2], a[3], a[4], -1));
  /* the Old Minster */
  const ST = 0xb7b0a0, SLATE = 0x66625f;
  L.push([0, 5, -64, 11, 10, 22, jit(ST, .03, rng)]);
  for (let i = 0; i < 6; i++) L.push([0, 10.3 + i * .6, -64, 11.6 - i * 1.9, .6, 22.6, jit(SLATE, .05, rng)]);
  L.push([0, 9, -50.5, 7, 18, 5, jit(ST, .03, rng)]);
  L.push([0, 6.2, -50.5, 7.3, .4, 5.3, jit(ST, .1, rng)]); L.push([0, 12.2, -50.5, 7.3, .4, 5.3, jit(ST, .1, rng)]);
  for (let i = 0; i < 5; i++) L.push([0, 18.35 + i * .7, -50.5, 7.4 - i * 1.5, .7, 5.4 - i * 1.1, jit(SLATE, .05, rng)]);
  L.push([0, 22.7, -50.5, .22, 1.7, .22, GOLD]); L.push([0, 23.0, -50.5, .95, .22, .22, GOLD]);
  L.push([0, 1.6, -47.95, 2.2, 3.2, .14, DARK]);
  for (const x of [-1.5, 1.5]) { L.push([x, 14.6, -47.95, .8, 2, .14, DARK]); L.push([x, 8.8, -47.95, .6, 1.6, .14, DARK]); }
  for (const x of [-4, 4]) for (const z of [-58, -64, -70]) L.push([x * 1.4, 5.6, z, .14, 2.2, 1.0, DARK]);
  /* market stall, barrels, well, brazier, banners, trees */
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.push([4.3 + sx * 1.1, 1.1, -2.6 + sz * .8, .14, 2.2, .14, jit(TIMBER, .1, rng)]);
  for (let i = 0; i < 5; i++) L.push([3.2 + i * .55 + .02, 2.25, -2.6, .55, .1, 2.0, i % 2 ? [.65, .26, .17] : [.9, .86, .74]]);
  L.push([4.3, .75, -2.6, 2.3, .12, 1.5, jit(TIMBER, .1, rng)]);
  for (let i = 0; i < 4; i++) L.push([3.6 + i * .45, .93, -2.5 + (i % 2) * .3, .3, .26, .3, i % 2 ? [.75, .2, .15] : [.8, .65, .2]]);
  for (const p of [[3.1, 1.3], [3.75, 1.9], [-3.4, -1.2]]) { L.push([p[0], .45, p[1], .66, .9, .66, jit(0x6b4a2a, .08, rng)]); L.push([p[0], .25, p[1], .7, .07, .7, STEEL_D]); L.push([p[0], .68, p[1], .7, .07, .7, STEEL_D]); }
  L.push([-3.7, .4, -8, 1.8, .8, 1.8, jit(ST, .06, rng)]); L.push([-3.7, .82, -8, 1.3, .06, 1.3, [.1, .16, .22]]);
  for (const sx of [-1, 1]) L.push([-3.7 + sx * .85, 1.4, -8, .14, 2.0, .14, jit(TIMBER, .1, rng)]);
  L.push([-3.7, 2.45, -8, 2.2, .14, 1.0, jit(THATCH[0], .06, rng)]);
  L.push([2.5, .5, .9, .12, 1.0, .12, STEEL_D]); L.push([2.5, 1.03, .9, .5, .12, .5, STEEL_D]);
  banner(L, -3.1, -11, 'wyvern'); banner(L, 2.9, -22, 'man');
  for (let i = 0; i < 26; i++) { const sx = i % 2 ? 1 : -1; tree(L, sx * (14 + rng() * 22), 8 - rng() * 80, 1 + rng() * .5, rng); }
  sc.add(new T.Mesh(buildBoxes(L), MAT_STATIC));
  const fl = new T.Mesh(buildBoxes([[0, .16, 0, .34, .32, .34, [1, .55, .1]], [0, .36, 0, .2, .3, .2, [1, .85, .3]]]), new T.MeshBasicMaterial({ vertexColors: true }));
  fl.position.set(2.5, 1.09, .9); sc.add(fl); winchester.flame = fl;

  const A = new Army(sc, 16, false); winchester.army = A;
  winchester.asker = A.add(Object.assign({}, LOOK_HOUSECARL(0), { weapon: 'spear', x: 0, z: 0, yaw: -.22, fixArmR: -PI / 2 }));
  A.add(Object.assign({}, LOOK_PLAYER, { x: -.95, z: 3.5, yaw: PI + .2 }));
  [[4.2, -6.2, -1.2], [5.3, -6.6, -1.4], [4.6, -7.9, -.9], [5.9, -8.2, -1.2], [-4.6, -3.2, 1.3]].forEach(p => A.add(Object.assign(lookSaxon(), { x: p[0], z: p[1], yaw: p[2] })));
  for (let i = 0; i < 3; i++) winchester.marchers.push(A.add(Object.assign(lookSaxon(), { x: -13 - i * 1.6, z: -11.2 + (i % 2) * .5, yaw: -PI / 2 })));
}
function stepWinchester(dt, time) {
  for (const u of winchester.army.units) { u.vx = 0; u.vz = 0; }
  for (const m of winchester.marchers) { m.x += 1.5 * dt; m.vx = 1.5; if (m.x > 13) m.x = -13; }
  for (const u of winchester.army.units) animate(u, dt, time);
  winchester.asker.pose.headY = Math.sin(time * .4) * .1;
  if (winchester.flame) { winchester.flame.scale.y = 1 + Math.sin(time * 13) * .18 + Math.sin(time * 7.3) * .12; }
  const sway = reduceMotion ? 0 : 1;
  camera.position.set(1.4 + Math.sin(time * .3) * .22 * sway, 1.95 + Math.sin(time * .23) * .05 * sway, 5.9);
  camera.lookAt(-.2, .95, 0);
}

