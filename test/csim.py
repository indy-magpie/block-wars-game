import asyncio, sys, json
from lib import Game
N = int(sys.argv[1]) if len(sys.argv) > 1 else 6
MODES = sys.argv[2:] or ['masher', 'novice']
async def main():
    async with Game() as g:
        for how in MODES:
            r = await g.js('(a) => window.__hastings.simCarthage(a[0], a[1])', [N, how])
            falls = [sum(x['falls'][i] for x in r) / len(r) for i in range(7)]
            per = [sum(x['per'][i] for x in r) / len(r) for i in range(7)]
            print('%-7s won %d/%d  secs %4d  kills %4.1f' % (how, sum(1 for x in r if x['won']), len(r), sum(x['secs'] for x in r) / len(r), sum(x['kills'] for x in r) / len(r)))
            print('   falls per stage ', ' '.join('%4.1f' % f for f in falls))
            print('   secs per stage  ', ' '.join('%4.0f' % f for f in per))
            stuck = [x for x in r if not x['won']]
            if stuck: print('   not won:', json.dumps(stuck[:2]))
        print('dump:', json.dumps(await g.js('window.__hastings._dump || null')))
        print('errors:', g.errs[:10])
asyncio.run(main())
