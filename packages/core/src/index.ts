// Types
export * from "./types/index.js";

// State
export { useCanvasState, createCanvasProject, createLayer } from "./state/canvasState.js";

// History
export { HistoryManager } from "./history/HistoryManager.js";
export type { HistoryEntry } from "./history/HistoryManager.js";

// Input
export { PointerEventHandler, catmullRomSmooth } from "./input/PointerEventHandler.js";
export type { StrokeCallback, StrokeEndCallback } from "./input/PointerEventHandler.js";

// Compositor
export { LayerCompositor } from "./compositor/LayerCompositor.js";

// File format
export { FileFormatManager } from "./format/FileFormatManager.js";

// Plugins
export { PluginHost } from "./plugins/PluginHost.js";
export type { PluginAPI } from "./plugins/PluginHost.js";
