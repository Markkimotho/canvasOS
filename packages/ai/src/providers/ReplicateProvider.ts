import type { AIProvider, GenerateOptions, GenerateResult } from "./types.js";
import { KeyStorage } from "../security/KeyStorage.js";

export class ReplicateProvider implements AIProvider {
  readonly id = "replicate";
  readonly name = "Replicate (FLUX)";

  private readonly MODEL = "black-forest-labs/flux-1.1-pro";

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const apiKey = await KeyStorage.get("replicate");
    if (!apiKey) throw new Error("Replicate API key not configured");

    const res = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          input: {
            prompt: options.prompt,
            negative_prompt: options.negativePrompt,
            width: options.width ?? 1024,
            height: options.height ?? 1024,
            seed: options.seed,
            num_outputs: Math.min(options.n ?? 1, 4),
          },
        }),
      },
    );

    if (!res.ok) throw new Error(`Replicate error: ${res.status}`);

    const prediction = (await res.json()) as {
      status: string;
      output?: string[];
      id: string;
    };

    // Poll if not done
    const output = await this.pollUntilDone(prediction.id, apiKey);
    const images = await Promise.all(
      output.map(async (url) => {
        const r = await fetch(url);
        return r.blob();
      }),
    );

    return {
      images,
      seeds: images.map(() => Math.floor(Math.random() * 2 ** 32)),
      model: this.MODEL,
      provider: this.id,
    };
  }

  private async pollUntilDone(id: string, apiKey: string): Promise<string[]> {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const prediction = (await res.json()) as { status: string; output?: string[] };
      if (prediction.status === "succeeded") return prediction.output ?? [];
      if (prediction.status === "failed") throw new Error("Replicate generation failed");
    }
    throw new Error("Replicate timed out");
  }

  async isAvailable(): Promise<boolean> {
    return !!(await KeyStorage.get("replicate"));
  }
}
