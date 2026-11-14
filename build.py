import pathlib, sys
root = pathlib.Path(__file__).parent
parts = sorted((root / 'src').glob('[0-9][0-9]_*.js'))
js = "(function () {\n'use strict';\n" + ''.join(p.read_text() for p in parts) + "})();"
page = (root / 'src' / 'page.html').read_text()
assert page.count('/*SCRIPT*/') == 1
(root / 'index.html').write_text(page.replace('/*SCRIPT*/', js))
print('built', len(parts), 'parts,', len(js) // 1024, 'KiB of script')
