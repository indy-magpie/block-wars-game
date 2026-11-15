"""Proves that a level needs nothing outside its own folder: drops docs/template/level.js into src/levels/, builds, plays it, then takes it out again."""
import asyncio, shutil, subprocess, sys
from lib import Game, ROOT
from smoke import smoke
async def main():
    dst = ROOT / 'src' / 'levels' / 'zz_template'
    dst.mkdir(exist_ok=True); shutil.copy(ROOT / 'docs' / 'template' / 'level.js', dst / 'level.js')
    try:
        subprocess.run([sys.executable, str(ROOT / 'build.py')], check=True)
        async with Game() as g:
            print('buttons:', await g.js("[...document.querySelectorAll('#eras .era')].map(b => b.id)"))
            print('built before it is chosen:', await g.js("window.__hastings.levels.tmpl.built"))
            info = await smoke(g, 'tmpl')
            ok = info['level'] == 'tmpl' and info['foes'] == 5 and info['hudShown']
            # talk to the elder with real keys, then let a simulated player win
            await g.js("() => { const p = window.__hastings.battle.player; p.x = -1.6; p.z = -7; }"); await g.pg.wait_for_timeout(500)
            await g.pg.keyboard.press('KeyE'); await g.pg.wait_for_timeout(500); t1 = await g.js("[window.__hastings.battle.phase, document.getElementById('talkWho').textContent]")
            await g.pg.keyboard.press('Digit1'); await g.pg.wait_for_timeout(300); t2 = await g.js("[window.__hastings.battle.phase, window.__hastings.levels.tmpl.world.warned]")
            print('talk:', t1, t2); ok = ok and t1[0] == 'talk' and t2 == ['fight', True]
            r = await g.js("() => { const H = window.__hastings, B = H.battle; B.autopilot = true; let t = 0; while (!B.over && t < 240) { H.step(1 / 30); t += 1 / 30; } B.autopilot = false; return [B.result, Math.round(t), B.player.kills]; }")
            print('fight:', r); ok = ok and r[0] in ('victory', 'fallen')
            await g.pg.wait_for_selector('#card:not([hidden])', timeout=30000); await g.pg.wait_for_timeout(300); await g.shot('template_card')
            print('card:', (await g.pg.inner_text('#card')).replace('\n', ' | ')[:160])
            await g.pg.click('#cardBtn0'); s = await g.until(lambda s: s['phase'] == 'fight' and not s['busy'] and not s['over']); print('again:', s['mode'], s['phase'])
            await g.pg.keyboard.press('KeyI'); await g.pg.wait_for_timeout(400); print('pack:', (await g.pg.inner_text('#card')).replace('\n', ' | ')[:120])
            print('errors:', g.errs); print('TEMPLATE', 'OK' if ok and not g.errs else 'FAILED')
    finally:
        shutil.rmtree(dst); subprocess.run([sys.executable, str(ROOT / 'build.py')], check=True)
if __name__ == '__main__': asyncio.run(main())
