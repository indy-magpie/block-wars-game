/* ================= flow ================= */
let mode = 'select', scene = null, busy = false, paused = false, typeTimer = 0;
const inCombat = () => !SCREENS[mode];      /* a mode that is not a screen is a level being played */
function typeLine(text, done, into) {
  clearInterval(typeTimer); const el = into || $('line');
  if (reduceMotion) { el.textContent = text; if (done) done(); return; }
  const t0 = performance.now(); el.textContent = '';
  typeTimer = setInterval(() => { const i = Math.min(text.length, Math.ceil((performance.now() - t0) / 22)); el.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(typeTimer); if (done) done(); } }, 22);
}
function fade(to, ms) { const f = $('fade'); f.style.transitionDuration = ms + 'ms'; void f.offsetWidth; f.style.opacity = to; return wait(ms + 30); }
function lock() { if (touchMode || !canvas.requestPointerLock) return; try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
function refreshTouchUi() { $('touch').hidden = !(touchMode && inCombat() && battle.phase === 'fight' && !battle.over); $('tBlock').textContent = (LEVELS[battle.level] || {}).blockLabel || 'Block'; }
document.addEventListener('pointerdown', e => { const t = e.pointerType === 'touch'; if (t !== touchMode) { touchMode = t; refreshTouchUi(); } }, true);
function unlock() { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {} }
function showCard(kicker, title, html, buttons, focusFirst) {
  $('cardKicker').textContent = kicker || ''; $('cardTitle').textContent = title; $('cardBody').innerHTML = html; $('card').classList.toggle('long', html.indexOf('class="deeds"') >= 0);
  const c = $('cardChoices'); c.innerHTML = '';
  buttons.forEach((b, i) => { const el = document.createElement('button'); el.type = 'button'; el.className = 'choice ' + b[1]; el.id = 'cardBtn' + i; el.textContent = b[0]; el.addEventListener('click', b[2]); c.appendChild(el); });
  $('card').hidden = false; unlock();
  if (focusFirst) { const f = c.querySelector('button'); if (f) f.focus(); }
}
function hideUi() {
  for (const id of ['place', 'dialogue', 'hud', 'touch', 'btnPause', 'btnLevels', 'card', 'select', 'talk', 'prompt', 'tallyL']) $(id).hidden = true;
  setCaption('', ''); $('toast').style.opacity = 0; toastOn = false; $('hint').style.opacity = 0; packOpen = false;
}
function interlude(title, sub) { $('interTitle').textContent = title; $('interSub').textContent = sub; $('interlude').hidden = false; }

/* ---- choosing a battle ---- */
function enterSelect() {
  ensureBuilt(LEVELS.carthage);      /* the harbour of Carthage is the backdrop */
  mode = 'select'; scene = carth.scene; battle.phase = 'idle'; paused = false; hideUi();
  stage.setAttribute('data-level', 'select'); $('select').hidden = false;
  carth.army.reset(); carth.civ.reset(); carth.arrows.length = 0; fx.list.length = 0; drops.length = 0; carth.dropMesh.count = 0; hudPack(); Save.flush();
  carth.hpBg.count = 0; carth.hpFill.count = 0; carth.fxMesh.count = 0; carth.arrowMesh.count = 0; carth.markMesh.count = 0; carth.gateDoor.visible = true; setBeacon(null);
  camera.fov = 55; camera.updateProjectionMatrix();
}
defineScreen({ id: 'select', frame(dt, clock) {
  const a = reduceMotion ? 0 : clock;
  stepCarthFx(dt, clock);
  camera.position.set(-36 + Math.sin(a * .11) * 7, 31, 186 + Math.cos(a * .09) * 9); camera.lookAt(8, 3, 300);
} });
async function toSelect() {
  if (busy && mode === 'select') return;
  busy = true; sfx.ui(); $('card').hidden = true; paused = false;
  await fade(1, 700); enterSelect(); await fade(0, 900); busy = false;
}
async function chooseLevel(which) {
  const lv = LEVELS[which]; if (busy || !lv) return; busy = true; Snd.init(); sfx.ui();
  if (lv.lock !== false) lock();
  await fade(1, 700); ensureBuilt(lv);
  await lv.enter();
}

/* ---- the end of a level: the level shows its own card ---- */
function showEndCard() {
  Save.flush();
  $('touch').hidden = true; $('btnPause').hidden = true; $('hint').style.opacity = 0;
  LEVELS[battle.level].endCard();
}
function setPaused(v) {
  if (packOpen) { closePack(); return; }
  if (!inCombat() || battle.phase !== 'fight' || battle.over) return;
  paused = v;
  if (v) showCard('', 'Paused', '<p>The battle waits for you.</p>', [['Resume', 'yes', () => { $('card').hidden = true; setPaused(false); lock(); }]], true);
  else $('card').hidden = true;
}
