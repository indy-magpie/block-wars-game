import asyncio, sys, json
from lib import Game
async def main():
    async with Game() as g:
        H = 'window.__hastings'
        await g.shot('t00_select')
        await g.pg.click('#eraCarthage'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy'])
        await g.js(H + '.skip()'); await g.pg.wait_for_timeout(700)
        # jump
        await g.pg.keyboard.down('Space'); top = 0
        for _ in range(14):
            top = max(top, await g.js(H + '.battle.player.jy')); await g.pg.wait_for_timeout(60)
        await g.pg.keyboard.up('Space'); print('jump apex seen', round(top, 2))
        # hop onto a crate: stand south of it and walk north while jumping
        await g.js("() => { const p = " + H + ".battle.player; p.x = -7.7; p.z = 10.2; p.jy = 0; p.jv = 0; }")
        await g.pg.keyboard.down('KeyW'); await g.pg.keyboard.down('Space'); await g.pg.wait_for_timeout(700); await g.pg.keyboard.up('Space')
        await g.shot('t01_jump'); await g.pg.wait_for_timeout(500); await g.pg.keyboard.up('KeyW'); await g.pg.wait_for_timeout(700)
        print('on crate', await g.js("() => { const p = " + H + ".battle.player; return [+p.x.toFixed(2), +p.z.toFixed(2), +p.gy.toFixed(2), +p.jy.toFixed(2)]; }"))
        # loot: fell one enemy with F, then let the coins come in
        await g.js(H + '.warp(2)')
        await g.js("() => { const B = " + H + ".battle, p = B.player, e = B.nor.find(u => !u.fixed); e.hold = false; e.x = p.x; e.z = p.z + 1.4; e.hp = 1; e.loot = 5; Math.random = () => .05; }")
        await g.pg.keyboard.down('KeyF'); await g.pg.wait_for_timeout(900); await g.pg.keyboard.up('KeyF')
        print('drops', await g.js(H + '.drops.map(d => d.kind + d.v)'), 'kills', await g.js(H + '.battle.player.kills'))
        await g.pg.wait_for_timeout(2500); await g.shot('t02_loot')
        print('purse', await g.js(H + '.inv.coins()'), 'bread', await g.js(H + ".inv.count('bread')"), 'hud', await g.pg.inner_text('#coins'), await g.pg.inner_text('#nBread'))
        # bread
        await g.js("() => { " + H + ".inv.give('bread', 2); " + H + ".battle.player.hp = 40; }")
        await g.pg.keyboard.press('Digit1'); await g.pg.wait_for_timeout(300)
        print('after bread hp', await g.js('Math.round(' + H + '.battle.player.hp)'), 'left', await g.js(H + ".inv.count('bread')"))
        # pack
        await g.pg.keyboard.press('KeyI'); await g.pg.wait_for_timeout(500); await g.shot('t03_pack')
        print('pack open', await g.pg.is_visible('#card'), await g.pg.inner_text('#cardTitle'))
        await g.pg.keyboard.press('Escape'); await g.pg.wait_for_timeout(300); print('pack closed', not await g.pg.is_visible('#card'))
        await g.pg.wait_for_timeout(1200); await g.shot('t04_hud')
        print('saved locally', await g.js("localStorage.getItem('blockwars.save')"))
        print('errors:', g.errs[:8])
asyncio.run(main())
