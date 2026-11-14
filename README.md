# Block Wars

A blocky third-person adventure through history, built from a seven-year-old's design.
The whole game is one self-contained HTML page (`index.html`) that runs in a browser
with no server. It draws with three.js r128 from cdnjs and uses three Google Fonts.

## Levels

| Era | Level | What happens |
| --- | --- | --- |
| 146 BC | Carthage | Scipio's final assault: harbour, siege camp, assault front, wall breach, streets, temple, palace. Arrows, fleeing civilians, checkpoints. |
| 1066 | Hastings | Winchester recruiting scene, then the battle. Hold out with Harold against William. |

## Controls

Move `WASD` or arrows · hit `F`, `J` or click · block `Shift`, `K` or right-click ·
jump `Space` · turn camera `Q` / `E` or mouse · eat bread `1` or `H` · pack `I` or `Tab` ·
pause `P` · mute `M`. Touch controls appear on a touch screen.

## Layout

```
src/page.html            markup and CSS; the script is injected at /*SCRIPT*/
src/NN_name.js           the game, in load order; all parts share one function scope
build.py                 joins src/ into index.html
index.html               the built page (committed, so it can be opened or published as is)
test/                    headless play-throughs and balance simulations
```

Parts, in order: boot, helpers, renderer, blocky people (instanced box figures),
scenery pieces, Winchester, Hastings world, fighting engine, inventory, Hastings rules,
Carthage, flow (screens and cards), events (input), main loop.

## Build

```
python3 build.py
```

## Tests

The tests drive the built page in headless Chrome with software WebGL. They need
Python Playwright, Chrome, and `npm install` (three.js and the fonts are served to the
page from `node_modules`, so no network is needed).

```
npm install
pip install playwright
python3 test/cplay.py      # both levels end to end
python3 test/tweaks2.py    # jump, loot, bread, pack, saving
python3 test/hsim.py       # Hastings balance, simulated players
python3 test/csim.py       # Carthage balance, simulated players
```

Set `CHROME=/path/to/chrome` if Chrome is not at `/usr/bin/google-chrome`.
Screenshots go to `test/shots/`.

These are simulations. Nobody's hands are on the keys, so they show that the flows work
and roughly how hard each level is, not how it feels to play.

## Tuning

- Hastings: `STAT` and `TUNE` in `src/06_Hastings.js`.
- Carthage: `C_TIER`, `C_TUNE` and `STAGES` in `src/09_carthage.js`.
- Items and loot: `ITEMS` and `dropLoot` in `src/07_inventory.js`.

In the browser console, `window.__hastings` exposes the live state, the tuning tables
and helpers such as `warp(stage, wave)` and `simulate(n, how)`.

## Saving

Coins and items are kept in `localStorage` (`blockwars.save`) and, when the page runs as
a claude.ai artifact, in a per-viewer store as well.
