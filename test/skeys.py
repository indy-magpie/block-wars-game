"""Sogdiana with real key presses: walk up to Coenus, E to talk, number keys to answer; the select screen and the pack."""
import asyncio
from lib import Game
async def main():
    async with Game() as g:
        await g.pg.wait_for_timeout(300); await g.shot('k00_select')
        await g.pg.click('#eraSogdiana'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy'])
        await g.pg.keyboard.press('KeyW'); await g.until(lambda s: s['phase'] == 'fight'); await g.pg.wait_for_timeout(300)   # any key skips the fly-in
        await g.js("() => { const H = window.__hastings; H.save.data.coins = 0; H.inv.addCoins(0); }")
        await g.pg.keyboard.down('KeyW')
        for _ in range(60):      # the headless renderer is slow, so hold the key until the prompt shows
            if not await g.js("document.getElementById('prompt').hidden"): break
            await g.pg.wait_for_timeout(100)
        await g.pg.keyboard.up('KeyW'); await g.pg.wait_for_timeout(300)
        print('prompt', await g.js("[document.getElementById('prompt').hidden, document.getElementById('promptText').textContent]"))
        await g.shot('k01_prompt')
        await g.pg.keyboard.press('KeyE'); await g.pg.wait_for_timeout(900)
        print('talk', await g.js("[document.getElementById('talk').hidden, document.getElementById('talkWho').textContent, window.__hastings.battle.phase]")); await g.shot('k02_talk')
        await g.pg.keyboard.press('Digit1'); await g.pg.wait_for_timeout(300); await g.pg.keyboard.press('Enter'); await g.pg.wait_for_timeout(300); await g.pg.keyboard.press('Digit1'); await g.pg.wait_for_timeout(500)
        print('after', await g.js("[document.getElementById('talk').hidden, window.__hastings.battle.phase, window.__hastings.sog.flags.briefed, window.__hastings.inv.coins(), document.getElementById('sGoal').textContent]"))
        # the block key creeps; E still turns the camera when there is nothing to talk to
        await g.js("() => { const p = window.__hastings.battle.player; p.x = 12; p.z = 14; }")
        y0 = await g.js("window.__hastings.cam.yaw"); await g.pg.keyboard.down('KeyE'); await g.pg.wait_for_timeout(400); await g.pg.keyboard.up('KeyE'); y1 = await g.js("window.__hastings.cam.yaw")
        await g.pg.keyboard.down('ShiftLeft'); await g.pg.keyboard.down('KeyW'); await g.pg.wait_for_timeout(700); sn = await g.js("[window.__hastings.battle.player.sneak, Math.hypot(window.__hastings.battle.player.vx, window.__hastings.battle.player.vz).toFixed(1)]"); await g.shot('k03_sneak')
        await g.pg.keyboard.up('KeyW'); await g.pg.keyboard.up('ShiftLeft')
        print('camera turned by E', round(y0 - y1, 2), 'sneak', sn)
        await g.pg.keyboard.press('KeyI'); await g.pg.wait_for_timeout(500); await g.shot('k04_pack'); print('pack:', (await g.pg.inner_text('#card'))[:200].replace('\n', ' | ')); await g.pg.keyboard.press('Escape')
        # a talk with choices, one of them too dear
        await g.js("() => { const H = window.__hastings, p = H.battle.player; H.save.data.coins = 9; H.inv.addCoins(0); p.x = -10.5; p.z = 78.2; p.yaw = 0; H.cam.yaw = 0; H.sog.flags.robe = true; H.sog.flags.gatePass = true; H.sog.flags.inTown = true; }")
        await g.pg.wait_for_timeout(500); await g.pg.keyboard.press('KeyE'); await g.pg.wait_for_timeout(1600); await g.shot('k05_potter')
        print('choices', await g.js("[...document.querySelectorAll('#talkChoices button')].map(b => [b.textContent, b.disabled])"))
        await g.pg.keyboard.press('Digit1'); await g.pg.wait_for_timeout(200); print('dear choice ignored', await g.js("[document.getElementById('talk').hidden, window.__hastings.sog.flags.potter]"))
        await g.pg.keyboard.press('Digit4'); await g.pg.wait_for_timeout(300); print('left', await g.js("[document.getElementById('talk').hidden, window.__hastings.battle.phase]"))
        print('errors:', g.errs)
asyncio.run(main())
