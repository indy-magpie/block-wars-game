import asyncio, sys
from lib import Game
from collections import Counter
async def main():
    async with Game() as g:
        for how in ('absent', 'novice', 'masher'):
            r = await g.js('(h) => window.__hastings.simulate(16, h)', how)
            print('%-7s wins %2d/%d secs %3d kills %4.1f %s' % (how, sum(1 for x in r if x['result'] == 'victory'), len(r), sum(x['secs'] for x in r) / len(r), sum(x['kills'] for x in r) / len(r), dict(Counter(str(x['result']) for x in r))))
        await g.pg.click('#eraHastings'); await g.until(lambda s: s['mode'] == 'menu' and not s['busy']); await g.pg.wait_for_timeout(1500); await g.shot('h01_winchester')
        await g.pg.click('#btnNo'); await g.pg.wait_for_selector('#card:not([hidden])', timeout=30000); await g.pg.wait_for_timeout(500); await g.shot('h02_no')
        await g.pg.click('#cardBtn0'); await g.until(lambda s: s['mode'] == 'menu' and not s['busy'])
        await g.pg.click('#btnYes'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(600)
        r = await g.js('''() => { const H = window.__hastings, B = H.battle; B.autopilot = true; let n = 0; while (!B.over && n < 9000) { H.step(1/30); n++; } B.autopilot = false; return [n / 30, B.result, B.player.kills]; }''')
        print('live run', r)
        await g.pg.wait_for_selector('#card:not([hidden])', timeout=90000); await g.pg.wait_for_timeout(500); await g.shot('h03_end')
        await g.pg.click('#cardBtn1'); s = await g.until(lambda s: s['mode'] == 'menu' and not s['busy']); print('menu', s['mode'])
        await g.pg.click('#btnLevels'); s = await g.until(lambda s: s['mode'] == 'select' and not s['busy']); print('select', s['mode'])
        print('errors:', g.errs[:8])
asyncio.run(main())
