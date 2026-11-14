/* ================= blocky people ================= */
const W = 0xffffff;
const STEEL = [.76, .78, .82], STEEL_D = [.5, .52, .57], WOOD = [.45, .3, .16], GOLD = [.92, .72, .2], DARK = [.13, .1, .1];
const PART_BOXES = {
  torso: [[0, .375, 0, .5, .75, .26, W], [0, .1, 0, .52, .09, .28, [.4, .32, .24]], [0, .705, 0, .3, .06, .27, [.8, .8, .8]]],
  arm: [[0, -.2, 0, .24, .62, .24, W]],
  hand: [[0, -.585, 0, .22, .15, .22, W]],
  leg: [[0, -.25, 0, .24, .5, .24, W], [0, -.63, .012, .25, .25, .27, [.42, .33, .27]]],
  head: [[0, .25, 0, .5, .5, .5, W], [-.11, .29, .251, .08, .08, .012, DARK], [.11, .29, .251, .08, .08, .012, DARK]],
  hair: [[0, .515, 0, .53, .07, .53, W], [0, .32, -.262, .53, .4, .04, W], [-.262, .38, -.04, .03, .27, .42, W], [.262, .38, -.04, .03, .27, .42, W]],
  beard: [[0, .075, .262, .4, .17, .035, W], [0, .185, .262, .28, .05, .03, W]],
  helmet: [[0, .47, 0, .56, .16, .56, STEEL_D], [0, .6, 0, .46, .12, .46, STEEL], [0, .7, 0, .28, .09, .28, STEEL], [0, .77, 0, .1, .06, .1, STEEL_D], [0, .32, .275, .07, .24, .04, STEEL]],
  crown: [[0, .58, .3, .66, .09, .05, GOLD], [0, .58, -.3, .66, .09, .05, GOLD], [.3, .58, 0, .05, .09, .66, GOLD], [-.3, .58, 0, .05, .09, .66, GOLD],
    [.3, .66, .3, .08, .09, .08, GOLD], [-.3, .66, .3, .08, .09, .08, GOLD], [.3, .66, -.3, .08, .09, .08, GOLD], [-.3, .66, -.3, .08, .09, .08, GOLD],
    [0, .67, .3, .08, .11, .06, GOLD], [0, .58, .33, .07, .06, .02, [.8, .1, .1]]],
  cloak: [[0, .26, -.165, .58, .98, .05, W], [0, .71, -.03, .62, .09, .32, [.86, .86, .86]]],
  shieldRound: [[0, 0, 0, .5, .86, .06, W], [0, 0, 0, .86, .5, .06, W], [0, 0, 0, .72, .72, .06, W],
    [-.17, .17, .033, .3, .3, .012, [.66, .66, .66]], [.17, -.17, .033, .3, .3, .012, [.66, .66, .66]]],
  shieldBoss: [[0, 0, .06, .2, .2, .07, STEEL], [0, 0, .1, .1, .1, .03, STEEL_D]],
  shieldKite: [[0, .24, 0, .58, .36, .06, W], [0, -.04, 0, .48, .24, .06, W], [0, -.25, 0, .34, .2, .06, W], [0, -.42, 0, .2, .16, .06, W],
    [0, -.03, .033, .08, .8, .012, [.6, .6, .6]], [0, .2, .033, .46, .08, .012, [.6, .6, .6]]],
  axe: [[0, -.585, .2, .055, .055, .85, WOOD], [0, -.71, .54, .05, .3, .2, STEEL], [0, -.585, .55, .07, .1, .14, STEEL_D]],
  daneaxe: [[0, -.585, .3, .06, .06, 1.25, WOOD], [0, -.75, .82, .05, .42, .24, STEEL], [0, -.585, .84, .08, .1, .16, STEEL_D]],
  sword: [[0, -.585, -.02, .05, .05, .2, [.35, .22, .12]], [0, -.585, .1, .24, .06, .05, GOLD], [0, -.585, .52, .075, .035, .8, STEEL], [0, -.585, -.14, .08, .08, .06, GOLD]],
  spear: [[0, -.585, .35, .05, .05, 1.9, WOOD], [0, -.585, 1.38, .09, .035, .22, STEEL]],
  /* Rome and Carthage */
  skirt: [[0, -.1, 0, .53, .3, .3, W], [0, -.2, 0, .54, .05, .31, [.78, .78, .78]]],
  robe: [[0, -.3, 0, .54, .7, .34, W], [0, .08, 0, .55, .1, .3, [.7, .7, .7]]],
  veil: [[0, .53, 0, .56, .08, .56, W], [0, .3, -.27, .56, .5, .06, W], [-.275, .33, -.03, .04, .44, .46, W], [.275, .33, -.03, .04, .44, .46, W], [0, -.12, -.2, .5, .4, .08, W]],
  cap: [[0, .56, 0, .42, .12, .42, W], [0, .67, 0, .28, .12, .28, W], [0, .77, 0, .15, .1, .15, W]],
  helmR: [[0, .47, 0, .56, .14, .56, [.8, .8, .8]], [0, .59, 0, .5, .12, .5, W], [0, .68, 0, .36, .08, .36, W], [0, .74, 0, .12, .06, .12, [.8, .8, .8]],
    [-.27, .24, .08, .05, .34, .22, W], [.27, .24, .08, .05, .34, .22, W], [0, .4, -.3, .5, .06, .12, [.8, .8, .8]]],
  plume: [[0, .87, -.02, .1, .22, .32, W], [0, .99, -.07, .08, .1, .38, W]],
  crestT: [[0, .87, 0, .64, .22, .1, W], [0, 1.0, 0, .5, .08, .08, W]],
  scutum: [[0, 0, 0, .66, 1.12, .07, W], [0, .5, .037, .6, .05, .01, [.7, .7, .7]], [0, -.5, .037, .6, .05, .01, [.7, .7, .7]]],
  scutumBoss: [[0, 0, .06, .2, .24, .08, GOLD], [0, 0, .045, .06, .96, .02, GOLD], [0, .3, .045, .42, .05, .02, GOLD], [0, -.3, .045, .42, .05, .02, GOLD]],
  gladius: [[0, -.6, 0, .07, .16, .07, [.35, .22, .12]], [0, -.7, 0, .2, .05, .1, GOLD], [0, -.97, 0, .1, .5, .035, STEEL], [0, -1.25, 0, .06, .08, .03, STEEL]],
  bow: [[0, 0, 0, .05, .5, .06, WOOD], [0, .36, -.06, .05, .3, .06, WOOD], [0, -.36, -.06, .05, .3, .06, WOOD], [0, .56, -.14, .05, .14, .06, WOOD], [0, -.56, -.14, .05, .14, .06, WOOD], [0, 0, -.17, .015, 1.2, .015, [.9, .9, .85]]]
};
const BONE = { torso: 0, head: 1, armR: 2, armL: 3, legR: 4, legL: 5, shield: 6 };
const HULL_GROW = .06;

class Batch {
  constructor(scene, boxes, cap, aura) {
    this.n = 0;
    this.mesh = new T.InstancedMesh(buildBoxes(boxes), MAT_UNIT, cap);
    this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.mesh.instanceColor = new T.BufferAttribute(new Float32Array(cap * 3), 3);
    this.mesh.frustumCulled = false; this.mesh.count = 0; this.mesh.renderOrder = 2;
    scene.add(this.mesh);
    this.hull = null;
    if (aura) {
      this.hull = new T.InstancedMesh(buildBoxes(boxes, HULL_GROW), MAT_HULL, cap);
      this.hull.instanceMatrix = this.mesh.instanceMatrix;
      this.hull.instanceColor = new T.BufferAttribute(new Float32Array(cap * 3), 3);
      this.hull.frustumCulled = false; this.hull.count = 0; this.hull.renderOrder = 1;
      scene.add(this.hull);
    }
  }
  alloc(hex, aura) {
    const i = this.n++; this.mesh.count = this.n;
    this.setColor(i, hex, 1, 1, 1);
    if (this.hull) { this.hull.count = this.n; _col.setHex(aura); _col.toArray(this.hull.instanceColor.array, i * 3); this.hull.instanceColor.needsUpdate = true; }
    return i;
  }
  setColor(i, hex, r, g, b) {
    _col.setHex(hex); const a = this.mesh.instanceColor.array;
    a[i * 3] = _col.r * r; a[i * 3 + 1] = _col.g * g; a[i * 3 + 2] = _col.b * b;
    this.mesh.instanceColor.needsUpdate = true;
  }
  reset() { this.n = 0; this.mesh.count = 0; if (this.hull) this.hull.count = 0; }
}

const _m = new T.Matrix4(), _root = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _v = new T.Vector3(), _s = new T.Vector3();
const ZERO = new T.Matrix4().makeScale(0, 0, 0);
const BONES = []; for (let i = 0; i < 7; i++) BONES.push(new T.Matrix4());
function setBone(i, px, py, pz, rx, ry, rz) {
  _e.set(rx, ry, rz, 'YXZ'); _m.makeRotationFromEuler(_e); _m.setPosition(px, py, pz);
  BONES[i].multiplyMatrices(_root, _m);
}

class Army {
  constructor(scene, cap, aura) {
    this.units = []; this.b = {}; this.cap = cap;
    for (const k in PART_BOXES) this.b[k] = new Batch(scene, PART_BOXES[k], (k === 'arm' || k === 'hand' || k === 'leg') ? cap * 2 : cap, aura);
    const quad = new T.PlaneGeometry(1, 1); quad.rotateX(-PI / 2);
    this.shadow = new T.InstancedMesh(quad, new T.MeshBasicMaterial({ map: TEX_SHADOW, color: 0x000000, transparent: true, opacity: .55, depthWrite: false }), cap);
    this.shadow.frustumCulled = false; this.shadow.count = 0; this.shadow.renderOrder = 1; scene.add(this.shadow);
    this.glow = null;
    if (aura) {
      this.glow = new T.InstancedMesh(quad, new T.MeshBasicMaterial({ map: TEX_RING, transparent: true, opacity: .62, depthWrite: false }), cap);
      this.glow.instanceColor = new T.BufferAttribute(new Float32Array(cap * 3), 3);
      this.glow.frustumCulled = false; this.glow.count = 0; this.glow.renderOrder = 2; scene.add(this.glow);
    }
  }
  reset() {
    this.units.length = 0;
    for (const k in this.b) this.b[k].reset();
    this.shadow.count = 0; if (this.glow) this.glow.count = 0;
  }
  add(o) {
    const u = Object.assign({
      x: 0, y: 0, gy: 0, jy: 0, jv: 0, loot: 1, z: 0, yaw: 0, scale: 1, shrink: 1, fall: 0, tilt: 0, vx: 0, vz: 0, kx: 0, kz: 0,
      team: 0, kind: 'line', isPlayer: false, alive: true, hidden: false, gone: false, hw: false,
      hp: 30, maxHp: 30, dmg: [7, 11], range: 1.55, speed: 4.2, blockChance: .2, rad: .4, mass: 1,
      target: null, watch: null, attackers: 0, thinkT: rand(0, .4), untargetable: false,
      attackT: -1, hitDone: false, cool: rand(0, .8), blockT: 0, blocking: false, wall: false, stagger: 0, lock: null,
      windup: .34, strikeEnd: .48, attackDur: .8, hitAt: .44, restArm: -.32,
      moveAmt: 0, walkPhase: rand(0, 6), blockAmt: 0, flash: 0, flashOn: false, deathT: 0, fallDir: -1, puffed: false,
      raise: 0, cheer: false, flee: false, idleT: rand(0, 20), strafe: 0, strafeT: 0,
      lastHitT: -99, hx: 0, hz: 0, hyaw: 0, kills: 0, fixArmR: null,
      coolR: null, hurt: null, hold: false, aggro: 14, sq: 0, stage: -1, slot: 0, npc: false, fixed: false, archer: false, bow: false, shotT: rand(.5, 3), drawT: 0,
      stab: false, panic: false, surrenders: false, civ: false,
      pose: { armR: -.3, armL: -.3, legR: 0, legL: 0, head: 0, headY: 0, sx: .51, sy: 1, sz: .27, sry: .55 },
      parts: []
    }, o);
    u.maxHp = u.hp; u.hx = u.x; u.hz = u.z; u.hyaw = u.yaw;
    const aura = u.team === 0 ? FRIEND : FOE;
    const add = (name, bone, hex) => { const b = this.b[name]; u.parts.push({ b: b, i: b.alloc(hex, aura), bone: bone, c: hex }); };
    const sleeve = u.sleeve || u.tunic;
    add('torso', BONE.torso, u.tunic);
    add('arm', BONE.armR, sleeve); add('arm', BONE.armL, sleeve);
    add('hand', BONE.armR, u.skin); add('hand', BONE.armL, u.skin);
    add('leg', BONE.legR, u.trousers); add('leg', BONE.legL, u.trousers);
    add('head', BONE.head, u.skin);
    if (u.skirt) add('skirt', BONE.torso, u.skirt);
    if (u.robe) add('robe', BONE.torso, u.robe);
    if (u.helmet === 'roman') add('helmR', BONE.head, u.helmetTint || 0xd0a850);
    else if (u.helmet) add('helmet', BONE.head, u.helmetTint || W);
    else if (u.veil) add('veil', BONE.head, u.veil);
    else { add('hair', BONE.head, u.hair); if (u.cap) add('cap', BONE.head, u.cap); }
    if (u.plume) add('plume', BONE.head, u.plume);
    if (u.crestT) add('crestT', BONE.head, u.crestT);
    if (u.beard) add('beard', BONE.head, u.hair);
    if (u.crown) add('crown', BONE.head, W);
    if (u.cloak) add('cloak', BONE.torso, u.cloak);
    if (u.shield === 'kite') add('shieldKite', BONE.shield, u.shieldTint);
    else if (u.shield === 'scutum') { add('scutum', BONE.shield, u.shieldTint); add('scutumBoss', BONE.shield, W); }
    else if (u.shield === 'bow') add('bow', BONE.shield, W);
    else if (u.shield !== 'none') { add('shieldRound', BONE.shield, u.shieldTint); add('shieldBoss', BONE.shield, W); }
    if (u.weapon !== 'none') add(u.weapon, BONE.armR, W);
    u.ri = this.units.length; this.units.push(u);
    this.shadow.count = this.units.length;
    if (this.glow) { this.glow.count = this.units.length; _col.setHex(aura); _col.toArray(this.glow.instanceColor.array, u.ri * 3); this.glow.instanceColor.needsUpdate = true; }
    return u;
  }
  write() {
    const us = this.units;
    for (let i = 0; i < us.length; i++) {
      const u = us[i];
      if (u.hidden) {
        if (!u.hw) { u.hw = true; for (const p of u.parts) p.b.mesh.setMatrixAt(p.i, ZERO); this.shadow.setMatrixAt(i, ZERO); if (this.glow) this.glow.setMatrixAt(i, ZERO); }
        continue;
      }
      u.hw = false;
      const P = u.pose, s = u.scale * u.shrink;
      _e.set(u.fall + u.tilt, u.yaw, 0, 'YXZ'); _q.setFromEuler(_e);
      _v.set(u.x, u.y, u.z); _s.set(s, s, s); _root.compose(_v, _q, _s);
      setBone(0, 0, .75, 0, 0, 0, 0);
      setBone(1, 0, 1.5, 0, P.head, P.headY, 0);
      setBone(2, -.37, 1.38, 0, P.armR, 0, 0);
      setBone(3, .37, 1.38, 0, P.armL, 0, 0);
      setBone(4, -.125, .75, 0, P.legR, 0, 0);
      setBone(5, .125, .75, 0, P.legL, 0, 0);
      setBone(6, P.sx, P.sy, P.sz, 0, P.sry, 0);
      for (const p of u.parts) p.b.mesh.setMatrixAt(p.i, BONES[p.bone]);
      const fade = u.alive ? 1 : clamp(1 - u.deathT / .5, 0, 1) * u.shrink;
      _m.makeScale(1.35 * s, 1, 1.35 * s); _m.setPosition(u.x, u.gy + .035, u.z); this.shadow.setMatrixAt(i, _m);
      if (this.glow) { const g = 2.15 * u.scale * fade; _m.makeScale(g, 1, g); _m.setPosition(u.x, u.gy + .05, u.z); this.glow.setMatrixAt(i, _m); }
      const fl = u.flash > 0;
      if (fl !== u.flashOn) { u.flashOn = fl; for (const p of u.parts) p.b.setColor(p.i, p.c, 1, fl ? .32 : 1, fl ? .28 : 1); }
    }
    for (const k in this.b) this.b[k].mesh.instanceMatrix.needsUpdate = true;
    this.shadow.instanceMatrix.needsUpdate = true;
    if (this.glow) this.glow.instanceMatrix.needsUpdate = true;
  }
}

function animate(u, dt, time) {
  const P = u.pose, sp = hyp(u.vx, u.vz);
  u.moveAmt = damp(u.moveAmt, clamp(sp / 2.5, 0, 1), 12, dt);
  u.walkPhase += sp * dt * 2.4;
  const sw = Math.sin(u.walkPhase) * u.moveAmt;
  P.legR = sw * .9; P.legL = -sw * .9;
  const rest = u.restArm;
  let armR = rest - sw * .35 + Math.sin(time * 1.7 + u.idleT) * .03;
  if (u.attackT >= 0) {
    const t = u.attackT;
    const A0 = u.stab ? .6 : -2.7, A1 = u.stab ? -1.5 : .15;      /* a gladius is thrust; an axe is swung */
    if (t < u.windup) armR = lerp(rest, A0, easeOut(t / u.windup));
    else if (t < u.strikeEnd) armR = lerp(A0, A1, (t - u.windup) / (u.strikeEnd - u.windup));
    else armR = lerp(A1, rest, clamp((t - u.strikeEnd) / (u.attackDur - u.strikeEnd), 0, 1));
  }
  if (u.fixArmR !== null) armR = u.fixArmR;
  if (u.raise > .001) armR = lerp(armR, u.stab ? -2.9 : -1.95, u.raise);
  let hop = 0;
  const wantBlock = (u.blocking || u.blockT > 0 || (u.wall && u.attackT < 0)) && !u.cheer && !u.flee;
  u.blockAmt = damp(u.blockAmt, wantBlock ? 1 : 0, 20, dt);
  const b = u.blockAmt;
  P.armL = lerp(-.3 + sw * .12, -.85, b);
  P.sx = lerp(.51, .12, b); P.sy = lerp(1.0, 1.16, b); P.sz = lerp(.27, .57, b); P.sry = lerp(.55, 0, b);
  if (u.cheer) {
    const c = time * 7 + u.idleT * 3;
    armR = -2.25 + Math.sin(c) * .35; hop = Math.abs(Math.sin(c * .5)) * .32;
    P.armL = -2.1; P.sy = 1.75; P.sz = .42; P.sx = .46;
  }
  if (u.bow) { P.armL = -1.45; P.sx = .37; P.sy = 1.32; P.sz = .6; P.sry = 0; armR = u.drawT > 0 ? -1.4 : -.7; }
  if (u.panic) { const c = time * 9 + u.idleT * 5; armR = -2.75 + Math.sin(c) * .25; P.armL = -2.75 - Math.sin(c) * .25; }
  P.armR = armR;
  P.headY = Math.sin(time * .5 + u.idleT) * .22 * (1 - u.moveAmt) * (u.target ? 0 : 1);
  const lean = u.stagger > 0 ? -.2 : (u.attackT >= u.windup && u.attackT < u.strikeEnd) ? .15 : sp > 3 ? .07 : 0;
  u.tilt = damp(u.tilt, lean, 14, dt);
  if (u.jy > .05) { P.legR = -.6; P.legL = .45; }                     /* legs tucked in the air */
  u.y = u.gy + u.jy + Math.abs(Math.sin(u.walkPhase)) * .05 * u.moveAmt * (u.jy > 0 ? 0 : 1) + hop;
}

/* looks */
const SKIN = [0xe8b98f, 0xd9a47a, 0xf0c8a0, 0xc99468];
const HAIR = [0xd8b25a, 0x7a4a22, 0xa8521f, 0x3a2a1a, 0x9c9a8c, 0xc79a45];
const SAX_TUNIC = [0x7a5a36, 0x6b7a3a, 0x9a6b2f, 0x8c3b2a, 0x4f6a52, 0xb08d57, 0x6a5a44];
const SAX_TROUS = [0x4a3b2a, 0x5b5140, 0x3d4435, 0x54432f];
const SAX_SHIELD = [0xb0392b, 0xd9a520, 0x2f6d4a, 0xe8dcc0, 0x2c4a7a, 0xc0622a];
const NOR_TUNIC = [0x35508a, 0x7d2a2a, 0xcfc7ae, 0x2f5d5a];
const NOR_TROUS = [0x3a3a44, 0x4a4033, 0x2f3b55];
const NOR_SHIELD = [0x2c4f9e, 0xa82a22, 0xd8b21c, 0xe6e0d0, 0x1f7a5c];
const MAIL = [0x8d929b, 0x7d828b, 0x9a9fa8];
function lookSaxon() {
  const helm = Math.random() < .45, mail = helm && Math.random() < .35;
  return { tunic: mail ? pick(MAIL) : pick(SAX_TUNIC), trousers: pick(SAX_TROUS), skin: pick(SKIN), hair: pick(HAIR), helmet: helm, beard: Math.random() < .8, shield: 'round', shieldTint: pick(SAX_SHIELD), weapon: pick(['axe', 'axe', 'spear', 'spear', 'sword']) };
}
function lookNorman() {
  const mail = Math.random() < .6;
  return { tunic: mail ? pick(MAIL) : pick(NOR_TUNIC), trousers: pick(NOR_TROUS), skin: pick(SKIN), hair: pick(HAIR), helmet: Math.random() < .85, beard: false, shield: 'kite', shieldTint: pick(NOR_SHIELD), weapon: pick(['sword', 'sword', 'spear']) };
}
const LOOK_PLAYER = { tunic: 0xd9a520, trousers: 0x3a2f24, skin: 0xe8b98f, hair: 0x7a4a22, helmet: true, beard: false, shield: 'round', shieldTint: 0xb0392b, weapon: 'axe' };
const LOOK_HOUSECARL = i => ({ tunic: pick(MAIL), trousers: 0x4a3b2a, skin: pick(SKIN), hair: pick(HAIR), helmet: true, beard: true, shield: 'round', shieldTint: i % 2 ? 0xd9a520 : 0xb0392b, weapon: 'daneaxe', scale: 1.06 });
const LOOK_KNIGHT = i => ({ tunic: pick(MAIL), trousers: 0x3a3a44, skin: pick(SKIN), hair: pick(HAIR), helmet: true, beard: false, shield: 'kite', shieldTint: i % 2 ? 0xd8b21c : 0x2c4f9e, weapon: 'sword', scale: 1.06 });
const LOOK_HAROLD = { tunic: 0x9aa0aa, trousers: 0x5a2a22, skin: 0xe8b98f, hair: 0xc79a45, helmet: true, crown: true, beard: true, cloak: 0xa01f1f, shield: 'round', shieldTint: 0xd9a520, weapon: 'sword', scale: 1.2 };
const LOOK_WILLIAM = { tunic: 0x70757e, trousers: 0x2a2f45, skin: 0xd9a47a, hair: 0x3a2a1a, helmet: true, helmetTint: 0xf0cc66, beard: false, cloak: 0x21458f, shield: 'kite', shieldTint: 0xa82a22, weapon: 'sword', scale: 1.2 };

