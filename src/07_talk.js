/* ================= talk and use: conversations with choices, and things in the world to press E on ================= */
/* Any level can use these. A level lists what can be used in battle.acts: { pos: a unit or [x, z], r: reach, label: () => text or null, go: () => {} }.
   It calls stepActs() each frame (at the end of its rules.after), and opens a conversation with openTalk(). The world stands still while he talks. */
function tell(text, secs) { if (battle.sim) return; battle.toast = text; battle.edgeT = secs || 4; }
/* ---------- talking: a line, and up to four answers. choices: [label, what to do, is it a refusal, is it greyed out] ---------- */
function openTalk(who, text, choices) {
  const B = battle;
  B.phase = 'talk'; for (const k in keys) keys[k] = false; input.mouseHit = input.mouseBlock = input.touchHit = input.touchBlock = false;
  B.talk = choices; B.act = null; $('prompt').hidden = true; $('hint').style.opacity = 0; $('touch').hidden = true; $('toast').style.opacity = 0; toastOn = false;
  $('talkWho').textContent = who;
  const box = $('talkChoices'); box.innerHTML = '';
  choices.forEach((c, i) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'choice' + (c[2] ? ' no' : ''); el.id = 'talkBtn' + i; el.disabled = !!c[3];
    const kb = document.createElement('kbd'); kb.textContent = i + 1; el.appendChild(kb); el.appendChild(document.createTextNode(c[0]));
    el.addEventListener('click', () => pickTalk(i)); box.appendChild(el);
  });
  $('talk').hidden = false; unlock(); typeLine(text, null, $('talkLine')); sfx.ui();
}
function pickTalk(i) {
  const B = battle, c = B.talk && B.talk[i]; if (!c || c[3] || battle.phase !== 'talk') return;
  B.talk = null; c[1]();
  if (!B.talk) closeTalk();
}
function closeTalk() {
  const B = battle; B.talk = null; $('talk').hidden = true;
  if (B.phase === 'talk') B.phase = 'fight';
  refreshTouchUi(); if (!B.over) lock(); B.rules.hud(true);
}
function stepActs() {
  const B = battle, p = B.player; if (!B.acts) return; let best = null, bd = 1e9, text = null;
  for (const a of B.acts) {
    const q = a.pos, x = q.x !== undefined ? q.x : q[0], z = q.x !== undefined ? q.z : q[1], d = hyp(x - p.x, z - p.z);
    if (d > a.r || d >= bd) continue;
    const l = a.label(); if (!l) continue;
    best = a; bd = d; text = l;
  }
  if (best !== B.act || text !== B.actText) { B.act = best; B.actText = text; $('prompt').hidden = !best; if (best) { $('promptText').textContent = text; $('promptKey').textContent = touchMode ? 'Tap' : 'E'; } }
}
function doAct() {
  const B = battle;
  if (!inCombat() || B.phase !== 'fight' || B.over || paused || !B.act || !B.player.alive) return false;
  const a = B.act; B.act = null; B.actText = null; $('prompt').hidden = true; a.go(); return true;
}

