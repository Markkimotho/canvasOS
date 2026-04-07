/**
 * VideoExporter
 *
 * Encodes sequences of ImageData frames into MP4, WebM, or GIF blobs using
 * @ffmpeg/ffmpeg running in a worker context.
 *
 * All exported functions are async and safe to call from a Web Worker.
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Mp4Options {
  /** CRF quality factor (0=lossless, 51=worst). Default 23. */
  crf?: number;
  /** Pixel format. Default "yuv420p" for broad compatibility. */
  pixFmt?: string;
  /** Video codec. Default "libx264". */
  codec?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lazy-loaded shared FFmpeg instance (one per worker context). */
let _ffmpeg: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (_ffmpeg && _ffmpeg.loaded) return _ffmpeg;

  _ffmpeg = new FFmpeg();

  // Load ffmpeg core from CDN; in production you'd serve these from your own
  // origin or a bundled asset URL.
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  await _ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return _ffmpeg;
}

/**
 * Convert an ImageData frame to a PNG Uint8Array for ffmpeg input.
 * Uses OffscreenCanvas when available (worker context), falls back to a
 * regular HTMLCanvasElement in main-thread context.
 */
async function imageDataToPng(frame: ImageData): Promise<Uint8Array> {
  // Worker context → OffscreenCanvas
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(frame.width, frame.height);
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
    ctx.putImageData(frame, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    const buf = await blob.arrayBuffer();
    return new Uint8Array(buf);
  }

  // Main-thread fallback
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(frame, 0, 0);

  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("toBlob failed"));
      blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
    }, "image/png");
  });
}

/**
 * Write all frames as PNG files to the ffmpeg virtual filesystem.
 * Returns the printf-style pattern used to reference them (e.g. "frame%04d.png").
 */
async function writeFrames(ffmpeg: FFmpeg, frames: ImageData[]): Promise<string> {
  const digits = String(frames.length).length;
  const pattern = `frame%0${digits}d.png`;

  await Promise.all(
    frames.map(async (frame, i) => {
      const png = await imageDataToPng(frame);
      const name = `frame${String(i).padStart(digits, "0")}.png`;
      await ffmpeg.writeFile(name, png);
    }),
  );

  return pattern;
}

/** Read a file from the ffmpeg virtual filesystem and return it as a Blob. */
async function readOutputBlob(ffmpeg: FFmpeg, filename: string, mimeType: string): Promise<Blob> {
  const data = await ffmpeg.readFile(filename);
  const rawBytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
  // Copy into a plain ArrayBuffer (rawBytes.buffer may be SharedArrayBuffer)
  const safeBuffer = new ArrayBuffer(rawBytes.byteLength);
  new Uint8Array(safeBuffer).set(rawBytes);
  return new Blob([safeBuffer], { type: mimeType });
}

/** Delete all frame files from the virtual filesystem after encoding. */
async function cleanupFrames(ffmpeg: FFmpeg, count: number): Promise<void> {
  const digits = String(count).length;
  await Promise.all(
    Array.from({ length: count }, (_, i) => {
      const name = `frame${String(i).padStart(digits, "0")}.png`;
      return ffmpeg.deleteFile(name).catch(() => {
        /* ignore */
      });
    }),
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encode frames to an H.264/MP4 blob.
 *
 * @param frames   Array of ImageData frames in display order.
 * @param fps      Frames per second.
 * @param options  Optional encoding parameters.
 */
export async function exportToMp4(
  frames: ImageData[],
  fps: number,
  options: Mp4Options = {},
): Promise<Blob> {
  const { crf = 23, pixFmt = "yuv420p", codec = "libx264" } = options;

  const ffmpeg = await getFFmpeg();
  const pattern = await writeFrames(ffmpeg, frames);
  const output = "output.mp4";

  await ffmpeg.exec([
    "-framerate",
    String(fps),
    "-i",
    pattern,
    "-c:v",
    codec,
    "-crf",
    String(crf),
    "-pix_fmt",
    pixFmt,
    "-movflags",
    "+faststart",
    output,
  ]);

  const blob = await readOutputBlob(ffmpeg, output, "video/mp4");
  await ffmpeg.deleteFile(output).catch(() => {
    /* ignore */
  });
  await cleanupFrames(ffmpeg, frames.length);

  return blob;
}

/**
 * Encode frames to an animated WebM (VP9) blob.
 */
export async function exportToWebM(frames: ImageData[], fps: number): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const pattern = await writeFrames(ffmpeg, frames);
  const output = "output.webm";

  await ffmpeg.exec([
    "-framerate",
    String(fps),
    "-i",
    pattern,
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "30",
    "-pix_fmt",
    "yuva420p",
    output,
  ]);

  const blob = await readOutputBlob(ffmpeg, output, "video/webm");
  await ffmpeg.deleteFile(output).catch(() => {
    /* ignore */
  });
  await cleanupFrames(ffmpeg, frames.length);

  return blob;
}

/**
 * Encode frames to an animated GIF blob using ffmpeg's palette generation
 * pass for higher colour fidelity.
 */
export async function exportToGif(frames: ImageData[], fps: number): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const pattern = await writeFrames(ffmpeg, frames);
  const palette = "palette.png";
  const output = "output.gif";
  const fpsStr = String(fps);

  // Pass 1: generate optimal palette
  await ffmpeg.exec([
    "-framerate",
    fpsStr,
    "-i",
    pattern,
    "-vf",
    `fps=${fpsStr},scale=flags=lanczos,palettegen`,
    palette,
  ]);

  // Pass 2: encode GIF using the palette
  await ffmpeg.exec([
    "-framerate",
    fpsStr,
    "-i",
    pattern,
    "-i",
    palette,
    "-lavfi",
    `fps=${fpsStr},scale=flags=lanczos[x];[x][1:v]paletteuse`,
    output,
  ]);

  const blob = await readOutputBlob(ffmpeg, output, "image/gif");

  await ffmpeg.deleteFile(palette).catch(() => {
    /* ignore */
  });
  await ffmpeg.deleteFile(output).catch(() => {
    /* ignore */
  });
  await cleanupFrames(ffmpeg, frames.length);

  return blob;
}

// Export fetchFile re-export for convenience in tests / scripts
export { fetchFile };
