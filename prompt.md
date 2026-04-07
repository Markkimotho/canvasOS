# CanvasOS — Agent Build Prompt

### CONTEXT

You are a senior full-stack developer. Your mission is to scaffold and build **CanvasOS** , a free, open-source, cross-platform art creation platform that integrates **digital painting, AI generation, 3D sculpting, vector design, animation, music, generative code art, photography, and writing** into a single unified canvas.

**Platform:** Progressive Web App (PWA) + Tauri desktop + Capacitor mobile
**License:** MIT
**Repo structure:** Turborepo monorepo
**Stack:** React 18 + TypeScript 5 + Vite + PixiJS 8 + Three.js + Tone.js + Yjs + Fastify + PostgreSQL

---

## PHASE 0 — Repository Setup

1. Initialize a **Turborepo monorepo** with these packages:
   - `apps/web` — Vite + React 18 + TypeScript PWA
   - `apps/desktop` — Tauri 2 wrapping `apps/web`
   - `apps/mobile` — Capacitor 6 wrapping `apps/web`
   - `packages/core` — canvas engine, state, file format
   - `packages/ui` — shared design system (Tailwind v4 + Radix UI)
   - `packages/ai` — provider-agnostic AI client
   - `packages/modules/paint` — digital painting
   - `packages/modules/vector` — vector design
   - `packages/modules/sculpt-3d` — 3D sculpting
   - `packages/modules/animate` — animation timeline
   - `packages/modules/audio` — music & audio
   - `packages/modules/codeart` — generative code art
   - `packages/modules/photo` — photography
   - `packages/modules/write` — writing & narrative
   - `services/api` — Fastify backend (optional cloud)
   - `services/ai-gateway` — Python FastAPI (local SD inference)
2. Configure: TypeScript 5 strict, ESLint (airbnb-typescript), Prettier, Husky pre-commit, Vitest
3. Create root `README.md` with project description, ASCII architecture diagram, quickstart (`npx canvasos` / `docker compose up`), contribution guide, MIT License.

---

## PHASE 1 — Core Canvas Engine (`packages/core`)

1. **CanvasState** (Zustand + Immer): Layer tree, 500-step undo/redo history, viewport (zoom/pan), selection, project metadata.
2. **LayerCompositor** (PixiJS 8 RenderTextures + GLSL): All 18 blend modes as WebGL fragment shaders. Must render 60+ FPS on 4K with 20 layers.
3. **.cvos file format** (JSZip): `manifest.json`, `canvas.json`, `timeline.json`, `assets/layers/` (LZ4-compressed PNG), `assets/media/`, `assets/3d/`, `code/`, `preview.png`.
4. **PointerEventHandler** : Normalizes mouse/touch/stylus to `StrokePoint { x, y, pressure, tiltX, tiltY, timestamp }`. Catmull-Rom spline smoothing.
5. **HistoryManager** : Immer patch-based undo/redo. No full re-renders — apply patches incrementally.

---

## PHASE 2 — Painting Module (`packages/modules/paint`)

1. **BrushEngine** : Stamp-based WebGL rendering. Built-in types: HardRound, SoftRound, Textured, InkPen, Watercolor (wet-edge), Airbrush, Eraser. Parameters: size, opacity, flow, hardness, spacing, dynamics, pressure curves.
2. **BrushPresetManager** : Load/save/export presets to JSON. Support texture stamps from user-imported images.
3. **ColorSystem** : HSB/RGB/CMYK/HEX with lossless conversion. ColorWheel (HSB disc), SwatchPalette, GradientEditor (linear/radial/conic), PipetteEyedropper (reads composited output).
4. **Selection Tools** : RectangularMarquee, EllipticalMarquee, Lasso, MagicWand (flood fill, tolerance slider), QuickMask. Output: floating Uint8ClampedArray mask channel.

---

## PHASE 3 — AI Module (`packages/ai`)

1. **ArtGenClient** : Provider-agnostic class. Providers: `OpenAIProvider` (DALL·E 3), `StabilityProvider` (SD3), `ReplicateProvider` (FLUX), `LocalProvider` (WebGPU stub).
2. **AI Panel UI** : Prompt textarea, model selector, width/height sliders, n-variants (1–8), negative prompt, seed, style-reference drag-drop. On generate: skeleton placeholder layers. On complete: insert each variant as a canvas layer.
3. **Inpainting** : User makes a selection → clicks "Generate in Selection" → capture canvas content + mask → send to provider inpaint endpoint → composite result back with optional feathering.
4. **Prompt History** : Store last 200 prompts per project. Sidebar with thumbnail results. Click to repopulate prompt panel.
5. **SECURITY** : API keys MUST be stored locally (OS keychain via Tauri keyring / AES-256-GCM encrypted IndexedDB on web). **NEVER** send API keys to CanvasOS backend servers.

---

## PHASE 4 — Vector Module (`packages/modules/vector`)

1. **VectorLayer** : paper.js engine. Renders to WebGL texture via OffscreenCanvas at end of each edit.
2. **PenTool** : Click/drag anchors, Bezier handles, node edit mode (smooth ↔ corner). Stroke: color, width, dash, cap, join. Fill: solid/gradient/pattern/none.
3. **Shape Primitives** : Rectangle, RoundedRect, Ellipse, Polygon (n sides), Star (n points), Line, Arrow. All parametric and re-editable.
4. **Boolean Operations** : Union, Subtract, Intersect, Exclude, Divide via `paper.PathItem.*`.
5. **TextTool** : Font picker (system + bundled Google Fonts), size/tracking/leading/alignment. Non-destructive — never auto-rasterize.

---

## PHASE 5 — Animation Module (`packages/modules/animate`)

1. **Timeline UI** : Horizontal scrollable tracks per layer. Keyframe diamonds. Scrubable playhead. Time zoom 1x–100x.
2. **KeyframeEngine** : Animate: x, y, scaleX, scaleY, rotation, opacity, filterValue. Easing: linear, easeIn/Out/InOut (quadratic/cubic), spring (critically damped), customBezier.
3. **Frame-by-Frame** : Multiple frame cels per layer. Onion skinning (±5 frames, configurable opacity).
4. **VideoExporter** : MediaRecorder (WebM) + FFMPEG.wasm → MP4 (H.264/H.265), GIF, WebM, APNG, image sequence. Settings: quality, FPS (12/24/30/60), resolution.

---

## PHASE 6 — Audio Module (`packages/modules/audio`)

1. **AudioLayer** : Import WAV/MP3/FLAC/OGG/AAC. Waveform visualization in Timeline. Frame-accurate sync to animation.
2. **StepSequencer** : 16-step grid, BPM/swing, 8 instrument rows. Tone.js Sampler with bundled CC0 drum kit WAVs. Drives `Tone.Transport` synced to animation timeline.
3. **MiniSynth** : `Tone.PolySynth` — oscillator type, ADSR, low-pass filter (cutoff + resonance), reverb + delay send.
4. **Web MIDI** : Auto-detect devices. Route note events to active synth. Route CC events to configurable parameter mappings.

---

## PHASE 7 — Photography Module (`packages/modules/photo`)

1. **PhotoLayer** : Non-destructive. Parameters applied via WebGL shaders at render time. Params: exposure, contrast, highlights, shadows, whites, blacks, clarity, vibrance, saturation, temperature, tint.
2. **Curves Editor** : 4-channel (RGB + R + G + B). Interactive spline UI. Output: 256-entry LUT → 1D WebGL texture.
3. **Background Removal** : Transformers.js RMBG-1.4 model in Web Worker. No external API. Process ≤1024px; tile larger.
4. **RAW Decoding** : libraw.js (WASM). Support CR2, CR3, NEF, ARW, DNG. 16-bit linear RGB output.

---

## PHASE 8 — Generative Code Module (`packages/modules/codeart`)

1. **CodeLayer + Monaco Editor** : JavaScript (with CanvasOS API types) + GLSL. Hot-reload with 300ms debounce.
2. **JS Sketches** : Sandboxed iframe + postMessage. Inject p5.js + `canvasOS` object exposing: `.width`, `.height`, `.frame`, `.captureFrame()`.
3. **GLSL Shaders** : Fragment shader on fullscreen quad in layer's RenderTexture. Uniforms: `u_time`, `u_resolution`, `u_mouse`, `u_texture` (layer below).

---

## PHASE 9 — Collaboration (`services/api`)

1. **Yjs Document** : Y.Doc root → Y.Map for canvas state. Layer properties as Y.Maps. Strokes as Y.Arrays (compact encoded).
2. **y-websocket Server** : Fastify WS. Rooms keyed by project ID. Max 20 collaborators. Persist Y.Doc snapshot to PostgreSQL every 30s.
3. **Collaboration UI** : Connected users panel (avatars, colored cursors). Layer locking: broadcast lock event on edit start; show colored lock badge on layer.

---

## PHASE 10 — Plugin SDK (`packages/core`)

1. **PluginHost** : Load plugin bundle (index.js + panel.html) into Web Worker via `importScripts`. Expose CanvasOS Plugin API gated by declared permissions. Use Comlink for async proxy.
2. **Plugin API** :

```typescript
   canvasOS.canvas.getLayers(): Promise<Layer[]>
   canvasOS.canvas.insertLayer(layer: LayerInit): Promise<string>
   canvasOS.canvas.getPixels(layerId, rect): Promise<ImageData>
   canvasOS.canvas.putPixels(layerId, imageData, rect): Promise<void>
   canvasOS.ui.showPanel(html: string): void
   canvasOS.storage.get(key): Promise<unknown>
   canvasOS.storage.set(key, value): Promise<void>
```

1. **Plugin Marketplace UI** : Grid of cards from `GET /api/v1/plugins`. Search, category filter, install button.

---

## PHASE 11 — Testing & Quality

1. **Unit Tests (Vitest)** : ColorSystem conversions, HistoryManager undo/redo, KeyframeEngine interpolation, CVOS file round-trip, ArtGenClient provider routing, Boolean operations, StepSequencer timing.
2. **Integration Tests (Playwright)** : Canvas stroke renders, AI generate inserts layer, export to MP4 works, two-user collaboration sync.
3. **CI (GitHub Actions)** : lint + type-check + unit tests + build on every PR. Integration tests + Docker build on merge to main.
4. **Error Handling** : React error boundaries per module. All errors → console log + non-blocking toast. Debug panel: `Cmd/Ctrl+Shift+D`.

---

## CRITICAL CONSTRAINTS

- **API Key Security** : Store in OS keychain (Tauri) or AES-256-GCM IndexedDB (web). **Never** send to CanvasOS servers.
- **License Compliance** : All dependencies must be MIT/Apache-2.0/BSD/CC0. Run `license-checker` in CI; fail build on violations.
- **Offline First** : Painting, vector, photo, animation, audio work 100% offline. AI features degrade gracefully with a helpful message.
- **No UI Thread Blocking** : All heavy work (compression, AI inference, file I/O, audio) runs in Web Workers or OffscreenCanvas contexts.
- **Non-Blocking Auto-Save** : Auto-save every 60s in a background worker. No blocking spinners.
- **Accessibility** : Full keyboard shortcuts, ARIA labels, focus management. Must pass `axe-core` automated checks.
- **No Analytics Without Opt-In** : Zero telemetry by default. Users explicitly opt in.

---

## DEFINITION OF DONE (v1.0)

- [ ] All 10 art modules functional at the feature level described above
- [ ] .cvos project file saves and loads correctly with all module data
- [ ] Export works for: PNG, JPEG, SVG, MP4, GIF, PDF
- [ ] PWA installable offline with service worker
- [ ] Real-time collaboration functional for 2+ users
- [ ] Plugin SDK documented and one example plugin shipped
- [ ] GitHub Actions CI passing (lint + tests + build)
- [ ] WCAG 2.1 AA accessibility audit passing
- [ ] Performance: 60 FPS on 4K canvas, < 2s FCP on 4G
- [ ] README with architecture diagram, quickstart, and contribution guide
- [ ] MIT License file present
- [ ] No GPL or proprietary licenses in dependency tree

---

_CanvasOS — Open Source Forever — canvasos.art_
