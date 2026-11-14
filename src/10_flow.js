/* ================= flow ================= */
let mode = 'select', scene = null, busy = false, paused = false, typeTimer = 0;
const inCombat = () => mode === 'battle' || mode === 'carthage';
const QUESTION = 'Will you fight for Harold and save England?';
function typeLine(text, done) {
  clearInterval(typeTimer); const el = $('line');
  if (reduceMotion) { el.textContent = text; if (done) done(); return; }
  const t0 = performance.now(); el.textContent = '';
  typeTimer = setInterval(() => { const i = Math.min(text.length, Math.ceil((performance.now() - t0) / 22)); el.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(typeTimer); if (done) done(); } }, 22);
}
function setChoices(on) { $('btnYes').disabled = !on; $('btnNo').disabled = !on; }
function fade(to, ms) { const f = $('fade'); f.style.transitionDuration = ms + 'ms'; void f.offsetWidth; f.style.opacity = to; return wait(ms + 30); }
function lock() { if (touchMode || !canvas.requestPointerLock) return; try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
function refreshTouchUi() { $('touch').hidden = !(touchMode && inCombat() && battle.phase === 'fight' && !battle.over); }
document.addEventListener('pointerdown', e => { const t = e.pointerType === 'touch'; if (t !== touchMode) { touchMode = t; refreshTouchUi(); } }, true);
function unlock() { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {} }
function showCard(kicker, title, html, buttons, focusFirst) {
  $('cardKicker').textContent = kicker || ''; $('cardTitle').textContent = title; $('cardBody').innerHTML = html;
  const c = $('cardChoices'); c.innerHTML = '';
  buttons.forEach((b, i) => { const el = document.createElement('button'); el.type = 'button'; el.className = 'choice ' + b[1]; el.id = 'cardBtn' + i; el.textContent = b[0]; el.addEventListener('click', b[2]); c.appendChild(el); });
  $('card').hidden = false; unlock();
  if (focusFirst) { const f = c.querySelector('button'); if (f) f.focus(); }
}
function hideUi() {
  for (const id of ['place', 'dialogue', 'hud', 'touch', 'btnPause', 'btnLevels', 'card', 'select']) $(id).hidden = true;
  setCaption('', ''); $('toast').style.opacity = 0; toastOn = false; $('hint').style.opacity = 0; packOpen = false;
}
function interlude(title, sub) { $('interTitle').textContent = title; $('interSub').textContent = sub; $('interlude').hidden = false; }

/* ---- choosing a battle ---- */
function enterSelect() {
  mode = 'select'; scene = carth.scene; battle.phase = 'idle'; paused = false; hideUi();
  stage.setAttribute('data-level', 'select'); $('select').hidden = false;
  carth.army.reset(); carth.civ.reset(); carth.arrows.length = 0; fx.list.length = 0; drops.length = 0; carth.dropMesh.count = 0; hudPack(); Save.flush();
  carth.hpBg.count = 0; carth.hpFill.count = 0; carth.fxMesh.count = 0; carth.arrowMesh.count = 0; carth.markMesh.count = 0; carth.gateDoor.visible = true; setBeacon(null);
  camera.fov = 55; camera.updateProjectionMatrix();
}
async function toSelect() {
  if (busy && mode === 'select') return;
  busy = true; sfx.ui(); $('card').hidden = true; paused = false;
  await fade(1, 700); enterSelect(); await fade(0, 900); busy = false;
}
async function chooseLevel(which) {
  if (busy) return; busy = true; Snd.init(); sfx.ui();
  if (which === 'carthage') lock();
  await fade(1, 700);
  if (which === 'hastings') { enterMenu(false); await fade(0, 900); busy = false; }
  else { carth.deaths = 0; carth.warned = false; await toCarthage(0); }
}

/* ---- Hastings ---- */
function enterMenu(first) {
  mode = 'menu'; scene = menu.scene; battle.phase = 'idle'; hideUi();
  stage.setAttribute('data-level', 'hastings');
  $('place').hidden = false; $('dialogue').hidden = false; $('btnLevels').hidden = false;
  camera.fov = 50; camera.updateProjectionMatrix(); setChoices(true);
  if (first) { clearInterval(typeTimer); $('line').textContent = QUESTION; } else typeLine(QUESTION);
}
async function toBattle() {
  hideUi(); interlude('Hastings', '14 October 1066');
  spawnArmies(); mode = 'battle'; scene = battle.scene; camera.fov = 55; camera.updateProjectionMatrix();
  await wait(1700);
  battle.phase = 'intro';
  await fade(0, 1100);
  $('interlude').hidden = true;
  busy = false;
}
async function onYes() {
  if (busy) return; busy = true; Snd.init(); sfx.ui(); lock(); setChoices(false);
  await fade(1, 900); await toBattle();
}
async function onNo() {
  if (busy) return; busy = true; Snd.init(); sfx.ui(); setChoices(false);
  await new Promise(r => typeLine('Then may God defend England.', r));
  await wait(1300); await fade(1, 900);
  $('place').hidden = true; $('dialogue').hidden = true; $('btnLevels').hidden = true;
  showCard('14 October 1066', 'England stands alone',
    '<p>Without you, the shield wall broke at Hastings. Harold fell, and William of Normandy was crowned King of England on Christmas Day.</p>',
    [['Return to Winchester', 'yes', backToMenu]], true);
}
async function backToMenu() {
  sfx.ui(); $('card').hidden = true;
  if (mode === 'battle') { busy = true; await fade(1, 700); }
  enterMenu(); await fade(0, 900); busy = false;
}
async function fightAgain() {
  if (busy) return; busy = true; sfx.ui(); lock(); $('card').hidden = true;
  await fade(1, 700); await toBattle();
}

/* ---- Carthage ---- */
async function toCarthage(i, wave) {
  hideUi();
  if (i === 0) interlude('Carthage', 'The year 146 before Christ'); else interlude(STAGES[i].name, 'Checkpoint ' + NUMW[i] + ' of seven');
  populate(i, wave); mode = 'carthage'; scene = carth.scene; camera.fov = 55; camera.updateProjectionMatrix();
  await wait(i === 0 ? 1700 : 1000);
  if (i === 0) { carth.introT = 0; battle.phase = 'intro'; setCaption('Carthage', 'The last days of the siege'); } else beginCarthage();
  await fade(0, 1000);
  $('interlude').hidden = true;
  busy = false;
}
async function carthAgain(i, wave) {
  if (busy) return; busy = true; sfx.ui(); lock(); $('card').hidden = true;
  if (i === 0) { carth.deaths = 0; carth.warned = false; }
  await fade(1, 700); await toCarthage(i, wave);
}

function showEndCard() {
  const B = battle, k = B.player.kills;
  Save.flush();
  $('touch').hidden = true; $('btnPause').hidden = true; $('hint').style.opacity = 0;
  if (B.level === 'carthage') {
    const C = carth, i = C.si, wv = C.wave, other = ['Other battles', 'no', toSelect];
    if (B.result === 'victory') showCard('The Third Punic War', 'Carthage has fallen',
      '<p>Hasdrubal lays down his sword and the city belongs to Rome. Scipio will be given the name Africanus. It is said that he wept as he watched Carthage burn.</p><p class="titulus">Foes you felled: ' + k + ' &middot; Times you fell: ' + C.deaths + '</p>',
      [['Play again', 'yes', () => carthAgain(0)], other]);
    else showCard('Checkpoint ' + NUMW[i] + ' of seven', 'You have fallen',
      '<p>The legion holds its ground without you. Rejoin it at ' + STAGES[i].name.toLowerCase() + '.</p><p class="titulus">Foes you felled: ' + k + '</p>',
      [['Try again', 'yes', () => carthAgain(i, wv)], other]);
    return;
  }
  const tally = '<p class="titulus">Foes you felled: ' + k + '</p>';
  const btns = [['Fight again', 'yes', fightAgain], ['Return to Winchester', 'no', backToMenu]];
  if (B.result === 'victory') showCard('14 October 1066', 'Victory', '<p>William has fallen and the Normans break and run. Harold keeps his crown. England is saved, and history is changed.</p>' + tally, btns);
  else if (B.result === 'harold') showCard('Hic Harold rex interfectus est', 'Harold has fallen', '<p>The shield wall is broken and the King lies dead. William will be crowned on Christmas Day.</p>' + tally, btns);
  else showCard('14 October 1066', 'You have fallen', '<p>You fought bravely on the field of Hastings, but the battle goes on without you.</p>' + tally, btns);
}
function setPaused(v) {
  if (packOpen) { closePack(); return; }
  if (!inCombat() || battle.phase !== 'fight' || battle.over) return;
  paused = v;
  if (v) showCard('', 'Paused', '<p>The battle waits for you.</p>', [['Resume', 'yes', () => { $('card').hidden = true; setPaused(false); lock(); }]], true);
  else $('card').hidden = true;
}
