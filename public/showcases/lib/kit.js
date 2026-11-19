// Procedural kit shared by every showcase: noise, geometry builder, sky, particles, water, terrain, wind.
import * as THREE from './three.module.min.js';

// uniforms every custom shader shares; the engine writes them once per frame
export const U = {
  uTime: { value: 0 }, uPx: { value: 500 }, uRes: { value: new THREE.Vector2(1, 1) }, uMirror: { value: 0 }, uMirrorOn: { value: 1 },
  uFogCol: { value: new THREE.Color(0, 0, 0) }, uFogDen: { value: 0 },
  // atmosphere every lit material reads: uMist (strength, layer height, base y), uSunFog (colour the haze takes toward the sun),
  // uSunDirF, uCloudSh (strength of drifting cloud shadows, scale, speed)
  uMist: { value: new THREE.Vector3(0, 20, 0) }, uSunFog: { value: new THREE.Color(0, 0, 0) }, uSunDirF: { value: new THREE.Vector3(0, 1, 0) }, uCloudSh: { value: new THREE.Vector3(0, 0.01, 0.02) },
  uAmbF: { value: new THREE.Color(0, 0, 0) },   // sky light for Lambert foliage, which skips the reflection probe
};
// tiles of instances the engine shows only while they are near the lens
export const TILES = [];
export function resetAtmos() { TILES.length = 0; U.uMist.value.set(0, 20, 0); U.uSunFog.value.set(0, 0, 0); U.uSunDirF.value.set(0, 1, 0); U.uCloudSh.value.set(0, 0.01, 0.02); }
// every program gets the atmosphere uniforms; materials with their own onBeforeCompile call hook(sh) first
export function hook(sh) { sh.uniforms.uMist = U.uMist; sh.uniforms.uSunFog = U.uSunFog; sh.uniforms.uSunDirF = U.uSunDirF; sh.uniforms.uCloudSh = U.uCloudSh; sh.uniforms.uTimeF = U.uTime; }
THREE.Material.prototype.onBeforeCompile = hook;
// aerial perspective for all built-in materials: distance haze, a low mist layer integrated along the view ray, haze that warms toward
// the sun, and cloud shadows that drift across everything the key light touches
THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\n varying float vFogDepth; varying vec3 vFogW;\n#endif';
THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n vFogDepth = -mvPosition.z; { vec4 fw = vec4(transformed, 1.0);\n #ifdef USE_INSTANCING\n fw = instanceMatrix*fw;\n #endif\n vFogW = (modelMatrix*fw).xyz; }\n#endif';
THREE.ShaderChunk.fog_pars_fragment = /* glsl */`#ifdef USE_FOG
  uniform vec3 fogColor; varying float vFogDepth; varying vec3 vFogW;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear; uniform float fogFar;
  #endif
  uniform vec3 uMist, uSunFog, uSunDirF, uCloudSh; uniform float uTimeF;
  float fgH(vec2 p){ vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
  float fgN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(fgH(i), fgH(i + vec2(1,0)), f.x), mix(fgH(i + vec2(0,1)), fgH(i + vec2(1,1)), f.x), f.y); }
  float fgCloud(){ vec2 q = vFogW.xz*uCloudSh.y + vec2(uTimeF*uCloudSh.z, uTimeF*uCloudSh.z*0.4); float n = fgN(q)*0.55 + fgN(q*2.1 + 7.0)*0.3 + fgN(q*4.3 + 3.0)*0.15; return 1.0 - uCloudSh.x*smoothstep(0.46, 0.66, n); }
#endif`;
THREE.ShaderChunk.fog_fragment = /* glsl */`#ifdef USE_FOG
  #ifdef FOG_EXP2
    vec3 fV = vFogW - cameraPosition; float fD = length(fV); vec3 fDir = fV/max(fD, 1e-4);
    float fB = clamp(fDir.y*fD/max(uMist.y, 1e-3), -30.0, 30.0);
    float fM = uMist.x*exp(min(-(cameraPosition.y - uMist.z)/max(uMist.y, 1e-3), 4.0))*fD*(abs(fB) > 1e-3 ? (1.0 - exp(-fB))/fB : 1.0);
    float fogFactor = 1.0 - exp(-fogDensity*fogDensity*fD*fD - fM);
    vec3 fCol = fogColor + uSunFog*pow(max(dot(fDir, uSunDirF), 0.0), 6.0);
  #else
    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth); vec3 fCol = fogColor;
  #endif
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fCol, clamp(fogFactor, 0.0, 1.0));
#endif`;
THREE.ShaderChunk.lights_fragment_end += /* glsl */`
#if defined(USE_FOG) && defined(FOG_EXP2)
  { float cSh = fgCloud(); reflectedLight.directDiffuse *= cSh; reflectedLight.directSpecular *= cSh; }
#endif`;

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// 0 -> 1 -> 0 window over [a, b] with soft edges of width e
export const win = (a, b, x, e = 0.05) => smooth(a - e, a + e, x) * (1 - smooth(b - e, b + e, x));
export const TAU = Math.PI * 2;

export function rng(seed = 1) {
  return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const h2 = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h2(xi, yi), h2(xi + 1, yi), u), lerp(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v);
}
export function fbm2(x, y, o = 5) { let a = 0.5, s = 0; for (let i = 0; i < o; i++) { s += a * noise2(x, y); x = x * 2.03 + 17.1; y = y * 2.03 + 9.7; a *= 0.5; } return s; }

export const NOISE = /* glsl */`
float hash11(float p){ p = fract(p*0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
float hash31(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
vec2 hash22(vec2 p){ vec3 q = fract(vec3(p.xyx)*vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz)*q.zy); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x), mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), f.x), f.y); }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a*vnoise(p); p = p*2.03 + vec2(17.1, 9.7); a *= 0.5; } return s; }
float fbm3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a*vnoise3(p); p = p*2.03 + vec3(17.1, 9.7, 5.3); a *= 0.5; } return s; }
`;
// light focused by a rippling surface, as it falls on whatever lies below
export const CAUSTIC = /* glsl */`float caustic(vec2 p, float t){ p = mod(p*6.28318, 6.28318) - 250.0; vec2 i = p; float c = 1.0;
  for (int n = 0; n < 4; n++){ float tt = t*(1.0 - 3.5/float(n + 1)); i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x)); c += 1.0/length(vec2(p.x/(sin(i.x + tt)/0.005), p.y/(cos(i.y + tt)/0.005))); }
  c = 1.17 - pow(c/4.0, 1.4); return clamp(pow(abs(c), 8.0), 0.0, 4.0); }`;
export const FOG_PARS = /* glsl */`uniform vec3 uFogCol; uniform float uFogDen;
vec3 applyFog(vec3 c, float d){ return mix(uFogCol, c, exp(-uFogDen*uFogDen*d*d)); }
float fogAmt(float d){ return exp(-uFogDen*uFogDen*d*d); }`;

// ---------------------------------------------------------------------------------------------------------------------
// geometry
// ---------------------------------------------------------------------------------------------------------------------
export function tint(geo, c) {
  const col = c instanceof THREE.Color ? c : new THREE.Color(c), n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo;
}
export function merge(geos) {
  const gs = geos.map(g => g.index ? g.toNonIndexed() : g);
  let n = 0; for (const g of gs) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv', 'color']) {
    if (!gs.every(g => g.attributes[k])) continue;
    const sz = gs[0].attributes[k].itemSize, arr = new Float32Array(n * sz); let o = 0;
    for (const g of gs) { arr.set(g.attributes[k].array, o); o += g.attributes[k].array.length; }
    out.setAttribute(k, new THREE.BufferAttribute(arr, sz));
  }
  for (const g of gs) g.dispose();
  return out;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function xform(geo, { p = [0, 0, 0], r = [0, 0, 0], s = 1 } = {}) {
  _e.set(r[0], r[1], r[2]); _q.setFromEuler(_e); _p.set(p[0], p[1], p[2]);
  if (typeof s === 'number') _s.set(s, s, s); else _s.set(s[0], s[1], s[2]);
  return geo.applyMatrix4(_m.compose(_p, _q, _s));
}
// Builder: many tinted primitives baked into one mesh with vertex colours
export class Builder {
  constructor() { this.g = []; }
  add(geo, o = {}) { xform(geo, o); tint(geo, o.c ?? 0xffffff); this.g.push(geo); return this; }
  box(w, h, d, o) { return this.add(new THREE.BoxGeometry(w, h, d), o); }
  cyl(rt, rb, h, seg, o) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg ?? 12, 1), o); }
  cone(r, h, seg, o) { return this.add(new THREE.ConeGeometry(r, h, seg ?? 12), o); }
  sph(r, o, ws = 16, hs = 12) { return this.add(new THREE.SphereGeometry(r, ws, hs), o); }
  tor(R, r, o, a = TAU, ts = 32) { return this.add(new THREE.TorusGeometry(R, r, 8, ts, a), o); }
  lathe(pts, seg, o) { return this.add(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg ?? 16), o); }
  get empty() { return !this.g.length; }
  geometry() { return merge(this.g); }
  mesh(mat, shadow = true) { const m = new THREE.Mesh(this.geometry(), mat); m.castShadow = m.receiveShadow = shadow; return m; }
}
export const stdMat = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, ...o });

// opts { cell, far, noMirror, depth, lod: { geo, at } }: beyond `at` metres a tile swaps to the lighter `lod.geo` (same places, same colours).
// opts { cell, far, noMirror, depth }: split the instances into ground tiles of `cell` metres. Each tile is culled against the
// frustum, hidden beyond `far` metres (for detail too fine to see from there) and may sit out of the mirror pass.
export function instanced(geo, mat, count, fn, shadow = false, opts = null) {
  if (opts) { const cell = opts.cell ?? 24, B = new Map(), d = new THREE.Object3D(), c = new THREE.Color(), g = new THREE.Group(), mt = new THREE.Matrix4();
    for (let i = 0; i < count; i++) { d.position.set(0, 0, 0); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); c.set(0xffffff); if (fn(i, d, c) === false) continue; d.updateMatrix();
      const k = Math.floor(d.position.x / cell) + ',' + Math.floor(d.position.z / cell); let b = B.get(k); if (!b) B.set(k, b = { m: [], c: [] }); for (let q = 0; q < 16; q++) b.m.push(d.matrix.elements[q]); b.c.push(c.r, c.g, c.b); }
    for (const b of B.values()) { const n = b.c.length / 3, m = new THREE.InstancedMesh(geo, mat, n); for (let i = 0; i < n; i++) { mt.fromArray(b.m, i * 16); m.setMatrixAt(i, mt); m.setColorAt(i, c.setRGB(b.c[i * 3], b.c[i * 3 + 1], b.c[i * 3 + 2])); }
      m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.castShadow = shadow; m.receiveShadow = shadow; m.computeBoundingSphere(); m.boundingSphere.radius += 2; m.frustumCulled = true;
      if (opts.noMirror) m.userData.noMirror = true; if (opts.depth) m.customDepthMaterial = opts.depth; g.add(m); let lo = null;
      if (opts.lod) { lo = new THREE.InstancedMesh(opts.lod.geo, mat, n); lo.instanceMatrix = m.instanceMatrix; lo.instanceColor = m.instanceColor; lo.castShadow = shadow; lo.receiveShadow = shadow; lo.boundingSphere = m.boundingSphere; lo.frustumCulled = true; lo.visible = false; if (opts.depth) lo.customDepthMaterial = opts.depth; if (opts.noMirror) lo.userData.noMirror = true; g.add(lo); }
      if (opts.far || lo) TILES.push({ mesh: m, lo, at: opts.lod?.at ?? Infinity, c: m.boundingSphere.center.clone(), r: m.boundingSphere.radius, far: opts.far ?? Infinity }); }
    return g; }
  const m = new THREE.InstancedMesh(geo, mat, count), d = new THREE.Object3D(), c = new THREE.Color(); let used = 0;
  for (let i = 0; i < count; i++) {
    d.position.set(0, 0, 0); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); c.set(0xffffff);
    if (fn(i, d, c) === false) continue;
    d.updateMatrix(); m.setMatrixAt(used, d.matrix); m.setColorAt(used, c); used++;
  }
  m.count = used; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.castShadow = shadow; m.receiveShadow = shadow; m.frustumCulled = false; return m;
}

// height-field terrain with vertex colours. height(x, z) -> y; color(x, z, y, slope, out)
export function terrain({ size = 400, seg = 200, height, color, mat }) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  const n = g.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { color(p.getX(i), p.getZ(i), p.getY(i), 1 - n.getY(i), c); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, mat ?? stdMat({ roughness: 0.95 })); m.receiveShadow = true; return m;
}

// sway vertices of a standard material in the wind; weight comes from height above the instance origin
export function windify(mat, { amp = 0.3, freq = 1.2, scale = 0.15, h0 = 0, h1 = 4 } = {}) {
  mat.onBeforeCompile = sh => {
    hook(sh); sh.uniforms.uTime = U.uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 wO = (modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;
      #else
        vec3 wO = (modelMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;
      #endif
      float wW = smoothstep(${h0.toFixed(2)}, ${h1.toFixed(2)}, position.y); wW *= wW;
      float wP = dot(wO.xz, vec2(${scale.toFixed(3)})) + position.y*0.2;
      transformed.x += (sin(uTime*${freq.toFixed(2)} + wP) + 0.4*sin(uTime*${(freq * 2.7).toFixed(2)} + wP*2.3))*${amp.toFixed(3)}*wW;
      transformed.z += cos(uTime*${(freq * 0.8).toFixed(2)} + wP*1.3)*${(amp * 0.6).toFixed(3)}*wW;`);
  };
  mat.customProgramCacheKey = () => 'wind' + amp + freq + scale + h0 + h1;
  return mat;
}

// ground and rock: world-space detail the vertex colours cannot carry. Two scales of mottling, optional strata, a bump from the same field
export function groundMat({ scale = 0.5, detail = 4, bump = 0.5, strata = 0, contrast = 0.7, caustics = 0, ...o } = {}) {
  const m = stdMat({ roughness: 0.95, ...o });
  m.onBeforeCompile = sh => { hook(sh);
    sh.vertexShader = 'varying vec3 vGW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n { vec4 gw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n gw = instanceMatrix*gw;\n#endif\n vGW = (modelMatrix*gw).xyz; }');
    sh.fragmentShader = 'varying vec3 vGW;\n' + NOISE + CAUSTIC + '\n' + sh.fragmentShader.replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        float gA = fbm3(vGW*${scale.toFixed(3)}), gB = fbm3(vGW*${detail.toFixed(3)} + 31.0), gS = ${strata ? `vnoise(vec2(vGW.y*${strata.toFixed(3)} + gA*5.0, 3.7))*0.6 + vnoise(vec2(vGW.y*${(strata * 4.3).toFixed(3)} + gA*9.0, 9.1))*0.4` : '0.5'};
        float gH = gA*0.5 + gB*0.35 + gS*${strata ? '0.9' : '0.0'};
        diffuseColor.rgb *= ${(1 - contrast * 0.5).toFixed(3)} + ${contrast.toFixed(3)}*(gA*0.55 + gB*0.45)${strata ? '*(0.55 + 0.9*gS)' : ''};`)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
        { vec3 sX = dFdx(-vViewPosition), sY = dFdy(-vViewPosition); vec3 r1 = cross(sY, normal), r2 = cross(normal, sX); float det = dot(sX, r1);
          vec3 grad = sign(det)*(dFdx(gH)*r1 + dFdy(gH)*r2); normal = normalize(abs(det)*normal - grad*${bump.toFixed(3)}); }
        ${caustics ? `totalEmissiveRadiance += diffuseColor.rgb*vec3(0.75, 1.0, 0.95)*caustic(vGW.xz*0.22 + vGW.y*0.05, uTimeF*0.7)*${caustics.toFixed(2)}*exp(min(vGW.y, 0.0)*0.022);` : ''}`); };
  m.customProgramCacheKey = () => 'ground' + scale + detail + bump + strata + contrast + caustics;
  return m;
}
// foliage: wind, a canopy normal kept on both faces, and sunlight that passes through the leaf
export function foliage(mat, wind = {}, through = 0.5) {
  windify(mat, wind); const w = mat.onBeforeCompile;
  const lam = !!mat.isMeshLambertMaterial;
  mat.onBeforeCompile = sh => { w(sh); if (lam) { sh.uniforms.uAmbF = U.uAmbF; sh.fragmentShader = 'uniform vec3 uAmbF;\n' + sh.fragmentShader; }
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = 1.0; vec3 normal = normalize(vNormal); vec3 nonPerturbedNormal = normal;')
      .replace('#include <lights_fragment_end>', /* glsl */`#include <lights_fragment_end>
        #if NUM_DIR_LIGHTS > 0
        { vec3 fLd = directionalLights[0].direction; float fBack = pow(max(dot(-normalize(vViewPosition), fLd), 0.0), 2.0);
          reflectedLight.directDiffuse += diffuseColor.rgb*directionalLights[0].color*(0.08 + fBack)*${through.toFixed(3)}*0.32
          #if defined(USE_FOG) && defined(FOG_EXP2)
            *fgCloud()
          #endif
          ; }
        #endif
        ${lam ? 'reflectedLight.indirectDiffuse += diffuseColor.rgb*uAmbF;' : ''}`); };
  const k = mat.customProgramCacheKey; mat.customProgramCacheKey = () => 'fol' + lam + through + k();
  return mat;
}

// ---------------------------------------------------------------------------------------------------------------------
// sky dome: three-stop gradient, sun or moon, stars, drifting clouds, nebula, aurora
// ---------------------------------------------------------------------------------------------------------------------
export function sky(o = {}) {
  const C = v => new THREE.Color(v);
  const u = {
    uTime: U.uTime, uTop: { value: C(o.top ?? 0x1b3a6b) }, uHor: { value: C(o.horizon ?? 0xaecbe8) }, uBot: { value: C(o.bottom ?? o.horizon ?? 0x8899aa) },
    uPow: { value: o.pow ?? 0.55 }, uSunDir: { value: (o.sunDir ?? new THREE.Vector3(0.3, 0.5, -0.8)).clone().normalize() },
    uSunCol: { value: C(o.sunColor ?? 0xfff0d0) }, uSunSize: { value: o.sunSize ?? 0.0006 }, uSunInt: { value: o.sunIntensity ?? 30 }, uSunGlow: { value: o.sunGlow ?? 1 },
    uStars: { value: o.stars ?? 0 }, uClouds: { value: o.clouds ?? 0 }, uCloudCol: { value: C(o.cloudColor ?? 0xffffff) }, uCloudDark: { value: C(o.cloudDark ?? 0x667088) },
    uCloudScale: { value: o.cloudScale ?? 1 }, uNeb: { value: o.nebula ?? 0 }, uNebA: { value: C(o.nebulaA ?? 0x5a1e8c) }, uNebB: { value: C(o.nebulaB ?? 0x0e6a8c) },
    uAurora: { value: o.aurora ?? 0 }, uAurCol: { value: C(o.auroraColor ?? 0x30ffb0) }, uMoon: { value: o.moon ? 1 : 0 }, uGain: { value: o.gain ?? 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, depthTest: true,   // drawn last at the far plane: pixels behind geometry cost nothing
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; vec4 mv = modelViewMatrix*vec4(position, 0.0); gl_Position = (projectionMatrix*vec4(mv.xyz, 1.0)).xyww; }',
    fragmentShader: /* glsl */`varying vec3 vDir; uniform float uTime, uPow, uSunSize, uSunInt, uSunGlow, uStars, uClouds, uCloudScale, uNeb, uAurora, uMoon, uGain;
      uniform vec3 uTop, uHor, uBot, uSunDir, uSunCol, uCloudCol, uCloudDark, uNebA, uNebB, uAurCol; ${NOISE}
      void main(){ vec3 d = normalize(vDir); float h = d.y;
        vec3 c = mix(uHor, uTop, pow(max(h, 0.0), uPow)); c = mix(c, uBot, smoothstep(0.0, -0.35, h));
        float sd = max(dot(d, uSunDir), 0.0);
        if (uNeb > 0.0){ vec3 q = d*2.2; float n1 = fbm3(q + vec3(0.0, uTime*0.004, 0.0)), n2 = fbm3(q*1.7 + 11.0 + n1*1.5);
          float m = smoothstep(0.42, 0.85, n1*0.6 + n2*0.6); c += (mix(uNebA, uNebB, smoothstep(0.3, 0.7, n2))*m*m*1.6 + uNebA*0.08*n1)*uNeb; }
        if (uStars > 0.0){ for (int k = 0; k < 2; k++){ vec3 g = d*(k == 0 ? 90.0 : 190.0); vec3 id = floor(g), f = fract(g) - 0.5; float r = hash31(id + float(k)*7.0);
          vec3 off = (vec3(hash31(id + 3.1), hash31(id + 5.7), hash31(id + 9.2)) - 0.5)*0.7;
          float s = smoothstep(0.16*(0.3 + r), 0.0, length(f - off))*step(0.93, r);
          s *= 0.6 + 0.4*sin(uTime*(1.0 + r*3.0) + r*40.0);
          c += s*uStars*mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.85, 0.7), hash31(id + 1.3))*(k == 0 ? 2.5 : 1.0)*smoothstep(-0.05, 0.25, h + (1.0 - step(0.01, uTop.r + uTop.g + uTop.b))); } }
        if (uAurora > 0.0 && h > 0.0){ vec2 q = d.xz/(h + 0.25); float w = vnoise(vec2(q.x*1.5 + uTime*0.03, q.y*0.4));
          float band = pow(abs(sin(q.x*2.5 + w*5.0 + q.y*1.4 + uTime*0.05)), 14.0) + 0.6*pow(abs(sin(q.x*4.1 - w*3.0 + uTime*0.03 + 1.7)), 20.0);
          float ray = 0.6 + 0.4*vnoise(vec2(q.x*30.0, uTime*0.3));
          c += mix(uAurCol, uAurCol.bgr*vec3(1.6, 0.5, 1.2), smoothstep(0.2, 0.9, h))*band*ray*uAurora*smoothstep(0.05, 0.3, h)*smoothstep(1.0, 0.5, h); }
        float disc = smoothstep(1.0 - uSunSize, 1.0 - uSunSize*0.55, sd);
        if (uMoon > 0.5){ vec3 t = normalize(cross(uSunDir, vec3(0.0, 1.0, 0.0))), b = cross(t, uSunDir); vec2 mp = vec2(dot(d, t), dot(d, b))/sqrt(2.0*uSunSize);
          disc *= 0.75 + 0.25*smoothstep(0.35, 0.65, fbm(mp*2.3 + 4.0)); }
        vec3 sun = uSunCol*(disc*uSunInt + pow(sd, 6.0)*uSunGlow*0.16 + pow(sd, 48.0)*uSunGlow*0.7 + pow(sd, 600.0)*uSunGlow*2.5);
        if (uClouds > 0.0 && h > -0.02){ vec2 q = d.xz/(h + 0.12)*uCloudScale + uTime*vec2(0.006, 0.002);
          float n = fbm(q*1.3) + 0.5*fbm(q*3.1 - uTime*0.01) - 0.25, m = smoothstep(1.0 - uClouds, 1.0 - uClouds + 0.38, n);
          float lit = smoothstep(0.2, 1.1, n + 0.5*(fbm(q*1.3 + uSunDir.xz*0.25) - fbm(q*1.3)))*0.5 + 0.5*pow(sd, 3.0);
          vec3 cc = mix(uCloudDark, uCloudCol, clamp(lit, 0.0, 1.0)) + uSunCol*pow(sd, 12.0)*0.8*(1.0 - m*0.6);
          float k = m*smoothstep(-0.02, 0.14, h); c = mix(c, cc, k); sun *= 1.0 - k*0.85; }
        gl_FragColor = vec4((c + sun)*uGain, 1.0); }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat); m.frustumCulled = false; m.renderOrder = 1000; m.scale.setScalar(10);
  m.userData.u = u; return m;
}

// ---------------------------------------------------------------------------------------------------------------------
// particles. spawn(i, v3, rnd) fills a start position; motion is GLSL that may move `p`, fade `a` and scale `sz`, reading seed `s`
// ---------------------------------------------------------------------------------------------------------------------
export function points({ count, spawn, motion = '', size = 0.1, color = 0xffffff, colorFn, opacity = 1, gain = 1, additive = true, shape = 'soft', seed = 7, uniforms = {}, fog = true, minPx = 0 }) {
  const r = rng(seed), pos = new Float32Array(count * 3), sd = new Float32Array(count * 4), col = new Float32Array(count * 3), v = new THREE.Vector3(), c = new THREE.Color(color);
  for (let i = 0; i < count; i++) {
    v.set(0, 0, 0); spawn(i, v, r); pos.set([v.x, v.y, v.z], i * 3); sd.set([r(), r(), r(), r()], i * 4);
    if (colorFn) { c.set(color); colorFn(i, c, r); } col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4)); g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  const shapes = {
    soft: 'float m = smoothstep(0.5, 0.0, d); m *= m;', disc: 'float m = smoothstep(0.5, 0.42, d);', square: 'float m = 1.0;',
    spark: 'vec2 q = abs(gl_PointCoord - 0.5); float m = smoothstep(0.5, 0.0, d); m = m*m*m + 0.6*smoothstep(0.5, 0.0, q.x*9.0 + q.y)+ 0.6*smoothstep(0.5, 0.0, q.y*9.0 + q.x);',
    petal: 'vec2 q = (gl_PointCoord - 0.5)*mat2(vRot.x, -vRot.y, vRot.y, vRot.x); float m = smoothstep(0.5, 0.4, length(q*vec2(1.0, 1.9)) + 0.25*q.x);',
    streak: 'vec2 q = abs(gl_PointCoord - 0.5); float m = smoothstep(0.06, 0.0, q.x)*smoothstep(0.5, 0.1, q.y);',
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPx: U.uPx, uFogDen: U.uFogDen, uSize: { value: size }, uOpacity: { value: opacity }, uGain: { value: gain }, uMinPx: { value: minPx }, ...uniforms },
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: /* glsl */`attribute vec4 aSeed; attribute vec3 aColor; uniform float uTime, uPx, uSize, uOpacity, uFogDen, uMinPx; varying vec3 vCol; varying float vA; varying vec2 vRot;
      ${NOISE} ${Object.keys(uniforms).map(k => `uniform ${typeof uniforms[k].value === 'number' ? 'float' : uniforms[k].value.isVector2 ? 'vec2' : 'vec3'} ${k};`).join('')}
      void main(){ vec3 p = position; vec4 s = aSeed; float a = 1.0, sz = 1.0; vec3 col = aColor; float rot = s.z*6.283 + uTime*(s.x - 0.5)*3.0;
        ${motion}
        vec4 mv = viewMatrix*modelMatrix*vec4(p, 1.0); gl_Position = projectionMatrix*mv;
        float px = uSize*sz*(0.5 + s.w)*uPx/max(-mv.z, 0.01); float k = max(px, uMinPx);
        gl_PointSize = min(k, 320.0); a *= clamp(px/max(uMinPx, 0.0001), 0.0, 1.0);
        ${fog ? 'a *= exp(-uFogDen*uFogDen*mv.z*mv.z*0.6);' : ''}
        vA = a*uOpacity*smoothstep(0.1, 1.2, -mv.z); vCol = col; vRot = vec2(cos(rot), sin(rot)); }`,
    fragmentShader: /* glsl */`uniform float uGain; varying vec3 vCol; varying float vA; varying vec2 vRot;
      void main(){ float d = length(gl_PointCoord - 0.5); ${shapes[shape]} if (m*vA < 0.003) discard; gl_FragColor = vec4(vCol*uGain, m*vA); }`,
  });
  const m = new THREE.Points(g, mat); m.frustumCulled = false; m.userData.u = mat.uniforms; return m;
}

// ---------------------------------------------------------------------------------------------------------------------
// water: animated normals, fresnel sky reflection, sun glint, optional planar mirror texture
// ---------------------------------------------------------------------------------------------------------------------
export function water(o = {}) {
  const C = v => new THREE.Color(v);
  const u = {
    uTime: U.uTime, uRes: U.uRes, uFogCol: U.uFogCol, uFogDen: U.uFogDen, uDeep: { value: C(o.deep ?? 0x06222e) }, uShallow: { value: C(o.shallow ?? 0x1a6a70) },
    uSkyA: { value: C(o.skyTop ?? 0x3060a0) }, uSkyB: { value: C(o.skyHorizon ?? 0xc0d8f0) }, uSunDir: { value: (o.sunDir ?? new THREE.Vector3(0.3, 0.5, -0.8)).clone().normalize() },
    uSunCol: { value: C(o.sunColor ?? 0xfff0d0) }, uScale: { value: o.scale ?? 0.25 }, uChop: { value: o.chop ?? 0.35 }, uSpeed: { value: o.speed ?? 1 },
    tMirror: { value: o.mirror ?? null }, uMirrorK: { value: o.mirror ? (o.mirrorStrength ?? 1) : 0 }, uMirrorOn: U.uMirrorOn, uGlint: { value: o.glint ?? 6 }, uDistort: { value: o.distort ?? 0.03 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, transparent: !!o.opacity,
    vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }',
    fragmentShader: /* glsl */`varying vec3 vW; varying float vD; uniform float uTime, uScale, uChop, uSpeed, uMirrorK, uMirrorOn, uGlint, uDistort; uniform vec2 uRes; uniform sampler2D tMirror;
      uniform vec3 uDeep, uShallow, uSkyA, uSkyB, uSunDir, uSunCol; ${NOISE} ${FOG_PARS}
      float hgt(vec2 p){ float t = uTime*uSpeed; return fbm(p + vec2(t*0.11, t*0.07)) + 0.5*fbm(p*2.7 - vec2(t*0.13, -t*0.09)); }
      void main(){ vec2 p = vW.xz*uScale; float e = 0.08; float h0 = hgt(p);
        vec3 N = normalize(vec3((h0 - hgt(p + vec2(e, 0.0)))*uChop/e*0.1, 1.0, (h0 - hgt(p + vec2(0.0, e)))*uChop/e*0.1));
        N = normalize(mix(N, vec3(0.0, 1.0, 0.0), smoothstep(60.0, 500.0, vD)));
        vec3 V = normalize(cameraPosition - vW), Rf = reflect(-V, N); Rf.y = abs(Rf.y);
        float fr = 0.03 + 0.97*pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 refl = mix(uSkyB, uSkyA, pow(max(Rf.y, 0.0), 0.5));
        float mk = uMirrorK*uMirrorOn; if (mk > 0.0){ vec2 suv = gl_FragCoord.xy/uRes; suv.y = 1.0 - suv.y; suv += N.xz*uDistort*(1.0 + 20.0/(vD + 4.0))*0.6;
          vec3 mr = texture2D(tMirror, clamp(suv, 0.001, 0.999)).rgb; refl = mix(refl, mr, mk); fr = max(fr, 0.35*mk); }
        vec3 c = mix(mix(uDeep, uShallow, pow(max(dot(N, V), 0.0), 2.0)*0.5), refl, fr);
        c += uSunCol*pow(max(dot(Rf, uSunDir), 0.0), 380.0)*uGlint;
        gl_FragColor = vec4(applyFog(c, vD), ${o.opacity ?? 1}); }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.size ?? 1000, o.sizeZ ?? o.size ?? 1000).rotateX(-Math.PI / 2), mat);
  m.userData.noMirror = true; m.userData.u = u; return m;
}

// camera-facing glow cards for lamps and halos (additive). items: [{ p:[x,y,z], s:size, c:color }]
export function glows(items, { gain = 1, flicker = 0 } = {}) {
  const m = points({ count: items.length, size: 1, gain, spawn: (i, v) => v.set(...items[i].p), colorFn: (i, c) => c.set(items[i].c ?? 0xffffff),
    motion: flicker ? `a *= 1.0 - ${flicker.toFixed(2)}*vnoise(vec2(uTime*6.0 + s.x*40.0, s.y*9.0));` : '' });
  const a = m.geometry.attributes.aSeed; items.forEach((it, i) => a.setW(i, (it.s ?? 1) - 0.5)); return m;
}

// text or pattern drawn on a 2D canvas, as a texture
export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  return t;
}

// standard key light with a shadow box sized for the scene
export function sunLight(scene, { dir, color = 0xfff1dc, intensity = 3, box = 80, far = 400, map = 2048, target = [0, 0, 0] }) {
  const l = new THREE.DirectionalLight(color, intensity); const d = dir.clone().normalize();
  l.position.set(target[0], target[1], target[2]).addScaledVector(d, far * 0.5); l.target.position.set(target[0], target[1], target[2]);
  l.castShadow = true; const c = l.shadow.camera; c.left = -box; c.right = box; c.top = box; c.bottom = -box; c.near = 1; c.far = far; c.updateProjectionMatrix();
  l.shadow.mapSize.set(map, map); l.shadow.bias = -0.0004; l.shadow.normalBias = 0.06 * box / 40; l.shadow.radius = 2.6;
  scene.add(l, l.target); return l;
}
