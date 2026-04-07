import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { v4 as uuidv4 } from "uuid";
import type { CanvasProject, Layer, LayerType, ProjectMetadata } from "../types/index.js";

// ──────────────────────────────────────────────
// Factory helpers
// ──────────────────────────────────────────────

export function createCanvasProject(name: string): CanvasProject {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    metadata: {
      name,
      created: now,
      modified: now,
      author: "",
      description: "",
      tags: [],
      version: "1.0.0",
    },
    canvasWidth: 2048,
    canvasHeight: 2048,
    layers: [],
    activeLayerId: null,
    colorProfile: "sRGB",
    dpi: 96,
    backgroundColor: "#ffffff",
  };
}

export function createLayer(type: LayerType, name?: string): Layer {
  const defaults: Record<LayerType, string> = {
    raster: "Raster Layer",
    vector: "Vector Layer",
    text: "Text Layer",
    group: "Group",
    "3d": "3D Layer",
    audio: "Audio Layer",
    code: "Code Layer",
    photo: "Photo Layer",
    ai: "AI Layer",
  };

  return {
    id: uuidv4(),
    name: name ?? defaults[type] ?? "Layer",
    type,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    x: 0,
    y: 0,
    width: 2048,
    height: 2048,
    data: {},
  };
}

// ──────────────────────────────────────────────
// Zustand store
// ──────────────────────────────────────────────

interface CanvasStateStore {
  project: CanvasProject | null;
  setProject: (project: CanvasProject) => void;
  updateMetadata: (patch: Partial<ProjectMetadata>) => void;
  addLayer: (type: LayerType, name?: string) => Layer;
  removeLayer: (id: string) => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  setActiveLayer: (id: string | null) => void;
  duplicateLayer: (id: string) => Layer | null;
}

export const useCanvasState = create<CanvasStateStore>()(
  immer((set, get) => ({
    project: null,

    setProject: (project) => set({ project }),

    updateMetadata: (patch) => {
      set((state) => {
        if (state.project) {
          Object.assign(state.project.metadata, patch);
          state.project.metadata.modified = new Date().toISOString();
        }
      });
    },

    addLayer: (type, name) => {
      const layer = createLayer(type, name);
      set((state) => {
        if (state.project) {
          state.project.layers.push(layer);
          state.project.activeLayerId = layer.id;
        }
      });
      return layer;
    },

    removeLayer: (id) => {
      set((state) => {
        if (!state.project) return;
        state.project.layers = state.project.layers.filter((l) => l.id !== id);
        if (state.project.activeLayerId === id) {
          state.project.activeLayerId =
            state.project.layers[state.project.layers.length - 1]?.id ?? null;
        }
      });
    },

    moveLayer: (fromIndex, toIndex) => {
      set((state) => {
        if (!state.project) return;
        const layers = state.project.layers;
        const [moved] = layers.splice(fromIndex, 1);
        if (moved) layers.splice(toIndex, 0, moved);
      });
    },

    updateLayer: (id, patch) => {
      set((state) => {
        if (!state.project) return;
        const layer = state.project.layers.find((l) => l.id === id);
        if (layer) Object.assign(layer, patch);
      });
    },

    setActiveLayer: (id) => {
      set((state) => {
        if (state.project) state.project.activeLayerId = id;
      });
    },

    duplicateLayer: (id) => {
      const layers = get().project?.layers;
      const source = layers?.find((l) => l.id === id);
      if (!source) return null;
      const dup: Layer = { ...structuredClone(source), id: uuidv4(), name: `${source.name} copy` };
      set((state) => {
        if (!state.project) return;
        const idx = state.project.layers.findIndex((l) => l.id === id);
        state.project.layers.splice(idx + 1, 0, dup);
        state.project.activeLayerId = dup.id;
      });
      return dup;
    },
  })),
);
