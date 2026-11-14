/* ================= scenery pieces ================= */
function tree(L, x, z, s, rng) {
  const th = (2.1 + rng() * 1.3) * s, k = rng();
  const c = k < .42 ? 0x3f7a2c : k < .62 ? 0x55892e : k < .78 ? 0x8a932b : k < .9 ? 0xb9892a : 0xb5622a;
  L.push([x, th / 2, z, .6 * s, th, .6 * s, jit(0x5b4028, .12, rng)]);
  L.push([x, th + .6 * s, z, 3.1 * s, 1.3 * s, 3.1 * s, jit(c, .08, rng)]);
  L.push([x + (rng() - .5) * .5, th + 1.65 * s, z + (rng() - .5) * .5, 2.2 * s, 1.1 * s, 2.2 * s, jit(c, .1, rng)]);
  L.push([x, th + 2.45 * s, z, 1.2 * s, .8 * s, 1.2 * s, jit(c, .12, rng)]);
}
function banner(L, x, z, kind) {
  L.push([x, 2.9, z, .14, 5.8, .14, [.36, .25, .14]]); L.push([x, 5.9, z, .24, .24, .24, GOLD]);
  const fx = x + .95, fy = 4.95;
  if (kind === 'wyvern') {
    L.push([fx, fy, z, 1.7, 1.2, .07, [.66, .13, .1]]);
    for (const s of [-1, 1]) { const zz = z + s * .05;
      L.push([fx - .05, fy - .05, zz, .8, .28, .03, GOLD]); L.push([fx + .45, fy + .2, zz, .3, .26, .03, GOLD]);
      L.push([fx - .1, fy + .28, zz, .42, .26, .03, GOLD]); L.push([fx - .58, fy - .22, zz, .34, .14, .03, GOLD]);
      L.push([fx + .2, fy - .32, zz, .12, .26, .03, GOLD]); L.push([fx - .25, fy - .32, zz, .12, .26, .03, GOLD]); }
  } else if (kind === 'man') {
    L.push([fx, fy, z, 1.7, 1.2, .07, [.9, .87, .78]]);
    for (const s of [-1, 1]) { const zz = z + s * .05;
      L.push([fx, fy + .32, zz, .22, .22, .03, GOLD]); L.push([fx, fy - .02, zz, .3, .44, .03, GOLD]);
      L.push([fx - .1, fy - .4, zz, .1, .34, .03, GOLD]); L.push([fx + .1, fy - .4, zz, .1, .34, .03, GOLD]);
      L.push([fx + .38, fy + .05, zz, .06, .95, .03, [.66, .13, .1]]); L.push([fx + .26, fy + .1, zz, .22, .08, .03, GOLD]); }
  } else if (kind === 'papal') {
    L.push([fx, fy, z, 1.5, 1.2, .07, [.93, .91, .85]]);
    for (const s of [-1, 1]) { const zz = z + s * .05;
      L.push([fx, fy, zz, .16, .8, .03, GOLD]); L.push([fx, fy + .1, zz, .62, .16, .03, GOLD]);
      L.push([fx, fy + .56, zz, 1.5, .08, .03, [.17, .3, .55]]); L.push([fx, fy - .56, zz, 1.5, .08, .03, [.17, .3, .55]]); }
    for (const dy of [-.4, 0, .4]) L.push([fx + .95, fy + dy, z, .4, .2, .06, [.93, .91, .85]]);
  } else {
    L.push([fx, fy, z, 1.7, 1.2, .07, [.6, .1, .1]]);
    for (const s of [-1, 1]) { const zz = z + s * .05;
      for (const dy of [-.26, .26]) { L.push([fx - .05, fy + dy, zz, .9, .2, .03, GOLD]); L.push([fx + .5, fy + dy + .08, zz, .22, .22, .03, GOLD]); L.push([fx - .6, fy + dy + .1, zz, .22, .08, .03, GOLD]); } }
  }
}

