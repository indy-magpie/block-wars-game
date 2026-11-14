"""Moving between Sogdiana and the other levels: play again, other battles, and back."""
import asyncio
from lib import Game
async def main():
    async with Game() as g:
        await g.pg.click('#eraSogdiana'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(300)
        await g.js("() => { const H = window.__hastings, S = H.sog; S.flags.briefed = true; S.flags.token = true; S.flags.chief = 'paid'; S.flags.end = 'token'; S.boss.alive = false; S.boss.gone = true; }")
        await g.pg.wait_for_selector('#card:not([hidden])', timeout=40000); print('won', await g.st())
        await g.pg.click('#cardBtn0'); s = await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); print('play again', s, await g.js("[window.__hastings.sog.flags.briefed, window.__hastings.sog.flags.token]"))
        await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(300)
        await g.js("() => { const B = window.__hastings.battle; B.player.hp = 0; B.player.alive = false; B.player.deathT = 0; }")
        await g.pg.wait_for_selector('#card:not([hidden])', timeout=40000); await g.pg.click('#cardBtn1'); s = await g.until(lambda s: s['mode'] == 'select' and not s['busy']); print('other battles', s)
        await g.pg.wait_for_timeout(400); await g.pg.click('#eraCarthage'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(700)
        print('carthage hud', await g.js("[document.getElementById('tallyC').hidden, document.getElementById('tallyS').hidden, document.getElementById('stage').getAttribute('data-level'), document.getElementById('prompt').hidden]")); await g.shot('f01_carthage_after')
        await g.js("() => { const B = window.__hastings.battle; B.player.hp = 0; B.player.alive = false; B.player.deathT = 0; }")
        await g.pg.wait_for_selector('#card:not([hidden])', timeout=40000); await g.pg.click('#cardBtn1'); await g.until(lambda s: s['mode'] == 'select' and not s['busy'])
        await g.pg.wait_for_timeout(400); await g.pg.click('#eraSogdiana'); s = await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(700)
        print('sogdiana again', await g.st(), await g.js("[document.getElementById('tallyC').hidden, document.getElementById('tallyS').hidden, document.getElementById('sGoal').textContent]")); await g.shot('f02_sogdiana_again')
        print('errors:', g.errs)
asyncio.run(main())
