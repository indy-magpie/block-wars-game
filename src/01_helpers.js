/* ================= helpers ================= */
const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
let touchMode = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches);
const PI = Math.PI, hyp = Math.hypot;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));
const easeOut = t => 1 - (1 - t) * (1 - t);
const wait = ms => new Promise(r => setTimeout(r, ms));
function angDiff(a, b) { let d = (a - b) % (PI * 2); if (d > PI) d -= PI * 2; if (d < -PI) d += PI * 2; return d; }
function turnTo(cur, tgt, step) { return cur + clamp(angDiff(tgt, cur), -step, step); }
function rngSeed(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const _col = new T.Color();
function jit(hex, amt, rng) { _col.setHex(hex); const k = 1 + (rng() * 2 - 1) * amt; return [clamp(_col.r * k, 0, 1), clamp(_col.g * k, 0, 1), clamp(_col.b * k, 0, 1)]; }

/* Merge a list of boxes [cx,cy,cz, sx,sy,sz, colour] into one vertex-coloured geometry. */
function buildBoxes(boxes, grow) {
  grow = grow || 0;
  const pos = [], nor = [], col = [], idx = [];
  let v = 0;
  for (const b of boxes) {
    const cx = b[0], cy = b[1], cz = b[2], hx = b[3] / 2 + grow, hy = b[4] / 2 + grow, hz = b[5] / 2 + grow, c = b[6];
    let r, g, bl;
    if (typeof c === 'number') { _col.setHex(c); r = _col.r; g = _col.g; bl = _col.b; } else { r = c[0]; g = c[1]; bl = c[2]; }
    const F = [
      [hx, -hy, hz, hx, -hy, -hz, hx, hy, -hz, hx, hy, hz, 1, 0, 0],
      [-hx, -hy, -hz, -hx, -hy, hz, -hx, hy, hz, -hx, hy, -hz, -1, 0, 0],
      [-hx, hy, hz, hx, hy, hz, hx, hy, -hz, -hx, hy, -hz, 0, 1, 0],
      [-hx, -hy, -hz, hx, -hy, -hz, hx, -hy, hz, -hx, -hy, hz, 0, -1, 0],
      [-hx, -hy, hz, hx, -hy, hz, hx, hy, hz, -hx, hy, hz, 0, 0, 1],
      [hx, -hy, -hz, -hx, -hy, -hz, -hx, hy, -hz, hx, hy, -hz, 0, 0, -1]
    ];
    for (const f of F) {
      for (let k = 0; k < 4; k++) { pos.push(cx + f[k * 3], cy + f[k * 3 + 1], cz + f[k * 3 + 2]); nor.push(f[12], f[13], f[14]); col.push(r, g, bl); }
      idx.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4;
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  return geo;
}
function pixelTexture(size, fn) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { g.fillStyle = fn(x, y); g.fillRect(x, y, 1, 1); }
  const t = new T.CanvasTexture(c); t.magFilter = T.NearestFilter; t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}
function groundTexture(seed, r0, g0, b0) {
  const r = rngSeed(seed);
  return pixelTexture(32, () => { const k = (.86 + r() * .26) * (r() < .07 ? .8 : 1); return 'rgb(' + ((r0 * k) | 0) + ',' + ((g0 * k) | 0) + ',' + ((b0 * k) | 0) + ')'; });
}
function radialTexture(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  for (const s of stops) gr.addColorStop(s[0], 'rgba(255,255,255,' + s[1] + ')');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new T.CanvasTexture(c);
}

