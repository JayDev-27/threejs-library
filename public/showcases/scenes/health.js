// 05 Health · Vital: DNA, a living cell, the bloodstream, firing neurons and a beating heart.
import * as THREE from '../lib/three.module.min.js';
import { U, NOISE, Builder, stdMat, merge, instanced, sky, points, canvasTex, rng, lerp, smooth, win, TAU } from '../lib/kit.js';

const V3 = THREE.Vector3;
function bumpy(geo, amp, freq, seed = 0) { const p = geo.attributes.position, v = new V3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = Math.sin(v.x * freq + seed) * Math.sin(v.y * freq * 1.1 + seed * 2) * Math.sin(v.z * freq * 0.9 + seed * 3) + 0.5 * Math.sin(v.x * freq * 2.3 + v.y * freq * 1.7 + seed);
    v.multiplyScalar(1 + n * amp); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); return geo; }

export default {
  build({ scene, look, camera, env }) {
    const r = rng(8), o = new THREE.Object3D();
    scene.fog = new THREE.FogExp2(0x041c22, 0.012);
    const dome = sky({ top: 0x021014, horizon: 0x0a3a40, bottom: 0x010809, pow: 0.6, sunDir: new V3(0.3, 0.8, 0.4), sunColor: 0xbff8ff, sunSize: 0.02, sunIntensity: 2, sunGlow: 0.6 }); scene.add(dome); env(dome, 0.8);
    scene.add(new THREE.HemisphereLight(0xbfefff, 0x0a2a30, 0.7)); const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(5, 8, 6); scene.add(key);
    const lamp = new THREE.PointLight(0xdffcff, 34, 46, 1.6); scene.add(lamp);

    // ---- 1. DNA ----
    const PT = 9, L = 84, RAD = 2.6, axis = t => new V3(Math.sin(t * 5) * 1.6, Math.cos(t * 4) * 1.1, 12 - t * L), sA = [], sB = [], tmp = new V3(), nx = new V3(), ny = new V3();
    const frame = t => { const tg = axis(t + 0.002).sub(axis(t - 0.002)).normalize(); nx.set(0, 1, 0).cross(tg).normalize(); ny.crossVectors(tg, nx); };
    const strand = (t, off) => { frame(t); const a = t * L / PT * TAU + off; return axis(t).addScaledVector(nx, Math.cos(a) * RAD).addScaledVector(ny, Math.sin(a) * RAD); };
    for (let i = 0; i <= 520; i++) { sA.push(strand(i / 520, 0)); sB.push(strand(i / 520, Math.PI * 0.82)); }
    const bone = new THREE.MeshPhysicalMaterial({ color: 0xe6fbff, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.2, emissive: 0x1a8a8a, emissiveIntensity: 0.35 });
    for (const pts of [sA, sB]) scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 900, 0.3, 10), bone));
    const NB = 150, bc = [[0x35e0c8, 0xff7a6b], [0xffd166, 0x5b8cff], [0xff7a6b, 0x35e0c8], [0x5b8cff, 0xffd166]], up = new V3(0, 1, 0);
    const baseM = new THREE.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.8, emissive: 0xffffff, emissiveIntensity: 0.0 }); baseM.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissive_fragment>', 'totalEmissiveRadiance = diffuseColor.rgb*0.55;'); };
    scene.add(instanced(new THREE.CylinderGeometry(0.17, 0.17, 1, 10).translate(0, 0.5, 0), baseM, NB * 2, (i, d, c) => { const k = Math.floor(i / 2), t = (k + 0.5) / NB, a = strand(t, 0), b = strand(t, Math.PI * 0.82), m = a.clone().lerp(b, 0.5), from = i % 2 ? b : a;
      d.position.copy(from); tmp.subVectors(m, from); d.scale.set(1, tmp.length() * 0.97, 1); d.quaternion.setFromUnitVectors(up, tmp.normalize()); c.set(bc[k % 4][i % 2]); }));
    scene.add(instanced(new THREE.SphereGeometry(0.46, 16, 12), bone, NB * 2, (i, d) => { const t = (Math.floor(i / 2) + 0.5) / NB; d.position.copy(strand(t, i % 2 ? Math.PI * 0.82 : 0)); }));
    // free nucleotides and proteins drifting past
    const mol = new Builder(); for (let k = 0; k < 7; k++) mol.sph(0.28 + r() * 0.22, { p: [(r() - 0.5) * 1.1, (r() - 0.5) * 1.1, (r() - 0.5) * 1.1], c: [0x35e0c8, 0xff7a6b, 0xffd166, 0x5b8cff, 0xffffff][k % 5] }, 12, 8);
    const mols = instanced(mol.geometry(), new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 1 }), 150, (i, d) => { d.position.set((r() - 0.5) * 44, (r() - 0.5) * 28, 20 - r() * 100); if (Math.hypot(d.position.x, d.position.y) < 5) d.position.x += 9; d.rotation.set(r() * 6, r() * 6, r() * 6); d.scale.setScalar(0.4 + r() * 0.9); }); scene.add(mols);

    // ---- 2. the cell ----
    const CZ = -128, cell = new THREE.Group(); cell.position.set(0, 0, CZ); scene.add(cell);
    const memb = new THREE.Mesh(new THREE.SphereGeometry(24, 128, 80), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vN, vV, vP; uniform float uTime; ${NOISE} void main(){ vP = position; vec3 p = position*(1.0 + 0.035*(fbm3(position*0.12 + uTime*0.08) - 0.5)*2.0); vec4 mv = modelViewMatrix*vec4(p,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vN, vV, vP; uniform float uTime; ${NOISE}
        void main(){ float f = pow(1.0 - abs(dot(normalize(vN), vV)), 2.2); vec3 q = vP*0.9; float cells = 0.0; vec3 id = floor(q), fr = fract(q) - 0.5; cells = smoothstep(0.42, 0.2, length(fr + (vec3(hash31(id), hash31(id + 7.0), hash31(id + 13.0)) - 0.5)*0.4));
          float prot = step(0.93, hash31(floor(vP*0.33)))*smoothstep(0.5, 0.2, length(fract(vP*0.33) - 0.5));
          vec3 c = vec3(0.12, 0.85, 0.78)*(f*1.1 + cells*0.05 + 0.015) + vec3(1.0, 0.75, 0.35)*prot*0.5 + vec3(0.6, 1.0, 0.95)*pow(f, 5.0)*1.2; gl_FragColor = vec4(c, 1.0); }` }));
    cell.add(memb);
    const nuc = new THREE.Mesh(bumpy(new THREE.IcosahedronGeometry(7.5, 24), 0.035, 1.6, 2), new THREE.MeshPhysicalMaterial({ color: 0x6a4cff, roughness: 0.42, clearcoat: 0.6, sheen: 1, sheenColor: 0xc8b8ff, emissive: 0x2a167a, emissiveIntensity: 0.7 })); nuc.position.set(-3, -1, -2); cell.add(nuc);
    cell.add(instanced(new THREE.TorusGeometry(0.34, 0.11, 6, 12), new THREE.MeshStandardMaterial({ color: 0x241060, roughness: 0.6 }), 220, (i, d) => { const u = r() * TAU, v = Math.acos(2 * r() - 1); tmp.set(Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)); d.position.copy(tmp).multiplyScalar(7.55).add(nuc.position); d.quaternion.setFromUnitVectors(new V3(0, 0, 1), tmp); }));
    // rough endoplasmic reticulum: folded sheets wrapping the nucleus
    const erM = new THREE.MeshPhysicalMaterial({ color: 0x2fd0c0, roughness: 0.4, transparent: true, opacity: 0.6, side: THREE.DoubleSide, emissive: 0x0a5a58, emissiveIntensity: 0.6, clearcoat: 0.5 });
    for (let k = 0; k < 7; k++) { const g = new THREE.TorusGeometry(9.2 + k * 0.85, 0.42, 10, 90, Math.PI * (0.7 + r() * 0.6)), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * 2.6 + Math.sin(p.getX(i) * 0.9 + k) * 0.9); g.computeVertexNormals();
      const m = new THREE.Mesh(g, erM); m.position.copy(nuc.position); m.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.3, 0, r() * TAU); cell.add(m); }
    // mitochondria with cristae, golgi stack, vesicles, ribosomes
    const cris = canvasTex(256, 128, (g, W, Hh) => { g.fillStyle = '#ffb07a'; g.fillRect(0, 0, W, Hh); g.strokeStyle = '#c2452e'; g.lineWidth = 7; for (let x = 10; x < W; x += 22) { g.beginPath(); g.moveTo(x, 8); g.bezierCurveTo(x + 12, 40, x - 12, 80, x + 4, Hh - 8); g.stroke(); } });
    const mito = instanced(new THREE.CapsuleGeometry(0.85, 2.6, 8, 20), new THREE.MeshPhysicalMaterial({ map: cris, bumpMap: cris, bumpScale: 2, roughness: 0.45, clearcoat: 0.7, emissive: 0xff5a2a, emissiveIntensity: 0.25 }), 34, (i, d) => { const u = r() * TAU, v = Math.acos(2 * r() - 1), R = 12 + r() * 9; d.position.set(Math.sin(v) * Math.cos(u) * R, Math.cos(v) * R * 0.8, Math.sin(v) * Math.sin(u) * R); d.rotation.set(r() * 6, r() * 6, r() * 6); d.scale.setScalar(0.7 + r() * 0.7); }); cell.add(mito);
    const gol = new THREE.Group(); for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.TorusGeometry(3.2 + k * 0.55, 0.3, 10, 48, Math.PI * 0.85), new THREE.MeshPhysicalMaterial({ color: 0xffd166, roughness: 0.4, clearcoat: 0.8, emissive: 0x9a6a10, emissiveIntensity: 0.4 })); m.scale.set(1, 1, 3.4); m.rotation.z = -0.4; gol.add(m); } gol.position.set(11, 4, 5); gol.rotation.set(0.6, 0.8, 0.2); cell.add(gol);
    const ves = instanced(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshPhysicalMaterial({ roughness: 0.15, transparent: true, opacity: 0.55, clearcoat: 1, emissive: 0x2a8a9a, emissiveIntensity: 0.5 }), 190, (i, d, c) => { const u = r() * TAU, v = Math.acos(2 * r() - 1), R = 9.5 + r() * 12.5; d.position.set(Math.sin(v) * Math.cos(u) * R, Math.cos(v) * R, Math.sin(v) * Math.sin(u) * R); d.scale.setScalar(0.2 + r() * r() * 0.9); c.set([0x7af0ff, 0xb8ffd8, 0xffb8e0, 0xfff0a8][i % 4]); }); cell.add(ves);
    cell.add(points({ count: 5000, size: 0.13, gain: 1.6, color: 0x9af8e8, spawn: (i, v, q) => { const u = q() * TAU, w = Math.acos(2 * q() - 1), R = 8.5 + Math.pow(q(), 0.6) * 14; v.set(Math.sin(w) * Math.cos(u) * R, Math.cos(w) * R, Math.sin(w) * Math.sin(u) * R); },
      motion: 'p += vec3(sin(uTime*0.5 + s.x*30.0), cos(uTime*0.4 + s.y*30.0), sin(uTime*0.45 + s.z*30.0))*0.4;' }));

    // ---- 3. the bloodstream ----
    const VZ0 = -176, VL = 170, vessel = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, VL, 64, 80, true).rotateX(Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen }, side: THREE.BackSide,
      vertexShader: `varying vec3 vP, vN; varying float vD; uniform float uTime; ${NOISE} void main(){ vec3 p = position; float w = sin(p.z*0.16 - uTime*3.2)*0.35 + (fbm3(p*0.2) - 0.5)*1.6; p.xy *= 1.0 + w*0.06; vP = p; vN = normalMatrix*normal; vec4 mv = modelViewMatrix*vec4(p,1.0); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vP, vN; varying float vD; uniform float uTime, uFogDen; uniform vec3 uFogCol; ${NOISE}
        void main(){ float a = atan(vP.y, vP.x); vec2 q = vec2(a*3.0, vP.z*0.22); float n = fbm(q*1.6), v1 = abs(fbm(q*0.9 + 4.0) - 0.5)*2.0, folds = 0.5 + 0.5*sin(vP.z*1.3 + n*5.0);
          float pulse = 0.5 + 0.5*sin(vP.z*0.16 - uTime*3.2); vec3 c = mix(vec3(0.3, 0.012, 0.03), vec3(0.85, 0.09, 0.1), n*0.7 + folds*0.25) + vec3(0.9, 0.35, 0.25)*smoothstep(0.12, 0.0, v1)*0.35;
          float rim = pow(1.0 - abs(normalize(vN).z), 1.5); c *= 0.2 + 0.6*rim + 0.18*pulse; c += vec3(1.0, 0.45, 0.3)*pow(rim, 4.0)*0.2;
          gl_FragColor = vec4(mix(uFogCol, c, exp(-uFogDen*uFogDen*vD*vD)), 1.0); }` })); vessel.position.set(0, 0, VZ0 - VL / 2); scene.add(vessel);
    const prof = []; for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + i / 14 * Math.PI, x = Math.cos(a), th = 0.3 * Math.sin(a) * (0.42 + 0.58 * Math.pow(x, 1.6) * (1.6 - 0.6 * x)); prof.push(new THREE.Vector2(Math.max(x * 1.02, 0.0001), th)); }
    const NR = 900, rbcG = new THREE.LatheGeometry(prof, 28), rbc = new THREE.InstancedMesh(rbcG, new THREE.MeshPhysicalMaterial({ color: 0xd01828, roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.3, sheen: 1, sheenColor: 0xff8a7a, emissive: 0x4a0408, emissiveIntensity: 0.3 }), NR); rbc.frustumCulled = false; scene.add(rbc);
    const rd = Array.from({ length: NR }, () => ({ a: r() * TAU, R: 1.7 + Math.sqrt(r()) * 4.6, z: r() * VL, sp: 9 + r() * 9, ax: new V3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), rs: 0.4 + r() * 1.6, ph: r() * 6, s: 0.72 + r() * 0.3 }));
    const wbc = Array.from({ length: 9 }, (_, i) => { const m = new THREE.Mesh(bumpy(new THREE.IcosahedronGeometry(1.5, 12), 0.09, 4.5, i), new THREE.MeshPhysicalMaterial({ color: 0xf2ecff, roughness: 0.5, sheen: 1, sheenColor: 0xb8a8ff, emissive: 0x4a3a8a, emissiveIntensity: 0.35 })); m.userData = { a: r() * TAU, R: 2 + r() * 3.5, z: r() * VL, sp: 4 + r() * 3 }; scene.add(m); return m; });
    scene.add(points({ count: 2600, size: 0.16, gain: 1.4, color: 0xffd8a0, opacity: 0.8, spawn: (i, v, q) => { const a = q() * TAU, R = Math.sqrt(q()) * 6.8; v.set(Math.cos(a) * R, Math.sin(a) * R, VZ0 - q() * VL); },
      motion: `p.z = ${VZ0.toFixed(1)} - mod(${(-VZ0).toFixed(1)} + (-p.z) + uTime*(6.0 + s.x*8.0), ${VL.toFixed(1)});` }));
    const vl = [0.2, 0.5, 0.8].map(k => { const l = new THREE.PointLight(0xffc8b0, 70, 60, 1.5); l.position.set(0, 2.5, VZ0 - VL * k); scene.add(l); return l; });

    // ---- 4. neurons ----
    const NZ = -410, tubes = [], somas = [], sparks = [];
    for (let n = 0; n < 13; n++) { const c = n === 0 ? new V3(3, 1.5, NZ + 10) : new V3((r() - 0.5) * 64, (r() - 0.5) * 34, NZ + (r() - 0.5) * 76); somas.push(c);
      for (let b = 0; b < 8; b++) { const dir = new V3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), pts = [c.clone()], p = c.clone(), len = b === 0 ? 30 : 9 + r() * 12; for (let k = 0; k < 7; k++) { dir.add(new V3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.55)).normalize(); p.addScaledVector(dir, len / 7); pts.push(p.clone()); }
        const mk = (pp, rad) => { const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pp), 40, rad, 7), uv = g.attributes.uv, pos = g.attributes.position, off = r() * 5, cv = new THREE.CatmullRomCurve3(pp); for (let i = 0; i < uv.count; i++) { const t = uv.getX(i), q = cv.getPoint(t), k = 1 - t * 0.8; pos.setXYZ(i, q.x + (pos.getX(i) - q.x) * k, q.y + (pos.getY(i) - q.y) * k, q.z + (pos.getZ(i) - q.z) * k); uv.setXY(i, t * (len / 12) + off, t); } tubes.push(g); };
        mk(pts, b === 0 ? 0.3 : 0.2); sparks.push(pts[7]);
        for (let s2 = 0; s2 < 2; s2++) { const i0 = 3 + Math.floor(r() * 3), q = pts[i0].clone(), d2 = new V3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), pp = [q.clone()]; for (let k = 0; k < 4; k++) { d2.add(new V3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.6)).normalize(); q.addScaledVector(d2, 1.6); pp.push(q.clone()); } mk(pp, 0.11); sparks.push(pp[4]); } } }
    const nMat = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen },
      vertexShader: 'varying vec3 vN, vV; varying vec2 vUv; varying float vD; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vD = -mv.z; gl_Position = projectionMatrix*mv; }',
      fragmentShader: `varying vec3 vN, vV; varying vec2 vUv; varying float vD; uniform float uTime, uFogDen; uniform vec3 uFogCol;
        void main(){ float f = pow(1.0 - max(dot(normalize(vN), vV), 0.0), 2.0), ph = fract(vUv.x*0.6 - uTime*0.45), pu = smoothstep(0.0, 0.08, ph)*smoothstep(0.34, 0.08, ph);
          vec3 c = vec3(0.05, 0.07, 0.22)*(0.5 + 0.5*max(normalize(vN).y, 0.0)) + vec3(0.25, 0.4, 1.0)*f*0.9 + vec3(0.4, 0.95, 1.0)*pu*pu*3.2*(0.35 + 0.65*f); gl_FragColor = vec4(mix(uFogCol, c, exp(-uFogDen*uFogDen*vD*vD)), 1.0); }` });
    scene.add(new THREE.Mesh(merge(tubes), nMat));
    const somaG = bumpy(new THREE.IcosahedronGeometry(1.7, 10), 0.1, 2.4, 3), somaM = new THREE.MeshPhysicalMaterial({ color: 0x2a3aa8, roughness: 0.4, clearcoat: 0.6, emissive: 0x3a7aff, emissiveIntensity: 0.6, sheen: 1, sheenColor: 0x9ac8ff });
    scene.add(instanced(somaG, somaM, somas.length, (i, d) => { d.position.copy(somas[i]); d.rotation.set(r() * 6, r() * 6, 0); d.scale.setScalar(i ? 0.8 + r() * 0.6 : 1.4); }));
    scene.add(points({ count: sparks.length, size: 1.1, gain: 2.4, color: 0x8ae8ff, shape: 'spark', spawn: (i, v) => v.copy(sparks[i]), motion: 'a *= pow(max(0.0, sin(uTime*(1.5 + s.x*2.0) + s.y*40.0)), 10.0); sz = 0.6 + s.z;' }));
    scene.add(points({ count: 1800, size: 0.12, gain: 1.6, color: 0x7aa8ff, spawn: (i, v, q) => v.set((q() - 0.5) * 80, (q() - 0.5) * 44, NZ + (q() - 0.5) * 100), motion: 'p += vec3(sin(uTime*0.2 + s.x*30.0), cos(uTime*0.17 + s.y*30.0), 0.0)*1.2; a *= 0.4 + 0.6*sin(uTime + s.w*30.0);' }));

    // ---- 5. the heart and its trace ----
    const HZ = -492, sh = new THREE.Shape(); sh.moveTo(0, -3.2); sh.bezierCurveTo(-1.2, -2.2, -4.4, -0.6, -4.4, 1.5); sh.bezierCurveTo(-4.4, 3.5, -2.6, 4.3, -1.5, 4.0); sh.bezierCurveTo(-0.7, 3.8, -0.2, 3.3, 0, 2.7); sh.bezierCurveTo(0.2, 3.3, 0.7, 3.8, 1.5, 4.0); sh.bezierCurveTo(2.6, 4.3, 4.4, 3.5, 4.4, 1.5); sh.bezierCurveTo(4.4, -0.6, 1.2, -2.2, 0, -3.2);
    const hg = new THREE.ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: true, bevelThickness: 1.7, bevelSize: 1.5, bevelSegments: 20, curveSegments: 40 }).center();
    const heart = new THREE.Mesh(hg, new THREE.MeshPhysicalMaterial({ color: 0xff2a4a, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0xa00c22, emissiveIntensity: 0.2, sheen: 1, sheenColor: 0xffb0b8 })); heart.position.set(0, 2.2, HZ); scene.add(heart);
    const hl = new THREE.PointLight(0xff8a90, 90, 60, 1.6); hl.position.set(0, 3, HZ + 8); scene.add(hl);
    const beatAt = x => { const u = ((x % 1) + 1) % 1; return Math.exp(-Math.pow((u - 0.2) / 0.035, 2)) * 0.18 - Math.exp(-Math.pow((u - 0.37) / 0.012, 2)) * 0.22 + Math.exp(-Math.pow((u - 0.4) / 0.014, 2)) * 1.5 - Math.exp(-Math.pow((u - 0.435) / 0.014, 2)) * 0.4 + Math.exp(-Math.pow((u - 0.62) / 0.05, 2)) * 0.32; };
    const ecgP = []; for (let i = 0; i <= 900; i++) { const x = -48 + i / 900 * 96; ecgP.push(new V3(x, -5.5 + beatAt(x / 12) * 4.2, HZ - 5)); }
    const ecgM = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform float uTime; void main(){ float d = fract(uTime*0.16 - vUv.x); gl_FragColor = vec4(vec3(0.2, 1.0, 0.85)*(0.22 + 5.0*exp(-d*10.0)), 1.0); }' });
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ecgP, false, 'catmullrom', 0.1), 1800, 0.075, 6), ecgM));
    const gridM = new THREE.Mesh(new THREE.PlaneGeometry(150, 80), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; void main(){ vec2 p = vUv*vec2(150.0, 80.0); vec2 g = abs(fract(p) - 0.5), G = abs(fract(p/5.0) - 0.5); float l = smoothstep(0.47, 0.5, max(g.x, g.y))*0.25 + smoothstep(0.49, 0.5, max(G.x, G.y))*0.6; float v = smoothstep(0.5, 0.1, length(vUv - 0.5)); gl_FragColor = vec4(vec3(0.1, 0.7, 0.62)*l*v*0.5, 1.0); }' })); gridM.position.set(0, 0, HZ - 7); scene.add(gridM);
    const rings = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.TorusGeometry(7, 0.035, 6, 120), new THREE.MeshBasicMaterial({ color: 0xff5a7a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); m.position.set(0, 2.2, HZ - 1); scene.add(m); return m; });
    const cross = new Builder().box(0.9, 0.28, 0.28, {}).box(0.28, 0.9, 0.28, {}).geometry();
    const crs = instanced(cross, new THREE.MeshPhysicalMaterial({ color: 0x4de2c5, roughness: 0.2, clearcoat: 1, emissive: 0x1a9a88, emissiveIntensity: 0.8 }), 90, (i, d) => { d.position.set((r() - 0.5) * 70, (r() - 0.5) * 36, HZ + 14 - r() * 20); if (Math.hypot(d.position.x, d.position.y - 2) < 9) d.position.x += 14; d.rotation.set(r() * 6, r() * 6, r() * 6); d.scale.setScalar(0.5 + r() * 1.2); }); scene.add(crs);
    // soft bokeh through the whole journey
    scene.add(points({ count: 900, size: 1.3, gain: 0.5, opacity: 0.2, color: 0x6ae8d8, spawn: (i, v, q) => v.set((q() - 0.5) * 70, (q() - 0.5) * 40, 20 - q() * 130), motion: 'p.y += sin(uTime*0.2 + s.x*20.0)*1.5; a *= 0.4 + 0.6*sin(uTime*0.6 + s.y*30.0);' }));

    Object.assign(look, { bloom: 0.85, bloomThreshold: 0.85, bloomKnee: 0.7, vignette: 0.6, aberration: 0.9, contrast: 1.06, saturation: 1.12, grain: 0.03, ao: 0.7 });
    const su = dome.userData.u, cA = new THREE.Color(), cB = new THREE.Color(), stages = [[0x041c22, 0x0a3a40, 0.012], [0x04202a, 0x0c4450, 0.01], [0x30060a, 0x5a0c12, 0.011], [0x050826, 0x0e1a52, 0.009], [0x04181c, 0x0b3a3c, 0.008]];
    return {
      parallax: 0.5,
      rail: [
        { p: 0, pos: [9, 4.5, 20], look: [0, 0, -16], fov: 44 },
        { p: 0.11, pos: [4.2, 1.4, -18], look: [0, 0, -46], fov: 50 },
        { p: 0.23, pos: [-7, 4, -78], look: [0, 0, CZ], fov: 50 },
        { p: 0.35, pos: [15, 9, CZ + 19], look: [-2, -1, CZ - 2], fov: 50 },
        { p: 0.47, pos: [0, 0, VZ0 + 6], look: [0, 0, VZ0 - 60], fov: 62 },
        { p: 0.6, pos: [1.2, -0.8, VZ0 - 95], look: [0, 0, VZ0 - 160], fov: 66 },
        { p: 0.73, pos: [-4, 1, NZ + 46], look: [3, 1.5, NZ + 10], fov: 52 },
        { p: 0.86, pos: [9, 4, NZ - 14], look: [0, 1.5, HZ], fov: 48 },
        { p: 1, pos: [0, 1.2, HZ + 26], look: [0, 1, HZ], fov: 40 } ],
      update(t, p, dt) {
        lamp.position.copy(camera.position).add(tmp.set(1.5, 2, 0.5));
        const st = p * 4, i = Math.min(3, Math.floor(st)), f = smooth(0.25, 0.75, st - i);
        scene.fog.color.copy(cA.set(stages[i][0]).lerp(cB.set(stages[i + 1][0]), f)); su.uHor.value.copy(cA.set(stages[i][1]).lerp(cB.set(stages[i + 1][1]), f)); su.uBot.value.copy(scene.fog.color); su.uTop.value.copy(scene.fog.color).multiplyScalar(0.6);
        scene.fog.density = lerp(stages[i][2], stages[i + 1][2], f);
        mols.rotation.z = t * 0.01; cell.rotation.y = t * 0.03; gol.rotation.y = 0.8 + t * 0.1;
        for (let k = 0; k < NR; k++) { const d = rd[k], z = VZ0 - ((d.z + t * d.sp) % VL), sw = Math.sin(t * 0.7 + d.ph) * 0.25; o.position.set(Math.cos(d.a + sw) * d.R, Math.sin(d.a + sw) * d.R, z); o.quaternion.setFromAxisAngle(d.ax, t * d.rs + d.ph); o.scale.setScalar(d.s); o.updateMatrix(); rbc.setMatrixAt(k, o.matrix); }
        rbc.instanceMatrix.needsUpdate = true;
        wbc.forEach(m => { const d = m.userData; m.position.set(Math.cos(d.a) * d.R, Math.sin(d.a) * d.R, VZ0 - ((d.z + t * d.sp) % VL)); m.rotation.set(t * 0.2, t * 0.15, 0); });
        const bt = (t * 1.15) % 1, beat = Math.exp(-Math.pow((bt - 0.1) / 0.05, 2)) + 0.6 * Math.exp(-Math.pow((bt - 0.32) / 0.06, 2));
        heart.scale.setScalar(1 + beat * 0.09); heart.rotation.y = Math.sin(t * 0.5) * 0.35; hl.intensity = 80 + beat * 160; heart.material.emissiveIntensity = 0.18 + beat * 0.45;
        rings.forEach((m, k) => { const u = (bt + k / 3) % 1; m.scale.setScalar(1 + u * 2.6); m.material.opacity = (1 - u) * 0.9; });
        vl.forEach((l, k) => l.intensity = 70 + 30 * Math.sin(t * 3.2 + k * 2));
        crs.rotation.z = Math.sin(t * 0.1) * 0.05; look.exposure = 1 - 0.12 * win(0.42, 0.66, p, 0.05);
      },
    };
  },
};
