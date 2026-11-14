"""Sogdiana: smoke test and a look at the main places."""
import asyncio, sys, json
from lib import Game
async def main():
    async with Game() as g:
        await g.pg.click('#eraSogdiana'); s = await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); print('intro', s)
        await g.pg.wait_for_timeout(1500); await g.shot('s00_intro')
        await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(700); await g.shot('s01_camp')
        print('info', await g.js('window.__hastings.info()'))
        print('acts', await g.js('window.__hastings.sog.acts.length'), 'guards', await g.js('window.__hastings.sog.guards.length'), 'civ', await g.js('window.__hastings.sog.civ.units.length'))
        spots = {'s02_road': (0, 22, 0), 's03_caravan': (5, 30, 1.3), 's04_gate': (0, 40, 0), 's05_breach': (-42, 68, 1.57), 's06_bazaar_s': (0, 60, 0), 's07_potter': (-8, 75, -.5),
                 's08_eaststreet': (17, 78, 1.57), 's09_camp_riders': (46, 79, 1.57), 's10_citgate': (0, 88, 0), 's11_grate': (30, 118.2, -1.57), 's12_court': (17, 121, -2.2), 's13_hall': (9.5, 133.8, -1.57), 's14_yard': (26, 92, 2.6)}
        which = sys.argv[1:] or list(spots)
        for name in which:
            x, z, yaw = spots[name]
            await g.js('''(a) => { const H = window.__hastings, B = H.battle, p = B.player; p.x = a[0]; p.z = a[1]; p.yaw = a[2]; H.cam.yaw = a[2]; H.cam.tx = a[0]; H.cam.tz = a[1]; for (const g of H.sog.guards) g.sus = 0; }''', [x, z, yaw])
            await g.pg.wait_for_timeout(900); await g.shot(name)
        print('errors:', g.errs)
asyncio.run(main())
