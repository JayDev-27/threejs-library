// 01 Nature · Verdant: an alpine valley from blue dawn to full day.
import * as THREE from '../lib/three.module.min.js';
import { U, Builder, stdMat, groundMat, instanced, terrain, windify, sky, points, water, sunLight, rng, fbm2, noise2, lerp, smooth, TAU } from '../lib/kit.js';
import { conifer, broadleaf, bush, grassClump, grassFar, grassMat, boulder, treeMats, plant, needleTex, leafTex, barkTex } from '../lib/flora.js';

const LZ = -20;
function H(x, z) {
  const d = Math.hypot(x, (z - LZ) * 1.15) + (fbm2(x * 0.018 + 50, z * 0.018, 3) - 0.5) * 46, m = fbm2(x * 0.0045 + 3, z * 0.0045 + 7, 6);
  const mount = Math.pow(m, 1.7) * 300 * smooth(95, 340, d), roll = (fbm2(x * 0.02, z * 0.02, 4) - 0.5) * 9;
  return lerp(-8, 3.2, smooth(42, 88, d)) + roll * smooth(55, 130, d) + mount + (fbm2(x * 0.11, z * 0.11, 3) - 0.5) * 0.9 * smooth(60, 90, d);
}

export default {
  build({ scene, look, mirror, env }) {
    const r = rng(11), sunDir = new THREE.Vector3(0.3, 0.12, -1).normalize();
    scene.fog = new THREE.FogExp2(0x9fb4c8, 0.003);
    const dome = sky({ top: 0x24467e, horizon: 0xf2c9a0, bottom: 0x8fa3b4, sunDir, sunColor: 0xffd9a0, sunSize: 0.0009, sunIntensity: 40, sunGlow: 1.4, clouds: 0.5, cloudColor: 0xfff0e0, cloudDark: 0x6a7896, pow: 0.5 });
    scene.add(dome); env(dome, 0.55);
    const hemi = new THREE.HemisphereLight(0x9cc0ff, 0x4a5a38, 0.5); scene.add(hemi);
    const sun = sunLight(scene, { dir: sunDir, color: 0xffd2a0, intensity: 3.6, box: 170, far: 900, map: 4096, target: [0, 0, 50] });
    U.uCloudSh.value.set(0.55, 0.006, 0.012); U.uMist.value.set(0.012, 9, 0);

    // ---- ground: meadow, scree, rock faces, snow ----
    const a = new THREE.Color(), b = new THREE.Color();
    scene.add(terrain({ size: 1500, seg: 340, height: H, mat: groundMat({ scale: 0.35, detail: 5, bump: 0.55, contrast: 0.75 }), color: (x, z, y, slope, c) => {
      const n = fbm2(x * 0.05, z * 0.05, 3), n2 = noise2(x * 0.4, z * 0.4);
      a.set(0x2f5a22).lerp(b.set(0x6f8f34), n); c.copy(a).lerp(b.set(0x8a8a3c), smooth(0.6, 0.9, n2) * 0.35);
      if (y < 1.4) c.lerp(b.set(0x7a6a50), smooth(1.4, 0.3, y)); if (y < 0.2) c.lerp(b.set(0x3a3a34), smooth(0.2, -1.5, y));
      c.lerp(b.set(0x6a655e).multiplyScalar(0.75 + n * 0.5), smooth(0.24, 0.46, slope + (y > 60 ? 0.12 : 0)));
      c.lerp(b.set(0xf4f7ff), smooth(98, 132, y + n * 30) * (1 - smooth(0.5, 0.78, slope)));
    } }));

    // ---- trees: grown spruce near the lens, simple firs for the far slopes ----
    const nt = needleTex(), bt = barkTex('#4c3a2c'), cm = treeMats({ map: nt, bark: bt, wind: 0.1, h0: 1, h1: 11 }), near = [[], [], []], far = [];
    const firs = [conifer({ seed: 3, height: 11, radius: 2.9, whorls: 17 }), conifer({ seed: 8, height: 13, radius: 2.5, whorls: 19, droop: 0.5 }), conifer({ seed: 21, height: 8.5, radius: 2.6, whorls: 13, droop: 0.25 })];
    for (let i = 0; i < 90000 && far.length + near[0].length + near[1].length + near[2].length < 4600; i++) {
      const x = (r() - 0.5) * 860, z = (r() - 0.5) * 860 + 20, y = H(x, z);
      if (y < 1.7 || y > 88) continue; const sl = Math.abs(H(x + 2, z) - y) + Math.abs(H(x, z + 2) - y);
      if (sl > 2.6 || noise2(x * 0.012 + 40, z * 0.012) < 0.4) continue;
      if (Math.abs(x) < 30 && z > 58 && z < 160) continue;           // the meadow the camera starts in
      const dn = Math.hypot(x, z - 60);
      if (dn < 210) near[Math.floor(r() * 3)].push({ p: [x, y - 0.25, z], s: 0.75 + r() * 0.85, ry: r() * TAU, c: new THREE.Color().setHSL(0.3, 0.2, 0.72 + r() * 0.28) }); else far.push([x, y, z]);
    }
    near.forEach((list, i) => plant(scene, firs[i], cm, list, true, { cell: 50, lodAt: 70 }));
    const tb = new Builder().cyl(0.12, 0.2, 2, 6, { p: [0, 1, 0], c: 0x3a2a20 });
    [[1.9, 2.8, 2.4, 0x162e1c], [1.5, 2.5, 3.9, 0x1a3520], [1.1, 2.2, 5.3, 0x1e3c24], [0.7, 2.0, 6.6, 0x244a2a], [0.35, 1.6, 7.8, 0x2c5830]].forEach(([rad, h, y, c]) => tb.cone(rad, h, 9, { p: [0, y, 0], c }));
    const farFirs = instanced(tb.geometry(), windify(stdMat({ roughness: 0.95 }), { amp: 0.08, freq: 1.1, h0: 1.5, h1: 8 }), far.length, (i, d, c) => { d.position.set(...far[i]); d.position.y -= 0.3; const s = 1 + r() * 1.3; d.scale.set(s, s * (1 + r() * 0.5), s); d.rotation.y = r() * TAU; c.setScalar(0.75 + r() * 0.4); }, true, { cell: 120 }); farFirs.traverse(o => { if (o.isMesh) o.receiveShadow = false; }); scene.add(farFirs);
    // birches along the shore
    const lt = leafTex(88, 52, 36), bm = treeMats({ map: lt, bark: barkTex('#c8c4b8', true), wind: 0.16, h0: 2, h1: 9, through: 1 });
    const birch = [broadleaf({ seed: 5, height: 10, depth: 4, forks: 3, spread: 0.72, gnarl: 0.3, up: 0.6, trunk: 0.34, radius: 0.18, cardSize: 1.15, cardsPer: 3, hue: [0.2, 0.3], light: [0.26, 0.5], sat: 0.5, flat: 0.25 }), broadleaf({ seed: 12, height: 12, depth: 4, forks: 3, spread: 0.64, gnarl: 0.28, up: 0.7, trunk: 0.3, radius: 0.22, cardSize: 1.25, cardsPer: 3, hue: [0.18, 0.28], light: [0.28, 0.52], sat: 0.52, flat: 0.25 })];
    const bl = [[], []]; for (let i = 0; i < 400 && bl[0].length + bl[1].length < 46; i++) { const an = r() * TAU, R = 70 + r() * 34, x = Math.cos(an) * R, z = LZ + Math.sin(an) * R * 0.9, y = H(x, z); if (y < 0.8 || y > 6 || (Math.abs(x) < 20 && z > 40)) continue; bl[i % 2].push({ p: [x, y - 0.1, z], s: 0.8 + r() * 0.5, ry: r() * TAU }); }
    bl.forEach((l, i) => plant(scene, birch[i], bm, l));
    // shrubs
    const bg = bush({ seed: 2, radius: 1 }), sm = treeMats({ map: lt, bark: bt, wind: 0.05, h0: 0, h1: 2 }).leaf;
    scene.add(instanced(bg, sm, 700, (i, d, c) => { const x = (r() - 0.5) * 300, z = 30 + (r() - 0.5) * 320, y = H(x, z); if (y < 0.9 || y > 40 || noise2(x * 0.03 + 9, z * 0.03) < 0.45 || (Math.abs(x) < 9 && z > 80)) return false;
      d.position.set(x, y - 0.1, z); const s = 0.5 + r() * 1.1; d.scale.set(s, s * 0.8, s); d.rotation.y = r() * TAU; c.setHSL(0.26 + r() * 0.08, 0.3, 0.6 + r() * 0.3); }, true, { cell: 50 }));

    // ---- boulders ----
    const rm = groundMat({ scale: 0.8, detail: 6, bump: 0.9, strata: 2.2, contrast: 0.5, vertexColors: false, color: 0xc4beb4 });
    [boulder(1), boulder(7), boulder(13)].forEach((g, k) => scene.add(instanced(g, rm, 150, (i, d, c) => {
      const an = r() * TAU, rad = 48 + r() * 170, x = Math.cos(an) * rad, z = Math.sin(an) * rad * 0.9 + LZ; d.position.set(x, H(x, z) - 0.05, z);
      const s = 0.25 + r() * r() * 2.8; d.scale.set(s * (0.8 + r() * 0.5), s, s * (0.8 + r() * 0.5)); d.rotation.set(0, r() * TAU, (r() - 0.5) * 0.4); c.setHSL(0.08, 0.06, 0.7 + r() * 0.3); }, true)));

    // ---- grass: clumps of fine blades, three forms; thick near the path, thinning out across the valley floor ----
    const gm = grassMat({ wind: 0.17, height: 0.6 });
    [grassClump({ seed: 1, blades: 10, height: 0.62 }), grassClump({ seed: 2, blades: 8, height: 0.85, lean: 0.7, spread: 0.16 }), grassClump({ seed: 3, blades: 12, height: 0.42, spread: 0.2 })].forEach((g, k) =>
      scene.add(instanced(g, gm, k === 2 ? 60000 : 30000, (i, d, c) => { const wide = i % 3 === 0, x = (r() - 0.5) * (wide ? 300 : 90) + (r() - 0.5) * 30, z = wide ? -90 + r() * 300 : 56 + r() * 100, y = H(x, z); if (y < 0.3 || y > 30) return false;
        const pat = noise2(x * 0.12, z * 0.12); if (wide && pat < 0.35) return false; d.position.set(x, y - 0.03, z); d.rotation.y = r() * TAU; const s = (0.6 + r() * 0.7) * (0.6 + pat * 0.9) * (wide ? 1.5 : 1); d.scale.set(s * (wide ? 1.6 : 1), s, s * (wide ? 1.6 : 1));
        c.setHSL(0.21 + pat * 0.09 + r() * 0.03, 0.55, 0.42 + r() * 0.3); }, false, { cell: 22, far: 105, noMirror: true, lod: { geo: grassFar(0.62), at: 20 } })));
    // wildflowers: stem, six petals, a heart
    const fb = new Builder().cyl(0.006, 0.008, 0.5, 4, { p: [0, 0.25, 0], c: 0x3d7a2c }).sph(0.026, { p: [0, 0.51, 0], s: [1, 0.6, 1], c: 0xffc21a }, 6, 4);
    for (let k = 0; k < 6; k++) { const an = k * TAU / 6; fb.sph(0.034, { p: [Math.cos(an) * 0.045, 0.5, Math.sin(an) * 0.045], s: [1, 0.22, 0.62], r: [0, -an, 0.35], c: 0xffffff }, 6, 4); }
    scene.add(instanced(fb.geometry(), windify(stdMat({ roughness: 0.6 }), { amp: 0.1, freq: 1.9, scale: 0.42, h0: 0, h1: 0.5 }), 4200, (i, d, c) => { const x = (r() - 0.5) * 100, z = 54 + r() * 104, y = H(x, z); if (y < 0.5 || noise2(x * 0.09 + 20, z * 0.09) < 0.48) return false;
      d.position.set(x, y, z); d.rotation.set((r() - 0.5) * 0.4, r() * TAU, (r() - 0.5) * 0.4); const s = 0.8 + r() * 1.1; d.scale.set(s, s * (0.8 + r() * 0.6), s); c.set([0xffe45c, 0xffffff, 0xff8fbc, 0xb89cff, 0xff9a5c][Math.floor(noise2(x * 0.05, z * 0.05 + 7) * 4.99)]); }, false, { cell: 22, far: 80, noMirror: true }));

    // ---- lake with a true mirror, reeds at its edge ----
    const lake = water({ size: 340, deep: 0x06242a, shallow: 0x1d6b66, skyTop: 0x24467e, skyHorizon: 0xf2c9a0, sunDir, sunColor: 0xffd9a0, mirror: mirror(0), scale: 0.3, chop: 0.26, distort: 0.02, glint: 10 });
    lake.position.set(0, 0, LZ); scene.add(lake);
    scene.add(instanced(grassClump({ seed: 9, blades: 7, height: 1.5, width: 0.035, lean: 0.25, spread: 0.2 }), grassMat({ wind: 0.22, height: 1.5 }), 5000, (i, d, c) => { const an = r() * TAU, R = 52 + r() * 34, x = Math.cos(an) * R, z = LZ + Math.sin(an) * R * 0.88, y = H(x, z); if (y < -0.35 || y > 0.7) return false;
      d.position.set(x, Math.max(y, -0.05) - 0.05, z); d.rotation.y = r() * TAU; const s = 0.6 + r() * 0.8; d.scale.set(s, s, s); c.setHSL(0.17 + r() * 0.08, 0.5, 0.45 + r() * 0.25); }, false, { cell: 30, far: 190 }));

    // ---- air: mist banks, pollen, birds ----
    const mist = points({ count: 120, size: 44, additive: false, opacity: 0.035, color: 0xdfe9f2, fog: false, seed: 3,
      spawn: (i, v, q) => { const an = q() * TAU, rad = Math.sqrt(q()) * 190; v.set(Math.cos(an) * rad, 2 + q() * 7, Math.sin(an) * rad + LZ); },
      motion: 'p.x += sin(uTime*0.04 + s.x*6.28)*14.0 + uTime*0.25*(s.y - 0.3); p.x = mod(p.x + 220.0, 440.0) - 220.0; a *= 0.6 + 0.4*sin(uTime*0.2 + s.z*6.28);' });
    scene.add(mist);
    scene.add(points({ count: 1600, size: 0.05, gain: 2.4, color: 0xfff2c0, opacity: 0.8, spawn: (i, v, q) => v.set((q() - 0.5) * 90, 3 + q() * 20, 30 + q() * 130),
      motion: 'p += vec3(sin(uTime*0.3 + s.x*20.0), sin(uTime*0.23 + s.y*20.0)*0.6, cos(uTime*0.27 + s.z*20.0))*1.6; a *= 0.5 + 0.5*sin(uTime*1.5 + s.w*30.0);' }));
    const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0.25, -1, 0.35, -0.1, 0, 0, -0.2, 0, 0, 0.25, 0, 0, -0.2, 1, 0.35, -0.1]), 3));
    const birds = new THREE.InstancedMesh(bgeo, new THREE.MeshBasicMaterial({ color: 0x1a1d24, side: THREE.DoubleSide }), 36); birds.frustumCulled = false; scene.add(birds);
    const bd = Array.from({ length: 36 }, () => ({ R: 40 + r() * 90, h: 38 + r() * 50, sp: 0.06 + r() * 0.06, ph: r() * TAU, f: 6 + r() * 4, cx: (r() - 0.5) * 80, cz: -40 + (r() - 0.5) * 120 })), o = new THREE.Object3D();

    Object.assign(look, { bloom: 0.45, bloomThreshold: 1.1, vignette: 0.5, contrast: 1.1, saturation: 1.18, godPos: sunDir, godDir: true, godColor: new THREE.Color(0xffc890), grain: 0.03, ao: 0.95, aoRadius: 1.1 });
    const su = dome.userData.u, wu = lake.userData.u, c0 = new THREE.Color(), c1 = new THREE.Color();
    const mix = (h0, h1, k) => c0.set(h0).lerp(c1.set(h1), k);
    return {
      parallax: 0.4, floor: (x, z) => Math.max(H(x, z), 0), clearance: 0.5,
      rail: [
        { p: 0, pos: [8, H(8, 132) + 1.7, 132], look: [0, 14, -40], fov: 44 },
        { p: 0.15, pos: [-6, H(-6, 112) + 0.55, 112], look: [-10, H(-10, 96) + 0.6, 96], fov: 46 },
        { p: 0.3, pos: [-15, H(-15, 92) + 1.1, 92], look: [0, 7, 10], fov: 52 },
        { p: 0.48, pos: [20, Math.max(H(20, 46), 0) + 1.5, 46], look: [-6, 9, -90], fov: 50 },
        { p: 0.62, pos: [-26, 6, 30], look: [-70, 12, -30], fov: 50 },
        { p: 0.8, pos: [-38, 52, 70], look: [0, 30, -140], fov: 48 },
        { p: 1, pos: [10, 140, 200], look: [0, 40, -120], fov: 44 } ],
      update(t, p) {
        const day = smooth(0, 0.95, p), el = lerp(0.07, 0.44, day);
        sunDir.set(0.3 - day * 0.12, el, -1).normalize(); su.uSunDir.value.copy(sunDir); wu.uSunDir.value.copy(sunDir); U.uSunDirF.value.copy(sunDir);
        sun.position.set(0, 0, 50).addScaledVector(sunDir, 450); sun.color.copy(mix(0xff9a5a, 0xfff3e0, day)); sun.intensity = lerp(2.4, 4.2, day);
        su.uHor.value.copy(mix(0xf0a878, 0xcfe2f2, day)); su.uTop.value.copy(mix(0x1c3364, 0x2f6fc0, day)); su.uSunCol.value.copy(mix(0xffa860, 0xfff0d8, day));
        su.uCloudCol.value.copy(mix(0xffc8a0, 0xffffff, day)); su.uCloudDark.value.copy(mix(0x4a5478, 0xa8b4cc, day));
        wu.uSkyB.value.copy(su.uHor.value); wu.uSkyA.value.copy(su.uTop.value); wu.uSunCol.value.copy(su.uSunCol.value);
        scene.fog.color.copy(mix(0xa89aa0, 0xb4cbe2, day)); scene.fog.density = lerp(0.0021, 0.0008, day);
        U.uSunFog.value.copy(mix(0xff8a40, 0xffe0b0, day)).multiplyScalar(lerp(0.4, 0.2, day)); U.uMist.value.x = lerp(0.0035, 0.0006, day);
        hemi.intensity = lerp(0.3, 0.55, day); hemi.color.copy(mix(0x7f9ad8, 0xbfd8ff, day)); scene.environmentIntensity = lerp(0.4, 0.7, day);
        mist.userData.u.uOpacity.value = lerp(0.025, 0.006, day);
        look.god = lerp(0.8, 0.25, day); look.exposure = lerp(0.95, 1.02, day); look.godColor.copy(mix(0xff9a50, 0xffe2b8, day));
        look.lift.setRGB(0.01, 0.015, lerp(0.04, 0.01, day)); look.gain.setRGB(1.04, 1, lerp(0.94, 1, day));
        for (let i = 0; i < bd.length; i++) { const d = bd[i], an = t * d.sp + d.ph;
          o.position.set(d.cx + Math.cos(an) * d.R, d.h + Math.sin(an * 2.3) * 4, d.cz + Math.sin(an) * d.R * 0.7); o.rotation.set(0, -an, 0);
          o.scale.set(1.1, 1.1 * Math.sin(t * d.f + d.ph) * 1.6, 1.1); o.updateMatrix(); birds.setMatrixAt(i, o.matrix); }
        birds.instanceMatrix.needsUpdate = true;
      },
    };
  },
};
