// 08 Mythology · Olympus: a marble temple above a sea of cloud, a storm with thunderbolts, an eternal flame, and the stars of the heroes.
import * as THREE from '../lib/three.module.min.js';
import { U, NOISE, Builder, stdMat, groundMat, instanced, terrain, sky, points, glows, sunLight, merge, xform, rng, fbm2, noise2, lerp, smooth, win, TAU } from '../lib/kit.js';
import { conifer, broadleaf, bush, grassClump, grassFar, grassMat, boulder, treeMats, plant, needleTex, leafTex, barkTex } from '../lib/flora.js';

const V3 = THREE.Vector3;
function H(x, z) { const d = Math.hypot(x * 1.15, z - 40), n = fbm2(x * 0.02 + 4, z * 0.02, 5);
  return (n - 0.5) * 2.4 * smooth(20, 70, d) - smooth(74, 190, d + (n - 0.5) * 50) * 130 - Math.pow(smooth(60, 110, d), 2) * 8 + Math.pow(fbm2(x * 0.06, z * 0.06 + 9, 3), 2) * 9 * smooth(66, 100, d); }

export default {
  build({ scene, look, env }) {
    const r = rng(12), sunDir = new V3(-0.55, 0.36, 0.62).normalize();
    scene.fog = new THREE.FogExp2(0xe8c8a8, 0.0009);
    const dome = sky({ top: 0x2a56a8, horizon: 0xf8c088, bottom: 0xe8c0a0, pow: 0.42, sunDir, sunColor: 0xffe0b0, sunSize: 0.0008, sunIntensity: 40, sunGlow: 1.2, clouds: 0.3, cloudColor: 0xfff2e0, cloudDark: 0x8a8aa8, stars: 0 }); scene.add(dome); env(dome, 0.75);
    const hemi = new THREE.HemisphereLight(0xbcd4ff, 0x8a7460, 0.5); scene.add(hemi);
    const sun = sunLight(scene, { dir: sunDir, color: 0xffdcb0, intensity: 3.8, box: 110, far: 600, map: 4096, target: [0, 6, 30] });
    const bolt = new THREE.DirectionalLight(0xc8d8ff, 0); bolt.position.set(60, 120, -200); scene.add(bolt);
    U.uCloudSh.value.set(0.4, 0.008, 0.02); U.uSunDirF.value.copy(sunDir); U.uSunFog.value.set(0.5, 0.3, 0.12);

    // ---- the mountain ----
    const a = new THREE.Color(), b = new THREE.Color();
    scene.add(terrain({ size: 900, seg: 300, height: H, mat: groundMat({ scale: 0.25, detail: 3, bump: 0.9, strata: 0.35, contrast: 0.7 }), color: (x, z, y, sl, c) => { const n = fbm2(x * 0.06, z * 0.06, 3);
      c.set(0x7a8a4a).lerp(a.set(0xa89a6a), n); c.lerp(b.set(0xb8ac98).multiplyScalar(0.8 + n * 0.4), smooth(0.14, 0.34, sl)); if (Math.abs(x) < 5 && z > 16 && z < 132) c.set(0xd8cfc0).multiplyScalar(0.8 + 0.25 * noise2(Math.floor(x / 1.6) * 3.1, Math.floor(z / 1.6) * 7.7)); c.lerp(b.set(0x8a8478), smooth(-10, -60, y)); } }));
    const rkm = groundMat({ scale: 0.5, detail: 4, bump: 1, strata: 1.2, contrast: 0.6, vertexColors: false, color: 0xcfc6b6 });
    [boulder(6), boulder(18)].forEach(g => scene.add(instanced(g, rkm, 170, (i, d, c) => { const an = r() * TAU, R = 34 + r() * 70, x = Math.cos(an) * R, z = 40 + Math.sin(an) * R; if (Math.abs(x) < 16 && z > -40) return false; d.position.set(x, H(x, z) - 0.1, z); const s = 0.4 + r() * r() * 3.6; d.scale.set(s, s * 0.8, s); d.rotation.y = r() * TAU; c.setScalar(0.75 + r() * 0.3); }, true)));

    // ---- marble: one fluted Doric column, then the whole temple from it ----
    const marble = groundMat({ scale: 0.18, detail: 1.4, bump: 0.12, contrast: 0.22, roughness: 0.42 }), gold = new THREE.MeshStandardMaterial({ color: 0xffc04a, metalness: 1, roughness: 0.24, emissive: 0x6a3a00, emissiveIntensity: 0.25 });
    const CH = 10.5, shaft = new THREE.CylinderGeometry(1, 1, CH, 40, 16); { const p = shaft.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = y / CH + 0.5; if (Math.hypot(x, z) < 0.01) continue; const th = Math.atan2(z, x), k = (1 - 0.055 * Math.pow(0.5 + 0.5 * Math.cos(th * 20), 0.5)) * (1 - 0.2 * t * t + 0.03 * Math.sin(t * Math.PI)); p.setXYZ(i, x * k, y, z * k); } shaft.computeVertexNormals(); }
    const colB = new Builder().add(shaft, { p: [0, CH / 2, 0], c: 0xe6dfd2 }).lathe([[0.8, 0], [0.84, 0.08], [0.9, 0.14], [1.16, 0.4], [1.2, 0.5], [0.0, 0.5]], 32, { p: [0, CH - 0.02, 0], c: 0xf0eadf }).box(2.6, 0.38, 2.6, { p: [0, CH + 0.66, 0], c: 0xf4efe6 }).cyl(0.84, 0.86, 0.1, 32, { p: [0, CH - 0.35, 0], c: 0xe8e0d2 });
    const colG = colB.geometry(), cols = [], TY = 1.5;
    for (let i = 0; i < 8; i++) { cols.push([-11.2 + i * 3.2, TY, 12, 1], [-11.2 + i * 3.2, TY, -36, 1]); if (i > 1 && i < 6) cols.push([-11.2 + i * 3.2, TY, 5.5, 0.9]); }
    for (let k = 1; k < 15; k++) cols.push([-11.2, TY, 12 - k * 3.2, 1], [11.2, TY, 12 - k * 3.2, 1]);
    for (let k = 0; k < 13; k++) for (const s of [-1, 1]) cols.push([s * 7.2, 0.4, 28 + k * 8.4, 0.62]);
    scene.add(instanced(colG, marble, cols.length, (i, d, c) => { const q = cols[i]; d.position.set(q[0], q[1], q[2]); d.scale.set(q[3], q[3], q[3]); d.rotation.y = r() * TAU; c.setScalar(0.93 + r() * 0.07); }, true));
    const T = new Builder(), Gd = new Builder(), M = 0xe4dccf, M2 = 0xd6cdbe;
    for (let s = 0; s < 3; s++) T.box(27.6 - s * 1.2, 0.5, 53 - s * 1.2, { p: [0, 0.25 + s * 0.5, -12], c: s % 2 ? M2 : M });
    const EY = TY + CH + 0.86; T.box(25.6, 1.25, 51, { p: [0, EY + 0.62, -12], c: M }).box(25.9, 1.3, 51.3, { p: [0, EY + 1.9, -12], c: M2 }).box(27.4, 0.5, 52.8, { p: [0, EY + 2.8, -12], c: M });
    for (let i = 0; i < 32; i++) { const x = -12.4 + i * 0.8; if (i % 2 === 0) for (const z of [13.66, -37.66]) T.box(0.5, 1.2, 0.12, { p: [x, EY + 1.9, z], c: 0xd8cfc0 }); }
    for (let i = 0; i < 64; i += 2) for (const s of [-1, 1]) T.box(0.12, 1.2, 0.5, { p: [s * 12.98, EY + 1.9, 13.2 - i * 0.8], c: 0xd8cfc0 });
    for (let i = 0; i < 7; i++) for (const z of [13.7, -37.7]) Gd.cyl(0.5, 0.5, 0.1, 24, { p: [-9.6 + i * 3.2, EY + 0.62, z], r: [Math.PI / 2, 0, 0] });
    // pediments, roof, acroteria
    const ps = new THREE.Shape(); ps.moveTo(-13.7, 0); ps.lineTo(13.7, 0); ps.lineTo(0, 4.4); ps.closePath(); const ph = new THREE.Path(); ph.moveTo(-11.2, 0.5); ph.lineTo(0, 3.7); ph.lineTo(11.2, 0.5); ph.closePath(); ps.holes.push(ph);
    for (const z of [13.2, -38.4]) { T.add(new THREE.ExtrudeGeometry(ps, { depth: 1.2, bevelEnabled: false }), { p: [0, EY + 3.05, z], c: M }).box(23, 3.4, 0.2, { p: [0, EY + 4.6, z + 0.5], c: 0xcfc4b0 });
      Gd.sph(0.9, { p: [0, EY + 8.1, z + 0.6], s: [1, 1.5, 0.5] }).sph(0.55, { p: [-13.4, EY + 3.7, z + 0.6], s: [1, 1.4, 0.5] }).sph(0.55, { p: [13.4, EY + 3.7, z + 0.6], s: [1, 1.4, 0.5] });
      for (let k = -3; k <= 3; k++) Gd.sph(0.5, { p: [k * 2.7, EY + 3.9 + (3 - Math.abs(k)) * 0.72, z + 0.75], s: [1, 1.5 + (3 - Math.abs(k)) * 0.35, 0.45] }, 12, 8); }
    for (const s of [-1, 1]) T.box(14.6, 0.3, 53, { p: [s * 6.9, EY + 5.25, -12], r: [0, 0, s * -0.312], c: 0xc8b8a0 });
    // cella: walls, doorway, inner floor
    for (const s of [-1, 1]) T.box(0.9, CH + 0.9, 36, { p: [s * 7.6, TY + (CH + 0.9) / 2, -13], c: M2 }).box(2.6, CH + 0.9, 0.9, { p: [s * 5.9, TY + (CH + 0.9) / 2, 4.6], c: M2 });
    T.box(16, CH + 0.9, 0.9, { p: [0, TY + (CH + 0.9) / 2, -31], c: M2 }).box(9.4, 2.4, 0.9, { p: [0, TY + CH - 0.3, 4.6], c: M2 });
    for (let i = 0; i < 10; i++) for (let k = 0; k < 22; k++) T.box(1.44, 0.06, 1.6, { p: [-6.5 + i * 1.45, TY + 0.03, 3.4 - k * 1.61], c: (i + k) % 2 ? 0xe8e2d6 : 0x6a7a8a });
    Gd.box(0.3, 8.2, 0.5, { p: [-4.6, TY + 4.1, 4.9] }).box(0.3, 8.2, 0.5, { p: [4.6, TY + 4.1, 4.9] }).box(9.6, 0.4, 0.5, { p: [0, TY + 8.3, 4.9] });
    // altar, tripod, laurel
    const FZ = -24; T.cyl(2.2, 2.6, 1.1, 32, { p: [0, TY + 0.55, FZ], c: M }).cyl(1.5, 1.6, 0.5, 32, { p: [0, TY + 1.35, FZ], c: M2 });
    for (let k = 0; k < 3; k++) { const an = k * TAU / 3 + 0.5; Gd.cyl(0.07, 0.1, 2.3, 8, { p: [Math.cos(an) * 0.8, TY + 2.7, FZ + Math.sin(an) * 0.8], r: [Math.sin(an) * 0.22, 0, -Math.cos(an) * 0.22] }); }
    Gd.lathe([[0.2, 0], [1.0, 0.25], [1.45, 0.75], [1.5, 0.9], [1.35, 0.9], [0.9, 0.4], [0.1, 0.2]], 32, { p: [0, TY + 3.6, FZ] }).tor(3.6, 0.09, { p: [0, TY + 7.6, FZ - 5.8] }, TAU, 64);
    for (let k = 0; k < 44; k++) { const an = k / 44 * TAU; Gd.sph(0.34, { p: [Math.cos(an) * 3.6, TY + 7.6 + Math.sin(an) * 3.6, FZ - 5.8], s: [1, 0.25, 0.5], r: [0, 0, an + (k % 2 ? 0.9 : -0.9)] }, 8, 6); }
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) Gd.cyl(0.95, 0.95, 0.12, 32, { p: [s * 7.05, TY + 6, -4 - k * 7], r: [0, 0, Math.PI / 2] }).sph(0.3, { p: [s * 6.9, TY + 6, -4 - k * 7] });
    // braziers along the sacred way
    const fires = [[0, TY + 4.6, FZ, 2.6]];
    for (let k = 0; k < 6; k++) for (const s of [-1, 1]) { const x = s * 4.4, z = 32.2 + k * 16.8, y = H(x, z); T.cyl(0.5, 0.62, 1.5, 12, { p: [x, y + 0.75, z], c: M2 }); Gd.lathe([[0.1, 0], [0.55, 0.12], [0.75, 0.42], [0.7, 0.42], [0.1, 0.12]], 20, { p: [x, y + 1.5, z] }); fires.push([x, y + 2.25, z, 0.85]); }
    for (const s of [-1, 1]) { T.cyl(0.7, 0.9, 1.8, 16, { p: [s * 9.8, 0.9, 16.5], c: M2 }); Gd.lathe([[0.1, 0], [0.8, 0.15], [1.05, 0.55], [1.0, 0.55], [0.1, 0.15]], 24, { p: [s * 9.8, 1.8, 16.5] }); fires.push([s * 9.8, 2.95, 16.5, 1.3]); }
    scene.add(T.mesh(marble), Gd.mesh(gold));
    const fg = []; fires.forEach(([x, y, z, s]) => { for (let k = 0; k < 3; k++) fg.push(xform(new THREE.PlaneGeometry(1.5 * s, 2.6 * s), { p: [x, y + 0.75 * s, z], r: [0, k * Math.PI / 3, 0] })); });
    scene.add(new THREE.Mesh(merge(fg), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: `varying vec2 vUv; varying vec3 vW; uniform float uTime; ${NOISE} void main(){ vec2 q = vUv; float ph = floor(vW.x*0.7) + floor(vW.z*0.7); float n = fbm(vec2(q.x*3.0 + ph, q.y*2.6 - uTime*2.0)), n2 = fbm(vec2(q.x*7.0 + ph, q.y*5.5 - uTime*3.4));
        float sh = (1.0 - q.y)*smoothstep(0.5, 0.0, abs(q.x - 0.5 + (n - 0.5)*0.25*q.y)*(1.0 + q.y*2.2)); float f = smoothstep(0.2, 0.85, sh*1.7 + (n - 0.5)*0.9 + (n2 - 0.5)*0.4)*smoothstep(0.0, 0.08, q.y);
        gl_FragColor = vec4((mix(vec3(1.0, 0.22, 0.02), vec3(1.0, 0.78, 0.3), f) + vec3(1.0)*smoothstep(0.75, 1.0, f)*0.6)*f*1.25, 1.0); }` })));
    const fl = fires.map(([x, y, z, s], i) => { if (i && i % 2 && i < 13) return null; const l = new THREE.PointLight(0xff9a40, 60 * s * s, 30 * Math.sqrt(s), 1.7); l.position.set(x, y + 1, z); scene.add(l); return l; }).filter(Boolean);
    scene.add(points({ count: 900, size: 0.07, gain: 4, color: 0xffa040, spawn: (i, v) => { const f = fires[i % fires.length]; v.set(f[0], f[1], f[2]); }, motion: 'float age = fract(uTime*(0.3 + s.x*0.4) + s.y); p.y += age*(3.0 + s.z*5.0); p.x += sin(age*9.0 + s.w*40.0)*0.5*age + (s.z - 0.5)*age; p.z += cos(age*7.0 + s.x*40.0)*0.5*age; a = (1.0 - age)*smoothstep(0.0, 0.1, age);' }));

    // ---- olives, cypresses, scrub, grass ----
    const om = treeMats({ map: leafTex(84, 22, 44), bark: barkTex('#5c5044'), wind: 0.08, h0: 1.5, h1: 7 }), ol = [broadleaf({ seed: 6, height: 6, depth: 4, forks: 3, spread: 0.85, gnarl: 0.5, up: 0.35, trunk: 0.24, radius: 0.36, cardSize: 1.1, cardsPer: 4, hue: [0.2, 0.28], sat: 0.22, light: [0.38, 0.58] }), broadleaf({ seed: 23, height: 7, depth: 4, forks: 4, spread: 0.8, gnarl: 0.55, up: 0.3, trunk: 0.2, radius: 0.42, cardSize: 1.2, cardsPer: 4, hue: [0.19, 0.27], sat: 0.2, light: [0.36, 0.56] })];
    const cm = treeMats({ map: needleTex(125), bark: barkTex('#4a3c30'), wind: 0.05, h0: 1, h1: 15 }), cy = conifer({ seed: 7, height: 15, radius: 1.5, whorls: 36, droop: -1.5 }), oL = [[], []], cL = [];
    for (let i = 0; i < 4000; i++) { const an = r() * TAU, R = 22 + r() * 76, x = Math.cos(an) * R * 0.9, z = 40 + Math.sin(an) * R, y = H(x, z); if (y < -22 || (Math.abs(x) < 17 && z < 20 && z > -44) || (Math.abs(x) < 9.5 && z > 0)) continue;
      if (noise2(x * 0.05, z * 0.05) > 0.52 && oL[0].length + oL[1].length < 70) oL[i % 2].push({ p: [x, y - 0.2, z], s: 0.8 + r() * 0.7, ry: r() * TAU }); else if (cL.length < 60 && noise2(x * 0.03 + 7, z * 0.03) > 0.55) cL.push({ p: [x, y - 0.3, z], s: 0.7 + r() * 0.6, ry: r() * TAU, c: new THREE.Color().setScalar(0.6 + r() * 0.3) }); }
    for (let k = 0; k < 7; k++) for (const s of [-1, 1]) cL.push({ p: [s * 11.5, H(s * 11.5, 30 + k * 15) - 0.3, 30 + k * 15], s: 0.95 + r() * 0.2, ry: r() * 6, c: new THREE.Color().setScalar(0.62) });
    oL.forEach((l, i) => plant(scene, ol[i], om, l)); plant(scene, cy, cm, cL);
    scene.add(instanced(bush({ seed: 5, radius: 1, cards: 28, hue: [0.2, 0.3], light: [0.34, 0.52], sat: 0.3 }), om.leaf, 520, (i, d, c) => { const an = r() * TAU, R = 14 + r() * 84, x = Math.cos(an) * R, z = 40 + Math.sin(an) * R, y = H(x, z); if (y < -30 || (Math.abs(x) < 16 && z < 20 && z > -42) || (Math.abs(x) < 6 && z > 0)) return false; d.position.set(x, y - 0.1, z); const s = 0.4 + r() * 0.9; d.scale.set(s * 1.3, s, s * 1.3); d.rotation.y = r() * 6; c.setScalar(0.7 + r() * 0.4); }, true));
    const gm = grassMat({ wind: 0.14, height: 0.5 });
    [grassClump({ seed: 2, blades: 9, height: 0.5 }), grassClump({ seed: 8, blades: 7, height: 0.75, lean: 0.7 })].forEach(g => scene.add(instanced(g, gm, 34000, (i, d, c) => { const an = r() * TAU, R = Math.sqrt(r()) * 96, x = Math.cos(an) * R, z = 44 + Math.sin(an) * R, y = H(x, z); if (y < -14 || (Math.abs(x) < 5.4 && z > 14 && z < 134) || (Math.abs(x) < 14.4 && z < 15 && z > -39) || noise2(x * 0.1, z * 0.1) < 0.3) return false;
      d.position.set(x, y - 0.03, z); d.rotation.y = r() * TAU; const s = 0.6 + r() * 0.9; d.scale.set(s * 1.4, s, s * 1.4); c.setHSL(0.16 + r() * 0.1, 0.5, 0.45 + r() * 0.3); }, false, { cell: 24, far: 135, lod: { geo: grassFar(0.6), at: 20 } })));

    // ---- the sea of cloud and far summits ----
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000, 1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uSun: { value: sunDir }, uLit: { value: new THREE.Color(0xfff0dc) }, uDark: { value: new THREE.Color(0x9a94b0) }, uFogCol: U.uFogCol, uFlash: { value: 0 } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: `varying vec3 vW; uniform float uTime, uFlash; uniform vec3 uSun, uLit, uDark, uFogCol; ${NOISE}
        float den(vec2 p){ return fbm(p*0.006 + uTime*0.004) + 0.5*fbm(p*0.02 - uTime*0.007) + 0.2*fbm(p*0.07); }
        void main(){ vec2 p = vW.xz; float d = den(p), dl = den(p + uSun.xz*26.0); float lit = clamp(0.55 + (d - dl)*2.4, 0.0, 1.0); float dist = length(vW - cameraPosition);
          vec3 c = mix(uDark, uLit, lit)*(0.72 + 0.5*d) + vec3(0.7, 0.8, 1.0)*uFlash*(0.3 + d); gl_FragColor = vec4(mix(c, uFogCol, 1.0 - exp(-dist*dist*0.0000012)), 1.0); }` })); sea.position.y = -42; scene.add(sea);
    const puff = points({ count: 520, size: 62, additive: false, opacity: 0.14, color: 0xfff4e6, fog: false, seed: 6, spawn: (i, v, q) => { const an = q() * TAU, R = 110 + q() * 420; v.set(Math.cos(an) * R, -40 + q() * q() * 30, 40 + Math.sin(an) * R); }, motion: 'p.x += uTime*0.6*(0.4 + s.x); p.x = mod(p.x + 520.0, 1040.0) - 520.0; sz = 0.6 + s.z*1.2;' }); scene.add(puff);
    // a far range: only its summits break through the cloud
    const PH = (x, z) => { const d = Math.hypot(x, z - 40), m = smooth(700, 1150, d) * (1 - smooth(1650, 2000, d)), n = fbm2(x * 0.0026 + 7, z * 0.0026 + 3, 6), rg = 1 - Math.abs(2 * fbm2(x * 0.007 + 2, z * 0.007, 5) - 1); return -110 + m * (Math.pow(n, 2.2) * 760 + rg * 70 * n); };
    scene.add(terrain({ size: 4200, seg: 230, height: PH, mat: groundMat({ scale: 0.012, detail: 0.07, bump: 1.4, strata: 0.02, contrast: 0.75 }), color: (x, z, y, sl, c) => { const n = fbm2(x * 0.01, z * 0.01, 3); c.set(0x8c8a98).lerp(a.set(0xa49a94), n); c.lerp(b.set(0xf4f2f6), smooth(120, 200, y + n * 60) * (1 - smooth(0.5, 0.8, sl))); } }));

    // ---- thunderbolts, rain ----
    const bolts = Array.from({ length: 7 }, (_, i) => { const x0 = (r() - 0.5) * 520, z0 = -120 - r() * 320, pts = []; let x = x0, z = z0; for (let k = 0; k <= 18; k++) { pts.push(new V3(x, 190 - k * 13, z)); x += (r() - 0.5) * 30; z += (r() - 0.5) * 18; }
      const g = [new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 90, 0.9, 5)]; for (let b2 = 0; b2 < 3; b2++) { const k0 = 3 + Math.floor(r() * 10), q = pts[k0].clone(), pp = [q.clone()], dx = (r() - 0.5) * 30; for (let k = 0; k < 6; k++) { q.x += dx + (r() - 0.5) * 16; q.y -= 9 + r() * 6; q.z += (r() - 0.5) * 14; pp.push(q.clone()); } g.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pp, false, 'catmullrom', 0.05), 30, 0.4, 4)); }
      const m = new THREE.Mesh(merge(g), new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 8.5, 12), fog: false })); m.visible = false; m.userData = { per: 3.5 + r() * 4, ph: r() * 9, x: x0, z: z0 }; scene.add(m); return m; });
    const rain = points({ count: 9000, size: 1.0, shape: 'streak', color: 0xb8c8e8, gain: 0.9, opacity: 0, fog: false, spawn: (i, v, q) => v.set((q() - 0.5) * 150, q() * 70, 60 + (q() - 0.5) * 170), motion: 'p.y = mod(p.y - uTime*(40.0 + s.x*16.0), 70.0) - 6.0; p.x += (p.y)*0.12; sz = 0.5 + s.y;' }); scene.add(rain);

    // ---- constellations ----
    const figs = [[[0, 0], [1, 2], [2.4, 2.6], [3.4, 1.2], [2.6, -0.6], [1, -1], [0, 0], [-1.2, 1.4], [-0.6, 3.2], [1, 2]], [[0, 0], [0.6, 1.6], [0, 3.2], [-1.4, 4.2], [0, 3.2], [1.6, 4], [0.6, 1.6], [2.2, 0.8], [0.6, 1.6], [-1.6, 1], [0, 0], [-0.8, -2], [0, 0], [1, -2.2]], [[-3, 0], [-1.4, 0.5], [0, 0], [1.6, 0.6], [3.2, 0], [0, 0], [0.2, 2], [0, 0], [-0.3, -2.4]], [[0, 0], [1, 1.5], [0.2, 3], [-1.4, 3.3], [-2.4, 2], [-1.6, 0.4], [0, 0], [0.8, -1.8], [2.6, -2.2]]];
    const cp = [], cs = []; figs.forEach((f, i) => { const az = -0.85 + i * 0.56, el = 0.5 + (i % 2) * 0.22, c = new V3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(2400), rt = new V3(Math.cos(az), 0, Math.sin(az)), up = new V3().crossVectors(rt, c.clone().normalize()).negate();
      const P = f.map(([x, y]) => c.clone().addScaledVector(rt, x * 105).addScaledVector(up, y * 105)); for (let k = 0; k < P.length - 1; k++) cp.push(...P[k].toArray(), ...P[k + 1].toArray()); P.forEach(q => cs.push(q)); });
    const cgeo = new THREE.BufferGeometry(); cgeo.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
    const lines = new THREE.LineSegments(cgeo, new THREE.LineBasicMaterial({ color: new THREE.Color(1.2, 1.0, 0.6), transparent: true, opacity: 0, fog: false, depthWrite: false })); scene.add(lines);
    const cst = points({ count: cs.length, size: 34, gain: 3, color: 0xfff0c8, shape: 'spark', fog: false, opacity: 0, spawn: (i, v) => v.copy(cs[i]), motion: 'a *= 0.75 + 0.25*sin(uTime*2.0 + s.x*40.0); sz = 0.7 + s.y*0.6;' }); scene.add(cst);
    // eagles
    const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0.5, -2, 0.5, -0.2, 0, 0, -0.4, 0, 0, 0.5, 0, 0, -0.4, 2, 0.5, -0.2]), 3));
    const birds = new THREE.InstancedMesh(bgeo, new THREE.MeshBasicMaterial({ color: 0x2a221c, side: THREE.DoubleSide }), 9); birds.frustumCulled = false; scene.add(birds); const o = new THREE.Object3D();

    Object.assign(look, { bloom: 0.6, bloomThreshold: 1.05, vignette: 0.55, contrast: 1.08, saturation: 1.12, grain: 0.03, ao: 1, aoRadius: 1.2, godPos: sunDir, godDir: true, god: 0.4, godColor: new THREE.Color(0xffd8a0) });
    const su = dome.userData.u, sm = sea.material.uniforms, c0 = new THREE.Color(), c1 = new THREE.Color(), c2 = new THREE.Color(), tri = (A, B, C, s, n) => c0.set(A).lerp(c1.set(B), s).lerp(c2.set(C), n);
    return {
      parallax: 0.45, floor: H, clearance: 1.6,
      rail: [
        { p: 0, pos: [-20, 40, 262], look: [0, 16, 0], fov: 40 },
        { p: 0.14, pos: [-26, 9, 138], look: [0, 10, 30], fov: 46 },
        { p: 0.28, pos: [0.6, 3.1, 104], look: [0, 8.5, 12], fov: 50 },
        { p: 0.42, pos: [3.6, 3.4, 38], look: [-0.5, 10.5, -4], fov: 54 },
        { p: 0.56, pos: [-44, 14, 42], look: [20, 44, -150], fov: 52 },
        { p: 0.64, pos: [0, 6, 26], look: [0, 7, -6], fov: 52 },
        { p: 0.72, pos: [0, 5.4, 6], look: [0, 6, FZ], fov: 54 },
        { p: 0.84, pos: [3.4, 5.2, -13], look: [0, 6.6, FZ], fov: 48 },
        { p: 0.92, pos: [0, 9, 40], look: [0, 22, FZ], fov: 50 },
        { p: 1, pos: [0, 30, 126], look: [0, 78, -110], fov: 50 } ],
      update(t, p) {
        const st = win(0.44, 0.66, p, 0.06), nt = smooth(0.74, 0.97, p), dim = 1 - Math.max(st * 0.75, nt * 0.94);
        let flash = 0; bolts.forEach(m => { const u = ((t + m.userData.ph) % m.userData.per) / m.userData.per, on = st > 0.25 && u < 0.06 && Math.sin(u * 900) > -0.4; m.visible = on; if (on) { flash = 1; bolt.position.set(m.userData.x, 150, m.userData.z); } else if (st > 0.25 && u < 0.14) flash = Math.max(flash, (0.14 - u) * 6); });
        su.uTop.value.copy(tri(0x2a56a8, 0x1a1e2e, 0x05060f, st, nt)); su.uHor.value.copy(tri(0xf8c088, 0x565a6c, 0x1c1a38, st, nt)); su.uBot.value.copy(su.uHor.value); su.uClouds.value = lerp(0.3, 0.95, st) * (1 - nt * 0.75); su.uCloudCol.value.copy(tri(0xfff2e0, 0x70748a, 0x2a2c48, st, nt)).addScalar(flash * 0.5); su.uCloudDark.value.copy(tri(0x8a8aa8, 0x1e2030, 0x0a0b18, st, nt));
        su.uStars.value = nt * 1.6; su.uSunInt.value = 40 * dim * (1 - nt); su.uSunGlow.value = 1.2 * dim * (1 - nt);
        scene.fog.color.copy(tri(0xe8c8a8, 0x4a4e60, 0x12122a, st, nt)); scene.fog.density = 0.0009 + st * 0.0026; U.uSunFog.value.set(0.3, 0.18, 0.07).multiplyScalar(dim * (1 - nt));
        sun.intensity = 3.0 * dim + nt * 0.5; sun.color.copy(tri(0xffdcb0, 0xa8b4d0, 0x8aa4ff, st, nt)); hemi.intensity = 0.5 * (0.35 + 0.65 * dim); scene.environmentIntensity = 0.75 * (0.25 + 0.75 * dim);
        bolt.intensity = flash * 7; sm.uFlash.value = flash; sm.uLit.value.copy(tri(0xfff0dc, 0x6c7084, 0x3a3e68, st, nt)); sm.uDark.value.copy(tri(0x9a94b0, 0x24262f, 0x0e1024, st, nt));
        puff.material.uniforms.uOpacity.value = 0.14 * (0.4 + 0.6 * dim); rain.material.uniforms.uOpacity.value = st * 0.4;
        lines.material.opacity = nt * 0.5; cst.material.uniforms.uOpacity.value = nt; look.god = 0.4 * dim * (1 - nt); look.exposure = 1 + flash * 0.35 + nt * 0.25 - 0.25 * win(0.68, 0.88, p, 0.04); look.bloom = 0.6 + nt * 0.3;
        fl.forEach((l, i) => { l.intensity = (i ? 60 : 55) * (0.85 + 0.15 * Math.sin(t * 11 + i * 3) + 0.1 * Math.sin(t * 23 + i)) * (0.5 + 0.5 * Math.max(st, nt, smooth(0.6, 0.7, p))); });
        for (let i = 0; i < 9; i++) { const an = t * 0.05 + i * 0.9, R = 70 + i * 16; o.position.set(Math.cos(an) * R, 46 + i * 6 + Math.sin(an * 2) * 5, 20 + Math.sin(an) * R); o.rotation.set(0, -an, Math.sin(t * 0.3 + i) * 0.3); o.scale.setScalar(1.2); o.scale.y = 1.2 * (0.5 + Math.sin(t * 2.2 + i) * 0.8); o.updateMatrix(); birds.setMatrixAt(i, o.matrix); } birds.instanceMatrix.needsUpdate = true;
      },
    };
  },
};
