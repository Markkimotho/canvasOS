import paper from "paper";

/**
 * VectorLayer manages a paper.js project, renders it into an OffscreenCanvas,
 * and exposes the result as ImageData for compositing into the WebGL pipeline.
 */
export class VectorLayer {
  private offscreen: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private paperScope: paper.PaperScope | null = null;
  private width = 0;
  private height = 0;

  /**
   * Attach this VectorLayer to a host HTMLCanvasElement (or OffscreenCanvas).
   * A dedicated paper.js PaperScope is created so multiple VectorLayers can
   * coexist without colliding on the global paper instance.
   */
  init(canvas: HTMLCanvasElement | OffscreenCanvas): void {
    const { width, height } =
      canvas instanceof HTMLCanvasElement ? { width: canvas.width, height: canvas.height } : canvas;

    this.width = width;
    this.height = height;

    // Create a private OffscreenCanvas for rendering the vector content
    this.offscreen = new OffscreenCanvas(width, height);
    this.ctx = this.offscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;

    // Create an isolated PaperScope
    this.paperScope = new paper.PaperScope();

    // paper.js needs an HTMLCanvasElement or a canvas-like surface; when running
    // in a browser we synthesise one for setup then redirect drawing to offscreen.
    if (canvas instanceof HTMLCanvasElement) {
      this.paperScope.setup(canvas);
    } else {
      // For OffscreenCanvas contexts (e.g. worker) we set up with dimensions only
      this.paperScope.setup(new paper.Size(width, height));
    }
  }

  /**
   * Replace the active project with a fully reconstructed paper.Project so the
   * layer can be driven externally (undo/redo, serialisation).
   */
  update(paperProject: paper.Project): void {
    if (!this.paperScope) return;
    this.paperScope.activate();
    // Replace the scope's active project reference
    (this.paperScope as unknown as { project: paper.Project }).project = paperProject;
  }

  /**
   * Rasterise the current paper.js scene into the OffscreenCanvas and return
   * the resulting ImageData for hand-off to the WebGL compositor.
   */
  render(): ImageData {
    if (!this.paperScope || !this.offscreen || !this.ctx) {
      // Return a transparent 1×1 sentinel if not yet initialised
      return new ImageData(1, 1);
    }

    this.paperScope.activate();

    // Clear the offscreen surface
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Export the paper scene to a data-URL then draw it onto the offscreen ctx
    const dataUrl: string = this.paperScope.project.exportSVG({ asString: true }) as string;
    const blob = new Blob([dataUrl], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    // Synchronous path is not available; use ImageBitmap via a shared pattern.
    // Callers that need truly async rendering should await renderAsync() instead.
    // For synchronous callers we fall back to the paper canvas rasterisation.
    const raster = this.paperScope.project.activeLayer.rasterize({
      resolution: 72,
      insert: false,
    });

    if (raster && raster.canvas) {
      this.ctx.drawImage(raster.canvas as HTMLCanvasElement, 0, 0);
      raster.remove();
    }

    URL.revokeObjectURL(url);

    return this.ctx.getImageData(0, 0, this.width, this.height);
  }

  /**
   * Async variant – resolves after the SVG blob is fully decoded via
   * createImageBitmap, giving pixel-perfect WebGL output.
   */
  async renderAsync(): Promise<ImageData> {
    if (!this.paperScope || !this.offscreen || !this.ctx) {
      return new ImageData(1, 1);
    }

    this.paperScope.activate();
    this.ctx.clearRect(0, 0, this.width, this.height);

    const svgString = this.paperScope.project.exportSVG({ asString: true }) as string;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const bitmap = await createImageBitmap(blob);

    this.ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    return this.ctx.getImageData(0, 0, this.width, this.height);
  }

  /** Release all resources held by this layer. */
  destroy(): void {
    if (this.paperScope) {
      this.paperScope.project.clear();
      // PaperScope cleanup (remove() not in @types/paper 0.12 typings)
      this.paperScope = null;
    }
    this.offscreen = null;
    this.ctx = null;
  }

  /** Expose the internal PaperScope so tools can activate it. */
  getPaperScope(): paper.PaperScope | null {
    return this.paperScope;
  }
}
