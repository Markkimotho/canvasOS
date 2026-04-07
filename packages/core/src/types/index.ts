export type LayerType =
  | "raster"
  | "vector"
  | "text"
  | "group"
  | "3d"
  | "audio"
  | "code"
  | "photo"
  | "ai";

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity"
  | "add"
  | "subtract";

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Module-specific data */
  data: Record<string, unknown>;
  /** Child layers (for group type) */
  children?: Layer[];
  /** Clipping mask */
  clippingMask?: boolean;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  timestamp: number;
}

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
  width: number;
  height: number;
}

export interface ProjectMetadata {
  name: string;
  created: string;
  modified: string;
  author: string;
  description: string;
  tags: string[];
  version: string;
}

export interface CanvasProject {
  id: string;
  metadata: ProjectMetadata;
  canvasWidth: number;
  canvasHeight: number;
  layers: Layer[];
  activeLayerId: string | null;
  colorProfile: "sRGB" | "P3" | "ProPhoto";
  dpi: number;
  backgroundColor: string;
}

export interface ColorHSB {
  h: number; // 0-360
  s: number; // 0-100
  b: number; // 0-100
  a: number; // 0-1
}

export interface ColorRGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

export interface ColorCMYK {
  c: number; // 0-100
  m: number; // 0-100
  y: number; // 0-100
  k: number; // 0-100
}

export type ColorHex = string; // "#RRGGBBAA"

export interface BrushPreset {
  id: string;
  name: string;
  type: "hard-round" | "soft-round" | "textured" | "ink-pen" | "watercolor" | "airbrush" | "eraser";
  size: number;
  opacity: number;
  flow: number;
  hardness: number;
  spacing: number;
  angle: number;
  roundness: number;
  pressureSizeEnabled: boolean;
  pressureOpacityEnabled: boolean;
  pressureCurve: [number, number][];
  textureId?: string;
  textureScale?: number;
  textureDepth?: number;
  wetEdge?: boolean; // watercolor
  wetEdgeAmount?: number;
}

export interface KeyframeData {
  time: number; // in frames
  value: number;
  easing: EasingType;
  bezierHandles?: [number, number, number, number]; // custom bezier
}

export type EasingType =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "ease-in-quad"
  | "ease-out-quad"
  | "ease-in-out-quad"
  | "ease-in-cubic"
  | "ease-out-cubic"
  | "ease-in-out-cubic"
  | "spring"
  | "custom-bezier";

export type AnimatableProperty =
  | "x"
  | "y"
  | "scaleX"
  | "scaleY"
  | "rotation"
  | "opacity"
  | "filterValue";

export interface LayerAnimation {
  layerId: string;
  property: AnimatableProperty;
  keyframes: KeyframeData[];
}

export interface TimelineState {
  fps: number;
  duration: number; // total frames
  currentFrame: number;
  playing: boolean;
  looping: boolean;
  animations: LayerAnimation[];
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: PluginPermission[];
  entrypoint: string; // path to index.js
  panel?: string; // path to panel.html
}

export type PluginPermission =
  | "canvas.read"
  | "canvas.write"
  | "storage.read"
  | "storage.write"
  | "ui.panel";
