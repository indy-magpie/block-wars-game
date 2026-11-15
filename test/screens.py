"""Screens that are not a level being played (choosing a battle, Winchester), and how Hastings goes in and out of them.
Also a hot reload of the page, including from the mode names used before Winchester became a screen.
Run: python3 test/screens.py. Prints one line per check, and exits with an error if any check fails."""
import asyncio, json, sys
from lib import Game
fails = []
def check(name, ok, got=''):
    print(('ok    ' if ok else 'FAIL  ') + name + ('' if ok else '   got: ' + str(got)))
    if not ok: fails.append(name)
async def card(g): return await g.js("document.getElementById('card').hidden ? null : document.getElementById('cardTitle').textContent")
async def body(g): return await g.js("document.getElementById('cardBody').textContent")
async def buttons(g): return await g.js("[...document.querySelectorAll('#cardChoices button')].map(b => b.textContent)")
async def press(g, code, ms=350): await g.pg.keyboard.press(code); await g.pg.wait_for_timeout(ms)
async def wait_card(g):
    try: await g.pg.wait_for_selector('#card:not([hidden])', timeout=30000)
    except Exception: pass
    await g.pg.wait_for_timeout(300); return await card(g)
async def into_fight(g):
    s = await g.until(lambda s: s['phase'] == 'intro' and not s['busy'])
    await g.js('window.__hastings.skip()'); return await g.until(lambda s: s['phase'] == 'fight')

async def flow():
    async with Game() as g:
        s = await g.st(); check('the page opens on the select screen', s['mode'] == 'select', s)
        await press(g, 'KeyI'); t = await body(g)
        check('the Pack opens on the select screen', await card(g) == 'Pack', await card(g))
        check('  and counts plain coins there', 'coins' in t and 'penn' not in t, t[:60])
        await press(g, 'KeyI'); check('  and closes again', await card(g) is None, await card(g))

        await g.pg.click('#eraHastings'); s = await g.until(lambda s: s['mode'] == 'winchester' and not s['busy'])
        check('Hastings opens on Winchester', s['mode'] == 'winchester', s)
        shown = await g.js("({ dialogue: !document.getElementById('dialogue').hidden, battles: !document.getElementById('btnLevels').hidden, hud: !document.getElementById('hud').hidden })")
        check('  with the question and the Battles button, and no fight HUD', shown == {'dialogue': True, 'battles': True, 'hud': False}, shown)
        await press(g, 'KeyI'); t = await body(g)
        check('  the Pack there counts silver pennies', 'silver penn' in t, t[:60])
        await press(g, 'KeyI')

        await press(g, 'KeyN', 100); title = await wait_card(g)
        check('N says no and shows "England stands alone"', title == 'England stands alone', title)
        await g.pg.click('#cardBtn0'); s = await g.until(lambda s: s['mode'] == 'winchester' and not s['busy'])
        check('  and its button goes back to Winchester', s['mode'] == 'winchester' and await card(g) is None, s)

        await press(g, 'KeyY', 100); s = await g.until(lambda s: s['phase'] == 'intro' and not s['busy'])
        check('Y says yes and the battle opens, in mode "hastings"', s['mode'] == 'hastings' and s['phase'] == 'intro', s)
        s = await into_fight(g); check('  and the fight starts', s['phase'] == 'fight', s)
        await press(g, 'KeyP'); check('P pauses', await card(g) == 'Paused', await card(g))
        await press(g, 'KeyP'); check('P resumes', await card(g) is None, await card(g))
        await press(g, 'KeyI'); t = await body(g)
        check('the Pack in the fight lists the Hastings kit', 'Battle axe' in t and 'silver penn' in t, t[:90])
        await press(g, 'KeyI')

        ends = [("B.player.hp = 0; B.player.alive = false;", 'You have fallen'),
                ("B.harold.hp = 0; B.harold.alive = false;", 'Harold has fallen'),
                ("B.william.hp = 0; B.william.alive = false;", 'Victory')]
        for i, (how, want) in enumerate(ends):
            await g.js("(() => { const B = window.__hastings.battle; %s })()" % how); title = await wait_card(g)
            check('the end card reads "%s"' % want, title == want, title)
            b = await buttons(g); check('  with Fight again and Return to Winchester', b == ['Fight again', 'Return to Winchester'], b)
            if i < len(ends) - 1:
                await g.pg.click('#cardBtn0'); s = await into_fight(g)
                check('  and Fight again starts a fresh battle', s['mode'] == 'hastings' and s['phase'] == 'fight' and not s['over'], s)
        await g.pg.click('#cardBtn1'); s = await g.until(lambda s: s['mode'] == 'winchester' and not s['busy'])
        check('Return to Winchester goes back to Winchester', s['mode'] == 'winchester' and await card(g) is None, s)
        await g.pg.click('#btnLevels'); s = await g.until(lambda s: s['mode'] == 'select' and not s['busy'])
        check('the Battles button goes back to the select screen', s['mode'] == 'select', s)
        check('no script errors', not g.errs, g.errs[:5])

async def reload(data, want):
    async with Game(init='window.claude = { hot: { data: %s } };' % json.dumps(data)) as g:
        s = await g.until(lambda s: s['mode'] == want[0] and s['phase'] == want[1] and not s['busy'], tries=60)
        check('a reload from %s comes back to %s' % (json.dumps(data), want), (s['mode'], s['phase']) == want, s)
        if g.errs: check('  without script errors', False, g.errs[:5])

async def main():
    await flow()
    for data, want in [({'mode': 'menu'}, ('winchester', 'idle')), ({'mode': 'winchester'}, ('winchester', 'idle')),
                       ({'mode': 'battle'}, ('hastings', 'intro')), ({'mode': 'select'}, ('select', 'idle')),
                       ({'mode': 'carthage', 'stage': 2}, ('carthage', 'fight')), ({'mode': 'sogdiana'}, ('sogdiana', 'intro'))]:
        await reload(data, want)
    print('\n%d failed' % len(fails) if fails else '\nall passed')
    sys.exit(1 if fails else 0)
asyncio.run(main())
