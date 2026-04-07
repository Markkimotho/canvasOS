import paper from "paper";

export type PenMode = "pen" | "node";

export interface StrokeOptions {
  color: string;
  width: number;
  dashArray: number[];
  cap: string;
  join: string;
}

export type FillType = "solid" | "gradient" | "pattern" | "none";

export interface FillOptions {
  type: FillType;
  color?: string;
  gradient?: paper.Gradient;
  /** Tiling image used when type === 'pattern' */
  patternImage?: HTMLImageElement | HTMLCanvasElement;
}

const DEFAULT_STROKE: StrokeOptions = {
  color: "#000000",
  width: 1,
  dashArray: [],
  cap: "round",
  join: "round",
};

const DEFAULT_FILL: FillOptions = {
  type: "none",
};

/**
 * PenTool wraps the paper.js Tool API to provide:
 *  - "pen"  mode : click to add corner anchors, click+drag to add smooth Bézier anchors
 *  - "node" mode : select and drag existing anchors / handles, toggle smooth ↔ corner
 */
export class PenTool {
  private scope: paper.PaperScope | null = null;
  private tool: paper.Tool | null = null;
  private activePath: paper.Path | null = null;
  private mode: PenMode = "pen";
  private strokeOptions: StrokeOptions = { ...DEFAULT_STROKE };
  private fillOptions: FillOptions = { ...DEFAULT_FILL };

  // Node-edit state
  private selectedSegment: paper.Segment | null = null;
  private selectedHandle: "handleIn" | "handleOut" | null = null;
  private hitResult: paper.HitResult | null = null;

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  activate(paperScope: paper.PaperScope): void {
    this.scope = paperScope;
    this.scope.activate();

    this.tool = new paper.Tool();
    this.tool.minDistance = 2;

    this.tool.onMouseDown = (event: paper.ToolEvent) => this.onMouseDown(event);
    this.tool.onMouseDrag = (event: paper.ToolEvent) => this.onMouseDrag(event);
    this.tool.onMouseUp = (event: paper.ToolEvent) => this.onMouseUp(event);
    this.tool.onKeyDown = (event: paper.KeyEvent) => this.onKeyDown(event);

    this.tool.activate();
  }

  deactivate(): void {
    if (this.tool) {
      this.tool.remove();
      this.tool = null;
    }
    this.activePath = null;
    this.selectedSegment = null;
  }

  setMode(mode: PenMode): void {
    this.mode = mode;
    if (mode === "pen") {
      // Start a new path on next click
      this.activePath = null;
    } else {
      // Commit any open path before entering node-edit
      this.commitActivePath();
    }
  }

  setStroke(options: Partial<StrokeOptions>): void {
    this.strokeOptions = { ...this.strokeOptions, ...options };
    if (this.activePath) {
      this.applyStroke(this.activePath);
    }
  }

  setFill(options: Partial<FillOptions>): void {
    this.fillOptions = { ...this.fillOptions, ...options };
    if (this.activePath) {
      this.applyFill(this.activePath);
    }
  }

  // -----------------------------------------------------------------------
  // Pen-mode event handlers
  // -----------------------------------------------------------------------

  private onMouseDown(event: paper.ToolEvent): void {
    if (!this.scope) return;
    this.scope.activate();

    if (this.mode === "pen") {
      this.penMouseDown(event);
    } else {
      this.nodeMouseDown(event);
    }
  }

  private onMouseDrag(event: paper.ToolEvent): void {
    if (this.mode === "pen") {
      this.penMouseDrag(event);
    } else {
      this.nodeMouseDrag(event);
    }
  }

  private onMouseUp(event: paper.ToolEvent): void {
    if (this.mode === "pen") {
      this.penMouseUp(event);
    } else {
      this.nodeMouseUp(event);
    }
  }

  private onKeyDown(event: paper.KeyEvent): void {
    if (event.key === "escape") {
      this.commitActivePath();
    }
    if (event.key === "enter") {
      this.commitActivePath();
    }
  }

  // -----------------------------------------------------------------------
  // Pen mode
  // -----------------------------------------------------------------------

  private _isDragging = false;
  private dragStartPoint: paper.Point | null = null;

  get isDragging(): boolean {
    return this._isDragging;
  }

  private penMouseDown(event: paper.ToolEvent): void {
    this._isDragging = false;
    this.dragStartPoint = event.point;

    if (!this.activePath) {
      this.activePath = new paper.Path();
      this.applyStroke(this.activePath);
      this.applyFill(this.activePath);
    }

    // Close path if clicking near the first anchor
    if (this.activePath.segments.length > 1) {
      const first = this.activePath.firstSegment.point;
      if (event.point.getDistance(first) < 8) {
        this.activePath.closed = true;
        this.commitActivePath();
        return;
      }
    }

    this.activePath.add(event.point);
  }

  private penMouseDrag(event: paper.ToolEvent): void {
    if (!this.activePath || !this.dragStartPoint) return;
    this._isDragging = true;

    const last = this.activePath.lastSegment;
    if (!last) return;

    // Dragging creates Bézier handles symmetrically
    const delta = event.point.subtract(last.point);
    last.handleOut = delta;
    last.handleIn = delta.multiply(-1);
  }

  private penMouseUp(_event: paper.ToolEvent): void {
    this._isDragging = false;
    this.dragStartPoint = null;
  }

  // -----------------------------------------------------------------------
  // Node-edit mode
  // -----------------------------------------------------------------------

  private nodeMouseDown(event: paper.ToolEvent): void {
    if (!this.scope) return;

    this.selectedSegment = null;
    this.selectedHandle = null;

    const hitOptions: {
      segments: boolean;
      handles: boolean;
      stroke: boolean;
      fill: boolean;
      tolerance: number;
    } = {
      segments: true,
      handles: true,
      stroke: true,
      fill: true,
      tolerance: 8,
    };

    this.hitResult = this.scope.project.hitTest(event.point, hitOptions);

    if (!this.hitResult) return;

    if (this.hitResult.type === "segment") {
      this.selectedSegment = this.hitResult.segment;
    } else if (this.hitResult.type === "handle-in") {
      this.selectedSegment = this.hitResult.segment;
      this.selectedHandle = "handleIn";
    } else if (this.hitResult.type === "handle-out") {
      this.selectedSegment = this.hitResult.segment;
      this.selectedHandle = "handleOut";
    }
  }

  private nodeMouseDrag(event: paper.ToolEvent): void {
    if (!this.selectedSegment) return;

    if (!this.selectedHandle) {
      // Move the anchor point
      this.selectedSegment.point = this.selectedSegment.point.add(event.delta);
    } else if (this.selectedHandle === "handleIn") {
      this.selectedSegment.handleIn = this.selectedSegment.handleIn.add(event.delta);
    } else {
      this.selectedSegment.handleOut = this.selectedSegment.handleOut.add(event.delta);
    }
  }

  private nodeMouseUp(_event: paper.ToolEvent): void {
    this.hitResult = null;
  }

  /**
   * Toggle a segment between smooth (Bézier) and corner (no handles).
   * Called externally by UI buttons or double-click handlers.
   */
  toggleSegmentType(segment: paper.Segment): void {
    const isSmooth = !segment.handleIn.isZero() || !segment.handleOut.isZero();

    if (isSmooth) {
      segment.handleIn = new paper.Point(0, 0);
      segment.handleOut = new paper.Point(0, 0);
    } else {
      segment.smooth({ type: "catmull-rom" });
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private commitActivePath(): void {
    this.activePath = null;
    this.selectedSegment = null;
  }

  private applyStroke(path: paper.Path): void {
    const s = this.strokeOptions;
    path.strokeColor = new paper.Color(s.color);
    path.strokeWidth = s.width;
    path.dashArray = s.dashArray;
    path.strokeCap = s.cap;
    path.strokeJoin = s.join;
  }

  private applyFill(path: paper.Path): void {
    const f = this.fillOptions;
    switch (f.type) {
      case "solid":
        path.fillColor = new paper.Color(f.color ?? "#000000");
        break;
      case "gradient": {
        if (f.gradient && path.bounds) {
          const start = path.bounds.topCenter;
          const end = path.bounds.bottomCenter;
          path.fillColor = new paper.Color({
            gradient: f.gradient,
            origin: start,
            destination: end,
          });
        }
        break;
      }
      case "pattern":
        // Pattern fills require a raster item; set via external helper
        break;
      case "none":
      default:
        path.fillColor = null;
        break;
    }
  }

  // -----------------------------------------------------------------------
  // Accessors
  // -----------------------------------------------------------------------

  getActivePath(): paper.Path | null {
    return this.activePath;
  }

  getMode(): PenMode {
    return this.mode;
  }
}
