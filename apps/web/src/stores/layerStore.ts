import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Layer, LayerType } from "@canvasos/core";
import { createLayer } from "@canvasos/core";

interface LayerStoreState {
  layers: Layer[];
  activeLayerId: string | null;
}

interface LayerStoreActions {
  addLayer: (type: LayerType, name?: string) => string;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  reorderLayers: (from: number, to: number) => void;
  updateLayerOpacity: (id: string, opacity: number) => void;
}

export const useLayerStore = create<LayerStoreState & LayerStoreActions>()(
  immer((set) => ({
    layers: [],
    activeLayerId: null,

    addLayer: (type: LayerType, name?: string) => {
      const layer = createLayer(type, name);
      set((state) => {
        state.layers.push(layer);
        state.activeLayerId = layer.id;
      });
      return layer.id;
    },

    removeLayer: (id: string) => {
      set((state) => {
        state.layers = state.layers.filter((l) => l.id !== id);
        if (state.activeLayerId === id) {
          state.activeLayerId = state.layers[state.layers.length - 1]?.id ?? null;
        }
      });
    },

    setActiveLayer: (id: string) => {
      set((state) => {
        state.activeLayerId = id;
      });
    },

    toggleLayerVisibility: (id: string) => {
      set((state) => {
        const layer = state.layers.find((l) => l.id === id);
        if (layer) layer.visible = !layer.visible;
      });
    },

    reorderLayers: (from: number, to: number) => {
      set((state) => {
        const [moved] = state.layers.splice(from, 1);
        if (moved) state.layers.splice(to, 0, moved);
      });
    },

    updateLayerOpacity: (id: string, opacity: number) => {
      set((state) => {
        const layer = state.layers.find((l) => l.id === id);
        if (layer) layer.opacity = Math.min(1, Math.max(0, opacity));
      });
    },
  })),
);
