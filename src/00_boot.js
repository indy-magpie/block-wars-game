const $ = id => document.getElementById(id);
const stage = $('stage'), canvas = $('view');
function fatal(msg) { const f = $('fatal'); f.textContent = msg; f.hidden = false; }
if (!window.THREE) { fatal('The 3D engine did not load. Check the connection and reload the page.'); return; }
const T = window.THREE;
let renderer;
try { renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { fatal('This browser could not start 3D graphics (WebGL). Try another browser or device.'); return; }

