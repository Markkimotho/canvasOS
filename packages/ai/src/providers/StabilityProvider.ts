import type { AIProvider, GenerateOptions, InpaintOptions, GenerateResult } from "./types.js";
import { KeyStorage } from "../security/KeyStorage.js";

export class StabilityProvider implements AIProvider {
  readonly id = "stability";
  readonly name = "Stability AI (SD3)";

  private readonly BASE = "https://api.stability.ai/v2beta";

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const apiKey = await KeyStorage.get("stability");
    if (!apiKey) throw new Error("Stability AI key not configured");

    const form = new FormData();
    form.append("prompt", options.prompt);
    if (options.negativePrompt) form.append("negative_prompt", options.negativePrompt);
    if (options.seed !== undefined) form.append("seed", String(options.seed));
    form.append("output_format", "png");

    const res = await fetch(`${this.BASE}/stable-image/generate/sd3`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "image/*" },
      body: form,
    });

    if (!res.ok) throw new Error(`Stability error: ${res.status} ${res.statusText}`);

    const blob = await res.blob();
    return {
      images: [blob],
      seeds: [options.seed ?? Math.floor(Math.random() * 2 ** 32)],
      model: "sd3",
      provider: this.id,
    };
  }

  async inpaint(options: InpaintOptions): Promise<GenerateResult> {
    const apiKey = await KeyStorage.get("stability");
    if (!apiKey) throw new Error("Stability AI key not configured");

    const form = new FormData();
    form.append("prompt", options.prompt);
    form.append("image", options.image, "image.png");
    form.append("mask", options.mask, "mask.png");
    if (options.negativePrompt) form.append("negative_prompt", options.negativePrompt);
    form.append("output_format", "png");

    const res = await fetch(`${this.BASE}/stable-image/edit/inpaint`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "image/*" },
      body: form,
    });

    if (!res.ok) throw new Error(`Stability inpaint error: ${res.status}`);

    const blob = await res.blob();
    return { images: [blob], seeds: [], model: "sd3-inpaint", provider: this.id };
  }

  async isAvailable(): Promise<boolean> {
    return !!(await KeyStorage.get("stability"));
  }
}
