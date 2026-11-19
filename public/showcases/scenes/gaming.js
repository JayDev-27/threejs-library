// 04 Gaming · Level Up: floating voxel islands over a synth grid, a coin trail, a controller moon and a portal.
import * as THREE from '../lib/three.module.min.js';
import { U, NOISE, Builder, stdMat, sky, points, glows, sunLight, rng, noise2, lerp, smooth, TAU } from '../lib/kit.js';

const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
const SWORD = ['..W..', '.WBW.', '.WBW.', '.WBW.', '.WBW.', '.WBW.', '.WBW.', '.WBW.', 'GGGGG', '.GHG.', '..H..', '..H..', '..R..'];
const STAR = ['...X...', '...X...', '..XXX..', 'XXXXXXX', '.XXXXX.', '..XXX..', '.XX.XX.', 'XX...XX'];
const CROWN = ['X..X..X', 'X.XXX.X', 'XXXXXXX', 'XRXGXRX', 'XXXXXXX'];
const KEY = ['.XXX.', 'X...X', 'X...X', '.XXX.', '..X..', '..X..', '..XX.', '..X..', '..XX.'];
const BIOME = {
  grass: { top: [0x5fd35a, 0x4cc24e, 0x73e06a], mid: 0x8a5a3a, leaf: [0x2f9e44, 0x37b24d], trunk: 0x6b4226 },
  sand: { top: [0xf2d27a, 0xe8c468, 0xf7dc8c], mid: 0xd8a85a, leaf: [0x3aa655, 0x2f9148], trunk: 0x3aa655 },
  snow: { top: [0xf4f8ff, 0xe6eefc, 0xffffff], mid: 0x9ab0c8, leaf: [0xdff1ff, 0xbfe3ff], trunk: 0x5a4636 },
  candy: { top: [0xff8ad0, 0xff9fdc, 0xff74c4], mid: 0xfff0f8, leaf: [0x7af0e0, 0xfff27a], trunk: 0xffffff },
  lava: { top: [0x3a2a30, 0x44323a, 0x2e2026], mid: 0x2a1c22, leaf: [0x3a2a30, 0x3a2a30], trunk: 0x1c1216 },
  stone: { top: [0x8a8aa0, 0x7c7c94, 0x9696ac], mid: 0x5c5c74, leaf: [0x8a8aa0, 0x8a8aa0], trunk: 0x44445a },
};

export default {
  build({ scene, look }) {
    const r = rng(42), vox = [], hot = [], halo = [], pick = a => a[Math.floor(r() * a.length)];
    const put = (x, y, z, c, s = 1) => vox.push([x, y, z, c, s]), glow = (x, y, z, c, s = 1, k = 2.2) => hot.push([x, y, z, c, s, k]);
    scene.fog = new THREE.FogExp2(0x3a1660, 0.0019);
    scene.add(sky({ top: 0x0c0630, horizon: 0xe0489a, bottom: 0x1a0a3a, pow: 0.3, sunDir: new THREE.Vector3(0, -1, 0), sunIntensity: 0, sunGlow: 0, stars: 1.4 }));
    scene.add(new THREE.HemisphereLight(0xbfa8ff, 0xff7ab8, 1.25));
    sunLight(scene, { dir: new THREE.Vector3(-0.55, 0.8, 0.5), color: 0xfff2dc, intensity: 2.6, box: 230, far: 800, map: 4096, target: [0, 10, -170] });

    // ---- islands ----
    const isles = {};
    function island(name, cx, cy, cz, R, biome, hill = 1) {
      const B = BIOME[biome], top = new Map(), bot = new Map(), k = (x, z) => x * 1000 + z, sd = r() * 100;
      for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) { const d = Math.hypot(x, z) / R + (noise2((cx + x) * 0.16 + sd, (cz + z) * 0.16) - 0.5) * 0.45; if (d > 1) continue;
        top.set(k(x, z), Math.round((1 - d * d) * 2.5 + noise2(x * 0.13 + sd, z * 0.13) * 5 * hill)); bot.set(k(x, z), -Math.round(Math.pow(1 - d, 1.4) * R * 0.95 + noise2(x * 0.3 + sd, z * 0.3) * 3) - 1); }
      for (const [key, t] of top) { const x = Math.round(key / 1000), z = key - x * 1000, b = bot.get(key);
        for (let y = t; y >= b; y--) { let open = y === t || y === b;
          if (!open) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nk = k(x + dx, z + dz); if (!top.has(nk) || y > top.get(nk) || y < bot.get(nk)) { open = true; break; } }
          if (!open) continue; const sh = 0.82 + r() * 0.3;
          let c = y === t ? pick(B.top) : y >= t - 2 ? B.mid : new THREE.Color(biome === 'candy' ? 0xd8a8e8 : 0x6a6a80).multiplyScalar(lerp(0.5, 1, smooth(b - 2, t, y)) * sh).getHex();
          if (biome === 'lava' && y === t && noise2(x * 0.3 + 5, z * 0.3) > 0.6) { glow(cx + x, cy + y - 0.15, cz + z, 0xff6a1a, 1, 2.6); continue; }
          if (biome === 'grass' && y === t && r() < 0.035) put(cx + x, cy + y + 0.7, cz + z, pick([0xff5a7a, 0xffe45c, 0xffffff, 0x9a7aff]), 0.4);
          put(cx + x, cy + y, cz + z, c); } }
      const h = (x, z) => cy + (top.get(k(Math.round(x - cx), Math.round(z - cz))) ?? 0); isles[name] = { cx, cy, cz, R, h, B };
      // trees and props
      for (let i = 0, n = 0; i < 200 && n < R * 0.9; i++) { const x = cx + Math.round((r() - 0.5) * R * 1.5), z = cz + Math.round((r() - 0.5) * R * 1.5); if (!top.has(k(x - cx, z - cz)) || Math.hypot(x - cx, z - cz) < 4) continue; const y = h(x, z); n++;
        if (biome === 'sand') { const hh = 2 + Math.floor(r() * 3); for (let j = 1; j <= hh; j++) put(x, y + j, z, 0x3aa655); if (hh > 2) { put(x + 1, y + 2, z, 0x3aa655); put(x + 1, y + 3, z, 0x3aa655); put(x - 1, y + 3, z, 0x2f9148); } put(x, y + hh + 0.7, z, 0xff7ab8, 0.5); }
        else if (biome === 'lava' || biome === 'stone') { const hh = 1 + Math.floor(r() * 4); for (let j = 1; j <= hh; j++) put(x, y + j, z, j === hh && biome === 'lava' ? 0x5a3a44 : B.top[0]); }
        else { const hh = 3 + Math.floor(r() * 3); for (let j = 1; j <= hh; j++) put(x, y + j, z, B.trunk);
          const tall = biome === 'snow'; for (let ly = 0; ly < (tall ? 4 : 3); ly++) { const rad = tall ? Math.max(0, 2 - Math.floor(ly * 0.75)) : ly < 2 ? 2 : 1;
            for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) { if (Math.abs(dx) === rad && Math.abs(dz) === rad && rad > 1 && r() < 0.8) continue; if (dx || dz || ly > 0) put(x + dx, y + hh + ly, z + dz, pick(B.leaf)); } }
          put(x, y + hh + (tall ? 4 : 3), z, pick(B.leaf)); } }
    }
    island('A', 0, 0, 0, 17, 'grass'); island('B', -36, 6, -72, 12, 'sand', 0.6); island('C', 32, 14, -132, 14, 'snow', 1.3); island('D', -24, 20, -200, 11, 'candy');
    island('E', 28, 10, -256, 13, 'lava', 0.8); island('F', 0, 24, -332, 16, 'stone', 0.4);
    for (let i = 0; i < 14; i++) { const x = (r() - 0.5) * 300, y = -20 + r() * 80, z = 60 - r() * 480; if (Math.abs(x) < 60) continue; const R = 3 + Math.floor(r() * 4); island('s' + i, Math.round(x), Math.round(y), Math.round(z), R, pick(['grass', 'stone', 'snow', 'candy'])); }

    // ---- pixel-art sprites built from voxels ----
    function sprite(rows, pal, [ox, oy, oz], s, lit = 0, ry = 0) { const w = rows[0].length, c = Math.cos(ry), sn = Math.sin(ry);
      rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return; const lx = (i - (w - 1) / 2) * s, y = oy + (rows.length - 1 - j) * s; (lit ? glow : put)(ox + lx * c, y, oz - lx * sn, pal[ch], s, lit); })); }
    const A = isles.A, F = isles.F;
    put(-5, A.h(-5, -4) + 1, -4, 0x77778c, 2.2); put(-5, A.h(-5, -4) + 2.3, -4, 0x8a8aa0, 1.4);
    sprite(SWORD, { W: 0xf4f8ff, B: 0xaab8d8, G: 0xffc93a, H: 0x7a4a2a, R: 0xff3a6a }, [-5, A.h(-5, -4) + 2.4, -4], 0.42, 0, 0.5);
    for (let i = 0; i < 3; i++) sprite(HEART, { X: 0xff2a5a }, [2 + i * 3.4, A.h(3, -8) + 7, -9], 0.42, 1.5, -0.2);
    sprite(STAR, { X: 0xffe14d }, [-37, 21, -74], 0.6, 2.4, 0.4); sprite(KEY, { X: 0x7af0ff }, [-22, 34, -202], 0.5, 2.2, -0.5); sprite(CROWN, { X: 0xffc93a, R: 0xff3a6a, G: 0x3affa0 }, [0, 52, -340], 1.1, 2.2);
    sprite(STAR, { X: 0xff7ad0 }, [40, 34, -140], 0.5, 2.2, -0.6);
    // loot crates
    for (const [n, dx, dz] of [['B', 3, 2], ['B', -4, -3], ['C', -5, 4], ['D', 3, -2], ['E', -4, 5], ['A', 8, -6]]) { const I = isles[n], x = I.cx + dx, z = I.cz + dz, y = I.h(x, z) + 1.25; put(x, y, z, 0x8a5a2a, 1.5); glow(x, y, z, 0xffc93a, 1.56, 0.0); for (const [ex, ez] of [[0.76, 0], [-0.76, 0], [0, 0.76], [0, -0.76]]) glow(x + ex, y, z + ez, 0xffd23f, 0.34, 2.4); glow(x, y + 0.76, z, 0xffd23f, 0.34, 2.4); }

    // ---- portal arch on the last island ----
    const PY = F.h(0, -340) + 10.5, PZ = -340;
    for (let i = -11; i <= 11; i++) for (let j = -11; j <= 11; j++) { const d = Math.hypot(i, j); if (d < 8.6 || d > 10.9 || PY + j < F.h(i, PZ)) continue;
      if ((i * 7 + j * 13) % 11 === 0) glow(i, PY + j, PZ, pick([0x9a5cff, 0x3af0ff]), 1, 2.6); else put(i, PY + j, PZ, pick([0x4a4a66, 0x56567a, 0x3e3e58])); if (d > 9.2 && d < 10.3) put(i, PY + j, PZ + 1, 0x38384e); }
    const portal = new THREE.Mesh(new THREE.CircleGeometry(8.8, 48), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: /* glsl */`varying vec2 vUv; uniform float uTime; ${NOISE}
        void main(){ vec2 p = floor((vUv - 0.5)*56.0)/56.0 + 0.5/56.0; float rr = length(p)*2.0, a = atan(p.y, p.x);
          float sw = a + rr*5.0 - uTime*1.1; float n = fbm(vec2(cos(sw), sin(sw))*2.2 + rr*3.0 - uTime*0.4), n2 = fbm(vec2(cos(sw*2.0 + 1.0), sin(sw*2.0))*3.0 - uTime*0.7);
          vec3 c = mix(vec3(0.42, 0.1, 1.0), vec3(0.1, 0.9, 1.0), smoothstep(0.3, 0.75, n))*(0.5 + 2.6*pow(n2, 2.5)) + vec3(1.0, 0.9, 1.0)*smoothstep(0.45, 0.0, rr)*1.6;
          c += vec3(1.0, 0.4, 0.9)*step(0.985, hash21(p*91.0 + floor(uTime*6.0)))*3.0; gl_FragColor = vec4(c, 1.0); }` })); portal.position.set(0, PY, PZ + 0.3); scene.add(portal);
    const rings = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.TorusGeometry(11.6 + i * 1.5, 0.11, 6, 4 + i * 2), new THREE.MeshBasicMaterial({ color: new THREE.Color([0x3af0ff, 0xff5fd2, 0xffe14d][i]).multiplyScalar(2.4) })); m.position.set(0, PY, PZ + 2 + i * 0.6); scene.add(m); return m; });
    const pLight = new THREE.PointLight(0x8a5cff, 900, 90, 1.6); pLight.position.set(0, PY, PZ + 8); scene.add(pLight);

    // ---- instanced voxels: lit cubes with a drawn bevel, and emissive cubes ----
    const cube = new THREE.BoxGeometry(1, 1, 1), o = new THREE.Object3D(), c = new THREE.Color();
    const vm = new THREE.MeshStandardMaterial({ roughness: 0.82 });
    vm.onBeforeCompile = sh => { sh.vertexShader = 'varying vec2 vBx;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vBx = uv;');
      sh.fragmentShader = 'varying vec2 vBx;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n float eB = min(min(vBx.x, 1.0 - vBx.x), min(vBx.y, 1.0 - vBx.y)); diffuseColor.rgb *= 0.74 + 0.26*smoothstep(0.0, 0.09, eB); diffuseColor.rgb *= 1.0 + 0.1*step(0.82, max(vBx.x, vBx.y))*step(0.09, eB);'); };
    const V = new THREE.InstancedMesh(cube, vm, vox.length); vox.forEach((v, i) => { o.position.set(v[0], v[1], v[2]); o.scale.setScalar(v[4]); o.updateMatrix(); V.setMatrixAt(i, o.matrix); V.setColorAt(i, c.set(v[3])); });
    V.castShadow = V.receiveShadow = true; V.frustumCulled = false; scene.add(V);
    const Hm = new THREE.InstancedMesh(cube, new THREE.MeshBasicMaterial(), hot.length); hot.forEach((v, i) => { o.position.set(v[0], v[1], v[2]); o.scale.setScalar(v[4]); o.updateMatrix(); Hm.setMatrixAt(i, o.matrix); Hm.setColorAt(i, c.set(v[3]).multiplyScalar(v[5])); });
    Hm.frustumCulled = false; scene.add(Hm);

    // ---- coin trail, crystals ----
    const trail = new THREE.CatmullRomCurve3([[6, 7, 16], [-4, 6, -6], [-18, 10, -40], [-34, 13, -70], [-8, 19, -100], [28, 22, -128], [8, 27, -168], [-22, 28, -198], [4, 24, -228], [26, 20, -254], [14, 30, -292], [0, 35, -322]].map(p => new THREE.Vector3(...p)));
    const NC = 120, coins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.62, 0.62, 0.16, 8).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffc21a, metalness: 0.9, roughness: 0.25, emissive: 0xff9a00, emissiveIntensity: 0.9 }), NC), cp = [];
    for (let i = 0; i < NC; i++) cp.push(trail.getPointAt((i + 0.5) / NC)); coins.frustumCulled = false; scene.add(coins);
    const cry = []; for (const n of ['C', 'C', 'C', 'D', 'D', 'E', 'A', 'F', 'F', 'B']) { const I = isles[n], x = I.cx + (r() - 0.5) * I.R * 1.2, z = I.cz + (r() - 0.5) * I.R * 1.2; cry.push({ p: [x, I.h(x, z) + 3 + r() * 2, z], c: pick([0x3af0ff, 0xff5fd2, 0x9a5cff, 0x7cff6b]), ph: r() * 6 }); }
    const crystals = cry.map(k => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), new THREE.MeshPhysicalMaterial({ color: k.c, emissive: k.c, emissiveIntensity: 1.6, roughness: 0.1, metalness: 0.2, flatShading: true })); m.scale.set(1, 1.7, 1); m.position.set(...k.p); scene.add(m); halo.push({ p: k.p, s: 5, c: k.c }); return m; });
    scene.add(glows(halo, { gain: 0.1 }));

    // ---- the controller, hanging like a moon ----
    const pad = new THREE.Group(), shell = new THREE.MeshPhysicalMaterial({ color: 0x2a1c5a, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15, metalness: 0.1 }), dark = new THREE.MeshStandardMaterial({ color: 0x0e0a1e, roughness: 0.4 });
    const add = (g, m, p, rot = [0, 0, 0], s = [1, 1, 1]) => { const x = new THREE.Mesh(g, m); x.position.set(...p); x.rotation.set(...rot); x.scale.set(...s); pad.add(x); return x; };
    add(new THREE.CapsuleGeometry(1.55, 4.6, 10, 24), shell, [0, 0, 0], [0, 0, Math.PI / 2], [1, 1, 0.62]);
    for (const s of [-1, 1]) { add(new THREE.CapsuleGeometry(1.25, 2.6, 10, 20), shell, [s * 3.1, -1.5, -0.1], [0.1, 0, s * 0.32], [1, 1, 0.72]); add(new THREE.SphereGeometry(1.75, 24, 16), shell, [s * 2.7, 0.15, 0], [0, 0, 0], [1, 0.95, 0.6]);
      add(new THREE.BoxGeometry(1.7, 0.36, 0.7), dark, [s * 2.6, 1.62, -0.25], [0, 0, -s * 0.12]); add(new THREE.CylinderGeometry(0.62, 0.7, 0.2, 24), dark, [s * 1.15, -0.72, 0.92], [Math.PI / 2, 0, 0]);
      add(new THREE.CylinderGeometry(0.3, 0.3, 0.42, 16), dark, [s * 1.15, -0.72, 1.14], [Math.PI / 2, 0, 0]); add(new THREE.SphereGeometry(0.5, 20, 12), dark, [s * 1.15, -0.72, 1.36], [0, 0, 0], [1, 1, 0.45]);
      add(new THREE.CapsuleGeometry(0.1, 0.3, 4, 8), new THREE.MeshBasicMaterial({ color: 0xcfd8ff }), [s * 0.62, 0.42, 0.98], [0, 0, s * 0.5]); }
    add(new THREE.BoxGeometry(1.5, 0.48, 0.2), dark, [-2.7, 0.3, 1.02]); add(new THREE.BoxGeometry(0.48, 1.5, 0.2), dark, [-2.7, 0.3, 1.02]);
    const btn = [[0xff3a5a, 0.62, 0], [0x3affa0, -0.62, 0], [0x3aa0ff, 0, 0.62], [0xffd23f, 0, -0.62]].map(([col, dx, dy]) => add(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 20), new THREE.MeshBasicMaterial({ color: col }), [2.7 + dx, 0.3 + dy, 1.05], [Math.PI / 2, 0, 0]));
    add(new THREE.BoxGeometry(2.4, 0.09, 0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3af0ff).multiplyScalar(3) }), [0, 1.42, 0.5]);
    const home = add(new THREE.TorusGeometry(0.34, 0.07, 8, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5fd2).multiplyScalar(3) }), [0, -0.1, 0.98]);
    pad.position.set(-74, 80, -262); pad.scale.setScalar(7); scene.add(pad);
    const padL = new THREE.PointLight(0xff8ad0, 9000, 200, 1.5); padL.position.set(-50, 84, -200); scene.add(padL);

    // ---- retro sun, grid floor, voxel clouds ----
    const sunM = new THREE.Mesh(new THREE.CircleGeometry(330, 64), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform float uTime; void main(){ float y = vUv.y; vec3 c = mix(vec3(1.0, 0.16, 0.6), vec3(1.0, 0.86, 0.3), smoothstep(0.15, 0.85, y)); float band = step(0.5, fract(y*y*14.0 - uTime*0.08)); float a = y > 0.56 ? 1.0 : band; gl_FragColor = vec4(c*1.25, a); }' }));
    sunM.position.set(0, 60, -1500); sunM.renderOrder = -500; scene.add(sunM);
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: /* glsl */`varying vec3 vW; uniform float uTime; void main(){ vec2 p = vW.xz/26.0; p.y += uTime*0.25; vec2 g = abs(fract(p) - 0.5), w = fwidth(p)*1.2;
        float l = max(smoothstep(0.5 - 0.035 - w.x, 0.5 - w.x*0.2, g.x), smoothstep(0.5 - 0.035 - w.y, 0.5 - w.y*0.2, g.y)); float d = length(vW.xz - cameraPosition.xz), f = exp(-d*0.0011);
        float pulse = smoothstep(0.96, 1.0, sin(p.y*0.6 - uTime*1.2)*0.5 + 0.5);
        vec3 c = mix(vec3(0.16, 0.05, 0.3), vec3(0.05, 0.015, 0.14), f) + (vec3(1.0, 0.2, 0.75)*l*1.5 + vec3(0.2, 0.9, 1.0)*l*pulse*2.0)*f; gl_FragColor = vec4(c, 1.0); }` }));
    grid.position.y = -75; scene.add(grid);
    const cl = new Builder(); for (let i = 0; i < 46; i++) { const x = (r() - 0.5) * 520, y = -10 + r() * 110, z = 100 - r() * 640; if (Math.abs(x) < 46) continue; const n = 3 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) cl.box(6 + r() * 12, 3 + r() * 3, 5 + r() * 7, { p: [x + (r() - 0.5) * 14, y + (r() - 0.5) * 3, z + (r() - 0.5) * 8], c: pick([0xffffff, 0xffe4f4, 0xe4e8ff]) }); }
    const clouds = cl.mesh(stdMat({ roughness: 1, emissive: 0x6a4a9a, emissiveIntensity: 0.25 }), false); scene.add(clouds);

    // ---- particles: pixel motes, falls, portal intake, confetti ----
    const E = isles.E;
    scene.add(points({ count: 2600, size: 0.26, shape: 'square', gain: 1.6, spawn: (i, v, q) => v.set((q() - 0.5) * 170, -20 + q() * 90, 50 - q() * 430), colorFn: (i, c2, q) => c2.set(pick([0x3af0ff, 0xff5fd2, 0xffe14d, 0xffffff, 0x9a5cff])),
      motion: 'p.y = mod(p.y + uTime*(0.6 + s.x*1.4) + 20.0, 90.0) - 20.0; p.x += sin(uTime*0.4 + s.y*20.0)*1.5; a *= 0.4 + 0.6*step(0.5, fract(uTime*(0.5 + s.z) + s.w));' }));
    scene.add(points({ count: 700, size: 0.55, shape: 'square', additive: false, gain: 1.3, spawn: (i, v, q) => v.set(A.cx + 13 + q() * 3, A.h(13, 6), 4 + q() * 5), colorFn: (i, c2, q) => c2.set(pick([0x4ab8ff, 0x7ad4ff, 0xe4f6ff])),
      motion: 'float age = fract(uTime*0.35 + s.x); p.y -= age*age*70.0; p.x += age*5.0; a = 1.0 - age;' }));
    scene.add(points({ count: 500, size: 0.6, shape: 'square', gain: 3, spawn: (i, v, q) => v.set(E.cx - 11 - q() * 2, E.cy + 2, E.cz + q() * 5), colorFn: (i, c2, q) => c2.set(pick([0xff6a1a, 0xffb02a, 0xff3a1a])),
      motion: 'float age = fract(uTime*0.3 + s.x); p.y -= age*age*60.0; p.x -= age*3.0; a = 1.0 - age;' }));
    scene.add(points({ count: 900, size: 0.34, shape: 'square', gain: 2.6, spawn: (i, v) => v.set(0, PY, PZ + 2), colorFn: (i, c2, q) => c2.set(pick([0x3af0ff, 0xff5fd2, 0xb98cff])),
      motion: 'float age = fract(uTime*0.22 + s.x); float rr = (1.0 - age)*(10.0 + s.y*16.0), an = s.z*6.283 + age*7.0; p.x += cos(an)*rr; p.y += sin(an)*rr; p.z += (1.0 - age)*(6.0 + s.w*22.0); a = age*(1.0 - age*age)*3.0;' }));
    const conf = points({ count: 3200, size: 0.42, shape: 'square', additive: false, gain: 1.7, spawn: (i, v, q) => v.set((q() - 0.5) * 60, PY - 16 + q() * 44, PZ + 6 + q() * 44), colorFn: (i, c2, q) => c2.set(pick([0xff3a5a, 0x3affa0, 0x3aa0ff, 0xffd23f, 0xff5fd2, 0xffffff])),
      motion: 'p.y = mod(p.y - uTime*(2.5 + s.x*3.5) - 8.0, 44.0) + 8.0; p.x += sin(uTime*1.6 + s.y*30.0)*1.6; sz = 0.4 + 0.6*abs(sin(uTime*4.0 + s.z*20.0));' }); scene.add(conf);

    Object.assign(look, { bloom: 0.7, bloomThreshold: 1.0, vignette: 0.5, aberration: 0.8, contrast: 1.06, saturation: 1.22, exposure: 1.05, grain: 0.025 });
    look.lift.setRGB(0.03, 0.01, 0.05);
    return {
      parallax: 0.6,
      rail: [
        { p: 0, pos: [12, 11, 38], look: [0, 5, -6], fov: 50 },
        { p: 0.13, pos: [1.5, A.h(-5, -4) + 6.5, 9], look: [-5, A.h(-5, -4) + 4.6, -4], fov: 44 },
        { p: 0.27, pos: [-14, 13, -36], look: [-36, 11, -74], fov: 52 },
        { p: 0.42, pos: [2, 25, -98], look: [32, 19, -132], fov: 50 },
        { p: 0.56, pos: [22, 40, -150], look: [-74, 80, -262], fov: 40 },
        { p: 0.7, pos: [-8, 30, -216], look: [26, 14, -256], fov: 52 },
        { p: 0.86, pos: [8, PY + 2, -288], look: [0, PY + 1, PZ], fov: 54 },
        { p: 1, pos: [0, PY - 1, -318], look: [0, PY, PZ], fov: 70 } ],
      update(t, p) {
        for (let i = 0; i < NC; i++) { o.position.copy(cp[i]); o.position.y += Math.sin(t * 2 + i * 0.5) * 0.3; o.rotation.set(0, t * 2.4 + i * 0.4, 0); o.scale.setScalar(1); o.updateMatrix(); coins.setMatrixAt(i, o.matrix); } coins.instanceMatrix.needsUpdate = true;
        crystals.forEach((m, i) => { m.rotation.y = t * 0.9 + i; m.position.y = cry[i].p[1] + Math.sin(t * 1.3 + cry[i].ph) * 0.5; });
        rings.forEach((m, i) => { m.rotation.z = t * (0.35 + i * 0.22) * (i % 2 ? -1 : 1); const s = 1 + Math.sin(t * 2 + i) * 0.03; m.scale.set(s, s, 1); });
        pad.rotation.set(-0.25 + Math.sin(t * 0.4) * 0.07, 0.55 + Math.sin(t * 0.27) * 0.2, Math.sin(t * 0.33) * 0.08); pad.position.y = 80 + Math.sin(t * 0.5) * 2;
        btn.forEach((b, i) => { const k = 1.2 + 2.2 * Math.pow(Math.max(0, Math.sin(t * 3 - i * 1.57)), 6); b.material.color.set([0xff3a5a, 0x3affa0, 0x3aa0ff, 0xffd23f][i]).multiplyScalar(k); });
        home.material.color.set(0xff5fd2).multiplyScalar(2 + Math.sin(t * 2.5) * 1.2);
        clouds.position.x = Math.sin(t * 0.02) * 30; pLight.intensity = 800 + Math.sin(t * 5) * 120;
        conf.userData.u.uOpacity.value = smooth(0.84, 0.95, p); look.bloom = lerp(0.7, 1.05, smooth(0.85, 1, p)); look.exposure = lerp(1.05, 1.2, smooth(0.9, 1, p));
      },
    };
  },
};
