export { VectorLayer } from "./VectorLayer.js";
export { PenTool } from "./PenTool.js";
export type { PenMode, StrokeOptions, FillOptions, FillType } from "./PenTool.js";
export {
  createRectangle,
  createRoundedRect,
  createEllipse,
  createPolygon,
  createStar,
  createLine,
  createArrow,
} from "./ShapePrimitives.js";
export { performBooleanOp, applyBooleanOp } from "./BooleanOps.js";
export type { BooleanOpType } from "./BooleanOps.js";
export { TextTool } from "./TextTool.js";
export type { TextStyle, TextAlignment } from "./TextTool.js";
export { VectorPanel } from "./components/VectorPanel.js";

// Re-export as ShapePrimitives namespace for consumers that prefer it
import * as ShapePrimitives from "./ShapePrimitives.js";
export { ShapePrimitives };

// Re-export as BooleanOps namespace
import * as BooleanOps from "./BooleanOps.js";
export { BooleanOps };
