import asyncio, sys, json
from lib import Game
STAGE = int(sys.argv[1]) if len(sys.argv) > 1 else 4
async def main():
    async with Game() as g:
        r = await g.js('''(si) => { const H = window.__hastings, B = H.battle, C = H.carth, out = [];
          for (let k = 0; k < 4; k++) {
            B.sim = true; B.autopilot = true; B.simCool = 0; H.warp(si, +(window.__wave||0)); B.phase = 'fight'; B.player.blockChance = 0;
            let t = 0, log = [];
            while (!B.over && t < 240 && C.si === si) { H.step(1/30); t += 1/30; if (Math.abs(t % 10) < 1/30) log.push([Math.round(t), +B.player.z.toFixed(1), +B.player.x.toFixed(1), Math.round(B.player.hp), B.sax.filter(u => u.alive).length - 1, B.nor.filter(u => u.alive && !u.fixed).length, C.arrows.length]); }
            out.push({ t: Math.round(t), over: B.over, result: B.result, z: +B.player.z.toFixed(1), x: +B.player.x.toFixed(1), allies: B.sax.filter(u => u.alive).length - 1, foes: B.nor.filter(u => u.alive && !u.fixed).length, awake: B.nor.filter(u => u.alive && !u.hold && !u.fixed).length, kills: B.player.kills, log: log });
          }
          B.sim = false; B.autopilot = false; return out; }''', STAGE)
        for x in r:
            log = x.pop('log'); print(json.dumps(x)); print('   t,z,x,hp,allies,foes,arrows:', log)
        print('errors:', g.errs[:5])
asyncio.run(main())
