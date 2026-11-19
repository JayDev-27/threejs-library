// 10 Jaipur · Gulabi Nagar: the Palace of Winds at sunset, a painted gate of cusped arches, a rangoli courtyard,
// a stepped kund lit by a thousand diyas, and a festival sky.
import * as THREE from '../lib/three.module.min.js';
import { U, NOISE, Builder, stdMat, groundMat, instanced, sky, points, glows, water, sunLight, merge, xform, canvasTex, windify, clamp, hook, rng, fbm2, noise2, lerp, smooth, win, TAU } from '../lib/kit.js';
import { broadleaf, bush, treeMats, plant, leafTex, blossomTex, barkTex } from '../lib/flora.js';

const V3 = THREE.Vector3, PINK = 0xd98068, TERRA = 0xc4664e, ROSE = 0xe79a82, LIME = 0xf8ecdf, DARK = 0x4a1e1c, GOLD = 0xf0b84a;
// a wall panel with a cusped (multifoil) arch cut through it
function archShape(W, Hh, w, spring, rise, lobes = 9, cusp = 0.2) {
  const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, Hh); s.lineTo(-W / 2, Hh); s.closePath();
  const h = new THREE.Path(); h.moveTo(-w / 2, 0); h.lineTo(-w / 2, spring); const N = lobes * 12;
  for (let i = 1; i < N; i++) { const t = i / N, a = Math.PI * (1 - t), f = 1 - cusp * Math.pow(1 - Math.abs(Math.sin(lobes * Math.PI * t)), 2.2); h.lineTo(Math.cos(a) * w / 2 * f, spring + rise * Math.pow(Math.sin(a), 0.72) * (0.55 + 0.45 * f)); }
  h.lineTo(w / 2, spring); h.lineTo(w / 2, 0); h.closePath(); s.holes.push(h); return s;
}
const flower = (g, x, y, R, n, c1, c2) => { for (let k = 0; k < n; k++) { g.save(); g.translate(x, y); g.rotate(k / n * TAU); g.fillStyle = c1; g.beginPath(); g.ellipse(0, -R * 0.56, R * 0.22, R * 0.46, 0, 0, TAU); g.fill(); g.restore(); } g.fillStyle = c2; g.beginPath(); g.arc(x, y, R * 0.2, 0, TAU); g.fill(); };
// hand-painted plaster: borders, vines, rosettes, in rose, turquoise, white and gold
function painted() { return canvasTex(1024, 1024, (g, W) => { const q = rng(3); g.fillStyle = '#e9a899'; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 256, y = j * 256; g.fillStyle = (i + j) % 2 ? '#f3c4b4' : '#e2978a'; g.fillRect(x + 14, y + 14, 228, 228); g.strokeStyle = '#fff6ea'; g.lineWidth = 5; g.strokeRect(x + 14, y + 14, 228, 228); g.strokeStyle = '#2a9d9a'; g.lineWidth = 3; g.strokeRect(x + 26, y + 26, 204, 204);
    g.strokeStyle = '#fff6ea'; g.lineWidth = 3; g.beginPath(); for (let k = 0; k < 4; k++) { const a = k * TAU / 4; g.moveTo(x + 128, y + 128); g.quadraticCurveTo(x + 128 + Math.cos(a + 0.6) * 70, y + 128 + Math.sin(a + 0.6) * 70, x + 128 + Math.cos(a) * 84, y + 128 + Math.sin(a) * 84); } g.stroke();
    flower(g, x + 128, y + 128, 46, 8, (i + j) % 2 ? '#2a9d9a' : '#fff6ea', '#e9b23c'); for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + TAU / 8; flower(g, x + 128 + Math.cos(a) * 84, y + 128 + Math.sin(a) * 84, 20, 6, k % 2 ? '#c8455e' : '#fff6ea', '#e9b23c'); } for (let k = 0; k < 4; k++) { const a = k * TAU / 4; flower(g, x + 128 + Math.cos(a) * 84, y + 128 + Math.sin(a) * 84, 13, 5, '#3f7fbf', '#fff6ea'); } }
  g.globalAlpha = 0.08; for (let i = 0; i < 2600; i++) { g.fillStyle = q() < 0.5 ? '#000' : '#fff'; g.fillRect(q() * W, q() * W, 2 + q() * 3, 2 + q() * 3); } }, { repeat: [1 / 9, 1 / 9] }); }
function mandalaTex() { return canvasTex(1024, 1024, (g, W) => { g.fillStyle = '#f0c2b0'; g.fillRect(0, 0, W, W); g.translate(512, 512); const ring = (R, n, c1, c2) => { for (let k = 0; k < n; k++) { g.save(); g.rotate(k / n * TAU); g.fillStyle = c1; g.beginPath(); g.moveTo(0, -R * 0.62); g.quadraticCurveTo(R * Math.sin(Math.PI / n) * 1.2, -R * 0.84, 0, -R); g.quadraticCurveTo(-R * Math.sin(Math.PI / n) * 1.2, -R * 0.84, 0, -R * 0.62); g.fill(); g.strokeStyle = c2; g.lineWidth = 3; g.stroke(); g.restore(); } };
  g.fillStyle = '#2a8f96'; g.beginPath(); g.arc(0, 0, 500, 0, TAU); g.fill(); ring(490, 32, '#fff6ea', '#e9b23c'); g.fillStyle = '#d8607a'; g.beginPath(); g.arc(0, 0, 390, 0, TAU); g.fill(); ring(385, 24, '#f3c4b4', '#fff6ea'); g.fillStyle = '#fff6ea'; g.beginPath(); g.arc(0, 0, 280, 0, TAU); g.fill(); ring(276, 16, '#2a9d9a', '#e9b23c'); g.fillStyle = '#e9b23c'; g.beginPath(); g.arc(0, 0, 170, 0, TAU); g.fill(); ring(166, 12, '#c8455e', '#fff6ea'); flower(g, 0, 0, 96, 8, '#fff6ea', '#2a9d9a'); for (let k = 0; k < 32; k++) { const a = k / 32 * TAU; g.fillStyle = '#e9b23c'; g.beginPath(); g.arc(Math.cos(a) * 440, Math.sin(a) * 440, 7, 0, TAU); g.fill(); } }); }

export default {
  build({ scene, look, mirror, env }) {
    const r = rng(53), pick = a => a[Math.floor(r() * a.length)], sunDir = new V3(0.78, 0.2, 0.42).normalize(), o = new THREE.Object3D();
    scene.fog = new THREE.FogExp2(0xf0a878, 0.0014);
    const dome = sky({ top: 0x2a3f86, horizon: 0xffa25c, bottom: 0xd88a60, pow: 0.42, sunDir, sunColor: 0xffc890, sunSize: 0.0012, sunIntensity: 34, sunGlow: 1.5, clouds: 0.4, cloudColor: 0xffc0a0, cloudDark: 0x7a5a7c, cloudScale: 0.8 }); scene.add(dome); env(dome, 0.8);
    const hemi = new THREE.HemisphereLight(0xb8c4ff, 0xa86a50, 0.55); scene.add(hemi);
    const sun = sunLight(scene, { dir: sunDir, color: 0xffb880, intensity: 3.6, box: 150, far: 800, map: 4096, target: [0, 0, -150] });
    U.uSunDirF.value.copy(sunDir); U.uSunFog.value.set(0.5, 0.26, 0.1);
    const stone = groundMat({ scale: 0.35, detail: 3.5, bump: 0.3, contrast: 0.32, roughness: 0.82 }), goldM = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.28, emissive: 0x6a3a00, emissiveIntensity: 0.35 });
    const S = new Builder(), Gd = new Builder(), halo = [], diyas = [], warm = [];

    // ---- ground: sandstone paving around the kund's pit ----
    const KZ = -338, KS = 33; S.box(900, 1, 500 - KS, { p: [0, -0.5, KZ + KS + (500 - KS) / 2 - 0], c: 0xc99a78 }).box(900, 1, 400, { p: [0, -0.5, KZ - KS - 200], c: 0xc99a78 }).box(450 - KS, 1, KS * 2, { p: [-(KS + (450 - KS) / 2), -0.5, KZ], c: 0xc99a78 }).box(450 - KS, 1, KS * 2, { p: [KS + (450 - KS) / 2, -0.5, KZ], c: 0xc99a78 });

    // ---- one jharokha: bracket, three-sided bay, lime-white outlines, jali, bangla roof ----
    const J = new Builder(); J.box(3.1, 0.22, 1.45, { p: [0, 0.11, 0.72], c: LIME }).box(2.5, 0.3, 1.1, { p: [0, -0.15, 0.55], c: PINK }).box(1.7, 0.3, 0.7, { p: [0, -0.45, 0.35], c: TERRA }).box(3.3, 0.14, 1.75, { p: [0, 2.9, 0.8], c: LIME }).box(3.0, 0.3, 1.5, { p: [0, 2.7, 0.72], c: PINK });
    for (const [x, z, ry, w] of [[0, 1.38, 0, 1.5], [-1.08, 1.0, -0.78, 1.05], [1.08, 1.0, 0.78, 1.05]]) { J.box(w, 2.5, 0.14, { p: [x, 1.45, z], r: [0, ry, 0], c: ROSE }).box(w * 0.62, 1.2, 0.2, { p: [x, 1.25, z], r: [0, ry, 0], c: DARK }).cyl(w * 0.31, w * 0.31, 0.2, 14, { p: [x, 1.85, z], r: [Math.PI / 2, 0, 0], s: [1, 1, 1], c: DARK });
      for (const k of [-1, 1]) J.box(0.06, 1.5, 0.23, { p: [x + Math.cos(ry) * k * w * 0.34, 1.3, z - Math.sin(ry) * k * w * 0.34], r: [0, ry, 0], c: LIME }); J.box(w * 0.74, 0.06, 0.23, { p: [x, 0.62, z], r: [0, ry, 0], c: LIME }).tor(w * 0.34, 0.035, { p: [x, 1.85, z + (ry ? 0.02 : 0.1)], r: [0, ry, 0], c: LIME }, Math.PI, 14);
      for (let k = -1; k <= 1; k++) J.box(0.035, 1.2, 0.24, { p: [x + Math.cos(ry) * k * w * 0.16, 1.25, z - Math.sin(ry) * k * w * 0.16], r: [0, ry, 0], c: 0x8a4a40 }); for (const yy of [0.95, 1.3, 1.65]) J.box(w * 0.62, 0.035, 0.24, { p: [x, yy, z], r: [0, ry, 0], c: 0x8a4a40 }); }
    J.sph(1, { p: [0, 2.98, 0.72], s: [1.6, 0.86, 0.95], c: TERRA }, 20, 10); for (let k = -2; k <= 2; k++) J.box(0.05, 0.05, 1.9, { p: [k * 0.62, 3.6 - Math.abs(k) * 0.16, 0.72], c: LIME }); J.box(3.25, 0.05, 0.05, { p: [0, 3.02, 1.68], c: LIME });
    const jg = J.geometry(), kal = new Builder().sph(0.16, { p: [0, 0.16, 0] }, 10, 8).sph(0.1, { p: [0, 0.4, 0] }, 8, 6).cone(0.05, 0.3, 6, { p: [0, 0.62, 0] }).geometry();
    const glowG = new THREE.PlaneGeometry(0.9, 1.3), jh = [], kl = [];
    // ---- the Palace of Winds: a honeycomb of 9 tiers stepping back to its crown ----
    const HX = -42, HZ = -30, rowsAt = c => Math.max(4, 9 - Math.round(Math.pow(Math.abs(c), 1.25) * 0.42)), RH = 4.3, BASE = 6.5;
    for (let c = -7; c <= 7; c++) { const n = rowsAt(c), z = HZ - c * 3.4, hh = BASE + n * RH; S.box(4, hh, 3.44, { p: [HX - 1.6 - (9 - n) * 0.3, hh / 2, z], c: n % 2 ? PINK : 0xd47a62 }).box(4.3, 0.3, 3.5, { p: [HX - 1.5 - (9 - n) * 0.3, hh + 0.15, z], c: LIME });
      for (let k = 0; k < n; k++) jh.push([HX + 0.4 - (9 - n) * 0.3 + (k > 5 ? -0.5 : 0), BASE + k * RH + 0.6, z, Math.PI / 2, 1]);
      S.sph(1, { p: [HX - 1.5 - (9 - n) * 0.3, hh + 0.3, z], s: [1.5, 1.25, 1.5], c: TERRA }, 16, 10).cyl(0.08, 0.08, 0.5, 6, { p: [HX - 1.5 - (9 - n) * 0.3, hh + 1.7, z], c: LIME }); kl.push([HX - 1.5 - (9 - n) * 0.3, hh + 1.5, z, 1.4]);
      if (Math.abs(c) % 2 === 0 && c) S.box(0.3, hh, 0.5, { p: [HX + 0.42 - (9 - n) * 0.3, hh / 2, z + 1.7], c: LIME }); }
    // plinth with arched doors, merlons along every step of the skyline
    const bay = new THREE.ExtrudeGeometry(archShape(5, 6.4, 3.1, 2.7, 2.3, 7, 0.2), { depth: 0.7, bevelEnabled: false }), bays = [];
    for (let k = -5; k <= 5; k++) bays.push([HX + 0.5, 0, HZ + k * 5, Math.PI / 2, PINK]);
    S.box(1.2, 6.5, 58, { p: [HX - 0.4, 3.25, HZ], c: DARK }).box(1.6, 0.4, 58.6, { p: [HX + 0.7, 6.45, HZ], c: LIME });
    // the palace continues as the street wall on both sides
    for (const [z0, n] of [[HZ + 32, 5], [HZ - 32 - 4 * 5.02 - 5, 5]]) for (let k = 0; k < n; k++) { const z = z0 + k * 5.02, hh = 13.4 + ((k * 3) % 2) * 5; bays.push([HX + 0.5, 0, z, Math.PI / 2, k % 2 ? ROSE : PINK]); S.box(8, hh, 5.04, { p: [HX - 4, hh / 2, z], c: k % 2 ? PINK : 0xd47a62 }).box(8.4, 0.3, 5.1, { p: [HX - 4, hh + 0.15, z], c: LIME }).box(0.5, 2.6, 4.4, { p: [HX - 0.1, 1.5, z], c: DARK });
      jh.push([HX + 0.4, 8.3, z, Math.PI / 2, 1.05]); if (hh > 14) jh.push([HX + 0.4, 13.2, z, Math.PI / 2, 1.0]); for (let m = -2; m <= 2; m++) S.box(0.5, 0.7, 0.7, { p: [HX - 0.2, hh + 0.65, z + m * 1.0], c: PINK }); warm.push([HX + 0.45, 2.6, z, Math.PI / 2, 2.8, 2.6]); }
    // ---- the bazaar across the street ----
    const BX = 44; for (let k = 0; k < 19; k++) { const z = 30 - k * 5.02, two = (k * 7) % 5 !== 0, hh = two ? 13.4 : 7.4; bays.push([BX - 0.5, 0, z, -Math.PI / 2, k % 3 ? ROSE : PINK]); S.box(9, hh, 5.04, { p: [BX + 4.4, hh / 2, z], c: k % 2 ? 0xd88a72 : PINK }).box(9.4, 0.3, 5.1, { p: [BX + 4.4, hh + 0.15, z], c: LIME }).box(0.5, 2.6, 4.4, { p: [BX + 0.1, 1.5, z], c: DARK });
      S.box(2.4, 0.12, 4.9, { p: [BX - 1.5, 6.1, z], r: [0, 0, 0.22], c: pick([0xb8322e, 0xe0a030, 0x2a8f96, 0xc8455e]) }); if (two) jh.push([BX - 0.4, 8.3, z, -Math.PI / 2, 1.05]); for (let m = -2; m <= 2; m++) S.box(0.5, 0.7, 0.7, { p: [BX + 0.2, hh + 0.65, z + m * 1.0], c: PINK });
      warm.push([BX - 0.45, 2.6, z, -Math.PI / 2, 2.8, 2.6]); if (k % 2) halo.push({ p: [BX - 1.6, 4.6, z], s: 5, c: 0xffb060 }); }
    // ---- the painted gate: nine frames of cusped arches, one inside the next ----
    const GZ = -96, gf = [], paint = painted(), FW = 24, FH = 18;
    for (let k = 0; k < 9; k++) { const z = GZ - k * 11, sc = 1 - k * 0.012; gf.push(xform(new THREE.ExtrudeGeometry(archShape(FW, FH, 10.5, 5.2, 6.6, 9, 0.2), { depth: 2.6, bevelEnabled: false }), { p: [0, 0, z], s: [sc, sc, 1] }));
      Gd.cyl(0.03, 0.03, 2.8, 5, { p: [0, 10.2, z + 1.3] }).sph(0.42, { p: [0, 8.5, z + 1.3], s: [1, 1.3, 1] }, 12, 10).cone(0.3, 0.5, 8, { p: [0, 9.3, z + 1.3] }); halo.push({ p: [0, 8.5, z + 1.3], s: 5.5, c: 0xffb45a });
      for (const s of [-1, 1]) { S.box(2.2, FH, 8.4, { p: [s * (FW / 2 - 1.1), FH / 2, z - 4.2 - 1.3], c: ROSE }).box(0.3, 9, 5.2, { p: [s * (FW / 2 - 2.3), 5.5, z - 5.5], c: 0x2a8f96 }).box(0.34, 9.6, 0.4, { p: [s * (FW / 2 - 2.3), 5.5, z - 2.8], c: LIME }).box(0.34, 9.6, 0.4, { p: [s * (FW / 2 - 2.3), 5.5, z - 8.2], c: LIME }).box(0.34, 0.4, 5.8, { p: [s * (FW / 2 - 2.3), 10.2, z - 5.5], c: LIME }).box(2.6, 1.1, 8.4, { p: [s * (FW / 2 - 1.3), 0.55, z - 5.5], c: LIME });
        Gd.sph(0.5, { p: [s * (FW / 2 - 2.5), 7.6, z - 5.5], s: [0.3, 1, 1] }, 12, 8); } }
    for (const s of [-1, 1]) { S.cyl(2.2, 2.6, FH + 4, 8, { p: [s * (FW / 2 + 1.4), (FH + 4) / 2, GZ + 1.3], c: PINK }).sph(1, { p: [s * (FW / 2 + 1.4), FH + 4.3, GZ + 1.3], s: [2.7, 2.4, 2.7], c: TERRA }, 18, 12); kl.push([s * (FW / 2 + 1.4), FH + 6.6, GZ + 1.3, 2.4]); for (let m = 0; m < 8; m++) S.cyl(0.14, 0.14, 2.6, 6, { p: [s * (FW / 2 + 1.4) + Math.cos(m * TAU / 8) * 2.5, FH + 3, GZ + 1.3 + Math.sin(m * TAU / 8) * 2.5], c: LIME }); }
    S.box(FW + 2, 1.2, 90.6, { p: [0, FH + 0.6, GZ - 44], c: PINK }); for (let m = -5; m <= 5; m++) S.box(1.3, 1.6, 2.6, { p: [m * 2.2, FH + 0.8, GZ + 1.3], c: PINK });
    const frames = new THREE.Mesh(merge(gf), new THREE.MeshStandardMaterial({ map: paint, roughness: 0.72 })); frames.castShadow = frames.receiveShadow = true; scene.add(frames);
    const mT = mandalaTex(), cg = []; for (let k = 0; k < 8; k++) cg.push(xform(new THREE.PlaneGeometry(FW - 4.6, 8.4), { p: [0, FH - 0.02, GZ - k * 11 - 6.8], r: [Math.PI / 2, 0, 0] }));
    scene.add(new THREE.Mesh(merge(cg), new THREE.MeshStandardMaterial({ map: mT, roughness: 0.7, emissive: 0xffffff, emissiveMap: mT, emissiveIntensity: 0.16 })));
    const inlay = canvasTex(512, 512, (g, W) => { g.fillStyle = '#efe6da'; g.fillRect(0, 0, W, W); g.fillStyle = '#c96a58'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) { g.save(); g.translate(i * 128 + 64, j * 128 + 64); g.rotate(Math.PI / 4); g.fillRect(-40, -40, 80, 80); g.restore(); } g.strokeStyle = '#2a8f96'; g.lineWidth = 6; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, W); g.moveTo(0, i * 128); g.lineTo(W, i * 128); g.stroke(); } }, { repeat: [3, 16] });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(FW - 4.6, 92).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: inlay, roughness: 0.3, metalness: 0.05 })); fl.geometry.dispose(); fl.geometry = new THREE.PlaneGeometry(FW - 4.6, 108).rotateX(-Math.PI / 2); inlay.repeat.set(3, 19); fl.position.set(0, 0.03, GZ - 52); fl.receiveShadow = true; scene.add(fl);

    // ---- the courtyard: arcades, corner chhatris, and a rangoli that blooms ----
    const CZ = -236, CS = 34; for (let k = -6; k <= 6; k++) { for (const s of [-1, 1]) { bays.push([s * CS, 0, CZ + k * 5, s > 0 ? -Math.PI / 2 : Math.PI / 2, k % 2 ? ROSE : PINK]); warm.push([s * (CS + 0.2), 2.4, CZ + k * 5, s > 0 ? -Math.PI / 2 : Math.PI / 2, 2.8, 2.4]); if (k % 2 === 0) jh.push([s * (CS - 0.1), 8.6, CZ + k * 5, s > 0 ? -Math.PI / 2 : Math.PI / 2, 1.1]); }
      if (Math.abs(k) > 1) for (const z of [CZ + CS, CZ - CS]) bays.push([k * 5, 0, z, z > CZ ? Math.PI : 0, k % 2 ? PINK : ROSE]); }
    for (const s of [-1, 1]) S.box(7, 13.6, CS * 2 + 7, { p: [s * (CS + 3.8), 6.8, CZ], c: PINK }).box(7.4, 0.3, CS * 2 + 7.4, { p: [s * (CS + 3.8), 13.75, CZ], c: LIME });
    for (const z of [CZ + CS + 3.8, CZ - CS - 3.8]) for (const s of [-1, 1]) S.box(CS - 7, 13.6, 7, { p: [s * (CS + 7) / 2 + s * 3.5, 6.8, z], c: PINK });
    // the courtyard's north entry: wall returns behind the first arches, so the passage reads as one opening
    for (const sd of [-1, 1]) S.box(3.4, 13.6, 7.4, { p: [sd * 9.2, 6.8, CZ + CS + 3.8], c: PINK }).box(3.6, 0.35, 7.8, { p: [sd * 9.2, 13.75, CZ + CS + 3.8], c: LIME });
    for (let m = -30; m <= 30; m++) for (const s of [-1, 1]) S.box(0.6, 0.9, 0.7, { p: [s * (CS + 0.6), 14.3, CZ + m * 1.15], c: PINK });
    const chh = (x, y, z, sc) => { for (let m = 0; m < 6; m++) { const a = m * TAU / 6; S.cyl(0.13 * sc, 0.16 * sc, 2.6 * sc, 8, { p: [x + Math.cos(a) * 1.5 * sc, y + 1.3 * sc, z + Math.sin(a) * 1.5 * sc], c: LIME }); } S.cyl(1.9 * sc, 1.9 * sc, 0.25 * sc, 6, { p: [x, y + 0.12, z], c: PINK }).cyl(2.2 * sc, 2.0 * sc, 0.2 * sc, 16, { p: [x, y + 2.7 * sc, z], c: LIME }).sph(1, { p: [x, y + 2.8 * sc, z], s: [1.8 * sc, 1.5 * sc, 1.8 * sc], c: TERRA }, 18, 12); kl.push([x, y + 4.25 * sc, z, 1.6 * sc]); };
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) chh(sx * (CS + 3.8), 13.9, CZ + sz * (CS + 3.8), 1.5);
    const rang = new THREE.Mesh(new THREE.CircleGeometry(21, 96).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uB: { value: 0 }, uL: { value: 1 }, uFogCol: U.uFogCol, uFogDen: U.uFogDen },
      vertexShader: 'varying vec2 vP; varying float vD; void main(){ vP = position.xz; vec4 mv = modelViewMatrix*vec4(position,1.0); vD = -mv.z; gl_Position = projectionMatrix*mv; }',
      fragmentShader: /* glsl */`varying vec2 vP; varying float vD; uniform float uTime, uB, uL, uFogDen; uniform vec3 uFogCol; ${NOISE}
        vec3 pal(float k){ k = mod(k, 6.0); return k < 1.0 ? vec3(0.95, 0.18, 0.42) : k < 2.0 ? vec3(1.0, 0.62, 0.08) : k < 3.0 ? vec3(0.08, 0.62, 0.62) : k < 4.0 ? vec3(0.98, 0.95, 0.86) : k < 5.0 ? vec3(0.42, 0.16, 0.62) : vec3(0.3, 0.7, 0.2); }
        void main(){ float rr = length(vP)/21.0, a = atan(vP.y, vP.x); vec3 c = vec3(0.82, 0.74, 0.66)*(0.8 + 0.3*fbm(vP*1.4)); float grain = 0.75 + 0.5*hash21(floor(vP*26.0));
          for (int i = 6; i >= 0; i--){ float k = float(i), r0 = k*0.135, n = 8.0 + 4.0*k, grow = clamp(uB*8.5 - k, 0.0, 1.0), pet = pow(abs(cos(a*n*0.5 + k*0.9)), 0.7);
            float edge = r0 + (0.05 + 0.13*pet)*grow; float m = smoothstep(edge, edge - 0.008, rr)*step(0.001, grow); c = mix(c, pal(k)*grain, m);
            float e2 = r0 + (0.02 + 0.07*pow(abs(sin(a*n*0.5 + k*0.9)), 0.6))*grow; c = mix(c, pal(k + 2.0)*grain, smoothstep(e2, e2 - 0.006, rr)*step(0.001, grow));
            c = mix(c, vec3(0.98, 0.95, 0.86)*grain, smoothstep(0.006, 0.0, abs(rr - edge))*step(0.001, grow)*0.8); }
          c = mix(c, vec3(1.0, 0.7, 0.1)*grain, smoothstep(0.035*uB, 0.03*uB, rr));
          gl_FragColor = vec4(mix(uFogCol, c*c*uL*0.72, exp(-uFogDen*uFogDen*vD*vD)), 1.0); }` })); rang.position.set(0, 0.04, CZ); scene.add(rang);
    for (let k = 0; k < 48; k++) { const a = k / 48 * TAU; diyas.push([Math.cos(a) * 22.2, 0.16, CZ + Math.sin(a) * 22.2]); } for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; diyas.push([Math.cos(a) * 9.4, 0.16, CZ + Math.sin(a) * 9.4]); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.39, x = Math.cos(a) * 26, z = CZ + Math.sin(a) * 26; Gd.lathe([[0.3, 0], [0.7, 0.1], [1.05, 0.5], [1.0, 0.62], [0.4, 0.5], [0.1, 0.5]], 20, { p: [x, 0, z] }); for (let m = 0; m < 9; m++) diyas.push([x + Math.cos(m * 0.7) * 0.6 * (m ? 1 : 0), 0.62, z + Math.sin(m * 0.7) * 0.6 * (m ? 1 : 0)]); }

    // ---- the kund: nine terraces of zigzag stairs falling to a square of water ----
    const TH = 2.6, TW = 3.2, NT = 9, WY = -TH * NT + 0.35, stair = (() => { const b = new Builder(); for (let j = 0; j < 6; j++) b.box(5.6 * (1 - j / 6.4), TH / 6, 1.5, { p: [0, (j + 0.5) * TH / 6, 0.75], c: j % 2 ? 0xd0a07c : 0xc8946e }); return b.geometry(); })(), st = [];
    for (let i = 0; i < NT; i++) { const b = KS - TW * i, a = b - TW, y = -TH * (i + 1), hh = TH * (NT - i) + 2, col = i % 2 ? 0xcfa07c : 0xc4906a;
      S.box(b * 2, hh, TW, { p: [0, y - hh / 2, KZ + a + TW / 2], c: col }).box(b * 2, hh, TW, { p: [0, y - hh / 2, KZ - a - TW / 2], c: col }).box(TW, hh, a * 2, { p: [a + TW / 2, y - hh / 2, KZ], c: col }).box(TW, hh, a * 2, { p: [-a - TW / 2, y - hh / 2, KZ], c: col });
      const n = Math.floor((a * 2 - 1) / 5.7); for (let k = 0; k < n; k++) { const u = (k - (n - 1) / 2) * 5.7; st.push([u, y, KZ + b, Math.PI], [u, y, KZ - b, 0], [b, y, KZ + u, -Math.PI / 2], [-b, y, KZ + u, Math.PI / 2]); }
      const m = Math.floor(a * 2 / 1.6); for (let k = 0; k <= m; k++) { const u = -a + k * (a * 2 / m); diyas.push([u, y + 0.1, KZ + a + 0.25], [u, y + 0.1, KZ - a - 0.25], [a + 0.25, y + 0.1, KZ + u], [-a - 0.25, y + 0.1, KZ + u]); } }
    S.box(12, 2, 12, { p: [0, WY - 1.4, KZ], c: 0x6a5a4c });
    scene.add(instanced(stair, stone, st.length, (i, d, c) => { const q = st[i]; d.position.set(q[0], q[1], q[2]); d.rotation.y = q[3]; c.setScalar(0.9 + r() * 0.14); }, true));
    const pool = water({ size: (KS - TW * NT) * 2, deep: 0x06231f, shallow: 0x1a6a58, skyTop: 0x2a3f86, skyHorizon: 0xffa25c, sunDir, sunColor: 0xffc890, mirror: mirror(WY, { center: [0, WY, KZ], range: 120 }), mirrorStrength: 0.9, scale: 0.7, chop: 0.12, distort: 0.012, glint: 2, speed: 0.5 }); pool.position.set(0, WY, KZ); scene.add(pool);
    for (let k = 0; k < 26; k++) diyas.push([(r() - 0.5) * 6.4, WY + 0.08, KZ + (r() - 0.5) * 6.4]);
    // rim pavilions and the arcade behind
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) chh(sx * (KS + 3), 0, KZ + sz * (KS + 3), 1.7); for (const sx of [-1, 1]) chh(sx * 14, 0, KZ - KS - 3.5, 1.3);
    const PZ = KZ - KS - 12; for (let k = -5; k <= 5; k++) { for (const yy of [0, 6.7]) { bays.push([k * 5, yy, PZ, 0, yy ? ROSE : PINK]); warm.push([k * 5, yy + 2.4, PZ - 0.3, 0, 2.8, 2.4]); } if (Math.abs(k) % 2 === 1) jh.push([k * 5, 15.4, PZ + 0.2, 0, 1.25]); }
    S.box(57, 21, 8, { p: [0, 10.5, PZ - 4.4], c: PINK }).box(57.6, 0.35, 8.6, { p: [0, 21.2, PZ - 4.4], c: LIME }).box(56, 0.3, 1, { p: [0, 6.55, PZ + 0.3], c: LIME }).box(56, 0.3, 1, { p: [0, 13.3, PZ + 0.3], c: LIME });
    for (const x of [-22, 0, 22]) chh(x, 21.4, PZ - 4.4, x ? 1.7 : 2.4); for (let m = -24; m <= 24; m++) S.box(0.6, 0.9, 0.7, { p: [m * 1.15, 21.8, PZ - 0.4], c: PINK });

    // ---- street life: bunting, garlands, lamp posts, trees, bougainvillea ----
    const flagC = [0xe8452e, 0xf0b02a, 0x2a9d9a, 0xd8508a, 0xfff0d8, 0x6a3fa8], fg = new Builder(), gar = [];
    for (let k = 0; k < 13; k++) { const z = 24 - k * 8.6, y0 = 15 + (k % 3) * 2; for (let m = 0; m <= 46; m++) { const u = m / 46, x = lerp(HX + 1.6, BX - 1, u), y = y0 - Math.sin(u * Math.PI) * 4.2; if (m % 2) fg.cone(0.42, 0.95, 3, { p: [x, y - 0.5, z + Math.sin(u * 9) * 0.3], r: [Math.PI, 0, 0], s: [1, 1, 0.08], c: flagC[(m + k) % 6] }); else gar.push([x, y - 0.12, z]); } }
    scene.add(new THREE.Mesh(fg.geometry(), windify(stdMat({ side: THREE.DoubleSide, roughness: 0.7 }), { amp: 0.18, freq: 2.4, scale: 0.4, h0: 8, h1: 9 })));
    for (let k = 0; k < 9; k++) for (let m = 0; m < 40; m++) { const a = Math.PI * (1 - m / 40); gar.push([Math.cos(a) * 5.4, 5.4 + Math.sin(a) * 6.2 + Math.sin(m * 0.8) * 0.12, GZ - k * 11 + 2.75]); }
    scene.add(instanced(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshStandardMaterial({ roughness: 0.8, emissive: 0xff7a00, emissiveIntensity: 0.25 }), gar.length, (i, d, c) => { d.position.set(...gar[i]); d.scale.setScalar(0.8 + r() * 0.6); c.set(i % 3 ? 0xff9a1a : 0xffc93a); }));
    for (let k = 0; k < 8; k++) for (const s of [-1, 1]) { const x = s * 14, z = 26 - k * 15; S.cyl(0.1, 0.16, 6.4, 8, { p: [x, 3.2, z], c: 0x2a2a30 }); Gd.sph(0.42, { p: [x, 6.7, z], s: [1, 1.2, 1] }, 10, 8); halo.push({ p: [x, 6.7, z], s: 6, c: 0xffb45a }); }
    const tm = treeMats({ map: leafTex(104, 52, 30), bark: barkTex('#5a4a3c'), wind: 0.1, h0: 2, h1: 12 }), tv = [broadleaf({ seed: 8, height: 11, depth: 4, forks: 4, spread: 0.85, gnarl: 0.4, up: 0.4, trunk: 0.28, radius: 0.5, cardSize: 1.6, cardsPer: 4, light: [0.26, 0.5] }), broadleaf({ seed: 31, height: 13, depth: 4, forks: 3, spread: 0.8, gnarl: 0.42, up: 0.45, trunk: 0.3, radius: 0.55, cardSize: 1.7, cardsPer: 4, light: [0.26, 0.52] })], tl = [[], []];
    [[-22, 34], [24, 40], [-27, -76], [27, -80], [-24, CZ + 22], [24, CZ - 22], [-24, CZ - 22], [24, CZ + 22], [-46, KZ + 44], [46, KZ + 44], [-52, KZ - 20], [52, KZ - 20], [-60, -130], [62, -150], [-70, -210], [72, -250]].forEach(([x, z], i) => tl[i % 2].push({ p: [x, -0.2, z], s: 0.9 + r() * 0.4, ry: r() * 6 }));
    tl.forEach((l, i) => plant(scene, tv[i], tm, l));
    const bgm = treeMats({ map: blossomTex(325), bark: barkTex(), wind: 0.05, h0: 0, h1: 2, emissive: 0xff3a8a, emissiveIntensity: 0.1 }).leaf;
    scene.add(instanced(bush({ seed: 6, radius: 1, cards: 30, hue: [0.9, 0.94], sat: 0.75, light: [0.5, 0.68] }), bgm, 150, (i, d, c) => { const m = i % 3; if (m === 0) d.position.set(BX - 0.6 + r(), 6.4 + r() * 0.8, 30 - r() * 95); else if (m === 1) d.position.set((r() < 0.5 ? -1 : 1) * (CS - 0.5), 13.2 + r() * 0.8, CZ + (r() - 0.5) * 66); else d.position.set((r() - 0.5) * 54, 20.6 + r(), PZ - 0.6); const s = 0.8 + r() * 1.2; d.scale.set(s * 1.3, s, s * 1.3); d.rotation.y = r() * 6; c.setHSL(0.9 + r() * 0.06, 0.7, 0.6 + r() * 0.3); }, true));
    // the old city on the ridge
    const far = new Builder(); for (let i = 0; i < 150; i++) { const a = r() * TAU, R = 220 + r() * 420, x = Math.cos(a) * R, z = -180 + Math.sin(a) * R, w = 10 + r() * 22, hh = 8 + r() * 18; if (Math.abs(x) < 70 && z < 60 && z > -430) continue; far.box(w, hh, w * (0.7 + r() * 0.6), { p: [x, hh / 2, z], r: [0, r() * 0.3, 0], c: pick([PINK, ROSE, 0xcf7c66, 0xe0a088]) }); if (r() < 0.3) far.sph(1, { p: [x, hh, z], s: [w * 0.22, w * 0.2, w * 0.22], c: TERRA }, 10, 8); }
    for (let i = 0; i < 60; i++) { const a = -2.4 + i / 60 * 1.9, R = 900, x = Math.cos(a) * R, z = -200 + Math.sin(a) * R, hh = 90 + fbm2(i * 0.2, 3, 3) * 120; far.cone(170, hh, 7, { p: [x, hh / 2 - 6, z], r: [0, i, 0], c: 0xb88a78 }); if (i % 3 === 0) far.box(60, 12, 9, { p: [x, hh - 12, z + 20], r: [0, -a + Math.PI / 2, 0], c: 0xd8a888 }); }
    scene.add(far.mesh(stone, false));

    // ================= the living city: paving, market, people, animals, havelis, temples, the fort =================
    const KO = KS + 16, CLO = [0xd8202e, 0xf0a020, 0xe8508a, 0x1f9a9a, 0x3a5ac8, 0xf4efe6, 0xffd23a, 0x8a2a9a, 0x2a8a4a, 0xff6a2a];
    const CL = [0xc8202e, 0xe89a1a, 0x1f8a8a, 0xd83a7a, 0x3a5ab8, 0x8a2a8a, 0xf0c030, 0x2a8a3a];
    // ground positions the camera passes low over: nothing tall is placed near them
    const RK = [[36, 22], [2, -30], [7, -62], [0, GZ - 14], [0, GZ - 86], [-9, KZ + KS + 22], [17, KZ + 20], [0.6, KZ + 2.6], [0, KZ + KS + 10]];
    const nearRail = (x, z, rad) => { for (let i = 0; i < RK.length - 1; i++) { const [ax, az] = RK[i], [bx, bz] = RK[i + 1], dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz + 1e-6), 0, 1); if (Math.hypot(x - ax - dx * t, z - az - dz * t) < rad) return true; } return false; };
    // top of the kund terrace under (x, z), or null over the water
    const terrace = (x, z) => { const m = Math.max(Math.abs(x), Math.abs(z - KZ)); if (m >= KS) return 0; const i = Math.floor((KS - m) / TW); return i >= NT ? null : -TH * (i + 1); };

    // ---- paving: sandstone flags laid in courses ----
    const paveT = canvasTex(512, 512, (g, W) => { const q = rng(41), rows = [0, 92, 188, 284, 392, 512]; g.fillStyle = '#7a5a46'; g.fillRect(0, 0, W, W);
      for (let j = 0; j < 5; j++) { let x = -q() * 80; const h = rows[j + 1] - rows[j]; while (x < W) { const w = 70 + q() * 110; g.fillStyle = `hsl(${16 + q() * 14},${28 + q() * 18}%,${60 + q() * 15}%)`; for (const ox of [-W, 0, W]) g.fillRect(x + ox + 3, rows[j] + 3, w - 6, h - 6); x += w; } }
      g.globalAlpha = 0.1; for (let i = 0; i < 5000; i++) { g.fillStyle = q() < 0.5 ? '#000' : '#fff'; g.fillRect(q() * W, q() * W, 1 + q() * 3, 1 + q() * 3); } }, { repeat: [1, 1] });
    const pv = [], pane = (x0, x1, z0, z1, k = 1 / 6) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) * k, uv.getY(i) * (z1 - z0) * k); g.translate((x0 + x1) / 2, 0.02, (z0 + z1) / 2); pv.push(g); };
    pane(-40, 42, -92, 40); pane(-CS, CS, CZ - CS, CZ + CS); pane(-KO, KO, KZ + KS, KZ + KO); pane(-KO, KO, KZ - KO, KZ - KS); pane(KS, KO, KZ - KS, KZ + KS); pane(-KO, -KS, KZ - KS, KZ + KS);
    const paving = new THREE.Mesh(merge(pv), new THREE.MeshStandardMaterial({ map: paveT, bumpMap: paveT, bumpScale: 1.1, roughness: 0.88 })); paving.receiveShadow = true; scene.add(paving);

    // ---- the market: stalls with canopies, goods, sellers and customers ----
    const cloth = new Builder(), goods = new Builder(), lanterns = [], smoke = [], folk = [], fountains = [];
    const addP = (x, y, z, ry, sy = 1) => folk.push({ x, y, z, ry, s: 1.0 + r() * 0.14, sy, v: r() < 0.5 ? 1 : 0, c: pick(CLO) });
    const stripeT = canvasTex(256, 256, (g, W) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#d8c8b0'; g.fillRect(i * 32, 0, 32, W); } g.fillStyle = 'rgba(0,0,0,0.14)'; for (let i = 0; i < 8; i++) g.fillRect(i * 32 + 28, 0, 4, W); });
    function stall(x, z, ry, kind) {
      const c = Math.cos(ry), s = Math.sin(ry), p = (lx, ly, lz) => [x + lx * c + lz * s, ly, z - lx * s + lz * c], top = 0.96;
      goods.box(3.2, 0.9, 1.4, { p: p(0, 0.45, 0.3), r: [0, ry, 0], c: 0x6a4428 }).box(3.3, 0.06, 1.5, { p: p(0, 0.92, 0.3), r: [0, ry, 0], c: 0x8a5a34 });
      for (const [lx, lz] of [[-1.65, -0.6], [1.65, -0.6], [-1.65, 1.62], [1.65, 1.62]]) goods.cyl(0.05, 0.05, 2.7, 6, { p: p(lx, 1.35, lz), c: 0x3a2a1a });
      cloth.box(3.7, 0.05, 2.6, { p: p(0, 2.72, 0.5), r: [0, ry, 0], c: pick(CL) }).box(3.7, 0.38, 0.03, { p: p(0, 2.53, 1.8), r: [0, ry, 0], c: pick(CL) }).box(3.3, 1.8, 0.03, { p: p(0, 1.8, -0.62), r: [0, ry, 0], c: pick(CL) });
      lanterns.push(p(-1.45, 2.25, 1.7), p(1.45, 2.25, 1.7)); halo.push({ p: p(0, 2.3, 0.7), s: 3.4, c: 0xffb060 });
      if (kind === 0) { for (let k = 0; k < 10; k++) { const lx = -1.25 + (k % 5) * 0.62, lz = 0.05 + Math.floor(k / 5) * 0.55; for (let j = 0, n = 3 + Math.floor(r() * 4); j < n; j++) goods.box(0.55, 0.09, 0.42, { p: p(lx, top + 0.05 + j * 0.095, lz), r: [0, ry + (r() - 0.5) * 0.15, 0], c: pick(CL) }); }
        for (let k = 0; k < 6; k++) cloth.box(0.44, 1.5, 0.02, { p: p(-1.4 + k * 0.56, 1.75, 1.7), r: [0, ry, 0], c: pick(CL) }); }
      else if (kind === 1) { for (let k = 0; k < 10; k++) { const lx = -1.3 + (k % 5) * 0.65, lz = Math.floor(k / 5) * 0.6, sc = 0.7 + r() * 0.6, brass = r() < 0.45, pts = [[0.05, 0], [0.22, 0.06], [0.3, 0.2], [0.24, 0.36], [0.12, 0.42], [0.13, 0.5]].map(([a, b]) => [a * sc, b * sc]);
          (brass ? Gd : goods).lathe(pts, 14, { p: p(lx, top, lz), c: brass ? 0xffffff : pick([0xa8502e, 0x8a3e22, 0xc0683a]) }); }
        for (let k = 0; k < 6; k++) goods.lathe([[0.05, 0], [0.4, 0.1], [0.5, 0.35], [0.38, 0.62], [0.2, 0.7], [0.22, 0.82]], 14, { p: p(-2.35, 0, -0.4 + k * 0.42), c: pick([0xa8502e, 0x8a3e22, 0xb8603a]) }); }
      else if (kind === 2) { const sp = [0xc8201a, 0xe8b01a, 0xd86a1a, 0x6a8a2a, 0x7a3a1a, 0xe8d8b0]; for (let k = 0; k < 8; k++) { const lx = -1.2 + (k % 4) * 0.8, lz = 0.05 + Math.floor(k / 4) * 0.6; goods.cyl(0.32, 0.26, 0.2, 14, { p: p(lx, top + 0.1, lz), c: 0x8a6a3a }).cone(0.3, 0.38, 14, { p: p(lx, top + 0.39, lz), c: sp[k % 6] }); }
        for (let k = 0; k < 4; k++) goods.cyl(0.45, 0.38, 0.5, 14, { p: p(-2.3, 0.25, -0.2 + k * 0.6), c: 0x7a5a2a }).cone(0.42, 0.3, 14, { p: p(-2.3, 0.65, -0.2 + k * 0.6), c: sp[(k + 2) % 6] }); }
      else if (kind === 3) { const fr = [0xff8a1a, 0x8ac83a, 0xd8201a, 0xffd23a, 0x6a2a6a]; for (let k = 0; k < 6; k++) { const lx = -1.1 + (k % 3) * 1.1, lz = 0.05 + Math.floor(k / 3) * 0.6, col = fr[k % 5]; goods.cyl(0.4, 0.34, 0.1, 14, { p: p(lx, top + 0.05, lz), c: 0x8a6a3a });
          for (let j = 0; j < 16; j++) { const a = r() * TAU, rr = r() * 0.32; goods.sph(0.075, { p: p(lx + Math.cos(a) * rr, top + 0.14 + (0.32 - rr) * 0.8, lz + Math.sin(a) * rr * 0.7), c: col }, 6, 5); } }
        goods.cyl(0.35, 0.4, 0.6, 10, { p: p(-2.3, 0.3, 0.6), c: 0x2a2624 }).cyl(0.55, 0.3, 0.22, 16, { p: p(-2.3, 0.72, 0.6), c: 0x1a1816 }); smoke.push(p(-2.3, 0.9, 0.6)); halo.push({ p: p(-2.3, 0.5, 0.6), s: 1.6, c: 0xff6a20 }); }
      else { for (let k = 0; k < 5; k++) for (let j = 0; j < 9; j++) goods.tor(0.1, 0.018, { p: p(-1.2 + k * 0.6, top + 0.02 + j * 0.04, 0.35), r: [Math.PI / 2, 0, 0], c: pick(CL) }, TAU, 10);
        for (let k = 0; k < 4; k++) goods.sph(0.26, { p: p(-1.0 + k * 0.65, top + 0.12, -0.12), s: [1, 0.5, 1], c: k % 2 ? 0xff9a1a : 0xffc93a }, 10, 6);
        for (let k = 0; k < 5; k++) for (let j = 0; j < 9; j++) goods.sph(0.06, { p: p(-1.3 + k * 0.65, 2.45 - j * 0.16, 1.68), c: j % 2 ? 0xff9a1a : 0xfff0d0 }, 6, 4); }
      { const q = p(0.3 - r() * 0.6, 0, -0.15); addP(q[0], 0, q[2], ry); }
      for (let k = 0, n = Math.floor(r() * 3.2); k < n; k++) { const [px, , pz] = p(-1.2 + r() * 2.4, 0, 2.3 + r() * 0.8); if (!nearRail(px, pz, 2.8)) addP(px, 0, pz, ry + Math.PI + (r() - 0.5) * 0.6); }
    }
    for (let z = 26; z > -62; z -= 6.4) { if (!nearRail(-33, z, 4)) stall(-33, z, Math.PI / 2, Math.floor(r() * 5)); if (!nearRail(36.5, z, 4)) stall(36.5, z, -Math.PI / 2, Math.floor(r() * 5)); }
    for (let z = 14; z > -56; z -= 8.5) for (const [x, ry] of [[-16.2, -Math.PI / 2], [-13.4, Math.PI / 2], [17.6, -Math.PI / 2], [20.4, Math.PI / 2]]) if (!nearRail(x, z, 6) && r() < 0.88) stall(x, z, ry, Math.floor(r() * 5));
    // wanderers in the open lanes and in front of the gate
    for (let i = 0; i < 500 && folk.length < 175; i++) { const x = lerp(-10, 13, r()), z = lerp(-90, 30, r()); if (!nearRail(x, z, 3.2)) addP(x, 0, z, r() * TAU); }
    for (let i = 0; i < 200; i++) { const x = lerp(-14, 14, r()), z = lerp(-66, -92, r()); if (!nearRail(x, z, 3.2) && Math.abs(x) > 2.5) addP(x, 0, z, r() * TAU); if (folk.length > 205) break; }
    for (let i = 0; i < 48; i++) { const sd = i % 2 ? 1 : -1; addP(sd * (3.4 + r() * 5), 0, GZ - 4 - r() * 100, r() < 0.7 ? (r() < 0.5 ? 0 : Math.PI) : r() * TAU); }

    // ---- haveli rows that close every view ----
    function haveli(x, z, ry, w, floors, col) {
      const c = Math.cos(ry), s = Math.sin(ry), Hh = 6.6 + (floors - 1) * 4.6 + 1.2, P = (u, y, d) => [x + c * u + s * d, y, z - s * u + c * d];
      S.box(w, Hh, 9, { p: P(0, Hh / 2, -4.5), r: [0, ry, 0], c: col }).box(w + 0.3, 0.35, 0.7, { p: P(0, Hh - 0.4, 0.2), r: [0, ry, 0], c: LIME }).box(w + 0.2, 0.3, 0.5, { p: P(0, 6.6, 0.25), r: [0, ry, 0], c: LIME });
      const nb = Math.max(1, Math.floor(w / 5)); for (let k = 0; k < nb; k++) { const u = (k - (nb - 1) / 2) * 5, [bx, , bz] = P(u, 0, 0.02), [wx, , wz] = P(u, 0, 0.5); bays.push([bx, 0, bz, ry, k % 2 ? ROSE : col]); warm.push([wx, 2.4, wz, ry, 2.8, 2.4]); }
      for (let f = 1; f < floors; f++) { const y = 6.6 + (f - 1) * 4.6, n = Math.max(1, Math.floor(w / 4.4)); for (let k = 0; k < n; k++) { const u = (k - (n - 1) / 2) * 4.4, [jx, , jz] = P(u, 0, 0);
          if ((k + f) % 3 === 2) S.box(1.1, 1.8, 0.2, { p: P(u, y + 1.8, 0.05), r: [0, ry, 0], c: DARK }).box(1.5, 0.15, 0.32, { p: P(u, y + 2.8, 0.12), r: [0, ry, 0], c: LIME }).box(1.5, 0.12, 0.3, { p: P(u, y + 0.86, 0.12), r: [0, ry, 0], c: LIME }); else jh.push([jx, y + 0.6, jz, ry, 0.95]); }
        S.box(w + 0.2, 0.25, 0.42, { p: P(0, y + 4.55, 0.2), r: [0, ry, 0], c: LIME }); }
      for (let m = -w / 2 + 0.6; m <= w / 2 - 0.6; m += 1.15) S.box(0.55, 0.85, 0.6, { p: P(m, Hh + 0.42, -0.3), r: [0, ry, 0], c: col });
      if (r() < 0.6) { const q = P((r() - 0.5) * (w - 6), 0, -4.5); chh(q[0], Hh, q[2], 1 + r() * 0.5); }
      if (r() < 0.5) for (let k = 0; k < 6; k++) cloth.box(0.6, 0.95, 0.02, { p: P(-3 + k * 1.15, Hh + 1.3, -6.5), r: [0, ry, 0], c: pick(CL) });
      if (r() < 0.5) { const q = P(w * 0.3, 0, -7); S.cyl(1.1, 1.1, 1.6, 12, { p: [q[0], Hh + 0.8, q[2]], c: 0x2a2a30 }); }
    }
    haveli(23, -91.5, 0, 13, 3, PINK); haveli(37, -91.5, 0, 13, 4, ROSE); haveli(-23, -91.5, 0, 13, 4, ROSE); haveli(-36, -91.5, 0, 12, 3, PINK);
    for (const sd of [-1, 1]) { for (const dz of [-24, 0, 24]) haveli(sd * 52, CZ + dz, sd > 0 ? -Math.PI / 2 : Math.PI / 2, 21, 3 + (dz === 0 ? 1 : 0), dz ? PINK : ROSE); for (const dz of [-25, 0, 25]) haveli(sd * (KO + 3), KZ + dz, sd > 0 ? -Math.PI / 2 : Math.PI / 2, 23, 3 + ((dz + 25) % 2), dz ? ROSE : PINK); }
    for (let k = 0; k < 4; k++) haveli(-56, 50 - k * 22, Math.PI / 2, 20, 3 + (k % 2), k % 2 ? PINK : ROSE);

    // ---- temples: a curved shikhara over a domed hall, saffron flag on top ----
    function temple(x, z, sc, col) {
      S.box(14 * sc, 2.2 * sc, 20 * sc, { p: [x, 1.1 * sc, z], c: col }).box(10 * sc, 7 * sc, 9 * sc, { p: [x, 5.6 * sc, z + 4 * sc], c: col });
      for (const sx of [-1, 1]) for (const k of [0, 1]) S.cyl(0.35 * sc, 0.4 * sc, 6 * sc, 8, { p: [x + sx * (4.3 - k * 2.4) * sc, 5.2 * sc, z + 8.8 * sc], c: LIME });
      S.lathe([[5.2, 0], [5.4, 2], [5.1, 7], [4.4, 12], [3.4, 16], [2.2, 19], [1.2, 20.6], [0.4, 21.2], [0, 21.4]].map(([a, b]) => [a * sc, b * sc]), 16, { p: [x, 2.2 * sc, z - 3 * sc], c: col });
      for (let k = 0; k < 6; k++) S.tor(lerp(5.35, 2.5, k / 6) * sc, 0.22 * sc, { p: [x, (5.2 + k * 2.8) * sc, z - 3 * sc], r: [Math.PI / 2, 0, 0], c: LIME }, TAU, 16);
      for (let k = 0; k < 8; k++) { const a = k * TAU / 8; S.lathe([[1.4, 0], [1.3, 3], [0.9, 5.4], [0.4, 6.4], [0, 6.7]].map(([a2, b]) => [a2 * sc, b * sc]), 8, { p: [x + Math.cos(a) * 4.6 * sc, 2.2 * sc, z - 3 * sc + Math.sin(a) * 4.6 * sc], c: col }); }
      S.sph(1, { p: [x, 23.8 * sc, z - 3 * sc], s: [1.7 * sc, 0.7 * sc, 1.7 * sc], c: col }).sph(1, { p: [x, 9.1 * sc, z + 4 * sc], s: [4 * sc, 3 * sc, 4 * sc], c: col }).cyl(0.05 * sc, 0.05 * sc, 4.5 * sc, 5, { p: [x, 26.6 * sc, z - 3 * sc], c: 0x3a2a1a });
      kl.push([x, 24.4 * sc, z - 3 * sc, 2 * sc], [x, 12 * sc, z + 4 * sc, 1.4 * sc]); cloth.cone(0.9 * sc, 2.4 * sc, 3, { p: [x + 1.2 * sc, 28.2 * sc, z - 3 * sc], r: [0, 0, -Math.PI / 2], c: 0xff7a1a });
      halo.push({ p: [x, 6 * sc, z + 9 * sc], s: 6 * sc, c: 0xffb050 });
    }
    temple(-74, 22, 1.15, 0xeac8a8); temple(-84, KZ + 6, 1.0, 0xf2e6d6); temple(76, -160, 1.25, 0xe2b494); temple(84, KZ - 30, 1.0, 0xeac0a0);

    // ---- the fort along the ridge: crenellated walls between bastions ----
    const fort = new Builder(); let prev = null;
    for (let i = 3; i < 57; i++) { const a = -2.4 + i / 60 * 1.9, R = 880, x = Math.cos(a) * R, z = -200 + Math.sin(a) * R, hh = 90 + fbm2(i * 0.2, 3, 3) * 120, y = 0.86 * hh - 6;
      if (prev) { const dx = x - prev[0], dz = z - prev[2], L = Math.hypot(dx, dz), dy = Math.abs(y - prev[1]), ang = -Math.atan2(dz, dx);
        fort.box(L + 1.5, 16 + dy, 4, { p: [(x + prev[0]) / 2, (y + prev[1]) / 2, (z + prev[2]) / 2], r: [0, ang, 0], c: 0xd4a082 });
        for (let m = 0; m < 7; m++) { const t = (m + 0.5) / 7; fort.box(2.2, 2.6, 4.4, { p: [lerp(prev[0], x, t), lerp(prev[1], y, t) + 8 + dy / 2 + 1.2, lerp(prev[2], z, t)], r: [0, ang, 0], c: 0xd4a082 }); } }
      if (i % 5 === 0) fort.cyl(7, 8.5, 26, 12, { p: [x, y + 5, z], c: 0xc99070 }).cyl(7.8, 7.8, 2.4, 12, { p: [x, y + 18.6, z], c: 0xe8b898 }).sph(1, { p: [x, y + 20, z], s: [4, 3.4, 4], c: 0xd8a080 }, 12, 8);
      prev = [x, y, z]; }
    scene.add(fort.mesh(stone, false));

    // ---- courtyard: dhurries with seated musicians, fountains, potted plants, a crowd around the rangoli ----
    const durT = canvasTex(256, 512, (g, W, H) => { g.fillStyle = '#9a1e24'; g.fillRect(0, 0, W, H); g.strokeStyle = '#1e3a6a'; g.lineWidth = 18; g.strokeRect(10, 10, W - 20, H - 20); g.strokeStyle = '#e8c070'; g.lineWidth = 4; g.strokeRect(26, 26, W - 52, H - 52);
      for (let j = 0; j < 6; j++) { const cx = W / 2, cy = 60 + j * 78; g.fillStyle = j % 2 ? '#1e3a6a' : '#e8c070'; g.beginPath(); g.moveTo(cx, cy - 30); g.lineTo(cx + 54, cy); g.lineTo(cx, cy + 30); g.lineTo(cx - 54, cy); g.closePath(); g.fill(); flower(g, cx, cy, 18, 6, '#fff6ea', '#9a1e24'); } });
    const dur = []; for (const sd of [-1, 1]) for (const dz of [-14, 14]) dur.push(xform(new THREE.PlaneGeometry(6, 18).rotateX(-Math.PI / 2), { p: [sd * 28.5, 0.05, CZ + dz] }));
    const durM = new THREE.Mesh(merge(dur), new THREE.MeshStandardMaterial({ map: durT, roughness: 0.95 })); durM.receiveShadow = true; scene.add(durM);
    for (const sd of [-1, 1]) for (const dz of [-14, 14]) for (let k = 0; k < 4; k++) addP(sd * (27 + (k % 2) * 2.4), 0.05, CZ + dz - 6 + k * 3.6 + r(), sd > 0 ? -Math.PI / 2 : Math.PI / 2, 0.58);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * 25, z = CZ + sz * 25; S.lathe([[0, 0], [2.6, 0], [2.8, 0.6], [2.6, 0.7], [2.3, 0.3], [0, 0.3]], 24, { p: [x, 0, z], c: 0xf2ebe0 }).cyl(0.22, 0.3, 1.6, 10, { p: [x, 0.8, z], c: 0xf2ebe0 }).lathe([[0, 0], [0.8, 0.05], [0.9, 0.28], [0.7, 0.28], [0, 0.15]], 16, { p: [x, 1.6, z], c: 0xf2ebe0 });
      Gd.sph(0.18, { p: [x, 1.95, z] }, 10, 8); fountains.push([x, z]); for (let k = 0; k < 10; k++) { const a = k * TAU / 10; diyas.push([x + Math.cos(a) * 2.75, 0.68, z + Math.sin(a) * 2.75]); } }
    const potG = new Builder().lathe([[0.05, 0], [0.42, 0.05], [0.58, 0.45], [0.5, 0.85], [0.62, 0.95], [0.58, 1.02], [0.4, 1.0]], 16, { c: 0xb0603a }).tor(0.52, 0.04, { p: [0, 0.62, 0], r: [Math.PI / 2, 0, 0], c: 0xf2ebe0 }, TAU, 18).geometry(), pots = [];
    for (let k = -6; k <= 5; k++) for (const sd of [-1, 1]) if (k % 2 === 0) pots.push([sd * (CS - 2.6), CZ + k * 5 + 2.5]);
    for (const sx of [-1, 1]) for (let k = -5; k <= 5; k += 2) pots.push([sx * (KS + 1.8), KZ + k * 5.6]); for (let k = -5; k <= 5; k += 2) pots.push([k * 5.6, KZ + KS + 1.8]);
    scene.add(instanced(potG, stdMat({ roughness: 0.8 }), pots.length, (i, d) => { d.position.set(pots[i][0], 0, pots[i][1]); d.scale.setScalar(1.1); }, true));
    scene.add(instanced(bush({ seed: 9, radius: 1, cards: 26 }), tm.leaf, pots.length, (i, d, c) => { d.position.set(pots[i][0], 1.15, pots[i][1]); d.scale.set(0.9, 1.1, 0.9); d.rotation.y = r() * 6; c.setHSL(0.28, 0.4, 0.55 + r() * 0.3); }, true));
    for (let i = 0; i < 120 && folk.length < 300; i++) { const a = r() * TAU, rr = 22.5 + r() * 8, x = Math.cos(a) * rr, z = CZ + Math.sin(a) * rr; if (Math.abs(x) > 24 && Math.abs(z - CZ) > 22) continue; addP(x, 0, z, Math.atan2(-x, -(z - CZ)) + (r() - 0.5) * 0.8); }

    // ---- the kund: a balustrade, lamp towers, petal mandalas, pilgrims on the steps ----
    const KB = KS + 0.5; for (const [dx, dz, ry] of [[0, 1, 0], [0, -1, 0], [1, 0, Math.PI / 2], [-1, 0, Math.PI / 2]]) { for (let u = -KB; u <= KB; u += 1.3) { if (Math.abs(u) < 3.4) continue; S.box(0.24, 0.85, 0.24, { p: [dx ? dx * KB : u, 0.42, KZ + (dz ? dz * KB : u)], c: LIME }); }
      for (const sd of [-1, 1]) { const mid = sd * (KB + 3.4) / 2, len = KB - 3.4; S.box(len, 0.14, 0.34, { p: [dx ? dx * KB : mid, 0.92, KZ + (dz ? dz * KB : mid)], r: [0, ry, 0], c: LIME }); } }
    const lampTower = (x, z) => { S.box(2.6, 1.0, 2.6, { p: [x, 0.5, z], c: PINK }).cyl(0.5, 0.75, 8, 12, { p: [x, 5, z], c: 0xe8d8c4 }); Gd.lathe([[0.2, 0], [0.7, 0.2], [0.9, 0.5], [0.8, 0.6], [0.2, 0.3]], 16, { p: [x, 9, z] }); kl.push([x, 9.5, z, 1.3]);
      for (let k = 0; k < 7; k++) { const y = 1.8 + k * 0.98, R = 0.98 - k * 0.055; for (let m = 0; m < 8; m++) { const a = m * TAU / 8 + k * 0.4; Gd.cyl(0.12, 0.07, 0.1, 8, { p: [x + Math.cos(a) * R, y, z + Math.sin(a) * R] }); diyas.push([x + Math.cos(a) * R, y + 0.08, z + Math.sin(a) * R]); } } halo.push({ p: [x, 6, z], s: 9, c: 0xffa040 }); };
    lampTower(-10, KZ + KS + 6.5); lampTower(10, KZ + KS + 6.5); lampTower(-(KS + 6.5), KZ); lampTower(KS + 6.5, KZ);
    const pet = []; for (const [x, z] of [[-22, KZ + KS + 8], [22, KZ + KS + 8], [-(KS + 8), KZ - 18], [KS + 8, KZ - 18], [-(KS + 8), KZ + 18], [KS + 8, KZ + 18]]) { pet.push(xform(new THREE.CircleGeometry(3.4, 40).rotateX(-Math.PI / 2), { p: [x, 0.05, z] })); for (let k = 0; k < 12; k++) { const a = k * TAU / 12; diyas.push([x + Math.cos(a) * 3.6, 0.1, z + Math.sin(a) * 3.6]); } }
    scene.add(new THREE.Mesh(merge(pet), new THREE.MeshStandardMaterial({ map: mT, roughness: 0.9 })));
    // flower and puja stalls along the outer edge of the rim
    for (let u = -KO + 6; u <= KO - 6; u += 7.5) { if (Math.abs(u) < 5) continue; for (const [x, z, ry] of [[u, KZ + KO - 2.2, Math.PI], [KO - 2.2, KZ + u, -Math.PI / 2], [-(KO - 2.2), KZ + u, Math.PI / 2]]) if (!nearRail(x, z, 4.5) && r() < 0.8) stall(x, z, ry, r() < 0.6 ? 4 : 1); }
    for (let i = 0; i < 700 && folk.length < 520; i++) { const sd = Math.floor(r() * 4), u = (r() - 0.5) * 2 * (KO - 2), d = KS + 2 + r() * 12, x = sd < 2 ? u : (sd === 2 ? d : -d), z = KZ + (sd < 2 ? (sd ? d : -d) : u); if (nearRail(x, z, 3) || Math.abs(x) > KO || Math.abs(z - KZ) > KO) continue; addP(x, 0, z, r() * TAU); }
    for (let i = 0; i < 900 && folk.length < 620; i++) { const ring = Math.floor(r() * (NT - 1)), a = KS - TW * (ring + 1), m = a + 0.8, sd = Math.floor(r() * 4), u = (r() - 0.5) * 2 * (m - 1), x = sd < 2 ? u : (sd === 2 ? m : -m), z = KZ + (sd < 2 ? (sd ? m : -m) : u), y = terrace(x, z);
      if (y == null || nearRail(x, z, 3.2)) continue; addP(x, y, z, Math.atan2(-x, -(z - KZ)) + (r() - 0.5) * 0.6, r() < 0.4 ? 0.6 : 1); }
    for (let i = 0; i < 40; i++) { const ring = Math.floor(r() * (NT - 1)), m = KS - TW * (ring + 1) + 0.4, sd = Math.floor(r() * 4), u = (r() - 0.5) * 2 * (m - 1), x = sd < 2 ? u : (sd === 2 ? m : -m), z = KZ + (sd < 2 ? (sd ? m : -m) : u), y = terrace(x, z); if (y == null) continue;
      Gd.lathe([[0.04, 0], [0.16, 0.04], [0.22, 0.16], [0.14, 0.28], [0.07, 0.3], [0.08, 0.36]], 12, { p: [x, y, z] }); }

    // ---- animals and traffic ----
    const ele = new Builder(), EG = 0x6e6862;
    ele.sph(1, { p: [0, 2.25, 0], s: [1.25, 1.15, 1.9], c: EG });
    for (const [x, z] of [[-0.68, 1.1], [0.68, 1.1], [-0.68, -1.1], [0.68, -1.1]]) ele.cyl(0.36, 0.4, 1.6, 10, { p: [x, 0.8, z], c: EG }).cyl(0.42, 0.44, 0.12, 10, { p: [x, 0.06, z], c: 0x8a827a }).tor(0.38, 0.05, { p: [x, 0.35, z], r: [Math.PI / 2, 0, 0], c: GOLD }, TAU, 14);
    ele.sph(0.85, { p: [0, 2.75, 2.05], s: [1, 1.05, 0.95], c: EG }); for (let k = 0; k <= 10; k++) { const t = k / 10; ele.sph(0.32 * (1 - t * 0.55), { p: [0, 2.45 - t * 2.05, 2.75 + Math.sin(t * 1.4) * 0.55 + t * 0.2], c: EG }, 10, 8); }
    for (const sx of [-1, 1]) ele.sph(1, { p: [sx * 0.85, 2.75, 1.75], s: [0.12, 0.85, 0.75], r: [0, sx * 0.35, 0], c: 0x857a74 }).cone(0.09, 0.9, 8, { p: [sx * 0.32, 2.0, 2.6], r: [2.0, 0, sx * 0.2], c: 0xf4ead8 });
    ele.box(1.1, 1.3, 0.12, { p: [0, 2.6, 2.86], r: [0.22, 0, 0], c: 0xb01e2c }).box(1.16, 0.16, 0.16, { p: [0, 1.98, 3.0], r: [0.22, 0, 0], c: GOLD }).sph(0.3, { p: [0, 3.05, 2.86], s: [1, 1, 0.3], c: 0xe8b84a });
    for (let k = 0; k < 7; k++) { const a = -0.9 + k * 0.3; ele.sph(0.07, { p: [Math.sin(a) * 0.48, 2.5 + Math.cos(a) * 0.4, 2.98], c: [0x2a9d9a, 0xffffff, 0xd83a7a][k % 3] }, 6, 4); }
    ele.box(2.7, 1.5, 2.4, { p: [0, 2.35, -0.1], c: 0xb01e2c }).box(2.76, 0.18, 2.46, { p: [0, 1.62, -0.1], c: GOLD }).box(2.76, 0.1, 2.46, { p: [0, 2.9, -0.1], c: GOLD });
    ele.box(1.7, 0.75, 1.9, { p: [0, 3.65, -0.1], c: GOLD }); for (const [x, z] of [[-0.75, 0.8], [0.75, 0.8], [-0.75, -1.0], [0.75, -1.0]]) ele.cyl(0.05, 0.05, 1.3, 6, { p: [x, 4.6, z], c: GOLD });
    ele.sph(1, { p: [0, 5.3, -0.1], s: [1.05, 0.55, 1.15], c: 0xc0222e }).cone(0.12, 0.6, 8, { p: [0, 6.0, -0.1], c: GOLD }).cyl(0.04, 0.02, 1.1, 5, { p: [0, 1.7, -1.85], r: [0.25, 0, 0], c: EG });
    const elePos = [[-10.5, -82, 0.45], [11.5, -84, -0.45], [-22, -40, 0.0]];
    scene.add(instanced(ele.geometry(), stdMat({ roughness: 0.75 }), elePos.length, (i, d) => { d.position.set(elePos[i][0], 0, elePos[i][1]); d.rotation.y = elePos[i][2]; }, true));
    elePos.forEach(([x, z, ry]) => addP(x + Math.sin(ry) * 1.55, 2.95, z + Math.cos(ry) * 1.55, ry, 0.62));
    const cw = new Builder().sph(1, { p: [0, 1.05, 0], s: [0.42, 0.48, 0.95], c: 0xece6dc }).sph(0.32, { p: [0, 1.42, 0.5], s: [1, 1.1, 1.2], c: 0xe4ddd2 }).sph(1, { p: [0, 1.25, 1.12], s: [0.2, 0.24, 0.36], c: 0xe8e2d8 }).sph(0.12, { p: [0, 1.12, 1.42], c: 0x3a2e2a }, 8, 6).tor(0.3, 0.05, { p: [0, 1.18, 0.82], r: [1.0, 0, 0], c: 0xff9a1a }, TAU, 14);
    for (const [x, z] of [[-0.25, 0.6], [0.25, 0.6], [-0.25, -0.6], [0.25, -0.6]]) cw.cyl(0.07, 0.06, 0.8, 6, { p: [x, 0.4, z], c: 0xdcd4c8 });
    for (const sx of [-1, 1]) cw.cone(0.05, 0.4, 6, { p: [sx * 0.16, 1.55, 1.05], r: [0, 0, -sx * 0.6], c: 0xd8452a }).sph(0.08, { p: [sx * 0.2, 1.38, 1.05], s: [1.2, 0.5, 0.7], c: 0xd8c8b8 }, 6, 4);
    const cows = []; for (let i = 0; i < 300 && cows.length < 9; i++) { const x = lerp(-11, 14, r()), z = lerp(-60, 28, r()); if (!nearRail(x, z, 4)) cows.push([x, z, r() * TAU, r() < 0.4]); }
    scene.add(instanced(cw.geometry(), stdMat({ roughness: 0.8 }), cows.length, (i, d) => { const q = cows[i]; d.position.set(q[0], q[3] ? -0.55 : 0, q[1]); d.rotation.y = q[2]; d.scale.setScalar(1.05); }, true));
    const rkB = new Builder().box(1.3, 0.55, 1.7, { p: [0, 0.62, -0.25], c: 0x1f7a3a }).box(1.28, 0.5, 1.2, { p: [0, 1.15, -0.45], c: 0xf2c418 }).box(0.75, 0.75, 0.55, { p: [0, 0.8, 0.85], c: 0x1f7a3a }).box(1.36, 0.07, 2.0, { p: [0, 1.85, -0.15], c: 0x141414 })
      .box(1.3, 0.9, 0.06, { p: [0, 1.4, -1.12], c: 0x141414 }).box(1.32, 0.45, 0.06, { p: [0, 1.6, 0.85], c: 0x9ab8c8 }).box(0.06, 0.95, 0.06, { p: [-0.62, 1.36, 0.83], c: 0x141414 }).box(0.06, 0.95, 0.06, { p: [0.62, 1.36, 0.83], c: 0x141414 }).box(1.2, 0.3, 0.6, { p: [0, 0.95, -0.55], c: 0x3a2a24 }).sph(0.09, { p: [0, 1.0, 1.13], c: 0xfff4d0 }, 8, 6);
    for (const [x, z] of [[0, 1.0], [-0.62, -0.75], [0.62, -0.75]]) rkB.tor(0.24, 0.09, { p: [x, 0.3, z], r: [0, Math.PI / 2, 0], c: 0x151515 }, TAU, 14);
    const autos = []; for (let i = 0; i < 300 && autos.length < 11; i++) { const x = lerp(-9, 12, r()), z = lerp(-88, 30, r()); if (!nearRail(x, z, 3.5)) autos.push([x, z, (r() < 0.5 ? 0 : Math.PI) + (r() - 0.5) * 0.4]); }
    scene.add(instanced(rkB.geometry(), stdMat({ roughness: 0.5, metalness: 0.2 }), autos.length, (i, d) => { d.position.set(autos[i][0], 0, autos[i][1]); d.rotation.y = autos[i][2]; d.scale.setScalar(1.15); }, true));
    autos.forEach(q => halo.push({ p: [q[0] + Math.sin(q[2]) * 1.3, 1.1, q[1] + Math.cos(q[2]) * 1.3], s: 1.4, c: 0xfff0c0 }));
    const pg = new Builder().sph(0.09, { p: [0, 0.08, 0], s: [1, 0.8, 1.6], c: 0x8a8e98 }).sph(0.05, { p: [0, 0.14, 0.12], c: 0x6a7078 }, 8, 6).geometry();
    scene.add(instanced(pg, stdMat({ roughness: 0.8 }), 220, (i, d, c) => { const near = i < 150, x = near ? lerp(-31, -18, r()) : lerp(-KO, KO, r()), z = near ? lerp(-60, 24, r()) : KZ + KS + 2 + r() * 12; d.position.set(x, 0.02, z); d.rotation.y = r() * TAU; c.setScalar(0.8 + r() * 0.4); }));

    // ---- hanging paper lanterns, glowing after dusk ----
    for (let k = -6; k <= 6; k++) for (const sd of [-1, 1]) lanterns.push([sd * (CS - 1.6), 4.9, CZ + k * 5]);
    for (let k = -5; k <= 5; k++) lanterns.push([k * 5, 5.1, PZ + 1.1], [k * 5, 11.8, PZ + 1.1]);
    for (let k = 0; k < 13; k++) { const z = 24 - k * 8.6, y0 = 15 + (k % 3) * 2; for (const u of [0.22, 0.5, 0.78]) lanterns.push([lerp(HX + 1.6, BX - 1, u), y0 - Math.sin(u * Math.PI) * 4.2 - 1.3, z]); }
    for (let k = 0; k < 9; k++) for (const sd of [-1, 1]) lanterns.push([sd * 7.6, 7.2, GZ - k * 11 - 2]);
    const lk = { value: 0.25 }, lanternM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide });
    lanternM.onBeforeCompile = sh => { hook(sh); sh.uniforms.uLK = lk; sh.fragmentShader = 'uniform float uLK;\n' + sh.fragmentShader.replace('#include <emissive_fragment>', 'totalEmissiveRadiance = diffuseColor.rgb*uLK;'); }; lanternM.customProgramCacheKey = () => 'lantern';
    const lanG = new Builder().add(new THREE.OctahedronGeometry(0.34, 0), { s: [1, 1.5, 1] }).cyl(0.36, 0.36, 0.05, 8, { p: [0, 0, 0] }).cone(0.07, 0.5, 6, { p: [0, -0.75, 0], r: [Math.PI, 0, 0] }).cyl(0.01, 0.01, 0.6, 4, { p: [0, 0.8, 0], c: 0x222222 }).geometry();
    scene.add(instanced(lanG, lanternM, lanterns.length, (i, d, c) => { d.position.set(...lanterns[i]); d.rotation.y = r() * 6; c.set(pick([0xff3a2a, 0xffa01a, 0xff5aa8, 0xffd23a, 0x3ac8c8])); }));
    lanterns.forEach((q, i) => halo.push({ p: q, s: 2.4, c: i % 3 ? 0xffa050 : 0xff6a90 }));

    // ---- cloth, goods, smoke, pigeons in flight, people ----
    scene.add(new THREE.Mesh(cloth.geometry(), windify(stdMat({ map: stripeT, side: THREE.DoubleSide, roughness: 0.85 }), { amp: 0.05, freq: 1.8, scale: 0.4, h0: 1.4, h1: 3 })));
    const goodsM = goods.mesh(stdMat({ roughness: 0.7 })); scene.add(goodsM);
    const sm = smoke.filter(Boolean); if (sm.length) scene.add(points({ count: sm.length * 40, size: 1.4, opacity: 0.16, additive: false, color: 0xd8ccc0, spawn: (i, v) => v.set(...sm[i % sm.length]), motion: 'float age = fract(uTime*0.12 + s.x); p.y += age*7.0; p.x += sin(age*4.0 + s.y*20.0)*0.6*age + age*1.5; p.z += (s.z - 0.5)*age*1.5; sz = 0.4 + age*2.6; a = age*(1.0 - age)*4.0;' }));
    scene.add(points({ count: fountains.length * 160, size: 0.12, gain: 1.4, color: 0xdff4ff, opacity: 0.8, spawn: (i, v) => { const f = fountains[i % fountains.length]; v.set(f[0], 2.0, f[1]); }, motion: 'float age = fract(uTime*0.6 + s.x); float an = s.y*6.283; float sp = 0.9 + s.z*0.5; p.x += cos(an)*age*sp; p.z += sin(an)*age*sp; p.y += age*1.6 - age*age*3.2; a = (1.0 - age)*0.9;' }));
    const bgeoP = new THREE.BufferGeometry(); bgeoP.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0.25, -1, 0.3, -0.1, 0, 0, -0.2, 0, 0, 0.25, 0, 0, -0.2, 1, 0.3, -0.1]), 3));
    const NP = 130, flock = new THREE.InstancedMesh(bgeoP, new THREE.MeshBasicMaterial({ color: 0x4a4e58, side: THREE.DoubleSide }), NP); flock.frustumCulled = false; scene.add(flock);
    const fd = Array.from({ length: NP }, () => ({ R: 14 + r() * 34, h: 34 + r() * 30, sp: (0.18 + r() * 0.2) * (r() < 0.8 ? 1 : -1), ph: r() * TAU, f: 9 + r() * 5, w: r() * 6 }));
    const CLM = stdMat({ roughness: 0.85 });
    // a woman in ghagra and odhni: hem band, bodice and veil in shades of the one dye
    const W1 = new Builder().cone(0.36, 1.05, 14, { p: [0, 0.52, 0] }).tor(0.335, 0.035, { p: [0, 0.07, 0], r: [Math.PI / 2, 0, 0], c: 0x5a5a5a }, TAU, 16).tor(0.24, 0.025, { p: [0, 0.42, 0], r: [Math.PI / 2, 0, 0], c: 0xffe08a }, TAU, 14).cyl(0.15, 0.18, 0.5, 10, { p: [0, 1.28, 0], c: 0xb0b0b0 })
      .sph(0.2, { p: [0, 1.6, -0.05], s: [1.08, 1.2, 1] }, 12, 8).box(0.12, 0.85, 0.05, { p: [0.1, 1.2, 0.14], r: [0, 0, 0.5], c: 0xe0e0e0 }).geometry();
    const W2 = new Builder().sph(0.125, { p: [0, 1.6, 0.08], c: 0x8a5a3c }, 10, 8).sph(0.022, { p: [0, 1.64, 0.2], c: 0xc0202a }, 6, 4).cyl(0.045, 0.04, 0.55, 6, { p: [0.2, 1.2, 0.04], r: [0, 0, 0.15], c: 0x8a5a3c }).cyl(0.045, 0.04, 0.55, 6, { p: [-0.2, 1.2, 0.04], r: [0, 0, -0.15], c: 0x8a5a3c }).geometry();
    // a man in dhoti, kurta and safa: the turban takes the dye, the dhoti stays pale
    const M1 = new Builder().cyl(0.16, 0.21, 0.9, 10, { p: [0, 0.45, 0], c: 0x9a9a9a }).cyl(0.22, 0.27, 0.78, 10, { p: [0, 1.12, 0], c: 0xc8c8c8 }).tor(0.24, 0.03, { p: [0, 1.48, 0], r: [Math.PI / 2, 0, 0], c: 0x8a8a8a }, TAU, 14)
      .sph(0.16, { p: [0, 1.77, 0], s: [1.2, 0.78, 1.2] }, 12, 8).box(0.09, 0.5, 0.06, { p: [-0.12, 1.66, -0.16], r: [0.4, 0, 0], c: 0xffffff }).geometry();
    const M2 = new Builder().sph(0.125, { p: [0, 1.6, 0.02], c: 0x7a4e34 }, 10, 8).cyl(0.05, 0.045, 0.6, 6, { p: [0.27, 1.15, 0], r: [0, 0, 0.12], c: 0x7a4e34 }).cyl(0.05, 0.045, 0.6, 6, { p: [-0.27, 1.15, 0], r: [0, 0, -0.12], c: 0x7a4e34 }).sph(0.07, { p: [0, 1.5, 0.1], s: [1, 0.8, 0.6], c: 0x2a201a }, 8, 6).geometry();
    const crowd = list => { for (const v of [0, 1]) { const sub = list.filter(q => q.v === v); if (!sub.length) continue; const fn = (i, d) => { const q = sub[i]; d.position.set(q.x, q.y, q.z); d.rotation.y = q.ry; d.scale.set(q.s, q.s * q.sy, q.s); };
        scene.add(instanced(v ? M1 : W1, CLM, sub.length, (i, d, c) => { fn(i, d); c.set(sub[i].c); }, true), instanced(v ? M2 : W2, CLM, sub.length, (i, d, c) => { fn(i, d); c.setScalar(0.78 + (i % 5) * 0.08); }, true)); } };
    crowd(folk);
    // walkers along the street, moving through the market
    const walk = Array.from({ length: 44 }, () => ({ x: lerp(-8, 12, r()), z0: r() * 120, sp: (0.9 + r() * 0.7) * (r() < 0.5 ? 1 : -1), s: 0.92 + r() * 0.16, v: r() < 0.5 ? 1 : 0, c: pick(CLO), ph: r() * 6 }));
    const wm = [0, 1].map(v => { const sub = walk.filter(q => q.v === v), a = new THREE.InstancedMesh(v ? M1 : W1, CLM, sub.length), b = new THREE.InstancedMesh(v ? M2 : W2, CLM, sub.length); const col = new THREE.Color();
      sub.forEach((q, i) => { a.setColorAt(i, col.set(q.c)); b.setColorAt(i, col.setScalar(0.8 + (i % 4) * 0.08)); }); a.castShadow = b.castShadow = true; a.frustumCulled = b.frustumCulled = false; scene.add(a, b); return { sub, a, b }; });

    // ---- instance everything that repeats ----
    scene.add(instanced(jg, stone, jh.length, (i, d, c) => { const q = jh[i]; d.position.set(q[0], q[1], q[2]); d.rotation.y = q[3]; d.scale.setScalar(q[4]); c.setScalar(0.92 + r() * 0.12); }, true));
    scene.add(instanced(bay, stdMat({ roughness: 0.85 }), bays.length, (i, d, c) => { const q = bays[i]; d.position.set(q[0], q[1], q[2]); d.rotation.y = q[3]; c.set(q[4]).multiplyScalar(0.9 + r() * 0.15); }, true));
    scene.add(instanced(kal, goldM, kl.length, (i, d) => { const q = kl[i]; d.position.set(q[0], q[1], q[2]); d.scale.setScalar(q[3]); }));
    scene.add(S.mesh(stone), Gd.mesh(goldM));
    // lit windows and shop fronts: dark by day, warm after dusk
    const litM = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }), lit = [];
    jh.forEach(q => { const c = Math.cos(q[3]), s = Math.sin(q[3]); lit.push(xform(glowG.clone(), { p: [q[0] + s * 1.3 * q[4], q[1] + 1.3 * q[4], q[2] + c * 1.3 * q[4]], r: [0, q[3], 0], s: q[4] })); });
    warm.forEach(q => lit.push(xform(new THREE.PlaneGeometry(q[4], q[5] * 1.6), { p: [q[0], q[1], q[2]], r: [0, q[3], 0] })));
    scene.add(new THREE.Mesh(merge(lit), litM));


    // ---- light after dusk: diyas, lanterns, kites, fireworks ----
    const dy = instanced(new THREE.SphereGeometry(0.085, 6, 5), new THREE.MeshBasicMaterial({ color: 0x000000 }), diyas.length, (i, d) => { d.position.set(...diyas[i]); d.scale.set(1, 1.6, 1); }); scene.add(dy);
    const dGlow = glows(diyas.map(p => ({ p: [p[0], p[1] + 0.12, p[2]], s: 0.9, c: 0xff9a3a })), { gain: 1.6, flicker: 0.4 }), hGlow = glows(halo, { gain: 0.3, flicker: 0.15 }); scene.add(dGlow, hGlow);
    const pl = [[0, 8, GZ - 20, 60], [0, 8, GZ - 64, 60], [0, 5, CZ, 160], [0, -10, KZ, 260], [0, -20, KZ, 140], [0, 6, -40, 90], [0, 6, 10, 90], [0, 7, PZ + 8, 120]].map(([x, y, z, k]) => { const l = new THREE.PointLight(0xff9c4a, 0, 80, 1.6); l.position.set(x, y, z); l.userData.k = k; scene.add(l); return l; });
    const lant = points({ count: 700, size: 1.5, gain: 2.2, shape: 'soft', color: 0xff9a3a, opacity: 0, fog: false, minPx: 1.5, spawn: (i, v, q) => v.set((q() - 0.5) * 260, q() * 190, -250 - q() * 300), colorFn: (i, c, q) => c.set([0xff9a3a, 0xffc060, 0xff7a2a][Math.floor(q() * 3)]), motion: 'p.y = mod(p.y + uTime*(1.6 + s.x*2.2), 190.0); p.x += sin(uTime*0.2 + s.y*30.0)*6.0 + p.y*0.12; sz = 0.5 + s.z; a *= smoothstep(0.0, 14.0, p.y)*smoothstep(190.0, 150.0, p.y);' }); scene.add(lant);
    const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 1.2, 0, -0.9, 0, 0.12, 0, -1.3, 0, 0, 1.2, 0, 0, -1.3, 0, 0.9, 0, 0.12, 0, -1.3, 0, -0.06, -4.2, 0, 0.06, -4.2, 0]), 3)); kg.computeVertexNormals();
    const NK = 46, kites = new THREE.InstancedMesh(kg, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), NK), kd = Array.from({ length: NK }, (_, i) => ({ x: (r() - 0.5) * 240, y: 34 + r() * 70, z: 20 - r() * 420, ph: r() * 6, s: 1.2 + r() * 1.6 })); kd.forEach((k, i) => kites.setColorAt(i, new THREE.Color(flagC[i % 6]).multiplyScalar(1.1))); kites.frustumCulled = false; scene.add(kites);
    const fw = points({ count: 2600, size: 0.9, gain: 3, opacity: 0, fog: false, minPx: 1.2, spawn: (i, v) => v.set(0, 0, 0), motion: `float b = floor(s.x*9.0), cyc = uTime*0.3 + b*0.37, age = fract(cyc), sd = floor(cyc) + b*13.0;
        vec3 ctr = vec3((hash11(sd) - 0.5)*260.0, 70.0 + hash11(sd + 5.0)*60.0, -470.0 + (hash11(sd + 9.0) - 0.5)*90.0), dir = normalize(vec3(s.y - 0.5, s.z - 0.5, s.w - 0.5));
        p = ctr + dir*(34.0*(0.55 + 0.45*hash11(s.y*91.0)))*(1.0 - exp(-age*3.2)) + vec3(0.0, -11.0*age*age, 0.0); a = (1.0 - age)*(1.0 - age)*smoothstep(0.0, 0.03, age);
        float h = hash11(sd + 2.0); col = h < 0.25 ? vec3(1.0, 0.72, 0.2) : h < 0.5 ? vec3(1.0, 0.25, 0.5) : h < 0.75 ? vec3(0.3, 0.9, 0.85) : vec3(1.0, 0.95, 0.8); sz = 0.6 + s.w;` }); scene.add(fw);
    scene.add(points({ count: 1500, size: 0.07, gain: 1.6, color: 0xffd8a0, opacity: 0.7, spawn: (i, v, q) => v.set((q() - 0.5) * 70, q() * 22, 40 - q() * 420), motion: 'p += vec3(sin(uTime*0.3 + s.x*20.0), sin(uTime*0.25 + s.y*20.0)*0.5, cos(uTime*0.28 + s.z*20.0))*1.5; a *= 0.4 + 0.6*sin(uTime*1.3 + s.w*30.0);' }));

    Object.assign(look, { bloom: 0.6, bloomThreshold: 1.0, bloomKnee: 0.6, vignette: 0.6, contrast: 1.08, saturation: 1.2, grain: 0.03, ao: 1, aoRadius: 1.1, godPos: sunDir, godDir: true, god: 0.35, godColor: new THREE.Color(0xffb070) });
    look.gain.setRGB(1.04, 1, 0.96);
    const su = dome.userData.u, wu = pool.userData.u, c0 = new THREE.Color(), c1 = new THREE.Color(), mix = (A, B, k) => c0.set(A).lerp(c1.set(B), k), wc = new THREE.Color(1.0, 0.62, 0.28), moonDir = new V3(-0.3, 0.7, 0.4).normalize();
    return {
      parallax: 0.4, clearance: 1.9,
      // paving, then the kund's terraces stepping down to the water
      floor: (x, z) => { const m = Math.max(Math.abs(x), Math.abs(z - KZ)); if (m >= KS) return 0; const i = Math.floor((KS - m) / TW); return i >= NT ? WY : -TH * (i + 1) + TH * 0.5; },
      rail: [
        { p: 0, pos: [36, 6.5, 22], look: [HX, 22, HZ + 2], fov: 52 },
        { p: 0.11, pos: [2, 18, -30], look: [HX, 25, -30], fov: 40 },
        { p: 0.22, pos: [7, 5, -62], look: [0, 9, GZ - 40], fov: 52 },
        { p: 0.34, pos: [0, 4.2, GZ - 14], look: [0, 6.8, GZ - 88], fov: 58 },
        { p: 0.46, pos: [0, 5, GZ - 86], look: [0, 1, CZ], fov: 56 },
        { p: 0.56, pos: [13, 22, CZ + 24], look: [0, 0, CZ - 2], fov: 50 },
        { p: 0.68, pos: [-9, 8, KZ + KS + 22], look: [2, -14, KZ], fov: 56 },
        { p: 0.79, pos: [17, -7.5, KZ + 20], look: [-6, -19, KZ - 6], fov: 56 },
        { p: 0.9, pos: [0.6, WY + 2.3, KZ + 2.6], look: [0, 2, PZ], fov: 62 },
        { p: 1, pos: [0, 3, KZ + KS + 10], look: [0, 62, -470], fov: 54 } ],
      update(t, p) {
        const nt = smooth(0.48, 0.8, p), el = lerp(0.2, -0.12, smooth(0, 0.7, p));
        sunDir.set(0.78, el, 0.42).normalize(); su.uSunDir.value.copy(sunDir); U.uSunDirF.value.copy(sunDir); wu.uSunDir.value.copy(sunDir);
        sun.position.set(0, 0, -150).addScaledVector(nt > 0.6 ? moonDir : sunDir, 400); sun.intensity = lerp(3.6, 0.5, nt); sun.color.copy(mix(0xffb880, 0x8aa0ff, nt));
        su.uTop.value.copy(mix(0x2a3f86, 0x05071c, nt)); su.uHor.value.copy(mix(0xffa25c, 0x3a2456, nt)); su.uBot.value.copy(mix(0xd88a60, 0x1c1430, nt)); su.uSunInt.value = 34 * (1 - nt); su.uSunGlow.value = 1.5 * (1 - nt * 0.9); su.uStars.value = nt * 1.6;
        su.uCloudCol.value.copy(mix(0xffc0a0, 0x4a3a6a, nt)); su.uCloudDark.value.copy(mix(0x7a5a7c, 0x100c20, nt)); wu.uSkyA.value.copy(su.uTop.value); wu.uSkyB.value.copy(su.uHor.value);
        scene.fog.color.copy(mix(0xf0a878, 0x1e1630, nt)); scene.fog.density = lerp(0.0014, 0.0026, nt); U.uSunFog.value.set(0.5, 0.26, 0.1).multiplyScalar(1 - nt);
        hemi.intensity = lerp(0.55, 0.3, nt); hemi.color.copy(mix(0xb8c4ff, 0x6a78d8, nt)); scene.environmentIntensity = lerp(0.8, 0.3, nt);
        litM.color.copy(wc).multiplyScalar(nt * 2.6 * (0.92 + 0.08 * Math.sin(t * 7))); dy.material.color.setRGB(3.2, 1.6, 0.5).multiplyScalar(nt);
        dGlow.userData.u.uOpacity.value = nt; hGlow.userData.u.uOpacity.value = 0.25 + nt * 0.75; pl.forEach((l, i) => { l.intensity = l.userData.k * nt * (0.9 + 0.1 * Math.sin(t * 9 + i * 2)); });
        rang.material.uniforms.uB.value = smooth(0.4, 0.6, p); rang.material.uniforms.uL.value = lerp(1.0, 0.55, nt);
        lant.userData.u.uOpacity.value = smooth(0.74, 0.92, p); fw.userData.u.uOpacity.value = smooth(0.88, 0.97, p); goldM.emissiveIntensity = 0.35 + nt * 0.5;
        for (let i = 0; i < NK; i++) { const k = kd[i]; o.position.set(k.x + Math.sin(t * 0.3 + k.ph) * 9, k.y + Math.sin(t * 0.5 + k.ph * 2) * 4, k.z + Math.cos(t * 0.23 + k.ph) * 7); o.rotation.set(0.5 + Math.sin(t * 1.1 + k.ph) * 0.2, k.ph + Math.sin(t * 0.4 + k.ph) * 0.5, Math.sin(t * 0.9 + k.ph) * 0.35); o.scale.setScalar(k.s * (1 - smooth(0.7, 0.95, nt))); o.updateMatrix(); kites.setMatrixAt(i, o.matrix); } kites.instanceMatrix.needsUpdate = true;
        lk.value = 0.2 + nt * 2.4;
        for (let i = 0; i < NP; i++) { const d = fd[i], an = t * d.sp + d.ph; o.position.set(HX + 6 + Math.cos(an) * d.R, d.h + Math.sin(an * 2.1 + d.w) * 5, HZ + Math.sin(an) * d.R * 0.8); o.rotation.set(0, -an - (d.sp > 0 ? 0 : Math.PI), 0); o.scale.set(0.45, 0.45 * Math.sin(t * d.f + d.w) * 1.5, 0.45); o.updateMatrix(); flock.setMatrixAt(i, o.matrix); } flock.instanceMatrix.needsUpdate = true;
        for (const g of wm) { g.sub.forEach((q, i) => { const z = 30 - (((q.z0 + t * q.sp) % 120) + 120) % 120; o.position.set(q.x, Math.abs(Math.sin(t * 5 + q.ph)) * 0.04, z); o.rotation.set(0, q.sp > 0 ? Math.PI : 0, 0); o.scale.setScalar(q.s); o.updateMatrix(); g.a.setMatrixAt(i, o.matrix); g.b.setMatrixAt(i, o.matrix); }); g.a.instanceMatrix.needsUpdate = g.b.instanceMatrix.needsUpdate = true; }
        look.god = 0.35 * (1 - nt); look.exposure = lerp(1.0, 1.2, nt); look.bloom = lerp(0.6, 0.85, nt); look.lift.setRGB(0.01 + nt * 0.012, 0.008, 0.01 + nt * 0.03);
      },
    };
  },
};
