import asyncio, sys
from lib import Game
STEPS = sys.argv[1:] or ['select', 'intro', 'stages']
async def main():
    async with Game() as g:
        print('start', await g.st())
        if 'select' in STEPS: await g.shot('c00_select')
        await g.pg.click('#eraCarthage')
        s = await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); print('intro', s)
        if 'intro' in STEPS:
            await g.pg.wait_for_timeout(800); await g.shot('c01_intro')
        await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(1500)
        if 'intro' in STEPS: await g.shot('c02_harbour')
        if 'stages' in STEPS:
            for i, (dz, yaw) in enumerate([(0, 0), (30, 0), (0, 0), (0, 0), (0, 0), (0, 0), (0, 0)]):
                await g.js('(i) => window.__hastings.warp(i)', i)
                if dz: await g.js('(dz) => { const B = window.__hastings.battle; B.player.z += dz; }', dz)
                await g.pg.wait_for_timeout(2600)
                await g.shot('c1%d_stage' % i)
                print(i, await g.st())
        print('errors:', g.errs[:12])
asyncio.run(main())
