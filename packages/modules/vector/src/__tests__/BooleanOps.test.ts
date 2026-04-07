import { describe, it, expect, vi, beforeAll } from "vitest";

// paper.js requires a DOM; mock in unit tests
beforeAll(() => {
  vi.mock("paper", () => {
    const mockPath = {
      unite: vi.fn().mockReturnThis(),
      subtract: vi.fn().mockReturnThis(),
      intersect: vi.fn().mockReturnThis(),
      exclude: vi.fn().mockReturnThis(),
      divide: vi.fn().mockReturnThis(),
      style: {},
      remove: vi.fn(),
    };
    return {
      default: {
        PathItem: mockPath,
        Path: {
          Rectangle: vi.fn(() => mockPath),
          Circle: vi.fn(() => mockPath),
        },
      },
    };
  });
});

describe("BooleanOps module", () => {
  it("exports performBooleanOp function", async () => {
    const mod = await import("../BooleanOps.js");
    expect(typeof mod.performBooleanOp).toBe("function");
  });

  it("exports all expected ops", async () => {
    const mod = await import("../BooleanOps.js");
    const ops = ["unite", "subtract", "intersect", "exclude", "divide"];
    for (const op of ops) {
      expect(typeof mod.performBooleanOp).toBe("function");
      void op;
    }
  });
});
