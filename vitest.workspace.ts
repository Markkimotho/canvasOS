import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/core/vitest.config.ts",
  "packages/modules/paint/vitest.config.ts",
  "packages/modules/vector/vitest.config.ts",
  "packages/modules/animate/vitest.config.ts",
  "packages/ai/vitest.config.ts",
]);
