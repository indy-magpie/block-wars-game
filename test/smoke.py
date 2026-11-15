"""Smoke test for any level: python3 test/smoke.py <id>. Chooses it from the select screen, waits for the fight to start, takes a screenshot and reports script errors."""
import asyncio, sys
from lib import Game
async def smoke(g, lid):
    await g.pg.click('#era' + lid[0].upper() + lid[1:])
    for _ in range(200):
        s = await g.st()
        if s['phase'] in ('intro', 'cut') and not s['busy']: await g.js('window.__hastings.skip()')
        if s['phase'] == 'fight' and not s['busy']: break
        await g.pg.wait_for_timeout(150)
    await g.pg.wait_for_timeout(600); await g.shot('smoke_' + lid)
    info = await g.js("(() => { const H = window.__hastings, B = H.battle; return { level: B.level, phase: B.phase, units: B.units.length, friends: B.sax.length, foes: B.nor.length, hudShown: !document.getElementById('hud').hidden, draw: H.info() }; })()")
    print(lid, info); return info
async def main():
    lid = sys.argv[1] if len(sys.argv) > 1 else 'hastings'
    async with Game() as g:
        if lid == 'hastings':      # Hastings starts in Winchester: answer yes
            await g.pg.click('#eraHastings'); await g.until(lambda s: s['mode'] == 'winchester' and not s['busy']); await g.pg.click('#btnYes')
            await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(600); await g.shot('smoke_hastings'); print(await g.st())
        else: await smoke(g, lid)
        print('errors:', g.errs)
if __name__ == '__main__': asyncio.run(main())
