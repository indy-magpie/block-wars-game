import pathlib
root = pathlib.Path(__file__).parent
core = sorted((root / 'src').glob('[0-9][0-9]_*.js'))
levels = sorted((root / 'src' / 'levels').glob('*/*.js'))      # each level is a folder; its files are joined in name order
parts = [p for p in core if p.name < '10'] + levels + [p for p in core if p.name >= '10']
js = "(function () {\n'use strict';\n" + ''.join(p.read_text() for p in parts) + "})();"
page = (root / 'src' / 'page.html').read_text()
assert page.count('/*SCRIPT*/') == 1
(root / 'index.html').write_text(page.replace('/*SCRIPT*/', js))
print('built', len(core), 'core parts and', len(levels), 'level parts,', len(js) // 1024, 'KiB of script')
