import type {
  AIProvider,
  GenerateOptions,
  InpaintOptions,
  GenerateResult,
} from "./providers/types.js";
import { OpenAIProvider } from "./providers/OpenAIProvider.js";
import { StabilityProvider } from "./providers/StabilityProvider.js";
import { ReplicateProvider } from "./providers/ReplicateProvider.js";
import { LocalProvider } from "./providers/LocalProvider.js";

export type ProviderId = "openai" | "stability" | "replicate" | "local";

/**
 * ArtGenClient — provider-agnostic AI image generation client.
 * Selects the active provider and delegates to it.
 */
export class ArtGenClient {
  private providers: Map<ProviderId, AIProvider> = new Map<ProviderId, AIProvider>([
    ["openai", new OpenAIProvider() as AIProvider],
    ["stability", new StabilityProvider() as AIProvider],
    ["replicate", new ReplicateProvider() as AIProvider],
    ["local", new LocalProvider() as AIProvider],
  ]);

  private activeProviderId: ProviderId = "openai";

  setProvider(id: ProviderId): void {
    if (!this.providers.has(id)) throw new Error(`Unknown provider: ${id}`);
    this.activeProviderId = id;
  }

  getActiveProvider(): AIProvider {
    return this.providers.get(this.activeProviderId)!;
  }

  getAllProviders(): AIProvider[] {
    return [...this.providers.values()];
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const provider = this.getActiveProvider();
    const available = await provider.isAvailable();
    if (!available) {
      throw new Error(`Provider "${provider.name}" is not available. Check your API key settings.`);
    }
    return provider.generate(options);
  }

  async inpaint(options: InpaintOptions): Promise<GenerateResult> {
    const provider = this.getActiveProvider();
    if (!provider.inpaint) {
      throw new Error(`Provider "${provider.name}" does not support inpainting`);
    }
    return provider.inpaint(options);
  }

  /** Auto-select best available provider */
  async selectBestProvider(): Promise<ProviderId> {
    const order: ProviderId[] = ["local", "openai", "stability", "replicate"];
    for (const id of order) {
      const p = this.providers.get(id)!;
      if (await p.isAvailable()) {
        this.activeProviderId = id;
        return id;
      }
    }
    throw new Error("No AI provider configured. Please add an API key in Settings.");
  }
}
