/* ================= main loop ================= */
let last = performance.now(), clock = 0, slowT = 0, slowN = 0, toastOn = false, toastText = '';
function frame(now) {
  requestAnimationFrame(frame);
  const raw = (now - last) / 1000; last = now;
  const dt = Math.min(.05, Math.max(0, raw));
  clock += dt; Snd.budget = 5;
  if (mode === 'menu') { stepMenu(dt, clock); menu.army.write(); }
  else if (mode === 'select') {
    const a = reduceMotion ? 0 : clock;
    stepCarthFx(dt, clock);
    camera.position.set(-36 + Math.sin(a * .11) * 7, 31, 186 + Math.cos(a * .09) * 9); camera.lookAt(8, 3, 300);
  } else if (inCombat()) {
    const B = battle, C = carth, punic = mode === 'carthage', sogd = mode === 'sogdiana';
    if (!paused) {
      if (B.phase === 'wait') {
        for (const u of B.units) if (u.alive) animate(u, dt, clock);
        if (sogd) { for (const c of sog.civ.units) if (!c.hidden) animate(c, dt, clock); if (sog.fresh) { camera.position.set(-40, 34, 22); camera.lookAt(0, 4, 96); } else followCam(dt, true); }
        else if (!punic) { camera.position.set(-43, 16, -12); camera.lookAt(8, 1, 0); }
        else if (C.si === 0) { camera.position.set(-27, 13, -27); camera.lookAt(3, 1, 8); }
        else followCam(dt, true);
      }
      else if (B.phase === 'intro') { if (sogd) stepSogIntro(dt); else if (punic) stepCarthIntro(dt); else stepIntro(dt); }
      else if (B.phase === 'talk') {      /* the world stands still while he talks */
        for (const u of B.units) if (u.alive) { u.vx = u.vz = 0; animate(u, dt, clock); }
        for (const c of sog.civ.units) if (!c.hidden) { c.vx = c.vz = 0; animate(c, dt, clock); }
        followCam(dt, false);
      }
      else if (B.phase === 'cut') stepCut(dt);
      else if (B.phase === 'fight') {
        stepFight(dt); stepDrops(dt); followCam(dt, false);
        if (B.over && !B.cardShown && B.endT > ((punic || sogd) && B.result === 'victory' ? 3.2 : 1.9)) { B.cardShown = true; showEndCard(); }
        if (B.edgeT > 0) B.edgeT -= dt;
        const show = B.edgeT > .3 && !B.over;
        if (show !== toastOn || (show && B.toast !== toastText)) { toastOn = show; toastText = B.toast; const tt = $('toast'); if (show) tt.textContent = B.toast; tt.style.opacity = show ? 1 : 0; }
        B.hudT -= dt; if (B.hudT <= 0) { B.hudT = .12; B.rules.hud(false); }
      }
      stepFx(dt);
      if (punic) {
        stepCarthFx(dt, clock);
        if (C.bannerT > 0) { C.bannerT -= dt; if (C.bannerT <= 0 && $('caption').className === 'low') setCaption('', ''); }
      }
      if (sogd) {
        stepSogFx(dt, clock);
        if (sog.bannerT > 0) { sog.bannerT -= dt; if (sog.bannerT <= 0 && $('caption').className === 'low') setCaption('', ''); }
      }
      if (B.clouds) { B.clouds.position.x += dt * .7; if (B.clouds.position.x > 60) B.clouds.position.x = -60; }
    }
    B.army.write(); writeHpBars(); writeDrops(clock);
    if (punic) { C.civ.write(); writeArrows(); }
    if (sogd) sog.civ.write();
  }
  if (scene) renderer.render(scene, camera);
  /* drop the resolution on slow machines */
  slowT += raw; slowN++;
  if (slowN >= 90) {
    const avg = slowT / slowN; slowT = 0; slowN = 0;
    if (avg > .034 && pixelRatio > .75) { pixelRatio = pixelRatio > 1 ? 1 : .75; renderer.setPixelRatio(pixelRatio); resize(); }
  }
}

function start(data) {
  buildMenu(); buildBattle(); buildCarthage(); buildSogdiana(); resize();
  Save.loadLocal(); hudPack(); Save.connect();
  const m = data && data.mode;
  if (m === 'battle') { enterMenu(true); busy = true; $('fade').style.opacity = 1; toBattle(); }
  else if (m === 'carthage') { enterSelect(); busy = true; $('fade').style.opacity = 1; toCarthage(clamp(data.stage | 0, 0, 6)); }
  else if (m === 'sogdiana') { enterSelect(); busy = true; $('fade').style.opacity = 1; toSogdiana(true); }
  else if (m === 'menu') enterMenu(true);
  else enterSelect();
  requestAnimationFrame(frame);
}
/* test and tuning hooks */
window.__hastings = {
  info: () => ({ tris: renderer.info.render.triangles, calls: renderer.info.render.calls }),
  save: Save, inv: Inv, drops: drops,
  keys: keys, input: input, battle: battle, carth: carth, sog: sog, stune: S_TUNE, act: () => doAct(), pick: i => pickTalk(i), alarm: z => alarm(z), pathTo: pathTo, looks: looks, begin: fresh => { sogPopulate(fresh); mode = 'sogdiana'; scene = sog.scene; beginSogdiana(); }, tune: TUNE, stat: STAT, tiers: C_TIER, ctune: C_TUNE, stages: STAGES, cam: cam, step: stepFight,
  state: () => ({ mode: mode, phase: battle.phase, over: battle.over, result: battle.result, busy: busy, stage: carth.si, done: carth.done }),
  skip() { if (mode === 'sogdiana') { if (battle.phase === 'intro') beginSogdiana(); } else if (mode === 'carthage') { if (battle.phase === 'intro') beginCarthage(); else if (battle.phase === 'cut') finishCut(); } else beginCharge(); },
  warp(i, w) { populate(i, w); beginCarthage(); },
  simulate(n, how) {
    const out = [];
    for (let k = 0; k < n; k++) {
      spawnArmies(); const B = battle; B.sim = true; B.autopilot = how !== 'absent'; B.phase = 'fight'; B.simCool = how === 'novice' ? .7 : 0; if (how === 'masher' || how === 'novice') B.player.blockChance = 0;
      if (how === 'absent') { B.player.x = -45; B.player.z = -45; B.player.untargetable = true; }
      let t = 0; while (!B.over && t < 900) { stepFight(1 / 30); t += 1 / 30; }
      out.push({ result: B.result, secs: Math.round(t), sax: B.sax.filter(u => u.alive).length, nor: B.nor.filter(u => u.alive).length, kills: B.player.kills, hp: Math.round(B.player.hp) });
    }
    battle.sim = false; battle.autopilot = false; battle.simCool = 0; return out;
  },
  /* run the whole of Carthage with a simulated player; a fall restarts at the checkpoint, as in play */
  simCarthage(n, how) {
    const out = [], B = battle, C = carth;
    for (let k = 0; k < n; k++) {
      B.sim = true; B.autopilot = true; B.simCool = how === 'novice' ? .7 : 0;
      const falls = [0, 0, 0, 0, 0, 0, 0], secs = [0, 0, 0, 0, 0, 0, 0];
      const begin = (i, w) => { populate(i, w); B.phase = 'fight'; if (how !== 'auto') B.player.blockChance = 0; };
      begin(0);
      let t = 0, guard = 0;
      while (t < 2400) {
        stepFight(1 / 30); t += 1 / 30; secs[C.si] += 1 / 30;
        if (B.over) { if (B.result === 'victory') break; falls[C.si]++; if (++guard > 60) break; begin(C.si, C.wave); }
        if (secs[C.si] > 420 && !this._dump) { const P = B.player; this._dump = { stage: C.si, wave: C.wave, done: C.done, barrier: C.barrier, p: [P.x, P.z, P.hp, P.target ? P.target.kind + '@' + P.target.x.toFixed(1) + ',' + P.target.z.toFixed(1) : null], allies: B.sax.filter(u => u.alive).length - 1, foes: B.nor.filter(u => u.alive && !u.fixed).map(u => [u.kind, +u.x.toFixed(1), +u.z.toFixed(1), u.hold, u.sq, u.attackers, Math.round(u.hp)]) }; }
      }
      out.push({ won: B.result === 'victory', secs: Math.round(t), stage: C.si, falls: falls, per: secs.map(s => Math.round(s)), kills: B.player.kills });
    }
    B.sim = false; B.autopilot = false; B.simCool = 0; return out;
  }
};
const hot = window.claude && window.claude.hot;
if (hot && hot.snapshot) { try { hot.snapshot(() => ({ mode: mode, stage: carth.si })); } catch (e) {} }
if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
