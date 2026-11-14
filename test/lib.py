import asyncio, base64, os, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = ROOT / 'test' / 'shots'; OUT.mkdir(exist_ok=True)
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
THREE = (ROOT / 'node_modules/three/build/three.min.js').read_bytes()
def _face(fam, path, wt):
    d = base64.b64encode((ROOT / 'node_modules/@fontsource' / path).read_bytes()).decode()
    return "@font-face{font-family:'%s';font-weight:%s;src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, wt, d)
CSS = _face('Jacquard 24', 'jacquard-24/files/jacquard-24-latin-400-normal.woff2', 400) + ''.join(_face('Pixelify Sans', 'pixelify-sans/files/pixelify-sans-latin-%d-normal.woff2' % w, w) for w in (400, 600, 700)) + ''.join(_face('Silkscreen', 'silkscreen/files/silkscreen-latin-%d-normal.woff2' % w, w) for w in (400, 700))

class Game:
    def __init__(self, init=None): self.init = init
    async def __aenter__(self):
        self.pw = await async_playwright().start()
        self.b = await self.pw.chromium.launch(executable_path=CHROME, args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        self.pg = await self.b.new_page(viewport={'width': 1280, 'height': 720})
        self.errs = []
        self.pg.on('console', lambda m: self.errs.append(m.text) if m.type == 'error' else None)
        self.pg.on('pageerror', lambda e: self.errs.append('pageerror: ' + str(e)))
        async def three(route): await route.fulfill(body=THREE, content_type='application/javascript')
        async def fonts(route): await route.fulfill(body=CSS, content_type='text/css')
        await self.pg.route('**/three.min.js', three); await self.pg.route('**/fonts.googleapis.com/**', fonts)
        if self.init: await self.pg.add_init_script(self.init)
        await self.pg.goto('file://' + str(ROOT / 'index.html')); await self.pg.wait_for_timeout(1800)
        return self
    async def __aexit__(self, *a):
        await self.b.close(); await self.pw.stop()
    async def st(self): return await self.pg.evaluate('window.__hastings ? window.__hastings.state() : null')
    async def until(self, cond, tries=160):
        for _ in range(tries):
            s = await self.st()
            if s and cond(s): return s
            await self.pg.wait_for_timeout(250)
        return await self.st()
    async def shot(self, name): await self.pg.screenshot(path=str(OUT / (name + '.png')))
    async def js(self, code, arg=None): return await self.pg.evaluate(code, arg) if arg is not None else await self.pg.evaluate(code)
