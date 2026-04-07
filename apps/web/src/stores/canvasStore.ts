import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CanvasProject } from "@canvasos/core";
import { createCanvasProject } from "@canvasos/core";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";

export type ActiveModule =
  | "paint"
  | "vector"
  | "sculpt-3d"
  | "animate"
  | "audio"
  | "codeart"
  | "photo"
  | "write"
  | "ai"
  | null;

export type ModuleId = NonNullable<ActiveModule>;

interface CanvasStoreState {
  projects: Record<string, CanvasProject>;
  activeProjectId: string | null;
  activeModule: ActiveModule;
  showDebug: boolean;
  zoom: number;
  panX: number;
  panY: number;
}

interface CanvasStoreActions {
  createProject: (name: string) => string;
  loadProject: (id: string) => void;
  saveProject: (id: string) => void;
  setActiveModule: (module: ActiveModule) => void;
  toggleDebug: () => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
}

export const useCanvasStore = create<CanvasStoreState & CanvasStoreActions>()(
  immer((set) => ({
    projects: {},
    activeProjectId: null,
    activeModule: "paint",
    showDebug: false,
    zoom: 1,
    panX: 0,
    panY: 0,

    createProject: (name: string) => {
      const project = createCanvasProject(name);
      set((state) => {
        state.projects[project.id] = project;
        state.activeProjectId = project.id;
      });
      fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).catch(console.error);
      return project.id;
    },

    loadProject: (id: string) => {
      set((state) => {
        state.activeProjectId = id;
      });
    },

    saveProject: (id: string) => {
      const project = useCanvasStore.getState().projects[id];
      if (!project) return;
      fetch(`${API_BASE}/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: project.metadata }),
      }).catch(console.error);
    },

    setActiveModule: (module: ActiveModule) => {
      set((state) => {
        state.activeModule = module;
      });
    },

    toggleDebug: () => {
      set((state) => {
        state.showDebug = !state.showDebug;
      });
    },

    setZoom: (zoom: number) => {
      set((state) => {
        state.zoom = Math.min(Math.max(zoom, 0.05), 64);
      });
    },

    setPan: (x: number, y: number) => {
      set((state) => {
        state.panX = x;
        state.panY = y;
      });
    },
  })),
);
