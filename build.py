"""Joins src/ into one self-contained page, index.html. Run: python3 build.py"""
import pathlib, re, sys
root = pathlib.Path(__file__).parent
core = sorted((root / 'src').glob('[0-9][0-9]_*.js'))
levels = sorted((root / 'src' / 'levels').glob('*/*.js'))      # each level is a folder; its files are joined in name order
parts = [p for p in core if p.name < '10'] + levels + [p for p in core if p.name >= '10']

# Every part shares one scope, so two parts must never give the same name to a top-level function or variable.
# A second `function` of the same name would silently replace the first, so the build stops instead.
seen, clash = {}, []
for p in parts:
    for m in re.finditer(r'^(?:async\s+)?function\s+(\w+)|^(?:const|let)\s+(\w+)', p.read_text(), re.M):
        name = m.group(1) or m.group(2); where = str(p.relative_to(root))
        if name in seen and seen[name] != where: clash.append(f'  {name}: {seen[name]} and {where}')
        seen.setdefault(name, where)
if clash:
    sys.exit('build stopped: the same top-level name is used in two files. Give level names a prefix of their own.\n' + '\n'.join(clash))

js = "(function () {\n'use strict';\n" + ''.join(p.read_text() for p in parts) + "})();"
page = (root / 'src' / 'page.html').read_text()
assert page.count('/*SCRIPT*/') == 1
(root / 'index.html').write_text(page.replace('/*SCRIPT*/', js))
print('built', len(core), 'core parts and', len(levels), 'level parts,', len(js) // 1024, 'KiB of script')
