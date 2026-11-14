/* ================= Hastings ================= */
const FX = 46, FZ = 46, MAX_ON_ONE = 2;
const STAT = {
  line: { hp: 72, dmg: [3, 5], range: 1.55, block: .22, rad: .4, mass: 1, loot: 1 },
  guard: { hp: 125, dmg: [6, 9], range: 1.6, block: .5, rad: .42, mass: 4, loot: 3 },
  king: { hp: 320, dmg: [9, 13], range: 1.75, block: .5, rad: .5, mass: 8, loot: 25 }
};
/* hurtPlayer multiplies what an enemy's blow does to the player; regen is health per second once he has gone regenDelay seconds unhurt */
const TUNE = { ranks: 3, saxonLine: 16, normanLine: 17, playerHp: 100, playerDmg: [11, 15], hurtPlayer: 1.3, regen: 2, regenDelay: 6, aiCool: [.8, 1.8], jump: 7.6, gravity: 22, jumpHit: 1.35 };
const battle = { scene: null, army: null, units: [], sax: [], nor: [], player: null, harold: null, william: null,
  phase: 'idle', t: 0, introT: 0, introSeg: -1, lastStand: false, checkT: 0, over: false, result: null, endT: 0, cardShown: false,
  trees: [], autopilot: false, sim: false, hudT: 0, clouds: null, hpBg: null, hpFill: null, edgeT: 0, lastHurt: -99, shake: 0,
  level: 'hastings', rects: [], gates: [], ground: () => 0, rules: null, leash: 0, toast: '', simCool: 0 };
const cam = { yaw: 0, pitch: .55, dist: 7.8, boom: 7.8, tx: 0, ty: 1.75, tz: 0, orbit: 0 };
const hast = { trees: battle.trees, rects: [], gates: [], ground: () => 0, leash: 0 };
/* health bars and particles live in each level's scene */
function combatLayers(sc) {
  const bar = new T.PlaneGeometry(1, 1);
  const hpBg = new T.InstancedMesh(bar, new T.MeshBasicMaterial({ color: 0x10131b, fog: false }), 64);
  const hpFill = new T.InstancedMesh(bar, new T.MeshBasicMaterial({ color: 0xff5a45, fog: false }), 64);
  for (const m of [hpBg, hpFill]) { m.frustumCulled = false; m.count = 0; m.instanceMatrix.setUsage(T.DynamicDrawUsage); sc.add(m); }
  hpBg.renderOrder = 4; hpFill.renderOrder = 5;
  const dropMesh = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshLambertMaterial(), 96);
  dropMesh.instanceColor = new T.BufferAttribute(new Float32Array(96 * 3), 3);
  dropMesh.frustumCulled = false; dropMesh.count = 0; dropMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); sc.add(dropMesh);
  const fxMesh = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial(), 320);
  fxMesh.instanceColor = new T.BufferAttribute(new Float32Array(320 * 3), 3);
  fxMesh.frustumCulled = false; fxMesh.count = 0; fxMesh.renderOrder = 3; fxMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); sc.add(fxMesh);
  return { hpBg: hpBg, hpFill: hpFill, fxMesh: fxMesh, dropMesh: dropMesh };
}
function useLevel(name) {
  const B = battle, L = name === 'hastings' ? hast : carth;
  B.level = name; B.scene = L.scene; B.army = L.army; B.trees = L.trees; B.rects = L.rects; B.gates = L.gates; B.ground = L.ground;
  B.rules = L.rules; B.hpBg = L.hpBg; B.hpFill = L.hpFill; B.clouds = L.clouds || null; B.leash = L.leash; fx.mesh = L.fxMesh; B.dropMesh = L.dropMesh;
  stage.setAttribute('data-level', name);
}
const fx = { mesh: null, list: [] };

function buildBattle() {
  const sc = new T.Scene(); battle.scene = sc;
  sc.background = new T.Color(0xa9cfe8); sc.fog = new T.Fog(0xa9cfe8, 70, 195);
  sc.add(new T.HemisphereLight(0xe6f2ff, 0x55683c, .8));
  const sun = new T.DirectionalLight(0xfff0d0, .78); sun.position.set(50, 70, 12); sc.add(sun);
  const fill = new T.DirectionalLight(0xdfe8ff, .26); fill.position.set(-30, 30, -24); sc.add(fill);
  const gt = groundTexture(3, 96, 150, 62); gt.repeat.set(175, 175);
  sc.add(new T.Mesh(new T.PlaneGeometry(700, 700).rotateX(-PI / 2), new T.MeshLambertMaterial({ map: gt })));

  const rng = rngSeed(14101066), L = [];
  let tries = 0;
  while (battle.trees.length < 32 && tries++ < 4000) {
    const x = (rng() * 2 - 1) * (FX - 3), z = (rng() * 2 - 1) * (FZ - 3), ax = Math.abs(x), az = Math.abs(z);
    if (ax < 27 && az > 13 && az < 41) continue;
    if (ax < 7 && az < 9) continue;
    if (battle.trees.some(t => hyp(t.x - x, t.z - z) < 7)) continue;
    battle.trees.push({ x: x, z: z, r: .5, cr: 2, cb: 1.9, ch: 7.2 });
  }
  for (const t of battle.trees) tree(L, t.x, t.z, .95 + rng() * .35, rng);
  for (let i = 0; i < 900; i++) {
    const x = (rng() * 2 - 1) * 104, z = (rng() * 2 - 1) * 104, e = Math.max(Math.abs(x) - FX, Math.abs(z) - FZ);
    if (e < 4.5 || e > 52) continue;
    tree(L, x, z, 1.15 + rng() * .7, rng);
  }
  for (let i = 0; i < 300; i++) {
    const x = (rng() * 2 - 1) * FX, z = (rng() * 2 - 1) * FZ, k = rng();
    L.push([x, .09, z, .16, .18, .16, k < .5 ? jit(0x4c8a34, .15, rng) : k < .75 ? [.95, .85, .3] : k < .9 ? [.95, .95, .9] : [.8, .35, .5]]);
  }
  /* boulders and fallen logs: something to jump on */
  for (const q of [[-13, -4, 1.8, .9, 1.5], [10, 6, 1.6, 1, 1.6], [-22, 9, 3.2, .7, .8], [19, -8, 1.7, .9, 1.7], [4, 12, .8, .7, 3], [-7, -12, 1.5, .8, 1.4], [27, 3, 3, .7, .8], [-30, -2, 1.8, 1, 1.6]]) {
    const log = q[2] > 2.5 || q[4] > 2.5;
    L.push([q[0], q[3] / 2, q[1], q[2], q[3], q[4], log ? jit(0x6a4a2a, .08, rng) : jit(0x8f9096, .06, rng)]);
    if (!log) L.push([q[0] + .2, q[3] + .15, q[1] - .1, q[2] * .5, .3, q[4] * .5, jit(0x9a9ba2, .06, rng)]);
    hast.rects.push({ x0: q[0] - q[2] / 2, x1: q[0] + q[2] / 2, z0: q[1] - q[4] / 2, z1: q[1] + q[4] / 2, h: q[3], plat: true });
  }
  banner(L, -2.4, -36, 'wyvern'); banner(L, 2.0, -36, 'man');
  banner(L, -2.4, 36, 'papal'); banner(L, 2.0, 36, 'lions');
  sc.add(new T.Mesh(buildBoxes(L), MAT_STATIC));

  const C = [];
  for (let i = 0; i < 16; i++) {
    const x = (rng() * 2 - 1) * 230, z = (rng() * 2 - 1) * 230, y = 58 + rng() * 26, w = 18 + rng() * 26, d = 10 + rng() * 16;
    C.push([x, y, z, w, 3.2, d, [1, 1, 1]]); C.push([x + (rng() - .5) * w * .5, y + 2.6, z + (rng() - .5) * d * .4, w * .55, 2.6, d * .6, [1, 1, 1]]);
  }
  battle.clouds = new T.Mesh(buildBoxes(C), new T.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: .93 }));
  sc.add(battle.clouds);
  const sunBlock = new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0xfff6c8, fog: false }));
  sunBlock.position.set(120, 140, 210); sc.add(sunBlock);

  Object.assign(hast, combatLayers(sc), { scene: sc, army: new Army(sc, 150, true), clouds: battle.clouds, rules: hastingsRules });
}

function spawnArmies() {
  useLevel('hastings');
  const B = battle, A = B.army;
  A.reset(); B.units = A.units; B.sax = []; B.nor = [];
  B.phase = 'wait'; B.t = 0; B.introT = 0; B.introSeg = -1; B.lastStand = false; B.checkT = 0; B.over = false; B.result = null; B.endT = 0; B.cardShown = false; B.edgeT = 0; B.lastHurt = -99; B.shake = 0;
  fx.list.length = 0; drops.length = 0;
  const mk = (look, kind, team, x, z, extra) => {
    const S = STAT[kind];
    const u = A.add(Object.assign({}, look, { kind: kind, team: team, x: x, z: z, yaw: team === 0 ? 0 : PI,
      hp: S.hp, dmg: S.dmg, range: S.range, blockChance: S.block, rad: S.rad, mass: S.mass, loot: S.loot,
      speed: kind === 'line' ? rand(3.9, 4.6) : 3.4, wall: kind === 'guard' }, extra || {}));
    (team === 0 ? B.sax : B.nor).push(u); return u;
  };
  B.player = mk(LOOK_PLAYER, 'line', 0, 0, -17.5, { isPlayer: true, hp: TUNE.playerHp, dmg: TUNE.playerDmg, range: 2.0, speed: 5.6, rad: .42, mass: 1.6, blockChance: .45,
    windup: .13, strikeEnd: .25, attackDur: .4, hitAt: .2, cool: 0 });
  for (let r = 0; r < TUNE.ranks; r++) for (let i = 0; i < TUNE.saxonLine; i++)
    mk(lookSaxon(), 'line', 0, (i - (TUNE.saxonLine - 1) / 2) * 2.5 + (r % 2 ? 1.25 : 0) + rand(-.25, .25), -20 - r * 2.5 + rand(-.3, .3), { hp: STAT.line.hp - 3 + ((Math.random() * 7) | 0) });
  for (let r = 0; r < TUNE.ranks; r++) for (let i = 0; i < TUNE.normanLine; i++)
    mk(lookNorman(), 'line', 1, (i - (TUNE.normanLine - 1) / 2) * 2.4 + (r % 2 ? 1.2 : 0) + rand(-.25, .25), 20 + r * 2.5 + rand(-.3, .3), { hp: STAT.line.hp - 3 + ((Math.random() * 7) | 0) });
  for (let i = 0; i < 9; i++) { const a = i - 4;
    mk(LOOK_HOUSECARL(i), 'guard', 0, a * .93, -31.4 - Math.abs(a) * .2 - a * a * .035);
    mk(LOOK_KNIGHT(i), 'guard', 1, a * .93, 31.4 + Math.abs(a) * .2 + a * a * .035); }
  B.harold = mk(LOOK_HAROLD, 'king', 0, 0, -34);
  B.william = mk(LOOK_WILLIAM, 'king', 1, 0, 34);
  cam.yaw = 0; cam.pitch = .55; cam.tx = B.player.x; cam.tz = B.player.z; cam.ty = 1.75; cam.boom = cam.dist; cam.orbit = 0;
}

/* ---- particles ---- */
function burst(x, y, z, n, hex, speed, life, size) {
  if (battle.sim) return;
  for (let i = 0; i < n && fx.list.length < 320; i++) {
    const a = rand(0, PI * 2), s = rand(.3, 1) * speed;
    fx.list.push({ x: x, y: y, z: z, vx: Math.cos(a) * s, vy: rand(.4, 1.3) * speed, vz: Math.sin(a) * s, life: life * rand(.6, 1), max: life, size: size * rand(.7, 1.3), c: hex, g: 9, floor: y > 1.5 ? y - 1.4 : .05, boom: false });
  }
}
function stepFx(dt) {
  const L = fx.list; let n = 0;
  for (let i = L.length - 1; i >= 0; i--) {
    const p = L[i]; p.life -= dt;
    if (p.life <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
    p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.y < p.floor) {
      if (p.boom) { burst(p.x, p.floor + .3, p.z, 9, 0xcbb894, 3.2, .8, .24); L[i] = L[L.length - 1]; L.pop(); continue; }
      p.y = p.floor; p.vy *= -.35; p.vx *= .6; p.vz *= .6;
    }
  }
  const arr = fx.mesh.instanceColor.array;
  for (const p of L) {
    const s = p.size * clamp(p.life / p.max * 2, 0, 1);
    _m.makeScale(s, s, s); _m.setPosition(p.x, p.y, p.z); fx.mesh.setMatrixAt(n, _m);
    _col.setHex(p.c); arr[n * 3] = _col.r; arr[n * 3 + 1] = _col.g; arr[n * 3 + 2] = _col.b; n++;
  }
  fx.mesh.count = n; fx.mesh.instanceMatrix.needsUpdate = true; fx.mesh.instanceColor.needsUpdate = true;
}

/* ---- sound (synthesised, starts on the first click) ---- */
const Snd = {
  ctx: null, out: null, noise: null, on: true, budget: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); this.out = this.ctx.createGain(); this.out.gain.value = this.on ? .6 : 0; this.out.connect(this.ctx.destination);
      const len = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, len, len), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    } catch (e) { this.ctx = null; }
  },
  setOn(v) { this.on = v; if (this.out) this.out.gain.value = v ? .6 : 0; },
  ok() { return !!this.ctx && this.on && !battle.sim; },
  cheap() { return this.ok() && this.budget-- > 0; },
  env(g, t, vol, dur, attack) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t + (attack || .005)); g.gain.exponentialRampToValueAtTime(.0001, t + dur); },
  tone(type, f0, f1, dur, vol, delay, attack) {
    const c = this.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    this.env(g, t, vol, dur, attack); o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + .03);
  },
  hiss(dur, vol, freq, q, type, delay, attack) {
    const c = this.ctx, t = c.currentTime + (delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; s.loop = true; f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    this.env(g, t, vol, dur, attack); s.connect(f); f.connect(g); g.connect(this.out); s.start(t, Math.random() * .5); s.stop(t + dur + .03);
  }
};
const sfx = {
  swing(v) { if (Snd.cheap()) Snd.hiss(.13, .14 * v, 1500, .7, 'bandpass', 0, .03); },
  hit(v) { if (Snd.cheap()) { Snd.tone('sine', 170, 55, .14, .5 * v); Snd.hiss(.07, .22 * v, 800, .8); } },
  clang(v) { if (Snd.cheap()) { Snd.tone('square', 1850 + rand(-150, 150), 1700, .08, .07 * v); Snd.tone('triangle', 2950, 2600, .2, .09 * v); Snd.tone('sine', 1240, 1200, .28, .1 * v); Snd.hiss(.03, .22 * v, 4200, 1, 'highpass'); } },
  death(v) { if (Snd.cheap()) Snd.tone('triangle', 190, 60, .4, .28 * v); },
  horn(f) { if (Snd.ok()) { Snd.tone('triangle', f, f * 1.004, 1.7, .3, 0, .22); Snd.tone('sawtooth', f * 1.5, f * 1.5, 1.6, .05, .06, .3); Snd.tone('sine', f / 2, f / 2, 1.7, .25, 0, .2); } },
  roar() { if (Snd.ok()) { Snd.hiss(2.2, .38, 520, .5, 'bandpass', 0, .5); Snd.hiss(1.6, .16, 1400, .8, 'bandpass', .1, .4); } },
  win() { if (Snd.ok()) [392, 523, 659, 784, 1047].forEach((f, i) => Snd.tone('triangle', f, f, .34, .24, i * .15)); },
  lose() { if (Snd.ok()) [220, 196, 165, 110].forEach((f, i) => Snd.tone('triangle', f, f * .98, .65, .22, i * .34, .05)); },
  ui() { if (Snd.ok()) Snd.tone('square', 520, 780, .07, .07); },
  jump() { if (Snd.cheap()) Snd.tone('square', 300, 540, .09, .045); },
  land() { if (Snd.cheap()) Snd.tone('sine', 140, 70, .07, .18); },
  coin() { if (Snd.ok()) { Snd.tone('square', 1320, 1320, .05, .045); Snd.tone('square', 1760, 1760, .1, .045, .05); } },
  eat() { if (Snd.ok()) { Snd.hiss(.08, .2, 900, 1); Snd.hiss(.08, .2, 700, 1, 'bandpass', .13); Snd.tone('triangle', 520, 780, .2, .12, .24); } },
  twang(v) { if (Snd.cheap()) { Snd.tone('triangle', 520, 240, .09, .1 * v); Snd.hiss(.12, .08 * v, 2600, .8, 'bandpass', .02, .04); } },
  thunk(v) { if (Snd.cheap()) { Snd.tone('sine', 240, 110, .08, .3 * v); Snd.hiss(.04, .14 * v, 1800, 1); } },
  chime() { if (Snd.ok()) [659, 880, 1319].forEach((f, i) => Snd.tone('triangle', f, f, .4, .2, i * .11)); }
};
function loud(u) { const p = battle.player; const d = hyp(u.x - p.x, u.z - p.z); const v = clamp(1 - d / 26, 0, 1); return v * v; }

