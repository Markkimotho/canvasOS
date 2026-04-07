import type { BrushPreset } from "@canvasos/core";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "canvasos:brushPresets";

export const DEFAULT_PRESETS: BrushPreset[] = [
  {
    id: "hard-round-default",
    name: "Hard Round",
    type: "hard-round",
    size: 12,
    opacity: 1,
    flow: 1,
    hardness: 1,
    spacing: 0.1,
    angle: 0,
    roundness: 1,
    pressureSizeEnabled: true,
    pressureOpacityEnabled: false,
    pressureCurve: [
      [0, 0],
      [0.5, 0.5],
      [1, 1],
    ],
  },
  {
    id: "soft-round-default",
    name: "Soft Round",
    type: "soft-round",
    size: 20,
    opacity: 0.8,
    flow: 0.8,
    hardness: 0.2,
    spacing: 0.08,
    angle: 0,
    roundness: 1,
    pressureSizeEnabled: true,
    pressureOpacityEnabled: true,
    pressureCurve: [
      [0, 0],
      [0.3, 0.2],
      [1, 1],
    ],
  },
  {
    id: "ink-pen-default",
    name: "Ink Pen",
    type: "ink-pen",
    size: 6,
    opacity: 1,
    flow: 1,
    hardness: 1,
    spacing: 0.02,
    angle: 0,
    roundness: 1,
    pressureSizeEnabled: true,
    pressureOpacityEnabled: false,
    pressureCurve: [
      [0, 0],
      [0.4, 0.3],
      [1, 1],
    ],
  },
  {
    id: "watercolor-default",
    name: "Watercolor",
    type: "watercolor",
    size: 40,
    opacity: 0.4,
    flow: 0.6,
    hardness: 0.1,
    spacing: 0.05,
    angle: 0,
    roundness: 1,
    pressureSizeEnabled: true,
    pressureOpacityEnabled: true,
    pressureCurve: [
      [0, 0],
      [0.5, 0.4],
      [1, 1],
    ],
    wetEdge: true,
    wetEdgeAmount: 0.3,
  },
  {
    id: "airbrush-default",
    name: "Airbrush",
    type: "airbrush",
    size: 60,
    opacity: 0.2,
    flow: 0.3,
    hardness: 0,
    spacing: 0.02,
    angle: 0,
    roundness: 1,
    pressureSizeEnabled: false,
    pressureOpacityEnabled: true,
    pressureCurve: [
      [0, 0],
      [0.5, 0.5],
      [1, 1],
    ],
  },
  {
    id: "eraser-default",
    name: "Eraser",
    type: "eraser",
    size: 20,
    opacity: 1,
    flow: 1,
    hardness: 0.8,
    spacing: 0.1,
    angle: 0,
    roundness: 1,
    pressureSizeEnabled: true,
    pressureOpacityEnabled: false,
    pressureCurve: [
      [0, 0],
      [0.5, 0.5],
      [1, 1],
    ],
  },
];

export class BrushPresetManager {
  private presets: BrushPreset[];

  constructor() {
    this.presets = this.load();
  }

  private load(): BrushPreset[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as BrushPreset[];
        // Merge defaults with saved (saved takes precedence for same id)
        const savedIds = new Set(saved.map((p) => p.id));
        return [...DEFAULT_PRESETS.filter((p) => !savedIds.has(p.id)), ...saved];
      }
    } catch {
      // ignore
    }
    return [...DEFAULT_PRESETS];
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.presets));
    } catch {
      // ignore quota errors
    }
  }

  getAll(): BrushPreset[] {
    return this.presets;
  }

  getById(id: string): BrushPreset | undefined {
    return this.presets.find((p) => p.id === id);
  }

  add(preset: Omit<BrushPreset, "id">): BrushPreset {
    const p: BrushPreset = { ...preset, id: uuidv4() };
    this.presets.push(p);
    this.save();
    return p;
  }

  update(id: string, patch: Partial<BrushPreset>): void {
    const idx = this.presets.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.presets[idx] = { ...this.presets[idx]!, ...patch };
      this.save();
    }
  }

  remove(id: string): void {
    this.presets = this.presets.filter((p) => p.id !== id);
    this.save();
  }

  exportToJSON(): string {
    return JSON.stringify(this.presets, null, 2);
  }

  importFromJSON(json: string): void {
    const imported = JSON.parse(json) as BrushPreset[];
    for (const p of imported) {
      if (!this.presets.find((ep) => ep.id === p.id)) {
        this.presets.push({ ...p, id: uuidv4() });
      }
    }
    this.save();
  }
}
