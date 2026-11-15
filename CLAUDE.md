# Block Wars: rules for anyone working in this repo

Block Wars is a blocky third-person game that walks through history, one level per era. It is being built from
the ideas of a seven-year-old boy, with his father (Indy) relaying. The whole game is one self-contained HTML page.

Read `docs/LEVELS.md` before writing a level. `docs/ROADMAP.md` lists eras that could come next.

## Commands

```
python3 build.py                 # joins src/ into index.html (not committed)
python3 test/smoke.py <id>       # does a level start without script errors? saves a screenshot in test/shots/
python3 test/template.py         # proves the level kit works, using docs/template/level.js
```

Tests need `npm install`, `pip install playwright` and Chrome (`CHROME=/path` if it is not `/usr/bin/google-chrome`).

## Several sessions work here at once. These rules keep them out of each other's way.

1. **One level per branch, named `level/<id>`.** Branch from `main`.
2. **A level branch only touches its own files:** `src/levels/<id>/`, `docs/briefs/<id>.md`, and tests named
   `test/<id>_*.py`. Nothing else. A level needs no change anywhere else: that is what `defineLevel()` is for.
3. **Never edit the shared files on a level branch.** That means everything in `src/` outside `src/levels/<id>/`
   (the engine, flow, input, main loop, `page.html`), plus `build.py`, `test/lib.py`, `README.md`, `CLAUDE.md`
   and the other docs. Another session is relying on them not moving.
4. **If the engine cannot do what your level needs, stop and say so.** Do not work round it by copying engine
   code into your level or by special-casing your level in a shared file. Describe the hook you need. Engine
   changes are made on their own branch (`engine/<what>`), one at a time, merged to `main` first, and level
   branches then rebase onto it.
5. **Do not take code from another level's folder.** If two levels want the same thing, it belongs in the engine
   (rule 4). Guards that see and give chase are the known case: that code still lives inside Sogdiana.
6. **Every top-level name in your level starts with your level's id** (`marathonBuild`, `MARATHON_TUNE`). All files
   share one scope. `build.py` stops if two files use the same name.
7. **Do not merge to `main` and do not commit `index.html`.** Push your branch and report. Indy decides what lands.
8. **Do not publish over the live Block Wars page.** If a preview is wanted, publish a new, separate page named
   "Block Wars preview: <level>".

## Before building a level

Write `docs/briefs/<id>.md` from `docs/briefs/_template.md` first, and get Indy's answer to its open questions.
The levels so far all came from his son's own description. Do not invent the design for him: propose, ask, then build.

## What every level must be

- **For a seven-year-old.** Short sentences. No gore: the beaten fall and fade, leaders surrender. Nothing cruel
  is rewarded.
- **True to the history, and honest where the game departs from it.** The end card says in a line what really
  happened.
- **Winnable by a child, with a kinder route for one who is stuck.** When he falls he restarts close by and keeps
  what he has earned.
- **Readable.** British spelling. The body font's digits are easy to misread, so write small numbers as words in
  sentences; digits are fine in buttons, labels and the HUD.
- **Playable on keyboard now and on a tablet later.** Do not rely on a key that has no touch equivalent.

## Testing, and saying what you did not test

The tests drive the real page in headless Chrome, and simulated players give a rough idea of difficulty. They do
not tell you how a level feels. Nobody's hands are on the keys. Say so plainly when you report, and list what
you could not check.

## Where things are

```
src/00–04   boot, helpers, renderer, blocky people, scenery pieces
src/05, 06, 08   Hastings, the oldest level, with Winchester as a screen of its own (06 also holds some engine parts)
src/07_engine.js     fighting, AI, the player, collision, camera
src/07_inventory.js  coins, bread, loot, the pack, saving
src/07_levels.js     the level and screen registries, and the kit for new levels
src/07_talk.js       conversations with choices; things to press E on
src/levels/<id>/     one folder per level
src/10–12   screens and cards, input, the main loop
docs/template/level.js   a complete small level to copy
```
