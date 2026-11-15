import asyncio, sys, json
from lib import Game
MOCK = """
window.__docs = { 'data/users/u_test/blockwars': Object.freeze({ coins: 50, items: Object.freeze({ bread: 3 }), at: Date.now() + 5000 }) };
window.__sets = 0;
window.claude = { use: async (n) => n === 'user' ? { id: async () => 'u_test' } : n === 'db' ? { doc: (path) => ({
  get: async () => ({ exists: path in window.__docs, data: () => window.__docs[path] }),
  set: async (d) => { window.__docs[path] = JSON.parse(JSON.stringify(d)); window.__sets++; } }) } : null };
"""
H = 'window.__hastings'
async def main():
    async with Game(MOCK) as g:
        await g.pg.wait_for_timeout(600)
        print('loaded from store:', await g.js(H + '.inv.coins()'), await g.js(H + ".inv.count('bread')"), '| select line:', await g.pg.inner_text('#selCoins'), await g.pg.inner_text('#selBread'))
        await g.js(H + '.inv.addCoins(2)'); await g.js(H + '.save.flush()'); await g.pg.wait_for_timeout(300)
        print('written back:', await g.js("JSON.stringify(window.__docs['data/users/u_test/blockwars'])"), 'sets', await g.js('window.__sets'))
        print('errors:', g.errs[:5])
    async with Game() as g:
        await g.pg.click('#eraCarthage'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.js(H + '.skip()'); await g.pg.wait_for_timeout(500)
        # drop onto the crate from above, then walk off it
        await g.js("() => { const p = " + H + ".battle.player; p.x = -7.7; p.z = 11.8; p.jy = 1.6; p.jv = 0; }"); await g.pg.wait_for_timeout(900)
        print('landed on crate (gy, jy):', await g.js("() => { const p = " + H + ".battle.player; return [+p.gy.toFixed(2), +p.jy.toFixed(2)]; }"))
        await g.pg.keyboard.down('KeyS'); await g.pg.wait_for_timeout(900); await g.pg.keyboard.up('KeyS'); await g.pg.wait_for_timeout(500)
        print('walked off (z, gy, jy):', await g.js("() => { const p = " + H + ".battle.player; return [+p.z.toFixed(2), +p.gy.toFixed(2), +p.jy.toFixed(2)]; }"))
        # a crate is a wall when you are beside it
        await g.js("() => { const p = " + H + ".battle.player; p.x = -7.7; p.z = 10.2; }"); await g.pg.keyboard.down('KeyW'); await g.pg.wait_for_timeout(900); await g.pg.keyboard.up('KeyW')
        print('blocked by crate (z):', await g.js('+' + H + '.battle.player.z.toFixed(2)'))
        await g.pg.wait_for_timeout(300); await g.shot('t05_hud_top')
        # Hastings: F hits, Space jumps, boulders are there
        await g.pg.keyboard.press('KeyP'); await g.pg.wait_for_timeout(200)
        await g.js("() => { document.getElementById('cardBtn0').click(); }")
        await g.js(H + ".battle.player.hp = 0; " + H + ".battle.player.alive = false; " + H + ".battle.player.deathT = 0;")
        await g.pg.wait_for_selector('#cardBtn1', timeout=60000); await g.pg.wait_for_timeout(300); await g.pg.click('#cardBtn1')
        await g.until(lambda s: s['mode'] == 'select' and not s['busy'])
        await g.pg.click('#eraHastings'); await g.until(lambda s: s['mode'] == 'winchester' and not s['busy'])
        await g.pg.click('#btnYes'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.js(H + '.skip()'); await g.pg.wait_for_timeout(400)
        await g.js("() => { const B = " + H + ".battle, p = B.player; p.x = -13; p.z = -6.2; }")
        await g.pg.keyboard.down('KeyW'); await g.pg.keyboard.down('Space'); await g.pg.wait_for_timeout(450); await g.pg.keyboard.up('Space'); await g.pg.keyboard.up('KeyW'); await g.pg.wait_for_timeout(500)
        print('hastings boulder (z, gy):', await g.js("() => { const p = " + H + ".battle.player; return [+p.z.toFixed(2), +p.gy.toFixed(2)]; }"), 'rects', await g.js(H + '.battle.rects.length'))
        await g.shot('t06_boulder')
        print('errors:', g.errs[:8])
asyncio.run(main())
