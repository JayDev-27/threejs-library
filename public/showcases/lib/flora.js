// Flora: grown trees. Limbs are tapered tubes on a branching skeleton; foliage is alpha-tested spray cards with drawn
// needles, leaves or blossoms, shaded with canopy-smoothed normals so a crown reads as one soft volume.
import * as THREE from './three.module.min.js';
import { rng, lerp, clamp, TAU, canvasTex, foliage, instanced } from './kit.js';

const V3 = THREE.Vector3, UP = new V3(0, 1, 0);

// ---- drawn textures -------------------------------------------------------------------------------------------------
function twigs(g, r, x0, y0, ang, len, depth, each) {
  const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
  g.strokeStyle = '#3a2a1c'; g.lineWidth = 1.5 + depth * 1.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  const n = Math.max(3, Math.floor(len / 26));
  for (let i = 1; i <= n; i++) { const t = i / n, x = lerp(x0, x1, t), y = lerp(y0, y1, t); each(x, y, ang, t, depth);
    if (depth > 0 && i < n) for (const s of [-1, 1]) if (r() < 0.85) twigs(g, r, x, y, ang + s * (0.6 + r() * 0.35), len * (1 - t * 0.55) * 0.5, depth - 1, each); }
}
export function needleTex(hue = 118) {
  return canvasTex(512, 512, (g) => { const r = rng(3); g.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) twigs(g, rng(8), 6, 256, 0, 500, 2, (x, y, a) => { for (let k = 0; k < 9; k++) { const s = k % 2 ? 1 : -1, na = a + s * (0.75 + r() * 0.5), l = 13 + r() * 11, ox = (r() - 0.5) * 12, oy = (r() - 0.5) * 12;
      g.strokeStyle = `hsl(${hue + r() * 26 - 10},${34 + r() * 22}%,${(pass ? 26 : 13) + r() * 17}%)`; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(na) * l, y + oy + Math.sin(na) * l); g.stroke(); } }); });
}
export function leafTex(hue = 105, sat = 48, lum = 30) {
  return canvasTex(512, 512, (g) => { const r = rng(5);
    twigs(g, rng(2), 256, 500, -Math.PI / 2, 420, 2, (x, y) => { for (let k = 0; k < 4; k++) { const a = r() * TAU, l = 20 + r() * 16, cx = x + Math.cos(a) * 26 * r() * 2, cy = y + Math.sin(a) * 26 * r() * 2;
      g.save(); g.translate(cx, cy); g.rotate(a); g.fillStyle = `hsl(${hue + r() * 30 - 12},${sat + r() * 18}%,${lum - 9 + r() * 22}%)`;
      g.beginPath(); g.moveTo(-l, 0); g.quadraticCurveTo(0, -l * 0.62, l, 0); g.quadraticCurveTo(0, l * 0.62, -l, 0); g.fill();
      g.strokeStyle = `hsla(${hue},${sat}%,${lum + 26}%,0.55)`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-l * 0.9, 0); g.lineTo(l * 0.9, 0); g.stroke(); g.restore(); } }); });
}
export function blossomTex(hue = 338) {
  return canvasTex(512, 512, (g) => { const r = rng(9);
    twigs(g, rng(4), 256, 505, -Math.PI / 2, 430, 2, (x, y) => { for (let k = 0; k < 3; k++) { const cx = x + (r() - 0.5) * 80, cy = y + (r() - 0.5) * 80, s = 13 + r() * 9, a0 = r() * TAU, lt = 84 + r() * 13;
      for (let q = 0; q < 5; q++) { const a = a0 + q * TAU / 5; g.save(); g.translate(cx + Math.cos(a) * s * 0.62, cy + Math.sin(a) * s * 0.62); g.rotate(a);
        g.fillStyle = `hsl(${hue + r() * 14 - 7},${62 + r() * 30}%,${lt}%)`; g.beginPath(); g.ellipse(0, 0, s * 0.66, s * 0.47, 0, 0, TAU); g.fill(); g.restore(); }
      g.fillStyle = `hsl(${hue - 4},78%,${58 + r() * 12}%)`; g.beginPath(); g.arc(cx, cy, s * 0.25, 0, TAU); g.fill();
      g.fillStyle = '#ffe9a8'; for (let q = 0; q < 5; q++) { const a = r() * TAU; g.fillRect(cx + Math.cos(a) * s * 0.3, cy + Math.sin(a) * s * 0.3, 1.6, 1.6); } } }); });
}
export function barkTex(base = '#5a4636', horizontal = false) {
  return canvasTex(256, 512, (g, W, H) => { const r = rng(6); g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 700; i++) { const x = r() * W, y = r() * H, l = 20 + r() * 90, d = r() < 0.62; g.strokeStyle = d ? `rgba(0,0,0,${0.12 + r() * 0.3})` : `rgba(255,236,210,${0.05 + r() * 0.13})`; g.lineWidth = 1 + r() * 3.5; g.beginPath();
      if (horizontal) { g.moveTo(x, y); g.bezierCurveTo(x + l * 0.3, y + (r() - 0.5) * 5, x + l * 0.6, y + (r() - 0.5) * 5, x + l * 0.5, y); }
      else { g.moveTo(x, y); g.bezierCurveTo(x + (r() - 0.5) * 12, y + l * 0.3, x + (r() - 0.5) * 12, y + l * 0.6, x + (r() - 0.5) * 8, y + l); } g.stroke(); } }, { repeat: [2, 3] });
}

// ---- geometry -------------------------------------------------------------------------------------------------------
class Tubes {
  constructor(sides = 6) { this.s = sides; this.pos = []; this.nor = []; this.uv = []; this.idx = []; this.n = 0; }
  limb(pts, radii, sides) {
    const s = sides ?? this.s, t = new V3(), a = new V3(), b = new V3(), base = this.n; let len = 0;
    for (let i = 0; i < pts.length; i++) {
      t.subVectors(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]).normalize();
      a.set(Math.abs(t.y) > 0.9 ? 1 : 0, Math.abs(t.y) > 0.9 ? 0 : 1, 0).cross(t).normalize(); b.crossVectors(t, a);
      if (i) len += pts[i].distanceTo(pts[i - 1]);
      for (let j = 0; j <= s; j++) { const an = j / s * TAU, cx = Math.cos(an), sy = Math.sin(an), nx = a.x * cx + b.x * sy, ny = a.y * cx + b.y * sy, nz = a.z * cx + b.z * sy;
        this.pos.push(pts[i].x + nx * radii[i], pts[i].y + ny * radii[i], pts[i].z + nz * radii[i]); this.nor.push(nx, ny, nz); this.uv.push(j / s, len * 0.35); }
      if (i) for (let j = 0; j < s; j++) { const p = base + (i - 1) * (s + 1) + j, q = p + s + 1; this.idx.push(p, p + 1, q, p + 1, q + 1, q); }
    }
    this.n += pts.length * (s + 1);
  }
  geometry() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setIndex(this.idx); return g; }
}
class Cards {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.col = []; this.idx = []; this.n = 0; }
  // quad from origin o along u (texture x, shade0 -> shade1) and v (texture y)
  quad(o, u, v, n, c, s0 = 1, s1 = 1) { const P = this.pos, k = this.n;
    P.push(o.x - v.x / 2, o.y - v.y / 2, o.z - v.z / 2, o.x + u.x - v.x / 2, o.y + u.y - v.y / 2, o.z + u.z - v.z / 2, o.x + u.x + v.x / 2, o.y + u.y + v.y / 2, o.z + u.z + v.z / 2, o.x + v.x / 2, o.y + v.y / 2, o.z + v.z / 2);
    for (let i = 0; i < 4; i++) this.nor.push(n.x, n.y, n.z); this.uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    this.col.push(c.r * s0, c.g * s0, c.b * s0, c.r * s1, c.g * s1, c.b * s1, c.r * s1, c.g * s1, c.b * s1, c.r * s0, c.g * s0, c.b * s0);
    this.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); this.n += 4; }
  geometry() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); g.setIndex(this.idx); return g; }
}

// spruce or fir: straight leader, whorls of drooping boughs, flat needle sprays plus hanging sprays for depth
export function conifer({ seed = 1, height = 10, radius = 2.7, whorls = 15, droop = 0.35, narrow = 1 } = {}) {
  const r = rng(seed), tb = new Tubes(6), cd = new Cards(), tl = new Tubes(4), cl = new Cards(), c = new THREE.Color(), n = new V3(), u = new V3(), v = new V3(), o = new V3(), d = new V3(), side = new V3();
  const lean = (r() - 0.5) * 0.25, tp = [], tr = []; for (let i = 0; i <= 8; i++) { const t = i / 8; tp.push(new V3(Math.sin(t * 2.4) * lean, t * height, Math.cos(t * 1.9) * lean * 0.6)); tr.push(lerp(height * 0.022, 0.012, Math.pow(t, 0.8))); }
  tb.limb(tp, tr); tl.limb(tp, tr);
  for (let w = 0; w < whorls; w++) { const t = lerp(0.13, 0.97, Math.pow(w / (whorls - 1), 0.85)), y = t * height, nb = t > 0.85 ? 4 : 5 + Math.floor(r() * 3), a0 = r() * TAU;
    for (let k = 0; k < nb; k++) { const an = a0 + k * TAU / nb + (r() - 0.5) * 0.5, L = radius * narrow * Math.pow(1 - t, 0.75) * (0.75 + r() * 0.5) + 0.25; if (t < 0.25 && r() < 0.35) continue;
      d.set(Math.cos(an), 0, Math.sin(an)); side.set(-d.z, 0, d.x); const dr = droop * (1 - t * 0.7) * (0.7 + r() * 0.6);
      const p0 = new V3(tp[0].x, y, tp[0].z), p1 = p0.clone().addScaledVector(d, L * 0.5).addScaledVector(UP, -L * 0.5 * dr * 0.6), p2 = p0.clone().addScaledVector(d, L).addScaledVector(UP, -L * dr * 0.55 + L * 0.1);
      tb.limb([p0, p1, p2], [lerp(0.05, 0.012, t) * height * 0.09 + 0.012, 0.016, 0.006], 3);
      c.setHSL(0.31 + r() * 0.05, 0.5, 0.42 + r() * 0.2); const tilt = (r() - 0.5) * 0.5;
      // flat spray along the bough
      u.subVectors(p2, p0).multiplyScalar(1.16); v.copy(side).multiplyScalar(L * (0.5 + r() * 0.2)).addScaledVector(UP, tilt * L * 0.3); n.copy(d).multiplyScalar(0.55).addScaledVector(UP, 0.85).normalize();
      o.copy(p0).addScaledVector(d, L * 0.06); cd.quad(o, u, v, n, c, 0.45, 1.05); cl.quad(o, u, v.clone().multiplyScalar(1.3).addScaledVector(UP, -L * 0.12), n, c, 0.38, 1.0);
      // hanging spray
      u.subVectors(p2, p0).multiplyScalar(1.05); v.set(0, L * 0.34, 0).addScaledVector(side, (r() - 0.5) * L * 0.2); o.copy(p0).addScaledVector(d, L * 0.1).addScaledVector(UP, -L * 0.15);
      n.copy(d).multiplyScalar(0.7).addScaledVector(side, (r() - 0.5)).addScaledVector(UP, 0.5).normalize(); cd.quad(o, u, v, n, c, 0.35, 0.85);
      if (L > radius * 0.5) { const sa = r() < 0.5 ? 1 : -1; u.copy(d).multiplyScalar(0.55).addScaledVector(side, sa * 0.7).normalize().multiplyScalar(L * 0.6).addScaledVector(UP, -L * 0.14); v.set(0, L * 0.22, 0).addScaledVector(d, -L * 0.3 * sa);
        o.copy(p1); cd.quad(o, u, v, n, c, 0.5, 0.95); } } }
  for (let k = 0; k < 3; k++) { const an = k * TAU / 3; u.set(0, height * 0.11, 0); v.set(Math.cos(an) * height * 0.07, 0, Math.sin(an) * height * 0.07); o.set(tp[8].x, height * 0.93, tp[8].z); n.set(Math.sin(an), 0.6, -Math.cos(an)).normalize(); c.setHSL(0.31, 0.5, 0.5); cd.quad(o, u, v, n, c, 0.7, 1.1); cl.quad(o, u, v, n, c, 0.7, 1.1); }
  // `lite`: the same tree for the middle distance, one spray per bough and no bough limbs
  return { trunk: tb.geometry(), cards: cd.geometry(), height, lite: { trunk: tl.geometry(), cards: cl.geometry() } };
}

// spreading tree: forks low, limbs wander, crown of spray cards. Good for sakura, oak, olive, banyan, fantasy elders.
export function broadleaf({ seed = 1, height = 8, spread = 0.75, depth = 4, forks = 3, gnarl = 0.3, up = 0.25, trunk = 0.3, radius = 0.32, cardSize = 1.5, cardsPer = 2, taper = 0.62, hue = [0.26, 0.34], sat = 0.5, light = [0.4, 0.62], flat = 0.4, weep = 0 } = {}) {
  const r = rng(seed), tb = new Tubes(7), cd = new Cards(), anchors = [], rv = () => new V3(r() - 0.5, r() - 0.5, r() - 0.5);
  const grow = (start, dir, len, rad, lvl) => { const n = lvl === 0 ? 5 : 4, pts = [start.clone()], rr = [rad], p = start.clone(), d = dir.clone();
    for (let i = 1; i <= n; i++) { d.addScaledVector(rv(), gnarl * (lvl ? 1 : 0.5)).addScaledVector(UP, lvl ? up * 0.25 - weep * lvl * 0.12 : 0.15).normalize(); p.addScaledVector(d, len / n); pts.push(p.clone()); rr.push(rad * lerp(1, taper, i / n));
      if (lvl >= depth - 1) anchors.push(p.clone()); }
    tb.limb(pts, rr);
    if (lvl >= depth) { anchors.push(p.clone().addScaledVector(d, len * 0.2)); return; }
    const kids = lvl === 0 ? forks : 2 + (r() < 0.45 ? 1 : 0), a0 = r() * TAU;
    for (let k = 0; k < kids; k++) { const i = lvl === 0 ? n : Math.min(n, 2 + Math.floor(r() * 3)), ax = new V3().crossVectors(pts[i].clone().sub(pts[i - 1]).normalize(), Math.abs(d.y) > 0.9 ? new V3(1, 0, 0) : UP).normalize();
      const nd = pts[i].clone().sub(pts[i - 1]).normalize(); ax.applyAxisAngle(nd, a0 + k * TAU / kids + (r() - 0.5) * 0.8); nd.applyAxisAngle(ax, spread * (0.6 + r() * 0.7));
      grow(pts[i], nd, len * (0.66 + r() * 0.2), rr[i] * (lvl === 0 ? 0.72 : 0.66), lvl + 1); }
    if (lvl > 0) grow(p, d, len * 0.75, rr[n] * 0.9, lvl + 1);
  };
  grow(new V3(0, 0, 0), new V3((r() - 0.5) * 0.3, 1, (r() - 0.5) * 0.3).normalize(), height * trunk, radius, 0);
  // root flare
  for (let k = 0; k < 5; k++) { const an = k * TAU / 5 + r(), d = new V3(Math.cos(an), 0, Math.sin(an)); tb.limb([new V3(0, radius * 2.2, 0).addScaledVector(d, radius * 0.5), new V3(0, radius * 0.5, 0).addScaledVector(d, radius * 1.5), new V3(0, -radius * 0.4, 0).addScaledVector(d, radius * 3.2)], [radius * 0.45, radius * 0.34, radius * 0.1]); }
  const ctr = new V3(); anchors.forEach(a => ctr.add(a)); ctr.multiplyScalar(1 / anchors.length); let far = 0; anchors.forEach(a => far = Math.max(far, a.distanceTo(ctr)));
  const c = new THREE.Color(), n = new V3(), u = new V3(), v = new V3(), o = new V3();
  for (const a of anchors) for (let k = 0; k < cardsPer; k++) { const s = cardSize * (0.7 + r() * 0.6), out = a.clone().sub(ctr), dist = out.length() / far; out.normalize();
    u.copy(rv()).normalize(); u.y *= 1 - flat; u.y -= weep * 0.9; u.normalize(); v.crossVectors(u, r() < flat ? UP : rv().normalize()).normalize(); if (v.lengthSq() < 0.01) v.set(1, 0, 0);
    n.copy(out).multiplyScalar(0.75).addScaledVector(UP, 0.55).normalize(); c.setHSL(lerp(hue[0], hue[1], r()), sat, lerp(light[0], light[1], r()));
    o.copy(a).addScaledVector(u, -s * 0.5).addScaledVector(rv(), s * 0.5); const sh = lerp(0.42, 1.08, clamp(dist * dist + (out.y * 0.25))); cd.quad(o, u.clone().multiplyScalar(s), v.clone().multiplyScalar(s), n, c, sh * 0.9, sh); }
  return { trunk: tb.geometry(), cards: cd.geometry(), height, center: ctr, far };
}

// ---- materials and planting -----------------------------------------------------------------------------------------
export function treeMats({ map, bark, barkColor = 0xffffff, wind = 0.12, h0 = 1, h1 = 8, emissive = 0x000000, emissiveIntensity = 0, roughness = 0.85, through = 0.6 }) {
  // leaves are Lambert surfaces lit by sun, sky and the light that passes through them: no gloss, no reflection probe per fragment
  const leaf = new THREE.MeshLambertMaterial({ map, alphaTest: 0.42, alphaToCoverage: true, side: THREE.DoubleSide, vertexColors: true, emissive, emissiveIntensity, emissiveMap: emissiveIntensity ? map : null });
  foliage(leaf, { amp: wind, freq: 1.25, scale: 0.21, h0, h1 }, through);
  const barkM = new THREE.MeshStandardMaterial({ map: bark, bumpMap: bark, bumpScale: 1.6, color: barkColor, roughness: 0.95 });
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.42 });
  return { leaf, bark: barkM, depth };
}
// list: [{ p:[x,y,z], s, ry, c }]
export function plant(scene, tree, mats, list, shadow = true, opts = null) {
  const fn = (i, d, c) => { const q = list[i]; d.position.set(q.p[0], q.p[1], q.p[2]); d.rotation.y = q.ry ?? 0; const s = q.s ?? 1; d.scale.set(s, s * (q.sy ?? 1), s); if (q.c) c.copy(q.c); };
  const lodT = opts?.lodAt && tree.lite ? { geo: tree.lite.trunk, at: opts.lodAt } : undefined, lodC = lodT && { geo: tree.lite.cards, at: opts.lodAt };
  const t = instanced(tree.trunk, mats.bark, list.length, fn, shadow, opts && { ...opts, lod: lodT }), l = instanced(tree.cards, mats.leaf, list.length, fn, shadow, opts && { ...opts, lod: lodC, depth: mats.depth }); if (!opts) l.customDepthMaterial = mats.depth;
  // crowns cast shadows but do not look them up: their shading comes from the canopy normals and baked occlusion, and the
  // filtered lookup is the dearest thing a leaf fragment can do
  l.traverse(o => { if (o.isMesh) o.receiveShadow = false; }); if (opts) t.traverse(o => { if (o.isMesh) o.receiveShadow = false; }); scene.add(t, l); return [t, l];
}

// a low shrub: shells of spray cards lying on a dome, the inner shell in shade
export function bush({ seed = 1, radius = 1, cards = 26, hue = [0.24, 0.32], light = [0.36, 0.56], sat = 0.5 } = {}) {
  const r = rng(seed), cd = new Cards(), c = new THREE.Color(), n = new V3(), u = new V3(), v = new V3(), o = new V3();
  for (let i = 0; i < cards; i++) { const sh = i < cards * 0.35 ? 0.55 : 1, an = r() * TAU, el = Math.acos(r() * 0.95), R = radius * sh;
    n.set(Math.sin(el) * Math.cos(an), Math.cos(el), Math.sin(el) * Math.sin(an)); o.copy(n).multiplyScalar(R * (0.75 + r() * 0.3)); o.y *= 0.8;
    u.set(-n.z, (r() - 0.3) * 0.6, n.x).normalize(); v.crossVectors(n, u).normalize(); const s = radius * (0.7 + r() * 0.5);
    c.setHSL(lerp(hue[0], hue[1], r()), sat, lerp(light[0], light[1], r())); o.addScaledVector(u, -s / 2); n.y += 0.5; n.normalize();
    cd.quad(o, u.multiplyScalar(s), v.multiplyScalar(s), n, c, sh * 0.8, sh * 1.05); }
  return cd.geometry();
}
// a clump of fine grass: each blade a tapered ribbon curving out from the root, dark at the foot and pale at the tip
export function grassClump({ seed = 1, blades = 9, height = 0.55, width = 0.028, spread = 0.11, lean = 0.45, segs = 4 } = {}) {
  const r = rng(seed), pos = [], nor = [], col = [], idx = [], c0 = new THREE.Color(), c1 = new THREE.Color(), c = new THREE.Color(); let n = 0;
  for (let b = 0; b < blades; b++) { const an = r() * TAU, ox = Math.cos(an), oz = Math.sin(an), rx = ox * spread * r(), rz = oz * spread * r(), h = height * (0.55 + r() * 0.75), ln = lean * (0.4 + r()), tw = an + Math.PI / 2 + (r() - 0.5), sx = Math.cos(tw), sz = Math.sin(tw);
    c0.setHSL(0.27 + r() * 0.05, 0.55, 0.1 + r() * 0.05); c1.setHSL(0.2 + r() * 0.09, 0.62, 0.36 + r() * 0.2);
    for (let i = 0; i <= segs; i++) { const t = i / segs, w = width * (1 - Math.pow(t, 1.6)) * 0.5 + 0.002, x = rx + ox * t * t * ln * h, y = t * h * (1 - 0.18 * t * ln), z = rz + oz * t * t * ln * h;
      pos.push(x - sx * w, y, z - sz * w, x + sx * w, y, z + sz * w); c.copy(c0).lerp(c1, Math.pow(t, 0.8)); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      const ny = 0.92, k = 0.4 * t; nor.push(ox * k - sx * 0.2, ny, oz * k - sz * 0.2, ox * k + sx * 0.2, ny, oz * k + sz * 0.2);
      if (i) { const a = n + (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    n += (segs + 1) * 2; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
}
// the same clump for the middle distance: a few broad blades that cover as much ground for a fifth of the triangles
export const grassFar = (height = 0.6, seed = 5) => grassClump({ seed, blades: 4, height, width: 0.075, spread: 0.2, lean: 0.5, segs: 2 });
export function grassMat({ wind = 0.16, height = 0.55, through = 0.9 } = {}) {
  // grass is a Lambert surface: blades overlap many layers deep, so each fragment has to stay cheap
  return foliage(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), { amp: wind, freq: 1.9, scale: 0.42, h0: 0, h1: height }, through);
}
// a weathered boulder
export function boulder(seed = 1, detail = 3) {
  const r = rng(seed), g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, v = new V3(), ph = [r() * 9, r() * 9, r() * 9];
  const n3 = (x, y, z) => Math.sin(x * 1.7 + ph[0]) * Math.sin(y * 2.1 + ph[1]) * Math.sin(z * 1.9 + ph[2]);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); let k = 1 + 0.28 * n3(v.x, v.y, v.z) + 0.12 * n3(v.x * 2.7, v.y * 2.7, v.z * 2.7) + 0.05 * n3(v.x * 6, v.y * 6, v.z * 6);
    v.multiplyScalar(k); v.y = Math.max(v.y * 0.72, -0.35); v.x = Math.round(v.x * 5) / 5 * 0.25 + v.x * 0.75; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}

// giant kelp: a stipe rising from a holdfast, long blades leaving it alternately, each buoyed by a float
export function kelp({ seed = 1, height = 30, blades = 26 } = {}) {
  const r = rng(seed), tb = new Tubes(5), cd = new Cards(), pts = [], rr = [], c = new THREE.Color(), n = new V3(), u = new V3(), v = new V3(), ph = r() * 6;
  for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new V3(Math.sin(t * 3 + ph) * 0.5, t * height, Math.cos(t * 2.3 + ph) * 0.5)); rr.push(lerp(0.09, 0.03, t)); }
  tb.limb(pts, rr);
  for (let k = 0; k < blades; k++) { const t = 0.06 + 0.94 * k / blades, i = Math.min(13, Math.floor(t * 14)), p = pts[i].clone().lerp(pts[i + 1], t * 14 - i), an = k * 2.4 + r(), L = (2.6 + r() * 2.2) * (1 - t * 0.35), W = 0.5 + r() * 0.35;
    u.set(Math.cos(an) * L, L * (0.25 + r() * 0.5), Math.sin(an) * L); v.set(-Math.sin(an) * W, 0.15, Math.cos(an) * W); n.set(Math.cos(an) * 0.3, 0.9, Math.sin(an) * 0.3).normalize(); c.setHSL(0.14 + r() * 0.07, 0.6, 0.3 + r() * 0.22); cd.quad(p, u.clone(), v.clone(), n, c, 0.6, 1.1); }
  return { trunk: tb.geometry(), cards: cd.geometry(), height };
}
export function kelpTex() {
  return canvasTex(512, 128, (g, W, H) => { const r = rng(4), gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#5a4a10'); gr.addColorStop(0.3, '#9a8a24'); gr.addColorStop(1, '#c8b040'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(4, H / 2); for (let x = 4; x <= W - 6; x += 12) g.lineTo(x, H / 2 - (10 + 46 * Math.sin(Math.PI * Math.pow(x / W, 0.6))) * (0.85 + r() * 0.25)); g.lineTo(W - 4, H / 2); for (let x = W - 6; x >= 4; x -= 12) g.lineTo(x, H / 2 + (10 + 46 * Math.sin(Math.PI * Math.pow(x / W, 0.6))) * (0.85 + r() * 0.25)); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,44,6,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(4, H / 2); g.lineTo(W - 20, H / 2); g.stroke(); g.fillStyle = '#b89c30'; g.beginPath(); g.ellipse(16, H / 2, 16, 11, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,240,150,0.18)'; g.lineWidth = 1.5; for (let i = 0; i < 26; i++) { const y = 20 + r() * (H - 40); g.beginPath(); g.moveTo(30, y); g.lineTo(W - 30, H / 2 + (y - H / 2) * 0.3); g.stroke(); } });
}
