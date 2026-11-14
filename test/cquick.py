import asyncio, sys
from lib import Game
async def main():
    async with Game() as g:
        await g.shot('c40_select')
        await g.pg.click('#eraCarthage'); await g.pg.wait_for_timeout(1500); await g.shot('c41_interlude')
        await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.pg.wait_for_timeout(1200); await g.shot('c42_intro')
        await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(800)
        print('harbour', await g.js('window.__hastings.info()'))
        await g.js('window.__hastings.warp(4)'); await g.pg.wait_for_timeout(1500); print('streets', await g.js('window.__hastings.info()'))
        await g.js("() => { const B = window.__hastings.battle; B.player.hp = 0; B.player.alive = false; B.player.deathT = 0; }")
        await g.pg.wait_for_selector('#card:not([hidden])', timeout=90000); await g.pg.wait_for_timeout(400); await g.shot('c43_fallen')
        print('errors:', g.errs[:8])
asyncio.run(main())
