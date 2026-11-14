/* ================= events ================= */
$('btnYes').addEventListener('click', onYes);
$('btnNo').addEventListener('click', onNo);
$('eraCarthage').addEventListener('click', () => chooseLevel('carthage'));
$('eraHastings').addEventListener('click', () => chooseLevel('hastings'));
$('btnLevels').addEventListener('click', () => { if (!busy) toSelect(); });
$('btnSound').addEventListener('click', () => { Snd.init(); Snd.setOn(!Snd.on); $('btnSound').textContent = Snd.on ? 'Sound on' : 'Sound off'; });
$('btnFull').addEventListener('click', () => {
  try { if (document.fullscreenElement) document.exitFullscreen(); else { const r = stage.requestFullscreen && stage.requestFullscreen(); if (r && r.catch) r.catch(() => {}); } } catch (e) {}
});
$('btnPause').addEventListener('click', () => setPaused(!paused));
$('btnPack').addEventListener('click', openPack);
$('slotBread').addEventListener('click', () => Inv.use('bread'));
function skipIntro() {
  if (mode === 'battle') { if (battle.phase === 'intro' && battle.introT > .7) beginCharge(); }
  else if (mode === 'carthage') {
    if (battle.phase === 'intro' && carth.introT > .7) beginCarthage();
    else if (battle.phase === 'cut' && carth.cut && carth.cut.t > .6) finishCut();
  }
}
window.addEventListener('keydown', e => {
  const k = KEYMAP[e.code];
  if (inCombat()) {
    if (k) { if (battle.phase !== 'cut') keys[k] = true; e.preventDefault(); }
    if (e.code === 'KeyP' && !e.repeat) setPaused(!paused);
    if ((e.code === 'Digit1' || e.code === 'KeyH') && !e.repeat) Inv.use('bread');
    if (e.code === 'Tab') e.preventDefault();
    if (!e.repeat) skipIntro();
  } else if (mode === 'menu' && !busy) {
    if (e.code === 'KeyY') onYes(); else if (e.code === 'KeyN') onNo();
  }
  if ((e.code === 'KeyI' || e.code === 'Tab') && !e.repeat) openPack();
  if (e.code === 'Escape' && packOpen) closePack();
  if (e.code === 'KeyM' && !e.repeat) $('btnSound').click();
});
window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; input.mouseHit = input.mouseBlock = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
canvas.addEventListener('mousedown', e => {
  if (!inCombat()) return;
  Snd.init();
  if (battle.phase === 'intro' || battle.phase === 'cut') { skipIntro(); return; }
  if (!input.locked && !battle.over) lock();
  if (e.button === 0) input.mouseHit = true; else if (e.button === 2) input.mouseBlock = true;
  e.preventDefault();
});
window.addEventListener('mouseup', e => { if (e.button === 0) input.mouseHit = false; else if (e.button === 2) input.mouseBlock = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('pointerlockchange', () => { input.locked = document.pointerLockElement === canvas; });
document.addEventListener('mousemove', e => {
  if (!input.locked || !inCombat() || paused) return;
  cam.yaw -= (e.movementX || 0) * .0026; cam.pitch += (e.movementY || 0) * .0018;
});
/* touch: drag anywhere on the view to look */
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch' || !inCombat()) return;
  Snd.init();
  if (battle.phase === 'intro' || battle.phase === 'cut') { skipIntro(); return; }
  if (input.lookId === null) { input.lookId = e.pointerId; input.lookX = e.clientX; input.lookY = e.clientY; }
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== input.lookId) return;
  cam.yaw -= (e.clientX - input.lookX) * .007; cam.pitch += (e.clientY - input.lookY) * .004;
  input.lookX = e.clientX; input.lookY = e.clientY;
});
const endLook = e => { if (e.pointerId === input.lookId) input.lookId = null; };
canvas.addEventListener('pointerup', endLook); canvas.addEventListener('pointercancel', endLook);
(function () {
  const joy = $('joy'), knob = $('knob'); let id = null;
  const set = e => {
    const r = joy.getBoundingClientRect(), R = r.width / 2;
    let x = (e.clientX - (r.left + R)) / R, y = (e.clientY - (r.top + R)) / R; const l = hyp(x, y); if (l > 1) { x /= l; y /= l; }
    input.joyX = x; input.joyY = -y; knob.style.transform = 'translate(' + (x * R * .7) + 'px,' + (y * R * .7) + 'px)';
  };
  const end = e => { if (e.pointerId !== id) return; id = null; input.joyX = input.joyY = 0; knob.style.transform = ''; };
  joy.addEventListener('pointerdown', e => { id = e.pointerId; try { joy.setPointerCapture(id); } catch (err) {} set(e); e.preventDefault(); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); });
  joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
  const hold = (el, prop) => {
    const off = () => { input[prop] = false; el.classList.remove('down'); };
    el.addEventListener('pointerdown', e => { Snd.init(); input[prop] = true; el.classList.add('down'); e.preventDefault(); });
    el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
  };
  hold($('tHit'), 'touchHit'); hold($('tBlock'), 'touchBlock'); hold($('tJump'), 'touchJump');
})();
