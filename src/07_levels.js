/* ================= levels: the registry, and the kit a new level is built from ================= */
/* A level lives in its own folder, src/levels/<id>/, and tells the game about itself with one call to defineLevel().
   Nothing outside that folder needs to change to add a level. docs/LEVELS.md explains every field. */
const LEVELS = {};
/* Screens are the places that are not a level being played: choosing a battle, Winchester before Hastings, and later the
   main menu. While one is showing, `mode` is its id. A screen: { id, frame(dt, clock), key(e), level, resume(data) }.
   frame steps and places the camera each frame; key gets key presses; level is the level whose kit the Pack shows. */
const SCREENS = {};
function defineLevel(def) {
  if (LEVELS[def.id] || SCREENS[def.id]) throw new Error('two levels or screens are both called ' + def.id);
  def.frame = def.frame || {}; def.built = false; LEVELS[def.id] = def; return def;
}
function defineScreen(def) {
  if (LEVELS[def.id] || SCREENS[def.id]) throw new Error('two levels or screens are both called ' + def.id);
  SCREENS[def.id] = def; return def;
}
/* a level's scene is built the first time it is chosen, so the page does not pay for levels nobody plays */
function ensureBuilt(lv) {
  if (lv.built) return;
  if (lv.css) { const st = document.createElement('style'); st.textContent = lv.css; document.head.appendChild(st); }
  lv.build(); lv.built = true;
}
/* the choose-your-battle buttons, oldest era first */
function buildSelect() {
  const box = $('eras'); box.innerHTML = '';
  Object.keys(LEVELS).map(k => LEVELS[k]).sort((a, b) => a.order - b.order).forEach(lv => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'era'; el.id = 'era' + lv.id.charAt(0).toUpperCase() + lv.id.slice(1);
    if (lv.colour) el.style.background = lv.colour;
    const y = document.createElement('span'); y.className = 'year'; y.textContent = lv.year;
    const w = document.createElement('span'); w.className = 'what'; const b = document.createElement('b'); b.textContent = lv.title; w.appendChild(b); w.appendChild(document.createTextNode(lv.blurb || ''));
    el.appendChild(y); el.appendChild(w); el.addEventListener('click', () => chooseLevel(lv.id)); box.appendChild(el);
  });
}

/* ---------- the kit ---------- */
/* everything the fighting engine expects a level's world to have; add your own fields in `extra` */
function newWorld(extra) {
  return Object.assign({ scene: null, army: null, trees: [], rects: [], gates: [], rules: null, leash: 0, ground: () => 0, hpBg: null, hpFill: null, fxMesh: null, dropMesh: null, clouds: null }, extra || {});
}
/* a scene with sky, haze, daylight and a textured ground. o: { sky, fogColour, fog: [near, far], ground: [seed, r, g, b], size } */
function basicScene(W, o) {
  o = o || {}; const sc = new T.Scene(); W.scene = sc;
  sc.background = new T.Color(o.sky !== undefined ? o.sky : 0xa8cfee);
  const f = o.fog || [70, 240]; sc.fog = new T.Fog(o.fogColour !== undefined ? o.fogColour : sc.background.getHex(), f[0], f[1]);
  sc.add(new T.HemisphereLight(0xffffff, 0x8a7a5a, .62));
  const sun = new T.DirectionalLight(0xfff0d0, .5); sun.position.set(-60, 70, -40); sc.add(sun);
  const g = o.ground || [3, 96, 150, 62], size = o.size || 600, gt = groundTexture(g[0], g[1], g[2], g[3]); gt.repeat.set(size / 4, size / 4);
  sc.add(new T.Mesh(new T.PlaneGeometry(size, size).rotateX(-PI / 2), new T.MeshLambertMaterial({ map: gt })));
  return sc;
}
/* turn the list of scenery boxes into one mesh, and give the world its health bars, sparks, loot and its army of up to `cap` people */
function finishWorld(W, boxes, cap) {
  if (boxes && boxes.length) W.scene.add(new T.Mesh(buildBoxes(boxes), MAT_STATIC));
  Object.assign(W, combatLayers(W.scene)); W.army = new Army(W.scene, cap || 48, true);
}
/* a clean slate for a new run; call it first in your populate() */
function resetBattle(id) {
  useLevel(id);
  const B = battle, W = LEVELS[id].world;
  W.army.reset(); B.units = W.army.units; B.sax = []; B.nor = []; fx.list.length = 0; drops.length = 0;
  B.t = 0; B.over = false; B.result = null; B.endT = 0; B.cardShown = false; B.edgeT = 0; B.lastHurt = -99; B.shake = 0; B.phase = 'wait';
}
/* show this level's panel at the top of the screen and no other */
function showTally(lv) {
  for (const id of ['tallyH', 'tallyC', 'tallyS', 'tallyL']) $(id).hidden = true;
  if (lv.tally) $(lv.tally).hidden = false; else if (lv.hud) { $('tallyL').innerHTML = lv.hud; $('tallyL').hidden = false; }
}
/* hand control to the player */
function beginFight() {
  const B = battle, lv = LEVELS[B.level]; if (B.phase === 'fight') return;
  B.phase = 'fight';
  $('hud').hidden = false; showTally(lv); $('btnPause').hidden = false; refreshTouchUi();
  showHint(); followCam(0, true); B.rules.hud(true);
}
/* The usual way into a level. The screen is already black when this is called (the select screen and retryLevel see to that).
   opts is passed to the level's populate(); opts.title and opts.sub change the title card, opts.quick skips the opening. */
async function runLevel(id, opts) {
  const lv = LEVELS[id]; opts = opts || {};
  hideUi(); interlude(opts.title || lv.title, opts.sub || lv.when || '');
  ensureBuilt(lv); lv.populate(opts);
  mode = id; scene = lv.world.scene; camera.fov = 55; camera.updateProjectionMatrix();
  await wait(opts.quick ? 1000 : 1600);
  if (lv.frame.intro && !opts.quick) battle.phase = 'intro'; else beginFight();
  await fade(0, 1000);
  $('interlude').hidden = true; busy = false;
}
/* for the buttons on an end card: fade out and go in again */
async function retryLevel(id, opts) {
  if (busy) return; busy = true; sfx.ui(); lock(); $('card').hidden = true;
  await fade(1, 700); await runLevel(id, opts);
}
/* a title across the lower part of the screen for a few seconds */
function showBanner(title, sub, secs) { setCaption(title, sub || '', 'low'); battle.bannerT = secs || 3.2; }
/* an end card with one button of your own and the way back to the other battles */
function levelCard(kicker, title, html, label, go) { showCard(kicker, title, html, [[label, 'yes', go], ['Other battles', 'no', toSelect]]); }
