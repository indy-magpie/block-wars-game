import asyncio, sys
from lib import Game
from collections import Counter
N = int(sys.argv[1]) if len(sys.argv) > 1 else 16
SET = sys.argv[2] if len(sys.argv) > 2 else ''
async def main():
    async with Game() as g:
        if SET: await g.js("() => { const T = window.__hastings.tune, S = window.__hastings.stat; " + SET + " }")
        for how in ('absent', 'novice', 'masher', 'auto'):
            r = await g.js('(a) => window.__hastings.simulate(a[0], a[1])', [N, how])
            print('%-7s wins %2d/%d secs %3d kills %4.1f endHp %3d %s' % (how, sum(1 for x in r if x['result'] == 'victory'), len(r), sum(x['secs'] for x in r) / len(r), sum(x['kills'] for x in r) / len(r), sum(x['hp'] for x in r) / len(r), dict(Counter(str(x['result']) for x in r))))
        print('errors:', g.errs[:6])
asyncio.run(main())
