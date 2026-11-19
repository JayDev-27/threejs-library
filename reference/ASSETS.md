# Closed-door reference and environment

The cover is the user's second supplied image, unchanged apart from WebP compression. The 3D door face and frame use crops from that same image, with real hinge geometry and thickness. A photographic landscape projection preserves the cover's horizon, flowers and cloud positions as the camera starts moving; the near field adds real instanced vegetation, clover detail and contact shadows. The scenery is a combination of image projection and procedural 3D, rather than a fully modeled reconstruction of every flower in the photograph.

## Files

- `reference/closed-door-cover.png`: original user-supplied closed-door reference, 1672 × 941.
- `public/images/closed-door-cover.webp`: optimized cover used by the page.
- `public/images/door-face.webp` and `public/images/door-frame.webp`: source-image crops mapped onto the hinged 3D door and its frame.
- `public/images/closed-door-sky.webp`: sky-only crop, used for the surrounding fallback dome.
- `reference/meadow-landscape-generated.png`: generated environment plate with the door removed.
- `public/images/meadow-landscape.webp`: optimized environment plate used by the terrain and distant scenery.

## Generation provenance

The environment plate was edited using the built-in **image_gen** tool with `reference/closed-door-cover.png` as the sole reference and an opaque background. The opening cover itself was not regenerated. The selected result was inspected and copied into this project; the original tool result remains under the Codex generated-images directory.

Final prompt:

> Use case: precise-object-edit. Asset type: matching clean landscape plate for a Three.js scene; source image is the edit target. Remove ONLY the freestanding closed wooden door and its frame in the center. Fill that exact area naturally with the existing distant hills, glowing sunset and continuous wildflower meadow so there is no trace of a door. Keep the camera, original framing, horizon height, every existing cloud formation, sunlight direction, violet/orange sky, mountain shapes, and all existing foreground purple lupines, blue cornflowers, pink cosmos and yellow daisies unchanged. No new objects. No doorway, arch, building, path, people, text or borders. Preserve the original wide aspect ratio. Preserve the extremely rich photographic detail, saturated gold sunset backlighting and dark green foreground contrast of the provided image. This needs to align with the original image as closely as possible for a seamless transition.

The user-supplied artwork's ownership and license have not been independently established. No external stock images or models were added.
