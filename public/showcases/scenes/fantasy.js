// 09 Fantasy · Arcanum: floating isles under an aurora, an elder tree of light, a crystal spire, a rune circle and a gate.
import * as THREE from '../lib/three.module.min.js';
import { U, NOISE, Builder, stdMat, groundMat, instanced, sky, points, glows, sunLight, merge, canvasTex, rng, fbm2, noise2, lerp, smooth, TAU } from '../lib/kit.js';
import { broadleaf, bush, grassClump, grassFar, grassMat, boulder, treeMats, plant, leafTex, blossomTex, barkTex } from '../lib/flora.js';

const V3 = THREE.Vector3;
// a floating isle: a meadow on top, a root of rock hanging beneath
function isle(R, depth, seed, hill = 1) {
  const NR = 30, NS = 84, pos = [], col = [], idx = [], c = new THREE.Color(), c2 = new THREE.Color();
  const rad = th => R * (1 + 0.2 * (fbm2(Math.cos(th) * 1.6 + seed, Math.sin(th) * 1.6, 3) - 0.5) * 2);
  const h = (x, z) => { const rn = Math.min(1, Math.hypot(x, z) / rad(Math.atan2(z, x))); return (fbm2(x * 0.05 + seed, z * 0.05, 4) - 0.45) * 7 * hill * (1 - rn * rn) - smooth(0.8, 1, rn) * 2.5; };
  for (const top of [1, 0]) for (let i = 0; i <= NR; i++) for (let j = 0; j <= NS; j++) { const rn = i / NR, th = j / NS * TAU, rr = rad(th) * rn, x = Math.cos(th) * rr, z = Math.sin(th) * rr, yt = h(x, z), n = fbm2(x * 0.09 + seed * 2, z * 0.09, 4);
    if (top) { pos.push(x, yt, z); c.set(0x2f6a58).lerp(c2.set(0x5a5aa0), n).lerp(c2.set(0x6a5a7a), smooth(0.78, 0.97, rn)); }
    else { const k = Math.pow(1 - rn, 0.85), y = yt - depth * k * (0.55 + 0.9 * n) - (1 - Math.pow(rn, 6)) * 3; pos.push(x * (1 - 0.12 * k), y, z * (1 - 0.12 * k)); c.set(0x6a5878).lerp(c2.set(0x2a2238), k).multiplyScalar(0.7 + n * 0.6); }
    col.push(c.r, c.g, c.b); }
  const W = NS + 1, off = (NR + 1) * W; for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * W + j, b = a + W; idx.push(a, a + 1, b, a + 1, b + 1, b, off + a, off + b, off + a + 1, off + a + 1, off + b, off + b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return { g, h, rad };
}
function runeTex(n, ring) { return canvasTex(1024, ring ? 1024 : 256, (g, W, H) => { const q = rng(n * 7 + 1); g.strokeStyle = '#fff'; g.lineCap = 'round'; g.shadowColor = '#fff'; g.shadowBlur = 14;
  const glyph = (x, y, s) => { g.lineWidth = s * 0.11; g.beginPath(); let px = x + (q() - 0.5) * s, py = y - s * 0.5; g.moveTo(px, py); for (let k = 0; k < 4; k++) { px = x + (Math.round(q() * 2) - 1) * s * 0.36; py += s * 0.26; g.lineTo(px, py); if (q() < 0.4) { g.moveTo(x - s * 0.36, py); g.lineTo(x + s * 0.36, py); g.moveTo(px, py); } } g.stroke(); if (q() < 0.5) { g.beginPath(); g.arc(x, y - s * 0.62, s * 0.08, 0, TAU); g.stroke(); } };
  if (!ring) { for (let i = 0; i < 4; i++) glyph(128 + i * 256, 140, 150); return; }
  g.translate(512, 512); g.lineWidth = 6; for (const R of [500, 470, 360, 340, 200]) { g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke(); } for (let i = 0; i < n; i++) { g.save(); g.rotate(i / n * TAU); glyph(0, -415 + 50, 78); g.restore(); }
  g.lineWidth = 5; for (let k = 0; k < 2; k++) { g.beginPath(); for (let i = 0; i <= 7; i++) { const a = (i * (k ? 3 : 2)) / 7 * TAU; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 338, Math.sin(a) * 338); } g.stroke(); } for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; g.beginPath(); g.arc(Math.cos(a) * 270, Math.sin(a) * 270, 26, 0, TAU); g.stroke(); } }); }

export default {
  build({ scene, look, env }) {
    const r = rng(27), moonDir = new V3(-0.5, 0.42, -0.75).normalize(), pick = a => a[Math.floor(r() * a.length)];
    scene.fog = new THREE.FogExp2(0x1c1244, 0.0023);
    const dome = sky({ top: 0x05041a, horizon: 0x4a2a8c, bottom: 0x1c1244, pow: 0.5, sunDir: moonDir, sunColor: 0xd8e4ff, sunSize: 0.003, sunIntensity: 3, sunGlow: 0.25, moon: true, stars: 2, nebula: 0.5, nebulaA: 0x5a1e9c, nebulaB: 0x0e6a8c, aurora: 1.3, auroraColor: 0x38ffb8 }); scene.add(dome); env(dome, 1.1);
    scene.add(new THREE.HemisphereLight(0x8a7aff, 0x2a1a4a, 0.75));
    sunLight(scene, { dir: moonDir, color: 0xb8c8ff, intensity: 1.7, box: 150, far: 700, map: 4096, target: [0, 20, -110] });
    U.uSunDirF.value.copy(moonDir); U.uSunFog.value.set(0.12, 0.1, 0.3);
    const moon2 = new THREE.Mesh(new THREE.SphereGeometry(60, 40, 24), new THREE.ShaderMaterial({ uniforms: { uL: { value: moonDir } }, vertexShader: 'varying vec3 vN, vP; void main(){ vN = normal; vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec3 vN, vP; ${NOISE} void main(){ float l = smoothstep(-0.2, 0.6, dot(normalize(vN), normalize(vec3(-0.7, 0.3, 0.6)))); float n = fbm3(vP*0.04); gl_FragColor = vec4(mix(vec3(0.5, 0.2, 0.6), vec3(1.0, 0.6, 0.8), n)*l*1.1 + vec3(0.02, 0.01, 0.05), 1.0); }` })); moon2.position.set(520, 300, -900); scene.add(moon2);

    // ---- the isles ----
    const rock = groundMat({ scale: 0.22, detail: 2.4, bump: 1, strata: 0.5, contrast: 0.75 }), I = {};
    const add = (name, R, depth, x, y, z, hill) => { const s = isle(R, depth, r() * 90, hill), m = new THREE.Mesh(s.g, rock); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); I[name] = { x, y, z, R, h: (wx, wz) => y + s.h(wx - x, wz - z), inside: (wx, wz, k = 0.86) => Math.hypot(wx - x, wz - z) < s.rad(Math.atan2(wz - z, wx - x)) * k }; return I[name]; };
    const A = add('A', 50, 62, 0, 0, 0, 1), B = add('B', 27, 44, -72, 16, -112, 0.5), C = add('C', 33, 50, 40, 28, -232, 0.35);
    const minor = []; for (let i = 0; i < 16; i++) { const x = (r() - 0.5) * 520, y = -40 + r() * 140, z = 90 - r() * 520; if (Math.hypot(x, z) < 80 || Math.hypot(x + 72, z + 112) < 60 || Math.hypot(x - 40, z + 232) < 66) continue; minor.push(add('m' + i, 7 + r() * 16, 14 + r() * 26, x, y, z, 0.6)); }
    const onIsle = (S, k, fn, tries = 30) => { for (let t = 0; t < tries; t++) { const x = S.x + (r() - 0.5) * S.R * 2.2, z = S.z + (r() - 0.5) * S.R * 2.2; if (S.inside(x, z, k)) return fn(x, S.h(x, z), z); } return false; };
    // stepping stones between them
    const path = new THREE.CatmullRomCurve3([[-22, 3, -36], [-40, 9, -64], [-56, 15, -88], [-64, 18, -100]].map(p => new V3(...p))), path2 = new THREE.CatmullRomCurve3([[-56, 20, -134], [-30, 27, -168], [0, 30, -196], [18, 30, -212]].map(p => new V3(...p)));
    const stoneM = groundMat({ scale: 0.6, detail: 5, bump: 0.9, strata: 1.4, contrast: 0.6, vertexColors: false, color: 0x8a7aa0 });
    scene.add(instanced(boulder(3), stoneM, 44, (i, d, c) => { const cv = i < 20 ? path : path2, t = (i < 20 ? i / 19 : (i - 20) / 23); d.position.copy(cv.getPoint(t)); d.position.x += (r() - 0.5) * 3; d.position.y += (r() - 0.5) * 1.5 - 1; const s = 1.3 + r() * 1.5; d.scale.set(s * 1.4, s * 0.55, s * 1.4); d.rotation.y = r() * 6; c.setScalar(0.7 + r() * 0.4); }, true));

    // ---- flora that makes its own light ----
    const halo = [], elderT = treeMats({ map: leafTex(168, 70, 52), bark: barkTex('#3c3048'), wind: 0.25, h0: 6, h1: 44, emissive: 0x38ffd0, emissiveIntensity: 0.16, through: 1.4, roughness: 0.6 });
    const elder = broadleaf({ seed: 11, height: 40, depth: 5, forks: 4, spread: 0.82, gnarl: 0.4, up: 0.35, trunk: 0.3, radius: 2.6, cardSize: 3.2, cardsPer: 4, hue: [0.42, 0.54], sat: 0.7, light: [0.28, 0.62], flat: 0.45, weep: 0.18 });
    plant(scene, elder, elderT, [{ p: [0, A.h(0, 0) - 0.8, 0], s: 1, ry: 0.6 }]);
    const eL = new THREE.PointLight(0x4affd8, 500, 110, 1.5); eL.position.set(0, 30, 0); scene.add(eL); const eL2 = new THREE.PointLight(0x9a7aff, 240, 60, 1.6); eL2.position.set(8, 5, 12); scene.add(eL2);
    const grove = treeMats({ map: blossomTex(275), bark: barkTex('#3a2c44', true), wind: 0.1, h0: 2, h1: 10, emissive: 0xc88aff, emissiveIntensity: 0.1, through: 1.2 });
    const gv = [broadleaf({ seed: 3, height: 9, depth: 4, forks: 3, spread: 0.9, gnarl: 0.45, trunk: 0.26, radius: 0.4, cardSize: 1.5, cardsPer: 4, hue: [0.74, 0.82], sat: 0.5, light: [0.42, 0.74], weep: 0.3 }), broadleaf({ seed: 19, height: 11, depth: 4, forks: 4, spread: 0.8, gnarl: 0.4, trunk: 0.24, radius: 0.46, cardSize: 1.6, cardsPer: 4, hue: [0.8, 0.9], sat: 0.55, light: [0.42, 0.76], weep: 0.2 })], gl = [[], []];
    for (let i = 0; i < 26; i++) { const S = i < 13 ? A : i < 18 ? B : i < 23 ? C : pick(minor); onIsle(S, 0.8, (x, y, z) => { if (S === A && Math.hypot(x, z) < 22) return; if (S === C && Math.hypot(x - C.x, z - C.z) < 20) return; gl[i % 2].push({ p: [x, y - 0.2, z], s: 0.7 + r() * 0.7, ry: r() * 6 }); }); }
    gl.forEach((l, i) => plant(scene, gv[i], grove, l));
    const gm = grassMat({ wind: 0.15, height: 0.6, through: 0.6 }); [grassClump({ seed: 3, blades: 10, height: 0.6 }), grassClump({ seed: 7, blades: 8, height: 0.9, lean: 0.7 })].forEach(g => scene.add(instanced(g, gm, 36000, (i, d, c) => onIsle(i % 5 === 0 ? pick([B, C, ...minor]) : i % 5 === 1 ? C : A, 0.92, (x, y, z) => { if (noise2(x * 0.12, z * 0.12) < 0.3) return false; d.position.set(x, y - 0.03, z); d.rotation.y = r() * 6; const s = 0.6 + r() * 1; d.scale.set(s * 1.5, s, s * 1.5); c.setHSL(0.42 + r() * 0.2, 0.5, 0.55 + r() * 0.3); }, 6), false, { cell: 24, far: 150, lod: { geo: grassFar(0.7), at: 20 } })));
    scene.add(instanced(bush({ seed: 4, radius: 1, cards: 28 }), treeMats({ map: leafTex(190, 55, 38), bark: barkTex(), wind: 0.05, h0: 0, h1: 2, emissive: 0x2a8aff, emissiveIntensity: 0.18 }).leaf, 300, (i, d, c) => onIsle(pick([A, A, B, C, ...minor]), 0.9, (x, y, z) => { d.position.set(x, y - 0.1, z); const s = 0.5 + r() * 1; d.scale.set(s * 1.3, s * 0.8, s * 1.3); d.rotation.y = r() * 6; c.setHSL(0.5 + r() * 0.25, 0.4, 0.6 + r() * 0.3); }), true));
    // giant mushrooms
    const mb = new Builder().lathe([[0.16, 0], [0.13, 0.9], [0.1, 1.5]], 10, { c: 0xe8dcf4 }).lathe([[0.1, 1.42], [0.42, 1.38], [1.0, 1.3], [1.12, 1.46], [0.95, 1.78], [0.5, 2.02], [0.0, 2.1]], 22, { c: 0x4ad8ff });
    const mush = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 1 }); mush.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissive_fragment>', 'totalEmissiveRadiance = diffuseColor.rgb*smoothstep(0.35, 0.9, diffuseColor.b + diffuseColor.r*0.3 - 0.3)*0.85;'); };
    scene.add(instanced(mb.geometry(), mush, 150, (i, d, c) => onIsle(pick([A, A, A, B, C, ...minor]), 0.9, (x, y, z) => { if (Math.hypot(x, z) < 7) return false; d.position.set(x, y - 0.1, z); const s = 0.5 + r() * r() * 3.4; d.scale.set(s, s * (0.8 + r() * 0.5), s); d.rotation.set((r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3); c.set(pick([0x4ad8ff, 0xc86aff, 0xff7ad8, 0x6affc8])); if (s > 1.6) halo.push({ p: [x, y + s * 1.7, z], s: s * 3.4, c: 0x6ac8ff }); }), true));

    // ---- crystals and the spire ----
    const cg = merge([new THREE.CylinderGeometry(0.5, 0.56, 2, 6).translate(0, 1, 0), new THREE.ConeGeometry(0.5, 0.9, 6).translate(0, 2.45, 0)]);
    const cm = new THREE.MeshPhysicalMaterial({ color: 0xa06aff, roughness: 0.06, metalness: 0.1, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6, emissive: 0x6a34ff, emissiveIntensity: 0.9, flatShading: true });
    const crys = []; const cluster = (x, y, z, s, n) => { for (let k = 0; k < n; k++) crys.push([x + (r() - 0.5) * s * 1.6, y - 0.3, z + (r() - 0.5) * s * 1.6, s * (0.35 + r() * 0.9) * (k ? 0.7 : 1.3), (r() - 0.5) * (k ? 1.1 : 0.3), r() * 6, (r() - 0.5) * (k ? 1.1 : 0.3)]); halo.push({ p: [x, y + s * 1.6, z], s: s * 5, c: 0x9a6aff }); };
    for (let i = 0; i < 34; i++) onIsle(pick([A, B, B, C, ...minor]), 0.92, (x, y, z) => cluster(x, y, z, 0.6 + r() * 1.3, 4 + Math.floor(r() * 4)));
    const TX = B.x + 2, TZ = B.z - 2, TY = B.h(TX, TZ) - 0.5; for (let k = 0; k < 9; k++) { const an = k / 9 * TAU; cluster(TX + Math.cos(an) * 7.5, B.h(TX + Math.cos(an) * 7.5, TZ + Math.sin(an) * 7.5), TZ + Math.sin(an) * 7.5, 1.2 + r() * 1.6, 5); }
    scene.add(instanced(cg, cm, crys.length, (i, d, c) => { const q = crys[i]; d.position.set(q[0], q[1], q[2]); d.scale.set(q[3], q[3] * (1 + r() * 1.2), q[3]); d.rotation.set(q[4], q[5], q[6]); c.set(pick([0xb48aff, 0x8a6aff, 0xff8ae8, 0x7ac8ff])); }, true));
    const tw = new Builder(), tl = new Builder(), ST = 0x8a80a0, ST2 = 0x6c6284;
    tw.cyl(4.2, 5, 3, 12, { p: [TX, TY + 1.5, TZ], c: ST2 }).cyl(3.1, 3.8, 22, 12, { p: [TX, TY + 14, TZ], c: ST }).cyl(4.3, 3.2, 1.6, 12, { p: [TX, TY + 25.6, TZ], c: ST2 }).cyl(3.4, 3.4, 4.6, 12, { p: [TX, TY + 28.7, TZ], c: ST }).cone(4.6, 10, 12, { p: [TX, TY + 36, TZ], c: 0x4a2a7a }).cyl(0.12, 0.12, 4, 6, { p: [TX, TY + 42.5, TZ], c: 0xd8b85a });
    for (let k = 0; k < 12; k++) { const an = k / 12 * TAU; tw.box(0.9, 0.9, 0.7, { p: [TX + Math.cos(an) * 4.25, TY + 26.8, TZ + Math.sin(an) * 4.25], r: [0, -an, 0], c: ST }); }
    for (let k = 0; k < 40; k++) { const an = k * 0.52, y = TY + 2 + k * 0.56, R = 3.9 - (k / 40) * 0.6; tw.box(1.7, 0.2, 0.8, { p: [TX + Math.cos(an) * (R + 0.6), y, TZ + Math.sin(an) * (R + 0.6)], r: [0, -an, 0], c: ST2 }); if (k % 5 === 2) { tl.box(0.12, 1.3, 0.55, { p: [TX + Math.cos(an + 1.6) * (R + 0.02), y + 2, TZ + Math.sin(an + 1.6) * (R + 0.02)], r: [0, -an - 1.6, 0] }); halo.push({ p: [TX + Math.cos(an + 1.6) * (R + 0.4), y + 2, TZ + Math.sin(an + 1.6) * (R + 0.4)], s: 3, c: 0xffb060 }); } }
    for (const [dx, dz, hh] of [[5.2, 1, 15], [-4.6, 3, 11]]) { tw.cyl(1.3, 1.5, hh, 10, { p: [TX + dx, TY + hh / 2, TZ + dz], c: ST2 }).cone(1.9, 4.4, 10, { p: [TX + dx, TY + hh + 2.2, TZ + dz], c: 0x4a2a7a }); tl.box(0.4, 0.9, 0.1, { p: [TX + dx, TY + hh - 1.4, TZ + dz + 1.36] }); }
    tl.box(1.5, 2.6, 0.12, { p: [TX, TY + 2.6, TZ + 4.6] }); for (let k = 0; k < 6; k++) { const an = k / 6 * TAU + 0.3; tl.box(0.12, 2, 0.8, { p: [TX + Math.cos(an) * 3.42, TY + 28.8, TZ + Math.sin(an) * 3.42], r: [0, -an, 0] }); }
    scene.add(tw.mesh(groundMat({ scale: 0.6, detail: 3, bump: 0.7, strata: 1.1, contrast: 0.5 })), new THREE.Mesh(tl.geometry(), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.9, 0.7) })));
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(2.6, 0), cm); gem.scale.set(1, 1.9, 1); gem.position.set(TX, TY + 50, TZ); scene.add(gem); halo.push({ p: [TX, TY + 50, TZ], s: 26, c: 0xa87aff });
    const gL = new THREE.PointLight(0x9a6aff, 1400, 120, 1.5); gL.position.set(TX, TY + 48, TZ); scene.add(gL);
    const beamM = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float uTime; ${NOISE} void main(){ float n = fbm(vec2(vUv.x*10.0, vUv.y*8.0 - uTime*0.9)); gl_FragColor = vec4(vec3(0.6, 0.4, 1.0)*n*pow(clamp(1.0 - vUv.y, 0.0, 1.0), 1.5)*0.55, 1.0); }` });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(4, 0.8, 300, 24, 1, true), beamM); beam.position.set(TX, TY + 200, TZ); scene.add(beam);

    // ---- the rune circle and the gate ----
    const RC = new V3(C.x, C.h(C.x, C.z) + 0.4, C.z + 4), rm = (t, col, k) => new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(col).multiplyScalar(k), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const rings = [[15, 0xb48aff, 1.5, 0.3, 24], [10.5, 0x5af0ff, 1.3, 2.4, 16], [6.5, 0xff8ae8, 1.3, 5, 12], [19, 0x8a6aff, 0.5, 9, 30]].map(([R, col, k, y, n], i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(R * 2, R * 2).rotateX(-Math.PI / 2), rm(runeTex(n + i, true), col, k)); m.position.copy(RC); m.position.y += y; scene.add(m); return m; });
    const mono = new Builder(), glyphG = [], gt = runeTex(5, false);
    for (let k = 0; k < 9; k++) { const an = k / 9 * TAU + 0.35, x = RC.x + Math.cos(an) * 16.5, z = RC.z + Math.sin(an) * 16.5, y = C.h(x, z), hh = 5 + (k % 3) * 1.4; mono.box(2, hh, 1, { p: [x, y + hh / 2 - 0.4, z], r: [(r() - 0.5) * 0.12, -an + Math.PI / 2, (r() - 0.5) * 0.12], c: 0x5c5470 });
      const g = new THREE.PlaneGeometry(1.5, 4.6), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (k % 4 + uv.getX(i)) / 4); g.rotateY(-an - Math.PI / 2).translate(x - Math.cos(an) * 0.56, y + hh / 2, z - Math.sin(an) * 0.56); glyphG.push(g); halo.push({ p: [x - Math.cos(an) * 0.8, y + hh / 2, z - Math.sin(an) * 0.8], s: 5, c: 0x8af0ff }); }
    scene.add(mono.mesh(groundMat({ scale: 0.7, detail: 4, bump: 0.9, strata: 1.3, contrast: 0.6 })), new THREE.Mesh(merge(glyphG), rm(gt, 0x8af0ff, 2.2)));
    const GP = new V3(C.x, C.h(C.x, C.z - 16) + 9.2, C.z - 16), arch = new Builder();
    for (let k = 0; k <= 26; k++) { const an = -0.5 + k / 26 * (Math.PI + 1.0), x = Math.cos(an) * 9, y = Math.sin(an) * 9; arch.box(2.2, 2.3, 2.6, { p: [GP.x + x, GP.y + y, GP.z], r: [0, 0, an], c: k % 2 ? 0x6a6282 : 0x565070 }); if (k % 3 === 1) halo.push({ p: [GP.x + x * 1.02, GP.y + y * 1.02, GP.z + 1.5], s: 3.4, c: 0xb48aff }); }
    for (const s of [-1, 1]) arch.box(3.4, 2.4, 3.4, { p: [GP.x + s * 8.2, GP.y - 6.6, GP.z], c: 0x4c4664 }).cone(1.3, 4, 6, { p: [GP.x + s * 10.6, GP.y + 9.5, GP.z], c: 0x6a6282 });
    scene.add(arch.mesh(groundMat({ scale: 0.6, detail: 4, bump: 0.9, strata: 1.2, contrast: 0.6 })));
    const gate = new THREE.Mesh(new THREE.CircleGeometry(8.2, 72), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uOpen: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float uTime, uOpen; ${NOISE}
        void main(){ vec2 p = vUv - 0.5; float rr = length(p)*2.0, a = atan(p.y, p.x), sw = a + 2.6/(rr + 0.22) - uTime*0.55; float n = fbm(vec2(cos(sw), sin(sw))*2.4 + rr*3.5 - uTime*0.25), arms = pow(0.5 + 0.5*sin(sw*3.0 + n*4.0), 2.0);
          vec3 c = mix(vec3(0.42, 0.08, 1.0), vec3(0.15, 0.85, 1.0), n)*(arms*1.5 + 0.18)*smoothstep(1.0, 0.72, rr) + vec3(1.0, 0.9, 1.0)*exp(-rr*(5.0 - uOpen*2.0))*(0.8 + uOpen*0.4);
          c += vec3(1.0)*step(0.993, hash21(floor(p*150.0)))*(0.5 + 0.5*sin(uTime*3.0 + rr*40.0))*1.5; c += vec3(0.7, 0.5, 1.0)*smoothstep(0.9, 1.0, rr)*1.2; gl_FragColor = vec4(c*(0.5 + uOpen*0.35), 1.0); }` })); gate.position.copy(GP); gate.position.z += 0.2; scene.add(gate);
    const pL = new THREE.PointLight(0x9a7aff, 700, 90, 1.5); pL.position.set(GP.x, GP.y, GP.z + 7); scene.add(pL);
    scene.add(points({ count: 1600, size: 0.32, gain: 3, spawn: (i, v) => v.copy(GP), colorFn: (i, c) => c.set(pick([0x8af0ff, 0xc89aff, 0xff9ae8, 0xffffff])), motion: 'float age = fract(uTime*0.16 + s.x); float rr = (1.0 - age)*(9.0 + s.y*18.0), an = s.z*6.283 + age*6.0; p.x += cos(an)*rr; p.y += sin(an)*rr*0.9; p.z += (1.0 - age)*(4.0 + s.w*30.0); a = age*(1.0 - age*age)*3.0;' }));

    // ---- falls, wisps, motes, the cloud floor ----
    scene.add(glows(halo, { gain: 0.22, flicker: 0.2 }));
    const fall = [[A, 1.1], [A, 3.9], [B, 5.2], [C, 2.2]].map(([S, an]) => { const x = S.x + Math.cos(an) * S.R * 0.9, z = S.z + Math.sin(an) * S.R * 0.9; return [x, S.h(x, z) - 1, z, Math.cos(an), Math.sin(an)]; });
    scene.add(points({ count: 6000, size: 0.5, shape: 'streak', additive: true, gain: 0.9, opacity: 0.55, color: 0xa8d8ff, spawn: (i, v, q) => { const f = fall[i % 4]; v.set(f[0] + (q() - 0.5) * 5 * f[4], f[1], f[2] + (q() - 0.5) * 5 * f[3]); }, motion: 'float age = fract(uTime*0.22 + s.x); p.y -= age*age*150.0; p.x += (s.y - 0.5)*age*6.0; p.z += (s.z - 0.5)*age*6.0; a = (1.0 - age)*smoothstep(0.0, 0.05, age); sz = 0.6 + s.w + age*3.0;' }));
    scene.add(points({ count: 1300, size: 0.42, gain: 3, seed: 8, spawn: (i, v, q) => { const a2 = q() * TAU, R = 4 + q() * 40; v.set(Math.cos(a2) * R, 2 + q() * 44, Math.sin(a2) * R); }, colorFn: (i, c) => c.set(pick([0x6affe0, 0xb4ffd8, 0xc89aff, 0xfff0a8])), motion: 'float an = uTime*(0.05 + s.x*0.12) + s.y*6.283; float c2 = cos(an), s2 = sin(an); p.xz = mat2(c2, -s2, s2, c2)*p.xz; p.y += sin(uTime*0.5 + s.z*30.0)*2.0; a *= 0.35 + 0.65*pow(0.5 + 0.5*sin(uTime*(1.0 + s.w*2.0) + s.x*40.0), 2.0); sz = 0.5 + s.w;' }));
    scene.add(points({ count: 4200, size: 0.16, gain: 2.2, seed: 15, spawn: (i, v, q) => v.set((q() - 0.5) * 340, -20 + q() * 110, 110 - q() * 420), colorFn: (i, c) => c.set(pick([0x8af0ff, 0xc89aff, 0xffffff, 0xff9ae8])), motion: 'p.y += sin(uTime*0.3 + s.x*30.0)*2.5 + uTime*0.3*s.y; p.y = mod(p.y + 20.0, 110.0) - 20.0; p.x += cos(uTime*0.2 + s.z*30.0)*2.0; a *= 0.3 + 0.7*sin(uTime*(0.5 + s.w) + s.y*30.0);' }));
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uFogCol: U.uFogCol }, vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: `varying vec3 vW; uniform float uTime; uniform vec3 uFogCol; ${NOISE} float den(vec2 p){ return fbm(p*0.005 + uTime*0.004) + 0.5*fbm(p*0.018 - uTime*0.006) + 0.2*fbm(p*0.06); }
        void main(){ vec2 p = vW.xz; float d = den(p), dl = den(p + vec2(-14.0, -20.0)); float lit = clamp(0.5 + (d - dl)*2.6, 0.0, 1.0), dist = length(vW - cameraPosition); vec3 c = mix(vec3(0.07, 0.04, 0.2), vec3(0.5, 0.42, 0.9), lit)*(0.6 + 0.6*d) + vec3(0.1, 0.5, 0.4)*pow(d, 3.0)*0.25; gl_FragColor = vec4(mix(c, uFogCol, 1.0 - exp(-dist*dist*0.0000015)), 1.0); }` })); sea.position.y = -110; scene.add(sea);

    Object.assign(look, { bloom: 0.9, bloomThreshold: 0.9, bloomKnee: 0.7, vignette: 0.65, aberration: 0.9, contrast: 1.08, saturation: 1.18, exposure: 1.15, grain: 0.035, ao: 0.9, fadeColor: new THREE.Color(0xe8dcff) });
    look.lift.setRGB(0.02, 0.01, 0.05);
    return {
      parallax: 0.5,
      rail: [
        { p: 0, pos: [34, 26, 142], look: [0, 20, 0], fov: 46 },
        { p: 0.14, pos: [15, A.h(15, 44) + 3, 44], look: [0, 17, 0], fov: 56 },
        { p: 0.28, pos: [-14, 9, -22], look: [-70, 34, -112], fov: 50 },
        { p: 0.42, pos: [-46, 27, -76], look: [TX, TY + 26, TZ], fov: 54 },
        { p: 0.56, pos: [-50, 42, -152], look: [36, 32, -232], fov: 50 },
        { p: 0.7, pos: [14, RC.y + 6.5, RC.z + 24], look: [RC.x, RC.y + 3, RC.z], fov: 54 },
        { p: 0.85, pos: [RC.x + 1.5, RC.y + 4.4, RC.z + 9], look: [GP.x, GP.y, GP.z], fov: 52 },
        { p: 1, pos: [GP.x, GP.y - 0.6, GP.z + 7], look: [GP.x, GP.y, GP.z], fov: 68 } ],
      update(t, p) {
        rings.forEach((m, i) => { m.rotation.y = t * (0.12 + i * 0.05) * (i % 2 ? -1 : 1); m.position.y = RC.y + [0.3, 2.4, 5, 9][i] + Math.sin(t * 0.6 + i) * 0.3; m.material.opacity = 0.75 + 0.25 * Math.sin(t * 1.3 + i * 2); });
        gem.rotation.y = t * 0.5; gem.position.y = TY + 50 + Math.sin(t * 0.8) * 0.8; gL.intensity = 1200 + Math.sin(t * 2.1) * 300; eL.intensity = 450 + Math.sin(t * 0.9) * 90;
        const op = smooth(0.72, 0.98, p); gate.material.uniforms.uOpen.value = op; pL.intensity = 300 + op * 250 + Math.sin(t * 4) * 50;
        look.bloom = 0.9 - op * 0.4; look.fade = smooth(0.965, 1, p) * 0.5; moon2.rotation.y = t * 0.01;
      },
    };
  },
};
