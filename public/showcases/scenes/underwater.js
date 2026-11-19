// 07 Underwater · Abyss: from the sunlit reef, through a kelp forest and the twilight wall, down to living light.
import * as THREE from '../lib/three.module.min.js';
import { U, NOISE, CAUSTIC, hook, canvasTex, Builder, stdMat, groundMat, instanced, terrain, sky, points, sunLight, rng, fbm2, noise2, lerp, smooth, win, TAU } from '../lib/kit.js';
import { broadleaf, grassClump, grassFar, grassMat, boulder, treeMats, plant, needleTex, barkTex, kelp, kelpTex } from '../lib/flora.js';

function H(x, z) {
  let h = lerp(-17, -64, smooth(-58, -118, z)); h = lerp(h, -236, smooth(-232, -292, z + (fbm2(x * 0.02, 3, 3) - 0.5) * 40));
  const n = fbm2(x * 0.03 + 9, z * 0.03, 5); return h + (n - 0.5) * 9 + Math.pow(fbm2(x * 0.09, z * 0.09 + 4, 3), 2) * 5 * smooth(-110, -40, z) - smooth(26, 90, Math.abs(x)) * -14;
}
const V3 = THREE.Vector3;

export default {
  build({ scene, look, camera }) {
    const r = rng(19), o = new THREE.Object3D(), sunDir = new V3(0.25, 1, -0.3).normalize();
    scene.fog = new THREE.FogExp2(0x1a8fa8, 0.014);
    const dome = sky({ top: 0x7fe0ea, horizon: 0x1a8fa8, bottom: 0x06304a, pow: 1.6, sunDir, sunColor: 0xeaffff, sunSize: 0.02, sunIntensity: 1.2, sunGlow: 0.35 }); scene.add(dome);
    const hemi = new THREE.HemisphereLight(0x9ae8ff, 0x0a3048, 1.0); scene.add(hemi);
    const sun = sunLight(scene, { dir: sunDir, color: 0xd8fbff, intensity: 2.6, box: 110, far: 500, map: 4096, target: [0, -30, -80] });

    // ---- sea bed: reef shelf, kelp plain, the wall, the abyssal floor ----
    const a = new THREE.Color(), b = new THREE.Color();
    scene.add(terrain({ size: 760, seg: 300, height: H, mat: groundMat({ scale: 0.3, detail: 3.2, bump: 0.8, strata: 0.25, contrast: 0.7, caustics: 2.6 }), color: (x, z, y, sl, c) => {
      const n = fbm2(x * 0.07, z * 0.07, 3); c.set(0xc8b88a).lerp(a.set(0x8a7a5a), n); c.lerp(b.set(0x5a5a52), smooth(0.2, 0.5, sl)); c.lerp(b.set(0x3a4648), smooth(-70, -120, y)); c.lerp(b.set(0x20262c), smooth(-150, -230, y)); } }));
    const rk = groundMat({ scale: 0.6, detail: 4, bump: 1, strata: 0.7, contrast: 0.7, caustics: 2.2, vertexColors: false, color: 0x9a927c });
    [boulder(4), boulder(15), boulder(22)].forEach(g => scene.add(instanced(g, rk, 260, (i, d, c) => { const x = (r() - 0.5) * 240, z = 50 - r() * 420; d.position.set(x, H(x, z) - 0.2, z); const s = 0.5 + r() * r() * (z < -230 ? 9 : 4.5); d.scale.set(s * (0.8 + r() * 0.6), s * (0.6 + r() * 0.5), s * (0.8 + r() * 0.6)); d.rotation.y = r() * TAU; c.setHSL(0.1 + r() * 0.06, 0.18, 0.5 + r() * 0.4); }, true)));

    // ---- reef life ----
    const coralM = col => { const m = groundMat({ scale: 2.2, detail: 9, bump: 0.6, contrast: 0.45, caustics: 1.6, vertexColors: false, color: col, roughness: 0.75 }); return m; };
    const cv = [broadleaf({ seed: 3, height: 2.6, depth: 4, forks: 4, spread: 0.6, gnarl: 0.5, up: 0.9, trunk: 0.14, radius: 0.16, taper: 0.8 }), broadleaf({ seed: 9, height: 3.2, depth: 4, forks: 5, spread: 0.75, gnarl: 0.35, up: 0.6, trunk: 0.1, radius: 0.2, taper: 0.85 }), broadleaf({ seed: 14, height: 2, depth: 3, forks: 5, spread: 0.9, gnarl: 0.6, up: 0.4, trunk: 0.12, radius: 0.24, taper: 0.9 })];
    const reefAt = (fn) => { for (let k = 0; k < 40; k++) { const x = (r() - 0.5) * 120, z = 34 - r() * 130, y = H(x, z); if (y > -30 && noise2(x * 0.06 + 3, z * 0.06) > 0.4) return fn(x, y, z); } return false; };
    [0xff6a7a, 0xff9a3a, 0xc86aff, 0xfff0d8, 0x3ad8c8, 0xff4aa0].forEach((col, k) => scene.add(instanced(cv[k % 3].trunk, coralM(col), 130, (i, d, c) => reefAt((x, y, z) => { d.position.set(x, y - 0.1, z); d.rotation.y = r() * TAU; const s = 0.5 + r() * 1.1; d.scale.set(s, s * (0.7 + r() * 0.6), s); c.setScalar(0.75 + r() * 0.4); }), true, { cell: 26, far: 120 })));
    // brain corals, table corals, tube sponges
    const brain = new THREE.SphereGeometry(1, 40, 24); scene.add(instanced(brain, groundMat({ scale: 5, detail: 14, bump: 2.2, contrast: 0.9, caustics: 1.6, vertexColors: false, color: 0xb8c86a, roughness: 0.8 }), 110, (i, d, c) => reefAt((x, y, z) => { d.position.set(x, y + 0.1, z); const s = 0.4 + r() * 1.2; d.scale.set(s, s * 0.62, s); c.set([0xc8d86a, 0xe8b85a, 0x9ad0b0][i % 3]); }), true));
    const tb = new Builder().cyl(0.14, 0.2, 0.9, 8, { p: [0, 0.45, 0], c: 0xb89a7a }).lathe([[0.1, 0], [0.9, 0.12], [1.5, 0.2], [1.62, 0.26], [1.5, 0.3], [0.8, 0.24], [0.1, 0.16]], 22, { p: [0, 0.85, 0], c: 0xd8b88a });
    scene.add(instanced(tb.geometry(), groundMat({ scale: 3, detail: 12, bump: 0.9, contrast: 0.5, caustics: 1.8, roughness: 0.8 }), 90, (i, d, c) => reefAt((x, y, z) => { d.position.set(x, y - 0.1, z); const s = 0.6 + r() * 1.3; d.scale.set(s, s * (0.6 + r() * 0.8), s); d.rotation.set((r() - 0.5) * 0.3, r() * TAU, (r() - 0.5) * 0.3); c.set([0xffd8a0, 0xa8e0d0, 0xe8a8ff, 0xfff0c8][i % 4]); }), true));
    const sp = new Builder(); for (let k = 0; k < 6; k++) { const an = k * 1.1, R = 0.2 + r() * 0.3, h = 0.8 + r() * 1.3, rad = 0.13 + r() * 0.1; sp.lathe([[rad * 0.7, 0], [rad, h * 0.5], [rad * 1.15, h], [rad * 0.85, h], [rad * 0.6, h * 0.5], [rad * 0.4, 0.1]], 10, { p: [Math.cos(an) * R, 0, Math.sin(an) * R], r: [(r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4], c: 0xffffff }); }
    scene.add(instanced(sp.geometry(), new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: 0x402060, emissiveIntensity: 0.3, side: THREE.DoubleSide }), 150, (i, d, c) => reefAt((x, y, z) => { d.position.set(x, y - 0.05, z); const s = 0.6 + r() * 1.2; d.scale.set(s, s, s); d.rotation.y = r() * TAU; c.set([0xb86aff, 0xffd23a, 0xff7a4a, 0x4ac8ff][i % 4]); }), true));
    // sea fans and seagrass
    const fanT = canvasTex(512, 512, (g) => { const q = rng(3); g.strokeStyle = '#fff'; g.lineCap = 'round'; const br = (x, y, a, l, w, d) => { const x1 = x + Math.cos(a) * l, y1 = y + Math.sin(a) * l; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x1, y1); g.stroke(); if (d > 0) for (let k = -1; k <= 1; k++) if (k || q() < 0.5) br(x1, y1, a + k * (0.3 + q() * 0.22) + (q() - 0.5) * 0.2, l * (0.68 + q() * 0.18), Math.max(1.2, w * 0.7), d - 1); }; br(8, 256, 0, 120, 9, 6); });
    const fan = treeMats({ map: fanT, bark: barkTex('#6a3a2a'), wind: 0.22, h0: 0, h1: 2.4, through: 1.4 }).leaf, fg = new THREE.PlaneGeometry(2.4, 2.4).rotateZ(Math.PI / 2).translate(0, 1.2, 0); { const n = fg.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 0.7, 0.7); const col = new Float32Array(12).fill(1); fg.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
    scene.add(instanced(fg, fan, 260, (i, d, c) => reefAt((x, y, z) => { d.position.set(x, y - 0.1, z); d.rotation.y = r() * TAU; const s = 0.5 + r() * 1.1; d.scale.set(s, s, s); c.set([0xff5a3a, 0xff8ad0, 0xffc83a, 0xc85aff][i % 4]).multiplyScalar(1.5); })));
    const sg = grassMat({ wind: 0.28, height: 0.9, through: 1.2 });
    scene.add(instanced(grassClump({ seed: 5, blades: 9, height: 0.9, width: 0.05, lean: 0.35, spread: 0.2 }), sg, 26000, (i, d, c) => { const x = (r() - 0.5) * 150, z = 40 - r() * 150, y = H(x, z); if (y < -40 || noise2(x * 0.05, z * 0.05 + 8) < 0.47) return false; d.position.set(x, y - 0.03, z); d.rotation.y = r() * TAU; const s = 0.6 + r() * 0.9; d.scale.set(s, s, s); c.setHSL(0.3 + r() * 0.08, 0.6, 0.5 + r() * 0.3); }, false, { cell: 20, far: 95, lod: { geo: grassFar(0.9), at: 20 } }));

    // ---- kelp forest ----
    const km = treeMats({ map: kelpTex(), bark: barkTex('#6a5a1c'), wind: 1.5, h0: 0, h1: 34, through: 1.5, roughness: 0.5 }); km.leaf.alphaTest = 0.3;
    [kelp({ seed: 1, height: 34 }), kelp({ seed: 2, height: 28, blades: 22 }), kelp({ seed: 3, height: 40, blades: 30 })].forEach((k, n) => { const list = []; for (let i = 0; i < 2000 && list.length < 150; i++) { const x = (r() - 0.5) * 170, z = -104 - r() * 126, y = H(x, z); if (y > -52 || Math.hypot(x - 2, 0) < 5 + noise2(z * 0.05, 1) * 6 || noise2(x * 0.04 + 5, z * 0.04) < 0.38) continue; list.push({ p: [x, y - 0.3, z], s: 0.8 + r() * 0.5, ry: r() * TAU, c: new THREE.Color().setHSL(0.15, 0.3, 0.7 + r() * 0.3) }); } plant(scene, k, km, list); });

    // ---- the surface seen from below, and shafts of light ----
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600).rotateX(Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: /* glsl */`varying vec3 vW; uniform float uTime, uFogDen; uniform vec3 uFogCol; ${NOISE} ${CAUSTIC}
        void main(){ vec3 V = normalize(vW - cameraPosition); float d = length(vW - cameraPosition); vec2 p = vW.xz*0.12; float n = fbm(p + uTime*0.12) + 0.5*fbm(p*2.6 - uTime*0.17);
          float win = smoothstep(0.62, 0.78, V.y + (n - 0.75)*0.16), ca = caustic(vW.xz*0.16, uTime*0.8);
          vec3 c = mix(vec3(0.02, 0.2, 0.28), vec3(0.3, 0.72, 0.82) + ca*0.55, win) + vec3(0.2, 0.6, 0.7)*ca*0.3*(1.0 - win); c *= exp(cameraPosition.y*0.014); gl_FragColor = vec4(mix(uFogCol, c, exp(-uFogDen*uFogDen*d*d*0.5)), 1.0); }` })); scene.add(surf);
    const shaft = new THREE.PlaneGeometry(1, 1).translate(0, -0.5, 0), shM = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vUv; varying float vS; void main(){ vUv = uv; vec4 w = modelMatrix*instanceMatrix*vec4(position,1.0); vS = instanceMatrix[3].x*0.37 + instanceMatrix[3].z*0.11; w.x += position.y*-0.25*abs(instanceMatrix[1].y); gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: `varying vec2 vUv; varying float vS; uniform float uTime; ${NOISE} void main(){ float x = abs(vUv.x - 0.5)*2.0; float f = pow(clamp(1.0 - x, 0.0, 1.0), 2.5)*pow(clamp(vUv.y, 0.0, 1.0), 1.6)*(0.45 + 0.55*vnoise(vec2(uTime*0.5 + vS*9.0, vS))); gl_FragColor = vec4(vec3(0.5, 0.95, 1.0)*f*0.085, 1.0); }` });
    scene.add(instanced(shaft, shM, 130, (i, d) => { d.position.set((r() - 0.5) * 220, 0, 60 - r() * 300); d.rotation.y = r() * TAU; d.scale.set(3 + r() * 9, 50 + r() * 60, 1); }));

    // ---- fish: schools that turn together ----
    const fishG = (() => { const fb = new Builder(); fb.sph(1, { s: [0.16, 0.34, 1], c: 0xffffff }, 14, 10).cone(0.28, 0.5, 4, { p: [0, 0, -1.12], r: [Math.PI / 2, 0, 0], s: [0.12, 1, 1.5], c: 0xd8d8d8 }).cone(0.14, 0.4, 3, { p: [0, 0.34, -0.1], r: [-0.6, 0, 0], s: [0.2, 1, 1], c: 0xc8c8c8 }); return fb.geometry(); })();
    const fishM = (o2) => { const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.5, ...o2 }); m.onBeforeCompile = sh => { hook(sh); sh.uniforms.uTime = U.uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float fP = instanceMatrix[3].x*3.1 + instanceMatrix[3].y*5.3; transformed.x += sin(uTime*11.0 + fP - position.z*3.2)*0.16*smoothstep(0.3, -1.2, position.z);'); }; m.customProgramCacheKey = () => 'fish'; return m; };
    const schools = [{ n: 520, m: fishM({ color: 0xc8e0f0 }), c: [8, -11, -58], R: [20, 4, 14], sp: 0.22, s: 0.34, sc: 3.4 }, { n: 180, m: fishM({ color: 0xffd23a, metalness: 0.1, emissive: 0x6a4a00, emissiveIntensity: 0.3 }), c: [-12, -13, -14], R: [12, 2.5, 10], sp: -0.17, s: 0.42, sc: 2.4 },
      { n: 260, m: fishM({ color: 0x7ab8e8 }), c: [0, -44, -160], R: [26, 8, 30], sp: 0.14, s: 0.5, sc: 4.5 }, { n: 300, m: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.6, 2.2) }), c: [0, -206, -372], R: [30, 10, 22], sp: 0.1, s: 0.2, sc: 5 }];
    schools.forEach(S => { S.mesh = new THREE.InstancedMesh(fishG, S.m, S.n); S.mesh.frustumCulled = false; S.mesh.castShadow = S.c[1] > -40; scene.add(S.mesh); S.f = Array.from({ length: S.n }, () => ({ ph: r() * 0.9, o: new V3((r() - 0.5), (r() - 0.5), (r() - 0.5)).multiplyScalar(S.sc), w: r() * 6, s: 0.7 + r() * 0.6 })); });
    const pathAt = (S, u, out) => out.set(S.c[0] + Math.cos(u) * S.R[0] + Math.sin(u * 2.3) * S.R[0] * 0.3, S.c[1] + Math.sin(u * 1.7) * S.R[1], S.c[2] + Math.sin(u) * S.R[2] + Math.cos(u * 1.9) * S.R[2] * 0.3), pa = new V3(), pb = new V3();

    // ---- the whale and a manta ----
    const wb = new Builder(); wb.lathe([[0.01, -11], [0.9, -9.5], [1.9, -6.5], [2.5, -2.5], [2.6, 1.5], [2.1, 5.5], [1.2, 8.8], [0.5, 10.6], [0.25, 11.6]], 28, { r: [Math.PI / 2, 0, 0], s: [1, 1, 0.82], c: 0x1c3446 });
    for (const s of [-1, 1]) wb.sph(1, { p: [s * 2.1, -1.4, -2.5], s: [2.6, 0.14, 0.9], r: [0, s * -0.5, s * 0.5], c: 0x162a3a }).sph(1, { p: [s * 1.5, 0.1, -12.3], s: [1.9, 0.12, 0.95], r: [0, s * 0.5, 0], c: 0x162a3a });
    wb.sph(1, { p: [0, -1.0, 3.5], s: [2.1, 1.3, 5.5], c: 0x8a9aa8 });
    const whale = wb.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }), false); whale.scale.setScalar(2.1); scene.add(whale);
    const mg = new THREE.PlaneGeometry(9, 5, 24, 8).rotateX(-Math.PI / 2); { const p = mg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), k = 1 - Math.abs(x) / 4.5; p.setZ(i, z * Math.pow(Math.max(k, 0), 0.7) + Math.abs(x) * 0.25); p.setY(i, 0.35 * k * Math.cos(z * 0.5)); } mg.computeVertexNormals(); }
    const mantaM = new THREE.MeshStandardMaterial({ color: 0x1a2a38, roughness: 0.5, side: THREE.DoubleSide }); mantaM.onBeforeCompile = sh => { hook(sh); sh.uniforms.uTime = U.uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.y += sin(uTime*1.6 - abs(position.x)*0.5)*abs(position.x)*abs(position.x)*0.07;'); };
    const manta = new THREE.Mesh(mg, mantaM); scene.add(manta);

    // ---- jellyfish: pulsing bells, trailing arms, their own light ----
    const jb = []; { const bell = new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI * 0.55).scale(1, 0.8, 1).toNonIndexed(); jb.push(bell);
      for (let k = 0; k < 14; k++) { const an = k / 14 * TAU, wide = k % 3 === 0, g = new THREE.PlaneGeometry(wide ? 0.28 : 0.045, wide ? 3.6 : 6, 1, 26).translate(0, wide ? -1.8 : -3, 0).rotateY(an).translate(Math.cos(an) * (wide ? 0.3 : 0.88), -0.1, Math.sin(an) * (wide ? 0.3 : 0.88)).toNonIndexed(); jb.push(g); } }
    const jg = (() => { let n = 0; jb.forEach(g => n += g.attributes.position.count); const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), nn = new Float32Array(n * 3); let k = 0; jb.forEach(q => { p.set(q.attributes.position.array, k); nn.set(q.attributes.normal.array, k); k += q.attributes.position.array.length; }); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); return g; })();
    const jm = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec3 vN, vV, vC, vL; uniform float uTime; void main(){ vec3 p = position; float ph = instanceMatrix[3].x*1.3 + instanceMatrix[3].z*0.7, beat = sin(uTime*1.7 + ph);
        if (p.y >= -0.11){ float k = 1.0 - p.y/0.8; p.xz *= 1.0 + beat*0.2*k; p.y *= 1.0 - beat*0.12; } else { float d = -p.y; p.x += sin(uTime*1.3 + ph + d*1.6)*0.07*d + beat*0.05*d; p.z += cos(uTime*1.1 + ph*1.3 + d*1.4)*0.07*d; p.xz *= 1.0 + beat*0.12*exp(-d); }
        vL = p; vC = instanceColor; vec4 mv = modelViewMatrix*instanceMatrix*vec4(p,1.0); vN = normalize(normalMatrix*mat3(instanceMatrix)*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vN, vV, vC, vL; uniform float uTime; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), vV)), 1.6); float a = atan(vL.z, vL.x); float rib = 0.6 + 0.4*sin(a*16.0); float bell = step(-0.11, vL.y);
        vec3 c = vC*(bell*(f*1.5 + 0.1*rib + 0.35*smoothstep(0.5, 0.8, vL.y)) + (1.0 - bell)*(0.4*exp(vL.y*0.3) + 0.15)); c += vec3(1.0)*bell*pow(f, 4.0)*0.5; gl_FragColor = vec4(c, 1.0); }` });
    const jelly = instanced(jg, jm, 70, (i, d, c) => { d.position.set((r() - 0.5) * 110, -150 - r() * 78, -300 - r() * 120); if (i < 5) d.position.set((i - 2) * 9 + r() * 4, -214 - r() * 10, -376 - r() * 14); d.rotation.set((r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5); const s = i < 5 ? 2.2 + r() * 1.4 : 0.7 + r() * r() * 3; d.scale.set(s, s, s); c.set([0x3af0ff, 0xb46aff, 0xff5ad0, 0x5a9aff, 0x7affc8][i % 5]).multiplyScalar(1.3); }); scene.add(jelly);
    const jl = new THREE.PointLight(0x5ac8ff, 600, 90, 1.5); jl.position.set(0, -212, -374); scene.add(jl);

    // ---- particles: bubbles, marine snow, plankton ----
    const camU = { value: new V3() };
    scene.add(points({ count: 5000, size: 0.045, additive: false, gain: 1.4, opacity: 0.55, color: 0xdff6ff, uniforms: { uCam: camU }, spawn: (i, v, q) => v.set(q() * 60, q() * 60, q() * 60),
      motion: 'p.y = mod(p.y - uTime*(0.25 + s.x*0.4) - uCam.y, 60.0) - 30.0 + uCam.y; p.x = mod(p.x - uCam.x + sin(uTime*0.3 + s.y*20.0), 60.0) - 30.0 + uCam.x; p.z = mod(p.z - uCam.z, 60.0) - 30.0 + uCam.z; sz = 0.5 + s.z*2.0; if (p.y > -0.5) a = 0.0;' }));
    scene.add(points({ count: 320, size: 0.12, shape: 'disc', gain: 1.2, opacity: 0.4, color: 0xcff8ff, spawn: (i, v, q) => { const k = Math.floor(q() * 16); v.set(Math.sin(k * 7.1) * 50 + (q() - 0.5) * 3, -70 * q(), 20 - (k * 13.7 % 130) + (q() - 0.5) * 3); },
      motion: 'p.y = -mod(-p.y - uTime*(2.5 + s.x*3.0), 66.0); p.x += sin(uTime*2.0 + s.y*30.0 + p.y)*0.5 + (s.w - 0.5)*3.0; p.z += cos(uTime*1.7 + s.x*30.0 + p.y)*0.5; sz = 0.3 + s.z*1.6; a *= smoothstep(0.0, -3.0, p.y);' }));
    scene.add(points({ count: 5000, size: 0.2, gain: 2.6, spawn: (i, v, q) => v.set((q() - 0.5) * 170, -130 - q() * 105, -270 - q() * 160), colorFn: (i, c, q) => c.set([0x3af0ff, 0x7affc8, 0x9a8aff, 0xffffff][Math.floor(q() * 4)]),
      motion: 'p += vec3(sin(uTime*0.25 + s.x*30.0), cos(uTime*0.2 + s.y*30.0), sin(uTime*0.22 + s.z*30.0))*1.6; a *= pow(0.5 + 0.5*sin(uTime*(0.6 + s.w) + s.x*40.0), 3.0); sz = 0.4 + s.w;' }));

    Object.assign(look, { bloom: 0.75, bloomThreshold: 0.95, bloomKnee: 0.7, vignette: 0.7, aberration: 1.2, contrast: 1.08, saturation: 1.15, grain: 0.03, ao: 0.85, godPos: sunDir, godDir: true, godColor: new THREE.Color(0xa8f4ff) });
    const su = dome.userData.u, c0 = new THREE.Color(), c1 = new THREE.Color(), c2 = new THREE.Color(), q = new THREE.Quaternion(), zf = new V3(0, 0, 1);
    return {
      parallax: 0.45, floor: H, clearance: 1.6, liveShadows: true,
      rail: [
        { p: 0, pos: [0, -3.2, 34], look: [0, -9, -26], fov: 58 },
        { p: 0.13, pos: [6, -11.5, -4], look: [-3, -15.5, -40], fov: 54 },
        { p: 0.27, pos: [-9, -12, -42], look: [8, -12, -62], fov: 54 },
        { p: 0.42, pos: [3, -44, -116], look: [1, -46, -190], fov: 56 },
        { p: 0.55, pos: [-2, -57, -196], look: [3, -24, -150], fov: 60 },
        { p: 0.7, pos: [0, -96, -262], look: [0, -66, -330], fov: 56 },
        { p: 0.85, pos: [6, -172, -318], look: [0, -200, -372], fov: 54 },
        { p: 1, pos: [0, -217, -350], look: [0, -215, -378], fov: 50 } ],
      update(t, p) {
        camU.value.copy(camera.position); const dep = -camera.position.y, k1 = smooth(20, 100, dep), k2 = smooth(100, 215, dep);
        c0.set(0x1a8fa8).lerp(c1.set(0x063a5c), k1).lerp(c2.set(0x01060e), k2); scene.fog.color.copy(c0); scene.fog.density = lerp(0.014, 0.009, k1) + k2 * 0.004;
        su.uHor.value.copy(c0); su.uBot.value.copy(c0).multiplyScalar(0.5); su.uTop.value.set(0x58c4d4).lerp(c0, smooth(10, 120, dep)); su.uSunInt.value = 1.2 * (1 - k1); su.uSunGlow.value = 0.35 * (1 - k1);
        sun.intensity = 2.6 * (1 - smooth(40, 170, dep)); hemi.intensity = lerp(1.0, 0.16, smooth(30, 200, dep)); look.god = 0.4 * (1 - smooth(15, 110, dep)); look.exposure = lerp(1, 1.25, k2);
        schools.forEach(S => { for (let i = 0; i < S.n; i++) { const f = S.f[i], u = t * S.sp + f.ph; pathAt(S, u, pa); pathAt(S, u + 0.02 * Math.sign(S.sp), pb); pb.sub(pa).normalize(); o.position.copy(pa).add(f.o); o.position.y += Math.sin(t * 0.9 + f.w) * 0.4; q.setFromUnitVectors(zf, pb); o.quaternion.copy(q); o.scale.setScalar(S.s * f.s); o.updateMatrix(); S.mesh.setMatrixAt(i, o.matrix); } S.mesh.instanceMatrix.needsUpdate = true; });
        const wx = ((t * 3.2 + 110) % 300) - 150; whale.position.set(wx, -58 + Math.sin(t * 0.25) * 3, -322); whale.rotation.set(Math.sin(t * 0.5) * 0.05, Math.PI / 2, Math.sin(t * 0.5 + 1) * 0.04);
        const ma = t * 0.12; manta.position.set(Math.cos(ma) * 34, -34 + Math.sin(ma * 2) * 4, -150 + Math.sin(ma) * 44); manta.rotation.set(0, -ma, Math.sin(ma * 2) * 0.2);
        jelly.position.y = Math.sin(t * 0.2) * 1.5; jl.intensity = 500 + Math.sin(t * 1.7) * 150;
      },
    };
  },
};
