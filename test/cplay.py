import asyncio, sys
from lib import Game
FF = '''(secs) => { const H = window.__hastings, B = H.battle; B.autopilot = true; let n = Math.round(secs * 30); while (n-- > 0 && !B.over) H.step(1/30); B.autopilot = false; return H.state(); }'''
async def main():
    async with Game() as g:
        await g.pg.click('#eraCarthage'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy'])
        await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(600)
        # the Scipio scene, played for real
        await g.js('window.__hastings.warp(1)'); await g.js('() => { window.__hastings.battle.player.z = 103; }')
        await g.pg.keyboard.down('KeyW'); s = await g.until(lambda s: s['phase'] == 'cut', 60); await g.pg.keyboard.up('KeyW'); print('cut', s)
        s = await g.until(lambda s: s['phase'] == 'fight' and s['done'], 200); print('after cut', s)
        # arrows on the assault front
        await g.js('window.__hastings.warp(2)'); await g.js('() => { const B = window.__hastings.battle; B.player.z = 200; for (const u of B.sax) if (!u.isPlayer) u.z += 40; window.__hastings.carth.volleyT = .3; }')
        for _ in range(80):
            n = await g.js('window.__hastings.carth.arrows.filter(a => !a.stuck).length')
            if n >= 6: break
            await g.pg.wait_for_timeout(120)
        await g.pg.keyboard.down('ShiftLeft'); await g.pg.wait_for_timeout(500); await g.shot('c20_volley'); await g.pg.keyboard.up('ShiftLeft')
        print('volley', await g.js('() => { const H = window.__hastings; return { arrows: H.carth.arrows.length, hp: Math.round(H.battle.player.hp) }; }'))
        await g.js(FF, 14); await g.pg.wait_for_timeout(900); await g.shot('c21_front_fight')
        await g.js('window.__hastings.warp(3)'); await g.js(FF, 9); await g.pg.wait_for_timeout(900); await g.shot('c22_breach_fight')
        await g.js('window.__hastings.warp(4)'); await g.js(FF, 7); await g.pg.wait_for_timeout(900); await g.shot('c23_street_fight')
        await g.js('window.__hastings.warp(4, 1)'); await g.js(FF, 6); await g.pg.wait_for_timeout(900); await g.shot('c24_market')
        await g.js('window.__hastings.warp(5, 1)'); await g.js(FF, 7); await g.pg.wait_for_timeout(900); await g.shot('c25_temple_fight')
        await g.js('window.__hastings.warp(6, 2)'); await g.js(FF, 5); await g.pg.wait_for_timeout(900); await g.shot('c26_boss')
        # the player falls, then tries again from the same small checkpoint
        await g.js("() => { const B = window.__hastings.battle; B.player.hp = 0; B.player.alive = false; B.player.deathT = 0; }")
        await g.pg.wait_for_selector('#card:not([hidden])', timeout=90000); await g.pg.wait_for_timeout(400); await g.shot('c27_fallen')
        await g.pg.click('#cardBtn0'); s = await g.until(lambda s: s['phase'] == 'fight' and not s['busy'] and not s['over']); print('retry', s, await g.js('window.__hastings.carth.wave'))
        # win
        await g.js("() => { const H = window.__hastings, b = H.carth.boss; b.hp = 1; }"); r = await g.js(FF, 120); print('ff', r)
        await g.pg.wait_for_timeout(2500); await g.shot('c28_surrender')
        await g.pg.wait_for_selector('#card:not([hidden])', timeout=90000); await g.pg.wait_for_timeout(400); await g.shot('c29_victory')
        await g.pg.click('#cardBtn1'); s = await g.until(lambda s: s['mode'] == 'select' and not s['busy']); print('select', s)
        # Hastings still works
        await g.pg.click('#eraHastings'); s = await g.until(lambda s: s['mode'] == 'menu' and not s['busy']); await g.pg.wait_for_timeout(1500); await g.shot('c30_winchester')
        await g.pg.click('#btnYes'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.js('window.__hastings.skip()')
        await g.pg.keyboard.down('KeyW'); await g.pg.keyboard.down('Space'); await g.pg.wait_for_timeout(9000); await g.pg.keyboard.up('KeyW'); await g.pg.keyboard.up('Space'); await g.shot('c31_hastings')
        print('hastings', await g.st(), await g.js('() => { const B = window.__hastings.battle; return [B.t, B.sax.filter(u => u.alive).length, B.nor.filter(u => u.alive).length, B.player.kills]; }'))
        print('errors:', g.errs[:12])
asyncio.run(main())
