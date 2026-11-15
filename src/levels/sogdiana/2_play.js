/* ================= Sogdiana: finding the way, being seen, alarms, talk, and the rules of the level ================= */
const GX0 = -62, GZ0 = -12, GNX = 144, GNZ = 160;

/* ---------- a one-metre grid of the map, so that guards can find their way round houses ---------- */
function gridBuild() {
  const S = sog, g = S.grid || (S.grid = new Uint8Array(GNX * GNZ)); g.fill(0);
  const mark = (x0, x1, z0, z1) => {
    const i0 = Math.max(0, Math.floor(x0 - GX0 - .5) + 1), i1 = Math.min(GNX - 1, Math.ceil(x1 - GX0 - .5) - 1), j0 = Math.max(0, Math.floor(z0 - GZ0 - .5) + 1), j1 = Math.min(GNZ - 1, Math.ceil(z1 - GZ0 - .5) - 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g[j * GNX + i] = 1;
  };
  for (const r of S.rects) if (r.x0 < 1e5) mark(r.x0 - .45, r.x1 + .45, r.z0 - .45, r.z1 + .45);
  for (const t of S.trees) mark(t.x - t.r - .3, t.x + t.r + .3, t.z - t.r - .3, t.z + t.r + .3);
  mark(-1e3, -58, -1e3, 1e3); mark(78, 1e3, -1e3, 1e3); mark(-1e3, 1e3, -1e3, -9); mark(-1e3, 1e3, 145, 1e3);
}
function cellAt(x, z) { const i = Math.floor(x - GX0), j = Math.floor(z - GZ0); return (i < 0 || j < 0 || i >= GNX || j >= GNZ) ? -1 : j * GNX + i; }
function cellFree(x, z) {
  const g = sog.grid, c = cellAt(x, z); if (c >= 0 && !g[c]) return c;
  const i0 = Math.floor(x - GX0), j0 = Math.floor(z - GZ0); let best = -1, bd = 1e9;
  for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) {
    const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= GNX || j >= GNZ) continue;
    const k = j * GNX + i; if (g[k]) continue;
    const d = hyp(GX0 + i + .5 - x, GZ0 + j + .5 - z); if (d < bd) { bd = d; best = k; }
  }
  return best;
}
/* steps from every open cell to (x,z) */
function fieldFrom(x, z, out) {
  const g = sog.grid, q = sog.queue, last = GNX * (GNZ - 1); out.fill(-1);
  const s = cellFree(x, z); if (s < 0) return false;
  let h = 0, t = 0; q[t++] = s; out[s] = 0;
  while (h < t) {
    const c = q[h++], d = out[c] + 1, i = c % GNX;
    if (i > 0 && !g[c - 1] && out[c - 1] < 0) { out[c - 1] = d; q[t++] = c - 1; }
    if (i < GNX - 1 && !g[c + 1] && out[c + 1] < 0) { out[c + 1] = d; q[t++] = c + 1; }
    if (c >= GNX && !g[c - GNX] && out[c - GNX] < 0) { out[c - GNX] = d; q[t++] = c - GNX; }
    if (c < last && !g[c + GNX] && out[c + GNX] < 0) { out[c + GNX] = d; q[t++] = c + GNX; }
  }
  return true;
}
function downhill(c, f) {
  const g = sog.grid, i = c % GNX, Lf = i > 0, Rt = i < GNX - 1, Up = c >= GNX, Dn = c < GNX * (GNZ - 1);
  let best = -1, bv = f[c];
  const tryc = k => { const v = f[k]; if (v >= 0 && v < bv) { bv = v; best = k; } };
  if (Lf) tryc(c - 1); if (Rt) tryc(c + 1); if (Up) tryc(c - GNX); if (Dn) tryc(c + GNX);
  if (Lf && Up && !g[c - 1] && !g[c - GNX]) tryc(c - GNX - 1);
  if (Rt && Up && !g[c + 1] && !g[c - GNX]) tryc(c - GNX + 1);
  if (Lf && Dn && !g[c - 1] && !g[c + GNX]) tryc(c + GNX - 1);
  if (Rt && Dn && !g[c + 1] && !g[c + GNX]) tryc(c + GNX + 1);
  return best;
}
function lineFree(x0, z0, x1, z1) {
  const g = sog.grid, d = hyp(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(d / .5));
  for (let k = 1; k < n; k++) { const c = cellAt(x0 + (x1 - x0) * k / n, z0 + (z1 - z0) * k / n); if (c < 0 || g[c]) return false; }
  return true;
}
/* a walkable path as a short list of corners */
function pathTo(x0, z0, x1, z1) {
  const f = sog.field2; if (!fieldFrom(x1, z1, f)) return [[x1, z1]];
  let c = cellFree(x0, z0); if (c < 0 || f[c] < 0) return [[x1, z1]];
  const pts = []; let guard = 0;
  while (f[c] > 0 && guard++ < 700) { const n = downhill(c, f); if (n < 0) break; c = n; pts.push([GX0 + (c % GNX) + .5, GZ0 + ((c / GNX) | 0) + .5]); }
  pts.push([x1, z1]);
  const out = []; let ax = x0, az = z0, i = 0;
  while (i < pts.length) {
    let j = Math.min(pts.length - 1, i + 40);
    while (j > i && !lineFree(ax, az, pts[j][0], pts[j][1])) j--;
    out.push(pts[j]); ax = pts[j][0]; az = pts[j][1]; i = j + 1;
  }
  return out;
}

/* ---------- sight ---------- */
/* Is the straight line between two points clear of anything taller than minH? A crouching player hides behind lower things than a standing one. */
function losClear(x0, z0, x1, z1, minH) {
  const Rc = sog.rects, dx = x1 - x0, dz = z1 - z0, ax0 = Math.min(x0, x1), ax1 = Math.max(x0, x1), az0 = Math.min(z0, z1), az1 = Math.max(z0, z1);
  for (let i = 0; i < Rc.length; i++) {
    const r = Rc[i]; if (r.h < minH || r.x1 < ax0 || r.x0 > ax1 || r.z1 < az0 || r.z0 > az1) continue;
    if (x1 > r.x0 && x1 < r.x1 && z1 > r.z0 && z1 < r.z1) continue;      /* whatever he is standing on does not hide him */
    let t0 = 0, t1 = 1;
    if (Math.abs(dx) > 1e-9) { let a = (r.x0 - x0) / dx, b = (r.x1 - x0) / dx; if (a > b) { const s = a; a = b; b = s; } if (a > t0) t0 = a; if (b < t1) t1 = b; }
    if (Math.abs(dz) > 1e-9) { let a = (r.z0 - z0) / dz, b = (r.z1 - z0) / dz; if (a > b) { const s = a; a = b; b = s; } if (a > t0) t0 = a; if (b < t1) t1 = b; }
    if (t0 <= t1) return false;
  }
  return true;
}
const sogTownish = z => z === 'town' || z === 'gate' || z === 'egate';
function looks(g, p) {
  const S = sog, F = S.flags, dx = p.x - g.x, dz = p.z - g.z, d = hyp(dx, dz), alert = g.mode === 'alert';
  g.seeD = d;
  const robed = F.robe && sogTownish(g.zone) && g.mode === 'post';
  let R = alert ? 20 : robed ? S_TUNE.seeRobe : g.boss ? S_TUNE.seeBoss : S_TUNE.see;
  if (p.sneak && !alert && !robed) R *= S_TUNE.sneakSee;
  g.seeR = R;
  if (!p.alive) return false;
  if (S.inHay && !(alert && d < 2)) return d < .7;      /* in a haystack he is only found by a guard who saw him dive in, or who treads on him */
  const hear = alert ? 3.5 : robed ? 0 : p.sneak ? S_TUNE.hearSneak : hyp(p.vx, p.vz) > 3 ? S_TUNE.hear : 1.4;
  if (d > Math.max(R, hear)) return false;
  if (d > hear && !alert && Math.abs(angDiff(Math.atan2(dx, dz), g.yaw)) > S_TUNE.half) return false;
  return losClear(g.x, g.z, p.x, p.z, p.sneak ? 1.1 : 1.7);
}
/* guards who have a reason to leave the player alone */
function ignores(g) {
  const F = sog.flags, p = battle.player;
  if (g.mode !== 'post') return false;
  if (g.door === 'gate' || g.door === 'cit') return true;                    /* gatekeepers challenge travellers; they only give chase if he barges past or strikes them */
  if (g.door === 'hall') return (F.courtPass || F.token) && p.z < 124;
  if (g.zone === 'court') return F.courtPass;                                /* he gave the password: the court takes him for a messenger */
  return false;
}

/* ---------- alarms ---------- */
function alarm(zone, why) {
  const B = battle, S = sog, Z = S.zones[zone], p = B.player; if (!Z || B.over) return;
  if (S.log && Z.state !== 'alarm') S.log.push([zone, why && why.x !== undefined ? 'seen from ' + why.x.toFixed(1) + ',' + why.z.toFixed(1) + ' sus ' + why.sus.toFixed(2) + ' d ' + why.seeD.toFixed(1) + ' R ' + why.seeR : why || '', +p.x.toFixed(1), +p.z.toFixed(1), +B.t.toFixed(1)]);
  S.seenT = B.t; S.lkx = p.x; S.lkz = p.z; S.fieldT = 0;
  const was = Z.state; Z.state = 'alarm';
  for (const g of S.guards) if (g.alive && g.zone === zone && g.mode !== 'alert') { g.mode = 'alert'; g.modeT = 0; g.hold = false; g.speed = g.run; g.sus = 1; g.path = null; g.thinkT = rand(0, .3); }
  if (was === 'calm') {
    S.flags.alarms++;
    if (!B.sim) { sfx.horn(294); tell('Spotted! Every guard here is coming for you. Run, and get out of sight.', 5); }
  }
}
function patrolNext(g, commit) {
  const n = g.patrol.length; let i = g.pi, d = g.pdir;
  if (g.loop) i = (i + 1) % n; else { if (i + d < 0 || i + d >= n) d = -d; i += d; }
  if (commit) { g.pi = i; g.pdir = d; }
  return i;
}
function legTime(g, w) { return hyp(w[0] - g.x, w[1] - g.z) / Math.max(1, g.speed) * 1.5 + 2.5; }
function goHome(g) {
  const t = g.patrol ? g.patrol[g.pi] : [g.px, g.pz];
  g.mode = 'return'; g.modeT = 0; g.speed = S_TUNE.walk + .8; g.sus = 0; g.path = pathTo(g.x, g.z, t[0], t[1]); g.pk = 0; g.legT = legTime(g, g.path[0]);
}
function stepZones() {
  const B = battle, S = sog;
  for (const k in S.zones) {
    const Z = S.zones[k];
    if (Z.state === 'alarm' && B.t - S.seenT > S_TUNE.grace) {
      /* no one can see him any more: they run to where he was last seen and look about */
      Z.state = 'search';
      for (const g of S.guards) if (g.alive && g.zone === k && g.mode === 'alert') {
        g.mode = 'search'; g.modeT = 0; g.hold = true; g.target = null; g.sus = .4; g.lookT = S_TUNE.search + rand(0, 2.5); g.speed = g.run * .85;
        if (g.boss) g.path = null; else { const a = rand(0, PI * 2), r = rand(1.7, 3.6); g.path = pathTo(g.x, g.z, S.lkx + Math.cos(a) * r, S.lkz + Math.sin(a) * r); g.pk = 0; g.legT = legTime(g, g.path[0]); }
      }
      tell('They have lost sight of you. Stay hidden until they give up.', 4);
    } else if (Z.state === 'search') {
      let busy = false; for (const g of S.guards) if (g.alive && g.zone === k && g.mode === 'search') { busy = true; break; }
      if (!busy) { Z.state = 'calm'; tell('The guards give up the search.', 3); }
    }
  }
}
function stepGuard(g, dt) {
  const S = sog, p = battle.player;
  g.modeT += dt;
  if (g.mode === 'alert') return;                                            /* the fighting engine runs him now */
  const watch = g.sees && !ignores(g);
  if (watch) {
    const robed = S.flags.robe && sogTownish(g.zone) && g.mode === 'post';
    g.sus = Math.min(1, g.sus + S_TUNE.susUp * (1.6 - Math.min(1, g.seeD / Math.max(1, g.seeR))) * (g.mode === 'search' ? 4 : 1) * (robed ? .4 : 1) * dt);
  } else g.sus = Math.max(0, g.sus - S_TUNE.susDown * dt);
  if (g.sus >= 1) { alarm(g.zone, g); return; }
  if (watch && g.sus > .2 && g.mode !== 'search') { g.hx = g.x; g.hz = g.z; g.hyaw = Math.atan2(p.x - g.x, p.z - g.z); return; }      /* he stops and stares */
  if (g.mode === 'post') {
    if (g.boss) {      /* Spitamenes looks south, then to one side, then south, then to the other */
      g.turnT -= dt; if (g.turnT <= 0) { g.ti = (g.ti + 1) % 4; g.turnT = g.ti % 2 ? 2.5 : 5; }
      g.hx = g.px; g.hz = g.pz; g.hyaw = [PI, -PI / 2, PI, PI / 2][g.ti]; return;
    }
    if (!g.patrol) { g.hx = g.px; g.hz = g.pz; g.hyaw = g.pyaw; return; }
    const w = g.patrol[g.pi], d = hyp(w[0] - g.x, w[1] - g.z);
    if (d < .4) {
      if (!g.arr) { g.arr = true; g.waitT = w[2] || 0; }
      const n = g.patrol[patrolNext(g, false)]; g.hx = w[0]; g.hz = w[1]; g.hyaw = Math.atan2(n[0] - w[0], n[1] - w[1]);      /* he turns to face the way he will go next, and waits */
      g.waitT -= dt; if (g.waitT <= 0) { g.arr = false; patrolNext(g, true); }
    } else { g.hx = w[0]; g.hz = w[1]; g.hyaw = Math.atan2(w[0] - g.x, w[1] - g.z); }
    return;
  }
  const path = g.path;
  if (path && g.pk < path.length) {
    const w = path[g.pk], d = hyp(w[0] - g.x, w[1] - g.z); g.legT -= dt;
    if (d < .55 || g.legT <= 0) { g.pk++; if (g.pk < path.length) g.legT = legTime(g, path[g.pk]); }
    else { g.hx = w[0]; g.hz = w[1]; g.hyaw = Math.atan2(w[0] - g.x, w[1] - g.z); }
    return;
  }
  if (g.mode === 'search') { g.hx = g.x; g.hz = g.z; g.hyaw += dt * 1.5; g.lookT -= dt; if (g.lookT <= 0) goHome(g); }
  else { g.mode = 'post'; g.modeT = 0; g.speed = S_TUNE.walk; g.arr = false; g.sus = 0; }
}
/* a guard has fallen: any other guard who is looking that way raises the alarm */
function witness(v) {
  for (const g of sog.guards) {
    if (!g.alive || g === v || g.mode === 'alert') continue;
    const dx = v.x - g.x, dz = v.z - g.z, d = hyp(dx, dz);
    if (d < S_TUNE.see && Math.abs(angDiff(Math.atan2(dx, dz), g.yaw)) < S_TUNE.half && losClear(g.x, g.z, v.x, v.z, 1.7)) alarm(g.zone, 'witness');
  }
}

/* ---------- townsfolk, merchants and horsemen ---------- */
function stepSogCivs(dt) {
  const B = battle, S = sog, p = B.player, scare = S.zones.town.state !== 'calm';
  for (const c of S.civ.units) {
    if (c.hidden) continue;
    let mvx = 0, mvz = 0;
    if (c.roam) {
      c.panic = scare; c.thinkT -= dt;
      if (c.thinkT <= 0) { c.thinkT = scare ? rand(.6, 1.4) : rand(2, 7); if (scare || Math.random() < .7) { c.gx = rand(c.roam[0], c.roam[1]); c.gz = rand(c.roam[2], c.roam[3]); } }
      const dx = c.gx - c.x, dz = c.gz - c.z, d = hyp(dx, dz);
      if (d > .5) { const sp = scare ? 4 : c.speed; mvx = dx / d * sp; mvz = dz / d * sp; c.yaw = turnTo(c.yaw, Math.atan2(dx, dz), 7 * dt); }
    } else c.yaw = turnTo(c.yaw, p && hyp(p.x - c.x, p.z - c.z) < 5 ? Math.atan2(p.x - c.x, p.z - c.z) : c.face, 4 * dt);
    c.vx = damp(c.vx, mvx, 8, dt); c.vz = damp(c.vz, mvz, 8, dt); c.x += c.vx * dt; c.z += c.vz * dt;
    if (c.roam) { collide(c); const dx = c.x - p.x, dz = c.z - p.z, d = hyp(dx, dz); if (d < .8 && d > 1e-4) { c.x += dx / d * (.8 - d); c.z += dz / d * (.8 - d); } }
    if (!B.sim) animate(c, dt, B.t);
  }
}
function ridersLeave(all) {
  const S = sog;
  for (const g of S.guards) if (g.alive && g.rider && g.zone === 'court') { g.alive = false; g.gone = true; g.hidden = true; g.told = true; }
  if (all) { for (const r of S.riders) { burst(r.x, 1, r.z, 6, 0xd8d8d0, 1.6, .6, .15); r.hidden = true; } if (S.chief) { burst(S.chief.x, 1, S.chief.z, 6, 0xd8d8d0, 1.6, .6, .15); S.chief.hidden = true; } }
}
function angerCamp() {
  const S = sog;
  for (const r of S.riders) { if (r.hidden) continue; r.hidden = true; mkGuard(lookRider(), r.x, r.z, r.yaw, 'camp', { rider: true, hp: S_TUNE.riderHp, dmg: S_TUNE.riderDmg, loot: 3 }); }
  if (S.chief) S.chief.hidden = true;
  alarm('camp');
}

const bye = () => {};
function setCp(x, z, yaw) { sog.cp = [x, z, yaw || 0]; Save.flush(); }
function pay(n) { Inv.addCoins(-n); sfx.coin(); }
const cost = (n, have) => n + ' drachmas' + (have >= n ? '' : ' · you have ' + have);

function talkCoenus() {
  const F = sog.flags;
  if (F.briefed) { openTalk('Coenus', F.inTown ? 'Still here? Spitamenes will not catch himself, Companion.' : 'Gabae lies north, up the road. Stay out of the guards’ sight.', [['Farewell', bye]]); return; }
  openTalk('Coenus, general of Alexander', 'Companion! The rebel Spitamenes is hiding in the fort of Gabae. King Alexander wants him caught alive.', [['Go on', () =>
    openTalk('Coenus', 'You go alone and on foot, with only your knife. If one guard sees you, every guard nearby will come running. So do not be seen. Hold Shift to creep.', [['Go on', () =>
      openTalk('Coenus', 'A potter in the bazaar is our friend. Find him. And take this silver, for you may have to buy your way.', [['I am ready', () => {
        F.briefed = true; const c = Inv.coins(); if (c < S_TUNE.stipend) { Inv.addCoins(S_TUNE.stipend - c); sfx.coin(); }
        setCp(0, 5.4, 0); sfx.chime();
      }]])]])]]);
}
function talkTrader() {
  const F = sog.flags, c = Inv.coins();
  openTalk('Caravan trader', 'Robes from Bactra, friend! Put one on, and the guards of Gabae will take you for a trader like me.', [
    ['Buy the robe · ' + cost(S_TUNE.robe, c), () => { pay(S_TUNE.robe); F.robe = true; wearRobe(battle.player); setCp(7, 30.4, 0); tell('You are dressed as a trader. The town guards will not know you, unless you stand right under their noses.', 6); }, false, c < S_TUNE.robe],
    ['Not today', bye, true]]);
}
function talkGate() {
  const F = sog.flags, c = Inv.coins();
  openTalk('Gate guard', 'Halt. No strangers in Gabae while the lord Spitamenes is here. Be off with you.', [
    ['Offer him ' + cost(S_TUNE.bribe, c), () => { pay(S_TUNE.bribe); F.gatePass = true; F.gate = 'bribe';
      openTalk('Gate guard', 'Hm. I saw no one. In you go. But keep away from the patrols: nobody has paid them.', [['Go in', bye]]); }, false, c < S_TUNE.bribe],
    ['Walk away', bye, true]]);
}
function potterTip() {
  const F = sog.flags; F.campKnown = true; setCp(-10.5, 77.6, 0); sfx.chime();
  openTalk('The potter', 'One thing more. The Massagetae horsemen camp outside the east gate. Their chief loves silver more than he loves Spitamenes.', [['Thank you', bye]]);
}
function talkPotter() {
  const F = sog.flags, c = Inv.coins();
  if (F.potter === 'threat') { openTalk('The potter', 'Go away! I have told you all I know.', [['Leave', bye]]); return; }
  if (F.potter === 'paid') { openTalk('The potter', 'Remember: the password is OXUS. Or lift the grate on the water channel, east of the citadel.', [['Farewell', bye]]); return; }
  if (F.jarGiven) { openTalk('The potter', 'The water channel, east of the citadel, outside the town wall. The grate lifts out.', [['Farewell', bye]]); return; }
  if (F.jarAsked) {
    if (!F.jar) { openTalk('The potter', 'My blue jar is on the guards’ table, by the east gate. Bring it to me and I will tell you the way in.', [['I will', bye]]); return; }
    openTalk('The potter', 'My jar! Bless you. Now listen. A water channel runs into the citadel on its east side, outside the town wall. The iron grate is loose. Lift it out and crawl in.', [['Go on', () => {
      F.jar = false; F.jarGiven = true; F.channel = true; F.potter = 'favour'; potterTip(); }]]);
    return;
  }
  openTalk('The potter', 'Shh! Coenus sent you? I know the ways into the citadel. But a secret like that is worth something.', [
    ['Pay him ' + cost(S_TUNE.potter, c), () => { pay(S_TUNE.potter); F.potter = 'paid'; F.password = true; F.channel = true;
      openTalk('The potter', 'Two ways. The password at the citadel gate is OXUS: say it, and the guards will let you walk in. Or lift the loose grate on the water channel, east of the citadel, and crawl through.', [['Go on', potterTip]]); }, false, c < S_TUNE.potter],
    ['Offer to help him', () => { F.jarAsked = true;
      openTalk('The potter', 'The guards took my best blue jar. It sits on their table by the east gate. Fetch it back, and I will tell you what I know.', [['I will fetch it', bye]]); }],
    ['Threaten him', () => { F.potter = 'threat'; F.channel = true; setCp(-10.5, 77.6, 0);
      openTalk('The potter', 'No, no! The water channel, east of the citadel! The grate lifts out! ... GUARDS! A SPY! A SPY IN THE BAZAAR!', [['Run!', () => alarm('town')]]); }, true],
    ['Leave', bye, true]]);
}
function talkBaker() {
  const c = Inv.coins(), full = Inv.count('bread') >= ITEMS.bread.max;
  openTalk('The baker', full ? 'Your pack is full of my bread already. Come back when you have eaten some.' : 'Flat bread, hot from the oven! It will put the strength back in your legs.', [
    ['Buy a loaf · ' + cost(S_TUNE.bread, c), () => { if (Inv.give('bread', 1)) pay(S_TUNE.bread); }, false, full || c < S_TUNE.bread],
    ['No, thank you', bye, true]]);
}
function talkCarpets() {
  const F = sog.flags;
  openTalk('The carpet seller', F.channel || F.password ? 'They say the Massagetae only ride with Spitamenes while he pays them. Their camp is outside the east gate.'
    : 'Looking for someone? The potter keeps his stall in the far corner, under the blue jars. He hears everything.', [['Thank you', bye]]);
}
function talkFruit() { openTalk('The fruit seller', 'Mind the patrols, stranger. If they start shouting, jump in a haystack and keep still. It worked for my goat.', [['Thank you', bye]]); }
function takeJar() { const F = sog.flags; F.jar = true; sog.jar.visible = false; sfx.coin(); tell('You have the potter’s blue jar. Take it back to him.', 4); sogRules.hud(true); }
function takeStash(i) { sog.flags.stash[i] = true; Inv.addCoins(S_TUNE.stash); sfx.coin(); tell('You find six drachmas hidden in the pot.', 3.5); }
function talkChief() {
  const F = sog.flags, c = Inv.coins(), who = 'Chief of the Massagetae';
  openTalk(who, 'A Macedonian, on foot, in my camp. You are brave, or you are foolish. Speak.', [
    ['Pay him ' + cost(S_TUNE.chief, c) + ' to ride away', () => { pay(S_TUNE.chief); F.chief = 'paid'; F.token = true; setCp(51.5, 79, PI / 2);
      openTalk(who, 'Silver speaks louder than Spitamenes. We ride tonight. Take this arrow of mine. Show it to his bodyguards, and he will know that he stands alone.', [['Take the arrow', () => { ridersLeave(true); sfx.chime(); }]]); }, false, c < S_TUNE.chief],
    ['Say that Alexander’s army is near', () => { F.chief = 'talked'; setCp(51.5, 79, PI / 2);
      openTalk(who, 'Then this is no fight of ours. My riders will leave the citadel and watch from the hills. But I give you nothing more.', [['Farewell', () => { ridersLeave(false); sfx.chime(); }]]); }],
    ['Tell him to run away, or else', () => { F.chief = 'angry';
      openTalk(who, 'You threaten ME, in my own camp? Riders! Take him!', [['Run!', angerCamp]]); }, true],
    ['Leave', bye, true]]);
}
function openGate(how) {
  const S = sog, F = S.flags; if (F.gateOpen) return;
  F.gateOpen = true; F.courtPass = how === 'password'; S.door.visible = false; S.doorRect.x0 = S.doorRect.x1 = 1e6; gridBuild();
  if (!battle.sim) sfx.thunk(1);
}
function talkDoor() {
  const F = sog.flags;
  if (F.password) openTalk('Citadel guard', 'Halt! What is the password?', [
    ['Say “Oxus”', () => { openGate('password'); openTalk('Citadel guard', 'Pass, messenger. The lord Spitamenes is in his hall.', [['Go in', bye]]); }],
    ['Say nothing', bye, true]]);
  else openTalk('Citadel guard', 'Halt! What is the password? ... No password, no entry. Clear off.', [['Walk away', bye]]);
}
function lookGrate() {
  const S = sog, F = S.flags;
  if (F.grate) return;
  if (!F.channel) { tell('An iron grate over the water channel. It will not move. Perhaps someone in the bazaar knows its secret.', 5); return; }
  F.grate = true; S.grate.visible = false; S.grateRect.duck = true; setCp(26.4, 118.2, -PI / 2); sfx.thunk(1);
  tell(touchMode ? 'The grate lifts out. Hold Sneak to crouch, and crawl through.' : 'The grate lifts out. Hold Shift to crouch, and crawl through.', 6);
}
function talkBody() {
  const S = sog, F = S.flags, b = S.boss;
  if (!F.token) { openTalk('Bodyguard', 'No one sees the lord Spitamenes. Stand back from the door.', [['Step back', bye]]); return; }
  openTalk('Bodyguard', 'That arrow... it is the mark of the Massagetae chief. Wait here.', [['Go on', () => {
    b.x = b.hx = b.px = 0; b.z = b.hz = b.pz = 123.3; b.yaw = b.hyaw = PI; b.vx = b.vz = 0;
    openTalk('Spitamenes', 'The Massagetae have ridden away? Then I am alone, and this war is lost. I will not waste the lives of my men. I yield to Alexander.', [['Accept his surrender', () => yieldBoss('token')]]);
  }]]);
}
function canSeize() {
  const b = sog.boss, p = battle.player; if (!b.alive || b.mode !== 'post' || b.sus > .6 || battle.over) return false;
  return Math.abs(angDiff(Math.atan2(p.x - b.x, p.z - b.z), b.yaw)) > 1.75;
}
function seize() {
  if (!canSeize()) return;
  openTalk('Spitamenes', 'A knife at my back, and not a sound from my guards. You are good, Macedonian. Enough. I yield.', [['Take him prisoner', () => yieldBoss('seize')]]);
}
function yieldBoss(how) {
  const b = sog.boss; sog.flags.end = how;
  b.hp = 0; b.alive = false; b.gone = true; b.target = null; b.vx = b.vz = 0; b.attackT = -1; b.blockT = 0; poseKneel(b);
  endBattle('victory');
}

/* ---------- things to talk to and things to use ---------- */
function sogActs() {
  const S = sog, F = S.flags, A = S.acts, calm = z => S.zones[z].state === 'calm';
  const add = (pos, r, label, go) => A.push({ pos: pos, r: r, label: label, go: go });
  add(S.coenus, 3, () => 'Speak to Coenus', talkCoenus);
  add(S.trader, 3.2, () => F.robe ? null : 'Speak to the caravan trader', talkTrader);
  for (const g of S.doormen) {
    if (g.door === 'gate') add(g, 3.2, () => g.alive && g.mode === 'post' && !F.gatePass && !F.robe ? 'Speak to the gate guard' : null, talkGate);
    else add(g, 3.4, () => g.alive && g.mode === 'post' && !F.gateOpen ? 'Speak to the citadel guard' : null, talkDoor);
  }
  add([-10.5, 79.2], 2.8, () => calm('town') ? (F.jar ? 'Give the potter his jar' : 'Speak to the potter') : null, talkPotter);
  add([10.5, 79.2], 2.8, () => calm('town') ? 'Speak to the baker' : null, talkBaker);
  add([-10.5, 66.3], 2.8, () => calm('town') ? 'Speak to the carpet seller' : null, talkCarpets);
  add([10.5, 66.3], 2.8, () => calm('town') ? 'Speak to the fruit seller' : null, talkFruit);
  add([27.5, 76], 2.4, () => F.jarAsked && !F.jar && !F.jarGiven ? 'Take the blue jar' : null, takeJar);
  if (S.chief) add(S.chief, 3.4, () => !F.chief && !S.chief.hidden ? 'Speak to the Massagetae chief' : null, talkChief);
  add([25.3, 118.2], 2.3, () => F.grate ? null : 'Look at the grate', lookGrate);
  for (const g of S.body) add(g, 3.4, () => g.alive && g.mode === 'post' && (F.token || F.courtPass) && calm('hall') ? (F.token ? 'Show the Massagetae arrow' : 'Speak to the bodyguard') : null, talkBody);
  add(S.boss, 2.1, () => canSeize() ? 'Seize Spitamenes' : null, seize);
  S_STASH.forEach((q, i) => add(q, 2, () => F.stash[i] ? null : 'Search the pot', () => takeStash(i)));
}
/* ---------- where he is and what he should do next ---------- */
function sogPlace(x, z) {
  if (x > -22 && x < 22 && z > 98 && z < 138) return x > -12 && x < 12 && z > 124 ? 'hall' : 'court';
  if (x > -34 && x < 34 && z > 50 && z < 96) return Math.abs(x) < 15 && z > 62 && z < 84 ? 'bazaar' : 'town';
  if (x > 44 && x < 74 && z > 62 && z < 94) return 'riders';
  if (z < 10 && Math.abs(x) < 16) return 'camp';
  if (Math.abs(x) < 20 && z < 48) return 'road';
  return 'wild';
}
const S_SUB = { town: 'Keep out of the guards’ sight', bazaar: 'The potter’s stall is under the blue jars', riders: 'Horsemen who ride for Spitamenes, for now', court: 'Spitamenes is in the hall to the north', hall: 'Come at him from behind' };
function sogTask() {
  const F = sog.flags;
  if (!F.briefed) return { n: 1, text: 'Report to Coenus', at: [0, 2.5], extra: '' };
  if (!F.inTown) return { n: 2, text: F.robe || F.gatePass ? 'Walk in through the town gate' : 'Find a way into Gabae', at: [0, 44.6], extra: F.robe || F.gatePass ? '' : 'A gate, a disguise, or the broken wall on the west side' };
  if (!F.channel && !F.password) {
    if (F.jar) return { n: 3, text: 'Take the blue jar back to the potter', at: [-10.5, 78.6], extra: '' };
    if (F.jarAsked) return { n: 3, text: 'Fetch the potter’s blue jar', at: [27.5, 76], extra: 'It is on the guards’ table by the east gate' };
    return { n: 3, text: 'Find the potter in the bazaar', at: [-10.5, 78.6], extra: 'His stall is under the blue jars' };
  }
  const opt = F.campKnown && !F.chief ? 'You could also visit the Massagetae camp, outside the east gate' : '';
  if (!F.inCitadel) {
    if (F.gateOpen) return { n: 4, text: 'Go into the citadel', at: [0, 100], extra: opt };
    if (F.password) return { n: 4, text: 'Give the password at the citadel gate', at: [0, 93.2], extra: opt || 'The password is OXUS' };
    return { n: 4, text: F.grate ? 'Crawl through the water channel' : 'Lift the grate on the water channel', at: [25.4, 118.2], extra: opt || 'East of the citadel, outside the walls' };
  }
  if (F.token) return { n: 5, text: 'Show the arrow to the bodyguards at the hall', at: [0, 120.6], extra: '' };
  return { n: 5, text: 'Capture Spitamenes', at: [0, 131.6], extra: 'The hall has a side door on its east side' };
}

/* ---------- the rules the fighting engine calls ---------- */
const sogRules = {
  clamp(u) {
    const B = battle, S = sog;
    u.x = clamp(u.x, -57.5, 77.5); u.z = clamp(u.z, -8.5, 144.5);
    if (u !== B.player || B.over || !u.alive) return;
    const F = S.flags, atS = Math.abs(u.x) < 3 && u.z > 47.2 && u.z < 50.6, atE = u.x > 33.5 && u.x < 36.7 && u.z > 75 && u.z < 81;
    if ((atS || atE) && !F.gatePass) {
      const z = atS ? 'gate' : 'egate'; let any = false; for (const g of S.guards) if (g.alive && g.zone === z) { any = true; break; }
      if (F.robe) { F.gatePass = true; F.gate = F.gate || 'robe'; tell('The guards take you for a trader and wave you through.', 4); }
      else if (any && S.zones[z].state === 'calm') {
        /* the gatekeepers bar the way; they only give chase if he strikes them */
        if (atS) u.z = u.z < 48.9 ? 47.2 : 50.6; else u.x = u.x < 35.1 ? 33.5 : 36.7;
        tell('The gate guards bar your way. Speak to them, or find another way in.', 3.5);
      }
    }
    if (Math.abs(u.x) < 2.5 && u.z > 121.5 && u.z < 125.2 && S.zones.hall.state === 'calm') {
      for (const g of S.body) if (g.alive) { u.z = u.z < 123.4 ? 121.5 : 125.2; tell('The bodyguards bar the door. There must be another way in.', 3.5); break; }
    }
  },
  flee() {},
  wake(u) { if (u.hp > 0 && u.zone) alarm(u.zone, 'struck'); },
  /* the way round walls towards the player, from a map of steps that is redrawn while guards are chasing him */
  steer(u, tx, tz) {
    const B = battle, S = sog, w = u.wp || (u.wp = [0, 0]);
    if (u.wpT > B.t) return w;
    u.wpT = B.t + .16; w[0] = tx; w[1] = tz;
    if (lineFree(u.x, u.z, tx, tz)) return w;
    const f = S.field; let c = cellFree(u.x, u.z); if (c < 0 || f[c] < 0) return w;
    for (let k = 0; k < 7; k++) {
      const n = downhill(c, f); if (n < 0) break; c = n;
      const cx = GX0 + (c % GNX) + .5, cz = GZ0 + ((c / GNX) | 0) + .5;
      if (k > 0 && !lineFree(u.x, u.z, cx, cz)) break;
      w[0] = cx; w[1] = cz;
    }
    return w;
  },
  duck(p) { return sog.grateRect.duck && p.x > 21.7 && p.x < 24.3 && p.z > 116.8 && p.z < 119.6; },
  /* a guard who has not noticed him goes down to one blow from behind */
  strike(a, t, dmg) {
    if (t.mode === undefined || t.mode === 'alert' || t.boss || t.sus > .6) return dmg;
    if (Math.abs(angDiff(Math.atan2(a.x - t.x, a.z - t.z), t.yaw)) < 1.75) return dmg;
    sog.flags.takedowns++; burst(t.x, t.gy + 1.4, t.z, 8, 0xffffff, 3.2, .4, .1);
    return S_TUNE.backstab;
  },
  after(dt) {
    const B = battle, S = sog, p = B.player, F = S.flags;
    stepSogCivs(dt);
    if (B.over) return;
    if (!p.alive) { endBattle('fallen'); return; }
    S.inHay = false; for (const h of S.hay) if (hyp(p.x - h[0], p.z - h[1]) < 1.25) { S.inHay = true; break; }
    S.visT -= dt;
    if (S.visT <= 0) {
      S.visT = .1; let any = false;
      for (const g of S.guards) { if (!g.alive) continue; g.sees = looks(g, p); if (g.sees && g.mode === 'alert') any = true; }
      if (any) { S.seenT = B.t; S.lkx = p.x; S.lkz = p.z; }
    }
    let chase = false;
    for (const g of S.guards) { if (g.alive) { stepGuard(g, dt); if (g.mode === 'alert') chase = true; } else if (!g.told) { g.told = true; witness(g); } }
    stepZones();
    if (chase) { S.fieldT -= dt; if (S.fieldT <= 0) { S.fieldT = .3; fieldFrom(p.x, p.z, S.field); } }
    /* progress */
    const place = sogPlace(p.x, p.z);
    if (place !== S.place) {
      S.place = place;
      if (!S.seen[place] && S_SUB[place] && !B.sim) { S.seen[place] = true; setCaption(S_PLACE[place], S_SUB[place], 'low'); S.bannerT = 3.4; }
    }
    if (!F.inTown && (place === 'town' || place === 'bazaar')) {
      F.inTown = true; if (!F.gate) F.gate = p.x < -29 && p.z > 62 && p.z < 74 ? 'wall' : 'force';
      setCp(p.x, p.z, p.yaw); if (!B.sim) sfx.chime();
    }
    if (!F.inCitadel && (place === 'court' || place === 'hall')) {
      F.inCitadel = true; F.way = F.courtPass ? 'password' : p.x > 12 ? 'channel' : 'force';
      setCp(p.x, p.z, p.yaw); if (!B.sim) sfx.chime();
    }
    if (!S.seen.cone) for (const g of S.guards) if (g.alive && g.mode === 'post' && g.seeR > 4 && g.seeD < 17 && !ignores(g)) {
      S.seen.cone = true; tell('The blue patch on the ground is what a guard can see. Keep out of it, or creep past behind him.', 7); break;
    }
    if (!F.gateOpen) { let any = false; for (const g of S.doormen) if (g.door === 'cit' && g.alive) { any = true; break; } if (!any) { openGate('force'); tell('The citadel gate stands open.', 3); } }
    if (!S.boss.alive) { F.end = F.end || 'fight'; endBattle('victory'); return; }
    stepActs();
  },
  end(result) {
    const S = sog;
    S.beacon.visible = false; battle.act = null; $('prompt').hidden = true;
    if (result === 'victory') {
      for (const g of S.guards) if (g.alive) { g.hold = true; g.mode = 'done'; g.target = null; g.sus = 0; g.npc = true; g.blockT = 0; g.attackT = -1; }
      for (const k in S.zones) S.zones[k].state = 'calm';
      setCaption('Spitamenes yields', S.flags.end === 'fight' ? 'Beaten, he throws down his sword' : 'The hunt is over', 'low'); S.bannerT = 9; sfx.win();
    } else { S.deaths++; sfx.lose(); }
  },
  hud(force) {
    const B = battle, S = sog, p = B.player; if (!p) return;
    const hp = Math.ceil(p.hp / p.maxHp * 10), K = sogTask();
    let st = 0, m = 0;
    for (const k in S.zones) { const s = S.zones[k].state; if (s === 'alarm') st = 2; else if (s === 'search' && st < 1) { st = 1; m = 1; } }
    if (st < 2) for (const g of S.guards) if (g.alive && g.mode !== 'alert' && g.sus > m) m = g.sus;
    if (st === 0 && m > .06) st = 1; if (st === 2) m = 1;
    const key = S.place + '|' + K.n + K.text + K.extra + '|' + hp + '|' + p.kills + '|' + st + '|' + Math.round(m * 25) + '|' + S.inHay;
    if (!force && key === S.hudKey) return; S.hudKey = key;
    $('sPlace').textContent = S_PLACE[S.place] || S_PLACE.wild; $('sNum').textContent = K.n + '/5'; $('sGoal').textContent = K.text;
    $('sExtra').hidden = !K.extra; $('sExtra').textContent = K.extra;
    $('sWatch').setAttribute('data-s', st); $('sAlert').textContent = st === 2 ? 'Alarm!' : st === 1 ? 'Careful' : S.inHay ? 'Hidden' : 'All quiet'; $('sMeter').style.width = Math.round(m * 100) + '%';
    hudPlayer(hp, p.kills);
    S.beacon.visible = !B.over; S.beacon.position.set(K.at[0], 9, K.at[1]);
  }
};

/* ---------- per-frame dressing: fires, the beacon, marks over heads and the guards' fields of view ---------- */
function stepSogFx(dt, time) {
  const S = sog, B = battle, F = S.flameAt, p = B.player;
  for (let i = 0; i < F.length; i++) {
    const f = F[i], h = 1 + .35 * Math.sin(time * 11 + i * 1.7) + .2 * Math.sin(time * 17.3 + i * 2.9);
    _m.makeScale(f[3], f[3] * h, f[3]); _m.setPosition(f[0], f[1] + f[3] * h / 2, f[2]); S.flames.setMatrixAt(i * 2, _m);
    _m.makeScale(f[3] * .55, f[3] * h * 1.25, f[3] * .55); _m.setPosition(f[0], f[1] + f[3] * h * .625, f[2]); S.flames.setMatrixAt(i * 2 + 1, _m);
  }
  S.flames.instanceMatrix.needsUpdate = true;
  if (S.beacon.visible) { S.beacon.material.opacity = .2 + .1 * Math.sin(time * 4); S.beacon.rotation.y = time; }
  const M = S.markMesh, Cn = S.coneMesh, ma = M.instanceColor.array, ca = Cn.instanceColor.array; let n = 0, c = 0;
  if (mode === 'sogdiana' && p && (B.phase === 'fight' || B.phase === 'talk')) {
    const put = (x, y, z, sx, sy, sz, ry, hex) => {
      if (n >= 96) return;
      _e.set(0, ry, 0, 'YXZ'); _q.setFromEuler(_e); _v.set(x, y, z); _s.set(sx, sy, sz); _m.compose(_v, _q, _s); M.setMatrixAt(n, _m);
      _col.setHex(hex); ma[n * 3] = _col.r; ma[n * 3 + 1] = _col.g; ma[n * 3 + 2] = _col.b; n++;
    };
    for (const g of S.guards) {
      if (!g.alive || hyp(g.x - p.x, g.z - p.z) > 46) continue;
      const top = g.y + 2.8 * g.scale;
      if (g.mode === 'alert') { put(g.x, top + .46, g.z, .17, .5, .17, 0, 0xff3d2a); put(g.x, top, g.z, .17, .17, .17, 0, 0xff3d2a); }
      else if (g.mode === 'search') put(g.x, top + .2, g.z, .34, .34, .34, time * 3, 0xff9a2a);
      else if (g.sus > .04) put(g.x, top + .2, g.z, .14 + .22 * g.sus, .14 + .22 * g.sus, .14 + .22 * g.sus, time * 3, 0xffd21c);
      if (g.mode !== 'alert' && g.mode !== 'done' && !B.over && c < 32 && !ignores(g)) {
        const R = Math.max(1.2, g.seeR || S_TUNE.see);
        _e.set(0, g.yaw, 0, 'YXZ'); _q.setFromEuler(_e); _v.set(g.x, g.gy + .09 + c * .003, g.z); _s.set(R, 1, R); _m.compose(_v, _q, _s); Cn.setMatrixAt(c, _m);
        _col.setHex(g.mode === 'search' ? 0xff8a1c : g.sus > .04 ? 0xffd21c : 0x3fc4ff); ca[c * 3] = _col.r; ca[c * 3 + 1] = _col.g; ca[c * 3 + 2] = _col.b; c++;
      }
    }
    /* a turning white block over anyone he can talk to and anything he can use */
    if (!B.over) for (const a of S.acts) {
      const q = a.pos, unit = q.x !== undefined, x = unit ? q.x : q[0], z = unit ? q.z : q[1];
      if (hyp(x - p.x, z - p.z) > 34 || !a.label()) continue;
      put(x, (unit ? 2.95 * (q.scale || 1) : 2.2) + Math.sin(time * 3 + x) * .1, z, .3, .3, .3, time * 2, 0xffffff);
    }
  }
  M.count = n; M.instanceMatrix.needsUpdate = true; M.instanceColor.needsUpdate = true;
  Cn.count = c; Cn.instanceMatrix.needsUpdate = true; Cn.instanceColor.needsUpdate = true;
}

/* ---------- the opening ---------- */
function stepSogIntro(dt) {
  const B = battle, S = sog, p = B.player;
  S.introT += dt; const t = S.introT;
  if (t >= 4.4) { beginSogdiana(); return; }
  const k0 = clamp(t / 4.4, 0, 1), k = k0 * k0 * (3 - 2 * k0);
  camera.position.set(lerp(-40, p.x, k), lerp(34, 1.75 + Math.sin(.55) * cam.dist, k), lerp(22, p.z - Math.cos(.55) * cam.dist, k));
  camera.lookAt(lerp(0, p.x, k), lerp(4, 1.9, k), lerp(96, p.z + .9, k));
  for (const u of B.units) if (u.alive) { u.vx = u.vz = 0; animate(u, dt, t); }
  for (const c of S.civ.units) if (!c.hidden) animate(c, dt, t);
}
function beginSogdiana() {
  const B = battle, S = sog; if (B.phase === 'fight') return;
  B.phase = 'fight';
  $('hud').hidden = false; $('tallyH').hidden = true; $('tallyC').hidden = true; $('tallyS').hidden = false; $('btnPause').hidden = false; refreshTouchUi();
  showHint(); followCam(0, true);
  if (S.fresh) { setCaption('The scout camp', 'Report to Coenus', 'low'); S.bannerT = 3.4; S.seen.camp = true; } else setCaption('', '');
  S.place = sogPlace(B.player.x, B.player.z);
  sogRules.hud(true);
}
function sogKit() {
  const F = sog.flags, k = [['knife', 'Knife']];
  if (F.robe) k.push(['robe', 'Trader’s robe']);
  if (F.jar) k.push(['jar', 'The potter’s jar']);
  if (F.token) k.push(['arrow', 'Massagetae arrow']);
  return k;
}

/* ---- Sogdiana ---- */
async function toSogdiana(fresh) {
  hideUi();
  if (fresh) interlude('Sogdiana', 'The year 328 before Christ'); else interlude('Gabae', 'Try again from where you got to');
  sogPopulate(fresh); mode = 'sogdiana'; scene = sog.scene; camera.fov = 55; camera.updateProjectionMatrix();
  await wait(fresh ? 1700 : 1000);
  if (fresh) { sog.introT = 0; battle.phase = 'intro'; setCaption('Gabae', 'The hunt for Spitamenes'); } else beginSogdiana();
  await fade(0, 1000);
  $('interlude').hidden = true;
  busy = false;
}
async function sogAgain(fresh) {
  if (busy) return; busy = true; sfx.ui(); lock(); $('card').hidden = true;
  await fade(1, 700); await toSogdiana(fresh);
}
function sogEndCard() {
  const B = battle;
    const S = sog, F = S.flags, other = ['Other battles', 'no', toSelect];
    setCaption('', '');
    if (B.result === 'victory') {
      const L = [
        'Into Gabae: ' + ({ robe: 'dressed as a trader', bribe: 'with silver for the gate guard', wall: 'over the broken wall', force: 'past the gate guards by force' }[F.gate] || 'unseen'),
        'The potter: ' + ({ paid: 'paid for his secrets', favour: 'helped, for the price of a jar', threat: 'threatened, and he called the guards' }[F.potter] || 'never asked'),
        'The Massagetae: ' + ({ paid: 'paid to ride away', talked: 'talked into standing aside', angry: 'made into enemies' }[F.chief] || 'left alone'),
        'Into the citadel: ' + ({ password: 'through the gate, with the password', channel: 'through the water channel', force: 'through the gate, by force' }[F.way] || 'somehow'),
        'Spitamenes: ' + ({ token: 'gave himself up when he saw the arrow', seize: 'seized from behind without a sound', fight: 'beaten in a fight, knife against sword' }[F.end] || 'taken')];
      showCard('Sogdiana, 328 BC', 'Spitamenes is taken',
        '<p>The rebel is your prisoner, and the war in Sogdiana is over.</p><ul class="deeds">' + L.map(s => '<li>' + s + '</li>').join('') + '</ul>' +
        '<p class="titulus">Alarms raised: ' + F.alarms + ' &middot; Times caught: ' + S.deaths + '</p>' +
        '<p class="note">What really happened: that winter the Massagetae turned on Spitamenes themselves, and the war ended. His daughter Apama later became a queen.</p>',
        [['Play again', 'yes', () => sogAgain(true)], other]);
    } else showCard('Sogdiana, 328 BC', 'Caught!', '<p>The guards have you. But a Companion does not give up. Slip away, and try again from where you last got to.</p><p class="titulus">Everything you have bought and learnt is still yours</p>',
      [['Try again', 'yes', () => sogAgain(false)], other]);
}

defineLevel({
  id: 'sogdiana', order: -328, year: '328 BC', title: 'Sogdiana', blurb: 'Slip into the fort of Gabae and capture the rebel Spitamenes', colour: '#1f6f73',
  world: sog, build: buildSogdiana, tally: 'tallyS', blockLabel: 'Sneak',
  money: ['drachma', 'drachmas'], kit: sogKit, kitTitle: 'What you carry', packTip: 'Silver buys disguises, secrets and bread. Search old pots for more.',
  hint: touch => touch ? 'Left pad moves &middot; drag the screen to look &middot; hold <kbd>Sneak</kbd> to creep &middot; tap the prompt to talk'
    : '<kbd>W A S D</kbd> move &middot; <kbd>Shift</kbd> sneak &middot; <kbd>E</kbd> talk &middot; <kbd>Click</kbd> knife &middot; <kbd>Space</kbd> jump &middot; <kbd>1</kbd> bread',
  enter: () => toSogdiana(true), resume: () => toSogdiana(true), endCard: sogEndCard, endDelay: r => r === 'victory' ? 3.2 : 1.9,
  skip() { if (battle.phase === 'intro' && sog.introT > .7) beginSogdiana(); },
  frame: {
    wait(dt, clock) { for (const c of sog.civ.units) if (!c.hidden) animate(c, dt, clock); if (sog.fresh) { camera.position.set(-40, 34, 22); camera.lookAt(0, 4, 96); } else followCam(dt, true); },
    intro: stepSogIntro,
    idle(dt, clock) { for (const c of sog.civ.units) if (!c.hidden) { c.vx = c.vz = 0; animate(c, dt, clock); } },
    fx(dt, clock) { stepSogFx(dt, clock); if (sog.bannerT > 0) { sog.bannerT -= dt; if (sog.bannerT <= 0 && $('caption').className === 'low') setCaption('', ''); } },
    write() { sog.civ.write(); }
  }
});
