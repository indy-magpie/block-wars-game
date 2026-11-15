/* ================= Hastings: rules, opening and tally ================= */
const hastingsRules = {
  clamp(u) {
    const B = battle; if (u.flee) return;
    if (u === B.player && !B.over && (Math.abs(u.x) > FX || Math.abs(u.z) > FZ)) { B.edgeT = 2.2; B.toast = 'You cannot leave the field until the battle is over.'; }
    u.x = clamp(u.x, -FX, FX); u.z = clamp(u.z, -FZ, FZ);
  },
  flee(u, mv) {
    mv[1] = (u.team === 0 ? -1 : 1) * 5.2; mv[0] = clamp(u.x * .04, -1, 1);
    if (Math.abs(u.z) > FZ + 9) { u.alive = false; u.hidden = true; u.gone = true; }
  },
  wake() {},
  after(dt) {
    const B = battle, us = B.units, p = B.player;
    if (!B.over && !B.lastStand) {
      B.checkT -= dt;
      if (B.checkT <= 0) {
        B.checkT = .5; let ls = 0, ln = 0;
        for (const u of B.sax) if (u.alive && u.kind === 'line' && !u.isPlayer) ls++;
        for (const u of B.nor) if (u.alive && u.kind === 'line') ln++;
        if (ls === 0 || ln === 0) {
          /* one battle line is gone: both bodyguards leave their walls and close in */
          B.lastStand = true;
          for (const u of us) if (u.kind === 'guard') { u.kind = 'line'; u.wall = false; u.speed = 3.9; u.thinkT = rand(0, .4); }
          if (!B.sim) { setCaption('The shield walls advance', ls === 0 ? 'Stand with Harold' : 'Cut your way to William', 'low'); setTimeout(() => { if ($('caption').className === 'low' && battle.phase === 'fight' && battle.level === 'hastings') setCaption('', ''); }, 3200); }
        }
      }
    }
    if (!B.over) {
      if (!B.william.alive) endBattle('victory');
      else if (!B.harold.alive) endBattle('harold');
      else if (!p.alive) endBattle('fallen');
    }
  },
  end(result) {
    const B = battle;
    if (result !== 'fallen') {
      const win = result === 'victory' ? B.sax : B.nor, loss = result === 'victory' ? B.nor : B.sax;
      for (const u of win) if (u.alive) { u.cheer = true; u.target = null; u.blockT = 0; }
      for (const u of loss) if (u.alive && !u.isPlayer) { u.flee = true; u.target = null; u.blockT = 0; }
    }
    if (result === 'victory') sfx.win(); else sfx.lose();
  },
  hud(force) {
    const B = battle, p = B.player; if (!p) return;
    let s = 0, n = 0; for (const u of B.sax) if (u.alive) s++; for (const u of B.nor) if (u.alive) n++;
    const hp = Math.ceil(p.hp / p.maxHp * 10), hh = Math.round(B.harold.hp / B.harold.maxHp * 100), hw = Math.round(B.william.hp / B.william.maxHp * 100);
    const key = s + '|' + n + '|' + hp + '|' + hh + '|' + hw + '|' + p.kills;
    if (!force && key === hudCache) return; hudCache = key;
    $('nSax').textContent = s; $('nNor').textContent = n;
    $('hpHarold').style.width = hh + '%'; $('hpWilliam').style.width = hw + '%';
    hudPlayer(hp, p.kills);
  }
};
let hudCache = '';

function stepIntro(dt) {
  const B = battle, H = B.harold, Wm = B.william;
  B.introT += dt; const t = B.introT;
  const seg = t < 3.2 ? 0 : t < 5.5 ? 1 : t < 7.8 ? 2 : 3;
  if (seg !== B.introSeg) {
    B.introSeg = seg;
    if (seg === 0) setCaption('The field of Hastings', 'Two armies face each other across the grass');
    else if (seg === 1) { setCaption('Harold', 'King of England', 'low'); sfx.horn(147); }
    else if (seg === 2) { setCaption('William', 'Duke of Normandy', 'low'); sfx.horn(196); }
  }
  if (seg === 0) { const k = t / 3.2; camera.position.set(lerp(-43, -37, k), lerp(16, 12.5, k), lerp(-12, 3, k)); camera.lookAt(8, 1, 0); }
  else if (seg === 1) { const k = (t - 3.2) / 2.3; camera.position.set(H.x + 5.2 - k * 1.2, 3.7, H.z + 6.6 - k * .6); camera.lookAt(H.x, 2.0, H.z + .6); if (t > 3.7) H.raise = damp(H.raise, 1, 9, dt); }
  else if (seg === 2) { const k = (t - 5.5) / 2.3; camera.position.set(Wm.x - 5.2 + k * 1.2, 3.7, Wm.z - 6.6 + k * .6); camera.lookAt(Wm.x, 2.0, Wm.z - .6); if (t > 6.0) Wm.raise = damp(Wm.raise, 1, 9, dt); }
  else { beginCharge(); return; }
  for (const u of B.units) { u.vx = u.vz = 0; animate(u, dt, t); }
}
function beginCharge() {
  const B = battle; if (B.phase === 'fight') return;
  B.phase = 'fight'; B.t = 0; B.harold.raise = 1; B.william.raise = 1;
  setCaption('Charge!', '', 'charge'); sfx.roar();
  setTimeout(() => { if (battle.phase === 'fight' && $('caption').className === 'charge') setCaption('', ''); }, 1300);
  $('hud').hidden = false; $('tallyH').hidden = false; $('tallyC').hidden = true; $('tallyS').hidden = true; $('btnPause').hidden = false; refreshTouchUi();
  showHint(); followCam(0, true); B.rules.hud(true);
}

/* ---- Winchester: a screen of its own before the battle, where a soldier asks the question ---- */
const HASTINGS_QUESTION = 'Will you fight for Harold and save England?';
function hastingsChoices(on) { $('btnYes').disabled = !on; $('btnNo').disabled = !on; }
function enterWinchester(first) {
  mode = 'winchester'; scene = winchester.scene; battle.phase = 'idle'; hideUi();
  stage.setAttribute('data-level', 'hastings');
  $('place').hidden = false; $('dialogue').hidden = false; $('btnLevels').hidden = false;
  camera.fov = 50; camera.updateProjectionMatrix(); hastingsChoices(true);
  if (first) { clearInterval(typeTimer); $('line').textContent = HASTINGS_QUESTION; } else typeLine(HASTINGS_QUESTION);
}
async function hastingsToBattle() {
  hideUi(); interlude('Hastings', '14 October 1066');
  spawnArmies(); mode = 'hastings'; scene = battle.scene; camera.fov = 55; camera.updateProjectionMatrix();
  await wait(1700);
  battle.phase = 'intro';
  await fade(0, 1100);
  $('interlude').hidden = true;
  busy = false;
}
async function hastingsYes() {
  if (busy) return; busy = true; Snd.init(); sfx.ui(); lock(); hastingsChoices(false);
  await fade(1, 900); await hastingsToBattle();
}
async function hastingsNo() {
  if (busy) return; busy = true; Snd.init(); sfx.ui(); hastingsChoices(false);
  await new Promise(r => typeLine('Then may God defend England.', r));
  await wait(1300); await fade(1, 900);
  $('place').hidden = true; $('dialogue').hidden = true; $('btnLevels').hidden = true;
  showCard('14 October 1066', 'England stands alone',
    '<p>Without you, the shield wall broke at Hastings. Harold fell, and William of Normandy was crowned King of England on Christmas Day.</p>',
    [['Return to Winchester', 'yes', hastingsBackToWinchester]], true);
}
async function hastingsBackToWinchester() {
  sfx.ui(); $('card').hidden = true;
  if (mode === 'hastings') { busy = true; await fade(1, 700); }
  enterWinchester(); await fade(0, 900); busy = false;
}
async function hastingsFightAgain() {
  if (busy) return; busy = true; sfx.ui(); lock(); $('card').hidden = true;
  await fade(1, 700); await hastingsToBattle();
}
function hastingsEndCard() {
  const B = battle, tally = '<p class="titulus">Foes you felled: ' + B.player.kills + '</p>';
  const btns = [['Fight again', 'yes', hastingsFightAgain], ['Return to Winchester', 'no', hastingsBackToWinchester]];
  if (B.result === 'victory') showCard('14 October 1066', 'Victory', '<p>William has fallen and the Normans break and run. Harold keeps his crown. England is saved, and history is changed.</p>' + tally, btns);
  else if (B.result === 'harold') showCard('Hic Harold rex interfectus est', 'Harold has fallen', '<p>The shield wall is broken and the King lies dead. William will be crowned on Christmas Day.</p>' + tally, btns);
  else showCard('14 October 1066', 'You have fallen', '<p>You fought bravely on the field of Hastings, but the battle goes on without you.</p>' + tally, btns);
}
$('btnYes').addEventListener('click', hastingsYes);
$('btnNo').addEventListener('click', hastingsNo);
defineScreen({
  id: 'winchester', level: 'hastings',
  frame(dt, clock) { stepWinchester(dt, clock); winchester.army.write(); },
  key(e) { if (busy) return; if (e.code === 'KeyY') hastingsYes(); else if (e.code === 'KeyN') hastingsNo(); },
  resume() { ensureBuilt(LEVELS.hastings); enterWinchester(true); }
});

/* Hastings is the oldest level: its world is in 06_Hastings.js, Winchester's scene in 05_Winchester.js, and the rest here */
defineLevel({
  id: 'hastings', order: 1066, year: '1066', title: 'Hastings', blurb: 'Stand with King Harold against the Normans', colour: 'var(--woad)',
  world: hast, build() { buildWinchester(); buildBattle(); }, tally: 'tallyH', lock: false,
  money: ['silver penny', 'silver pennies'], kit: [['axe', 'Battle axe'], ['shieldR', 'Round shield'], ['helm', 'Iron helmet']],
  enter: async () => { enterWinchester(false); await fade(0, 900); busy = false; }, resume() { enterWinchester(true); hastingsToBattle(); },
  endCard: hastingsEndCard,
  skip() { if (battle.phase === 'intro' && battle.introT > .7) beginCharge(); },
  frame: { wait() { camera.position.set(-43, 16, -12); camera.lookAt(8, 1, 0); }, intro: stepIntro }
});
