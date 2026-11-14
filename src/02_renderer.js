/* ================= renderer ================= */
let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(pixelRatio);
const camera = new T.PerspectiveCamera(55, 1, 0.2, 520);
function resize() {
  const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

const MAT_UNIT = new T.MeshLambertMaterial({ vertexColors: true });
const MAT_STATIC = new T.MeshLambertMaterial({ vertexColors: true });
const MAT_HULL = new T.MeshBasicMaterial({ side: T.BackSide, transparent: false, opacity: .52, depthWrite: false, blending: T.CustomBlending, blendSrc: T.SrcAlphaFactor, blendDst: T.OneMinusSrcAlphaFactor });
const TEX_SHADOW = radialTexture([[0, .55], [.55, .4], [1, 0]]);
const TEX_RING = radialTexture([[0, .1], [.42, .18], [.62, .95], [.8, .3], [1, 0]]);
const FRIEND = 0x48ff6c, FOE = 0xff3d2a;

