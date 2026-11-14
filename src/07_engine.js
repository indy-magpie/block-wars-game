/* ================= fighting engine (shared by every level) ================= */
function isBlocking(t) { return (t.isPlayer && !battle.autopilot) ? t.blocking : t.blockT > 0; }
function beginAttack(u) {
  u.attackT = 0; u.hitDone = false;
  const v = loud(u); if (v > .05) sfx.swing(v);
  const t = u.target;
  if (t && t.alive && !(t.isPlayer && !battle.autopilot) && t.attackT < 0 && t.stagger <= 0 && Math.random() < t.blockChance) t.blockT = u.hitAt + .28;
}
function playerVictim(p) {
  const foes = battle.nor; let best = null, bd = 1e9;
  for (const e of foes) {
    if (!e.alive || e.untargetable) continue;
    const dx = e.x - p.x, dz = e.z - p.z, d = hyp(dx, dz);
    if (d > p.range + .55) continue;
    if (Math.abs(angDiff(Math.atan2(dx, dz), p.yaw)) > 1.2) continue;
    const s = d - (e === p.lock ? .8 : 0);
    if (s < bd) { bd = s; best = e; }
  }
  return best;
}
function poseKneel(u) {
  const P = u.pose; P.armR = -2.8; P.armL = -2.8; P.legR = 1.35; P.legL = 1.35; P.sx = .46; P.sy = 1.75; P.sz = .42; P.sry = .3; u.tilt = 0; u.y = u.gy - .42;
}
function kill(t, a) {
  t.hp = 0; t.alive = false; t.target = null; t.vx = t.vz = 0; t.blockT = 0; t.blocking = false; t.attackT = -1;
  if (t.surrenders) { t.gone = true; poseKneel(t); }
  else { t.deathT = 0; t.fallDir = Math.random() < .7 ? -1 : 1; }
  if (a && a.isPlayer) a.kills++;
  dropLoot(t, a);
  const v = loud(t); if (v > .04) sfx.death(v);
}
function hurt(t, dmg, a) {
  const B = battle;
  if (t.isPlayer) { B.lastHurt = B.t; B.shake = .22; }
  t.hp -= dmg; t.flash = .16; t.lastHitT = B.t;
  if (t.hold && B.rules.wake) B.rules.wake(t);
  if (t.hp <= 0) kill(t, a);
}
function resolveHit(a) {
  const B = battle, human = a.isPlayer && !B.autopilot;
  const t = human ? playerVictim(a) : a.target;
  if (!t || !t.alive) return;
  const dx = t.x - a.x, dz = t.z - a.z, d = hyp(dx, dz) || 1e-4;
  if (d > a.range + .7) return;
  if (!human && Math.abs(angDiff(Math.atan2(dx, dz), a.yaw)) > 1.25) return;
  const v = Math.max(loud(a), loud(t)), mx = (a.x + t.x) / 2, mz = (a.z + t.z) / 2, my = t.gy + 1.22;
  if (isBlocking(t) && Math.abs(angDiff(Math.atan2(-dx, -dz), t.yaw)) < (t.isPlayer ? 1.9 : 1.4)) {
    if (v > .04) sfx.clang(v);
    burst(mx, my, mz, 5, 0xfff0a0, 3.2, .3, .09);
    a.stagger = t.isPlayer ? .55 : .25; a.kx -= dx / d * 2.5; a.kz -= dz / d * 2.5;
    t.kx += dx / d * 1.2; t.kz += dz / d * 1.2;
    return;
  }
  let dmg = rand(a.dmg[0], a.dmg[1]);
  if (t.isPlayer) dmg *= (a.hurt !== null ? a.hurt : TUNE.hurtPlayer);
  if (a.isPlayer && a.jy > .25) { dmg *= TUNE.jumpHit; t.kx += dx / d * 2.5; t.kz += dz / d * 2.5; burst(mx, my, mz, 6, 0xffffff, 3.6, .32, .1); }      /* a blow struck in mid-air lands harder */
  a.lastHitT = B.t;
  const kb = t.wall || t.kind === 'king' ? 1.5 : 4.2;
  t.kx += dx / d * kb; t.kz += dz / d * kb;
  if (v > .04) sfx.hit(v);
  burst(mx, my, mz, 4, 0xf4e2b0, 2.6, .28, .08);
  if (!t.target || hyp(t.target.x - t.x, t.target.z - t.z) > 3.5) { if (!(t.isPlayer && !B.autopilot)) t.target = a; }
  hurt(t, dmg, a);
}
function think(u) {
  const B = battle, foes = u.team === 0 ? B.nor : B.sax, pl = B.player;
  let best = null, bs = 1e9;
  if (u.kind !== 'line') {
    const R = u.kind === 'king' ? 4.4 : 5.6;
    for (const e of foes) {
      if (!e.alive || e.untargetable) continue;
      if (hyp(e.x - u.hx, e.z - u.hz) > R) continue;
      const s = hyp(e.x - u.x, e.z - u.z) + (e.attackers - (u.target === e ? 1 : 0)) * 1.2;
      if (s < bs) { bs = s; best = e; }
    }
    u.target = best; return;
  }
  const tether = u.team === 0 && !u.isPlayer ? B.leash : 0;      /* allies stay near the player on long levels */
  let near = null, nd = 1e9;
  for (const e of foes) {
    if (!e.alive || e.untargetable) continue;
    if (tether && e.target !== u && hyp(e.x - pl.x, e.z - pl.z) > tether) continue;
    const others = e.attackers - (u.target === e ? 1 : 0), d = hyp(e.x - u.x, e.z - u.z);
    if (d < nd) { nd = d; near = e; }
    if (others >= (e.kind === 'king' ? 4 : e.kind === 'guard' ? 3 : MAX_ON_ONE)) continue;
    let s = d + others * 9;
    if (e.kind === 'guard') s += 26; else if (e.kind === 'king') s += 40;
    if (u.target === e) s -= 4;
    if (s < bs) { bs = s; best = e; }
  }
  u.target = best; u.watch = best ? null : near;
}
/* Steer round walls: if the straight line to (tx,tz) crosses a wall line outside its opening, head for the opening first. */
const _rt = [0, 0];
function route(u, tx, tz) {
  const G = battle.gates; let g = null, bd = 1e9;
  for (let i = 0; i < G.length; i++) { const q = G[i]; if ((u.z - q.z) * (tz - q.z) >= 0) continue; const d = Math.abs(q.z - u.z); if (d < bd) { bd = d; g = q; } }
  _rt[0] = tx; _rt[1] = tz;
  if (g) {
    const xc = u.x + (tx - u.x) * (g.z - u.z) / (tz - u.z), gx = clamp(xc, g.x0 + .7, g.x1 - .7);
    if (Math.abs(gx - xc) > .05) { _rt[0] = gx; _rt[1] = g.z + (tz > u.z ? .45 : -.45); }
  }
  return _rt;
}
const _mv = [0, 0];
function stepAI(u, dt) {
  const B = battle, R = B.rules;
  let mvx = 0, mvz = 0, face = u.yaw;
  if (u.cheer) { face = u.yaw; }
  else if (u.flee) { _mv[0] = 0; _mv[1] = 0; R.flee(u, _mv); mvx = _mv[0]; mvz = _mv[1]; if (mvx || mvz) face = Math.atan2(mvx, mvz); }
  else if (u.hold) {
    /* a sentry at its post: wakes its whole squad when the enemy comes close */
    u.thinkT -= dt;
    if (u.thinkT <= 0) {
      u.thinkT = rand(.3, .5);
      const foes = u.team === 0 ? B.nor : B.sax;
      for (const e of foes) if (e.alive && !e.untargetable && hyp(e.x - u.x, e.z - u.z) < u.aggro) { R.wake(u); break; }
    }
    const dx = u.hx - u.x, dz = u.hz - u.z, d = hyp(dx, dz);
    if (d > .2) { const sp = Math.min(u.speed, d * 3); mvx = dx / d * sp; mvz = dz / d * sp; }
    face = u.hyaw;
  } else {
    u.thinkT -= dt;
    if (u.thinkT <= 0) { u.thinkT = rand(.25, .45); think(u); }
    let t = u.target;
    if (t && !t.alive) { t = u.target = null; u.thinkT = 0; }
    if (t) {
      const dx = t.x - u.x, dz = t.z - u.z, d = hyp(dx, dz) || 1e-4;
      face = Math.atan2(dx, dz);
      const slow = (u.stagger > 0 || u.attackT >= 0) ? .3 : 1;
      if (u.archer && d > 3.2) {
        /* stand off and shoot */
        u.shotT -= dt;
        if (u.shotT <= 0 && d < 34 && Math.abs(angDiff(face, u.yaw)) < .5) { u.shotT = rand(2.8, 4.4); R.shoot(u, t); }
      } else if (u.kind === 'line') {
        let want = 0;
        if (d > u.range * .92) want = u.speed; else if (d < .95) want = -1.5;
        let ax = dx / d, az = dz / d;
        if (want > 0 && B.gates.length) { const r = route(u, t.x, t.z), rx = r[0] - u.x, rz = r[1] - u.z, rd = hyp(rx, rz) || 1e-4; ax = rx / rd; az = rz / rd; }
        mvx = ax * want * slow; mvz = az * want * slow;
        if (want === 0) {
          u.strafeT -= dt; if (u.strafeT <= 0) { u.strafeT = rand(.8, 2); u.strafe = pick([-1, 0, 0, 1]) * .9; }
          mvx += -dz / d * u.strafe; mvz += dx / d * u.strafe;
        }
      } else {
        const leash = u.kind === 'king' ? 1.4 : 2.3;
        let ex = t.x - u.hx, ez = t.z - u.hz; const ed = hyp(ex, ez);
        if (ed > leash) { ex *= leash / ed; ez *= leash / ed; }
        const gx = u.hx + ex - u.x, gz = u.hz + ez - u.z, gd = hyp(gx, gz);
        if (d > u.range * .92 && gd > .15) { const sp = Math.min(u.speed, gd * 4) * slow; mvx = gx / gd * sp; mvz = gz / gd * sp; }
      }
      if (d <= u.range + .15 && u.cool <= 0 && u.attackT < 0 && u.stagger <= 0 && u.blockT <= 0 && Math.abs(angDiff(face, u.yaw)) < .6) beginAttack(u);
    } else if (u.kind === 'line') {
      const slot = u.team === 0 && R.follow ? R.follow(u) : null;
      if (slot) {
        /* no one to fight: fall in behind the player */
        const far = hyp(slot[0] - u.x, slot[1] - u.z);
        if (far > 1.1) {
          const r = route(u, slot[0], slot[1]), dx = r[0] - u.x, dz = r[1] - u.z, d = hyp(dx, dz) || 1e-4, sp = Math.min(u.speed * 1.15, far * 2.5 + 1);
          mvx = dx / d * sp; mvz = dz / d * sp; face = Math.atan2(dx, dz);
        } else face = slot[2];
      } else {
        const w = u.watch;
        if (w && w.alive) {
          const dx = w.x - u.x, dz = w.z - u.z, d = hyp(dx, dz) || 1e-4;
          face = Math.atan2(dx, dz);
          if (d > 5.2) { mvx = dx / d * u.speed * .8; mvz = dz / d * u.speed * .8; }
          else if (d < 3.6) { mvx = -dx / d * 1.6; mvz = -dz / d * 1.6; }
        }
      }
    } else {
      const dx = u.hx - u.x, dz = u.hz - u.z, d = hyp(dx, dz);
      if (d > .12) { const sp = Math.min(u.speed, d * 3); mvx = dx / d * sp; mvz = dz / d * sp; }
      face = u.hyaw;
    }
  }
  u.vx = damp(u.vx, mvx, 10, dt); u.vz = damp(u.vz, mvz, 10, dt);
  u.yaw = turnTo(u.yaw, face, 9 * dt);
}

/* ---- input ---- */
const keys = { up: false, down: false, left: false, right: false, hit: false, block: false, jump: false, camL: false, camR: false };
const input = { mouseHit: false, mouseBlock: false, touchHit: false, touchBlock: false, touchJump: false, joyX: 0, joyY: 0, locked: false, lookId: null, lookX: 0, lookY: 0 };
const KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'jump', KeyF: 'hit', KeyJ: 'hit', ShiftLeft: 'block', ShiftRight: 'block', KeyK: 'block', KeyQ: 'camL', KeyE: 'camR' };

function stepPlayer(p, dt) {
  const B = battle;
  let ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + input.joyX, iy = (keys.up ? 1 : 0) - (keys.down ? 1 : 0) + input.joyY;
  const len = hyp(ix, iy); if (len > 1) { ix /= len; iy /= len; }
  if (keys.camL) cam.yaw += 2.2 * dt; if (keys.camR) cam.yaw -= 2.2 * dt;
  if (!input.locked && !touchMode && Math.abs(ix) > .1) cam.yaw -= ix * 1.25 * dt;
  const fx_ = Math.sin(cam.yaw), fz_ = Math.cos(cam.yaw);
  const mx = fx_ * iy - fz_ * ix, mz = fz_ * iy + fx_ * ix;
  const wantHit = keys.hit || input.mouseHit || input.touchHit, wantBlock = keys.block || input.mouseBlock || input.touchBlock;
  p.blocking = wantBlock && p.attackT < 0 && p.stagger <= 0;
  if ((keys.jump || input.touchJump) && p.jy <= 0 && p.jv === 0 && p.stagger <= 0) { p.jv = TUNE.jump; sfx.jump(); }
  if (wantHit && p.attackT < 0 && p.cool <= 0 && p.stagger <= 0) {
    p.blocking = false;
    let best = null, bd = 1e9; const ref = len > .1 ? Math.atan2(mx, mz) : p.yaw;
    for (const e of B.nor) {
      if (!e.alive || e.untargetable) continue;
      const dx = e.x - p.x, dz = e.z - p.z, d = hyp(dx, dz);
      if (d > 3.3) continue;
      const off = Math.abs(angDiff(Math.atan2(dx, dz), ref)); if (off > 2.0) continue;
      const s = d + off * .8; if (s < bd) { bd = s; best = e; }
    }
    p.lock = best; if (best) p.yaw = Math.atan2(best.x - p.x, best.z - p.z);
    p.attackT = 0; p.hitDone = false; sfx.swing(1);
  }
  let face = null;
  if (p.attackT >= 0 && p.lock && p.lock.alive) face = Math.atan2(p.lock.x - p.x, p.lock.z - p.z);
  else if (p.blocking) {
    let best = null, bd = 1e9;
    for (const e of B.nor) { if (!e.alive || e.untargetable) continue; const d = hyp(e.x - p.x, e.z - p.z) - (e.target === p ? 1.5 : 0) - (e.attackT >= 0 ? 1 : 0); if (d < 3.6 && d < bd) { bd = d; best = e; } }
    if (best) face = Math.atan2(best.x - p.x, best.z - p.z);
  }
  if (face === null && len > .1) face = Math.atan2(mx, mz);
  if (face !== null) p.yaw = turnTo(p.yaw, face, 14 * dt);
  const sp = p.speed * (p.blocking ? .45 : 1) * (p.attackT >= 0 ? .6 : 1) * (p.stagger > 0 ? .25 : 1);
  p.vx = damp(p.vx, mx * sp, 14, dt); p.vz = damp(p.vz, mz * sp, 14, dt);
}

/* push a body out of tree trunks, columns and buildings */
function collide(u) {
  const B = battle, rad = u.rad, slide = !(u.isPlayer && !B.autopilot);
  for (const t of B.trees) {
    const dx = u.x - t.x, dz = u.z - t.z, min = t.r + rad, d2 = dx * dx + dz * dz;
    if (d2 < min * min && d2 > 1e-8) { const d = Math.sqrt(d2), k = (min - d) / d; u.x += dx * k - dz * k * .35; u.z += dz * k + dx * k * .35; }
  }
  const Rc = B.rects;
  for (let i = 0; i < Rc.length; i++) {
    const r = Rc[i];
    if (r.plat && u.isPlayer && u.gy + u.jy >= r.h - .2) continue;      /* the player is above it: he can stand on it */
    if (u.z < r.z0 - rad || u.z > r.z1 + rad || u.x < r.x0 - rad || u.x > r.x1 + rad) continue;
    const cx = clamp(u.x, r.x0, r.x1), cz = clamp(u.z, r.z0, r.z1), dx = u.x - cx, dz = u.z - cz, d2 = dx * dx + dz * dz;
    if (d2 > 1e-8) {
      if (d2 < rad * rad) {
        const d = Math.sqrt(d2), k = (rad - d) / d; u.x += dx * k; u.z += dz * k;
        /* soldiers walking straight into a small obstacle (a pool, an altar, a cart) slide round its nearer end */
        if (slide && r.x1 - r.x0 < 9 && r.z1 - r.z0 < 9) {
          const n = (rad - d) * .8 + .015;
          /* go the way the soldier is already heading; if it is heading straight in, take the nearer end */
          if (dx === 0) u.x += (Math.abs(u.vx) > .3 ? u.vx > 0 : u.x >= (r.x0 + r.x1) / 2) ? n : -n;
          else if (dz === 0) u.z += (Math.abs(u.vz) > .3 ? u.vz > 0 : u.z >= (r.z0 + r.z1) / 2) ? n : -n;
        }
      }
    }
    else {
      const a = u.x - r.x0, b = r.x1 - u.x, c = u.z - r.z0, e = r.z1 - u.z, m = Math.min(a, b, c, e);
      if (m === a) u.x = r.x0 - rad; else if (m === b) u.x = r.x1 + rad; else if (m === c) u.z = r.z0 - rad; else u.z = r.z1 + rad;
    }
  }
}

function stepFight(dt) {
  const B = battle, us = B.units, time = B.t, R = B.rules;
  B.t += dt;
  for (const u of us) u.attackers = 0;
  for (const u of us) if (u.alive && u.target && u.target.alive && !u.archer) u.target.attackers++;
  for (const u of us) {
    if (u.flash > 0) u.flash -= dt;
    if (u.drawT > 0) u.drawT -= dt;
    if (!u.alive) {
      if (u.gone) continue;
      u.deathT += dt;
      u.fall = u.fallDir * Math.min(1, u.deathT / .32) * PI / 2; u.y = u.gy; u.tilt = 0;
      if (u.deathT > 1.3) {
        if (!u.puffed) { u.puffed = true; burst(u.x, u.gy + .3, u.z, 7, 0xd8d8d0, 1.6, .7, .16); }
        u.shrink = clamp(1 - (u.deathT - 1.3) / .35, 0, 1);
        if (u.shrink <= 0) u.hidden = true;
      }
      continue;
    }
    if (u.fixed) { if (R.fixed) R.fixed(u, dt); continue; }
    if (u.npc) { u.vx = u.vz = 0; continue; }
    if (u.cool > 0) u.cool -= dt; if (u.blockT > 0) u.blockT -= dt; if (u.stagger > 0) u.stagger -= dt;
    if (u.raise > 0) u.raise = Math.max(0, u.raise - dt * 2.5);
    if (u.isPlayer && !B.autopilot) stepPlayer(u, dt); else stepAI(u, dt);
    if (u.attackT >= 0) {
      u.attackT += dt;
      if (!u.hitDone && u.attackT >= u.hitAt) { u.hitDone = true; resolveHit(u); }
      if (u.attackT >= u.attackDur) { const c = u.coolR || TUNE.aiCool; u.attackT = -1; u.cool = u.isPlayer ? (B.simCool || .05) : rand(c[0], c[1]); }
    }
    u.x += (u.vx + u.kx) * dt; u.z += (u.vz + u.kz) * dt;
    if (u.jv !== 0 || u.jy > 0) {
      u.jv -= TUNE.gravity * dt; u.jy += u.jv * dt;
      if (u.jy <= 0) { u.jy = 0; u.jv = 0; if (!B.sim) { sfx.land(); burst(u.x, u.gy + .1, u.z, 4, 0xcfc6a8, 1.3, .35, .1); } }
    }
    const kd = Math.exp(-9 * dt); u.kx *= kd; u.kz *= kd;
  }
  /* keep bodies apart */
  const n = us.length;
  for (let i = 0; i < n; i++) {
    const a = us[i]; if (!a.alive || a.fixed) continue;
    for (let j = i + 1; j < n; j++) {
      const b = us[j]; if (!b.alive || b.fixed) continue;
      const dx = b.x - a.x, dz = b.z - a.z, min = a.rad + b.rad, d2 = dx * dx + dz * dz;
      if (d2 >= min * min || d2 < 1e-8) continue;
      const d = Math.sqrt(d2), push = (min - d) / d, ta = b.mass / (a.mass + b.mass);
      a.x -= dx * push * ta; a.z -= dz * push * ta; b.x += dx * push * (1 - ta); b.z += dz * push * (1 - ta);
    }
  }
  const p = B.player;
  for (const u of us) {
    if (!u.alive) continue;
    if (!u.fixed) {
      if (!u.npc) { collide(u); R.clamp(u); }
      let g = B.ground(u.x, u.z);
      if (u.isPlayer) {
        /* low things the player has got above (a crate, a boulder, a wall of earth) count as ground */
        const feet = u.gy + u.jy, Rc = B.rects;
        for (let i = 0; i < Rc.length; i++) { const r = Rc[i]; if (r.plat && r.h > g && feet >= r.h - .2 && u.x > r.x0 - .1 && u.x < r.x1 + .1 && u.z > r.z0 - .1 && u.z < r.z1 + .1) g = r.h; }
        if (g < u.gy - .45) { u.jy += u.gy - g; u.gy = g; }                                             /* stepped off an edge: fall */
        else if (g > u.gy + .2 && u.jy > 0) { u.jy = Math.max(0, u.jy - (g - u.gy)); u.gy = g; if (u.jy === 0) u.jv = 0; }      /* came down on something higher */
        else u.gy = damp(u.gy, g, 16, dt);
      } else u.gy = damp(u.gy, g, 16, dt);
    }
    if (!B.sim) animate(u, dt, time);
  }
  if (p.alive && p.hp < p.maxHp && B.t - B.lastHurt > TUNE.regenDelay) p.hp = Math.min(p.maxHp, p.hp + TUNE.regen * dt);
  R.after(dt);
  if (B.over) B.endT += dt;
}
function endBattle(result) {
  const B = battle; if (B.over) return;
  B.over = true; B.result = result; B.endT = 0;
  if (B.sim) return;
  setCaption('', '');
  B.rules.end(result);
}

/* ---- camera ---- */
function camBlocked(x, y, z) {
  const Rc = battle.rects;
  for (let i = 0; i < Rc.length; i++) { const r = Rc[i]; if (r.h > y && x > r.x0 - .35 && x < r.x1 + .35 && z > r.z0 - .35 && z < r.z1 + .35) return true; }
  const Tr = battle.trees;
  for (let i = 0; i < Tr.length; i++) { const t = Tr[i]; if (t.cr && y < t.ch && y > t.cb) { const dx = x - t.x, dz = z - t.z; if (dx * dx + dz * dz < t.cr * t.cr) return true; } }
  return false;
}
function followCam(dt, snap) {
  const B = battle, p = B.player, ty = p.gy + 1.75;
  if (snap) { cam.tx = p.x; cam.tz = p.z; cam.ty = ty; cam.boom = cam.dist; }
  else { cam.tx = damp(cam.tx, p.x, 12, dt); cam.tz = damp(cam.tz, p.z, 12, dt); cam.ty = damp(cam.ty, ty, 8, dt); }
  if (B.over && !reduceMotion) cam.yaw += dt * .12;
  cam.pitch = clamp(cam.pitch, .12, 1.2);
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), fx_ = Math.sin(cam.yaw), fz_ = Math.cos(cam.yaw);
  const dx = -fx_ * cp, dy = sp, dz = -fz_ * cp;
  /* pull the camera in when a wall or building would come between it and the player */
  let allow = cam.dist;
  for (let k = 2; k <= 12; k++) { const s = cam.dist * k / 12; if (camBlocked(cam.tx + dx * s, cam.ty + dy * s, cam.tz + dz * s)) { allow = Math.max(1.6, cam.dist * (k - 1) / 12 - .2); break; } }
  cam.boom = snap ? allow : damp(cam.boom, allow, allow < cam.boom ? 26 : 3.5, dt);
  let sx = 0, sy = 0;
  if (B.shake > 0 && !reduceMotion) { B.shake -= dt; sx = (Math.random() - .5) * .22; sy = (Math.random() - .5) * .18; }
  camera.position.set(cam.tx + dx * cam.boom + sx, cam.ty + dy * cam.boom + sy, cam.tz + dz * cam.boom);
  camera.lookAt(cam.tx + fx_ * .9, cam.ty + .15, cam.tz + fz_ * .9);
}
function setCaption(title, sub, cls) {
  const c = $('caption'); $('capTitle').textContent = title || ''; $('capSub').textContent = sub || '';
  c.className = cls || ''; void c.offsetWidth; c.style.opacity = title ? 1 : 0;
}
let hintTimer = 0;
function showHint() {
  const h = $('hint');
  h.innerHTML = touchMode ? 'Left pad moves &middot; drag the screen to look &middot; <kbd>Hit</kbd>, <kbd>Block</kbd> and <kbd>Jump</kbd> on the right'
    : '<kbd>W A S D</kbd> move &middot; <kbd>Space</kbd> jump &middot; <kbd>Click</kbd> or <kbd>F</kbd> hit &middot; <kbd>Right-click</kbd> or <kbd>Shift</kbd> block &middot; <kbd>1</kbd> eat bread &middot; <kbd>I</kbd> pack';
  h.style.opacity = 1; clearTimeout(hintTimer); hintTimer = setTimeout(() => { h.style.opacity = 0; }, 16000);
}

/* ---- health bars over engaged enemies ---- */
const _camR = new T.Vector3(), _camF = new T.Vector3();
function writeHpBars() {
  const B = battle; let n = 0;
  _camR.set(1, 0, 0).applyQuaternion(camera.quaternion); _camF.set(0, 0, -1).applyQuaternion(camera.quaternion);
  if (B.phase === 'fight') for (const e of B.nor) {
    if (!e.alive || e.fixed || n >= 64) continue;
    const t = e.target, engaged = (t && t.alive && hyp(t.x - e.x, t.z - e.z) < 3.4) || (B.t - e.lastHitT < 2.5);
    if (!engaged || e.flee || e.cheer) continue;
    const y = e.y + (e.helmet ? (e.plume ? 2.95 : 2.62) : 2.38) * e.scale, f = clamp(e.hp / e.maxHp, 0, 1), Wd = .92;
    _v.set(e.x, y, e.z); _s.set(Wd + .07, .14, 1); _m.compose(_v, camera.quaternion, _s); B.hpBg.setMatrixAt(n, _m);
    const off = -Wd / 2 + Wd * f / 2;
    _v.set(e.x + _camR.x * off - _camF.x * .02, y + _camR.y * off - _camF.y * .02, e.z + _camR.z * off - _camF.z * .02);
    _s.set(Math.max(.001, Wd * f), .08, 1); _m.compose(_v, camera.quaternion, _s); B.hpFill.setMatrixAt(n, _m);
    n++;
  }
  B.hpBg.count = n; B.hpFill.count = n; B.hpBg.instanceMatrix.needsUpdate = true; B.hpFill.instanceMatrix.needsUpdate = true;
}

/* ---- the player's own health and tally (both levels) ---- */
const pips = $('pips'); for (let i = 0; i < 10; i++) pips.appendChild(document.createElement('i'));
function hudPlayer(hp, kills) {
  $('kills').textContent = kills;
  const ps = pips.children; for (let i = 0; i < 10; i++) ps[i].className = i < hp ? 'on' : '';
  pips.className = 'pips' + (hp <= 3 ? ' low' : '');
}
