// 11 Suzume Door · Sunset Sanctuary: the iconic weathered doorway in a twilight meadow.
import * as THREE from '../lib/three.module.min.js';
import { U, Builder, stdMat, groundMat, instanced, terrain, windify, sky, points, sunLight, rng, fbm2, noise2, lerp, smooth, TAU } from '../lib/kit.js';
import { grassClump, grassFar, grassMat, boulder } from '../lib/flora.js';

// Rolling alpine meadow with a slight rise where the doorway stands
function H(x, z) {
  const d = Math.hypot(x, z);
  const crest = Math.exp(-d * 0.08) * 0.45;
  const roll = (fbm2(x * 0.035 + 12, z * 0.035 + 8, 4) - 0.5) * 2.8;
  const path = smooth(1.6, 0.0, Math.abs(x)) * smooth(24, 0, z) * -0.15;
  return 0.15 + crest + roll * smooth(3.0, 16.0, d) + path;
}

export default {
  build({ scene, look, env }) {
    const r = rng(27);
    const sunDir = new THREE.Vector3(0.18, 0.09, -1.0).normalize();
    scene.fog = new THREE.FogExp2(0x2a1628, 0.0038);

    // ---- sky: twilight sunset dome ----
    const dome = sky({
      top: 0x1b1028,
      horizon: 0xf37e50,
      bottom: 0x381928,
      sunDir,
      sunColor: 0xffaa66,
      sunSize: 0.0014,
      sunIntensity: 38,
      sunGlow: 2.0,
      clouds: 0.62,
      cloudColor: 0xf59872,
      cloudDark: 0x542848,
      pow: 0.55
    });
    scene.add(dome);
    env(dome, 0.6);

    const hemi = new THREE.HemisphereLight(0x5a3d72, 0x3d271a, 0.65);
    scene.add(hemi);

    const sun = sunLight(scene, {
      dir: sunDir,
      color: 0xffa366,
      intensity: 4.2,
      box: 40,
      far: 350,
      map: 2048,
      target: [0, 1.2, 0]
    });

    U.uCloudSh.value.set(0.5, 0.008, 0.015);
    U.uMist.value.set(0.015, 8, 0);

    // ---- terrain: golden sunset meadow ----
    const a = new THREE.Color(), b = new THREE.Color();
    scene.add(terrain({
      size: 600,
      seg: 200,
      height: H,
      mat: groundMat({ scale: 0.4, detail: 4, bump: 0.5, contrast: 0.8 }),
      color: (x, z, y, slope, c) => {
        const n = fbm2(x * 0.06, z * 0.06, 3);
        const dist = Math.hypot(x, z);
        // Path leading up to the door
        const isPath = Math.abs(x) < 1.4 && z > 0 && z < 24;
        a.set(0x384a22).lerp(b.set(0x5a6328), n);
        c.copy(a);
        if (isPath) c.lerp(b.set(0x5a4836), 0.65);
        // Distant hills tinted by twilight
        if (dist > 70) c.lerp(b.set(0x301828), smooth(70, 220, dist));
      }
    }));

    // ---- stepping stones in front of the door ----
    const stoneBuilder = new Builder();
    const stones = [
      [0, 0.05, 1.6, 0.85, 0.1, 0.55, 0.12],
      [-0.1, 0.06, 3.4, 0.75, 0.09, 0.5, -0.08],
      [0.08, 0.04, 5.2, 0.8, 0.09, 0.52, 0.15],
      [-0.05, 0.05, 7.2, 0.7, 0.08, 0.48, -0.1],
      [0.06, 0.03, 9.4, 0.82, 0.08, 0.52, 0.05],
      [-0.04, 0.04, 11.8, 0.75, 0.08, 0.46, -0.12],
      [0.05, 0.03, 14.5, 0.8, 0.07, 0.5, 0.08]
    ];
    for (const [sx, sy, sz, sw, sh, sd, srot] of stones) {
      stoneBuilder.box(sw, sh, sd, { p: [sx, H(sx, sz) + sy, sz], r: [0, srot, 0], c: 0x483e38 });
    }
    scene.add(stoneBuilder.mesh(stdMat({ roughness: 0.9, metalness: 0.05 })));

    // ---- weathered boulders ----
    const rockGeo = boulder(5, 2);
    const rockMat = stdMat({ roughness: 0.92 });
    const rockInstances = [
      [-4.2, 3.5, 1.4], [3.8, 4.2, 1.1], [-6.5, 12, 1.8], [5.5, 14, 1.5],
      [-8.0, 22, 2.2], [7.2, 20, 1.9], [-12, -8, 2.8], [14, -12, 3.2]
    ];
    for (const [rx, rz, rs] of rockInstances) {
      const rm = new THREE.Mesh(rockGeo, rockMat);
      rm.position.set(rx, H(rx, rz) + rs * 0.35, rz);
      rm.scale.set(rs, rs * 0.8, rs);
      rm.rotation.set(r() * 0.3, r() * TAU, r() * 0.3);
      rm.castShadow = rm.receiveShadow = true;
      scene.add(rm);
    }

    // ---- grass clumps across the meadow ----
    const gcNear = grassClump({ seed: 7, blades: 7, height: 0.65, width: 0.032 });
    const gcFar = grassFar(0.7, 9);
    const gm = grassMat({ wind: 0.22, height: 0.65, through: 0.85 });

    const grassNearList = [], grassFarList = [];
    for (let i = 0; i < 3200; i++) {
      const gx = (r() - 0.5) * 70;
      const gz = (r() - 0.5) * 70 + 8;
      // Keep path clear
      if (Math.abs(gx) < 0.9 && gz > -1 && gz < 20) continue;
      // Keep door footprint clear
      if (Math.abs(gx) < 1.3 && Math.abs(gz) < 1.2) continue;
      const gy = H(gx, gz);
      const d = Math.hypot(gx, gz - 8);
      if (d < 22) {
        grassNearList.push({ p: [gx, gy, gz], s: 0.75 + r() * 0.5, ry: r() * TAU });
      } else {
        grassFarList.push({ p: [gx, gy, gz], s: 0.85 + r() * 0.6, ry: r() * TAU });
      }
    }

    if (grassNearList.length) {
      scene.add(instanced(gcNear, gm, grassNearList.length, (i, d, c) => {
        const item = grassNearList[i];
        d.position.set(...item.p);
        d.scale.set(item.s, item.s, item.s);
        d.rotation.y = item.ry;
        c.setHSL(0.24 + r() * 0.07, 0.55, 0.32 + r() * 0.18);
      }, true, { cell: 20, far: 45 }));
    }

    if (grassFarList.length) {
      scene.add(instanced(gcFar, gm, grassFarList.length, (i, d, c) => {
        const item = grassFarList[i];
        d.position.set(...item.p);
        d.scale.set(item.s, item.s, item.s);
        d.rotation.y = item.ry;
        c.setHSL(0.24 + r() * 0.07, 0.5, 0.28 + r() * 0.15);
      }, false, { cell: 35, far: 80 }));
    }

    // ---- THE SUZUME DOORWAY (Centerpiece) ----
    // Door frame: weathered timber jambs and lintel
    const frameBuilder = new Builder();
    const woodColor = 0x422a18;
    const sillColor = 0x2e2723;
    // Left jamb
    frameBuilder.box(0.16, 2.85, 0.22, { p: [-0.88, 1.42, 0], c: woodColor });
    // Right jamb
    frameBuilder.box(0.16, 2.85, 0.22, { p: [0.88, 1.42, 0], c: woodColor });
    // Top head / lintel
    frameBuilder.box(2.05, 0.18, 0.26, { p: [0, 2.85, 0], c: woodColor });
    // Pediment trim above lintel
    frameBuilder.box(2.18, 0.08, 0.3, { p: [0, 2.98, 0], c: 0x362112 });
    // Stone threshold
    frameBuilder.box(2.2, 0.16, 0.52, { p: [0, 0.08, 0], c: sillColor });
    // Left & right frame stabilizers / weathered timber buttresses
    frameBuilder.box(0.12, 0.9, 0.45, { p: [-0.88, 0.45, 0.12], c: woodColor });
    frameBuilder.box(0.12, 0.9, 0.45, { p: [0.88, 0.45, 0.12], c: woodColor });

    const frameMesh = frameBuilder.mesh(stdMat({ roughness: 0.88, metalness: 0.05 }));
    frameMesh.position.set(0, H(0, 0), 0);
    scene.add(frameMesh);

    // Door hinge & door panel (pivots around left jamb)
    const doorHinge = new THREE.Group();
    doorHinge.position.set(-0.8, H(0, 0) + 0.16, 0);

    const doorBuilder = new Builder();
    const panelColor = 0x5a3820;
    const grooveColor = 0x362010;
    const brassColor = 0xd4a046;

    // Main door slab (width 1.58m, height 2.62m, thickness 0.07m)
    // Centered at x = 0.79 relative to hinge
    doorBuilder.box(1.58, 2.62, 0.07, { p: [0.79, 1.31, 0], c: panelColor });
    // Top and bottom rail trim
    doorBuilder.box(1.58, 0.12, 0.085, { p: [0.79, 0.16, 0], c: grooveColor });
    doorBuilder.box(1.58, 0.12, 0.085, { p: [0.79, 2.46, 0], c: grooveColor });
    doorBuilder.box(1.58, 0.14, 0.085, { p: [0.79, 1.25, 0], c: grooveColor });
    // Vertical stile trims
    doorBuilder.box(0.12, 2.62, 0.085, { p: [0.1, 1.31, 0], c: grooveColor });
    doorBuilder.box(0.12, 2.62, 0.085, { p: [1.48, 1.31, 0], c: grooveColor });
    // Recessed panels
    doorBuilder.box(0.55, 0.9, 0.065, { p: [0.46, 1.82, 0], c: 0x4e2e18 });
    doorBuilder.box(0.55, 0.9, 0.065, { p: [1.12, 1.82, 0], c: 0x4e2e18 });
    doorBuilder.box(0.55, 0.85, 0.065, { p: [0.46, 0.68, 0], c: 0x4e2e18 });
    doorBuilder.box(0.55, 0.85, 0.065, { p: [1.12, 0.68, 0], c: 0x4e2e18 });
    // Vintage round brass knob and escutcheon plate
    doorBuilder.cyl(0.045, 0.045, 0.015, 12, { p: [1.38, 1.25, 0.045], r: [Math.PI / 2, 0, 0], c: brassColor });
    doorBuilder.sph(0.035, { p: [1.38, 1.25, 0.075], c: brassColor });
    doorBuilder.cyl(0.045, 0.045, 0.015, 12, { p: [1.38, 1.25, -0.045], r: [Math.PI / 2, 0, 0], c: brassColor });
    doorBuilder.sph(0.035, { p: [1.38, 1.25, -0.075], c: brassColor });

    const doorMesh = doorBuilder.mesh(stdMat({ roughness: 0.72, metalness: 0.15 }));
    doorHinge.add(doorMesh);
    scene.add(doorHinge);

    // Warm sanctuary light radiating from behind/through the doorway
    const portalLight = new THREE.PointLight(0xff9840, 0, 18, 1.4);
    portalLight.position.set(0, H(0, 0) + 1.4, -0.3);
    scene.add(portalLight);

    // Soft glowing aperture plane inside the frame
    const apertureGeo = new THREE.PlaneGeometry(1.6, 2.65);
    const apertureMat = new THREE.MeshBasicMaterial({
      color: 0xffaa55,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const aperture = new THREE.Mesh(apertureGeo, apertureMat);
    aperture.position.set(0, H(0, 0) + 1.45, -0.04);
    scene.add(aperture);

    // Floating sunset embers & pollen motes
    const pollen = points({
      count: 1400,
      size: 0.065,
      gain: 2.2,
      color: 0xffbf75,
      opacity: 0.85,
      spawn: (i, v, q) => v.set((q() - 0.5) * 40, H(0, 0) + 0.3 + q() * 12, (q() - 0.5) * 40 + 6),
      motion: 'p += vec3(sin(uTime*0.35 + s.x*18.0)*0.7, sin(uTime*0.25 + s.y*15.0)*0.4 + 0.05, cos(uTime*0.3 + s.z*18.0)*0.7); a *= 0.5 + 0.5*sin(uTime*1.8 + s.w*24.0);'
    });
    scene.add(pollen);

    // Post-processing and look grading
    Object.assign(look, {
      bloom: 0.55,
      bloomThreshold: 0.95,
      vignette: 0.42,
      contrast: 1.14,
      saturation: 1.22,
      godPos: sunDir,
      godDir: true,
      godColor: new THREE.Color(0xff9450),
      grain: 0.025,
      ao: 0.92,
      aoRadius: 1.05
    });

    const su = dome.userData.u;

    return {
      parallax: 0.35,
      floor: (x, z) => Math.max(H(x, z), 0),
      clearance: 0.5,
      rail: [
        { p: 0, pos: [0, H(0, 22) + 1.7, 22], look: [0, H(0, 0) + 1.5, 0], fov: 42 },
        { p: 0.22, pos: [-1.4, H(-1.4, 15) + 1.5, 15], look: [0, H(0, 0) + 1.45, 0], fov: 44 },
        { p: 0.48, pos: [0.6, H(0.6, 8) + 1.4, 8], look: [0, H(0, 0) + 1.4, 0], fov: 46 },
        { p: 0.72, pos: [0, H(0, 0) + 1.42, 3.2], look: [0, H(0, 0) + 1.4, 0], fov: 48 },
        { p: 0.88, pos: [0, H(0, 0) + 1.42, 1.0], look: [0, H(0, 0) + 1.4, -3], fov: 52 },
        { p: 1.0, pos: [0, H(0, 0) + 1.42, -1.8], look: [0, H(0, 0) + 1.4, -8], fov: 56 }
      ],
      update(t, p) {
        // Door swings open inward as user approaches the doorway
        const doorOpen = smooth(0.38, 0.82, p);
        doorHinge.rotation.y = -doorOpen * 1.52; // Opens ~87 degrees inward

        // Portal light and aperture glow
        const glow = smooth(0.42, 0.95, p);
        portalLight.intensity = glow * 6.5;
        apertureMat.opacity = glow * 0.45;

        // Subtle twilight shift across the journey
        const dusk = smooth(0, 1, p);
        sun.intensity = lerp(4.2, 5.0, dusk);
        look.god = lerp(0.65, 0.95, glow);
        look.exposure = lerp(0.98, 1.06, glow);
      }
    };
  }
};
