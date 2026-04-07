# CanvasOS

> **Open Source Forever** — [canvasos.art](https://canvasos.art)

CanvasOS is a free, open-source, cross-platform art creation platform that integrates **digital painting, AI generation, 3D sculpting, vector design, animation, music, generative code art, photography, and writing** into a single unified canvas.

[![CI](https://github.com/canvasos/canvasos/actions/workflows/ci.yml/badge.svg)](https://github.com/canvasos/canvasos/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PWA](https://img.shields.io/badge/PWA-ready-brightgreen)](https://canvasos.art)

---

## Architecture

```
canvasOS/
├── apps/
│   ├── web/            Vite + React 18 PWA (main app)
│   ├── desktop/        Tauri 2 desktop wrapper
│   └── mobile/         Capacitor 6 mobile wrapper
│
├── packages/
│   ├── core/           Canvas engine, state, file format, history
│   ├── ui/             Shared design system (Tailwind v4 + Radix UI)
│   ├── ai/             Provider-agnostic AI client (OpenAI, Stability, Replicate, Local)
│   └── modules/
│       ├── paint/      Digital painting (BrushEngine, ColorSystem, Selection)
│       ├── vector/     Vector design (paper.js, PenTool, BooleanOps)
│       ├── sculpt-3d/  3D sculpting (Three.js)
│       ├── animate/    Animation timeline (KeyframeEngine, VideoExporter)
│       ├── audio/      Music & audio (Tone.js, MIDI, StepSequencer)
│       ├── codeart/    Generative code art (Monaco, GLSL, p5.js sandbox)
│       ├── photo/      Photography (WebGL adjustments, BG removal, RAW)
│       └── write/      Writing & narrative (TipTap)
│
└── services/
    ├── api/            Fastify backend (Yjs collab, plugin registry, PostgreSQL)
    └── ai-gateway/     Python FastAPI (local Stable Diffusion inference)
```

**Data flow:**

```
Browser/Desktop/Mobile
        │
        ▼
  apps/web (Vite PWA)
        │
   lazy-loads modules
        │
        ├─ packages/core  (Zustand state, LayerCompositor WebGL, .cvos format)
        ├─ packages/ai    (ArtGenClient → OpenAI / Stability / Replicate / Local)
        └─ packages/modules/* (paint, vector, sculpt-3d, animate, audio, ...)
                                          │
                                    Web Workers
                          (compression, AI inference, file I/O)
                                          │
                             services/api (Fastify WebSocket + REST)
                                     │           │
                               Yjs real-time    PostgreSQL
                              collaboration      (project state)
```

---

## Quickstart

### Option 1 — Docker Compose

```bash
git clone https://github.com/canvasos/canvasos
cd canvasos
docker compose up
# API:  http://localhost:3001
```

With AI gateway (local Stable Diffusion):

```bash
docker compose --profile ai up
```

### Option 2 — Development from source

**Prerequisites:** Node 20+, pnpm 10+

```bash
git clone https://github.com/canvasos/canvasos
cd canvasos
pnpm install
pnpm dev        # Starts all packages in watch mode
# Web app:  http://localhost:3000
# API:      http://localhost:3001
```

### Desktop (Tauri)

```bash
pnpm --filter @canvasos/desktop dev
```

Requires: [Rust](https://rustup.rs/) + [Tauri prerequisites](https://tauri.app/start/prerequisites/)

### Mobile (Capacitor)

```bash
pnpm --filter @canvasos/mobile build
pnpm --filter @canvasos/mobile dev:android   # requires Android Studio
pnpm --filter @canvasos/mobile dev:ios       # requires Xcode (macOS only)
```

---

## Art Modules

| Module        | Description                                                | Key Tech                               |
| ------------- | ---------------------------------------------------------- | -------------------------------------- |
| **Paint**     | Stamp-based brush engine, 7 brush types, pressure dynamics | WebGL, OffscreenCanvas                 |
| **Vector**    | Bezier paths, shape primitives, boolean ops, text          | paper.js                               |
| **3D Sculpt** | Real-time mesh sculpting, pull/push/smooth tools           | Three.js                               |
| **Animate**   | Keyframe timeline, 12 easing types, video export           | FFmpeg.wasm, RAF                       |
| **Audio**     | 16-step sequencer, polyphonic synth, MIDI                  | Tone.js, Web MIDI                      |
| **Code Art**  | Live GLSL shaders, p5.js sandbox, Monaco editor            | WebGL, Monaco                          |
| **Photo**     | Non-destructive adjustments, curves, BG removal, RAW       | WebGL, Transformers.js                 |
| **Write**     | Rich text editor with word count and export                | TipTap                                 |
| **AI**        | Multi-provider image generation and inpainting             | OpenAI, Stability, Replicate, Local SD |

---

## File Format (.cvos)

Projects are saved as `.cvos` files — ZIP archives containing:

```
my-project.cvos
├── manifest.json       Format version, timestamps
├── canvas.json         Full project state (layers, metadata)
├── timeline.json       Animation keyframe data
├── assets/
│   ├── layers/         Per-layer PNG data (DEFLATE compressed)
│   ├── media/          Imported audio/video
│   └── 3d/             3D mesh assets
├── code/               Code art scripts
└── preview.png         512x512 thumbnail
```

---

## AI Configuration

API keys are stored **locally only** — never sent to CanvasOS servers.

- **Browser:** AES-256-GCM encrypted IndexedDB
- **Desktop (Tauri):** OS keychain via `tauri-plugin-stronghold`

Configure in the AI panel (I key) → click the key icon.

| Provider     | Models               | Notes                                |
| ------------ | -------------------- | ------------------------------------ |
| OpenAI       | DALL-E 3             | Requires API key                     |
| Stability AI | SD3, Inpainting      | Requires API key                     |
| Replicate    | FLUX 1.1 Pro         | Requires API key                     |
| Local        | Stable Diffusion 2.1 | Run `docker compose --profile ai up` |

---

## Plugin SDK

Plugins load in a sandboxed Web Worker:

```typescript
// my-plugin/index.js
const layers = await canvasOS.canvas.getLayers();
const id = await canvasOS.canvas.insertLayer({
  type: "raster",
  name: "My Plugin Layer",
});
await canvasOS.ui.showPanel("<h2>Hello from plugin!</h2>");
```

**Plugin Manifest:**

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "permissions": ["canvas.read", "canvas.write", "ui.panel"],
  "entrypoint": "index.js"
}
```

---

## Contributing

1. Fork the repo
2. `pnpm install`
3. Create a feature branch: `git checkout -b feat/my-feature`
4. Make changes; run `pnpm test` and `pnpm lint`
5. Open a Pull Request

### Code style

- TypeScript strict mode throughout
- ESLint (typescript-eslint) + Prettier
- All UI components must have ARIA labels
- No telemetry without explicit user opt-in

### License compliance

All dependencies must be MIT / Apache-2.0 / BSD / CC0.
CI runs `license-checker` and fails on GPL or proprietary dependencies.

---

## Performance targets

- 60+ FPS on 4K canvas with 20 layers
- < 2s First Contentful Paint on 4G
- PWA installable and works 100% offline (painting, vector, photo, animation, audio)
- AI features degrade gracefully offline with a helpful message

---

## License

MIT © CanvasOS Contributors

_CanvasOS — Open Source Forever — canvasos.art_
