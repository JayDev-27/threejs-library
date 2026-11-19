# Three.js Library

> A curated collection and showcase of state-of-the-art Three.js scenes, interactive 3D experiments, and creative WebGL environments.

This repository serves as a library of advanced Three.js projects, showcasing state-of-the-art WebGL techniques including camera projection handoffs, instanced vegetation, procedural textures, interactive 3D elements, dynamic lighting, and smooth scroll orchestration.

---

## Featured Project: Sunset Doorway Sanctuary

An interactive 3D sunset meadow with an opening camera handoff, 55,000 instanced grass blades, procedural shaders, and interactive keepsakes. Built with Vite, Three.js, GSAP ScrollTrigger, Lenis, and procedural canvas textures.

### Run locally

```sh
npm install
npm run dev
```

Open the URL Vite prints. `npm run build` creates the static site in `dist/`; `npm run preview` serves the production build.

## Personalize

Edit **`src/data/birthdayConfig.js`** for the recipient’s name, eight memories, handwritten notes, four gifts, birthday wish, and hidden surprises. No 3D code changes are needed.

- Put personal images in `public/images/`, then set a memory’s `imageUrl` to `/images/your-photo.jpg`. Leave it empty for the included procedural illustrations. Captions, dates, rotation, and the note on the back are configured alongside each image.
- Gift types include `letter`, `photos`, `music`, and `voucher`. Set `surpriseType` to `video` or `audio` and supply `mediaUrl` to show a native media player. Other media URLs display an image.
- All sample memories and messages are fictional placeholders, ready to replace.

## The experience

The opening uses the supplied **closed-door** reference, optimized to WebP, with semantic HTML titles, floating pollen, and a clickable doorway. The camera and photographic door textures match the cover's framing. During the first scroll movement, it hands over to a perspective-projected landscape made from a matching clean plate. The door stays closed during this handoff, then swings inward. A stencil aperture reveals the birthday sanctuary only through the doorway until the camera crosses the threshold. Scrolling backward returns to the closed cover.

The scene combines image projection with 55,000 instanced grass blades, four swaying wildflower species, clover detail, a displaced meadow, a hinged timber door, fairy lights, birthday bunting, a two-tier cake, gift boxes, a memory trellis, lanterns, and additive particles. Low-angle golden light, violet ambient fill and contact shadows carry the sunset into the interactive scene. The sky dome combines FBM clouds with a sky-only crop of the supplied artwork. Desktop rendering caps pixel ratio at 2, mobile at 1.5. The photographic scenery is not a fully modeled reconstruction of every flower in the reference.

Scroll normally, use the chapter dots, or choose **Begin the journey** for a guided entrance. In the sanctuary:

- Click a Polaroid to inspect and flip it. Pinned notes open as paper keepsakes.
- Make a wish to extinguish the candles, release smoke and confetti, and launch fireworks. Relight the cake to wish again.
- Open all four gifts to find letters, illustrated memories, a music-box melody, and an adventure voucher.
- Play the birthday banner, release butterflies from the flowers, launch lanterns, and inspect the cake’s star to discover all twelve wonders.
- Use the bottom navigation or the discovery counter for keyboard-accessible keepsakes and secrets. Escape closes a keepsake; **Back to sanctuary** restores the overview.

Sound starts muted. Enabling it synthesizes meadow wind and gentle chimes locally with Web Audio. Microphone access is requested only by **Use my microphone**; it is processed locally, never recorded or uploaded, and stops on detection, close, tab hiding, or after 15 seconds. HTTPS or localhost is required for microphone access. The click-to-blow alternative always works.

Reduced motion disables the long automatic journey and environmental oscillation, shortens the scroll track, and makes focus transitions immediate. A WebGL failure preserves the illustrated background and keepsakes through the HTML controls.

## Validation

With the dev server running:

```sh
npm run check
```

The Playwright script uses installed Google Chrome to verify desktop and mobile layouts, the journey, memories, candle extinguishing and relighting, gifts, and discoveries. It checks console errors, shader errors, failed network requests, and horizontal overflow. Screenshots and the result JSON are written to `test-results/` (ignored by Git). A real microphone and real device GPU performance need device testing.

`npm run check:lifecycle` additionally verifies direct raycast hover/click, microphone track cleanup using a synthetic Chrome audio device, and keepsake access when WebGL is unavailable. Set `APP_URL` to test a production preview instead of the default dev server. Static mesh details are batched to reduce draw calls; current render metrics are recorded in `test-results/verification.json`.

`npm run check:cover` captures the opening and seven positions along the scroll, checks that the door stays closed during the handoff, verifies reverse scrolling, and captures mobile framing.

## Structure

```text
src/
  main.js                      Journey, accessible controls, keepsake dialogs
  data/birthdayConfig.js       Personal content
  scene/World.js               Renderer, lighting, bloom, grading
  scene/SunsetSky.js           Animated surrounding sky dome
  scene/ReferenceLandscape.js  Matching photographic terrain and distant scenery
  scene/referenceLook.js       Cover camera framing and reference color handling
  scene/MeadowPathway.js       Terrain, instanced grass and flowers
  scene/PortalDoor.js          Wood door, hinge, portal light
  scene/BirthdaySanctuary.js   Sanctuary composition and lanterns
  scene/elements/              Banner, table, cake, gifts, memory trellis
  scene/Atmosphere.js          Pollen, smoke, butterflies, fireworks
  interaction/                Raycasting and hover feedback
  audio/                      Synthesized sound and microphone lifecycle
  utils/                      Deterministic procedural textures
```

## Asset provenance

- **Opening artwork:** the user's closed-door reference, retained in `reference/closed-door-cover.png`. Display copy: `public/images/closed-door-cover.webp`. Door textures and sky are cropped from that same artwork. The earlier open-door reference is retained in `reference/`.
- **Matching landscape:** door-removal edit made with the built-in image-generation tool and integrated as `public/images/meadow-landscape.webp`. See [asset provenance and final prompt](reference/ASSETS.md). No ownership or independent license for the supplied artwork is asserted.
- **3D meshes, materials, illustrations, effects:** created procedurally in this project. No remote model or stock-image dependencies.
- **Fonts:** Cormorant Garamond, Caveat, and Plus Jakarta Sans, downloaded from Google Fonts and self-hosted. SIL Open Font License texts are bundled in `public/fonts/`.

Implementation references: [Three.js documentation](https://threejs.org/docs/) and [GSAP ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/). This project does not use generated video sequences.
