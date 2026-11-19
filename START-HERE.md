# Welcome to SiyaVerse

A little birthday world in a sunset meadow. Scroll toward the door, then explore the memories, cake, gifts, and twelve hidden surprises.

## Open the project

Install Node.js 22.12 or newer, then open a terminal in this folder and run:

```sh
npm ci
npm run dev
```

Open the localhost link printed in the terminal. A local web server is required; opening `index.html` directly will not load the app correctly.

## Make it yours

Open `src/data/birthdayConfig.js` to change the birthday name, messages, memories, photos, gifts, and surprises. Put your photos in `public/images/` and refer to them as `/images/your-photo.jpg`.

The app name is set in `index.html`. The reusable S logo and favicon live in `public/`.

## Share or publish

```sh
npm run build
```

The `dist/` folder is the complete static website and can be hosted by any static web host. A ready-built copy is included in this ZIP. If Python is installed, you can preview it without installing Node dependencies:

```sh
python3 -m http.server 8000 --directory dist
```

Then open http://localhost:8000. On Windows, use `py` in place of `python3`.

A short scroll recording is included in `preview/SiyaVerse-scroll.mp4`. The full README explains the scene, controls, verification commands, and asset provenance. Everything needed by the app is included; `node_modules` can be restored with `npm ci`.
