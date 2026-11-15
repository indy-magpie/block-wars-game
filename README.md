# Block Wars

A blocky third-person adventure through history, built from a seven-year-old's design.
The whole game is one self-contained HTML page (`index.html`) that runs in a browser
with no server. It draws with three.js r128 from cdnjs and uses three Google Fonts.

## Levels

| Era | Level | What happens |
| --- | --- | --- |
| 328 BC | Sogdiana | An open map and a stealth mission. A Companion of Alexander, on foot with only a knife, must get into the fort of Gabae and capture the rebel Spitamenes. Disguises, bribes, an informant, guards who see and give chase, and choices that change how it ends. |
| 146 BC | Carthage | Scipio's final assault: harbour, siege camp, assault front, wall breach, streets, temple, palace. Arrows, fleeing civilians, checkpoints. |
| 1066 | Hastings | Winchester recruiting scene, then the battle. Hold out with Harold against William. |

## Controls

Move `WASD` or arrows · hit `F`, `J` or click · block `Shift`, `K` or right-click ·
jump `Space` · turn camera `Q` / `E` or mouse · eat bread `1` or `H` · pack `I` or `Tab` ·
pause `P` · mute `M`. Touch controls appear on a touch screen.

In Sogdiana there is no shield, so the block key creeps instead. `E` or `Enter` talks to
people and uses things when a prompt is showing (otherwise `E` still turns the camera),
and the number keys pick an answer.

## Layout

```
src/page.html            markup and CSS; the script is injected at /*SCRIPT*/
src/NN_name.js           the engine and screens, in load order; every part shares one scope
src/levels/<id>/         one folder per level; a level registers itself with defineLevel()
build.py                 joins src/ into index.html, and stops if two files use the same name
docs/LEVELS.md           how to write a level
docs/template/level.js   a complete small level to copy
docs/ROADMAP.md          eras that could come next
docs/briefs/             one design brief per level in progress
CLAUDE.md                rules for sessions working here in parallel
test/                    headless play-throughs and balance simulations
```

Core parts, in order: boot, helpers, renderer, blocky people (instanced box figures), scenery pieces,
Winchester, Hastings world, fighting engine, inventory, the level and screen registries and the kit,
talk-and-use, Hastings rules and screens; then every level folder; then flow (the select screen and cards),
events (input) and the main loop.

A screen is a place that is not a level being played: choosing a battle, or Winchester before Hastings. Each
registers itself with `defineScreen()`, and while it shows, `mode` is its id. While a level is played, `mode`
is the level's id.

Each level gives the engine a `rules` object and describes itself to the registry. A level's scene is built
the first time it is chosen. `docs/LEVELS.md` has the details.

## Build

```
python3 build.py
```

`index.html` is a build product and is not committed.

## Tests

The tests drive the built page in headless Chrome with software WebGL. They need
Python Playwright, Chrome, and `npm install` (three.js and the fonts are served to the
page from `node_modules`, so no network is needed).

```
npm install
pip install playwright
python3 test/smoke.py <id>  # does a level start cleanly? works for any level
python3 test/template.py   # the level kit, proved with docs/template/level.js
python3 test/screens.py    # the select screen, Winchester, Hastings' cards, and a hot reload
python3 test/cplay.py      # Carthage and Hastings end to end
python3 test/tweaks2.py    # jump, loot, bread, pack, saving
python3 test/hsim.py       # Hastings balance, simulated players
python3 test/csim.py       # Carthage balance, simulated players
python3 test/smech.py      # Sogdiana: every system on its own (alarms, hiding, endings, choices)
python3 test/sroute.py     # Sogdiana: one whole route, start to finish
python3 test/skeys.py      # Sogdiana with real key presses
python3 test/sbot.py       # Sogdiana: careless players and knife fights
python3 test/sog.py        # Sogdiana: screenshots of the main places
```

Set `CHROME=/path/to/chrome` if Chrome is not at `/usr/bin/google-chrome`.
Screenshots go to `test/shots/`.

These are simulations. Nobody's hands are on the keys, so they show that the flows work
and roughly how hard each level is, not how it feels to play.

## Tuning

- Hastings: `STAT` and `TUNE` in `src/06_Hastings.js`.
- Carthage: `C_TIER`, `C_TUNE` and `STAGES` in `src/levels/carthage/carthage.js`.
- Sogdiana: `S_TUNE` in `src/levels/sogdiana/1_world.js` (how far guards see, how fast they grow
  suspicious, how weak the knife is, what things cost). Guards, patrols and people are
  placed in `sogPopulate`; conversations are the `talk…` functions in
  `src/levels/sogdiana/2_play.js`.
- Items and loot: `ITEMS` and `dropLoot` in `src/07_inventory.js`.

In the browser console, `window.__hastings` exposes the live state, the tuning tables
and helpers such as `warp(stage, wave)` and `simulate(n, how)`. In Sogdiana, set
`__hastings.sog.log = []` to record what raised each alarm.

## Saving

Coins and items are kept in `localStorage` (`blockwars.save`) and, when the page runs as
a claude.ai artifact, in a per-viewer store as well.
