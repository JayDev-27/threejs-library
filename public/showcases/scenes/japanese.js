// 02 Japanese · Yoizakura: a torii corridor at dusk opening onto a moonlit pond, night sakura and a five-storey pagoda.
import * as THREE from '../lib/three.module.min.js';
import { U, Builder, stdMat, groundMat, instanced, terrain, windify, sky, points, water, sunLight, glows, rng, fbm2, noise2, lerp, smooth, TAU } from '../lib/kit.js';
import { conifer, broadleaf, bush, grassClump, grassFar, grassMat, boulder, treeMats, plant, needleTex, leafTex, blossomTex, barkTex } from '../lib/flora.js';

const PZ = -150;
function H(x, z) {
  const dp = Math.hypot(x, z - PZ);
  let b = 0.6 + (fbm2(x * 0.03, z * 0.03, 3) - 0.5) * 1.4 * smooth(3, 9, Math.abs(x));
  // hills ring the garden, but the approach runs along a level valley floor
  b += smooth(75, 280, Math.hypot(x, z + 60)) * (10 + fbm2(x * 0.008 + 5, z * 0.008, 4) * 70) * lerp(1, smooth(7, 52, Math.abs(x)), smooth(-112, -82, z));
  b = lerp(-2.6, b, smooth(58, 72, dp + (noise2(x * 0.05, z * 0.05) - 0.5) * 14));
  return lerp(b, 1.3, 1 - smooth(11, 18, dp));
}

export default {
  build({ scene, look, mirror, env }) {
    const r = rng(5), moonDir = new THREE.Vector3(0.1, 0.36, -1).normalize();
    scene.fog = new THREE.FogExp2(0x1a1830, 0.0048);
    const dome = sky({ top: 0x070a1c, horizon: 0x4a2a52, bottom: 0x1a1830, pow: 0.42, sunDir: moonDir, sunColor: 0xfff2d8, sunSize: 0.0042, sunIntensity: 2.4, sunGlow: 0.12, moon: true, stars: 1.1, clouds: 0.42, cloudColor: 0x8a7aa8, cloudDark: 0x1c1a34, cloudScale: 0.7 }); scene.add(dome); env(dome, 0.42); U.uMist.value.set(0.0012, 4, 0); U.uSunDirF.value.copy(moonDir); U.uSunFog.value.set(0.1, 0.12, 0.2);
    scene.add(new THREE.HemisphereLight(0x6a78c8, 0x241820, 0.34));
    sunLight(scene, { dir: moonDir, color: 0xa8c0ff, intensity: 1.15, box: 130, far: 700, map: 4096, target: [0, 0, -60] });

    // ground: moss, stone path, pond bed
    const a = new THREE.Color(), b = new THREE.Color();
    scene.add(terrain({ size: 900, seg: 260, height: H, mat: groundMat({ roughness: 0.85, scale: 0.6, detail: 7, bump: 0.5, contrast: 0.7 }), color: (x, z, y, sl, c) => {
      const n = fbm2(x * 0.09, z * 0.09, 3); c.set(0x1c3020).lerp(a.set(0x35482a), n);
      if (Math.abs(x) < 3 && z > -84 && z < 100) c.set(0x2a2826);
      if (y < 0.4) c.lerp(b.set(0x2a2630), smooth(0.4, -0.4, y));
    } }));

    // torii: one gate, instanced down the corridor
    const V = 0xd0321a, K = 0x16110f, tb = new Builder();
    for (const s of [-1, 1]) { tb.cyl(0.2, 0.25, 5.2, 14, { p: [s * 2.35, 2.6, 0], r: [0, 0, s * 0.035], c: V }).cyl(0.32, 0.34, 0.55, 14, { p: [s * 2.44, 0.27, 0], c: K })
      .box(1.1, 0.2, 0.56, { p: [s * 3.55, 5.56, 0], r: [0, 0, s * 0.16], c: K }).box(1.0, 0.3, 0.42, { p: [s * 3.3, 5.25, 0], r: [0, 0, s * 0.12], c: V }); }
    tb.box(5.6, 0.3, 0.24, { p: [0, 4.05, 0], c: V }).box(5.9, 0.32, 0.42, { p: [0, 5.18, 0], c: V }).box(6.3, 0.2, 0.56, { p: [0, 5.47, 0], c: K }).box(0.5, 0.82, 0.12, { p: [0, 4.62, 0], c: K });
    const NG = 34, gz = i => 78 - i * 4.6;
    scene.add(instanced(tb.geometry(), stdMat({ roughness: 0.42 }), NG, (i, d, c) => { d.position.set(0, 0.55, gz(i)); d.rotation.y = (r() - 0.5) * 0.03; const s = 0.97 + r() * 0.08; d.scale.set(s, s, 1); c.setScalar(0.82 + r() * 0.3); }, true));

    // stone lanterns
    const lb = new Builder(), ST = 0x77756f, fire = new Builder(), halo = [], lamps = [];
    lb.cyl(0.42, 0.5, 0.25, 6, { p: [0, 0.12, 0], c: ST }).cyl(0.16, 0.2, 1.1, 6, { p: [0, 0.8, 0], c: ST }).cyl(0.4, 0.2, 0.18, 6, { p: [0, 1.42, 0], c: ST })
      .lathe([[0.62, 0], [0.4, 0.14], [0.16, 0.36], [0.05, 0.5], [0, 0.62]], 6, { p: [0, 1.98, 0], c: 0x5e5c58 });
    for (const [x, y, z] of [[-0.27, 1.75, -0.27], [0.27, 1.75, -0.27], [-0.27, 1.75, 0.27], [0.27, 1.75, 0.27]]) lb.box(0.07, 0.48, 0.07, { p: [x, y, z], c: ST });
    const lg = lb.geometry(), lpos = [];
    for (let i = 1; i < NG; i += 3) for (const s of [-1, 1]) lpos.push([s * 3.5, 0.6, gz(i) + 2.3]);
    for (const an of [0.4, 1.3, 2.2, 3.5, 4.4, 5.4]) { const x = Math.cos(an) * 73, z = PZ + Math.sin(an) * 73; lpos.push([x, H(x, z), z]); }
    scene.add(instanced(lg, stdMat({ roughness: 0.95 }), lpos.length, (i, d) => { d.position.set(...lpos[i]); d.rotation.y = r() * 0.3; }, true));
    lpos.forEach(([x, y, z]) => { fire.box(0.42, 0.42, 0.42, { p: [x, y + 1.75, z] }); halo.push({ p: [x, y + 1.75, z], s: 3.2, c: 0xff8a3a }); });
    for (let i = 2; i < NG; i += 6) lamps.push([0, 3.2, gz(i) + 2.3]);
    lamps.push([14, 4, -84], [-16, 4, -86]);
    for (const p of lamps) { const l = new THREE.PointLight(0xff8c42, 60, 26, 1.8); l.position.set(...p); scene.add(l); }

    // arched bridge to the islet
    const bb = new Builder();
    for (let i = 0; i <= 56; i++) { const u = i / 56, z = -80 - u * 58, y = 0.95 + Math.sin(u * Math.PI) * 3.4, sl = Math.cos(u * Math.PI) * 3.4 * Math.PI / 58;
      bb.box(3.2, 0.14, 1.08, { p: [0, y, z], r: [sl, 0, 0], c: 0x6a2a1c });
      if (i % 4 === 0) for (const s of [-1, 1]) bb.box(0.16, 1.15, 0.16, { p: [s * 1.6, y + 0.58, z], c: V }).cyl(0.11, 0.11, 0.1, 6, { p: [s * 1.6, y + 1.2, z], c: K });
      for (const s of [-1, 1]) bb.box(0.1, 0.1, 1.1, { p: [s * 1.6, y + 0.98, z], r: [sl, 0, 0], c: V }).box(0.07, 0.07, 1.1, { p: [s * 1.6, y + 0.52, z], r: [sl, 0, 0], c: V }); }
    scene.add(bb.mesh(stdMat({ roughness: 0.5 })));

    // pagoda
    const pg = new Builder(), win = new Builder(); let y = 1.2;
    pg.box(11, 0.9, 11, { p: [0, y + 0.3, PZ], c: 0x5c5a58 }); y += 0.75;
    for (let i = 0; i < 5; i++) { const w = 6.4 - i * 0.82, hB = 3.0 - i * 0.12;
      pg.box(w, hB, w, { p: [0, y + hB / 2, PZ], c: 0x8a2416 }).box(w + 0.5, 0.22, w + 0.5, { p: [0, y + hB - 0.1, PZ], c: 0x2a1a14 });
      for (const s of [-1, 1]) for (const q of [-1, 1]) pg.box(0.3, hB, 0.3, { p: [s * w / 2, y + hB / 2, PZ + q * w / 2], c: 0x40140e });
      for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2, ox = Math.sin(an) * (w / 2 + 0.02), oz = Math.cos(an) * (w / 2 + 0.02);
        win.box(k % 2 ? 0.05 : w * 0.5, hB * 0.36, k % 2 ? w * 0.5 : 0.05, { p: [ox, y + hB * 0.5, PZ + oz] });
        const ex = Math.sin(an) * 0.05, ez = Math.cos(an) * 0.05, tx = Math.cos(an), tz = -Math.sin(an);
        for (let m = -3; m <= 3; m++) pg.box(k % 2 ? 0.06 : 0.07, hB * 0.4, k % 2 ? 0.07 : 0.06, { p: [ox + ex + tx * m * w * 0.083, y + hB * 0.5, PZ + oz + ez + tz * m * w * 0.083], c: 0x1c0d0a });
        for (const q of [-0.09, 0.09]) pg.box(k % 2 ? 0.06 : w * 0.52, 0.06, k % 2 ? w * 0.52 : 0.06, { p: [ox + ex, y + hB * (0.5 + q), PZ + oz + ez], c: 0x1c0d0a });
        // balcony rail and bracket blocks under the eave
        const bx = Math.sin(an) * (w / 2 + 0.75), bz = Math.cos(an) * (w / 2 + 0.75);
        pg.box(k % 2 ? 0.08 : w + 1.6, 0.08, k % 2 ? w + 1.6 : 0.08, { p: [bx, y + 0.75, PZ + bz], c: 0xa82a1a }).box(k % 2 ? 0.08 : w + 1.6, 0.06, k % 2 ? w + 1.6 : 0.06, { p: [bx, y + 0.4, PZ + bz], c: 0xa82a1a })
          .box(k % 2 ? 0.8 : w + 1.7, 0.1, k % 2 ? w + 1.7 : 0.8, { p: [Math.sin(an) * (w / 2 + 0.4), y + 0.05, PZ + Math.cos(an) * (w / 2 + 0.4)], c: 0x3a1c14 });
        for (let m = -3; m <= 3; m++) pg.box(0.22, 0.34, 0.22, { p: [Math.sin(an) * (w / 2 + 0.25) + tx * m * w * 0.15, y + hB - 0.38, PZ + Math.cos(an) * (w / 2 + 0.25) + tz * m * w * 0.15], c: 0xb8862e }); }
      y += hB; const R = (w + 4.6) * 0.72;
      pg.lathe([[R * 0.3, 0.1], [R * 0.86, -0.06], [R * 1.04, 0.34], [R * 1.0, 0.5], [R * 0.84, 0.22], [R * 0.62, 0.42], [R * 0.44, 0.86], [R * 0.32, 1.4], [0.5, 1.9]], 4, { p: [0, y, PZ], r: [0, Math.PI / 4, 0], c: 0x3a4652 });
      for (let k = 0; k < 4; k++) { const an = Math.PI / 4 + k * Math.PI / 2; pg.cyl(0.1, 0.16, R * 0.95, 6, { p: [Math.sin(an) * R * 0.56, y + 0.62, PZ + Math.cos(an) * R * 0.56], r: [Math.PI / 2 - 0.52, an, 0], c: 0x232a32 }); }
      for (let k = 0; k < 4; k++) { const an = Math.PI / 4 + k * Math.PI / 2; halo.push({ p: [Math.sin(an) * R * 0.98, y - 0.25, PZ + Math.cos(an) * R * 0.98], s: 1.5, c: 0xffa050 }); }
      y += 1.15; }
    pg.cyl(0.1, 0.16, 6, 8, { p: [0, y + 3.2, PZ], c: 0xc9a23a }); for (let k = 0; k < 7; k++) pg.tor(0.52 - k * 0.045, 0.06, { p: [0, y + 1.4 + k * 0.55, PZ], r: [Math.PI / 2, 0, 0], c: 0xc9a23a }, TAU, 16);
    scene.add(pg.mesh(stdMat({ roughness: 0.55 })));
    const hot = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 1.5, 0.45) });
    for (const g of win.g) fire.g.push(g); win.g = [];
    scene.add(new THREE.Mesh(fire.geometry(), hot));
    const pl = new THREE.PointLight(0xffa050, 110, 70, 1.6); pl.position.set(0, 9, PZ + 9); scene.add(pl);

    // sakura: old trees forking low into wide limbs, crowns of blossom sprays lit from below
    const trees = [];
    for (let i = 0; i < 9; i++) { const an = -0.5 + i * 0.52 + r() * 0.2, R = 74 + r() * 10; trees.push([Math.cos(an) * R, PZ + Math.sin(an) * R, 1 + r() * 0.5]); }
    for (let i = 0; i < 12; i++) trees.push([(i % 2 ? 1 : -1) * (9 + r() * 9), 66 - i * 12 + r() * 5, 0.8 + r() * 0.5]);
    trees.push([7.5, PZ + 6, 0.62], [-8, PZ - 3, 0.55], [26, -78, 1.1], [-27, -80, 1.2], [18, -70, 0.9]);
    const sm = treeMats({ map: blossomTex(), bark: barkTex('#3a2c2a', true), wind: 0.07, h0: 2, h1: 9, emissive: 0xff9ac0, emissiveIntensity: 0.12, through: 1.2 });
    const sak = [broadleaf({ seed: 4, height: 9, depth: 4, forks: 3, spread: 0.95, gnarl: 0.42, up: 0.35, trunk: 0.26, radius: 0.42, cardSize: 1.25, cardsPer: 5, hue: [0.93, 0.965], sat: 0.2, light: [0.86, 0.98], flat: 0.5, weep: 0.25 }),
      broadleaf({ seed: 17, height: 10, depth: 4, forks: 4, spread: 0.85, gnarl: 0.4, up: 0.4, trunk: 0.24, radius: 0.48, cardSize: 1.3, cardsPer: 5, hue: [0.92, 0.96], sat: 0.25, light: [0.84, 0.97], flat: 0.5, weep: 0.2 }),
      broadleaf({ seed: 29, height: 8, depth: 4, forks: 3, spread: 1.05, gnarl: 0.5, up: 0.3, trunk: 0.28, radius: 0.4, cardSize: 1.2, cardsPer: 5, hue: [0.935, 0.97], sat: 0.22, light: [0.85, 0.98], flat: 0.5, weep: 0.35 })];
    const sl = [[], [], []]; trees.forEach(([x, z, s], i) => sl[i % 3].push({ p: [x, H(x, z) - 0.15, z], s: s * 1.55, ry: r() * TAU, c: new THREE.Color().setHSL(0.94, 0.5, 0.82 + r() * 0.18) }));
    sl.forEach((l, i) => plant(scene, sak[i], sm, l, true, { cell: 60 }));
    // uplights under the pond-side trees
    trees.slice(0, 9).forEach(([x, z], i) => { if (i % 2) return; const l = new THREE.PointLight(0xffb8a0, 34, 22, 1.7); l.position.set(x * 0.94, H(x, z) + 1.2, PZ + (z - PZ) * 0.94); scene.add(l); });

    // pines on the hills: grown trees near the water, plain firs on the far slopes
    const pm = treeMats({ map: needleTex(128), bark: barkTex('#3a2a24'), wind: 0.06, h0: 1, h1: 11 }), pv = [conifer({ seed: 2, height: 11, radius: 3.1, whorls: 15, droop: 0.45 }), conifer({ seed: 9, height: 13, radius: 2.7, whorls: 17, droop: 0.3 })], pl2 = [[], []], pfar = [];
    for (let i = 0; i < 9000; i++) { const an = r() * TAU, R = 96 + r() * 340, x = Math.cos(an) * R, z = -60 + Math.sin(an) * R, y = H(x, z); if (y < 2.5 || (Math.abs(x) < 16 && z > -84)) continue;
      if (R < 190 && pl2[0].length + pl2[1].length < 520) pl2[i % 2].push({ p: [x, y - 0.3, z], s: 0.8 + r() * 0.9, ry: r() * TAU, c: new THREE.Color().setScalar(0.7 + r() * 0.3) }); else if (pfar.length < 2400) pfar.push([x, y, z]); }
    pl2.forEach((l, i) => plant(scene, pv[i], pm, l, true, { cell: 50, lodAt: 70 }));
    const pb = new Builder().cyl(0.14, 0.22, 2.4, 5, { p: [0, 1.2, 0], c: 0x241a18 });
    [[1.9, 2.4, 2.6], [1.5, 2.2, 3.9], [1.05, 2.0, 5.1], [0.6, 1.7, 6.2]].forEach(([rad, h, yy]) => pb.cone(rad, h, 8, { p: [0, yy, 0], c: 0x14261e }));
    scene.add(instanced(pb.geometry(), stdMat({ roughness: 1 }), pfar.length, (i, d, c) => { d.position.set(...pfar[i]); d.position.y -= 0.4; const s = 1.2 + r() * 1.6; d.scale.set(s, s * (1 + r() * 0.5), s); d.rotation.y = r() * 6; c.setScalar(0.7 + r() * 0.6); }));
    // azalea shrubs, moss grass, garden stones
    const lt = leafTex(118, 45, 26), shm = treeMats({ map: lt, bark: barkTex(), wind: 0.03, h0: 0, h1: 2 }).leaf;
    scene.add(instanced(bush({ seed: 3, radius: 1, cards: 30 }), shm, 420, (i, d, c) => { const side = r() < 0.5 ? -1 : 1, onPath = r() < 0.5, x = onPath ? side * (4.6 + r() * 9) : (r() - 0.5) * 190, z = onPath ? 84 - r() * 168 : PZ + (r() - 0.5) * 190, y = H(x, z); if (y < 0.45 || (!onPath && Math.hypot(x, z - PZ) < 66 && Math.hypot(x, z - PZ) > 19)) return false;
      d.position.set(x, y - 0.1, z); const s = 0.5 + r() * 0.9; d.scale.set(s * 1.2, s * 0.75, s * 1.2); d.rotation.y = r() * TAU; r() < 0.25 ? c.setHSL(0.93, 0.7, 0.75) : c.setHSL(0.3, 0.3, 0.5 + r() * 0.3); }, true));
    const gm = grassMat({ wind: 0.1, height: 0.45 });
    [grassClump({ seed: 4, blades: 10, height: 0.4, spread: 0.16 }), grassClump({ seed: 6, blades: 8, height: 0.6, lean: 0.6 })].forEach(g => scene.add(instanced(g, gm, 52000, (i, d, c) => { const nearPath = i % 4, x = nearPath ? (r() < 0.5 ? -1 : 1) * (2.9 + Math.pow(r(), 1.4) * 44) : (r() - 0.5) * 200, z = nearPath ? 96 - r() * 182 : PZ + (r() - 0.5) * 200, y = H(x, z); if (y < 0.4) return false;
      d.position.set(x, y - 0.03, z); d.rotation.y = r() * TAU; const s = 0.6 + r() * 0.9; d.scale.set(s * 1.5, s * 1.2, s * 1.5); c.setHSL(0.27 + r() * 0.06, 0.45, 0.4 + r() * 0.3); }, false, { cell: 22, far: 115, noMirror: true, lod: { geo: grassFar(0.5), at: 20 } })));
    const rkm = groundMat({ scale: 0.9, detail: 7, bump: 0.9, strata: 1.5, contrast: 0.5, vertexColors: false, color: 0x9a968e });
    [boulder(3), boulder(11)].forEach(g => scene.add(instanced(g, rkm, 110, (i, d, c) => { const an = r() * TAU, R = i % 3 ? 62 + r() * 12 : 12 + r() * 6, x = Math.cos(an) * R, z = PZ + Math.sin(an) * R; if (Math.abs(x) < 3 && z > PZ) return false; d.position.set(x, Math.max(H(x, z), -0.1) - 0.1, z);
      const s = 0.4 + r() * r() * 2; d.scale.set(s, s * 0.8, s); d.rotation.y = r() * TAU; c.setScalar(0.6 + r() * 0.4); }, true)));
    // stepping stones of the path: individual slabs, slightly out of true
    scene.add(instanced(new THREE.BoxGeometry(1, 0.14, 1), groundMat({ scale: 1.2, detail: 3.5, bump: 0.22, contrast: 0.5, roughness: 0.72 }), 900, (i, d, c) => { const row = Math.floor(i / 5), col = i % 5, z = 98 - row * 1.02; if (z < -82) return false;
      d.position.set((col - 2) * 1.02 + (row % 2 ? 0.25 : -0.25), 0.555 + r() * 0.02, z); d.scale.set(0.96 + r() * 0.03, 1, 0.94 + r() * 0.05); d.rotation.set((r() - 0.5) * 0.02, (r() - 0.5) * 0.03, (r() - 0.5) * 0.02); c.setHSL(0.72, 0.04, 0.26 + r() * 0.2); }, true));

    // falling petals
    scene.add(points({ count: 6500, size: 0.13, additive: false, shape: 'petal', gain: 0.85, seed: 9, spawn: (i, v, q) => v.set((q() - 0.5) * 150, q() * 26, 90 - q() * 320), colorFn: (i, c, q) => c.setHSL(0.94, 0.75, 0.78 + q() * 0.16),
      motion: 'p.y = mod(p.y - uTime*(0.5 + s.x*0.7), 26.0); float w = uTime*0.6 + s.y*40.0; p.x += sin(w)*1.3 + uTime*0.55; p.z += cos(w*0.8)*1.1; p.x = mod(p.x + 75.0, 150.0) - 75.0; a *= smoothstep(0.0, 1.5, p.y);' }));
    // fireflies over the water
    scene.add(points({ count: 320, size: 0.2, gain: 3, color: 0xd8ff7a, seed: 4, spawn: (i, v, q) => { const an = q() * TAU, R = 20 + q() * 62; v.set(Math.cos(an) * R, 0.5 + q() * 4, PZ + Math.sin(an) * R); },
      motion: 'p += vec3(sin(uTime*0.4 + s.x*40.0), sin(uTime*0.6 + s.y*40.0)*0.5, cos(uTime*0.5 + s.z*40.0))*1.8; a *= smoothstep(0.2, 0.9, sin(uTime*1.6 + s.w*60.0));' }));

    // pond, floating lanterns
    const pond = water({ size: 200, deep: 0x04060f, shallow: 0x0e1a2c, skyTop: 0x070a1c, skyHorizon: 0x4a2a52, sunDir: moonDir, sunColor: 0xfff2d8, mirror: mirror(0, { center: [0, 0, PZ], range: 250 }), scale: 0.5, chop: 0.16, distort: 0.012, glint: 3, speed: 0.6 });
    pond.position.set(0, 0, PZ); scene.add(pond);
    const fl = [];
    for (let i = 0; i < 70; i++) { const an = r() * TAU, R = 20 + r() * 44; fl.push([Math.cos(an) * R, 0.2, PZ + Math.sin(an) * R]); }
    const fm = instanced(new THREE.BoxGeometry(0.42, 0.46, 0.42), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.1, 0.35) }), fl.length, (i, d) => { d.position.set(...fl[i]); d.rotation.y = r() * 3; }); scene.add(fm);
    fl.forEach(p => halo.push({ p: [p[0], 0.4, p[2]], s: 2.2, c: 0xff9a4a }));
    scene.add(glows(halo, { gain: 0.5, flicker: 0.35 }));

    // far mountain
    const fuji = new Builder().lathe([[330, 0], [210, 46], [120, 105], [62, 160], [40, 186], [30, 196], [0, 196]], 40, { c: 0x1a1c36 }).lathe([[63, 160], [41, 187], [31, 197], [0, 198]], 40, { c: 0xb8c0e0 }).mesh(new THREE.MeshBasicMaterial({ vertexColors: true }), false);
    fuji.position.set(-240, -20, -1250); scene.add(fuji);

    Object.assign(look, { bloom: 0.85, bloomThreshold: 0.9, bloomKnee: 0.7, vignette: 0.7, aberration: 0.7, contrast: 1.08, saturation: 1.18, exposure: 1.3, godPos: moonDir, godDir: true, god: 0.18, godColor: new THREE.Color(0xbcd0ff), grain: 0.04, ao: 0.9 });
    look.lift.setRGB(0.02, 0.012, 0.04);
    return {
      parallax: 0.3, floor: (x, z) => Math.max(H(x, z), 0.2), clearance: 1.3,
      rail: [
        { p: 0, pos: [0, 2.5, 92], look: [0, 3.0, 0], fov: 38 },
        { p: 0.25, pos: [0, 2.3, 22], look: [0, 2.8, -60], fov: 50 },
        { p: 0.5, pos: [12, 4.2, -74], look: [-8, 5, -150], fov: 52 },
        { p: 0.75, pos: [-34, 3.2, -98], look: [0, 12, -150], fov: 46 },
        { p: 1, pos: [5, 2.4, -94], look: [0, 21, -150], fov: 40 } ],
      update(t, p) { look.exposure = lerp(1.15, 1.3, smooth(0.3, 0.7, p)); },
    };
  },
};
