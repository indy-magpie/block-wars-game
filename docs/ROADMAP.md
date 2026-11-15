# Roadmap: eras that could come next

The game is meant to run from the deep Palaeolithic to roughly today. Three levels exist. Everything else in
this file is a **suggestion to choose from, not a plan**: the levels so far each came from Indy's son's own
description, and the next ones should too. Nothing here is decided until there is a brief in `docs/briefs/`.

This file is edited on `main` only. A session that takes on an era writes `docs/briefs/<id>.md` on its own
branch and records its progress there, so two sessions never edit the same file.

## Built

| When | Level | Id | What the player does |
| --- | --- | --- | --- |
| 328 BC | Sogdiana | `sogdiana` | Slips into the fort of Gabae and captures Spitamenes: stealth, talk, choices. |
| 146 BC | Carthage | `carthage` | Storms the city with Scipio's legions through seven checkpoints. |
| 1066 | Hastings | `hastings` | Stands with Harold's shield wall against William. |

## Ideas that fit the engine as it is

These could each be started today, in parallel, inside a level folder.

| When | Working title | What the player might do |
| --- | --- | --- |
| 490 BC | Marathon | Charge with the Athenian line across the plain, break the Persian wings, then run the news to Athens against the clock. |
| AD 60 | Boudica | Hold a street of Roman Colchester, or ride out with the Iceni: a choice of side is a design question for the brief. |
| AD 793 | Lindisfarne | A monk gets the monastery's treasures to the boats as the longships land. No fighting to win: carrying, running, choosing what to save. (Better still once raiders can see and search, as Sogdiana's guards do: see below.) |
| 1666 | The Great Fire of London | No enemies at all: pull down houses, carry water, lead people to the river. |

## Ideas that need the engine to learn something first

Each needs an engine change made once, on its own branch, before any level uses it (`CLAUDE.md`, rule 4).

| When | Working title | What the player might do | The engine would need |
| --- | --- | --- | --- |
| c. 40,000 BC | The mammoth steppe | Track a mammoth with the band and get the meat home past cave lions. | Four-legged animals as units; a thrown spear. |
| c. 2500 BC | Stonehenge | Haul a sarsen into place and see off a rival band. | Dragging or carrying a load as a team. |
| 1274 BC | Kadesh | Drive with Ramesses' chariots against the Hittites. | Something to ride. |
| 1415 | Agincourt | An English archer: plant stakes, loose volleys, then fight in the mud. | A bow for the player. |
| 1588 | The Armada | Fight across the decks, cut the grappling lines, fire the guns. | Guns that are aimed and fired; moving decks if the ships are to roll. |
| 1805 | Trafalgar | A powder monkey on Victory's gun deck. | The same guns. |
| 1815 | Waterloo | Help shut the gate at Hougoumont. | Muskets: the player's bow, slower and louder. |
| 1940 | Dunkirk | Take a little ship across and bring soldiers home. | A boat to steer. |
| 1969 | The Moon | Explore, collect rocks, plant the flag. | Jump height and gravity set per level (a small change: they are engine-wide numbers today). |

A bow for the player unlocks four of these, so it is the engine change most worth making first.

## Before any of these

- **The twentieth century needs a parent's decision on tone** before a brief is written.
- **Guards who see and give chase** (from Sogdiana) would suit Lindisfarne and others, and should be lifted
  into the engine before a second level uses them.
- **Play-testing comes first.** Nobody has yet played Sogdiana by hand. What its player finds too hard, too
  easy or confusing should change the template before many levels are built on it.
