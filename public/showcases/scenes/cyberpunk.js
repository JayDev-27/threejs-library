// 03 Cyberpunk · Neon Rain: a wet street canyon, stacked signage, hover traffic, a hologram over the crossing.
import * as THREE from '../lib/three.module.min.js';
import { U, NOISE, FOG_PARS, Builder, stdMat, merge, xform, instanced, sky, points, glows, canvasTex, rng, lerp, smooth, TAU } from '../lib/kit.js';

const PAL = ['#ff2bd6', '#00f0ff', '#ffe14d', '#ff5a36', '#7cff6b', '#b388ff', '#ffffff', '#ff2b5e'];
const VERT = ['ラーメン', '電脳', '酒場', 'ホテル', '薬局', '寿司', 'カラオケ', '未来', '夜市', '龍', 'BAR', '24H', 'NOODLE', 'HOTEL', 'CYBER', 'SYNTH', 'ネオン', '居酒屋', '麻雀', '喫茶', '映画館', '光', '雨', 'ARCADE', 'RAMEN', 'CLUB', '夢', 'VOID', 'ゲーム', '義体', '占い', 'サウナ'];
const WIDE = ['NEON RAIN', '電脳都市', 'NOODLE BAR', 'ホテル 未来', 'SYNTHWAVE FM', '夜市 OPEN', 'ORBITAL AIR', 'MEGA SALE', '新型 義体', 'DATA HAVEN', '雨の街', 'OPEN 24H', 'HYPER COLA', 'ロボット修理', 'NIGHT MARKET', '量子銀行',
  'SKYLINE EXPRESS', '夢を買う', 'ZERO-G CLUB', 'メモリ増設', 'KARAOKE ★', '深夜食堂', 'UPLINK 9', '電気街', 'CHROME & CO', '天空鉄道', 'GHOST SIGNAL', '記憶屋', 'LAST TRAIN', '屋台', 'ANDROID CARE', '無限'];
const FONT = "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Yu Gothic', 'Arial Black', sans-serif";

function atlas(list, cw, ch, vertical) {
  return canvasTex(cw * 8, ch * 4, (g, W, Hh) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, Hh); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    list.forEach((txt, i) => {
      const x = (i % 8) * cw, y = Math.floor(i / 8) * ch, c = PAL[(i * 5 + 1) % PAL.length], c2 = PAL[(i * 3 + 4) % PAL.length], m = 14;
      g.save(); g.beginPath(); g.rect(x, y, cw, ch); g.clip();
      g.shadowColor = c2; g.shadowBlur = 26; g.strokeStyle = c2; g.lineWidth = 6;
      if (i % 3) { g.beginPath(); g.roundRect(x + m, y + m, cw - 2 * m, ch - 2 * m, 18); g.stroke(); g.stroke(); }
      if (i % 4 === 0) { g.globalAlpha = 0.16; g.fillStyle = c2; g.fillRect(x + m, y + m, cw - 2 * m, ch - 2 * m); g.globalAlpha = 1; }
      g.shadowColor = c; g.fillStyle = c;
      const chars = [...txt];
      if (vertical) { const n = chars.length, latin = /^[\x20-\x7e]+$/.test(txt), fs = Math.min(cw * 0.62, (ch - 70) / n * (latin ? 1.05 : 0.95)); g.font = `900 ${fs}px ${FONT}`;
        chars.forEach((s, k) => { const yy = y + ch / 2 + (k - (n - 1) / 2) * fs * (latin ? 0.95 : 1.06); g.shadowBlur = 30; g.fillText(s, x + cw / 2, yy); g.shadowBlur = 8; g.fillStyle = '#fff'; g.globalAlpha = 0.55; g.fillText(s, x + cw / 2, yy); g.globalAlpha = 1; g.fillStyle = c; }); }
      else { let fs = ch * 0.5; g.font = `900 ${fs}px ${FONT}`; const w = g.measureText(txt).width; if (w > cw - 70) { fs *= (cw - 70) / w; g.font = `900 ${fs}px ${FONT}`; }
        g.shadowBlur = 30; g.fillText(txt, x + cw / 2, y + ch / 2 + 4); g.shadowBlur = 8; g.fillStyle = '#fff'; g.globalAlpha = 0.55; g.fillText(txt, x + cw / 2, y + ch / 2 + 4); g.globalAlpha = 1; }
      g.restore();
    });
  });
}
const hot = (hex, k) => new THREE.Color(hex).multiplyScalar(k);

export default {
  build({ scene, look, mirror, camera }) {
    const r = rng(77), pick = a => a[Math.floor(r() * a.length)];
    scene.fog = new THREE.FogExp2(0x160a28, 0.0056);
    scene.add(sky({ top: 0x05040c, horizon: 0x3a1244, bottom: 0x0c0718, pow: 0.32, sunDir: new THREE.Vector3(0, -1, 0), sunIntensity: 0, sunGlow: 0, clouds: 0.75, cloudColor: 0x4a1c58, cloudDark: 0x0a0612, cloudScale: 0.5 }));
    scene.add(new THREE.HemisphereLight(0x5a4a9a, 0x30102a, 0.7));

    // ---- buildings: instanced boxes, every window drawn in the shader ----
    const B = [], tops = [], front = [];
    const tower = (x, z, w, d, h, isFront) => { B.push([x, h / 2, z, w, h, d]); if (isFront) front.push({ x, z, w, d, h });
      let top = h; if (h > 55 && r() < 0.75) { const k = 0.5 + r() * 0.3, h2 = h * (0.2 + r() * 0.25); B.push([x + (r() - 0.5) * w * 0.2, h + h2 / 2, z, w * k, h2, d * k]); top = h + h2;
        if (r() < 0.6) { const h3 = h * 0.14; B.push([x, top + h3 / 2, z, w * k * 0.45, h3, d * k * 0.45]); top += h3; } }
      if (top > 70) tops.push([x, top, z]); };
    for (const s of [-1, 1]) { let z = 170; while (z > -560) { const d = 16 + r() * 18; if (z < -134 && z - d > -170) { z = -166; continue; } if (z > -134 && z - d < -134) { z = -134 + d; }
        const w = 14 + r() * 14, h = 26 + r() * r() * 130; tower(s * (11 + w / 2), z - d / 2, w, d, h, true); z -= d + (r() < 0.22 ? 3 + r() * 3 : 0.5); }
      for (let z = 160; z > -620; z -= 30 + r() * 26) { if (z < -120 && z > -180) continue; const w = 22 + r() * 20; tower(s * (50 + r() * 34), z, w, w * (0.7 + r() * 0.5), 90 + r() * 170); } }
    for (let i = 0; i < 70; i++) { const x = (r() < 0.5 ? -1 : 1) * (120 + r() * 360), z = 240 - r() * 1000, w = 30 + r() * 40; tower(x, z, w, w, 170 + r() * r() * 330); }
    tower(0, -640, 120, 60, 330); tower(-150, -150, 60, 60, 260); tower(160, -150, 70, 60, 300); tower(0, 260, 150, 50, 240);
    const bg = new THREE.BoxGeometry(1, 1, 1); bg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(B.map(() => r() * 100)), 1));
    const bmat = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen },
      vertexShader: /* glsl */`attribute float aSeed; varying vec3 vW, vN, vL, vS; varying float vSeed, vD;
        void main(){ vS = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)); vL = position*vS; vN = normal; vSeed = aSeed;
          vec4 w = modelMatrix*instanceMatrix*vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
      fragmentShader: /* glsl */`varying vec3 vW, vN, vL, vS; varying float vSeed, vD; uniform float uTime; ${NOISE} ${FOG_PARS}
        vec3 neon(float s){ float h = hash11(s*13.7); return h < 0.42 ? vec3(1.0, 0.08, 0.72) : h < 0.82 ? vec3(0.0, 0.9, 1.0) : vec3(1.0, 0.62, 0.1); }
        void main(){ vec3 n = normalize(vN), col; float seed = vSeed; vec2 e = abs(vL.xz)/(vS.xz*0.5);
          if (n.y > 0.5){ vec2 q = vW.xz*0.35, id = floor(q), f = fract(q); float box = step(0.72, hash21(id + seed))*step(0.15, f.x)*step(f.x, 0.85)*step(0.15, f.y)*step(f.y, 0.85);
            col = vec3(0.012, 0.013, 0.02) + box*vec3(0.02, 0.022, 0.03) + (step(0.94, f.x) + step(0.94, f.y))*0.006;
            col += step(0.955, max(e.x, e.y))*neon(seed)*0.9*step(0.35, hash11(seed*7.0));
            col += neon(seed + 2.0)*step(0.9, hash21(id*1.7 + seed))*step(length(f - 0.5), 0.07)*(0.5 + 0.5*sin(uTime*3.0 + seed))*2.0; }
          else { float u = abs(n.x) > 0.5 ? vW.z : vW.x, v = vW.y, fw = mix(0.85, 1.5, hash11(seed*3.1)), fh = mix(2.7, 3.3, hash11(seed*5.3));
            vec2 g = vec2(u/fw + seed, v/fh), id = floor(g), f = fract(g); float style = hash11(seed*9.7);
            float win = step(0.16, f.x)*step(f.x, 0.84)*step(0.34, f.y)*step(f.y, 0.8); if (style > 0.7) win = step(0.36, f.y)*step(f.y, 0.74); else if (style < 0.2) win = step(0.3, f.x)*step(f.x, 0.7)*step(0.25, f.y)*step(f.y, 0.85);
            float rnd = hash21(id + seed*31.0), lit = step(1.0 - mix(0.1, 0.42, hash11(seed*2.3)), rnd)*step(0.3, hash11(id.y*1.7 + seed*11.0));
            // cold office light for most rooms, sodium for a few, the odd magenta one
            float tw = hash21(id*1.3 + seed); vec3 wc = tw < 0.55 ? vec3(0.45, 0.78, 1.0) : tw < 0.8 ? vec3(0.3, 1.0, 0.85) : tw < 0.93 ? vec3(1.0, 0.62, 0.3) : vec3(1.0, 0.2, 0.7);
            float it = lit*(0.25 + 1.5*hash21(id + 7.0 + seed))*(0.5 + 0.5*step(0.45, fract(f.y*3.0 + rnd)))*(0.65 + 0.35*step(0.5, fract(f.x*2.0 + rnd*3.0)));
            it *= 1.0 - step(0.98, hash21(id + seed*5.0))*step(0.5, fract(uTime*3.0 + rnd*10.0)); float fade = smoothstep(700.0, 160.0, vD);
            // the wall itself: panels, floor slabs, conduits, air-conditioning boxes, grime running down
            float panel = hash21(floor(vec2(u/(fw*3.0), v/(fh*2.0))) + seed), grime = fbm(vec2(u*0.35, v*0.06) + seed);
            vec3 base = vec3(0.02, 0.022, 0.032)*(0.45 + 0.9*panel)*(0.6 + 0.7*grime) + vec3(0.014)*step(0.93, f.y); base *= 1.0 - 0.55*step(0.975, fract(u*0.21 + seed*3.0));
            float ac = step(0.86, hash21(id*3.3 + seed))*step(0.3, f.x)*step(f.x, 0.7)*step(0.06, f.y)*step(f.y, 0.26); base = mix(base, vec3(0.05, 0.052, 0.06), ac*fade);
            // street light climbing the first storeys, signs staining the walls above
            float lane = hash11(seed*4.4 + floor(u/22.0)); vec3 stain = mix(vec3(1.0, 0.1, 0.7), vec3(0.05, 0.85, 1.0), step(0.5, lane));
            vec3 glow = stain*(exp(-v/9.0)*0.06 + exp(-abs(v - (10.0 + lane*30.0))/7.0)*0.05*fbm(vec2(u*0.2, uTime*0.4 + seed)));
            col = base + glow*(0.5 + grime) + wc*mix(lit*0.14, it*win*0.9, fade);
            // neon: corner tubes, a trim line over the shop floor, bands up the tower
            col += step(0.975, abs(n.x) > 0.5 ? e.y : e.x)*step(0.45, hash11(seed*6.6))*neon(seed)*1.7;
            col += smoothstep(0.1, 0.0, abs(v - 7.4))*step(0.3, hash11(seed*3.3))*neon(seed + 0.7)*1.4;
            col += step(0.92, fract(v/(fh*floor(mix(7.0, 14.0, hash11(seed))))))*step(0.5, hash11(seed*8.8))*neon(seed + 0.3)*0.8;
            col *= 0.3 + 0.7*smoothstep(0.0, 3.5, v); }
          gl_FragColor = vec4(applyFog(col, vD), 1.0); }` });
    const bm = new THREE.InstancedMesh(bg, bmat, B.length), o = new THREE.Object3D();
    B.forEach((b, i) => { o.position.set(b[0], b[1], b[2]); o.scale.set(b[3], b[4], b[5]); o.updateMatrix(); bm.setMatrixAt(i, o.matrix); }); bm.frustumCulled = false; scene.add(bm);

    // ---- signage: two glyph atlases, every sign a quad in one merged mesh ----
    const tV = atlas(VERT, 256, 512, true), tW = atlas(WIDE, 512, 256, false), gV = [], gW = [], halo = [];
    const quad = (list, cell, w, h, p, ry) => { for (const flip of [0, Math.PI]) { const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv, cx = cell % 8, cy = Math.floor(cell / 8);
        for (let i = 0; i < uv.count; i++) uv.setXY(i, (cx + uv.getX(i)) / 8, 1 - (cy + 1 - uv.getY(i)) / 4); list.push(xform(g, { p, r: [0, ry + flip, 0] })); } };
    const struct = new Builder(), emis = new Builder();
    for (const f of front) { const s = Math.sign(f.x), fx = s * 11; let n = 3 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++) { const h = 4 + r() * r() * 9, w = h * 0.42, y = 5 + r() * Math.min(72, f.h - 8), z = f.z + (r() - 0.5) * f.d * 0.8, cell = Math.floor(r() * 32);
        quad(gV, cell, w, h, [fx - s * (w / 2 + 0.35), y, z], 0); struct.box(w + 0.6, 0.12, 0.12, { p: [fx - s * (w / 2 + 0.3), y + h / 2 - 0.3, z - 0.12], c: 0x15151c }).box(w + 0.6, 0.12, 0.12, { p: [fx - s * (w / 2 + 0.3), y - h / 2 + 0.3, z - 0.12], c: 0x15151c });
        halo.push({ p: [fx - s * (w / 2 + 0.35), y, z], s: h * 2.4, c: PAL[(cell * 5 + 1) % PAL.length] }); }
      if (f.h > 64) { const w = Math.min(f.d - 2, 14 + r() * 10); quad(gW, Math.floor(r() * 32), w, w / 2, [fx - s * 0.14, f.h * (0.55 + r() * 0.25), f.z], s * -Math.PI / 2); }
      for (let k = 0, m = 1 + Math.floor(r() * 2.5); k < m; k++) { const w = 6 + r() * 8, h = w * 0.5, y = 9 + r() * Math.min(56, f.h - 12); quad(gW, Math.floor(r() * 32), w, h, [fx - s * 0.12, y, f.z + (r() - 0.5) * f.d * 0.4], s * -Math.PI / 2); }
      // shopfronts, awnings
      let z = f.z - f.d / 2 + 1; while (z < f.z + f.d / 2 - 3) { const w = 2.6 + r() * 3.4, c = hot(pick([0xffc27a, 0x7ad8ff, 0xff7ad0, 0xfff0d0, 0x9affc0]), 0.7 + r() * 0.9);
        if (r() < 0.8) { emis.box(0.06, 2.3, w, { p: [fx - s * 0.04, 1.75, z + w / 2], c }); struct.box(1.5, 0.1, w + 0.4, { p: [fx - s * 0.7, 3.25, z + w / 2], r: [0, 0, s * 0.18], c: pick([0x2a1420, 0x10202a, 0x1c1c22]) })
          .box(0.08, 2.3, 0.1, { p: [fx - s * 0.06, 1.75, z + w * 0.33], c: 0x0a0a0e }).box(0.08, 2.3, 0.1, { p: [fx - s * 0.06, 1.75, z + w * 0.66], c: 0x0a0a0e }); if (r() < 0.5) quad(gW, Math.floor(r() * 32), w * 0.9, w * 0.45 * 0.6, [fx - s * 0.2, 3.9, z + w / 2], s * -Math.PI / 2); }
        z += w + 0.6 + r() * 1.5; } }
    // rooftop billboards facing up the street
    [[-26, 62, -40, 22], [30, 88, -96, 28], [0, 150, -606, 70], [-34, 70, -236, 24], [36, 54, 30, 18], [-150, 120, -118, 40], [160, 140, -118, 46], [28, 110, -300, 30]].forEach(([x, y, z, w], i) => { quad(gW, (i * 5 + 2) % 32, w, w / 2, [x, y, z], 0);
      struct.box(w + 1, w / 2 + 1, 0.4, { p: [x, y, z - 0.4], c: 0x08080c }).box(0.5, y, 0.5, { p: [x - w * 0.3, y / 2, z - 0.8], c: 0x0c0c12 }).box(0.5, y, 0.5, { p: [x + w * 0.3, y / 2, z - 0.8], c: 0x0c0c12 }); });
    const smat = t => new THREE.ShaderMaterial({ uniforms: { map: { value: t }, uTime: U.uTime, uFogDen: U.uFogDen }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: 'varying vec2 vUv; varying vec3 vW; varying float vD; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }',
      fragmentShader: `uniform sampler2D map; uniform float uTime, uFogDen; varying vec2 vUv; varying vec3 vW; varying float vD; ${NOISE}
        void main(){ vec3 c = texture2D(map, vUv).rgb; float id = hash21(floor(vW.xz*0.13) + floor(vW.y*0.09)), fl = 0.92 + 0.08*sin(uTime*37.0 + id*30.0);
          if (id > 0.84) fl *= 0.2 + 0.8*step(0.3, vnoise(vec2(uTime*8.0 + id*40.0, id*7.0)));             // a tube on its way out
          gl_FragColor = vec4(c*1.75*fl*(0.84 + 0.16*sin(vW.y*24.0 - uTime*4.0))*exp(-uFogDen*uFogDen*vD*vD*0.5), 1.0); }` });
    scene.add(new THREE.Mesh(merge(gV), smat(tV)), new THREE.Mesh(merge(gW), smat(tW)));

    // ---- street furniture: lamps, vending machines, vents, elevated rail, cables ----
    const lampC = [0x00e5ff, 0xff2bd6];
    for (let i = 0, z = 150; z > -540; z -= 22, i++) { const s = i % 2 ? 1 : -1, c = lampC[Math.floor(i / 2) % 2];
      struct.cyl(0.09, 0.13, 7, 6, { p: [s * 8.6, 3.5, z], c: 0x1a1a22 }).box(2.2, 0.1, 0.14, { p: [s * 7.6, 6.95, z], c: 0x1a1a22 }); emis.box(1.3, 0.07, 0.3, { p: [s * 7.2, 6.86, z], c: hot(c, 2.5) });
      halo.push({ p: [s * 7.2, 6.8, z], s: 5, c }); if (z > -260 && i % 2 === 0) { const l = new THREE.PointLight(c, 50, 30, 1.7); l.position.set(s * 6.5, 6.2, z); scene.add(l); } }
    for (let i = 0; i < 46; i++) { const s = r() < 0.5 ? -1 : 1, z = 150 - r() * 600, c = pick([0xff2bd6, 0x00f0ff, 0xffe14d, 0xffffff]); if (z < -134 && z > -166) continue;
      struct.box(0.9, 1.9, 1.1, { p: [s * 10.3, 0.95, z], c: 0x14141c }); emis.box(0.05, 1.3, 0.85, { p: [s * 9.84, 1.15, z], c: hot(c, 1.6) }); halo.push({ p: [s * 9.7, 1.2, z], s: 2.2, c }); }
    // noodle stalls with lantern strings
    for (let i = 0; i < 16; i++) { const sd = i % 2 ? 1 : -1, z = 132 - i * 31 - r() * 8, x = sd * 9.9; if (z < -134 && z > -166) continue; const ac = pick([0x7a1420, 0x10405a, 0x5a3a10]);
      struct.box(1.3, 1.0, 3.4, { p: [x, 0.5, z], c: 0x1a1a22 }).box(2.2, 0.1, 3.9, { p: [x - sd * 0.5, 2.75, z], r: [0, 0, sd * 0.2], c: ac }).box(0.08, 2.7, 0.08, { p: [x - sd * 1.3, 1.35, z - 1.8], c: 0x22222a }).box(0.08, 2.7, 0.08, { p: [x - sd * 1.3, 1.35, z + 1.8], c: 0x22222a });
      emis.box(0.06, 1.1, 3.0, { p: [x + sd * 0.62, 1.85, z], c: hot(0xffc27a, 1.5) }).box(1.25, 0.05, 3.3, { p: [x, 1.03, z], c: hot(0xff9a4a, 0.5) }); halo.push({ p: [x, 1.9, z], s: 6, c: 0xffa860 });
      for (let k = -2; k <= 2; k++) { emis.sph(0.2, { p: [x - sd * 1.35, 2.35 - Math.abs(k) * 0.05, z + k * 0.78], s: [1, 1.25, 1], c: hot(0xff2a1e, 2.6) }, 8, 6); halo.push({ p: [x - sd * 1.35, 2.35, z + k * 0.78], s: 1.5, c: 0xff3020 }); } }
    const folk = []; for (let i = 0; i < 190; i++) { const cross = i < 34, sd = r() < 0.5 ? -1 : 1, z = cross ? (i % 2 ? -132 : -168) + (r() - 0.5) * 3.6 : 146 - r() * 660, x = cross ? (r() - 0.5) * 15 : sd * (8.7 + r() * 1.7); if (!cross && z < -136 && z > -164) continue; folk.push([x, z, 0.92 + r() * 0.2, pick([0x12f0ff, 0xff2bd6, 0xffe14d, 0xffffff, 0x9a6aff, 0xff5a36])]); }
    scene.add(instanced(new THREE.CapsuleGeometry(0.2, 1.1, 4, 8).translate(0, 0.78, 0), new THREE.MeshStandardMaterial({ color: 0x0c0c12, roughness: 0.55, metalness: 0.2 }), folk.length, (i, d) => { d.position.set(folk[i][0], 0, folk[i][1]); d.scale.setScalar(folk[i][2]); }));
    scene.add(instanced(new THREE.ConeGeometry(0.74, 0.28, 14, 1, true).translate(0, 2.0, 0), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.62, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }), folk.length, (i, d, c) => { d.position.set(folk[i][0], 0, folk[i][1]); d.scale.setScalar(folk[i][2]); d.rotation.set((r() - 0.5) * 0.2, r() * 6, (r() - 0.5) * 0.2); c.set(folk[i][3]).multiplyScalar(0.85); }));
    folk.forEach((f, i) => { if (i % 2) halo.push({ p: [f[0], 1.95 * f[2], f[1]], s: 2.2, c: f[3] }); });
    // bollards, curbs, bins
    for (let z = 150; z > -540; z -= 5.5) for (const s of [-1, 1]) { if (z < -134 && z > -166) continue; struct.cyl(0.09, 0.09, 0.8, 6, { p: [s * 8.25, 0.4, z], c: 0x26262e }); emis.box(0.2, 0.05, 0.2, { p: [s * 8.25, 0.78, z], c: hot(0xff5a36, 1.5) }); }
    // elevated rail lines across the canyon
    for (const [z, y] of [[-58, 15], [-246, 22], [70, 30]]) { struct.box(260, 1.3, 5.4, { p: [0, y, z], c: 0x101018 }).box(260, 0.5, 0.3, { p: [0, y + 1, z - 2.6], c: 0x18181f }).box(260, 0.5, 0.3, { p: [0, y + 1, z + 2.6], c: 0x18181f });
      for (const x of [-9.6, 9.6, -46, 46]) struct.box(1.3, y, 1.6, { p: [x, y / 2, z], c: 0x0e0e15 }); emis.box(260, 0.08, 0.2, { p: [0, y - 0.68, z + 2.4], c: hot(0x00e5ff, 2.2) }).box(260, 0.08, 0.2, { p: [0, y - 0.68, z - 2.4], c: hot(0xff2bd6, 2.2) }); }
    // rooftop masts
    const beacons = []; tops.forEach(([x, y, z]) => { const h = 8 + r() * 26; struct.box(0.4, h, 0.4, { p: [x, y + h / 2, z], c: 0x0c0c12 }).box(3, 0.2, 0.2, { p: [x, y + h * 0.7, z], c: 0x0c0c12 }); beacons.push([x, y + h, z]); });
    scene.add(struct.mesh(stdMat({ roughness: 0.45, metalness: 0.5 }), false), new THREE.Mesh(emis.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true })));
    scene.add(points({ count: beacons.length, size: 5, gain: 2.2, color: 0xff2020, spawn: (i, v) => v.set(...beacons[i]), motion: 'a *= smoothstep(0.55, 0.9, sin(uTime*2.2 + s.x*6.28)); sz = 1.0;', minPx: 2 }));
    // cables with strings of bulbs
    const cab = [], bulbs = [];
    for (let i = 0; i < 80; i++) { const z0 = 150 - r() * 620, z1 = z0 + (r() - 0.5) * 14, y0 = 7 + r() * 22, y1 = y0 + (r() - 0.5) * 6, sag = 1 + r() * 2.6, lit = r() < 0.3, c = pick([0xffb060, 0xff4a8a, 0x7ae0ff]);
      for (let k = 0; k < 14; k++) { const q = u => [lerp(-11, 11, u), lerp(y0, y1, u) - Math.sin(u * Math.PI) * sag, lerp(z0, z1, u)]; cab.push(...q(k / 14), ...q((k + 1) / 14)); if (lit && k) bulbs.push({ p: q(k / 14), s: 0.9, c }); } }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cab), 3)); scene.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0x06060a })));
    scene.add(glows(bulbs, { gain: 3 }), glows(halo, { gain: 0.035, flicker: 0.25 }));

    // train crossing on the nearest line
    const tb = new Builder(), te = new Builder();
    for (let i = 0; i < 6; i++) { tb.box(15.4, 3, 3.2, { p: [i * 16, 17.9, -58], c: 0x1c1c26 }); te.box(14, 0.9, 3.24, { p: [i * 16, 18.3, -58], c: hot(0xffe2b0, 2.2) }).box(15.4, 0.1, 3.26, { p: [i * 16, 16.7, -58], c: hot(0x00e5ff, 2) }); }
    const train = new THREE.Group(); train.add(tb.mesh(stdMat({ metalness: 0.6, roughness: 0.4 }), false), new THREE.Mesh(te.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true }))); scene.add(train);

    // ---- wet street with a planar mirror, puddles and rain rings ----
    const mt = mirror(0);
    const street = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uRes: U.uRes, uFogCol: U.uFogCol, uFogDen: U.uFogDen, tM: { value: mt } },
      vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }',
      fragmentShader: /* glsl */`varying vec3 vW; varying float vD; uniform float uTime; uniform vec2 uRes; uniform sampler2D tM; ${NOISE} ${FOG_PARS}
        vec3 ring(vec2 p, float sc, float sp){ vec2 g = p*sc, id = floor(g), f = fract(g) - 0.5; float h = hash21(id), t = fract(uTime*sp + h*7.0); vec2 d = f - (hash22(id) - 0.5)*0.5; float l = length(d);
          float w = smoothstep(0.035, 0.0, abs(l - t*0.42))*(1.0 - t)*step(0.74, h); return vec3(d/max(l, 0.001)*w, w); }
        void main(){ vec2 p = vW.xz; float road = step(abs(p.x), 8.0); float cross = step(abs(p.y + 150.0), 14.0); road = max(road, cross);
          float n = fbm(p*1.7); vec3 base = mix(vec3(0.05, 0.05, 0.058), vec3(0.016, 0.017, 0.022), road)*(0.65 + 0.7*n);
          if (road < 0.5){ vec2 t = fract(p/1.5); base *= 0.75 + 0.25*step(0.04, t.x)*step(0.04, t.y); }
          float mk = step(abs(p.x), 0.09)*step(0.5, fract(p.y/7.0)) + step(abs(abs(p.x) - 7.4), 0.07) + step(abs(abs(p.x) - 3.7), 0.05)*step(0.6, fract(p.y/5.0))*0.5;
          float zc = min(abs(p.y + 132.0), abs(p.y + 168.0)); mk = mk*(1.0 - cross) + step(zc, 2.2)*step(0.5, fract(p.x/1.3))*step(abs(p.x), 8.0);
          float pud = smoothstep(0.42, 0.6, fbm(p*0.16 + 3.0))*road + smoothstep(0.55, 0.7, fbm(p*0.3 + 9.0))*(1.0 - road)*0.6;
          vec3 r1 = ring(p, 1.3, 0.9), r2 = ring(p + 3.7, 2.1, 1.3); vec2 nrm = (r1.xy + r2.xy)*0.05*pud + (vec2(fbm(p*5.0), fbm(p*5.0 + 7.0)) - 0.5)*0.03*(1.0 - pud*0.85);
          vec3 V = normalize(cameraPosition - vW); vec2 suv = gl_FragCoord.xy/uRes; suv.y = 1.0 - suv.y; suv += nrm*(0.25 + 6.0/(vD + 6.0));
          vec3 rf = vec3(0.0); float sp = mix(0.03, 0.002, pud)*(0.3 + 14.0/(vD + 14.0));
          for (int i = -3; i <= 3; i++) rf += texture2D(tM, clamp(suv + vec2(0.0, float(i)*sp), 0.002, 0.998)).rgb; rf /= 7.0;
          float fr = mix(0.22, 0.95, pud)*(0.35 + 0.65*pow(1.0 - max(V.y, 0.0), 3.0));
          vec3 c = base*(1.0 - pud*0.6) + vec3(0.42, 0.42, 0.38)*mk*(1.0 - pud*0.7)*(0.6 + 0.4*n) + rf*fr + (r1.z + r2.z)*pud*rf*0.6;
          gl_FragColor = vec4(applyFog(c, vD), 1.0); }` }));
    street.userData.noMirror = true; scene.add(street);

    // ---- rain, steam, traffic ----
    const camU = { value: new THREE.Vector3() };
    scene.add(points({ count: 2400, size: 0.55, shape: 'streak', color: 0x9ab8ff, gain: 1.0, opacity: 0.2, fog: false, uniforms: { uCam: camU }, spawn: (i, v, q) => v.set(q() * 80, q() * 60, q() * 80),
      motion: 'p.y = mod(p.y - uTime*(34.0 + s.x*14.0), 60.0) - 12.0 + uCam.y; p.x = mod(p.x - uCam.x, 80.0) - 40.0 + uCam.x + (p.y - uCam.y)*0.04; p.z = mod(p.z - uCam.z, 80.0) - 40.0 + uCam.z; sz = 0.5 + s.y; if (p.y < 0.0) a = 0.0;' }));
    const vents = Array.from({ length: 14 }, () => [(r() < 0.5 ? -1 : 1) * (6 + r() * 3.5), 0.1, 140 - r() * 520]);
    scene.add(points({ count: 14 * 26, size: 2.4, opacity: 0.11, gain: 1, additive: true, spawn: (i, v) => v.set(...vents[i % 14]), colorFn: (i, c) => c.set(i % 28 < 14 ? 0xd070c8 : 0x60b8e0),
      motion: 'float age = fract(uTime*0.13 + s.x); p.y += age*11.0; p.x += (s.y - 0.5)*age*4.0 + sin(age*5.0 + s.z*6.0)*0.6; p.z += (s.z - 0.5)*age*4.0; sz = 0.6 + age*3.2; a = age*(1.0 - age)*4.0;' }));
    const cars = []; for (const [x, y] of [[-4, 24], [4.5, 27], [-5, 46], [5, 50], [-3.5, 72], [4, 78], [-26, 110], [28, 122]]) for (let i = 0; i < 16; i++) { const z = -520 + r() * 680; cars.push([x - 0.7, y, z], [x + 0.7, y, z], [x, y, z]); }
    for (const [z, y] of [[-146, 36.5], [-154, 40.5], [-145, 60.5], [-155, 64.5]]) for (let i = 0; i < 12; i++) { const x = -300 + r() * 600; cars.push([x, y, z - 0.7], [x, y, z + 0.7], [x, y, z]); }
    scene.add(points({ count: cars.length, size: 0.8, gain: 3, spawn: (i, v) => v.set(...cars[i]), minPx: 1.5,
      motion: `float spd = 16.0 + 12.0*hash11(position.y*3.1); sz = mod(float(gl_VertexID), 3.0) > 1.5 ? 4.5 : 1.0; if (sz > 2.0) a = 0.22;
        if (fract(position.y) > 0.4 && fract(position.y) < 0.6){ float d = sign(position.z + 150.0); p.x = mod(p.x + d*uTime*spd + 300.0, 600.0) - 300.0; col = d > 0.0 ? vec3(1.0, 0.1, 0.12) : vec3(0.85, 0.92, 1.0); }
        else { float d = sign(position.x); p.z = mod(p.z + d*uTime*spd + 520.0, 680.0) - 520.0; col = d < 0.0 ? vec3(1.0, 0.1, 0.12) : vec3(0.85, 0.92, 1.0); }` }));

    // ---- hologram over the crossing ----
    const holo = new THREE.Group(); holo.position.set(0, 34, -150); scene.add(holo);
    const ht = canvasTex(2048, 128, (g, W, Hh) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, Hh); g.font = `900 78px ${FONT}`; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 12; g.fillText('NEON RAIN ◆ 電脳都市 ◆ SECTOR 07 ◆ 雨は止まない ◆ ', 10, 68); }, { repeat: [2, 1] });
    const hm = (t, k, c = 0x18e8ff) => new THREE.MeshBasicMaterial({ map: t, color: hot(c, k), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 3.4, 96, 1, true), hm(ht, 1.0)), ring2 = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 2, 96, 1, true), hm(ht, 0.6, 0xff2bd6)); ring2.position.y = -6; ring1.position.y = 7;
    const scan = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec3 vN, vV, vP; void main(){ vP = position; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'varying vec3 vN, vV, vP; uniform float uTime; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), vV)), 2.0); float s = 0.55 + 0.45*sin(vP.y*9.0 - uTime*5.0); float g = step(0.96, fract(vP.y*0.5 + uTime*0.15)); gl_FragColor = vec4(vec3(0.1, 0.9, 1.0)*(f*s*1.3 + g*0.8 + 0.04), 1.0); }' });
    const kb = new THREE.SphereGeometry(1, 44, 22); { const q = kb.attributes.position; for (let i = 0; i < q.count; i++) { const z = q.getZ(i), t = (z + 1) / 2, k = 0.22 + 0.78 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.08)), 0.7); q.setXYZ(i, q.getX(i) * k * 0.72, q.getY(i) * k, z * 4.2); } kb.computeVertexNormals(); }
    const fin = (sx, sy, sz, p2, r2) => xform(new THREE.CylinderGeometry(0.02, 1, 1, 12, 1).rotateX(Math.PI / 2), { p: p2, r: r2, s: [sx, sy, sz] });
    const koiG = merge([kb, fin(0.05, 1.7, 2.6, [0, 0, -5.3], [0, 0, 0]), fin(0.05, 0.9, 1.6, [0, 1.0, 0.3], [-0.5, 0, 0]), fin(1.0, 0.05, 1.2, [0.85, -0.35, 1.7], [0, 0.6, -0.4]), fin(1.0, 0.05, 1.2, [-0.85, -0.35, 1.7], [0, -0.6, 0.4])]); koiG.scale(2.7, 2.7, 2.7);
    const koi = new THREE.Mesh(koiG, new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec3 vN, vV, vP, vW; uniform float uTime; void main(){ vec3 p = position; float w = smoothstep(5.0, -15.0, p.z); p.x += sin(p.z*0.42 - uTime*2.6)*1.9*w*w; vP = position; vec4 wp = modelMatrix*vec4(p,1.0); vW = wp.xyz; vec4 mv = viewMatrix*wp; vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: `varying vec3 vN, vV, vP, vW; uniform float uTime; ${NOISE}
        void main(){ float f = pow(1.0 - abs(dot(normalize(vN), vV)), 1.5), scl = 0.5 + 0.5*sin(vP.z*4.6)*sin(atan(vP.y, vP.x)*9.0), pt = smoothstep(0.48, 0.58, fbm3(vP*0.2 + 3.0));
          vec3 c = mix(vec3(0.08, 0.9, 1.0), vec3(1.0, 0.22, 0.72), pt); float scan = 0.6 + 0.4*sin(vW.y*5.0 - uTime*6.0), bar = step(0.985, fract(vW.y*0.11 + uTime*0.2));
          gl_FragColor = vec4(c*((f*1.5 + scl*0.2 + 0.08)*scan + bar*0.9), 1.0); }` })); koi.position.set(22, 0, 0); koi.rotation.y = Math.PI;
    const koi2 = koi.clone(); koi2.position.set(-22, 5, 0); koi2.rotation.y = 0; koi2.scale.setScalar(0.7);
    const core = new THREE.Group(); core.add(koi, koi2);
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(10.5, 1)), new THREE.LineBasicMaterial({ color: hot(0x18e8ff, 1.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(15, 1.2, 34, 48, 1, true).translate(0, -17, 0), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform float uTime; void main(){ float s = 0.5 + 0.5*sin(vUv.x*240.0 + sin(uTime)*3.0); gl_FragColor = vec4(vec3(0.08, 0.75, 1.0)*vUv.y*vUv.y*0.2*(0.4 + 0.6*s), 1.0); }' }));
    holo.add(ring1, ring2, core, wire, beam);
    const hl = new THREE.PointLight(0x18e8ff, 900, 120, 1.6); hl.position.set(0, 26, -150); scene.add(hl);

    const beamG = new THREE.CylinderGeometry(18, 0.6, 320, 20, 1, true).translate(0, 160, 0), beamM = new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; void main(){ gl_FragColor = vec4(vec3(0.55, 0.8, 1.0)*pow(clamp(1.0 - vUv.y, 0.0, 1.0), 1.6)*0.07, 1.0); }' });
    const beams = [[-60, 150, -70], [70, 190, -240], [-90, 230, -330], [120, 170, 20], [-140, 260, -160]].map(([x, y, z]) => { const m = new THREE.Mesh(beamG, beamM); m.position.set(x, y, z); scene.add(m); return m; });
    const blimp = new THREE.Group(), bq = []; quad(bq, 6, 34, 17, [0, 0, 9.3], 0); quad(bq, 19, 34, 17, [0, 0, -9.3], Math.PI);
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.4, metalness: 0.7 })); hull.scale.set(30, 10, 9); blimp.add(hull, new THREE.Mesh(merge(bq), smat(tW)));
    blimp.add(new THREE.Mesh(new THREE.BoxGeometry(9, 2.4, 3.4).translate(0, -10.4, 0), new THREE.MeshStandardMaterial({ color: 0x0c0c12 })), new THREE.Mesh(new THREE.BoxGeometry(60.4, 0.2, 0.2).translate(0, -9.2, 0), new THREE.MeshBasicMaterial({ color: hot(0xff2bd6, 2.4) })));
    blimp.position.set(0, 132, -250); scene.add(blimp);
    scene.add(points({ count: 190, size: 40, opacity: 0.05, gain: 1, fog: false, seed: 21, spawn: (i, v, q) => v.set((q() - 0.5) * 26, 2 + q() * q() * 46, 150 - q() * 660), colorFn: (i, c, q) => c.set(pick([0xff2bd6, 0x12e0ff, 0xff2bd6, 0x12e0ff, 0xffa040])), motion: 'p.x += sin(uTime*0.07 + s.x*20.0)*5.0; p.y += sin(uTime*0.05 + s.y*20.0)*2.0; sz = 0.5 + s.z; a *= 0.55 + 0.45*sin(uTime*0.3 + s.w*20.0);' }));
    Object.assign(look, { bloom: 0.55, bloomThreshold: 1.0, bloomKnee: 0.6, bloomRadius: 0.8, vignette: 0.75, aberration: 1.4, contrast: 1.12, saturation: 1.25, exposure: 1.0, grain: 0.05 });
    look.lift.setRGB(0.028, 0.006, 0.045); look.gain.setRGB(1.0, 0.96, 1.1); look.saturation = 1.34; look.bloom = 0.72; look.exposure = 1.12;
    return {
      parallax: 0.35,
      rail: [
        { p: 0, pos: [1.5, 2.1, 128], look: [0, 16, -40], fov: 62 },
        { p: 0.16, pos: [-3.5, 1.2, 66], look: [2, 6.5, -50], fov: 56 },
        { p: 0.33, pos: [4.5, 4.5, -8], look: [-2, 12, -150], fov: 52 },
        { p: 0.5, pos: [-1.2, 30, -66], look: [1, 27, -220], fov: 58 },
        { p: 0.68, pos: [-9, 5.5, -116], look: [0, 31, -150], fov: 60 },
        { p: 0.84, pos: [18, 74, -196], look: [0, 44, -330], fov: 54 },
        { p: 1, pos: [0, 215, -70], look: [0, 60, -430], fov: 50 } ],
      update(t, p) {
        camU.value.copy(camera.position); ht.offset.x = t * 0.03; ring1.rotation.y = t * 0.1; ring2.rotation.y = -t * 0.07; core.rotation.y = t * 0.2; core.position.y = Math.sin(t * 0.45) * 4; koi.rotation.z = Math.sin(t * 0.7) * 0.12; beams.forEach((m, i) => { m.rotation.set(Math.sin(t * 0.21 + i * 1.7) * 0.55, 0, Math.cos(t * 0.17 + i * 2.3) * 0.55); }); blimp.position.x = ((t * 5 + 180) % 760) - 380; wire.rotation.set(-t * 0.1, t * 0.13, 0);
        train.position.x = ((t * 26) % 520) - 330; hl.intensity = 850 + Math.sin(t * 9) * 80 + (Math.sin(t * 1.7) > 0.96 ? -500 : 0);
        scene.fog.density = lerp(0.0056, 0.0027, smooth(0.75, 1, p));
      },
    };
  },
};
