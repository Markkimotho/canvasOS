import type { GenerateOptions } from "../providers/types.js";

export interface PromptHistoryEntry {
  id: string;
  prompt: string;
  negativePrompt?: string | undefined;
  provider: string;
  model: string;
  width: number;
  height: number;
  seed?: number | undefined;
  thumbnailUrls: string[];
  timestamp: number;
}

const MAX_ENTRIES = 200;
const STORAGE_KEY = "canvasos:promptHistory";

export class PromptHistory {
  private entries: PromptHistoryEntry[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.entries = JSON.parse(raw) as PromptHistoryEntry[];
    } catch {
      this.entries = [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // Quota exceeded — prune oldest
      this.entries = this.entries.slice(-100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    }
  }

  add(
    options: GenerateOptions,
    provider: string,
    model: string,
    imageBlobs: Blob[],
  ): PromptHistoryEntry {
    // Revoke old thumbnails if re-adding for same prompt
    const thumbnailUrls = imageBlobs.slice(0, 4).map((b) => URL.createObjectURL(b));
    const entry: PromptHistoryEntry = {
      id: crypto.randomUUID(),
      prompt: options.prompt,
      negativePrompt: options.negativePrompt,
      provider,
      model,
      width: options.width ?? 1024,
      height: options.height ?? 1024,
      seed: options.seed,
      thumbnailUrls,
      timestamp: Date.now(),
    };

    this.entries.unshift(entry);
    if (this.entries.length > MAX_ENTRIES) {
      const removed = this.entries.splice(MAX_ENTRIES);
      // Revoke object URLs to avoid memory leaks
      for (const e of removed) {
        for (const url of e.thumbnailUrls) URL.revokeObjectURL(url);
      }
    }

    this.save();
    return entry;
  }

  getAll(): PromptHistoryEntry[] {
    return this.entries;
  }

  clear(): void {
    for (const e of this.entries) {
      for (const url of e.thumbnailUrls) URL.revokeObjectURL(url);
    }
    this.entries = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}
