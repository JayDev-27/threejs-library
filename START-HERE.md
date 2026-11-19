# Three.js Library

A curated showcase and library of state-of-the-art Three.js projects, interactive 3D environments, and creative web experiments.

## Current Featured Scene: Sunset Doorway Sanctuary

A cinematic 3D sunset meadow with camera projection handoff, instanced vegetation, interactive keepsakes, and dynamic lighting.

## Open the project

Install Node.js 22.12 or newer, then open a terminal in this folder and run:

```sh
npm ci
npm run dev
```

Open the localhost link printed in the terminal. A local web server is required; opening `index.html` directly will not load the app correctly.

## Configuration & Customization

Open `src/data/birthdayConfig.js` to change the scene content, messages, memories, photos, gifts, and surprises. Put your photos in `public/images/` and refer to them as `/images/your-photo.jpg`.

The app name and branding are configured in `index.html`. Icons and logos live in `public/`.

## Share or publish

```sh
npm run build
```

The `dist/` folder contains the production static website and can be deployed to any static host. If Python is installed, preview without npm:

```sh
python3 -m http.server 8000 --directory dist
```

Then open http://localhost:8000. On Windows, use `py` in place of `python3`.

The full README explains the scene architecture, controls, verification commands, and asset provenance.
