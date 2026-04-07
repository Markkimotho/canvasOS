import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtGenClient } from "../ArtGenClient.js";

// Mock KeyStorage so no IDB is needed in tests
vi.mock("../security/KeyStorage.js", () => ({
  KeyStorage: {
    get: vi.fn().mockResolvedValue("test-api-key"),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    hasKey: vi.fn().mockResolvedValue(true),
  },
}));

// Mock fetch for provider calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("ArtGenClient", () => {
  let client: ArtGenClient;

  beforeEach(() => {
    client = new ArtGenClient();
    mockFetch.mockReset();
  });

  it("defaults to openai provider", () => {
    expect(client.getActiveProvider().id).toBe("openai");
  });

  it("switches provider", () => {
    client.setProvider("stability");
    expect(client.getActiveProvider().id).toBe("stability");
  });

  it("throws on unknown provider", () => {
    expect(() => client.setProvider("unknown" as never)).toThrow();
  });

  it("lists all providers", () => {
    const providers = client.getAllProviders();
    expect(providers.map((p) => p.id)).toContain("openai");
    expect(providers.map((p) => p.id)).toContain("stability");
    expect(providers.map((p) => p.id)).toContain("replicate");
    expect(providers.map((p) => p.id)).toContain("local");
  });

  it("throws if provider unavailable during generate", async () => {
    // Mock KeyStorage to return null (no key)
    const { KeyStorage } = await import("../security/KeyStorage.js");
    vi.mocked(KeyStorage.get).mockResolvedValueOnce(null);

    await expect(client.generate({ prompt: "test" })).rejects.toThrow("not available");
  });
});
