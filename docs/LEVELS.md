# How to write a level

A level is a folder, `src/levels/<id>/`, holding one or more `.js` files. `build.py` joins them in file-name
order, after the engine and before the screens. The last thing in the folder is one call to `defineLevel()`.
Nothing outside the folder changes.

Start by copying `docs/template/level.js`. It is a complete small level, and `test/template.py` plays it on every
run, so it is known to work. Sogdiana (`src/levels/sogdiana/`) is the fullest example: an open map, people to talk
to, choices, checkpoints. Carthage is the example of a march through stages with cut-scenes.

Read `CLAUDE.md` first for the rules about branches and shared files.

## The one rule that bites: names

Every file in the game shares one scope. Start every top-level `function`, `const` and `let` in your level with
your level's id (`marathonBuild`, `MARATHON`, `marathonRules`). `build.py` stops if two files use the same name.
If your folder has more than one file and order matters, number them (`1_world.js`, `2_play.js`).

## defineLevel(def)

| Field | Needed | What it is |
| --- | --- | --- |
| `id` | yes | Short lower-case name. Also the folder name, the `data-level` on the page, and `mode` while it is played. Not `select` or `winchester`: those are screens. |
| `order` | yes | The year as a number (BC negative). Sorts the choose-your-battle screen. |
| `year`, `title`, `blurb`, `colour` | yes | The button on that screen. |
| `when` | no | Second line of the title card shown while the level loads. |
| `world` | yes | The object made with `newWorld()`. |
| `build()` | yes | Makes the scene. Runs once, the first time the level is chosen. |
| `populate(opts)` | yes, if you use `runLevel` | Puts everyone in place for a run. Runs on every start and every retry. |
| `enter()` | yes | Called when the level is chosen, with the screen already black. Usually `() => runLevel(id)`. |
| `endCard()` | yes | Shows the card when the level is won or lost. Read `battle.result`. |
| `hud` or `tally` | one of them | `hud`: HTML for your panel at the top of the screen. (`tally` is for the three older levels.) |
| `money`, `kit` | no | `['drachma', 'drachmas']`; and what the Pack screen lists as carried: an array of `[icon, name]`, or a function returning one. |
| `kitTitle`, `packTip` | no | Wording on the Pack screen. |
| `hint(touch)` | no | The controls line shown when the fight starts. Default suits a shield-and-weapon level. |
| `blockLabel` | no | Label of the touch Block button, if the block key does something else in your level. |
| `css` | no | A string of CSS, added when the level is first built. Theme with `#stage[data-level="<id>"]{...}`. |
| `endDelay(result)` | no | Seconds between the end of the fight and the card. Default 1.9. |
| `skip()` | no | Called on any key or click, so the player can skip your opening. |
| `key(e)` | no | Keys of your own. Return true if you used the key. |
| `lock` | no | `false` if choosing the level should not capture the mouse (it opens on a menu, say). |
| `resume(data)` | no | Restart after a hot reload of the page. |
| `frame` | no | Hooks into the main loop, below. |

### frame hooks

`battle.phase` is one of `wait` (behind the black screen), `intro`, `cut`, `talk`, `fight`.

| Hook | When |
| --- | --- |
| `wait(dt, clock)` | Each frame of `wait`. Place the camera for your opening. Default: behind the player. |
| `intro(dt)` | Each frame of `intro`. Move the camera, then call `beginFight()`. If you have no `intro`, the fight starts at once. |
| `cut(dt)` | Each frame of `cut`, for a scene in the middle of a level. Set `battle.phase = 'cut'` to start one. |
| `idle(dt, clock)` | Each frame of `talk`. Animate anyone who is not in the main army. |
| `fx(dt, clock)` | Every frame the game is not paused: fires, beacons, markers. |
| `write()` | After the main army is drawn: write any second army. |

## The world

`newWorld(extra)` gives the engine what it expects. Fill these in `build()`:

- `scene`: `basicScene(W, { sky, fog: [near, far], ground: [seed, r, g, b] })` makes one with light and ground.
- Scenery: a list of boxes `[centre x, y, z, size x, y, z, colour]`. `finishWorld(W, boxes, cap)` turns the list
  into one mesh and creates the army (`cap` = the most people the level ever holds) and the health bars.
  Everything is boxes. `jit(hex, amount, rng)` varies a colour; `rngSeed(n)` gives a repeatable random.
- `trees`: round obstacles `{ x, z, r }`. `rects`: walls `{ x0, x1, z0, z1, h }`. Add `plat: true` and the player
  can jump onto it (he clears about 1.5 high). The camera is pushed in by rects taller than its arm, so keep
  indoor walls low (under 3) or spaces wide.
- `ground(x, z)`: height of the floor, for steps and mounds. Default flat.
- `rules`: your rules object, below.

Directions: a unit faces `(sin yaw, cos yaw)`, so yaw 0 looks along +z. Facing +z, his right is −x.

## People

`W.army.add(Object.assign({}, look, fields))` returns a unit. A look is colours and gear:
`tunic, sleeve, trousers, skin, hair, beard, cloak, robe, skirt, cap, veil, plume, crown, scale`,
`helmet: true | 'roman' | false` with `helmetTint`, `shield: 'round' | 'kite' | 'scutum' | 'bow' | 'none'` with
`shieldTint`, `weapon: 'axe' | 'daneaxe' | 'sword' | 'spear' | 'gladius' | 'knife' | 'none'`. Ready-made:
`LOOK_PLAYER`, `lookSaxon()`, `lookNorman()`, and those in the other levels to read for ideas (do not call them;
see rule 5 in `CLAUDE.md`).

Fields that matter: `team` (0 his side, green glow; 1 the enemy, red), `x, z, yaw`, `hp`, `dmg: [low, high]`,
`range`, `speed`, `blockChance`, `coolR: [low, high]` (seconds between an enemy's blows), `loot` (coins dropped),
`kind: 'line' | 'guard' | 'king'` (guards and kings stay near their post), `hold: true` with `aggro` (waits until
an enemy is that close, then `rules.wake` is called), `npc: true` (stands still, takes no part),
`surrenders: true` (kneels at zero health instead of falling), `isPlayer: true`, `noBlock: true` (no shield: the
block key creeps).

Put the player in `battle.player`. Push everyone the enemy may attack into `battle.sax`, and every enemy into
`battle.nor`. Bystanders with no glow go in a second army, `new Army(W.scene, cap, false)`; you animate and
`write()` them yourself, as Sogdiana does with its townsfolk.

## Rules

The engine calls these. `clamp`, `wake`, `after`, `end` and `hud` are needed; the rest are optional.

| Rule | Purpose |
| --- | --- |
| `clamp(u)` | Keep a unit inside the world. Also the place for invisible barriers. |
| `wake(u)` | A waiting enemy has noticed someone or been struck. |
| `after(dt)` | Once a frame after everyone has moved. Decide win and loss here with `endBattle('victory' | 'fallen')`. Call `stepActs()` here if you use prompts. |
| `end(result)` | The fight has just ended: sounds, a banner. |
| `hud(force)` | A few times a second: `hudPlayer(pips, kills)` and your own panel. |
| `flee(u, mv)`, `follow(u)`, `shoot(u, t)`, `fixed(u, dt)` | Runaways, allies keeping formation, archers, units you move yourself. See Carthage. |
| `steer(u, tx, tz)` | Where a chasing unit should head to get round walls. |
| `strike(a, t, dmg)` | Change the damage of the player's blow. |
| `duck(p)` | True where the player must crouch. |

## Starting, retrying, ending

- `resetBattle(id)` first in `populate()`.
- `runLevel(id, opts)` is the usual `enter`. `retryLevel(id, opts)` is for the buttons on your end card; `opts`
  reaches `populate`, `opts.quick` skips the opening.
- `levelCard(kicker, title, html, buttonLabel, go)` shows an end card with your button and "Other battles".
- Checkpoints: keep the checkpoint and what he has earned on your world object, read them in `populate`, and
  only clear them on a fresh start. Sogdiana's `sogPopulate(fresh)` is the pattern.
- `showBanner(title, sub, seconds)` for a title across the screen; `tell(text, seconds)` for a line of advice.

## Talking and using things

- `openTalk(who, line, choices)`: each choice is `[label, what happens, is it a refusal, is it greyed out]`.
  The world stands still until he answers. A choice may open another talk.
- `battle.acts = [{ pos: unit or [x, z], r: reach, label: () => text or null, go: () => {} }]`: when he is in
  reach and `label()` gives text, a prompt appears and E (or a tap) calls `go`.
- Coins and bread: `Inv.coins()`, `Inv.addCoins(n)` (negative to spend), `Inv.give('bread', 1)`, `Inv.count(id)`.
  The purse is shared by every level and saved for him.

## Not shared yet

Guards who see in a wedge, grow suspicious, raise an alarm and find their way round houses are written inside
Sogdiana and tied to it. If your level needs them, ask for them to be lifted into the engine first (rule 4).
The same goes for anything the player cannot do yet: a bow or thrown spear, riding, boats, vehicles.

## Testing your level

```
python3 build.py && python3 test/smoke.py <id>
```

Then write `test/<id>_*.py`. `test/lib.py` opens the built page in headless Chrome; `test/smech.py` shows how to
set up a situation and check each system on its own, and `test/sroute.py` how to walk a whole route with the
same input the keyboard gives. In the page, `window.__hastings` gives tests `battle`, `keys`, `cam`, `levels`,
`step(dt)` (advance the fight without drawing), `inv` and `state()`.

Simulated players tell you whether a level can be finished and roughly how hard it is. They cannot tell you how
it feels. Say which is which when you report.
