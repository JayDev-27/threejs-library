// 06 Space · Event Horizon: a living planet, a debris belt, a ringed giant, a stellar nursery and a black hole.
import * as THREE from '../lib/three.module.min.js';
import { U, NOISE, Builder, stdMat, groundMat, instanced, sky, points, glows, rng, lerp, smooth, win, TAU } from '../lib/kit.js';
import { boulder } from '../lib/flora.js';

const V3 = THREE.Vector3, VS = 'varying vec3 vP, vN, vV, vW; void main(){ vP = normalize(position); vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }';

export default {
  build({ scene, look, camera }) {
    const r = rng(31), SUN = new V3(1, 0.28, 0.55).normalize(), uSun = { value: SUN };
    const dome = sky({ top: 0x000000, horizon: 0x000000, bottom: 0x000000, sunDir: SUN, sunColor: 0xfff4e0, sunSize: 0.00012, sunIntensity: 260, sunGlow: 0.5, stars: 2.6, nebula: 0.22, nebulaA: 0x3a1470, nebulaB: 0x0a4a6a }); scene.add(dome);
    scene.add(new THREE.AmbientLight(0x30406a, 0.22)); const sun = new THREE.DirectionalLight(0xfff2e0, 3.4); sun.position.copy(SUN).multiplyScalar(100); scene.add(sun);

    // ---- the home planet: oceans, continents, weather, city lights, air ----
    const earth = new THREE.Group(); scene.add(earth);
    const eM = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uSun }, vertexShader: VS, fragmentShader: /* glsl */`varying vec3 vP, vN, vV; uniform float uTime; uniform vec3 uSun; ${NOISE}
      float hgt(vec3 p){ return fbm3(p*1.9 + fbm3(p*4.3 + 3.0)*0.55) + 0.12*fbm3(p*9.0); }
      void main(){ vec3 N = normalize(vN); float h = hgt(vP), lat = abs(vP.y), land = smoothstep(0.5, 0.525, h);
        vec3 sea = mix(vec3(0.004, 0.018, 0.07), vec3(0.01, 0.12, 0.2), smoothstep(0.36, 0.5, h));
        vec3 gr = mix(vec3(0.03, 0.11, 0.025), vec3(0.09, 0.16, 0.04), fbm3(vP*14.0)), ds = vec3(0.36, 0.27, 0.14);
        vec3 ld = mix(gr, ds, smoothstep(0.1, 0.0, abs(lat - 0.3) - 0.1 + (fbm3(vP*5.0) - 0.5)*0.3)); ld = mix(ld, vec3(0.2, 0.17, 0.14), smoothstep(0.6, 0.68, h)); ld = mix(ld, vec3(0.9), smoothstep(0.68, 0.74, h));
        float ice = smoothstep(0.8, 0.88, lat + (fbm3(vP*6.0) - 0.5)*0.16); vec3 sf = mix(mix(sea, ld, land), vec3(0.92, 0.96, 1.0), ice);
        float e = 0.012; vec3 bn = normalize(N + (vec3(hgt(vP + vec3(e, 0, 0)), hgt(vP + vec3(0, e, 0)), hgt(vP + vec3(0, 0, e))) - h)/e*-0.045*land);
        vec3 q = vP*2.6 + vec3(uTime*0.006, 0.0, uTime*0.003); float sw = fbm3(q*1.4); q += vec3(sw, -sw, sw*0.5)*0.55; float cl = smoothstep(0.5, 0.72, fbm3(q*1.6) + 0.25*fbm3(q*6.0) - 0.08);
        float cls = smoothstep(0.5, 0.72, fbm3((q + uSun*0.03)*1.6) + 0.25*fbm3((q + uSun*0.03)*6.0) - 0.08);
        float nl = dot(bn, uSun), day = smoothstep(-0.12, 0.3, dot(N, uSun));
        vec3 c = sf*max(nl, 0.0)*1.5*(1.0 - cls*0.5) + vec3(1.0, 0.92, 0.8)*pow(max(dot(reflect(-uSun, N), vV), 0.0), 70.0)*(1.0 - land)*(1.0 - cl)*1.6*day;
        c = mix(c, vec3(1.0)*max(dot(N, uSun), 0.0)*1.5 + vec3(0.02, 0.03, 0.05), cl*0.95);
        float city = step(0.62, fbm3(vP*36.0))*smoothstep(0.55, 0.75, fbm3(vP*7.0 + 5.0))*land*(1.0 - ice); c += vec3(1.0, 0.66, 0.28)*city*(1.0 - day)*(1.0 - cl)*1.6;
        float rim = pow(1.0 - max(dot(N, vV), 0.0), 3.0); c += vec3(0.25, 0.5, 1.0)*rim*day*0.9 + vec3(1.0, 0.35, 0.12)*smoothstep(-0.12, 0.05, dot(N, uSun))*smoothstep(0.28, 0.05, dot(N, uSun))*0.05;
        gl_FragColor = vec4(c, 1.0); }` });
    earth.add(new THREE.Mesh(new THREE.SphereGeometry(30, 160, 100), eM));
    earth.add(new THREE.Mesh(new THREE.SphereGeometry(31.3, 96, 64), new THREE.ShaderMaterial({ uniforms: { uSun }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, vertexShader: VS,
      fragmentShader: 'varying vec3 vN, vV; uniform vec3 uSun; void main(){ vec3 N = normalize(vN); float f = pow(clamp(1.0 + dot(N, vV), 0.0, 1.0), 0.9)*pow(clamp(-dot(N, vV)*3.2, 0.0, 1.0), 1.6); float d = smoothstep(-0.12, 0.25, dot(N, uSun)); gl_FragColor = vec4(mix(vec3(1.0, 0.5, 0.25), vec3(0.3, 0.58, 1.0), smoothstep(-0.1, 0.12, dot(N, uSun)))*f*d*1.2, 1.0); }' })));
    const moonM = groundMat({ scale: 0.35, detail: 1.6, bump: 1.6, contrast: 0.7, vertexColors: false, color: 0xa8a6a2, roughness: 1 });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(6, 64, 40), moonM); scene.add(moon);
    // a station in low orbit
    const sb = new Builder(); sb.cyl(0.5, 0.5, 5, 16, { r: [0, 0, Math.PI / 2], c: 0xd8dce4 }).cyl(0.75, 0.75, 1.6, 16, { p: [1.2, 0, 0], r: [0, 0, Math.PI / 2], c: 0xb8bcc8 }).sph(0.8, { p: [-2.8, 0, 0], c: 0xe8ecf4 }).box(0.12, 9, 0.12, { c: 0x8a8e98 }).tor(1.8, 0.16, { p: [1.2, 0, 0], r: [0, Math.PI / 2, 0], c: 0xc8ccd8 });
    for (const s of [-1, 1]) for (const k of [-1, 1]) sb.box(3.4, 0.04, 1.5, { p: [k * 2.1, s * 3.6, 0], c: 0x1c2a6a }).box(3.4, 0.05, 0.05, { p: [k * 2.1, s * 3.6, 0], c: 0xc8b070 });
    const station = sb.mesh(stdMat({ roughness: 0.35, metalness: 0.75 }), false); station.scale.setScalar(0.36); scene.add(station);

    // ---- the belt ----
    const rock = groundMat({ scale: 0.6, detail: 3.5, bump: 1.1, strata: 0.8, contrast: 0.8, vertexColors: false, color: 0x8a8076, roughness: 1 });
    const belt = [boulder(2, 3), boulder(5, 3), boulder(9, 2), boulder(14, 2)].map((g, k) => instanced(g, rock, k < 2 ? 500 : 1500, (i, d, c) => { const big = k < 2 && r() < 0.1;
      d.position.set((r() - 0.5) * 300, (r() - 0.5) * 70 * (0.4 + r()), -230 - r() * 360); if (Math.hypot(d.position.x + 6, d.position.y) < (big ? 26 : 5)) d.position.x += big ? 44 : 14;
      const s = big ? 5 + r() * 9 : 0.25 + r() * r() * 3.2; d.scale.set(s * (0.7 + r() * 0.7), s * (0.7 + r() * 0.6), s * (0.7 + r() * 0.7)); d.rotation.set(r() * 6, r() * 6, r() * 6); c.setHSL(0.07 + r() * 0.04, 0.12, 0.45 + r() * 0.45); }));
    belt.forEach(m => scene.add(m));
    scene.add(points({ count: 9000, size: 0.14, gain: 1.1, color: 0xd8c8b0, opacity: 0.8, minPx: 0.8, spawn: (i, v, q) => v.set((q() - 0.5) * 320, (q() - 0.5) * 60, -150 - q() * 420), motion: 'p.x += uTime*(0.2 + s.x*0.5); p.x = mod(p.x + 160.0, 320.0) - 160.0;' }));

    // ---- the giant and its rings ----
    const G = new THREE.Group(); G.position.set(130, -22, -820); G.rotation.set(0.36, 0, 0.3); scene.add(G); const GR = 92, sunL = { value: new V3() };
    G.add(new THREE.Mesh(new THREE.SphereGeometry(GR, 128, 80), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uSun, uSunL: sunL }, vertexShader: VS, fragmentShader: /* glsl */`varying vec3 vP, vN, vV; uniform float uTime; uniform vec3 uSun, uSunL; ${NOISE}
      void main(){ vec3 N = normalize(vN); float lat = vP.y, lon = atan(vP.z, vP.x); vec3 q = vec3(vP.x*1.6, vP.y*7.0, vP.z*1.6); float turb = fbm3(q + vec3(uTime*0.01, 0.0, 0.0)), fine = fbm3(vec3(vP.x*7.0 + turb*2.0, vP.y*26.0, vP.z*7.0) + uTime*0.012);
        float b = sin(lat*19.0 + turb*4.2 + fine*1.6 + sin(lat*5.0)*1.5)*0.5 + 0.5, b2 = sin(lat*47.0 + fine*5.0)*0.5 + 0.5;
        vec3 c = mix(vec3(0.5, 0.26, 0.12), vec3(0.93, 0.8, 0.6), smoothstep(0.2, 0.8, b)); c = mix(c, vec3(0.74, 0.44, 0.24), b2*0.32); c = mix(c, vec3(0.35, 0.42, 0.55), smoothstep(0.72, 0.95, abs(lat))*0.6);
        vec2 sp = vec2(mod(lon + 1.2 + uTime*0.004, 6.2832) - 3.1416, lat + 0.33)/vec2(0.34, 0.13); float spot = smoothstep(1.0, 0.55, length(sp)); float sw = atan(sp.y, sp.x) + length(sp)*3.0 - uTime*0.1; c = mix(c, mix(vec3(0.7, 0.2, 0.08), vec3(0.95, 0.6, 0.4), 0.5 + 0.5*sin(sw*3.0)), spot*0.9);
        float nl = dot(N, uSun), lit = smoothstep(-0.08, 0.5, nl)*(0.35 + 0.65*max(nl, 0.0));
        float t = -vP.y/uSunL.y; vec3 hp = vP + uSunL*t; float rr = length(hp.xz); float rs = step(0.0, t)*smoothstep(1.28, 1.34, rr)*smoothstep(2.32, 2.24, rr)*(0.55 + 0.3*sin(rr*40.0)); lit *= 1.0 - rs*0.72;
        c = c*lit*1.5 + vec3(0.9, 0.6, 0.35)*pow(1.0 - max(dot(N, vV), 0.0), 3.5)*smoothstep(-0.1, 0.3, nl)*0.4; gl_FragColor = vec4(c, 1.0); }` })));
    const ring = new THREE.Mesh(new THREE.RingGeometry(GR * 1.28, GR * 2.34, 256, 4).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { uSunL: sunL }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec3 vL; void main(){ vL = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: /* glsl */`varying vec3 vL; uniform vec3 uSunL; ${NOISE}
        void main(){ float rr = length(vL.xz)/${GR.toFixed(1)}; float k = (rr - 1.28)/1.06; float b = vnoise(vec2(rr*70.0, 1.0))*0.55 + vnoise(vec2(rr*210.0, 4.0))*0.3 + vnoise(vec2(rr*18.0, 7.0))*0.4;
          float gap = smoothstep(0.012, 0.03, abs(k - 0.58))*smoothstep(0.004, 0.012, abs(k - 0.83))*smoothstep(0.0, 0.05, k)*smoothstep(1.0, 0.94, k); float a = clamp(b*1.25, 0.0, 1.0)*gap*(0.35 + 0.65*smoothstep(0.1, 0.35, k));
          vec3 P = vL/${GR.toFixed(1)}; float along = dot(P, uSunL); vec3 perp = P - uSunL*along; float sh = along < 0.0 ? smoothstep(0.96, 1.03, length(perp)) : 1.0;
          vec3 c = mix(vec3(0.62, 0.5, 0.38), vec3(0.95, 0.88, 0.76), vnoise(vec2(rr*33.0, 9.0)))*(0.05 + 1.25*sh); gl_FragColor = vec4(c, a*0.92); }` })); G.add(ring);
    const gm = [[150, 6, 0.4, 0xb8a890], [210, 9, 2.6, 0x8a9ab0], [280, 4.5, 4.4, 0xc8b0a0]].map(([R, s, a, c]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 40, 24), groundMat({ scale: 0.5, detail: 2.2, bump: 1.2, contrast: 0.7, vertexColors: false, color: c })); m.userData = { R, a }; G.add(m); return m; });

    // ---- the nursery: gas, dust lanes, newborn stars ----
    const NZ = -1340, nebC = [0x7a2cff, 0x1ac8d8, 0xff3a9a, 0xff8a3a, 0x3a5aff];
    const neb = points({ count: 1500, size: 120, opacity: 0.045, gain: 1, fog: false, seed: 5, spawn: (i, v, q) => { const a = q() * TAU, b = Math.acos(2 * q() - 1), R = Math.pow(q(), 0.5); v.set(Math.sin(b) * Math.cos(a) * 330 * R, Math.cos(b) * 150 * R + Math.sin(a * 2) * 40, NZ + Math.sin(b) * Math.sin(a) * 260 * R); },
      colorFn: (i, c, q) => { c.set(nebC[Math.floor(q() * q() * 5)]); c.multiplyScalar(0.5 + q()); }, motion: 'p += vec3(sin(uTime*0.03 + s.x*20.0), cos(uTime*0.025 + s.y*20.0), 0.0)*8.0; sz = 0.5 + s.z*1.4; a *= 0.5 + 0.5*sin(uTime*0.1 + s.w*20.0);' }); scene.add(neb);
    scene.add(points({ count: 500, size: 70, opacity: 0.16, additive: false, color: 0x05030a, fog: false, seed: 12, spawn: (i, v, q) => { const t = q(), a = q() * TAU; v.set(lerp(-260, 240, t) + Math.cos(a) * 40 * q(), Math.sin(t * 7) * 46 + Math.sin(a) * 26 * q() + 10, NZ - 30 + Math.cos(t * 5) * 70); }, motion: 'sz = 0.6 + s.z;' }));
    scene.add(points({ count: 320, size: 3, gain: 2.6, shape: 'spark', fog: false, minPx: 2, spawn: (i, v, q) => v.set((q() - 0.5) * 520, (q() - 0.5) * 220, NZ + (q() - 0.5) * 380), colorFn: (i, c, q) => c.set([0xbfd8ff, 0xffffff, 0xffe0b0, 0xffb0d0][Math.floor(q() * 4)]), motion: 'a *= 0.55 + 0.45*sin(uTime*(1.0 + s.x*2.0) + s.y*40.0); sz = 0.3 + s.z*s.z*1.6;' }));

    // ---- the black hole ----
    const BZ = -2050, BR = 24, hole = new THREE.Group(); hole.position.set(0, 0, BZ); scene.add(hole);
    hole.add(new THREE.Mesh(new THREE.SphereGeometry(BR * 1.36, 64, 40), new THREE.MeshBasicMaterial({ color: 0x000000 })));
    const DISK = /* glsl */`vec3 hot(float t){ vec3 c = mix(vec3(0.9, 0.08, 0.01), vec3(1.0, 0.5, 0.12), smoothstep(0.0, 0.5, t)); return mix(c, vec3(1.0, 0.95, 0.86), smoothstep(0.45, 1.0, t)); }`;
    const disk = new THREE.Mesh(new THREE.RingGeometry(BR * 1.5, BR * 6.2, 256, 8), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: /* glsl */`varying vec2 vQ; uniform float uTime; ${NOISE} ${DISK}
        void main(){ float rr = length(vQ)/${BR.toFixed(1)}, a = atan(vQ.y, vQ.x), k = (rr - 1.5)/4.7, w = a + uTime*0.9/pow(rr, 1.5) + 3.0/rr;
          float n = fbm(vec2(cos(w), sin(w))*3.0 + rr*2.2)*0.6 + fbm(vec2(cos(w*3.0), sin(w*3.0))*4.0 + rr*9.0)*0.4, lanes = 0.6 + 0.4*sin(rr*26.0 + n*8.0);
          float T = pow(clamp(1.0 - k, 0.0, 1.0), 2.4), dop = 1.0 + 0.72*cos(a - 0.3); float I = (T*2.0 + 0.1)*(0.25 + 0.95*n)*lanes*dop*dop*smoothstep(0.0, 0.05, k)*smoothstep(1.0, 0.55, k);
          gl_FragColor = vec4(hot(T*0.9 + 0.15*(dop - 1.0))*I, 1.0); }` })); disk.rotation.x = -Math.PI / 2 + 0.16; disk.rotation.y = 0.1; hole.add(disk);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(BR * 9, BR * 9), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: /* glsl */`varying vec2 vUv; uniform float uTime; ${NOISE} ${DISK}
        void main(){ vec2 p = (vUv - 0.5)*9.0; float rr = length(p), a = atan(p.y, p.x), w = a - uTime*0.25; float n = fbm(vec2(cos(w), sin(w))*3.5 + rr*3.0);
          float arc = exp(-pow((rr - 1.72)/0.3, 2.0))*(0.35 + 0.65*abs(sin(a)))*(0.4 + 0.9*n), ph = exp(-pow((rr - 1.43)/0.03, 2.0))*1.6 + exp(-pow((rr - 1.5)/0.1, 2.0))*0.5;
          float dop = 1.0 + 0.6*cos(a - 0.3); vec3 c = hot(0.7)*arc*0.9*dop + vec3(1.0, 0.93, 0.82)*ph*dop*0.7 + vec3(1.0, 0.45, 0.12)*exp(-rr*0.9)*0.25*smoothstep(1.3, 1.6, rr); gl_FragColor = vec4(c*smoothstep(1.36, 1.4, rr), 1.0); }` })); hole.add(halo);
    scene.add(points({ count: 5000, size: 0.9, gain: 2.4, fog: false, minPx: 1, spawn: (i, v) => v.set(0, 0, BZ), colorFn: (i, c, q) => c.set([0xffb060, 0xffe0b0, 0xff7030][Math.floor(q() * 3)]),
      motion: `float age = fract(uTime*0.02*(0.5 + s.x) + s.y); float rr = ${BR.toFixed(1)}*mix(9.0, 1.5, age*age); float an = s.z*6.283 + 14.0/sqrt(rr/${BR.toFixed(1)}) + uTime*0.2; p += vec3(cos(an)*rr, (s.w - 0.5)*rr*0.07 + sin(an)*rr*0.16, sin(an)*rr); a = smoothstep(0.0, 0.1, age)*(1.0 - age); sz = 0.5 + s.x;` }));
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 9, 520, 24, 1, true), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float uTime; ${NOISE} void main(){ float y = abs(vUv.y - 0.5)*2.0; float n = fbm(vec2(vUv.x*8.0, y*10.0 - uTime*1.2)); gl_FragColor = vec4(vec3(0.45, 0.6, 1.0)*n*smoothstep(1.0, 0.1, y)*smoothstep(0.03, 0.14, y)*0.08, 1.0); }` })); jet.rotation.x = 0.16; hole.add(jet);

    Object.assign(look, { bloom: 0.9, bloomThreshold: 0.9, bloomKnee: 0.7, bloomRadius: 0.9, vignette: 0.65, aberration: 0.9, contrast: 1.1, saturation: 1.15, grain: 0.035, ao: 0.6, godPos: SUN, godDir: true, god: 0.5, godColor: new THREE.Color(0xfff0d8) });
    const su = dome.userData.u, inv = new THREE.Matrix4(), bh = new V3(0, 0, BZ);
    return {
      parallax: 0.5,
      rail: [
        { p: 0, pos: [-24, 14, 108], look: [0, 0, 0], fov: 40 },
        { p: 0.13, pos: [-50, 5, 22], look: [0, 3, -8], fov: 44 },
        { p: 0.27, pos: [-22, 4, -150], look: [6, 0, -330], fov: 54 },
        { p: 0.4, pos: [6, -3, -400], look: [110, -16, -800], fov: 52 },
        { p: 0.54, pos: [-60, 34, -640], look: [130, -22, -820], fov: 46 },
        { p: 0.7, pos: [-50, 12, -1060], look: [0, 8, NZ], fov: 54 },
        { p: 0.85, pos: [10, 46, -1700], look: [0, 0, BZ], fov: 44 },
        { p: 1, pos: [70, 13, BZ + 150], look: [0, 0, BZ], fov: 48 } ],
      update(t, p) {
        earth.rotation.y = t * 0.012; moon.position.set(Math.cos(t * 0.02 + 1) * 76, 8, Math.sin(t * 0.02 + 1) * 76); moon.rotation.y = t * 0.01;
        station.position.set(Math.cos(t * 0.05 + 2.2) * 36, Math.sin(t * 0.05 + 2.2) * 9 + 2, Math.sin(t * 0.05 + 2.2) * 36); station.rotation.set(t * 0.1, t * 0.07, 0.4);
        belt.forEach((m, k) => { m.rotation.z = Math.sin(t * 0.01 + k) * 0.02; });
        G.updateMatrixWorld(); sunL.value.copy(SUN).transformDirection(inv.copy(G.matrixWorld).invert()); gm.forEach(m => { const a = m.userData.a + t * 0.02 * (200 / m.userData.R); m.position.set(Math.cos(a) * m.userData.R, 0, Math.sin(a) * m.userData.R); m.rotation.y = t * 0.05; });
        halo.quaternion.copy(camera.quaternion); su.uNeb.value = lerp(0.22, 1.0, win(0.56, 0.84, p, 0.1));
        neb.userData.u.uOpacity.value = 0.05 * smooth(0.45, 0.62, p); look.god = 0.5 * (1 - smooth(0.6, 0.8, p));
        look.godPos = p > 0.8 ? bh : SUN; look.godDir = p <= 0.8; if (p > 0.8) { look.god = 0.15 * smooth(0.8, 0.95, p); look.godColor.set(0xffb070); } else look.godColor.set(0xfff0d8);
        look.bloom = lerp(0.9, 0.6, smooth(0.8, 1, p));
      },
    };
  },
};
