"""Sogdiana: play the routes through with the real player code (keys and camera), fast-forwarded."""
import asyncio, sys, json
from lib import Game
JS = r'''
window.T = {
  H: window.__hastings,
  tp(x, z, yaw) { const H = this.H, p = H.battle.player; p.x = x; p.z = z; p.vx = p.vz = 0; if (yaw !== undefined) { p.yaw = yaw; H.cam.yaw = yaw; } H.cam.tx = x; H.cam.tz = z; },
  ff(secs) { const H = this.H, B = H.battle; let n = Math.round(secs * 30); while (n-- > 0 && !B.over && B.phase === 'fight') H.step(1 / 30); return this.st(); },
  /* walk in straight legs through the points given, using the same input the keyboard gives */
  walk(pts, sneak, max) {
    const H = this.H, B = H.battle, p = B.player; let t = 0; max = max || 60;
    for (const q of pts) {
      while (Math.hypot(q[0] - p.x, q[1] - p.z) > .45 && t < max && !B.over && B.phase === 'fight') {
        H.cam.yaw = Math.atan2(q[0] - p.x, q[1] - p.z); H.keys.up = true; H.keys.block = !!sneak; H.keys.jump = !!q[2] && p.jy <= 0; H.step(1 / 30); t += 1 / 30;
      }
    }
    H.keys.up = false; H.keys.block = false; H.keys.jump = false; return this.st();
  },
  act(picks) { const H = this.H; if (!H.act()) return 'no act: ' + (H.battle.actText || 'none'); for (const i of picks || []) { if (H.battle.phase !== 'talk') break; H.pick(i); } return document.getElementById('talk').hidden ? 'done' : 'talk open: ' + document.getElementById('talkLine').textContent; },
  prompt() { const H = this.H; H.ff = 0; H.step(1 / 30); return H.battle.actText; },
  st() { const H = this.H, B = H.battle, S = H.sog, p = B.player, F = S.flags, z = {}; for (const k in S.zones) if (S.zones[k].state !== 'calm') z[k] = S.zones[k].state;
    return { at: [+p.x.toFixed(1), +p.z.toFixed(1)], hp: Math.round(p.hp), phase: B.phase, over: B.over, res: B.result, place: S.place, zones: z, coins: H.inv.coins(),
      F: Object.keys(F).filter(k => F[k] && typeof F[k] !== 'object').map(k => k + (F[k] === true ? '' : '=' + F[k])).join(' ') }; }
};
'''
async def fresh(g):
    await g.js("() => { const H = window.__hastings; H.save.data.coins = 0; H.save.data.items = {}; H.begin(true); H.sog.log = []; }")
async def main():
    which = sys.argv[1:] or ['A', 'B', 'C', 'D']
    async with Game() as g:
        await g.pg.click('#eraSogdiana'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(300)
        await g.js(JS)
        if 'A' in which:
            print('== A: robe, pay the potter, password, seize ==')
            await fresh(g)
            print(await g.js("T.walk([[0, 0.2]])")); print('coenus', await g.js("T.act([0, 0, 0])"), await g.js("T.st()"))
            print(await g.js("T.walk([[1.8, 6], [1.5, 26], [6.8, 30.3]])")); print('trader', await g.js("T.act([0])"), await g.js("T.st()"))
            await g.pg.wait_for_timeout(500); await g.shot('r01_robe')
            print('to gate', await g.js("T.walk([[0, 40], [0, 53]])"))
            print('up street', await g.js("T.walk([[1.6, 60], [0, 75], [-8, 77.6], [-10.5, 78]])")); await g.pg.wait_for_timeout(400); await g.shot('r02_potter')
            print('potter', await g.js("T.act([0, 0, 0])"), await g.js("T.st()"))
            print('to citadel', await g.js("T.walk([[0, 80], [0, 92.6]])")); print('door', await g.js("T.act([0, 0])"), await g.js("T.st()"))
            print('in', await g.js("T.walk([[0, 101], [11.5, 113.5], [12.6, 122.4], [16.5, 124.5], [14.6, 132], [12.6, 132]])")); await g.pg.wait_for_timeout(400); await g.shot('r03_sidedoor')
            # wait until Spitamenes looks south, then creep round behind him
            r = await g.js("""() => { const H = T.H, b = H.sog.boss; let t = 0; while (!(b.ti === 0 && b.turnT > 4.6) && t < 20) { H.step(1 / 30); t += 1 / 30; } return [t, b.ti, b.turnT]; }"""); print('wait', r)
            print('creep', await g.js("T.walk([[10, 132.2], [9.8, 133.6], [1.2, 133.6], [.3, 133.3]], true)"), await g.js("T.prompt()"))
            await g.pg.wait_for_timeout(400); await g.shot('r04_behind')
            print('seize', await g.js("T.act([0])"), await g.js("T.st()"))
            await g.pg.wait_for_selector('#card:not([hidden])', timeout=20000); await g.pg.wait_for_timeout(500); await g.shot('r05_card')
            print('card:', (await g.pg.inner_text('#card'))[:700].replace('\n', ' | '))
        print('alarm log:', await g.js('T.H.sog.log'))
        print('alarm log:', await g.js('window.__hastings.sog.log'))
        print('errors:', g.errs)
if __name__ == '__main__': asyncio.run(main())
