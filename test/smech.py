"""Sogdiana: each system on its own - alarms, hiding, chasing, being caught, the channel, the endings, the choices."""
import asyncio, sys, json
from lib import Game
from sroute import JS
SETUP = "(o) => { const H = window.__hastings; H.save.data.coins = o.coins || 0; H.save.data.items = {}; H.begin(true); H.sog.log = []; Object.assign(H.sog.flags, o.flags || {}); if (o.at) T.tp(o.at[0], o.at[1], o.at[2] || 0); if (o.re) { H.sog.cp = [o.at[0], o.at[1], o.at[2] || 0]; H.begin(false); H.sog.log = []; } return T.st(); }"
async def main():
    which = sys.argv[1:] or [str(i) for i in range(1, 14)]
    ok = []
    def check(name, cond, info=''):
        ok.append((name, bool(cond))); print(('PASS ' if cond else 'FAIL ') + name, info)
    async with Game() as g:
        await g.pg.click('#eraSogdiana'); await g.until(lambda s: s['phase'] == 'intro' and not s['busy']); await g.js('window.__hastings.skip()'); await g.pg.wait_for_timeout(300)
        await g.js(JS)
        if '1' in which:      # seen in the open, hide in hay, guards search and give up
            await g.js(SETUP, {'flags': {'briefed': True}, 'at': [6, 70.5, 0]})
            r = await g.js("""() => { const H = T.H, S = H.sog; let t = 0; while (S.zones.town.state !== 'alarm' && t < 8) { H.step(1/30); t += 1/30; } return [+t.toFixed(1), S.log]; }""")
            check('1a seen in the open bazaar', r[0] < 6, r)
            r = await g.js("T.walk([[13.4, 70.2]])"); 
            r2 = await g.js("""() => { const H = T.H, S = H.sog, out = []; let t = 0, last = ''; while (t < 70) { H.step(1/30); t += 1/30; const s = S.zones.town.state; if (s !== last) { out.push([+t.toFixed(1), s]); last = s; } if (s === 'calm') break; } return [out, T.st(), S.inHay]; }""")
            check('1b hidden in hay until they give up', r2[0][-1][1] == 'calm' and r2[1]['hp'] > 0, [r, r2[0], r2[1]['hp']])
            r3 = await g.js("""() => { const H = T.H, S = H.sog; let t = 0; while (t < 60 && S.guards.some(g => g.alive && g.zone === 'town' && g.mode !== 'post')) { H.step(1/30); t += 1/30; } return [+t.toFixed(1), S.guards.filter(g => g.zone === 'town').map(g => [g.mode, +g.x.toFixed(0), +g.z.toFixed(0)])]; }""")
            check('1c patrols go back to their rounds', r3[0] < 59, r3)
        if '2' in which:      # guards find their way round the houses to him
            await g.js(SETUP, {'flags': {'briefed': True}, 'at': [-32.5, 91, 0]})
            r = await g.js("""() => { const H = T.H, S = H.sog, p = H.battle.player; H.alarm('town'); let t = 0, near = 99; while (t < 45) { S.seenT = H.battle.t; H.step(1/30); t += 1/30; near = Math.min(...S.guards.filter(g => g.zone === 'town').map(g => Math.hypot(g.x - p.x, g.z - p.z))); if (near < 2.2) break; } return [+t.toFixed(1), +near.toFixed(1), S.guards.filter(g => g.zone === 'town').map(g => [+g.x.toFixed(0), +g.z.toFixed(0)])]; }""")
            check('2 chasers reach him round the houses', r[1] < 2.3, r)
        if '3' in which:      # caught, then try again from the checkpoint with everything kept
            await g.js(SETUP, {'coins': 9, 'flags': {'briefed': True, 'robe': True, 'gatePass': True, 'gate': 'robe', 'inTown': True, 'potter': 'paid', 'password': True, 'channel': True}, 'at': [0, 60, 0], 're': True})
            r = await g.js("""() => { const H = T.H, S = H.sog; H.alarm('town'); let t = 0; while (!H.battle.over && t < 90) { S.seenT = H.battle.t; H.step(1/30); t += 1/30; } return [+t.toFixed(1), T.st()]; }""")
            check('3a the guards catch him', r[1]['res'] == 'fallen', r[0])
            await g.pg.wait_for_selector('#card:not([hidden])', timeout=30000); await g.pg.wait_for_timeout(400); await g.shot('m03_caught')
            await g.pg.click('#cardBtn0'); s = await g.until(lambda s: s['phase'] == 'fight' and not s['busy'] and not s['over']); st = await g.js("T.st()")
            check('3b try again keeps what he had', st['hp'] == 100 and 'password' in st['F'] and 'robe' in st['F'] and st['coins'] == 9 and abs(st['at'][1] - 60) < 1, st)
            await g.pg.wait_for_timeout(600); await g.shot('m03_again')
        if '4' in which:      # the grate and the channel
            await g.js(SETUP, {'flags': {'briefed': True, 'inTown': True}, 'at': [26.4, 118.2, -1.57]})
            a = await g.js("[T.prompt(), T.act([]), T.H.sog.flags.grate, T.H.battle.toast]"); check('4a grate will not move without the secret', a[2] is False, a)
            await g.js(SETUP, {'flags': {'briefed': True, 'inTown': True, 'channel': True, 'potter': 'favour'}, 'at': [26.4, 118.2, -1.57]})
            a = await g.js("[T.prompt(), T.act([]), T.H.sog.flags.grate]"); check('4b grate lifts when he knows', a[2] is True, a)
            b = await g.js("T.walk([[20.6, 118.2]], false, 4)"); check('4c cannot walk through upright', b['at'][0] > 23.9, b['at'])
            b = await g.js("T.walk([[20.6, 118.2]], true, 8)"); check('4d crawls through into the court', b['place'] == 'court' and 'way=channel' in b['F'], b)
            await g.pg.wait_for_timeout(500); await g.shot('m04_cistern')
        if '5' in which:      # the arrow
            await g.js(SETUP, {'flags': {'briefed': True, 'inTown': True, 'inCitadel': True, 'gateOpen': True, 'courtPass': True, 'token': True, 'chief': 'paid', 'way': 'password'}, 'at': [.6, 120.2, 0], 're': True})
            a = await g.js("[T.prompt(), T.act([0])]"); await g.pg.wait_for_timeout(700); await g.shot('m05_token_talk')
            b = await g.js("(T.H.pick(0), T.st())"); check('5 the arrow ends it without a fight', b['res'] == 'victory' and 'end=token' in b['F'], [a, b['F']])
        if '6' in which:      # the fight
            await g.js(SETUP, {'flags': {'briefed': True, 'inTown': True, 'inCitadel': True, 'gateOpen': True, 'way': 'force'}, 'at': [0, 129.2, 0], 're': True})
            r = await g.js("""() => { const H = T.H, S = H.sog, b = S.boss; T.tp(.2, 130.6, 0); b.hp = 12; let t = 0; H.keys.hit = true; while (!H.battle.over && t < 20) { H.step(1/30); t += 1/30; } H.keys.hit = false; return [+t.toFixed(1), T.st(), S.log]; }""")
            check('6 beaten in a fight, he yields', r[1]['res'] == 'victory' and 'end=fight' in r[1]['F'], r)
        if '7' in which:      # the chief: anger him, or pay him
            await g.js(SETUP, {'coins': 5, 'flags': {'briefed': True}, 'at': [51.6, 79, 1.57]})
            a = await g.js("[T.prompt(), T.act([2, 0]), T.st(), T.H.sog.guards.filter(g => g.zone === 'camp').length]"); check('7a an insulted chief sets his riders on him', a[3] == 6 and a[2]['zones'].get('camp') == 'alarm', a)
            await g.js(SETUP, {'coins': 25, 'flags': {'briefed': True}, 'at': [51.6, 79, 1.57]})
            a = await g.js("[T.act([0, 0]), T.st(), T.H.sog.riders.filter(r => !r.hidden).length, T.H.sog.guards.filter(g => g.alive && g.rider).length]"); check('7b a paid chief rides away and leaves his arrow', 'token' in a[1]['F'] and a[1]['coins'] == 5 and a[2] == 0 and a[3] == 0, a)
            await g.js(SETUP, {'coins': 5, 'flags': {'briefed': True}, 'at': [51.6, 79, 1.57]})
            a = await g.js("[T.act([1, 0]), T.st(), T.H.sog.riders.filter(r => !r.hidden).length, T.H.sog.guards.filter(g => g.alive && g.rider).length, document.getElementById('talkBtn0') && document.getElementById('talkBtn0').disabled]"); check('7c a chief talked round stands aside', 'chief=talked' in a[1]['F'] and a[2] == 6 and a[3] == 0, a)
        if '8' in which:      # the gate: barge through, or pay
            await g.js(SETUP, {'coins': 30, 'flags': {'briefed': True}, 'at': [.9, 43.8, 0]})
            b = await g.js("T.walk([[0, 49]], false, 3)"); check('8a the gate guards bar the way without a fight', b['at'][1] < 47.4 and not b['zones'] and 'inTown' not in b['F'], b)
            b = await g.js("(T.H.keys.hit = true, T.ff(1.2), T.H.keys.hit = false, T.st())"); check('8c striking a gate guard does raise the alarm', b['zones'].get('gate') == 'alarm', b['zones'])
            await g.js(SETUP, {'coins': 30, 'flags': {'briefed': True}, 'at': [.9, 46.4, 0]})
            a = await g.js("[T.prompt(), T.act([0, 0])]"); b = await g.js("T.walk([[0, 51.5]], false, 5)"); check('8b a bribe gets him through quietly', 'gate=bribe' in b['F'] and not b['zones'] and b['coins'] == 20 and b['place'] == 'town', [a, b])
        if '9' in which:      # a blow from behind
            await g.js(SETUP, {'flags': {'briefed': True, 'inTown': True}, 'at': [-30, 51.5, 1.57]})
            r = await g.js("""() => { const H = T.H, S = H.sog, g = S.guards.find(q => q.patrol && q.patrol[0][1] === 51.5); g.x = -20; g.z = 51.5; g.yaw = Math.PI / 2; g.hx = -20; T.tp(-21.3, 51.5, Math.PI / 2); H.keys.hit = true; let t = 0; while (g.alive && t < 2) { H.step(1/30); t += 1/30; } H.keys.hit = false; return [g.alive, +t.toFixed(2), S.flags.takedowns, T.st().zones]; }""")
            check('9 one blow from behind fells a guard who has not seen him', r[0] is False and r[2] == 1 and not r[3], r)
        if '10' in which:     # the potter's jar
            await g.js(SETUP, {'flags': {'briefed': True, 'robe': True, 'gatePass': True, 'inTown': True}, 'at': [-10.5, 78.2, 0]})
            a = await g.js("[T.prompt(), T.act([1, 0]), T.st().F]"); await g.js("T.tp(26.6, 77.6, 0)"); b = await g.js("[T.prompt(), T.act([]), T.st().F]")
            await g.js("T.tp(-10.5, 78.2, 0)"); c = await g.js("[T.prompt(), T.act([0, 0]), T.st().F]")
            check('10 fetching the jar earns the way in', 'potter=favour' in c[2] and 'channel' in c[2] and 'password' not in c[2], [a, b, c])
        if '11' in which:     # threatening the potter
            await g.js(SETUP, {'flags': {'briefed': True, 'robe': True, 'gatePass': True, 'inTown': True}, 'at': [-10.5, 78.2, 0]})
            a = await g.js("[T.act([2, 0]), T.st()]"); check('11 a threatened potter talks, then calls the guards', 'potter=threat' in a[1]['F'] and 'channel' in a[1]['F'] and a[1]['zones'].get('town') == 'alarm', a)
        if '12' in which:     # bread and hidden silver
            await g.js(SETUP, {'coins': 10, 'flags': {'briefed': True, 'robe': True, 'gatePass': True, 'inTown': True}, 'at': [10.5, 78.2, 0]})
            a = await g.js("[T.prompt(), T.act([0]), T.H.inv.count('bread'), T.H.inv.coins()]"); await g.js("T.tp(-19.5, 64.6, 3.1)"); b = await g.js("[T.prompt(), T.act([]), T.H.inv.coins(), T.prompt()]")
            check('12 the baker sells a loaf and a pot hides six drachmas', a[2] == 1 and a[3] == 6 and b[2] == 12 and b[3] != 'Search the pot', [a, b])
        if '13' in which:     # a clumsy player pressing everything, everywhere: nothing may throw
            await g.js(SETUP, {'coins': 40, 'flags': {'briefed': True}, 'at': [0, 20, 0]})
            r = await g.js("""() => { const H = T.H, S = H.sog, B = H.battle; let seed = 7, acts = 0, talks = 0, falls = 0, wins = 0; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
              for (let n = 0; n < 9000; n++) {
                if (B.over) { if (B.result === 'victory') wins++; else falls++; H.begin(B.result === 'victory' || R() < .3); S.log = []; }
                if (B.phase === 'talk') { H.pick(Math.floor(R() * 4)); talks++; continue; }
                if (n % 40 === 0) { H.keys.up = R() < .8; H.keys.left = R() < .2; H.keys.right = R() < .2; H.keys.block = R() < .35; H.keys.hit = R() < .25; H.keys.jump = R() < .2; H.cam.yaw = R() * 6.28; }
                if (n % 150 === 0) { const a = S.acts[Math.floor(R() * S.acts.length)], q = a.pos, x = q.x !== undefined ? q.x : q[0], z = q.x !== undefined ? q.z : q[1]; T.tp(x + R() * 2 - 1, z - 1.2 - R(), 0); }
                H.step(1 / 30); if (n % 7 === 0 && H.act()) acts++;
              }
              for (const k in H.keys) H.keys[k] = false;
              return { acts: acts, talks: talks, falls: falls, wins: wins, flags: Object.keys(S.flags).filter(k => S.flags[k] && typeof S.flags[k] !== 'object').join(' ') }; }""")
            check('13 nothing throws under random play', True, r)
        print('errors:', g.errs)
        bad = [n for n, v in ok if not v]; print('RESULT', len(ok) - len(bad), 'of', len(ok), 'passed', 'FAILED: ' + ', '.join(bad) if bad else '')
if __name__ == '__main__': asyncio.run(main())
