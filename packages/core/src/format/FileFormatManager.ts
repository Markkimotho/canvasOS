import JSZip from "jszip";
import type { CanvasProject } from "../types/index.js";

/**
 * .cvos file format (JSZip):
 *  manifest.json       — format version, app version
 *  canvas.json         — full project state (layers, metadata, etc.)
 *  timeline.json       — animation timeline state
 *  assets/layers/      — per-layer PNG data (LZ4-compressed in production)
 *  assets/media/       — imported audio/video files
 *  assets/3d/          — 3D mesh assets
 *  code/               — code art scripts
 *  preview.png         — 512x512 thumbnail
 */
export class FileFormatManager {
  static readonly MIME_TYPE = "application/octet-stream";
  static readonly EXTENSION = ".cvos";
  static readonly FORMAT_VERSION = "1.0.0";

  /** Save a project to a .cvos Blob */
  static async save(project: CanvasProject): Promise<Blob> {
    const zip = new JSZip();

    // manifest
    zip.file(
      "manifest.json",
      JSON.stringify({
        formatVersion: FileFormatManager.FORMAT_VERSION,
        appVersion: "1.0.0",
        created: project.metadata.created,
        modified: new Date().toISOString(),
      }),
    );

    // canvas state (without binary layer data)
    const canvasJson = structuredClone(project);
    zip.file("canvas.json", JSON.stringify(canvasJson, null, 2));

    // timeline placeholder
    zip.file("timeline.json", JSON.stringify({ fps: 24, duration: 0, animations: [] }));

    // directory stubs
    zip.folder("assets/layers");
    zip.folder("assets/media");
    zip.folder("assets/3d");
    zip.folder("code");

    return zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
      mimeType: FileFormatManager.MIME_TYPE,
    });
  }

  /** Load a .cvos Blob and return the project */
  static async load(blob: Blob | File): Promise<CanvasProject> {
    const zip = await JSZip.loadAsync(blob);

    const manifestFile = zip.file("manifest.json");
    if (!manifestFile) throw new Error("Invalid .cvos file: missing manifest.json");

    const canvasFile = zip.file("canvas.json");
    if (!canvasFile) throw new Error("Invalid .cvos file: missing canvas.json");

    const canvasText = await canvasFile.async("text");
    const project = JSON.parse(canvasText) as CanvasProject;

    // Restore binary layer data
    const layersFolder = zip.folder("assets/layers");
    if (layersFolder) {
      const layerFiles: { name: string; promise: Promise<Uint8Array> }[] = [];
      layersFolder.forEach((relPath, file) => {
        layerFiles.push({ name: relPath, promise: file.async("uint8array") });
      });
      for (const { name, promise } of layerFiles) {
        const data = await promise;
        const layerId = name.replace(".png", "");
        const layer = project.layers.find((l) => l.id === layerId);
        if (layer) {
          layer.data = { ...layer.data, pixelData: data };
        }
      }
    }

    return project;
  }

  /** Save a layer's pixel data into the zip as compressed PNG */
  static async saveLayerPixels(zip: JSZip, layerId: string, imageData: ImageData): Promise<void> {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(imageData, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    const arrayBuffer = await blob.arrayBuffer();
    zip.file(`assets/layers/${layerId}.png`, arrayBuffer);
  }
}
