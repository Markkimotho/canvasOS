import type { AIProvider, GenerateOptions, InpaintOptions, GenerateResult } from "./types.js";

/**
 * LocalProvider — calls the CanvasOS AI Gateway (services/ai-gateway)
 * running on localhost. Falls back gracefully when unavailable.
 */
export class LocalProvider implements AIProvider {
  readonly id = "local";
  readonly name = "Local (Stable Diffusion)";

  private baseUrl: string;

  constructor(baseUrl = "http://localhost:8001") {
    this.baseUrl = baseUrl;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const res = await fetch(`${this.baseUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: options.prompt,
        negative_prompt: options.negativePrompt ?? "",
        width: options.width ?? 512,
        height: options.height ?? 512,
        n: options.n ?? 1,
        seed: options.seed,
      }),
    });

    if (!res.ok) throw new Error(`Local AI error: ${res.status}`);

    const data = (await res.json()) as { images: { b64: string }[] };
    const images = data.images.map(({ b64 }) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      return new Blob([bytes], { type: "image/png" });
    });

    return { images, seeds: [], model: "stable-diffusion-local", provider: this.id };
  }

  async inpaint(options: InpaintOptions): Promise<GenerateResult> {
    const toB64 = async (blob: Blob) => {
      const buf = await blob.arrayBuffer();
      return btoa(String.fromCharCode(...new Uint8Array(buf)));
    };

    const res = await fetch(`${this.baseUrl}/inpaint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: options.prompt,
        negative_prompt: options.negativePrompt ?? "",
        image_b64: await toB64(options.image),
        mask_b64: await toB64(options.mask),
        width: options.width ?? 512,
        height: options.height ?? 512,
        seed: options.seed,
      }),
    });

    if (!res.ok) throw new Error(`Local inpaint error: ${res.status}`);

    const data = (await res.json()) as { images: { b64: string }[] };
    const images = data.images.map(({ b64 }) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      return new Blob([bytes], { type: "image/png" });
    });

    return { images, seeds: [], model: "sd-inpaint-local", provider: this.id };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}
