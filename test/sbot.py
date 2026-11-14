"""Sogdiana: what happens to players who do not sneak. Simulated, so a rough guide only."""
import asyncio, json
from lib import Game
from sroute import JS
async def main():
    async with Game() as g:
        await g.pg.click('#eraSogdiana'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(300)
        await g.js(JS)
        S0 = "(o) => { const H = window.__hastings; H.save.data.coins = o.coins || 0; H.save.data.items = {}; H.begin(true); H.sog.log = []; Object.assign(H.sog.flags, o.flags || {}); if (o.at) T.tp(o.at[0], o.at[1], 0); }"
        # 1 no disguise, bribed in, strolls up the main street to the potter and on to the citadel gate
        out = []
        for k in range(6):
            await g.js(S0, {'flags': {'briefed': True, 'gatePass': True, 'gate': 'bribe'}, 'at': [0, 46]})
            await g.js("(k) => T.ff(k * 3.1)", k)      # start at a different point in the patrols each time
            r = await g.js("T.walk([[0, 60], [0, 75], [-8, 77.6], [-10.5, 78.2]], false, 40)"); out.append([r['hp'], list(r['zones'].values()), r['at']])
        print('stroll, no disguise  (hp, alarm, got to):', out)
        out = []
        for k in range(6):
            await g.js(S0, {'flags': {'briefed': True, 'gatePass': True, 'gate': 'bribe'}, 'at': [0, 46]})
            await g.js("(k) => T.ff(k * 3.1)", k)
            r = await g.js("T.walk([[0, 60], [0, 75], [-8, 77.6], [-10.5, 78.2]], true, 60)"); out.append([r['hp'], list(r['zones'].values()), r['at']])
        print('creep, no disguise   (hp, alarm, got to):', out)
        out = []
        for k in range(6):
            await g.js(S0, {'flags': {'briefed': True, 'robe': True}, 'at': [0, 46]})
            await g.js("(k) => T.ff(k * 3.1)", k)
            r = await g.js("T.walk([[0, 60], [0, 75], [-8, 77.6], [-10.5, 78.2], [0, 80], [0, 92.4]], false, 60)"); out.append([r['hp'], list(r['zones'].values()), r['at']])
        print('stroll in the robe   (hp, alarm, got to):', out)
        # 2 a knife fight with one guard, then with two (mashing the knife, no bread)
        out = []
        for n in (1, 2, 3):
            res = []
            for k in range(5):
                await g.js(S0, {'flags': {'briefed': True, 'inTown': True}, 'at': [-32.5, 80]})
                r = await g.js("""(n) => { const H = T.H, S = H.sog, B = H.battle, p = B.player, gs = S.guards.filter(q => q.zone === 'town').slice(0, n); gs.forEach((q, i) => { q.x = -32.5 + (i - (n - 1) / 2) * 1.2; q.z = 83.5; q.mode = 'alert'; q.hold = false; q.speed = q.run; q.sus = 1; });
                  for (const q of S.guards) if (gs.indexOf(q) < 0 && !q.boss) { q.alive = false; q.gone = true; q.hidden = true; q.told = true; }
                  S.zones.town.state = 'alarm'; let t = 0; H.keys.hit = true; while (p.alive && gs.some(q => q.alive) && t < 90) { S.seenT = B.t; H.step(1 / 30); t += 1 / 30; } H.keys.hit = false; return [p.alive ? Math.round(p.hp) : 0, gs.filter(q => q.alive).length, +t.toFixed(0)]; }""", n)
                res.append(r)
            out.append([n, res])
        print('knife fights (guards, [hp left, guards left, secs]):', json.dumps(out))
        print('errors:', g.errs)
asyncio.run(main())
