/* ================= purse, pack and pickups ================= */
/* The start of the inventory: money and things carried from battle to battle. There is nothing to spend money on yet. */
const ITEMS = {
  bread: { name: 'Loaf of bread', desc: 'Eat it to win back four blocks of health. You can carry five.', max: 5, heal: 40 }
};
const MONEY = { hastings: ['silver penny', 'silver pennies'], carthage: ['denarius', 'denarii'], sogdiana: ['drachma', 'drachmas'], any: ['coin', 'coins'] };
const KIT = {
  hastings: [['axe', 'Battle axe'], ['shieldR', 'Round shield'], ['helm', 'Iron helmet']],
  carthage: [['gladius', 'Gladius'], ['scutum', 'Scutum'], ['helmR', 'Bronze helmet']]
};
/* pixel icons, eight by eight */
const ICON_PAL = { T: '#1f7f84', t: '#145a5e', U: '#2f6fb0', u: '#1f4f84', Y: '#f2c230', y: '#b9861c', w: '#fff3b0', B: '#a5672c', b: '#d9a45c', d: '#6e4118', S: '#d6dbe2', s: '#8a919c', W: '#7a5632', R: '#a82a22', r: '#6e1712', P: '#c0281e', G: '#c9973a', g: '#8a6420' };
const ICON_MAP = {
  coin: ['..yyyy..', '.yYYYYy.', 'yYwYYYYy', 'yYwYYYYy', 'yYYYYYYy', 'yYYYYyYy', '.yYYYYy.', '..yyyy..'],
  bread: ['........', '..BBBB..', '.BbbbbB.', 'BbdbdbbB', 'BbbbbbbB', 'BBBBBBBB', '.dddddd.', '........'],
  axe: ['.....SS.', '....SSSs', '...WSSSs', '..W.SSs.', '.W...s..', 'W.......', '........', '........'],
  gladius: ['......SS', '.....SS.', '....SS..', '...SS...', '.YSS....', '.WY.....', 'W.......', '........'],
  shieldR: ['..RRRR..', '.RRrrRR.', 'RRrRRrRR', 'RrRssRrR', 'RrRssRrR', 'RRrRRrRR', '.RRrrRR.', '..RRRR..'],
  scutum: ['.RRRRRR.', '.RRYYRR.', '.RRYYRR.', '.RYYYYR.', '.RYYYYR.', '.RRYYRR.', '.RRYYRR.', '.RRRRRR.'],
  helm: ['...ss...', '..sSSs..', '.sSSSSs.', '.sSSSSs.', 'ssssssss', '.s.ss.s.', '...ss...', '........'],
  knife: ['......S.', '.....SS.', '....SS..', '...SS...', '..YS....', '.WY.....', 'W.......', '........'],
  robe: ['..TTTT..', '.TTYYTT.', 'TTTYYTTT', 'T.TTTT.T', '..TTTT..', '..TtTT..', '..TTtT..', '..TTTT..'],
  jar: ['..uUUu..', '...UU...', '..UUUU..', '.UUUUUU.', '.UuUUUU.', '.UuUUUU.', '..UUUU..', '...uu...'],
  arrow: ['.....SSS', '......SS', '.....W.S', '....W...', '...W....', 'R.W.....', '.R......', 'R.R.....'],
  helmR: ['...PP...', '..PPPP..', '..gGGg..', '.gGGGGg.', '.gGGGGg.', 'gggggggg', '.g....g.', '.g....g.']
};
const ICON_URL = {};
(function () {
  for (const k in ICON_MAP) {
    const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d');
    ICON_MAP[k].forEach((row, y) => { for (let x = 0; x < 8; x++) { const p = ICON_PAL[row[x]]; if (p) { g.fillStyle = p; g.fillRect(x, y, 1, 1); } } });
    ICON_URL[k] = c.toDataURL();
  }
  document.querySelectorAll('[data-ico]').forEach(el => { el.style.backgroundImage = 'url(' + ICON_URL[el.getAttribute('data-ico')] + ')'; });
})();
const icon = k => '<i class="ico" style="background-image:url(' + ICON_URL[k] + ')"></i>';

/* The save: kept in this browser straight away, and in the page's own store when the viewer provides one, so it can follow the player to another device. */
const Save = {
  data: { coins: 0, items: {}, at: 0 }, ref: null, ready: false, dirty: false, busy: false, timer: 0,
  clean(d) {
    const out = { coins: Math.max(0, Math.floor(+d.coins || 0)), items: {}, at: +d.at || 0 };
    for (const k in ITEMS) { const n = d.items && +d.items[k]; if (n > 0) out.items[k] = Math.min(ITEMS[k].max, Math.floor(n)); }
    return out;
  },
  loadLocal() { try { const s = localStorage.getItem('blockwars.save'); if (s) this.data = this.clean(JSON.parse(s)); } catch (e) {} },
  saveLocal() { try { localStorage.setItem('blockwars.save', JSON.stringify(this.data)); } catch (e) {} },
  async connect() {
    try {
      const cl = window.claude; if (!cl || typeof cl.use !== 'function') return;
      const db = await cl.use('db'), user = await cl.use('user'); if (!db || !user) return;
      const id = await user.id(); if (!id) return;
      this.ref = db.doc('data/users/' + id + '/blockwars');
      const snap = await Promise.race([this.ref.get(), wait(10000).then(() => null)]);
      if (!snap) { this.ref = null; return; }
      const far = snap.exists ? this.clean(JSON.parse(JSON.stringify(snap.data() || {}))) : null;
      if (far && far.at > this.data.at) { this.data = far; this.saveLocal(); hudPack(); }
      else if (this.data.at > (far ? far.at : 0)) this.dirty = true;
      this.ready = true; this.flush();
    } catch (e) { this.ref = null; }
  },
  touch() {
    this.data.at = Math.max(Date.now(), this.data.at + 1); this.saveLocal(); this.dirty = true;
    clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 6000);      /* one write per pause in the action, not one per coin */
  },
  async flush() {
    if (!this.ref || !this.ready || !this.dirty || this.busy) return;
    this.busy = true; this.dirty = false;
    try { await this.ref.set({ coins: this.data.coins, items: Object.assign({}, this.data.items), at: this.data.at }); }
    catch (e) { const c = e && e.code; if (c === 'unavailable' || c === 'resource_exhausted') this.dirty = true; else this.ref = null; }
    this.busy = false;
  }
};
const Inv = {
  coins() { return Save.data.coins; },
  count(id) { return Save.data.items[id] || 0; },
  addCoins(n) { Save.data.coins += n; Save.touch(); hudPack(); },
  give(id, n) { const have = this.count(id), max = ITEMS[id].max; if (have >= max) return false; Save.data.items[id] = Math.min(max, have + n); Save.touch(); hudPack(); return true; },
  use(id) {
    const B = battle, p = B.player, it = ITEMS[id];
    if (!it || !this.count(id) || !inCombat() || B.phase !== 'fight' || B.over || paused || !p || !p.alive) return false;
    if (it.heal) {
      if (p.hp >= p.maxHp - 1) { B.edgeT = 1.6; B.toast = 'You are at full health. Save the bread for later.'; return false; }
      p.hp = Math.min(p.maxHp, p.hp + it.heal);
    }
    Save.data.items[id]--; Save.touch(); sfx.eat(); burst(p.x, p.gy + 1.6, p.z, 6, 0x8cf0a0, 1.6, .5, .1);
    hudPack(); B.rules.hud(true); return true;
  }
};
function hudPack() {
  const c = Inv.coins(), n = Inv.count('bread');
  $('coins').textContent = c; $('nBread').textContent = n; $('slotBread').classList.toggle('none', n === 0);
  $('selCoins').textContent = c + (c === 1 ? ' coin' : ' coins'); $('selBread').textContent = n + (n === 1 ? ' loaf' : ' loaves');
}

/* ---- things beaten enemies drop ---- */
const drops = [];
function dropLoot(t, a) {
  const B = battle; if (B.sim || t.team !== 1) return;
  const mine = !!(a && a.isPlayer);
  let value = t.loot || 1;
  if (!mine) { if (Math.random() > .35) return; value = 1; }              /* a comrade's kill sometimes leaves a coin too */
  const n = Math.min(6, value);
  const put = (kind, v) => { if (drops.length >= 90) return; const an = rand(0, PI * 2), s = rand(.8, 2.2); drops.push({ kind: kind, v: v, x: t.x, y: t.gy + 1, z: t.z, vx: Math.cos(an) * s, vy: rand(4, 6), vz: Math.sin(an) * s, gy: t.gy, t: 0, spin: rand(0, 6) }); };
  for (let i = 0; i < n; i++) put('coin', Math.floor(value / n) + (i < value % n ? 1 : 0));
  if (mine && Math.random() < .14) put('bread', 1);
}
function stepDrops(dt) {
  const B = battle, p = B.player;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]; d.t += dt;
    d.vy -= 18 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
    if (d.y < d.gy + .24) { d.y = d.gy + .24; d.vy *= -.3; d.vx *= .5; d.vz *= .5; }
    let gone = d.t > 45;
    if (p && p.alive && d.t > .45) {
      const dx = p.x - d.x, dz = p.z - d.z, dist = hyp(dx, dz) || 1e-4;
      if (dist < 1) {
        if (d.kind === 'coin') { Inv.addCoins(d.v); sfx.coin(); gone = true; }
        else if (Inv.give(d.kind, 1)) { sfx.coin(); gone = true; }
      } else if (dist < 3.2 && (d.kind === 'coin' || Inv.count(d.kind) < ITEMS[d.kind].max)) { const k = (3.2 - dist) * 5 * dt / dist; d.x += dx * k; d.z += dz * k; d.gy = damp(d.gy, p.gy, 8, dt); }
    }
    if (gone) { drops[i] = drops[drops.length - 1]; drops.pop(); }
  }
}
function writeDrops(time) {
  const M = battle.dropMesh; if (!M) return; let n = 0;
  const arr = M.instanceColor.array;
  for (const d of drops) {
    if (n >= 96) break;
    const coin = d.kind === 'coin', fade = d.t > 41 ? clamp((45 - d.t) / 4, 0, 1) : 1;
    _e.set(0, coin ? time * 4 + d.spin : d.spin, 0, 'YXZ'); _q.setFromEuler(_e);
    _v.set(d.x, d.y + (coin ? Math.sin(time * 5 + d.spin) * .05 : 0), d.z);
    if (coin) _s.set(.36 * fade, .36 * fade, .09 * fade); else _s.set(.46 * fade, .26 * fade, .3 * fade);
    _m.compose(_v, _q, _s); M.setMatrixAt(n, _m);
    _col.setHex(coin ? 0xf2c230 : 0xc48a48); arr[n * 3] = _col.r; arr[n * 3 + 1] = _col.g; arr[n * 3 + 2] = _col.b; n++;
  }
  M.count = n; M.instanceMatrix.needsUpdate = true; M.instanceColor.needsUpdate = true;
}

/* ---- the Pack screen ---- */
let packOpen = false;
function closePack() { if (!packOpen) return; packOpen = false; $('card').hidden = true; if (inCombat() && battle.phase === 'fight' && !battle.over) { paused = false; lock(); } Save.flush(); }
function openPack() {
  if (packOpen) { closePack(); return; }
  if (busy || !$('card').hidden || (inCombat() && battle.phase !== 'fight')) return;
  const fight = inCombat() && !battle.over, lvl = inCombat() ? battle.level : mode === 'menu' ? 'hastings' : 'any';
  const m = MONEY[lvl] || MONEY.any, c = Inv.coins(), p = battle.player;
  let html = '<div class="purse-big">' + icon('coin') + '<b>' + c + '</b><span>' + (c === 1 ? m[0] : m[1]) + '</span></div>';
  const kit = lvl === 'sogdiana' ? sogKit() : KIT[lvl];
  if (inCombat() && kit) html += '<h3>' + (lvl === 'sogdiana' ? 'What you carry' : 'Kit for this battle') + '</h3><div class="cells">' + kit.map(k => '<div class="cell">' + icon(k[0]) + '<span>' + k[1] + '</span></div>').join('') + '</div>';
  html += '<h3>Pack</h3><div class="cells">';
  for (const id in ITEMS) { const n = Inv.count(id), it = ITEMS[id]; html += '<div class="cell wide' + (n ? '' : ' none') + '">' + icon(id) + '<span>' + it.name + ' <b>&times;' + n + '</b><small>' + it.desc + '</small></span></div>'; }
  html += '</div><p class="titulus">' + (lvl === 'sogdiana' ? 'Silver buys disguises, secrets and bread. Search old pots for more.' : 'Beaten enemies drop coins, and now and then a loaf.') + '</p>';
  const btns = [['Close', 'yes', closePack]];
  if (fight && Inv.count('bread') && p && p.alive && p.hp < p.maxHp - 1) btns.unshift(['Eat a loaf', 'no', () => { closePack(); Inv.use('bread'); }]);
  if (fight) paused = true;
  showCard('', 'Pack', html, btns, true); packOpen = true;
}
