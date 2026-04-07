/**
 * BackgroundRemover uses @huggingface/transformers (Transformers.js) RMBG-1.4
 * model via image-segmentation pipeline to remove backgrounds.
 *
 * Images larger than MAX_SIDE are tiled to stay within the 1024px limit.
 */

const MAX_SIDE = 1024;
const MODEL_ID = "briaai/RMBG-1.4";

interface SegmentationResult {
  score: number | null;
  label: string;
  mask: ImageData;
}

type SegmentationPipeline = (
  input: string | HTMLImageElement | ImageData,
  options?: Record<string, unknown>,
) => Promise<SegmentationResult[]>;

let pipelineCache: SegmentationPipeline | null = null;

async function getPipeline(): Promise<SegmentationPipeline> {
  if (pipelineCache) return pipelineCache;

  // Dynamic import so bundlers can tree-shake when not used
  const { pipeline } = await import("@huggingface/transformers");

  pipelineCache = (await pipeline("image-segmentation", MODEL_ID, {
    // Run in the current context; for Web Workers this is automatic
    device: "cpu",
  })) as unknown as SegmentationPipeline;

  return pipelineCache;
}

/**
 * Resize an ImageData to fit within maxSide×maxSide while preserving
 * aspect ratio. Returns the original if it already fits.
 */
function resizeImageData(
  imageData: ImageData,
  maxSide: number,
): { data: ImageData; scale: number } {
  const { width, height } = imageData;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  if (scale >= 1) return { data: imageData, scale: 1 };

  const newW = Math.round(width * scale);
  const newH = Math.round(height * scale);

  const canvas = new OffscreenCanvas(newW, newH);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context for resize");

  const srcCanvas = new OffscreenCanvas(width, height);
  const srcCtx = srcCanvas.getContext("2d");
  if (!srcCtx) throw new Error("Could not get 2D context for source");
  srcCtx.putImageData(imageData, 0, 0);

  ctx.drawImage(srcCanvas, 0, 0, newW, newH);
  return { data: ctx.getImageData(0, 0, newW, newH), scale };
}

/**
 * Scale a mask ImageData back up to targetWidth × targetHeight.
 */
function scaleMask(mask: ImageData, targetWidth: number, targetHeight: number): ImageData {
  if (mask.width === targetWidth && mask.height === targetHeight) return mask;

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context for mask scale");

  const srcCanvas = new OffscreenCanvas(mask.width, mask.height);
  const srcCtx = srcCanvas.getContext("2d");
  if (!srcCtx) throw new Error("Could not get 2D context for mask source");
  srcCtx.putImageData(mask, 0, 0);

  ctx.drawImage(srcCanvas, 0, 0, targetWidth, targetHeight);
  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * Apply a foreground mask to an ImageData: pixels where the mask alpha > 128
 * are kept; others have their alpha set to 0.
 */
function applyMask(imageData: ImageData, mask: ImageData): ImageData {
  const { width, height } = imageData;
  const out = new Uint8ClampedArray(imageData.data);
  const maskData = mask.data;

  for (let i = 0; i < width * height; i++) {
    const pixelIdx = i * 4;
    // Mask is typically grayscale stored in R channel
    const maskValue = maskData[pixelIdx]!;
    // Treat bright mask values as foreground (keep), dark as background (erase)
    out[pixelIdx + 3] = maskValue > 128 ? imageData.data[pixelIdx + 3]! : 0;
  }

  return new ImageData(out, width, height);
}

/**
 * Process a single tile through the segmentation pipeline.
 */
async function processTile(pipe: SegmentationPipeline, tile: ImageData): Promise<ImageData> {
  const results = await pipe(tile);
  if (!results || results.length === 0) {
    throw new Error("Segmentation pipeline returned no results");
  }

  // RMBG-1.4 returns a single result with the foreground mask
  const result = results[0]!;
  return result.mask;
}

/**
 * Split an ImageData into overlapping tiles of at most maxSide×maxSide,
 * process each tile, then stitch the masks back together.
 */
async function processWithTiling(
  pipe: SegmentationPipeline,
  imageData: ImageData,
): Promise<ImageData> {
  const { width, height } = imageData;

  // Calculate tile grid
  const cols = Math.ceil(width / MAX_SIDE);
  const rows = Math.ceil(height / MAX_SIDE);

  const tileW = Math.ceil(width / cols);
  const tileH = Math.ceil(height / rows);

  const combinedMask = new Uint8ClampedArray(width * height * 4);

  const srcCanvas = new OffscreenCanvas(width, height);
  const srcCtx = srcCanvas.getContext("2d");
  if (!srcCtx) throw new Error("Cannot create 2D context for tiling");
  srcCtx.putImageData(imageData, 0, 0);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = col * tileW;
      const y0 = row * tileH;
      const w = Math.min(tileW, width - x0);
      const h = Math.min(tileH, height - y0);

      const tileData = srcCtx.getImageData(x0, y0, w, h);
      const tileMask = await processTile(pipe, tileData);
      const scaledTileMask = scaleMask(tileMask, w, h);

      // Write tile mask into combined mask
      for (let ty = 0; ty < h; ty++) {
        for (let tx = 0; tx < w; tx++) {
          const srcIdx = (ty * w + tx) * 4;
          const dstIdx = ((y0 + ty) * width + (x0 + tx)) * 4;
          const maskVal = scaledTileMask.data[srcIdx]!;
          combinedMask[dstIdx] = maskVal;
          combinedMask[dstIdx + 1] = maskVal;
          combinedMask[dstIdx + 2] = maskVal;
          combinedMask[dstIdx + 3] = 255;
        }
      }
    }
  }

  return new ImageData(combinedMask, width, height);
}

export class BackgroundRemover {
  /**
   * Remove the background from an ImageData.
   * Returns a new RGBA ImageData where background pixels have alpha = 0.
   */
  async removeBackground(imageData: ImageData): Promise<ImageData> {
    const pipe = await getPipeline();

    const { width, height } = imageData;
    const needsTiling = width > MAX_SIDE || height > MAX_SIDE;

    let mask: ImageData;

    if (needsTiling) {
      mask = await processWithTiling(pipe, imageData);
    } else {
      const { data: resized, scale } = resizeImageData(imageData, MAX_SIDE);
      const rawMask = await processTile(pipe, resized);
      mask = scale < 1 ? scaleMask(rawMask, width, height) : rawMask;
    }

    return applyMask(imageData, mask);
  }
}
