import type { AIProvider, GenerateOptions, GenerateResult } from "./types.js";
import { KeyStorage } from "../security/KeyStorage.js";

export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  readonly name = "OpenAI (DALL·E 3)";

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const apiKey = await KeyStorage.get("openai");
    if (!apiKey) throw new Error("OpenAI API key not configured");

    const size = this.resolveSize(options.width ?? 1024, options.height ?? 1024);
    const n = Math.min(options.n ?? 1, 1); // DALL·E 3 supports n=1 only; loop for variants

    const results: Blob[] = [];
    const seeds: number[] = [];

    for (let i = 0; i < (options.n ?? 1); i++) {
      const body = {
        model: "dall-e-3",
        prompt: options.prompt,
        n,
        size,
        response_format: "b64_json",
        quality: "standard",
      };

      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(`OpenAI error: ${(err as { error: { message: string } }).error.message}`);
      }

      const data = (await res.json()) as {
        data: { b64_json: string; revised_prompt?: string }[];
      };
      for (const item of data.data) {
        const bytes = Uint8Array.from(atob(item.b64_json), (c) => c.charCodeAt(0));
        results.push(new Blob([bytes], { type: "image/png" }));
        seeds.push(Math.floor(Math.random() * 2 ** 32));
      }
    }

    return { images: results, seeds, model: "dall-e-3", provider: this.id };
  }

  async isAvailable(): Promise<boolean> {
    const key = await KeyStorage.get("openai");
    return !!key;
  }

  private resolveSize(w: number, h: number): string {
    const aspect = w / h;
    if (aspect < 0.7) return "1024x1792";
    if (aspect > 1.4) return "1792x1024";
    return "1024x1024";
  }
}
