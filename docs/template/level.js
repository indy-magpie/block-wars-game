/* ================= TEMPLATE LEVEL =================
   A complete, playable level in one file: a small field, a friend to talk to, a few raiders, a win and a loss.
   To start a new level: copy this file to src/levels/<id>/level.js, then rename every tmpl / Tmpl / TMPL to your level's id.
   test/template.py builds the game with this file dropped in and plays it, so it is known to work. docs/LEVELS.md explains each part. */

/* every number worth tuning, in one place */
const TMPL = { playerHp: 100, playerDmg: [11, 15], foes: 5, foeHp: 60, foeDmg: [4, 6], half: 30 };
/* the level's world: what the engine needs, plus anything of your own */
const tmpl = newWorld({ elder: null, warned: false });

/* Built once, the first time the level is chosen. Scenery is a list of boxes: [centre x, y, z, size x, y, z, colour]. */
function buildTmpl() {
  const W = tmpl, L = [], rng = rngSeed(7);
  basicScene(W, { sky: 0xa8cfee, fog: [60, 200], ground: [5, 110, 150, 70] });
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * PI * 2, x = Math.cos(a) * 26, z = Math.sin(a) * 26;
    tree(L, x, z, 1 + rng() * .4, rng); W.trees.push({ x: x, z: z, r: .5 });                 /* trees: round things to walk round */
  }
  L.push([6, .6, 4, 3, 1.2, 2, jit(0x9a8f80, .05, rng)]);
  W.rects.push({ x0: 4.5, x1: 7.5, z0: 3, z1: 5, h: 1.2, plat: true });                       /* rects: walls; plat means he can jump onto it */
  finishWorld(W, L, 24);                                                                     /* 24 is the most people the level ever holds */
  W.rules = tmplRules;
}

/* Called at the start of every run, and again when he tries again. Team 0 is his side (green), team 1 the enemy (red). */
function tmplPopulate(opts) {
  resetBattle('tmpl');
  const B = battle, W = tmpl, add = (look, o) => W.army.add(Object.assign({}, look, o));
  const p = B.player = add(LOOK_PLAYER, { team: 0, isPlayer: true, x: 0, z: -10, yaw: 0, hp: TMPL.playerHp, dmg: TMPL.playerDmg, range: 2, speed: 5.6, rad: .42, mass: 1.6,
    blockChance: .45, windup: .13, strikeEnd: .25, attackDur: .4, hitAt: .2, cool: 0 });
  B.sax.push(p);                                                                             /* B.sax: everyone the enemy may attack */
  W.elder = add(lookSaxon(), { team: 0, npc: true, mass: 60, x: -3, z: -7, yaw: PI / 2, weapon: 'none', shield: 'none' });      /* npc: stands where he is put, takes no part in the fight */
  for (let i = 0; i < TMPL.foes; i++)                                                         /* hold: they wait at their posts until one of them notices him within `aggro` */
    B.nor.push(add(lookNorman(), { team: 1, x: -6 + i * 3, z: 12, yaw: PI, hp: TMPL.foeHp, dmg: TMPL.foeDmg, speed: rand(3.9, 4.5), loot: 1, hold: true, aggro: 9 }));
  B.acts = [{ pos: W.elder, r: 3, label: () => 'Speak to the elder', go: tmplTalk }];        /* things he can press E on */
  W.warned = false;
  cam.yaw = 0; followCam(0, true);
}

/* a conversation: who speaks, what they say, and up to four answers [label, what happens, is it a refusal (red), is it greyed out] */
function tmplTalk() {
  openTalk('The elder', 'Raiders are coming over the hill. Will you stand with us?', [
    ['I will', () => { tmpl.warned = true; tell('The raiders are waiting to the north.', 4); }],
    ['Give me bread first', () => { if (Inv.give('bread', 1)) sfx.coin(); }],
    ['Not yet', () => {}, true]]);
}

/* what the fighting engine asks the level */
const tmplRules = {
  clamp(u) { u.x = clamp(u.x, -TMPL.half, TMPL.half); u.z = clamp(u.z, -TMPL.half, TMPL.half); },      /* the edge of the world */
  flee() {},
  wake() { for (const e of battle.nor) e.hold = false; },                                    /* one of them has seen him, or been struck: they all come */
  after(dt) {                                                                                /* once a frame, after everyone has moved */
    const B = battle; if (B.over) return;
    if (!B.player.alive) endBattle('fallen'); else if (!B.nor.some(u => u.alive)) endBattle('victory');
    stepActs();
  },
  end(result) { if (result === 'victory') { showBanner('The village is safe', 'The raiders run', 6); sfx.win(); } else sfx.lose(); },
  hud() {                                                                                    /* a few times a second: keep the panels up to date */
    const B = battle, p = B.player; if (!p) return;
    hudPlayer(Math.ceil(p.hp / p.maxHp * 10), p.kills);
    const el = $('tmplFoes'); if (el) el.textContent = B.nor.filter(u => u.alive).length;
  }
};

/* the one call that makes the level exist */
defineLevel({
  id: 'tmpl', order: 99999, year: 'Year', title: 'Template', blurb: 'One line that says what the player does', colour: '#5a6b3a', when: 'A date or a place, for the title card',
  world: tmpl, build: buildTmpl, populate: tmplPopulate,
  money: ['coin', 'coins'], kit: [['axe', 'Battle axe'], ['shieldR', 'Round shield']],
  hud: '<div class="side english wide"><div class="row"><span>The village</span></div><div class="leader"><span>Beat the raiders</span></div></div>' +
    '<div class="side normans"><div class="row"><span>Raiders</span><b id="tmplFoes">0</b></div></div>',
  enter: () => runLevel('tmpl'),
  endCard() {
    const won = battle.result === 'victory';
    levelCard('Template', won ? 'Victory' : 'You have fallen', won ? '<p>The raiders are beaten and the village is safe.</p>' : '<p>The raiders have the field. Get up and try again.</p>',
      won ? 'Play again' : 'Try again', () => retryLevel('tmpl', { quick: true }));
  }
});
